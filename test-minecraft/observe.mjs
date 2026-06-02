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

// 1) initial spawn view — should face the Petit Hermès school (no __view!)
await page.waitForTimeout(6000); // let chunks stream so the school is visible
await page.screenshot({ path: `/tmp/mc-spawn-${TAG}.png` });
// 2) open inventory and verify the palette actually scrolls
await page.keyboard.press('KeyE');
await page.waitForTimeout(600);
const sc = await page.evaluate(() => {
  const grids = [...document.querySelectorAll('#inv-screen *')].filter((e) => getComputedStyle(e).overflowY === 'scroll');
  const pal = grids[0];
  if (!pal) return { found: false };
  const before = pal.scrollTop; pal.scrollTop = 250; const after = pal.scrollTop;
  return { found: true, scrollH: pal.scrollHeight, clientH: pal.clientHeight, touch: getComputedStyle(pal).touchAction, scrolled: after - before };
});
console.log('palette scroll:', JSON.stringify(sc));
await page.screenshot({ path: `/tmp/mc-palette-${TAG}.png` });

const hud = await page.evaluate(() => document.getElementById('hud').textContent);
console.log(`[${TAG}] hud: ${hud} | pageerrors: ${errs.length}`);
await browser.close();
await new Promise((r) => server.close(r));
