// Ten Dream Homes, each a procedural model on its own little garden island.
import * as THREE from 'three';
import { Builder, shade, mix } from '../../src/engine/builder.js';
import { M } from '../../src/engine/materials.js';

function roof(b, w, d, h, color, x = 0, y = 0, z = 0) {
  // gabled roof along x
  const n = 8;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const ww = w + 0.3;
    b.cbox(ww, 0.12, (d / 2 + 0.2) * (1 - t) * 2 / 1, shade(color, 1 - (i % 2) * 0.06), x, y + h * t + 0.06, z, { r: 0.04 });
  }
  b.cbox(w + 0.4, 0.1, 0.16, shade(color, 0.8), x, y + h + 0.08, z, { r: 0.04 });
}
function windowAt(b, x, y, z, ry = 0, frame = '#ffffff', w = 0.6, h = 0.7) {
  const o = { r: 0.03, ry };
  const dx = Math.sin(ry) * 0.02, dz = Math.cos(ry) * 0.02;
  b.cbox(w + 0.12, h + 0.12, 0.08, frame, x, y, z, o);
  b.cbox(w, h, 0.09, '#9fdcff', x + dx, y, z + dz, o);
  b.cbox(w, 0.05, 0.1, frame, x + dx, y, z + dz, o);
  b.cbox(0.05, h, 0.1, frame, x + dx, y, z + dz, o);
  b.cbox(w + 0.2, 0.08, 0.16, frame, x + dx * 3, y - h / 2 - 0.08, z + dz * 3, o);
}
function door(b, x, z, color = '#ff8fc0', ry = 0) {
  b.box(0.7, 1.25, 0.1, shade(color, 0.85), x, 0, z, { r: 0.04, ry });
  b.box(0.58, 1.15, 0.12, color, x, 0, z, { r: 0.04, ry });
  b.sphere(0.04, '#ffd45e', x + 0.2, 0.6, z + 0.08);
}
function tree(b, x, z, s = 1, c = '#5fbf6a') {
  b.cyl(0.08 * s, 0.11 * s, 0.7 * s, '#8a5a3a', x, 0, z, { seg: 8 });
  b.sphere(0.5 * s, c, x, 0.95 * s, z, { ws: 12, hs: 8 });
  b.sphere(0.38 * s, shade(c, 1.1), x + 0.25 * s, 1.2 * s, z + 0.1 * s);
  b.sphere(0.34 * s, shade(c, 0.92), x - 0.25 * s, 1.15 * s, z - 0.1 * s);
}
function flowers(b, x, z, n = 5, w = 1.2) {
  const cs = ['#ff8fc0', '#ffd45e', '#ffffff', '#c7a2ff', '#ff6f6f'];
  for (let i = 0; i < n; i++) {
    const fx = x - w / 2 + (w * i) / Math.max(1, n - 1);
    b.cyl(0.012, 0.012, 0.22, '#4aa85a', fx, 0, z, { seg: 4 });
    b.sphere(0.07, cs[i % cs.length], fx, 0.24, z);
  }
}
function fence(b, x0, x1, z, color = '#ffffff') {
  const n = Math.round((x1 - x0) / 0.3);
  for (let i = 0; i <= n; i++) b.box(0.07, 0.42, 0.05, color, x0 + (i * (x1 - x0)) / n, 0, z, { r: 0.02 });
  b.cbox(x1 - x0, 0.05, 0.04, color, (x0 + x1) / 2, 0.3, z, { r: 0.01 });
}

