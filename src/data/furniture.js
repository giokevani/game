// Furniture catalogue. Each model is built procedurally, centred on its
// footprint, bottom at y=0, front facing +z.
// place: floor | rug | wall | surface (can also go on a table/counter) | any
// top: height other items can be placed on (surfaces)
// use: interaction type in play mode
import { shade } from '../engine/builder.js';

export const PALETTE = ['#ff8fc0', '#ffb38a', '#ffd45e', '#b8e986', '#6fd6b3', '#7fc6ff', '#b58cff', '#ffffff', '#f3e6d8', '#8a7a9a', '#ff6f91', '#5b8def'];

export const CATEGORIES = [
  { id: 'living', name: 'Living', icon: '🛋️' },
  { id: 'bedroom', name: 'Bedroom', icon: '🛏️' },
  { id: 'kitchen', name: 'Kitchen', icon: '🍳' },
  { id: 'bath', name: 'Bath', icon: '🛁' },
  { id: 'kids', name: 'Play', icon: '🧸' },
  { id: 'pets', name: 'Pets', icon: '🐾' },
  { id: 'garden', name: 'Garden', icon: '🌷' },
  { id: 'lights', name: 'Lights', icon: '💡' },
  { id: 'decor', name: 'Decor', icon: '🖼️' },
  { id: 'special', name: 'Special', icon: '✨' },
];

const W1 = '#e2b98c', W2 = '#b8825a', W3 = '#8a5a3c', WH = '#ffffff', MET = '#c9c3d1', DARK = '#4a3a5c';

// helpers --------------------------------------------------------------
function legs(b, w, d, h, col, inset = 0.08, r = 0.035) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(r, r, h, col, sx * (w / 2 - inset), 0, sz * (d / 2 - inset), { seg: 6 });
}
function cushion(b, w, h, d, col, x, y, z, o) { b.box(w, h, d, col, x, y, z, { r: Math.min(0.1, h * 0.45), ...o }); }
function books(b, x0, y, z, width, n = 7) {
  const cols = ['#ff8fc0', '#7fc6ff', '#ffd45e', '#6fd6b3', '#b58cff', '#ff9a7a', '#ffffff'];
  let x = x0;
  for (let i = 0; i < n && x < x0 + width; i++) {
    const bw = 0.06 + ((i * 37) % 5) * 0.012, bh = 0.2 + ((i * 53) % 4) * 0.03;
    b.box(bw, bh, 0.22, cols[i % cols.length], x + bw / 2, y, z, { r: 0.01 });
    x += bw + 0.01;
  }
}
function flowers(b, x, y, z, r = 0.12, n = 5) {
  const cols = ['#ff8fc0', '#ffd45e', '#ffffff', '#b58cff', '#ff9a7a'];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    b.sphere(0.06, cols[i % 5], x + Math.cos(a) * r, y + (i % 2) * 0.05, z + Math.sin(a) * r);
  }
  b.sphere(0.07, '#6fbf5a', x, y - 0.04, z);
}
function screen(p, w, h, x, y, z) {
  p.std.box(w + 0.08, h + 0.08, 0.06, DARK, x, y - 0.04, z, { r: 0.03 });
  p.glowAlways.cbox(w, h, 0.02, '#8fd8ff', x, y + h / 2, z + 0.035, { r: 0 });
  p.glowAlways.cbox(w * 0.4, h * 0.3, 0.02, '#ffc6e0', x - w * 0.15, y + h * 0.6, z + 0.04, { r: 0 });
  p.glowAlways.cbox(w * 0.25, h * 0.25, 0.02, '#fff3a8', x + w * 0.2, y + h * 0.3, z + 0.04, { r: 0 });
}
function plant(b, x, y, z, s = 1, pot = '#e8906b') {
  b.cyl(0.14 * s, 0.1 * s, 0.22 * s, pot, x, y, z, { seg: 10 });
  b.ico(0.18 * s, '#6fbf5a', x, y + 0.34 * s, z, { detail: 1 });
  b.ico(0.13 * s, '#82cc68', x + 0.1 * s, y + 0.45 * s, z + 0.03, { detail: 1 });
}
function rugDisc(b, r, col, segs = 28) { b.cyl(r, r, 0.02, col, 0, 0, 0, { seg: segs }); }

// ---------------------------------------------------------------------
const L = [];
const add = (o) => L.push({ place: 'floor', h: 1, lvl: 1, c: 0, ...o });

// LIVING
add({ id: 'sofa', name: 'Comfy Sofa', cat: 'living', price: 120, fp: [2.0, 0.9], h: 0.9, c: 0, use: 'sit',
  seats: [[-0.45, 0.12, 0.45], [0.45, 0.12, 0.45]],
  m: (p, c) => {
    const b = p.std;
    b.box(2.0, 0.42, 0.9, shade(c, 0.85), 0, 0.08, 0, { r: 0.1 });
    for (const x of [-0.47, 0.47]) cushion(b, 0.9, 0.18, 0.62, c, x, 0.5, 0.1);
    b.box(2.0, 0.55, 0.26, shade(c, 0.92), 0, 0.45, -0.32, { r: 0.12 });
    for (const x of [-0.93, 0.93]) b.box(0.2, 0.62, 0.9, shade(c, 0.9), x, 0.08, 0, { r: 0.09 });
    b.box(0.34, 0.3, 0.12, '#ffffff', -0.6, 0.62, -0.12, { r: 0.08, rx: -0.3 });
    legs(b, 1.9, 0.8, 0.08, W3, 0.1, 0.04);
  } });
add({ id: 'armchair', name: 'Armchair', cat: 'living', price: 70, fp: [0.9, 0.9], h: 0.9, c: 5, use: 'sit', seats: [[0, 0.12, 0.45]],
  m: (p, c) => {
    const b = p.std;
    b.box(0.9, 0.42, 0.9, shade(c, 0.85), 0, 0.08, 0, { r: 0.1 });
    cushion(b, 0.62, 0.18, 0.62, c, 0, 0.5, 0.08);
    b.box(0.9, 0.55, 0.24, shade(c, 0.92), 0, 0.45, -0.33, { r: 0.11 });
    for (const x of [-0.37, 0.37]) b.box(0.18, 0.6, 0.9, shade(c, 0.9), x, 0.08, 0, { r: 0.08 });
    legs(b, 0.8, 0.8, 0.08, W3, 0.1, 0.04);
  } });
add({ id: 'beanbag', name: 'Bean Bag', cat: 'living', price: 45, fp: [0.9, 0.9], h: 0.7, c: 6, use: 'sit', seats: [[0, -0.2, 0.2]],
  m: (p, c) => { p.std.sphere(0.48, c, 0, 0.3, 0, { sy: 0.65 }); p.std.sphere(0.36, shade(c, 1.08), 0, 0.5, -0.18, { sy: 0.7 }); } });
add({ id: 'coffee_table', name: 'Coffee Table', cat: 'living', price: 50, fp: [1.2, 0.6], h: 0.45, top: 0.45,
  m: (p) => { p.std.box(1.2, 0.08, 0.6, W1, 0, 0.37, 0, { r: 0.04 }); p.std.box(1.05, 0.04, 0.48, W2, 0, 0.12, 0, { r: 0.02 }); legs(p.std, 1.2, 0.6, 0.37, W2); } });
add({ id: 'side_table', name: 'Side Table', cat: 'living', price: 30, fp: [0.5, 0.5], h: 0.55, top: 0.55, c: 7,
  m: (p, c) => { p.std.cyl(0.26, 0.26, 0.06, c, 0, 0.49, 0, { seg: 18 }); p.std.cyl(0.04, 0.04, 0.49, W2, 0, 0, 0, { seg: 8 }); p.std.cyl(0.18, 0.2, 0.04, W2, 0, 0, 0, { seg: 14 }); } });
add({ id: 'tv', name: 'TV & Stand', cat: 'living', price: 180, lvl: 2, fp: [1.6, 0.5], h: 1.4, use: 'tv',
  m: (p) => {
    p.std.box(1.6, 0.5, 0.5, W1, 0, 0, 0, { r: 0.05 });
    for (const x of [-0.4, 0.4]) p.std.box(0.7, 0.34, 0.02, W2, x, 0.08, 0.25, { r: 0.01 });
    p.std.cyl(0.05, 0.08, 0.12, DARK, 0, 0.5, 0);
    screen(p, 1.3, 0.72, 0, 0.62, 0);
  } });
add({ id: 'bookshelf', name: 'Bookshelf', cat: 'living', price: 90, fp: [1.0, 0.4], h: 1.9, c: 7,
  m: (p, c) => {
    const b = p.std;
    b.box(1.0, 1.9, 0.06, shade(c, 0.9), 0, 0, -0.17, { r: 0.02 });
    for (const x of [-0.48, 0.48]) b.box(0.05, 1.9, 0.4, c, x, 0, 0, { r: 0.02 });
    for (let i = 0; i < 5; i++) b.box(1.0, 0.05, 0.4, c, 0, i * 0.46, 0, { r: 0.02 });
    for (let i = 0; i < 4; i++) books(b, -0.44, i * 0.46 + 0.05, 0.02, 0.86, 9);
  } });
add({ id: 'rug_round', name: 'Round Rug', cat: 'living', price: 40, place: 'rug', fp: [2.0, 2.0], h: 0.02, c: 0,
  m: (p, c) => { rugDisc(p.std, 1.0, shade(c, 0.9)); p.std.cyl(0.8, 0.8, 0.025, c, 0, 0, 0, { seg: 28 }); p.std.cyl(0.45, 0.45, 0.03, WH, 0, 0, 0, { seg: 24 }); } });
add({ id: 'rug_rect', name: 'Cozy Rug', cat: 'living', price: 45, place: 'rug', fp: [2.5, 1.6], h: 0.02, c: 5,
  m: (p, c) => { p.std.box(2.5, 0.02, 1.6, c, 0, 0, 0, { r: 0 }); p.std.box(2.2, 0.025, 1.3, WH, 0, 0, 0, { r: 0 }); p.std.box(2.0, 0.03, 1.1, shade(c, 1.1), 0, 0, 0, { r: 0 }); } });
add({ id: 'fireplace', name: 'Fireplace', cat: 'living', price: 250, lvl: 5, fp: [1.6, 0.6], h: 1.4,
  m: (p) => {
    p.std.box(1.6, 1.3, 0.6, '#f0e2d0', 0, 0, 0, { r: 0.05 });
    p.std.box(1.8, 0.12, 0.7, WH, 0, 1.3, 0, { r: 0.04 });
    p.std.box(0.9, 0.7, 0.1, '#3a2a3a', 0, 0.15, 0.26, { r: 0.03 });
    p.glowAlways.cone(0.22, 0.45, '#ffb347', -0.12, 0.2, 0.2, { seg: 7 });
    p.glowAlways.cone(0.18, 0.55, '#ff7a45', 0.1, 0.2, 0.18, { seg: 7 });
    p.glowAlways.cone(0.1, 0.3, '#ffe27a', 0, 0.2, 0.24, { seg: 7 });
    p.std.cyl(0.06, 0.06, 0.6, W3, 0, 0.2, 0.2, { rz: Math.PI / 2, center: true });
  } });
