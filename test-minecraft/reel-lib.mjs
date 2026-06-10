// リール生成パイプライン共有部品（reel-pipeline.mjs から使用）
//  - serveStatic: public/ を配信する使い捨てHTTPサーバ
//  - GameSession: ヘッドレスゲームを「決定的1コマ描画」で動かすセッション
//      rAF と performance.now を乗っ取り、step(ms) で1フレームずつ進める。
//      SwiftShaderレンダラのクラッシュ/ハングに備えた watchdog と relaunch を持つ。
//  - ACTIONS: ゲーム内操作のプリセット表（セリフ行に同期して発火）
//  - wrapJp / run / ffprobeDur / tc / escAss: 細かいユーティリティ
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

// ── ユーティリティ ──────────────────────────────────────────────────────────
export const run = (cmd, a, opts = {}) => {
  const r = spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} failed:\n${(r.stderr || '').slice(-2000)}`);
  return r.stdout;
};
export const ffprobeDur = f => Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).trim());
export const tc = s => `0:${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`;
export const escAss = t => t.replace(/\{/g, '(').replace(/\}/g, ')');

// libass環境によってはCJKの自動折返しが効かないので、句読点優先で \N を入れる
export function wrapJp(text, width = 15) {
  if (text.length <= width + 1) return text;
  const out = [];
  let rest = text;
  while (rest.length > width + 1) {
    const window = rest.slice(0, width + 1);
    let cut = -1;
    for (const ch of ['。', '、', '！', '？', '…', '」', '』']) cut = Math.max(cut, window.lastIndexOf(ch));
    if (cut < Math.floor(width / 2)) cut = width - 1;
    out.push(rest.slice(0, cut + 1));
    rest = rest.slice(cut + 1);
  }
  if (rest) out.push(rest);
  return out.join('\\N');
}

// 補間: キーフレーム列を smoothstep で等分割補間
const ease = t => t * t * (3 - 2 * t);
export function lerpKeys(keys, t) {
  if (keys.length === 1) return keys[0];
  const seg = Math.min(Math.floor(t * (keys.length - 1)), keys.length - 2);
  const u = ease(t * (keys.length - 1) - seg);
  return keys[seg].map((v, i) => v + (keys[seg + 1][i] - v) * u);
}

// ── 静的サーバ ──────────────────────────────────────────────────────────────
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
export async function serveStatic(rootDir) {
  const server = http.createServer(async (req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/minecraft' || p === '/minecraft/') p = '/minecraft/index.html';
    const f = path.join(rootDir, p);
    if (!f.startsWith(rootDir) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': (MIME[path.extname(f)] || 'application/octet-stream') + '; charset=utf-8' });
    res.end(await readFile(f));
  });
  await new Promise(r => server.listen(0, r));
  return { port: server.address().port, close: () => new Promise(r => server.close(r)) };
}

// ── ゲーム内アクションのプリセット表 ────────────────────────────────────────
// 文字列キーで台本(reel-script.json)から参照する。各関数はページ内で実行される。
export const ACTIONS = {
  // パン工房パネルを開く（topbarの🥖）
  bakeOpen: () => {
    const tb = document.getElementById('topbar');
    const b = tb && [...tb.querySelectorAll('button')].find(x => x.textContent.includes('🥖'));
    if (b) b.click();
  },
  // 「パン ×2」カードの 焼く！ を押す
  bakeClick: () => {
    const card = [...document.querySelectorAll('button')]
      .filter(b => b.textContent.trim() === '焼く！')
      .find(b => (b.parentElement.textContent || '').includes('パン ×2'));
    if (card) card.click();
  },
  // 開いているパネルを閉じる
  panelClose: () => { [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === '✕').forEach(b => b.click()); },
  // 発酵を仕込む / 即成熟させる（泡パーティクル＋トースト）
  fermentStart: () => { const B = window.__bakery; B.give('empty_jar', 1); B.startFerment(); },
  fermentMature: () => { const B = window.__bakery; B.matureAll(); B.pump(); },
  // 焼く工程の材料を持たせる（bakeClickの成立条件）
  giveBakeIngredients: () => { const B = window.__bakery; B.give('levain', 1); B.give('wheat', 1); },
  // パンを持ってクエスト再評価（届ける演出）
  deliverBread: () => { const B = window.__bakery; if (B.count('bread') < 1) B.give('bread', 2); window.__quest(); },
  // カフェでスパイスカレーを注文
  cafeOrder: () => { const B = window.__bakery; B.give('surplus_veg', 2); window.__cafe && window.__cafe.order('spice_curry'); },
};

// セグメント開始時に世界の状態を作るプリセット（カメラ位置はセグメント定義が責任を持つ）
export const SETUPS = {
  // クエストを完走→行列イベント発火（playthrough.mjs と同じ手順）。終了後カメラ位置に戻す
  questComplete: (placeBack) => {
    const B = window.__bakery;
    B.give('wheat', 2); window.__quest();
    B.give('surplus_veg', 2); window.__quest();
    B.give('empty_jar', 1); B.startFerment(); B.matureAll(); B.pump(); window.__quest();
    if (B.count('bread') < 1) B.give('bread', 2); window.__quest();
    const bp = (window.__bakerPos && window.__bakerPos()) || { x: 11, y: 31, z: -32 };
    window.__sim.place(bp.x + 1.5, bp.y + 0.5, bp.z); window.__quest();
    if (placeBack) { window.__sim.place(...placeBack); window.__look(placeBack[3] || 0, placeBack[4] ?? -0.05); }
  },
};

// ── 決定的ステップのゲームセッション ────────────────────────────────────────
const WATCHDOG_MS = 180000;
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`watchdog: ${what} > ${ms}ms`)), ms))]);

export class GameSession {
  constructor({ port, w = 720, h = 1280 }) { this.port = port; this.w = w; this.h = h; this.errs = []; }

  async boot() {
    this.browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars', '--mute-audio'] });
    const ctx = await this.browser.newContext({ viewport: { width: this.w, height: this.h }, deviceScaleFactor: 1 });
    this.page = await ctx.newPage();
    this.page.setDefaultTimeout(120000); // SW-GLは1フレームが重いことがある — 操作を30sで諦めない
    this.crashed = false;
    this.page.on('crash', () => { this.crashed = true; });
    this.page.on('pageerror', e => this.errs.push(e.message));

    // rAF/performance.now 乗っ取り（どのページスクリプトより先に実行）
    await this.page.addInitScript(() => {
      const realNow = performance.now.bind(performance);
      let manual = false, fake = 0, cbs = [];
      performance.now = () => (manual ? fake : realNow());
      const realRAF = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = cb => { if (!manual) return realRAF(cb); cbs.push(cb); return cbs.length; };
      window.__cap = {
        on() { fake = realNow(); manual = true; },
        step(ms) {
          fake += ms; const l = cbs; cbs = []; for (const cb of l) cb(fake);
          realRAF(() => {}); // 実フレームを1回予約してコンポジタに提示させる（screenshotハング防止）
        },
      };
      // 撮影は実時間より遅い — 長尺タイマー（行列の60s despawn等）が途中発火しないよう引き延ばす
      const realST = window.setTimeout.bind(window);
      window.setTimeout = (fn, ms, ...a) => realST(fn, ms >= 30000 ? ms * 20 : ms, ...a);
    });

    // Playwrightのscreenshotは「次の安定フレーム」を待ってrAF停止中にハングするのでCDP直叩き
    this.cdp = await this.page.context().newCDPSession(this.page);
    await this.page.goto(`http://localhost:${this.port}/minecraft`, { waitUntil: 'load' });
    await this.page.waitForTimeout(1200);
    await this.page.click('#overlay', { timeout: 60000 }).catch(() => {});
    await this.page.waitForSelector('#overlay', { state: 'hidden', timeout: 15000 }).catch(() => {});
    await this.page.addStyleTag({ content: '#hud{display:none!important}' }); // FPS/座標のデバッグ帯（#hud）を隠す
    await this.page.waitForTimeout(2000); // 初期チャンクは実時間で生成
    await this.page.evaluate(() => window.__cap.on());
  }

  async relaunch() { try { await this.browser.close(); } catch {} await this.boot(); }
  async close() { try { await this.browser.close(); } catch {} }

  ev(fn, arg) { return withTimeout(this.page.evaluate(fn, arg), WATCHDOG_MS, 'evaluate'); }
  step(ms) { return this.ev(m => window.__cap.step(m), ms); }

  async shot(file) {
    const { data } = await withTimeout(this.cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90 }), WATCHDOG_MS, 'screenshot');
    await writeFile(file, Buffer.from(data, 'base64'));
    if (this.crashed) throw new Error('renderer crashed');
  }
}
