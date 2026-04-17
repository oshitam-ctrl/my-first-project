// エントリーポイント。Phase 1 ではキャンバスを真っ黒に塗るだけ。
// Phase 2 以降でゲームループが接続される。

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
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
}

window.addEventListener('resize', resize);
resize();

// 起動確認
console.log('[tetris] Phase 1 boot OK');
