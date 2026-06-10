// /world 用 PWA アイコン生成（playwright のキャンバス描画で PNG 化）。
// Run: node test-world/gen-icons.mjs  → public/world/icon-192.png / icon-512.png
import path from 'node:path';

const { chromium } = await import('playwright').catch(() =>
  import('/opt/node22/lib/node_modules/playwright/index.mjs'));

const OUT = path.resolve(import.meta.dirname, '../public/world');
const browser = await chromium.launch({ args: ['--hide-scrollbars'] });
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });

await page.setContent(`<body style="margin:0">
<canvas id="c" width="512" height="512"></canvas>
<script>
const c = document.getElementById('c').getContext('2d');
// 空→ベージュのグラデ背景
const g = c.createLinearGradient(0, 0, 0, 512);
g.addColorStop(0, '#8fc8ff'); g.addColorStop(1, '#F5EDE4');
c.fillStyle = g; c.fillRect(0, 0, 512, 512);
// 遠景の山
c.fillStyle = '#5C6B4A';
c.beginPath(); c.moveTo(-30, 320); c.lineTo(120, 180); c.lineTo(280, 330); c.closePath(); c.fill();
c.beginPath(); c.moveTo(220, 330); c.lineTo(390, 150); c.lineTo(560, 340); c.closePath(); c.fill();
// 地面
c.fillStyle = '#7ec850'; c.fillRect(0, 300, 512, 212);
// スタンプ風バッジ
c.save();
c.translate(256, 270); c.rotate(-0.1);
c.fillStyle = '#F5EDE4'; c.beginPath(); c.arc(0, 0, 150, 0, 7); c.fill();
c.lineWidth = 12; c.strokeStyle = '#5C6B4A'; c.beginPath(); c.arc(0, 0, 150, 0, 7); c.stroke();
c.font = '120px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
c.fillText('🥖', 0, -28);
c.fillStyle = '#5C6B4A'; c.font = '800 34px sans-serif';
c.fillText('プチヘルメース', 0, 62);
c.font = '800 22px sans-serif'; c.fillText('の 谷', 0, 96);
c.restore();
</script></body>`);
await page.waitForTimeout(300);
const canvas = page.locator('#c');
await canvas.screenshot({ path: path.join(OUT, 'icon-512.png') });
await page.setViewportSize({ width: 192, height: 192 });
await page.evaluate(() => {
  const big = document.getElementById('c');
  const s = document.createElement('canvas');
  s.id = 'small'; s.width = 192; s.height = 192;
  s.getContext('2d').drawImage(big, 0, 0, 192, 192);
  big.replaceWith(s);
});
await page.locator('#small').screenshot({ path: path.join(OUT, 'icon-192.png') });
await browser.close();
console.log('icons written to', OUT);
