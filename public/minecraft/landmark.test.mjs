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
  FURNACE: 21, CRAFTING_TABLE: 20, PLANK: 9, PUMPKIN: 14, // real ids (free 60-62 now used by products)
  LANTERN: 55,
  BREAD: 56,   // artisan bread display block
  REGISTER: 57, SCALE: 58, JAR: 59,         // bakery counter equipment
  BAGUETTE: 60, CAMPAGNE: 61, PASTRY: 62,   // product display blocks
  OPEN_SIGN: 65, SHOP_SIGN: 63, AFRAME: 64, // storefront signage
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

// ── Baker cell is AIR: local (50,2,13) must be walkable (behind the deep counter)
const bakerCell = get(50, 2, 13);
assert.ok(
  bakerCell === B.AIR || bakerCell === -1,
  `baker cell (50,2,13) must be AIR, got ${bakerCell}`
);

// ── Service counter at z=14, ONE block tall (top y2), with the spacious browsing
//    floor in front (z15..19). The counter front (x49..50, z=14) must be SOLID,
//    the row above (y=3) must be AIR (look down onto it), and the floor a customer
//    stands on (z=16) must be walkable AIR. ─────────────────────────────────────
for (const wx of [49, 50]) {
  assert.ok(get(wx, 2, 14) !== B.AIR && get(wx, 2, 14) !== -1, `bakery counter front (${wx},2,14) must be SOLID, got ${get(wx,2,14)}`);
  assert.ok(get(wx, 3, 14) === B.AIR || get(wx, 3, 14) === -1, `above the low counter (${wx},3,14) must be AIR, got ${get(wx,3,14)}`);
  assert.ok(get(wx, 2, 16) === B.AIR || get(wx, 2, 16) === -1, `browsing floor (${wx},2,16) must be walkable AIR, got ${get(wx,2,16)}`);
}

// ── Counter staff gap: x52, z=14 must be OPEN (AIR) so the baker can step out. ──
{
  const c = get(52, 2, 14);
  assert.ok(c === B.AIR || c === -1, `counter staff gap (52,2,14) must be AIR, got ${c}`);
}

// ── Equipment ON the counter at WAIST height (y=2, z=14): REGISTER + SCALE. ─────
let hasRegister = false, hasScale = false;
for (let x = 46; x <= 55; x++) {
  if (get(x, 2, 14) === B.REGISTER) hasRegister = true;
  if (get(x, 2, 14) === B.SCALE) hasScale = true;
}
assert.ok(hasRegister, 'expected a REGISTER (id 57) on the counter (y=2, z=14)');
assert.ok(hasScale, 'expected a SCALE (id 58) on the counter (y=2, z=14)');

// ── SPACIOUS browsing floor: lots of open AIR in front of the counter ─────────
// browsing area: x46..55, y2..6, z15..19
let airCount_browse = 0;
for (let x = 46; x <= 55; x++)
  for (let y = 2; y <= 6; y++)
    for (let z = 15; z <= 19; z++) {
      const id = get(x, y, z);
      if (id === B.AIR || id === -1) airCount_browse++;
    }
assert.ok(airCount_browse > 180, `bakery browsing area should be SPACIOUS: >180 AIR cells in x46..55,y2..6,z15..19, got ${airCount_browse}`);

// ── Hero カンパーニュ pedestal island (CALCITE base + BREAD loaf, centre floor) ─
assert.ok(get(50, 2, 17) === B.CALCITE, `hero campagne pedestal base (50,2,17) must be CALCITE, got ${get(50,2,17)}`);
assert.ok(get(50, 3, 17) === B.BREAD, `hero campagne loaf (50,3,17) must be BREAD, got ${get(50,3,17)}`);

// ── 天然酵母 fermentation-jar feature: JAR/GLASS jars + teal lids on west shelf ─
let jarFeature = 0, jarLids = 0;
for (let z = 15; z <= 19; z++) {
  if (get(45, 5, z) === B.JAR || get(45, 5, z) === B.GLASS) jarFeature++;
  if (get(45, 6, z) === B.BLUE_WOOL) jarLids++;
}
assert.ok(jarFeature >= 3, `expected >=3 fermentation jars (JAR/GLASS) on the west shelf, got ${jarFeature}`);
assert.ok(jarLids >= 3, `expected >=3 BLUE_WOOL jar lids, got ${jarLids}`);

