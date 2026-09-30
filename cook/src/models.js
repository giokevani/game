// Procedural food + cookware models. Every model is built from primitives and
// merged into one vertex-coloured mesh (see src/engine/builder.js).
import * as THREE from 'three';
import { Builder, Geo, shade, mix } from '../../src/engine/builder.js';
import { M } from '../../src/engine/materials.js';
import { CHOP } from './data.js';

export const FOOD = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0 });
export const LIQ = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.12, metalness: 0 });
export const GLASS = new THREE.MeshStandardMaterial({ color: 0xe8f6ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35, depthWrite: false });

// item colours (liquids, powders, spreads, generic fallbacks)
export const COL = {
  flour: '#fbf3e4', egg: '#ffcf3f', milk: '#ffffff', sugar: '#fffdf6', butter: '#ffe27a', icecream: '#fff4e2', chocolate: '#6b3f2a',
  strawberry: '#ff5f7e', banana: '#ffe57a', blueberry: '#5a5ad0', vanilla: '#fff0c4', pasta: '#ffd772', sauce: '#e2412f', cream: '#fff6ea',
  jam: '#d8264b', ketchup: '#d8231f', mustard: '#f5c31a', rice: '#fbfbf4', batter: '#ffe6a8', apple: '#fff1c8', orange: '#ffad3a',
  pink: '#ff9ccc', white: '#fffaf5', blue: '#8fd0ff', yellow: '#ffe066', purple: '#c7a2ff', cheese: '#ffd24d', miso: '#d9a45a',
  tomato: '#e8453c', lettuce: '#7cc45a', onion: '#f3e6d0', cucumber: '#5fae5a', avocado: '#9fd06a', salmon: '#ff8a5a', pepper: '#4fbf5a',
  mushroom: '#e8d6c0', olive: '#3a3a2a', sausage: '#c0504a', tofu: '#fbf6ea', potato: '#ffe8a3', carrot: '#ff8a2e', lemon: '#ffe04a',
  sprinkles: '#ff6fb5', cherry: '#e8203a', salt: '#ffffff', nori: '#1f3a2a', candle: '#8fd0ff', bread: '#e0a868', dough: '#f6ddb0',
};
export const col = (id) => COL[id] || '#cccccc';

function prep(g) {
  if (g.attributes.uv) g.deleteAttribute('uv');
  if (g.index) g = g.toNonIndexed();
  return g;
}
export function meshOf(b, mat = M.std, o = {}) {
  const m = new THREE.Mesh(b.build({ ao: o.ao ?? 0.12, aoHeight: o.aoHeight ?? 0.2, aoBase: o.aoBase ?? 0 }), mat);
  m.castShadow = true;
  m.receiveShadow = o.receive ?? true;
  return m;
}

// ---------- radius profiles along the cutting axis ----------
function profileFn(p) {
  if (p.shape === 'round') {
    const R = p.r;
    return { a: -R, b: R, r: (y) => R * Math.sqrt(Math.max(0, 1 - (y / R) ** 2)) };
  }
  if (p.shape === 'leaf') {
    const R = p.r;
    return { a: -R, b: R, r: (y) => R * Math.sqrt(Math.max(0, 1 - (y / R) ** 2)) * (0.9 + 0.1 * Math.cos(y * 60)) };
  }
  const L = p.len, R = p.r, taper = p.taper || 0;
  return {
    a: -L / 2, b: L / 2,
    r: (y) => {
      let r = R * (1 - taper * (y + L / 2) / L);
      const e = Math.abs(y) - (L / 2 - R);
      if (e > 0 && !p.flat) r *= Math.sqrt(Math.max(0, 1 - (e / R) ** 2));
      return r;
    },
  };
}

