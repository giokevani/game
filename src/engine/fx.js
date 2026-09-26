// One-draw-call particle system with an emoji/shape atlas.
import * as THREE from 'three';

const TILES = ['dot', '❤️', 'bubble', '⭐', '💤', '🪙', 'confetti', 'puff', '✨', '🎵', '💧', '🌸'];
const COLS = 4, ROWS = 3, CELL = 64;

function atlas() {
  const c = document.createElement('canvas');
  c.width = COLS * CELL; c.height = ROWS * CELL;
  const x = c.getContext('2d');
  x.textAlign = 'center'; x.textBaseline = 'middle';
  TILES.forEach((t, i) => {
    const cx = (i % COLS) * CELL + CELL / 2, cy = Math.floor(i / COLS) * CELL + CELL / 2;
    if (t === 'dot') { const g = x.createRadialGradient(cx, cy, 0, cx, cy, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(cx - 32, cy - 32, 64, 64); }
    else if (t === 'bubble') { x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = 4; x.fillStyle = 'rgba(200,240,255,0.35)'; x.beginPath(); x.arc(cx, cy, 24, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.arc(cx - 8, cy - 9, 6, 0, 7); x.fill(); }
    else if (t === 'confetti') { x.fillStyle = '#ffffff'; x.fillRect(cx - 10, cy - 18, 20, 36); }
    else if (t === 'puff') { const g = x.createRadialGradient(cx, cy, 0, cx, cy, 30); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 30, 0, 7); x.fill(); }
    else { x.font = '46px "Apple Color Emoji","Noto Color Emoji",sans-serif'; x.fillText(t, cx, cy + 3); }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const KINDS = {
  sparkle: { tile: 'dot', n: 26, colors: ['#fff3a8', '#ffffff', '#ffd1ec', '#c6f0ff'], speed: 3, up: 2, life: 0.9, size: 0.35, grav: -1, add: true },
  stars: { tile: '⭐', n: 10, speed: 2.5, up: 3, life: 1.1, size: 0.45, grav: 3 },
  hearts: { tile: '❤️', n: 7, speed: 0.8, up: 1.6, life: 1.4, size: 0.5, grav: -0.4 },
  bubbles: { tile: 'bubble', n: 16, speed: 1.2, up: 1.5, life: 1.4, size: 0.4, grav: -0.6 },
  zzz: { tile: '💤', n: 1, speed: 0.2, up: 0.7, life: 1.8, size: 0.5, grav: 0 },
  coins: { tile: '🪙', n: 8, speed: 2, up: 5, life: 1.0, size: 0.5, grav: 9 },
  confetti: { tile: 'confetti', n: 40, colors: ['#ff8fc0', '#ffd45e', '#7fc6ff', '#8fe39a', '#c6a6ff', '#ff9a7a'], speed: 4, up: 5, life: 1.8, size: 0.28, grav: 6 },
  puff: { tile: 'puff', n: 10, speed: 1.5, up: 0.8, life: 0.8, size: 0.9, grav: -0.5 },
  glitter: { tile: '✨', n: 1, speed: 0.5, up: 0.5, life: 0.9, size: 0.35, grav: 0 },
  notes: { tile: '🎵', n: 1, speed: 0.6, up: 1.2, life: 1.3, size: 0.4, grav: 0 },
  splash: { tile: '💧', n: 10, speed: 2.2, up: 3, life: 0.8, size: 0.3, grav: 8 },
  petals: { tile: '🌸', n: 12, speed: 2, up: 2.5, life: 1.6, size: 0.35, grav: 1 },
};

export class FX {
  constructor(scene, max = 400) {
    this.max = max;
    this.p = [];
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 4);
    this.size = new Float32Array(max);
    this.tile = new Float32Array(max);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('pcol', new THREE.BufferAttribute(this.col, 4));
    g.setAttribute('psize', new THREE.BufferAttribute(this.size, 1));
    g.setAttribute('ptile', new THREE.BufferAttribute(this.tile, 1));
    g.setDrawRange(0, 0);
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: atlas() }, uScale: { value: 600 } },
      transparent: true, depthWrite: false,
      vertexShader: `attribute vec4 pcol; attribute float psize; attribute float ptile; uniform float uScale;
        varying vec4 vCol; varying float vTile;
        void main(){ vCol = pcol; vTile = ptile; vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = psize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; varying vec4 vCol; varying float vTile;
        void main(){ vec2 uv = gl_PointCoord; uv.y = 1.0 - uv.y;
          float cx = mod(vTile, ${COLS}.0), cy = floor(vTile / ${COLS}.0);
          vec2 a = vec2((cx + uv.x) / ${COLS}.0, 1.0 - (cy + 1.0 - uv.y) / ${ROWS}.0);
          vec4 t = texture2D(map, a); gl_FragColor = vec4(t.rgb * vCol.rgb, t.a * vCol.a); if (gl_FragColor.a < 0.02) discard; }`,
    });
    this.points = new THREE.Points(g, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 20;
    this.mat = mat;
    scene.add(this.points);
    this.c = new THREE.Color();
  }

  burst(at, kind = 'sparkle', o = {}) {
    const k = KINDS[kind] || KINDS.sparkle;
    const n = o.n ?? k.n;
    const tile = TILES.indexOf(k.tile);
    for (let i = 0; i < n; i++) {
      if (this.p.length >= this.max) this.p.shift();
      const a = Math.random() * Math.PI * 2;
      const sp = k.speed * (0.4 + Math.random() * 0.6);
      this.c.set(k.colors ? k.colors[i % k.colors.length] : '#ffffff');
      this.p.push({
        x: at.x + (o.spread ?? 0.2) * (Math.random() - 0.5), y: at.y + (o.dy ?? 0.5), z: at.z + (o.spread ?? 0.2) * (Math.random() - 0.5),
        vx: Math.cos(a) * sp, vy: k.up * (0.6 + Math.random() * 0.6), vz: Math.sin(a) * sp,
        life: k.life * (0.7 + Math.random() * 0.5), age: 0, size: k.size * (o.scale || 1) * (0.7 + Math.random() * 0.6),
        grav: k.grav, tile, r: this.c.r, g: this.c.g, b: this.c.b,
      });
    }
  }

  update(dt) {
    this.mat.uniforms.uScale.value = window.innerHeight * 1.2;
    const P = this.p;
    let w = 0;
    for (let i = 0; i < P.length; i++) {
      const q = P[i];
      q.age += dt;
      if (q.age >= q.life) continue;
      q.vy -= q.grav * dt;
      q.vx *= 1 - dt * 1.5; q.vz *= 1 - dt * 1.5;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      P[w++] = q;
    }
    P.length = w;
    for (let i = 0; i < w; i++) {
      const q = P[i];
      const t = q.age / q.life;
      this.pos[i * 3] = q.x; this.pos[i * 3 + 1] = q.y; this.pos[i * 3 + 2] = q.z;
      this.col[i * 4] = q.r; this.col[i * 4 + 1] = q.g; this.col[i * 4 + 2] = q.b;
      this.col[i * 4 + 3] = t < 0.15 ? t / 0.15 : 1 - Math.max(0, (t - 0.6) / 0.4);
      this.size[i] = q.size * (t < 0.15 ? 0.5 + t * 3.3 : 1);
      this.tile[i] = q.tile;
    }
    const g = this.points.geometry;
    g.setDrawRange(0, w);
    for (const n of ['position', 'pcol', 'psize', 'ptile']) g.attributes[n].needsUpdate = true;
  }
}

// floating emoji bubble (e.g. pet needs) as a sprite
const bubbleTex = new Map();
export function emojiSprite(emoji, bg = true) {
  let t = bubbleTex.get(emoji + bg);
  if (!t) {
    const c = document.createElement('canvas');
    c.width = c.height = 96;
    const x = c.getContext('2d');
    if (bg) {
      x.fillStyle = 'rgba(255,255,255,0.95)';
      x.beginPath(); x.arc(48, 44, 38, 0, 7); x.fill();
      x.beginPath(); x.moveTo(38, 76); x.lineTo(48, 94); x.lineTo(58, 76); x.fill();
      x.strokeStyle = '#ff8fc0'; x.lineWidth = 5; x.beginPath(); x.arc(48, 44, 38, 0, 7); x.stroke();
    }
    x.font = '44px "Apple Color Emoji","Noto Color Emoji",sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(emoji, 48, 47);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    bubbleTex.set(emoji + bg, t);
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false }));
  s.scale.set(0.7, 0.7, 1);
  s.renderOrder = 15;
  return s;
}

export function setSpriteEmoji(sprite, emoji, bg = true) {
  const tmp = emojiSprite(emoji, bg);
  sprite.material.map = tmp.material.map;
  sprite.material.needsUpdate = true;
}
