// Parametric cute pet builder: one generator makes all 30 species.
import * as THREE from 'three';
import { Builder, shade } from '../engine/builder.js';
import { M } from '../engine/materials.js';
import { SPEC, EGG } from '../data/pets.js';

const DARK = '#2a1f35', PINK = '#ff9ab8', WHITE = '#ffffff';

function eyes(b, x, y, z, r = 0.055, big = false) {
  const rr = big ? r * 1.35 : r;
  for (const s of [-1, 1]) {
    b.sphere(rr, DARK, s * x, y, z, { ws: 10, hs: 8 });
    b.sphere(rr * 0.38, WHITE, s * x + 0.018, y + rr * 0.35, z + rr * 0.8, { ws: 6, hs: 5 });
  }
}
function blush(b, x, y, z) {
  for (const s of [-1, 1]) b.sphere(0.045, PINK, s * x, y, z, { sz: 0.35, ws: 8, hs: 6 });
}

function acc(b, glow, id, top, headR) {
  const [x, y, z] = top;
  if (!id || id === 'none') return;
  if (id === 'bow') for (const s of [-1, 1]) b.sphere(0.07, '#ff6f9d', x + s * 0.07, y, z, { sx: 1.3, sy: 0.8, sz: 0.5, rz: s * 0.4 });
  if (id === 'flower') { for (let i = 0; i < 5; i++) b.sphere(0.04, '#ffffff', x + 0.1 + Math.cos(i * 1.26) * 0.05, y, z + Math.sin(i * 1.26) * 0.05); b.sphere(0.03, '#ffd24d', x + 0.1, y + 0.01, z); }
  if (id === 'party') { b.cone(0.09, 0.22, '#7fc6ff', x, y - 0.02, z, { seg: 10 }); b.sphere(0.035, '#ffd24d', x, y + 0.21, z); b.torus(0.08, 0.015, '#ff8fc0', x, y + 0.02, z, { rx: Math.PI / 2 }); }
  if (id === 'glasses') { for (const s of [-1, 1]) b.torus(0.055, 0.014, DARK, s * 0.09, top[3], top[4] + 0.02, { ts: 14 }); }
  if (id === 'scarf') b.torus(headR * 0.75, 0.05, '#ff5d6f', 0, top[5], top[6], { rx: Math.PI / 2 });
  if (id === 'crown') { b.cyl(0.09, 0.09, 0.07, '#ffd24d', x, y - 0.02, z, { seg: 10 }); for (let i = 0; i < 5; i++) b.cone(0.025, 0.07, '#ffd24d', x + Math.cos(i * 1.26) * 0.08, y + 0.05, z + Math.sin(i * 1.26) * 0.08, { seg: 4 }); b.sphere(0.02, '#ff5d8f', x, y + 0.03, z + 0.09); }
  if (id === 'halo') glow.torus(0.11, 0.02, '#fff3a8', x, y + 0.14, z, { rx: Math.PI / 2, ts: 20 });
}

