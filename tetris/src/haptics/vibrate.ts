// Vibration API ラッパ。
// iOS Safari には存在しないので、navigator.vibrate が無い環境では黙ってスキップ。
// Android Chrome では利用可能。

import { CONFIG } from '../config';

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export const Haptics = {
  lock() {
    if (canVibrate()) navigator.vibrate(CONFIG.VIBRATE_LOCK_MS);
  },
  lineClear(lines: number) {
    if (!canVibrate()) return;
    navigator.vibrate(Math.max(1, lines) * CONFIG.VIBRATE_LINE_PER_LINE_MS);
  },
  tetris() {
    if (!canVibrate()) return;
    navigator.vibrate(CONFIG.VIBRATE_TETRIS_PATTERN);
  },
};
