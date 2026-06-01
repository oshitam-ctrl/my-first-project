// Actually load and "play" the game in a real (headless) browser to reproduce
// the failure, capture console/page errors, and verify it starts.
import { chromium, devices } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/minecraft' || p === '/minecraft/') p = '/minecraft/index.html';
    let file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); res.end('404'); return; }
    const buf = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const URL = `http://localhost:${port}/minecraft/index.html`;
console.log('Serving at', URL);

const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
});

async function scenario(name, contextOpts, tapOrClick, initScript) {
  const logs = [], errors = [];
  const context = await browser.newContext(contextOpts);
  if (initScript) await context.addInitScript(initScript);
  const page = await context.newPage();
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + (e.stack || e.message)));
  page.on('requestfailed', (r) => {
    const f = r.failure();
    if (f && !/favicon/.test(r.url())) errors.push(`REQFAIL ${r.url()} :: ${f.errorText}`);
  });

  console.log(`\n===== Scenario: ${name} =====`);
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(1500); // let modules load + first frames render

  const before = await page.evaluate(() => ({
    overlay: getComputedStyle(document.getElementById('overlay')).display,
    hud: document.getElementById('hud').textContent,
    hasCanvas: !!document.getElementById('game'),
    webgl: (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })(),
  }));
  console.log('before start:', JSON.stringify(before));
  await page.screenshot({ path: `/tmp/mc-${name}-1-title.png` });

  // start the game
  try { await tapOrClick(page); } catch (e) { console.log('start action error:', String(e.message).split('\n')[0]); }
  await page.waitForTimeout(1500);

  const after = await page.evaluate(() => ({
    overlay: getComputedStyle(document.getElementById('overlay')).display,
    hud: document.getElementById('hud').textContent,
  }));
  console.log('after start :', JSON.stringify(after));
  await page.screenshot({ path: `/tmp/mc-${name}-2-playing.png` });

  console.log(`console messages (${logs.length}):`);
  logs.slice(0, 40).forEach((l) => console.log('   ' + l));
  console.log(`errors (${errors.length}):`);
  errors.forEach((e) => console.log('   ' + e));

  const started = after.overlay === 'none' && /chunks\s+[1-9]/.test(after.hud);
  console.log(`RESULT[${name}]: ${started ? 'STARTED ✓' : 'DID NOT START ✗'}`);
  await context.close();
  return { started, errors };
}

const iphone = devices['iPhone 13'];
const r1 = await scenario('iphone-portrait', { ...iphone }, (page) => page.tap('#overlay'));
const r1b = await scenario('iphone-landscape',
  { ...iphone, viewport: { width: 844, height: 390 }, screen: { width: 844, height: 390 } },
  (page) => page.tap('#overlay'));
const r2 = await scenario('desktop', { viewport: { width: 1280, height: 720 } },
  (page) => page.click('#overlay'));
// Simulate an enterprise/managed browser where pointer lock is blocked: the
// game must still start (this was the production "押せない" bug).
const r3 = await scenario('desktop-nolock', { viewport: { width: 1280, height: 720 } },
  (page) => page.click('#overlay'),
  () => { Element.prototype.requestPointerLock = function () { throw new Error('pointer lock blocked by policy'); }; });

await browser.close();
await new Promise((r) => server.close(r));

console.log('\n==== SUMMARY ====');
console.log('iPhone portrait      started:', r1.started, '| load errors:', r1.errors.length);
console.log('iPhone landscape     started:', r1b.started, '| load errors:', r1b.errors.length);
console.log('desktop              started:', r2.started, '| load errors:', r2.errors.length);
console.log('desktop (lock blocked) started:', r3.started, '| load errors:', r3.errors.length);
process.exitCode = ([r1, r1b, r2, r3].some((r) => !r.started || r.errors.length)) ? 2 : 0;
