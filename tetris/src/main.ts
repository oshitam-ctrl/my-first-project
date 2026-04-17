// エントリーポイント。固定タイムステップ 60Hz でエンジンを更新、
// 描画は requestAnimationFrame で行う（Phase 2 時点ではテキストで状態を吐くだけ）。

import { Game } from './engine/game';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

// ゲームを開始
const game = new Game();
game.start();

// デバッグ用
(window as unknown as { __game: Game }).__game = game;

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
  drawDebug();
  requestAnimationFrame(loop);
}

function drawDebug() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  const s = game.getSnapshot();
  ctx.fillStyle = '#fff';
  ctx.font = '12px monospace';
  const lines = [
    `phase: ${s.phase}`,
    `score: ${s.score}   lines: ${s.lines}   lv: ${s.level}`,
    `combo: ${s.combo}   b2b: ${s.b2b}`,
    `hold: ${s.hold ?? '-'}   next: ${s.next.join(',')}`,
    `active: ${s.active ? `${s.active.kind} r${s.active.rot} (${s.active.x},${s.active.y})` : '-'}`,
    `tick: ${s.tickCount}`,
    '',
    '(Phase 2 — コンソールで __game を触って操作してください)',
  ];
  lines.forEach((t, i) => ctx.fillText(t, 12, 20 + i * 16));

  // 簡易ボード表示
  const cell = 12;
  const offX = 12;
  const offY = 160;
  const g = game.boardGrid();
  const vis = s.visibleRows;
  const start = g.length - vis;
  for (let y = 0; y < vis; y++) {
    for (let x = 0; x < 10; x++) {
      const v = g[start + y][x];
      ctx.fillStyle = v ? '#888' : '#111';
      ctx.fillRect(offX + x * cell, offY + y * cell, cell - 1, cell - 1);
    }
  }
  // アクティブ＋ゴースト描画
  if (s.active) {
    const gy = game.ghostY();
    if (gy !== null) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      for (const [cx, cy] of game.activeCells()) {
        const yy = cy + (gy - s.active.y);
        if (yy - start >= 0) {
          ctx.fillRect(offX + cx * cell, offY + (yy - start) * cell, cell - 1, cell - 1);
        }
      }
    }
    ctx.fillStyle = '#fff';
    for (const [cx, cy] of game.activeCells()) {
      if (cy - start >= 0) {
        ctx.fillRect(offX + cx * cell, offY + (cy - start) * cell, cell - 1, cell - 1);
      }
    }
  }
}

requestAnimationFrame(loop);
console.log('[tetris] Phase 2 engine running. Try: __game.moveLeft(), __game.rotateCW(), __game.hardDrop()');