add({ id: 'piano', name: 'Piano', cat: 'living', price: 400, lvl: 6, fp: [1.5, 0.9], h: 1.3, c: 9, use: 'piano', seats: [[0, 0.02, 0.62]],
  m: (p, c) => {
    const b = p.std;
    b.box(1.5, 1.2, 0.5, c, 0, 0, -0.2, { r: 0.05 });
    b.box(1.4, 0.08, 0.25, shade(c, 0.9), 0, 0.72, 0.15, { r: 0.02 });
    b.box(1.36, 0.05, 0.2, WH, 0, 0.78, 0.15, { r: 0.01 });
    for (let i = 0; i < 12; i++) if (i % 7 !== 2 && i % 7 !== 6) b.box(0.05, 0.05, 0.1, '#222', -0.62 + i * 0.113, 0.83, 0.1, { r: 0 });
    for (const x of [-0.6, 0.6]) b.box(0.08, 0.72, 0.08, c, x, 0, 0.2, { r: 0.02 });
    b.box(0.9, 0.06, 0.35, c, 0, 0.45, 0.62, { r: 0.03 });
    legs(b, 0.9, 0.35, 0.45, c, 0.06);
  } });
add({ id: 'radio', name: 'Record Player', cat: 'living', price: 120, lvl: 3, fp: [0.6, 0.45], h: 0.85, use: 'radio', c: 0,
  m: (p, c) => {
    p.std.box(0.6, 0.6, 0.45, W1, 0, 0, 0, { r: 0.04 }); legs(p.std, 0.6, 0.45, 0.1, W2);
    p.std.box(0.5, 0.12, 0.4, c, 0, 0.6, 0, { r: 0.03 }); p.std.cyl(0.16, 0.16, 0.02, '#222', 0, 0.72, 0, { seg: 20 });
    p.std.cyl(0.05, 0.05, 0.025, '#ff6f91', 0, 0.725, 0, { seg: 10 });
  } });

// BEDROOM
const bed = (w, d, head, extra) => (p, c) => {
  const b = p.std;
  b.box(w, 0.3, d, W1, 0, 0.1, 0, { r: 0.05 });
  legs(b, w, d, 0.1, W2, 0.08, 0.05);
  b.box(w - 0.08, 0.2, d - 0.1, WH, 0, 0.4, 0.02, { r: 0.08 });
  b.box(w - 0.04, 0.12, d * 0.62, c, 0, 0.52, d * 0.18, { r: 0.06 });
  b.box(w + 0.04, 0.02, d * 0.62, shade(c, 0.9), 0, 0.4, d * 0.18, { r: 0 });
  const n = w > 1.3 ? 2 : 1;
  for (let i = 0; i < n; i++) cushion(b, n === 2 ? w * 0.4 : w * 0.7, 0.14, 0.34, WH, n === 2 ? (i - 0.5) * w * 0.45 : 0, 0.58, -d / 2 + 0.3);
  b.box(w, head, 0.1, W2, 0, 0, -d / 2 + 0.05, { r: 0.05 });
  b.box(w - 0.12, head * 0.55, 0.12, c, 0, head * 0.35, -d / 2 + 0.06, { r: 0.08 });
  extra?.(p, c, w, d);
};
add({ id: 'bed_single', name: 'Cozy Bed', cat: 'bedroom', price: 90, fp: [1.1, 2.1], h: 0.9, use: 'sleep', c: 0, sleep: [0, 0.65, 0.1], m: bed(1.1, 2.1, 1.0) });
add({ id: 'bed_double', name: 'Big Bed', cat: 'bedroom', price: 180, lvl: 2, fp: [1.7, 2.2], h: 1.0, use: 'sleep', c: 5, sleep: [0, 0.65, 0.1], m: bed(1.7, 2.2, 1.2) });
add({ id: 'bunk_bed', name: 'Bunk Bed', cat: 'bedroom', price: 300, lvl: 4, fp: [1.1, 2.1], h: 1.9, use: 'sleep', c: 4, sleep: [0, 0.65, 0.1],
  m: bed(1.1, 2.1, 1.0, (p, c) => {
    const b = p.std;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(0.08, 1.9, 0.08, W2, sx * 0.51, 0, sz * 1.0, { r: 0.02 });
    b.box(1.1, 0.12, 2.1, W1, 0, 1.2, 0, { r: 0.04 });
    b.box(1.0, 0.16, 2.0, WH, 0, 1.32, 0, { r: 0.06 });
    b.box(1.04, 0.1, 1.3, shade(c, 1.15), 0, 1.44, 0.35, { r: 0.05 });
    for (let i = 0; i < 4; i++) b.box(0.4, 0.04, 0.05, W2, 0.3, 0.35 + i * 0.3, 1.04, { r: 0 });
  }) });
add({ id: 'bed_canopy', name: 'Canopy Bed', cat: 'bedroom', price: 650, lvl: 8, fp: [1.8, 2.3], h: 2.4, use: 'sleep', c: 0, sleep: [0, 0.65, 0.1],
  m: bed(1.8, 2.3, 1.3, (p, c) => {
    const b = p.std;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(0.05, 0.05, 2.3, WH, sx * 0.86, 0, sz * 1.1, { seg: 8 });
    b.box(1.84, 0.1, 2.34, WH, 0, 2.3, 0, { r: 0.04 });
    for (const sx of [-1, 1]) b.box(0.04, 1.2, 2.2, shade(c, 1.15), sx * 0.88, 1.1, 0, { r: 0.01 });
    b.box(1.7, 0.3, 0.04, shade(c, 1.15), 0, 2.0, 1.12, { r: 0.01 });
  }) });
add({ id: 'nightstand', name: 'Nightstand', cat: 'bedroom', price: 35, fp: [0.5, 0.45], h: 0.55, top: 0.55, c: 7,
  m: (p, c) => { p.std.box(0.5, 0.5, 0.45, c, 0, 0.05, 0, { r: 0.04 }); p.std.box(0.42, 0.18, 0.02, shade(c, 0.92), 0, 0.3, 0.23, { r: 0.01 }); p.std.sphere(0.03, '#ffd36b', 0, 0.39, 0.25); legs(p.std, 0.5, 0.45, 0.05, W2); } });
add({ id: 'wardrobe', name: 'Wardrobe', cat: 'bedroom', price: 150, fp: [1.2, 0.6], h: 2.0, use: 'wardrobe', c: 7,
  m: (p, c) => {
    p.std.box(1.2, 1.95, 0.6, c, 0, 0.05, 0, { r: 0.05 });
    for (const x of [-0.29, 0.29]) p.std.box(0.55, 1.75, 0.03, shade(c, 0.95), x, 0.15, 0.3, { r: 0.02 });
    for (const x of [-0.06, 0.06]) p.std.cyl(0.02, 0.02, 0.3, '#ffd36b', x, 1.0, 0.33, { seg: 6 });
    p.std.box(1.26, 0.08, 0.64, shade(c, 0.9), 0, 1.95, 0, { r: 0.03 });
    legs(p.std, 1.2, 0.6, 0.06, W2);
  } });
add({ id: 'dresser', name: 'Dresser', cat: 'bedroom', price: 80, fp: [1.2, 0.5], h: 0.9, top: 0.9, c: 0,
  m: (p, c) => {
    p.std.box(1.2, 0.84, 0.5, WH, 0, 0.06, 0, { r: 0.04 });
    for (let i = 0; i < 3; i++) { p.std.box(1.08, 0.22, 0.03, c, 0, 0.14 + i * 0.25, 0.25, { r: 0.02 }); p.std.sphere(0.035, '#ffd36b', 0, 0.25 + i * 0.25, 0.28); }
    legs(p.std, 1.2, 0.5, 0.06, W2);
  } });
add({ id: 'vanity', name: 'Vanity Mirror', cat: 'bedroom', price: 160, lvl: 3, fp: [1.0, 0.5], h: 1.6, top: 0.75, c: 0,
  m: (p, c) => {
    p.std.box(1.0, 0.08, 0.5, WH, 0, 0.7, 0, { r: 0.03 }); legs(p.std, 1.0, 0.5, 0.7, WH);
    p.std.box(0.9, 0.16, 0.44, c, 0, 0.54, 0, { r: 0.03 });
    p.std.torus(0.36, 0.05, c, 0, 1.2, -0.2, { ts: 24 });
    p.gloss.cyl(0.34, 0.34, 0.02, '#dff3ff', 0, 1.2, -0.21, { seg: 24, rx: Math.PI / 2, center: true });
    for (let i = 0; i < 6; i++) p.glow.sphere(0.035, '#fff3c2', Math.cos(i * 1.05) * 0.42, 1.2 + Math.sin(i * 1.05) * 0.42, -0.18);
  } });
add({ id: 'desk', name: 'Desk', cat: 'bedroom', price: 70, fp: [1.3, 0.6], h: 0.75, top: 0.75, c: 7,
  m: (p, c) => { p.std.box(1.3, 0.06, 0.6, W1, 0, 0.72, 0, { r: 0.02 }); p.std.box(0.4, 0.66, 0.56, c, 0.42, 0.06, 0, { r: 0.03 }); for (let i = 0; i < 2; i++) p.std.box(0.34, 0.25, 0.02, shade(c, 0.93), 0.42, 0.14 + i * 0.3, 0.29, { r: 0.01 }); legs(p.std, 1.3, 0.6, 0.72, W2); } });
add({ id: 'desk_chair', name: 'Desk Chair', cat: 'bedroom', price: 40, fp: [0.6, 0.6], h: 0.9, use: 'sit', c: 0, seats: [[0, 0.0, 0.12]],
  m: (p, c) => { p.std.cyl(0.05, 0.05, 0.4, MET, 0, 0.06, 0, { seg: 8 }); p.std.cyl(0.26, 0.28, 0.06, DARK, 0, 0, 0, { seg: 5 }); cushion(p.std, 0.5, 0.1, 0.48, c, 0, 0.44, 0); p.std.box(0.46, 0.46, 0.08, c, 0, 0.55, -0.22, { r: 0.07 }); } });

