// Procedural building and prop generators. Each returns builders keyed by
// material: std (matte), glow (lights up at night), gloss (shiny).
import * as THREE from 'three';
import { Builder, Geo, shade } from '../engine/builder.js';

export function parts() {
  return { std: new Builder(), glow: new Builder(), gloss: new Builder(), glowAlways: new Builder() };
}

const WIN = '#fff0c2';
const WHITE = '#ffffff';
const WOOD = '#b8825a';
const DARKWOOD = '#8a5a3c';

// gable roof: ridge along x, slopes towards +z/-z
function gableRoof(b, w, d, h, color, y, overhang = 0.7) {
  const half = d / 2 + overhang;
  const key = `gr${w}|${d}|${h}|${overhang}`;
  const geo = Geo.shape(key, [[-half, 0], [half, 0], [0, h]], w + overhang * 2, 0.06);
  // shape is in x/y, extruded along z; rotate so the profile lies in z/y
  b.add(geo, color, 0, y, 0, 0, Math.PI / 2, 0);
  // ridge cap
  b.add(Geo.box(w + overhang * 2 + 0.2, 0.28, 0.4, 0.1), shade(color, 0.8), 0, y + h + 0.02, 0);
}

function windowAt(p, x, y, z, w, h, o = {}) {
  const depth = 0.12;
  p.glow.add(Geo.box(w, h, depth, 0.02), o.color || WIN, x, y, z, 0, o.ry || 0, 0);
  const fr = o.frame || WHITE;
  const ry = o.ry || 0;
  const dx = Math.cos(ry), dz = -Math.sin(ry);
  const nx = Math.sin(ry) * 0.05, nz = Math.cos(ry) * 0.05;
  p.std.add(Geo.box(w + 0.24, 0.16, 0.2, 0.04), fr, x + nx, y + h / 2 + 0.06, z + nz, 0, ry, 0);
  p.std.add(Geo.box(w + 0.34, 0.16, 0.3, 0.04), fr, x + nx * 2, y - h / 2 - 0.06, z + nz * 2, 0, ry, 0);
  p.std.add(Geo.box(0.1, h, 0.16, 0.02), fr, x + nx, y, z + nz, 0, ry, 0);
  p.std.add(Geo.box(w, 0.1, 0.16, 0.02), fr, x + nx, y, z + nz, 0, ry, 0);
  if (o.shutters) {
    for (const s of [-1, 1]) {
      p.std.add(Geo.box(w * 0.42, h + 0.1, 0.1, 0.03), o.shutters, x + dx * s * (w / 2 + w * 0.25), y, z + dz * s * (w / 2 + w * 0.25) + nz * 0.5, 0, ry, 0);
    }
  }
  if (o.box) {
    const bx = x + nx * 5, bz = z + nz * 5;
    p.std.add(Geo.box(w + 0.1, 0.35, 0.4, 0.05), o.box, bx, y - h / 2 - 0.35, bz, 0, ry, 0);
    const cols = ['#ff7eb6', '#ffd24d', '#ffffff', '#b58cff', '#ff9a7a'];
    for (let i = 0; i < 5; i++) {
      const t = (i - 2) / 2;
      p.std.add(Geo.sphere(0.14, 8, 6), cols[(i + Math.round(x)) % 5], bx + dx * t * w * 0.42, y - h / 2 - 0.1, bz + dz * t * w * 0.42);
    }
  }
}

function door(p, x, z, w = 1.4, h = 2.4, color = DARKWOOD, ry = 0) {
  p.std.add(Geo.box(w + 0.35, h + 0.2, 0.2, 0.05), WHITE, x, h / 2 + 0.3, z, 0, ry, 0);
  p.std.add(Geo.box(w, h, 0.2, 0.05), color, x, h / 2 + 0.3, z + Math.cos(ry) * 0.05, 0, ry, 0);
  p.glow.add(Geo.box(w * 0.5, h * 0.35, 0.22, 0.03), WIN, x, h * 0.7 + 0.3, z + Math.cos(ry) * 0.06, 0, ry, 0);
  p.gloss.add(Geo.sphere(0.07, 8, 6), '#ffd36b', x + w * 0.32, h * 0.48 + 0.3, z + Math.cos(ry) * 0.18);
}

