// The restaurant room: dining area, counter, door, decor, themed per restaurant.
import * as THREE from 'three';
import { Builder, shade, mix } from '../../src/engine/builder.js';
import { M, canvasTex } from '../../src/engine/materials.js';
import { WORD } from './data.js';

export const COUNTER_Y = 1.0;
export const SPOTS = [-1.75, 0, 1.75].map((x) => new THREE.Vector3(x, 0, -0.95));
export const DOOR = new THREE.Vector3(3.6, 0, -6.2);

function mesh(b, mat = M.std, o = {}) {
  const m = new THREE.Mesh(b.build({ ao: o.ao ?? 0.3, aoHeight: o.aoHeight ?? 1.2 }), mat);
  m.castShadow = o.cast ?? true;
  m.receiveShadow = true;
  return m;
}

function table(b, x, z, top, leg) {
  b.cyl(0.06, 0.1, 0.72, leg, x, 0, z, { seg: 10 });
  b.cyl(0.3, 0.3, 0.02, leg, x, 0, z, { seg: 16 });
  b.cyl(0.58, 0.58, 0.06, top, x, 0.72, z, { seg: 24 });
  for (const s of [-1, 1]) {
    const cx = x + s * 0.85;
    b.box(0.44, 0.06, 0.44, shade(top, 0.92), cx, 0.44, z, { r: 0.03 });
    b.box(0.44, 0.5, 0.06, shade(top, 0.92), cx + s * 0.22, 0.44, z, { r: 0.03, ry: Math.PI / 2 });
    for (const [dx, dz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) b.cyl(0.02, 0.02, 0.44, leg, cx + dx, 0, z + dz, { seg: 6 });
  }
}

function plant(b, x, z, pot = '#ff9ccc') {
  b.cyl(0.2, 0.15, 0.36, pot, x, 0, z, { seg: 12 });
  for (let k = 0; k < 7; k++) {
    const a = k * 0.9;
    b.sphere(0.2, k % 2 ? '#5fbf6a' : '#4aa85a', x + Math.cos(a) * 0.12, 0.55 + (k % 3) * 0.14, z + Math.sin(a) * 0.12, { sy: 1.3 });
  }
}

function menuTexture(R) {
  return canvasTex(512, 320, (x, w, h) => {
    x.fillStyle = '#3e3550';
    x.fillRect(0, 0, w, h);
    x.strokeStyle = R.accent; x.lineWidth = 10; x.strokeRect(8, 8, w - 16, h - 16);
    x.fillStyle = '#fff';
    x.textAlign = 'center';
    x.font = '600 44px Fredoka, sans-serif';
    x.fillText('MENU', w / 2, 62);
    x.textAlign = 'left';
    x.font = '500 34px Fredoka, sans-serif';
    R.recipes.forEach((id, i) => {
      x.fillText(`${WORD[id].emoji} ${WORD[id].en}`, 40, 120 + i * 50);
    });
  });
}

function signTexture(R) {
  return canvasTex(1024, 180, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#fff0f6');
    x.fillStyle = g;
    x.beginPath(); x.roundRect(6, 6, w - 12, h - 12, 60); x.fill();
    x.strokeStyle = R.trim; x.lineWidth = 12; x.stroke();
    x.fillStyle = shade(R.trim, 0.75);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '700 96px Fredoka, sans-serif';
    x.fillText(`${R.emoji} ${R.en} ${R.emoji}`, w / 2, h / 2 + 6);
  });
}

