// ゲームエンジンで使う型定義。
// ロジック層は描画・入力・音に一切依存しない純粋な状態のみを扱う。

export type PieceKind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

// 0: 初期, 1: 右回転, 2: 180度, 3: 左回転
export type Rotation = 0 | 1 | 2 | 3;

export type Cell = PieceKind | null;

export interface ActivePiece {
  kind: PieceKind;
  rot: Rotation;
  // ピース左上の基準座標（board 座標、列x, 行y, y は下向き正）
  x: number;
  y: number;
  // 最後に成功した回転がキックを伴ったか（T-spin 判定で使う）
  lastKickIndex: number;
  // 接地してからロック遅延リセットに使った回数
  lockResetCount: number;
  // 接地してから経過した時間（ms）
  lockElapsedMs: number;
}

export type GamePhase = 'idle' | 'playing' | 'clearing' | 'gameover';

export interface ClearInfo {
  rows: number[];          // 消えた行インデックス（上が小さい）
  isTspin: boolean;
  isTspinMini: boolean;
  lineCount: number;       // 消えた行数（0-4）
  b2b: boolean;            // この消去が B2B 成立
  combo: number;           // 今回のコンボ数（0始まり：初回消去が0）
  scoreGained: number;
}

export interface LastLockResult extends ClearInfo {
  piece: PieceKind;
  // パーティクル発生用に消去直前のセル色を各行ごとにキャプチャ
  rowColors: (PieceKind | null)[][];
}

export interface GameStateSnapshot {
  phase: GamePhase;
  board: Cell[][];         // [row][col]、row 0 が一番上（内部はバッファ含む）
  visibleRows: number;     // board から見える行数（= ROWS）
  active: ActivePiece | null;
  hold: PieceKind | null;
  holdUsed: boolean;
  next: PieceKind[];
  level: number;
  lines: number;
  score: number;
  combo: number;
  b2b: boolean;
  tickCount: number;
  lastLock: LastLockResult | null;
}
