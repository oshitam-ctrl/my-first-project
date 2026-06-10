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
  WATER: 7, WHEAT_CROP: 53, VEG_CROP: 54, FURNACE: 21, CRAFTING_TABLE: 20, PLANK: 9, PUMPKIN: 14,
  LANTERN: 55,
  BREAD: 56,   // artisan bread block — golden loaf for bakery display/shelves
  REGISTER: 57, // レジ — cash register, bakery counter equipment
  SCALE: 58,    // はかり — kitchen scale, bakery counter equipment
  JAR: 59,      // 保存瓶 — glass canister/jar for the counter top
  BAGUETTE: 60, // バゲット display loaf
  CAMPAGNE: 61, // カンパーニュ (看板) display boule
  PASTRY: 62,   // クロワッサン display pastry
  OPEN_SIGN: 65, // 営業中 OPEN sign
  SHOP_SIGN: 63, // 店名サイン shop-name sign
  AFRAME: 64,    // A型黒板 sidewalk chalkboard
  BOOKSHELF: 49, // 本棚 — community plaza library shelf
  // ── S1 schoolhouse / brand foundation blocks ──────────────────────────────
  SHOE_CUBBY: 66,    // 下駄箱 (entrance shoe cubbies)
  GREEN_BOARD: 67,   // 緑黒板 + チョーク受け
  SCHOOL_FLOOR: 68,  // 明るい教室木床
  PLASTER: 69,       // 白壁 (暖白 #F5EDE4)
  SASH_WINDOW: 70,   // 窓枠付きガラス (transparent)
  GYM_FLOOR: 71,     // 体育館床 + コートライン
  SCHOOL_CLOCK: 72,  // 校舎時計
  SCHOOL_EMBLEM: 73, // 校章
  NOTICE_BOARD: 74,  // 掲示板
  SINK_UNIT: 75,     // 廊下手洗い場
  VAULT_BOX: 76,     // 跳び箱
  SAKURA_LEAVES: 77, // 桜 (cutout foliage)
  CEDAR_LOG: 78,     // 杉の幹
  CEDAR_LEAVES: 79,  // 杉葉 (cutout foliage)
  VENDING: 80,       // 自販機 (light:8)
  RICE: 81,          // 稲 (non-solid crop)
  TIN_ROOF: 82,      // トタン屋根
  KAWARA: 83,        // 瓦
  PAIN_DE_MIE: 84,   // 食パン display
  TARTINE: 85,       // タルティーヌ display
  SOUP_POT: 86,      // スープ鍋
  CURRY_POT: 87,     // カレー鍋
  QUICHE: 88,        // キッシュ display
  COOKIE_TRAY: 89,   // 焼き菓子トレー
  SLAT_SHELF: 90,    // 木スラット陳列棚
  BASKET_BREAD: 91,  // パンかご
  PRICE_CARD: 92,    // 値札カード
  COFFEE_KIT: 93,    // コーヒー器具
  MENU_STAND: 94,    // メニュースタンド
  STAINLESS: 95,     // 給食室調理台
  SCHOOL_DESK: 96,   // 学校机 (町産木材)
  SCHOOL_CHAIR: 97,  // 学校椅子
  FLAG: 98,          // 国旗
  GUARD_RAIL: 99,    // ガードレール
  BRAND_GREEN: 100,  // ブランド深緑 #5C6B4A
  WHEAT_BEIGE: 101,  // 麦色 #E8D5B7
  COMPOST: 102,      // ぐるぐるコンポスト
  YEAST_SHELF: 103,  // 酵母瓶棚
  ISSHOU_PAN: 104,   // 一升パン (風呂敷包み)
};
// Fixed world placement of the Petit Hermès landmark (centred in front of spawn).
// Chosen so the entrance is at world x=8 and the facade plane at world z=-24
// (player spawns at (8.5,31,-12) facing -z into it); the large school then grows
// wider in x and deeper toward -z. Local coords are >=0, so the facade sits at the
// MAX local z (=26) and LM_Z is pushed back to -50 to give depth room.
const LM_X = -36, LM_Y = 29, LM_Z = -50;
import { BLOCKS, isOpaque, isSolid, tileUV, blockLightEmit } from './blocks.js';

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
const LANTERN = 55; // glowing lantern block (blockLight 14)
// Satoyama valley block aliases (palette ids from LB)
const SMOOTH_STONE = 41, CALCITE = 46, WHITE_WOOL = 31, BLUE_WOOL = 33, GREEN_WOOL = 35, GRAVEL = 37, HAY = 50;
const WHEAT_CROP = 53, VEG_CROP = 54, BRICK = 13, COBBLE = 10, GLASS = 12;
const SANDSTONE = 39, STONE_BRICKS = 29, SPRUCE_PLANKS = 51, BIRCH_PLANKS = 52;
// S4 周辺v2 block aliases (palette ids from LB)
const CEDAR_LOG = 78, CEDAR_LEAVES = 79, RICE = 81, TIN_ROOF = 82, KAWARA = 83;
const GUARD_RAIL = 99, VENDING = 80, NOTICE_BOARD = 74, SAKURA_LEAVES = 77;

// ─── 里山バレー constants ────────────────────────────────────────────────────
// Valley centre, floor height, radii (world coords)
const VCX = 8, VCZ = -12;          // valley centre (near school)
const VFLOOR = 29;                  // valley floor y (matches landmark ground y=29)
const VRAD_FLAT = 82;               // inner radius — fully flat farmland
const VRAD_BLEND = 110;             // outer radius — blends back to natural terrain
// Exclusion box — landmark owns this; we skip all scenery features here.
// Must fully contain the (now much larger) school + yard: building world
// x −32..47, z −48..−24, plus the front yard out to ~z+18 and the field.
const EX0 = -40, EX1 = 56, EZ0 = -54, EZ1 = 18;

// Country road: runs roughly north–south, WEST of the (wider) building whose
// west edge is now world x=-32 — so push the road further out to x=-52.
const ROAD_X = -52;                 // road centre world-x
const ROAD_Z0 = -120;               // road south end
const ROAD_Z1 = 60;                 // road north end
// School drive: short east–west connector from road to school front gate
const DRIVE_Z = 24;                 // z of drive centre (just south of exclusion box)
const DRIVE_X0 = ROAD_X + 3;       // drive west end (road shoulder)
const DRIVE_X1 = EX0 - 1;          // drive east end (up to exclusion box)

// Gate pillars: flank the school drive where it meets the yard
const GATE_X = EX0 - 1;            // world x of pillar pair (−41)
const GATE_Z = DRIVE_Z;            // z centre of drive

// Sunflower strip: south face of the yard, just outside exclusion box (z > EZ1)
const SUN_Z = EZ1 + 2;             // z = 20 — front of sunflower strip
const SUN_X0 = EX0 + 4;            // x = -36
const SUN_X1 = EX1 - 4;            // x = 52

// Paddy cell sizes (paddy content + levee)
const PADDY_CELL = 9;              // grid repeat (8 paddy + 1 levee)

// ── 出原川 (Dehara river) constants ──────────────────────────────────────────
// Meanders N-S through the valley between road and school.
// Centre x = RIVER_CX + amplitude * sin(wz * freq)
const RIVER_CX = -18;              // river mean x
const RIVER_AMP = 4;               // meander amplitude (blocks)
const RIVER_FREQ = 0.055;          // meander frequency (radians per z-block)
const RIVER_HALF = 1;              // half-width: covers cx-1, cx, cx+1 (3 cells)
const RIVER_Z0 = -120;             // river south end
const RIVER_Z1 = 80;               // river north end

// Bridge at DRIVE_Z crossing
const BRIDGE_Z_MIN = DRIVE_Z - 2;
const BRIDGE_Z_MAX = DRIVE_Z + 2;

// ── 南方八幡神社 (Minamikata Hachiman Shrine) constants ──────────────────────
const SHRINE_X = 64;               // shrine centre world-x (east valley rim)
const SHRINE_Z = -30;              // shrine centre world-z

// ── 南方総合センター (Community Center) constants ─────────────────────────────
const CC_X = -44;                  // community center centre x
const CC_Z = -70;                  // community center centre z (north of exclusion)

// ── バス停 (Bus Stop) constants ───────────────────────────────────────────────
const BUS_X = ROAD_X + 4;         // east shoulder of road
const BUS_Z = DRIVE_Z - 8;        // just north of drive turnoff

// Helper: is a world column inside the landmark exclusion box?
function inExclusionBox(wx, wz) {
  return wx >= EX0 && wx <= EX1 && wz >= EZ0 && wz <= EZ1;
}

// Helper: river centre x at a given z (meandering)
function riverCentreX(wz) {
  return Math.round(RIVER_CX + RIVER_AMP * Math.sin(wz * RIVER_FREQ));
}

