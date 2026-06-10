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
  BOOKSHELF: 49,                            // community plaza library shelf
  // S1 schoolhouse / brand foundation blocks (ids 66..104)
  SHOE_CUBBY: 66, GREEN_BOARD: 67, SCHOOL_FLOOR: 68, PLASTER: 69,
  SASH_WINDOW: 70, GYM_FLOOR: 71, SCHOOL_CLOCK: 72, SCHOOL_EMBLEM: 73,
  NOTICE_BOARD: 74, SINK_UNIT: 75, VAULT_BOX: 76, SAKURA_LEAVES: 77,
  CEDAR_LOG: 78, CEDAR_LEAVES: 79, VENDING: 80, RICE: 81, TIN_ROOF: 82,
  KAWARA: 83, PAIN_DE_MIE: 84, TARTINE: 85, SOUP_POT: 86, CURRY_POT: 87,
  QUICHE: 88, COOKIE_TRAY: 89, SLAT_SHELF: 90, BASKET_BREAD: 91,
  PRICE_CARD: 92, COFFEE_KIT: 93, MENU_STAND: 94, STAINLESS: 95,
  SCHOOL_DESK: 96, SCHOOL_CHAIR: 97, FLAG: 98, GUARD_RAIL: 99,
  BRAND_GREEN: 100, WHEAT_BEIGE: 101, COMPOST: 102, YEAST_SHELF: 103,
  ISSHOU_PAN: 104,
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

// ── 酵母瓶棚 (S3): YEAST_SHELF jar cells + BRAND_GREEN trim on the west shelf ──
let jarFeature = 0, jarLids = 0;
for (let z = 15; z <= 19; z++) {
  if (get(45, 5, z) === B.YEAST_SHELF) jarFeature++;
  if (get(45, 6, z) === B.BRAND_GREEN) jarLids++;
}
assert.ok(jarFeature >= 3, `expected >=3 YEAST_SHELF cells on the west wall shelf (45,5,z15..19), got ${jarFeature}`);
assert.ok(jarLids >= 3, `expected >=3 BRAND_GREEN trim blocks above the yeast shelf (45,6,z), got ${jarLids}`);

// ── Petit Hermès brand band: BREAD emblem on the brand-green partition band (x52..55,y5)
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
// S2: the 昇降口下駄箱 banks at z=25 (x40..41 / x47..48) replaced the outer
// display-ledge loaves; the two inner loaves (x42 / x46) remain visible.
let windowBreads = 0;
for (let x = cx - 4; x <= cx + 4; x++)
  if ([B.BAGUETTE, B.CAMPAGNE, B.PASTRY].includes(get(x, 3, 25))) windowBreads++;
assert.ok(windowBreads >= 2, `window display should still show breads beside the genkan cubbies, got ${windowBreads}`);

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

// ── Menu board present in x12..21 bay ────────────────────────────────────────
// Bay x12..21 is the "South in North" cafe: S3 replaced the BLACK_WOOL chalk
// menu with a real GREEN_BOARD school board on the PLASTER back wall z=2.
let bbFound = false;
for (let x = 12; x <= 21 && !bbFound; x++)
  for (let y = 3; y <= 6 && !bbFound; y++)
    if (get(x, y, 2) === B.GREEN_BOARD) bbFound = true;
assert.ok(bbFound, 'expected GREEN_BOARD menu on cafe bay back wall (z=2)');

// ── Cafe "South in North" has SPRUCE_PLANKS counter at z=19 ─────────────────
let cafeCounterFound = false;
for (let x = 13; x <= 20 && !cafeCounterFound; x++)
  if (get(x, 2, 19) === B.SPRUCE_PLANKS || get(x, 3, 19) === B.SPRUCE_PLANKS) cafeCounterFound = true;
assert.ok(cafeCounterFound, 'expected SPRUCE_PLANKS cafe counter at z=19, x12..21');

