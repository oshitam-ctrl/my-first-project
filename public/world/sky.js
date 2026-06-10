// sky.js — 大気散乱シェーダの空 + IBL(環境マップ) + 太陽光。
// three 公式 Sky を PMREM で焼いて scene.environment に与えるのが realism の本命:
// すべての PBR マテリアルが空からの照り返しを受ける。

import { Sky } from './vendor/addons/objects/Sky.js';

export function createSky(THREE, scene, renderer) {
  const sky = new Sky();
  sky.scale.setScalar(2000);
  scene.add(sky);
  const U = sky.material.uniforms;
  U.turbidity.value = 6;
  U.rayleigh.value = 1.6;
  U.mieCoefficient.value = 0.004;
  U.mieDirectionalG.value = 0.85;

  const sunDir = new THREE.Vector3();

  // 太陽（影は狭域でプレイヤー追従）
  const sun = new THREE.DirectionalLight(0xfff1dd, 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const SH = 55;
  sun.shadow.camera.left = -SH; sun.shadow.camera.right = SH;
  sun.shadow.camera.top = SH; sun.shadow.camera.bottom = -SH;
  sun.shadow.camera.near = 10; sun.shadow.camera.far = 400;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.35;
  scene.add(sun, sun.target);

  // IBLが大半を担うので環境光は控えめに
  const hemi = new THREE.HemisphereLight(0xcfe5ff, 0xb8a98c, 0.35);
  scene.add(hemi);

  scene.fog = new THREE.Fog(0xdce8ee, 90, 420);

  // --- 雲（やわらかい白ブロブ、控えめ） -------------------------------------
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 });
  const clouds = new THREE.Group();
  const rng = (i, k) => { const h = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return h - Math.floor(h); };
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group();
    const n = 3 + Math.floor(rng(i, 1) * 3);
    for (let j = 0; j < n; j++) {
      const r = 9 + rng(i, j + 2) * 12;
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), cloudMat);
      m.position.set((j - n / 2) * r * 1.15, rng(i, j + 9) * 5, (rng(i, j + 5) - 0.5) * 12);
      m.scale.y = 0.38;
      g.add(m);
    }
    g.position.set((rng(i, 11) - 0.5) * 700, 120 + rng(i, 13) * 70, (rng(i, 17) - 0.5) * 700);
    g.userData.speed = 0.5 + rng(i, 19) * 0.8;
    clouds.add(g);
  }
  scene.add(clouds);

  // --- 時刻 → 太陽位置・空・環境マップ ---------------------------------------
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  let envRT = null;
  let time = 0.40; // やわらかい午後

  function apply() {
    // elevation: 朝夕で低く、正午で高く / azimuth は南西へ回す
    const t = ((time % 1) + 1) % 1;
    const elev = Math.max(2, Math.sin((t - 0.25) * Math.PI * 2 * 0.5 + 0.35) * 55);
    const azim = 180 - (t - 0.5) * 160;
    const phi = THREE.MathUtils.degToRad(90 - elev);
    const theta = THREE.MathUtils.degToRad(azim);
    sunDir.setFromSphericalCoords(1, phi, theta);
    U.sunPosition.value.copy(sunDir);

    const dusk = Math.max(0, 1 - elev / 18); // 低い太陽ほど赤く
    sun.color.setHex(0xfff1dd).lerp(new THREE.Color(0xff9a55), dusk);
    sun.intensity = 2.6 + 1.0 * (elev / 55) - dusk * 0.8;
    hemi.intensity = 0.25 + 0.2 * (elev / 55);
    U.turbidity.value = 6 + dusk * 6;
    U.rayleigh.value = 1.6 + dusk * 1.6;

    // 空を環境マップに焼く（IBL）。setTime のときだけなのでコストは無視できる
    if (envRT) envRT.dispose();
    envRT = pmrem.fromScene(sky, 0.04);
    scene.environment = envRT.texture; // r160: 強さは各マテリアルの envMapIntensity 側

    scene.fog.color.set(0xdce8ee).lerp(new THREE.Color(0xf3c9a0), dusk * 0.8);
  }
  apply();

  function followShadow(p) {
    sun.target.position.set(p.x, 0, p.z);
    sun.position.set(p.x + sunDir.x * 180, Math.max(30, sunDir.y * 180), p.z + sunDir.z * 180);
  }

  function update(dt, playerPos) {
    for (const g of clouds.children) {
      g.position.x += g.userData.speed * dt;
      if (g.position.x > 380) g.position.x = -380;
    }
    if (playerPos) {
      sky.position.set(playerPos.x, 0, playerPos.z);
      followShadow(playerPos);
    }
  }

  return {
    sun, hemi, sunDir,
    setTime(t) { time = ((t % 1) + 1) % 1; apply(); },
    get time() { return time; },
    update, followShadow,
  };
}