// KITCHEN
const counterBase = (p, c, w = 1.0) => {
  p.std.box(w, 0.86, 0.6, c, 0, 0.02, 0, { r: 0.03 });
  p.std.box(w + 0.02, 0.06, 0.62, '#f4f1ea', 0, 0.86, 0, { r: 0.02 });
  p.std.box(w - 0.08, 0.62, 0.02, shade(c, 0.95), 0, 0.14, 0.3, { r: 0.01 });
  p.std.box(0.24, 0.03, 0.03, MET, 0, 0.66, 0.32, { r: 0 });
};
add({ id: 'counter', name: 'Counter', cat: 'kitchen', price: 60, fp: [1.0, 0.6], h: 0.92, top: 0.92, c: 7, m: (p, c) => counterBase(p, c) });
add({ id: 'counter_sink', name: 'Kitchen Sink', cat: 'kitchen', price: 90, fp: [1.0, 0.6], h: 1.1, use: 'sink', c: 7,
  m: (p, c) => { counterBase(p, c); p.gloss.box(0.5, 0.04, 0.36, '#dfe8f0', 0, 0.87, 0, { r: 0.02 }); p.std.cyl(0.02, 0.02, 0.28, MET, 0, 0.9, -0.2, { seg: 6 }); p.std.cyl(0.02, 0.02, 0.18, MET, 0, 1.16, -0.12, { seg: 6, rx: Math.PI / 2, center: true }); } });
add({ id: 'stove', name: 'Stove', cat: 'kitchen', price: 150, fp: [1.0, 0.6], h: 0.95, use: 'cook', c: 7,
  m: (p, c) => {
    p.std.box(1.0, 0.9, 0.6, c, 0, 0, 0, { r: 0.03 });
    p.std.box(1.0, 0.04, 0.6, '#3a3446', 0, 0.9, 0, { r: 0.01 });
    for (const x of [-0.25, 0.25]) for (const z of [-0.14, 0.14]) p.glow.cyl(0.1, 0.1, 0.01, '#ff7a55', x, 0.94, z, { seg: 14 });
    p.std.box(0.8, 0.5, 0.02, '#3a3446', 0, 0.18, 0.3, { r: 0.02 });
    p.std.box(0.6, 0.03, 0.04, MET, 0, 0.72, 0.32, { r: 0 });
  } });
add({ id: 'fridge', name: 'Fridge', cat: 'kitchen', price: 160, fp: [0.9, 0.7], h: 2.0, use: 'fridge', c: 7,
  m: (p, c) => {
    p.std.box(0.9, 1.95, 0.7, c, 0, 0.03, 0, { r: 0.07 });
    p.std.box(0.86, 0.02, 0.02, shade(c, 0.85), 0, 1.3, 0.35, { r: 0 });
    for (const y of [1.55, 0.75]) p.std.box(0.04, 0.35, 0.05, MET, 0.34, y, 0.37, { r: 0.015 });
    p.std.sphere(0.05, '#ff8fc0', -0.2, 1.6, 0.36); p.std.sphere(0.04, '#7fc6ff', -0.1, 1.5, 0.36); p.std.box(0.14, 0.18, 0.01, '#fff3a8', -0.25, 1.0, 0.36, { r: 0 });
  } });
add({ id: 'dining_table', name: 'Dining Table', cat: 'kitchen', price: 90, fp: [1.6, 0.9], h: 0.76, top: 0.76, c: 7,
  m: (p, c) => { p.std.box(1.6, 0.06, 0.9, W1, 0, 0.7, 0, { r: 0.03 }); legs(p.std, 1.6, 0.9, 0.7, W2, 0.1, 0.045); p.std.box(0.5, 0.01, 0.9, c, 0, 0.765, 0, { r: 0 }); } });
add({ id: 'round_table', name: 'Round Table', cat: 'kitchen', price: 70, fp: [1.0, 1.0], h: 0.76, top: 0.76, c: 7,
  m: (p, c) => { p.std.cyl(0.5, 0.5, 0.05, c, 0, 0.71, 0, { seg: 24 }); p.std.cyl(0.06, 0.06, 0.71, W2, 0, 0, 0, { seg: 8 }); p.std.cyl(0.26, 0.3, 0.05, W2, 0, 0, 0, { seg: 16 }); } });
add({ id: 'dining_chair', name: 'Chair', cat: 'kitchen', price: 30, fp: [0.5, 0.5], h: 0.95, use: 'sit', c: 0, seats: [[0, -0.02, 0.08]],
  m: (p, c) => { p.std.box(0.48, 0.05, 0.46, W1, 0, 0.44, 0, { r: 0.02 }); cushion(p.std, 0.42, 0.06, 0.4, c, 0, 0.49, 0.02); legs(p.std, 0.46, 0.44, 0.44, W2, 0.04, 0.025); p.std.box(0.46, 0.46, 0.05, W1, 0, 0.49, -0.21, { r: 0.03 }); } });
add({ id: 'bar_stool', name: 'Bar Stool', cat: 'kitchen', price: 30, fp: [0.45, 0.45], h: 0.75, use: 'sit', c: 5, seats: [[0, 0.22, 0.0]],
  m: (p, c) => { p.std.cyl(0.2, 0.2, 0.08, c, 0, 0.66, 0, { seg: 16 }); p.std.cyl(0.03, 0.03, 0.66, MET, 0, 0, 0, { seg: 6 }); p.std.torus(0.14, 0.015, MET, 0, 0.3, 0, { rx: Math.PI / 2 }); p.std.cyl(0.18, 0.2, 0.03, MET, 0, 0, 0, { seg: 14 }); } });
add({ id: 'island', name: 'Kitchen Island', cat: 'kitchen', price: 200, lvl: 4, fp: [1.8, 0.9], h: 0.92, top: 0.92, c: 4,
  m: (p, c) => { p.std.box(1.7, 0.86, 0.8, c, 0, 0.02, 0, { r: 0.04 }); p.std.box(1.8, 0.06, 0.9, '#f4f1ea', 0, 0.86, 0, { r: 0.02 }); for (const x of [-0.55, 0, 0.55]) p.std.box(0.46, 0.6, 0.02, shade(c, 0.94), x, 0.14, 0.41, { r: 0.01 }); } });
add({ id: 'microwave', name: 'Microwave', cat: 'kitchen', price: 50, place: 'surface', fp: [0.5, 0.35], h: 0.3,
  m: (p) => { p.std.box(0.5, 0.3, 0.35, WH, 0, 0, 0, { r: 0.03 }); p.std.box(0.3, 0.2, 0.02, '#3a3446', -0.06, 0.05, 0.17, { r: 0.01 }); p.glow.box(0.06, 0.03, 0.02, '#8fff9a', 0.17, 0.2, 0.17, { r: 0 }); } });
add({ id: 'cake_stand', name: 'Cake Stand', cat: 'kitchen', price: 40, lvl: 2, place: 'surface', fp: [0.4, 0.4], h: 0.4, c: 0,
  m: (p, c) => { p.std.cyl(0.18, 0.1, 0.04, WH, 0, 0.1, 0, { seg: 16 }); p.std.cyl(0.03, 0.08, 0.1, WH, 0, 0, 0, { seg: 8 }); p.std.cyl(0.14, 0.14, 0.14, c, 0, 0.14, 0, { seg: 16 }); p.std.cyl(0.145, 0.145, 0.04, WH, 0, 0.26, 0, { seg: 16 }); p.std.sphere(0.035, '#ff4f6d', 0, 0.32, 0); } });
add({ id: 'fruit_bowl', name: 'Fruit Bowl', cat: 'kitchen', price: 20, place: 'surface', fp: [0.4, 0.4], h: 0.2,
  m: (p) => { p.std.cyl(0.18, 0.1, 0.1, '#7fc6ff', 0, 0, 0, { seg: 14 }); const f = ['#ff5d5d', '#ffd45e', '#8fd66f', '#ff9a3d', '#b05ad6']; for (let i = 0; i < 5; i++) p.std.sphere(0.06, f[i], Math.cos(i * 1.3) * 0.08, 0.12 + (i % 2) * 0.04, Math.sin(i * 1.3) * 0.08); } });
add({ id: 'coffee_machine', name: 'Coffee Maker', cat: 'kitchen', price: 30, lvl: 3, place: 'surface', fp: [0.3, 0.3], h: 0.4, c: 10,
  m: (p, c) => { p.std.box(0.28, 0.4, 0.28, c, 0, 0, 0, { r: 0.04 }); p.std.box(0.2, 0.1, 0.1, '#3a3446', 0, 0.12, 0.12, { r: 0.02 }); p.std.cyl(0.04, 0.035, 0.07, WH, 0, 0.02, 0.1, { seg: 8 }); } });
add({ id: 'kitchen_shelf', name: 'Jar Shelf', cat: 'kitchen', price: 45, place: 'wall', fp: [1.0, 0.25], h: 0.4, y: 1.5,
  m: (p) => { p.std.box(1.0, 0.04, 0.25, W1, 0, 0, 0, { r: 0.01 }); const cc = ['#ffd45e', '#ff8fc0', '#8fd66f', '#7fc6ff']; for (let i = 0; i < 4; i++) { p.gloss.cyl(0.07, 0.07, 0.18, '#e8f6ff', -0.36 + i * 0.24, 0.04, 0, { seg: 10 }); p.std.cyl(0.06, 0.06, 0.1, cc[i], -0.36 + i * 0.24, 0.05, 0, { seg: 10 }); p.std.cyl(0.075, 0.075, 0.03, W2, -0.36 + i * 0.24, 0.22, 0, { seg: 10 }); } } });

// BATH
add({ id: 'toilet', name: 'Toilet', cat: 'bath', price: 60, fp: [0.5, 0.7], h: 0.8, use: 'sit', seats: [[0, -0.05, 0.08]],
  m: (p) => { p.gloss.cyl(0.2, 0.16, 0.4, WH, 0, 0, 0.08, { seg: 14 }); p.gloss.cyl(0.23, 0.23, 0.05, WH, 0, 0.4, 0.08, { seg: 16 }); p.gloss.box(0.44, 0.4, 0.2, WH, 0, 0.4, -0.24, { r: 0.05 }); p.std.box(0.08, 0.03, 0.03, MET, 0.12, 0.74, -0.14, { r: 0 }); } });
add({ id: 'bathtub', name: 'Bathtub', cat: 'bath', price: 160, fp: [1.7, 0.8], h: 0.6, use: 'bath', c: 7,
  m: (p, c) => { p.gloss.box(1.7, 0.55, 0.8, c, 0, 0.06, 0, { r: 0.18 }); p.gloss.box(1.5, 0.05, 0.6, '#a8e3ff', 0, 0.5, 0, { r: 0.05 }); for (let i = 0; i < 6; i++) p.std.sphere(0.08 + (i % 3) * 0.03, WH, -0.5 + i * 0.2, 0.57, (i % 2) * 0.12 - 0.05); legs(p.std, 1.5, 0.6, 0.08, '#ffd36b'); p.std.cyl(0.02, 0.02, 0.3, MET, -0.78, 0.5, 0, { seg: 6 }); } });
