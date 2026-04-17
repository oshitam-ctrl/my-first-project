// ゲームフィール演出レイヤ。
// - 着地スクイーズ（ロックしたピースの最下セルを縦に一瞬潰す）
// - ライン消去：白フラッシュ → 左右から吸い込み
// - 上のブロックがパタンと落ちる（150ms ease-out）
// - パーティクル（消去行の色を反映）
// - スクリーンシェイク（Tetris / T-spin）
// - コンボ背景彩度ブースト（最大 10 コンボ）

import { CONFIG } from '../config';
import type { PieceKind } from '../engine/types';

// ---- Particle ----
export interface Particle {
  x: number; y: number;    // ピクセル
  vx: number; vy: number;  // px/ms
  life: number;            // 残ms
  maxLife: number;
  color: string;
  size: number;
}

export interface SquashAnim {
  cells: [number, number][]; // 対象（絶対ボード座標）
  t: number;
  duration: number;
}

export interface ClearAnim {
  rows: number[];                        // 盤面絶対 y（消去対象）
  colors: (PieceKind | null)[][];        // 各行のセル色
  t: number;                             // 経過ms（0..totalMs）
  flashMs: number;                       // 最初の白フラッシュ時間
  collapseMs: number;                    // 左右吸い込み時間
  gravityMs: number;                     // 上ブロックが落ちる時間
}

export class Fx {
  particles: Particle[] = [];
  squash: SquashAnim | null = null;
  clear: ClearAnim | null = null;

  // スクリーンシェイク
  private shakeT = 0;
  private shakeDur = 0;
  private shakeStrength = 0;

  // コンボ彩度
  comboBoost = 0;

  update(dtMs: number) {
    for (const p of this.particles) {
      p.x += p.vx * dtMs;
      p.y += p.vy * dtMs;
      p.vy += 0.0015 * dtMs; // 弱い重力
      p.life -= dtMs;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    if (this.squash) {
      this.squash.t += dtMs;
      if (this.squash.t >= this.squash.duration) this.squash = null;
    }
    if (this.clear) {
      this.clear.t += dtMs;
      const total = this.clear.flashMs + this.clear.collapseMs + this.clear.gravityMs;
      if (this.clear.t >= total) this.clear = null;
    }
    if (this.shakeT > 0) {
      this.shakeT -= dtMs;
      if (this.shakeT < 0) this.shakeT = 0;
    }
    this.comboBoost *= Math.max(0, 1 - dtMs / 800);
  }

  onLock(cells: [number, number][]) {
    this.squash = { cells, t: 0, duration: CONFIG.SQUASH_DURATION_MS };
  }

  onLineClear(
    rows: number[],
    colors: (PieceKind | null)[][],
    isTetrisOrTspin: boolean,
  ) {
    this.clear = {
      rows,
      colors,
      t: 0,
      flashMs: CONFIG.LINE_FLASH_MS,
      collapseMs: CONFIG.LINE_COLLAPSE_MS,
      gravityMs: CONFIG.GRAVITY_DROP_MS,
    };
    if (isTetrisOrTspin) this.shake(CONFIG.SHAKE_STRENGTH_PX, CONFIG.SHAKE_DURATION_MS);
  }

  onCombo(combo: number) {
    this.comboBoost = Math.min(1, combo / 10);
  }

  shake(strength: number, durMs: number) {
    this.shakeStrength = strength;
    this.shakeDur = durMs;
    this.shakeT = durMs;
  }

  getShakeOffset(): [number, number] {
    if (this.shakeT <= 0 || this.shakeDur <= 0) return [0, 0];
    const k = this.shakeT / this.shakeDur;
    const s = this.shakeStrength * k;
    return [(Math.random() * 2 - 1) * s, (Math.random() * 2 - 1) * s];
  }

  spawnParticlesAtPixel(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 0.06 + Math.random() * 0.22;
      this.particles.push({
        x, y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed - 0.15,
        life: 400 + Math.random() * 300,
        maxLife: 700,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }
}

export function easeOutQuad(t: number) { return 1 - (1 - t) * (1 - t); }