// one lathe piece between a and b along x, with inner-coloured cut faces
function lathePiece(b, pf, a0, b0, p, capA, capB) {
  const n = Math.max(3, Math.ceil((b0 - a0) / 0.012));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const y = a0 + (b0 - a0) * (i / n);
    pts.push(new THREE.Vector2(Math.max(0.0005, pf.r(y)), y));
  }
  const g = prep(new THREE.LatheGeometry(pts, 18));
  g.rotateZ(-Math.PI / 2);
  b.add(g, p.skin);
  const cap = (y, dir) => {
    const r = pf.r(y);
    if (r < 0.004) return;
    const off = dir * 0.0008;
    b.add(prep(new THREE.CircleGeometry(r * 0.985, 18)), p.inner, y + off, 0, 0, 0, dir * Math.PI / 2, 0);
    if (p.rings) {
      for (let k = 1; k <= 3; k++) b.add(prep(new THREE.RingGeometry(r * (0.22 * k), r * (0.22 * k + 0.05), 18)), shade(p.inner, 0.9), y + off * 2, 0, 0, 0, dir * Math.PI / 2, 0);
    } else if (p.dots || p.core) {
      b.add(prep(new THREE.CircleGeometry(r * (p.coreR || 0.55), 14)), p.core || p.dots, y + off * 2, 0, 0, 0, dir * Math.PI / 2, 0);
    }
  };
  if (capA) cap(a0, -1);
  if (capB) cap(b0, 1);
}

// Build an ingredient ready for chopping: returns { group, pieces, cuts, half, depth }
export function choppable(id, override) {
  const p = { ...(CHOP[id] || { shape: 'round', r: 0.07, skin: col(id), inner: shade(col(id), 1.2), cuts: 3 }), ...(override || {}) };
  const group = new THREE.Group();
  const pieces = [];
  const cuts = [];
  if (p.shape === 'box') {
    const n = p.cuts + 1;
    for (let i = 0; i < n; i++) {
      const a = -p.w / 2 + (p.w * i) / n, bb = -p.w / 2 + (p.w * (i + 1)) / n;
      const w = bb - a;
      const b = new Builder();
      b.cbox(w, p.h, p.d, p.skin, 0, p.h / 2, 0, { r: Math.min(0.012, w * 0.2) });
      for (const s of [-1, 1]) {
        const inner = (s < 0 && i > 0) || (s > 0 && i < n - 1);
        if (inner) b.cbox(0.002, p.h * 0.84, p.d * 0.86, p.inner, s * (w / 2 + 0.0008), p.h * 0.46, 0, { r: 0 });
      }
      if (id === 'salmon') for (let k = 0; k < 2; k++) b.cbox(w * 0.9, 0.004, 0.006, '#ffe2d0', 0, p.h + 0.001, -0.02 + k * 0.04, { r: 0 });
      const m = meshOf(b, FOOD);
      m.position.x = (a + bb) / 2;
      group.add(m);
      pieces.push(m);
      if (i > 0) cuts.push(a);
    }
    return { group, pieces, cuts, half: p.w / 2, depth: p.d, height: p.h, p };
  }
  const pf = profileFn(p);
  const n = p.cuts + 1;
  const span = pf.b - pf.a;
  const lift = p.shape === 'round' || p.shape === 'leaf' ? p.r * (p.sy || 1) : p.r;
  for (let i = 0; i < n; i++) {
    const a = pf.a + (span * i) / n, bb = pf.a + (span * (i + 1)) / n;
    const b = new Builder();
    lathePiece(b, pf, a, bb, p, i > 0 || p.flat, i < n - 1 || p.flat);
    // stems and leaves on the right piece
    if (i === Math.floor(n / 2) && ['tomato', 'apple', 'orange', 'pepper'].includes(id)) {
      b.cyl(0.006, 0.008, 0.035, id === 'pepper' ? '#3f8a3a' : '#6b4a2a', 0, lift / (p.sy || 1) - 0.005, 0);
      if (id !== 'apple') b.cone(0.03, 0.01, '#3f9a4a', 0, lift / (p.sy || 1) - 0.008, 0, { seg: 5 });
      else b.sphere(0.022, '#5fbf4a', 0.02, lift - 0.002, 0, { sy: 0.3, sx: 1.6 });
    }
    if (i === 0 && id === 'carrot') for (let k = -1; k <= 1; k++) b.cone(0.012, 0.09, '#4fae4a', pf.a - 0.03, 0, k * 0.012, { rz: Math.PI / 2 + k * 0.3, center: true });
    if (i === n - 1 && id === 'strawberry') b.cone(0.045, 0.012, '#3f9a4a', pf.b - 0.004, 0, 0, { seg: 6, rz: -Math.PI / 2, center: true });
    if (id === 'strawberry') for (let k = 0; k < 6; k++) {
      const y = a + (bb - a) * ((k % 3) + 0.5) / 3; const ang = k * 1.9 + i;
      const r = pf.r(y) * 1.0;
      if (r > 0.01) b.sphere(0.0045, '#ffe08a', y, Math.cos(ang) * r, Math.sin(ang) * r);
    }
    const m = meshOf(b, FOOD, { ao: 0 });
    const mid = (a + bb) / 2;
    m.geometry.translate(-mid, 0, 0);
    m.position.x = mid;
    const holder = new THREE.Group();
    holder.add(m);
    holder.scale.set(1, p.sy || 1, p.sz || 1);
    holder.position.y = lift;
    group.add(holder);
    pieces.push(holder);
    if (i > 0) cuts.push(a);
    m.position.x = 0;
    holder.position.x = mid;
  }
  return { group, pieces, cuts, half: span / 2, depth: 2 * p.r * (p.sz || 1), height: lift * 2, p };
}

