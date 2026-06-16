// Web Audio API による効果音合成。音源ファイル不要。
// iOS Safari 対策：初回のユーザー操作で AudioContext を起動する。
// AudioContext の初期化失敗だけは握り潰さずコンソールに出す。

export class Sfx {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;

  ensure() {
    if (this.ctx) return;
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.35;
      this.masterGain.connect(this.ctx.destination);
    } catch (err) {
      console.error('[sfx] AudioContext init failed:', err);
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.masterGain) this.masterGain.gain.value = m ? 0 : 0.35;
  }
  isMuted() { return this.muted; }

  private tone(freq: number, durMs: number, type: OscillatorType = 'square', attack = 0.005, release = 0.02, volume = 1) {
    const ctx = this.ctx;
    const master = this.masterGain;
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.linearRampToValueAtTime(0, now + attack + durMs / 1000 + release);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + attack + durMs / 1000 + release + 0.01);
  }

  private sweep(f0: number, f1: number, durMs: number, type: OscillatorType = 'triangle', volume = 1) {
    const ctx = this.ctx;
    const master = this.masterGain;
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), now + durMs / 1000);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.005);
    gain.gain.linearRampToValueAtTime(0, now + durMs / 1000);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + durMs / 1000 + 0.02);
  }

  move() { this.tone(150, 10, 'square', 0.001, 0.01, 0.3); }
  rotate() { this.tone(260, 15, 'triangle', 0.001, 0.02, 0.4); }
  softDrop() { this.tone(180, 8, 'square', 0.001, 0.01, 0.2); }
  lock() { this.sweep(140, 80, 40, 'sawtooth', 0.5); }
  hold() { this.sweep(400, 520, 80, 'sine', 0.4); }

  // ライン消去：本数で 4 音まで上がる和音
  lineClear(lines: number) {
    const base = 440;
    const n = Math.max(1, Math.min(4, lines));
    const scale = [1, 1.25, 1.5, 2]; // Tetris で 2オクターブ
    for (let i = 0; i < n; i++) {
      setTimeout(() => this.tone(base * scale[i], 80, 'triangle', 0.005, 0.08, 0.5), i * 40);
    }
  }

  tspin() {
    this.sweep(600, 1400, 120, 'sine', 0.5);
    setTimeout(() => this.sweep(1000, 2000, 100, 'triangle', 0.3), 60);
  }

  b2b() {
    this.sweep(800, 1600, 150, 'sine', 0.4);
  }

  gameOver() {
    this.sweep(400, 80, 600, 'sawtooth', 0.5);
  }
}