export function shop(o) {
  const p = parts();
  const { w, d } = o;
  const wall = o.wall, roof = o.roof;
  const H = 5.4;
  p.std.box(w + 0.5, 0.35, d + 0.5, shade(wall, 0.72), 0, 0, 0, { r: 0.08 });
  p.std.box(w, H, d, wall, 0, 0.3, 0, { r: 0.1 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.std.box(0.55, H, 0.55, WHITE, sx * w / 2, 0.3, sz * d / 2, { r: 0.08 });
  p.std.box(w + 0.7, 0.5, d + 0.7, WHITE, 0, H + 0.2, 0, { r: 0.12 });
  gableRoof(p.std, w, d, 3.2, roof, H + 0.6);
  // front
  const fz = d / 2 + 0.02;
  door(p, 0, fz, 1.8, 2.7, shade(roof, 0.75));
  const ww = Math.min(3.4, (w - 3) / 2 - 0.6);
  windowAt(p, -w / 4 - 0.4, 2.1, fz, ww, 2.0, { box: shade(roof, 0.8) });
  windowAt(p, w / 4 + 0.4, 2.1, fz, ww, 2.0, { box: shade(roof, 0.8) });
  // striped awning
  const aw = o.awning || [WHITE, roof];
  const n = Math.max(6, Math.round(w / 0.9));
  const sw = (w - 0.4) / n;
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.2 + sw * (i + 0.5);
    p.std.add(Geo.box(sw + 0.01, 0.08, 1.8, 0.02), aw[i % 2], x, 3.95, fz + 0.8, -0.38, 0, 0);
    p.std.add(Geo.sphere(sw * 0.5, 8, 6), aw[i % 2], x, 3.6, fz + 1.62, 0, 0, 0, 1, 0.45, 0.35);
  }
  // sign board
  p.std.box(Math.min(w - 1, 7.2), 1.35, 0.3, WHITE, 0, 4.25, fz + 0.12, { r: 0.12 });
  // side windows
  for (const s of [-1, 1]) {
    windowAt(p, s * (w / 2 + 0.02), 2.6, -0.8, 1.6, 1.6, { ry: s * Math.PI / 2 });
  }
  // lanterns by the door
  for (const s of [-1, 1]) {
    p.std.box(0.14, 0.5, 0.3, '#5d4b6b', s * 1.35, 2.5, fz + 0.1, { r: 0.03 });
    p.glow.add(Geo.box(0.3, 0.42, 0.3, 0.05), '#ffe7a8', s * 1.35, 3.1, fz + 0.25);
  }
  // potted plants
  for (const s of [-1, 1]) {
    p.std.cyl(0.4, 0.3, 0.6, '#e8906b', s * (w / 2 - 0.7), 0.3, fz + 0.7);
    p.std.add(Geo.ico(0.55, 1), '#6fbf5a', s * (w / 2 - 0.7), 1.35, fz + 0.7);
  }
  return p;
}

export function house(o) {
  const p = parts();
  const { w, d, wall, roof } = o;
  const H = 3.6;
  p.std.box(w + 0.4, 0.4, d + 0.4, '#e8ddd0', 0, 0, 0, { r: 0.06 });
  p.std.box(w, H, d, wall, 0, 0.35, 0, { r: 0.08 });
  p.std.box(w + 0.2, 0.25, d + 0.2, WHITE, 0, H + 0.3, 0, { r: 0.06 });
  gableRoof(p.std, w, d, 2.8, roof, H + 0.5, 0.8);
  // chimney
  p.std.box(0.9, 2.4, 0.9, '#d98c7a', w / 3, H + 1.6, -d / 5, { r: 0.06 });
  p.std.box(1.1, 0.25, 1.1, '#c77a69', w / 3, H + 3.9, -d / 5, { r: 0.05 });
  const fz = d / 2 + 0.02;
  door(p, -w / 5, fz, 1.3, 2.3, shade(roof, 0.8));
  // little porch roof over the door
  p.std.add(Geo.box(2.4, 0.18, 1.3, 0.06), shade(roof, 0.9), -w / 5, 3.05, fz + 0.55, 0.25, 0, 0);
  p.std.box(1.8, 0.25, 1.1, '#e8ddd0', -w / 5, 0, fz + 0.6, { r: 0.05 });
  windowAt(p, w / 5 + 0.3, 2.0, fz, 1.9, 1.5, { shutters: shade(roof, 1.05), box: '#b57a55' });
  // side windows
  for (const s of [-1, 1]) windowAt(p, s * (w / 2 + 0.02), 2.0, 0, 1.4, 1.3, { ry: s * Math.PI / 2 });
  // back windows
  windowAt(p, 0, 2.0, -d / 2 - 0.02, 1.6, 1.3, { ry: Math.PI });
  // attic round window
  p.glow.add(Geo.cyl(0.45, 0.45, 0.12, 16), WIN, 0, H + 1.5, fz - 0.3, Math.PI / 2, 0, 0);
  p.std.add(Geo.torus(0.48, 0.08, 6, 18), WHITE, 0, H + 1.5, fz - 0.22);
  // front yard fence with gate gap
  const fzz = d / 2 + 3.6;
  for (let x = -w / 2 - 0.5; x <= w / 2 + 0.5; x += 1.0) {
    if (Math.abs(x + w / 5) < 1.2) continue;
    p.std.box(0.16, 1.0, 0.16, WHITE, x, 0, fzz, { r: 0.04 });
  }
  for (const seg of [[-w / 2 - 0.5, -w / 5 - 1.2], [-w / 5 + 1.2, w / 2 + 0.5]]) {
    const len = seg[1] - seg[0];
    if (len <= 0) continue;
    p.std.box(len, 0.12, 0.1, WHITE, (seg[0] + seg[1]) / 2, 0.45, fzz, { r: 0.03 });
    p.std.box(len, 0.12, 0.1, WHITE, (seg[0] + seg[1]) / 2, 0.8, fzz, { r: 0.03 });
  }
  // path to the gate
  p.std.box(1.4, 0.06, 3.2, '#f5e4c4', -w / 5, 0, fz + 2.0, { r: 0 });
  // bushes and flowers
  const fl = ['#ff8fc0', '#ffd45e', '#ffffff', '#c59bff'];
  for (let i = 0; i < 4; i++) {
    const x = w / 10 + i * (w / 2.4 / 3);
    p.std.add(Geo.ico(0.55, 1), i % 2 ? '#78c25f' : '#8ad06c', x, 0.45, fz + 1.2);
    p.std.add(Geo.sphere(0.13, 8, 6), fl[i % 4], x + 0.2, 0.9, fz + 1.5);
    p.std.add(Geo.sphere(0.13, 8, 6), fl[(i + 1) % 4], x - 0.25, 0.8, fz + 1.55);
  }
  // mailbox
  p.std.box(0.12, 1.0, 0.12, '#8a6a58', -w / 5 - 1.9, 0, fzz + 0.4);
  p.std.box(0.5, 0.4, 0.7, shade(roof, 0.9), -w / 5 - 1.9, 1.0, fzz + 0.4, { r: 0.15 });
  return p;
}

export function townhall(o) {
  const p = parts();
  const { w, d } = o;
  const H = 6.5;
  p.std.box(w + 2, 0.5, d + 3, '#efe4d6', 0, 0, 0.8, { r: 0.08 });
  for (let i = 0; i < 3; i++) p.std.box(8 - i * 0.01, 0.25, 1.1, '#f6ede2', 0, 0.5 + i * 0.25 - 0.25, d / 2 + 2.3 - i * 0.5, { r: 0.04 });
  p.std.box(w, H, d, o.wall, 0, 0.5, 0, { r: 0.1 });
  p.std.box(w + 0.8, 0.6, d + 0.8, WHITE, 0, H + 0.4, 0, { r: 0.12 });
  gableRoof(p.std, w, d, 3.2, o.roof, H + 1.0, 0.5);
  // columns + pediment
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    p.std.cyl(0.38, 0.42, H, WHITE, i * 2.3, 0.5, d / 2 + 1.4);
    p.std.box(1.0, 0.3, 1.0, WHITE, i * 2.3, 0.5, d / 2 + 1.4);
  }
  p.std.box(11, 0.5, 2.6, WHITE, 0, H + 0.2, d / 2 + 1.1, { r: 0.1 });
  const ped = Geo.shape('ped', [[-5.6, 0], [5.6, 0], [0, 2.2]], 0.6, 0.05);
  p.std.add(ped, '#fffaf2', 0, H + 0.7, d / 2 + 1.9);
  door(p, 0, d / 2 + 0.02, 2.2, 3.2, '#6c8fc8');
  for (const s of [-1, 1]) {
    windowAt(p, s * 4.6, 2.6, d / 2 + 0.02, 1.8, 2.4, {});
    windowAt(p, s * 7.4, 2.6, d / 2 + 0.02, 1.4, 2.4, {});
  }
  // clock tower
  p.std.box(3.4, 4.2, 3.4, o.wall, 0, H + 2.4, -1, { r: 0.1 });
  p.std.box(3.8, 0.4, 3.8, WHITE, 0, H + 6.5, -1, { r: 0.1 });
  p.std.cone(2.8, 3.0, o.roof, 0, H + 6.9, -1, { seg: 4 });
  p.glowAlways.add(Geo.cyl(1.2, 1.2, 0.15, 24), '#fffaf0', 0, H + 4.4, 0.75, Math.PI / 2, 0, 0);
  p.std.add(Geo.torus(1.22, 0.12, 6, 24), '#d9b45c', 0, H + 4.4, 0.8);
  p.std.add(Geo.box(0.1, 0.8, 0.06, 0.02), '#4a3a5c', 0, H + 4.7, 0.86);
  p.std.add(Geo.box(0.6, 0.1, 0.06, 0.02), '#4a3a5c', 0.28, H + 4.4, 0.86);
  // flag
  p.std.cyl(0.06, 0.06, 3, '#cfc6d6', 0, H + 9.8, -1);
  p.std.add(Geo.box(1.4, 0.8, 0.05, 0.02), '#ff8fc0', 0.72, H + 12.3, -1);
  // planters along the front
  for (const s of [-1, 1]) {
    p.std.box(2.4, 0.8, 1.2, '#e0d2c0', s * 7.5, 0.5, d / 2 + 2.2, { r: 0.1 });
    for (let i = 0; i < 4; i++) p.std.add(Geo.sphere(0.24, 8, 6), ['#ff8fc0', '#ffd45e', '#ff9a7a', '#c59bff'][i], s * 7.5 + (i - 1.5) * 0.5, 1.45, d / 2 + 2.2);
  }
  return p;
}