export function buildRestaurant(R) {
  const g = new THREE.Group();
  // floor tiles
  const f = new Builder();
  const W = 12, D = 10;
  for (let i = 0; i < W; i++) for (let j = 0; j < D; j++) {
    const c = (i + j) % 2 ? R.floor : mix(R.floor, '#ffffff', 0.55);
    f.cbox(1, 0.1, 1, c, -W / 2 + 0.5 + i, -0.05, -6.5 + 0.5 + j, { r: 0 });
  }
  g.add(mesh(f, M.std, { ao: 0, cast: false }));

  // walls with wainscot, windows and door
  const w = new Builder();
  const wall = R.wall, trim = R.trim;
  w.cbox(12, 4.2, 0.2, wall, 0, 2.1, -6.6, { r: 0 });
  w.cbox(12, 1.1, 0.24, shade(wall, 0.9), 0, 0.55, -6.58, { r: 0 });
  w.cbox(12, 0.1, 0.3, trim, 0, 1.12, -6.55, { r: 0.02 });
  for (const s of [-1, 1]) {
    w.cbox(0.2, 4.2, 10, wall, s * 6.1, 2.1, -1.5, { r: 0 });
    w.cbox(0.24, 1.1, 10, shade(wall, 0.9), s * 6.08, 0.55, -1.5, { r: 0 });
    w.cbox(0.3, 0.1, 10, trim, s * 6.05, 1.12, -1.5, { r: 0.02 });
    // side windows
    for (const z of [-4.6, -2.0]) {
      w.cbox(0.26, 1.6, 1.5, '#ffffff', s * 6.0, 2.3, z, { r: 0.04 });
      w.cbox(0.28, 1.4, 1.3, '#bfe6ff', s * 6.0, 2.3, z, { r: 0.02 });
      w.cbox(0.3, 1.4, 0.06, '#ffffff', s * 6.0, 2.3, z, { r: 0 });
      w.cbox(0.3, 0.06, 1.3, '#ffffff', s * 6.0, 2.3, z, { r: 0 });
      w.cbox(0.4, 0.08, 1.6, trim, s * 5.95, 1.48, z, { r: 0.02 });
    }
  }
  // back windows
  for (const x of [-3.8, -1.2]) {
    w.cbox(1.8, 1.7, 0.26, '#ffffff', x, 2.35, -6.5, { r: 0.04 });
    w.cbox(1.6, 1.5, 0.28, '#bfe6ff', x, 2.35, -6.5, { r: 0.02 });
    w.cbox(0.06, 1.5, 0.3, '#ffffff', x, 2.35, -6.5, { r: 0 });
    w.cbox(1.6, 0.06, 0.3, '#ffffff', x, 2.35, -6.5, { r: 0 });
    // awning
    for (let k = 0; k < 6; k++) w.cbox(0.3, 0.06, 0.5, k % 2 ? '#ffffff' : trim, x - 0.75 + k * 0.3, 3.3, -6.25, { r: 0.02, rx: -0.5 });
  }
  // door
  w.cbox(1.3, 2.4, 0.26, shade(trim, 0.8), DOOR.x, 1.2, -6.5, { r: 0.05 });
  w.cbox(1.1, 2.2, 0.28, mix(trim, '#ffffff', 0.35), DOOR.x, 1.15, -6.5, { r: 0.04 });
  w.cbox(0.7, 0.9, 0.3, '#bfe6ff', DOOR.x, 1.55, -6.5, { r: 0.04 });
  w.sphere(0.06, '#ffd45e', DOOR.x + 0.4, 1.1, -6.35);
  g.add(mesh(w, M.std, { ao: 0.25, aoHeight: 1 }));

  // counter
  const c = new Builder();
  c.box(6.8, COUNTER_Y - 0.06, 0.9, shade(trim, 1.05), 0, 0, 0, { r: 0.06 });
  for (let k = 0; k < 13; k++) c.cbox(0.2, 0.78, 0.04, k % 2 ? '#ffffff' : mix(trim, '#ffffff', 0.25), -3 + k * 0.5, 0.5, -0.46, { r: 0.03 });
  c.box(7.0, 0.07, 1.0, '#fbf7f4', 0, COUNTER_Y - 0.07, 0, { r: 0.03 });
  c.cbox(7.0, 0.04, 0.05, trim, 0, COUNTER_Y - 0.04, -0.5, { r: 0.02 });
  // side props on the counter: register + cake stand + jar
  c.box(0.5, 0.26, 0.38, '#ffffff', 2.85, COUNTER_Y, 0.05, { r: 0.05 });
  c.box(0.46, 0.12, 0.32, R.accent, 2.85, COUNTER_Y + 0.26, 0.02, { r: 0.04, rx: -0.3 });
  c.cyl(0.18, 0.18, 0.02, '#ffffff', -2.8, COUNTER_Y + 0.2, 0, { seg: 18 });
  c.cyl(0.03, 0.06, 0.2, '#ffffff', -2.8, COUNTER_Y, 0, { seg: 10 });
  c.cyl(0.12, 0.12, 0.26, '#e8f6ff', -2.3, COUNTER_Y, -0.1, { seg: 14 });
  for (let k = 0; k < 5; k++) c.sphere(0.035, ['#ff8fc0', '#ffd45e', '#7fc6ff', '#8fe39a', '#c7a2ff'][k], -2.3 + (k - 2) * 0.03, COUNTER_Y + 0.08 + (k % 2) * 0.07, -0.1);
  g.add(mesh(c, M.gloss, { ao: 0.2, aoHeight: 1 }));
  // cake on the stand
  const ck = new Builder();
  ck.cyl(0.14, 0.14, 0.12, '#fff0f6', -2.8, COUNTER_Y + 0.22, 0, { seg: 18 });
  for (let k = 0; k < 8; k++) ck.sphere(0.022, '#ff5f7e', -2.8 + Math.cos(k * 0.8) * 0.1, COUNTER_Y + 0.35, Math.sin(k * 0.8) * 0.1);
  g.add(mesh(ck, M.gloss, { ao: 0 }));

  // dining room: tables, plants, rug
  const d = new Builder();
  table(d, -3.6, -3.4, '#ffffff', R.trim);
  table(d, -0.6, -4.4, '#ffffff', R.trim);
  table(d, 1.7, -3.0, '#ffffff', R.trim);
  plant(d, -5.4, -6.0);
  plant(d, 5.4, -6.0, R.accent);
  plant(d, -5.4, -0.6, R.accent);
  plant(d, 5.4, -0.9);
  d.cyl(1.4, 1.4, 0.015, mix(R.accent, '#ffffff', 0.4), -0.6, 0.001, -4.4, { seg: 32 });
  for (const t of [[-3.6, -3.4], [-0.6, -4.4], [1.7, -3.0]]) {
    d.cyl(0.05, 0.05, 0.14, '#ffffff', t[0], 0.78, t[1], { seg: 8 });
    d.sphere(0.07, R.accent, t[0], 0.96, t[1]);
  }
  g.add(mesh(d, M.std, { ao: 0.3, aoHeight: 0.9 }));

  // pendant lamps over the counter
  const l = new Builder();
  for (const x of [-2, 0, 2]) {
    l.cyl(0.008, 0.008, 1.2, '#5a4a6a', x, 3.0, 0.1, { seg: 4 });
    l.cone(0.26, 0.24, R.trim, x, 2.8, 0.1, { seg: 16 });
  }
  g.add(mesh(l, M.gloss, { ao: 0, cast: false }));
  const bulbs = new Builder();
  for (const x of [-2, 0, 2]) bulbs.sphere(0.1, '#fff4c4', x, 2.8, 0.1);
  g.add(mesh(bulbs, M.glowAlways, { ao: 0, cast: false }));

  // sign + menu board
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.74), new THREE.MeshBasicMaterial({ map: signTexture(R), transparent: true }));
  sign.position.set(-1.2, 3.75, -6.47);
  g.add(sign);
  const menu = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.94), new THREE.MeshStandardMaterial({ map: menuTexture(R), roughness: 0.8 }));
  menu.position.set(1.4, 2.5, -6.47);
  g.add(menu);

  // back kitchen counter (only seen when the phone is upright)
  const bk = new Builder();
  bk.box(7.4, 0.86, 0.8, shade(trim, 1.05), 0, 0, 1.75, { r: 0.05 });
  bk.box(7.6, 0.06, 0.9, '#fbf7f4', 0, 0.86, 1.75, { r: 0.03 });
  for (let k = 0; k < 7; k++) bk.box(0.9, 0.6, 0.03, '#ffffff', -2.95 + k * 0.98, 0.12, 1.34, { r: 0.03 });
  for (let k = 0; k < 7; k++) bk.cbox(0.22, 0.04, 0.04, '#d0c0d8', -2.95 + k * 0.98, 0.62, 1.31, { r: 0.02 });
  // stove with pots
  bk.box(1.3, 0.03, 0.7, '#3e3a48', -1.6, 0.92, 1.75, { r: 0.02 });
  for (const [x, z] of [[-1.9, 1.6], [-1.3, 1.9]]) bk.torus(0.14, 0.012, '#ff6a3a', x, 0.955, z, { rx: Math.PI / 2, ts: 18, rs: 4 });
  bk.cyl(0.2, 0.2, 0.26, '#7fc6ff', -1.9, 0.95, 1.6, { seg: 16 });
  bk.cyl(0.21, 0.21, 0.03, shade('#7fc6ff', 0.85), -1.9, 1.21, 1.6, { seg: 16 });
  bk.cyl(0.18, 0.2, 0.08, '#3e3a48', -1.3, 0.95, 1.9, { seg: 16 });
  bk.cbox(0.3, 0.03, 0.05, '#ff8fc0', -1.0, 1.0, 1.9, { r: 0.012 });
  // sink
  bk.box(0.9, 0.03, 0.55, '#d0d0da', 0.3, 0.92, 1.75, { r: 0.04 });
  bk.cyl(0.03, 0.03, 0.3, '#d0d0da', 0.3, 0.92, 2.0, { seg: 8 });
  bk.cbox(0.04, 0.04, 0.2, '#d0d0da', 0.3, 1.22, 1.92, { r: 0.015 });
  // board with veggies, jars, mixer
  bk.box(0.6, 0.03, 0.36, '#e0b27a', 1.5, 0.92, 1.7, { r: 0.015 });
  bk.sphere(0.08, '#e8453c', 1.35, 1.03, 1.7); bk.sphere(0.07, '#ffad3a', 1.6, 1.02, 1.62);
  bk.cyl(0.04, 0.04, 0.3, '#5fae5a', 1.7, 1.0, 1.8, { rz: Math.PI / 2, center: true });
  for (let k = 0; k < 3; k++) { bk.cyl(0.09, 0.09, 0.22, '#e8f6ff', 2.5 + k * 0.25, 0.92, 1.95, { seg: 12 }); bk.cyl(0.095, 0.095, 0.05, [R.accent, trim, '#8fe39a'][k], 2.5 + k * 0.25, 1.14, 1.95, { seg: 12 }); }
  bk.box(0.26, 0.4, 0.26, R.accent, 3.2, 0.92, 1.6, { r: 0.06 });
  g.add(mesh(bk, M.gloss, { ao: 0.25, aoHeight: 1 }));

  // ceiling
  const k = new Builder();
  k.plane(12.4, 10.4, '#fffaf6', 0, 4.2, -1.5, { rx: Math.PI / 2 }); // faces down only, so a high camera can look over it
  g.add(mesh(k, M.std, { ao: 0, cast: false }));
  return g;
}

// sky-blue gradient behind the windows (big backdrop)
export function backdrop() {
  const tex = canvasTex(4, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#8fd0ff'); g.addColorStop(0.6, '#d6f0ff'); g.addColorStop(1, '#fff0f6');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(60, 16, 12), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, toneMapped: false }));
  return m;
}