// a single slice/piece lying flat with its cut face up (toppings, burger layers)
const sliceCache = new Map();
export function sliceMesh(id, size = 1) {
  const key = id + size;
  let geo = sliceCache.get(key);
  if (!geo) {
    const b = new Builder();
    const p = CHOP[id];
    if (id === 'cheese') b.cbox(0.13 * size, 0.012, 0.13 * size, col('cheese'), 0, 0.006, 0, { r: 0.004 });
    else if (id === 'olive') { b.torus(0.018, 0.008, '#2e2e22', 0, 0.006, 0, { rx: Math.PI / 2, ts: 12, rs: 6 }); }
    else if (id === 'blueberry') { b.sphere(0.022, '#4a4ab8', 0, 0.02, 0); b.cone(0.008, 0.004, '#2e2e70', 0, 0.04, 0, { seg: 5 }); }
    else if (id === 'cherry') { b.sphere(0.03, col('cherry'), 0, 0.03, 0); b.cyl(0.002, 0.002, 0.05, '#4a7a2a', 0.005, 0.055, 0, { rz: 0.3 }); }
    else if (id === 'candle') {
      b.cyl(0.008, 0.008, 0.09, '#8fd0ff', 0, 0, 0); for (let k = 0; k < 3; k++) b.cyl(0.0085, 0.0085, 0.008, '#ffffff', 0, 0.015 + k * 0.028, 0);
      b.sphere(0.012, '#ffb830', 0, 0.105, 0, { sy: 1.6 });
    } else if (id === 'sprinkles') {
      const cs = ['#ff6fb5', '#7fc6ff', '#ffe066', '#8fe39a', '#c7a2ff'];
      for (let k = 0; k < 9; k++) { const a = k * 2.4, r = 0.012 + (k % 3) * 0.012; b.cbox(0.014, 0.004, 0.004, cs[k % 5], Math.cos(a) * r, 0.003, Math.sin(a) * r, { ry: a * 1.7, r: 0 }); }
    } else if (id === 'chocolate') { b.cone(0.012, 0.014, '#5a3322', 0, 0, 0, { seg: 8 }); }
    else if (id === 'nori') { b.cbox(0.07, 0.004, 0.12, col('nori'), 0, 0.002, 0, { r: 0 }); }
    else if (id === 'salt') { for (let k = 0; k < 5; k++) b.cbox(0.004, 0.004, 0.004, '#ffffff', (k - 2) * 0.01, 0.002, ((k * 7) % 5 - 2) * 0.008, { r: 0 }); }
    else if (id === 'lettuce') {
      for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2; b.sphere(0.035 * size, k % 2 ? '#8fd46a' : '#6fbf4a', Math.cos(a) * 0.05 * size, 0.008 + (k % 2) * 0.004, Math.sin(a) * 0.05 * size, { sy: 0.18 }); }
      b.sphere(0.055 * size, '#9bdc72', 0, 0.01, 0, { sy: 0.15 });
    } else if (id === 'patty') {
      b.cyl(0.075 * size, 0.075 * size, 0.028, '#7a4a2e', 0, 0, 0, { seg: 18 });
      for (let k = 0; k < 3; k++) b.cbox(0.13 * size, 0.003, 0.008, '#4a2a18', 0, 0.028, -0.03 + k * 0.03, { r: 0 });
    } else if (p) {
      // a thin slice through the middle of the whole ingredient
      const pf = profileFn(p);
      const r = p.shape === 'box' ? 0 : pf.r(0);
      if (p.shape === 'box') b.cbox(0.02, p.h, p.d, p.skin, 0, 0, 0, { r: 0.004 });
      else {
        const t = 0.014;
        b.cyl(r, r, t, p.skin, 0, 0, 0, { seg: 18, center: true });
        b.cyl(r * 0.94, r * 0.94, t + 0.002, p.inner, 0, 0, 0, { seg: 18, center: true });
        if (p.rings) for (let k = 1; k <= 3; k++) b.torus(r * 0.24 * k, 0.003, shade(p.inner, 0.88), 0, t / 2 + 0.001, 0, { rx: Math.PI / 2, ts: 18, rs: 4 });
        else if (p.dots || p.core) b.cyl(r * (p.coreR || 0.5), r * (p.coreR || 0.5), t + 0.004, p.core || p.dots, 0, 0, 0, { seg: 14, center: true });
      }
      const g = b.build({ ao: 0 });
      if (p.shape !== 'box') g.scale(size * (p.sz || 1), 1, size * (p.sy || 1));
      sliceCache.set(key, g);
      geo = g;
    } else b.sphere(0.03, col(id), 0, 0.02, 0);
    if (!geo) { geo = b.build({ ao: 0 }); sliceCache.set(key, geo); }
  }
  const m = new THREE.Mesh(geo, FOOD);
  m.castShadow = true;
  return m;
}

