// textures.js — 実写テクスチャのロードと、キャンバス生成の補完テクスチャ（土・岩）。
// 草・水法線・木は three.js リポジトリ同梱素材（MIT）を vendor/textures/ に同梱。

export function loadRepeat(THREE, url, repeat = 1, srgb = true) {
  const tex = new THREE.TextureLoader().load(url);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 4;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 決定論ノイズキャンバス
function noiseCanvas(size, paint) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  paint(ctx, size);
  return cv;
}
let seed = 7;
function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

// 乾いた土（校庭・あぜ道）
export function makeDirtTexture(THREE) {
  seed = 7;
  const cv = noiseCanvas(256, (ctx, s) => {
    ctx.fillStyle = '#9b8566';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const r = 1 + rnd() * 5;
      const v = 0.75 + rnd() * 0.5;
      ctx.fillStyle = `rgba(${Math.round(140 * v)},${Math.round(118 * v)},${Math.round(88 * v)},${0.25 + rnd() * 0.4})`;
      ctx.beginPath();
      ctx.arc(rnd() * s, rnd() * s, r, 0, 7);
      ctx.fill();
    }
    for (let i = 0; i < 900; i++) { // 小石
      const v = 0.85 + rnd() * 0.45;
      ctx.fillStyle = `rgba(${Math.round(150 * v)},${Math.round(140 * v)},${Math.round(125 * v)},0.7)`;
      ctx.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2, 1 + rnd() * 2);
    }
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// 山肌の岩
export function makeRockTexture(THREE) {
  seed = 31;
  const cv = noiseCanvas(256, (ctx, s) => {
    ctx.fillStyle = '#8d8d88';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 1800; i++) {
      const v = 0.7 + rnd() * 0.6;
      ctx.fillStyle = `rgba(${Math.round(132 * v)},${Math.round(132 * v)},${Math.round(126 * v)},${0.3 + rnd() * 0.4})`;
      const w = 3 + rnd() * 16, h = 2 + rnd() * 6;
      ctx.save();
      ctx.translate(rnd() * s, rnd() * s);
      ctx.rotate(rnd() * 3.14);
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(60,60,56,0.35)'; // ひび
    for (let i = 0; i < 70; i++) {
      ctx.beginPath();
      let x = rnd() * s, y = rnd() * s;
      ctx.moveTo(x, y);
      for (let j = 0; j < 5; j++) { x += (rnd() - 0.5) * 28; y += rnd() * 18; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
