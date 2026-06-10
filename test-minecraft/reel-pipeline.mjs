// Instagramリール生成パイプライン v4（音声先行・単一ソース・3ステージ＋検証）
//
//   reel-script.json（単一の真実: セグメント+セリフ+タイトル）
//     │ tts      VOICEVOXで全セリフ合成 → セリフ長からセグメント尺を逆算 → timeline.json
//     │ capture  timelineの尺どおりに決定的1コマ撮影（アクションはセリフ行に同期）
//     │ mux      ASSテロップ焼込み + 音声合成(ffmpeg/BGMなし) + エンドカード → final.mp4
//     └ verify   尺assert + 全セリフ中点のフレーム抽出 + 行ごとの有音/行間の無音検査
//
// 使い方:
//   node test-minecraft/reel-pipeline.mjs tts|capture|mux|verify|all [--out /tmp/reel4] [--seg name]
// 前提: VOICEVOX ENGINE (127.0.0.1:50021) / ffmpeg(libass) / fonts-noto-cjk
import { readFile, writeFile, mkdir, rm, readdir, link, access } from 'node:fs/promises';
import path from 'node:path';
import { serveStatic, GameSession, ACTIONS, SETUPS, lerpKeys, wrapJp, run, ffprobeDur, tc, escAss } from './reel-lib.mjs';

const args = process.argv.slice(2);
const CMD = args[0];
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const OUT = opt('--out', '/tmp/reel4');
const ONLY = opt('--seg', null);
const VV = 'http://127.0.0.1:50021';
const SCRIPT = JSON.parse(await readFile(path.resolve(import.meta.dirname, 'reel-script.json'), 'utf8'));
const FPS = SCRIPT.fps;
const W = 720, H = 1280;
const ENDCARD_MIN = 3.2;
const tlPath = path.join(OUT, 'timeline.json');
const finalMp4 = path.join(OUT, 'final.mp4');

