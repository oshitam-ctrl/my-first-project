// audio.js — tiny Web Audio SFX engine for the voxel game.
// Pure Web Audio API: no assets, no libs, no imports. Works offline.
// Each sound is synthesized from oscillators / noise -> gain envelope -> master.

export function createAudio() {
  let ctx = null;          // lazily created AudioContext (only after a gesture)
  let master = null;       // master GainNode; gain=0 when muted
  let noiseBuf = null;     // cached white-noise buffer for crunch/step
  let enabled = true;

  // --- Music state ---
  let musicEnabled = true;   // user toggle for background music (on top of master)
  let musicGain = null;      // dedicated gain so music can be muted independently
  let musicDelay = null;     // feedback delay for a soft reverb-ish tail
  let musicFilter = null;    // shared lowpass to keep voices mellow
  let musicTimer = null;     // setTimeout handle for the lookahead scheduler
  let musicPlaying = false;  // true while scheduling is active
  let nextNoteTime = 0;      // AudioContext-clock time of the next scheduled note

  // C major pentatonic across a couple of octaves (Hz). Calm, no dissonance.
  const SCALE = [
    130.81, 146.83, 164.81, 196.00, 220.00, // C3 D3 E3 G3 A3
    261.63, 293.66, 329.63, 392.00, 440.00, // C4 D4 E4 G4 A4
    523.25, 587.33,                         // C5 D5
  ];

  // Try to (re)create the context. Returns true if usable. No-ops on failure.
  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false; // unsupported -> everything no-ops
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = enabled ? 0.25 : 0; // modest volume to avoid clipping
      master.connect(ctx.destination);
      noiseBuf = makeNoise();
      buildMusicChain();
    } catch (e) {
      ctx = null;
      return false;
    }
    return true;
  }

  // Build the music signal chain once: voices -> lowpass -> musicGain -> master,
  // with a parallel feedback delay off musicGain for a gentle reverb-ish tail.
  function buildMusicChain() {
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.0001; // starts silent; faded in by startMusic()
    musicFilter = ctx.createBiquadFilter();
    musicFilter.type = 'lowpass';
    musicFilter.frequency.setValueAtTime(1400, ctx.currentTime);
    musicFilter.Q.value = 0.5;
    musicFilter.connect(musicGain).connect(master);

    // Delay -> feedback -> back into delay; tapped into musicGain for the echo.
    musicDelay = ctx.createDelay();
    musicDelay.delayTime.value = 0.38;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    musicDelay.connect(fb).connect(musicDelay);
    musicDelay.connect(musicGain);
  }

  // One second of mono white noise, reused by every noisy sound.
  function makeNoise() {
    const len = Math.floor(ctx.sampleRate);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ±pct random multiplier so repeats don't sound machine-gun identical.
  function vary(pct) { return 1 + (Math.random() * 2 - 1) * pct; }

  // Schedule a short attack/decay envelope on a gain node, then auto-stop src.
  function env(g, src, t0, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    src.start(t0);
    src.stop(t0 + attack + decay + 0.02);
  }

  // A pitched blip: osc -> gain -> master.
  function blip(type, freq, peak, attack, decay, t0) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    osc.connect(g).connect(master);
    env(g, osc, t0, peak, attack, decay);
    return osc;
  }

  // A filtered noise burst: noise -> bandpass/lowpass -> gain -> master.
  function noiseBurst(filterType, freq, q, peak, attack, decay, t0) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.playbackRate.value = vary(0.1);
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.setValueAtTime(freq, t0);
    f.Q.value = q;
    const g = ctx.createGain();
    src.connect(f).connect(g).connect(master);
    env(g, src, t0, peak, attack, decay);
    return src;
  }

  // A single soft music note: sine/triangle -> filter (+delay tail), long fade.
  function musicNote(freq, t0, dur, peak) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = Math.random() < 0.5 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + dur * 0.35);     // soft attack
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);     // gentle release
    osc.connect(g);
    g.connect(musicFilter);
    g.connect(musicDelay); // feed the echo for a reverb-ish wash
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // Schedule the next note (or a rest) and advance nextNoteTime. Randomized
  // pitch / duration / rests keep it from sounding like a loop.
  function scheduleNote() {
    const freq = SCALE[Math.floor(Math.random() * SCALE.length)];
    const dur = 1.4 + Math.random() * 2.2; // 1.4s..3.6s notes
    musicNote(freq, nextNoteTime, dur, 0.18 + Math.random() * 0.12);

    // Occasionally add a soft harmony a fifth up (SCALE step of 3).
    if (Math.random() < 0.25) {
      const idx = SCALE.indexOf(freq);
      const h = SCALE[Math.min(idx + 3, SCALE.length - 1)];
      musicNote(h, nextNoteTime + 0.04, dur * 0.9, 0.1);
    }

    // Gap to the next note: part of this note plus a random rest.
    const rest = Math.random() < 0.35 ? 0.8 + Math.random() * 1.6 : 0;
    nextNoteTime += dur * (0.45 + Math.random() * 0.25) + rest;
  }

  // Lookahead scheduler: keep ~2s of notes queued on the audio clock.
  function musicScheduler() {
    if (!musicPlaying || !ctx) return;
    while (nextNoteTime < ctx.currentTime + 2.0) scheduleNote();
    musicTimer = setTimeout(musicScheduler, 400);
  }

  const sfx = {
    enabled,

    resume() {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      if (musicEnabled) sfx.startMusic();
    },

    // Begin generative music. No-op if already playing or context not ready.
    startMusic() {
      if (!ctx || musicPlaying || !musicGain) return;
      musicPlaying = true;
      const t = ctx.currentTime;
      musicGain.gain.cancelScheduledValues(t);
      musicGain.gain.setValueAtTime(Math.max(musicGain.gain.value, 0.0001), t);
      musicGain.gain.linearRampToValueAtTime(0.22, t + 3); // slow fade-in
      nextNoteTime = t + 0.1;
      musicScheduler();
    },

    // Stop scheduling and fade out the music tail.
    stopMusic() {
      if (!musicPlaying) return;
      musicPlaying = false;
      if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
      if (musicGain && ctx) {
        const t = ctx.currentTime;
        musicGain.gain.cancelScheduledValues(t);
        musicGain.gain.setValueAtTime(Math.max(musicGain.gain.value, 0.0001), t);
        musicGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      }
    },

    // Toggle music. On + resumed context -> (re)start; off -> stop.
    setMusicEnabled(on) {
      musicEnabled = !!on;
      if (musicEnabled) {
        if (ctx && ctx.state !== 'suspended') sfx.startMusic();
      } else {
        sfx.stopMusic();
      }
    },

    // break = noisy "crunch" (filtered noise) + a low thud underneath.
    break(blockId = 0) {
      if (!enabled || !ensure()) return;
      const t0 = ctx.currentTime;
      const tint = ((blockId * 53) % 11) / 11;        // per-id timbre offset
      const p = vary(0.06);
      noiseBurst('bandpass', (900 + tint * 700) * p, 1.2, 0.5, 0.004, 0.11, t0);
      blip('triangle', (150 + tint * 60) * p, 0.4, 0.004, 0.09, t0); // thud
    },

    // place = short woody "thunk", lower pitch square/triangle blip.
    place(blockId = 0) {
      if (!enabled || !ensure()) return;
      const t0 = ctx.currentTime;
      const tint = ((blockId * 37) % 7) / 7;
      const p = vary(0.06);
      blip('square', (220 + tint * 40) * p, 0.22, 0.003, 0.07, t0);
      blip('triangle', (110 + tint * 20) * p, 0.4, 0.004, 0.1, t0);
    },

    // step = very short soft low blip.
    step() {
      if (!enabled || !ensure()) return;
      const t0 = ctx.currentTime;
      noiseBurst('lowpass', 380 * vary(0.12), 0.7, 0.18, 0.003, 0.05, t0);
    },

    // select = tiny high sine blip (hotbar).
    select() {
      if (!enabled || !ensure()) return;
      const t0 = ctx.currentTime;
      blip('sine', 1320 * vary(0.04), 0.18, 0.002, 0.06, t0);
    },

    // hurt = short descending "ow" blip + a touch of noise grit.
    hurt() {
      if (!enabled || !ensure()) return;
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      const f0 = 440 * vary(0.05);
      osc.frequency.setValueAtTime(f0, t0);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.4, t0 + 0.18); // descend
      osc.connect(g).connect(master);
      env(g, osc, t0, 0.3, 0.004, 0.18);
      noiseBurst('lowpass', 700 * vary(0.1), 0.6, 0.12, 0.003, 0.08, t0);
    },

    // eat = soft repeated chewing: a couple of low filtered noise crunches.
    eat() {
      if (!enabled || !ensure()) return;
      const t0 = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const t = t0 + i * 0.12;
        noiseBurst('lowpass', (300 + Math.random() * 150), 0.8, 0.16, 0.005, 0.07, t);
        blip('triangle', (90 + Math.random() * 30), 0.12, 0.005, 0.06, t);
      }
    },

    setEnabled(on) {
      enabled = !!on;
      sfx.enabled = enabled;
      if (master) {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(enabled ? 0.25 : 0, t);
      }
    },
  };

  return sfx;
}
