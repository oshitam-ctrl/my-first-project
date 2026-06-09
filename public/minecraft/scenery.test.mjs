// Node test for world.js S4 周辺地域 完全再現v2 scenery.
// Instantiates the real World (deterministic seed) and asserts the S4 features
// generate at their fixed world coordinates. Run: node scenery.test.mjs
import assert from 'node:assert';
import { World, SEA_LEVEL } from './world.js';

// block ids (must match world.js LB / blocks.js)
const B = {
  AIR: 0, OAK_LOG: 5, WATER: 7, COBBLE: 10, BRICK: 13, SPRUCE_LOG: 25,
  SMOOTH_STONE: 41, CALCITE: 46, BIRCH_PLANKS: 52, WHEAT_CROP: 53,
  STONE_BRICKS: 29,
  NOTICE_BOARD: 74, SAKURA_LEAVES: 77, CEDAR_LOG: 78, CEDAR_LEAVES: 79,
  VENDING: 80, RICE: 81, TIN_ROOF: 82, KAWARA: 83, GUARD_RAIL: 99,
};

// constants mirrored from world.js (not exported)
const VFLOOR = 29;
const ROAD_X = -52, DRIVE_Z = 24, BUS_X = ROAD_X + 4, BUS_Z = DRIVE_Z - 8;
const SHRINE_X = 64, SHRINE_Z = -30;
const CC_X = -44, CC_Z = -70;
const DRIVE_X0 = ROAD_X + 3;
const riverCentreX = (wz) => Math.round(-18 + 4 * Math.sin(wz * 0.055));

const w = new World(); // default seed 20260530 — same as the game
const get = (x, y, z) => w.getBlock(x, y, z);

let pass = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); pass++; };

// ── 1) 杉の里山: CEDAR trees on the valley rim, 8+ tall, narrow canopy ──────
{
  // Scan a rim band (dist 82..140 from valley centre (8,−12)) for cedar trunks.
  let logs = 0, leaves = 0, tallest = 0;
  for (let wx = -24; wx <= 40; wx += 2) {
    for (let wz = -136; wz <= -100; wz += 2) {
      for (let y = SEA_LEVEL; y < 60; y++) {
        const id = get(wx, y, wz);
        if (id === B.CEDAR_LOG) logs++;
        else if (id === B.CEDAR_LEAVES) leaves++;
      }
      // measure trunk height of any cedar column
      let run = 0, best = 0;
      for (let y = SEA_LEVEL; y < 60; y++) {
        if (get(wx, y, wz) === B.CEDAR_LOG) { run++; best = Math.max(best, run); }
        else run = 0;
      }
      tallest = Math.max(tallest, best);
    }
  }
  ok(logs > 0, 'rim band has CEDAR_LOG trunks (found ' + logs + ')');
  ok(leaves > 0, 'rim band has CEDAR_LEAVES canopy (found ' + leaves + ')');
  ok(tallest >= 8, 'cedar trunks are 8+ tall (tallest run ' + tallest + ')');
  console.log(`  cedar: logs=${logs} leaves=${leaves} tallest_trunk=${tallest}`);
}

// ── 2) 田んぼ: scenic paddies use RICE; the QUEST plot keeps WHEAT_CROP ─────
{
  let rice = 0, wheat = 0;
  for (let wx = -30; wx <= 50; wx++) {
    for (let wz = 30; wz <= 56; wz++) {
      const id = get(wx, VFLOOR, wz);
      if (id === B.RICE) rice++;
      else if (id === B.WHEAT_CROP) wheat++;
    }
  }
  ok(rice > 30, 'scenic paddies grow RICE (found ' + rice + ')');
  ok(wheat === 0, 'no WHEAT_CROP left in scenic paddies (found ' + wheat + ')');
  // Quest harvest field (landmark, world x −8..0, z −8/−4/0 rows at y=30)
  let questWheat = 0;
  for (const qz of [-8, -4, 0]) {
    for (let qx = -8; qx <= 0; qx++) if (get(qx, 30, qz) === B.WHEAT_CROP) questWheat++;
  }
  ok(questWheat >= 9, 'QUEST harvest field still has WHEAT_CROP rows (found ' + questWheat + ')');
  console.log(`  paddies: rice=${rice} scenic_wheat=${wheat} quest_wheat=${questWheat}`);
}

// ── 3) 道路: GUARD_RAIL posts on the east shoulder ──────────────────────────
{
  let rails = 0;
  for (let wz = -60; wz <= 40; wz++) {
    if (get(ROAD_X + 3, VFLOOR + 1, wz) === B.GUARD_RAIL) rails++;
  }
  ok(rails >= 40, 'east shoulder has guard-rail posts (found ' + rails + ')');
  ok(get(ROAD_X + 3, VFLOOR + 1, -50) === B.GUARD_RAIL, 'rail post at z=−50');
  ok(get(ROAD_X + 3, VFLOOR + 1, -49) !== B.GUARD_RAIL, 'odd z=−49 has no post (every 2nd cell)');
  ok(get(ROAD_X + 3, VFLOOR + 1, DRIVE_Z) !== B.GUARD_RAIL, 'drive junction skipped');
  ok(get(ROAD_X + 3, VFLOOR + 1, BUS_Z) !== B.GUARD_RAIL, 'bus stop skipped');
  console.log(`  guard rail: posts=${rails}`);
}

