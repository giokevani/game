// Occasional rain showers followed by a rainbow.
import * as THREE from 'three';
import { toast } from '../ui/ui.js';

export class Weather {
  async init(game) {
    this.game = game;
    this.state = 'clear';
    this.timer = 360 + Math.random() * 300;
    this.rain = 0;
    const n = 700;
    this.n = n;
    const pos = new Float32Array(n * 6);
    this.drops = [];
    for (let i = 0; i < n; i++) this.drops.push({ x: Math.random() * 50 - 25, y: Math.random() * 22, z: Math.random() * 50 - 25, v: 14 + Math.random() * 6 });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.rainMat = new THREE.LineBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0 });
    this.lines = new THREE.LineSegments(g, this.rainMat);
    this.lines.frustumCulled = false;
    this.lines.visible = false;
    game.scene.add(this.lines);
    // rainbow
    this.rainbow = new THREE.Group();
    const cols = ['#ff7a7a', '#ffb86b', '#fff07a', '#8fe39a', '#8fc8ff', '#b99cff'];
    this.rbMats = cols.map((c, i) => {
      const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, fog: false });
      const t = new THREE.Mesh(new THREE.TorusGeometry(120 - i * 5, 2.6, 6, 64, Math.PI), m);
      this.rainbow.add(t);
      return m;
    });
    this.rainbow.visible = false;
    this.rainbow.renderOrder = -5;
    game.scene.add(this.rainbow);
    this.rbAlpha = 0;
    this.sound = null;
  }

  startRain() {
    this.state = 'rain';
    this.timer = 55 + Math.random() * 45;
    this.lines.visible = true;
    toast('It\'s starting to rain! ☔', { icon: '🌧️' });
    const a = this.game.audio;
    if (a?.ctx && a.sfxOn) {
      const s = a.ctx.createBufferSource();
      s.buffer = a.noise; s.loop = true;
      const f = a.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
      const g = a.ctx.createGain(); g.gain.value = 0;
      s.connect(f); f.connect(g); g.connect(a.sfxBus);
      s.start();
      g.gain.setTargetAtTime(0.18, a.ctx.currentTime, 2);
      this.sound = { s, g };
    }
  }

  stopRain() {
    this.state = 'rainbow';
    this.timer = 70;
    this.rainbow.visible = true;
    const g = this.game;
    const p = g.player.pos;
    // opposite the sun, far away
    const sd = g.sky.uniforms.sunDir.value;
    const dir = new THREE.Vector3(-sd.x, 0, -sd.z).normalize();
    if (!isFinite(dir.x)) dir.set(0, 0, -1);
    this.rbDir = dir;
    if (this.sound) {
      const a = g.audio;
      this.sound.g.gain.setTargetAtTime(0, a.ctx.currentTime, 1.5);
      const s = this.sound.s;
      setTimeout(() => s.stop(), 5000);
      this.sound = null;
    }
    if (g.sky.state.night < 0.5) {
      g.state.stats.rainbows = (g.state.stats.rainbows || 0) + 1;
      toast('Look! A rainbow! 🌈', { icon: '🌈', kind: 'pink' });
      g.emit('rainbow');
    }
  }

  update(dt, game) {
    this.timer -= dt;
    if (this.state === 'clear' && this.timer <= 0 && game.mode === 'play') this.startRain();
    else if (this.state === 'rain' && this.timer <= 0) this.stopRain();
    else if (this.state === 'rainbow' && this.timer <= 0) { this.state = 'clear'; this.timer = 420 + Math.random() * 360; }
    const target = this.state === 'rain' ? 1 : 0;
    this.rain += (target - this.rain) * Math.min(1, dt * 0.4);
    game.sky.rain = this.rain;
    const p = game.camera.position;
    const high = game.player.pos.y > 40;
    this.lines.visible = this.rain > 0.02 && !high;
    if (this.lines.visible) {
      this.rainMat.opacity = this.rain * 0.55;
      const arr = this.lines.geometry.attributes.position.array;
      for (let i = 0; i < this.n; i++) {
        const d = this.drops[i];
        d.y -= d.v * dt;
        if (d.y < -2) { d.y = 20; d.x = Math.random() * 50 - 25; d.z = Math.random() * 50 - 25; }
        const x = p.x + d.x, y = p.y - 6 + d.y, z = p.z + d.z;
        arr[i * 6] = x; arr[i * 6 + 1] = y; arr[i * 6 + 2] = z;
        arr[i * 6 + 3] = x + 0.05; arr[i * 6 + 4] = y + 0.7; arr[i * 6 + 5] = z;
      }
      this.lines.geometry.attributes.position.needsUpdate = true;
    }
    const rbT = this.state === 'rainbow' ? Math.min(1, (70 - this.timer) / 5, this.timer / 8) : 0;
    this.rbAlpha += (rbT - this.rbAlpha) * Math.min(1, dt * 2);
    this.rainbow.visible = this.rbAlpha > 0.01;
    if (this.rainbow.visible) {
      for (const m of this.rbMats) m.opacity = this.rbAlpha * 0.55 * (1 - game.sky.state.night);
      const d = this.rbDir;
      this.rainbow.position.set(game.player.pos.x + d.x * 260, -10, game.player.pos.z + d.z * 260);
      this.rainbow.lookAt(game.player.pos.x, -10, game.player.pos.z);
    }
  }
}