add({ id: 'shower', name: 'Shower', cat: 'bath', price: 180, lvl: 3, fp: [1.0, 1.0], h: 2.2, use: 'shower',
  m: (p) => { p.std.box(1.0, 0.1, 1.0, '#e0f4ff', 0, 0, 0, { r: 0.03 }); p.std.cyl(0.02, 0.02, 2.0, MET, 0, 0.1, -0.45, { seg: 6 }); p.std.cyl(0.12, 0.08, 0.05, MET, 0, 2.05, -0.3, { seg: 12 }); p.std.box(0.04, 0.04, 0.2, MET, 0, 2.08, -0.38, { r: 0 }); for (const x of [-0.48, 0.48]) p.std.box(0.04, 2.1, 1.0, '#cfefff', x, 0.1, 0, { r: 0.01 }); p.std.box(1.0, 0.04, 0.04, MET, 0, 2.1, 0.48, { r: 0 }); p.std.box(0.5, 1.6, 0.02, '#ffd6e6', -0.22, 0.45, 0.48, { r: 0 }); } });
add({ id: 'bath_sink', name: 'Bath Sink', cat: 'bath', price: 60, fp: [0.8, 0.5], h: 0.9, c: 7,
  m: (p, c) => { p.std.box(0.8, 0.8, 0.5, c, 0, 0, 0, { r: 0.04 }); p.gloss.box(0.82, 0.08, 0.52, WH, 0, 0.8, 0, { r: 0.03 }); p.gloss.cyl(0.18, 0.14, 0.04, '#dff3ff', 0, 0.86, 0.02, { seg: 14 }); p.std.cyl(0.02, 0.02, 0.18, MET, 0, 0.88, -0.18, { seg: 6 }); } });
add({ id: 'bath_mat', name: 'Bath Mat', cat: 'bath', price: 15, place: 'rug', fp: [0.9, 0.6], h: 0.02, c: 5, m: (p, c) => { p.std.box(0.9, 0.025, 0.6, c, 0, 0, 0, { r: 0.01 }); p.std.box(0.7, 0.03, 0.4, WH, 0, 0, 0, { r: 0 }); } });
add({ id: 'mirror', name: 'Wall Mirror', cat: 'bath', price: 40, place: 'wall', fp: [0.8, 0.08], h: 1.0, y: 1.2, c: 2,
  m: (p, c) => { p.std.box(0.8, 1.0, 0.05, c, 0, 0, 0, { r: 0.1 }); p.gloss.box(0.66, 0.86, 0.02, '#e8f7ff', 0, 0.07, 0.03, { r: 0.08 }); } });
add({ id: 'towel_rack', name: 'Towel Rack', cat: 'bath', price: 25, place: 'wall', fp: [0.7, 0.12], h: 0.6, y: 1.0, c: 0,
  m: (p, c) => { p.std.cyl(0.02, 0.02, 0.7, MET, 0, 0.5, 0.06, { rz: Math.PI / 2, center: true }); p.std.box(0.3, 0.5, 0.04, c, -0.16, 0.02, 0.06, { r: 0.02 }); p.std.box(0.3, 0.5, 0.04, '#ffffff', 0.17, 0.02, 0.06, { r: 0.02 }); } });
add({ id: 'rubber_duck', name: 'Rubber Duck', cat: 'bath', price: 10, lvl: 2, place: 'surface', fp: [0.25, 0.25], h: 0.22,
  m: (p) => { p.std.sphere(0.1, '#ffd84a', 0, 0.08, 0, { sy: 0.7 }); p.std.sphere(0.065, '#ffd84a', 0, 0.18, 0.05); p.std.cone(0.03, 0.06, '#ff9a3d', 0, 0.17, 0.12, { rx: Math.PI / 2, center: true }); } });

// KIDS / PLAY
add({ id: 'toy_chest', name: 'Toy Chest', cat: 'kids', price: 60, fp: [0.9, 0.5], h: 0.55, top: 0.55, c: 5,
  m: (p, c) => { p.std.box(0.9, 0.5, 0.5, c, 0, 0, 0, { r: 0.05 }); p.std.box(0.94, 0.08, 0.54, shade(c, 0.9), 0, 0.48, 0, { r: 0.04 }); p.std.sphere(0.08, '#ffd45e', -0.2, 0.3, 0.26, { sz: 0.3 }); p.std.box(0.14, 0.14, 0.02, '#ff8fc0', 0.2, 0.2, 0.26, { r: 0.02 }); } });
add({ id: 'play_tent', name: 'Play Tent', cat: 'kids', price: 120, lvl: 2, fp: [1.4, 1.4], h: 1.7, c: 0,
  m: (p, c) => { p.std.cone(0.95, 1.6, c, 0, 0, 0, { seg: 6 }); p.std.cone(0.3, 0.4, shade(c, 1.15), 0, 1.5, 0, { seg: 6 }); p.std.box(0.6, 0.9, 0.05, '#4a3a5c', 0, 0, 0.62, { r: 0.1 }); p.std.cyl(0.02, 0.02, 0.3, '#ffd36b', 0, 1.6, 0, { seg: 6 }); } });
add({ id: 'dollhouse', name: 'Dollhouse', cat: 'kids', price: 180, lvl: 3, fp: [0.9, 0.5], h: 1.2, c: 0,
  m: (p, c) => { p.std.box(0.9, 0.8, 0.5, '#fff4e6', 0, 0, 0, { r: 0.03 }); p.std.cone(0.64, 0.4, c, 0, 0.8, 0, { seg: 4, ry: Math.PI / 4 }); for (const x of [-0.22, 0.22]) for (const y of [0.15, 0.48]) p.glow.box(0.18, 0.18, 0.02, '#fff0c2', x, y, 0.25, { r: 0.01 }); p.std.box(0.14, 0.26, 0.02, c, 0, 0, 0.25, { r: 0.02 }); } });
add({ id: 'easel', name: 'Art Easel', cat: 'kids', price: 90, lvl: 3, fp: [0.8, 0.6], h: 1.6,
  m: (p) => { for (const x of [-0.3, 0.3]) p.std.box(0.05, 1.6, 0.05, W2, x, 0, 0.1, { r: 0.01, rz: x > 0 ? 0.1 : -0.1 }); p.std.box(0.05, 1.5, 0.05, W2, 0, 0, -0.25, { r: 0.01, rx: -0.2 }); p.std.box(0.7, 0.55, 0.03, WH, 0, 0.75, 0.14, { r: 0.01 }); p.std.sphere(0.12, '#ff8fc0', -0.12, 1.05, 0.17, { sz: 0.1 }); p.std.sphere(0.1, '#7fc6ff', 0.12, 0.95, 0.17, { sz: 0.1 }); p.std.sphere(0.08, '#ffd45e', 0.02, 1.15, 0.17, { sz: 0.1 }); p.std.box(0.7, 0.04, 0.1, W2, 0, 0.72, 0.18, { r: 0.01 }); } });
add({ id: 'rocking_horse', name: 'Rocking Horse', cat: 'kids', price: 110, lvl: 4, fp: [1.0, 0.45], h: 0.95, c: 0, use: 'sit', seats: [[0, 0.1, 0]],
  m: (p, c) => { p.std.torus(0.55, 0.03, W2, 0, 0.6, -0.08, { arc: Math.PI, rx: Math.PI }); p.std.torus(0.55, 0.03, W2, 0, 0.6, 0.08, { arc: Math.PI, rx: Math.PI }); p.std.box(0.7, 0.28, 0.26, WH, 0, 0.42, 0, { r: 0.12 }); p.std.box(0.2, 0.36, 0.2, WH, 0.34, 0.6, 0, { r: 0.08, rz: -0.3 }); p.std.sphere(0.07, c, 0.3, 0.88, 0, { sx: 2 }); p.std.box(0.3, 0.06, 0.28, c, -0.05, 0.7, 0, { r: 0.03 }); } });
add({ id: 'teddy', name: 'Teddy Bear', cat: 'kids', price: 30, place: 'surface', fp: [0.35, 0.3], h: 0.45, c: 1,
  m: (p, c) => { const b = p.std; b.sphere(0.13, c, 0, 0.13, 0); b.sphere(0.11, c, 0, 0.32, 0.01); for (const s of [-1, 1]) { b.sphere(0.045, c, s * 0.08, 0.42, 0); b.sphere(0.05, c, s * 0.13, 0.15, 0.05); b.sphere(0.055, c, s * 0.07, 0.03, 0.08); } b.sphere(0.045, shade(c, 1.2), 0, 0.3, 0.1); b.sphere(0.015, DARK, 0, 0.32, 0.14); for (const s of [-1, 1]) b.sphere(0.015, DARK, s * 0.04, 0.36, 0.1); } });
add({ id: 'unicorn_plush', name: 'Unicorn Plush', cat: 'kids', price: 60, lvl: 5, place: 'surface', fp: [0.5, 0.3], h: 0.5,
  m: (p) => { const b = p.std; b.sphere(0.15, WH, 0, 0.16, 0, { sx: 1.4 }); b.sphere(0.11, WH, 0.18, 0.32, 0); b.cone(0.03, 0.14, '#ffd36b', 0.2, 0.4, 0, { seg: 6 }); for (let i = 0; i < 3; i++) b.sphere(0.05, ['#ff8fc0', '#b58cff', '#7fc6ff'][i], 0.08 - i * 0.06, 0.4 - i * 0.03, -0.04); for (const x of [-0.12, 0.12]) for (const z of [-0.07, 0.07]) b.cyl(0.035, 0.035, 0.1, WH, x, 0, z, { seg: 6 }); b.sphere(0.06, '#ff8fc0', -0.24, 0.2, 0); } });
add({ id: 'arcade', name: 'Arcade Machine', cat: 'kids', price: 450, lvl: 9, fp: [0.8, 0.7], h: 1.8, use: 'arcade', c: 6,
  m: (p, c) => { p.std.box(0.8, 1.8, 0.7, c, 0, 0, 0, { r: 0.05 }); p.std.box(0.7, 0.2, 0.4, shade(c, 0.85), 0, 0.95, 0.3, { r: 0.04, rx: 0.3 }); p.glowAlways.box(0.6, 0.45, 0.02, '#8fd8ff', 0, 1.2, 0.33, { r: 0 }); p.glowAlways.box(0.6, 0.14, 0.02, '#ff8fc0', 0, 1.65, 0.36, { r: 0 }); p.std.sphere(0.04, '#ff4f6d', -0.15, 1.08, 0.46); for (const x of [0.08, 0.18]) p.std.sphere(0.03, '#ffd45e', x, 1.06, 0.45); } });
