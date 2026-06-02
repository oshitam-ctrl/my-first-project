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
await page.screenshot({ path: `/tmp/mc-about-${TAG}.png`, timeout: 60000 });
await page.evaluate(() => { const c = document.getElementById('about-close'); if (c) c.click(); });
await page.click('#overlay', { timeout: 60000 });
await page.waitForTimeout(800);

await page.evaluate(() => window.__time && window.__time(0.5));

// ─── World coordinate views ───────────────────────────────────────────────────
// LM_X=-36, LM_Y=29, LM_Z=-50
// local→world: wx=LM_X+lx, wy=LM_Y+ly, wz=LM_Z+lz
// Building footprint world: x=-32..47, z=-48..-24, y=29..45
// Facade plane: world z=-24 (local z=26)
// Entrance centre: world x=8, world z=-24 (local 44,_,26)
// Baker NPC: world (14,31,-32) = local (50,2,18)
//
// Camera yaw convention: yaw=0 faces -z (into building), yaw=PI faces +z (toward entrance)
//   yaw=-PI/2 faces east (+x), yaw=PI/2 faces west (-x)

// Aerial view: above and south of the building, looking north (-z) slightly down
await page.evaluate(() => window.__view && window.__view(8, 75, 40, 0, -1.1));
await page.waitForTimeout(10000);
await page.screenshot({ path: `/tmp/mc-aerial-${TAG}.png`, timeout: 60000 });

// Facade view: stand in front of the entrance, look at the facade
await page.evaluate(() => window.__view && window.__view(8, 38, 2, 0, -0.2));
await page.waitForTimeout(4000);
await page.screenshot({ path: `/tmp/mc-facade-${TAG}.png`, timeout: 60000 });

// Interior views (world coords):
//   LM_X=-36, LM_Y=29, LM_Z=-50
//   Corridor: local(-26+36, 32-29, -27+50)=(10,3,23) → stand at west end of corridor looking east
//   Bakery: local(8+36, 32-29, -29+50)=(44,3,21) → in corridor doorway facing bakery counter
//   Workshop: local(14+36, 32-29, -44+50)=(50,3,6) → inside workshop facing ovens
//   GF Classroom: local(-9+36, 32-29, -35+50)=(27,3,15) → in class2, facing blackboard
//   GF Classroom2: local(28+36, 32-29, -35+50)=(64,3,15) → in class4, facing blackboard
//   Staircase west: local(-29+36, 32-29, -40+50)=(7,3,10) → in west stair tower
//   2F Classroom: local(8+36, 39-29, -35+50)=(44,10,15) → 2F above bakery, facing blackboard

const views = {
  // CORRIDOR length: west end looking east — see corridor span + doorways
  // local(-26+36=10, 3, -27+50=23) → inside corridor at west end, yaw=-PI/2 east
  corridor:    [-26, 32, -27, -1.57, 0.03],
  // BAKERY counter: stand in corridor near bakery doorway, face -z into sales floor
  // local(50,3,22)=world(14,32,-28); yaw=0 faces -z toward counter at z=19, teal wall behind
  // Pitch slightly down to see the counter better
  bakery:      [14,  32, -28,  0,    0.2],
  // WORKSHOP: inside workshop facing back wall ovens
  // local(50,3,6)=world(14,32,-44); yaw=0 faces -z toward z=2 back wall
  workshop:    [14,  32, -44,  0,    0.05],
  // GF CLASSROOM (class2, x23..32): local(27,3,12)=world(-9,32,-38)
  // stand in mid-classroom, face -z toward blackboard at z=2
  gf_class:    [-9,  32, -38,  0,    0.05],
  // GF CLASSROOM (class4, x58..67): local(62,3,12)=world(26,32,-38)
  gf_class2:   [26,  32, -38,  0,    0.05],
  // STAIRCASE west tower: at bottom of stairs (z=19=world -31), y=4 in air, look -z up the stairs
  // local(7,4,19)=world(-29,33,-31); yaw=0 faces -z toward rising stair; pitch slightly up
  staircase:   [-29, 33, -31,  0,   -0.15],
  // 2F CLASSROOM: inside class3 (x34..43), local(38,10,12)=world(2,39,-38)
  f2_class:    [2,   39, -38,  0,    0.05],
};

for (const [name, [x, y, z, yaw, pit]] of Object.entries(views)) {
  await page.evaluate(([x, y, z, yaw, pit]) => window.__view && window.__view(x, y, z, yaw, pit), [x, y, z, yaw, pit]);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `/tmp/mc-${name}-${TAG}.png`, timeout: 60000 });
}

const hud = await page.evaluate(() => document.getElementById('hud').textContent);
console.log(`[${TAG}] hud: ${hud} | pageerrors: ${errs.length}`);
await browser.close();
await new Promise((r) => server.close(r));
