// character.js — ローポリ人型 v2（プレイヤー兼NPC）。
// アートディレクション準拠: マット仕上げ・減彩パレット・顔はキャンバス描画の
// テクスチャ（白目+虹彩+眉+口+頬）で「黒玉目のマネキン」を卒業する。

export const PALETTES = {
  player:   { skin: 0xf0c8a4, hair: 0x4a3526, top: 0xb04a3e, bottom: 0xd6b964, shoes: 0x5d4030 },
  baker:    { skin: 0xf0c8a4, hair: 0x5a4632, top: 0xeae2d4, bottom: 0x6e5236, shoes: 0x4a3a28, apron: 0x5c6b4a, bandana: 0xddc9a8 },
  barista:  { skin: 0xeabf96, hair: 0x2e2620, top: 0xddc9a8, bottom: 0x37322c, shoes: 0x2e2620, apron: 0x3a4a2f },
  customer: { skin: 0xf0c8a4, hair: 0x6a3c2a, top: 0x5f7d99, bottom: 0x37322c, shoes: 0x4a3a28 },
  villager: { skin: 0xe8bd9c, hair: 0xcfccc4, top: 0x8d7290, bottom: 0x5a5248, shoes: 0x37322c },
  kid:      { skin: 0xf3cda6, hair: 0x3a2c20, top: 0xd49a44, bottom: 0x3c5a8a, shoes: 0xcfccc4, hat: 0xc05a48 },
};

// 顔テクスチャ（肌色ベース + 目・眉・口・頬）。球のUVに合わせて正面に描く。
function makeFaceTexture(THREE, skinHex) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 128;
  const ctx = cv.getContext('2d');
  const skin = '#' + skinHex.toString(16).padStart(6, '0');
  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, 256, 128);
  // 正面は u=0.5（head.rotation.y で合わせる）。やや上に目線
  const cx = 128, cy = 60;
  const eye = (ex) => {
    ctx.fillStyle = '#fdfdf8';
    ctx.beginPath(); ctx.ellipse(ex, cy, 9, 11, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a2c20';
    ctx.beginPath(); ctx.ellipse(ex, cy + 1.5, 5, 7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(ex - 1.8, cy - 2, 1.8, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(70,50,35,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ex - 9, cy - 16); ctx.quadraticCurveTo(ex, cy - 20, ex + 9, cy - 16); ctx.stroke();
  };
  eye(cx - 17); eye(cx + 17);
  // 口
  ctx.strokeStyle = 'rgba(150,80,70,0.9)';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx - 6, cy + 26); ctx.quadraticCurveTo(cx, cy + 30, cx + 6, cy + 26); ctx.stroke();
  // 頬
  ctx.fillStyle = 'rgba(235,140,130,0.30)';
  ctx.beginPath(); ctx.ellipse(cx - 30, cy + 14, 8, 5, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 30, cy + 14, 8, 5, 0, 0, 7); ctx.fill();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeHumanoid(THREE, palette) {
  const P = { ...PALETTES.player, ...palette };
  const mat = (hex) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.85 });
  const group = new THREE.Group();

  // 胴体（裾広がりのテーパー＋なで肩）
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.27, 0.56, 10), mat(P.top));
  body.position.y = 1.0;
  group.add(body);
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.215, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(P.top));
  shoulder.position.y = 1.27;
  group.add(shoulder);
  // スカート/ズボン
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.33, 0.34, 10), mat(P.bottom));
  skirt.position.y = 0.62;
  group.add(skirt);
  // エプロン
  if (P.apron) {
    const ap = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.05), mat(P.apron));
    ap.position.set(0, 0.95, 0.2);
    group.add(ap);
  }
  // 首
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 8), mat(P.skin));
  neck.position.y = 1.34;
  group.add(neck);

  // 頭（顔テクスチャ。正面 +z はUVのu=0.25 なので回転で合わせる）
  const faceMat = new THREE.MeshStandardMaterial({ map: makeFaceTexture(THREE, P.skin), roughness: 0.8 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), faceMat);
  head.position.y = 1.52;
  head.rotation.y = -Math.PI * 0.5; // u=0.5（顔の中心）を +z（正面）へ
  group.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.255, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), mat(P.hair));
  hair.position.set(0, 1.55, -0.03);
  group.add(hair);
  if (P.bandana) {
    const bd = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.265, 0.1, 10), mat(P.bandana));
    bd.position.y = 1.68;
    group.add(bd);
  }
  if (P.hat) {
    const ht = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.17, 10), mat(P.hat));
    ht.position.y = 1.76;
    group.add(ht);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.035, 10), mat(P.hat));
    brim.position.y = 1.69;
    group.add(brim);
  }

  // 腕（肩ピボット）
  const arms = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.27, 1.24, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.46, 8), mat(P.top));
    arm.position.y = -0.2;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(P.skin));
    hand.position.y = -0.46;
    pivot.add(arm, hand);
    pivot.rotation.z = sx * 0.1;
    group.add(pivot);
    arms.push(pivot);
  }
  // 脚（腰ピボット）
  const legs = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * 0.11, 0.52, 0);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.42, 8), mat(P.skin));
    leg.position.y = -0.22;
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.21), mat(P.shoes));
    shoe.position.set(0, -0.45, 0.04);
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
    const swing = Math.sin(phase) * 0.72 * k;
    legs[0].rotation.x = swing;
    legs[1].rotation.x = -swing;
    arms[0].rotation.x = -swing * 0.8;
    arms[1].rotation.x = swing * 0.8;
    const bob = Math.abs(Math.sin(phase)) * 0.05 * k + Math.sin(idleT * 1.8) * 0.012 * (1 - k);
    body.position.y = 1.0 + bob;
    shoulder.position.y = 1.27 + bob;
    neck.position.y = 1.34 + bob;
    head.position.y = 1.52 + bob;
    hair.position.y = 1.55 + bob;
    if (k < 0.02) {
      arms[0].rotation.x = Math.sin(idleT * 1.6) * 0.06;
      arms[1].rotation.x = -Math.sin(idleT * 1.6) * 0.06;
      legs[0].rotation.x = legs[1].rotation.x = 0;
    }
  }

  return { group, update };
}
