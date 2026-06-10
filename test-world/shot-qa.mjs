// /world のビジュアルQA — 自前静的サーバ + Playwright(swiftshader) で各所を撮影。
// Run: node test-world/shot-qa.mjs   (出力: /tmp/world_*.png, pageerrors を報告)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

// playwright はローカル node_modules が無くてもグローバル install から引けるようにする
const { chromium } = await import('playwright').catch(() =>
  import('/opt/node22/lib/node_modules/playwright/index.mjs'));

const W = 1280, H = 720;
const ROOT = path.resolve(import.meta.dirname, '../public');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/world' || p === '/world/') p = '/world/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': (MIME[path.extname(f)] || 'application/octet-stream') + '; charset=utf-8' });
  res.end(await readFile(f));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars', '--mute-audio'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(`http://localhost:${port}/world`, { waitUntil: 'load' });
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/world_title.png' });
await page.click('#overlay', { timeout: 60000 }).catch(() => {});
await page.waitForTimeout(1500);

// 三人称（プレイヤー視点）のショット: __warp で移動して追従カメラのまま撮る
const WARPS = {
  world_spawn:  [14.5, 100, Math.PI],       // バス停からの出発
  world_alley:  [4, 36, Math.PI],           // 桜並木
  world_bridge_walk: [10, 72, Math.PI],     // 石橋を渡る
  world_yard:   [0, -16, Math.PI],          // 校庭から校舎正面
  world_bakery: [-14, -39.3, Math.PI],      // パン屋の中（戸口から面陳列へ）
  world_counter: [-11.5, -41.2, -2.4],      // カウンターと大下さん
  world_cafe:   [15, -41, Math.PI],         // カフェ
};
for (const [name, [x, z, ry]] of Object.entries(WARPS)) {
  try {
    await page.evaluate((a) => { window.__warp(a[0], a[1], a[2]); }, [x, z, ry]);
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `/tmp/${name}.png`, timeout: 120000 });
    console.log('shot', name);
  } catch (e) { console.log('FAIL', name, e.message); }
}

// 自由カメラのショット（俯瞰・名所）
// __view の yaw は three.js カメラの Euler.y（0 = -z 北向き）
const VIEWS = {
  world_aerial:  [0, 95, 70, 0, -0.75],     // 谷の俯瞰（北向き）
  world_facade:  [0, 5.5, -16, 0, -0.05],   // 校舎正面
  world_bridge:  [10, 4.5, 84, 0, -0.14],   // 石橋と桜並木の入口
  world_shrine:  [87, 13.5, -71, -0.45, -0.06], // 鳥居から石段ごしに社
  world_paddy:   [-24, 16, 116, 0.95, -0.3],// 棚田
};
for (const [name, [x, y, z, yaw, pit]] of Object.entries(VIEWS)) {
  try {
    await page.evaluate((a) => { window.__view(...a); }, [x, y, z, yaw, pit]);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `/tmp/${name}.png`, timeout: 120000 });
    console.log('shot', name);
  } catch (e) { console.log('FAIL', name, e.message); }
}

console.log('pageerrors:', errs.length, errs.slice(0, 3).join(' | '));
await browser.close();
await new Promise((r) => server.close(r));
