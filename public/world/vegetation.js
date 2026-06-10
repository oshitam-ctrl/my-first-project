// vegetation.js — 木・稲・麦・草。すべて InstancedMesh（種ごとに幹＋葉で2ドロー）。
// 配置は決定論（ハッシュ乱数）。桜並木・広葉樹には幹の円コライダーを登録する。

import { createBuilder, mergeParts } from './geo.js';
import { heightAt, surfaceAt } from './terrain.js';
import {
  SAKURA_ZONE, ROADS, PADDIES, FIELDS, YARD, SCHOOL, GYM, SHRINE,
  distToRoad, riverZ, RIVER_BANK, addCircle, PLAZA,
} from './layout.js';

let seed = 1;
function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

function inRect(r, x, z, pad = 0) {
  return x >= r.minX - pad && x <= r.maxX + pad && z >= r.minZ - pad && z <= r.maxZ + pad;
}

// 木を置けない場所（道・校庭・建物・川・畑・棚田）
function blocked(x, z) {
  if (distToRoad(x, z).d < 3.2) return true;
  if (inRect(YARD, x, z, -4) || inRect(SCHOOL, x, z, 3) || inRect(GYM, x, z, 3)) return true;
  if (Math.abs(z - riverZ(x)) < RIVER_BANK + 1.5) return true;
  for (const p of PADDIES) if (inRect(p, x, z, 2)) return true;
  for (const f of FIELDS) if (inRect(f, x, z, 2)) return true;
  return false;
}

function makeInstanced(THREE, geom, count, opts = {}) {
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, flatShading: true, roughness: 1, metalness: 0,
  });
  const im = new THREE.InstancedMesh(geom, mat, count);
  im.castShadow = opts.castShadow !== false;
  im.receiveShadow = false;
  return im;
}