// ── Petit Hermès brand band: BREAD emblem on the teal partition band (x52..55,y5)
let brandLoaf = false;
for (let x = 52; x <= 55; x++) if (get(x, 5, 11) === B.BREAD) brandLoaf = true;
assert.ok(brandLoaf, 'expected a BREAD brand emblem on the partition band (x52..55,y5,z11)');

// ── Product VARIETY in the display cases (distinct breads, not one BREAD) ──────
let caseVariety = 0;
for (let z = 15; z <= 19; z++) {
  if ([B.BAGUETTE, B.CAMPAGNE, B.PASTRY].includes(get(45, 2, z))) caseVariety++;
  if ([B.BAGUETTE, B.CAMPAGNE, B.PASTRY].includes(get(56, 2, z))) caseVariety++;
}
assert.ok(caseVariety >= 4, `expected varied display products (baguette/campagne/pastry) in the cases, got ${caseVariety}`);

// ── Storefront: shop-name sign + OPEN sign + window display + A-frame (facade) ─
const cx = Math.floor(w / 2); // 44 — facade centre (matches landmark.js)
assert.ok(get(cx, 6, 26) === B.SHOP_SIGN, `shop-name sign at (${cx},6,26)`);
assert.ok(get(cx + 2, 3, 27) === B.OPEN_SIGN, `OPEN sign at (${cx + 2},3,27)`);
assert.ok(get(cx - 3, 2, 28) === B.AFRAME, `A-frame at (${cx - 3},2,28)`);
let windowBreads = 0;
for (let x = cx - 4; x <= cx + 4; x++)
  if ([B.BAGUETTE, B.CAMPAGNE, B.PASTRY].includes(get(x, 3, 25))) windowBreads++;
assert.ok(windowBreads >= 4, `window display should show varied breads behind the facade glass, got ${windowBreads}`);

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
// (cx already declared above for the storefront-signage checks)
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
const g1 = 9;    // floor-2 interior bottom (y9)
const g2 = 14;   // floor-2 interior top   (y14)
const f1Hi = 7;  // floor-1 interior ceiling
const bkX0 = 45, bkX1 = 56, bkPartZ = 11; // bakery bay constants
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

// BREAD emblems near bakery doorway (x48..51, z=20, y=2..3).
// Previously HAY; now replaced with the BREAD block so the entrance reads as "パン屋".
let bakeryBreadEmblemFound = false;
for (let x = 47; x <= 52 && !bakeryBreadEmblemFound; x++)
  for (let y = 2; y <= 4 && !bakeryBreadEmblemFound; y++)
    if (get(x, y, 20) === B.BREAD) bakeryBreadEmblemFound = true;
assert.ok(bakeryBreadEmblemFound, 'expected BREAD emblems (id 56) near bakery corridor doorway (z=20) — replaced HAY');

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

// UP-ARROW (WHITE_WOOL) above west stair doorway on corridor wall.
// Markers span y=7..8 (below door) and y=13 (above door top at y=12).
// Doorway is at y=9..12, so markers must NOT occupy y=9..12 at the doorway x-range.
let westArrowFound = false;
for (let x = 5; x <= 10 && !westArrowFound; x++)
  for (let y of [7, 8, 13])
    if (get(x, y, 20) === B.WHITE_WOOL) { westArrowFound = true; break; }
assert.ok(westArrowFound, 'expected WHITE_WOOL up-arrow above west stair doorway (y=7,8,13 z=20)');

// UP-ARROW (WHITE_WOOL) above east stair doorway
let eastArrowFound = false;
for (let x = 79; x <= 83 && !eastArrowFound; x++)
  for (let y of [7, 8, 13])
    if (get(x, y, 20) === B.WHITE_WOOL) { eastArrowFound = true; break; }
assert.ok(eastArrowFound, 'expected WHITE_WOOL up-arrow above east stair doorway (y=7,8,13 z=20)');

// "2F" BLUE_WOOL badge at y=14, z=20 near both stairs (moved above door arch at y=9..12)
let westTwofFound = false;
for (let x = 5; x <= 10 && !westTwofFound; x++)
  if (get(x, 14, 20) === B.BLUE_WOOL) westTwofFound = true;
assert.ok(westTwofFound, 'expected BLUE_WOOL "2F" badge at y=14, z=20 near west stair');

