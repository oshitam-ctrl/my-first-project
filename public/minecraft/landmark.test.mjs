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
assert.ok(has(B.WHITE_WOOL), 'expected some WHITE_WOOL (stair railings / markers)');
assert.ok(has(B.LANTERN), 'expected some LANTERN (interior lighting)');
assert.ok(has(B.WATER), 'expected some WATER (sinks in 理科室 and bakery workshop)');

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

// ══════════════════════════════════════════════════════════════════════════════
// NEW ASSERTIONS — themed rooms + doorway/stair markers
// ══════════════════════════════════════════════════════════════════════════════

// ── 理科室 (science room) — GF x23..32: CRAFTING_TABLE lab benches + WATER sinks ──
// Lab benches: CRAFTING_TABLE blocks in x23..32, y=2, z=7 and z=12
let scienceBenchCount = 0;
for (let x = 23; x <= 32; x++)
  for (let z = 3; z <= 19; z++)
    if (get(x, 2, z) === B.CRAFTING_TABLE) scienceBenchCount++;
assert.ok(scienceBenchCount >= 4, `理科室 should have >=4 CRAFTING_TABLE lab bench blocks, got ${scienceBenchCount}`);

// WATER sinks in 理科室 region (x23..32, z=15..19)
let scienceWaterCount = 0;
for (let x = 23; x <= 32; x++)
  for (let z = 3; z <= 19; z++)
    if (get(x, 2, z) === B.WATER) scienceWaterCount++;
assert.ok(scienceWaterCount >= 2, `理科室 should have >=2 WATER sink blocks, got ${scienceWaterCount}`);

// CALCITE basins in 理科室
let scienceCalciteCount = 0;
for (let x = 23; x <= 32; x++)
  for (let z = 3; z <= 19; z++)
    if (get(x, 2, z) === B.CALCITE) scienceCalciteCount++;
assert.ok(scienceCalciteCount >= 2, `理科室 should have >=2 CALCITE basin blocks, got ${scienceCalciteCount}`);

// LANTERN in 理科室
let scienceLanternFound = false;
for (let x = 23; x <= 32 && !scienceLanternFound; x++)
  for (let y = 2; y <= 7 && !scienceLanternFound; y++)
    for (let z = 3; z <= 19 && !scienceLanternFound; z++)
      if (get(x, y, z) === B.LANTERN) scienceLanternFound = true;
assert.ok(scienceLanternFound, 'expected LANTERN in 理科室 bay (x23..32)');

// ── 音楽室 (music room) — 2F x23..32: BLACK_WOOL piano body + WHITE_WOOL keys ──
// Piano body: BLACK_WOOL at 2F y-range (g1=9), x24..27, z2..3
const g1 = 9; // floor-2 interior bottom
let musicPianoFound = false;
for (let x = 23; x <= 32 && !musicPianoFound; x++)
  for (let y = g1; y <= g1 + 3 && !musicPianoFound; y++)
    for (let z = 2; z <= 5 && !musicPianoFound; z++)
      if (get(x, y, z) === B.BLACK_WOOL) musicPianoFound = true;
assert.ok(musicPianoFound, 'expected BLACK_WOOL piano body in 音楽室 (2F x23..32)');

// Piano keys: WHITE_WOOL in 音楽室 region (2F x23..32)
let musicKeysFound = false;
for (let x = 23; x <= 32 && !musicKeysFound; x++)
  for (let y = g1; y <= g1 + 5 && !musicKeysFound; y++)
    for (let z = 2; z <= 5 && !musicKeysFound; z++)
      if (get(x, y, z) === B.WHITE_WOOL) musicKeysFound = true;
assert.ok(musicKeysFound, 'expected WHITE_WOOL piano keys in 音楽室 (2F x23..32)');

// Music stands: SPRUCE_LOG posts in 音楽室
let musicStandFound = false;
for (let x = 23; x <= 32 && !musicStandFound; x++)
  for (let z = 6; z <= 14 && !musicStandFound; z++)
    if (get(x, g1, z) === B.SPRUCE_LOG) musicStandFound = true;
assert.ok(musicStandFound, 'expected SPRUCE_LOG music stand posts in 音楽室');

// ── 図書室 (library) — GF x69..78: bookshelves (SPRUCE_PLANKS + coloured wools) ──
// Bookshelves on west wall (x=69) and east wall (x=78): SPRUCE_PLANKS + book wools
let libraryShelfCount = 0;
for (let z = 4; z <= 18; z++) {
  if (get(69, 3, z) === B.SPRUCE_PLANKS || get(69, 5, z) === B.SPRUCE_PLANKS) libraryShelfCount++;
  if (get(78, 3, z) === B.SPRUCE_PLANKS || get(78, 5, z) === B.SPRUCE_PLANKS) libraryShelfCount++;
}
assert.ok(libraryShelfCount >= 10, `図書室 should have >=10 SPRUCE_PLANKS shelf blocks, got ${libraryShelfCount}`);

