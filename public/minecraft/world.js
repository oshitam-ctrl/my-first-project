// Voxel world: chunk storage, procedural terrain, culled+AO mesher,
// DDA raycasting, and a persistent player-edit overlay.
import * as THREE from './vendor/three.module.js';
import { Noise, hash2 } from './noise.js';
import { buildPetitHermes, LANDMARK } from './landmark.js';

// Block-id palette handed to the landmark builder.
const LB = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4, OAK_LOG: 5, OAK_LEAVES: 6, OAK_PLANKS: 9,
  COBBLE: 10, GLASS: 12, BRICK: 13, BIRCH_LOG: 23, SPRUCE_LOG: 25, SPRUCE_PLANKS: 51,
  BIRCH_PLANKS: 52, DRY_GRASS: 27, SANDSTONE: 39, SMOOTH_STONE: 41, CALCITE: 46,
  WHITE_WOOL: 31, BLUE_WOOL: 33, GREEN_WOOL: 35, BLACK_WOOL: 36, GRAVEL: 37, HAY: 50, STONE_BRICKS: 29,
  WATER: 7, WHEAT_CROP: 53, VEG_CROP: 54,
};
// Fixed world placement of the Petit Hermès landmark (centred in front of spawn).
const LM_X = -12, LM_Y = 29, LM_Z = -36;
import { BLOCKS, isOpaque, isSolid, tileUV } from './blocks.js';

export const CHUNK = 16;
export const HEIGHT = 64;
export const SEA_LEVEL = 23;

const AREA = CHUNK * CHUNK;
const VOL = AREA * HEIGHT;
const idx = (x, y, z) => x + z * CHUNK + y * AREA;

// Block ids
const AIR = 0, GRASS = 1, DIRT = 2, STONE = 3, SAND = 4, WOOD = 5,
  LEAVES = 6, WATER = 7, BEDROCK = 8, SNOW = 11;
const COAL_ORE = 15, IRON_ORE = 16, GOLD_ORE = 17, DIAMOND_ORE = 18, REDSTONE_ORE = 19;
const BIRCH_LOG = 23, BIRCH_LEAVES = 24, SPRUCE_LOG = 25, SPRUCE_LEAVES = 26, DRY_GRASS = 27, CACTUS = 28;

