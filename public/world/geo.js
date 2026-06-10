// geo.js — 単色パーツを1つの BufferGeometry にマージするビルダー。
// vendor の three コアには mergeGeometries が無いので、非インデックス化して
// position/normal/color を連結する（建物・小物は全部この方式＋vertexColors）。

export function createBuilder(THREE) {
  const parts = [];

  // geom を (x,y,z) へ、回転 ry/rx/rz、スケール s（数値 or [sx,sy,sz]）で配置し hex 色を塗る
  function add(geom, hex, x = 0, y = 0, z = 0, { rx = 0, ry = 0, rz = 0, s = 1 } = {}) {
    let g = geom.index ? geom.toNonIndexed() : geom.clone();
    const m = new THREE.Matrix4();
    const sc = Array.isArray(s) ? s : [s, s, s];
    m.compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
      new THREE.Vector3(sc[0], sc[1], sc[2]),
    );
    g.applyMatrix4(m);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    const c = new THREE.Color(hex);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    parts.push(g);
    return g;
  }

  function box(w, h, d, hex, x, y, z, opts) { return add(new THREE.BoxGeometry(w, h, d), hex, x, y, z, opts); }
  function cyl(rT, rB, h, hex, x, y, z, opts, seg = 8) { return add(new THREE.CylinderGeometry(rT, rB, h, seg), hex, x, y, z, opts); }
  function cone(r, h, hex, x, y, z, opts, seg = 7) { return add(new THREE.ConeGeometry(r, h, seg), hex, x, y, z, opts); }
  function ico(r, hex, x, y, z, opts, detail = 0) { return add(new THREE.IcosahedronGeometry(r, detail), hex, x, y, z, opts); }
  function sph(r, hex, x, y, z, opts) { return add(new THREE.SphereGeometry(r, 7, 6), hex, x, y, z, opts); }

  // 連結して 1 メッシュに（flat=トゥーン風ファセット）
  function build(opts = {}) {
    const geo = mergeParts(THREE, parts);
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true, flatShading: opts.flat !== false, roughness: 0.95, metalness: 0,
      transparent: !!opts.transparent, opacity: opts.opacity != null ? opts.opacity : 1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = opts.castShadow !== false;
    mesh.receiveShadow = opts.receiveShadow !== false;
    return mesh;
  }

  return { add, box, cyl, cone, ico, sph, build, parts };
}

export function mergeParts(THREE, parts) {
  let total = 0;
  for (const g of parts) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  let off = 0;
  for (const g of parts) {
    pos.set(g.attributes.position.array, off * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, off * 3);
    col.set(g.attributes.color.array, off * 3);
    off += g.attributes.position.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

// 文字を描いたキャンバステクスチャの板（看板・黒板・プレート用）
export function textPlane(THREE, { w, h, px = 256, bg = '#f5ede4', fg = '#3a4a2f', lines = [], font = 0.14, border = null }) {
  const cw = px, ch = Math.round(px * (h / w));
  const cv = document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch);
  if (border) { ctx.strokeStyle = border; ctx.lineWidth = cw * 0.02; ctx.strokeRect(cw * 0.02, cw * 0.02, cw - cw * 0.04, ch - cw * 0.04); }
  ctx.fillStyle = fg;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const fs = Math.round(ch * font);
  ctx.font = `700 ${fs}px "Hiragino Sans", "Noto Sans JP", system-ui, sans-serif`;
  const n = lines.length;
  lines.forEach((t, i) => ctx.fillText(t, cw / 2, ch * ((i + 1) / (n + 1))));
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 2;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  return mesh;
}