// ── Cafe has BRAND_GREEN accent (S3: teal retired for the brand deep-green) ───
let cafeTealFound = false;
for (let x = 12; x <= 21 && !cafeTealFound; x++)
  for (let y = 2; y <= 7 && !cafeTealFound; y++)
    for (let z = 2; z <= 19 && !cafeTealFound; z++)
      if (get(x, y, z) === B.BRAND_GREEN) cafeTealFound = true;
assert.ok(cafeTealFound, 'expected BRAND_GREEN accent in cafe bay');

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
// BRAND_GREEN 暖簾 lintel at y=6, around x48..51, z=20 (S3: teal → deep green)
let bakeryLintelFound = false;
for (let x = 47; x <= 52 && !bakeryLintelFound; x++)
  if (get(x, 6, 20) === B.BRAND_GREEN) bakeryLintelFound = true;
assert.ok(bakeryLintelFound, 'expected BRAND_GREEN lintel at y=6, z=20 above bakery doorway');

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

// (S3) The WHITE_WOOL "→工房" arrow at z=12 was retired: that plane is now the
// ヒーロー面陳列 wall of bread. Assert the hero wall instead (full checks below).
let workshopArrowFound = false;
for (let x = 53; x <= 56 && !workshopArrowFound; x++)
  if (get(x, 3, 12) === B.SLAT_SHELF) workshopArrowFound = true;
assert.ok(workshopArrowFound, 'expected SLAT_SHELF hero-wall bank east of the passage at z=12 (replaced the old arrow)');

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
// 2F divider too: the 2F hollow (y=g1..g2) must not eat the upstairs room walls.
// (総点検S7: GFしか検証していなかったテストギャップを補完)
assert.strictEqual(
  get(22, 10, 10), B.SANDSTONE,
  `2F divider at (22,10,10) must be SANDSTONE (2F hollow must preserve dividers)`
);

