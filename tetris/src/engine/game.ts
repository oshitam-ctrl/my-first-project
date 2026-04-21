// ゲーム状態のオーケストレーション。
// 入力イベント → 状態遷移 → スコア更新 → ロックディレイ、までをここで担う。
// 描画・音・触覚は一切扱わない。UI 層は getSnapshot() でこの状態を読み取る。

import { CONFIG, gravityMsForLevel } from '../config';
import { Board } from './board';
import { pieceCells, spawnX } from './piece';
import { SevenBag } from './rng';
import { getKicks, rotateCCW, rotateCW } from './srs';
import {
  ActivePiece,
  Cell,
  ClearInfo,
  GamePhase,
  GameStateSnapshot,
  LastLockResult,
  PieceKind,
  Rotation,
} from './types';

export type MoveResult = 'ok' | 'blocked';

export interface GameHooks {
  onMove?: () => void;
  onRotate?: () => void;
  onSoftDrop?: () => void;
  onHardDrop?: (cells: number) => void;
  onLock?: (result: LastLockResult) => void;
  onHold?: () => void;
  onGameOver?: () => void;
}

export class Game {
  private board = new Board();
  private bag: SevenBag;
  private active: ActivePiece | null = null;
  private hold: PieceKind | null = null;
  private holdUsed = false;
  private phase: GamePhase = 'idle';
  hooks: GameHooks = {};

  // 落下タイマー
  private gravityAccumMs = 0;
  // ソフトドロップ中か
  private softDropping = false;

  private score = 0;
  private lines = 0;
  private level = 1;
  private combo = -1;  // -1 は「今コンボしていない」
  private b2b = false; // 直前の消去が Tetris or T-spin だった
  private tickCount = 0;
  private lastLock: LastLockResult | null = null;

  // 消去アニメ中の保留情報（phase === 'clearing' の間だけ有効）
  // sub: 'flash' は盤面にまだ full rows がある段階、'gravity' は既に collapse 済みで
  //      上のブロックが下に落ちるアニメを見せる段階。
  private pendingClear:
    | { rows: number[]; colors: (PieceKind | null)[][]; sub: 'flash' | 'gravity'; subMs: number; subTotalMs: number }
    | null = null;

  // ソフト/ハードドロップの累計（ロック時にスコアへ反映）
  private softDropCells = 0;

  constructor(seed: number = Date.now() | 0) {
    this.bag = new SevenBag(seed);
  }

  // ---------- 公開 API ----------

  start() {
    this.board.reset();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.b2b = false;
    this.gravityAccumMs = 0;
    this.tickCount = 0;
    this.lastLock = null;
    this.hold = null;
    this.holdUsed = false;
    this.softDropCells = 0;
    this.pendingClear = null;
    this.phase = 'playing';
    this.spawn();
  }

  // 消去アニメ用：現在の保留行と進捗（0..1）を返す
  getClearAnim():
    | { rows: number[]; colors: (PieceKind | null)[][]; sub: 'flash' | 'gravity'; subProgress: number }
    | null {
    if (!this.pendingClear) return null;
    const pc = this.pendingClear;
    const elapsed = pc.subTotalMs - pc.subMs;
    return {
      rows: pc.rows,
      colors: pc.colors,
      sub: pc.sub,
      subProgress: Math.max(0, Math.min(1, elapsed / pc.subTotalMs)),
    };
  }

  getSnapshot(): GameStateSnapshot {
    return {
      phase: this.phase,
      board: this.board.grid.map((row) => row.slice()),
      visibleRows: this.board.visibleRows,
      active: this.active ? { ...this.active } : null,
      hold: this.hold,
      holdUsed: this.holdUsed,
      next: this.bag.peek(5),
      level: this.level,
      lines: this.lines,
      score: this.score,
      combo: Math.max(0, this.combo),
      b2b: this.b2b,
      tickCount: this.tickCount,
      lastLock: this.lastLock,
    };
  }