// Deterministic per-voxel hash in [0,1) for ore placement.
function oreRoll(wx, y, wz, seed) {
  let h = Math.imul(wx | 0, 0x1f1f1f1f) ^ Math.imul(y | 0, 0x85ebca6b) ^
    Math.imul(wz | 0, 0xc2b2ae35) ^ Math.imul(seed | 0, 0x27d4eb2f);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

// Only true see-through blocks go in the alpha-blended pass. Leaves render
// in the opaque pass (solid look) but still don't cull neighbour faces.
const TRANSPARENT_GROUP = new Set([WATER, 12 /*glass*/]);

const dirs = [
  { d: [0, 1, 0], shade: 1.0, face: 0 },
  { d: [0, -1, 0], shade: 0.5, face: 1 },
  { d: [1, 0, 0], shade: 0.62, face: 2 },
  { d: [-1, 0, 0], shade: 0.62, face: 2 },
  { d: [0, 0, 1], shade: 0.8, face: 2 },
  { d: [0, 0, -1], shade: 0.8, face: 2 },
];
const AO_BRIGHT = [0.5, 0.7, 0.86, 1.0];

export class World {
  constructor(seed = 20260530) {
    this.seed = seed >>> 0;
    this.noise = new Noise(this.seed);
    this.caveNoise = new Noise(this.seed ^ 0x9e3779b9);
    this.biomeNoise = new Noise(this.seed ^ 0x1234567);
    this.chunks = new Map(); // "cx,cz" -> { data, cx, cz }
    this.edits = new Map(); // "wx,wy,wz" -> id
    this.loadEdits();
  }

  key(cx, cz) {
    return cx + ',' + cz;
  }

  // --- terrain -----------------------------------------------------------
  heightAt(wx, wz) {
    // Continentalness picks broad land vs ocean regions (big, contiguous), so
    // land sits clearly above sea level instead of flooding into scattered isles.
    const cont = this.noise.fbm2(wx * 0.0034, wz * 0.0034, 4);          // [-1,1] continents
    const hills = this.noise.fbm2(wx * 0.014 + 40, wz * 0.014 + 40, 3);
    const mtn = this.noise.fbm2(wx * 0.0055 + 90, wz * 0.0055 + 90, 3); // mountain mask
    let h;
    if (cont < -0.25) {
      // ocean basin: deeper the more negative (down to ~sea-22)
      h = SEA_LEVEL - 2 + (cont + 0.25) * 26;
    } else {
      // land: base safely above water, rising inland, plus hills
      h = SEA_LEVEL + 4 + (cont + 0.25) * 11 + hills * 5;
      if (mtn > 0.22) h += (mtn - 0.22) * 105; // mountains rise sharply (more frequent + taller)
    }
    return Math.max(1, Math.min(HEIGHT - 3, Math.floor(h)));
  }

  // climate -> [temperature, humidity] in [0,1] (contrast-stretched for variety)
  climate(wx, wz) {
    const cl = (v) => Math.max(0, Math.min(1, (v * 1.5 + 1) * 0.5));
    const t = cl(this.biomeNoise.fbm2(wx * 0.0028 + 11, wz * 0.0028 + 11, 3));
    const m = cl(this.biomeNoise.fbm2(wx * 0.0032 + 71, wz * 0.0032 + 71, 3));
    return [t, m];
  }

  // biome id from climate + elevation
  biomeAt(wx, wz, h) {
    if (h == null) h = this.heightAt(wx, wz);
    if (h >= SEA_LEVEL + 22) return 'mountain';
    const [t, m] = this.climate(wx, wz);
    if (t < 0.32) return 'snowy';
    if (t > 0.64 && m < 0.42) return 'desert';
    if (t > 0.54 && m < 0.50) return 'savanna';
    if (m > 0.55) return 'forest';
    return 'plains';
  }

  ensureData(cx, cz) {
    const k = this.key(cx, cz);
    let c = this.chunks.get(k);
    if (c) return c;
    c = { data: new Uint8Array(VOL), cx, cz };
    this.generate(c);
    this.chunks.set(k, c);
    return c;
  }

  generate(c) {
    const data = c.data;
    const ox = c.cx * CHUNK;
    const oz = c.cz * CHUNK;

    for (let lz = 0; lz < CHUNK; lz++) {
      for (let lx = 0; lx < CHUNK; lx++) {
        const wx = ox + lx;
        const wz = oz + lz;
        const h = this.heightAt(wx, wz);
        const biome = this.biomeAt(wx, wz, h);
        const beach = h <= SEA_LEVEL + 1;
        // surface (top) + subsurface (sub) blocks vary by biome
        let top, sub;
        if (beach || biome === 'desert') { top = SAND; sub = SAND; }
        else if (biome === 'snowy') { top = SNOW; sub = DIRT; }
        else if (biome === 'mountain') {
          top = h >= SEA_LEVEL + 34 ? SNOW : h >= SEA_LEVEL + 30 ? STONE : GRASS;
          sub = top === GRASS ? DIRT : STONE;
        } else if (biome === 'savanna') { top = DRY_GRASS; sub = DIRT; }
        else { top = GRASS; sub = DIRT; } // plains / forest

        for (let y = 0; y <= Math.max(h, SEA_LEVEL); y++) {
          let id = AIR;
          if (y === 0) {
            id = BEDROCK;
          } else if (y < h - 4) {
            id = STONE;
          } else if (y < h) {
            id = sub;
          } else if (y === h) {
            id = top;
          } else if (y <= SEA_LEVEL) {
            id = WATER;
          }

          // cave carving (don't carve the surface skin, bedrock, or underwater seal)
          if (id === STONE || id === DIRT) {
            const cv = this.caveNoise.noise3(wx * 0.07, y * 0.09, wz * 0.07);
            if (cv > 0.45 && y > 2 && y < h - 1) id = AIR;
          }
          // ore generation inside stone (rarer + deeper-gated for valuables)
          if (id === STONE) {
            const r = oreRoll(wx, y, wz, this.seed);
            if (y <= 12 && r < 0.006) id = DIAMOND_ORE;
            else if (y <= 14 && r < 0.012) id = REDSTONE_ORE;
            else if (y <= 18 && r < 0.020) id = GOLD_ORE;
            else if (y <= 40 && r < 0.045) id = IRON_ORE;
            else if (r < 0.075) id = COAL_ORE;
          }
          if (id !== AIR) data[idx(lx, y, lz)] = id;
        }
      }
    }

    // Trees: density, height and shape vary by biome.
    for (let lz = -3; lz < CHUNK + 3; lz++) {
      for (let lx = -3; lx < CHUNK + 3; lx++) {
        const wx = ox + lx;
        const wz = oz + lz;
        const h = this.heightAt(wx, wz);
        if (h <= SEA_LEVEL + 1) continue; // none on beach/water
        const biome = this.biomeAt(wx, wz, h);
        let density = 0, baseH = 5;
        if (biome === 'forest') density = 0.045;
        else if (biome === 'plains') density = 0.008;
        else if (biome === 'savanna') density = 0.005;
        else if (biome === 'snowy') { density = 0.025; baseH = 6; } // taller conifers
        else if (biome === 'mountain') density = 0.004;
        // desert: no trees
        if (density === 0 || hash2(wx, wz, this.seed) >= density) continue;
        const conifer = biome === 'snowy';
        // species by biome: spruce in snowy, birch ~half of forest, oak otherwise
        let log = WOOD, leaf = LEAVES;
        if (conifer) { log = SPRUCE_LOG; leaf = SPRUCE_LEAVES; }
        else if (biome === 'forest' && hash2(wx, wz, this.seed ^ 7) < 0.45) { log = BIRCH_LOG; leaf = BIRCH_LEAVES; }
        const th = baseH + Math.floor(hash2(wx, wz, this.seed ^ 99) * 3);
        const topY = h + th;
        // canopy
        for (let dy = -2; dy <= 1; dy++) {
          const ly = topY + dy;
          const r = conifer ? (dy >= 0 ? 1 : dy === -1 ? 1 : 2) : (dy >= 0 ? 1 : 2);
          for (let dz = -r; dz <= r; dz++) {
            for (let dx = -r; dx <= r; dx++) {
              if (dx === 0 && dz === 0 && dy < 1) continue;
              if (Math.abs(dx) === r && Math.abs(dz) === r && (dy < 0)) continue;
              this._stamp(data, lx + dx, ly, lz + dz, leaf, false);
            }
          }
        }
        // trunk
        for (let t = 1; t <= th; t++) this._stamp(data, lx, h + t, lz, log, true);
      }
    }

    // Cacti in deserts (1-3 tall, within-chunk columns)
    for (let lz = 0; lz < CHUNK; lz++) {
      for (let lx = 0; lx < CHUNK; lx++) {
        const wx = ox + lx, wz = oz + lz;
        const hh = this.heightAt(wx, wz);
        if (hh <= SEA_LEVEL + 1 || this.biomeAt(wx, wz, hh) !== 'desert') continue;
        if (hash2(wx, wz, this.seed ^ 555) >= 0.010) continue;
        const ch = 1 + Math.floor(hash2(wx, wz, this.seed ^ 556) * 3);
        for (let t = 1; t <= ch; t++) this._stamp(data, lx, hh + t, lz, CACTUS, true);
      }
    }

    // Villages: clusters of small huts on flat grassy ground (deterministic per region)
    const R = 80;
    for (let rx = Math.floor((ox - 8) / R); rx <= Math.floor((ox + CHUNK + 8) / R); rx++) {
      for (let rz = Math.floor((oz - 8) / R); rz <= Math.floor((oz + CHUNK + 8) / R); rz++) {
        if (hash2(rx, rz, this.seed ^ 0xabcdef) >= 0.38) continue; // no village in this region
        const ax = rx * R + 18 + Math.floor(hash2(rx, rz, this.seed ^ 1) * (R - 36));
        const az = rz * R + 18 + Math.floor(hash2(rx, rz, this.seed ^ 2) * (R - 36));
        const nHuts = 2 + Math.floor(hash2(rx, rz, this.seed ^ 3) * 4); // 2-5
        for (let hi = 0; hi < nHuts; hi++) {
          const hx = ax + Math.round((hash2(rx * 7 + hi, rz, this.seed ^ 4) - 0.5) * 30);
          const hz = az + Math.round((hash2(rx, rz * 7 + hi, this.seed ^ 5) - 0.5) * 30);
          this._stampHut(data, ox, oz, hx, hz);
        }
      }
    }

    // Petit Hermès landmark (school + bakery), if it overlaps this chunk
    this._stampLandmark(data, ox, oz);

    // apply persisted edits within this chunk
    for (const [k, id] of this.edits) {
      const [ex, ey, ez] = k.split(',').map(Number);
      if (ex >= ox && ex < ox + CHUNK && ez >= oz && ez < oz + CHUNK && ey >= 0 && ey < HEIGHT) {
        data[idx(ex - ox, ey, ez - oz)] = id;
      }
    }
  }

  _stamp(data, lx, y, lz, id, force) {
    if (lx < 0 || lx >= CHUNK || lz < 0 || lz >= CHUNK || y < 0 || y >= HEIGHT) return;
    const i = idx(lx, y, lz);
    if (!force && data[i] !== AIR) return;
    data[i] = id;
  }

  // Stamp the Petit Hermès landmark into this chunk (only the overlapping part).
  _stampLandmark(data, ox, oz) {
    const x0 = LM_X, x1 = LM_X + LANDMARK.w, z0 = LM_Z, z1 = LM_Z + LANDMARK.d;
    if (ox + CHUNK <= x0 || ox >= x1 || oz + CHUNK <= z0 || oz >= z1) return; // no overlap
    const stamp = (x, y, z, id) => this._stamp(data, LM_X + x - ox, LM_Y + y, LM_Z + z - oz, id, true);
    buildPetitHermes(stamp, LB);
  }

  // A small 5x5 hut at world (hx,hz): cobble floor, plank walls, glass windows,
  // a doorway, plank roof. Stamps only cells that fall inside this chunk.
  _stampHut(data, ox, oz, hx, hz) {
    const PLANK = 9, COBBLE = 10, GLASS = 12;
    const g = this.heightAt(hx, hz);
    if (g <= SEA_LEVEL + 1) return; // not on water/beach
    const biome = this.biomeAt(hx, hz, g);
    if (biome === 'desert' || biome === 'mountain' || biome === 'snowy') return;
    // require flattish ground so huts don't float or bury
    if (Math.abs(this.heightAt(hx - 2, hz) - g) > 2 || Math.abs(this.heightAt(hx + 2, hz) - g) > 2 ||
        Math.abs(this.heightAt(hx, hz - 2) - g) > 2 || Math.abs(this.heightAt(hx, hz + 2) - g) > 2) return;
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        const lx = hx + dx - ox, lz = hz + dz - oz;
        this._stamp(data, lx, g, lz, COBBLE, true); // floor
        const edge = Math.abs(dx) === 2 || Math.abs(dz) === 2;
        for (let wy = 1; wy <= 3; wy++) {
          if (!edge) { this._stamp(data, lx, g + wy, lz, AIR, true); continue; } // clear interior
          const isDoor = dz === 2 && dx === 0 && wy <= 2;
          if (isDoor) { this._stamp(data, lx, g + wy, lz, AIR, true); continue; } // doorway
          const isWindow = wy === 2 && ((Math.abs(dx) === 2 && dz === 0) || (Math.abs(dz) === 2 && dx === 0));
          this._stamp(data, lx, g + wy, lz, isWindow ? GLASS : PLANK, true);
        }
        this._stamp(data, lx, g + 4, lz, PLANK, true); // roof
      }
    }
  }

  // --- block access ------------------------------------------------------
  getBlock(wx, wy, wz) {
    if (wy < 0 || wy >= HEIGHT) return AIR;
    const cx = Math.floor(wx / CHUNK);
    const cz = Math.floor(wz / CHUNK);
    const c = this.ensureData(cx, cz);
    return c.data[idx(wx - cx * CHUNK, wy, wz - cz * CHUNK)];
  }

  setBlock(wx, wy, wz, id) {
    if (wy < 1 || wy >= HEIGHT) return; // protect bedrock floor / world top
    const cx = Math.floor(wx / CHUNK);
    const cz = Math.floor(wz / CHUNK);
    const c = this.ensureData(cx, cz);
    c.data[idx(wx - cx * CHUNK, wy, wz - cz * CHUNK)] = id;
    this.edits.set(wx + ',' + wy + ',' + wz, id);
    this.saveEditsThrottled();
  }

  isSolidAt(wx, wy, wz) {
    return isSolid(this.getBlock(wx, wy, wz));
  }

  // --- mesher ------------------------------------------------------------
  buildGeometry(cx, cz) {
    const c = this.ensureData(cx, cz);
    const data = c.data;
    const ox = cx * CHUNK;
    const oz = cz * CHUNK;

    const groups = {
      opaque: { pos: [], norm: [], uv: [], col: [] },
      trans: { pos: [], norm: [], uv: [], col: [] },
    };

    const occ = (x, y, z) => (isOpaque(this.getBlock(x, y, z)) ? 1 : 0);

    // sky-exposure heightmap: highest opaque block per column. A face that opens
    // into an air cell with no opaque block above it is sky-lit; otherwise it's
    // inside a cave/overhang and gets darkened. (Cheap fake lighting.)
    const CAVE_DARK = 0.34;
    const skyH = new Int16Array(CHUNK * CHUNK).fill(-1);
    for (let lz = 0; lz < CHUNK; lz++) {
      for (let lx = 0; lx < CHUNK; lx++) {
        for (let y = HEIGHT - 1; y >= 0; y--) {
          if (isOpaque(data[idx(lx, y, lz)])) { skyH[lx + lz * CHUNK] = y; break; }
        }
      }
    }
    const litMul = (nlx, ny, nlz) => {
      const lx2 = nlx < 0 ? 0 : nlx >= CHUNK ? CHUNK - 1 : nlx; // clamp at chunk border
      const lz2 = nlz < 0 ? 0 : nlz >= CHUNK ? CHUNK - 1 : nlz;
      return ny > skyH[lx2 + lz2 * CHUNK] ? 1 : CAVE_DARK;
    };

    for (let y = 0; y < HEIGHT; y++) {
      for (let lz = 0; lz < CHUNK; lz++) {
        for (let lx = 0; lx < CHUNK; lx++) {
          const id = data[idx(lx, y, lz)];
          if (id === AIR) continue;
          const wx = ox + lx;
          const wz = oz + lz;
          const def = BLOCKS[id];
          if (!def) continue;
          const g = TRANSPARENT_GROUP.has(id) ? groups.trans : groups.opaque;

          for (const dir of dirs) {
            const [dx, dy, dz] = dir.d;
            const nId = this.getBlock(wx + dx, y + dy, wz + dz);
            if (isOpaque(nId) || nId === id) continue; // face hidden

            const tile = def.faces[dir.face];
            this._emitFace(g, wx, y, wz, dir, tile, occ, litMul(lx + dx, y + dy, lz + dz));
          }
        }
      }
    }
    return groups;
  }

  _emitFace(g, x, y, z, dir, tile, occ, lightMul = 1) {
    const [nx, ny, nz] = dir.d;
    // choose axis layout
    let uAxis, vAxis, nAxis, ncoord;
    if (nx !== 0) { nAxis = 0; uAxis = 2; vAxis = 1; ncoord = nx > 0 ? 1 : 0; }
    else if (ny !== 0) { nAxis = 1; uAxis = 0; vAxis = 2; ncoord = ny > 0 ? 1 : 0; }
    else { nAxis = 2; uAxis = 0; vAxis = 1; ncoord = nz > 0 ? 1 : 0; }

    const { texture } = this;
    const uvrect = tileUV(tile, this.atlasCols, this.atlasRows);

    const corners = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const verts = [];
    const aoVals = [];
    for (const [uu, vv] of corners) {
      const p = [0, 0, 0];
      p[nAxis] = ncoord;
      p[uAxis] = uu;
      p[vAxis] = vv;
      const vx = x + p[0], vy = y + p[1], vz = z + p[2];

      // AO neighbours on the outer layer
      const tu = uu ? 1 : -1;
      const tv = vv ? 1 : -1;
      const base = [x, y, z];
      base[nAxis] += nx + ny + nz; // move to neighbour layer (only one is nonzero)
      const s1 = base.slice(); s1[uAxis] += tu;
      const s2 = base.slice(); s2[vAxis] += tv;
      const cc = base.slice(); cc[uAxis] += tu; cc[vAxis] += tv;
      const so1 = occ(s1[0], s1[1], s1[2]);
      const so2 = occ(s2[0], s2[1], s2[2]);
      const soc = occ(cc[0], cc[1], cc[2]);
      const ao = so1 && so2 ? 0 : 3 - (so1 + so2 + soc);

      const uvc = [uu ? uvrect.u1 : uvrect.u0, vv ? uvrect.v1 : uvrect.v0];
      verts.push({ p: [vx, vy, vz], uv: uvc, ao });
      aoVals.push(ao);
    }

    // triangulation flip to keep AO gradient symmetric
    const flip = aoVals[0] + aoVals[2] < aoVals[1] + aoVals[3];
    const order = flip ? [1, 2, 3, 1, 3, 0].map((i) => verts[i]) : [0, 1, 2, 0, 2, 3].map((i) => verts[i]);

    for (const v of order) {
      g.pos.push(v.p[0], v.p[1], v.p[2]);
      g.norm.push(nx, ny, nz);
      g.uv.push(v.uv[0], v.uv[1]);
      const b = dir.shade * AO_BRIGHT[v.ao] * lightMul;
      g.col.push(b, b, b);
    }
  }

  makeMesh(group) {
    if (group.pos.length === 0) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(group.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(group.norm, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(group.uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(group.col, 3));
    return geo;
  }

  // --- DDA voxel raycast (Amanatides & Woo) ------------------------------
  raycast(origin, dir, maxDist = 8) {
    let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z);
    const stepX = Math.sign(dir.x), stepY = Math.sign(dir.y), stepZ = Math.sign(dir.z);
    const inv = (a) => (a === 0 ? Infinity : 1 / Math.abs(a));
    const tDeltaX = inv(dir.x), tDeltaY = inv(dir.y), tDeltaZ = inv(dir.z);
    const distTo = (i, s, o) => (s > 0 ? i + 1 - o : o - i);
    let tMaxX = tDeltaX * distTo(x, stepX, origin.x);
    let tMaxY = tDeltaY * distTo(y, stepY, origin.y);
    let tMaxZ = tDeltaZ * distTo(z, stepZ, origin.z);
    let nx = 0, ny = 0, nz = 0;
    let t = 0;
    while (t <= maxDist) {
      const id = this.getBlock(x, y, z);
      if (id !== AIR && id !== WATER) {
        return { block: [x, y, z], normal: [nx, ny, nz], place: [x + nx, y + ny, z + nz] };
      }
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        x += stepX; t = tMaxX; tMaxX += tDeltaX; nx = -stepX; ny = 0; nz = 0;
      } else if (tMaxY < tMaxZ) {
        y += stepY; t = tMaxY; tMaxY += tDeltaY; nx = 0; ny = -stepY; nz = 0;
      } else {
        z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; nx = 0; ny = 0; nz = -stepZ;
      }
    }
    return null;
  }

  // --- edit persistence --------------------------------------------------
  loadEdits() {
    try {
      const raw = localStorage.getItem('mc_edits_' + this.seed);
      if (raw) {
        const obj = JSON.parse(raw);
        for (const k in obj) this.edits.set(k, obj[k]);
      }
    } catch (e) {}
  }
  saveEdits() {
    try {
      const obj = {};
      for (const [k, v] of this.edits) obj[k] = v;
      localStorage.setItem('mc_edits_' + this.seed, JSON.stringify(obj));
    } catch (e) {}
  }
  saveEditsThrottled() {
    clearTimeout(this._saveT);
    this._saveT = setTimeout(() => this.saveEdits(), 800);
  }
  resetWorld() {
    this.edits.clear();
    try { localStorage.removeItem('mc_edits_' + this.seed); } catch (e) {}
  }
}
