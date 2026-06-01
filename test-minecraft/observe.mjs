// Fly the camera to a vantage point and screenshot, to assess terrain
// continuity + biome variety like actually playing. Usage: node observe.mjs [tag]
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const TAG = process.argv[2] || 'now';
const ROOT = path.resolve(import.meta.dirname, '../public');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/minecraft' || p === '/minecraft/') p = '/minecraft/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': (MIME[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8' });
  res.end(await readFile(file));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const url = `http://localhost:${port}/minecraft`;

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 960, height: 600 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(1200);
await page.click('#overlay');
await page.waitForTimeout(800);

// visit different biomes and screenshot a horizon view of each
// night: spawn hostile mobs nearby, then sweep the view to catch their faces
await page.evaluate(() => { window.__time && window.__time(0.0); window.__view && window.__view(8, 34, 8, 0, -0.05); });
await page.waitForTimeout(9000);
for (let i = 0; i < 6; i++) {
  await page.evaluate((y) => window.__view && window.__view(8, 34, 8, y, -0.08), i * 1.05);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `/tmp/mc-mobface-${TAG}-${i}.png` });
}
const mc = await page.evaluate(() => (window.__mobCount ? window.__mobCount() : -1));
console.log('mobs near:', mc);

const hud = await page.evaluate(() => document.getElementById('hud').textContent);
console.log(`[${TAG}] hud: ${hud} | pageerrors: ${errs.length}`);
await browser.close();
await new Promise((r) => server.close(r));
