// /world のクエストチェーンを頭から最後まで自動で踏破する E2E。
// __warp で各スポットへ移動し、__interact（同期フック）とメニュー操作で
// 10 ステップ完走・ロスパン袋の受け取りまでを検証する。
// Run: node test-world/playthrough.mjs
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const { chromium } = await import('playwright').catch(() =>
  import('/opt/node22/lib/node_modules/playwright/index.mjs'));

const ROOT = path.resolve(import.meta.dirname, '../public');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
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

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(`http://localhost:${port}/world`, { waitUntil: 'load' });
await page.waitForTimeout(2200);
await page.click('#overlay');
await page.waitForTimeout(800);

let passed = 0, failed = 0;
const questIndex = () => page.evaluate(() => window.__quest.index);
async function expectIndex(n, label) {
  for (let i = 0; i < 20; i++) {
    if ((await questIndex()) >= n) break;
    await page.waitForTimeout(150);
  }
  const idx = await questIndex();
  if (idx >= n) { passed++; console.log(`ok - ${label} (index=${idx})`); }
  else { failed++; console.log(`FAIL - ${label}: index=${idx}, expected>=${n}`); }
}
async function warp(x, z, ry = Math.PI) {
  await page.evaluate(() => window.__closeUI());
  await page.evaluate((a) => window.__warp(a[0], a[1], a[2]), [x, z, ry]);
  await page.waitForTimeout(350);
}
const interact = () => page.evaluate(() => window.__interact());
const closeUI = () => page.evaluate(() => window.__closeUI());

// 1) バス停 → 校庭（arrive）→ パン屋（enter）
await warp(0, 0);
await expectIndex(1, 'arrive: 校庭到達でクエストが進む');
await warp(-14, -40);
await expectIndex(2, 'enter: パン屋に入って進む');

// 2) 大下さんと話す（会話を全ページ送ると credit）
await warp(-13.2, -42.2);
await interact();
await closeUI();
await expectIndex(3, 'talk: 大下さんと話して進む');

// 3) パンを買う
await warp(-10, -42.2);
const opened = await interact();
if (opened !== 'counter') console.log('note: opened spot =', opened);
await page.locator('button', { hasText: '買う' }).first().click({ timeout: 10000 });
await page.waitForTimeout(300);
await closeUI();
await expectIndex(4, 'buy: パンを買って進む');

// 4) 酵母の瓶棚
await warp(-20.2, -42, -1.6);
await interact();
await closeUI();
await expectIndex(5, 'jars: 瓶棚を見て進む');

// 5) カフェ（店主の会話 → 注文メニュー）
await warp(16, -43);
await interact();          // 会話が開く
await closeUI();           // 会話を終えると onDone でメニューが開く
await page.locator('button', { hasText: '注文する' }).first().click({ timeout: 10000 });
await page.waitForTimeout(300);
await closeUI();
await expectIndex(6, 'cafe: 注文して進む');

// 6) 校庭ランチ
await warp(-30, -4);
await interact();
await closeUI();
await expectIndex(7, 'lunch: ベンチで食べて進む');

// 7) コンポスト
await warp(-10, -52);
await interact();
await closeUI();
await expectIndex(8, 'compost: 循環の話で進む');

// 8) 橋（reach）→ 神社でお参り（完走）
await warp(10, 66);
await expectIndex(9, 'bridge: 石橋に着いて進む');
await warp(96, -86);
await interact();
await closeUI();
await expectIndex(10, 'shrine: お参りして完走');

const done = await page.evaluate(() => window.__quest.done);
if (done) { passed++; console.log('ok - chain done'); } else { failed++; console.log('FAIL - chain not done'); }
await page.waitForTimeout(2200);
await page.screenshot({ path: '/tmp/world_thanks.png' });
const bag = await page.evaluate(() => window.__bag.items.map((i) => i.id));
console.log('bag:', bag.join(','));
if (bag.includes('rescue_bag')) { passed++; console.log('ok - ロスパン袋を受け取った'); } else { failed++; console.log('FAIL - ロスパン袋なし'); }

console.log(`\n${passed} passed, ${failed} failed, pageerrors: ${errs.length}`, errs.slice(0, 3).join(' | '));
await browser.close();
await new Promise((r) => server.close(r));
process.exitCode = failed === 0 && errs.length === 0 ? 0 : 1;
