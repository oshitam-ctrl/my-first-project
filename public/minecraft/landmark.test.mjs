// Node test for landmark.js — builds Petit Hermès into a recording stamp.
// Run: node landmark.test.mjs
import assert from 'node:assert';
import { LANDMARK, buildPetitHermes } from './landmark.js';

// block-id constants matching the host world
const B = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4, OAK_LOG: 5, OAK_LEAVES: 6,
  OAK_PLANKS: 9, COBBLE: 10, GLASS: 12, BRICK: 13, BIRCH_LOG: 23,
  SPRUCE_LOG: 25, SPRUCE_PLANKS: 51, BIRCH_PLANKS: 52, DRY_GRASS: 27,
  SANDSTONE: 39, SMOOTH_STONE: 41, CALCITE: 46, WHITE_WOOL: 31, BLUE_WOOL: 33,
  GREEN_WOOL: 35, BLACK_WOOL: 36, GRAVEL: 37, HAY: 50, STONE_BRICKS: 29,
  WATER: 7, WHEAT_CROP: 53, VEG_CROP: 54,
  FURNACE: 60, CRAFTING_TABLE: 61, PLANK: 9, PUMPKIN: 62,
  LANTERN: 55,
};

const { w, d, clearH } = LANDMARK;

// record final block at each coord (last write wins, like a real world)
const grid = new Map();
let calls = 0;
const stamp = (x, y, z, id) => {
  calls++;
  grid.set(`${x},${y},${z}`, id);
};

buildPetitHermes(stamp, B);

// count solid (non-air) placed blocks + per-id tallies
const tally = new Map();
let solid = 0;
for (const [, id] of grid) {
  if (id !== B.AIR) solid++;
  tally.set(id, (tally.get(id) || 0) + 1);
}
const has = (id) => (tally.get(id) || 0) > 0;
const get = (x, y, z) => grid.get(`${x},${y},${z}`) ?? -1;

// ── Stamp count / solid block count (raised for the larger building) ─────────
assert.ok(calls > 5000, `expected >5000 stamp calls, got ${calls}`);
assert.ok(solid > 5000, `expected >5000 solid blocks, got ${solid}`);

// ── Block types present ──────────────────────────────────────────────────────
assert.ok(has(B.GLASS), 'expected some GLASS');
assert.ok(has(B.BRICK), 'expected some BRICK');
assert.ok(has(B.BLUE_WOOL), 'expected some BLUE_WOOL');
assert.ok(has(B.SANDSTONE), 'expected some SANDSTONE');
assert.ok(has(B.SPRUCE_PLANKS), 'expected some SPRUCE_PLANKS');
assert.ok(has(B.HAY), 'expected some HAY');
assert.ok(has(B.FURNACE), 'expected some FURNACE (workshop ovens)');
assert.ok(has(B.CRAFTING_TABLE), 'expected some CRAFTING_TABLE (prep tables / teacher desk)');
assert.ok(has(B.STONE_BRICKS), 'expected some STONE_BRICKS (partition wall)');
assert.ok(has(B.SMOOTH_STONE), 'expected some SMOOTH_STONE (interior staircase)');
assert.ok(has(B.OAK_PLANKS), 'expected some OAK_PLANKS (interior floors)');

// ── LANDMARK dimensions ───────────────────────────────────────────────────────
assert.strictEqual(w, 88, 'LANDMARK.w must be 88');
assert.strictEqual(d, 80, 'LANDMARK.d must be 80');
assert.strictEqual(clearH, 40, 'LANDMARK.clearH must be 40');

// ── All coords within [0..w] x [0..clearH] x [0..d] ─────────────────────────
for (const key of grid.keys()) {
  const [x, y, z] = key.split(',').map(Number);
  assert.ok(x >= 0 && x <= w, `x out of range: ${x}`);
  assert.ok(y >= 0 && y <= clearH, `y out of range: ${y}`);
  assert.ok(z >= 0 && z <= d, `z out of range: ${z}`);
}

// ── Max local y < 35 (parapet at y=16, no block above clearH=40) ─────────────
let maxY = 0;
for (const [key, id] of grid) {
  if (id !== B.AIR) {
    const [, y] = key.split(',').map(Number);
    if (y > maxY) maxY = y;
  }
}
assert.ok(maxY < 35, `max solid y should be < 35 (parapet y=16), got ${maxY}`);

// ── Baker cell is AIR: local (50,2,18) must be walkable ──────────────────────
const bakerCell = get(50, 2, 18);
assert.ok(
  bakerCell === B.AIR || bakerCell === -1,
  `baker cell (50,2,18) must be AIR, got ${bakerCell}`
);

