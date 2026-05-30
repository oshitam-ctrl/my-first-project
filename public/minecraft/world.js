// Voxel world: chunk storage, procedural terrain, culled+AO mesher,
// DDA raycasting, and a persistent player-edit overlay.
import * as THREE from 'three';
import { Noise, hash2 } from './noise.js';
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
    const continent = this.noise.fbm2(wx * 0.0055, wz * 0.0055, 4);
    const hills = this.noise.fbm2(wx * 0.021, wz * 0.021, 4);
    let h = SEA_LEVEL + 5 + continent * 17 + hills * 6;
    return Math.max(1, Math.min(HEIGHT - 6, Math.floor(h)));
  }

  biomeAt(wx, wz) {
    return this.biomeNoise.fbm2(wx * 0.004, wz * 0.004, 3); // ~[-1,1]
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
        const biome = this.biomeAt(wx, wz);
        const beach = h <= SEA_LEVEL + 1;
        const snowy = biome > 0.35 && h > SEA_LEVEL + 12;

        for (let y = 0; y <= Math.max(h, SEA_LEVEL); y++) {
          let id = AIR;
          if (y === 0) {
            id = BEDROCK;
          } else if (y < h - 4) {
            id = STONE;
          } else if (y < h) {
            id = beach ? SAND : DIRT;
          } else if (y === h) {
            id = beach ? SAND : snowy ? SNOW : GRASS;
          } else if (y <= SEA_LEVEL) {
            id = WATER;
          }

          // cave carving (don't carve the surface skin, bedrock, or underwater seal)
          if (id === STONE || id === DIRT) {
            const cv = this.caveNoise.noise3(wx * 0.07, y * 0.09, wz * 0.07);
            if (cv > 0.45 && y > 2 && y < h - 1) id = AIR;
          }
          if (id !== AIR) data[idx(lx, y, lz)] = id;
        }
      }
    }

    // Trees: stamp from any origin whose canopy can reach this chunk.
    for (let lz = -3; lz < CHUNK + 3; lz++) {
      for (let lx = -3; lx < CHUNK + 3; lx++) {
        const wx = ox + lx;
        const wz = oz + lz;
        if (hash2(wx, wz, this.seed) >= 0.018) continue;
        const h = this.heightAt(wx, wz);
        const biome = this.biomeAt(wx, wz);
        if (h <= SEA_LEVEL + 1) continue; // no trees on beach/water
        if (biome > 0.35 && h > SEA_LEVEL + 12) continue; // skip snowy peaks
        const th = 4 + (Math.floor(hash2(wx, wz, this.seed ^ 99) * 3));
        const topY = h + th;
        // canopy
        for (let dy = -2; dy <= 1; dy++) {
          const ly = topY + dy;
          const r = dy >= 0 ? 1 : 2;
          for (let dz = -r; dz <= r; dz++) {
            for (let dx = -r; dx <= r; dx++) {
              if (dx === 0 && dz === 0 && dy < 1) continue;
              if (Math.abs(dx) === r && Math.abs(dz) === r && (dy < 0)) continue;
              this._stamp(data, lx + dx, ly, lz + dz, LEAVES, false);
            }
          }
        }
        // trunk
        for (let t = 1; t <= th; t++) this._stamp(data, lx, h + t, lz, WOOD, true);
      }
    }

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
            this._emitFace(g, wx, y, wz, dir, tile, occ);
          }
        }
      }
    }
    return groups;
  }

  _emitFace(g, x, y, z, dir, tile, occ) {
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
      const b = dir.shade * AO_BRIGHT[v.ao];
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