// Book wools (BLUE, GREEN, or BLACK) at y=4 on shelf walls
let libraryBookWoolCount = 0;
for (let z = 4; z <= 18; z++) {
  const id69 = get(69, 4, z);
  const id78 = get(78, 4, z);
  if (id69 === B.BLUE_WOOL || id69 === B.GREEN_WOOL || id69 === B.BLACK_WOOL) libraryBookWoolCount++;
  if (id78 === B.BLUE_WOOL || id78 === B.GREEN_WOOL || id78 === B.BLACK_WOOL) libraryBookWoolCount++;
}
assert.ok(libraryBookWoolCount >= 10, `図書室 should have >=10 book-wool blocks, got ${libraryBookWoolCount}`);

// Reading tables (SPRUCE_PLANKS) and chairs (BIRCH_PLANKS) in library bay
let libraryTableFound = false;
const lbMid = Math.floor((69 + 78) / 2); // = 73
for (let z = 6; z <= 15 && !libraryTableFound; z++)
  if (get(lbMid - 1, 2, z) === B.SPRUCE_PLANKS || get(lbMid, 2, z) === B.SPRUCE_PLANKS)
    libraryTableFound = true;
assert.ok(libraryTableFound, 'expected SPRUCE_PLANKS reading tables in 図書室');

// LANTERN reading lamps in 図書室
let libraryLanternFound = false;
for (let x = 69; x <= 78 && !libraryLanternFound; x++)
  for (let y = 2; y <= 7 && !libraryLanternFound; y++)
    for (let z = 3; z <= 19 && !libraryLanternFound; z++)
      if (get(x, y, z) === B.LANTERN) libraryLanternFound = true;
assert.ok(libraryLanternFound, 'expected LANTERN reading lamps in 図書室 (x69..78)');

// ── BAKERY CORRIDOR DOORWAY MARKER ───────────────────────────────────────────
// BLUE_WOOL 暖簾 lintel at y=6, around x48..51, z=20
let bakeryLintelFound = false;
for (let x = 47; x <= 52 && !bakeryLintelFound; x++)
  if (get(x, 6, 20) === B.BLUE_WOOL) bakeryLintelFound = true;
assert.ok(bakeryLintelFound, 'expected BLUE_WOOL lintel at y=6, z=20 above bakery doorway');

// HAY emblems near bakery doorway (x48..51, z=20, y=2..3)
let bakeryHayFound = false;
for (let x = 47; x <= 52 && !bakeryHayFound; x++)
  for (let y = 2; y <= 4 && !bakeryHayFound; y++)
    if (get(x, y, 20) === B.HAY) bakeryHayFound = true;
assert.ok(bakeryHayFound, 'expected HAY bread emblems near bakery corridor doorway (z=20)');

// LANTERN above bakery doorway in corridor (z=21)
let bakeryLanternFound = false;
for (let x = 48; x <= 51 && !bakeryLanternFound; x++)
  for (let y = 5; y <= 7 && !bakeryLanternFound; y++)
    if (get(x, y, 21) === B.LANTERN) bakeryLanternFound = true;
assert.ok(bakeryLanternFound, 'expected LANTERN above bakery doorway in corridor (z=21)');

// ── WORKSHOP PARTITION DOOR MARKER ───────────────────────────────────────────
// Partition door stays AIR at x50..51, y2..4, z=11
assert.ok(
  (get(50, 2, 11) === B.AIR || get(50, 2, 11) === -1),
  'partition door (50,2,11) must be AIR (passable)'
);
assert.ok(
  (get(51, 3, 11) === B.AIR || get(51, 3, 11) === -1),
  'partition door (51,3,11) must be AIR (passable)'
);
// STONE_BRICKS lintel above partition door (y=5, z=11)
let workshopLintelFound = false;
for (let x = 49; x <= 52 && !workshopLintelFound; x++)
  if (get(x, 5, 11) === B.STONE_BRICKS) workshopLintelFound = true;
assert.ok(workshopLintelFound, 'expected STONE_BRICKS lintel above workshop partition door (y=5, z=11)');

// LANTERN over the partition door (z=12 side)
let workshopLanternFound = false;
for (let x = 49; x <= 52 && !workshopLanternFound; x++)
  for (let y = 4; y <= 7 && !workshopLanternFound; y++)
    if (get(x, y, 12) === B.LANTERN) workshopLanternFound = true;
assert.ok(workshopLanternFound, 'expected LANTERN over workshop partition door (z=12)');

// WHITE_WOOL arrow marker on workshop side of partition
let workshopArrowFound = false;
for (let x = 53; x <= 56 && !workshopArrowFound; x++)
  for (let z = 11; z <= 14 && !workshopArrowFound; z++)
    if (get(x, 3, z) === B.WHITE_WOOL || get(x, 4, z) === B.WHITE_WOOL) workshopArrowFound = true;
assert.ok(workshopArrowFound, 'expected WHITE_WOOL arrow marker on workshop side of partition door');

// ── STAIR DOORWAY MARKERS ─────────────────────────────────────────────────────
// West stair: BLUE_WOOL lintel at y=6, z=20, x5..10
let westStairLintelFound = false;
for (let x = 5; x <= 10 && !westStairLintelFound; x++)
  if (get(x, 6, 20) === B.BLUE_WOOL) westStairLintelFound = true;
