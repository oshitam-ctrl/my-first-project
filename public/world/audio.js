// audio.js — Web Audio の生成音だけで賄う環境音とSFX（外部ファイルなし）。
// iOS対策: 最初のユーザー操作で AudioContext を resume する（/minecraft 版の知見）。

import { riverZ } from './layout.js';

export function createAudio() {
  let ctx = null, master = null, enabled = true;
  let windGain = null, riverGain = null, birdTimer = 0;

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = enabled ? 0.5 : 0;
      master.connect(ctx.destination);
      startAmbience();
      return true;
    } catch (e) { return false; }
  }

  // 最初のジェスチャでアンロック（resume は同期的に呼ぶこと）
  function unlock() {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
  }
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock);

  function noiseBuffer(sec = 2) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ---- 環境音: 風（帯域ノイズ）＋川（近いと強い）＋ときどき鳥 ---------------
  function startAmbience() {
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(3);
    noise.loop = true;
    const windF = ctx.createBiquadFilter();
    windF.type = 'bandpass'; windF.frequency.value = 320; windF.Q.value = 0.6;
    windGain = ctx.createGain(); windGain.gain.value = 0.05;
    noise.connect(windF).connect(windGain).connect(master);
    noise.start();
    // 風の揺らぎ
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
    lfo.frequency.value = 0.13; lfoG.gain.value = 0.025;
    lfo.connect(lfoG).connect(windGain.gain);
    lfo.start();

    const noise2 = ctx.createBufferSource();
    noise2.buffer = noiseBuffer(2.3);
    noise2.loop = true;
    const rivF = ctx.createBiquadFilter();
    rivF.type = 'highpass'; rivF.frequency.value = 1500;
    riverGain = ctx.createGain(); riverGain.gain.value = 0;
    noise2.connect(rivF).connect(riverGain).connect(master);
    noise2.start();
  }

  function bird() {
    if (!ctx || !enabled) return;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    const f0 = 2200 + Math.random() * 1400;
    o.frequency.setValueAtTime(f0, t0);
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      o.frequency.setValueAtTime(f0 + Math.random() * 500, t0 + i * 0.14);
      o.frequency.exponentialRampToValueAtTime(f0 * 0.7, t0 + i * 0.14 + 0.1);
    }
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.045, t0 + 0.02);
    g.gain.linearRampToValueAtTime(0, t0 + n * 0.14 + 0.1);
    o.connect(g).connect(master);
    o.start(t0); o.stop(t0 + n * 0.14 + 0.2);
  }

  // 毎フレーム呼ぶ: 川の距離で水音を調整、たまに鳥
  function update(dt, pos, indoors) {
    if (!ctx) return;
    const dRiver = Math.abs(pos.z - riverZ(pos.x));
    const target = indoors ? 0 : Math.max(0, 0.12 * (1 - dRiver / 28));
    riverGain.gain.value += (target - riverGain.gain.value) * Math.min(1, dt * 2);
    windGain.gain.value += ((indoors ? 0.012 : 0.05) - windGain.gain.value) * Math.min(1, dt * 2);
    birdTimer -= dt;
    if (birdTimer <= 0) {
      birdTimer = 3 + Math.random() * 8;
      if (!indoors) bird();
    }
  }

  // ---- SFX -----------------------------------------------------------------
  function blip(freq, dur = 0.08, type = 'sine', vol = 0.12, when = 0) {
    if (!ctx || !enabled) return;
    const t0 = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function footstep(surface) {
    if (!ctx || !enabled) return;
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(0.1);
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    let freq = 700, vol = 0.06;
    if (surface === 'floor') { freq = 1100; vol = 0.07; }      // 板張り
    else if (surface === 'path' || surface === 'stone' || surface === 'yard') { freq = 1700; vol = 0.05; }
    else if (surface === 'water') { freq = 2600; vol = 0.09; }
    f.type = 'lowpass'; f.frequency.value = freq * (0.9 + Math.random() * 0.3);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
    src.connect(f).connect(g).connect(master);
    src.start(t0);
    if (surface === 'floor') blip(140 + Math.random() * 40, 0.05, 'triangle', 0.05); // 木のコツ
  }

  const sfx = {
    chime() { blip(880, 0.5, 'sine', 0.1); blip(1320, 0.7, 'sine', 0.08, 0.12); },   // ドアベル
    talk() { blip(520, 0.06, 'triangle', 0.08); },
    buy() { blip(990, 0.08, 'square', 0.05); blip(1480, 0.2, 'square', 0.05, 0.09); }, // レジ
    eat() { blip(300, 0.08, 'triangle', 0.09); blip(260, 0.08, 'triangle', 0.08, 0.14); blip(360, 0.12, 'triangle', 0.08, 0.3); },
    pray() { blip(1760, 1.6, 'sine', 0.09); blip(2640, 1.2, 'sine', 0.04, 0.02); },  // 鈴
    fanfare() {
      [523, 659, 784, 1046].forEach((f, i) => blip(f, 0.35, 'triangle', 0.1, i * 0.13));
      [659, 784, 1046, 1318].forEach((f, i) => blip(f, 0.5, 'sine', 0.06, 0.55 + i * 0.13));
    },
    open() { blip(740, 0.07, 'triangle', 0.06); },
  };

  return {
    update, footstep, ...sfx,
    setEnabled(b) {
      enabled = b;
      if (master) master.gain.value = b ? 0.5 : 0;
    },
    get enabled() { return enabled; },
  };
}
