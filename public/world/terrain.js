// terrain.js — 地形。heightAt/surfaceAt は純関数（node 単体でテスト可能）。
// buildTerrain(THREE) だけが THREE に依存する。
//
// 見た目のレシピ: 1枚の PlaneGeometry を heightAt で変位し、頂点XZジッター＋
// 頂点カラー＋flatShading でローポリの面構成を出す（スクショの質感）。

import {
  SCHOOL, YARD, YARD_Y, FLOOR_Y, WATER_Y, PADDIES, FIELDS, SHRINE, BRIDGE,
  riverZ, RIVER_HALF, RIVER_BANK, distToRoad,
} from './layout.js';

// ---------------------------------------------------------------------------
// 決定論ノイズ（プラットフォーム差の出にくい sin ハッシュの値ノイズ）
// ---------------------------------------------------------------------------
function hash2(x, z) {
  const h = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return h - Math.floor(h);
}
function smoothstep(a, b, t) {
  const u = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return u * u * (3 - 2 * u);
}
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash2(xi, zi), b = hash2(xi + 1, zi);
  const c = hash2(xi, zi + 1), d = hash2(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; // 0..1
}
export function fbm(x, z) {
  return (vnoise(x, z) * 0.55 + vnoise(x * 2.1 + 13, z * 2.1 + 7) * 0.3 +
          vnoise(x * 4.3 + 31, z * 4.3 + 17) * 0.15);
}

function rectMask(minX, maxX, minZ, maxZ, blend, x, z) {
  const dx = Math.max(minX - x, 0, x - maxX);
  const dz = Math.max(minZ - z, 0, z - maxZ);
  return 1 - smoothstep(0, blend, Math.hypot(dx, dz));
}

function inRect(r, x, z) { return x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ; }

// ---------------------------------------------------------------------------
// 高さ（m）。歩行物理と地形メッシュの両方がこれを使う。
// ---------------------------------------------------------------------------
export function heightAt(x, z) {
  if (inRect(SCHOOL, x, z)) return FLOOR_Y; // 校舎1F の床はフラット

  // ゆるい起伏（常に水面より上に保つ: 1.0..3.5）
  let h = 1.0 + 1.6 * fbm(x * 0.02, z * 0.02) + 0.9 * fbm(x * 0.006 + 9, z * 0.006 + 3);

  // 外周の杉山（南＝谷の出口側は低く開け、川筋は谷として山を切る）
  const dr0 = Math.abs(z - riverZ(x));
  const ds = Math.hypot(x - SHRINE.x, z - SHRINE.z);
  const r = Math.hypot(x, z);
  let mm = smoothstep(112, 158, r);
  mm *= 1 - 0.62 * smoothstep(50, 105, z);
  mm *= 0.15 + 0.85 * smoothstep(8, 36, dr0);
  // 神社の丘の周辺は外周山を弱める（境内が山肌に飲まれないように）
  mm *= 1 - 0.85 * (1 - smoothstep(SHRINE.topR, SHRINE.hillR, ds));
  // 棚田の周辺は山をなだらかに逃がす（段の縁が崖にならないように）
  for (const p of PADDIES) {
    mm *= 1 - 0.92 * rectMask(p.minX, p.maxX, p.minZ, p.maxZ, 18, x, z);
  }
  h += mm * (26 + 9 * fbm(x * 0.03 + 5, z * 0.03 + 7));

  // 神社の丘（頂上は境内の平場 topY に整地）
  h += SHRINE.hillH * (1 - smoothstep(SHRINE.topR, SHRINE.hillR, ds));
  const sm = 1 - smoothstep(SHRINE.topR * 0.5, SHRINE.topR, ds);
  h = h * (1 - sm) + SHRINE.topY * sm;

  // 川の彫り込み
  const dr = Math.abs(z - riverZ(x));
  const rm = 1 - smoothstep(RIVER_HALF * 0.4, RIVER_BANK, dr);
  h = h * (1 - rm) + (WATER_Y - 1.5) * rm;

  // 校庭の整地
  const ym = rectMask(YARD.minX, YARD.maxX, YARD.minZ, YARD.maxZ, YARD.blend, x, z);
  h = h * (1 - ym) + YARD_Y * ym;

  // 棚田の整地
  for (const p of PADDIES) {
    const pm = rectMask(p.minX, p.maxX, p.minZ, p.maxZ, 3.5, x, z);
    h = h * (1 - pm) + p.y * pm;
  }

  // 橋のデッキ（アーチ）— 川を渡る歩行面を持ち上げる
  const bdx = x - BRIDGE.x, bdz = z - BRIDGE.z;
  if (Math.abs(bdx) < BRIDGE.w && Math.abs(bdz) < BRIDGE.len * 0.72) {
    const deck = 1.15 + 0.85 * Math.cos((bdz / (BRIDGE.len * 0.66)) * Math.PI * 0.5);
    const bm = (1 - smoothstep(BRIDGE.w * 0.45, BRIDGE.w, Math.abs(bdx))) *
               (1 - smoothstep(BRIDGE.len * 0.46, BRIDGE.len * 0.72, Math.abs(bdz)));
    h = h * (1 - bm) + Math.max(h, deck) * bm;
  }
  return h;
}