assert.ok(westStairLintelFound, 'expected BLUE_WOOL lintel above west stair doorway (y=6, z=20)');

// East stair: BLUE_WOOL lintel at y=6, z=20, x79..82
let eastStairLintelFound = false;
for (let x = 79; x <= 82 && !eastStairLintelFound; x++)
  if (get(x, 6, 20) === B.BLUE_WOOL) eastStairLintelFound = true;
assert.ok(eastStairLintelFound, 'expected BLUE_WOOL lintel above east stair doorway (y=6, z=20)');

// LANTERN above west stair in corridor (z=21, x7 or x8)
let westStairLanternFound = false;
for (let x = 6; x <= 10 && !westStairLanternFound; x++)
  for (let y = 5; y <= 8 && !westStairLanternFound; y++)
    if (get(x, y, 21) === B.LANTERN) westStairLanternFound = true;
assert.ok(westStairLanternFound, 'expected LANTERN above west stair doorway in corridor');

// LANTERN above east stair in corridor (z=21, x80..82)
let eastStairLanternFound = false;
for (let x = 79; x <= 83 && !eastStairLanternFound; x++)
  for (let y = 5; y <= 8 && !eastStairLanternFound; y++)
    if (get(x, y, 21) === B.LANTERN) eastStairLanternFound = true;
assert.ok(eastStairLanternFound, 'expected LANTERN above east stair doorway in corridor');

// UP-ARROW (WHITE_WOOL) above west stair doorway on corridor wall (y=7..9, z=20)
let westArrowFound = false;
for (let x = 5; x <= 10 && !westArrowFound; x++)
  for (let y = 7; y <= 10 && !westArrowFound; y++)
    if (get(x, y, 20) === B.WHITE_WOOL) westArrowFound = true;
assert.ok(westArrowFound, 'expected WHITE_WOOL up-arrow above west stair doorway (y=7..10, z=20)');

// UP-ARROW (WHITE_WOOL) above east stair doorway
let eastArrowFound = false;
for (let x = 79; x <= 83 && !eastArrowFound; x++)
  for (let y = 7; y <= 10 && !eastArrowFound; y++)
    if (get(x, y, 20) === B.WHITE_WOOL) eastArrowFound = true;
assert.ok(eastArrowFound, 'expected WHITE_WOOL up-arrow above east stair doorway (y=7..10, z=20)');

// "2F" BLUE_WOOL marker at y=10, z=20 near both stairs
let westTwofFound = false;
for (let x = 5; x <= 10 && !westTwofFound; x++)
  if (get(x, 10, 20) === B.BLUE_WOOL) westTwofFound = true;
assert.ok(westTwofFound, 'expected BLUE_WOOL "2F" marker at y=10, z=20 near west stair');

let eastTwofFound = false;
for (let x = 79; x <= 83 && !eastTwofFound; x++)
  if (get(x, 10, 20) === B.BLUE_WOOL) eastTwofFound = true;
assert.ok(eastTwofFound, 'expected BLUE_WOOL "2F" marker at y=10, z=20 near east stair');

// Stair LANDING LANTERNs at top of stairs (y=8, z=12)
assert.ok(
  get(7, 8, 12) === B.LANTERN,
  `west stair landing LANTERN expected at (7,8,12), got ${get(7, 8, 12)}`
);
assert.ok(
  get(81, 8, 12) === B.LANTERN,
  `east stair landing LANTERN expected at (81,8,12), got ${get(81, 8, 12)}`
);

console.log(`OK: ${calls} stamp calls, ${solid} solid blocks placed, max y=${maxY}.`);
console.log(`  dims ${w}x${d}x${clearH}; distinct block ids: ${tally.size}`);
console.log(`  bakery sales AIR=${airCount_sales}, classroom floor=${floorCount}, corridor walkable=${corridorAir}`);
console.log(`  理科室: benches=${scienceBenchCount}, water sinks=${scienceWaterCount}, calcite basins=${scienceCalciteCount}`);
console.log(`  音楽室: piano BLACK_WOOL=${musicPianoFound}, WHITE_WOOL keys=${musicKeysFound}, stands=${musicStandFound}`);
console.log(`  図書室: shelves=${libraryShelfCount}, book-wools=${libraryBookWoolCount}, tables=${libraryTableFound}`);
console.log(`  Bakery doorway marker: lintel=${bakeryLintelFound}, hay=${bakeryHayFound}, lantern=${bakeryLanternFound}`);
console.log(`  Workshop door marker: lintel=${workshopLintelFound}, lantern=${workshopLanternFound}, arrow=${workshopArrowFound}`);
console.log(`  Stair markers: west lintel=${westStairLintelFound}, east lintel=${eastStairLintelFound}`);
console.log(`  Stair arrows: west=${westArrowFound}, east=${eastArrowFound}; 2F markers: west=${westTwofFound}, east=${eastTwofFound}`);