let eastTwofFound = false;
for (let x = 79; x <= 83 && !eastTwofFound; x++)
  if (get(x, 14, 20) === B.BLUE_WOOL) eastTwofFound = true;
assert.ok(eastTwofFound, 'expected BLUE_WOOL "2F" badge at y=14, z=20 near east stair');

// Stair LANDING LANTERNs at top of stairs (y=8, z=12)
assert.ok(
  get(7, 8, 12) === B.LANTERN,
  `west stair landing LANTERN expected at (7,8,12), got ${get(7, 8, 12)}`
);
assert.ok(
  get(81, 8, 12) === B.LANTERN,
  `east stair landing LANTERN expected at (81,8,12), got ${get(81, 8, 12)}`
);

// ══════════════════════════════════════════════════════════════════════════════
// FIX A — GF DIVIDERS ARE SOLID (not erased by the hollow)
// ══════════════════════════════════════════════════════════════════════════════

// GF dividers must be SANDSTONE at a mid-room cell (y=4, z=10 = room interior).
// Before the fix they were AIR because the hollow (z3..19) ran AFTER the dividers.
assert.strictEqual(
  get(22, 4, 10), B.SANDSTONE,
  `GF divider at (22,4,10) must be SANDSTONE (was AIR — hollow ordering bug)`
);
assert.strictEqual(
  get(57, 4, 10), B.SANDSTONE,
  `GF divider at (57,4,10) must be SANDSTONE (was AIR — hollow ordering bug)`
);

// Bakery must be a properly enclosed bay: dividers at x=44 and x=57 solid mid-bay.
assert.strictEqual(
  get(44, 4, 12), B.SANDSTONE,
  `Bakery west divider (44,4,12) must be SANDSTONE — bakery bay must be enclosed`
);
assert.strictEqual(
  get(57, 4, 12), B.SANDSTONE,
  `Bakery east divider (57,4,12) must be SANDSTONE — bakery bay must be enclosed`
);

// Bakery corridor doorway (carved AFTER dividers) must still be AIR/passable.
assert.ok(
  get(49, 3, 20) === B.AIR || get(49, 3, 20) === -1,
  `bakery corridor doorway (49,3,20) must be AIR — re-carved after divider placement`
);

// ══════════════════════════════════════════════════════════════════════════════
// FIX B — 2F ROOMS ARE FURNISHED (desks, lockers, lanterns) + doorways open
// ══════════════════════════════════════════════════════════════════════════════

// 2F Classroom 1 (x12..21): count student desk (SPRUCE_PLANKS) + chair (BIRCH_PLANKS)
let f2DeskCount = 0, f2ChairCount = 0;
for (let x = 12; x <= 21; x++) {
  for (let z = 3; z <= 19; z++) {
    if (get(x, g1, z) === B.SPRUCE_PLANKS) f2DeskCount++;
    if (get(x, g1, z) === B.BIRCH_PLANKS)  f2ChairCount++;
  }
}
assert.ok(f2DeskCount >= 12, `2F Classroom 1 should have >=12 desk blocks, got ${f2DeskCount}`);
assert.ok(f2ChairCount >= 12, `2F Classroom 1 should have >=12 chair blocks, got ${f2ChairCount}`);

// 2F Classroom 1 lockers on west wall (x=12, WHITE_WOOL locker-door faces)
let f2LockerCount = 0;
for (let z = 6; z <= 18; z++)
  if (get(12, g1 + 1, z) === B.WHITE_WOOL) f2LockerCount++;
assert.ok(f2LockerCount >= 4, `2F Classroom 1 should have >=4 locker-door (WHITE_WOOL) blocks on west wall, got ${f2LockerCount}`);

// 2F corridor doorways are AIR (carved correctly)
let f2CorridorDoorwaysOk = 0;
for (const [bayX0, bayX1] of [[12,21],[34,43],[45,56],[58,67],[69,78]]) {
  const doorCx = Math.floor((bayX0 + bayX1) / 2);
  if ((get(doorCx - 1, g1, 20) === B.AIR || get(doorCx - 1, g1, 20) === -1) &&
      (get(doorCx,     g1, 20) === B.AIR || get(doorCx,     g1, 20) === -1))
    f2CorridorDoorwaysOk++;
}
assert.ok(f2CorridorDoorwaysOk >= 4, `at least 4 of the 5 non-music 2F doorways must be AIR, got ${f2CorridorDoorwaysOk}`);

