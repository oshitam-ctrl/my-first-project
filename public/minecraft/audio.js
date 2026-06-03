// audio.js — tiny Web Audio SFX engine for the voxel game.
// Pure Web Audio API: no assets, no libs, no imports. Works offline.
// Each sound is synthesized from oscillators / noise -> gain envelope -> master.

export function createAudio() {
  let ctx = null;          // lazily created AudioContext (only after a gesture)
  let master = null;       // master GainNode; gain=0 when muted
  let noiseBuf = null;     // cached white-noise buffer for crunch/step
  let enabled = true;
  let unlocked = false;    // true once we've played a silent buffer to unlock iOS

  // --- Music state ---
  let musicEnabled = true;   // user toggle for background music (on top of master)
  let musicGain = null;      // dedicated gain so music can be muted independently
  let musicDelay = null;     // feedback delay for a soft reverb-ish tail
  let musicFilter = null;    // shared lowpass to keep voices mellow
  let musicTimer = null;     // setTimeout handle for the lookahead scheduler
  let musicPlaying = false;  // true while scheduling is active
  let nextNoteTime = 0;      // AudioContext-clock time of the next scheduled note

  // --- Ambience state (generative outdoor soundscape) ---
  let ambEnabled = true;     // user toggle for ambience (on top of master)
  let ambGain = null;        // dedicated gain so ambience is independent of music/sfx
  let ambPlaying = false;    // true while ambience is running
  let ambBirdTimer = null;   // setTimeout handle for the bird lookahead scheduler
  let nextBirdTime = 0;      // AudioContext-clock time of the next bird event
  // Continuous bed nodes (long-lived; their gains are modulated, not recreated).
  let insectGain = null;     // cicada-ish shimmer level
  let windGain = null;       // wind swell level
  let waterGain = null;      // river bed level (only audible near water)
  let birdGain = null;       // sub-gain birds route through (scaled by night/indoor)
  // Current scene -> target levels. Updated by setAmbienceScene().
  let scene = { outdoor: true, nearWater: false, night: false, inBakery: false };
  // Per-layer target gains derived from the scene (set in applyAmbienceScene).
  let ambTargets = { master: 1, insect: 0.05, wind: 0.06, water: 0, bird: 1 };

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
      buildAmbienceChain();
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

  // Build the ambience signal chain once. A master ambGain feeds the master bus.
  // Three continuous beds (insects, wind, water) are long-lived noise sources with
  // their own filters + gains; their levels are ramped by the scene. Bird voices
  // are scheduled one-shots that route through birdGain. Nothing here makes sound
  // until startAmbience() ramps ambGain up.
  function buildAmbienceChain() {
    ambGain = ctx.createGain();
    ambGain.gain.value = 0.0001; // silent until startAmbience()
    ambGain.connect(master);

    birdGain = ctx.createGain();
    birdGain.gain.value = ambTargets.bird;
    birdGain.connect(ambGain);

    // Insects / cicada shimmer: high-bandpass noise with a fast tremolo LFO.
    insectGain = ctx.createGain();
    insectGain.gain.value = 0.0001;
    insectGain.connect(ambGain);
    const insNoise = loopNoise();
    const insFilter = ctx.createBiquadFilter();
    insFilter.type = 'bandpass';
    insFilter.frequency.value = 5200;
    insFilter.Q.value = 6;
    insNoise.connect(insFilter).connect(insectGain);
    const insLfo = ctx.createOscillator();
    const insLfoGain = ctx.createGain();
    insLfo.type = 'sine';
    insLfo.frequency.value = 11; // shimmer rate
    insLfoGain.gain.value = 0.4;
    insLfo.connect(insLfoGain).connect(insectGain.gain);
    insNoise.start();
    insLfo.start();

    // Wind: slow band-pass noise swelling with a slow LFO on gain + filter.
    windGain = ctx.createGain();
    windGain.gain.value = 0.0001;
    windGain.connect(ambGain);
    const windNoise = loopNoise();
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 500;
    windFilter.Q.value = 0.7;
    windNoise.connect(windFilter).connect(windGain);
    const windLfo = ctx.createOscillator();
    const windLfoGain = ctx.createGain();
    windLfo.type = 'sine';
    windLfo.frequency.value = 0.08; // very slow swell
    windLfoGain.gain.value = 0.6;
    windLfo.connect(windLfoGain).connect(windGain.gain);
    const windFiltLfo = ctx.createOscillator();
    const windFiltLfoGain = ctx.createGain();
    windFiltLfo.type = 'sine';
    windFiltLfo.frequency.value = 0.05;
    windFiltLfoGain.gain.value = 200;
    windFiltLfo.connect(windFiltLfoGain).connect(windFilter.frequency);
    windNoise.start();
    windLfo.start();
    windFiltLfo.start();

    // Water / river: soft continuous low-pass noise bed (level 0 unless nearWater).
    waterGain = ctx.createGain();
    waterGain.gain.value = 0.0001;
    waterGain.connect(ambGain);
    const watNoise = loopNoise();
    const watFilter = ctx.createBiquadFilter();
    watFilter.type = 'lowpass';
    watFilter.frequency.value = 1100;
    watFilter.Q.value = 0.4;
    const watHp = ctx.createBiquadFilter();
    watHp.type = 'highpass';
    watHp.frequency.value = 300;
    watNoise.connect(watHp).connect(watFilter).connect(waterGain);
    const watLfo = ctx.createOscillator();
    const watLfoGain = ctx.createGain();
    watLfo.type = 'sine';
    watLfo.frequency.value = 0.3; // gentle burble
    watLfoGain.gain.value = 0.15;
    watLfo.connect(watLfoGain).connect(waterGain.gain);
    watNoise.start();
    watLfo.start();
  }

  // A long-lived looping white-noise source (reuses the cached buffer).
  function loopNoise() {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    src.playbackRate.value = vary(0.05);
    return src;
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

  // A short whistled birdsong chirp: 1-3 quick sine/triangle notes with vibrato,
  // routed through birdGain. Pitch/timing randomized so it never repeats exactly.
  function birdChirp(t0) {
    const notes = 1 + Math.floor(Math.random() * 3);
    let base = 1800 + Math.random() * 1600; // whistled register
    let t = t0;
    for (let i = 0; i < notes; i++) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = Math.random() < 0.6 ? 'sine' : 'triangle';
      const f = base * (1 + (Math.random() * 2 - 1) * 0.15);
      osc.frequency.setValueAtTime(f, t);
      // tiny upward/downward sweep per note
      osc.frequency.exponentialRampToValueAtTime(f * (0.9 + Math.random() * 0.3), t + 0.08);
      // vibrato LFO
      const vib = ctx.createOscillator();
      const vibGain = ctx.createGain();
      vib.type = 'sine';
      vib.frequency.value = 18 + Math.random() * 14;
      vibGain.gain.value = f * 0.02;
      vib.connect(vibGain).connect(osc.frequency);
      const peak = 0.12 + Math.random() * 0.1;
      const dur = 0.06 + Math.random() * 0.07;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g).connect(birdGain);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      vib.start(t);
      vib.stop(t + dur + 0.02);
      base *= 1 + (Math.random() * 2 - 1) * 0.12;
      t += dur + 0.03 + Math.random() * 0.05;
    }
  }

  // Schedule the next bird chirp and advance nextBirdTime. Gaps are longer at
  // night (sparser birds) and when indoors; randomized so timing never loops.
  function scheduleBird() {
    if (scene.outdoor) birdChirp(nextBirdTime);
    // base gap: 3-9s by day, much sparser (8-22s) at night, and rare indoors.
    let gap;
    if (!scene.outdoor) gap = 12 + Math.random() * 18;
    else if (scene.night) gap = 8 + Math.random() * 14;
    else gap = 3 + Math.random() * 6;
    nextBirdTime += gap;
  }

  // Lookahead scheduler for bird one-shots: keep ~4s queued on the audio clock.
  function birdScheduler() {
    if (!ambPlaying || !ctx) return;
    while (nextBirdTime < ctx.currentTime + 4.0) scheduleBird();
    ambBirdTimer = setTimeout(birdScheduler, 1000);
  }

  // Recompute per-layer target gains from the current scene and ramp toward them.
  // Indoors -> everything muffled/quiet; outdoors -> full; nearWater -> river in;
  // night -> fewer birds (handled in scheduler) + a touch more insects.
  function applyAmbienceScene() {
    const indoorMul = scene.outdoor ? 1 : 0.18; // muffle beds when inside
    // Inside the bakery: a touch warmer/cosier than a bare indoor space.
    ambTargets.master = scene.outdoor ? 1 : (scene.inBakery ? 0.6 : 0.5);
    ambTargets.insect = (scene.night ? 0.09 : 0.05) * indoorMul;
    ambTargets.wind = 0.06 * indoorMul;
    ambTargets.water = (scene.nearWater ? 0.08 : 0.0) * indoorMul;
    ambTargets.bird = scene.outdoor ? 1 : (scene.inBakery ? 0.12 : 0.25);
    rampAmbience();
  }

  // Smoothly ramp every ambience layer to its target (no clicks). Safe to call
  // before the chain exists (no-op) or before ambience is playing.
  function rampAmbience() {
    if (!ctx || !ambGain) return;
    const t = ctx.currentTime;
    const set = (node, target) => {
      if (!node) return;
      const v = Math.max(node.gain.value, 0.0001);
      node.gain.cancelScheduledValues(t);
      node.gain.setValueAtTime(v, t);
      node.gain.linearRampToValueAtTime(Math.max(target, 0.0001), t + 1.5);
    };
    // The top ambGain only opens while playing; beds/birds track scene always.
    if (ambPlaying) set(ambGain, ambTargets.master);
    set(insectGain, ambTargets.insect);
    set(windGain, ambTargets.wind);
    set(waterGain, ambTargets.water);
    set(birdGain, ambTargets.bird);
  }

  const sfx = {
    enabled,

    resume() {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      // iOS / mobile Safari unlock: ctx.resume() alone does NOT start audio there —
      // you must also PLAY a sound inside the user-gesture. Play a 1-sample silent
      // buffer once (the canonical unlock) so all later synthesized sounds work.
      if (!unlocked) {
        try {
          const buf = ctx.createBuffer(1, 1, 22050);
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.connect(ctx.destination);
          src.start(0);
          unlocked = true;
        } catch (e) { /* createBuffer/start unsupported — ignore */ }
      }
      if (musicEnabled) sfx.startMusic();
      if (ambEnabled) sfx.startAmbience();
    },

    // Begin the generative ambient bed. No-op if context not ready or running.
    startAmbience() {
      if (!ctx || ambPlaying || !ambGain) return;
      ambPlaying = true;
      const t = ctx.currentTime;
      applyAmbienceScene(); // set bed/bird targets + ramp beds in
      ambGain.gain.cancelScheduledValues(t);
      ambGain.gain.setValueAtTime(Math.max(ambGain.gain.value, 0.0001), t);
      ambGain.gain.linearRampToValueAtTime(Math.max(ambTargets.master, 0.0001), t + 3);
      nextBirdTime = t + 1.0;
      birdScheduler();
    },

    // Stop scheduling bird voices and fade the whole ambient bed out.
    stopAmbience() {
      if (!ambPlaying) return;
      ambPlaying = false;
      if (ambBirdTimer) { clearTimeout(ambBirdTimer); ambBirdTimer = null; }
      if (ambGain && ctx) {
        const t = ctx.currentTime;
        ambGain.gain.cancelScheduledValues(t);
        ambGain.gain.setValueAtTime(Math.max(ambGain.gain.value, 0.0001), t);
        ambGain.gain.exponentialRampToValueAtTime(0.0001, t + 2);
      }
    },

    // Toggle ambience. On + resumed context -> (re)start; off -> stop.
    setAmbienceEnabled(on) {
      ambEnabled = !!on;
      if (ambEnabled) {
        if (ctx && ctx.state !== 'suspended') sfx.startAmbience();
      } else {
        sfx.stopAmbience();
      }
    },

    // Adjust the ambient mix for the current location/time, ramping smoothly.
    setAmbienceScene(opts = {}) {
      if ('outdoor' in opts) scene.outdoor = !!opts.outdoor;
      if ('nearWater' in opts) scene.nearWater = !!opts.nearWater;
      if ('night' in opts) scene.night = !!opts.night;
      if ('inBakery' in opts) scene.inBakery = !!opts.inBakery;
      applyAmbienceScene();
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

    // craft = a warm two-note " できた！" chime (used for baking / crafting).
    craft() {
      if (!enabled || !ensure()) return;
      const t0 = ctx.currentTime;
      blip('triangle', 523 * vary(0.02), 0.22, 0.004, 0.16, t0);        // C5
      blip('sine', 784 * vary(0.02), 0.18, 0.004, 0.22, t0 + 0.09);     // G5
    },

    // chime = shop door bell "カランコロン": two bright sine notes + warm body.
    chime() {
      if (!enabled || !ensure()) return;
      const t0 = ctx.currentTime;
      blip('sine', 1318 * vary(0.01), 0.20, 0.003, 0.28, t0);          // E6
      blip('sine', 1976 * vary(0.01), 0.16, 0.003, 0.36, t0 + 0.11);   // B6 shimmer
      blip('triangle', 659 * vary(0.01), 0.10, 0.004, 0.40, t0);       // warm body
    },

    // pop = a soft bubble "ぷくっ" (fermentation matured): quick upward sine.
    pop() {
      if (!enabled || !ensure()) return;
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      const f0 = 320 * vary(0.06);
      osc.frequency.setValueAtTime(f0, t0);
      osc.frequency.exponentialRampToValueAtTime(f0 * 2.4, t0 + 0.07); // bloop up
      osc.connect(g).connect(master);
      env(g, osc, t0, 0.2, 0.003, 0.08);
      noiseBurst('bandpass', 1600 * vary(0.1), 2, 0.12, 0.002, 0.04, t0);
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
