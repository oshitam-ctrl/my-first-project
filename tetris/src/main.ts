// エントリーポイント。
// ロジック（固定 60Hz シミュレーション）と描画（rAF）は分離。

import { Sfx } from './audio/sfx';
import { Game } from './engine/game';
import { TouchInput } from './input/touch';
import { Renderer } from './render/canvas';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const uiLayer = document.getElementById('ui-layer') as HTMLElement;
const renderer = new Renderer(canvas);

window.addEventListener('resize', () => renderer.resize());
window.addEventListener('orientationchange', () => renderer.resize());

const sfx = new Sfx();
const game = new Game();
game.start();

(window as unknown as { __game: Game }).__game = game;

// ---- サウンドフック ----
game.hooks.onMove = () => sfx.move();
game.hooks.onRotate = () => sfx.rotate();
game.hooks.onSoftDrop = () => sfx.softDrop();
game.hooks.onHardDrop = () => { /* ロック音に吸収 */ };
game.hooks.onHold = () => sfx.hold();
game.hooks.onGameOver = () => sfx.gameOver();
game.hooks.onLock = (r) => {
  sfx.lock();
  if (r.lineCount > 0) {
    sfx.lineClear(r.lineCount);
    if (r.isTspin) sfx.tspin();
    else if (r.b2b) sfx.b2b();
  }
};

// ---- MUTE ボタン ----
const muteBtn = document.createElement('button');
muteBtn.className = 'mute-btn';
muteBtn.setAttribute('aria-label', 'mute');
muteBtn.textContent = '♪';
uiLayer.appendChild(muteBtn);
function updateMuteBtn() { muteBtn.textContent = sfx.isMuted() ? '♪̸' : '♪'; }
muteBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  sfx.ensure();
  sfx.setMuted(!sfx.isMuted());
  updateMuteBtn();
  try { localStorage.setItem('tetris.muted', sfx.isMuted() ? '1' : '0'); } catch {}
});
try { if (localStorage.getItem('tetris.muted') === '1') sfx.setMuted(true); } catch {}
updateMuteBtn();

// ---- タッチ操作 ----
new TouchInput(document.body, {
  moveLeft: () => game.moveLeft(),
  moveRight: () => game.moveRight(),
  softDropStep: () => game.softDropStep(),
  hardDrop: () => game.hardDrop(),
  rotateCW: () => game.rotateCW(),
  rotateCCW: () => game.rotateCCW(),
  hold: () => game.holdPiece(),
  onFirstInteraction: () => sfx.ensure(),
});

// ---- デスクトップキーボード ----
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  sfx.ensure();
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

// ---- メインループ（固定 60Hz シミュレーション + rAF 描画） ----
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
console.log('[tetris] ready');