add({ id: 'ball_pit', name: 'Ball Pit', cat: 'kids', price: 350, lvl: 7, fp: [1.8, 1.8], h: 0.6,
  m: (p) => { p.std.cyl(0.9, 0.9, 0.5, '#7fc6ff', 0, 0, 0, { seg: 24 }); p.std.torus(0.88, 0.08, '#ffffff', 0, 0.5, 0, { rx: Math.PI / 2, ts: 28 }); const cc = ['#ff8fc0', '#ffd45e', '#8fd66f', '#b58cff', '#ff6f6f']; for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 0.2 + (i % 5) * 0.13; p.std.sphere(0.1, cc[i % 5], Math.cos(a) * r, 0.52 + (i % 3) * 0.04, Math.sin(a) * r, { ws: 8, hs: 6 }); } } });

// PETS
add({ id: 'pet_bed', name: 'Pet Bed', cat: 'pets', price: 40, fp: [0.9, 0.9], h: 0.3, use: 'petbed', c: 0,
  m: (p, c) => { p.std.torus(0.34, 0.12, c, 0, 0.14, 0, { rx: Math.PI / 2, ts: 24 }); p.std.cyl(0.38, 0.4, 0.1, shade(c, 1.1), 0, 0, 0, { seg: 20 }); p.std.cyl(0.3, 0.3, 0.06, WH, 0, 0.08, 0, { seg: 20 }); } });
add({ id: 'food_bowl', name: 'Food Bowl', cat: 'pets', price: 20, fp: [0.45, 0.45], h: 0.15, use: 'food', c: 10,
  m: (p, c) => { p.std.cyl(0.18, 0.14, 0.1, c, 0, 0, 0, { seg: 16 }); for (let i = 0; i < 7; i++) p.std.sphere(0.04, '#b8825a', Math.cos(i) * 0.08, 0.1, Math.sin(i) * 0.08, { ws: 6, hs: 4 }); } });
add({ id: 'water_bowl', name: 'Water Bowl', cat: 'pets', price: 20, fp: [0.45, 0.45], h: 0.15, use: 'water', c: 5,
  m: (p, c) => { p.std.cyl(0.18, 0.14, 0.1, c, 0, 0, 0, { seg: 16 }); p.gloss.cyl(0.15, 0.15, 0.02, '#8fe3ff', 0, 0.08, 0, { seg: 16 }); } });
add({ id: 'cat_tree', name: 'Cat Tower', cat: 'pets', price: 140, lvl: 3, fp: [0.9, 0.9], h: 1.8, use: 'play', c: 8,
  m: (p, c) => { p.std.box(0.9, 0.08, 0.9, c, 0, 0, 0, { r: 0.03 }); p.std.cyl(0.08, 0.08, 1.6, '#e8d2a8', 0, 0.08, 0, { seg: 8 }); p.std.cyl(0.08, 0.08, 1.0, '#e8d2a8', 0.3, 0.08, 0.3, { seg: 8 }); for (const [y, x, z] of [[0.7, 0.2, 0.2], [1.1, -0.15, -0.1], [1.65, 0, 0]]) p.std.box(0.5, 0.08, 0.5, c, x, y, z, { r: 0.04 }); p.std.box(0.4, 0.35, 0.4, shade(c, 0.9), 0.2, 0.08, -0.2, { r: 0.08 }); p.std.sphere(0.06, '#ff8fc0', -0.3, 1.0, 0.1); } });
add({ id: 'pet_house', name: 'Pet House', cat: 'pets', price: 180, lvl: 4, fp: [1.2, 1.2], h: 1.4, use: 'petbed', c: 0,
  m: (p, c) => { p.std.box(1.0, 0.8, 1.0, '#fff4e6', 0, 0, 0, { r: 0.05 }); p.std.cone(0.85, 0.6, c, 0, 0.8, 0, { seg: 4, ry: Math.PI / 4 }); p.std.box(0.45, 0.5, 0.04, '#4a3a5c', 0, 0.05, 0.5, { r: 0.18 }); p.std.box(0.5, 0.14, 0.03, c, 0, 0.62, 0.51, { r: 0.03 }); } });
add({ id: 'toy_ball', name: 'Toy Ball', cat: 'pets', price: 15, fp: [0.35, 0.35], h: 0.3, use: 'play', c: 10,
  m: (p, c) => { p.std.sphere(0.15, c, 0, 0.15, 0); p.std.torus(0.15, 0.02, WH, 0, 0.15, 0, { ry: 0.5 }); } });
add({ id: 'pet_tub', name: 'Pet Bath', cat: 'pets', price: 90, lvl: 2, fp: [1.0, 0.7], h: 0.5, use: 'pettub', c: 5,
  m: (p, c) => { p.gloss.box(1.0, 0.4, 0.7, c, 0, 0.08, 0, { r: 0.15 }); p.gloss.box(0.84, 0.04, 0.54, '#a8e3ff', 0, 0.4, 0, { r: 0.05 }); for (let i = 0; i < 5; i++) p.std.sphere(0.07, WH, -0.3 + i * 0.15, 0.45, (i % 2) * 0.1 - 0.05); legs(p.std, 0.9, 0.6, 0.08, '#ffd36b'); } });
add({ id: 'fish_tank', name: 'Fish Tank', cat: 'pets', price: 260, lvl: 6, fp: [1.2, 0.5], h: 1.4,
  m: (p) => { p.std.box(1.2, 0.7, 0.5, W2, 0, 0, 0, { r: 0.04 }); p.glowAlways.box(1.1, 0.6, 0.42, '#6fd8e8', 0, 0.74, 0, { r: 0.03 }); p.std.box(1.2, 0.06, 0.5, DARK, 0, 1.34, 0, { r: 0.02 }); p.std.cone(0.08, 0.25, '#6fbf5a', -0.35, 0.74, 0, { seg: 5 }); p.std.cone(0.06, 0.2, '#6fbf5a', 0.4, 0.74, 0.05, { seg: 5 }); p.std.sphere(0.06, '#ff9a3d', 0.1, 1.05, 0.1, { sx: 1.6 }); p.std.sphere(0.05, '#ffd45e', -0.2, 0.95, -0.05, { sx: 1.6 }); } });

// GARDEN
add({ id: 'flower_bed', name: 'Flower Bed', cat: 'garden', price: 40, fp: [1.5, 0.8], h: 0.5, c: 0,
  m: (p) => { p.std.box(1.5, 0.25, 0.8, W2, 0, 0, 0, { r: 0.05 }); p.std.box(1.38, 0.22, 0.68, '#7a5140', 0, 0.06, 0, { r: 0.05 }); for (let i = 0; i < 4; i++) flowers(p.std, -0.55 + i * 0.37, 0.4, (i % 2) * 0.16 - 0.08, 0.1); } });
add({ id: 'hedge', name: 'Hedge', cat: 'garden', price: 25, fp: [1.5, 0.6], h: 1.1,
  m: (p) => { p.std.box(1.5, 1.0, 0.6, '#6fbe58', 0, 0.05, 0, { r: 0.25 }); p.std.box(1.4, 0.2, 0.5, '#82cc68', 0, 0.9, 0, { r: 0.1 }); } });
add({ id: 'small_tree', name: 'Little Tree', cat: 'garden', price: 50, fp: [1.2, 1.2], h: 3.0,
  m: (p) => { p.std.cyl(0.12, 0.16, 1.4, '#a0714f', 0, 0, 0, { seg: 7 }); p.std.ico(0.8, '#72c05a', 0, 1.9, 0, { detail: 1 }); p.std.ico(0.6, '#86cf68', 0.35, 2.3, 0.15, { detail: 1 }); p.std.ico(0.5, '#63b04f', -0.35, 2.1, -0.1, { detail: 1 }); } });
add({ id: 'blossom_tree', name: 'Blossom Tree', cat: 'garden', price: 120, lvl: 3, fp: [1.4, 1.4], h: 3.4,
  m: (p) => { p.std.cyl(0.13, 0.18, 1.5, '#8f6048', 0, 0, 0, { seg: 7 }); p.std.ico(0.9, '#ffb3d0', 0, 2.1, 0, { detail: 1 }); p.std.ico(0.65, '#ffc7de', 0.45, 2.5, 0.2, { detail: 1 }); p.std.ico(0.6, '#f79cc4', -0.4, 2.3, -0.15, { detail: 1 }); } });
add({ id: 'picnic_table', name: 'Picnic Table', cat: 'garden', price: 100, lvl: 2, fp: [2.0, 1.6], h: 0.78, top: 0.78, use: 'sit', seats: [[-0.5, 0.02, 0.62], [0.5, 0.02, 0.62]], c: 0,
  m: (p, c) => { p.std.box(1.9, 0.06, 0.8, W1, 0, 0.72, 0, { r: 0.02 }); for (const z of [-0.62, 0.62]) { p.std.box(1.9, 0.05, 0.3, W1, 0, 0.42, z, { r: 0.02 }); } for (const x of [-0.75, 0.75]) { p.std.box(0.06, 0.8, 0.06, W2, x, 0, -0.2, { r: 0.01, rx: 0.4 }); p.std.box(0.06, 0.8, 0.06, W2, x, 0, 0.2, { r: 0.01, rx: -0.4 }); } p.std.box(1.2, 0.01, 0.8, c, 0, 0.78, 0, { r: 0 }); } });
add({ id: 'swing_set', name: 'Swing Set', cat: 'garden', price: 220, lvl: 4, fp: [2.6, 1.4], h: 2.2, use: 'sit', seats: [[-0.55, 0.05, 0.05], [0.55, 0.05, 0.05]], c: 0,
  m: (p, c) => { for (const x of [-1.2, 1.2]) { p.std.box(0.08, 2.3, 0.08, W2, x, 0, -0.5, { r: 0.02, rx: 0.2 }); p.std.box(0.08, 2.3, 0.08, W2, x, 0, 0.5, { r: 0.02, rx: -0.2 }); } p.std.cyl(0.05, 0.05, 2.5, W2, 0, 2.15, 0, { rz: Math.PI / 2, center: true }); for (const x of [-0.55, 0.55]) { for (const dx of [-0.2, 0.2]) p.std.cyl(0.012, 0.012, 1.6, '#8a7a9a', x + dx, 0.55, 0, { seg: 4 }); p.std.box(0.5, 0.05, 0.25, c, x, 0.5, 0, { r: 0.02 }); } } });
add({ id: 'pool', name: 'Swimming Pool', cat: 'garden', price: 600, lvl: 8, place: 'rug', fp: [3.0, 2.0], h: 0.25,
  m: (p) => { p.std.box(3.0, 0.22, 2.0, WH, 0, 0, 0, { r: 0.08 }); p.glowAlways.box(2.6, 0.03, 1.6, '#6fd8f0', 0, 0.2, 0, { r: 0.02 }); p.std.torus(0.2, 0.07, '#ff8fc0', 0.7, 0.26, 0.3, { rx: Math.PI / 2 }); p.std.torus(0.16, 0.06, '#ffd45e', -0.6, 0.26, -0.3, { rx: Math.PI / 2 }); } });
