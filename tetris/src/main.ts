// エントリーポイント。
// ロジック（固定 60Hz シミュレーション）と描画（rAF）は分離。

import { Game } from './engine/game';
import { Renderer } from './render/canvas';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const renderer = new Renderer(canvas);

window.addEventListener('resize', () => renderer.resize());
window.addEventListener('orientationchange', () => renderer.resize());

const game = new Game();
game.start();

// デバッグ用
(window as unknown as { __game: Game }).__game = game;

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
console.log('[tetris] Phase 3 ready. Try: __game.moveLeft(), __game.rotateCW(), __game.hardDrop()');
