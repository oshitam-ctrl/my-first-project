// プロモリール撮影ツール v2 — オーバーホール後ワールド(S1-S6)を縦720x1280で動画化。
// カメラのキーフレームをイージング補間しながら1フレームずつ撮影し、
// ffmpegがあれば /tmp/reel/reel.mp4 に結合する（無ければコマンドを表示）。
//
// 使い方:
//   node test-minecraft/reel.mjs                # 全シーン撮影 → reel.mp4
//   node test-minecraft/reel.mjs --scene bakery # 1シーンだけ撮影（確認用）
//   node test-minecraft/reel.mjs --fps 12       # フレームレート変更（既定20）
//   node test-minecraft/reel.mjs --list         # シーン一覧
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const W = 720, H = 1280;
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const FPS = Number(opt('--fps', 20));
const OUT = opt('--out', '/tmp/reel');
const ONLY = opt('--scene', null);
const MOBS = opt('--mobs', 'off'); // off: NPC/モブを止めて写り込みゼロに（onで賑やかし入り）

// 各シーン: 表示時間(秒)・時刻(0-1: 0.25=朝, 0.5=昼, 0.78=夕)・カメラキーフレーム [x,y,z,yaw,pitch]
// 座標は shot-qa.mjs のQA視点を起点に、ドリー/パンの動きを付けたもの。
const SCENES = [
  { name: 'opening', sec: 3.5, time: 0.30, // 校庭空撮 → 校舎正面へ降下
    keys: [[8, 52, 26, 0, -0.62], [8, 36, 2, 0, -0.18], [8, 33, -7, 0, -0.05]] },
  { name: 'genkan', sec: 2.5, time: 0.35, // 昇降口（下駄箱）へ寄る
    keys: [[8, 32.5, -26.5, Math.PI, -0.08], [8, 32, -29.5, Math.PI, -0.10]] },
  { name: 'bakery', sec: 3.5, time: 0.45, // パン屋 面陳列ヒーローウォールを横パン
    keys: [[11.5, 32, -31.5, 0.22, -0.10], [14, 32, -32, 0, -0.12], [16.5, 32, -31.5, -0.22, -0.10]] },
  { name: 'cafe', sec: 2.5, time: 0.5, // South in North v2 に寄る
    keys: [[-19.5, 32.5, -26, 0, -0.06], [-19.5, 32, -28.8, 0, -0.10]] },
  { name: 'kitchen', sec: 2.5, time: 0.5, // 旧給食室をゆっくりパン
    keys: [[25, 32, -30, 0.18, -0.06], [27, 32, -30.8, -0.18, -0.08]] },
  { name: 'gym', sec: 2.5, time: 0.55, // 体育館内部（x29..47/z-13..5/床y31）南端から北向きに回転パン
    keys: [[38, 31.7, -11.5, Math.PI - 0.28, 0.04], [38, 31.7, -11.5, Math.PI + 0.28, -0.06]] },
  { name: 'valley', sec: 4, time: 0.62, // 校庭南の田んぼ・里山を南向き(yaw π)で空撮スイープ
    keys: [[-18, 45, 24, Math.PI, -0.32], [8, 43, 28, Math.PI, -0.30], [26, 43, 26, Math.PI, -0.32]] },
  { name: 'finale', sec: 3.5, time: 0.735, // 日没(0.75)直前の校舎正面へプルバック
    keys: [[8, 33, -8, 0, -0.04], [8, 38, 8, 0, -0.22], [8, 44, 20, 0, -0.40]] },
];

if (args.includes('--list')) {
  for (const s of SCENES) console.log(`${s.name}\t${s.sec}s\ttime=${s.time}`);
  process.exit(0);
}
const scenes = ONLY ? SCENES.filter(s => s.name === ONLY) : SCENES;
if (!scenes.length) { console.error(`unknown scene: ${ONLY} (--list で一覧)`); process.exit(1); }

// キーフレーム列を smoothstep でイージング補間（区間は等分割）
const ease = t => t * t * (3 - 2 * t);
function camAt(keys, t) {
  if (keys.length === 1) return keys[0];
  const seg = Math.min(Math.floor(t * (keys.length - 1)), keys.length - 2);
  const u = ease(t * (keys.length - 1) - seg);
  const a = keys[seg], b = keys[seg + 1];
  return a.map((v, i) => v + (b[i] - v) * u);
}

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

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--hide-scrollbars', '--mute-audio'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
if (MOBS === 'off') await page.addInitScript(() => localStorage.setItem('mc_settings', JSON.stringify({ mobs: false })));
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto(`http://localhost:${port}/minecraft`, { waitUntil: 'load' });
await page.waitForTimeout(1200);
await page.click('#overlay', { timeout: 60000 }).catch(() => {});
await page.waitForSelector('#overlay', { state: 'hidden', timeout: 15000 }).catch(() => {});
// リール用にHUD・クエスト・吹き出し等のDOMを全部隠す（描画はcanvasのみ）
await page.addStyleTag({ content: 'body>*:not(#game){display:none!important}' });
await page.evaluate(() => { window.__vm && window.__vm(false); }); // 一人称の手も隠す
await page.waitForTimeout(1500);

let frame = 0;
const t0 = Date.now();
for (const s of scenes) {
  const frames = Math.round(s.sec * FPS);
  // シーン頭にジャンプしてチャンク生成と空の色を落ち着かせる
  await page.evaluate(([time, cam]) => { window.__time(time); window.__view(...cam); }, [s.time, s.keys[0]]);
  await page.waitForTimeout(3000);
  for (let i = 0; i < frames; i++) {
    const cam = camAt(s.keys, frames === 1 ? 0 : i / (frames - 1));
    await page.evaluate(([time, c]) => { window.__time(time); window.__view(...c); }, [s.time, cam]);
    await page.waitForTimeout(90); // 1フレーム描画の落ち着き待ち
    await page.screenshot({ path: path.join(OUT, `frame_${String(frame++).padStart(6, '0')}.png`), timeout: 120000 });
  }
  console.log(`scene ${s.name}: ${frames}f (${((Date.now() - t0) / 1000) | 0}s elapsed)`);
}
console.log('pageerrors:', errs.length, errs.slice(0, 2).join('|'));
await browser.close();
await new Promise(r => server.close(r));

// ffmpegがあればmp4に結合
const mp4 = path.join(OUT, 'reel.mp4');
const ff = spawnSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(OUT, 'frame_%06d.png'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
if (ff.error || ff.status !== 0) {
  console.log(`ffmpegでの結合に失敗/未導入。手動結合: ffmpeg -framerate ${FPS} -i ${OUT}/frame_%06d.png -c:v libx264 -pix_fmt yuv420p ${mp4}`);
} else {
  console.log(`done: ${mp4} (${frame} frames, ${(frame / FPS).toFixed(1)}s)`);
}
