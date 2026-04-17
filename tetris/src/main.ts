// エントリーポイント。
// ロジック（固定 60Hz シミュレーション）と描画（rAF）は分離。

import { Game } from './engine/game';
import { TouchInput } from './input/touch';
import { Renderer } from './render/canvas';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const renderer = new Renderer(canvas);

window.addEventListener('resize', () => renderer.resize());
window.addEventListener('orientationchange', () => renderer.resize());

const game = new Game();
game.start();

(window as unknown as { __game: Game }).__game = game;

// タッチ操作（画面全体で受ける）
new TouchInput(document.body, {
  moveLeft: () => game.moveLeft(),
  moveRight: () => game.moveRight(),
  softDropStep: () => game.softDropStep(),
  hardDrop: () => game.hardDrop(),
  rotateCW: () => game.rotateCW(),
  rotateCCW: () => game.rotateCCW(),
  hold: () => game.holdPiece(),
  onFirstInteraction: () => {},
});

// デスクトップデバッグ用キーボード
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  switch (e.key) {
    case 'ArrowLeft': game.moveLeft(); break;
    case 'ArrowRight': game.moveRight(); break;
    case 'ArrowDown': game.softDrop(true); break;
    case 'ArrowUp':
    case 'x':
    case 'X': game.rotateCW(); break;
    case 'z':
    case 'Z':
    case 'Control': game.rotateCCW(); break;
    case ' ': e.preventDefault(); game.hardDrop(); break;
    case 'c':
    case 'C':
    case 'Shift': game.holdPiece(); break;
    case 'r':
    case 'R': game.start(); break;
  }
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowDown') game.softDrop(false);
});

// 固定タイムステップ 60Hz + rAF 描画
const STEP_MS = 1000 / 60;
let accMs = 0;
let last = performance.now();

function loop(now: number) {
  const dt = Math.min(100, now - last);
  last = now;
  accMs += dt;
  while (accMs >= STEP_MS) {
    game.update(STEP_MS);
    accMs -= STEP_MS;
  }
  renderer.drawFrame(game);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
console.log('[tetris] Phase 4 ready. タッチ or キーボード（←→↓↑/Z/X/Space/Shift/R）で操作');