  // 現在ピースのゴースト位置（描画用）
  ghostY(): number | null {
    if (!this.active) return null;
    return this.board.ghostY(this.active);
  }

  // 現在ピースが固定配置のセルを返す（描画用）
  activeCells(): [number, number][] {
    if (!this.active) return [];
    const out: [number, number][] = [];
    for (const [dx, dy] of pieceCells(this.active.kind, this.active.rot)) {
      out.push([this.active.x + dx, this.active.y + dy]);
    }
    return out;
  }

  // ボード状態を描画用に読み取り（バッファ行も含む）
  boardGrid(): Cell[][] {
    return this.board.grid;
  }

  // ---------- 入力 ----------

  moveLeft(): MoveResult {
    const r = this.shift(-1);
    if (r === 'ok') this.hooks.onMove?.();
    return r;
  }
  moveRight(): MoveResult {
    const r = this.shift(1);
    if (r === 'ok') this.hooks.onMove?.();
    return r;
  }

  softDrop(on: boolean) {
    this.softDropping = on;
  }

  softDropStep(): MoveResult {
    if (!this.active || this.phase !== 'playing') return 'blocked';
    if (this.board.canPlace(this.active.kind, this.active.rot, this.active.x, this.active.y + 1)) {
      this.active.y += 1;
      this.score += CONFIG.SCORE.SOFT_DROP_PER_CELL;
      this.softDropCells += 1;
      this.resetGravityAccum();
      this.hooks.onSoftDrop?.();
      return 'ok';
    }
    return 'blocked';
  }

  hardDrop() {
    if (!this.active || this.phase !== 'playing') return;
    let dy = 0;
    while (this.board.canPlace(this.active.kind, this.active.rot, this.active.x, this.active.y + 1)) {
      this.active.y += 1;
      dy += 1;
    }
    this.score += CONFIG.SCORE.HARD_DROP_PER_CELL * dy;
    this.hooks.onHardDrop?.(dy);
    this.lockPiece();
  }

  rotateCW(): MoveResult {
    const r = this.rotate(+1);
    if (r === 'ok') this.hooks.onRotate?.();
    return r;
  }
  rotateCCW(): MoveResult {
    const r = this.rotate(-1);
    if (r === 'ok') this.hooks.onRotate?.();
    return r;
  }

  holdPiece(): MoveResult {
    if (!this.active || this.phase !== 'playing' || this.holdUsed) return 'blocked';
    const prev = this.hold;
    this.hold = this.active.kind;
    this.holdUsed = true;
    if (prev === null) {
      this.spawn();
    } else {
      this.spawnKind(prev);
    }
    this.hooks.onHold?.();
    return 'ok';
  }

  // ---------- ループから呼ばれる更新 ----------

  update(dtMs: number) {
    this.tickCount++;

    if (this.phase === 'clearing') {
      this.advanceClearing(dtMs);
      return;
    }
    if (this.phase !== 'playing' || !this.active) return;

    const gravity = gravityMsForLevel(this.level);
    const effectiveGravity = this.softDropping
      ? Math.max(8, gravity / CONFIG.SOFT_DROP_MULTIPLIER)
      : gravity;

    this.gravityAccumMs += dtMs;

    // 接地している？
    const onGround = !this.board.canPlace(
      this.active.kind, this.active.rot, this.active.x, this.active.y + 1,
    );

    if (onGround) {
      this.active.lockElapsedMs += dtMs;
      if (this.active.lockElapsedMs >= CONFIG.LOCK_DELAY_MS ||
          this.active.lockResetCount >= CONFIG.LOCK_RESET_MAX) {
        this.lockPiece();
        return;
      }
    } else {
      // 空中：重力で落下
      while (this.gravityAccumMs >= effectiveGravity) {
        this.gravityAccumMs -= effectiveGravity;
        if (this.board.canPlace(this.active.kind, this.active.rot, this.active.x, this.active.y + 1)) {
          this.active.y += 1;
          if (this.softDropping) {
            this.score += CONFIG.SCORE.SOFT_DROP_PER_CELL;
            this.softDropCells += 1;
          }
        } else {
          break;
        }
      }
      // 空中→接地で遅延リセット回数は消費しない
      this.active.lockElapsedMs = 0;
    }
  }

