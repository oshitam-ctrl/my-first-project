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
// About/story panel (opened from the title, before starting)
await page.evaluate(() => { const a = document.getElementById('about-link'); if (a) a.click(); });
await page.waitForTimeout(400);
await page.screenshot({ path: `/tmp/mc-about-${TAG}.png` });
await page.evaluate(() => { const c = document.getElementById('about-close'); if (c) c.click(); });
await page.click('#overlay');
await page.waitForTimeout(800);

await page.evaluate(() => window.__time && window.__time(0.5));
// front exterior (school facade + entrance)
await page.evaluate(() => window.__view && window.__view(8, 36, 16, 0, -0.18));
await page.waitForTimeout(12000);
await page.screenshot({ path: `/tmp/mc-ext-${TAG}.png` });
// interior — stand near the baker so the greeting shows
await page.evaluate(() => { if (window.__view) window.__view(8, 31, -27, 0, 0.02); if (window.__view) {} });
await page.waitForTimeout(4500);
const speech = await page.evaluate(() => { const els = [...document.querySelectorAll('body>div')].filter((e) => /いらっしゃい|ありがとう|届けて/.test(e.textContent || '')); return els.length && getComputedStyle(els[0]).display !== 'none' ? els[0].textContent.slice(0, 30) : 'hidden'; });
console.log('baker speech:', speech);
await page.screenshot({ path: `/tmp/mc-int-${TAG}.png` });

const hud = await page.evaluate(() => document.getElementById('hud').textContent);
console.log(`[${TAG}] hud: ${hud} | pageerrors: ${errs.length}`);
await browser.close();
await new Promise((r) => server.close(r));