// ════════════════════════════ tts ════════════════════════════
async function stageTts() {
  const adir = path.join(OUT, '_voice');
  await rm(adir, { recursive: true, force: true });
  await mkdir(adir, { recursive: true });
  const { padHead, padTail, gap } = SCRIPT;

  const lines = [];
  for (let i = 0; i < SCRIPT.lines.length; i++) {
    const L = SCRIPT.lines[i];
    const sp = SCRIPT.speakers[L.speaker];
    const q = await (await fetch(`${VV}/audio_query?speaker=${sp.id}&text=${encodeURIComponent(L.text)}`, { method: 'POST' })).json();
    q.speedScale = sp.speed; q.intonationScale = 1.25;
    const wav = Buffer.from(await (await fetch(`${VV}/synthesis?speaker=${sp.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q),
    })).arrayBuffer());
    const file = path.join(adir, `line_${String(i).padStart(2, '0')}.wav`);
    await writeFile(file, wav);
    lines.push({ i, ...L, file, dur: ffprobeDur(file), label: sp.label, color: sp.color });
    console.log(`tts ${i} ${sp.label} ${lines[i].dur.toFixed(2)}s ${L.text.slice(0, 18)}…`);
  }

  // セグメント尺 = padHead + Σ(セリフ+gap) - gap + padTail（フレーム境界へスナップ）
  const durations = {}, segStarts = {};
  let t = 0;
  const timed = [];
  for (const seg of SCRIPT.segs) {
    const ls = lines.filter(l => l.seg === seg.name);
    let sec = ls.length ? padHead + ls.reduce((a, l) => a + l.dur + gap, 0) - gap + padTail : 0;
    if (seg.name === 'endcard') sec = Math.max(sec, ENDCARD_MIN);
    sec = Math.ceil(sec * FPS) / FPS;
    segStarts[seg.name] = Number(t.toFixed(4));
    durations[seg.name] = Number(sec.toFixed(4));
    let cur = t + padHead;
    for (const l of ls) { timed.push({ ...l, start: Number(cur.toFixed(3)), end: Number((cur + l.dur).toFixed(3)) }); cur += l.dur + gap; }
    t += sec;
  }
  const timeline = { fps: FPS, total: Number(t.toFixed(4)), segStarts, durations, lines: timed };
  await writeFile(tlPath, JSON.stringify(timeline, null, 2));
  console.log('durations:', JSON.stringify(durations));
  console.log(`TOTAL: ${t.toFixed(1)}s (${lines.length} lines) → ${tlPath}`);
  return timeline;
}

// ════════════════════════════ capture ════════════════════════════
async function stageCapture() {
  const tl = JSON.parse(await readFile(tlPath, 'utf8'));
  const segs = SCRIPT.segs.filter(s => s.name !== 'endcard' && (!ONLY || s.name === ONLY));
  if (!segs.length) throw new Error('no segs to capture');
  const root = path.resolve(import.meta.dirname, '../public');
  const { port, close } = await serveStatic(root);
  const game = new GameSession({ port, w: W, h: H });
  await game.boot();
  const t0 = Date.now();
  const captured = [];

  async function captureSeg(s) {
    const dir = path.join(OUT, 'frames', s.name);
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
    const sec = tl.durations[s.name];
    const frames = Math.round(sec * FPS);

    // セリフ行同期アクション → フレーム番号へ（行開始のセグメント相対秒 + offset）
    const sched = new Map(); // frameIdx → [actionName...]
    for (const l of tl.lines.filter(l => l.seg === s.name)) {
      for (const a of (SCRIPT.lines[l.i].actions || [])) {
        if (!ACTIONS[a.do]) throw new Error(`unknown action: ${a.do}`);
        const f = Math.min(frames - 1, Math.max(0, Math.round((l.start - tl.segStarts[s.name] + (a.offset || 0)) * FPS)));
        sched.set(f, [...(sched.get(f) || []), a.do]);
      }
    }

    // 位置決め
    await game.ev(([s2]) => {
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
    }, [{ time: s.time, place: s.place, fly: s.fly, look: s.look, placeAtBaker: s.placeAtBaker }]);
    if (s.setup) await game.ev(SETUPS[s.setup], s.place || null);
    console.log(`  [${s.name}] placed (${((Date.now() - t0) / 1000) | 0}s)`);

    // チャンク生成（setup直後のパーティクル減衰も）をstepで進める
    for (let i = 0; i < (s.preroll || 40); i++) { await game.step(50); await game.page.waitForTimeout(25); if (game.crashed) throw new Error('renderer crashed in preroll'); }
    console.log(`  [${s.name}] preroll done (${((Date.now() - t0) / 1000) | 0}s)`);

    const walkFrames = s.walkSec ? Math.round(s.walkSec * FPS) : 0;
    let walking = walkFrames > 0;
    if (walking) await game.page.keyboard.down('KeyW');
    if (s.mine) await game.page.mouse.move(W / 2, H / 2);

    for (let i = 0; i < frames; i++) {
      const t = frames === 1 ? 0 : i / (frames - 1);
      if (walking && i >= walkFrames) { walking = false; await game.page.keyboard.up('KeyW'); }
      for (const name of (sched.get(i) || [])) await game.ev(ACTIONS[name]);
      if (s.fly) await game.ev(a => window.__view(...a), lerpKeys(s.fly, t));
      else if (s.look) { const [yaw, pitch] = lerpKeys(s.look, t); await game.ev(a => window.__look(a[0], a[1]), [yaw, pitch]); }
      if (s.mine && i % Math.round(FPS * 0.9) === Math.round(FPS * 0.4)) {
        await game.page.mouse.down(); await game.step(1000 / FPS); await game.page.mouse.up();
      }
      await game.ev(([ms, time]) => { window.__time(time); window.__cap.step(ms); }, [1000 / FPS, s.time]);
      await game.shot(path.join(dir, `f_${String(i).padStart(5, '0')}.jpg`));
      if (i % 48 === 0) console.log(`  [${s.name}] f${i}/${frames} (${((Date.now() - t0) / 1000) | 0}s)`);
    }
    if (walking) await game.page.keyboard.up('KeyW');
    captured.push({ name: s.name, sec, frames, fps: FPS, dir });
    console.log(`seg ${s.name}: ${frames}f (${((Date.now() - t0) / 1000) | 0}s elapsed)`);
  }

  for (const s of segs) {
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try { await captureSeg(s); ok = true; }
      catch (e) {
        console.log(`  [${s.name}] attempt ${attempt} failed: ${String(e.message).split('\n')[0]} — relaunching browser`);
        await game.relaunch();
      }
    }
    if (!ok) { console.log(`FATAL: seg ${s.name} failed 3 attempts`); process.exit(1); }
  }

  // manifest: 既存にマージ（--seg 再撮影で全体を失わない）。順序は台本のseg順
  const mPath = path.join(OUT, 'manifest.json');
  let prev = [];
  try { prev = JSON.parse(await readFile(mPath, 'utf8')).segs; } catch {}
  const byName = new Map(prev.map(e => [e.name, e]));
  for (const e of captured) byName.set(e.name, e);
  const merged = SCRIPT.segs.filter(s => s.name !== 'endcard' && byName.has(s.name)).map(s => byName.get(s.name));
  await writeFile(mPath, JSON.stringify({ fps: FPS, w: W, h: H, segs: merged }, null, 2));
  console.log('pageerrors:', game.errs.length, game.errs.slice(0, 3).join(' | '));
  await game.close();
  await close();
  console.log('manifest:', mPath);
}

// ════════════════════════════ mux ════════════════════════════
async function stageMux() {
  const tl = JSON.parse(await readFile(tlPath, 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(OUT, 'manifest.json'), 'utf8'));

  // 1) フレームを一本の連番へ（撮影は常にtimelineの尺どおり＝トリムしない）
  const stage = path.join(OUT, '_stage');
  await rm(stage, { recursive: true, force: true });
  await mkdir(stage, { recursive: true });
  let n = 0;
  for (const seg of manifest.segs) {
    const files = (await readdir(seg.dir)).filter(f => f.endsWith('.jpg')).sort();
    const want = Math.round(tl.durations[seg.name] * FPS);
    if (files.length !== want) throw new Error(`seg ${seg.name}: frames ${files.length} != timeline ${want} — 台本変更後は capture を再実行してください`);
    for (const f of files) await link(path.join(seg.dir, f), path.join(stage, `s_${String(n++).padStart(6, '0')}.jpg`));
  }
  const playSec = n / FPS;
  const endcardSec = tl.durations.endcard;
  console.log(`frames=${n} play=${playSec.toFixed(1)}s endcard=${endcardSec}s total=${tl.total}s`);

  // 2) エンドカード（ブランドCTA・クレジット表記はこのカード内のみ）
  const ctaPng = path.join(OUT, 'cta.png');
  try { await access(ctaPng); } catch { await renderCta(ctaPng); }

  // 3) ASS テロップ（常時表示のクレジット行は出さない）
  let ass = `[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Noto Sans CJK JP,44,&H00FFFFFF,&H00FFFFFF,&H00141414,&H88000000,1,0,0,0,100,100,0,0,1,4,2,8,36,36,440,1
Style: Title,Noto Sans CJK JP,60,&H00FFFFFF,&H00FFFFFF,&H00302820,&HAA000000,1,0,0,0,100,100,0,0,1,5,3,8,30,30,290,1
Style: Chip,Noto Sans CJK JP,34,&H00FFFFFF,&H00FFFFFF,&H004A3A2A,&HAA000000,1,0,0,0,100,100,0,0,1,4,2,8,30,30,330,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  for (const t of SCRIPT.titles) {
    const at = t.seg ? (tl.segStarts[t.seg] + (t.rel || 0)) : t.at;
    const end = t.seg ? at + (t.dur || 3) : t.end;
    ass += `Dialogue: 1,${tc(at)},${tc(end)},${t.style},,0,0,0,,{\\fad(220,220)}${t.text}\n`;
  }
  for (const v of tl.lines) {
    const end = Math.min(tl.total, v.end + 0.30);
    ass += `Dialogue: 2,${tc(v.start)},${tc(end)},Sub,,0,0,0,,{\\fad(100,100)}{\\c${v.color}\\b1}${v.label}{\\b0}\\N{\\c&HFFFFFF&}${wrapJp(escAss(v.text))}\n`;
  }
  const assFile = path.join(OUT, 'subs.ass');
  await writeFile(assFile, ass);

  // 4) 映像: 連番(上32px=デバッグ帯をクロップ)+ASS → ゲーム本編 / CTAはzoompan → concat
  const gameMp4 = path.join(OUT, '_game.mp4');
  run('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(stage, 's_%06d.jpg'),
    '-vf', `crop=720:1248:0:32,ass=${assFile},scale=1080:1920:flags=lanczos,setsar=1,format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', gameMp4]);
  const ctaMp4 = path.join(OUT, '_cta.mp4');
  run('ffmpeg', ['-y', '-loop', '1', '-i', ctaPng,
    '-vf', `scale=2160:3840,zoompan=z='min(zoom+0.0009,1.08)':d=${Math.round(endcardSec * FPS)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},setsar=1,format=yuv420p`,
    '-frames:v', String(Math.round(endcardSec * FPS)), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', ctaMp4]);
  const list = path.join(OUT, '_concat.txt');
  await writeFile(list, `file '${gameMp4}'\nfile '${ctaMp4}'\n`);
  const vMp4 = path.join(OUT, '_v.mp4');
  run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', vMp4]);

  // 5) 音声: BGMなし。無音ベース + 各セリフを adelay で絶対時刻に配置（WAVヘッダ尊重・端10msフェード）
  const inputs = ['-i', vMp4, '-f', 'lavfi', '-t', String(tl.total), '-i', 'anullsrc=r=24000:cl=mono'];
  let fc = '';
  const mix = ['[1:a]'];
  tl.lines.forEach((v, k) => {
    inputs.push('-i', v.file);
    const d = Math.round(v.start * 1000);
    fc += `[${k + 2}:a]afade=t=in:d=0.01,afade=t=out:st=${Math.max(0, v.dur - 0.01).toFixed(3)}:d=0.01,adelay=${d}|${d}[a${k}];`;
    mix.push(`[a${k}]`);
  });
  fc += `${mix.join('')}amix=inputs=${mix.length}:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]`;
  run('ffmpeg', ['-y', ...inputs, '-filter_complex', fc, '-map', '0:v', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', String(tl.total), finalMp4]);
  console.log(`done: ${finalMp4} (${tl.total}s, 1080x1920@${FPS})`);
}

async function renderCta(ctaPng) {
  const { chromium } = await import('playwright');
  const html = `<!doctype html><meta charset="utf-8"><style>
    *{margin:0;box-sizing:border-box;font-family:'Noto Sans CJK JP',sans-serif}
    body{width:720px;height:1280px;display:flex;align-items:center;justify-content:center;
      background:radial-gradient(circle at 50% 35%, #faf5ec, #F5EDE4 60%, #E8D5B7)}
    .card{display:flex;flex-direction:column;align-items:center;gap:24px;color:#3A4A2F;text-align:center;padding:8%}
    .stamp{width:150px;height:150px;border-radius:18px;background:#F5EDE4;border:4px dashed #5C6B4A;
      box-shadow:0 0 0 8px #F5EDE4,0 0 0 10px #5C6B4A33,0 14px 30px rgba(60,74,47,.25);
      display:flex;align-items:center;justify-content:center}
    .stamp .in{width:96px;height:96px;border-radius:50%;background:#5C6B4A;display:flex;align-items:center;justify-content:center;font-size:50px}
    h1{font-size:56px;font-weight:900;color:#5C6B4A}
    h2{font-size:27px;font-weight:700;color:#6b6253}
    .pill{margin-top:6px;background:#5C6B4A;color:#F5EDE4;font-weight:900;font-size:34px;padding:18px 36px;border-radius:999px;box-shadow:0 6px 0 #3A4A2F}
    .save{font-size:24px;font-weight:700;color:#6b6253}
    .url{font-size:20px;background:#3A4A2F;color:#F5EDE4;padding:10px 16px;border-radius:10px}
    .credit{font-size:17px;color:#857a66;margin-top:14px;line-height:1.5}
  </style><body><div class="card">
    <div class="stamp"><div class="in">🥖</div></div>
    <h1>プチヘルメース</h1>
    <h2>旧南方小学校のパン屋さん、まるごと擬似体験</h2>
    <div class="pill">▶ 今すぐ無料でプレイ</div>
    <div class="save">🔖 保存して、あとでゆっくり</div>
    <div class="url">プロフィールのリンクから</div>
    <div class="credit">VOICEVOX:ずんだもん／四国めたん／春日部つむぎ<br>非公式ファンメイド作品です</div>
  </div>`;
  const browser = await chromium.launch();
  const pg = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
  await pg.setContent(html, { waitUntil: 'load' });
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: ctaPng });
  await browser.close();
  console.log('cta.png rendered');
}

// ════════════════════════════ verify ════════════════════════════
async function stageVerify() {
  const tl = JSON.parse(await readFile(tlPath, 'utf8'));
  let fail = 0;
  const check = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) fail++; };

  // 1) 尺
  const dur = ffprobeDur(finalMp4);
  check(Math.abs(dur - tl.total) < 0.07, `duration ${dur.toFixed(2)}s == timeline ${tl.total}s`);

  // 2) 各セリフ中点 + タイトル中点のフレーム抽出（納品前の目視用）
  const vdir = path.join(OUT, 'verify');
  await rm(vdir, { recursive: true, force: true });
  await mkdir(vdir, { recursive: true });
  for (const v of tl.lines) {
    const mid = (v.start + v.end) / 2;
    run('ffmpeg', ['-y', '-v', 'error', '-ss', String(mid.toFixed(2)), '-i', finalMp4, '-frames:v', '1', path.join(vdir, `line_${String(v.i).padStart(2, '0')}_${v.seg}.png`)]);
  }
  SCRIPT.titles.forEach((t, k) => {
    const at = t.seg ? (tl.segStarts[t.seg] + (t.rel || 0)) : t.at;
    const end = t.seg ? at + (t.dur || 3) : t.end;
    run('ffmpeg', ['-y', '-v', 'error', '-ss', String(((at + end) / 2).toFixed(2)), '-i', finalMp4, '-frames:v', '1', path.join(vdir, `title_${k}.png`)]);
  });
  console.log(`✓ extracted ${tl.lines.length} line frames + ${SCRIPT.titles.length} title frames → ${vdir}`);

  // 3) 音声: 各行区間は有音 / 0.5s以上の行間は無音（BGM廃止により判定可能）
  for (const v of tl.lines) {
    const r = runStderr('ffmpeg', ['-ss', String((v.start + 0.05).toFixed(2)), '-t', String(Math.max(0.2, v.dur - 0.1).toFixed(2)), '-i', finalMp4, '-af', 'volumedetect', '-f', 'null', '-']);
    const m = /mean_volume: ([-0-9.]+) dB/.exec(r);
    check(m && Number(m[1]) > -45, `voice line ${v.i} (${v.text.slice(0, 10)}…) mean ${m ? m[1] : '?'}dB`);
  }
  for (let k = 0; k + 1 < tl.lines.length; k++) {
    const gapStart = tl.lines[k].end + 0.1, gapEnd = tl.lines[k + 1].start - 0.1;
    if (gapEnd - gapStart < 0.5) continue;
    const r = runStderr('ffmpeg', ['-ss', gapStart.toFixed(2), '-t', (gapEnd - gapStart).toFixed(2), '-i', finalMp4, '-af', 'volumedetect', '-f', 'null', '-']);
    const m = /mean_volume: ([-0-9.]+) dB/.exec(r);
    check(m && Number(m[1]) < -45, `gap after line ${k} silent (${m ? m[1] : '?'}dB)`);
  }
  console.log(fail ? `VERIFY FAILED: ${fail} problem(s)` : 'VERIFY PASSED');
  process.exitCode = fail ? 1 : 0;
}
import { spawnSync } from 'node:child_process';
function runStderr(cmd, a) {
  const r = spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return (r.stderr || '') + (r.stdout || '');
}

// ════════════════════════════ entry ════════════════════════════
await mkdir(OUT, { recursive: true });
switch (CMD) {
  case 'tts': await stageTts(); break;
  case 'capture': await stageCapture(); break;
  case 'mux': await stageMux(); break;
  case 'verify': await stageVerify(); break;
  case 'all': await stageTts(); await stageCapture(); await stageMux(); await stageVerify(); break;
  default: console.error('usage: reel-pipeline.mjs tts|capture|mux|verify|all [--out dir] [--seg name]'); process.exit(1);
}