export function stand(o) {
  const p = parts();
  const { w, d } = o;
  p.std.box(w, 1.1, d * 0.6, o.wall, 0, 0, d * 0.1, { r: 0.12 });
  p.std.box(w + 0.3, 0.14, d * 0.6 + 0.3, WHITE, 0, 1.1, d * 0.1, { r: 0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.std.cyl(0.08, 0.08, 2.4, WHITE, sx * (w / 2 - 0.1), 1.1, sz * (d / 2 - 0.3));
  const n = 8;
  for (let i = 0; i < n; i++) {
    const x = -w / 2 - 0.2 + ((w + 0.4) / n) * (i + 0.5);
    p.std.add(Geo.box((w + 0.4) / n, 0.1, d + 0.4, 0.02), i % 2 ? o.roof : WHITE, x, 3.65, 0, 0.12, 0, 0);
    p.std.add(Geo.sphere((w + 0.4) / n / 1.9, 8, 6), i % 2 ? o.roof : WHITE, x, 3.45, d / 2 + 0.15, 0, 0, 0, 1, 0.6, 0.6);
  }
  p.std.box(w * 0.8, 0.9, 0.2, WHITE, 0, 3.9, d / 2 - 0.1, { r: 0.1 });
  if (o.id === 'icecream') {
    p.std.cone(0.5, 1.3, '#e8b36b', 0, 4.1, -0.3, { rx: Math.PI, center: false });
    p.std.add(Geo.sphere(0.62, 12, 10), '#ffb3d1', 0, 5.6, -0.3);
    p.std.add(Geo.sphere(0.5, 12, 10), '#bff0e0', 0, 6.2, -0.3);
    p.std.add(Geo.sphere(0.14, 8, 6), '#ff4f6d', 0, 6.75, -0.3);
    for (let i = 0; i < 3; i++) p.std.add(Geo.sphere(0.22, 10, 8), ['#ffb3d1', '#fff2c2', '#b99cff'][i], -w / 3 + i * w / 3, 1.35, d * 0.1);
  } else {
    p.std.cyl(0.35, 0.35, 0.8, '#9c6b45', w / 2 + 0.6, 0, 0.6);
    p.std.cyl(0.35, 0.35, 0.8, '#9c6b45', w / 2 + 0.7, 0, -0.4);
    p.std.add(Geo.sphere(0.5, 12, 8), '#7fc6ff', 0, 4.8, -0.3, 0, 0, 0, 1.4, 0.7, 0.5);
    p.std.cone(0.35, 0.6, '#7fc6ff', 0.85, 4.8, -0.3, { rz: Math.PI / 2, center: true });
  }
  return p;
}

export function lighthouse() {
  const p = parts();
  const rocks = ['#9a93a6', '#b3adbd', '#8a8396'];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    p.std.add(Geo.ico(1.6 + (i % 3) * 0.5, 0), rocks[i % 3], Math.cos(a) * 4, 0.2, Math.sin(a) * 4);
  }
  p.std.cyl(4, 4.3, 1.2, '#b3adbd', 0, -0.4, 0, { seg: 20 });
  const segs = 6;
  for (let i = 0; i < segs; i++) {
    const r0 = 2.6 - i * 0.18, r1 = 2.6 - (i + 1) * 0.18;
    p.std.cyl(r1, r0, 2.2, i % 2 ? '#ff6f7d' : '#ffffff', 0, 0.8 + i * 2.2, 0, { seg: 20 });
  }
  const top = 0.8 + segs * 2.2;
  p.std.cyl(2.0, 2.0, 0.4, '#5d4b6b', 0, top, 0, { seg: 20 });
  p.glowAlways.add(Geo.cyl(1.2, 1.2, 1.8, 16), '#fff3b0', 0, top + 1.3, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    p.std.cyl(0.08, 0.08, 1.8, '#5d4b6b', Math.cos(a) * 1.3, top + 0.4, Math.sin(a) * 1.3);
  }
  p.std.cone(1.7, 1.4, '#ff6f7d', 0, top + 2.2, 0, { seg: 20 });
  p.std.add(Geo.sphere(0.25, 10, 8), '#ffd36b', 0, top + 3.7, 0);
  door(p, 0, 2.55, 1.1, 2.0, '#5d8fcf');
  return p;
}

export function cave() {
  const p = parts();
  const rock = ['#8f86a8', '#a39bbb', '#7d7596', '#b5aecb'];
  const r = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 1.6 - Math.PI * 1.3;
    const rad = r(5, 8);
    p.std.add(Geo.ico(r(3, 5.5), 1), rock[i % 4], Math.cos(a) * rad, r(0.5, 4), Math.sin(a) * rad - 1, r(0, 3), r(0, 3), 0, 1, r(0.8, 1.3), 1);
  }
  p.std.add(Geo.ico(7, 1), rock[1], 0, 5, -3, 0, 0, 0, 1.2, 0.8, 1);
  // dark mouth
  p.std.add(Geo.sphere(3.2, 16, 10), '#2a2238', 0, 1.6, 3.4, 0, 0, 0, 1, 1, 0.35);
  // crystals
  const cr = ['#ff9ad5', '#8fe8ff', '#c7a6ff', '#fff3a8'];
  for (let i = 0; i < 16; i++) {
    const a = r(-Math.PI, Math.PI);
    const rad = r(3.5, 7.5);
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad + 1.5;
    const h = r(1.2, 2.8);
    p.glowAlways.add(Geo.cone(r(0.35, 0.6), h, 5), cr[i % 4], x, h / 2 + r(0.2, 2.5), z, r(-0.4, 0.4), r(0, 3), r(-0.4, 0.4));
  }
  return p;
}