const MODELS = {
  studio(b) {
    b.box(1.8, 1.5, 1.6, '#fff4e0', 0, 0, 0, { r: 0.08 });
    roof(b, 1.8, 1.6, 0.7, '#ff8fa3', 0, 1.5, 0);
    door(b, -0.3, 0.8);
    windowAt(b, 0.45, 0.85, 0.81);
    b.box(0.5, 0.25, 0.3, '#8fd46a', 0.5, 0, 1.1, { r: 0.1 });
    flowers(b, 0.5, 1.1, 3, 0.4);
    tree(b, 1.6, -0.4, 0.8);
  },
  cottage(b) {
    b.box(2.4, 1.6, 1.8, '#fff0d6', 0, 0, 0, { r: 0.08 });
    roof(b, 2.4, 1.8, 1.0, '#7fb8ff', 0, 1.6, 0);
    b.box(0.3, 0.9, 0.3, '#d9b8a0', 0.7, 2.0, -0.3, { r: 0.04 });
    door(b, 0, 0.9, '#7fc6ff');
    windowAt(b, -0.75, 0.9, 0.91); windowAt(b, 0.75, 0.9, 0.91);
    flowers(b, -0.8, 1.2, 4, 0.8); flowers(b, 0.8, 1.2, 4, 0.8);
    fence(b, -1.6, 1.6, 1.7);
    tree(b, -1.9, -0.6, 0.9);
  },
  beach(b) {
    for (const [x, z] of [[-0.9, -0.7], [0.9, -0.7], [-0.9, 0.7], [0.9, 0.7]]) b.cyl(0.07, 0.07, 0.6, '#c9a06b', x, 0, z, { seg: 8 });
    b.box(2.2, 0.12, 1.9, '#e0b27a', 0, 0.55, 0.1, { r: 0.03 });
    b.box(1.9, 1.3, 1.4, '#7fe0d0', 0, 0.67, -0.1, { r: 0.06 });
    roof(b, 1.9, 1.4, 0.9, '#ffe066', 0, 1.97, -0.1);
    door(b, 0.3, 0.61, '#ffffff');
    windowAt(b, -0.45, 1.35, 0.61);
    b.cbox(0.9, 0.06, 0.25, '#e0b27a', 0, 0.3, 1.2, { r: 0.02, rx: 0.5 });
    b.cone(0.5, 0.4, '#ff6f91', 1.6, 1.2, 0.8, { seg: 10 });
    b.cyl(0.02, 0.02, 1.2, '#ffffff', 1.6, 0, 0.8, { seg: 4 });
    b.cyl(0.08, 0.12, 1.8, '#a8845a', -1.6, 0, 0.4, { seg: 8, rz: 0.15 });
    for (let k = 0; k < 6; k++) b.sphere(0.35, '#4fbf5a', -1.35 + Math.cos(k) * 0.35, 1.85, 0.4 + Math.sin(k) * 0.35, { sy: 0.25 });
  },
  treehouse(b) {
    b.cyl(0.3, 0.45, 2.2, '#8a5a3a', 0, 0, 0, { seg: 10 });
    b.box(2.0, 0.14, 2.0, '#c98a4b', 0, 1.6, 0, { r: 0.04 });
    b.box(1.5, 1.1, 1.3, '#e0b27a', 0, 1.74, 0, { r: 0.05 });
    roof(b, 1.5, 1.3, 0.7, '#ff8f6b', 0, 2.84, 0);
    windowAt(b, 0.35, 2.35, 0.66); door(b, -0.3, 0.66, '#8fd46a');
    b.cbox(0.06, 1.7, 0.06, '#c98a4b', 1.05, 0.85, 0.9, { r: 0.01 }); b.cbox(0.06, 1.7, 0.06, '#c98a4b', 1.35, 0.85, 0.9, { r: 0.01 });
    for (let k = 0; k < 6; k++) b.cbox(0.34, 0.04, 0.05, '#c98a4b', 1.2, 0.2 + k * 0.26, 0.9, { r: 0.01 });
    for (let k = 0; k < 8; k++) { const a = k * 0.8; b.sphere(0.7, k % 2 ? '#5fbf6a' : '#4aa85a', Math.cos(a) * 0.9, 3.4 + (k % 3) * 0.25, Math.sin(a) * 0.9 - 0.3); }
    b.cyl(0.01, 0.01, 0.9, '#8a5a3a', -1.1, 0.7, 0.4, { seg: 4 }); b.box(0.5, 0.05, 0.2, '#ff8fc0', -1.1, 0.7, 0.4, { r: 0.02 });
  },
  loft(b) {
    b.box(2.4, 3.2, 1.8, '#c7d3e8', 0, 0, 0, { r: 0.05 });
    for (let fl = 0; fl < 3; fl++) for (const x of [-0.7, 0, 0.7]) windowAt(b, x, 0.6 + fl * 1.0, 0.91, 0, '#3e3550', 0.5, 0.7);
    b.box(2.6, 0.12, 2.0, '#3e3550', 0, 3.2, 0, { r: 0.03 });
    b.box(1.0, 0.5, 0.8, '#ffffff', 0.5, 3.32, -0.2, { r: 0.05 });
    for (let k = 0; k < 4; k++) b.sphere(0.2, '#5fbf6a', -0.8 + k * 0.25, 3.45, 0.6);
    b.box(2.6, 0.08, 0.4, '#ff6f91', 0, 0.95, 1.1, { r: 0.02, rx: 0.2 });
    door(b, 0.9, 0.91, '#ffd45e');
  },
  villa(b) {
    b.box(3.2, 1.8, 2.0, '#fffaf0', 0, 0, 0, { r: 0.06 });
    b.box(1.4, 1.2, 1.6, '#fffaf0', 1.2, 1.8, -0.2, { r: 0.06 });
    roof(b, 3.2, 2.0, 0.6, '#e8704a', 0, 1.8, 0);
    roof(b, 1.4, 1.6, 0.6, '#e8704a', 1.2, 3.0, -0.2);
    for (const x of [-1.1, -0.35]) windowAt(b, x, 0.95, 1.01, 0, '#5fae9a');
    door(b, 0.6, 1.01, '#5fae9a');
    for (const x of [-1.4, 1.4]) b.cyl(0.08, 0.08, 1.7, '#ffffff', x, 0, 1.25, { seg: 10 });
    b.box(3.1, 0.1, 0.7, '#ffffff', 0, 1.7, 1.3, { r: 0.02 });
    flowers(b, -1, 1.8, 6, 1.4); flowers(b, 1.2, 1.8, 5, 1.0);
    tree(b, -2.4, 0.5, 1); tree(b, 2.5, -0.6, 0.9, '#8fd46a');
    b.cyl(0.35, 0.4, 0.4, '#d0d0da', -2.2, 0, 1.8, { seg: 14 }); b.cyl(0.08, 0.08, 0.6, '#d0d0da', -2.2, 0.4, 1.8, { seg: 8 });
  },
  chalet(b) {
    b.box(3.0, 1.2, 2.2, '#d9b894', 0, 0, 0, { r: 0.05 });
    b.box(3.0, 1.1, 2.2, '#b58a60', 0, 1.2, 0, { r: 0.05 });
    for (let k = 0; k < 6; k++) b.cbox(3.02, 0.04, 2.22, shade('#b58a60', 0.85), 0, 1.3 + k * 0.18, 0, { r: 0 });
    roof(b, 3.0, 2.2, 1.3, '#7a4a3a', 0, 2.3, 0);
    b.box(3.2, 0.1, 0.8, '#8a5a3a', 0, 1.2, 1.5, { r: 0.02 });
    for (let k = 0; k < 9; k++) b.box(0.05, 0.4, 0.05, '#8a5a3a', -1.5 + k * 0.375, 1.3, 1.85, { r: 0.01 });
    windowAt(b, -0.8, 0.6, 1.11, 0, '#ffffff'); windowAt(b, 0.8, 0.6, 1.11, 0, '#ffffff');
    windowAt(b, 0, 1.8, 1.11, 0, '#ffffff', 0.9, 0.7);
    door(b, 0, 1.11, '#ff6f6f');
    for (const x of [-2.4, 2.5]) { b.cyl(0.1, 0.12, 0.5, '#8a5a3a', x, 0, -0.4, { seg: 8 }); b.cone(0.6, 1.2, '#3f8a5a', x, 0.4, -0.4); b.cone(0.45, 0.9, '#4a9a64', x, 1.0, -0.4); }
    b.cyl(1.1, 1.1, 0.03, '#6fc6ff', 1.8, 0.02, 2.2, { seg: 24 });
  },
  mansion(b) {
    b.box(4.4, 2.2, 2.4, '#ffffff', 0, 0, 0, { r: 0.06 });
    b.box(4.6, 0.14, 2.6, '#e8e0f0', 0, 2.2, 0, { r: 0.03 });
    b.box(2.6, 1.3, 1.8, '#ffffff', -0.4, 2.34, -0.2, { r: 0.06 });
    b.box(2.8, 0.12, 2.0, '#e8e0f0', -0.4, 3.64, -0.2, { r: 0.03 });
    for (const x of [-1.6, -0.8, 0.8, 1.6]) windowAt(b, x, 1.1, 1.21, 0, '#b58cff', 0.6, 1.0);
    for (const x of [-1.2, 0.4]) windowAt(b, x, 2.95, 0.71, 0, '#b58cff', 0.8, 0.8);
    door(b, 0, 1.21, '#b58cff');
    for (const x of [-0.5, 0.5]) b.cyl(0.08, 0.08, 2.1, '#ffffff', x, 0, 1.6, { seg: 12 });
    b.box(1.4, 0.1, 0.9, '#e8e0f0', 0, 2.1, 1.55, { r: 0.02 });
    b.box(3.2, 0.14, 1.6, '#e8f4ff', 0.2, 0, 2.9, { r: 0.05 });
    b.box(2.9, 0.02, 1.3, '#3fb8f0', 0.2, 0.13, 2.9, { r: 0 });
    for (const x of [-2.6, 2.7]) { b.cyl(0.08, 0.12, 2.2, '#b58a60', x, 0, 1.8, { seg: 8 }); for (let k = 0; k < 6; k++) b.sphere(0.4, '#4fbf5a', x + Math.cos(k) * 0.45, 2.25, 1.8 + Math.sin(k) * 0.45, { sy: 0.22 }); }
    b.box(0.8, 0.1, 0.4, '#ff8fc0', -1.3, 0.1, 2.9, { r: 0.05 });
  },
  castle(b) {
    const stone = '#f3e8ff', rf = '#ff8fc0';
    b.box(3.2, 2.2, 2.4, stone, 0, 0, 0, { r: 0.05 });
    for (let k = 0; k < 8; k++) b.box(0.26, 0.26, 0.26, stone, -1.45 + k * 0.415, 2.2, 1.1, { r: 0.03 });
    for (const [x, z] of [[-1.7, 1.3], [1.7, 1.3], [-1.7, -1.3], [1.7, -1.3]]) {
      b.cyl(0.55, 0.6, 3.2, stone, x, 0, z, { seg: 16 });
      b.cone(0.72, 1.3, rf, x, 3.2, z, { seg: 16 });
      b.cyl(0.01, 0.01, 0.5, '#8a7a9a', x, 4.5, z, { seg: 4 });
      b.box(0.3, 0.18, 0.02, '#ffd45e', x + 0.15, 4.75, z, { r: 0 });
      windowAt(b, x, 2.2, z + 0.58, 0, '#ffd45e', 0.28, 0.5);
    }
    b.cyl(0.7, 0.7, 3.8, stone, 0, 0, -0.3, { seg: 18 });
    b.cone(0.9, 1.8, rf, 0, 3.8, -0.3, { seg: 18 });
    b.box(1.0, 1.4, 0.14, '#b58cff', 0, 0, 1.2, { r: 0.3 });
    windowAt(b, -0.7, 1.4, 1.21, 0, '#ffd45e', 0.4, 0.6); windowAt(b, 0.7, 1.4, 1.21, 0, '#ffd45e', 0.4, 0.6);
    b.box(1.2, 0.08, 1.4, '#e0b27a', 0, 0, 1.9, { r: 0.02 });
    flowers(b, -1.5, 2.4, 5, 1.2); flowers(b, 1.5, 2.4, 5, 1.2);
  },
  palace(b) {
    const gold = '#ffd45e', wall = '#ffffff';
    for (let k = 0; k < 7; k++) { const a = k * 0.9; b.sphere(1.1, '#ffffff', Math.cos(a) * 1.8, -0.7, Math.sin(a) * 1.4, { sy: 0.45 }); }
    b.box(3.6, 1.8, 2.4, wall, 0, 0, 0, { r: 0.08 });
    b.box(2.4, 1.4, 1.8, '#f0f6ff', 0, 1.8, -0.1, { r: 0.08 });
    b.sphere(0.95, '#b8e0ff', 0, 3.2, -0.1, { sy: 0.9 });
    b.cone(0.12, 0.7, gold, 0, 3.95, -0.1);
    for (const s of [-1, 1]) {
      b.cyl(0.4, 0.45, 3.0, '#f0f6ff', s * 2.0, 0, 0.6, { seg: 16 });
      b.sphere(0.5, '#ffc4e8', s * 2.0, 3.1, 0.6);
      b.cone(0.08, 0.5, gold, s * 2.0, 3.5, 0.6);
    }
    for (const x of [-1.2, -0.4, 0.4, 1.2]) b.cyl(0.08, 0.08, 1.7, gold, x, 0, 1.3, { seg: 10 });
    b.box(3.0, 0.12, 0.5, gold, 0, 1.7, 1.3, { r: 0.03 });
    door(b, 0, 1.21, '#b8e0ff');
    for (const x of [-0.9, 0.9]) windowAt(b, x, 2.4, 0.81, 0, gold, 0.5, 0.6);
    b.torus(0.9, 0.08, '#ff8fc0', 0, 4.4, -1.4, { arc: Math.PI, ts: 20 });
    b.torus(0.8, 0.08, '#ffd45e', 0, 4.4, -1.4, { arc: Math.PI, ts: 20 });
    b.torus(0.7, 0.08, '#8fe39a', 0, 4.4, -1.4, { arc: Math.PI, ts: 20 });
    b.torus(0.6, 0.08, '#7fc6ff', 0, 4.4, -1.4, { arc: Math.PI, ts: 20 });
  },
};

