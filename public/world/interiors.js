// interiors.js — 校舎1Fの中身。昇降口（下駄箱・緑黒板）、パン屋プチヘルメース
// （L字カウンター・面陳列のパン壁・酵母瓶棚・窯）、カフェ「South in North」。
// 屋内は天井で日光が入らないので、暖色のポイントライトを置く。

import { createBuilder, textPlane } from './geo.js';
import { SCHOOL, FLOOR_Y, addBox, addCircle } from './layout.js';
import { JARS } from './data.js';

const COL = {
  wood: 0x8a6a4a, woodLight: 0xcaa877, counter: 0x6e5236, plaster: 0xf5ede4,
  green: 0x5c6b4a, cream: 0xe8d5b7, dark: 0x4a4036,
  breadA: 0xc88a4a, breadB: 0xb8763a, crust: 0x9a5f2e, steel: 0xb9c0c4,
};

export function buildInteriors(THREE, scene, opts = {}) {
  const b = createBuilder(THREE);
  const y0 = FLOOR_Y;
  const B = SCHOOL.bakery, C = SCHOOL.cafe;

  // 実木目の床（廊下・パン屋・カフェの見せ場。校舎全面に貼る）
  if (opts.wood) {
    const wood = opts.wood.clone();
    wood.needsUpdate = true;
    wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
    wood.repeat.set(10, 5);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(SCHOOL.maxX - SCHOOL.minX - 0.4, SCHOOL.maxZ - SCHOOL.minZ - 0.4),
      new THREE.MeshStandardMaterial({ map: wood, roughness: 0.55, metalness: 0 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((SCHOOL.minX + SCHOOL.maxX) / 2, y0 + 0.075, (SCHOOL.minZ + SCHOOL.maxZ) / 2);
    floor.receiveShadow = true;
    scene.add(floor);
  }

  // ------------------------------------------------------------------ 昇降口
  // 下駄箱（昇降口の左右）
  for (const x of [-4.6, 4.6]) {
    b.box(3.6, 1.8, 0.6, COL.woodLight, x, y0 + 0.9, SCHOOL.maxZ - 0.65);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      b.box(0.74, 0.5, 0.1, COL.wood, x - 1.35 + i * 0.9, y0 + 0.45 + j * 0.55, SCHOOL.maxZ - 0.32);
    }
    addBox(x - 1.8, x + 1.8, SCHOOL.maxZ - 0.95, SCHOOL.maxZ - 0.35, y0, y0 + 2);
  }
  // 緑黒板（廊下壁・きょうのパン）
  const board = textPlane(THREE, {
    w: 3.4, h: 1.6, bg: '#2e4a3c', fg: '#f0ead2', border: '#8a6a4a', font: 0.16,
    lines: ['きょうのパン', 'カンパーニュ ・ バゲット', 'いちご酵母 ・ クロワッサン', '※ 売り切れたらおしまい'],
  });
  board.position.set(-3.4, y0 + 1.8, SCHOOL.corridorZ + 0.18);
  scene.add(board);
  // 廊下のベンチ
  b.box(2.6, 0.1, 0.5, COL.woodLight, 0, y0 + 0.45, SCHOOL.minZ + 1.0);
  b.box(0.12, 0.45, 0.4, COL.wood, -1.1, y0 + 0.22, SCHOOL.minZ + 1.0);
  b.box(0.12, 0.45, 0.4, COL.wood, 1.1, y0 + 0.22, SCHOOL.minZ + 1.0);

  // ------------------------------------------------------------- パン屋
  const bx = (B.minX + B.maxX) / 2;
  // L字カウンター（戸口に向く面と、東壁沿い）
  b.box(7.5, 1.05, 0.9, COL.counter, -12.2, y0 + 0.52, -42.4);
  b.box(7.5, 0.08, 1.06, COL.woodLight, -12.2, y0 + 1.08, -42.4);
  b.box(0.9, 1.05, 2.6, COL.counter, -8.8, y0 + 0.52, -43.9);
  addBox(-16, -8.4, -42.9, -41.9, y0, y0 + 1.2);
  addBox(-9.3, -8.3, -45.2, -42.4, y0, y0 + 1.2);
  // レジとはかり
  b.box(0.6, 0.45, 0.5, COL.dark, -9.6, y0 + 1.35, -42.4);
  b.box(0.5, 0.06, 0.4, COL.steel, -11, y0 + 1.15, -42.4);
  b.cyl(0.16, 0.16, 0.18, COL.steel, -11, y0 + 1.27, -42.4, {}, 8);

  // 面陳列のパン壁（北壁いっぱいのヒーロー棚）
  for (let row = 0; row < 3; row++) {
    const y = y0 + 1.15 + row * 0.62;
    b.box(6.8, 0.07, 0.55, COL.woodLight, -13.5, y, B.minZ + 0.45);
    for (let i = 0; i < 7; i++) {
      const x = -16.5 + i * 1.0;
      const kind = (row + i) % 3;
      if (kind === 0) b.sph(0.3, COL.breadA, x, y + 0.26, B.minZ + 0.45, { s: [1, 0.72, 1] });        // カンパーニュ
      else if (kind === 1) b.box(0.72, 0.16, 0.2, COL.crust, x, y + 0.14, B.minZ + 0.45, { ry: 0.3 }); // バゲット
      else b.box(0.34, 0.3, 0.3, COL.breadB, x, y + 0.2, B.minZ + 0.45);                               // 食パン
    }
  }
  b.box(7.2, 2.4, 0.12, COL.green, -13.5, y0 + 1.9, B.minZ + 0.12); // 棚の背板（ブランド深緑）
  addBox(-17.2, -9.8, B.minZ, B.minZ + 0.8, y0, y0 + 3);
  // カウンターの上のパンかご
  b.cyl(0.34, 0.26, 0.22, COL.woodLight, -14.5, y0 + 1.2, -42.4, {}, 8);
  b.sph(0.22, COL.breadA, -14.5, y0 + 1.32, -42.4, { s: [1, 0.7, 1] });

  // 酵母の瓶棚（西壁、6種に色を合わせる）
  b.box(0.5, 2.2, 4.6, COL.woodLight, B.minX + 0.55, y0 + 1.1, -41.8);
  JARS.forEach((j, i) => {
    const z = -43.7 + i * 0.78;
    const y = y0 + 0.9 + (i % 2) * 0.7;
    b.cyl(0.17, 0.17, 0.42, 0xd8e8ea, B.minX + 0.62, y, z, {}, 8);          // ガラス瓶
    b.cyl(0.14, 0.14, 0.26, j.color, B.minX + 0.62, y - 0.05, z, {}, 8);    // 中身
    b.cyl(0.18, 0.18, 0.06, COL.cream, B.minX + 0.62, y + 0.24, z, {}, 8);  // 布のふた
  });
  addBox(B.minX, B.minX + 1.0, -44.4, -39.2, y0, y0 + 2.4);

  // 窯（北西の角、口がほの赤く光る）
  b.box(2.2, 2.2, 1.6, 0x7d7468, -20.2, y0 + 1.1, B.minZ + 1.15);
  b.box(1.0, 0.8, 0.2, 0x2a221c, -20.2, y0 + 0.9, B.minZ + 1.98);
  b.cyl(0.25, 0.25, 1.6, 0x6a6258, -20.2, y0 + 3.0, B.minZ + 0.9, {}, 6); // 煙突
  addBox(-21.4, -19, B.minZ + 0.3, B.minZ + 2.0, y0, y0 + 2.4);
  const ovenGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.85, 0.6),
    new THREE.MeshBasicMaterial({ color: 0xff7a30 }),
  );
  ovenGlow.position.set(-20.2, y0 + 0.9, B.minZ + 2.09);
  scene.add(ovenGlow);
  // 作業台（粉袋と生地）
  b.box(2.0, 0.9, 0.9, COL.steel, -17.4, y0 + 0.45, B.minZ + 1.2);
  b.sph(0.22, 0xf0e6d2, -17.8, y0 + 1.0, B.minZ + 1.2);
  b.sph(0.18, 0xf0e6d2, -17.2, y0 + 0.98, B.minZ + 1.1);
  addBox(-18.5, -16.3, B.minZ + 0.7, B.minZ + 1.7, y0, y0 + 1.1);

  // 値札（白いカード）
  for (let i = 0; i < 4; i++) b.box(0.18, 0.12, 0.02, 0xffffff, -15.6 + i * 1.6, y0 + 1.16, -42.0);

  // ------------------------------------------------------------- カフェ
  // カウンター
  b.box(6.0, 1.0, 0.9, COL.green, 16, y0 + 0.5, -44.0);
  b.box(6.0, 0.08, 1.05, COL.woodLight, 16, y0 + 1.03, -44.0);
  addBox(13, 19, -44.5, -43.5, y0, y0 + 1.2);
  // コーヒー道具と食器棚
  b.cyl(0.18, 0.14, 0.4, COL.steel, 14.6, y0 + 1.28, -44.0, {}, 8);
  b.box(0.5, 0.3, 0.4, COL.dark, 17.2, y0 + 1.22, -44.0);
  b.box(3.4, 1.6, 0.5, COL.woodLight, 16, y0 + 2.4, C.minZ + 0.4);
  for (let i = 0; i < 6; i++) b.cyl(0.09, 0.07, 0.16, i % 2 ? 0xe07a5f : 0xf2cc8f, 14.8 + i * 0.5, y0 + 1.86, C.minZ + 0.4, {}, 6);
  // テーブル（丸天板＋スツール）×3
  for (const [tx, tz] of [[10.5, -41.5], [14, -39.8], [18.5, -40.8]]) {
    b.cyl(0.62, 0.62, 0.07, COL.woodLight, tx, y0 + 0.78, tz, {}, 10);
    b.cyl(0.07, 0.09, 0.78, COL.wood, tx, y0 + 0.39, tz, {}, 6);
    for (const a of [0.6, 2.7, 4.6]) {
      b.cyl(0.24, 0.24, 0.05, COL.wood, tx + Math.cos(a) * 1.0, y0 + 0.47, tz + Math.sin(a) * 1.0, {}, 8);
      b.cyl(0.05, 0.06, 0.45, COL.wood, tx + Math.cos(a) * 1.0, y0 + 0.23, tz + Math.sin(a) * 1.0, {}, 6);
    }
    addCircle(tx, tz, 0.7);
  }
  // 黒板メニュー
  const menu = textPlane(THREE, {
    w: 2.2, h: 1.5, bg: '#2e3a30', fg: '#f0ead2', border: '#8a6a4a', font: 0.13,
    lines: ['South in North', 'スパイスカレー 900', 'タルティーヌ 650', '野菜スープ 480', '季節のドリンク 400'],
  });
  menu.position.set(C.maxX - 0.25, y0 + 1.9, -42);
  menu.rotation.y = -Math.PI / 2;
  scene.add(menu);

  // 教室の名残り: 学級文庫の本棚
  b.box(2.4, 1.3, 0.4, COL.woodLight, C.minX + 1.4, y0 + 0.65, C.minZ + 0.4);
  for (let i = 0; i < 8; i++) b.box(0.18, 0.7 + (i % 3) * 0.1, 0.3, [0xe07a5f, 0x6a8caf, 0xc9a648, 0x5c6b4a][i % 4], C.minX + 0.55 + i * 0.24, y0 + 1.0, C.minZ + 0.4);
  addBox(C.minX, C.minX + 2.8, C.minZ, C.minZ + 0.8, y0, y0 + 1.6);

  const mesh = b.build();
  scene.add(mesh);

  // ---------------------------------------------------------------- 室内灯
  const mkLight = (x, z, i = 14, d = 13) => {
    const L = new THREE.PointLight(0xffd9a8, i, d, 1.8);
    L.position.set(x, y0 + 2.9, z);
    scene.add(L);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffe8c0 }));
    bulb.position.copy(L.position);
    scene.add(bulb);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.25, 8), new THREE.MeshStandardMaterial({ color: 0x5c6b4a }));
    shade.position.set(x, y0 + 3.1, z);
    scene.add(shade);
  };
  mkLight(-14, -42);   // パン屋
  mkLight(-18.5, -44); // 工房
  mkLight(16, -42);    // カフェ
  mkLight(0, -36.4, 10, 11); // 昇降口
  const ovenLight = new THREE.PointLight(0xff8a3a, 8, 6, 2);
  ovenLight.position.set(-20.2, y0 + 1.0, B.minZ + 2.4);
  scene.add(ovenLight);

  return mesh;
}