// ── Bakery SALES region has real interior AIR ─────────────────────────────────
// sales zone: x46..55, y2..6, z12..18
let airCount_sales = 0;
for (let x = 46; x <= 55; x++)
  for (let y = 2; y <= 6; y++)
    for (let z = 12; z <= 18; z++) {
      const id = get(x, y, z);
      if (id === B.AIR || id === -1) airCount_sales++;
    }
assert.ok(airCount_sales > 200, `bakery sales region should have >200 AIR cells, got ${airCount_sales}`);

// ── Classroom interior floor >= 8×8 of OAK_PLANKS (Classroom 1: x12..21, z3..19) ─
let floorCount = 0;
for (let x = 12; x <= 21; x++)
  for (let z = 3; z <= 19; z++) {
    if (get(x, 1, z) === B.OAK_PLANKS) floorCount++;
  }
assert.ok(floorCount >= 64, `classroom floor should have >= 64 OAK_PLANKS cells (8×8), got ${floorCount}`);

// ── Corridor walkable z >= 4 at some x ───────────────────────────────────────
// Corridor z21..25 (4 wide). At x=44 check y=2..3 are AIR across z=21..25
let corridorAir = 0;
for (let z = 21; z <= 25; z++) {
  if ((get(44, 2, z) === B.AIR || get(44, 2, z) === -1) &&
      (get(44, 3, z) === B.AIR || get(44, 3, z) === -1)) {
    corridorAir++;
  }
}
assert.ok(corridorAir >= 4, `corridor should have >=4 walkable z-cells at x=44, got ${corridorAir}`);

// ── Blackboard / chalkboard present in x12..21 bay ───────────────────────────
// Bay x12..21 is now the "South in North" cafe: the chalkboard menu board
// (BLACK_WOOL) is placed on the back wall z=2, y3..6 — same position as a
// classroom blackboard, so the same assertion catches both uses.
let bbFound = false;
for (let x = 12; x <= 21 && !bbFound; x++)
  for (let y = 3; y <= 6 && !bbFound; y++)
    if (get(x, y, 2) === B.BLACK_WOOL) bbFound = true;
assert.ok(bbFound, 'expected BLACK_WOOL chalkboard menu on cafe bay back wall (z=2)');

// ── Cafe "South in North" has SPRUCE_PLANKS counter at z=19 ─────────────────
let cafeCounterFound = false;
for (let x = 13; x <= 20 && !cafeCounterFound; x++)
  if (get(x, 2, 19) === B.SPRUCE_PLANKS || get(x, 3, 19) === B.SPRUCE_PLANKS) cafeCounterFound = true;
assert.ok(cafeCounterFound, 'expected SPRUCE_PLANKS cafe counter at z=19, x12..21');

// ── Cafe has BLUE_WOOL teal accent ────────────────────────────────────────────
let cafeTealFound = false;
for (let x = 12; x <= 21 && !cafeTealFound; x++)
  for (let y = 2; y <= 7 && !cafeTealFound; y++)
    for (let z = 2; z <= 19 && !cafeTealFound; z++)
      if (get(x, y, z) === B.BLUE_WOOL) cafeTealFound = true;
assert.ok(cafeTealFound, 'expected BLUE_WOOL teal accent in cafe bay');

// ── Workshop ovens (FURNACE) on back wall z=2 ────────────────────────────────
let ovenFound = false;
for (let x = 45; x <= 56 && !ovenFound; x++)
  for (let y = 2; y <= 4 && !ovenFound; y++)
    if (get(x, y, 2) === B.FURNACE) ovenFound = true;
assert.ok(ovenFound, 'expected FURNACE ovens in workshop back wall (z=2)');

// ── Entrance opening: center cell (cx-1..cx, y=2..4, z=26) must be AIR ────────
const cx = Math.floor(w / 2); // 44
assert.ok(
  (get(cx - 1, 2, 26) === B.AIR || get(cx - 1, 2, 26) === -1),
  `entrance cell (${cx - 1},2,26) must be AIR`
);
assert.ok(
  (get(cx, 2, 26) === B.AIR || get(cx, 2, 26) === -1),
  `entrance cell (${cx},2,26) must be AIR`
);

console.log(`OK: ${calls} stamp calls, ${solid} solid blocks placed, max y=${maxY}.`);
console.log(`  dims ${w}x${d}x${clearH}; distinct block ids: ${tally.size}`);
console.log(`  bakery sales AIR=${airCount_sales}, classroom floor=${floorCount}, corridor walkable=${corridorAir}`);