  // ---------- 内部 ----------

  private shift(dx: number): MoveResult {
    if (!this.active || this.phase !== 'playing') return 'blocked';
    if (this.board.canPlace(this.active.kind, this.active.rot, this.active.x + dx, this.active.y)) {
      this.active.x += dx;
      this.onPieceMoved();
      return 'ok';
    }
    return 'blocked';
  }

  private rotate(dir: 1 | -1): MoveResult {
    if (!this.active || this.phase !== 'playing') return 'blocked';
    const from = this.active.rot;
    const to: Rotation = (dir === 1 ? rotateCW(from) : rotateCCW(from));
    const kicks = getKicks(this.active.kind, from, to);
    for (let i = 0; i < kicks.length; i++) {
      const [kx, ky] = kicks[i];
      const nx = this.active.x + kx;
      const ny = this.active.y + ky;
      if (this.board.canPlace(this.active.kind, to, nx, ny)) {
        this.active.rot = to;
        this.active.x = nx;
        this.active.y = ny;
        this.active.lastKickIndex = i;
        this.onPieceMoved();
        return 'ok';
      }
    }
    return 'blocked';
  }

  private onPieceMoved() {
    // 接地中に動いたらロック遅延をリセット（上限まで）
    if (!this.active) return;
    const onGround = !this.board.canPlace(
      this.active.kind, this.active.rot, this.active.x, this.active.y + 1,
    );
    if (onGround && this.active.lockElapsedMs > 0 && this.active.lockResetCount < CONFIG.LOCK_RESET_MAX) {
      this.active.lockElapsedMs = 0;
      this.active.lockResetCount += 1;
    }
  }

  private resetGravityAccum() {
    this.gravityAccumMs = 0;
  }

  private spawn() {
    const kind = this.bag.next();
    this.spawnKind(kind);
  }

  private spawnKind(kind: PieceKind) {
    const x = spawnX(kind, this.board.cols);
    // バッファ行に登場させる（見えない 2 行上）
    const y = 0;
    const piece: ActivePiece = {
      kind, rot: 0, x, y,
      lastKickIndex: 0,
      lockResetCount: 0,
      lockElapsedMs: 0,
    };
    this.holdUsed = false;
    this.softDropCells = 0;
    if (!this.board.canPlace(piece.kind, piece.rot, piece.x, piece.y)) {
      // 出現位置にすら置けない → ゲームオーバー
      this.active = piece;
      this.phase = 'gameover';
      return;
    }
    this.active = piece;
  }