export function buildHouse(id) {
  const g = new THREE.Group();
  const ground = new Builder();
  const sky = id === 'palace';
  ground.cyl(3.6, 3.2, 0.5, sky ? '#ffffff' : '#8fd46a', 0, -0.5, 0, { seg: 32 });
  if (!sky) {
    ground.cyl(3.2, 1.4, 1.2, '#c9a06b', 0, -1.7, 0, { seg: 24 });
    ground.cone(1.4, 1.0, '#b08a5a', 0, -2.7, 0, { seg: 16, rx: Math.PI });
    for (let k = 0; k < 7; k++) ground.box(0.5, 0.03, 0.28, '#e8ddd0', 0.2 * Math.sin(k), 0, 1.3 + k * 0.33, { r: 0.1 });
  }
  g.add(Object.assign(new THREE.Mesh(ground.build({ ao: 0 }), M.std), { receiveShadow: true }));
  const b = new Builder();
  (MODELS[id] || MODELS.studio)(b);
  const m = new THREE.Mesh(b.build({ ao: 0.22, aoHeight: 1.4 }), M.gloss);
  m.castShadow = true;
  m.receiveShadow = true;
  g.add(m);
  return g;
}

// silhouette material for houses she hasn't bought yet
export const lockedMat = new THREE.MeshStandardMaterial({ color: 0xc8b8e0, roughness: 0.9 });
export function setLocked(group, locked) {
  group.traverse((o) => {
    if (!o.isMesh) return;
    if (!o.userData.mat) o.userData.mat = o.material;
    o.material = locked ? lockedMat : o.userData.mat;
  });
}