// 2F rooms have LANTERN ceiling lighting (classroom_2f places 2 per room)
let f2LanternCount = 0;
for (let x = 12; x <= 78; x++)
  for (let z = 3; z <= 19; z++)
    if (get(x, g2 - 1, z) === B.LANTERN) f2LanternCount++;
assert.ok(f2LanternCount >= 10, `2F rooms should have >=10 ceiling LANTERN blocks, got ${f2LanternCount}`);

// ══════════════════════════════════════════════════════════════════════════════
// FIX C — BAKERY SALES AREA POLISH (glass case, pendant lamps, teal, BLUE_WOOL)
// ══════════════════════════════════════════════════════════════════════════════

// GLASS display cases: the two wall cases (west x46 + east x55) pack the sales zone
let bakeryGlassCount = 0;
for (let x = bkX0; x <= bkX1; x++)
  for (let y = 2; y <= 6; y++)
    for (let z = 12; z <= 19; z++)
      if (get(x, y, z) === B.GLASS) bakeryGlassCount++;
assert.ok(bakeryGlassCount >= 8, `bakery should have >=8 GLASS blocks (wall display cases), got ${bakeryGlassCount}`);

// LANTERN pendant lamps over the browsing floor + counter (y=3..6, z=14..19)
let bakeryCounterLanternCount = 0;
for (let x = bkX0; x <= bkX1; x++)
  for (let y = 3; y <= 6; y++)
    for (let z = 14; z <= 19; z++)
      if (get(x, y, z) === B.LANTERN) bakeryCounterLanternCount++;
assert.ok(bakeryCounterLanternCount >= 3, `bakery should have >=3 pendant LANTERN blocks, got ${bakeryCounterLanternCount}`);

// BLUE_WOOL teal accent near bakery counter (the teal partition wall / accent wall)
let bakeryTealCount = 0;
for (let x = bkX0; x <= bkX1; x++)
  for (let y = 2; y <= f1Hi; y++)
    if (get(x, y, bkPartZ) === B.BLUE_WOOL) bakeryTealCount++;
assert.ok(bakeryTealCount >= 4, `bakery partition wall should have >=4 BLUE_WOOL teal face blocks, got ${bakeryTealCount}`);

// ── BREAD BLOCK in bakery sales region ─────────────────────────────────────
// The new BREAD block (id 56) replaces HAY in all sales-area display contexts.
// Expect BREAD on the counter top, in the display case (behind glass), on the
// east-wall shelves, in the proofing baskets, and at the corridor doorway emblems.
// Check: >= 8 BREAD blocks in the combined sales + corridor area.
let bakeryBreadCount = 0;
// sales zone x45..56, y2..7, z12..19
for (let x = bkX0; x <= bkX1; x++)
  for (let y = 2; y <= f1Hi; y++)
    for (let z = 12; z <= 19; z++)
      if (get(x, y, z) === B.BREAD) bakeryBreadCount++;
// corridor emblems z=20
for (let x = bkX0; x <= bkX1; x++)
  for (let y = 2; y <= 5; y++)
    if (get(x, y, 20) === B.BREAD) bakeryBreadCount++;
assert.ok(bakeryBreadCount >= 8, `bakery should have >=8 BREAD blocks in sales+corridor area, got ${bakeryBreadCount}`);

// Confirm HAY is NOT present in the bakery sales zone (display/shelves/counter).
// HAY is only legitimate in the WORKSHOP flour-sack area (z=2..10).
let salesHayCount = 0;
for (let x = bkX0; x <= bkX1; x++)
  for (let y = 2; y <= f1Hi; y++)
    for (let z = 12; z <= 19; z++)
      if (get(x, y, z) === B.HAY) salesHayCount++;
assert.strictEqual(salesHayCount, 0, `bakery SALES zone (z=12..19) must have 0 HAY blocks — all replaced by BREAD, got ${salesHayCount}`);

// ══════════════════════════════════════════════════════════════════════════════
// BUG 1 FIX — 2F NORTH PERIMETER WALL PRESERVED (not erased by hollow)
// The 2F hollow now starts at z=3, leaving the z=2 north wall intact.
// ══════════════════════════════════════════════════════════════════════════════