add({ id: 'bbq', name: 'BBQ Grill', cat: 'garden', price: 150, lvl: 5, fp: [1.0, 0.6], h: 1.0, use: 'cook',
  m: (p) => { p.std.sphere(0.35, '#3a3446', 0, 0.8, 0, { sy: 0.6, sx: 1.2 }); legs(p.std, 0.7, 0.4, 0.72, '#3a3446', 0.05, 0.03); p.glow.box(0.6, 0.02, 0.3, '#ff7a45', 0, 0.84, 0, { r: 0 }); p.std.box(0.3, 0.04, 0.4, W1, 0.55, 0.72, 0, { r: 0.01 }); } });
add({ id: 'bird_bath', name: 'Bird Bath', cat: 'garden', price: 60, lvl: 3, fp: [0.7, 0.7], h: 0.95,
  m: (p) => { p.std.cyl(0.2, 0.25, 0.1, '#e0d6cc', 0, 0, 0, { seg: 12 }); p.std.cyl(0.08, 0.1, 0.7, '#e0d6cc', 0, 0.1, 0, { seg: 10 }); p.std.cyl(0.34, 0.2, 0.15, '#e0d6cc', 0, 0.78, 0, { seg: 16 }); p.gloss.cyl(0.3, 0.3, 0.02, '#8fe3ff', 0, 0.9, 0, { seg: 16 }); p.std.sphere(0.06, '#7fc6ff', 0.15, 0.98, 0, { sx: 1.4 }); } });
add({ id: 'sun_lounger', name: 'Sun Lounger', cat: 'garden', price: 90, lvl: 3, fp: [0.7, 1.9], h: 0.7, use: 'sleep', sleep: [0, 0.45, 0.2], c: 5,
  m: (p, c) => { p.std.box(0.65, 0.08, 1.3, WH, 0, 0.3, 0.3, { r: 0.03 }); p.std.box(0.65, 0.08, 0.7, WH, 0, 0.45, -0.55, { r: 0.03, rx: 0.6 }); p.std.box(0.6, 0.06, 1.25, c, 0, 0.36, 0.3, { r: 0.03 }); legs(p.std, 0.6, 1.7, 0.3, WH, 0.05, 0.03); } });
add({ id: 'garden_fountain', name: 'Garden Fountain', cat: 'garden', price: 300, lvl: 7, fp: [1.6, 1.6], h: 1.4,
  m: (p) => { p.std.cyl(0.8, 0.85, 0.35, '#e0d6cc', 0, 0, 0, { seg: 24 }); p.gloss.cyl(0.7, 0.7, 0.02, '#8fe3ff', 0, 0.33, 0, { seg: 24 }); p.std.cyl(0.12, 0.15, 0.8, '#e0d6cc', 0, 0.35, 0, { seg: 10 }); p.std.cyl(0.35, 0.12, 0.15, '#e0d6cc', 0, 1.1, 0, { seg: 14 }); p.gloss.cyl(0.3, 0.3, 0.02, '#8fe3ff', 0, 1.24, 0, { seg: 14 }); p.std.sphere(0.1, '#ffc6de', 0, 1.35, 0); } });
add({ id: 'white_fence', name: 'Picket Fence', cat: 'garden', price: 15, fp: [2.0, 0.2], h: 1.0, c: 7,
  m: (p, c) => { for (let x = -0.9; x <= 0.91; x += 0.3) { p.std.box(0.12, 0.85, 0.06, c, x, 0, 0, { r: 0.02 }); p.std.cone(0.085, 0.12, c, x, 0.85, 0, { seg: 4, ry: Math.PI / 4 }); } for (const y of [0.25, 0.6]) p.std.box(2.0, 0.08, 0.04, c, 0, y, -0.05, { r: 0.01 }); } });
add({ id: 'mailbox', name: 'Mailbox', cat: 'garden', price: 20, fp: [0.4, 0.5], h: 1.3, c: 10,
  m: (p, c) => { p.std.box(0.08, 1.0, 0.08, W2, 0, 0, 0, { r: 0.01 }); p.std.box(0.34, 0.3, 0.5, c, 0, 1.0, 0, { r: 0.14 }); p.std.box(0.03, 0.2, 0.08, '#ffd45e', 0.18, 1.15, -0.1, { r: 0 }); } });
add({ id: 'trampoline', name: 'Trampoline', cat: 'garden', price: 280, lvl: 6, fp: [2.2, 2.2], h: 0.7, use: 'bounce',
  m: (p) => { p.std.torus(1.0, 0.06, '#5b8def', 0, 0.62, 0, { rx: Math.PI / 2, ts: 28 }); p.std.cyl(0.95, 0.95, 0.02, '#3a3446', 0, 0.6, 0, { seg: 28 }); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; p.std.cyl(0.03, 0.03, 0.62, MET, Math.cos(a) * 0.98, 0, Math.sin(a) * 0.98, { seg: 6 }); } } });
add({ id: 'gnome', name: 'Garden Gnome', cat: 'garden', price: 25, lvl: 2, place: 'any', fp: [0.35, 0.35], h: 0.55,
  m: (p) => { p.std.cyl(0.12, 0.15, 0.22, '#5b8def', 0, 0, 0, { seg: 10 }); p.std.sphere(0.1, '#ffd9c0', 0, 0.3, 0); p.std.cone(0.11, 0.25, '#ff5d6f', 0, 0.35, 0, { seg: 10 }); p.std.sphere(0.08, WH, 0, 0.22, 0.07, { sy: 1.3 }); } });
add({ id: 'veggie_patch', name: 'Veggie Patch', cat: 'garden', price: 60, lvl: 3, fp: [1.6, 1.0], h: 0.4,
  m: (p) => { p.std.box(1.6, 0.2, 1.0, W2, 0, 0, 0, { r: 0.04 }); p.std.box(1.5, 0.18, 0.9, '#7a5140', 0, 0.05, 0, { r: 0.04 }); for (let i = 0; i < 6; i++) { const x = -0.55 + (i % 3) * 0.55, z = i < 3 ? -0.22 : 0.22; p.std.ico(0.12, '#6fbf5a', x, 0.3, z, { detail: 0 }); p.std.cone(0.05, 0.18, i % 2 ? '#ff9a3d' : '#ff5d5d', x + 0.1, 0.22, z, { seg: 6 }); } } });
add({ id: 'gazebo', name: 'Gazebo', cat: 'garden', price: 800, lvl: 10, fp: [3.0, 3.0], h: 3.3, c: 7,
  m: (p, c) => { p.std.cyl(1.5, 1.5, 0.15, '#e8ddd0', 0, 0, 0, { seg: 8 }); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; p.std.cyl(0.06, 0.06, 2.4, c, Math.cos(a) * 1.35, 0.15, Math.sin(a) * 1.35, { seg: 8 }); } p.std.cone(1.8, 1.0, '#ff9ac4', 0, 2.55, 0, { seg: 8 }); p.std.sphere(0.12, '#ffd36b', 0, 3.6, 0); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; p.glow.sphere(0.06, '#fff3b0', Math.cos(a) * 1.35, 2.45, Math.sin(a) * 1.35); } } });

// LIGHTS
add({ id: 'floor_lamp', name: 'Floor Lamp', cat: 'lights', price: 45, fp: [0.45, 0.45], h: 1.7, light: true, c: 2,
  m: (p, c) => { p.std.cyl(0.18, 0.2, 0.04, DARK, 0, 0, 0, { seg: 14 }); p.std.cyl(0.02, 0.02, 1.4, DARK, 0, 0.04, 0, { seg: 6 }); p.glow.cyl(0.14, 0.24, 0.3, c, 0, 1.4, 0, { seg: 16 }); } });
add({ id: 'table_lamp', name: 'Table Lamp', cat: 'lights', price: 30, place: 'surface', fp: [0.3, 0.3], h: 0.5, light: true, c: 0,
  m: (p, c) => { p.std.cyl(0.08, 0.1, 0.18, '#fff4e6', 0, 0, 0, { seg: 12 }); p.std.cyl(0.015, 0.015, 0.12, DARK, 0, 0.18, 0, { seg: 5 }); p.glow.cyl(0.09, 0.15, 0.18, c, 0, 0.28, 0, { seg: 14 }); } });
add({ id: 'fairy_lights', name: 'Fairy Lights', cat: 'lights', price: 60, lvl: 2, place: 'wall', fp: [1.6, 0.1], h: 0.4, y: 2.2, light: true,
  m: (p) => { const cc = ['#fff3b0', '#ffc6e0', '#c6f0ff', '#d9c7ff']; for (let i = 0; i < 12; i++) { const x = -0.75 + i * 0.136; const y = -Math.sin((i / 11) * Math.PI) * 0.25; p.glowAlways.sphere(0.035, cc[i % 4], x, y, 0.04); } for (let i = 0; i < 11; i++) { const x = -0.75 + (i + 0.5) * 0.136; p.std.box(0.14, 0.01, 0.01, '#6d8f6d', x, -Math.sin(((i + 0.5) / 11) * Math.PI) * 0.25, 0.03, { r: 0 }); } } });
add({ id: 'wall_sconce', name: 'Wall Light', cat: 'lights', price: 35, lvl: 2, place: 'wall', fp: [0.3, 0.2], h: 0.4, y: 1.8, light: true, c: 2,
  m: (p, c) => { p.std.box(0.14, 0.2, 0.04, '#ffd36b', 0, 0, 0, { r: 0.02 }); p.std.box(0.03, 0.03, 0.14, '#ffd36b', 0, 0.08, 0.08, { r: 0 }); p.glow.cyl(0.08, 0.11, 0.16, c, 0, 0.1, 0.15, { seg: 12 }); } });
add({ id: 'lava_lamp', name: 'Lava Lamp', cat: 'lights', price: 45, lvl: 4, place: 'surface', fp: [0.2, 0.2], h: 0.45, light: true, c: 6,
  m: (p, c) => { p.std.cyl(0.07, 0.09, 0.1, '#c9c3d1', 0, 0, 0, { seg: 10 }); p.glowAlways.cyl(0.05, 0.07, 0.25, c, 0, 0.1, 0, { seg: 10 }); p.std.cyl(0.03, 0.05, 0.06, '#c9c3d1', 0, 0.35, 0, { seg: 10 }); } });
add({ id: 'star_lamp', name: 'Star Lamp', cat: 'lights', price: 60, lvl: 5, place: 'surface', fp: [0.3, 0.2], h: 0.4, light: true,
  m: (p) => { p.glowAlways.cyl(0.16, 0.16, 0.06, '#ffe27a', 0, 0.2, 0, { seg: 5, rx: Math.PI / 2, center: true }); p.std.cyl(0.08, 0.1, 0.06, WH, 0, 0, 0, { seg: 10 }); p.std.cyl(0.015, 0.015, 0.1, WH, 0, 0.06, 0, { seg: 5 }); } });
