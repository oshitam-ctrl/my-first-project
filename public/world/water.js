// water.js — 川と棚田の水面。半透明の平面＋頂点サイン波のさざなみ。

import { WATER_Y, PADDIES } from './layout.js';

export function createWater(THREE, scene) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x6fc3df, transparent: true, opacity: 0.8,
    roughness: 0.35, metalness: 0.05, flatShading: true,
  });

  // 川: マップ全体を覆う低分割の面（彫り込んだ所だけ見える）
  const geo = new THREE.PlaneGeometry(322, 322, 56, 56);
  geo.rotateX(-Math.PI / 2);
  const base = geo.attributes.position.array.slice();
  const river = new THREE.Mesh(geo, mat);
  river.position.y = WATER_Y;
  river.receiveShadow = true;
  scene.add(river);

  // 棚田: それぞれの段の高さ-0.12 に静かな水面
  const paddyMat = new THREE.MeshStandardMaterial({
    color: 0x86c8c2, transparent: true, opacity: 0.75, roughness: 0.3, metalness: 0.05,
  });
  for (const p of PADDIES) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(p.maxX - p.minX - 1.6, p.maxZ - p.minZ - 1.6),
      paddyMat,
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set((p.minX + p.maxX) / 2, p.y - 0.12, (p.minZ + p.maxZ) / 2);
    m.receiveShadow = true;
    scene.add(m);
  }

  function update(t) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2];
      pos.setY(i, Math.sin(x * 0.5 + t * 1.6) * 0.05 + Math.cos(z * 0.4 + t * 1.1) * 0.05);
    }
    pos.needsUpdate = true;
  }

  return { update };
}
