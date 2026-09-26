// All sounds are synthesised with Web Audio (no files): cute effects plus a
// gentle generative music loop that changes at night.
export class Audio {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.musicOn = settings.music;
    this.sfxOn = settings.sfx;
    this.nextNote = 0;
    this.step = 0;
    this.night = 0;
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state !== 'running') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = 0.8; this.master.connect(c.destination);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.sfxOn ? 0.55 : 0; this.sfxBus.connect(this.master);
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.musicOn ? 0.22 : 0; this.musicBus.connect(this.master);
    // soft reverb-ish echo for music
    this.delay = c.createDelay(); this.delay.delayTime.value = 0.33;
    const fb = c.createGain(); fb.gain.value = 0.28;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    this.delay.connect(lp); lp.connect(fb); fb.connect(this.delay); lp.connect(this.musicBus);
    this.nextNote = c.currentTime + 0.3;
    setInterval(() => this.schedule(), 60);
    // noise buffer for rain / fireworks
    const len = c.sampleRate * 2;
    this.noise = c.createBuffer(1, len, c.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  setMusic(on) { this.musicOn = on; if (this.musicBus) this.musicBus.gain.setTargetAtTime(on ? 0.22 : 0, this.ctx.currentTime, 0.3); }
  setSfx(on) { this.sfxOn = on; if (this.sfxBus) this.sfxBus.gain.value = on ? 0.55 : 0; }
  toggleMusic() { this.setMusic(!this.musicOn); this.settings.music = this.musicOn; }

  tone(freq, t, dur, o = {}) {
    const c = this.ctx;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * o.slide), t + dur);
    const v = o.vol ?? 0.3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + (o.attack ?? 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(o.bus || this.sfxBus);
    if (o.echo) g.connect(this.delay);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  noiseHit(t, dur, freq, vol = 0.2, bus) {
    const c = this.ctx;
    const s = c.createBufferSource();
    s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus || this.sfxBus);
    s.start(t, Math.random()); s.stop(t + dur);
  }

  play(name) {
    if (!this.ctx || !this.sfxOn) return;
    const t = this.ctx.currentTime + 0.01;
    const T = (f, dt, dur, o) => this.tone(f, t + dt, dur, o);
    switch (name) {
      case 'click': T(880, 0, 0.06, { type: 'triangle', vol: 0.12 }); break;
      case 'coin': T(988, 0, 0.1, { type: 'square', vol: 0.08 }); T(1319, 0.07, 0.22, { type: 'square', vol: 0.08 }); break;
      case 'pop': T(600, 0, 0.12, { type: 'sine', slide: 2.2, vol: 0.25 }); break;
      case 'place': T(330, 0, 0.12, { type: 'triangle', vol: 0.25 }); T(495, 0.05, 0.14, { type: 'triangle', vol: 0.18 }); break;
      case 'pick': T(520, 0, 0.1, { type: 'triangle', slide: 1.5, vol: 0.2 }); break;
      case 'no': T(300, 0, 0.14, { type: 'square', vol: 0.08 }); T(220, 0.12, 0.2, { type: 'square', vol: 0.08 }); break;
      case 'open': T(660, 0, 0.1, { type: 'sine', vol: 0.2 }); T(880, 0.06, 0.14, { type: 'sine', vol: 0.18 }); break;
      case 'sparkle': [1568, 2093, 2637, 3136].forEach((f, i) => T(f, i * 0.05, 0.25, { type: 'sine', vol: 0.12, echo: true })); break;
      case 'need': T(784, 0, 0.12, { type: 'sine', vol: 0.18 }); T(1047, 0.1, 0.2, { type: 'sine', vol: 0.16 }); break;
      case 'talk': [0, 0.07, 0.14].forEach((d, i) => T(400 + Math.random() * 300, d, 0.07, { type: 'triangle', vol: 0.12 })); break;
      case 'quest': [523, 659, 784].forEach((f, i) => T(f, i * 0.09, 0.3, { type: 'triangle', vol: 0.18, echo: true })); break;
      case 'levelup': [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, i * 0.08, 0.4, { type: 'triangle', vol: 0.2, echo: true })); break;
      case 'fanfare': [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [784, 0.52], [1047, 0.64]].forEach(([f, d]) => T(f, d, 0.35, { type: 'square', vol: 0.07, echo: true })); break;
      case 'hatch': for (let i = 0; i < 8; i++) T(200 + i * 60, i * 0.18, 0.1, { type: 'triangle', vol: 0.15 }); break;
      case 'water': this.noiseHit(t, 0.6, 1800, 0.25); break;
      case 'boing': T(180, 0, 0.35, { type: 'sine', slide: 3, vol: 0.3 }); break;
      case 'jump': T(300, 0, 0.14, { type: 'sine', slide: 1.8, vol: 0.12 }); break;
      case 'firework': this.noiseHit(t + 0.02, 0.9, 900, 0.35); T(1200, 0, 0.5, { type: 'sine', slide: 0.3, vol: 0.05 }); break;
      case 'vroom': T(90, 0, 0.5, { type: 'sawtooth', slide: 1.8, vol: 0.06 }); break;
      default: break;
    }
  }

  playTune(kind) {
    if (!this.ctx || !this.sfxOn) return;
    const t = this.ctx.currentTime + 0.05;
    const mel = [0, 4, 7, 12, 11, 7, 9, 7, 4, 5, 4, 2, 0];
    mel.forEach((n, i) => this.tone(261.63 * Math.pow(2, n / 12), t + i * 0.22, 0.6, { type: 'triangle', vol: 0.22, echo: true }));
  }

  // --- generative music: I-vi-IV-V with arpeggios, softer and slower at night
  schedule() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const c = this.ctx;
    const night = this.night > 0.5;
    const bpm = night ? 72 : 96;
    const eighth = 60 / bpm / 2;
    const chords = night ? [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]] : [[48, 52, 55], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
    while (this.nextNote < c.currentTime + 0.25) {
      const t = this.nextNote;
      const bar = Math.floor(this.step / 8) % 4;
      const beat = this.step % 8;
      const ch = chords[bar];
      if (this.musicOn) {
        const m = (n) => 440 * Math.pow(2, (n - 69) / 12);
        if (beat === 0) {
          this.tone(m(ch[0] - 12), t, eighth * 7, { type: 'triangle', vol: 0.16, bus: this.musicBus, attack: 0.05 });
          for (const n of ch) this.tone(m(n + 12), t, eighth * 7.5, { type: 'sine', vol: 0.035, bus: this.musicBus, attack: 0.25 });
        }
        const pat = [0, 1, 2, 1, 0, 2, 1, 2];
        const note = ch[pat[beat]] + 12 + (beat === 7 && bar === 3 ? 2 : 0);
        if (!(night && beat % 2)) this.tone(m(note), t, eighth * 1.8, { type: 'sine', vol: 0.09, bus: this.musicBus, echo: true });
        if (beat === 4 && Math.random() < 0.4) this.tone(m(ch[2] + 24), t, 0.8, { type: 'sine', vol: 0.03, bus: this.musicBus, echo: true });
      }
      this.nextNote += eighth;
      this.step++;
    }
  }
}
