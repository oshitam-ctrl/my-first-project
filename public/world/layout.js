// layout.js — ワールド座標の単一情報源（純データ＋純関数、THREE/DOM非依存）。
// 座標系: +x=東, +z=南, y=高さ(m)。原点=校庭の中心。プレイアブル半径 ~150m。
//
// すべての配置・道・川・コライダー・ホットスポットをここで定義し、
// terrain.js（整地マスク）/ buildings.js / props.js / npc.js / quests が共有する。

export const WORLD_R = 152;          // 見えない境界（これより外へは歩けない）
export const YARD_Y = 2.0;           // 校庭の整地高さ
export const WATER_Y = 0.35;         // 川の水面
export const FLOOR_Y = YARD_Y + 0.18; // 校舎1Fの床

// ---------------------------------------------------------------------------
// 校舎（木造2階・南向き）: x -23..23, z -46..-34（奥行き12m）
// ---------------------------------------------------------------------------
export const SCHOOL = {
  minX: -23, maxX: 23, minZ: -46, maxZ: -34,
  doorX: 0, doorHalf: 1.3,          // 昇降口（南壁 z=-34 の開口）
  wallH: 7.6,                        // 軒高（2階建て）
  roofH: 2.6,                        // 切妻屋根の高さ
  // 1F の部屋割り（南側 z -38.4..-34 が廊下、北側が教室）
  corridorZ: -38.4,
  bakery: { minX: -21.6, maxX: -7, minZ: -45.4, maxZ: -38.4, doorX: -14 }, // プチヘルメース
  cafe:   { minX: 7,  maxX: 21.6,  minZ: -45.4, maxZ: -38.4, doorX: 14 }, // South in North
};

export const GYM = { minX: 30, maxX: 50, minZ: -46, maxZ: -26, doorX: 36, h: 8.5 };

// ---------------------------------------------------------------------------
// 道（ポリライン; 幅はだいたい widths[m]）。バス停 → 桜並木 → 橋 → 校庭 → 昇降口
// ---------------------------------------------------------------------------
export const ROADS = [
  { id: 'approach', w: 3.4, pts: [ [14, 108], [12, 88], [10, 66], [6, 44], [2, 24], [0, 8], [0, -33] ] },
  { id: 'kendou',   w: 4.4, pts: [ [-150, 104], [-60, 105], [14, 108], [80, 112], [150, 116] ] }, // 県道（東西）
  { id: 'shrine',   w: 2.2, pts: [ [4, -4], [30, -2], [56, -16], [74, -42], [82, -58], [88, -70] ] }, // 神社参道
  { id: 'backyard', w: 2.0, pts: [ [-20, -28], [-26, -36], [-24, -50], [-10, -54] ] },           // 校舎うらへ
  { id: 'paddy',    w: 2.4, pts: [ [6, 44], [-20, 52], [-48, 64], [-70, 78], [-86, 92] ] },      // 棚田へ
];

// 川（出原川）: 東西に蛇行。z_river(x) が川の中心線。幅 ~9m。
export function riverZ(x) { return 62 + 12 * Math.sin(x / 35) + 3 * Math.sin(x / 11 + 2.0); }
export const RIVER_HALF = 4.6;   // 中心からこの距離まで水
export const RIVER_BANK = 8.5;   // 岸の彫り込み幅

// 橋（approach が川を渡る場所）
export const BRIDGE = { x: 10, z: riverZ(10), w: 4.6, len: 14 };

// ---------------------------------------------------------------------------
// 棚田（南西の段々）: 各矩形を terrace の高さに整地し、水面を張る
// ---------------------------------------------------------------------------
export const PADDIES = [
  { minX: -96, maxX: -56, minZ: 62, maxZ: 84,  y: 1.7 },
  { minX: -92, maxX: -50, minZ: 88, maxZ: 108, y: 1.1 },
  { minX: -52, maxX: -22, minZ: 70, maxZ: 92,  y: 1.4 },
];

// 麦・野菜畑（東）
export const FIELDS = [
  { id: 'wheat', minX: 44, maxX: 76, minZ: 4,  maxZ: 26 },
  { id: 'veg',   minX: 46, maxX: 70, minZ: 32, maxZ: 48 },
];

// 神社の丘（北東）
export const SHRINE = { x: 96, z: -88, hillR: 40, hillH: 11, topR: 14, topY: 14.5 };
export const SHRINE_STEPS = { fromX: 88, fromZ: -70, toX: 94, toZ: -82 }; // 石段の向き