export function fountain() {
  const p = parts();
  p.std.cyl(5.2, 5.5, 0.8, '#efe2cf', 0, 0, 0, { seg: 32 });
  p.std.add(Geo.torus(5.1, 0.35, 8, 40), '#fff6ea', 0, 0.8, 0, Math.PI / 2, 0, 0);
  p.gloss.cyl(4.8, 4.8, 0.1, '#8fe3f0', 0, 0.62, 0, { seg: 32 });
  p.std.cyl(0.7, 1.0, 2.6, '#fff6ea', 0, 0.6, 0, { seg: 16 });
  p.std.cyl(2.2, 1.0, 0.5, '#efe2cf', 0, 3.0, 0, { seg: 24 });
  p.gloss.cyl(2.0, 2.0, 0.08, '#8fe3f0', 0, 3.42, 0, { seg: 24 });
  p.std.cyl(0.3, 0.45, 1.3, '#fff6ea', 0, 3.4, 0, { seg: 12 });
  p.std.add(Geo.sphere(0.6, 16, 12), '#ffc6de', 0, 5.0, 0);
  // flowers around
  const fl = ['#ff8fc0', '#ffd45e', '#c59bff', '#ffffff', '#ff9a7a'];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    p.std.add(Geo.sphere(0.2, 8, 6), fl[i % 5], Math.cos(a) * 5.95, 0.95, Math.sin(a) * 5.95);
  }
  return p;
}