export function buildPet(spId, o = {}) {
  const sp = SPEC[spId];
  const body = new Builder(), glow = new Builder(), tail = new Builder(), wing = new Builder();
  const legGeo = new Builder();
  const c = sp.col, bel = sp.belly, ac = sp.accent || shade(c, 0.7);
  const ex = new Set(sp.extras || []);
  let legs = [], headTop, headR = 0.27, face;
  let tailPos = [0, 0.4, -0.35];

  if (sp.body === 'quad') {
    body.sphere(0.3, c, 0, 0.38, -0.02, { sx: 1, sy: 0.85, sz: 1.25 });
    body.sphere(0.23, bel, 0, 0.32, 0.08, { sx: 0.9, sy: 0.75, sz: 1.1 });
    const hy = 0.66, hz = 0.3;
    body.sphere(0.27, c, 0, hy, hz, { sx: 1.05, sy: 0.95, sz: 0.95 });
    if (ex.has('snout')) { body.sphere(0.11, bel, 0, hy - 0.06, hz + 0.2, { sx: 1.2, sy: 0.85 }); body.sphere(0.035, DARK, 0, hy - 0.02, hz + 0.3); }
    else if (ex.has('nose')) body.sphere(0.06, DARK, 0, hy - 0.02, hz + 0.25, { sy: 0.8 });
    else body.sphere(0.028, DARK, 0, hy - 0.03, hz + 0.26);
    if (ex.has('eyepatch') || ex.has('mask')) for (const s of [-1, 1]) body.sphere(0.075, sp.accent === '#fff1e0' ? ac : DARK, s * 0.11, hy + 0.03, hz + 0.18, { sx: 1.1, sy: 0.9, sz: 0.5, rz: s * 0.3 });
    face = [0.11, hy + 0.04, hz + 0.24];
    eyes(body, ...face);
    blush(body, 0.18, hy - 0.05, hz + 0.2);
    if (ex.has('whiskers')) for (const s of [-1, 1]) for (let k = 0; k < 2; k++) body.cbox(0.16, 0.012, 0.012, DARK, s * 0.2, hy - 0.06 + k * 0.035, hz + 0.24, { r: 0, rz: s * (0.1 - k * 0.2) });
    if (ex.has('marks')) body.sphere(0.03, ac, 0, hy + 0.16, hz + 0.22, { sy: 1.6, sz: 0.4 });
    headTop = [0, hy + 0.26, hz - 0.02, hy + 0.04, hz + 0.26, hy - 0.2, hz - 0.1];
    // ears
    const ey = hy + 0.2;
    if (sp.ears === 'cat' || sp.ears === 'fox') {
      const big = sp.ears === 'fox' ? 1.3 : 1;
      for (const s of [-1, 1]) {
        body.cone(0.08 * big, 0.17 * big, c, s * 0.15, ey - 0.02, hz - 0.02, { seg: 4, rz: -s * 0.25 });
        body.cone(0.045 * big, 0.1 * big, sp.id === 'fox' ? '#ffffff' : PINK, s * 0.15, ey, hz + 0.02, { seg: 4, rz: -s * 0.25 });
      }
    } else if (sp.ears === 'floppy') for (const s of [-1, 1]) body.sphere(0.1, shade(c, 0.8), s * 0.27, hy + 0.02, hz - 0.02, { sx: 0.45, sy: 1.1, sz: 0.8, rz: s * 0.25 });
    else if (sp.ears === 'bunny') for (const s of [-1, 1]) { body.sphere(0.07, c, s * 0.1, ey + 0.17, hz - 0.04, { sy: 3.2, rz: -s * 0.15 }); body.sphere(0.04, PINK, s * 0.1, ey + 0.17, hz - 0.01, { sy: 3.6, sz: 0.5, rz: -s * 0.15 }); }
    else if (sp.ears === 'bear') for (const s of [-1, 1]) body.sphere(0.085, sp.id === 'panda' ? DARK : ac, s * 0.19, ey - 0.02, hz - 0.03);
    else if (sp.ears === 'round') for (const s of [-1, 1]) body.sphere(0.065, shade(c, 0.9), s * 0.19, ey - 0.03, hz - 0.03);
    else if (sp.ears === 'koala') for (const s of [-1, 1]) { body.sphere(0.13, c, s * 0.25, ey - 0.06, hz - 0.03, { sz: 0.6 }); body.sphere(0.08, '#f3f0f7', s * 0.25, ey - 0.06, hz + 0.01, { sz: 0.4 }); }
    else if (sp.ears === 'deer') for (const s of [-1, 1]) body.sphere(0.06, c, s * 0.2, ey, hz - 0.04, { sx: 0.8, sy: 1.8, sz: 0.5, rz: -s * 0.8 });
    else if (sp.ears === 'dragon') for (const s of [-1, 1]) body.cone(0.05, 0.14, ac, s * 0.16, ey - 0.02, hz - 0.08, { seg: 5, rz: -s * 0.3, rx: -0.4 });
    // extras on the body
    if (ex.has('horn')) { body.cone(0.045, 0.24, '#ffd36b', 0, hy + 0.2, hz + 0.1, { seg: 8, rx: 0.3 }); }
    if (ex.has('horns')) for (const s of [-1, 1]) body.cone(0.035, 0.16, '#fff3d6', s * 0.08, hy + 0.2, hz - 0.02, { seg: 6, rx: -0.5 });
    if (ex.has('antlers')) for (const s of [-1, 1]) { body.cyl(0.018, 0.022, 0.2, '#a0714f', s * 0.1, hy + 0.22, hz - 0.04, { seg: 5, rz: -s * 0.3 }); body.cyl(0.015, 0.018, 0.1, '#a0714f', s * 0.16, hy + 0.34, hz - 0.03, { seg: 5, rz: -s * 1.0 }); }
    if (ex.has('mane')) { const mc = sp.id === 'unicorn' ? ['#ff9ad5', '#b58cff', '#7fc6ff', '#fff07a'] : [ac, shade(ac, 1.1)]; for (let i = 0; i < 5; i++) body.sphere(0.07, mc[i % mc.length], 0, hy + 0.12 - i * 0.07, hz - 0.18 - i * 0.05); }
    if (ex.has('stripes')) for (let i = 0; i < 3; i++) body.cbox(0.3, 0.05, 0.06, shade(c, 0.78), 0, 0.62, -0.18 + i * 0.12, { r: 0.02, rx: 0.2 });
    if (ex.has('spots')) for (let i = 0; i < 6; i++) body.sphere(0.04, sp.accent || shade(c, 0.75), Math.cos(i * 2.1) * 0.16, 0.56 + (i % 2) * 0.04, -0.2 + i * 0.07, { sy: 0.4 });
    if (ex.has('spot')) body.sphere(0.1, shade(c, 0.75), 0.12, 0.62, 0.34, { sz: 0.4 });
    if (ex.has('shell')) { body.sphere(0.34, '#6fb35a', 0, 0.44, -0.04, { sy: 0.62, sz: 1.12 }); for (let i = 0; i < 5; i++) body.sphere(0.08, '#8ccf6d', Math.cos(i * 1.25) * 0.16, 0.62, -0.04 + Math.sin(i * 1.25) * 0.2, { sy: 0.3 }); }
    if (ex.has('spines')) for (let i = 0; i < 4; i++) body.cone(0.04, 0.1, ac, 0, 0.6 - i * 0.02, 0.05 - i * 0.12, { seg: 4, rx: -0.4 });
    if (ex.has('crystals')) for (let i = 0; i < 4; i++) glow.cone(0.04, 0.15, ['#ff9ad5', '#fff3a8', '#c7a6ff', '#ffffff'][i], 0, 0.62 - i * 0.02, 0.05 - i * 0.12, { seg: 5, rx: -0.3 });
    if (ex.has('stars')) for (let i = 0; i < 5; i++) glow.sphere(0.03, '#fff07a', Math.cos(i * 1.9) * 0.2, 0.45 + (i % 3) * 0.08, -0.15 + i * 0.07);
    // legs (pivot at hip)
    const lc = ex.has('socks') ? (sp.id === 'panda' ? DARK : ac === '#ffffff' ? DARK : shade(c, 0.6)) : c;
    legGeo.cyl(0.065, 0.06, 0.22, lc, 0, -0.22, 0, { seg: 8 });
    legGeo.sphere(0.07, lc, 0, -0.21, 0.02, { sy: 0.7 });
    legs = [[-0.15, 0.24, 0.2], [0.15, 0.24, 0.2], [-0.15, 0.24, -0.22], [0.15, 0.24, -0.22]];
    tailPos = [0, 0.42, -0.36];
  } else if (sp.body === 'bird') {
    const long = ex.has('longlegs');
    const by = long ? 0.62 : 0.34;
    body.sphere(0.3, c, 0, by, 0, { sy: 1.05 });
    body.sphere(0.22, bel, 0, by - 0.04, 0.12, { sz: 0.8 });
    const hy = by + 0.32, hz = 0.08;
    body.sphere(0.23, c, 0, hy, hz);
    if (ex.has('beak')) body.cone(0.06, 0.12, sp.id === 'phoenix' ? '#ffd24d' : '#ff9a3d', 0, hy - 0.03, hz + 0.26, { rx: Math.PI / 2, seg: 8, center: true });
    if (ex.has('bill')) body.sphere(0.07, '#ffa94d', 0, hy - 0.05, hz + 0.23, { sx: 1.2, sy: 0.45, sz: 1 });
    face = [0.09, hy + 0.04, hz + 0.19];
    eyes(body, ...face, 0.05, ex.has('bigeyes'));
    if (ex.has('bigeyes')) for (const s of [-1, 1]) body.sphere(0.09, '#fff3dc', s * 0.09, hy + 0.04, hz + 0.15, { sz: 0.4 });
    blush(body, 0.15, hy - 0.05, hz + 0.16);
    if (sp.ears === 'tufts') for (const s of [-1, 1]) body.cone(0.04, 0.12, shade(c, 0.8), s * 0.13, hy + 0.18, hz, { seg: 4, rz: -s * 0.3 });
    if (ex.has('crest')) for (let i = 0; i < 3; i++) body.sphere(0.05, sp.accent || shade(c, 1.2), 0, hy + 0.22 + i * 0.03, hz - 0.03 - i * 0.06, { sy: 1.5 });
    headTop = [0, hy + 0.22, hz, hy + 0.04, hz + 0.2, hy - 0.2, hz - 0.02];
    // wings (flap)
    const wc = ex.has('flippers') ? c : shade(c, 0.9);
    wing.sphere(0.16, wc, 0.05, 0, 0, { sx: 0.35, sy: 1.0, sz: 1.3 });
    if (ex.has('wings')) wing.sphere(0.2, sp.accent || WHITE, 0.14, 0.06, -0.05, { sx: 0.25, sy: 1.1, sz: 1.5, rz: -0.5 });
    // legs
    const lh = long ? 0.5 : 0.14;
    legGeo.cyl(0.02, 0.02, lh, '#ff9a3d', 0, -lh, 0, { seg: 5 });
    legGeo.sphere(0.05, '#ff9a3d', 0, -lh, 0.03, { sy: 0.35, sz: 1.4 });
    legs = [[-0.1, lh + 0.02, 0.02], [0.1, lh + 0.02, 0.02]];
    tailPos = [0, by + 0.02, -0.28];
  } else {
    // blob
    body.sphere(0.34, c, 0, 0.3, 0, { sx: 1.1, sy: 0.85, sz: 1.05 });
    body.sphere(0.26, bel, 0, 0.26, 0.1, { sx: 1.0, sy: 0.72, sz: 0.9 });
    const hy = 0.38, hz = 0.3;
    face = [0.12, hy, hz];
    if (ex.has('topeyes')) {
      for (const s of [-1, 1]) body.sphere(0.09, c, s * 0.15, 0.56, 0.18);
      eyes(body, 0.15, 0.58, 0.25, 0.05);
    } else eyes(body, ...face, 0.05);
    body.sphere(0.022, DARK, 0, hy - 0.06, hz + 0.03);
    blush(body, 0.2, hy - 0.08, hz - 0.02);
    if (ex.has('cheeks')) for (const s of [-1, 1]) body.sphere(0.09, bel, s * 0.22, 0.28, 0.2);
    if (sp.ears === 'round') for (const s of [-1, 1]) body.sphere(0.06, shade(c, 0.9), s * 0.2, 0.55, 0.05);
    if (ex.has('gills')) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) body.sphere(0.05, '#ff6fa8', s * (0.34 + i * 0.03), 0.4 + i * 0.06 - 0.06, 0.02, { sy: 1.8, rz: s * (0.6 - i * 0.4) });
    if (ex.has('spikes')) for (let i = 0; i < 14; i++) { const a = i * 0.9; body.cone(0.05, 0.14, shade(c, 0.7), Math.cos(a) * 0.22, 0.42 + Math.sin(i) * 0.06, -0.1 - (i % 3) * 0.08, { seg: 4, rx: -0.9, rz: Math.cos(a) * 0.6 }); }
    if (ex.has('whiskers')) for (const s of [-1, 1]) body.cbox(0.14, 0.012, 0.012, DARK, s * 0.2, hy - 0.08, hz, { r: 0 });
    if (ex.has('snout')) body.sphere(0.07, bel, 0, hy - 0.04, hz + 0.05);
    headTop = [0, 0.6, 0.02, hy, hz + 0.02, 0.36, 0.0];
    legGeo.sphere(0.07, shade(c, 0.95), 0, -0.04, 0.03, { sy: 0.6, sz: 1.2 });
    legs = [[-0.18, 0.06, 0.16], [0.18, 0.06, 0.16], [-0.18, 0.06, -0.16], [0.18, 0.06, -0.16]];
    if (ex.has('flippers')) { wing.sphere(0.12, c, 0.05, 0, 0, { sx: 0.3, sy: 0.6, sz: 1.2 }); }
    tailPos = [0, 0.26, -0.34];
  }

  // tails
  const t = sp.tail;
  if (t === 'long') { for (let i = 0; i < 5; i++) tail.sphere(0.055 - i * 0.004, i === 4 && ex.has('stripes') ? shade(c, 0.78) : c, 0, i * 0.06, -i * 0.07, {}); }
  else if (t === 'fluffy') { tail.sphere(0.13, c, 0, 0.08, -0.12, { sy: 0.9, sz: 1.5, rx: -0.6 }); tail.sphere(0.08, sp.id === 'fox' ? WHITE : bel, 0, 0.17, -0.3); }
  else if (t === 'short') tail.sphere(0.06, c, 0, 0.03, -0.03, { sz: 1.4, rx: -0.5 });
  else if (t === 'puff') tail.sphere(0.08, WHITE, 0, 0, -0.02);
  else if (t === 'ringed') for (let i = 0; i < 5; i++) tail.sphere(0.085, i % 2 ? (sp.accent === '#fff1e0' ? '#fff1e0' : DARK) : c, 0, 0.03 + i * 0.05, -i * 0.08);
  else if (t === 'mane') for (let i = 0; i < 4; i++) tail.sphere(0.07, sp.id === 'unicorn' ? ['#ff9ad5', '#b58cff', '#7fc6ff', '#fff07a'][i] : sp.accent || c, 0, -i * 0.06, -i * 0.06 - 0.03);
  else if (t === 'dragon') { for (let i = 0; i < 4; i++) tail.sphere(0.07 - i * 0.012, c, 0, 0.02 - i * 0.03, -i * 0.09); tail.cone(0.06, 0.12, ac, 0, -0.1, -0.38, { rx: -Math.PI / 2, seg: 4, center: true }); }
  else if (t === 'nine') for (let i = 0; i < 9; i++) { const a = (i - 4) * 0.28; tail.sphere(0.07, i % 2 ? c : (sp.accent || c), Math.sin(a) * 0.2, 0.12 + Math.cos(a) * 0.12, -0.12, { sy: 2.2, rz: -a, rx: -0.4 }); }
  else if (t === 'fish') tail.sphere(0.1, sp.id === 'axolotl' ? '#ff9ac4' : shade(c, 0.9), 0, 0.02, -0.08, { sx: 0.25, sy: 1.0, sz: 1.2 });
  else if (t === 'fan') for (let i = -1; i <= 1; i++) tail.sphere(0.07, shade(c, 0.9), i * 0.07, 0.04, -0.06, { sx: 0.5, sy: 1.4, sz: 0.4, rz: i * 0.4, rx: -0.4 });

  // wings on quads
  if (sp.body === 'quad' && (ex.has('wings') || ex.has('dragonwings'))) {
    if (ex.has('dragonwings')) wing.sphere(0.2, ac, 0.12, 0.08, -0.02, { sx: 0.12, sy: 1.0, sz: 1.5, rz: -0.7 });
    else { wing.sphere(0.2, WHITE, 0.1, 0.1, -0.02, { sx: 0.2, sy: 1.0, sz: 1.3, rz: -0.6 }); wing.sphere(0.14, sp.accent || '#e8f4ff', 0.18, 0.2, -0.06, { sx: 0.2, sy: 1.0, sz: 1.3, rz: -0.9 }); }
  }

  acc(body, glow, o.acc, headTop, headR);

  // assemble
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);
  const bodyMesh = new THREE.Mesh(body.build({ ao: 0.18, aoHeight: 0.5 }), M.std);
  bodyMesh.castShadow = true;
  inner.add(bodyMesh);
  if (glow.parts.length) inner.add(new THREE.Mesh(glow.build({ ao: 0 }), M.glowAlways));
  const legMeshes = [];
  if (legs.length) {
    const lg = legGeo.build({ ao: 0 });
    for (const [x, y, z] of legs) {
      const m = new THREE.Mesh(lg, M.std);
      m.position.set(x, y, z);
      m.castShadow = true;
      inner.add(m);
      legMeshes.push(m);
    }
  }
  let tailMesh = null;
  if (tail.parts.length) {
    tailMesh = new THREE.Mesh(tail.build({ ao: 0 }), M.std);
    tailMesh.position.set(...tailPos);
    tailMesh.castShadow = true;
    inner.add(tailMesh);
  }
  const wingMeshes = [];
  if (wing.parts.length) {
    const wg = wing.build({ ao: 0 });
    const wy = sp.body === 'bird' ? (ex.has('longlegs') ? 0.66 : 0.38) : 0.52;
    const wx = sp.body === 'bird' ? 0.26 : 0.16;
    for (const s of [-1, 1]) {
      const m = new THREE.Mesh(wg, M.std);
      m.position.set(s * wx, wy, sp.body === 'bird' ? -0.02 : -0.05);
      m.scale.x = s;
      m.castShadow = true;
      inner.add(m);
      wingMeshes.push(m);
    }
  }
  return { group, inner, body: bodyMesh, legs: legMeshes, tail: tailMesh, wings: wingMeshes, glow: ex.has('glow'), sp };
}

export function buildEgg(eggId) {
  const e = EGG[eggId];
  const b = new Builder();
  b.sphere(0.24, e.col, 0, 0.3, 0, { sy: 1.3, ws: 16, hs: 12 });
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9, y = 0.16 + (i % 3) * 0.13;
    const r = 0.235 * Math.sqrt(1 - ((y - 0.3) / 0.31) ** 2);
    b.sphere(0.05, e.spots, Math.cos(a) * r, y, Math.sin(a) * r, { sx: 1.1, sy: 1.1, sz: 0.4, ry: -a + Math.PI / 2 });
  }
  const group = new THREE.Group();
  const inner = new THREE.Group();
  group.add(inner);
  const m = new THREE.Mesh(b.build({ ao: 0.2, aoHeight: 0.4 }), M.gloss);
  m.castShadow = true;
  inner.add(m);
  return { group, inner, body: m, legs: [], tail: null, wings: [], egg: true };
}
