// buildings.js — 旧南方小学校の木造校舎（外観・2階建て・切妻屋根）と体育館。
// 1F は実際に歩けるので、南壁は昇降口の開口を残して組む（コライダーは layout.js）。

import { createBuilder, textPlane } from './geo.js';
import { SCHOOL, GYM, FLOOR_Y } from './layout.js';

import { THEME as COL } from './theme.js';

export function buildSchool(THREE, scene) {
  const S = SCHOOL;
  const b = createBuilder(THREE);
  const W = S.maxX - S.minX, D = S.maxZ - S.minZ;          // 46 x 12
  const cx = (S.minX + S.maxX) / 2, cz = (S.minZ + S.maxZ) / 2;
  const y0 = FLOOR_Y;                                       // 1F床
  const H = S.wallH;                                        // 軒高 7.6
  const t = 0.3;                                            // 壁厚

  // 基礎・床（接地感: 広めの石積みスカート + 壁ぎわの暗いAOストリップ + 苔）
  b.box(W + 2.2, 0.55, D + 2.2, COL.stoneDark, cx, y0 - 0.45, cz);
  b.box(W + 1.2, 0.5, D + 1.2, COL.stone, cx, y0 - 0.32, cz);
  b.box(W, 0.24, D, COL.deck, cx, y0 - 0.06, cz);
  for (const [sw, sd, sx2, sz2] of [
    [W + 0.5, 0.16, cx, S.maxZ + 0.22], [W + 0.5, 0.16, cx, S.minZ - 0.22],
    [0.16, D + 0.5, S.minX - 0.22, cz], [0.16, D + 0.5, S.maxX + 0.22, cz],
  ]) {
    b.box(sw, 0.22, sd, COL.aoStrip, sx2, y0 + 0.04, sz2);
  }
  for (let i = 0; i < 14; i++) { // 北側の基礎に点々と苔
    const mx = S.minX + 2 + i * 3.1;
    b.box(0.5 + (i % 3) * 0.2, 0.14, 0.1, COL.moss, mx, y0 + 0.1, (i % 2 ? S.minZ - 0.3 : S.maxZ + 0.3));
  }

  // 南壁（昇降口の開口 + 戸口まぐさ）
  const dx0 = S.doorX - S.doorHalf, dx1 = S.doorX + S.doorHalf;
  b.box(dx0 - S.minX, H, t, COL.wall, (S.minX + dx0) / 2, y0 + H / 2, S.maxZ);
  b.box(S.maxX - dx1, H, t, COL.wall, (dx1 + S.maxX) / 2, y0 + H / 2, S.maxZ);
  b.box(dx1 - dx0, H - 2.6, t, COL.wall, S.doorX, y0 + 2.6 + (H - 2.6) / 2, S.maxZ);
  // 北・東・西壁
  b.box(W, H, t, COL.wall, cx, y0 + H / 2, S.minZ);
  b.box(t, H, D, COL.wall, S.minX, y0 + H / 2, cz);
  b.box(t, H, D, COL.wall, S.maxX, y0 + H / 2, cz);

  // 2F床(=1F天井) と 屋根裏床
  b.box(W, 0.3, D, COL.deck, cx, y0 + 3.55, cz);

  // 内部の間仕切り（廊下壁: パン屋/カフェの戸口を開ける）
  const czw = S.corridorZ;
  const gaps = [[S.bakery.doorX - 1.0, S.bakery.doorX + 1.0], [S.cafe.doorX - 1.0, S.cafe.doorX + 1.0]];
  let xs = S.minX;
  for (const [g0, g1] of gaps) {
    b.box(g0 - xs, 3.4, t, COL.wall, (xs + g0) / 2, y0 + 1.7, czw);
    b.box(g1 - g0, 0.9, t, COL.wall, (g0 + g1) / 2, y0 + 2.95, czw); // まぐさ
    xs = g1;
  }
  b.box(S.maxX - xs, 3.4, t, COL.wall, (xs + S.maxX) / 2, y0 + 1.7, czw);
  b.box(t, 3.4, czw - S.minZ, COL.wall, -7, y0 + 1.7, (S.minZ + czw) / 2);
  b.box(t, 3.4, czw - S.minZ, COL.wall, 7, y0 + 1.7, (S.minZ + czw) / 2);

  // 切妻屋根（軒の出 1m）
  const half = D / 2 + 1.0, ridgeY = y0 + H + S.roofH;
  const tilt = Math.atan2(S.roofH, half);
  const slopeLen = Math.hypot(half, S.roofH) + 0.4;
  b.box(W + 2.4, 0.26, slopeLen, COL.roof, cx, y0 + H + S.roofH / 2 + 0.1, cz + half / 2, { rx: tilt });
  b.box(W + 2.4, 0.26, slopeLen, COL.roof, cx, y0 + H + S.roofH / 2 + 0.1, cz - half / 2, { rx: -tilt });
  b.box(W + 2.6, 0.3, 0.5, COL.timber, cx, ridgeY + 0.12, cz); // 棟木
  // 瓦の段差リッジ（屋根の単調さを消すレリーフ）
  for (let i = 1; i <= 5; i++) {
    const f = i / 5.5;
    for (const sgn of [1, -1]) {
      b.box(W + 2.4, 0.09, 0.24, COL.roofRidge, cx, y0 + H + S.roofH * (1 - f) + 0.24, cz + sgn * half * f, { rx: sgn * tilt });
    }
  }
  // 妻壁（三角）
  const tri = new THREE.Shape();
  tri.moveTo(-D / 2, 0); tri.lineTo(D / 2, 0); tri.lineTo(0, S.roofH); tri.closePath();
  const triGeo = new THREE.ExtrudeGeometry(tri, { depth: 0.3, bevelEnabled: false });
  b.add(triGeo, COL.wall, S.minX + 0.0, y0 + H, cz, { ry: Math.PI / 2 });
  b.add(triGeo, COL.wall, S.maxX - 0.3, y0 + H, cz, { ry: Math.PI / 2 });

  // 木枠（柱・胴差し・土台）
  for (const x of [S.minX, -15.4, -7, 0 - 2.2, 2.2, 7, 15.4, S.maxX]) {
    b.box(0.34, H, 0.42, COL.timber, x, y0 + H / 2, S.maxZ + 0.05);
    b.box(0.34, H, 0.42, COL.timber, x, y0 + H / 2, S.minZ - 0.05);
  }
  for (const z of [S.maxZ + 0.06, S.minZ - 0.06]) {
    b.box(W + 0.5, 0.4, 0.36, COL.timber, cx, y0 + 3.75, z);   // 階間の胴差し
    b.box(W + 0.5, 0.45, 0.36, COL.timber, cx, y0 + 0.2, z);   // 土台
  }

  // 窓（白枠＋ガラス、1F/2F の連窓）— 南北の面
  function windows(z, out) {
    for (const [yy, hh] of [[y0 + 1.9, 1.3], [y0 + 5.4, 1.5]]) {
      for (let x = S.minX + 3; x <= S.maxX - 3; x += 3.85) {
        if (Math.abs(x - S.doorX) < 2.4 && yy < y0 + 3) continue; // 昇降口
        b.box(2.6, hh + 0.3, 0.14, COL.sash, x, yy, z + out * 0.1);
        b.box(2.3, hh, 0.1, COL.glass, x, yy, z + out * 0.16);
        b.box(0.09, hh, 0.06, COL.sash, x, yy, z + out * 0.2);
        b.box(2.3, 0.09, 0.06, COL.sash, x, yy, z + out * 0.2);
      }
    }
  }
  windows(S.maxZ, 1);
  windows(S.minZ, -1);

  // 昇降口ポーチ（小さな切妻の庇＋柱＋踏み石）
  b.box(5.4, 0.24, 2.6, COL.roof, S.doorX, y0 + 3.0, S.maxZ + 1.3, { rx: 0.16 });
  b.box(0.26, 2.9, 0.26, COL.timber, S.doorX - 2.3, y0 + 1.45, S.maxZ + 2.3);
  b.box(0.26, 2.9, 0.26, COL.timber, S.doorX + 2.3, y0 + 1.45, S.maxZ + 2.3);
  b.box(4.4, 0.18, 2.0, COL.stone, S.doorX, y0 - 0.06, S.maxZ + 1.2);
  // 引き戸（開けっぱなし: 左右に寄せたガラス戸）
  b.box(1.2, 2.5, 0.08, COL.sash, dx0 - 0.65, y0 + 1.25, S.maxZ + 0.18);
  b.box(1.0, 2.2, 0.05, COL.glass, dx0 - 0.65, y0 + 1.3, S.maxZ + 0.24);
  b.box(1.2, 2.5, 0.08, COL.sash, dx1 + 0.65, y0 + 1.25, S.maxZ + 0.18);
  b.box(1.0, 2.2, 0.05, COL.glass, dx1 + 0.65, y0 + 1.3, S.maxZ + 0.24);

  // 時計（妻ではなく正面中央の高い位置）と校章
  b.cyl(0.85, 0.85, 0.14, COL.sash, S.doorX, y0 + 6.6, S.maxZ + 0.22, { rx: Math.PI / 2 }, 16);
  b.box(0.08, 0.55, 0.06, 0x37322c, S.doorX, y0 + 6.78, S.maxZ + 0.32);
  b.box(0.4, 0.08, 0.06, 0x37322c, S.doorX + 0.16, y0 + 6.6, S.maxZ + 0.32);
  b.cyl(0.42, 0.42, 0.1, 0xc9a648, S.doorX, y0 + 5.55, S.maxZ + 0.2, { rx: Math.PI / 2 }, 10); // 校章

  const mesh = b.build();
  scene.add(mesh);

  // 校名プレート / 店の看板（キャンバステクスチャ）
  const plate = textPlane(THREE, { w: 2.6, h: 0.7, lines: ['旧 南方小学校'], bg: '#e9e2d4', fg: '#4a4036', font: 0.5, border: '#5d4636' });
  plate.position.set(3.6, y0 + 2.7, S.maxZ + 0.18);
  scene.add(plate);
  const sign = textPlane(THREE, { w: 4.2, h: 1.0, lines: ['プチヘルメース', '— 毎日食べたい幸せ酵母 —'], bg: '#5C6B4A', fg: '#F5EDE4', font: 0.32, border: '#E8D5B7' });
  sign.position.set(-14, y0 + 4.6, S.maxZ + 0.2);
  scene.add(sign);

  return mesh;
}

