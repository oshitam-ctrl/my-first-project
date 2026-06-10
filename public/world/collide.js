// collide.js — 衝突解決（純ロジック、THREE非依存）。
// プレイヤー＝半径 r の円（XZ平面）。コライダーは AABB と円（layout.js 形式）。
// resolve() は押し出し後の位置を返す（壁ずりスライドになる）。
// 段差 STEP_MAX を超える地形上昇は「壁」として扱う（崖・土手）。

export const PLAYER_R = 0.42;
export const STEP_MAX = 1.05;

// y範囲が重なるコライダーだけを対象に、円を押し出す
export function resolve(x, z, y, r, colliders) {
  let px = x, pz = z;
  for (let pass = 0; pass < 2; pass++) { // 角で2枚の壁に当たるケースのため2回
    for (const c of colliders) {
      if (y + 1.4 < c.minY || y > c.maxY) continue;
      if (c.kind === 'box') {
        const cx = Math.max(c.minX, Math.min(px, c.maxX));
        const cz = Math.max(c.minZ, Math.min(pz, c.maxZ));
        let dx = px - cx, dz = pz - cz;
        let d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        if (d2 < 1e-9) {
          // 中心がAABB内: いちばん近い面へ押し出す
          const L = px - c.minX, R = c.maxX - px, T = pz - c.minZ, B = c.maxZ - pz;
          const m = Math.min(L, R, T, B);
          if (m === L) px = c.minX - r; else if (m === R) px = c.maxX + r;
          else if (m === T) pz = c.minZ - r; else pz = c.maxZ + r;
        } else {
          const d = Math.sqrt(d2), k = (r - d) / d;
          px += dx * k; pz += dz * k;
        }
      } else { // circle
        let dx = px - c.x, dz = pz - c.z;
        const rr = r + c.r;
        const d2 = dx * dx + dz * dz;
        if (d2 >= rr * rr || d2 < 1e-9) continue;
        const d = Math.sqrt(d2), k = (rr - d) / d;
        px += dx * k; pz += dz * k;
      }
    }
  }
  return { x: px, z: pz };
}

// 1ステップの移動を解決: 段差チェック→コライダー押し出し→接地高さを返す
export function step(pos, dx, dz, heightAt, colliders, r = PLAYER_R) {
  let nx = pos.x + dx, nz = pos.z + dz;
  // 急な段差（崖登り）は軸ごとに止める＝土手沿いに歩ける
  const h0 = heightAt(pos.x, pos.z);
  if (heightAt(nx, pos.z) - h0 > STEP_MAX) nx = pos.x;
  if (heightAt(nx, nz) - heightAt(nx, pos.z) > STEP_MAX) nz = pos.z;
  const out = resolve(nx, nz, pos.y, r, colliders);
  return { x: out.x, z: out.z, y: heightAt(out.x, out.z) };
}

// カメラ用: 線分 a→b が最初にコライダー/地形に当たる t (0..1)。当たらなければ 1。
export function segmentClearT(ax, ay, az, bx, by, bz, heightAt, colliders, pad = 0.25) {
  let t = 1;
  // 地形: サンプリングで最初に潜る点を探す
  const N = 12;
  for (let i = 1; i <= N; i++) {
    const u = i / N;
    const x = ax + (bx - ax) * u, y = ay + (by - ay) * u, z = az + (bz - az) * u;
    if (y < heightAt(x, z) + pad) { t = Math.min(t, (i - 1) / N); break; }
  }
  // AABB: slab 法
  for (const c of colliders) {
    if (c.kind !== 'box') continue;
    const hit = raySlab(ax, ay, az, bx - ax, by - ay, bz - az,
      c.minX - pad, c.maxX + pad, c.minY, c.maxY, c.minZ - pad, c.maxZ + pad);
    if (hit != null && hit < t) t = hit;
  }
  return Math.max(0, t);
}

function raySlab(ox, oy, oz, dx, dy, dz, x0, x1, y0, y1, z0, z1) {
  let tmin = 0, tmax = 1;
  const axes = [[ox, dx, x0, x1], [oy, dy, y0, y1], [oz, dz, z0, z1]];
  for (const [o, d, lo, hi] of axes) {
    if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) return null; continue; }
    let t0 = (lo - o) / d, t1 = (hi - o) / d;
    if (t0 > t1) { const tt = t0; t0 = t1; t1 = tt; }
    tmin = Math.max(tmin, t0); tmax = Math.min(tmax, t1);
    if (tmin > tmax) return null;
  }
  return tmin > 0 ? tmin : null; // 始点が内側なら無視（プレイヤー周辺）
}