  private lockPiece() {
    if (!this.active) return;
    const p = this.active;

    // T-spin 判定（ロック直前の状態で）
    let isTspin = false;
    let isTspinMini = false;
    if (p.kind === 'T') {
      const { filled, frontFilled } = this.board.tCorners(p);
      if (filled >= 3) {
        // 最後に成功した回転が非(0,0)キックなら通常T-spin（mini判定は別途）
        // mini: 前2隅のうち1つ以下が埋まっている場合
        if (frontFilled >= 2) {
          isTspin = true;
        } else {
          isTspin = true;
          isTspinMini = true;
        }
        // 3-corner rule の例外：最終キックが index 4（I 以外の4つ目キック）なら常に full spin
        if (p.lastKickIndex === 4 && isTspinMini) {
          isTspin = true;
          isTspinMini = false;
        }
      }
    }

    // 盤面に焼き付け
    this.board.merge(p);

    // ライン消去
    const fullRows = this.board.findFullRows();
    const lineCount = fullRows.length;
    const rowColors: (PieceKind | null)[][] = fullRows.map((y) => this.board.grid[y].slice());

    // スコア計算
    const scoreBefore = this.score;
    const isDifficult = lineCount === 4 || (isTspin && lineCount > 0);
    const b2bThisLock = isDifficult && this.b2b;

    let base = 0;
    if (isTspin) {
      if (lineCount === 0) base = isTspinMini ? CONFIG.SCORE.T_SPIN_MINI : CONFIG.SCORE.T_SPIN;
      else if (lineCount === 1) base = isTspinMini ? CONFIG.SCORE.T_SPIN_MINI_SINGLE : CONFIG.SCORE.T_SPIN_SINGLE;
      else if (lineCount === 2) base = CONFIG.SCORE.T_SPIN_DOUBLE;
      else if (lineCount === 3) base = CONFIG.SCORE.T_SPIN_TRIPLE;
    } else {
      if (lineCount === 1) base = CONFIG.SCORE.SINGLE;
      else if (lineCount === 2) base = CONFIG.SCORE.DOUBLE;
      else if (lineCount === 3) base = CONFIG.SCORE.TRIPLE;
      else if (lineCount === 4) base = CONFIG.SCORE.TETRIS;
    }
    let lineScore = base * this.level;
    if (b2bThisLock) lineScore *= CONFIG.SCORE.B2B_MULTIPLIER;

    // コンボ
    if (lineCount > 0) this.combo += 1; else this.combo = -1;
    const comboScore = (this.combo > 0)
      ? CONFIG.SCORE.COMBO_PER_LEVEL * this.combo * this.level
      : 0;

    this.score += Math.floor(lineScore + comboScore);

    // B2B 更新
    if (lineCount > 0) {
      this.b2b = isDifficult;
    }

    const clearInfo: ClearInfo = {
      rows: fullRows,
      isTspin,
      isTspinMini,
      lineCount,
      b2b: b2bThisLock,
      combo: Math.max(0, this.combo),
      scoreGained: this.score - scoreBefore,
    };
    // ロック直前のピース絶対セル（演出用）
    const absCells: [number, number][] = [];
    for (const [dx, dy] of pieceCells(p.kind, p.rot)) {
      absCells.push([p.x + dx, p.y + dy]);
    }

    this.lastLock = {
      ...clearInfo,
      piece: p.kind,
      rowColors,
      pieceCells: absCells,
    };
    this.hooks.onLock?.(this.lastLock);

    this.active = null;
    this.gravityAccumMs = 0;

    if (fullRows.length > 0) {
      // 演出のためにクリア完了を後ろ倒しする（まずは flash+collapse 段階）
      const flashCollapse = CONFIG.LINE_FLASH_MS + CONFIG.LINE_COLLAPSE_MS;
      this.pendingClear = {
        rows: fullRows,
        colors: rowColors,
        sub: 'flash',
        subMs: flashCollapse,
        subTotalMs: flashCollapse,
      };
      this.phase = 'clearing';
    } else {
      this.spawn();
      if ((this.phase as GamePhase) === 'gameover') this.hooks.onGameOver?.();
    }
  }

  // clearing 中のサブ段階を進める。
  // flash 段階終了で実 collapse を行い、gravity 段階へ。
  // gravity 段階終了で次ピース湧き & playing 復帰。
  private advanceClearing(dtMs: number) {
    const pc = this.pendingClear;
    if (!pc) { this.phase = 'playing'; return; }
    pc.subMs -= dtMs;
    if (pc.subMs > 0) return;
    if (pc.sub === 'flash') {
      // 盤面から行を取り除く
      this.board.collapseRows(pc.rows);
      this.lines += pc.rows.length;
      this.level = Math.min(CONFIG.MAX_LEVEL, 1 + Math.floor(this.lines / CONFIG.LINES_PER_LEVEL));
      pc.sub = 'gravity';
      pc.subTotalMs = CONFIG.GRAVITY_DROP_MS;
      pc.subMs = pc.subTotalMs;
      return;
    }
    // gravity 段階終了
    this.pendingClear = null;
    this.phase = 'playing';
    this.spawn();
    if ((this.phase as GamePhase) === 'gameover') this.hooks.onGameOver?.();
  }
}