export function lamp() {
  const p = parts();
  p.std.cyl(0.25, 0.3, 0.3, '#4f6a7a', 0, 0, 0);
  p.std.cyl(0.09, 0.11, 3.6, '#4f6a7a', 0, 0.3, 0);
  p.std.cyl(0.35, 0.2, 0.25, '#4f6a7a', 0, 3.8, 0);
  p.glow.add(Geo.sphere(0.36, 14, 10), '#ffe9b0', 0, 4.25, 0);
  p.std.cone(0.4, 0.3, '#4f6a7a', 0, 4.55, 0);
  return p;
}

export function bench() {
  const p = parts();
  for (let i = 0; i < 3; i++) p.std.box(2.2, 0.08, 0.2, WOOD, 0, 0.55, -0.25 + i * 0.24, { r: 0.03 });
  for (let i = 0; i < 2; i++) p.std.box(2.2, 0.2, 0.07, WOOD, 0, 0.8 + i * 0.28, -0.42, { r: 0.03, rx: -0.15 });
  for (const s of [-1, 1]) {
    p.std.box(0.1, 0.55, 0.6, '#5d6f7d', s * 0.95, 0, 0, { r: 0.03 });
    p.std.box(0.1, 0.6, 0.08, '#5d6f7d', s * 0.95, 0.55, -0.42, { r: 0.02 });
  }
  return p;
}

