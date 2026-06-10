// petals.js — 桜の花びら。プレイヤー周辺の箱の中を漂い、外に出たら入れ直す。
// burst(x,y,z) は完走演出（その場から舞い上がる）。

import { SAKURA_ZONE } from './layout.js';

const N = 140;

export function createPetals(THREE, scene) {
  const geo = new THREE.PlaneGeometry(0.14, 0.11);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xf7c8d8, side: THREE.DoubleSide, transparent: true, opacity: 0.92,
  });
  const im = new THREE.InstancedMesh(geo, mat, N);
  im.frustumCulled = false;
  scene.add(im);

  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
  const V = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1);
  const p = [];
  for (let i = 0; i < N; i++) {
    p.push({ x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, r: Math.random() * 9, spin: 0.6 + Math.random() * 2 });
  }

  // 並木の近く（z 10..64）か校庭の桜の近くでだけ自然発生させる
  function nearSakura(x, z) {
    return (z > SAKURA_ZONE.z0 - 8 && z < SAKURA_ZONE.z1 + 8 && Math.abs(x) < 26) ||
           (z > -16 && z < 14 && Math.abs(x) < 46);
  }

  let burstT = 0, bx = 0, by = 0, bz = 0;
  function burst(x, y, z) { burstT = 2.6; bx = x; by = y; bz = z; }

  function respawn(pt, px, pz) {
    if (burstT > 0) {
      pt.x = bx + (Math.random() - 0.5) * 1.2;
      pt.y = by + Math.random() * 0.6;
      pt.z = bz + (Math.random() - 0.5) * 1.2;
      const a = Math.random() * Math.PI * 2;
      pt.vx = Math.cos(a) * (1 + Math.random() * 2);
      pt.vy = 2.5 + Math.random() * 3;
      pt.vz = Math.sin(a) * (1 + Math.random() * 2);
    } else {
      pt.x = px + (Math.random() - 0.5) * 30;
      pt.y = 6 + Math.random() * 6;
      pt.z = pz + (Math.random() - 0.5) * 30;
      pt.vx = 0.3 + Math.random() * 0.5;
      pt.vy = -(0.5 + Math.random() * 0.5);
      pt.vz = 0.1 + Math.random() * 0.3;
    }
  }

  function update(dt, playerPos, groundAt) {
    const active = burstT > 0 || nearSakura(playerPos.x, playerPos.z);
    if (burstT > 0) burstT -= dt;
    const t = performance.now() * 0.001;
    for (let i = 0; i < N; i++) {
      const pt = p[i];
      if (pt.y < -50) {
        if (active && Math.random() < 0.06) respawn(pt, playerPos.x, playerPos.z);
        else { setHidden(i); continue; }
      }
      pt.vy -= (burstT > 0 ? 2.4 : 0) * dt;          // バーストは重力で落ちる
      pt.x += (pt.vx + Math.sin(t * 1.1 + pt.r) * 0.5) * dt;
      pt.y += pt.vy * dt;
      pt.z += (pt.vz + Math.cos(t * 0.9 + pt.r) * 0.4) * dt;
      const g = groundAt ? groundAt(pt.x, pt.z) : 0;
      const out = pt.y < g - 0.2 || Math.hypot(pt.x - playerPos.x, pt.z - playerPos.z) > 36;
      if (out) { pt.y = -99; setHidden(i); continue; }
      E.set(t * pt.spin + pt.r, t * pt.spin * 0.7 + pt.r, 0);
      Q.setFromEuler(E);
      V.set(pt.x, pt.y, pt.z);
      M.compose(V, Q, S);
      im.setMatrixAt(i, M);
    }
    im.instanceMatrix.needsUpdate = true;
  }

  function setHidden(i) {
    V.set(0, -100, 0); Q.identity(); S.set(0.001, 0.001, 0.001);
    M.compose(V, Q, S);
    im.setMatrixAt(i, M);
    S.set(1, 1, 1);
  }

  return { update, burst };
}