// Helper: is a column inside the river zone? Returns 'water', 'bank', or null
function riverZone(wx, wz) {
  if (wz < RIVER_Z0 || wz > RIVER_Z1) return null;
  const cx = riverCentreX(wz);
  const d = wx - cx;
  if (Math.abs(d) <= RIVER_HALF) return 'water';
  if (Math.abs(d) <= RIVER_HALF + 1) return 'bank';
  return null;
}

// Helper: valley blend factor 0=outside valley 1=fully flat inside
function valleyFactor(wx, wz) {
  const dx = wx - VCX, dz = wz - VCZ;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist <= VRAD_FLAT) return 1.0;
  if (dist >= VRAD_BLEND) return 0.0;
  const t = (dist - VRAD_FLAT) / (VRAD_BLEND - VRAD_FLAT);
  return 1.0 - t * t * (3 - 2 * t); // smoothstep
}

// Helper: is a column on the main road (returns 'road', 'shoulder', or null)
function roadZone(wx, wz) {
  if (wz < ROAD_Z0 || wz > ROAD_Z1) return null;
  const d = Math.abs(wx - ROAD_X);
  if (d <= 2) return 'road';
  if (d <= 3) return 'shoulder';
  return null;
}

// Helper: is a column on the school drive (east–west connector)
function driveZone(wx, wz) {
  if (wz < DRIVE_Z - 2 || wz > DRIVE_Z + 2) return null;
  if (wx < DRIVE_X0 || wx > DRIVE_X1) return null;
  const dz = Math.abs(wz - DRIVE_Z);
  if (dz <= 1) return 'road';
  return 'shoulder';
}

// ── 小道 footpath network ──────────────────────────────────────────────────
// Narrow 1–2 wide gravel/dirt paths connecting:
//   P1: school drive (DRIVE_Z, DRIVE_X0..−42) → shrine approach (x=64, z=−30)
//   P2: school area → farmhouse NW (−65,−35)
//   P3: school area → farmhouse east (50,−50)
//   P4: riverside path (along the river, east bank) for N-S exploration
// Returns 'path' or null. Paths stay out of exclusion box, road, paddyWater, bridge.
function pathZone(wx, wz) {
  // -- P1: School-drive → Shrine diagonal path --
  // Goes from (DRIVE_X1, DRIVE_Z) = (EX0-1, 24) toward (SHRINE_X, SHRINE_Z) = (64, -30)
  // Broken into two legs: east (x: -41→64, z=24→-30) then we route as a straight diagonal.
  // We trace the "dominant-axis" line (Bresenham-like: check if point is within ±1 of the line).
  {
    const x0 = EX0 - 1, z0 = DRIVE_Z;  // -41, 24
    const x1 = SHRINE_X - 2, z1 = SHRINE_Z + 14; // 62, -16 (approach steps)
    const dx = x1 - x0, dz = z1 - z0;  // 103, -40
    const len = Math.sqrt(dx * dx + dz * dz);
    // parametric t of nearest point on segment
    const t = Math.max(0, Math.min(1, ((wx - x0) * dx + (wz - z0) * dz) / (dx * dx + dz * dz)));
    const px = x0 + t * dx, pz = z0 + t * dz;
    const dist = Math.sqrt((wx - px) ** 2 + (wz - pz) ** 2);
    if (dist <= 0.9 && t > 0.01 && t < 0.99) {
      if (!inExclusionBox(wx, wz)) return 'path';
    }
  }
  // -- P2: School → NW farmhouse (−65, −35) --
  {
    const x0 = EX0 - 2, z0 = -38;  // west school edge mid-north
    const x1 = -60, z1 = -35;
    const dx = x1 - x0, dz = z1 - z0;
    const t = Math.max(0, Math.min(1, ((wx - x0) * dx + (wz - z0) * dz) / (dx * dx + dz * dz)));
    const px = x0 + t * dx, pz = z0 + t * dz;
    const dist = Math.sqrt((wx - px) ** 2 + (wz - pz) ** 2);
    if (dist <= 0.9 && t > 0.05 && t < 0.95) {
      if (!inExclusionBox(wx, wz)) return 'path';
    }
  }
  // -- P3: Drive entrance → east farmhouse (50, −50) --
  {
    const x0 = EX0 - 1, z0 = -48;  // school north-east approach
    const x1 = 48, z1 = -50;
    const dx = x1 - x0, dz = z1 - z0;
    const t = Math.max(0, Math.min(1, ((wx - x0) * dx + (wz - z0) * dz) / (dx * dx + dz * dz)));
    const px = x0 + t * dx, pz = z0 + t * dz;
    const dist = Math.sqrt((wx - px) ** 2 + (wz - pz) ** 2);
    if (dist <= 0.9 && t > 0.02 && t < 0.98) {
      if (!inExclusionBox(wx, wz)) return 'path';
    }
  }
  // -- P4: Riverside path (east bank of river, z: -80 to 50) --
  {
    const cx = riverCentreX(wz);
    const eastBank = cx + RIVER_HALF + 2; // one block east of bank
    if (wz >= -80 && wz <= 50 && wx === eastBank) {
      // skip bridge zone + road zone
      if (Math.abs(wz - DRIVE_Z) > 4 && !roadZone(wx, wz) && !inExclusionBox(wx, wz)) return 'path';
    }
  }
  return null;
}

// Helper: paddy patchwork surface for flat valley columns outside exclusion +road
// Returns 'water','levee','crop','field', or null (outside paddy zone)
function paddyZone(wx, wz) {
  // vary cell size slightly by region (two zones)
  const zone = (Math.floor(wx / 40) + Math.floor(wz / 40)) & 1;
  const cell = zone ? PADDY_CELL : PADDY_CELL + 2; // alternates 9 and 11
  const px = ((wx % cell) + cell) % cell;
  const pz = ((wz % cell) + cell) % cell;
  if (px === 0 || pz === 0) return 'levee';   // 1-wide levee (畦)
  // paddy type: hash to decide water / field / vegcrop variety
  const cellX = Math.floor(wx / cell);
  const cellZ = Math.floor(wz / cell);
  const r = hash2(cellX, cellZ, 0x54321);
  if (r < 0.70) return 'water';   // 70% rice paddies
  if (r < 0.88) return 'field';   // 18% dry grass field
  return 'crop';                   // 12% vegetable / mixed crop
}

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

// Block-id routing for render groups:
//   TRANSPARENT_GROUP  – alpha-blended pass (glass only now; water split out)
//   WATER_BLOCK        – dedicated water group with animated scrolling texture
//   LEAF_GROUP         – alpha-cutout foliage pass (DoubleSide, alphaTest)
const TRANSPARENT_GROUP = new Set([12 /*glass*/, 70 /*sash_window*/]);
const WATER_BLOCK = WATER; // id 7
const LEAF_GROUP = new Set([LEAVES, 24 /*birch_leaves*/, 26 /*spruce_leaves*/, 77 /*sakura_leaves*/, 79 /*cedar_leaves*/]);

const dirs = [
  { d: [0, 1, 0], shade: 1.0, face: 0 },
  { d: [0, -1, 0], shade: 0.5, face: 1 },
  { d: [1, 0, 0], shade: 0.62, face: 2 },
  { d: [-1, 0, 0], shade: 0.62, face: 2 },
  { d: [0, 0, 1], shade: 0.8, face: 2 },
  { d: [0, 0, -1], shade: 0.8, face: 2 },
];
const AO_BRIGHT = [0.5, 0.7, 0.86, 1.0];

// ── Lighting constants ───────────────────────────────────────────────────────
// CAVE_DARK: minimum skylight factor in fully enclosed spaces (0..1).
const CAVE_DARK = 0.08;
// SKYLIGHT_FALLOFF: how many blocks of soft falloff below the first opaque block.
const SKYLIGHT_FALLOFF = 4;
// MAX_BLOCK_LIGHT: maximum blocklight level (like Minecraft's 15).
const MAX_BLOCK_LIGHT = 15;