// ---------------------------------------------------------------------------
// 足元の種類（足音・演出用）
// ---------------------------------------------------------------------------
export function surfaceAt(x, z) {
  if (inRect(SCHOOL, x, z)) return 'floor';
  const bdx = x - BRIDGE.x, bdz = z - BRIDGE.z;
  if (Math.abs(bdx) < BRIDGE.w * 0.6 && Math.abs(bdz) < BRIDGE.len * 0.55) return 'stone';
  if (Math.abs(z - riverZ(x)) < RIVER_HALF) return 'water';
  const { d, w } = distToRoad(x, z);
  if (d < w * 0.5) return 'path';
  if (rectMask(YARD.minX, YARD.maxX, YARD.minZ, YARD.maxZ, YARD.blend, x, z) > 0.7) return 'yard';
  return 'grass';
}

// ---------------------------------------------------------------------------
// 頂点カラー（パステルの草・道・川床・土・岩を滑らかにブレンド）
// ---------------------------------------------------------------------------
const C = {
  grassA: [0.49, 0.78, 0.31], grassB: [0.35, 0.62, 0.24],
  path:   [0.85, 0.77, 0.60], yard:   [0.80, 0.70, 0.52],
  bed:    [0.54, 0.48, 0.36], paddy:  [0.42, 0.60, 0.30],
  mud:    [0.45, 0.38, 0.28], rock:   [0.55, 0.56, 0.54],
  soil:   [0.52, 0.40, 0.28],
};
function mix3(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function colorAt(x, z, h) {
  const n = fbm(x * 0.08 + 3, z * 0.08 + 5);
  let c = mix3(C.grassA, C.grassB, n);

  // 畑（畝のストライプ）
  for (const f of FIELDS) {
    const fm = rectMask(f.minX, f.maxX, f.minZ, f.maxZ, 2, x, z);
    if (fm > 0) {
      const row = 0.5 + 0.5 * Math.sin(z * 2.4);
      const fc = f.id === 'wheat' ? mix3([0.86, 0.74, 0.38], C.soil, row * 0.5)
                                  : mix3([0.36, 0.56, 0.26], C.soil, 0.35 + row * 0.4);
      c = mix3(c, fc, fm * 0.9);
    }
  }
  // 棚田（泥色 — 稲と水は別メッシュ）
  for (const p of PADDIES) {
    const pm = rectMask(p.minX, p.maxX, p.minZ, p.maxZ, 2.5, x, z);
    if (pm > 0) c = mix3(c, C.mud, pm * 0.85);
  }
  // 校庭（乾いた土）
  const ym = rectMask(YARD.minX, YARD.maxX, YARD.minZ, YARD.maxZ, YARD.blend, x, z);
  if (ym > 0) c = mix3(c, C.yard, ym * (0.55 + 0.25 * fbm(x * 0.2, z * 0.2)));
  // 道
  const { d, w } = distToRoad(x, z);
  const pm = 1 - smoothstep(w * 0.5, w * 0.5 + 1.8, d);
  if (pm > 0) c = mix3(c, C.path, pm * 0.92);
  // 川床
  const rm = 1 - smoothstep(RIVER_HALF * 0.5, RIVER_BANK, Math.abs(z - riverZ(x)));
  if (rm > 0) c = mix3(c, C.bed, rm);
  // 高所は岩肌→緑（杉山の下生え）
  if (h > 9) {
    const t = smoothstep(9, 26, h);
    c = mix3(c, mix3([0.30, 0.45, 0.27], C.rock, smoothstep(18, 30, h)), t * 0.85);
  }
  return c;
}

// ---------------------------------------------------------------------------
// 地形メッシュ
// ---------------------------------------------------------------------------
export function buildTerrain(THREE) {
  const SIZE = 322, SEG = 172;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), z = pos.getZ(i);
    // 有機的なファセットのための XZ ジッター（決定論）
    x += (hash2(x * 3.7, z * 3.7) - 0.5) * 1.25;
    z += (hash2(x * 5.1 + 7, z * 5.1 + 7) - 0.5) * 1.25;
    const h = heightAt(x, z);
    pos.setXYZ(i, x, h, z);
    const c = colorAt(x, z, h);
    colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2];
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, flatShading: true, roughness: 1, metalness: 0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}
