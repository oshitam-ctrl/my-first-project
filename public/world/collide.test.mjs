// collide.test.mjs — 円vsAABB/円 の押し出しと段差ブロックの検証。Run: node collide.test.mjs
import assert from 'node:assert';
import { resolve, step, segmentClearT, PLAYER_R } from './collide.js';

let passed = 0;
function check(name, cond) {
  assert.ok(cond, name);
  passed++;
  console.log('ok -', name);
}

const wall = { kind: 'box', minX: 0, maxX: 1, minZ: -10, maxZ: 10, minY: 0, maxY: 3 };

// --- 押し出し ---------------------------------------------------------------
{
  const out = resolve(-0.1, 0, 1, 0.4, [wall]);
  check('pushed out west of wall', out.x <= -0.4 + 1e-6);
  check('z unchanged on straight push', Math.abs(out.z) < 1e-6);
}
{
  const out = resolve(-5, 0, 1, 0.4, [wall]);
  check('far position untouched', out.x === -5 && out.z === 0);
}
{
  // y 範囲外（壁の上を飛んでいる体）なら当たらない
  const out = resolve(0.5, 0, 10, 0.4, [wall]);
  check('above wall: no collision', out.x === 0.5);
}
{
  const tree = { kind: 'circle', x: 0, z: 0, r: 0.4, minY: -10, maxY: 50 };
  const out = resolve(0.3, 0, 1, 0.4, [tree]);
  check('pushed out of tree circle', Math.hypot(out.x, out.z) >= 0.8 - 1e-6);
}

// --- スライド: 壁に斜めに歩くと壁沿いに進む -----------------------------------
{
  const flat = () => 0;
  const pos = { x: -0.55, z: 0, y: 0 };
  const mv = step(pos, 0.2, 0.3, flat, [wall], 0.4);
  check('slide keeps z progress', mv.z > 0.25);
  check('slide blocks x penetration', mv.x <= -0.4 + 1e-6);
}

// --- 段差: 高い崖は登れない、緩い坂は登れる ------------------------------------
{
  const cliff = (x) => (x > 1 ? 5 : 0);
  const pos = { x: 0.5, z: 0, y: 0 };
  const mv = step(pos, 1.0, 0, cliff, [], 0.4);
  check('cliff blocks x', mv.x === 0.5);
  const slope = (x) => x * 0.3;
  const mv2 = step({ x: 0, z: 0, y: 0 }, 1.0, 0, slope, [], 0.4);
  check('gentle slope walkable', mv2.x === 1.0 && Math.abs(mv2.y - 0.3) < 1e-9);
}

// --- カメラ遮蔽: 壁の手前で止まる ----------------------------------------------
{
  const flat = () => -10;
  const t = segmentClearT(-3, 1, 0, 3, 1, 0, flat, [wall], 0.2);
  check('camera ray stops before wall', t < 0.55 && t > 0.2);
  const t2 = segmentClearT(-3, 1, 0, -1, 1, 0, flat, [wall], 0.2);
  check('clear ray returns 1', t2 === 1);
}

console.log(`\n${passed} checks passed`);
