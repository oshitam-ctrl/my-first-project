// プレイ動画撮影ツール — Instagramリール用の「滑らかな実プレイ映像」をセグメント単位で撮る。
//
// 滑らかさの要: requestAnimationFrame と performance.now を乗っ取り、
// 1フレーム = 1000/FPS ms の決定的ステップでゲームループを進めてから撮影する。
// 実時間で何秒かかってもゲーム内は常に等間隔なので、ヘッドレスの遅い
// ソフトウェアGLでもカクつきゼロの映像になる（従来の実時間撮影の失敗の根治）。
//
// 使い方:
//   node test-minecraft/play-reel.mjs                 # 全セグメント → /tmp/playreel/
//   node test-minecraft/play-reel.mjs --seg harvest   # 1セグメントだけ
//   node test-minecraft/play-reel.mjs --fps 12        # 確認用に粗く
// 出力: /tmp/playreel/<seg>/f_%05d.jpg と manifest.json（reel-build.mjs が使う）
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const W = 720, H = 1280;
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const FPS = Number(opt('--fps', 24));
const OUT = opt('--out', '/tmp/playreel');
const ONLY = opt('--seg', null);
const DUR = opt('--durations', null); // reel-build.mjs --tts が逆算したセグメント尺(JSON)で上書き
const STEP_MS = 1000 / FPS;

const ease = t => t * t * (3 - 2 * t);
const lerpKeys = (keys, t) => {
  if (keys.length === 1) return keys[0];
  const seg = Math.min(Math.floor(t * (keys.length - 1)), keys.length - 2);
  const u = ease(t * (keys.length - 1) - seg);
  return keys[seg].map((v, i) => v + (keys[seg + 1][i] - v) * u);
};

// ── セグメント定義 ──────────────────────────────────────────────────────────
// place: 開始位置(足元) / look: [yaw,pitch] キーフレーム（時間で補間）
// walk: 前進キーを押し続ける / fly: __view ドリー（カメラ演出カット）
// before/at: page.evaluate で実行するゲーム操作（at は { 0.5: fn } のように進行率指定）
const SEGS = [
  { name: 'hook', sec: 3.2, time: 0.32, // 空撮→校舎正面へ急降下（つかみ）
    fly: [[8, 56, 30, 0, -0.7], [8, 36, 0, 0, -0.12], [8, 33, -7.5, 0, -0.04]] },
  { name: 'walkin', sec: 3.0, time: 0.35, // 校庭から昇降口へ歩く（実プレイ・一人称）
    place: [8.5, 31, -10, 0], look: [[0, -0.05], [0, -0.02], [-0.08, -0.04]], walkSec: 2.7 },
  { name: 'corridor', sec: 3.6, time: 0.45, // 昇降口からパン屋売り場へ（前半歩き→ヒーロー陳列を見上げる）
    place: [10, 31, -28, -0.8], look: [[-0.8, -0.05], [-0.3, -0.02], [0, 0.14]], walkSec: 1.2 },
  { name: 'harvest', sec: 5.0, time: 0.4, // 校庭の畑(FIELD -4,-3)で小麦・規格外野菜を採る
    place: [-4, 31, 2, 0], look: [[0, -0.42], [0.3, -0.5], [-0.3, -0.45]],
    mine: true },
  { name: 'ferment', sec: 4.0, time: 0.45, // 酵母瓶棚の前で発酵→完成（泡パーティクル）
    place: [16.5, 31, -31.5, 0.3], look: [[0.3, -0.12], [0.1, -0.18]],
    at: { 0.25: () => { const B = window.__bakery; B.give('empty_jar', 1); B.startFerment(); },
          0.55: () => { const B = window.__bakery; B.matureAll(); B.pump(); } } },
  { name: 'bake', sec: 4.5, time: 0.5, // 工房パネルで「焼く！」
    place: [14, 31, -30.5, 0.15], look: [[0.15, -0.1]],
    at: { 0.2: () => {
            const tb = document.getElementById('topbar');
            const b = tb && [...tb.querySelectorAll('button')].find(x => x.textContent.includes('🥖'));
            if (b) b.click();
          },
          0.55: () => {
            const card = [...document.querySelectorAll('button')]
              .filter(b => b.textContent.trim() === '焼く！')
              .find(b => (b.parentElement.textContent || '').includes('パン ×2'));
            if (card) card.click();
          },
          0.85: () => { [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === '✕').forEach(b => b.click()); } } },
  { name: 'deliver', sec: 4.5, time: 0.5, // 大下さんへ届けて開店（クエスト完走）
    placeAtBaker: true, look: [[0, -0.06]],
    at: { 0.3: () => { if (window.__bakery.count('bread') < 1) window.__bakery.give('bread', 2); window.__quest(); } } },
  { name: 'queue', sec: 5.0, time: 0.55, // 開店の行列(x8,z-22..-18)を校庭側から正面に
    place: [8, 31, -9, 0], look: [[-0.22, -0.05], [0.05, -0.07], [0.25, -0.05]],
    preroll: 100, // クエスト完了のハートパーティクルが減衰してから撮る（SW-GL負荷対策）
    before: () => { // クエストを完走させて行列イベントを発火（playthroughと同じ手順）
      const B = window.__bakery;
      B.give('wheat', 2); window.__quest();
      B.give('surplus_veg', 2); window.__quest();
      B.give('empty_jar', 1); B.startFerment(); B.matureAll(); B.pump(); window.__quest();
      if (B.count('bread') < 1) B.give('bread', 2); window.__quest();
      const bp = (window.__bakerPos && window.__bakerPos()) || { x: 11, y: 31, z: -32 };
      window.__sim.place(bp.x + 1.5, bp.y + 0.5, bp.z); window.__quest();
      window.__sim.place(8, 31.2, -9, 0); window.__look(0, -0.05);
    } },
  { name: 'cafe', sec: 4.0, time: 0.55, // 姉妹カフェ South in North
    place: [-19.5, 31, -26.5, 0], look: [[-0.25, -0.06], [0.2, -0.1]],
    at: { 0.4: () => { window.__bakery.give('surplus_veg', 2); window.__cafe && window.__cafe.order('spice_curry'); } } },
  { name: 'cta', sec: 4.5, time: 0.735, // 夕暮れの校舎プルバック（締め）
    fly: [[8, 33, -8, 0, -0.04], [8, 39, 9, 0, -0.24], [8, 45, 21, 0, -0.42]] },
];

