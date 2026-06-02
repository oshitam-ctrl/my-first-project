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

assert.ok(calls > 1500, `expected >1500 stamp calls, got ${calls}`);
assert.ok(solid > 1500, `expected >1500 solid blocks, got ${solid}`);

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

// all coords within [0..w] x [0..clearH] x [0..d]
for (const key of grid.keys()) {
  const [x, y, z] = key.split(',').map(Number);
  assert.ok(x >= 0 && x <= w, `x out of range: ${x}`);
  assert.ok(y >= 0 && y <= clearH, `y out of range: ${y}`);
  assert.ok(z >= 0 && z <= d, `z out of range: ${z}`);
}

console.log(`OK: ${calls} stamp calls, ${solid} solid blocks placed.`);
console.log(`  dims ${w}x${d}x${clearH}; distinct block ids: ${tally.size}`);
