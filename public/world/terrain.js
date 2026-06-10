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
// スプラット重み（草/土/岩のブレンド比）と色味（テクスチャに乗算するティント）
// ---------------------------------------------------------------------------
export function splatAt(x, z, h) {
  let dirt = 0, rock = 0;
  // 道・校庭・川床・棚田・畑は土。道は「踏み固め→枯れ際→草」の2段で馴染ませる
  const { d, w } = distToRoad(x, z);
  const core = 1 - smoothstep(w * 0.42, w * 0.55, d);
  const verge = (1 - smoothstep(w * 0.5, w * 0.5 + 3.2, d)) * (0.45 + 0.3 * fbm(x * 0.3, z * 0.3));
  dirt = Math.max(dirt, Math.max(core, verge));
  const ym = rectMask(YARD.minX, YARD.maxX, YARD.minZ, YARD.maxZ, YARD.blend, x, z);
  dirt = Math.max(dirt, ym * (0.55 + 0.4 * fbm(x * 0.15, z * 0.15)));
  dirt = Math.max(dirt, 1 - smoothstep(RIVER_HALF * 0.5, RIVER_BANK, Math.abs(z - riverZ(x))));
  for (const p of PADDIES) dirt = Math.max(dirt, rectMask(p.minX, p.maxX, p.minZ, p.maxZ, 2.5, x, z));
  for (const f of FIELDS) dirt = Math.max(dirt, rectMask(f.minX, f.maxX, f.minZ, f.maxZ, 2, x, z) * 0.85);
  // 高所は岩
  rock = smoothstep(13, 28, h) * (0.55 + 0.45 * fbm(x * 0.06 + 11, z * 0.06));
  dirt *= 1 - rock;
  const grass = Math.max(0, 1 - dirt - rock);
  return [grass, dirt, rock];
}

export function tintAt(x, z, h) {
  // ベースはほぼ白（テクスチャ色を活かす）。マクロなムラを強めに入れて単調さを殺す
  const n = fbm(x * 0.08 + 3, z * 0.08 + 5);
  const macro = fbm(x * 0.018 + 21, z * 0.018 + 13); // 大きなパッチ状の枯れ/湿り
  let r = 0.84 + n * 0.26 + macro * 0.18;
  let g = 0.88 + n * 0.2 + macro * 0.1;
  let b = 0.8 + n * 0.18 + macro * 0.06;
  // 道の枯れ際は黄味に倒す
  const { d, w } = distToRoad(x, z);
  const vg = (1 - smoothstep(w * 0.5, w * 0.5 + 3.2, d)) * smoothstep(w * 0.35, w * 0.55, d);
  if (vg > 0) { r *= 1 + 0.1 * vg; g *= 1 + 0.02 * vg; b *= 1 - 0.18 * vg; }
  // 川床は湿って暗く
  const rm = 1 - smoothstep(RIVER_HALF * 0.5, RIVER_BANK, Math.abs(z - riverZ(x)));
  if (rm > 0) { r *= 1 - 0.45 * rm; g *= 1 - 0.42 * rm; b *= 1 - 0.35 * rm; }
  // 棚田の泥は赤茶に
  for (const p of PADDIES) {
    const pm = rectMask(p.minX, p.maxX, p.minZ, p.maxZ, 2.5, x, z);
    if (pm > 0) { r *= 1 - 0.18 * pm; g *= 1 - 0.3 * pm; b *= 1 - 0.38 * pm; }
  }
  // 畑の畝
  for (const f of FIELDS) {
    const fm = rectMask(f.minX, f.maxX, f.minZ, f.maxZ, 2, x, z);
    if (fm > 0) {
      const row = (0.5 + 0.5 * Math.sin(z * 2.4)) * fm;
      r *= 1 - 0.2 * row; g *= 1 - 0.26 * row; b *= 1 - 0.3 * row;
    }
  }
  // 遠い高所はうっすら青く（空気遠近の足し）
  const t = smoothstep(18, 34, h);
  if (t > 0) { r *= 1 - 0.08 * t; g *= 1 - 0.02 * t; b *= 1 + 0.06 * t; }
  return [r, g, b];
}

// ---------------------------------------------------------------------------
// 地形メッシュ — スムーズ法線 + テクスチャスプラッティング（草/土/岩）。
// MeshStandardMaterial を onBeforeCompile で拡張し、頂点属性 splat で3枚を混ぜる。
// ---------------------------------------------------------------------------
export function buildTerrain(THREE, opts = {}) {
  const SIZE = 322;
  const SEG = opts.segments || 220;
  const { grass, grassNm, dirt, rock } = opts.textures;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const tint = new Float32Array(pos.count * 3);
  const splat = new Float32Array(pos.count * 3);
  const TILE = 40; // 草テクスチャの繰り返し回数
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = heightAt(x, z);
    pos.setY(i, h);
    uv.setXY(i, (x / SIZE + 0.5) * TILE, (z / SIZE + 0.5) * TILE);
    const s = splatAt(x, z, h);
    splat[i * 3] = s[0]; splat[i * 3 + 1] = s[1]; splat[i * 3 + 2] = s[2];
    const c = tintAt(x, z, h);
    tint[i * 3] = c[0]; tint[i * 3 + 1] = c[1]; tint[i * 3 + 2] = c[2];
  }
  geo.setAttribute('color', new THREE.BufferAttribute(tint, 3));
  geo.setAttribute('splat', new THREE.BufferAttribute(splat, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    map: grass, normalMap: grassNm, vertexColors: true,
    roughness: 1, metalness: 0,
  });
  mat.normalScale = new THREE.Vector2(0.7, 0.7);
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.dirtMap = { value: dirt };
    shader.uniforms.rockMap = { value: rock };
    shader.vertexShader = 'attribute vec3 splat;\nvarying vec3 vSplat;\n' +
      shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvSplat = splat;');
    // アンチタイリング: 各テクスチャを2スケールでサンプルし、低周波ノイズで混ぜて
    // 繰り返しパターンを破壊する。仕上げに距離で彩度を抜いて空気遠近を出す。
    shader.fragmentShader = ('uniform sampler2D dirtMap;\nuniform sampler2D rockMap;\nvarying vec3 vSplat;\n' +
      `vec4 antiTile( sampler2D tex, vec2 uv ) {
\tfloat m = sin( uv.x * 0.53 + sin( uv.y * 0.41 ) ) * 0.5 + 0.5;
\tvec4 a = texture2D( tex, uv );
\tvec4 b = texture2D( tex, uv * 0.27 + vec2( 0.37, 0.71 ) );
\treturn mix( a, b, smoothstep( 0.3, 0.7, m ) );
}\n` +
      shader.fragmentShader)
      .replace('#include <map_fragment>', `
#ifdef USE_MAP
\tvec4 _g = antiTile( map, vMapUv );
\tvec4 _d = antiTile( dirtMap, vMapUv * 0.6 );
\tvec4 _r = antiTile( rockMap, vMapUv * 0.45 );
\tdiffuseColor *= ( _g * vSplat.x + _d * vSplat.y + _r * vSplat.z );
#endif`)
      .replace('#include <fog_fragment>', `
\t{
\t\tfloat _dist = length( vViewPosition );
\t\tfloat _ds = smoothstep( 70.0, 320.0, _dist );
\t\tfloat _lum = dot( gl_FragColor.rgb, vec3( 0.299, 0.587, 0.114 ) );
\t\tgl_FragColor.rgb = mix( gl_FragColor.rgb, vec3( _lum ) * vec3( 0.95, 1.0, 1.08 ), _ds * 0.45 );
\t}
#include <fog_fragment>`);
  };

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}
