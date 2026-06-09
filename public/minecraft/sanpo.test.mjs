// sanpo.test.mjs — Node test for the 南方さんぽ PURE latching logic.
// No DOM stubs needed: createSanpoLogic never touches document.
// Run: node sanpo.test.mjs
import assert from 'node:assert';
import { createSanpoLogic, SANPO_SPOTS } from './sanpo.js';

let passed = 0;
function check(name, cond) {
  assert.ok(cond, name);
  passed++;
  console.log('ok -', name);
}

// --- spot table sanity -------------------------------------------------------
check('6 stroll spots defined', SANPO_SPOTS.length === 6);
const ids = SANPO_SPOTS.map((s) => s.id);
for (const id of ['entrance', 'plaza', 'library', 'music', 'gym', 'shrine']) {
  check(`spot '${id}' present`, ids.includes(id));
}
check('music room requires 2F altitude (minY set)',
  SANPO_SPOTS.find((s) => s.id === 'music').minY === 36);

// --- initial state -----------------------------------------------------------
let completes = 0;
const sanpo = createSanpoLogic({ onComplete: () => { completes++; } });
check('starts with 0 visited', sanpo.count() === 0);
check('starts not done', sanpo.done === false);

// --- far away: nothing latches -------------------------------------------------
sanpo.update({ x: 1000, y: 31, z: 1000 });
check('far position latches nothing', sanpo.count() === 0);

// --- latch + monotonic latch ---------------------------------------------------
sanpo.update({ x: 8, y: 31, z: -26 });        // 昇降口
check('standing at 昇降口 latches it', sanpo.count() === 1 && sanpo.isLatched(0));
sanpo.update({ x: 1000, y: 31, z: 1000 });    // walk far away
check('leaving the spot keeps it latched', sanpo.count() === 1 && sanpo.isLatched(0));

// --- radius edge ---------------------------------------------------------------
sanpo.update({ x: 2.5 + 4.5, y: 31, z: -39 }); // 4.5 > r=4 from 広場
check('just outside radius does not latch', sanpo.count() === 1);
sanpo.update({ x: 2.5 + 3.9, y: 31, z: -39 }); // 3.9 <= 4
check('inside radius latches 広場', sanpo.count() === 2);

// --- 2F altitude gate (music room) ----------------------------------------------
sanpo.update({ x: -8.5, y: 31, z: -39 });     // ground floor, under the music room
check('music room NOT latched from 1F (y too low)',
  !sanpo.isLatched(SANPO_SPOTS.findIndex((s) => s.id === 'music')));
sanpo.update({ x: -8.5, y: 37, z: -39 });     // up on the 2nd floor
check('music room latched from 2F (y>36)',
  sanpo.isLatched(SANPO_SPOTS.findIndex((s) => s.id === 'music')));

// --- complete remaining spots → single onComplete --------------------------------
check('not complete before all spots', completes === 0 && sanpo.done === false);
sanpo.update({ x: 37.5, y: 31, z: -39 });     // 図書室
sanpo.update({ x: 38, y: 31, z: -4 });        // 体育館
check('5/6: still not complete', completes === 0 && sanpo.done === false);
sanpo.update({ x: 64, y: 31, z: -24 });       // 神社 — last one
check('all spots visited -> done', sanpo.done === true);
check('onComplete fired exactly once', completes === 1);

// extra updates (re-visits) must not re-fire onComplete
sanpo.update({ x: 64, y: 31, z: -24 });
sanpo.update({ x: 8, y: 31, z: -26 });
check('onComplete still fired only once after re-visits', completes === 1);

// --- credit(): scripted latch by id ---------------------------------------------
let c2done = 0;
const s2 = createSanpoLogic({ onComplete: () => { c2done++; } });
check('credit latches a spot by id', s2.credit('library') === true && s2.count() === 1);
s2.credit('library'); // double credit is harmless
check('double credit does not double-count', s2.count() === 1);
check('unknown credit id returns false, goes to extras',
  s2.credit('yard_lunch') === false && s2.extras.has('yard_lunch'));
check('extras never affect completion', s2.done === false && c2done === 0);
// credit all the rest → completes once
for (const id of ['entrance', 'plaza', 'music', 'gym', 'shrine']) s2.credit(id);
check('crediting every spot completes once', s2.done === true && c2done === 1);

console.log(`\nAll ${passed} assertions passed.`);