// ── Petit Hermès landmark stamp cache ───────────────────────────────────────
// The landmark is STATIC (its geometry is seed-independent), but it overlaps
// ~30 chunks at the new size and `buildPetitHermes` is expensive. So build it
// ONCE into per-chunk buckets of world-space cells, then each chunk just replays
// its bucket with force-stamps (preserving the original last-write-wins + AIR
// carving semantics) instead of re-running the whole builder every time.
let _lmBuckets = null; // Map<"cx,cz", number[]> flat groups of [wx, wy, wz, id]
function buildLandmarkCache() {
  const cells = new Map(); // "wx,wy,wz" -> id (last write wins, mirrors force=true)
  const stamp = (x, y, z, id) => {
    cells.set((LM_X + x) + ',' + (LM_Y + y) + ',' + (LM_Z + z), id);
  };
  buildPetitHermes(stamp, LB);
  const buckets = new Map();
  for (const [k, id] of cells) {
    const c = k.split(',');
    const wx = +c[0], wy = +c[1], wz = +c[2];
    const ck = Math.floor(wx / CHUNK) + ',' + Math.floor(wz / CHUNK);
    let arr = buckets.get(ck);
    if (!arr) { arr = []; buckets.set(ck, arr); }
    arr.push(wx, wy, wz, id);
  }
  return buckets;
}

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
    const rawH = Math.max(1, Math.min(HEIGHT - 3, Math.floor(h)));
    // ── 里山バレー flattening ──────────────────────────────────────────────
    // Blend the surface smoothly toward VFLOOR (y=29) inside the valley radius.
    const vf = valleyFactor(wx, wz);
    if (vf > 0) {
      // Boost hills slightly at the valley rim (VRAD_FLAT..VRAD_BLEND) so the
      // valley feels encircled by forested 里山 hillsides.
      const dx = wx - VCX, dz = wz - VCZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      let hTarget = VFLOOR;
      if (dist > VRAD_FLAT) {
        // rim boost: add up to +12 extra height at the blend boundary
        const rim = (dist - VRAD_FLAT) / (VRAD_BLEND - VRAD_FLAT);
        hTarget = VFLOOR + rim * 12;
      }
      return Math.max(1, Math.min(HEIGHT - 3, Math.round(rawH * (1 - vf) + hTarget * vf)));
    }
    return rawH;
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

        // ── 里山バレー surface features (per-column, in-valley only) ────────
        // Only apply inside the flat valley region; skip the landmark exclusion box.
        const vf = valleyFactor(wx, wz);
        if (vf < 0.95) continue;         // only fully-flat columns
        if (inExclusionBox(wx, wz)) continue; // landmark owns this area

        // ── 出原川 river (per-column, before road so bank tops can still exist) ──
        const rv = riverZone(wx, wz);
        // Bridge deck at DRIVE_Z crossing: plank surface over the river
        const isBridge = wz >= BRIDGE_Z_MIN && wz <= BRIDGE_Z_MAX && rv !== null;
        if (rv === 'water' && !isBridge) {
          // Carve 2 below VFLOOR and fill with water
          data[idx(lx, VFLOOR - 2, lz)] = DIRT;      // channel bed
          // S4: 飛び石 — COBBLE stepping stones flush with the water surface,
          // every other cell (checkered) across the river. Spec asked for
          // z −44..−40, but the river there falls INSIDE the landmark
          // exclusion box (river cx ≈ −21 ≥ EX0) and is never carved; use the
          // nearest stretch just north of the box instead (z −60..−56).
          const stone = wz >= -60 && wz <= -56 && ((wx + wz) & 1) === 0;
          data[idx(lx, VFLOOR - 1, lz)] = stone ? COBBLE : WATER; // shallow water / stone
          data[idx(lx, VFLOOR, lz)] = AIR;             // open surface (kept clear)
          data[idx(lx, VFLOOR + 1, lz)] = AIR;
          continue;
        }
        if (rv === 'bank' && !isBridge) {
          // Gently sloping DIRT/GRAVEL bank
          const bId = (hash2(wx, wz, 0x7e451) < 0.5) ? GRAVEL : DIRT;
          data[idx(lx, VFLOOR, lz)] = bId;
          data[idx(lx, VFLOOR + 1, lz)] = AIR;
          continue;
        }
        if (isBridge) {
          // Plank bridge deck at VFLOOR height, OAK_LOG rails on edges
          const isRail = wz === BRIDGE_Z_MIN || wz === BRIDGE_Z_MAX;
          data[idx(lx, VFLOOR - 1, lz)] = (rv === 'water') ? WATER : DIRT; // keep water below
          data[idx(lx, VFLOOR, lz)] = 9; // OAK_PLANKS
          data[idx(lx, VFLOOR + 1, lz)] = isRail ? WOOD : AIR; // log railing on edges
          if (isRail) data[idx(lx, VFLOOR + 2, lz)] = AIR;
          continue;
        }

        // Road (main + drive) take priority over paddy features
        const rz = roadZone(wx, wz);
        const dz2 = driveZone(wx, wz);
        const surf = rz || dz2;
        if (surf) {
          // Lay road surface at VFLOOR, clear one above
          data[idx(lx, VFLOOR, lz)] = (surf === 'road') ? SMOOTH_STONE : GRAVEL;
          data[idx(lx, VFLOOR + 1, lz)] = AIR;
          // Dashed white centre line: road centre only, every 3rd block in z
          if (surf === 'road' && wx === ROAD_X && (((wz % 6) + 6) % 6) < 3 && rz === 'road') {
            data[idx(lx, VFLOOR, lz)] = CALCITE;
          }
          // Drive centre line
          if (dz2 === 'road' && wz === DRIVE_Z && (((wx % 5) + 5) % 5) < 3) {
            data[idx(lx, VFLOOR, lz)] = CALCITE;
          }
          // S4: ガードレール — GUARD_RAIL posts on the east shoulder beside the
          // river-facing stretch (z −60..40), every 2nd cell; skip the drive
          // junction and the bus stop (±2 each).
          if (rz === 'shoulder' && wx === ROAD_X + 3 &&
              wz >= -60 && wz <= 40 && (wz & 1) === 0 &&
              Math.abs(wz - DRIVE_Z) > 2 && Math.abs(wz - BUS_Z) > 2) {
            data[idx(lx, VFLOOR + 1, lz)] = GUARD_RAIL;
          }
          continue;
        }

        // ── 小道 footpaths (narrow gravel/dirt connectors) ────────────────────
        const pth = pathZone(wx, wz);
        if (pth) {
          // Mix gravel and coarse dirt deterministically along paths
          const pathSurf = (hash2(wx, wz, 0xbeef1) < 0.65) ? GRAVEL : DIRT;
          data[idx(lx, VFLOOR, lz)] = pathSurf;
          data[idx(lx, VFLOOR + 1, lz)] = AIR;
          continue;
        }

        // Sunflower fence row: orange brick fence + HAY/GREEN_WOOL stalks
        // Strip at z=SUN_Z..SUN_Z+3, x=SUN_X0..SUN_X1, just south of the yard
        if (wz >= SUN_Z && wz <= SUN_Z + 3 && wx >= SUN_X0 && wx <= SUN_X1) {
          if (wz === SUN_Z) {
            // Front fence row: orange brick posts every 2nd block
            data[idx(lx, VFLOOR, lz)] = GRASS;
            data[idx(lx, VFLOOR + 1, lz)] = (((wx - SUN_X0) % 2) === 0) ? BRICK : AIR;
          } else {
            // Sunflower stalks (z=SUN_Z+1..+3): alternate green/hay columns
            data[idx(lx, VFLOOR, lz)] = DIRT;
            const stalkH = 2 + (((wx + wz) & 1)); // 2 or 3 tall
            for (let s = 1; s <= stalkH - 1; s++) data[idx(lx, VFLOOR + s, lz)] = GREEN_WOOL;
            data[idx(lx, VFLOOR + stalkH, lz)] = HAY; // flower head
          }
          continue;
        }

        // Rice paddy patchwork (outside road, river, sunflower strip, exclusion box)
        const pz = paddyZone(wx, wz);
        if (!pz) continue;
        if (pz === 'levee') {
          // Raised dirt levee (畦) at valley floor level
          data[idx(lx, VFLOOR, lz)] = DIRT;
          data[idx(lx, VFLOOR + 1, lz)] = AIR;
        } else if (pz === 'water') {
          // Paddy: sunken 1 below VFLOOR → water + wheat-crop sticking up
          data[idx(lx, VFLOOR - 1, lz)] = WATER;
          data[idx(lx, VFLOOR, lz)] = AIR;
          // Sparse rice blades (deterministic ~60%) — S4: real RICE block.
          // (The QUEST harvest plot keeps WHEAT_CROP — it lives in landmark.js
          // inside the exclusion box, which this paddy code never reaches.)
          if (hash2(wx, wz, 0xabcde) < 0.60) data[idx(lx, VFLOOR, lz)] = RICE;
        } else if (pz === 'field') {
          // Dry-grass field
          data[idx(lx, VFLOOR, lz)] = DRY_GRASS;
          data[idx(lx, VFLOOR + 1, lz)] = AIR;
        } else { // crop
          data[idx(lx, VFLOOR, lz)] = GRASS;
          data[idx(lx, VFLOOR + 1, lz)] = (hash2(wx, wz, 0xbcdef) < 0.5) ? VEG_CROP : AIR;
        }
      }
    }

    // Trees: density, height and shape vary by biome.
    // On the valley rim (VRAD_FLAT..VRAD_BLEND), boost spruce/oak density heavily
    // so the mountains read as wooded 里山 satoyama, not bare slopes.
    for (let lz = -3; lz < CHUNK + 3; lz++) {
      for (let lx = -3; lx < CHUNK + 3; lx++) {
        const wx = ox + lx;
        const wz = oz + lz;
        const h = this.heightAt(wx, wz);
        if (h <= SEA_LEVEL + 1) continue; // none on beach/water
        // No wild trees inside the flat valley (they'd poke through paddies).
        // Allow them on the hill rim (vf<0.8).
        const vf = valleyFactor(wx, wz);
        if (vf >= 0.8) continue;
        // Don't place trees inside the exclusion box
        if (inExclusionBox(wx, wz)) continue;
        const biome = this.biomeAt(wx, wz, h);
        // Calculate distance to valley centre for rim density boost
        const dx2 = wx - VCX, dz2 = wz - VCZ;
        const dist = Math.sqrt(dx2 * dx2 + dz2 * dz2);
        const onRim = dist >= VRAD_FLAT && dist <= VRAD_BLEND + 30; // rim + just beyond
        let density = 0, baseH = 5;
        // C6 – forests read as real forest: raised density so woodland columns fill in.
        if (biome === 'forest') density = onRim ? 0.28 : 0.18;        // dense canopy everywhere
        else if (biome === 'plains') density = onRim ? 0.14 : 0.012;  // scattered woodland
        else if (biome === 'savanna') density = 0.005;
        else if (biome === 'snowy') { density = onRim ? 0.18 : 0.06; baseH = 6; }
        else if (biome === 'mountain') density = onRim ? 0.14 : 0.012; // dense mountain forest
        // desert: no trees
        if (density === 0 || hash2(wx, wz, this.seed) >= density) continue;
        // S4: 杉の里山 — rim conifers become tall, narrow-crowned CEDAR (杉).
        const rimCedar = onRim && hash2(wx, wz, this.seed ^ 0xf1) < 0.5;
        const conifer = biome === 'snowy' || rimCedar;
        // species: cedar dominant on rim for the satoyama look, mixed lower
        let log = WOOD, leaf = LEAVES;
        if (rimCedar) { log = CEDAR_LOG; leaf = CEDAR_LEAVES; }
        else if (conifer) { log = SPRUCE_LOG; leaf = SPRUCE_LEAVES; }
        else if (biome === 'forest' && hash2(wx, wz, this.seed ^ 7) < 0.45) { log = BIRCH_LOG; leaf = BIRCH_LEAVES; }
        const th = rimCedar
          ? 8 + Math.floor(hash2(wx, wz, this.seed ^ 99) * 4)      // sugi: 8..11 tall
          : baseH + Math.floor(hash2(wx, wz, this.seed ^ 99) * 3);
        const topY = h + th;
        // canopy (cedar: one extra lower ring for a longer, narrow cone)
        for (let dy = rimCedar ? -3 : -2; dy <= 1; dy++) {
          const ly = topY + dy;
          const r = conifer ? (dy >= 0 ? 1 : dy <= -2 ? 2 : 1) : (dy >= 0 ? 1 : 2);
          for (let dz = -r; dz <= r; dz++) {
            for (let ddx = -r; ddx <= r; ddx++) {
              if (ddx === 0 && dz === 0 && dy < 1) continue;
              if (Math.abs(ddx) === r && Math.abs(dz) === r && (dy < 0)) continue;
              this._stamp(data, lx + ddx, ly, lz + dz, leaf, false);
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

    // ── 里山バレー multi-block features ────────────────────────────────────────
    // Power-line poles: every 14 blocks along the road (west side), 7 tall + cross-arm.
    // Iterate columns in a margin-extended window so straddled poles stamp fully.
    for (let lz = -2; lz < CHUNK + 2; lz++) {
      for (let lx = -2; lx < CHUNK + 2; lx++) {
        const wx = ox + lx, wz = oz + lz;
        // Pole positions: road shoulder (wx = ROAD_X - 4), every 14 z
        if (wx !== ROAD_X - 4) continue;
        if (wz < ROAD_Z0 || wz > ROAD_Z1) continue;
        if (((wz - ROAD_Z0) % 14) !== 0) continue;
        const py = VFLOOR;
        for (let t = 1; t <= 7; t++) this._stamp(data, lx, py + t, lz, SPRUCE_LOG, true);
        // Cross-arm (2 blocks each side at height 7)
        for (let arm = -2; arm <= 2; arm++) this._stamp(data, lx + arm, py + 7, lz, SPRUCE_LOG, true);
      }
    }

    // Gate pillars: pair of SMOOTH_STONE columns flanking the school drive entrance.
    // Pillars at (GATE_X, DRIVE_Z ± 2), height 3; small SPRUCE "pine" tree beside each.
    {
      const gx = GATE_X, gz = GATE_Z;
      for (const dz of [-2, 2]) {
        const lxp = gx - ox, lzp = gz + dz - oz;
        for (let t = 0; t <= 3; t++) this._stamp(data, lxp, VFLOOR + t, lzp, SMOOTH_STONE, true);
        // Tiny spruce tree (2 trunk + compact canopy) just west of each pillar
        const txl = lxp - 2;
        for (let t = 1; t <= 3; t++) this._stamp(data, txl, VFLOOR + t, lzp, SPRUCE_LOG, true);
        for (let dy = 0; dy <= 1; dy++) {
          const cr = dy === 0 ? 1 : 0;
          for (let ddz = -cr; ddz <= cr; ddz++) {
            for (let ddx = -cr; ddx <= cr; ddx++) {
              this._stamp(data, txl + ddx, VFLOOR + 3 + dy, lzp + ddz, SPRUCE_LEAVES, false);
            }
          }
        }
      }
    }

    // ── S4: ドライブ桜 — small sakura trees on the school-drive shoulders ────
    // Every 7 cells along the drive, both shoulders (z = DRIVE_Z ± 3).
    // 2-block trunk + r=1 SAKURA_LEAVES canopy. All positions sit at
    // x ≤ DRIVE_X1 (= EX0−1), i.e. strictly west of the exclusion box; the
    // inExclusionBox guard keeps that invariant even if constants shift.
    for (let tx = DRIVE_X0 + 1; tx <= DRIVE_X1; tx += 7) {
      for (const sdz of [-3, 3]) {
        const tz = DRIVE_Z + sdz;
        if (inExclusionBox(tx, tz)) continue;
        const lxp = tx - ox, lzp = tz - oz;
        this._stamp(data, lxp, VFLOOR + 1, lzp, WOOD, true);  // trunk (oak log)
        this._stamp(data, lxp, VFLOOR + 2, lzp, WOOD, true);
        for (let ddz = -1; ddz <= 1; ddz++) {
          for (let ddx = -1; ddx <= 1; ddx++) {
            this._stamp(data, lxp + ddx, VFLOOR + 3, lzp + ddz, SAKURA_LEAVES, false);
          }
        }
        this._stamp(data, lxp, VFLOOR + 4, lzp, SAKURA_LEAVES, false); // crown top
      }
    }

    // ── 出原川 bridge log support pillars (post-pass) ────────────────────────
    // Two SPRUCE_LOG vertical posts under the plank deck on each bank side.
    {
      const bridgeCX = riverCentreX(DRIVE_Z);
      for (const bx of [bridgeCX - 2, bridgeCX + 2]) {
        const lxp = bx - ox, lzp = DRIVE_Z - oz;
        for (let t = 0; t <= 2; t++) this._stamp(data, lxp, VFLOOR - 2 + t, lzp, SPRUCE_LOG, true);
      }
    }

    // ── 農家/民家 (farmhouses) ────────────────────────────────────────────────
    // 5 traditional houses scattered N & S of valley, set back from road.
    // Extended list replaces the old 3-house VALLEY_HOUSES.
    const VALLEY_HOUSES = [
      [-65, -35],  // NW, set back from road
      [-62,  50],  // SW, south of drive
      [ 50, -50],  // east side, north
      [ 55,  45],  // east side, south
      [-68, -80],  // far north, near community center approach
    ];
    for (const [hx, hz] of VALLEY_HOUSES) {
      if (!inExclusionBox(hx, hz) && valleyFactor(hx, hz) > 0.5) {
        this._stampFarmhouse(data, ox, oz, hx, hz);
      }
    }

    // ── 南方総合センター (community center) ───────────────────────────────────
    this._stampCommunityCenter(data, ox, oz);

    // ── バス停 (bus stop) ──────────────────────────────────────────────────────
    this._stampBusStop(data, ox, oz);

    // ── 南方八幡神社 (shrine) ─────────────────────────────────────────────────
    this._stampShrine(data, ox, oz);

    // ── 道標 signposts at path junctions ─────────────────────────────────────
    this._stampSignposts(data, ox, oz);

    // ── 隠し要素 / hidden discovery spots ────────────────────────────────────
    this._stampSecrets(data, ox, oz);

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
          // Don't stamp village huts in the 里山 valley — country houses are placed explicitly.
          if (valleyFactor(hx, hz) < 0.8) this._stampHut(data, ox, oz, hx, hz);
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

  // Stamp the Petit Hermès landmark into this chunk by replaying the cached
  // per-chunk bucket (built once, lazily). Only cells in this chunk are touched.
  _stampLandmark(data, ox, oz) {
    const x0 = LM_X, x1 = LM_X + LANDMARK.w, z0 = LM_Z, z1 = LM_Z + LANDMARK.d;
    if (ox + CHUNK <= x0 || ox >= x1 || oz + CHUNK <= z0 || oz >= z1) return; // no overlap
    if (!_lmBuckets) _lmBuckets = buildLandmarkCache();
    const arr = _lmBuckets.get((ox / CHUNK) + ',' + (oz / CHUNK));
    if (!arr) return;
    for (let i = 0; i < arr.length; i += 4) {
      this._stamp(data, arr[i] - ox, arr[i + 1], arr[i + 2] - oz, arr[i + 3], true);
    }
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

  // ── 農家/民家: traditional farmhouse with kitchen garden ──────────────────
  // SANDSTONE/PLANK walls, GLASS windows, BRICK gable roof, VEG_CROP garden.
  _stampFarmhouse(data, ox, oz, hx, hz) {
    const g = VFLOOR;
    // S4: per-house roof material — 60% トタン (tin) / 40% 瓦 (kawara),
    // chosen deterministically from the house anchor so all chunks agree.
    const roofId = hash2(hx, hz, 0x5407) < 0.6 ? TIN_ROOF : KAWARA;
    // Main building: 7×7 footprint (dx,dz in -3..3)
    for (let dz = -3; dz <= 3; dz++) {
      for (let dx = -3; dx <= 3; dx++) {
        const lx = hx + dx - ox, lz = hz + dz - oz;
        this._stamp(data, lx, g, lz, SMOOTH_STONE, true);
        const edge = Math.abs(dx) === 3 || Math.abs(dz) === 3;
        for (let wy = 1; wy <= 3; wy++) {
          if (!edge) { this._stamp(data, lx, g + wy, lz, AIR, true); continue; }
          const isDoor = dz === 3 && dx === 0 && wy <= 2;
          if (isDoor) { this._stamp(data, lx, g + wy, lz, AIR, true); continue; }
          const isWin = wy === 2 && ((Math.abs(dx) === 3 && dz === 0) || (Math.abs(dz) === 3 && dx === 0));
          this._stamp(data, lx, g + wy, lz, isWin ? GLASS : SANDSTONE, true);
        }
        this._stamp(data, lx, g + 4, lz, roofId, true); // gable roof layer 1
      }
    }
    // Peaked roof cap (+5) — centre ridge strip (same tin/kawara material)
    for (let dx = -2; dx <= 2; dx++) this._stamp(data, hx + dx - ox, g + 5, hz - oz, roofId, true);
    // Kitchen garden: 3 rows of VEG_CROP south of house
    for (let dz = 4; dz <= 6; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        const lx = hx + dx - ox, lz = hz + dz - oz;
        this._stamp(data, lx, g, lz, DIRT, true);
        this._stamp(data, lx, g + 1, lz, VEG_CROP, false);
      }
    }
    // One spruce tree beside the house (+5, -3)
    const txl = hx + 5 - ox, tzl = hz - 3 - oz;
    for (let t = 1; t <= 5; t++) this._stamp(data, txl, g + t, tzl, SPRUCE_LOG, true);
    for (let dy = -1; dy <= 1; dy++) {
      const cr = dy < 1 ? 2 : 1;
      for (let ddz = -cr; ddz <= cr; ddz++) {
        for (let ddx = -cr; ddx <= cr; ddx++) {
          if (Math.abs(ddx) === cr && Math.abs(ddz) === cr) continue;
          this._stamp(data, txl + ddx, g + 4 + dy, tzl + ddz, SPRUCE_LEAVES, false);
        }
      }
    }
  }

  // ── 南方総合センター: modest community center ─────────────────────────────
  // 1-storey civic building, flat roof with solar panels, gravel parking.
  _stampCommunityCenter(data, ox, oz) {
    const hx = CC_X, hz = CC_Z, g = VFLOOR;
    // Building footprint 10×8 (dx -5..4, dz -4..3)
    for (let dz = -4; dz <= 3; dz++) {
      for (let dx = -5; dx <= 4; dx++) {
        const lx = hx + dx - ox, lz = hz + dz - oz;
        // Foundation
        this._stamp(data, lx, g, lz, SMOOTH_STONE, true);
        const edge = Math.abs(dx) === 5 || dx === 4 || Math.abs(dz) === 4 || dz === 3;
        for (let wy = 1; wy <= 4; wy++) {
          if (!edge) { this._stamp(data, lx, g + wy, lz, AIR, true); continue; }
          const isDoor = dz === 3 && dx === 0 && wy <= 2;
          if (isDoor) { this._stamp(data, lx, g + wy, lz, AIR, true); continue; }
          const isWin = wy === 2 && ((dx === -5 || dx === 4) && dz === -1) ||
                        (wy === 2 && (dz === -4 || dz === 3) && Math.abs(dx) <= 2 && dx !== 0);
          this._stamp(data, lx, g + wy, lz, isWin ? GLASS : STONE_BRICKS, true);
        }
        // Flat concrete roof
        this._stamp(data, lx, g + 5, lz, SMOOTH_STONE, true);
        // Solar panels on roof: BLUE_WOOL grid in centre area
        if (Math.abs(dx) <= 3 && Math.abs(dz) <= 2) {
          const isSolar = ((dx + 3) % 2 === 0) && ((dz + 2) % 2 === 0);
          this._stamp(data, lx, g + 6, lz, isSolar ? BLUE_WOOL : AIR, false);
        }
      }
    }
    // Gravel parking pad south of building (dz 4..7, dx -5..4)
    for (let dz = 4; dz <= 7; dz++) {
      for (let dx = -5; dx <= 4; dx++) {
        const lx = hx + dx - ox, lz = hz + dz - oz;
        this._stamp(data, lx, g, lz, GRAVEL, true);
        this._stamp(data, lx, g + 1, lz, AIR, true);
      }
    }
    // S4: 自販機 at the parking edge, beside the building's SE corner
    // (stamped after the parking AIR-clear so it survives).
    const vlx = hx + 4 - ox, vlz = hz + 4 - oz;
    this._stamp(data, vlx, g + 1, vlz, VENDING, true);
    this._stamp(data, vlx, g + 2, vlz, VENDING, true);
  }

  // ── バス停: roadside bus shelter ────────────────────────────────────────────
  _stampBusStop(data, ox, oz) {
    const bx = BUS_X, bz = BUS_Z, g = VFLOOR;
    // Shelter: 2×1 roof (dx 0..1) on two posts
    for (let dx = 0; dx <= 1; dx++) {
      const lx = bx + dx - ox, lz = bz - oz;
      this._stamp(data, lx, g, lz, SMOOTH_STONE, true);     // floor slab
      this._stamp(data, lx, g + 1, lz, AIR, true);           // clear interior
      this._stamp(data, lx, g + 2, lz, AIR, true);
      // Two posts at ends
      if (dx === 0 || dx === 1) this._stamp(data, lx, g + 3, lz, SPRUCE_LOG, true);
      // Roof beam
      this._stamp(data, lx, g + 4, lz, SPRUCE_PLANKS, true);
    }
    // Bench inside (bx+0, g+1) — S4: wooden bench
    this._stamp(data, bx - ox, g + 1, bz - oz, BIRCH_PLANKS, true);
    // Pole (west of shelter): tall sign post
    const plx = bx - 1 - ox, plz = bz - oz;
    for (let t = 1; t <= 5; t++) this._stamp(data, plx, g + t, plz, SPRUCE_LOG, true);
    this._stamp(data, plx, g + 5, plz, WHITE_WOOL, true); // sign cap
    // S4: 時刻表 — NOTICE_BOARD timetable on the pole at eye level
    this._stamp(data, plx, g + 2, plz, NOTICE_BOARD, true);
    // S4: 自販機 — glowing vending machine just east of the shelter
    const vlx = bx + 2 - ox;
    this._stamp(data, vlx, g, bz - oz, SMOOTH_STONE, true);   // pad
    this._stamp(data, vlx, g + 1, bz - oz, VENDING, true);
    this._stamp(data, vlx, g + 2, bz - oz, VENDING, true);
  }

  // ── 南方八幡神社: Shinto shrine on a wooded eastern rise ──────────────────
  _stampShrine(data, ox, oz) {
    const sx = SHRINE_X, sz = SHRINE_Z;
    // Ground raise: +3 at centre, blending outward
    // (The hill is baked into heightAt via rim boost; we place structure on VFLOOR+3)
    const g = VFLOOR + 3;

    // ── 参道 stone path (sz+6..sz+11) ────────────────────────────────────────
    // Placed FIRST so the torii gate stamp below wins on the same cells.
    for (let tz = sz + 6; tz <= sz + 11; tz++) {
      const lx = sx - ox, lz = tz - oz;
      this._stamp(data, lx, g, lz, COBBLE, true);
      this._stamp(data, lx - 1, g, lz, COBBLE, true);
      this._stamp(data, lx + 1, g, lz, COBBLE, true);
    }
    // Rising stone steps (sz+2..sz+5) - 4 steps
    for (let step = 0; step < 4; step++) {
      const tz = sz + 5 - step;
      const sy = g - step;  // each step is 1 lower
      for (let dx = -1; dx <= 1; dx++) {
        this._stamp(data, sx + dx - ox, sy, tz - oz, COBBLE, true);
        // Clear above
        this._stamp(data, sx + dx - ox, sy + 1, tz - oz, AIR, true);
        this._stamp(data, sx + dx - ox, sy + 2, tz - oz, AIR, true);
      }
    }

    // ── Stone lanterns flanking approach (sx±3, sz+9) ────────────────────────
    for (const dx of [-3, 3]) {
      const lx = sx + dx - ox, lz = sz + 9 - oz;
      this._stamp(data, lx, g, lz, STONE_BRICKS, true);     // base
      this._stamp(data, lx, g + 1, lz, CALCITE, true);       // shaft
      this._stamp(data, lx, g + 2, lz, STONE_BRICKS, true);  // hood
      this._stamp(data, lx, g + 3, lz, LANTERN, true);        // glowing light
    }

    // ── 拝殿 main shrine building (5×4 footprint, centre at sx, sz) ──────────
    {
      for (let dz = -2; dz <= 1; dz++) {
        for (let dx = -2; dx <= 2; dx++) {
          const lx = sx + dx - ox, lz = sz + dz - oz;
          this._stamp(data, lx, g, lz, STONE_BRICKS, true);   // floor
          const edge = Math.abs(dx) === 2 || dz === -2 || dz === 1;
          for (let wy = 1; wy <= 3; wy++) {
            if (!edge) { this._stamp(data, lx, g + wy, lz, AIR, true); continue; }
            const isDoor = dz === 1 && dx === 0 && wy <= 2;
            if (isDoor) { this._stamp(data, lx, g + wy, lz, AIR, true); continue; }
            const isWin = wy === 2 && ((Math.abs(dx) === 2 && Math.abs(dz) <= 1) ||
                                       (Math.abs(dz) === 2 && Math.abs(dx) <= 1));
            this._stamp(data, lx, g + wy, lz, isWin ? GLASS : SPRUCE_PLANKS, true);
          }
          // Tiered roof layer 1 (wide) — S4: 瓦葺き
          this._stamp(data, lx, g + 4, lz, KAWARA, true);
        }
      }
      // Tiered roof layer 2 (inner, narrower) — S4: 瓦葺き
      for (let dz = -1; dz <= 0; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          this._stamp(data, sx + dx - ox, g + 5, sz + dz - oz, KAWARA, true);
        }
      }
      // Ridge cap — S4: 瓦葺き
      this._stamp(data, sx - ox, g + 6, sz - 1 - oz, KAWARA, true);
      this._stamp(data, sx - ox, g + 6, sz - oz, KAWARA, true);
    }

    // ── S4: 手水舎 — CALCITE water basin east of the approach path ───────────
    // Two-cell basin (CALCITE) topped with WATER, at (sx+3..4, sz+4).
    for (const dx of [3, 4]) {
      const lx = sx + dx - ox, lz = sz + 4 - oz;
      this._stamp(data, lx, g + 1, lz, CALCITE, true);  // basin body
      this._stamp(data, lx, g + 2, lz, WATER, true);     // water surface
    }

    // ── S4: 狛犬 — paired stone guardians flanking the approach (sx±2, sz+6) ─
    for (const dx of [-2, 2]) {
      const lx = sx + dx - ox, lz = sz + 6 - oz;
      this._stamp(data, lx, g + 1, lz, SMOOTH_STONE, true);
      this._stamp(data, lx, g + 2, lz, SMOOTH_STONE, true);
    }

    // ── Cedar trees flanking the 参道 ────────────────────────────────────────
    for (const [ddx, ddz] of [[-4, 10], [4, 10], [-4, 7], [4, 7]]) {
      const tx = sx + ddx - ox, tz = sz + ddz - oz;
      for (let t = 1; t <= 7; t++) this._stamp(data, tx, g + t, tz, SPRUCE_LOG, true);
      for (let dy = -2; dy <= 1; dy++) {
        const cr = dy < 0 ? 2 : 1;
        for (let dz = -cr; dz <= cr; dz++) {
          for (let dx = -cr; dx <= cr; dx++) {
            if (dx === 0 && dz === 0 && dy < 1) continue;
            if (Math.abs(dx) === cr && Math.abs(dz) === cr && dy < 0) continue;
            this._stamp(data, tx + dx, g + 6 + dy, tz + dz, SPRUCE_LEAVES, false);
          }
        }
      }
    }

    // ── Torii gate (stamped LAST to win over path) ──────────────────────────
    // Centre at (sx, sz+12); BRICK pillars at dz=-2,+2; crossbeams at g+3 and g+4.
    {
      const tx = sx, tz = sz + 12;
      for (const pz of [-2, 2]) {
        const lx = tx - ox, lz = tz + pz - oz;
        this._stamp(data, lx, g - 1, lz, STONE_BRICKS, true); // foundation
        for (let t = 0; t <= 4; t++) this._stamp(data, lx, g + t, lz, BRICK, true); // pillar
      }
      // Lower crossbeam at g+3
      for (let pz = -2; pz <= 2; pz++) {
        this._stamp(data, tx - ox, g + 3, tz + pz - oz, BRICK, true);
      }
      // Upper crossbeam at g+4 (wider, overhangs ±1 each side)
      for (let pz = -3; pz <= 3; pz++) {
        this._stamp(data, tx - ox, g + 4, tz + pz - oz, BRICK, true);
      }
      // Kasagi cap extensions at g+5
      this._stamp(data, tx - ox, g + 5, tz - 3 - oz, BRICK, true);
      this._stamp(data, tx - ox, g + 5, tz + 3 - oz, BRICK, true);
    }
  }

  // ── 道標 signposts: SPRUCE_LOG post + SPRUCE_PLANKS board at path junctions ─
  // Signpost = 2-high post capped with a planks "board". Placed at deterministic
  // waypoint locations: drive entrance, midway along shrine path, farmhouse path fork.
  // Each is checked for overlap with this chunk before stamping.
  _stampSignposts(data, ox, oz) {
    const g = VFLOOR;
    // Signpost placements: [wx, wz] — all outside exclusion box, on or near paths
    const SIGNS = [
      // S1: Drive entrance junction (path meets drive, west of gate pillars)
      [EX0 - 6, DRIVE_Z],
      // S2: Mid-point on shrine approach path (halfway x ~ 10, z ~ -3)
      [10, -3],
      // S3: Fork near east farmhouse path (near x=4, z=-50)
      [4, -50],
      // S4: Riverside path north waypoint (east bank, near z=-55)
      [riverCentreX(-55) + RIVER_HALF + 2, -55],
      // S5: Community-center side path (near road turnoff to CC)
      [ROAD_X + 5, CC_Z + 8],
    ];
    for (const [sx, sz] of SIGNS) {
      if (inExclusionBox(sx, sz)) continue;
      const lx = sx - ox, lz = sz - oz;
      // SPRUCE_LOG post (2 high) + SPRUCE_PLANKS board at top
      this._stamp(data, lx, g + 1, lz, SPRUCE_LOG, true);
      this._stamp(data, lx, g + 2, lz, SPRUCE_LOG, true);
      this._stamp(data, lx, g + 3, lz, SPRUCE_PLANKS, true);
      // Small "arm" board extending one block to the side (directional indicator)
      this._stamp(data, lx + 1, g + 3, lz, SPRUCE_PLANKS, false);
    }
  }

  // ── 隠し要素: hidden discovery spots ─────────────────────────────────────
  // 5 charming secrets scattered around the valley, deterministically placed.
  _stampSecrets(data, ox, oz) {
    const g = VFLOOR;

    // SECRET 1: Forest picnic clearing — HAY bale bench + LANTERN, NW forest edge
    // At a sheltered spot northwest, near the forest rim (~x=-70, z=-55)
    {
      const sx = -70, sz = -55;
      if (!inExclusionBox(sx, sz)) {
        // HAY bale "table" with lantern on top
        this._stamp(data, sx - ox, g + 1, sz - oz, HAY, true);
        this._stamp(data, sx - ox, g + 2, sz - oz, LANTERN, true);
        // Two COBBLE "stools" flanking
        this._stamp(data, sx - 1 - ox, g + 1, sz - oz, COBBLE, true);
        this._stamp(data, sx + 1 - ox, g + 1, sz - oz, COBBLE, true);
        // Spread of DRY_GRASS clearing floor (2x2)
        for (let dz = -1; dz <= 1; dz++) for (let dx = -2; dx <= 2; dx++) {
          this._stamp(data, sx + dx - ox, g, sz + dz - oz, DRY_GRASS, false);
        }
      }
    }

    // SECRET 2: Sunflower heart clearing — dense HAY/GREEN_WOOL sunflower cluster
    // tucked in a SE field at x=36, z=36 (outside exclusion, in open paddies)
    {
      const sx = 36, sz = 36;
      // Small heart-like 3x3 cluster of tall sunflower stalks
      const heart = [[0,-1],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]];
      for (const [dx, dz] of heart) {
        const wx2 = sx + dx, wz2 = sz + dz;
        if (inExclusionBox(wx2, wz2)) continue;
        this._stamp(data, wx2 - ox, g, wz2 - oz, DIRT, true);
        this._stamp(data, wx2 - ox, g + 1, wz2 - oz, GREEN_WOOL, true);
        this._stamp(data, wx2 - ox, g + 2, wz2 - oz, GREEN_WOOL, true);
        this._stamp(data, wx2 - ox, g + 3, wz2 - oz, HAY, true); // "head"
      }
    }

    // SECRET 3: Shrine offering — stone lantern altar at the base of the torii approach
    // A small stone-lantern offering spot at x=64, z=-18 (south of shrine steps)
    {
      const sx = SHRINE_X, sz = SHRINE_Z + 12; // base of torii (sz=-18)
      const sg = VFLOOR + 3; // shrine is elevated
      // Offering stone (COBBLE base + STONE_BRICKS top + LANTERN glow)
      this._stamp(data, sx - 2 - ox, sg, sz - oz, COBBLE, false);
      this._stamp(data, sx - 2 - ox, sg + 1, sz - oz, STONE_BRICKS, false);
      this._stamp(data, sx - 2 - ox, sg + 2, sz - oz, LANTERN, false);
      this._stamp(data, sx + 2 - ox, sg, sz - oz, COBBLE, false);
      this._stamp(data, sx + 2 - ox, sg + 1, sz - oz, STONE_BRICKS, false);
      this._stamp(data, sx + 2 - ox, sg + 2, sz - oz, LANTERN, false);
    }

    // SECRET 4: Hilltop lookout bench — a bench on the eastern valley rim
    // A lookout at x=88, z=-30 (beyond the shrine, on higher ground)
    {
      const sx = 88, sz = -30;
      if (!inExclusionBox(sx, sz)) {
        const hg = this.heightAt(sx, sz);
        // Two COBBLE blocks side by side = bench, SPRUCE_PLANKS back
        this._stamp(data, sx - ox, hg + 1, sz - oz, COBBLE, false);
        this._stamp(data, sx + 1 - ox, hg + 1, sz - oz, COBBLE, false);
        this._stamp(data, sx - ox, hg + 2, sz - 1 - oz, SPRUCE_PLANKS, false);
        this._stamp(data, sx + 1 - ox, hg + 2, sz - 1 - oz, SPRUCE_PLANKS, false);
        // A lantern beside the bench
        this._stamp(data, sx - 1 - ox, hg + 1, sz - oz, LANTERN, false);
      }
    }

    // SECRET 5: Hidden lantern nook — tucked under the riverbank overhang
    // A glowing lantern placed just below VFLOOR on the east river bank
    // at a specific z where the bank forms a small alcove
    {
      const sz = -42;
      const cx2 = riverCentreX(sz);
      const sx = cx2 + RIVER_HALF + 3; // just east of bank
      if (!inExclusionBox(sx, sz)) {
        // Lantern placed at water level in a small carved nook
        this._stamp(data, sx - ox, VFLOOR, sz - oz, LANTERN, false);
        // HAY "bread stash" nearby
        this._stamp(data, sx + 1 - ox, VFLOOR + 1, sz - oz, HAY, false);
      }
    }
  }

  // A countryside farmhouse: sandstone/plank walls, glass windows, brick gable
  // roof. Placed at world (hx,hz) on the valley floor (y=VFLOOR).
  // KEPT for legacy reference — new code uses _stampFarmhouse above.
  _stampCountryHouse(data, ox, oz, hx, hz) {
    this._stampFarmhouse(data, ox, oz, hx, hz);
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

  // --- light field -----------------------------------------------------------
  // Builds a Float32Array of per-voxel combined light values [0..1] for the
  // chunk plus a 1-voxel border on all sides (needed for smooth corner averaging).
  // Dimensions: (CHUNK+2) * (CHUNK+2) * HEIGHT, indexed by lightIdx(lx,y,lz)
  // where lx and lz run from -1 to CHUNK.
  //
  // Two channels are computed and combined:
  //   SKYLIGHT  – 1.0 at/above the highest opaque block, falls off with a soft
  //               SKYLIGHT_FALLOFF-block gradient below it, floors at CAVE_DARK.
  //               Scales with the global day/night sun via the material colour in
  //               main.js — we bake it as a 0..1 term here.
  //   BLOCKLIGHT – BFS flood-fill from emitter blocks (Furnace=13, Lantern=14);
  //               decrement 1 per block, stops at opaque, converted to [0..1].
  //               NOT dimmed by day/night; remains constant regardless of sun.
  //
  // Final per-voxel light = max(skylight, blocklight_term) so lanterns/ovens
  // illuminate their surroundings even underground or at night.
  buildLightField(cx, cz) {
    const W = CHUNK + 2; // border size: 1 each side
    const size = W * W * HEIGHT;
    const sky   = new Float32Array(size);
    const block = new Float32Array(size); // blocklight as 0..MAX_BLOCK_LIGHT integer stored as float

    // Local-space index: lx,lz in [-1..CHUNK], y in [0..HEIGHT-1]
    const LI = (lx, y, lz) => (lx + 1) + (lz + 1) * W + y * (W * W);

    // Build skylight from heightmap — sample world coords for border columns
    for (let lz = -1; lz <= CHUNK; lz++) {
      for (let lx = -1; lx <= CHUNK; lx++) {
        const wx = cx * CHUNK + lx, wz = cz * CHUNK + lz;
        // Find highest opaque block in this column (using getBlock for border cols)
        let topY = -1;
        for (let y = HEIGHT - 1; y >= 0; y--) {
          if (isOpaque(this.getBlock(wx, y, wz))) { topY = y; break; }
        }
        // Fill column: above topY = full sky (1.0), soft gradient below
        for (let y = 0; y < HEIGHT; y++) {
          let s;
          if (y > topY) {
            s = 1.0; // open sky
          } else {
            // Soft falloff: SKYLIGHT_FALLOFF blocks of linear decay below surface
            const depth = topY - y;
            if (depth < SKYLIGHT_FALLOFF) {
              s = CAVE_DARK + (1.0 - CAVE_DARK) * (1.0 - depth / SKYLIGHT_FALLOFF);
            } else {
              s = CAVE_DARK;
            }
          }
          sky[LI(lx, y, lz)] = s;
        }
      }
    }

    // BFS blocklight: seed from emitters within the padded volume, flood outward
    // Using a simple typed array queue for performance
    const rawBlock = new Uint8Array(size); // integer 0..MAX_BLOCK_LIGHT
    // セルは明るさが上がるたびに再enqueueされ得る（最大 MAX_BLOCK_LIGHT 回/セル）ので
    // 容量=セル数では灯りが密集した部屋で溢れて伝播が欠けることがある。余裕を持たせ、
    // それでも溢れた場合は静かに範囲外へ書くのではなく enqueue をスキップする。
    const queue = new Int32Array(size * 4); // packed indices
    let qHead = 0, qTail = 0;

    // Seed all emitter blocks in the padded volume
    for (let lz = -1; lz <= CHUNK; lz++) {
      for (let y = 0; y < HEIGHT; y++) {
        for (let lx = -1; lx <= CHUNK; lx++) {
          const wx = cx * CHUNK + lx, wz = cz * CHUNK + lz;
          const id = this.getBlock(wx, y, wz);
          const emit = blockLightEmit(id);
          if (emit > 0) {
            const li = LI(lx, y, lz);
            rawBlock[li] = emit;
            queue[qTail++] = li;
          }
        }
      }
    }

    // BFS flood fill — 6-connected, decrements by 1 each step, stops at opaque.
    // Direction encoding d=0..5: ±lx, ±lz, ±y.
    const WW = W * W;

    while (qHead < qTail) {
      const li = queue[qHead++];
      const lv = rawBlock[li] - 1;
      if (lv <= 0) continue;

      // Decode lx, lz, y from li (reverse of LI)
      const y   =  Math.floor(li / WW);
      const rem =  li % WW;
      const lz  =  Math.floor(rem / W) - 1;
      const lx  =  (rem % W) - 1;

      for (let d = 0; d < 6; d++) {
        const ny2 = y + (d === 4 ? 1 : d === 5 ? -1 : 0);
        if (ny2 < 0 || ny2 >= HEIGHT) continue;
        const nlx = lx + (d === 0 ? 1 : d === 1 ? -1 : 0);
        const nlz = lz + (d === 2 ? 1 : d === 3 ? -1 : 0);
        if (nlx < -1 || nlx > CHUNK || nlz < -1 || nlz > CHUNK) continue;
        // Don't propagate INTO opaque blocks (but emitters placed in opaque blocks are fine)
        const wx = cx * CHUNK + nlx, wz = cz * CHUNK + nlz;
        if (isOpaque(this.getBlock(wx, ny2, wz))) continue;
        const nli = LI(nlx, ny2, nlz);
        if (rawBlock[nli] < lv) {
          rawBlock[nli] = lv;
          if (qTail < queue.length) queue[qTail++] = nli;
        }
      }
    }

    // Convert rawBlock int 0..15 -> float 0..1 and combine with skylight
    const light = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      const bl = rawBlock[i] / MAX_BLOCK_LIGHT;
      light[i] = Math.max(sky[i], bl);
    }

    return { light, LI, W };
  }

  // --- mesher ------------------------------------------------------------
  buildGeometry(cx, cz) {
    const c = this.ensureData(cx, cz);
    const data = c.data;
    const ox = cx * CHUNK;
    const oz = cz * CHUNK;

    const groups = {
      opaque: { pos: [], norm: [], uv: [], col: [] },
      trans:  { pos: [], norm: [], uv: [], col: [] }, // glass alpha-blend
      water:  { pos: [], norm: [], uv: [], col: [] }, // water animated pass
      leaf:   { pos: [], norm: [], uv: [], col: [] }, // foliage alpha-cutout
    };

    const occ = (x, y, z) => (isOpaque(this.getBlock(x, y, z)) ? 1 : 0);

    // Build the per-chunk light field (skylight + blocklight BFS).
    // The field covers lx,lz in [-1..CHUNK], y in [0..HEIGHT-1].
    const { light, LI } = this.buildLightField(cx, cz);

    // Sample the combined light at a world position.
    // Clamps border reads to the padded range already covered by buildLightField.
    const sampleLight = (wx, wy, wz) => {
      if (wy < 0 || wy >= HEIGHT) return 1.0;
      const lx = wx - ox, lz = wz - oz;
      // clamp to the padded range [-1..CHUNK]
      const clx = Math.max(-1, Math.min(CHUNK, lx));
      const clz = Math.max(-1, Math.min(CHUNK, lz));
      return light[LI(clx, wy, clz)];
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
          // Route block to the correct render group:
          //   water  → animated translucent water pass
          //   leaves → alpha-cutout foliage pass
          //   glass  → alpha-blended transparent pass
          //   rest   → opaque pass
          const g = id === WATER_BLOCK ? groups.water
            : LEAF_GROUP.has(id) ? groups.leaf
            : TRANSPARENT_GROUP.has(id) ? groups.trans
            : groups.opaque;

          // Water uses full [0,1] UV (separate tiling texture, not atlas)
          const useFullUV = (id === WATER_BLOCK);

          for (const dir of dirs) {
            const [dx, dy, dz] = dir.d;
            const nId = this.getBlock(wx + dx, y + dy, wz + dz);
            if (isOpaque(nId) || nId === id) continue; // face hidden

            const tile = def.faces[dir.face];
            this._emitFace(g, wx, y, wz, dir, tile, occ, sampleLight, useFullUV);
          }
        }
      }
    }
    return groups;
  }

  // Emit a quad for one visible face, baking smooth lighting + AO into vertex colors.
  //
  // Smooth lighting: for each of the 4 face corners, we average the combined
  // light value of the 4 voxels that share that corner (Minecraft-style smooth
  // lighting). This produces soft gradients across surfaces — the single biggest
  // visual upgrade toward a Minecraft look. The result is multiplied by
  // dir.shade (directional tint) and AO_BRIGHT (corner AO) and baked into the
  // vertex color attribute; the GPU interpolates across the quad.
  //
  // useFullUV: when true, emit UV [0..1]×[0..1] (for water's own tiling texture)
  //            instead of sampling the atlas tile rect.
  _emitFace(g, x, y, z, dir, tile, occ, sampleLight, useFullUV = false) {
    const [nx, ny, nz] = dir.d;
    // choose axis layout
    let uAxis, vAxis, nAxis, ncoord;
    if (nx !== 0) { nAxis = 0; uAxis = 2; vAxis = 1; ncoord = nx > 0 ? 1 : 0; }
    else if (ny !== 0) { nAxis = 1; uAxis = 0; vAxis = 2; ncoord = ny > 0 ? 1 : 0; }
    else { nAxis = 2; uAxis = 0; vAxis = 1; ncoord = nz > 0 ? 1 : 0; }

    // Full [0,1] UV for water (its own tiling texture); atlas rect otherwise.
    const uvrect = useFullUV
      ? { u0: 0, u1: 1, v0: 0, v1: 1 }
      : tileUV(tile, this.atlasCols, this.atlasRows);

    const corners = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const verts = [];
    const aoVals = [];
    for (const [uu, vv] of corners) {
      const p = [0, 0, 0];
      p[nAxis] = ncoord;
      p[uAxis] = uu;
      p[vAxis] = vv;
      const vx = x + p[0], vy = y + p[1], vz = z + p[2];

      // AO neighbours on the outer layer (unchanged from original)
      const tu = uu ? 1 : -1;
      const tv = vv ? 1 : -1;
      const base = [x, y, z];
      base[nAxis] += nx + ny + nz; // move to neighbour layer (only one axis nonzero)
      const s1 = base.slice(); s1[uAxis] += tu;
      const s2 = base.slice(); s2[vAxis] += tv;
      const cc = base.slice(); cc[uAxis] += tu; cc[vAxis] += tv;
      const so1 = occ(s1[0], s1[1], s1[2]);
      const so2 = occ(s2[0], s2[1], s2[2]);
      const soc = occ(cc[0], cc[1], cc[2]);
      const ao = so1 && so2 ? 0 : 3 - (so1 + so2 + soc);

      // ── Smooth lighting: average light of the 4 voxels sharing this vertex ──
      // The face normal points outward; sample the 4 voxels on the outer side
      // of the face at this corner: centre-out (base), +u, +v, +u+v.
      // base[] is already set to the neighbour cell (base[nAxis] shifted by dir).
      const lBase  = sampleLight(base[0],    base[1],    base[2]);
      const lSide1 = sampleLight(s1[0],      s1[1],      s1[2]);
      const lSide2 = sampleLight(s2[0],      s2[1],      s2[2]);
      const lCorner = sampleLight(cc[0],      cc[1],      cc[2]);
      // Standard 4-sample corner average (same as Minecraft's smooth lighting)
      const smoothL = (lBase + lSide1 + lSide2 + lCorner) * 0.25;

      const uvc = [uu ? uvrect.u1 : uvrect.u0, vv ? uvrect.v1 : uvrect.v0];
      verts.push({ p: [vx, vy, vz], uv: uvc, ao, smoothL });
      aoVals.push(ao);
    }

    // triangulation flip to keep AO gradient symmetric (unchanged)
    const flip = aoVals[0] + aoVals[2] < aoVals[1] + aoVals[3];
    const order = flip ? [1, 2, 3, 1, 3, 0].map((i) => verts[i]) : [0, 1, 2, 0, 2, 3].map((i) => verts[i]);

    for (const v of order) {
      g.pos.push(v.p[0], v.p[1], v.p[2]);
      g.norm.push(nx, ny, nz);
      g.uv.push(v.uv[0], v.uv[1]);
      // Combine directional shade * corner AO * smooth per-vertex light
      const b = dir.shade * AO_BRIGHT[v.ao] * v.smoothL;
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
