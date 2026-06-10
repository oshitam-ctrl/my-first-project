// terrain.test.mjs — heightAt/surfaceAt の純ロジック検証。Run: node terrain.test.mjs
import assert from 'node:assert';
import { heightAt, surfaceAt } from './terrain.js';
import {
  SCHOOL, FLOOR_Y, YARD_Y, WATER_Y, SPAWN, BRIDGE, PADDIES, riverZ, SHRINE,
} from './layout.js';

let passed = 0;
function check(name, cond) {
  assert.ok(cond, name);
  passed++;
  console.log('ok -', name);
}

// --- 校舎の床はフラット ---------------------------------------------------------
check('school floor is flat FLOOR_Y', heightAt(0, -40) === FLOOR_Y);
check('school floor at bakery', heightAt(-14, -42) === FLOOR_Y);

// --- 校庭は整地されている --------------------------------------------------------
for (const [x, z] of [[0, 0], [-30, -8], [34, 0], [10, -20]]) {
  check(`yard flat near (${x},${z})`, Math.abs(heightAt(x, z) - YARD_Y) < 0.05);
}

// --- 川は水面より深く彫れている / 土手は水面より上 -------------------------------
// x=10（橋）はデッキで持ち上がるので除外して検証
for (const x of [-80, -20, 40, 60, 110]) {
  const zc = riverZ(x);
  check(`river bed below water at x=${x}`, heightAt(x, zc) < WATER_Y - 0.5);
  check(`river bank above water at x=${x}`, heightAt(x, zc - 14) > WATER_Y);
}

// --- 橋のデッキは水面より上（渡れる） --------------------------------------------
check('bridge deck above water', heightAt(BRIDGE.x, BRIDGE.z) > WATER_Y + 0.5);
check('bridge approach reachable', Math.abs(heightAt(BRIDGE.x, BRIDGE.z + 8) - heightAt(BRIDGE.x, BRIDGE.z + 12)) < 1.0);

// --- 棚田は段の高さに整地 --------------------------------------------------------
for (const p of PADDIES) {
  const cx = (p.minX + p.maxX) / 2, cz = (p.minZ + p.maxZ) / 2;
  check(`paddy flat at (${cx},${cz})`, Math.abs(heightAt(cx, cz) - p.y) < 0.05);
}

// --- 外周は山（プレイアブル境界の自然な壁） ---------------------------------------
check('mountains at north edge', heightAt(0, -150) > 12);
check('mountains at west edge', heightAt(-150, -20) > 12);
check('south valley stays open (bus road)', heightAt(14, 108) < 8);

// --- 神社の丘は登り --------------------------------------------------------------
check('shrine hill is elevated', heightAt(SHRINE.x, SHRINE.z) > heightAt(0, 0) + 5);

// --- 連続性: 隣接サンプルが急に飛ばない（橋・校舎の縁以外） ------------------------
let maxJump = 0;
for (let x = -140; x <= 140; x += 2.5) {
  for (let z = -140; z <= 140; z += 2.5) {
    if (Math.abs(x - BRIDGE.x) < 6 && Math.abs(z - BRIDGE.z) < 12) continue;
    if (x > SCHOOL.minX - 3 && x < SCHOOL.maxX + 3 && z > SCHOOL.minZ - 3 && z < SCHOOL.maxZ + 3) continue;
    const d = Math.abs(heightAt(x, z) - heightAt(x + 2.5, z));
    if (d > maxJump) maxJump = d;
  }
}
check(`terrain continuous (max 2.5m-step jump ${maxJump.toFixed(2)} < 4.5)`, maxJump < 4.5);

// --- surfaceAt ------------------------------------------------------------------
check('spawn is on the path', surfaceAt(SPAWN.x, SPAWN.z) === 'path');
check('school interior is floor', surfaceAt(0, -40) === 'floor');
check('river center is water (away from bridge)', surfaceAt(40, riverZ(40)) === 'water');
check('yard center is yard', surfaceAt(20, -10) === 'yard');
check('open meadow is grass', surfaceAt(-80, -40) === 'grass');

console.log(`\n${passed} checks passed`);
