// audio.js — tiny Web Audio SFX engine for the voxel game.
// Pure Web Audio API: no assets, no libs, no imports. Works offline.
// Each sound is synthesized from oscillators / noise -> gain envelope -> master.

export function createAudio() {
  let ctx = null;          // lazily created AudioContext (only after a gesture)
  let master = null;       // master GainNode; gain=0 when muted
  let noiseBuf = null;     // cached white-noise buffer for crunch/step
  let enabled = true;

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
    } catch (e) {
      ctx = null;
      return false;
    }
    return true;
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

  const sfx = {
    enabled,

    resume() {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
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