export function buildGym(THREE, scene) {
  const G = GYM;
  const b = createBuilder(THREE);
  const W = G.maxX - G.minX, D = G.maxZ - G.minZ;
  const cx = (G.minX + G.maxX) / 2, cz = (G.minZ + G.maxZ) / 2;
  const y0 = FLOOR_Y, H = 6.2;

  b.box(W + 2, 0.6, D + 2, COL.stoneDark, cx, y0 - 0.42, cz);
  b.box(W + 1, 0.5, D + 1, COL.stone, cx, y0 - 0.3, cz);
  b.box(W, H, D, 0xece4d2, cx, y0 + H / 2, cz);          // 箱の躯体（中は入れない）
  b.box(W + 0.4, 0.22, 0.16, COL.aoStrip, cx, y0 + 0.04, G.maxZ + 0.18); // 正面のAOストリップ
  // かまぼこ屋根
  const arc = new THREE.CylinderGeometry(D / 2 + 0.6, D / 2 + 0.6, W + 1.4, 14, 1, false, 0, Math.PI);
  b.add(arc, COL.roof, cx, y0 + H, cz, { rz: Math.PI / 2 });
  // ハイサイドの連窓と扉
  for (let x = G.minX + 3; x <= G.maxX - 3; x += 3.4) {
    b.box(2.3, 1.4, 0.14, COL.glass, x, y0 + H - 1.3, G.maxZ + 0.08);
    b.box(2.5, 1.6, 0.08, COL.sash, x, y0 + H - 1.3, G.maxZ + 0.02);
  }
  b.box(3.4, 2.8, 0.2, 0x9aa5ad, G.doorX, y0 + 1.4, G.maxZ + 0.12);   // 鉄の引き戸
  b.box(0.2, 2.8, 0.06, 0x6f7a82, G.doorX, y0 + 1.4, G.maxZ + 0.24);
  b.box(2.0, 0.22, 1.2, COL.stone, G.doorX, y0 - 0.02, G.maxZ + 0.8);

  const mesh = b.build();
  scene.add(mesh);

  const plate = textPlane(THREE, { w: 2.4, h: 0.6, lines: ['体育館'], bg: '#e9e2d4', fg: '#4a4036', font: 0.55, border: '#5d4636' });
  plate.position.set(G.doorX + 3.2, y0 + 2.6, G.maxZ + 0.16);
  scene.add(plate);

  return mesh;
}
