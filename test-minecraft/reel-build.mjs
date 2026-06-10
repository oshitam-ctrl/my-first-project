// リール最終ビルド（音声先行方式）— reel-script.json の3人掛け合いを先に合成し、
// セリフ長から各セグメントの尺を逆算 → play-reel.mjs がその尺どおりに撮影 →
// テロップ焼き込み + 音声/BGM mix で Instagram リール (1080x1920) を出力する。
// 口と画面が構造的に同期する（後合わせのズレが原理的に出ない）。
//
// 手順:
//   1) node test-minecraft/reel-build.mjs --tts        # 音声合成 → durations/timings
//   2) node test-minecraft/play-reel.mjs --fps 24 --durations /tmp/playreel/durations.json
//   3) node test-minecraft/reel-build.mjs --assemble   # 動画組み立て → final.mp4
//
// 前提: VOICEVOX ENGINE (127.0.0.1:50021) / ffmpeg(libass) / fonts-noto-cjk
import { readFile, writeFile, mkdir, rm, readdir, link, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const IN = opt('--in', '/tmp/playreel');
const OUTMP4 = opt('--out', path.join(IN, 'final.mp4'));
const VV = 'http://127.0.0.1:50021';
const SCRIPT = JSON.parse(await readFile(path.resolve(import.meta.dirname, 'reel-script.json'), 'utf8'));
const ENDCARD_SEC_MIN = 3.2;

const run = (cmd, a, opts = {}) => {
  const r = spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} failed:\n${(r.stderr || '').slice(-2000)}`);
  return r.stdout;
};
const ffprobeDur = f => Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).trim());

// ════════════════ フェーズ1: 音声合成 → セグメント尺の逆算 ════════════════
if (args.includes('--tts')) {
  const adir = path.join(IN, '_voice');
  await rm(adir, { recursive: true, force: true });
  await mkdir(adir, { recursive: true });
  const { padHead, padTail, gap } = SCRIPT;

  // 各セリフを合成して長さを実測
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
    lines.push({ ...L, i, file, dur: ffprobeDur(file), label: sp.label, color: sp.color });
    console.log(`tts ${i} ${sp.label} ${lines[i].dur.toFixed(2)}s ${L.text.slice(0, 20)}…`);
  }

  // セグメント尺 = padHead + Σ(セリフ+gap) - gap + padTail（セグメント内で声が完結）
  const segOrder = [...new Set(lines.map(l => l.seg))];
  const durations = {};
  let t = 0;
  const timed = [];
  const CAP_FPS = 24; // play-reel.mjs の既定fps — フレーム境界にスナップして累積ズレを防ぐ
  for (const seg of segOrder) {
    const ls = lines.filter(l => l.seg === seg);
    let sec = padHead + ls.reduce((a, l) => a + l.dur + gap, 0) - gap + padTail;
    sec = Math.ceil(sec * CAP_FPS) / CAP_FPS;
    durations[seg] = Number(sec.toFixed(4));
    let cur = t + padHead;
    for (const l of ls) { timed.push({ ...l, start: Number(cur.toFixed(3)), end: Number((cur + l.dur).toFixed(3)) }); cur += l.dur + gap; }
    t += sec;
  }
  if (durations.endcard) durations.endcard = Math.max(durations.endcard, ENDCARD_SEC_MIN);
  await mkdir(IN, { recursive: true });
  await writeFile(path.join(IN, 'durations.json'), JSON.stringify(durations, null, 2));
  await writeFile(path.join(IN, 'timings.json'), JSON.stringify({ total: t, lines: timed }, null, 2));
  console.log('durations:', JSON.stringify(durations));
  console.log(`TOTAL voice timeline: ${t.toFixed(1)}s (${lines.length} lines)`);
  process.exit(0);
}

// ════════════════ フェーズ2: 組み立て ════════════════
if (!args.includes('--assemble')) { console.error('usage: --tts | --assemble'); process.exit(1); }
const manifest = JSON.parse(await readFile(path.join(IN, 'manifest.json'), 'utf8'));
const timings = JSON.parse(await readFile(path.join(IN, 'timings.json'), 'utf8'));
const durations = JSON.parse(await readFile(path.join(IN, 'durations.json'), 'utf8'));
const FPS = manifest.fps;

// 1) 撮影フレームを一本の連番へ（endcard はフレーム撮影が無いので後で合成）
const stage = path.join(IN, '_stage');
await rm(stage, { recursive: true, force: true });
await mkdir(stage, { recursive: true });
let n = 0;
for (const seg of manifest.segs) {
  const files = (await readdir(seg.dir)).filter(f => f.endsWith('.jpg')).sort();
  for (const f of files) await link(path.join(seg.dir, f), path.join(stage, `s_${String(n++).padStart(6, '0')}.jpg`));
}
const playSec = n / FPS;
const endcardSec = Math.max(durations.endcard || 0, ENDCARD_SEC_MIN);
const total = playSec + endcardSec;
console.log(`frames=${n} play=${playSec.toFixed(1)}s endcard=${endcardSec.toFixed(1)}s total=${total.toFixed(1)}s (voice ${timings.total.toFixed(1)}s)`);

// 2) CTAカード（ブランド配色・切手バッジ・保存喚起）を生成
const ctaPng = path.join(IN, 'cta.png');
try { await access(ctaPng); } catch {
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
  const pg = await (await browser.newContext({ viewport: { width: 720, height: 1280 } })).newPage();
  await pg.setContent(html, { waitUntil: 'load' });
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: ctaPng });
  await browser.close();
  console.log('cta.png rendered');
}

// 3) ASS テロップ（話者カラー・名前つき・画面中上段 = HUDと干渉しない帯）
const tc = s => `0:${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`;
const esc = t => t.replace(/\{/g, '(').replace(/\}/g, ')');
let ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Noto Sans CJK JP,44,&H00FFFFFF,&H00FFFFFF,&H00141414,&H88000000,1,0,0,0,100,100,0,0,1,4,2,8,36,36,440,1
Style: Title,Noto Sans CJK JP,60,&H00FFFFFF,&H00FFFFFF,&H00302820,&HAA000000,1,0,0,0,100,100,0,0,1,5,3,8,30,30,290,1
Style: Credit,Noto Sans CJK JP,21,&H00F0F0F0,&H00FFFFFF,&H00141414,&H66000000,0,0,0,0,100,100,0,0,1,2,1,8,30,30,6,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,${tc(0)},${tc(playSec)},Credit,,0,0,0,,VOICEVOX:ずんだもん・四国めたん・春日部つむぎ
`;
for (const t of SCRIPT.titles) ass += `Dialogue: 1,${tc(t.at)},${tc(t.end)},${t.style},,0,0,0,,{\\fad(220,220)}${t.text}\n`;
for (const v of timings.lines) {
  const end = Math.min(total, v.end + 0.30);
  ass += `Dialogue: 2,${tc(v.start)},${tc(end)},Sub,,0,0,0,,{\\fad(100,100)}{\\c${v.color}\\b1}${v.label}{\\b0}\\N{\\c&HFFFFFF&}${esc(v.text)}\n`;
}
const assFile = path.join(IN, 'subs.ass');
await writeFile(assFile, ass);

// 4) BGM（軽いアルペジオをその場で合成 — 無音リールは離脱率が高い）
const SR = 44100;
function bgmWav(sec) {
  const N = Math.floor(SR * sec);
  const buf = Buffer.alloc(44 + N * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 2, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 2, 40);
  const chords = [[261.6, 329.6, 392.0], [196.0, 246.9, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 349.2]];
  const spb = 60 / 95 / 2; // 95bpm 8分音符
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const beat = Math.floor(t / spb);
    const chord = chords[Math.floor(beat / 8) % 4];
    const f = chord[beat % 3] * (beat % 8 >= 6 ? 2 : 1);
    const env = Math.exp(-(t - beat * spb) * 6);
    const tri = Math.asin(Math.sin(2 * Math.PI * f * t)) * (2 / Math.PI);
    buf.writeInt16LE(Math.max(-1, Math.min(1, tri * env * 0.16)) * 32767, 44 + i * 2);
  }
  return buf;
}
const bgmFile = path.join(IN, '_bgm.wav');
await writeFile(bgmFile, bgmWav(total));

// 5) 声トラック: 各セリフを timings の絶対位置に配置して1本のWAVに（24kHz mono）
const VSR = 24000;
const voiceN = Math.ceil(total * VSR);
const voice = Buffer.alloc(44 + voiceN * 2);
voice.write('RIFF', 0); voice.writeUInt32LE(36 + voiceN * 2, 4); voice.write('WAVEfmt ', 8);
voice.writeUInt32LE(16, 16); voice.writeUInt16LE(1, 20); voice.writeUInt16LE(1, 22);
voice.writeUInt32LE(VSR, 24); voice.writeUInt32LE(VSR * 2, 28); voice.writeUInt16LE(2, 32); voice.writeUInt16LE(16, 34); voice.write('data', 36); voice.writeUInt32LE(voiceN * 2, 40);
for (const v of timings.lines) {
  const wav = await readFile(v.file);
  const dataOff = wav.indexOf(Buffer.from('data')) + 8; // VOICEVOXは24kHz mono s16le
  const startByte = 44 + Math.round(v.start * VSR) * 2;
  wav.copy(voice, startByte, dataOff, Math.min(wav.length, dataOff + (voiceN * 2 - (startByte - 44))));
}
const voiceFile = path.join(IN, '_voice.wav');
await writeFile(voiceFile, voice);

// 6) ffmpeg 合成: [連番+字幕] + [CTAカードzoompan] を連結 → 音声mix → 1080x1920
const gameMp4 = path.join(IN, '_game.mp4');
run('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(stage, 's_%06d.jpg'),
  '-vf', `ass=${assFile},scale=1080:1920:flags=lanczos,setsar=1,format=yuv420p`,
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', gameMp4]);
const ctaMp4 = path.join(IN, '_cta.mp4');
run('ffmpeg', ['-y', '-loop', '1', '-i', ctaPng,
  '-vf', `scale=2160:3840,zoompan=z='min(zoom+0.0009,1.08)':d=${Math.round(endcardSec * FPS)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},setsar=1,format=yuv420p`,
  '-frames:v', String(Math.round(endcardSec * FPS)), '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', ctaMp4]);
const list = path.join(IN, '_concat.txt');
await writeFile(list, `file '${gameMp4}'\nfile '${ctaMp4}'\n`);
const vMp4 = path.join(IN, '_v.mp4');
run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', vMp4]);
run('ffmpeg', ['-y', '-i', vMp4, '-i', voiceFile, '-i', bgmFile,
  '-filter_complex', `[2:a]volume=0.38[bg];[1:a][bg]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]`,
  '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
  '-movflags', '+faststart', '-t', String(total), OUTMP4]);
console.log(`done: ${OUTMP4} (${total.toFixed(1)}s, 1080x1920@${FPS})`);
