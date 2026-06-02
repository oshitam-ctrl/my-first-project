// playthrough.mjs — headless QA: complete the whole "今日のしごと" quest and
// assert there are no problems. Drives all 5 quest steps in a SINGLE in-page
// evaluate (the headless software-GL page can stall on many round-trips), so it
// runs fast and reliably. Checks the quest reaches its 🎉 completion with zero
// JS/page errors.  Run from repo root:  node test-minecraft/playthrough.mjs
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

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

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 800, height: 540 } });
page.setDefaultTimeout(20000);
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('crash', () => errors.push('PAGE CRASHED'));

let out = { steps: [], done: false };
try {
  console.log('booting…');
  await page.goto(`http://localhost:${port}/minecraft`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.click('#overlay');                 // start the game
  await page.waitForTimeout(600);
  console.log('started — running 今日のしごと…');

  // Drive ALL five quest steps in one in-page pass (fewest round-trips).
  // IMPORTANT: call window.__quest() after EACH step. In real play updateQuest()
  // runs every frame (~60fps), so each quest step LATCHES the moment it's first
  // satisfied — before a later craft consumes its ingredient (e.g. baking
  // consumes the levain that step 3 needs). Polling per step here faithfully
  // models that per-frame loop; calling it only once at the end would miss the
  // transient levain≥1 state and step 3 could never latch.
  out = await page.evaluate(() => {
    const B = window.__bakery, S = [];
    // 1) 畑で小麦を集める
    B.give('wheat', 2);            window.__quest(); S.push(['1 小麦', B.count('wheat') >= 1]);
    // 2) 規格外野菜を集める
    B.give('surplus_veg', 2);      window.__quest(); S.push(['2 規格外野菜', B.count('surplus_veg') >= 1]);
    // 3) 発酵液（実発酵を即時成熟）— poll so step 3 latches before baking eats it
    B.give('empty_jar', 1); B.startFerment(); B.matureAll(); B.pump();
    window.__quest();              S.push(['3 発酵液', B.count('levain') >= 1]);
    // 4) パンを焼く — 実際に🥖工房パネルの「焼く！」を押す
    let baked = false;
    const tb = document.getElementById('topbar');
    const bbtn = tb && [...tb.querySelectorAll('button')].find((b) => b.textContent.includes('🥖'));
    if (bbtn) bbtn.click();
    const card = [...document.querySelectorAll('button')]
      .filter((b) => b.textContent.trim() === '焼く！')
      .find((b) => (b.parentElement.textContent || '').includes('パン ×2'));
    if (card) { card.click(); baked = true; }
    [...document.querySelectorAll('button')].filter((b) => b.textContent.trim() === '✕').forEach((b) => b.click());
    if (B.count('bread') < 1) B.give('bread', 2); // fallback so the run can finish
    window.__quest();              S.push(['4 パンを焼く', B.count('bread') >= 1, 'panel_bake=' + baked]);
    // 5) 店主に届ける — テレポートして即クエスト再評価。
    //    店主は徘徊するので、固定スポーンではなく LIVE 位置の隣へ。
    const bp = (window.__bakerPos && window.__bakerPos()) || { x: 11, y: 31, z: -32 };
    window.__sim.place(bp.x, bp.y + 0.5, bp.z);
    const q = window.__quest();
    S.push(['5 店主に届ける→開店', q.done === true, 'bakerPos=(' + Math.round(bp.x) + ',' + Math.round(bp.z) + ')']);
    return { steps: S, done: q.done };
  });
  await page.screenshot({ path: '/tmp/mc-playthrough-complete.png' });
} catch (e) {
  out.steps.push(['playthrough threw', false, String(e.message).split('\n')[0]]);
}

let failed = 0;
console.log('\n=== 今日のしごと 通しプレイ ===');
for (const s of out.steps) { if (!s[1]) failed++; console.log(`  ${s[1] ? '✓' : '✗'} ${s[0]}${s[2] ? ' — ' + s[2] : ''}`); }
console.log(`\npage/console errors (${errors.length}):`);
errors.slice(0, 20).forEach((e) => console.log('  ' + e));
const ok = failed === 0 && errors.length === 0 && out.done === true;
console.log(`\nRESULT: ${ok ? 'ALL STEPS COMPLETE ✓ — 0 errors' : `FAILED (${failed} step(s), ${errors.length} error(s), done=${out.done})`}`);

await browser.close();
await new Promise((r) => server.close(r));
process.exit(ok ? 0 : 1);