export function fenceRun(len, color = WHITE) {
  const b = new Builder();
  for (let x = -len / 2; x <= len / 2 + 0.01; x += 1.2) b.box(0.16, 1.0, 0.16, color, x, 0, 0, { r: 0.05 });
  b.box(len, 0.12, 0.1, color, 0, 0.45, 0, { r: 0.03 });
  b.box(len, 0.12, 0.1, color, 0, 0.8, 0, { r: 0.03 });
  return b;
}

export function playground() {
  const p = parts();
  // slide tower
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.std.cyl(0.1, 0.1, 2.6, '#ff8fb0', -3 + sx * 0.9, 0, -1 + sz * 0.9);
  p.std.box(2.1, 0.2, 2.1, '#ffd45e', -3, 1.6, -1, { r: 0.06 });
  p.std.cone(1.4, 1.1, '#5fb8ff', -3, 2.6, -1, { seg: 4, ry: Math.PI / 4 });
  p.std.add(Geo.box(1.1, 0.12, 3.6, 0.05), '#6fd6b3', -3, 0.95, 1.55, 0.5, 0, 0);
  for (const s of [-1, 1]) p.std.add(Geo.box(0.1, 0.3, 3.6, 0.04), '#57c09c', -3 + s * 0.55, 1.1, 1.55, 0.5, 0, 0);
  for (let i = 0; i < 5; i++) p.std.box(1.0, 0.1, 0.25, '#ffd45e', -3, i * 0.32, -2.2, { r: 0.03 });
  // swings
  for (const s of [-1, 1]) {
    p.std.add(Geo.box(0.14, 3.2, 0.14, 0.04), '#b58cff', 3 + s * 2.1, 1.5, -1, 0.25, 0, 0);
    p.std.add(Geo.box(0.14, 3.2, 0.14, 0.04), '#b58cff', 3 + s * 2.1, 1.5, 0.5, -0.25, 0, 0);
  }
  p.std.cyl(0.08, 0.08, 4.4, '#b58cff', 3, 3.0, -0.25, { rz: Math.PI / 2, center: true });
  for (const s of [-1, 1]) {
    p.std.cyl(0.02, 0.02, 2.2, '#6d6d7d', 3 + s * 0.8 - 0.25, 0.85, -0.25);
    p.std.cyl(0.02, 0.02, 2.2, '#6d6d7d', 3 + s * 0.8 + 0.25, 0.85, -0.25);
    p.std.box(0.7, 0.08, 0.35, '#ff8fb0', 3 + s * 0.8, 0.8, -0.25, { r: 0.03 });
  }
  // sandbox
  p.std.box(3.4, 0.35, 3.4, WOOD, 0, 0, 4, { r: 0.06 });
  p.std.box(3.0, 0.3, 3.0, '#f7e2ad', 0, 0.1, 4, { r: 0.1 });
  p.std.cone(0.6, 0.6, '#f0d493', 0.5, 0.35, 4.2);
  // soft ground
  p.std.cyl(8, 8, 0.06, '#ffc9a8', 0, 0, 0.5, { seg: 36 });
  return p;
}