if (DUR) {
  const d = JSON.parse(await readFile(DUR, 'utf8'));
  for (const s of SEGS) if (d[s.name] != null) s.sec = d[s.name];
}
const segs = ONLY ? SEGS.filter(s => s.name === ONLY) : SEGS;
if (!segs.length) { console.error('unknown seg: ' + ONLY); process.exit(1); }

const ROOT = path.resolve(import.meta.dirname, '../public');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/minecraft' || p === '/minecraft/') p = '/minecraft/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': (MIME[path.extname(f)] || 'application/octet-stream') + '; charset=utf-8' });
  res.end(await readFile(f));
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

// SwiftShaderレンダラはまれにクラッシュ/ハングする — セグメント単位で
// ブラウザごと作り直してリトライできるよう、起動一式を関数化。
const WATCHDOG_MS = 180000;
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`watchdog: ${what} > ${ms}ms`)), ms))]);

let browser, page, cdp, crashed;
async function boot() {
  browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars', '--mute-audio'] });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page = await ctx.newPage();
  page.setDefaultTimeout(120000); // ヘッドレスSW-GLは1フレームが重い — 操作を30sで諦めない
  crashed = false;
  page.on('crash', () => { crashed = true; });
  page.on('pageerror', e => errs.push(e.message));

  // rAF/performance.now 乗っ取り（ページのどのスクリプトより先に実行される）
  await page.addInitScript(() => {
    const realNow = performance.now.bind(performance);
    let manual = false, fake = 0, cbs = [];
    performance.now = () => (manual ? fake : realNow());
    const realRAF = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = cb => { if (!manual) return realRAF(cb); cbs.push(cb); return cbs.length; };
    window.__cap = {
      on() { fake = realNow(); manual = true; },
      step(ms) {
        fake += ms; const l = cbs; cbs = []; for (const cb of l) cb(fake);
        realRAF(() => {}); // 実フレームを1回予約してコンポジタに提示させる（screenshotのハング防止）
      },
    };
    // 撮影は実時間よりずっと遅いので、長尺タイマー（行列の60s despawn等）が
    // セグメント途中で発火しないよう引き延ばす
    const realST = window.setTimeout.bind(window);
    window.setTimeout = (fn, ms, ...a) => realST(fn, ms >= 30000 ? ms * 20 : ms, ...a);
  });

  // rAF停止中はPlaywrightのscreenshotが「次の安定フレーム」を待ってハングするので、
  // CDPで現在のサーフェスをそのまま取得する
  cdp = await page.context().newCDPSession(page);
  await page.goto(`http://localhost:${port}/minecraft`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.click('#overlay', { timeout: 60000 }).catch(() => {});
  await page.waitForSelector('#overlay', { state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.addStyleTag({ content: '#stats{display:none!important}' }); // デバッグFPS表示は隠す
  await page.waitForTimeout(2000); // 初期チャンク生成は実時間で済ませる
  await page.evaluate(() => window.__cap.on()); // ここから先は決定的ステップ
}
async function shot(file) {
  const { data } = await withTimeout(cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 }), WATCHDOG_MS, 'screenshot');
  await writeFile(file, Buffer.from(data, 'base64'));
}
const ev = (fn, arg) => withTimeout(page.evaluate(fn, arg), WATCHDOG_MS, 'evaluate');

const errs = [];
await boot();
const manifest = [];
const t0 = Date.now();

async function captureSeg(s) {
  const dir = path.join(OUT, s.name);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const frames = Math.round(s.sec * FPS);

  // セグメント頭: 位置決め＋チャンク読み込み（実時間で待つのはここだけ）
  await ev(([s2]) => {
    window.__time(s2.time);
    if (s2.placeAtBaker) {
      const bp = (window.__bakerPos && window.__bakerPos()) || { x: 11, y: 31, z: -32 };
      window.__sim.place(bp.x + 2.2, bp.y + 0.5, bp.z, Math.PI / 2);
      window.__look(Math.PI / 2, -0.05);
    } else if (s2.place) {
      window.__sim.place(...s2.place);
      window.__look(s2.place[3] || 0, (s2.look ? s2.look[0][1] : -0.05));
    } else if (s2.fly) {
      window.__view(...s2.fly[0]);
    }
  }, [{ name: s.name, time: s.time, place: s.place, fly: s.fly, look: s.look, placeAtBaker: s.placeAtBaker }]);
  if (s.before) await ev(s.before);
  console.log(`  [${s.name}] placed (${((Date.now() - t0) / 1000) | 0}s)`);
  // チャンク生成（とbefore直後のパーティクル減衰）を進める。rAFは手動なので step で回す
  const preroll = s.preroll || 40;
  for (let i = 0; i < preroll; i++) { await ev(ms => window.__cap.step(ms), 50); await page.waitForTimeout(25); if (crashed) throw new Error('renderer crashed in preroll'); }
  console.log(`  [${s.name}] preroll done (${((Date.now() - t0) / 1000) | 0}s)`);

  if (s.walkSec) await page.keyboard.down('KeyW');
  if (s.mine) await page.mouse.move(W / 2, H / 2);
  const walkFrames = s.walkSec ? Math.round(s.walkSec * FPS) : 0; // 歩行は絶対秒数（尺が伸びても壁に突っ込まない）
  let walking = walkFrames > 0;

  const fired = new Set();
  for (let i = 0; i < frames; i++) {
    const t = frames === 1 ? 0 : i / (frames - 1);
    if (walking && i >= walkFrames) { walking = false; await page.keyboard.up('KeyW'); }
    // ゲーム操作（進行率トリガ）
    if (s.at) for (const k of Object.keys(s.at)) {
      if (t >= Number(k) && !fired.has(k)) { fired.add(k); await ev(s.at[k]); }
    }
    // カメラ
    if (s.fly) {
      const c = lerpKeys(s.fly, t);
      await ev(a => window.__view(...a), c);
    } else if (s.look) {
      const [yaw, pitch] = lerpKeys(s.look, t);
      await ev(a => window.__look(a[0], a[1]), [yaw, pitch]);
    }
    // 採取: 一定間隔でクリック（クリエイティブ=即破壊）
    if (s.mine && i % Math.round(FPS * 0.9) === Math.round(FPS * 0.4)) {
      await page.mouse.down(); await ev(ms => window.__cap.step(ms), STEP_MS); await page.mouse.up();
    }
    await ev(([ms, time]) => { window.__time(time); window.__cap.step(ms); }, [STEP_MS, s.time]);
    await shot(path.join(dir, `f_${String(i).padStart(5, '0')}.jpg`));
    if (crashed) throw new Error('renderer crashed');
    if (i % 24 === 0) console.log(`  [${s.name}] f${i}/${frames} (${((Date.now() - t0) / 1000) | 0}s)`);
  }
  if (walking) await page.keyboard.up('KeyW');
  manifest.push({ name: s.name, sec: s.sec, frames, fps: FPS, dir });
  console.log(`seg ${s.name}: ${frames}f (${((Date.now() - t0) / 1000) | 0}s elapsed)`);
}

for (const s of segs) {
  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    try {
      await captureSeg(s);
      ok = true;
    } catch (e) {
      console.log(`  [${s.name}] attempt ${attempt} failed: ${String(e.message).split('\n')[0]} — relaunching browser`);
      try { await browser.close(); } catch {}
      await boot();
    }
  }
  if (!ok) { console.log(`FATAL: seg ${s.name} failed 3 attempts`); process.exit(1); }
}
await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify({ fps: FPS, w: W, h: H, segs: manifest }, null, 2));
console.log('pageerrors:', errs.length, errs.slice(0, 3).join(' | '));
await browser.close();
await new Promise(r => server.close(r));
console.log('manifest:', path.join(OUT, 'manifest.json'));