add({ id: 'neon_heart', name: 'Neon Heart', cat: 'lights', price: 120, lvl: 6, place: 'wall', fp: [0.7, 0.1], h: 0.7, y: 1.6, light: true, c: 0,
  m: (p, c) => { p.glowAlways.torus(0.14, 0.025, c, -0.12, 0.1, 0.03, { arc: Math.PI * 1.25, rz: -0.2 }); p.glowAlways.torus(0.14, 0.025, c, 0.12, 0.1, 0.03, { arc: Math.PI * 1.25, rz: Math.PI - Math.PI * 0.25 + 0.2 }); p.glowAlways.box(0.03, 0.34, 0.03, c, -0.12, -0.26, 0.03, { r: 0, rz: 0.75 }); p.glowAlways.box(0.03, 0.34, 0.03, c, 0.12, -0.26, 0.03, { r: 0, rz: -0.75 }); } });
add({ id: 'garden_lamp', name: 'Garden Lamp', cat: 'lights', price: 40, fp: [0.3, 0.3], h: 1.3, light: true,
  m: (p) => { p.std.cyl(0.04, 0.05, 1.0, '#4f6a7a', 0, 0, 0, { seg: 6 }); p.glow.sphere(0.14, '#ffe9b0', 0, 1.12, 0); p.std.cone(0.16, 0.12, '#4f6a7a', 0, 1.22, 0, { seg: 8 }); } });
add({ id: 'candles', name: 'Candles', cat: 'lights', price: 20, lvl: 3, place: 'surface', fp: [0.3, 0.3], h: 0.25, light: true,
  m: (p) => { for (const [x, h] of [[-0.07, 0.14], [0.05, 0.2], [0.0, 0.1]]) { p.std.cyl(0.035, 0.035, h, '#fff4e6', x, 0, x * 0.5, { seg: 8 }); p.glowAlways.cone(0.02, 0.05, '#ffb347', x, h, x * 0.5, { seg: 5 }); } } });
add({ id: 'disco_ball', name: 'Disco Ball', cat: 'lights', price: 400, lvl: 10, fp: [0.6, 0.6], h: 2.2, light: true,
  m: (p) => { p.std.cyl(0.2, 0.25, 0.05, DARK, 0, 0, 0, { seg: 12 }); p.std.cyl(0.02, 0.02, 1.8, MET, 0, 0.05, 0, { seg: 5 }); p.metal.ico(0.25, '#e8e4f0', 0, 1.95, 0, { detail: 1 }); for (let i = 0; i < 6; i++) p.glowAlways.sphere(0.03, ['#ff8fc0', '#7fc6ff', '#ffd45e'][i % 3], Math.cos(i) * 0.26, 1.95 + Math.sin(i * 2) * 0.1, Math.sin(i) * 0.26); } });

// DECOR
add({ id: 'plant_small', name: 'Little Plant', cat: 'decor', price: 20, place: 'any', fp: [0.3, 0.3], h: 0.55, m: (p) => plant(p.std, 0, 0, 0, 0.9) });
add({ id: 'plant_big', name: 'Big Plant', cat: 'decor', price: 45, fp: [0.6, 0.6], h: 1.5,
  m: (p) => { p.std.cyl(0.24, 0.18, 0.45, '#fff4e6', 0, 0, 0, { seg: 14 }); for (let i = 0; i < 7; i++) { const a = i * 0.9; p.std.sphere(0.2, i % 2 ? '#6fbf5a' : '#5aa84a', Math.cos(a) * 0.18, 0.75 + (i % 3) * 0.22, Math.sin(a) * 0.18, { sy: 1.6, rz: Math.cos(a) * 0.5, rx: Math.sin(a) * 0.5 }); } } });
add({ id: 'cactus', name: 'Cactus', cat: 'decor', price: 15, place: 'any', fp: [0.25, 0.25], h: 0.4,
  m: (p) => { p.std.cyl(0.1, 0.08, 0.12, '#e8906b', 0, 0, 0, { seg: 10 }); p.std.sphere(0.08, '#6fbf5a', 0, 0.22, 0, { sy: 1.6 }); p.std.sphere(0.04, '#6fbf5a', 0.08, 0.26, 0, { sy: 1.4 }); p.std.sphere(0.03, '#ff8fc0', 0, 0.36, 0); } });
const painting = (id, name, price, lvl, draw) => add({ id, name, cat: 'decor', price, lvl, place: 'wall', fp: [0.9, 0.08], h: 0.7, y: 1.5, c: 2,
  m: (p, c) => { p.std.box(0.9, 0.7, 0.05, c, 0, 0, 0, { r: 0.02 }); p.std.box(0.76, 0.56, 0.02, WH, 0, 0.07, 0.03, { r: 0 }); draw(p.std); } });
painting('painting_flower', 'Flower Painting', 50, 1, (b) => { flowers(b, -0.1, 0.35, 0.05, 0.1); b.box(0.02, 0.2, 0.01, '#6fbf5a', -0.1, 0.12, 0.045, { r: 0 }); flowers(b, 0.15, 0.42, 0.05, 0.08, 5); });
painting('painting_sea', 'Sea Painting', 60, 2, (b) => { b.box(0.76, 0.26, 0.01, '#6fd8e8', 0, 0.07, 0.045, { r: 0 }); b.box(0.76, 0.3, 0.01, '#c6ecff', 0, 0.33, 0.045, { r: 0 }); b.sphere(0.07, '#ffd45e', 0.2, 0.48, 0.05, { sz: 0.2 }); b.box(0.2, 0.04, 0.01, '#fff', -0.15, 0.35, 0.05, { r: 0 }); });
painting('painting_cat', 'Kitty Portrait', 70, 3, (b) => { b.box(0.76, 0.56, 0.01, '#ffe0ef', 0, 0.07, 0.042, { r: 0 }); b.sphere(0.14, '#ffb38a', 0, 0.32, 0.05, { sz: 0.2 }); for (const s of [-1, 1]) { b.cone(0.05, 0.1, '#ffb38a', s * 0.09, 0.43, 0.05, { seg: 3 }); b.sphere(0.02, DARK, s * 0.05, 0.34, 0.08); } });
painting('painting_rainbow', 'Rainbow Art', 90, 5, (b) => { const rb = ['#ff8a8a', '#ffc27a', '#fff07a', '#8fe39a', '#8fc8ff', '#c6a6ff']; rb.forEach((c, i) => b.torus(0.26 - i * 0.035, 0.016, c, 0, 0.18, 0.05, { arc: Math.PI, ts: 16 })); });
add({ id: 'wall_clock', name: 'Wall Clock', cat: 'decor', price: 40, place: 'wall', fp: [0.5, 0.08], h: 0.5, y: 1.9, c: 0,
  m: (p, c) => { p.std.cyl(0.24, 0.24, 0.06, c, 0, 0.24, 0, { seg: 24, rx: Math.PI / 2, center: true }); p.std.cyl(0.2, 0.2, 0.02, WH, 0, 0.24, 0.035, { seg: 24, rx: Math.PI / 2, center: true }); p.std.box(0.015, 0.14, 0.01, DARK, 0, 0.3, 0.05, { r: 0 }); p.std.box(0.1, 0.015, 0.01, DARK, 0.04, 0.24, 0.05, { r: 0 }); } });
add({ id: 'vase_flowers', name: 'Flower Vase', cat: 'decor', price: 25, place: 'any', fp: [0.3, 0.3], h: 0.5, c: 5,
  m: (p, c) => { p.gloss.cyl(0.07, 0.1, 0.24, c, 0, 0, 0, { seg: 12 }); flowers(p.std, 0, 0.36, 0, 0.08); } });
add({ id: 'books', name: 'Book Stack', cat: 'decor', price: 15, place: 'surface', fp: [0.3, 0.25], h: 0.2,
  m: (p) => { const cc = ['#ff8fc0', '#7fc6ff', '#ffd45e']; cc.forEach((c, i) => p.std.box(0.26 - i * 0.02, 0.05, 0.2, c, 0, i * 0.055, 0, { r: 0.01, ry: i * 0.2 })); } });
add({ id: 'photo_frame', name: 'Photo Frame', cat: 'decor', price: 20, place: 'surface', fp: [0.25, 0.15], h: 0.25, c: 2,
  m: (p, c) => { p.std.box(0.22, 0.26, 0.03, c, 0, 0, 0, { r: 0.01, rx: -0.2 }); p.std.box(0.16, 0.2, 0.01, '#ffe0ef', 0, 0.03, 0.02, { r: 0, rx: -0.2 }); p.std.sphere(0.04, '#ffb38a', 0, 0.14, 0.03, { sz: 0.3 }); } });
add({ id: 'globe', name: 'Globe', cat: 'decor', price: 40, lvl: 3, place: 'surface', fp: [0.3, 0.3], h: 0.45,
  m: (p) => { p.std.cyl(0.08, 0.1, 0.04, W2, 0, 0, 0, { seg: 10 }); p.std.cyl(0.015, 0.015, 0.16, '#ffd36b', 0, 0.04, 0, { seg: 5 }); p.std.sphere(0.15, '#7fc6ff', 0, 0.3, 0); p.std.sphere(0.07, '#8fd66f', 0.08, 0.35, 0.08); p.std.sphere(0.06, '#8fd66f', -0.08, 0.25, 0.09); } });
add({ id: 'mirror_big', name: 'Tall Mirror', cat: 'decor', price: 90, lvl: 3, fp: [0.8, 0.35], h: 1.9, c: 2,
  m: (p, c) => { p.std.box(0.75, 1.8, 0.06, c, 0, 0.1, 0, { r: 0.08, rx: -0.1 }); p.gloss.box(0.62, 1.66, 0.02, '#e8f7ff', 0, 0.17, 0.04, { r: 0.06, rx: -0.1 }); p.std.box(0.06, 1.0, 0.06, c, 0, 0, -0.28, { r: 0.02, rx: 0.4 }); } });
add({ id: 'balloons', name: 'Balloons', cat: 'decor', price: 30, lvl: 2, fp: [0.5, 0.5], h: 2.1,
  m: (p) => { const cc = ['#ff8fc0', '#7fc6ff', '#ffd45e', '#b58cff']; p.std.box(0.14, 0.1, 0.14, '#ffd36b', 0, 0, 0, { r: 0.03 }); cc.forEach((c, i) => { const x = Math.cos(i * 1.6) * 0.18, z = Math.sin(i * 1.6) * 0.18; p.gloss.sphere(0.17, c, x, 1.7 + (i % 2) * 0.2, z, { sy: 1.2 }); p.std.box(0.008, 1.5, 0.008, '#ffffff', x * 0.5, 0.1, z * 0.5, { r: 0 }); }); } });