// whole ingredients (for the "add" tray drop animation)
export function wholeModel(id) {
  const b = new Builder();
  switch (id) {
    case 'egg': b.sphere(0.04, '#fff3e0', 0, 0.045, 0, { sy: 1.3 }); break;
    case 'milk': b.box(0.07, 0.13, 0.07, '#ffffff', 0, 0, 0, { r: 0.01 }); b.box(0.072, 0.04, 0.072, '#7fc6ff', 0, 0.05, 0, { r: 0.004 }); b.cone(0.05, 0.03, '#ffffff', 0, 0.13, 0, { seg: 4 }); break;
    case 'flour': case 'sugar': b.box(0.1, 0.12, 0.06, id === 'flour' ? '#f3e2c6' : '#ffe0ec', 0, 0, 0, { r: 0.02 }); b.cbox(0.06, 0.03, 0.062, '#ffffff', 0, 0.06, 0, { r: 0.01 }); break;
    case 'butter': b.box(0.1, 0.04, 0.05, col('butter'), 0, 0, 0, { r: 0.008 }); break;
    case 'icecream': b.sphere(0.05, col('icecream'), 0, 0.05, 0); break;
    case 'chocolate': b.box(0.09, 0.02, 0.05, col('chocolate'), 0, 0, 0, { r: 0.004 }); break;
    case 'vanilla': b.cyl(0.006, 0.006, 0.14, '#3a2418', 0, 0, 0, { rz: 1.3 }); b.sphere(0.03, '#fff0c4', 0, 0.03, 0); break;
    case 'pasta': for (let k = 0; k < 8; k++) b.cyl(0.003, 0.003, 0.14, col('pasta'), (k - 4) * 0.007, 0.01, 0, { rz: Math.PI / 2 - 0.1 + k * 0.02 }); break;
    case 'sauce': case 'cream': b.cyl(0.05, 0.04, 0.06, id === 'sauce' ? col('sauce') : col('cream'), 0, 0, 0, { seg: 14 }); break;
    case 'strawberry': case 'banana': case 'blueberry': case 'apple': case 'orange':
      if (id === 'blueberry') { for (let k = 0; k < 5; k++) b.sphere(0.02, '#4a4ab8', (k - 2) * 0.02, 0.02, (k % 2) * 0.02); break; }
      { const c = choppable(id); c.group.updateMatrixWorld(true); return c.group; }
    default: b.sphere(0.04, col(id), 0, 0.04, 0);
  }
  return meshOf(b, FOOD, { ao: 0 });
}

