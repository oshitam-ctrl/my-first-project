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

// 5 interior views (world coords):
//   LM_X=-12, LM_Y=29, LM_Z=-36; local→world: wx=lx-12, wy=ly+29, wz=lz-36
//   yaw=0 faces -z (into building/toward back); yaw=PI faces +z (toward entrance)
//   yaw=-PI/2 = facing east (+x); yaw=PI/2 = facing west (-x)
//
// 1. CORRIDOR: local(8,3,10)=world(-4,32,-26), facing east (yaw=-PI/2) — see corridor length & 3 doorways
// 2. BAKERY counter: local(20,3,9)=world(8,32,-27), facing -z (yaw=0) — in corridor doorway, see counter
// 3. WORKSHOP: local(16,3,4)=world(4,32,-32), facing -z (yaw=0) — in front of oven at x=16,z=2
// 4. GF WEST CLASSROOM: local(9,3,7)=world(-3,32,-29), facing -z (yaw=0) — see blackboard at z=2
// 5. 2F CENTER CLASSROOM: local(20,9,7)=world(8,38,-29), facing -z (yaw=0) — blackboard + desks
const views = {
  corridor:   [-4,  32, -26, -1.57, 0.05],  // in corridor looking east: three doorways + bakery blue
  bakery:     [8,   32, -27,  0,    0.05],  // at bakery doorway in corridor, look -z at teal wall+counter
  workshop:   [4,   32, -32,  0,    0.05],  // in front of oven (local x=16,z=4), facing -z at ovens
  gf_class:   [-3,  32, -29,  0,    0.05],  // GF west classroom, facing -z, blackboard fills back wall
  f2_class:   [8,   38, -29,  0,    0.05],  // 2F center classroom, facing -z, blackboard + wood desks
};
for (const [name, [x, y, z, yaw, pit]] of Object.entries(views)) {
  await page.evaluate(([x, y, z, yaw, pit]) => window.__view && window.__view(x, y, z, yaw, pit), [x, y, z, yaw, pit]);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `/tmp/mc-${name}-${TAG}.png` });
}

const hud = await page.evaluate(() => document.getElementById('hud').textContent);
console.log(`[${TAG}] hud: ${hud} | pageerrors: ${errs.length}`);
await browser.close();
await new Promise((r) => server.close(r));
