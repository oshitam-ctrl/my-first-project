// ボード（固定済みセルのグリッド）と、ピース配置・衝突判定・ライン消去。
// ピースの「アクティブ状態」はこのクラスには入れない。純粋に固定された盤面を扱う。

import { CONFIG } from '../config';
import { pieceCells } from './piece';
import { ActivePiece, Cell, PieceKind, Rotation } from './types';

export class Board {
  readonly cols: number;
  readonly rows: number;       // 内部グリッドの総行数（バッファ含む）
  readonly visibleRows: number;
  grid: Cell[][];              // [row][col]

  constructor(cols = CONFIG.COLS, visibleRows = CONFIG.ROWS, bufferRows = CONFIG.BUFFER_ROWS) {
    this.cols = cols;
    this.visibleRows = visibleRows;
    this.rows = visibleRows + bufferRows;
    this.grid = Board.emptyGrid(this.rows, this.cols);
  }

  static emptyGrid(rows: number, cols: number): Cell[][] {
    return Array.from({ length: rows }, () => Array<Cell>(cols).fill(null));
  }

  reset() {
    this.grid = Board.emptyGrid(this.rows, this.cols);
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  isEmpty(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return false;
    return this.grid[y][x] === null;
  }

  // ピースがその位置に置けるか？（外枠・既存ブロックと衝突しない）
  canPlace(kind: PieceKind, rot: Rotation, px: number, py: number): boolean {
    const cells = pieceCells(kind, rot);
    for (const [dx, dy] of cells) {
      const x = px + dx;
      const y = py + dy;
      if (x < 0 || x >= this.cols) return false;
      if (y >= this.rows) return false;
      if (y < 0) continue; // バッファ上端は超えても OK とするが、今回は rows 上端=バッファなので負は許容
      if (this.grid[y][x] !== null) return false;
    }
    return true;
  }

  // 現ピースを盤面に焼き付ける。ロック時に呼ぶ。
  merge(p: ActivePiece) {
    const cells = pieceCells(p.kind, p.rot);
    for (const [dx, dy] of cells) {
      const x = p.x + dx;
      const y = p.y + dy;
      if (y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
        this.grid[y][x] = p.kind;
      }
    }
  }

  // 揃っている行のインデックスを列挙（小さい順）
  findFullRows(): number[] {
    const full: number[] = [];
    for (let y = 0; y < this.rows; y++) {
      let all = true;
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x] === null) { all = false; break; }
      }
      if (all) full.push(y);
    }
    return full;
  }

  // 指定行を消して上から落下させる
  collapseRows(rows: number[]) {
    if (rows.length === 0) return;
    const keep: Cell[][] = [];
    const set = new Set(rows);
    for (let y = 0; y < this.rows; y++) {
      if (!set.has(y)) keep.push(this.grid[y]);
    }
    const missing = this.rows - keep.length;
    const prepend: Cell[][] = Array.from({ length: missing }, () => Array<Cell>(this.cols).fill(null));
    this.grid = prepend.concat(keep);
  }

  // ゴースト落下位置を計算（ピースを衝突するまで下に動かした y）
  ghostY(p: ActivePiece): number {
    let y = p.y;
    while (this.canPlace(p.kind, p.rot, p.x, y + 1)) y++;
    return y;
  }

  // T-spin 判定用：ピース中心の 4 隅ブロック数
  tCorners(p: ActivePiece): { filled: number; frontFilled: number } {
    // T は 3x3 の中心 (1,1) を軸とする
    const cx = p.x + 1;
    const cy = p.y + 1;
    const corners: [number, number][] = [
      [cx - 1, cy - 1], [cx + 1, cy - 1],
      [cx - 1, cy + 1], [cx + 1, cy + 1],
    ];
    // 回転状態ごとの「前側 2 隅」（T の凸側）。順番は上表と一致させる。
    // rot 0: 上向き凸 → 前 = 上2隅
    // rot 1: 右向き凸 → 前 = 右2隅
    // rot 2: 下向き凸 → 前 = 下2隅
    // rot 3: 左向き凸 → 前 = 左2隅
    const frontIdx: Record<Rotation, [number, number]> = {
      0: [0, 1],
      1: [1, 3],
      2: [2, 3],
      3: [0, 2],
    };
    let filled = 0;
    let frontFilled = 0;
    for (let i = 0; i < 4; i++) {
      const [x, y] = corners[i];
      const occ = !this.inBounds(x, y) || this.grid[y][x] !== null;
      if (occ) {
        filled++;
        if (frontIdx[p.rot].includes(i)) frontFilled++;
      }
    }
    return { filled, frontFilled };
  }
}