// ---------- cookware ----------
export function board() {
  const b = new Builder();
  b.box(0.62, 0.03, 0.36, '#e0b27a', 0, 0, 0, { r: 0.015 });
  for (let k = 0; k < 5; k++) b.cbox(0.6, 0.002, 0.004, '#cf9d64', 0, 0.031, -0.14 + k * 0.07, { r: 0 });
  b.cyl(0.02, 0.02, 0.032, '#b8864f', 0.27, 0.0, 0, { seg: 10 });
  return meshOf(b);
}
export function knife() {
  const b = new Builder();
  b.cbox(0.012, 0.03, 0.2, '#e8eef5', 0, 0, 0.05, { r: 0.003 });
  b.cbox(0.02, 0.035, 0.11, '#ff8fc0', 0, 0.005, -0.1, { r: 0.012 });
  return meshOf(b, M.metal, { ao: 0 });
}
export function bowl(color = '#ffffff', r = 0.2, h = 0.13) {
  const pts = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([r * 0.55 + (r - r * 0.55) * Math.sin(t * Math.PI / 2), t * h]); }
  for (let i = 10; i >= 1; i--) { const t = i / 10; pts.push([(r * 0.55 + (r - r * 0.55) * Math.sin(t * Math.PI / 2)) - 0.012, t * h + 0.004]); }
  pts.unshift([0, 0]); pts.push([0, 0.012]);
  const b = new Builder();
  b.add(Geo.lathe(`bowl${r}${h}`, pts, 28), color);
  b.torus(r - 0.006, 0.007, shade(color, 0.95), 0, h, 0, { rx: Math.PI / 2, ts: 28, rs: 6 });
  b.cyl(r * 0.4, r * 0.45, 0.015, shade(color, 0.9), 0, -0.012, 0, { seg: 20 });
  return meshOf(b, M.gloss, { ao: 0.2, aoHeight: h });
}
export function plate(r = 0.24, color = '#ffffff') {
  const b = new Builder();
  b.add(Geo.lathe(`plate${r}`, [[0, 0], [r * 0.7, 0], [r, 0.022], [r - 0.012, 0.028], [r * 0.68, 0.01], [0, 0.01]], 32), color);
  b.torus(r * 0.84, 0.004, '#ffc4dd', 0, 0.019, 0, { rx: Math.PI / 2, ts: 32, rs: 4 });
  return meshOf(b, M.gloss, { ao: 0 });
}
export function pan() {
  const b = new Builder();
  b.add(Geo.lathe('pan', [[0, 0], [0.19, 0], [0.22, 0.05], [0.21, 0.052], [0.18, 0.012], [0, 0.012]], 28), '#3e3a48');
  b.cbox(0.26, 0.025, 0.04, '#ff8fc0', 0.36, 0.04, 0, { r: 0.012, rz: 0.12 });
  return meshOf(b, M.gloss, { ao: 0 });
}
export function stove() {
  const b = new Builder();
  b.box(0.7, 0.03, 0.46, '#f4f0f7', 0, 0, 0, { r: 0.012 });
  b.cyl(0.15, 0.15, 0.008, '#3a3444', 0, 0.03, 0, { seg: 24 });
  b.torus(0.12, 0.006, '#ff6a3a', 0, 0.039, 0, { rx: Math.PI / 2, ts: 24, rs: 4 });
  return meshOf(b);
}
export function pot(color = '#7fc6ff') {
  const b = new Builder();
  b.add(Geo.lathe('pot', [[0, 0], [0.17, 0], [0.18, 0.02], [0.18, 0.2], [0.19, 0.205], [0.17, 0.205], [0.17, 0.015], [0, 0.015]], 28), color);
  for (const s of [-1, 1]) b.cbox(0.06, 0.02, 0.05, shade(color, 0.8), s * 0.21, 0.17, 0, { r: 0.01 });
  return meshOf(b, M.gloss, { ao: 0.25, aoHeight: 0.2 });
}
export function blender() {
  const g = new THREE.Group();
  const b = new Builder();
  b.box(0.2, 0.1, 0.2, '#ff8fc0', 0, 0, 0, { r: 0.03 });
  b.cyl(0.02, 0.02, 0.012, '#ffffff', 0, 0.05, 0.1, { rx: Math.PI / 2, center: true });
  b.cyl(0.075, 0.085, 0.02, '#e0e0e8', 0, 0.1, 0, { seg: 18 });
  b.cyl(0.11, 0.11, 0.03, '#ff8fc0', 0, 0.39, 0, { seg: 18 });
  g.add(meshOf(b, M.gloss));
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.28, 20, 1, true), GLASS);
  jar.position.y = 0.26;
  jar.renderOrder = 5;
  g.add(jar);
  return g;
}
export function glass(h = 0.2, r = 0.075) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.8, h, 22, 1, true), GLASS);
  m.position.y = h / 2;
  m.renderOrder = 5;
  const b = new Builder();
  b.cyl(r * 0.8, r * 0.8, 0.01, '#e8f6ff', 0, 0, 0, { seg: 22 });
  g.add(meshOf(b, M.gloss), m);
  return g;
}
export function oven(color = '#ffffff') {
  const b = new Builder();
  b.box(0.9, 0.55, 0.5, color, 0, 0, 0, { r: 0.05 });
  b.box(0.62, 0.34, 0.02, '#3e3a48', -0.07, 0.1, 0.25, { r: 0.03 });
  b.cbox(0.5, 0.03, 0.03, '#d0d0da', -0.07, 0.5, 0.27, { r: 0.012 });
  for (let k = 0; k < 3; k++) b.cyl(0.03, 0.03, 0.03, '#ff8fc0', 0.34, 0.42 - k * 0.12, 0.26, { rx: Math.PI / 2, center: true });
  return meshOf(b);
}
export function grill() {
  const b = new Builder();
  b.box(0.62, 0.06, 0.42, '#3e3a48', 0, 0, 0, { r: 0.02 });
  for (let k = 0; k < 7; k++) b.cbox(0.58, 0.012, 0.012, '#8a8494', 0, 0.066, -0.18 + k * 0.06, { r: 0 });
  for (const s of [-1, 1]) b.cbox(0.02, 0.012, 0.4, '#8a8494', s * 0.28, 0.066, 0, { r: 0 });
  return meshOf(b, M.metal);
}
export function fryer() {
  const b = new Builder();
  b.box(0.46, 0.2, 0.36, '#d0d0da', 0, 0, 0, { r: 0.03 });
  b.box(0.4, 0.004, 0.3, '#f2c14e', 0, 0.19, 0, { r: 0 });
  b.cbox(0.34, 0.12, 0.24, '#8a8494', 0, 0.2, 0, { r: 0.01 });
  b.cbox(0.03, 0.03, 0.25, '#ff8fc0', 0, 0.28, 0.2, { r: 0.012 });
  return meshOf(b, M.metal);
}
export function toaster() {
  const b = new Builder();
  b.box(0.34, 0.22, 0.2, '#7fc6ff', 0, 0, 0, { r: 0.06 });
  b.cbox(0.24, 0.02, 0.05, '#3e3a48', 0, 0.22, 0, { r: 0.008 });
  b.cbox(0.03, 0.05, 0.03, '#ffffff', 0.19, 0.13, 0, { r: 0.01 });
  return meshOf(b, M.gloss);
}
export function rollingPin() {
  const b = new Builder();
  b.cyl(0.035, 0.035, 0.34, '#e8c08a', 0, 0, 0, { rz: Math.PI / 2, center: true, seg: 16 });
  for (const s of [-1, 1]) b.cyl(0.014, 0.014, 0.09, '#ff8fc0', s * 0.21, 0, 0, { rz: Math.PI / 2, center: true });
  return meshOf(b, FOOD, { ao: 0 });
}
export function sushiMat() {
  const b = new Builder();
  for (let k = 0; k < 18; k++) b.cyl(0.009, 0.009, 0.46, k % 2 ? '#d8c08a' : '#cdb47c', 0, 0.009, -0.17 + k * 0.02, { rz: Math.PI / 2, center: true, seg: 6 });
  return meshOf(b);
}
export function tray() {
  const b = new Builder();
  b.box(0.6, 0.02, 0.4, '#c8c4d0', 0, 0, 0, { r: 0.01 });
  for (const [w, d, x, z] of [[0.6, 0.02, 0, 0.19], [0.6, 0.02, 0, -0.19], [0.02, 0.4, 0.29, 0], [0.02, 0.4, -0.29, 0]]) b.box(w, 0.035, d, '#b8b4c0', x, 0, z, { r: 0 });
  return meshOf(b, M.metal);
}

