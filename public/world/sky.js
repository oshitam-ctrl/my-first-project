// sky.js — グラデーション空ドーム＋ライティング＋雲＋遠景の浮島。
// time は 0..1（0.5=正午）。デフォルトはやわらかい午後の光。

import { createBuilder } from './geo.js';

export function createSky(THREE, scene) {
  // --- 空ドーム（内側向き、頂点カラーのグラデ） ---------------------------
  const geo = new THREE.SphereGeometry(640, 24, 12);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const top = new THREE.Color(0x8fc8ff), bottom = new THREE.Color(0xfdeecf);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, Math.min(1, pos.getY(i) / 640 * 1.4 + 0.25));
    tmp.copy(bottom).lerp(top, t);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const dome = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false,
  }));
  dome.renderOrder = -10;
  scene.add(dome);

  // --- ライト ---------------------------------------------------------------
  const hemi = new THREE.HemisphereLight(0xbfe0ff, 0xd8c9a8, 0.75);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2dc, 2.0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const SH = 60; // プレイヤー追従の狭域シャドウ
  sun.shadow.camera.left = -SH; sun.shadow.camera.right = SH;
  sun.shadow.camera.top = SH; sun.shadow.camera.bottom = -SH;
  sun.shadow.camera.near = 10; sun.shadow.camera.far = 300;
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.4;
  scene.add(sun);
  scene.add(sun.target);

  scene.fog = new THREE.Fog(0xdfeBee, 70, 300);

  // --- 雲（白い扁平ブロブの集まり、ゆっくり流れる） --------------------------
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1, fog: false });
  const clouds = new THREE.Group();
  const rng = (i, k) => { const h = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return h - Math.floor(h); };
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group();
    const n = 3 + Math.floor(rng(i, 1) * 3);
    for (let j = 0; j < n; j++) {
      const r = 7 + rng(i, j + 2) * 9;
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), cloudMat);
      m.position.set((j - n / 2) * r * 1.1, rng(i, j + 9) * 4, (rng(i, j + 5) - 0.5) * 10);
      m.scale.y = 0.45;
      g.add(m);
    }
    g.position.set((rng(i, 11) - 0.5) * 600, 95 + rng(i, 13) * 50, (rng(i, 17) - 0.5) * 600);
    g.userData.speed = 0.6 + rng(i, 19) * 0.8;
    clouds.add(g);
  }
  scene.add(clouds);

  // --- 遠景の浮島（スクショへのオマージュ、霞んだシルエット） ----------------
  const islands = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const b = createBuilder(THREE);
    b.cone(16, 22, 0x9aa98e, 0, -11, 0, { rx: Math.PI });        // 逆さの岩
    b.cyl(16, 16, 3, 0x7ec850, 0, 1.5, 0, {}, 9);                // 草の天面
    b.ico(6, 0x5a9e3d, -6, 6, 2);                                 // 木
    b.ico(5, 0x6fae46, 7, 5.5, -3);
    b.cyl(0.8, 1, 4, 0x7a5a40, -6, 3, 2);
    const m = b.build({ castShadow: false, receiveShadow: false });
    m.material.fog = false;
    m.material.transparent = true; m.material.opacity = 0.55;
    const a = i * 2.4 + 0.7;
    m.position.set(Math.cos(a) * 380, 130 + i * 26, Math.sin(a) * 380);
    m.userData.bob = i * 2.1;
    islands.add(m);
  }
  scene.add(islands);

  // --- 時刻 -------------------------------------------------------------------
  let time = 0.42; // やわらかい午後
  const skyTop = new THREE.Color(), skyBot = new THREE.Color();
  function apply() {
    // 太陽の角度（0.25=朝 0.5=正午 0.75=夕）
    const a = (time - 0.25) * Math.PI * 2 * 0.5 + Math.PI * 0.15;
    const sx = Math.cos(a), sy = Math.max(0.18, Math.sin(a));
    sun.position.set(sx * 120, sy * 160, 60);
    const dusk = Math.max(0, 1 - Math.abs(time - 0.78) / 0.16); // 夕暮れ係数
    sun.color.setHex(0xfff2dc).lerp(new THREE.Color(0xffb37a), dusk);
    sun.intensity = 1.6 + 0.6 * sy - dusk * 0.4;
    hemi.intensity = 0.6 + 0.3 * sy;
    skyTop.setHex(0x8fc8ff).lerp(new THREE.Color(0xb88ad6), dusk);
    skyBot.setHex(0xfdeecf).lerp(new THREE.Color(0xffc8a0), dusk);
    const c = geo.attributes.color;
    for (let i = 0; i < pos.count; i++) {
      const t = Math.max(0, Math.min(1, pos.getY(i) / 640 * 1.4 + 0.25));
      tmp.copy(skyBot).lerp(skyTop, t);
      c.setXYZ(i, tmp.r, tmp.g, tmp.b);
    }
    c.needsUpdate = true;
    scene.fog.color.copy(skyBot).lerp(skyTop, 0.45);
  }
  apply();

  function update(dt, playerPos) {
    for (const g of clouds.children) g.position.x += g.userData.speed * dt;
    for (const g of clouds.children) if (g.position.x > 340) g.position.x = -340;
    const t = performance.now() * 0.001;
    for (const m of islands.children) m.position.y += Math.sin(t * 0.4 + m.userData.bob) * 0.012;
    if (playerPos) {
      dome.position.set(playerPos.x, 0, playerPos.z);
      followShadow(playerPos);
    }
  }

  // 影カメラ（太陽）をプレイヤーに追従させる — 方向は時刻から再計算
  function followShadow(p) {
    const a = (time - 0.25) * Math.PI * 2 * 0.5 + Math.PI * 0.15;
    sun.target.position.set(p.x, 0, p.z);
    sun.position.set(p.x + Math.cos(a) * 120, Math.max(0.18, Math.sin(a)) * 160, p.z + 60);
  }

  return {
    sun, hemi,
    setTime(t) { time = ((t % 1) + 1) % 1; apply(); },
    get time() { return time; },
    update,
    followShadow,
  };
}
