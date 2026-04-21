// =============================================================
// ゲームフィールを左右するチューニング値の聖域。
// プログラマでなくてもここだけ触れば遊び心地を変えられる前提。
// 数値の単位・意味はコメントに必ず書く。
// =============================================================

export const CONFIG = {
  // ----- ボード -----
  COLS: 10,
  ROWS: 20,
  BUFFER_ROWS: 2, // 上端に隠しバッファ（湧き位置用）

  // ----- タイミング（ミリ秒） -----
  DAS_MS: 133,              // Delayed Auto Shift：長押しで連続移動が始まるまでの遅延
  ARR_MS: 16,               // Auto Repeat Rate：連続移動の間隔（16ms = 1frame）
  SOFT_DROP_MULTIPLIER: 20, // ソフトドロップ中は通常落下の何倍速にするか
  LOCK_DELAY_MS: 500,       // 接地してから固定されるまでの猶予
  LOCK_RESET_MAX: 15,       // 接地後の移動・回転でロック遅延をリセットできる最大回数

  // ----- ジェスチャー閾値 -----
  SWIPE_MOVE_THRESHOLD_PX: 24, // 横スワイプがこの距離進むごとに1マス移動
  SOFT_DROP_THRESHOLD_PX: 24,  // 下スワイプがこの距離進むごとにソフトドロップ1マス
  FLICK_VELOCITY_PX_MS: 1.2,   // px/ms。縦スワイプでこの速度を超えたらハードドロップ
  TAP_MAX_DURATION_MS: 200,    // この時間内に指を離すとタップ扱い
  TAP_MAX_MOVEMENT_PX: 10,     // タップと認められる最大移動距離
  LONG_PRESS_MS: 350,          // 長押しとみなす時間（左回転）
  UP_SWIPE_THRESHOLD_PX: 40,   // ホールド発動に必要な上スワイプ距離

  // ----- ゲームフィール：視覚演出 -----
  SQUASH_DURATION_MS: 100,   // 着地時の縦スクイーズ時間
  LINE_FLASH_MS: 50,         // ライン消去時の白フラッシュ
  LINE_COLLAPSE_MS: 100,     // ラインが吸い込まれる時間
  GRAVITY_DROP_MS: 150,      // 上のブロックがパタンと落ちる時間
  SHAKE_DURATION_MS: 200,    // スクリーンシェイクの長さ
  SHAKE_STRENGTH_PX: 6,      // Tetris時のシェイク振幅（最大px）

  // ----- 触覚（ミリ秒） -----
  VIBRATE_LOCK_MS: 10,
  VIBRATE_LINE_PER_LINE_MS: 15,
  VIBRATE_TETRIS_PATTERN: [30, 40, 30] as number[],

  // ----- ゴースト -----
  GHOST_ALPHA: 0.22,

  // ----- スコア（ガイドライン準拠） -----
  SCORE: {
    SINGLE: 100,
    DOUBLE: 300,
    TRIPLE: 500,
    TETRIS: 800,
    T_SPIN_MINI: 100,
    T_SPIN_MINI_SINGLE: 200,
    T_SPIN: 400,
    T_SPIN_SINGLE: 800,
    T_SPIN_DOUBLE: 1200,
    T_SPIN_TRIPLE: 1600,
    B2B_MULTIPLIER: 1.5,
    COMBO_PER_LEVEL: 50,
    SOFT_DROP_PER_CELL: 1,
    HARD_DROP_PER_CELL: 2,
  },

  // ----- レベル -----
  LINES_PER_LEVEL: 10,
  MAX_LEVEL: 20,

  // ----- ピース色（SRS公式＋控えめなグロー） -----
  COLORS: {
    I: '#00e6ea',
    O: '#f2d13d',
    T: '#a54bd6',
    S: '#3dd66a',
    Z: '#e6434a',
    J: '#3d6ae6',
    L: '#e6933d',
    GARBAGE: '#555',
  },
};

// レベルnでの1マス落下にかかる秒数（ガイドライン準拠）。
// level 1 は約 1秒/セル、15 で瞬時レベル。
export function gravityMsForLevel(level: number): number {
  const n = Math.max(1, Math.min(level, CONFIG.MAX_LEVEL));
  const seconds = Math.pow(0.8 - (n - 1) * 0.007, n - 1);
  return seconds * 1000;
}