add({ id: 'floor_cushion', name: 'Floor Cushion', cat: 'decor', price: 20, fp: [0.6, 0.6], h: 0.2, use: 'sit', seats: [[0, -0.5, 0]], c: 0,
  m: (p, c) => { p.std.box(0.6, 0.16, 0.6, c, 0, 0, 0, { r: 0.08 }); p.std.sphere(0.04, WH, 0, 0.16, 0); } });
add({ id: 'curtains', name: 'Curtains', cat: 'decor', price: 50, lvl: 2, place: 'wall', fp: [1.4, 0.15], h: 2.0, y: 0.6, c: 0,
  m: (p, c) => { p.std.cyl(0.02, 0.02, 1.6, '#ffd36b', 0, 1.95, 0.08, { rz: Math.PI / 2, center: true }); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) p.std.box(0.14, 1.9, 0.06, i % 2 ? shade(c, 0.92) : c, s * (0.62 - i * 0.12), 0.02, 0.08, { r: 0.05 }); } });
add({ id: 'rug_star', name: 'Star Rug', cat: 'decor', price: 60, lvl: 5, place: 'rug', fp: [1.8, 1.8], h: 0.02, c: 2,
  m: (p, c) => { p.std.cyl(0.9, 0.9, 0.02, c, 0, 0, 0, { seg: 5 }); p.std.cyl(0.55, 0.55, 0.025, shade(c, 1.1), 0, 0, 0, { seg: 5, ry: Math.PI / 5 }); } });
add({ id: 'rug_heart', name: 'Heart Rug', cat: 'decor', price: 60, lvl: 4, place: 'rug', fp: [1.6, 1.4], h: 0.02, c: 0,
  m: (p, c) => { p.std.cyl(0.42, 0.42, 0.02, c, -0.3, 0, -0.2, { seg: 20 }); p.std.cyl(0.42, 0.42, 0.02, c, 0.3, 0, -0.2, { seg: 20 }); p.std.cyl(0.6, 0.6, 0.02, c, 0, 0, 0.12, { seg: 4, ry: Math.PI / 4 }); } });
add({ id: 'aquarium_big', name: 'Big Aquarium', cat: 'decor', price: 1500, lvl: 14, fp: [2.0, 0.6], h: 1.8,
  m: (p) => { p.std.box(2.0, 0.6, 0.6, W3, 0, 0, 0, { r: 0.04 }); p.glowAlways.box(1.9, 1.1, 0.5, '#58c8e8', 0, 0.62, 0, { r: 0.04 }); p.std.box(2.0, 0.08, 0.6, W3, 0, 1.72, 0, { r: 0.02 }); const fc = ['#ff9a3d', '#ffd45e', '#ff8fc0', '#b58cff', '#7fffd4']; for (let i = 0; i < 8; i++) p.std.sphere(0.07, fc[i % 5], -0.8 + i * 0.22, 0.85 + (i % 3) * 0.25, (i % 2) * 0.1, { sx: 1.6 }); for (let i = 0; i < 5; i++) p.std.cone(0.08, 0.3 + (i % 2) * 0.2, '#6fbf5a', -0.8 + i * 0.4, 0.62, -0.1, { seg: 5 }); } });

// SPECIAL (unlocked by adventures)
add({ id: 'crystal_lamp', name: 'Crystal Lamp', cat: 'special', price: 500, unlock: 'cave', fp: [0.5, 0.5], h: 1.0, light: true,
  m: (p) => { p.std.cyl(0.2, 0.24, 0.1, '#8f86a8', 0, 0, 0, { seg: 8 }); p.glowAlways.cone(0.12, 0.7, '#ff9ad5', 0, 0.1, 0, { seg: 5 }); p.glowAlways.cone(0.08, 0.45, '#8fe8ff', 0.12, 0.08, 0.05, { seg: 5, rz: -0.3 }); p.glowAlways.cone(0.07, 0.4, '#c7a6ff', -0.12, 0.08, -0.03, { seg: 5, rz: 0.3 }); } });
add({ id: 'crystal_cluster', name: 'Crystal Cluster', cat: 'special', price: 400, unlock: 'cave', fp: [0.9, 0.9], h: 1.2,
  m: (p) => { p.std.ico(0.35, '#8f86a8', 0, 0.1, 0, { detail: 0, sy: 0.5 }); const cc = ['#ff9ad5', '#8fe8ff', '#c7a6ff', '#fff3a8']; for (let i = 0; i < 7; i++) { const a = i * 0.9; p.glowAlways.cone(0.1 + (i % 3) * 0.03, 0.5 + (i % 3) * 0.3, cc[i % 4], Math.cos(a) * 0.2, 0.1, Math.sin(a) * 0.2, { seg: 5, rx: Math.sin(a) * 0.4, rz: -Math.cos(a) * 0.4 }); } } });
add({ id: 'cloud_bed', name: 'Cloud Bed', cat: 'special', price: 1200, unlock: 'sky', fp: [1.8, 2.2], h: 1.0, use: 'sleep', sleep: [0, 0.65, 0.1],
  m: (p) => { for (let i = 0; i < 9; i++) p.std.ico(0.45, WH, -0.6 + (i % 3) * 0.6, 0.35, -0.7 + Math.floor(i / 3) * 0.7, { detail: 1, sy: 0.6 }); p.std.box(1.6, 0.14, 1.4, '#e6d9ff', 0, 0.5, 0.3, { r: 0.07 }); for (const x of [-0.4, 0.4]) cushion(p.std, 0.6, 0.14, 0.34, '#fff3b0', x, 0.58, -0.75); for (let i = 0; i < 5; i++) p.glowAlways.sphere(0.05, '#fff3a8', -0.8 + i * 0.4, 1.0 + (i % 2) * 0.2, -1.0); } });
add({ id: 'rainbow_arch', name: 'Rainbow Arch', cat: 'special', price: 900, unlock: 'sky', fp: [2.4, 0.4], h: 1.4,
  m: (p) => { const rb = ['#ff8a8a', '#ffc27a', '#fff07a', '#8fe39a', '#8fc8ff', '#c6a6ff']; rb.forEach((c, i) => p.glowAlways.torus(1.15 - i * 0.12, 0.06, c, 0, 0, 0, { arc: Math.PI, ts: 24 })); for (const x of [-1.05, 1.05]) p.std.ico(0.3, WH, x, 0.1, 0, { detail: 1 }); } });
add({ id: 'star_projector', name: 'Star Projector', cat: 'special', price: 700, lvl: 12, place: 'surface', fp: [0.3, 0.3], h: 0.35, light: true,
  m: (p) => { p.std.cyl(0.1, 0.12, 0.06, '#3a3446', 0, 0, 0, { seg: 12 }); p.glowAlways.ico(0.12, '#c6b8ff', 0, 0.18, 0, { detail: 1 }); for (let i = 0; i < 5; i++) p.glowAlways.sphere(0.02, '#fff3a8', Math.cos(i * 1.3) * 0.12, 0.2 + Math.sin(i) * 0.08, Math.sin(i * 1.3) * 0.12); } });
add({ id: 'throne', name: 'Royal Throne', cat: 'special', price: 1500, lvl: 15, fp: [1.0, 0.9], h: 2.0, use: 'sit', seats: [[0, 0.15, 0.2]], c: 10,
  m: (p, c) => { p.std.box(1.0, 0.45, 0.9, '#ffd36b', 0, 0, 0, { r: 0.06 }); cushion(p.std, 0.8, 0.14, 0.7, c, 0, 0.45, 0.05); p.std.box(1.0, 1.5, 0.2, '#ffd36b', 0, 0.45, -0.35, { r: 0.08 }); p.std.box(0.76, 1.2, 0.08, c, 0, 0.55, -0.24, { r: 0.08 }); for (const x of [-0.35, 0, 0.35]) p.std.sphere(0.07, '#ff6fb0', x, 2.0, -0.35); for (const x of [-0.45, 0.45]) p.std.box(0.14, 0.4, 0.9, '#ffd36b', x, 0.45, 0, { r: 0.05 }); } });
add({ id: 'castle_bed', name: 'Castle Bed', cat: 'special', price: 2500, lvl: 18, fp: [2.0, 2.4], h: 2.6, use: 'sleep', sleep: [0, 0.65, 0.2], c: 0,
  m: bed(2.0, 2.4, 1.4, (p, c) => { for (const x of [-0.95, 0.95]) { p.std.cyl(0.18, 0.18, 2.2, '#fff1f8', x, 0, -1.1, { seg: 12 }); p.std.cone(0.26, 0.5, c, x, 2.2, -1.1, { seg: 12 }); } p.std.box(1.7, 0.4, 0.14, '#fff1f8', 0, 1.35, -1.12, { r: 0.04 }); for (let i = 0; i < 4; i++) p.std.box(0.22, 0.2, 0.14, '#fff1f8', -0.6 + i * 0.4, 1.75, -1.12, { r: 0.02 }); }) });
add({ id: 'golden_statue', name: 'Golden Pet Statue', cat: 'special', price: 3000, lvl: 20, fp: [1.0, 1.0], h: 1.8,
  m: (p) => { p.std.box(0.9, 0.5, 0.9, '#f3ece4', 0, 0, 0, { r: 0.05 }); p.metal.sphere(0.35, '#ffcf4a', 0, 0.85, 0, { sx: 1.1 }); p.metal.sphere(0.25, '#ffcf4a', 0, 1.35, 0.15); for (const s of [-1, 1]) p.metal.cone(0.08, 0.2, '#ffcf4a', s * 0.14, 1.55, 0.12, { seg: 6 }); } });
add({ id: 'festival_trophy', name: 'Festival Trophy', cat: 'special', price: 0, unlock: 'festival', place: 'any', fp: [0.4, 0.4], h: 0.7,
  m: (p) => { p.std.box(0.3, 0.12, 0.3, '#8a5a3c', 0, 0, 0, { r: 0.02 }); p.metal.cyl(0.04, 0.06, 0.2, '#ffcf4a', 0, 0.12, 0, { seg: 8 }); p.metal.cyl(0.16, 0.08, 0.26, '#ffcf4a', 0, 0.32, 0, { seg: 14 }); for (const s of [-1, 1]) p.metal.torus(0.06, 0.015, '#ffcf4a', s * 0.17, 0.46, 0, { ry: Math.PI / 2 }); } });

export const FURNITURE = L;
export const FURN = Object.fromEntries(L.map((f) => [f.id, f]));

// rotated footprint (r = quarter turns)
export function footprint(item, r) {
  const [w, d] = item.fp;
  return r % 2 ? [d, w] : [w, d];
}
