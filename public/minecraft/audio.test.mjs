// Node test for audio.js. Stubs window + a fake AudioContext so the pure
// Web Audio engine can be exercised without a browser. Run: node audio.test.mjs
import assert from 'node:assert';

// --- Fake Web Audio graph nodes ---
function makeParam() {
  return {
    value: 0,
    setValueAtTime() { return this; },
    exponentialRampToValueAtTime() { return this; },
    linearRampToValueAtTime() { return this; },
    cancelScheduledValues() { return this; },
  };
}
function makeNode(extra = {}) {
  return Object.assign({
    connect(dest) { return dest; },
    disconnect() {},
    start() {},
    stop() {},
    gain: makeParam(),
    frequency: makeParam(),
    delayTime: makeParam(),
    playbackRate: makeParam(),
    Q: { value: 0 },
    type: 'sine',
  }, extra);
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.state = 'suspended';
    this.destination = makeNode();
  }
  createGain() { return makeNode(); }
  createOscillator() { return makeNode(); }
  createBufferSource() { return makeNode(); }
  createBiquadFilter() { return makeNode(); }
  createDelay() { return makeNode(); }
  createBuffer(ch, len) {
    return { getChannelData: () => new Float32Array(len) };
  }
  resume() { this.state = 'running'; return Promise.resolve(); }
}

global.window = { AudioContext: FakeAudioContext };

const { createAudio } = await import('./audio.js');

// 1. Builds.
const a = createAudio();
assert.ok(a, 'createAudio() returns an object');
assert.strictEqual(typeof a.startMusic, 'function', 'startMusic exists');
assert.strictEqual(typeof a.stopMusic, 'function', 'stopMusic exists');
assert.strictEqual(typeof a.setMusicEnabled, 'function', 'setMusicEnabled exists');

// 2. resume() doesn't throw (and auto-starts music since enabled by default).
assert.doesNotThrow(() => a.resume(), 'resume()');

// 3. SFX + music controls don't throw.
assert.doesNotThrow(() => { a.break(1); a.place(2); }, 'break/place');
assert.doesNotThrow(() => { a.step(); a.select(); }, 'step/select');
assert.doesNotThrow(() => { a.hurt(); a.eat(); }, 'hurt/eat');
assert.doesNotThrow(() => { a.stopMusic(); a.startMusic(); }, 'stop/start music');
assert.doesNotThrow(() => { a.setMusicEnabled(false); a.setMusicEnabled(true); }, 'setMusicEnabled');
assert.doesNotThrow(() => { a.setEnabled(false); a.setEnabled(true); }, 'setEnabled mute');

// cleanup pending scheduler timer so node exits.
a.stopMusic();

console.log('all audio tests passed');