// ── 4) バス停 v2: VENDING + NOTICE_BOARD timetable + BIRCH bench ────────────
{
  ok(get(BUS_X + 2, VFLOOR + 1, BUS_Z) === B.VENDING &&
     get(BUS_X + 2, VFLOOR + 2, BUS_Z) === B.VENDING, 'bus stop vending machine (2 tall)');
  ok(get(BUS_X - 1, VFLOOR + 2, BUS_Z) === B.NOTICE_BOARD, 'timetable NOTICE_BOARD on pole');
  ok(get(BUS_X, VFLOOR + 1, BUS_Z) === B.BIRCH_PLANKS, 'bench is BIRCH_PLANKS');
}

// ── 5) 農家 v2: roofs are TIN_ROOF or KAWARA (no BRICK) ─────────────────────
{
  // Of the 5 VALLEY_HOUSES, only these 3 pass world.js's guards and generate:
  // (50,−50) is inside the exclusion box; (−68,−80) has valleyFactor < 0.5.
  const houses = [[-65, -35], [-62, 50], [55, 45]];
  let tin = 0, kawara = 0;
  for (const [hx, hz] of houses) {
    const roof = get(hx, VFLOOR + 5, hz); // ridge cap
    ok(roof === B.TIN_ROOF || roof === B.KAWARA,
       `farmhouse (${hx},${hz}) roof is tin/kawara (got ${roof})`);
    if (roof === B.TIN_ROOF) tin++; else kawara++;
    assert.notStrictEqual(roof, B.BRICK, 'no BRICK roofs left');
  }
  console.log(`  farmhouse roofs: tin=${tin} kawara=${kawara}`);
}

// ── 6) 神社 v2: KAWARA roof + 手水舎 + 狛犬 ──────────────────────────────────
{
  const g = VFLOOR + 3;
  ok(get(SHRINE_X, g + 4, SHRINE_Z) === B.KAWARA, 'shrine roof tier 1 is KAWARA');
  ok(get(SHRINE_X, g + 5, SHRINE_Z) === B.KAWARA, 'shrine roof tier 2 is KAWARA');
  ok(get(SHRINE_X, g + 6, SHRINE_Z) === B.KAWARA, 'shrine ridge cap is KAWARA');
  ok(get(SHRINE_X + 3, g + 1, SHRINE_Z + 4) === B.CALCITE &&
     get(SHRINE_X + 3, g + 2, SHRINE_Z + 4) === B.WATER, '手水舎 CALCITE basin + WATER');
  ok(get(SHRINE_X - 2, g + 1, SHRINE_Z + 6) === B.SMOOTH_STONE &&
     get(SHRINE_X - 2, g + 2, SHRINE_Z + 6) === B.SMOOTH_STONE &&
     get(SHRINE_X + 2, g + 1, SHRINE_Z + 6) === B.SMOOTH_STONE &&
     get(SHRINE_X + 2, g + 2, SHRINE_Z + 6) === B.SMOOTH_STONE, '狛犬 pillars flank approach');
}

// ── 7) 川: COBBLE stepping stones, AIR kept clear above ─────────────────────
// (At the spec's z −44..−40 the river is inside the exclusion box and never
// carved, so the crossing sits on the nearest stretch north of it: z −60..−56.)
{
  let stones = 0;
  for (let wz = -60; wz <= -56; wz++) {
    const cx = riverCentreX(wz);
    for (let wx = cx - 1; wx <= cx + 1; wx++) {
      const below = get(wx, VFLOOR - 1, wz);
      if (((wx + wz) & 1) === 0) {
        ok(below === B.COBBLE, `stepping stone at (${wx},${wz})`);
        stones++;
      } else {
        ok(below === B.WATER, `water between stones at (${wx},${wz})`);
      }
      ok(get(wx, VFLOOR, wz) === B.AIR && get(wx, VFLOOR + 1, wz) === B.AIR,
         `air kept clear above river cell (${wx},${wz})`);
    }
  }
  console.log(`  stepping stones: ${stones}`);
}

// ── 8) ドライブ桜: small sakura on drive shoulders (z = DRIVE_Z ± 3) ────────
{
  let trees = 0;
  for (let tx = DRIVE_X0 + 1; tx <= -41; tx += 7) {
    for (const sdz of [-3, 3]) {
      const tz = DRIVE_Z + sdz;
      ok(get(tx, VFLOOR + 1, tz) === B.OAK_LOG && get(tx, VFLOOR + 2, tz) === B.OAK_LOG,
         `sakura trunk at (${tx},${tz})`);
      ok(get(tx, VFLOOR + 3, tz) === B.SAKURA_LEAVES, `sakura canopy at (${tx},${tz})`);
      trees++;
    }
  }
  ok(trees >= 4, 'at least 4 drive sakura trees (found ' + trees + ')');
  console.log(`  drive sakura: trees=${trees}`);
}

// ── 9) 集会所: VENDING at the community-center parking edge ─────────────────
{
  ok(get(CC_X + 4, VFLOOR + 1, CC_Z + 4) === B.VENDING &&
     get(CC_X + 4, VFLOOR + 2, CC_Z + 4) === B.VENDING, 'community-center vending (2 tall)');
}

console.log(`scenery.test.mjs OK — ${pass} assertions passed`);