// ---------- in-progress dish parts ----------
// bowl contents: a flat disc whose colour and height follow what was added
export function fill(r, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, 0.02, 28), new THREE.MeshStandardMaterial({ color, roughness: 0.35 }));
  m.receiveShadow = true;
  return m;
}
export function pancakeStack(color = '#e8a95a', n = 3) {
  const b = new Builder();
  for (let k = 0; k < n; k++) {
    b.cyl(0.13, 0.13, 0.026, shade(color, 1.1), 0, k * 0.028, 0, { seg: 24 });
    b.cyl(0.126, 0.126, 0.004, shade(color, 0.85), 0, k * 0.028 + 0.025, 0, { seg: 24 });
  }
  b.cbox(0.05, 0.012, 0.04, col('butter'), 0, n * 0.028 + 0.004, 0, { r: 0.004 });
  return meshOf(b, FOOD, { ao: 0 });
}
export function breadSlice(toast = 0) {
  const b = new Builder();
  const crust = mix('#d8a060', '#8a5020', toast * 0.6);
  const inner = mix('#fff0d0', '#e0a050', toast);
  b.cbox(0.2, 0.024, 0.2, crust, 0, 0.012, 0, { r: 0.012 });
  b.cbox(0.18, 0.026, 0.18, inner, 0, 0.012, 0, { r: 0.006 });
  return meshOf(b, FOOD, { ao: 0 });
}
export function hotdogBun() {
  const b = new Builder();
  for (const s of [-1, 1]) b.sphere(0.05, '#e0a060', 0, 0.035, s * 0.03, { sx: 3.4, sy: 0.75, sz: 0.8 });
  b.cbox(0.3, 0.02, 0.05, '#fff0d0', 0, 0.035, 0, { r: 0.01 });
  return meshOf(b, FOOD, { ao: 0 });
}
export function sausageModel(cooked = 0.7) {
  const b = new Builder();
  const c = mix('#e88a7a', '#8a3a2a', cooked);
  b.cyl(0.028, 0.028, 0.28, c, 0, 0, 0, { rz: Math.PI / 2, center: true, seg: 14 });
  for (const s of [-1, 1]) b.sphere(0.028, c, s * 0.14, 0, 0);
  if (cooked > 0.3) for (let k = 0; k < 3; k++) b.cbox(0.006, 0.058, 0.004, shade(c, 0.6), -0.07 + k * 0.07, 0, 0.001, { r: 0, rx: 0 });
  return meshOf(b, FOOD, { ao: 0 });
}
export function doughDisc(r = 0.22, color = '#f6ddb0') {
  const b = new Builder();
  b.cyl(r, r, 0.018, color, 0, 0, 0, { seg: 32 });
  b.torus(r - 0.008, 0.014, shade(color, 0.95), 0, 0.016, 0, { rx: Math.PI / 2, ts: 32, rs: 8 });
  return meshOf(b, FOOD, { ao: 0 });
}
export function doughBall(color = '#f6ddb0') {
  const b = new Builder();
  b.sphere(0.09, color, 0, 0.06, 0, { sy: 0.7, ws: 16, hs: 12 });
  return meshOf(b, FOOD, { ao: 0 });
}
export function noriSheet() {
  const b = new Builder();
  b.cbox(0.4, 0.004, 0.3, col('nori'), 0, 0.022, 0, { r: 0 });
  return meshOf(b, FOOD, { ao: 0 });
}
export function sushiRoll(fillColor) {
  return choppable('sushiroll', { shape: 'long', flat: true, r: 0.06, len: 0.4, skin: col('nori'), inner: '#fbfbf4', core: fillColor, coreR: 0.38, cuts: 5 });
}
export function riceMound() {
  const b = new Builder();
  for (let k = 0; k < 9; k++) { const a = k * 2.3; b.sphere(0.045, '#fbfbf4', Math.cos(a) * 0.04, 0.035 + (k % 3) * 0.01, Math.sin(a) * 0.04, { sy: 0.8 }); }
  return meshOf(b, FOOD, { ao: 0 });
}
export function onigiriModel() {
  const b = new Builder();
  const pts = [];
  for (let i = 0; i < 3; i++) {
    const a = Math.PI / 2 + (i * Math.PI * 2) / 3;
    for (let k = -3; k <= 3; k++) { const aa = a + k * 0.14; pts.push([Math.cos(aa) * 0.1, Math.sin(aa) * 0.1]); }
  }
  b.add(Geo.shape('onigiri', pts, 0.07, 0.02), '#fbfbf4', 0, 0.1, 0);
  return meshOf(b, FOOD, { ao: 0 });
}
export function friesCone(cooked = 0.7) {
  const b = new Builder();
  b.box(0.14, 0.12, 0.09, '#ff5a6e', 0, 0, 0, { r: 0.012 });
  b.cbox(0.06, 0.04, 0.005, '#ffe066', 0, 0.06, 0.046, { r: 0.01 });
  const c = mix('#fff0b8', '#e8a030', cooked);
  for (let k = 0; k < 14; k++) b.cbox(0.016, 0.12, 0.016, shade(c, 0.9 + (k % 3) * 0.06), -0.05 + (k % 7) * 0.016, 0.1 + (k % 4) * 0.01, -0.02 + Math.floor(k / 7) * 0.03, { r: 0.003, rz: (k % 5 - 2) * 0.08 });
  return meshOf(b, FOOD, { ao: 0 });
}
export function potatoSticks() {
  const b = new Builder();
  for (let k = 0; k < 14; k++) b.cbox(0.13, 0.016, 0.016, '#fff0b8', -0.02 + (k % 3) * 0.02, 0.01 + Math.floor(k / 7) * 0.016, -0.06 + (k % 7) * 0.02, { r: 0.003, ry: (k % 4) * 0.1 });
  return meshOf(b, FOOD, { ao: 0 });
}
export function spaghettiPile(sauce) {
  const b = new Builder();
  for (let k = 0; k < 16; k++) b.torus(0.05 + (k % 4) * 0.018, 0.006, col('pasta'), ((k * 13) % 7 - 3) * 0.01, 0.02 + (k % 5) * 0.008, ((k * 5) % 7 - 3) * 0.01, { rx: Math.PI / 2 + ((k % 3) - 1) * 0.3, ts: 20, rs: 4 });
  if (sauce) b.sphere(0.08, col(sauce), 0, 0.05, 0, { sy: 0.35 });
  return meshOf(b, FOOD, { ao: 0 });
}
export function cupcakeModel(baked = 0.8) {
  const b = new Builder();
  b.cyl(0.075, 0.055, 0.08, '#ff9ccc', 0, 0, 0, { seg: 16 });
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; b.cbox(0.006, 0.08, 0.006, '#ffc4dd', Math.cos(a) * 0.066, 0.04, Math.sin(a) * 0.066, { r: 0 }); }
  b.sphere(0.08, mix('#ffe6a8', '#c98a4b', baked), 0, 0.08, 0, { sy: 0.6, ws: 18, hs: 10 });
  return meshOf(b, FOOD, { ao: 0 });
}
export function frosting(color, amount = 1) {
  const b = new Builder();
  for (let k = 0; k < 3; k++) b.torus(0.06 - k * 0.018, 0.022 - k * 0.003, color, 0, 0.13 + k * 0.03, 0, { rx: Math.PI / 2, ts: 18, rs: 8 });
  b.cone(0.022, 0.04, color, 0, 0.2, 0, { seg: 12 });
  const m = meshOf(b, FOOD, { ao: 0 });
  m.scale.setScalar(Math.max(0.01, amount));
  return m;
}
export function cakeLayer(color = '#ffd99a', r = 0.18, h = 0.08) {
  const b = new Builder();
  b.cyl(r, r, h, color, 0, 0, 0, { seg: 32 });
  return meshOf(b, FOOD, { ao: 0 });
}
export function cookieDough() {
  const b = new Builder();
  b.cbox(0.44, 0.016, 0.3, '#f0cf98', 0, 0.008, 0, { r: 0.008 });
  return meshOf(b, FOOD, { ao: 0 });
}
export function cookies(baked = 0.6) {
  const b = new Builder();
  const c = mix('#f5dcae', '#c98a4b', baked);
  for (let k = 0; k < 6; k++) b.cyl(0.055, 0.055, 0.018, c, -0.14 + (k % 3) * 0.14, 0.02, -0.07 + Math.floor(k / 3) * 0.14, { seg: 18 });
  return meshOf(b, FOOD, { ao: 0 });
}
export function soupBowl(color) {
  const g = new THREE.Group();
  g.add(bowl('#fff6ea', 0.15, 0.09));
  const f = fill(0.13, color);
  f.position.y = 0.075;
  g.add(f);
  return g;
}

// a round "surface" on which spreads are painted (canvas texture)
export function paintLayer(shape, w, d) {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = shape === 'disc' ? new THREE.CircleGeometry(w, 40) : new THREE.PlaneGeometry(w, d);
  if (shape === 'disc') {
    // circle UVs map to the square canvas
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i));
  }
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.35, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.receiveShadow = true;
  m.renderOrder = 3;
  return { mesh: m, ctx, tex, size };
}
