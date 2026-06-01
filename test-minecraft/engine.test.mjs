// Headless logic tests for the Voxel Craft engine (terrain, mesher, raycast,
// edits). Run with:  node --import ./register.mjs ./engine.test.mjs
import assert from 'node:assert';
import { Noise } from '../public/minecraft/noise.js';
import { World, CHUNK, HEIGHT, SEA_LEVEL } from '../public/minecraft/world.js';

const AIR = 0, STONE = 3, WOOD = 5, LEAVES = 6, BEDROCK = 8;
let n = 0;
const check = (name, cond) => { assert.ok(cond, name); n++; console.log('  ✓ ' + name); };

console.log('Voxel Craft engine tests');

// --- noise ---------------------------------------------------------------
const a = new Noise(123), b = new Noise(123), c = new Noise(124);
check('noise deterministic for same seed', a.noise3(1.2, 3.4, 5.6) === b.noise3(1.2, 3.4, 5.6));
let diff = false;
for (let i = 0; i < 50 && !diff; i++) if (a.noise3(i * 0.3, 0, 0) !== c.noise3(i * 0.3, 0, 0)) diff = true;
check('different seed yields different noise', diff);
let inRange = true;
for (let i = 0; i < 200; i++) { const v = a.fbm2(i * 0.11, i * 0.07, 4); if (v < -1.001 || v > 1.001) inRange = false; }
check('fbm2 stays within [-1,1]', inRange);

// --- terrain -------------------------------------------------------------
const w1 = new World(777), w2 = new World(777), w3 = new World(888);
let hOk = true;
for (let i = 0; i < 100; i++) { const h = w1.heightAt(i * 3 - 50, i * 2 + 10); if (h < 1 || h > HEIGHT - 6 || h !== w2.heightAt(i * 3 - 50, i * 2 + 10)) hOk = false; }
check('heightAt deterministic and within bounds', hOk);

let same = true, anyDiff = false;
for (let i = 0; i < 400; i++) {
  const x = (i * 7) % 64 - 16, z = (i * 13) % 64 - 16, y = (i * 5) % HEIGHT;
  const v1 = w1.getBlock(x, y, z);
  if (v1 !== w2.getBlock(x, y, z)) same = false;
  if (v1 !== w3.getBlock(x, y, z)) anyDiff = true;
}
check('world generation deterministic for same seed', same);
check('different seed produces different world', anyDiff);

let bedrockOk = true;
for (let x = -8; x <= 8; x++) for (let z = -8; z <= 8; z++) if (w1.getBlock(x, 0, z) !== BEDROCK) bedrockOk = false;
check('bedrock floor at y=0', bedrockOk);

check('out-of-bounds below world is AIR', w1.getBlock(5, -1, 5) === AIR);
check('out-of-bounds above world is AIR', w1.getBlock(5, HEIGHT, 5) === AIR);

// caves exist: at least one interior voxel carved to AIR under the surface
let caveFound = false;
for (let i = 0; i < 300 && !caveFound; i++) {
  const x = (i * 11) % 120 - 60, z = (i * 17) % 120 - 60;
  const h = w1.heightAt(x, z);
  for (let y = 3; y < h - 2; y++) if (w1.getBlock(x, y, z) === AIR) { caveFound = true; break; }
}
check('cave carving produces underground air', caveFound);

// trees: scan a few chunks for wood/leaves
let treeFound = false;
for (let cx = 0; cx < 6 && !treeFound; cx++)
  for (let cz = 0; cz < 6 && !treeFound; cz++) {
    const data = w1.ensureData(cx, cz).data;
    for (let k = 0; k < data.length; k++) if (data[k] === WOOD || data[k] === LEAVES) { treeFound = true; break; }
  }
check('trees generate (wood/leaves present)', treeFound);

// --- edits ---------------------------------------------------------------
w1.setBlock(3, 30, 3, STONE);
check('setBlock then getBlock returns the new id', w1.getBlock(3, 30, 3) === STONE);
check('edit is recorded in the edits map', w1.edits.get('3,30,3') === STONE);
w1.setBlock(3, 0, 3, STONE); // y<1 protected
check('setBlock below y=1 is ignored (bedrock protected)', w1.getBlock(3, 0, 3) === BEDROCK);

// --- raycast -------------------------------------------------------------
const downHit = w1.raycast({ x: 8.5, y: HEIGHT, z: 8.5 }, { x: 0, y: -1, z: 0 }, 80);
check('raycast straight down hits a solid block', !!downHit);
check('downward hit normal points up', downHit && downHit.normal[1] === 1);
check('place position is one above the hit block', downHit && downHit.place[1] === downHit.block[1] + 1);
const skyHit = w1.raycast({ x: 8.5, y: HEIGHT - 2, z: 8.5 }, { x: 0, y: 1, z: 0 }, 40);
check('raycast into open sky returns null', skyHit === null);

// --- mesher --------------------------------------------------------------
const g = w1.buildGeometry(0, 0);
check('mesher emits opaque geometry for a surface chunk', g.opaque.pos.length > 0);
check('positions form whole triangles', g.opaque.pos.length % 9 === 0);
check('uv count matches vertex count', g.opaque.uv.length === (g.opaque.pos.length / 3) * 2);
check('color count matches position count', g.opaque.col.length === g.opaque.pos.length);
let colOk = true;
for (let k = 0; k < g.opaque.col.length; k++) if (g.opaque.col[k] < 0 || g.opaque.col[k] > 1.001) colOk = false;
check('shade/AO colors within [0,1]', colOk);
const g2 = w2.buildGeometry(0, 0);
check('mesher deterministic for same seed', g2.opaque.pos.length === g.opaque.pos.length);

console.log(`\nAll ${n} engine assertions passed.`);