// 農家（赤瓦の民家）
export const HOUSES = [
  { x: -66, z: 34,  ry: 0.4 },
  { x: 58,  z: 52,  ry: -0.5 },
  { x: -44, z: 92,  ry: 0.2 },
  { x: 40,  z: 86,  ry: 2.6 },
];

// 桜並木（approach の z 12..62 の両脇）/ バス停
export const SAKURA_ZONE = { z0: 10, z1: 64, off: 4.5 };
export const BUS_STOP = { x: 17.5, z: 104.5, ry: Math.PI };

// プレイヤー開始位置（バスを降りた所、坂の上に校舎が見える）
export const SPAWN = { x: 14.5, z: 100, ry: Math.PI }; // ry=π → -z（北・校舎方向）を向く

// 校庭の整地矩形（校舎・体育館・広場・遊具を含む）
export const YARD = { minX: -46, maxX: 54, minZ: -58, maxZ: 12, blend: 10 };

// 広場・遊具・うらの設備
export const PLAZA = { x: -32, z: -8 };       // パーゴラ＋ベンチ
export const BENCH_LUNCH = { x: -30, z: -4 }; // 校庭ランチのベンチ
export const PLAYGROUND = { x: 34, z: 0 };    // ブランコ・鉄棒
export const COMPOST = { x: -10, z: -52 };
export const HERB = { minX: -24, maxX: -2, minZ: -56, maxZ: -49 };

// ---------------------------------------------------------------------------
// NPC 配置
// ---------------------------------------------------------------------------
export const NPCS = [
  { id: 'oshita',   x: -13.2, z: -43.4, ry: Math.PI,  kind: 'baker' },    // パン屋カウンターの中
  { id: 'barista',  x: 16,    z: -44.2, ry: Math.PI,  kind: 'barista' },  // カフェカウンターの中
  { id: 'customer', x: -11,   z: -40.6, ry: -2.6,     kind: 'customer' }, // 陳列棚の前
  { id: 'obaachan', x: -28,   z: -7,    ry: 0.6,      kind: 'villager' }, // 広場のベンチ近く
  { id: 'kid',      x: 8,     z: 30,    ry: Math.PI,  kind: 'kid' },      // 桜並木
];

// ---------------------------------------------------------------------------
// ホットスポット（E/タップで反応する場所）。action は main.js が解釈する。
// ---------------------------------------------------------------------------
export const HOTSPOTS = [
  { id: 'oshita',     x: -13.2, z: -42.2, r: 2.6, label: '大下さんと話す',          action: 'talk_oshita' },
  { id: 'counter',    x: -10,   z: -42.2, r: 2.2, label: 'パンを買う',              action: 'shop' },
  { id: 'jars',       x: -20.2, z: -42,   r: 2.4, label: '酵母の瓶棚を見る',        action: 'jars' },
  { id: 'oven',       x: -18.5, z: -44.6, r: 2.2, label: '窯をのぞく',              action: 'oven' },
  { id: 'blackboard', x: -3.4,  z: -37.6, r: 2.2, label: '緑黒板を見る',            action: 'info', info: 'blackboard' },
  { id: 'barista',    x: 16,    z: -43,   r: 2.6, label: '注文する',                action: 'cafe' },
  { id: 'bench',      x: -30,   z: -4,    r: 2.8, label: 'ベンチでひと休み',        action: 'lunch' },
  { id: 'plaza',      x: -34,   z: -10,   r: 3.2, label: '広場の立て札を読む',      action: 'info', info: 'plaza' },
  { id: 'compost',    x: -10,   z: -52,   r: 3.0, label: 'コンポストをのぞく',      action: 'compost' },
  { id: 'herb',       x: -13,   z: -50,   r: 2.6, label: 'ハーブ花壇を見る',        action: 'info', info: 'herb' },
  { id: 'plate',      x: 3.2,   z: -33,   r: 2.4, label: '校名プレートを読む',      action: 'info', info: 'school_plate' },
  { id: 'gym',        x: 36,    z: -25,   r: 3.0, label: '体育館の戸を引く',        action: 'info', info: 'gym' },
  { id: 'busstop',    x: 17.5,  z: 103,   r: 3.2, label: '時刻表を見る',            action: 'info', info: 'busstop' },
  { id: 'bridge',     x: 10,    z: 66,    r: 5.0, label: '川をながめる',            action: 'info', info: 'bridge' },
  { id: 'paddy',      x: -54,   z: 74,    r: 6.0, label: '棚田をながめる',          action: 'info', info: 'paddy' },
  { id: 'shrine',     x: 96,    z: -86,   r: 3.6, label: 'お参りする',              action: 'pray' },
  { id: 'obaachan',   x: -28,   z: -7,    r: 2.4, label: '話しかける',              action: 'talk_villager' },
  { id: 'kid',        x: 8,     z: 30,    r: 2.4, label: '話しかける',              action: 'talk_kid' },
];