export function gardenBed() {
  const b = new Builder();
  b.box(3.2, 0.4, 3.2, WOOD, 0, 0, 0, { r: 0.06 });
  b.box(2.8, 0.36, 2.8, '#7a5140', 0, 0.08, 0, { r: 0.1 });
  for (let i = -1; i <= 1; i++) b.box(2.6, 0.1, 0.3, '#6a4535', 0, 0.42, i * 0.8, { r: 0.05 });
  return b;
}

export function pier(PIER) {
  const p = parts();
  const len = PIER.z2 - PIER.z1, w = PIER.x2 - PIER.x1;
  const cx = (PIER.x1 + PIER.x2) / 2, cz = (PIER.z1 + PIER.z2) / 2;
  for (let z = 0; z < len; z += 0.9) p.std.box(w, 0.2, 0.8, z % 1.8 < 0.9 ? '#c9976b' : '#bb8a60', 0, PIER.y - 0.2, -len / 2 + z + 0.45, { r: 0.04 });
  for (let z = -len / 2; z <= len / 2; z += 4) {
    for (const s of [-1, 1]) {
      p.std.cyl(0.22, 0.22, 3.2, '#8a5a3c', s * (w / 2 - 0.1), PIER.y - 3.2, z);
      p.std.box(0.16, 1.0, 0.16, WHITE, s * (w / 2 - 0.1), PIER.y, z, { r: 0.04 });
    }
  }
  for (const s of [-1, 1]) p.std.box(0.12, 0.12, len, WHITE, s * (w / 2 - 0.1), PIER.y + 0.9, 0, { r: 0.03 });
  // lamps
  for (let z = -len / 2 + 6; z < len / 2; z += 16) {
    const l = lamp();
    for (const k of ['std', 'glow']) p[k].merge(l[k], w / 2 - 0.1, PIER.y, z);
  }
  // end platform
  p.std.box(w + 6, 0.2, 6, '#c9976b', 0, PIER.y - 0.2, len / 2 + 2.5, { r: 0.05 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.std.cyl(0.25, 0.25, 3.2, '#8a5a3c', sx * (w / 2 + 2.9), PIER.y - 3.2, len / 2 + 2.5 + sz * 2.8);
  return { p, cx, cz };
}

export function balloonStation() {
  const p = parts();
  p.std.cyl(4.5, 4.8, 0.5, '#e6d6c4', 0, 0, 0, { seg: 28 });
  p.std.cyl(3.5, 3.5, 0.08, '#ff9ac4', 0, 0.5, 0, { seg: 28 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    p.std.cyl(0.08, 0.08, 1.0, WHITE, Math.cos(a) * 4.4, 0.5, Math.sin(a) * 4.4);
  }
  return p;
}

// the hot-air balloon itself (kept as its own object so it can fly)
export function balloon() {
  const b = new Builder();
  const cols = ['#ff8fc0', '#ffffff', '#ffd45e', '#8fd0ff'];
  for (let i = 0; i < 12; i++) {
    const g = new THREE.SphereGeometry(3.2, 3, 16, (i / 12) * Math.PI * 2, Math.PI * 2 / 12);
    g.deleteAttribute('uv');
    b.add(g.index ? g.toNonIndexed() : g, cols[i % 4], 0, 6.5, 0, 0, 0, 0, 1, 1.15, 1);
  }
  b.cone(1.3, 1.6, '#ff8fc0', 0, 2.2, 0, { rx: Math.PI, seg: 12, center: false });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    b.cyl(0.03, 0.03, 2.2, '#6d5d4d', Math.cos(a) * 0.8, 1.1, Math.sin(a) * 0.8);
  }
  b.box(1.9, 1.1, 1.9, '#b8825a', 0, 0, 0, { r: 0.12 });
  b.box(2.0, 0.15, 2.0, '#8a5a3c', 0, 1.0, 0, { r: 0.06 });
  return b;
}

export function skyIsland(r) {
  const p = parts();
  // floating rock
  const rockC = ['#e8c9a8', '#dcb894', '#f0d6b8'];
  p.std.add(Geo.ico(r * 0.95, 2), '#e3c29f', 0, -2.5, 0, 0, 0, 0, 1, 0.42, 1);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    p.std.add(Geo.ico(r * 0.28, 1), rockC[i % 3], Math.cos(a) * r * 0.55, -r * 0.42, Math.sin(a) * r * 0.55, 0, a, 0, 1, 1.3, 1);
  }
  p.std.add(Geo.ico(r * 0.35, 1), '#dcb894', 0, -r * 0.62, 0, 0, 0, 0, 1, 1.2, 1);
  // hanging vines with flowers
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.2;
    const len = 2 + (i % 4) * 1.2;
    p.std.add(Geo.box(0.25, len, 0.25, 0.08), '#7cc45a', Math.cos(a) * (r - 0.6), -0.8 - len / 2, Math.sin(a) * (r - 0.6));
    p.std.add(Geo.sphere(0.3, 8, 6), ['#ff9ac4', '#ffffff', '#ffd45e'][i % 3], Math.cos(a) * (r - 0.4), -0.8 - len, Math.sin(a) * (r - 0.4));
  }
  p.std.cyl(r, r * 0.98, 1.2, '#96d97a', 0, -1.0, 0, { seg: 28 });
  p.std.cyl(r + 0.2, r + 0.2, 0.25, '#b7ec95', 0, 0.05, 0, { seg: 28 });
  // cloud skirt
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    p.std.add(Geo.ico(3 + (i % 3), 2), '#ffffff', Math.cos(a) * (r + 1), -2, Math.sin(a) * (r + 1), 0, 0, 0, 1.3, 0.6, 1.3);
  }
  // castle
  const cw = '#fff1f8', cr = '#c6a6ff';
  p.std.box(10, 6, 8, cw, 0, 0.2, -8, { r: 0.12 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    p.std.cyl(1.4, 1.5, 9, cw, sx * 5, 0.2, -8 + sz * 4);
    p.std.cone(1.9, 3.2, cr, sx * 5, 9.2, -8 + sz * 4, { seg: 14 });
    p.std.add(Geo.sphere(0.25, 8, 6), '#ffd36b', sx * 5, 12.6, -8 + sz * 4);
  }
  p.std.cyl(2, 2.1, 11, cw, 0, 0.2, -9);
  p.std.cone(2.6, 4.2, '#ff9ac4', 0, 11.2, -9, { seg: 16 });
  door(p, 0, -3.98, 2.0, 3.0, '#c6a6ff');
  for (const s of [-1, 1]) windowAt(p, s * 2.8, 3.8, -3.98, 1.1, 1.6, { color: '#ffe6f5' });
  // rainbow arch
  const rb = ['#ff8a8a', '#ffc27a', '#fff07a', '#8fe39a', '#8fc8ff', '#c6a6ff'];
  rb.forEach((c, i) => p.glowAlways.add(Geo.torus(9 - i * 0.55, 0.28, 6, 36, Math.PI), c, 0, 0, 8, 0, 0, 0));
  // flowers
  const fl = ['#ff8fc0', '#ffd45e', '#c59bff', '#ffffff'];
  for (let i = 0; i < 60; i++) {
    const a = Math.random() * Math.PI * 2, d = 4 + Math.random() * (r - 6);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (z < -3 && Math.abs(x) < 8) continue;
    p.std.add(Geo.sphere(0.22, 8, 6), fl[i % 4], x, 0.35, z);
  }
  return p;
}

// Sign atlas: all shop names drawn into one texture
export function buildSignAtlas(list) {
  const cols = 4, rows = Math.ceil(list.length / cols);
  const cw = 256, ch = 96;
  const canvas = document.createElement('canvas');
  canvas.width = cw * cols;
  canvas.height = THREE.MathUtils.ceilPowerOfTwo(ch * rows);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const uv = {};
  list.forEach((s, i) => {
    const cx = (i % cols) * cw, cy = Math.floor(i / cols) * ch;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx, cy, cw, ch);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${s.text.length > 10 ? 34 : 40}px Fredoka, sans-serif`;
    ctx.fillStyle = s.color || '#e0508f';
    ctx.fillText(s.text, cx + cw / 2, cy + ch / 2 + 2);
    uv[s.id] = [cx / canvas.width, 1 - (cy + ch) / canvas.height, (cx + cw) / canvas.width, 1 - cy / canvas.height];
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, uv };
}