// 2F north wall (z=2, y=g1..g2) must be non-AIR at several x positions.
// These are set by section-2 wallRing (SANDSTONE) + section-3 windowBand (GLASS).
// Check a handful of interior x-columns (avoid bay dividers/stair ends for simplicity).
const northWallCheckXs = [10, 20, 30, 50, 60, 70];
for (const nx of northWallCheckXs) {
  for (let ny = g1; ny <= g2; ny++) {
    const nid = get(nx, ny, 2);
    assert.ok(
      nid !== B.AIR && nid !== -1,
      `2F north wall destroyed: (${nx},${ny},2) is AIR — BUG-1 hollow should start at z=3`
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// BUG 2 FIX — STAIR→2F CORRIDOR ROUTE IS WALKABLE
// The stair shaft is punched z=13..19 only; z=12 landing is solid at deck (y=8).
// The x=9 catwalk (solid deck y=8, z=12..20) connects landing to corridor.
// The 2F corridor doorways at z=20 are clear (AIR y=9..12).
// A WHITE_WOOL railing runs along the east rim of the west shaft (x=8, z=13..19, y=g1).
// ══════════════════════════════════════════════════════════════════════════════

// West stair landing at z=12 must be solid at deck level (y=8) — not punched.
assert.ok(
  get(7, 8, 12) === B.LANTERN || get(7, 8, 12) === B.OAK_PLANKS,
  `west stair landing (7,8,12) must be solid (LANTERN or OAK_PLANKS), got ${get(7,8,12)}`
);
for (const lx of [6, 8]) {
  assert.ok(
    get(lx, 8, 12) === B.OAK_PLANKS || get(lx, 8, 12) === B.SMOOTH_STONE,
    `west stair landing (${lx},8,12) must be solid, got ${get(lx,8,12)}`
  );
}

// Stair shaft (z=13..19, x=6..8, y=8) must be AIR (punched for GF↔2F).
for (const sx of [6, 7, 8]) {
  for (let sz = 13; sz <= 19; sz++) {
    assert.strictEqual(
      get(sx, 8, sz), B.AIR,
      `west stair shaft (${sx},8,${sz}) must be AIR, got ${get(sx,8,sz)}`
    );
  }
}

// x=9 catwalk (west stair) — solid floor y=8 all the way z=12..20.
for (let cz = 12; cz <= 20; cz++) {
  assert.ok(
    get(9, 8, cz) !== B.AIR && get(9, 8, cz) !== -1,
    `2F catwalk (9,8,${cz}) must be solid — player walkway from stair landing to corridor`
  );
  assert.ok(
    get(9, 9, cz) === B.AIR || get(9, 9, cz) === -1,
    `2F catwalk headspace (9,9,${cz}) must be AIR, got ${get(9,9,cz)}`
  );
}

// 2F stair bay corridor doorway (x=6..9, y=9..12, z=20) must be clear.
for (const dx of [6, 8, 9]) {
  assert.ok(
    get(dx, 9, 20) === B.AIR || get(dx, 9, 20) === -1,
    `2F stair corridor doorway (${dx},9,20) must be AIR, got ${get(dx,9,20)}`
  );
}

// Landing exit clear: player body space (y=9..10) at the landing (z=12, x=6..8) is AIR.
for (const lx of [6, 7, 8]) {
  for (const ly of [9, 10]) {
    assert.ok(
      get(lx, ly, 12) === B.AIR || get(lx, ly, 12) === -1,
      `stair landing body-space (${lx},${ly},12) must be AIR (no railing blocking exit), got ${get(lx,ly,12)}`
    );
  }
}

// 2F shaft east-rim railing: WHITE_WOOL at x=8, y=g1, z=13..19.
let shaftRailingFound = false;
for (let rz = 13; rz <= 19; rz++)
  if (get(8, g1, rz) === B.WHITE_WOOL) { shaftRailingFound = true; break; }
assert.ok(shaftRailingFound, 'expected WHITE_WOOL railing on east rim of west stair shaft (x=8, y=g1, z=13..19)');

// East stair symmetric checks.
assert.ok(
  get(81, 8, 12) === B.LANTERN || get(81, 8, 12) === B.OAK_PLANKS,
  `east stair landing (81,8,12) must be solid, got ${get(81,8,12)}`
);
for (const sx of [80, 81, 82]) {
  for (let sz = 13; sz <= 19; sz++) {
    assert.strictEqual(
      get(sx, 8, sz), B.AIR,
      `east stair shaft (${sx},8,${sz}) must be AIR, got ${get(sx,8,sz)}`
    );
  }
}
let eastShaftRailing = false;
for (let rz = 13; rz <= 19; rz++)
  if (get(80, g1, rz) === B.WHITE_WOOL) { eastShaftRailing = true; break; }
assert.ok(eastShaftRailing, 'expected WHITE_WOOL railing on west rim of east stair shaft (x=80, y=g1, z=13..19)');

// Stair marker arrows must NOT block the 2F doorway (y=9..12 at x=6..9, z=20).
// The arrow tip was moved to y=13 and "2F" badges to y=14.
for (const mx of [7, 8]) {
  for (const my of [9, 10, 11, 12]) {
    const mval = get(mx, my, 20);
    assert.ok(
      mval === B.AIR || mval === -1,
      `stair marker must not block 2F doorway: (${mx},${my},20) = ${mval}, expected AIR`
    );
  }
}

// ── Counting reports ─────────────────────────────────────────────────────────
let northWallSolid = 0;
for (const nx of northWallCheckXs)
  for (let ny = g1; ny <= g2; ny++)
    if (get(nx, ny, 2) !== B.AIR && get(nx, ny, 2) !== -1) northWallSolid++;

console.log(`OK: ${calls} stamp calls, ${solid} solid blocks placed, max y=${maxY}.`);
console.log(`  dims ${w}x${d}x${clearH}; distinct block ids: ${tally.size}`);
console.log(`  bakery browsing AIR=${airCount_browse}, classroom floor=${floorCount}, corridor walkable=${corridorAir}`);
console.log(`  理科室: benches=${scienceBenchCount}, water sinks=${scienceWaterCount}, calcite basins=${scienceCalciteCount}`);
console.log(`  音楽室: piano BLACK_WOOL=${musicPianoFound}, WHITE_WOOL keys=${musicKeysFound}, stands=${musicStandFound}`);
console.log(`  図書室: shelves=${libraryShelfCount}, book-wools=${libraryBookWoolCount}, tables=${libraryTableFound}`);
console.log(`  Bakery doorway marker: lintel=${bakeryLintelFound}, bread_emblem=${bakeryBreadEmblemFound}, lantern=${bakeryLanternFound}`);
console.log(`  Workshop door marker: lintel=${workshopLintelFound}, lantern=${workshopLanternFound}, arrow=${workshopArrowFound}`);
console.log(`  Stair markers: west lintel=${westStairLintelFound}, east lintel=${eastStairLintelFound}`);
console.log(`  Stair arrows: west=${westArrowFound}, east=${eastArrowFound}; 2F badges: west=${westTwofFound}, east=${eastTwofFound}`);
console.log(`  BUG-1 fix: 2F north wall (z=2, y${g1}..${g2}) solid at sampled x: ${northWallSolid}/${northWallCheckXs.length * (g2 - g1 + 1)} cells`);
console.log(`  BUG-2 fix: stair landing(7,8,12)=${get(7,8,12)===B.LANTERN?'LANT':get(7,8,12)}, shaft(7,8,13)=${get(7,8,13)}, catwalk(9,8,15)=${get(9,8,15)}, railing=${shaftRailingFound}`);
console.log(`  FIX A: GF divider(22,4,10)=${get(22,4,10)===B.SANDSTONE?'SOLID':'ERASED'}, divider(57,4,10)=${get(57,4,10)===B.SANDSTONE?'SOLID':'ERASED'}`);
console.log(`  FIX B: 2F desks=${f2DeskCount}, chairs=${f2ChairCount}, lockers=${f2LockerCount}, ceiling lanterns=${f2LanternCount}, corridor doors open=${f2CorridorDoorwaysOk}`);
console.log(`  FIX C: bakery GLASS=${bakeryGlassCount}, counter LANTERNs=${bakeryCounterLanternCount}, BLUE_WOOL teal=${bakeryTealCount}`);
console.log(`  BREAD redesign: BREAD blocks in sales+corridor=${bakeryBreadCount}, HAY in sales zone=${salesHayCount}`);