// 単色を頂点カラーで塗る（instanceColor と乗算される）
function paint(THREE, geom, hex) {
  const g = geom.index ? geom.toNonIndexed() : geom;
  const n = g.attributes.position.count;
  const c = new THREE.Color(hex);
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

export function createVegetation(THREE, scene) {
  seed = 20260610;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
  const V = new THREE.Vector3(), S = new THREE.Vector3();
  const place = (im, i, x, y, z, ry, sc, color) => {
    E.set(0, ry, 0); Q.setFromEuler(E); V.set(x, y, z); S.set(sc, sc * (0.9 + rnd() * 0.25), sc);
    M.compose(V, Q, S);
    im.setMatrixAt(i, M);
    if (color) im.setColorAt(i, color);
  };

  // --- 杉（山肌を囲う） -----------------------------------------------------
  {
    const b = createBuilder(THREE);
    b.cone(1.7, 3.2, 0x3d6b3a, 0, 3.4, 0);
    b.cone(1.35, 2.8, 0x467842, 0, 5.2, 0);
    b.cone(1.0, 2.4, 0x4f854a, 0, 6.9, 0);
    const leaf = mergeParts(THREE, b.parts);
    const trunk = paint(THREE, new THREE.CylinderGeometry(0.22, 0.4, 3.6, 6), 0x6b4a33);
    trunk.translate(0, 1.8, 0);
    const pts = [];
    let guard = 0;
    while (pts.length < 430 && guard++ < 6000) {
      const x = (rnd() - 0.5) * 318, z = (rnd() - 0.5) * 318;
      const h = heightAt(x, z);
      if (h < 5.5 || h > 34) continue;            // 山肌〜中腹だけ
      if (blocked(x, z)) continue;
      if (Math.hypot(x - SHRINE.x, z - SHRINE.z) < SHRINE.topR + 4) continue; // 境内は空ける
      pts.push([x, h, z]);
    }
    const leafIM = makeInstanced(THREE, leaf, pts.length);
    const trunkIM = makeInstanced(THREE, trunk, pts.length);
    const c = new THREE.Color();
    pts.forEach(([x, y, z], i) => {
      const ry = rnd() * Math.PI * 2, sc = 1.2 + rnd() * 1.3;
      c.setHSL(0.36, 0.32, 0.3 + rnd() * 0.12);
      place(leafIM, i, x, y - 0.3, z, ry, sc, c);
      place(trunkIM, i, x, y - 0.3, z, ry, sc, null);
    });
    scene.add(leafIM, trunkIM);
  }

  // --- 桜（並木＋校庭） -------------------------------------------------------
  {
    const b = createBuilder(THREE);
    b.ico(1.5, 0xf6c6d6, 0, 3.3, 0, { s: 1 }, 0);
    b.ico(1.2, 0xf2b4c8, -1.2, 2.8, 0.5, {}, 0);
    b.ico(1.15, 0xf9d4e0, 1.1, 2.9, -0.4, {}, 0);
    b.ico(1.0, 0xf2b4c8, 0.2, 2.6, 1.1, {}, 0);
    b.ico(0.95, 0xf9d4e0, -0.3, 2.4, -1.1, {}, 0);
    const leaf = mergeParts(THREE, b.parts);
    const trunk = paint(THREE, new THREE.CylinderGeometry(0.18, 0.34, 2.8, 6), 0x5d4030);
    trunk.translate(0, 1.4, 0);

    const pts = [];
    // 並木: approach 道の両側に交互
    const road = ROADS.find((r) => r.id === 'approach');
    for (let z = SAKURA_ZONE.z0; z <= SAKURA_ZONE.z1; z += 6.5) {
      // 道の中心 x をポリラインから補間
      let cx = 0;
      for (let i = 0; i < road.pts.length - 1; i++) {
        const [ax, az] = road.pts[i], [bx, bz] = road.pts[i + 1];
        if ((z - az) * (z - bz) <= 0 && az !== bz) { cx = ax + (bx - ax) * ((z - az) / (bz - az)); break; }
      }
      for (const side of [-1, 1]) {
        const x = cx + side * (SAKURA_ZONE.off + rnd() * 1.2);
        const zz = z + (rnd() - 0.5) * 2;
        if (Math.abs(zz - riverZ(x)) < RIVER_BANK) continue;
        pts.push([x, heightAt(x, zz), zz]);
      }
    }
    // 校庭の桜（南端と広場のシンボルツリー）
    for (const [x, z] of [[-12, 9], [14, 9], [26, 8], [PLAZA.x - 4, PLAZA.z - 5], [-44, -30], [52, -20]]) {
      pts.push([x, heightAt(x, z), z]);
    }
    const leafIM = makeInstanced(THREE, leaf, pts.length);
    const trunkIM = makeInstanced(THREE, trunk, pts.length);
    const c = new THREE.Color();
    pts.forEach(([x, y, z], i) => {
      const ry = rnd() * Math.PI * 2, sc = 1.25 + rnd() * 0.8;
      c.setHSL(0.93, 0.5, 0.82 + rnd() * 0.06);
      place(leafIM, i, x, y - 0.15, z, ry, sc, c);
      place(trunkIM, i, x, y - 0.15, z, ry, sc, null);
      addCircle(x, z, 0.4);
    });
    scene.add(leafIM, trunkIM);
  }

  // --- 広葉樹（里の木） -------------------------------------------------------
  {
    const b = createBuilder(THREE);
    b.ico(1.6, 0x5fae46, 0, 3.6, 0, {}, 0);
    b.ico(1.25, 0x6fbe52, -1.2, 2.9, 0.4, {}, 0);
    b.ico(1.2, 0x4f9a3c, 1.1, 3.0, -0.5, {}, 0);
    const leaf = mergeParts(THREE, b.parts);
    const trunk = paint(THREE, new THREE.CylinderGeometry(0.2, 0.38, 3.0, 6), 0x6b4a33);
    trunk.translate(0, 1.5, 0);
    const pts = [];
    let guard = 0;
    while (pts.length < 120 && guard++ < 4000) {
      const x = (rnd() - 0.5) * 290, z = (rnd() - 0.5) * 290;
      const h = heightAt(x, z);
      if (h < 0.8 || h > 5.5) continue;
      if (blocked(x, z)) continue;
      pts.push([x, h, z]);
    }
    const leafIM = makeInstanced(THREE, leaf, pts.length);
    const trunkIM = makeInstanced(THREE, trunk, pts.length);
    const c = new THREE.Color();
    pts.forEach(([x, y, z], i) => {
      const ry = rnd() * Math.PI * 2, sc = 0.9 + rnd() * 1.1;
      c.setHSL(0.3, 0.42, 0.42 + rnd() * 0.1);
      place(leafIM, i, x, y - 0.15, z, ry, sc, c);
      place(trunkIM, i, x, y - 0.15, z, ry, sc, null);
      addCircle(x, z, 0.4);
    });
    scene.add(leafIM, trunkIM);
  }

  // --- 稲（棚田の列） / 麦（畑の列） ------------------------------------------
  {
    const tuft = paint(THREE, new THREE.ConeGeometry(0.32, 0.85, 5), 0x7fbf4e);
    tuft.translate(0, 0.42, 0);
    const pts = [];
    for (const p of PADDIES) {
      for (let x = p.minX + 2; x < p.maxX - 2; x += 1.7) {
        for (let z = p.minZ + 2; z < p.maxZ - 2; z += 1.7) {
          pts.push([x + (rnd() - 0.5) * 0.4, p.y - 0.1, z + (rnd() - 0.5) * 0.4]);
        }
      }
    }
    const im = makeInstanced(THREE, tuft, pts.length, { castShadow: false });
    const c = new THREE.Color();
    pts.forEach(([x, y, z], i) => {
      c.setHSL(0.27, 0.5, 0.45 + rnd() * 0.12);
      place(im, i, x, y, z, rnd() * 3, 0.8 + rnd() * 0.5, c);
    });
    scene.add(im);
  }
  {
    const tuft = paint(THREE, new THREE.ConeGeometry(0.3, 1.0, 5), 0xe2c25e);
    tuft.translate(0, 0.5, 0);
    const f = FIELDS[0];
    const pts = [];
    for (let x = f.minX + 1.5; x < f.maxX - 1.5; x += 1.4) {
      for (let z = f.minZ + 1.5; z < f.maxZ - 1.5; z += 1.4) {
        pts.push([x + (rnd() - 0.5) * 0.3, heightAt(x, z), z + (rnd() - 0.5) * 0.3]);
      }
    }
    const im = makeInstanced(THREE, tuft, pts.length, { castShadow: false });
    const c = new THREE.Color();
    pts.forEach(([x, y, z], i) => {
      c.setHSL(0.12, 0.6, 0.58 + rnd() * 0.1);
      place(im, i, x, y, z, rnd() * 3, 0.8 + rnd() * 0.5, c);
    });
    scene.add(im);
  }

  // --- 野菜畑（緑のまるい株） ---------------------------------------------------
  {
    const bush = paint(THREE, new THREE.IcosahedronGeometry(0.4, 0), 0x4f9a3c);
    bush.translate(0, 0.3, 0);
    const f = FIELDS[1];
    const pts = [];
    for (let x = f.minX + 1.5; x < f.maxX - 1.5; x += 2.0) {
      for (let z = f.minZ + 1.5; z < f.maxZ - 1.5; z += 2.0) {
        pts.push([x, heightAt(x, z), z]);
      }
    }
    const im = makeInstanced(THREE, bush, pts.length, { castShadow: false });
    const c = new THREE.Color();
    pts.forEach(([x, y, z], i) => {
      c.setHSL(0.29 + rnd() * 0.05, 0.5, 0.4 + rnd() * 0.15);
      place(im, i, x, y, z, rnd() * 3, 0.8 + rnd() * 0.7, c);
    });
    scene.add(im);
  }

  // --- 草むら（道ばた） --------------------------------------------------------
  {
    const blade = paint(THREE, new THREE.ConeGeometry(0.25, 0.7, 4), 0x69b54a);
    blade.translate(0, 0.32, 0);
    const pts = [];
    let guard = 0;
    while (pts.length < 320 && guard++ < 4000) {
      const x = (rnd() - 0.5) * 240, z = (rnd() - 0.5) * 240;
      const { d, w } = distToRoad(x, z);
      if (d < w * 0.5 + 0.4 || d > w * 0.5 + 4) continue;
      if (surfaceAt(x, z) !== 'grass') continue;
      pts.push([x, heightAt(x, z), z]);
    }
    const im = makeInstanced(THREE, blade, pts.length, { castShadow: false });
    const c = new THREE.Color();
    pts.forEach(([x, y, z], i) => {
      c.setHSL(0.28, 0.5, 0.42 + rnd() * 0.18);
      place(im, i, x, y, z, rnd() * 3, 0.7 + rnd() * 0.8, c);
    });
    scene.add(im);
  }
}
