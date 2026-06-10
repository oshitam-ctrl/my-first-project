// character.js — ローポリ人型（プレイヤー兼NPC）。コードだけで歩行サイクル。
// makeHumanoid(THREE, palette) -> { group, update(dt, speed) }
// palette: { skin, hair, top, bottom, shoes, hat?, apron?, bandana? }

export const PALETTES = {
  player:   { skin: 0xf2c9a0, hair: 0x4a3526, top: 0xc23b30, bottom: 0xe8c84a, shoes: 0x5d4030 },
  baker:    { skin: 0xf2c9a0, hair: 0x5a4632, top: 0xf5ede4, bottom: 0x6e5236, shoes: 0x4a3a28, apron: 0x5c6b4a, bandana: 0xe8d5b7 },
  barista:  { skin: 0xeec39a, hair: 0x2e2620, top: 0xe8d5b7, bottom: 0x37322c, shoes: 0x2e2620, apron: 0x3a4a2f },
  customer: { skin: 0xf2c9a0, hair: 0x6a3c2a, top: 0x6a8caf, bottom: 0x37322c, shoes: 0x4a3a28 },
  villager: { skin: 0xeac0a0, hair: 0xd8d4cc, top: 0x9a7a9a, bottom: 0x5a5248, shoes: 0x37322c },
  kid:      { skin: 0xf5cfa8, hair: 0x3a2c20, top: 0xe8a23a, bottom: 0x3c5a8a, shoes: 0xdadad2, hat: 0xd2604a },
};

export function makeHumanoid(THREE, palette) {
  const P = { ...PALETTES.player, ...palette };
  const mat = (hex) => new THREE.MeshStandardMaterial({ color: hex, flatShading: true, roughness: 0.9 });
  const group = new THREE.Group();

  // 胴体
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.6, 0.32), mat(P.top));
  body.position.y = 0.98;
  group.add(body);
  // スカート/ズボン（裾広がりの台形）
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, 0.36, 7), mat(P.bottom));
  skirt.position.y = 0.62;
  group.add(skirt);
  // エプロン
  if (P.apron) {
    const ap = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.52, 0.06), mat(P.apron));
    ap.position.set(0, 0.92, 0.18);
    group.add(ap);
  }
  // 頭
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 8, 7), mat(P.skin));
  head.position.y = 1.52;
  group.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.285, 8, 7), mat(P.hair));
  hair.position.set(0, 1.56, -0.045);
  hair.scale.set(1, 0.92, 1);
  group.add(hair);
  if (P.bandana) {
    const bd = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.3, 0.12, 8), mat(P.bandana));
    bd.position.y = 1.7;
    group.add(bd);
  }
  if (P.hat) {
    const ht = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.2, 8), mat(P.hat));
    ht.position.y = 1.78;
    group.add(ht);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 8), mat(P.hat));
    brim.position.y = 1.7;
    group.add(brim);
  }
  // 目（前面 +z）
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2a2220 });
  for (const sx of [-0.1, 0.1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 5), eyeMat);
    eye.position.set(sx, 1.55, 0.245);
    group.add(eye);
  }
  // ほっぺ
  const cheekMat = new THREE.MeshBasicMaterial({ color: 0xf0a8a0, transparent: true, opacity: 0.75 });
  for (const sx of [-0.16, 0.16]) {
    const ck = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), cheekMat);
    ck.position.set(sx, 1.48, 0.225);
    ck.scale.z = 0.4;
    group.add(ck);
  }

  // 腕（肩ピボット）
  const arms = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.33, 1.22, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.5, 0.13), mat(P.top));
    arm.position.y = -0.22;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), mat(P.skin));
    hand.position.y = -0.5;
    pivot.add(arm, hand);
    pivot.rotation.z = sx * 0.08;
    group.add(pivot);
    arms.push(pivot);
  }
  // 脚（腰ピボット）
  const legs = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.13, 0.52, 0);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.46, 0.15), mat(P.skin));
    leg.position.y = -0.24;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.12, 0.24), mat(P.shoes));
    shoe.position.set(0, -0.48, 0.04);
    pivot.add(leg, shoe);
    group.add(pivot);
    legs.push(pivot);
  }

  group.traverse((m) => { if (m.isMesh) { m.castShadow = true; } });

  let phase = 0, idleT = Math.random() * 9;
  function update(dt, speed) {
    idleT += dt;
    const k = Math.min(1, speed / 3);
    phase += dt * (4 + speed * 2.2) * (k > 0.02 ? 1 : 0);
    const swing = Math.sin(phase) * 0.75 * k;
    legs[0].rotation.x = swing;
    legs[1].rotation.x = -swing;
    arms[0].rotation.x = -swing * 0.8;
    arms[1].rotation.x = swing * 0.8;
    // 弾むようなボブ＋待機の呼吸
    group.position.y += 0; // (呼び出し側が接地を決める)
    body.position.y = 0.98 + Math.abs(Math.sin(phase)) * 0.05 * k + Math.sin(idleT * 1.8) * 0.012 * (1 - k);
    head.position.y = 1.52 + Math.abs(Math.sin(phase)) * 0.04 * k;
    hair.position.y = head.position.y + 0.04;
    if (k < 0.02) { // 待機: 腕をゆっくり
      arms[0].rotation.x = Math.sin(idleT * 1.6) * 0.06;
      arms[1].rotation.x = -Math.sin(idleT * 1.6) * 0.06;
      legs[0].rotation.x = legs[1].rotation.x = 0;
    }
  }

  return { group, update };
}