// ---------------------------------------------------------------------------
// コライダー登録（プレイヤー円 vs AABB / 円）。builder モジュールが push する。
//  box: {minX,maxX,minZ,maxZ, minY,maxY}  circle: {x,z,r, minY,maxY}
// ---------------------------------------------------------------------------
export const colliders = [];
export function addBox(minX, maxX, minZ, maxZ, minY = -10, maxY = 50) {
  colliders.push({ kind: 'box', minX, maxX, minZ, maxZ, minY, maxY });
}
export function addCircle(x, z, r, minY = -10, maxY = 50) {
  colliders.push({ kind: 'circle', x, z, r, minY, maxY });
}

// 校舎の壁コライダー（開口部つき）。buildings.js のジオメトリと対で更新すること。
export function registerSchoolColliders() {
  const S = SCHOOL, t = 0.32; // 壁厚
  const y0 = FLOOR_Y - 1, y1 = FLOOR_Y + 3.4;
  // 南壁（昇降口の開口 doorX±doorHalf を残す）
  addBox(S.minX, S.doorX - S.doorHalf, S.maxZ - t, S.maxZ + t, y0, y1);
  addBox(S.doorX + S.doorHalf, S.maxX, S.maxZ - t, S.maxZ + t, y0, y1);
  // 北・東・西壁
  addBox(S.minX, S.maxX, S.minZ - t, S.minZ + t, y0, y1);
  addBox(S.minX - t, S.minX + t, S.minZ, S.maxZ, y0, y1);
  addBox(S.maxX - t, S.maxX + t, S.minZ, S.maxZ, y0, y1);
  // 廊下と教室の仕切り壁（z=corridorZ）: パン屋・カフェの戸口を開ける
  const cz = S.corridorZ;
  const gaps = [
    [SCHOOL.bakery.doorX - 1.0, SCHOOL.bakery.doorX + 1.0],
    [SCHOOL.cafe.doorX - 1.0, SCHOOL.cafe.doorX + 1.0],
  ];
  let xs = S.minX;
  for (const [g0, g1] of gaps.sort((a, b) => a[0] - b[0])) {
    addBox(xs, g0, cz - t, cz + t, y0, y1);
    xs = g1;
  }
  addBox(xs, S.maxX, cz - t, cz + t, y0, y1);
  // 部屋の間仕切り（昇降口ホール x -7..7 と教室の境）
  addBox(-7 - t, -7 + t, S.minZ, cz, y0, y1);
  addBox(7 - t, 7 + t, S.minZ, cz, y0, y1);
}

// 体育館（閉鎖・中に入れない）
export function registerGymColliders() {
  addBox(GYM.minX, GYM.maxX, GYM.minZ, GYM.maxZ);
}

// ---------------------------------------------------------------------------
// 純幾何ヘルパ: 点からポリラインまでの距離
// ---------------------------------------------------------------------------
export function distToPolyline(x, z, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const vx = bx - ax, vz = bz - az;
    const L2 = vx * vx + vz * vz || 1e-9;
    let t = ((x - ax) * vx + (z - az) * vz) / L2;
    t = Math.max(0, Math.min(1, t));
    const dx = x - (ax + vx * t), dz = z - (az + vz * t);
    const d = Math.hypot(dx, dz);
    if (d < best) best = d;
  }
  return best;
}

// 道までの距離（最短の道とその幅を返す）
export function distToRoad(x, z) {
  let best = Infinity, w = 3;
  for (const r of ROADS) {
    const d = distToPolyline(x, z, r.pts);
    if (d - r.w * 0.5 < best - w * 0.5) { best = d; w = r.w; }
  }
  return { d: best, w };
}
