// エントリーポイント。
// ロジック（固定 60Hz シミュレーション）と描画（rAF）は分離。
// UI オーバーレイ（スタート・ゲームオーバー）はここで管理。

import { Sfx } from './audio/sfx';
import { Game } from './engine/game';
import { Haptics } from './haptics/vibrate';
import { TouchInput } from './input/touch';
import { Renderer } from './render/canvas';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const uiLayer = document.getElementById('ui-layer') as HTMLElement;
const renderer = new Renderer(canvas);

window.addEventListener('resize', () => renderer.resize());
window.addEventListener('orientationchange', () => renderer.resize());

const sfx = new Sfx();
const game = new Game();

(window as unknown as { __game: Game }).__game = game;

// ---- ハイスコア ----
const HIGHSCORE_KEY = 'tetris.highscore';
function getHighScore(): number {
  try { return parseInt(localStorage.getItem(HIGHSCORE_KEY) ?? '0', 10) || 0; } catch { return 0; }
}
function setHighScore(v: number) {
  try { localStorage.setItem(HIGHSCORE_KEY, String(v)); } catch {}
}

// ---- サウンド & 触覚フック ----
game.hooks.onMove = () => sfx.move();
game.hooks.onRotate = () => sfx.rotate();
game.hooks.onSoftDrop = () => sfx.softDrop();
game.hooks.onHardDrop = () => {};
game.hooks.onHold = () => sfx.hold();
game.hooks.onLock = (r) => {
  sfx.lock();
  renderer.fx.onLock(r.pieceCells);
  if (r.lineCount === 0) {
    Haptics.lock();
  } else {
    sfx.lineClear(r.lineCount);
    renderer.fx.onLineClear(r.rows, r.rowColors, r.lineCount === 4 || r.isTspin);
    renderer.fx.onCombo(r.combo);
    if (r.isTspin) sfx.tspin();
    else if (r.b2b) sfx.b2b();
    if (r.lineCount === 4 || r.isTspin) Haptics.tetris();
    else Haptics.lineClear(r.lineCount);
  }
};
game.hooks.onGameOver = () => {
  sfx.gameOver();
  const hi = getHighScore();
  const s = game.getSnapshot();
  if (s.score > hi) setHighScore(s.score);
  showGameOver(s.score, Math.max(hi, s.score));
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
    case 'R': startGame(); break;
    case 'Enter':
      if (game.getSnapshot().phase === 'idle' || game.getSnapshot().phase === 'gameover') startGame();
      break;
  }
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowDown') game.softDrop(false);
});

// ---- オーバーレイ ----
function clearOverlay() {
  const ov = uiLayer.querySelector('.overlay');
  if (ov) ov.remove();
}

function showStart() {
  clearOverlay();
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `
    <div class="title">TETRIS</div>
    <div class="subtitle">TAP TO START</div>
    <div class="subtitle" style="opacity:0.5;margin-top:32px;font-size:11px;line-height:1.7">
      左右スワイプ：移動 <br/>
      下スワイプ：ソフトドロップ <br/>
      下フリック：ハードドロップ <br/>
      タップ：右回転 <br/>
      長押し／2本指タップ：左回転 <br/>
      上スワイプ：ホールド
    </div>
  `;
  ov.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    sfx.ensure();
    startGame();
  });
  uiLayer.appendChild(ov);
}

function showGameOver(score: number, highScore: number) {
  clearOverlay();
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `
    <div class="subtitle">GAME OVER</div>
    <div class="score-label">SCORE</div>
    <div class="score-big">${score}</div>
    <div class="score-label" style="margin-top:16px">HIGH</div>
    <div class="score-big" style="font-size:20px;opacity:0.7">${highScore}</div>
    <button class="btn" id="retry">RETRY</button>
  `;
  uiLayer.appendChild(ov);
  const retry = ov.querySelector('#retry') as HTMLButtonElement;
  retry.addEventListener('click', (e) => {
    e.stopPropagation();
    startGame();
  });
}

function startGame() {
  clearOverlay();
  game.start();
}

// 初期表示：スタート画面
showStart();

// ---- メインループ ----
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
  renderer.drawFrame(game, dt);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

// ---- PWA：service worker 登録 ----
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('[tetris] sw register failed:', err);
    });
  });
}
