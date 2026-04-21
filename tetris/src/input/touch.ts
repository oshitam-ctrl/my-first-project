// タッチジェスチャー認識。
// 画面下半分のみを操作領域にして、上半分はスクロール等を邪魔しない。
// Pointer Events ベース。マルチタッチ対応。
//
// ジェスチャー：
//  - 横スワイプ（しきい値ごとに1マス移動。連続スワイプで DAS 風）
//  - 下スワイプ（しきい値ごとに1マスソフトドロップ。押しっぱなしで連続）
//  - 下フリック（速度しきい値でハードドロップ）
//  - 上スワイプ（しきい値でホールド）
//  - タップ（短時間・小移動で離す → 右回転）
//  - 長押し（同じ指が動かずに時間経過 → 左回転）
//  - 2本指タップ（同時タッチ → 左回転）

import { CONFIG } from '../config';

export interface InputActions {
  moveLeft(): void;
  moveRight(): void;
  softDropStep(): void;
  hardDrop(): void;
  rotateCW(): void;
  rotateCCW(): void;
  hold(): void;
  onFirstInteraction(): void; // AudioContext 起動用
}

interface ActivePointer {
  id: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startTime: number;
  consumedDx: number; // ここまでに何 px ぶん横移動を消費したか
  consumedDy: number; // ソフトドロップ消費
  moved: boolean;     // 閾値を超えて動いたか
  longPressTimer: number | null;
  // ジェスチャー確定フラグ（確定後は他の認識を抑止）
  committed: 'h' | 'v' | 'flick' | 'tap' | 'long' | 'hold' | null;
}

export class TouchInput {
  private actions: InputActions;
  private active = new Map<number, ActivePointer>();
  private firstInteractionFired = false;

  constructor(el: HTMLElement, actions: InputActions) {
    this.actions = actions;
    el.addEventListener('pointerdown', this.onDown, { passive: false });
    el.addEventListener('pointermove', this.onMove, { passive: false });
    el.addEventListener('pointerup', this.onUp, { passive: false });
    el.addEventListener('pointercancel', this.onUp, { passive: false });
    // ブラウザのコンテキストメニュー抑止
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // 画面下半分のみ反応（上半分は UI 用に残す）
  private isInZone(y: number): boolean {
    return y >= window.innerHeight * 0.35;
  }

  private fireFirstInteraction() {
    if (this.firstInteractionFired) return;
    this.firstInteractionFired = true;
    this.actions.onFirstInteraction();
  }

  private onDown = (e: PointerEvent) => {
    if (!this.isInZone(e.clientY)) return;
    e.preventDefault();
    this.fireFirstInteraction();

    // 2本指タップ判定：既に 1 本タッチ中で、まだジェスチャー確定していなければ 2 本目は左回転
    if (this.active.size === 1) {
      const first = Array.from(this.active.values())[0];
      if (first.committed === null && (performance.now() - first.startTime) < CONFIG.TAP_MAX_DURATION_MS) {
        this.actions.rotateCCW();
        first.committed = 'tap'; // 以降タップ等も発火させない
        return;
      }
    }

    const p: ActivePointer = {
      id: e.pointerId,
      startX: e.clientX, startY: e.clientY,
      lastX: e.clientX, lastY: e.clientY,
      startTime: performance.now(),
      consumedDx: 0,
      consumedDy: 0,
      moved: false,
      longPressTimer: null,
      committed: null,
    };
    this.active.set(e.pointerId, p);

    // 長押しタイマー
    p.longPressTimer = window.setTimeout(() => {
      const cur = this.active.get(p.id);
      if (!cur) return;
      if (cur.committed !== null) return;
      if (!cur.moved) {
        this.actions.rotateCCW();
        cur.committed = 'long';
      }
    }, CONFIG.LONG_PRESS_MS);
  };

  private onMove = (e: PointerEvent) => {
    const p = this.active.get(e.pointerId);
    if (!p) return;
    e.preventDefault();

    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    // 動いた判定
    if (!p.moved && Math.hypot(dx, dy) > CONFIG.TAP_MAX_MOVEMENT_PX) {
      p.moved = true;
      if (p.longPressTimer !== null) {
        clearTimeout(p.longPressTimer);
        p.longPressTimer = null;
      }
    }

    // ジェスチャー方向の確定：大きい軸を優先
    if (p.committed === null && p.moved) {
      if (adx > ady && adx > CONFIG.SWIPE_MOVE_THRESHOLD_PX / 2) p.committed = 'h';
      else if (ady > adx && ady > CONFIG.SWIPE_MOVE_THRESHOLD_PX / 2) p.committed = 'v';
    }

    if (p.committed === 'h') {
      // 横方向：しきい値ごとに1マス
      while (dx - p.consumedDx >= CONFIG.SWIPE_MOVE_THRESHOLD_PX) {
        this.actions.moveRight();
        p.consumedDx += CONFIG.SWIPE_MOVE_THRESHOLD_PX;
      }
      while (p.consumedDx - dx >= CONFIG.SWIPE_MOVE_THRESHOLD_PX) {
        this.actions.moveLeft();
        p.consumedDx -= CONFIG.SWIPE_MOVE_THRESHOLD_PX;
      }
    } else if (p.committed === 'v') {
      if (dy > 0) {
        // 下方向：ソフトドロップ or ハードドロップ
        const now = performance.now();
        const instantVy = (e.clientY - p.lastY) / Math.max(1, (now - p.startTime));
        void instantVy;
        while (dy - p.consumedDy >= CONFIG.SOFT_DROP_THRESHOLD_PX) {
          this.actions.softDropStep();
          p.consumedDy += CONFIG.SOFT_DROP_THRESHOLD_PX;
        }
      } else {
        // 上方向：一定距離でホールド（一度だけ）
        if (-dy >= CONFIG.UP_SWIPE_THRESHOLD_PX) {
          this.actions.hold();
          p.committed = 'hold';
        }
      }
    }

    p.lastX = e.clientX;
    p.lastY = e.clientY;
  };

  private onUp = (e: PointerEvent) => {
    const p = this.active.get(e.pointerId);
    if (!p) return;
    e.preventDefault();

    if (p.longPressTimer !== null) {
      clearTimeout(p.longPressTimer);
      p.longPressTimer = null;
    }

    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;
    const dur = performance.now() - p.startTime;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    // フリック判定（下方向・短時間・長距離）
    if (p.committed === 'v' && dy > 0) {
      const v = dy / Math.max(1, dur); // px/ms
      if (v >= CONFIG.FLICK_VELOCITY_PX_MS && dy >= CONFIG.SWIPE_MOVE_THRESHOLD_PX * 2) {
        this.actions.hardDrop();
        p.committed = 'flick';
      }
    }

    // タップ判定（短時間・小移動・未確定）
    if (p.committed === null && dur < CONFIG.TAP_MAX_DURATION_MS &&
        adx < CONFIG.TAP_MAX_MOVEMENT_PX && ady < CONFIG.TAP_MAX_MOVEMENT_PX) {
      this.actions.rotateCW();
    }

    this.active.delete(e.pointerId);
  };
}