// Bakery must be a properly enclosed bay: dividers at x=44 and x=57 solid mid-bay.
// S3 re-skinned the sales-zone divider faces (z12..19) with warm-white PLASTER.
assert.strictEqual(
  get(44, 4, 12), B.PLASTER,
  `Bakery west divider (44,4,12) must be PLASTER (S3 white wall) — bay must stay enclosed`
);
assert.strictEqual(
  get(57, 4, 12), B.PLASTER,
  `Bakery east divider (57,4,12) must be PLASTER (S3 white wall) — bay must stay enclosed`
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

// BRAND_GREEN band on the partition (S3: the teal BLUE_WOOL face was retired)
let bakeryTealCount = 0;
for (let x = bkX0; x <= bkX1; x++)
  for (let y = 2; y <= f1Hi; y++)
    if (get(x, y, bkPartZ) === B.BRAND_GREEN) bakeryTealCount++;
assert.ok(bakeryTealCount >= 4, `bakery partition wall should have >=4 BRAND_GREEN band blocks, got ${bakeryTealCount}`);

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

// ══════════════════════════════════════════════════════════════════════════════
// S2 — 校舎の本物感 + 校庭/体育館 (schoolhouse authenticity, yard, gymnasium)
// ══════════════════════════════════════════════════════════════════════════════

// ── 昇降口: 下駄箱 banks present, genkan walkway stays clear ─────────────────
const shoeCubbyCount = tally.get(B.SHOE_CUBBY) || 0;
assert.ok(shoeCubbyCount >= 12, `昇降口 should have >=12 SHOE_CUBBY blocks, got ${shoeCubbyCount}`);
for (const gz of [22, 23, 24]) {
  for (const gx of [43, 44, 45]) {
    const gid = get(gx, 2, gz);
    assert.ok(gid === B.AIR || gid === -1, `genkan walkway (${gx},2,${gz}) must be AIR, got ${gid}`);
  }
}
// たたき (stone entry floor) under the walkway
assert.strictEqual(get(44, 1, 24), B.SMOOTH_STONE, `genkan たたき (44,1,24) must be SMOOTH_STONE, got ${get(44,1,24)}`);

// ── Facade identity: 校舎時計 + 校章 above the entrance, 国旗 on the pole ────
assert.strictEqual(get(44, 13, 26), B.SCHOOL_CLOCK, `SCHOOL_CLOCK expected at (44,13,26), got ${get(44,13,26)}`);
assert.strictEqual(get(44, 14, 26), B.SCHOOL_EMBLEM, `SCHOOL_EMBLEM expected at (44,14,26), got ${get(44,14,26)}`);
assert.strictEqual(get(36, 11, 33), B.FLAG, `FLAG expected at flag-pole top (36,11,33), got ${get(36,11,33)}`);
assert.strictEqual(get(36, 5, 33), B.SMOOTH_STONE, `flag pole (36,5,33) must be SMOOTH_STONE, got ${get(36,5,33)}`);
// 二宮金次郎 statue + 自販機
assert.strictEqual(get(38, 3, 29), B.CALCITE, `二宮金次郎 head (38,3,29) must be CALCITE, got ${get(38,3,29)}`);
assert.strictEqual(get(49, 2, 28), B.VENDING, `VENDING machine expected at (49,2,28), got ${get(49,2,28)}`);

// ── 廊下 authenticity: PLASTER wall, SCHOOL_FLOOR, sinks, notice boards ──────
// PLASTER re-skin on the z=20 corridor wall (sampled clear of doorways/markers)
for (const px of [18, 30, 42, 55, 67]) {
  assert.strictEqual(get(px, 3, 20), B.PLASTER, `corridor wall (${px},3,20) must be PLASTER, got ${get(px,3,20)}`);
}
// Doorways re-opened after the repaint (one per bay, sampled)
for (const doorX of [16, 27, 38, 50, 62, 73]) {
  const did = get(doorX, 2, 20);
  assert.ok(did === B.AIR || did === -1, `corridor doorway (${doorX},2,20) must stay AIR after PLASTER repaint, got ${did}`);
}
// SCHOOL_FLOOR down the corridor
assert.strictEqual(get(20, 1, 23), B.SCHOOL_FLOOR, `corridor floor (20,1,23) must be SCHOOL_FLOOR, got ${get(20,1,23)}`);
assert.strictEqual(get(70, 1, 23), B.SCHOOL_FLOOR, `corridor floor (70,1,23) must be SCHOOL_FLOOR, got ${get(70,1,23)}`);
// 手洗い場: >=6 SINK_UNIT blocks
const sinkCount = tally.get(B.SINK_UNIT) || 0;
assert.ok(sinkCount >= 6, `corridor should have >=6 SINK_UNIT blocks, got ${sinkCount}`);
// Sinks must NOT block any doorway egress (z=21 in front of doorway columns clear)
for (const doorX of [26, 27, 61, 62]) {
  const sid = get(doorX, 2, 21);
  assert.ok(sid === B.AIR || sid === -1, `doorway egress (${doorX},2,21) must be clear of sinks, got ${sid}`);
}
// NOTICE_BOARD pairs on the corridor wall + genkan notice
const noticeCount = tally.get(B.NOTICE_BOARD) || 0;
assert.ok(noticeCount >= 10, `expected >=10 NOTICE_BOARD blocks (corridor pairs + plaza gallery), got ${noticeCount}`);
// Trophy case near the east stair displays the 校章
assert.strictEqual(get(77, 3, 21), B.SCHOOL_EMBLEM, `trophy case (77,3,21) must show SCHOOL_EMBLEM, got ${get(77,3,21)}`);

// ── GREEN_BOARD upgrade: 旧給食室献立表 + 理科室 + 2F use the real 緑黒板 ────
let gfGreenBoard = 0, sciGreenBoard = 0, f2GreenBoard = 0;
for (let x = 58; x <= 67; x++) for (let y = 3; y <= 6; y++) if (get(x, y, 2) === B.GREEN_BOARD) gfGreenBoard++;
for (let x = 23; x <= 32; x++) for (let y = 3; y <= 6; y++) if (get(x, y, 2) === B.GREEN_BOARD) sciGreenBoard++;
for (let x = 12; x <= 21; x++) for (let y = g1 + 1; y <= g2 - 1; y++) if (get(x, y, 2) === B.GREEN_BOARD) f2GreenBoard++;
assert.ok(gfGreenBoard >= 8, `旧給食室 献立表 must be GREEN_BOARD (>=8 cells on z=2, x58..67), got ${gfGreenBoard}`);
assert.ok(sciGreenBoard >= 8, `理科室 blackboard must be GREEN_BOARD (>=8 cells), got ${sciGreenBoard}`);
assert.ok(f2GreenBoard >= 8, `2F classroom 1 blackboard must be GREEN_BOARD (>=8 cells), got ${f2GreenBoard}`);
// The cafe menu board is GREEN_BOARD since S3 (asserted above as bbFound)

// ── SASH_WINDOW upgrade: 2F bands + end walls; GF facade keeps GLASS ─────────
assert.ok((tally.get(B.SASH_WINDOW) || 0) >= 40, `expected >=40 SASH_WINDOW panes, got ${tally.get(B.SASH_WINDOW) || 0}`);
assert.strictEqual(get(12, 11, 26), B.SASH_WINDOW, `2F facade window (12,11,26) must be SASH_WINDOW, got ${get(12,11,26)}`);
assert.strictEqual(get(4, 4, 10), B.SASH_WINDOW, `west end-wall window (4,4,10) must be SASH_WINDOW, got ${get(4,4,10)}`);
assert.strictEqual(get(12, 4, 26), B.GLASS, `GF facade window (12,4,26) must stay GLASS, got ${get(12,4,26)}`);

// ── コミュニティー広場 (GF x34..43): floor, welcome board, desks, books ───────
assert.strictEqual(get(38, 1, 10), B.SCHOOL_FLOOR, `plaza floor (38,1,10) must be SCHOOL_FLOOR, got ${get(38,1,10)}`);
let plazaWelcome = 0;
for (let x = 35; x <= 42; x++) for (let y = 3; y <= 6; y++) if (get(x, y, 2) === B.GREEN_BOARD) plazaWelcome++;
assert.ok(plazaWelcome >= 8, `plaza welcome wall should be GREEN_BOARD (>=8 cells), got ${plazaWelcome}`);
let plazaDesks = 0, plazaChairs = 0;
for (let x = 34; x <= 43; x++)
  for (let z = 3; z <= 19; z++) {
    if (get(x, 2, z) === B.SCHOOL_DESK) plazaDesks++;
    if (get(x, 2, z) === B.SCHOOL_CHAIR) plazaChairs++;
  }
assert.ok(plazaDesks >= 8, `plaza should have >=8 SCHOOL_DESK blocks (広工大×町産木材), got ${plazaDesks}`);
assert.ok(plazaChairs >= 8, `plaza should have >=8 SCHOOL_CHAIR blocks, got ${plazaChairs}`);
assert.ok(get(35, 3, 3) === B.BOOKSHELF, `plaza reading corner (35,3,3) must be BOOKSHELF, got ${get(35,3,3)}`);
let plazaGallery = 0;
for (let z = 6; z <= 14; z++) for (let y = 3; y <= 4; y++) if (get(43, y, z) === B.NOTICE_BOARD) plazaGallery++;
assert.ok(plazaGallery >= 4, `plaza east wall should have a NOTICE_BOARD gallery (>=4), got ${plazaGallery}`);
// total SCHOOL_DESK across plaza + yard picnic sets
const schoolDeskTotal = tally.get(B.SCHOOL_DESK) || 0;
assert.ok(schoolDeskTotal >= 8, `expected >=8 SCHOOL_DESK blocks overall, got ${schoolDeskTotal}`);

// ── 体育館 (x64..84, z36..56) ────────────────────────────────────────────────
let gymFloorCount = 0;
for (let x = 65; x <= 83; x++)
  for (let z = 37; z <= 55; z++)
    if (get(x, 1, z) === B.GYM_FLOOR) gymFloorCount++;
assert.ok(gymFloorCount >= 280, `体育館 floor should have >=280 GYM_FLOOR cells, got ${gymFloorCount}`);
// Entrance (73..75, y2..4, z36) must be walk-in AIR
for (let ex = 73; ex <= 75; ex++)
  for (let ey = 2; ey <= 4; ey++) {
    const eid = get(ex, ey, 36);
    assert.ok(eid === B.AIR || eid === -1, `体育館入口 (${ex},${ey},36) must be AIR, got ${eid}`);
  }
// PLASTER walls + stepped roof ridge + stage + 跳び箱 + hoop
assert.strictEqual(get(64, 3, 46), B.SANDSTONE, `gym west mid-pillar (64,3,46) must be SANDSTONE, got ${get(64,3,46)}`);
assert.strictEqual(get(64, 3, 44), B.PLASTER, `gym west wall (64,3,44) must be PLASTER, got ${get(64,3,44)}`);
assert.strictEqual(get(74, 10, 46), B.SMOOTH_STONE, `gym roof ridge (74,10,46) must be SMOOTH_STONE, got ${get(74,10,46)}`);
assert.strictEqual(get(70, 2, 44), B.VAULT_BOX, `跳び箱 (70,2,44) must be VAULT_BOX, got ${get(70,2,44)}`);
assert.strictEqual(get(72, 1, 44), B.WHITE_WOOL, `着地マット (72,1,44) must be WHITE_WOOL, got ${get(72,1,44)}`);
assert.strictEqual(get(74, 3, 54), B.AIR, `gym stage front airspace (74,3,54) must be AIR, got ${get(74,3,54)}`);
assert.strictEqual(get(74, 2, 54), B.SPRUCE_PLANKS, `gym stage (74,2,54) must be SPRUCE_PLANKS, got ${get(74,2,54)}`);
assert.strictEqual(get(66, 4, 46), B.HAY, `basketball ring (66,4,46) must be HAY, got ${get(66,4,46)}`);
// 防球ネット relocated to x=86 (gym footprint must be net-free)
let netAt86 = 0, netInGym = 0;
for (let nz = 28; nz <= 52; nz++) {
  for (let ny = 3; ny <= 5; ny++) {
    if (get(86, ny, nz) === B.GREEN_WOOL) netAt86++;
    if (get(72, ny, nz) === B.GREEN_WOOL) netInGym++;
  }
}
assert.ok(netAt86 >= 50, `防球ネット should stand at x=86, got ${netAt86} GREEN_WOOL cells`);
assert.strictEqual(netInGym, 0, `old 防球ネット at x=72 must be gone (gym site), got ${netInGym}`);
// 渡り廊下 gravel path between school and gym
assert.strictEqual(get(62, 0, 37), B.GRAVEL, `渡り廊下 gravel (62,0,37) expected, got ${get(62,0,37)}`);

// ── 校庭: 桜並木 + playground + picnic sets + compost + herbs + cones ─────────
const sakuraCount = tally.get(B.SAKURA_LEAVES) || 0;
assert.ok(sakuraCount >= 100, `桜並木 should have >=100 SAKURA_LEAVES, got ${sakuraCount}`);
assert.strictEqual(get(16, 1, 54), B.OAK_LOG, `桜 trunk (16,1,54) must be OAK_LOG, got ${get(16,1,54)}`);
// 鉄棒 3-height bars
assert.strictEqual(get(11, 2, 38), B.SMOOTH_STONE, `鉄棒 low bar (11,2,38), got ${get(11,2,38)}`);
assert.strictEqual(get(13, 3, 38), B.SMOOTH_STONE, `鉄棒 mid bar (13,3,38), got ${get(13,3,38)}`);
assert.strictEqual(get(15, 4, 38), B.SMOOTH_STONE, `鉄棒 high bar (15,4,38), got ${get(15,4,38)}`);
// うんてい beam + すべり台 slide
assert.strictEqual(get(21, 4, 44), B.BIRCH_PLANKS, `うんてい beam (21,4,44), got ${get(21,4,44)}`);
assert.strictEqual(get(13, 2, 48), B.BIRCH_PLANKS, `すべり台 slide (13,2,48), got ${get(13,2,48)}`);
// 校庭ランチ picnic desk sets (SCHOOL_DESK + parasol)
for (const [yx, yz] of [[30, 36], [54, 46], [20, 30]]) {
  assert.strictEqual(get(yx, 1, yz), B.SCHOOL_DESK, `yard picnic desk (${yx},1,${yz}) must be SCHOOL_DESK, got ${get(yx,1,yz)}`);
  assert.strictEqual(get(yx, 4, yz), B.WHITE_WOOL, `parasol canopy (${yx},4,${yz}) must be WHITE_WOOL, got ${get(yx,4,yz)}`);
}
// ぐるぐるコンポスト + herb bed + exterior bench + parking cones
assert.strictEqual(get(28, 1, 33), B.COMPOST, `ぐるぐるコンポスト (28,1,33) expected, got ${get(28,1,33)}`);
assert.strictEqual(get(48, 1, 32), B.DIRT, `herb bed (48,1,32) must be DIRT, got ${get(48,1,32)}`);
let herbCount = 0;
for (let hx = 46; hx <= 52; hx++)
  for (const hz of [32, 33])
    if (get(hx, 2, hz) === B.GREEN_WOOL || get(hx, 2, hz) === B.OAK_LEAVES) herbCount++;
assert.ok(herbCount >= 10, `herb bed should carry >=10 herb blocks, got ${herbCount}`);
assert.strictEqual(get(39, 1, 28), B.SPRUCE_PLANKS, `exterior bench (39,1,28) must be SPRUCE_PLANKS, got ${get(39,1,28)}`);
for (const cxn of [58, 60, 62]) {
  assert.strictEqual(get(cxn, 1, 30), B.CALCITE, `parking cone (${cxn},1,30) must be CALCITE, got ${get(cxn,1,30)}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// S3 — パン屋v3 (hero wall / price cards / yeast shelf) + South in North v2 +
//      旧給食室 (old school-lunch kitchen)
// ══════════════════════════════════════════════════════════════════════════════

// ── ヒーロー面陳列: SLAT_SHELF wall of bread at z=12 behind the baker ─────────
const slatTotal = tally.get(B.SLAT_SHELF) || 0;
assert.ok(slatTotal >= 12, `expected >=12 SLAT_SHELF blocks (hero wall banks + cooling rack), got ${slatTotal}`);
let heroProducts = 0;
const HERO_IDS = [B.CAMPAGNE, B.BAGUETTE, B.PAIN_DE_MIE, B.BASKET_BREAD];
for (let x = 45; x <= 56; x++)
  for (const hy of [4, 6])
    if (HERO_IDS.includes(get(x, hy, 12))) heroProducts++;
assert.ok(heroProducts >= 10, `hero wall (z=12, y4/y6) should display >=10 products, got ${heroProducts}`);
// The baker's walk gap through the hero wall (x50..52, z=12, body space y2..4) stays open
for (let gx = 50; gx <= 52; gx++)
  for (let gy = 2; gy <= 4; gy++) {
    const gid = get(gx, gy, 12);
    assert.ok(gid === B.AIR || gid === -1 || gid === B.LANTERN,
      `hero-wall walk gap (${gx},${gy},12) must stay passable, got ${gid}`);
  }

// ── 見せる工房: GLASS window in the z=11 partition (46..48, y3..4) ────────────
let workshopWindow = 0;
for (let x = 46; x <= 48; x++)
  for (const wy of [3, 4])
    if (get(x, wy, 11) === B.GLASS) workshopWindow++;
assert.ok(workshopWindow >= 4, `見せる工房 window: expected >=4 GLASS panes at (46..48, y3..4, z11), got ${workshopWindow}`);
// GREEN_BOARD menu on the partition east of the passage
let bakeryMenuBoard = 0;
for (let x = 52; x <= 55; x++)
  for (const my2 of [3, 4])
    if (get(x, my2, 11) === B.GREEN_BOARD) bakeryMenuBoard++;
assert.ok(bakeryMenuBoard >= 6, `bakery GREEN_BOARD menu expected at (52..55, y3..4, z11), got ${bakeryMenuBoard}`);

// ── かご & 値札: BASKET_BREAD + PRICE_CARD dressing ───────────────────────────
const basketTotal = tally.get(B.BASKET_BREAD) || 0;
assert.ok(basketTotal >= 6, `expected >=6 BASKET_BREAD blocks (hero wall + counter + floor baskets), got ${basketTotal}`);
const priceCardTotal = tally.get(B.PRICE_CARD) || 0;
assert.ok(priceCardTotal >= 6, `expected >=6 PRICE_CARD blocks (case interiors + case tops), got ${priceCardTotal}`);

// ── パン屋 sales floor is bright SCHOOL_FLOOR ─────────────────────────────────
assert.strictEqual(get(50, 1, 16), B.SCHOOL_FLOOR, `bakery sales floor (50,1,16) must be SCHOOL_FLOOR, got ${get(50,1,16)}`);

// ── 工房: STAINLESS prep table + 一升パン + cooling loaves ────────────────────
assert.strictEqual(get(54, 2, 7), B.ISSHOU_PAN, `一升パン expected at (54,2,7), got ${get(54,2,7)}`);
assert.strictEqual(get(48, 2, 4), B.STAINLESS, `workshop prep table (48,2,4) must be STAINLESS, got ${get(48,2,4)}`);
let coolingLoaves = 0;
for (let x = 47; x <= 49; x++) if (get(x, 4, 8) === B.PAIN_DE_MIE) coolingLoaves++;
assert.ok(coolingLoaves >= 2, `cooling rack should carry >=2 PAIN_DE_MIE loaves at (47..49,4,8), got ${coolingLoaves}`);

// ── South in North v2: counter line-up + school desks + SNS tripod ────────────
assert.strictEqual(get(13, 2, 19), B.COFFEE_KIT, `cafe counter (13,2,19) must be COFFEE_KIT, got ${get(13,2,19)}`);
assert.strictEqual(get(15, 2, 19), B.CURRY_POT, `cafe counter (15,2,19) must be CURRY_POT, got ${get(15,2,19)}`);
assert.strictEqual(get(19, 2, 19), B.QUICHE, `cafe counter (19,2,19) must be QUICHE, got ${get(19,2,19)}`);
assert.strictEqual(get(20, 2, 19), B.MENU_STAND, `cafe counter (20,2,19) must be MENU_STAND, got ${get(20,2,19)}`);
let cafeDesks = 0, cafeChairs = 0;
for (let x = 12; x <= 21; x++)
  for (let z = 3; z <= 19; z++) {
    if (get(x, 2, z) === B.SCHOOL_DESK) cafeDesks++;
    if (get(x, 2, z) === B.SCHOOL_CHAIR) cafeChairs++;
  }
assert.ok(cafeDesks >= 4, `cafe should seat guests at >=4 SCHOOL_DESK tables, got ${cafeDesks}`);
assert.ok(cafeChairs >= 8, `cafe should have >=8 SCHOOL_CHAIR seats, got ${cafeChairs}`);
assert.strictEqual(get(13, 3, 4), B.MENU_STAND, `SNS tripod head (13,3,4) must be MENU_STAND, got ${get(13,3,4)}`);
assert.strictEqual(get(13, 2, 4), B.SPRUCE_LOG, `SNS tripod legs (13,2,4) must be SPRUCE_LOG, got ${get(13,2,4)}`);

// ── 旧給食室 (x58..67): STAINLESS lines, pots, ovens, sink, hatch ─────────────
let kitchenStainless = 0;
for (let x = 58; x <= 67; x++)
  for (let y = 2; y <= 4; y++)
    for (let z = 2; z <= 20; z++)
      if (get(x, y, z) === B.STAINLESS) kitchenStainless++;
assert.ok(kitchenStainless >= 10, `旧給食室 should have >=10 STAINLESS blocks (prep lines + hatch), got ${kitchenStainless}`);
assert.ok(has(B.CURRY_POT), 'expected CURRY_POT present (cafe counter + 給食室 line)');
assert.ok(has(B.QUICHE), 'expected QUICHE present (cafe counter + 給食室 line)');
assert.strictEqual(get(60, 2, 5), B.SOUP_POT, `給食室 SOUP_POT expected at (60,2,5), got ${get(60,2,5)}`);
assert.strictEqual(get(63, 2, 5), B.CURRY_POT, `給食室 CURRY_POT expected at (63,2,5), got ${get(63,2,5)}`);
assert.strictEqual(get(61, 2, 9), B.QUICHE, `給食室 QUICHE expected at (61,2,9), got ${get(61,2,9)}`);
assert.strictEqual(get(64, 2, 9), B.COOKIE_TRAY, `給食室 COOKIE_TRAY expected at (64,2,9), got ${get(64,2,9)}`);
assert.strictEqual(get(60, 3, 2), B.FURNACE, `給食室 oven stack (60,3,2) must be FURNACE, got ${get(60,3,2)}`);
assert.strictEqual(get(66, 2, 3), B.WATER, `給食室 sink water (66,2,3) expected, got ${get(66,2,3)}`);
assert.strictEqual(get(60, 1, 10), B.SMOOTH_STONE, `給食室 tile floor (60,1,10) must be SMOOTH_STONE, got ${get(60,1,10)}`);
assert.strictEqual(get(63, 2, 20), B.STAINLESS, `配膳口 hatch (63,2,20) must be STAINLESS, got ${get(63,2,20)}`);
assert.strictEqual(get(66, 4, 20), B.NOTICE_BOARD, `給食室 corridor sign (66,4,20) must be NOTICE_BOARD, got ${get(66,4,20)}`);
// Kitchen doorway columns (x61..62) stay AIR despite the hatch beside them
for (const kx of [61, 62]) {
  const kid = get(kx, 2, 20);
  assert.ok(kid === B.AIR || kid === -1, `給食室 doorway (${kx},2,20) must stay AIR, got ${kid}`);
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
console.log(`  FIX C: bakery GLASS=${bakeryGlassCount}, counter LANTERNs=${bakeryCounterLanternCount}, BRAND_GREEN band=${bakeryTealCount}`);
console.log(`  S3 パン屋v3: slat=${slatTotal}, hero products=${heroProducts}, baskets=${basketTotal}, price cards=${priceCardTotal}, 工房窓=${workshopWindow}, menu board=${bakeryMenuBoard}, yeast=${jarFeature}`);
console.log(`  S3 cafe/給食室: cafe desks=${cafeDesks}, chairs=${cafeChairs}, kitchen stainless=${kitchenStainless}, cooling loaves=${coolingLoaves}`);
console.log(`  BREAD redesign: BREAD blocks in sales+corridor=${bakeryBreadCount}, HAY in sales zone=${salesHayCount}`);
console.log(`  S2 校舎: 下駄箱=${shoeCubbyCount}, 手洗=${sinkCount}, 掲示=${noticeCount}, sash=${tally.get(B.SASH_WINDOW) || 0}, 緑黒板 gf/sci/2f=${gfGreenBoard}/${sciGreenBoard}/${f2GreenBoard}`);
console.log(`  S2 広場: 机=${plazaDesks}, 椅子=${plazaChairs}, ようこそ板=${plazaWelcome}, ギャラリー=${plazaGallery}`);
console.log(`  S2 体育館/校庭: 床=${gymFloorCount}, ネット@86=${netAt86}, 桜=${sakuraCount}, ハーブ=${herbCount}, 机計=${schoolDeskTotal}`);
