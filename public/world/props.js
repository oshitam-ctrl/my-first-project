// props.js — 周辺の作り込み: 石橋・八幡神社（鳥居/石段/灯籠）・バス停・
// コンポスト・ハーブ花壇・遊具・コミュニティー広場・農家・看板類。

import { createBuilder, textPlane } from './geo.js';
import { heightAt } from './terrain.js';
import {
  BRIDGE, SHRINE, SHRINE_STEPS, BUS_STOP, COMPOST, HERB, PLAYGROUND, PLAZA,
  HOUSES, FIELDS, addBox, addCircle, YARD_Y, riverZ,
} from './layout.js';

import { THEME } from './theme.js';

const ST = THEME.stone;
const WOOD = THEME.wood;
const VERM = THEME.vermilion;

export function buildProps(THREE, scene) {
  const b = createBuilder(THREE);

  // ------------------------------------------------------------------ 石橋
  {
    const { x, z, w, len } = BRIDGE;
    const deckY = (dz) => 1.15 + 0.85 * Math.cos((dz / (len * 0.66)) * Math.PI * 0.5);
    // 欄干（アーチに沿う低い壁）と石の縁
    for (let i = -6; i <= 6; i++) {
      const dz = (i / 6) * (len * 0.52);
      const y = deckY(dz);
      for (const sx of [-1, 1]) {
        b.box(0.34, 0.85, len * 0.105, ST, x + sx * (w * 0.5), y + 0.42, z + dz, { rx: -Math.sin((dz / (len * 0.66)) * Math.PI * 0.5) * 0.2 });
      }
    }
    // アーチの側面（半円のリング風）
    for (const sx of [-1, 1]) {
      const arc = new THREE.CylinderGeometry(2.6, 2.6, 0.3, 12, 1, false, 0, Math.PI);
      b.add(arc, 0xa39c8e, x + sx * (w * 0.5 + 0.02), 0.4, z, { rz: Math.PI / 2, ry: Math.PI / 2 });
    }
    // 親柱
    for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
      b.box(0.5, 1.3, 0.5, ST, x + sx * w * 0.5, deckY(sz * len * 0.5) + 0.55, z + sz * len * 0.5);
      b.sph(0.26, ST, x + sx * w * 0.5, deckY(sz * len * 0.5) + 1.3, z + sz * len * 0.5);
    }
    addBox(x - w * 0.62, x - w * 0.34, z - len * 0.55, z + len * 0.55, 0, 4);
    addBox(x + w * 0.34, x + w * 0.62, z - len * 0.55, z + len * 0.55, 0, 4);
  }

  // -------------------------------------------------------------- 八幡神社
  {
    const { x, z } = SHRINE;
    const y = heightAt(x, z);
    // 社（小さな木造のお堂＋切妻）
    b.box(3.6, 0.5, 3.0, ST, x, y + 0.25, z);
    b.box(2.8, 2.0, 2.2, 0x6e5236, x, y + 1.5, z);
    b.box(3.8, 0.22, 3.2, 0x4a4036, x, y + 2.7, z, { rx: 0.3 });
    b.box(3.8, 0.22, 3.2, 0x4a4036, x, y + 2.7, z, { rx: -0.3 });
    b.box(1.0, 1.2, 0.1, 0x3a3026, x, y + 1.2, z + 1.12); // 扉
    b.box(2.6, 0.16, 0.7, 0x6e5236, x, y + 0.58, z + 1.5); // 階
    addBox(x - 1.9, x + 1.9, z - 1.6, z + 1.6);
    // 賽銭箱と鈴緒
    b.box(0.8, 0.5, 0.5, 0x5d4636, x, y + 0.75, z + 2.0);
    b.cyl(0.04, 0.04, 1.4, 0xd0cabb, x, y + 2.2, z + 2.0, {}, 5);
    b.sph(0.14, 0xc9a648, x, y + 1.55, z + 2.0);
    // 鳥居（参道の入口、丘のふもと）
    const tx = SHRINE_STEPS.fromX, tz = SHRINE_STEPS.fromZ;
    const ty = heightAt(tx, tz);
    const toriiAt = (gx, gz, gy, s = 1) => {
      b.cyl(0.18 * s, 0.22 * s, 3.4 * s, VERM, gx - 1.5 * s, gy + 1.7 * s, gz, {}, 8);
      b.cyl(0.18 * s, 0.22 * s, 3.4 * s, VERM, gx + 1.5 * s, gy + 1.7 * s, gz, {}, 8);
      b.box(4.4 * s, 0.28 * s, 0.3 * s, VERM, gx, gy + 3.5 * s, gz);
      b.box(3.6 * s, 0.22 * s, 0.26 * s, VERM, gx, gy + 2.9 * s, gz);
      b.box(0.16 * s, 0.6 * s, 0.2 * s, VERM, gx, gy + 3.2 * s, gz);
      addCircle(gx - 1.5 * s, gz, 0.3); addCircle(gx + 1.5 * s, gz, 0.3);
    };
    toriiAt(tx, tz, ty, 1.0);
    // 石段（鳥居 → 社）: 厚めの段を重ねて斜面に食い込ませる
    const steps = 22;
    const stepRy = Math.atan2(SHRINE_STEPS.toX - tx, SHRINE_STEPS.toZ - tz);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const sx = tx + (SHRINE_STEPS.toX - tx) * t;
      const sz = tz + (SHRINE_STEPS.toZ - tz) * t;
      b.box(2.8, 0.55, 1.5, ST, sx, heightAt(sx, sz) - 0.12, sz, { ry: stepRy });
    }
    // 鎮守の森（境内のまわりに杉を環状に）
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 + 0.3;
      if (a > 1.55 && a < 2.55) continue; // 石段（南西）側は開ける
      const gx = x + Math.cos(a) * (SHRINE.topR + 2.5);
      const gz = z + Math.sin(a) * (SHRINE.topR + 2.5);
      const gy = heightAt(gx, gz);
      const sc = 1.5 + (i % 3) * 0.4;
      b.cyl(0.25 * sc, 0.4 * sc, 3.6 * sc, 0x6b4a33, gx, gy + 1.8 * sc, gz, {}, 6);
      b.cone(1.7 * sc, 3.2 * sc, 0x3d6b3a, gx, gy + 3.4 * sc, gz);
      b.cone(1.35 * sc, 2.8 * sc, 0x467842, gx, gy + 5.2 * sc, gz);
      b.cone(1.0 * sc, 2.4 * sc, 0x4f854a, gx, gy + 6.9 * sc, gz);
    }
    // 灯籠一対（社の前）
    for (const sx of [-2.6, 2.6]) {
      lantern(b, x + sx, y, z + 3.4);
      addCircle(x + sx, z + 3.4, 0.4);
    }
    // 絵馬掛け
    b.box(2.0, 0.1, 0.1, WOOD, x + 3.4, y + 1.5, z + 1);
    b.box(0.12, 1.5, 0.12, WOOD, x + 2.6, y + 0.75, z + 1);
    b.box(0.12, 1.5, 0.12, WOOD, x + 4.2, y + 0.75, z + 1);
    for (let i = 0; i < 4; i++) b.box(0.3, 0.26, 0.03, 0xe8d5b7, x + 2.9 + i * 0.36, y + 1.25, z + 1);
  }

  // -------------------------------------------------------------- バス停
  {
    const { x, z } = BUS_STOP;
    const y = heightAt(x, z);
    // 標識ポール＋丸板
    b.cyl(0.05, 0.05, 2.6, 0x6f7a82, x, y + 1.3, z, {}, 6);
    b.cyl(0.55, 0.55, 0.06, 0xe8e2d0, x, y + 2.4, z, { rx: Math.PI / 2 }, 12);
    // 小さな待合（柱4本＋片流れ屋根＋ベンチ）
    b.box(0.14, 2.3, 0.14, WOOD, x - 1.6, y + 1.15, z - 1.2);
    b.box(0.14, 2.3, 0.14, WOOD, x + 1.6, y + 1.15, z - 1.2);
    b.box(0.14, 2.1, 0.14, WOOD, x - 1.6, y + 1.05, z + 0.6);
    b.box(0.14, 2.1, 0.14, WOOD, x + 1.6, y + 1.05, z + 0.6);
    b.box(4.0, 0.14, 2.6, 0x76808e, x, y + 2.35, z - 0.3, { rx: 0.12 });
    b.box(3.2, 0.1, 0.45, 0xcaa877, x, y + 0.5, z - 0.9);
    addBox(x - 1.8, x + 1.8, z - 1.45, z - 0.7, y, y + 2);
    const sign = textPlane(THREE, { w: 1.5, h: 0.5, lines: ['南方小学校前'], bg: '#fdfdfb', fg: '#37322c', font: 0.42, border: '#6f7a82' });
    sign.position.set(x, y + 1.8, z + 0.06);
    scene.add(sign);
    // ガードレール（県道沿い）
    for (let gx = x - 26; gx <= x + 26; gx += 2.2) {
      if (Math.abs(gx - x) < 4) continue; // バス停前は開ける
      const gy = heightAt(gx, z + 3.2);
      b.box(0.12, 0.7, 0.12, 0xdadad2, gx, gy + 0.35, z + 3.2);
      b.box(2.2, 0.22, 0.08, 0xdadad2, gx, gy + 0.66, z + 3.2);
    }
  }

  // ------------------------------------------------- コンポストとハーブ花壇
  {
    const { x, z } = COMPOST;
    const y = heightAt(x, z);
    // ぐるぐるコンポスト（回転ドラム）
    b.box(0.16, 1.0, 0.16, WOOD, x - 0.8, y + 0.5, z);
    b.box(0.16, 1.0, 0.16, WOOD, x + 0.8, y + 0.5, z);
    b.cyl(0.55, 0.55, 1.4, 0x5c6b4a, x, y + 1.0, z, { rz: Math.PI / 2 }, 10);
    b.cyl(0.1, 0.1, 0.5, 0x37322c, x + 1.0, y + 1.0, z, { rz: Math.PI / 2 }, 6);
    addCircle(x, z, 0.9);
    // 木枠の堆肥箱
    b.box(1.6, 0.7, 1.6, 0x6e5236, x + 2.4, y + 0.35, z + 0.4);
    b.box(1.3, 0.25, 1.3, 0x4a3a28, x + 2.4, y + 0.8, z + 0.4);
    addBox(x + 1.6, x + 3.2, z - 0.4, z + 1.2);
    const sign = textPlane(THREE, { w: 1.6, h: 0.6, lines: ['ぐるぐるコンポスト', 'パン → 堆肥 → 野菜'], bg: '#5C6B4A', fg: '#F5EDE4', font: 0.24 });
    sign.position.set(x - 2, y + 1.0, z + 0.4);
    sign.rotation.y = 0.4;
    scene.add(sign);
  }
  {
    // ハーブ花壇（レイズドベッド×3 + ローズマリー + バラ）
    const y = YARD_Y;
    for (let i = 0; i < 3; i++) {
      const x0 = HERB.minX + 2 + i * 7.4, z0 = (HERB.minZ + HERB.maxZ) / 2;
      b.box(5.6, 0.45, 2.4, 0x8a6a4a, x0 + 2.4, y + 0.22, z0);
      b.box(5.2, 0.2, 2.0, 0x4a3a28, x0 + 2.4, y + 0.45, z0);
      for (let j = 0; j < 5; j++) {
        const hx = x0 + 0.6 + j * 1.05, hz = z0 + ((j % 2) - 0.5) * 0.9;
        if (i === 2 && j % 2 === 0) {
          b.sph(0.3, 0xd88aa0, hx, y + 0.75, hz); // バラ
          b.cyl(0.04, 0.04, 0.4, 0x4f6a3c, hx, y + 0.5, hz, {}, 5);
        } else {
          b.ico(0.34, i === 0 ? 0x4f6a3c : 0x69b54a, hx, y + 0.68, hz); // ローズマリー等
        }
      }
      addBox(x0 - 0.4, x0 + 5.2, z0 - 1.3, z0 + 1.3);
    }
  }

  // ------------------------------------------------------------- 遊具
  {
    const { x, z } = PLAYGROUND;
    const y = YARD_Y;
    // ブランコ
    b.box(0.16, 2.6, 0.16, 0xd2604a, x - 2, y + 1.3, z, { rz: 0.22 });
    b.box(0.16, 2.6, 0.16, 0xd2604a, x - 3, y + 1.3, z, { rz: -0.22 });
    b.box(0.16, 2.6, 0.16, 0xd2604a, x + 2, y + 1.3, z, { rz: 0.22 });
    b.box(0.16, 2.6, 0.16, 0xd2604a, x + 3, y + 1.3, z, { rz: -0.22 });
    b.box(5.6, 0.16, 0.16, 0xd2604a, x - 0.25, y + 2.55, z);
    for (const sx of [-1.4, 1.2]) {
      b.box(0.05, 1.7, 0.05, 0x9aa5ad, x + sx - 0.25, y + 1.6, z);
      b.box(0.05, 1.7, 0.05, 0x9aa5ad, x + sx + 0.25, y + 1.6, z);
      b.box(0.6, 0.08, 0.3, 0x8a6a4a, x + sx, y + 0.7, z);
    }
    addBox(x - 3.4, x + 3.4, z - 0.5, z + 0.5, y, y + 2.6);
    // 鉄棒（3段）
    for (let i = 0; i < 3; i++) {
      const bx2 = x - 1.5 + i * 1.5, bh = 0.9 + i * 0.35;
      b.cyl(0.05, 0.05, bh, 0x4a78b0, bx2 - 0.7, y + bh / 2, z + 5, {}, 6);
      b.cyl(0.05, 0.05, bh, 0x4a78b0, bx2 + 0.7, y + bh / 2, z + 5, {}, 6);
      b.cyl(0.04, 0.04, 1.4, 0xc0c8d0, bx2, y + bh, z + 5, { rz: Math.PI / 2 }, 6);
    }
    addBox(x - 2.4, x + 2.4, z + 4.6, z + 5.4, y, y + 2);
    // すべり台
    b.box(0.9, 0.12, 3.2, 0xe8b54a, x + 6, y + 1.0, z + 2, { rx: 0.5 });
    b.box(0.12, 0.5, 3.2, 0xd2a23a, x + 5.55, y + 1.2, z + 2, { rx: 0.5 });
    b.box(0.12, 0.5, 3.2, 0xd2a23a, x + 6.45, y + 1.2, z + 2, { rx: 0.5 });
    b.box(1.0, 1.7, 0.2, 0xd2604a, x + 6, y + 0.85, z + 3.6);
    for (let i = 0; i < 4; i++) b.box(0.8, 0.06, 0.06, 0x9aa5ad, x + 6, y + 0.3 + i * 0.4, z + 3.72);
    addBox(x + 5.4, x + 6.6, z + 0.3, z + 3.9, y, y + 2);
  }

  // ------------------------------------------------- コミュニティー広場
  {
    const { x, z } = PLAZA;
    const y = YARD_Y;
    // パーゴラ（町産木材）
    for (const [px, pz] of [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]]) {
      b.box(0.24, 2.7, 0.24, WOOD, x + px, y + 1.35, z + pz);
      addCircle(x + px, z + pz, 0.26);
    }
    for (let i = -3; i <= 3; i++) b.box(6.4, 0.1, 0.22, 0xcaa877, x, y + 2.75, z + i * 0.9);
    b.box(0.2, 0.18, 6.0, WOOD, x - 2.6, y + 2.62, z);
    b.box(0.2, 0.18, 6.0, WOOD, x + 2.6, y + 2.62, z);
    // ベンチ×3（うち1つが校庭ランチの場所）
    for (const [bx2, bz2, ry] of [[2, 4, 0], [-3.6, 1, 1.2], [1, -3.4, -0.4]]) {
      b.box(1.9, 0.1, 0.5, 0xcaa877, x + bx2, y + 0.48, z + bz2, { ry });
      b.box(1.9, 0.42, 0.1, 0xcaa877, x + bx2 - Math.sin(ry) * 0.26, y + 0.75, z + bz2 - Math.cos(ry) * 0.26, { ry });
      b.box(0.14, 0.48, 0.42, WOOD, x + bx2 - Math.cos(ry) * 0.8, y + 0.24, z + bz2 + Math.sin(ry) * 0.8, { ry });
      b.box(0.14, 0.48, 0.42, WOOD, x + bx2 + Math.cos(ry) * 0.8, y + 0.24, z + bz2 - Math.sin(ry) * 0.8, { ry });
      addCircle(x + bx2, z + bz2, 0.5);
    }
    const sign = textPlane(THREE, { w: 1.8, h: 0.9, lines: ['コミュニティー広場', '町産木材でつくりました', 'パンはここで食べてOK'], bg: '#e9e2d4', fg: '#4a4036', font: 0.18, border: '#8a6a4a' });
    sign.position.set(x - 2, y + 1.1, z - 2);
    sign.rotation.y = 0.5;
    scene.add(sign);
    b.box(0.12, 1.1, 0.12, WOOD, x - 2, y + 0.55, z - 2.05);
  }

  // -------------------------------------------------------- 校庭まわりの小物
  {
    // A型黒板（昇降口の前）
    const y = YARD_Y;
    b.box(0.9, 1.2, 0.06, 0x2e3a30, 2.6, y + 0.75, -30.5, { rx: 0.18 });
    b.box(0.9, 1.2, 0.06, 0x2e3a30, 2.6, y + 0.75, -31.1, { rx: -0.18 });
    b.box(1.0, 0.08, 0.7, WOOD, 2.6, y + 0.12, -30.8);
    addCircle(2.6, -30.8, 0.5);
    const aboard = textPlane(THREE, { w: 0.8, h: 1.0, lines: ['OPEN', '🥖', '水・土', '11:30-15:30'], bg: '#2e3a30', fg: '#f0ead2', font: 0.16 });
    aboard.position.set(2.6, 0.78 + y, -30.42);
    aboard.rotation.x = -0.18;
    scene.add(aboard);
    // のぼり旗
    b.cyl(0.04, 0.04, 3.2, WOOD, -3.4, y + 1.6, -30.8, {}, 5);
    const flag = textPlane(THREE, { w: 0.55, h: 2.0, lines: ['パ', 'ン', 'や', 'き', 'た', 'て'], bg: '#E8D5B7', fg: '#5C6B4A', font: 0.1 });
    flag.position.set(-3.1, y + 2.1, -30.8);
    scene.add(flag);
  }

  // ------------------------------------------ 木柵（桜並木の出入り口あたり）
  {
    const road = [[14, 108], [12, 88], [10, 66], [6, 44], [2, 24], [0, 8]];
    const cxAt = (z) => {
      for (let i = 0; i < road.length - 1; i++) {
        const [ax, az] = road[i], [bx, bz] = road[i + 1];
        if ((z - az) * (z - bz) <= 0 && az !== bz) return ax + (bx - ax) * ((z - az) / (bz - az));
      }
      return 0;
    };
    for (const side of [-1, 1]) {
      let prev = null;
      for (let z = 10; z <= 34; z += 2.4) {
        const x = cxAt(z) + side * 3.0;
        const y = heightAt(x, z);
        b.box(0.13, 0.95, 0.13, 0x7d6448, x, y + 0.45, z);
        if (prev) {
          const [px, py, pz] = prev;
          const mx = (x + px) / 2, mz = (z + pz) / 2, my = (y + py) / 2;
          const len = Math.hypot(x - px, z - pz);
          const ry = Math.atan2(x - px, z - pz);
          b.box(0.07, 0.09, len, 0x8a7050, mx, my + 0.74, mz, { ry, rx: Math.atan2(py - y, len) });
          b.box(0.07, 0.09, len, 0x8a7050, mx, my + 0.4, mz, { ry, rx: Math.atan2(py - y, len) });
        }
        prev = [x, y, z];
      }
    }
  }

  // ------------------------------------------ 石積みの護岸（橋のたもと）
  {
    const { x: bx2 } = BRIDGE;
    for (let dx = -9; dx <= 9; dx += 1.3) {
      if (Math.abs(dx) < BRIDGE.w * 0.7) continue;
      const x = bx2 + dx;
      for (const side of [-1, 1]) {
        const z = riverZ(x) + side * (4.6 + 0.9);
        const y = heightAt(x, z);
        b.box(0.9, 0.55 + (Math.abs(dx) % 0.5), 0.7, 0x95907f, x, y + 0.18, z, { ry: dx * 0.4 });
      }
    }
  }

  // ------------------------------------------------------------- 道しるべ
  {
    const x = 6, z = 44, y = heightAt(6, 44);
    b.cyl(0.08, 0.1, 2.0, WOOD, x, y + 1.0, z, {}, 6);
    const s1 = textPlane(THREE, { w: 1.6, h: 0.32, lines: ['↑ 旧南方小学校・プチヘルメース'], bg: '#caa877', fg: '#37322c', font: 0.5 });
    s1.position.set(x, y + 1.7, z + 0.06);
    scene.add(s1);
    const s2 = textPlane(THREE, { w: 1.3, h: 0.32, lines: ['← 棚田 / 出原川 →'], bg: '#caa877', fg: '#37322c', font: 0.5 });
    s2.position.set(x, y + 1.3, z + 0.06);
    scene.add(s2);
    addCircle(x, z, 0.2);
  }

  // ------------------------------------------------------------- 農家
  for (const hse of HOUSES) {
    const y = heightAt(hse.x, hse.z);
    const hb = createBuilder(THREE);
    hb.box(7.5, 0.4, 6.0, ST, 0, 0.2, 0);
    hb.box(7.0, 2.8, 5.4, 0xf0e8da, 0, 1.8, 0);
    hb.box(8.2, 0.22, 3.6, 0x96503c, 0, 3.7, 1.45, { rx: 0.42 });
    hb.box(8.2, 0.22, 3.6, 0x96503c, 0, 3.7, -1.45, { rx: -0.42 });
    hb.box(8.4, 0.26, 0.5, 0x7a4030, 0, 4.35, 0);
    hb.box(1.0, 1.8, 0.12, 0x5d4636, 1.6, 1.3, 2.72);
    hb.box(1.6, 1.0, 0.12, 0xbcdde9, -1.4, 1.9, 2.72);
    hb.box(1.8, 1.1, 0.14, 0xfdfdfb, -1.4, 1.9, 2.66);
    const m = hb.build();
    m.position.set(hse.x, y, hse.z);
    m.rotation.y = hse.ry;
    scene.add(m);
    addCircle(hse.x, hse.z, 5.0);
  }

  // 畑の小屋とかかし
  {
    const f = FIELDS[0];
    const x = f.maxX + 3, z = (f.minZ + f.maxZ) / 2, y = heightAt(x, z);
    b.box(2.6, 2.2, 2.2, 0x8a6a4a, x, y + 1.1, z);
    b.box(3.2, 0.18, 2.8, 0x6e5236, x, y + 2.4, z, { rx: 0.25 });
    addBox(x - 1.5, x + 1.5, z - 1.3, z + 1.3);
    const sx = f.minX + 8, sz = f.minZ + 8, sy = heightAt(sx, sz);
    b.cyl(0.05, 0.05, 1.8, WOOD, sx, sy + 0.9, sz, {}, 5);
    b.box(1.0, 0.08, 0.08, WOOD, sx, sy + 1.4, sz);
    b.sph(0.22, 0xe8d5b7, sx, sy + 1.85, sz);
    b.cone(0.3, 0.3, 0xc9a648, sx, sy + 2.1, sz);
  }

  const mesh = b.build();
  scene.add(mesh);
  return mesh;
}

// 石灯籠（じわっと光る火袋）
function lantern(b, x, groundY, z) {
  b.box(0.6, 0.18, 0.6, ST, x, groundY + 0.09, z);
  b.cyl(0.14, 0.18, 0.9, ST, x, groundY + 0.6, z, {}, 6);
  b.box(0.5, 0.4, 0.5, ST, x, groundY + 1.25, z);
  b.box(0.22, 0.22, 0.22, 0xffd9a8, x, groundY + 1.25, z, { s: 1.01 });
  b.box(0.7, 0.16, 0.7, ST, x, groundY + 1.53, z);
  b.sph(0.12, ST, x, groundY + 1.66, z);
}

export { lantern };
