// water.js — 川は three 公式 Water（実反射＋法線マップ波）。棚田は鏡面PBR水面。
// モバイル(quality 'low')では反射レンダリングを省き、IBL反射の PBR 水面に落とす。

import { Water } from './vendor/addons/objects/Water.js';
import { WATER_Y, PADDIES } from './layout.js';

export function createWater(THREE, scene, opts = {}) {
  const { normals, sunDir, quality = 'high' } = opts;
  let river, uniforms = null;

  if (quality === 'high') {
    river = new Water(new THREE.PlaneGeometry(322, 322), {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: normals,
      sunDirection: sunDir ? sunDir.clone() : new THREE.Vector3(0.3, 0.7, 0.2),
      sunColor: 0xfff1dd,
      waterColor: 0x06281e,
      distortionScale: 2.2,
      fog: true,
    });
    river.material.uniforms.size.value = 6; // さざなみを細かく
    uniforms = river.material.uniforms;
  } else {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2e6e63, transparent: true, opacity: 0.92,
      roughness: 0.08, metalness: 0.1, normalMap: normals,
    });
    mat.normalScale = new THREE.Vector2(0.6, 0.6);
    river = new THREE.Mesh(new THREE.PlaneGeometry(322, 322), mat);
  }
  river.rotation.x = -Math.PI / 2;
  river.position.y = WATER_Y;
  scene.add(river);

  // 棚田: 静かな鏡面（IBLの空が映る）
  const paddyMat = new THREE.MeshStandardMaterial({
    color: 0x4a6a5e, transparent: true, opacity: 0.9,
    roughness: 0.05, metalness: 0.08,
  });
  for (const p of PADDIES) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(p.maxX - p.minX - 1.6, p.maxZ - p.minZ - 1.6),
      paddyMat,
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set((p.minX + p.maxX) / 2, p.y - 0.12, (p.minZ + p.maxZ) / 2);
    scene.add(m);
  }

  function update(t) {
    if (uniforms) uniforms.time.value = t * 0.6;
    else if (river.material.normalMap) river.material.normalMap.offset.set(t * 0.008, t * 0.005);
  }

  function setSun(dir, color) {
    if (uniforms) {
      uniforms.sunDirection.value.copy(dir);
      if (color) uniforms.sunColor.value.set(color);
    }
  }

  return { update, setSun, mesh: river };
}
