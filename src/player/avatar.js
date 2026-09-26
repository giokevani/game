// Cute blocky avatar (used for the player and NPCs). Every body part is one
// vertex-coloured mesh; the face is a small transparent textured plane.
import * as THREE from 'three';
import { Builder, shade } from '../engine/builder.js';
import { M } from '../engine/materials.js';
import { DEFAULT_LOOK } from '../data/avatar.js';

const faceCache = new Map();
function faceTexture(eye, closed, mood = 'happy') {
  const key = eye + closed + mood;
  if (faceCache.has(key)) return faceCache.get(key);
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const x = c.getContext('2d');
  x.lineCap = 'round';
  // blush
  x.fillStyle = 'rgba(255,120,150,0.35)';
  for (const s of [-1, 1]) { x.beginPath(); x.ellipse(128 + s * 78, 84, 24, 13, 0, 0, Math.PI * 2); x.fill(); }
  // eyes
  for (const s of [-1, 1]) {
    const ex = 128 + s * 50, ey = 58;
    if (closed) {
      x.strokeStyle = '#3a2a4a'; x.lineWidth = 7;
      x.beginPath(); x.arc(ex, ey - 4, 16, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
    } else {
      x.fillStyle = '#2a1f35';
      x.beginPath(); x.ellipse(ex, ey, 17, 23, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = eye;
      x.beginPath(); x.ellipse(ex, ey + 4, 13, 17, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#ffffff';
      x.beginPath(); x.ellipse(ex - 6, ey - 9, 7, 8, 0, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.ellipse(ex + 7, ey + 9, 3.5, 3.5, 0, 0, Math.PI * 2); x.fill();
      // lashes
      x.strokeStyle = '#2a1f35'; x.lineWidth = 4;
      x.beginPath(); x.moveTo(ex + s * 14, ey - 16); x.lineTo(ex + s * 22, ey - 22); x.stroke();
    }
  }
  // mouth
  x.strokeStyle = '#8a3a4a'; x.lineWidth = 6;
  if (mood === 'wow') {
    x.fillStyle = '#b3475e'; x.beginPath(); x.ellipse(128, 96, 10, 12, 0, 0, Math.PI * 2); x.fill();
  } else {
    x.beginPath(); x.arc(128, 84, 14, 0.2 * Math.PI, 0.8 * Math.PI); x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  faceCache.set(key, t);
  return t;
}

// ---------- part builders ----------
function buildHair(b, style, col, look) {
  const dk = shade(col, 0.85);
  const cap = () => {
    b.cbox(0.7, 0.34, 0.66, col, 0, 0.17, -0.02, { r: 0.17 });
    b.sphere(0.37, col, 0, 0.04, -0.1, { sx: 0.97, sy: 0.82, sz: 0.72 });
    for (let i = -1; i <= 1; i++) b.sphere(0.13, col, i * 0.17, 0.25, 0.25, { sy: 0.7, sz: 0.7 });
  };
  switch (style) {
    case 'hair_short':
      b.cbox(0.68, 0.3, 0.64, col, 0, 0.18, -0.02, { r: 0.15 });
      b.cbox(0.68, 0.3, 0.2, col, 0, 0.05, -0.23, { r: 0.1 });
      b.sphere(0.14, col, 0.12, 0.28, 0.24, { sy: 0.6 });
      break;
    case 'hair_bob':
      cap();
      for (const s of [-1, 1]) b.cbox(0.14, 0.5, 0.5, col, s * 0.34, -0.06, -0.02, { r: 0.07 });
      b.sphere(0.36, col, 0, -0.1, -0.16, { sx: 1.0, sy: 0.85, sz: 0.55 });
      break;
    case 'hair_long':
      cap();
      for (const s of [-1, 1]) b.cbox(0.15, 0.78, 0.42, col, s * 0.34, -0.2, -0.06, { r: 0.07 });
      b.sphere(0.36, col, 0, -0.28, -0.2, { sx: 1.0, sy: 1.2, sz: 0.42 });
      for (let i = -2; i <= 2; i++) b.sphere(0.1, i % 2 ? dk : col, i * 0.12, -0.7 + Math.abs(i) * 0.04, -0.22, { sy: 1.3, sz: 0.7 });
      break;
    case 'hair_ponytail':
      cap();
      b.sphere(0.07, look.hatColor || '#ff6f91', 0, 0.14, -0.36);
      b.sphere(0.16, col, 0, 0.06, -0.44);
      b.sphere(0.14, col, 0, -0.14, -0.47);
      b.sphere(0.11, dk, 0, -0.32, -0.45);
      break;
    case 'hair_pigtails':
      cap();
      for (const s of [-1, 1]) {
        b.sphere(0.06, '#ff6f91', s * 0.37, 0.05, -0.08);
        b.sphere(0.15, col, s * 0.45, -0.05, -0.08);
        b.sphere(0.13, col, s * 0.49, -0.24, -0.08);
        b.sphere(0.1, dk, s * 0.48, -0.4, -0.08);
      }
      break;
    case 'hair_bun':
      cap();
      for (const s of [-1, 1]) b.sphere(0.17, col, s * 0.24, 0.36, -0.06);
      break;
    case 'hair_curly':
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2, r = 0.34;
        const y = 0.14 + Math.sin(i * 1.7) * 0.12;
        if (Math.sin(a) > 0.55 && y < 0.2) continue;
        b.ico(0.15, i % 3 ? col : dk, Math.cos(a) * r, y, Math.sin(a) * r * 0.95 - 0.02, { detail: 1 });
      }
      b.ico(0.3, col, 0, 0.3, -0.04, { detail: 1, sy: 0.6 });
      b.ico(0.2, col, 0, -0.1, -0.28, { detail: 1 });
      break;
    case 'hair_braids':
      cap();
      for (const s of [-1, 1]) for (let i = 0; i < 6; i++) b.sphere(0.085, i % 2 ? col : dk, s * 0.3, -0.18 - i * 0.12, 0.1 - i * 0.01);
      break;
    case 'hair_princess':
      cap();
      b.sphere(0.24, col, 0, 0.42, -0.1);
      b.torus(0.16, 0.06, '#fff3a8', 0, 0.34, -0.1, { rx: Math.PI / 2 });
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) b.sphere(0.08, col, s * 0.35, -0.12 - i * 0.11, 0.08);
      break;
  }
}

function buildHat(b, id, col) {
  switch (id) {
    case 'hat_bow':
      for (const s of [-1, 1]) b.sphere(0.14, col, s * 0.13, 0.4, -0.02, { sx: 1.2, sy: 0.8, sz: 0.45, rz: s * 0.4 });
      b.sphere(0.07, shade(col, 0.85), 0, 0.4, 0);
      break;
    case 'hat_cap':
      b.sphere(0.36, col, 0, 0.2, -0.02, { sy: 0.7 });
      b.cbox(0.5, 0.05, 0.3, shade(col, 0.85), 0, 0.2, 0.32, { r: 0.02 });
      break;
    case 'hat_flower': {
      const c = ['#ff8fc0', '#ffffff', '#ffd45e', '#c59bff'];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        b.sphere(0.075, c[i % 4], Math.cos(a) * 0.34, 0.34, Math.sin(a) * 0.32);
        if (i % 3 === 0) b.sphere(0.05, '#6fbf5a', Math.cos(a + 0.26) * 0.35, 0.32, Math.sin(a + 0.26) * 0.33);
      }
      break;
    }
    case 'hat_cat':
      for (const s of [-1, 1]) {
        b.cone(0.13, 0.24, col, s * 0.22, 0.34, 0, { seg: 4, rz: -s * 0.2 });
        b.cone(0.07, 0.14, '#ffb3d0', s * 0.22, 0.37, 0.05, { seg: 4, rz: -s * 0.2 });
      }
      break;
    case 'hat_bunny':
      for (const s of [-1, 1]) {
        b.sphere(0.09, col, s * 0.15, 0.62, 0, { sy: 3, rz: -s * 0.15 });
        b.sphere(0.05, '#ffb3d0', s * 0.15, 0.62, 0.05, { sy: 3.5, rz: -s * 0.15 });
      }
      break;
    case 'hat_beanie':
      b.sphere(0.37, col, 0, 0.18, -0.02, { sy: 0.78 });
      b.torus(0.34, 0.06, shade(col, 0.85), 0, 0.12, -0.02, { rx: Math.PI / 2 });
      b.sphere(0.1, '#ffffff', 0, 0.5, -0.02);
      break;
    case 'hat_sun':
      b.cyl(0.62, 0.62, 0.04, col, 0, 0.3, 0, { seg: 24 });
      b.sphere(0.3, col, 0, 0.32, 0, { sy: 0.7 });
      b.torus(0.3, 0.04, '#ff8fc0', 0, 0.36, 0, { rx: Math.PI / 2 });
      break;
    case 'hat_tiara':
      b.torus(0.3, 0.025, '#ffd36b', 0, 0.3, 0.02, { rx: Math.PI / 2 - 0.3 });
      for (let i = -2; i <= 2; i++) b.cone(0.04, 0.12 - Math.abs(i) * 0.025, '#ffd36b', i * 0.1, 0.34, 0.28 - Math.abs(i) * 0.03, { seg: 4 });
      b.sphere(0.04, '#ff6fb0', 0, 0.42, 0.26);
      break;
    case 'hat_unicorn':
      b.cone(0.07, 0.34, '#fff3b0', 0, 0.36, 0.14, { seg: 8, rx: 0.3 });
      b.torus(0.07, 0.02, '#ff9ad5', 0, 0.44, 0.17, { rx: Math.PI / 2 - 0.3 });
      for (const s of [-1, 1]) b.cone(0.07, 0.14, '#ffffff', s * 0.23, 0.33, -0.02, { seg: 4, rz: -s * 0.3 });
      break;
  }
}

function buildFaceAcc(b, id, col) {
  if (id === 'acc_glasses') {
    for (const s of [-1, 1]) b.torus(0.085, 0.018, '#5d4b6b', s * 0.13, 0.02, 0.3, { ts: 16 });
    b.cbox(0.08, 0.02, 0.02, '#5d4b6b', 0, 0.04, 0.3, { r: 0 });
  } else if (id === 'acc_star') {
    for (const s of [-1, 1]) b.cyl(0.1, 0.1, 0.03, col, s * 0.13, 0.02, 0.305, { seg: 5, rx: Math.PI / 2, center: true });
    b.cbox(0.08, 0.02, 0.02, col, 0, 0.04, 0.3, { r: 0 });
  }
}

export class Avatar {
  constructor(look = DEFAULT_LOOK, o = {}) {
    this.root = new THREE.Group();
    this.body = new THREE.Group();
    this.root.add(this.body);
    this.scale = o.scale || 1;
    this.root.scale.setScalar(this.scale);
    this.t = Math.random() * 10;
    this.walk = 0;
    this.blinkT = 2 + Math.random() * 3;
    this.emote = null;
    this.emoteT = 0;
    this.pose = 'stand';
    this.meshes = [];

    this.hips = new THREE.Group(); this.hips.position.y = 0.72; this.body.add(this.hips);
    this.torso = new THREE.Mesh(undefined, M.std); this.hips.add(this.torso);
    this.head = new THREE.Group(); this.head.position.y = 0.66 + 0.3; this.hips.add(this.head);
    this.headMesh = new THREE.Mesh(undefined, M.std); this.head.add(this.headMesh);
    this.faceMat = new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    this.face = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.27), this.faceMat);
    this.face.position.set(0, -0.04, 0.293);
    this.head.add(this.face);
    this.armL = new THREE.Group(); this.armL.position.set(-0.43, 0.58, 0); this.hips.add(this.armL);
    this.armR = new THREE.Group(); this.armR.position.set(0.43, 0.58, 0); this.hips.add(this.armR);
    this.armLM = new THREE.Mesh(undefined, M.std); this.armL.add(this.armLM);
    this.armRM = new THREE.Mesh(undefined, M.std); this.armR.add(this.armRM);
    this.legL = new THREE.Group(); this.legL.position.set(-0.15, 0, 0); this.hips.add(this.legL);
    this.legR = new THREE.Group(); this.legR.position.set(0.15, 0, 0); this.hips.add(this.legR);
    this.legLM = new THREE.Mesh(undefined, M.std); this.legL.add(this.legLM);
    this.legRM = new THREE.Mesh(undefined, M.std); this.legR.add(this.legRM);
    this.wings = new THREE.Group(); this.wings.position.set(0, 0.42, -0.2); this.hips.add(this.wings);
    this.wingL = new THREE.Mesh(undefined, M.gloss); this.wingR = new THREE.Mesh(undefined, M.gloss);
    this.wings.add(this.wingL, this.wingR);
    for (const m of [this.torso, this.headMesh, this.armLM, this.armRM, this.legLM, this.legRM, this.wingL, this.wingR]) {
      m.castShadow = true; m.receiveShadow = true;
    }
    this.setLook(look);
  }

  setLook(look) {
    this.look = { ...DEFAULT_LOOK, ...look };
    const L = this.look;
    const skin = L.skin;
    const isDress = !!L.dress;
    const topCol = isDress ? L.dressColor : L.topColor;
    const botCol = isDress ? L.dressColor : L.bottomColor;
    const top = isDress ? 'dress' : L.top;
    const bottom = isDress ? L.dress : L.bottom;

    // torso
    const t = new Builder();
    t.cbox(0.64, 0.64, 0.36, topCol, 0, 0.32, 0, { r: 0.12 });
    t.cyl(0.11, 0.12, 0.12, skin, 0, 0.6, 0);
    if (top === 'top_hoodie') {
      t.cbox(0.5, 0.3, 0.16, shade(topCol, 0.9), 0, 0.64, -0.2, { r: 0.08 });
      t.cbox(0.36, 0.16, 0.04, shade(topCol, 0.88), 0, 0.14, 0.18, { r: 0.04 });
    } else if (top === 'top_sweater') {
      t.sphere(0.06, '#ff5d8f', -0.035, 0.36, 0.18, { sz: 0.4 });
      t.sphere(0.06, '#ff5d8f', 0.035, 0.36, 0.18, { sz: 0.4 });
      t.cone(0.075, 0.09, '#ff5d8f', 0, 0.3, 0.18, { rx: Math.PI, seg: 4, center: true });
      t.cbox(0.66, 0.08, 0.38, shade(topCol, 0.85), 0, 0.04, 0, { r: 0.03 });
    } else if (top === 'top_jacket') {
      t.cbox(0.2, 0.6, 0.04, '#ffffff', 0, 0.3, 0.17, { r: 0.02 });
    } else if (top === 'top_tank') {
      t.cbox(0.16, 0.12, 0.3, skin, -0.24, 0.6, 0, { r: 0.04 });
      t.cbox(0.16, 0.12, 0.3, skin, 0.24, 0.6, 0, { r: 0.04 });
    } else if (top === 'top_blouse') {
      t.cbox(0.3, 0.08, 0.05, '#ffffff', 0, 0.56, 0.17, { r: 0.03 });
    }
    // skirt-like bottoms hang from the torso
    if (bottom === 'bot_skirt') t.cyl(0.36, 0.48, 0.34, botCol, 0, -0.26, 0, { seg: 16 });
    if (bottom === 'bot_tutu') {
      t.cyl(0.4, 0.58, 0.14, botCol, 0, -0.1, 0, { seg: 18 });
      t.cyl(0.42, 0.62, 0.12, shade(botCol, 1.1), 0, -0.2, 0, { seg: 18 });
    }
    if (bottom === 'bot_long') t.cyl(0.36, 0.56, 0.66, botCol, 0, -0.6, 0, { seg: 18 });
    if (bottom === 'dress_sun') t.cyl(0.36, 0.52, 0.42, botCol, 0, -0.32, 0, { seg: 18 });
    if (bottom === 'dress_party') {
      t.cyl(0.36, 0.6, 0.4, botCol, 0, -0.3, 0, { seg: 20 });
      t.cyl(0.38, 0.64, 0.12, shade(botCol, 1.15), 0, -0.34, 0, { seg: 20 });
      t.torus(0.33, 0.04, '#ffffff', 0, 0.0, 0, { rx: Math.PI / 2 });
    }
    if (bottom === 'dress_gown') {
      t.cyl(0.36, 0.72, 0.72, botCol, 0, -0.66, 0, { seg: 24 });
      for (let i = 0; i < 14; i++) t.sphere(0.025, '#fff7c2', Math.cos(i) * 0.55, -0.5 + (i % 4) * 0.12, Math.sin(i) * 0.55);
    }
    if (L.acc === 'acc_backpack') {
      t.cbox(0.46, 0.5, 0.2, L.accColor, 0, 0.3, -0.27, { r: 0.1 });
      t.cbox(0.3, 0.16, 0.06, shade(L.accColor, 0.85), 0, 0.2, -0.38, { r: 0.04 });
    }
    if (L.acc === 'acc_scarf') {
      t.torus(0.2, 0.07, L.accColor, 0, 0.62, 0, { rx: Math.PI / 2 });
      t.cbox(0.12, 0.3, 0.06, L.accColor, 0.12, 0.45, 0.2, { r: 0.03 });
    }
    if (L.acc === 'acc_cape') t.cbox(0.62, 1.0, 0.05, L.accColor, 0, 0.1, -0.22, { r: 0.03, rx: 0.08 });
    this.torso.geometry?.dispose();
    this.torso.geometry = t.build({ ao: 0.12, aoHeight: 1, aoBase: -0.5 });

    // arms
    const arm = (side) => {
      const a = new Builder();
      const longSleeve = ['top_hoodie', 'top_sweater', 'top_jacket'].includes(top);
      const sleeveless = top === 'top_tank' || bottom === 'dress_sun' || bottom === 'dress_gown';
      if (sleeveless) a.cbox(0.2, 0.52, 0.22, skin, 0, -0.26, 0, { r: 0.09 });
      else if (longSleeve) a.cbox(0.22, 0.52, 0.24, topCol, 0, -0.26, 0, { r: 0.09 });
      else {
        a.cbox(0.22, 0.22, 0.24, topCol, 0, -0.1, 0, { r: 0.09 });
        a.cbox(0.19, 0.34, 0.2, skin, 0, -0.34, 0, { r: 0.08 });
      }
      if (top === 'top_blouse' || bottom === 'dress_party') a.sphere(0.16, topCol, 0, -0.06, 0);
      a.sphere(0.11, skin, 0, -0.55, 0);
      return a.build({ ao: 0 });
    };
    this.armLM.geometry?.dispose(); this.armLM.geometry = arm(-1);
    this.armRM.geometry?.dispose(); this.armRM.geometry = arm(1);

    // legs
    const leg = () => {
      const g = new Builder();
      const full = bottom === 'bot_pants';
      if (full) g.cbox(0.27, 0.6, 0.29, botCol, 0, -0.3, 0, { r: 0.1 });
      else if (bottom === 'bot_shorts') {
        g.cbox(0.28, 0.24, 0.3, botCol, 0, -0.1, 0, { r: 0.1 });
        g.cbox(0.22, 0.42, 0.24, skin, 0, -0.38, 0, { r: 0.09 });
      } else g.cbox(0.22, 0.6, 0.24, skin, 0, -0.3, 0, { r: 0.09 });
      g.cbox(0.28, 0.16, 0.38, L.shoes, 0, -0.64, 0.04, { r: 0.07 });
      g.cbox(0.29, 0.04, 0.39, shade(L.shoes, 0.85), 0, -0.71, 0.04, { r: 0.015 });
      return g.build({ ao: 0 });
    };
    this.legLM.geometry?.dispose(); this.legLM.geometry = leg();
    this.legRM.geometry?.dispose(); this.legRM.geometry = leg();

    // head
    const h = new Builder();
    h.cbox(0.62, 0.58, 0.58, skin, 0, 0, 0, { r: 0.22 });
    for (const s of [-1, 1]) h.sphere(0.07, skin, s * 0.31, -0.02, 0, { sx: 0.6 });
    buildHair(h, L.hair, L.hairColor, L);
    buildHat(h, L.hat, L.hatColor);
    buildFaceAcc(h, L.acc, L.accColor);
    this.headMesh.geometry?.dispose();
    this.headMesh.geometry = h.build({ ao: 0 });

    // wings
    const hasWings = L.acc === 'acc_wings' || L.acc === 'acc_angel';
    this.wings.visible = hasWings;
    if (hasWings) {
      const w = new Builder();
      const c = L.acc === 'acc_angel' ? '#ffffff' : L.accColor;
      w.sphere(0.36, c, 0.36, 0.14, 0, { sx: 1.1, sy: 0.7, sz: 0.1, rz: 0.5 });
      w.sphere(0.26, shade(c, 1.1), 0.3, -0.2, 0, { sx: 1.0, sy: 0.6, sz: 0.1, rz: -0.4 });
      const g = w.build({ ao: 0 });
      this.wingR.geometry = g;
      this.wingL.geometry = g;
      this.wingL.scale.x = -1;
    }
    this.faceOpen = faceTexture(L.eyes, false);
    this.faceClosed = faceTexture(L.eyes, true);
    this.faceWow = faceTexture(L.eyes, false, 'wow');
    this.faceMat.map = this.faceOpen;
    this.faceMat.needsUpdate = true;
  }

  playEmote(id, dur = 2.4) {
    this.emote = id;
    this.emoteT = dur;
  }

  // speed: 0..1 walking fraction, air: airborne, pose: 'stand' | 'sit' | 'sleep' | 'drive'
  update(dt, speed = 0, air = false) {
    this.t += dt;
    const t = this.t;
    const lerp = (a, b, k) => a + (b - a) * Math.min(1, k * dt);
    this.walk += dt * (6 + speed * 6) * (speed > 0.05 ? 1 : 0);
    const sw = Math.sin(this.walk) * Math.min(1, speed * 1.4);

    // blink
    this.blinkT -= dt;
    if (this.blinkT < 0) {
      this.faceMat.map = this.faceClosed;
      if (this.blinkT < -0.13) { this.faceMat.map = this.faceOpen; this.blinkT = 2 + Math.random() * 4; }
    }

    let aL = sw * 0.8, aR = -sw * 0.8, lL = -sw * 0.8, lR = sw * 0.8, bodyY = Math.abs(Math.sin(this.walk)) * 0.05 * speed;
    let aLz = 0.06, aRz = -0.06, lean = speed * 0.08, headX = 0, spin = 0, hipsY = 0.72;
    let rootTilt = 0;

    if (this.pose === 'sit' || this.pose === 'drive') {
      lL = lR = -1.45; aL = aR = this.pose === 'drive' ? -0.9 : -0.25; hipsY = 0.5; lean = -0.05; bodyY = 0;
    } else if (this.pose === 'sleep') {
      lL = lR = 0; aL = aR = 0; hipsY = 0.72; rootTilt = -Math.PI / 2; bodyY = 0;
    } else if (air) {
      aL = aR = -2.6; aLz = 0.3; aRz = -0.3; lL = 0.4; lR = -0.5;
    } else if (speed < 0.05) {
      // idle breathing
      aL = Math.sin(t * 1.6) * 0.04; aR = -aL;
      bodyY = Math.sin(t * 2.0) * 0.012;
    }

    if (this.emote && this.pose === 'stand') {
      this.emoteT -= dt;
      const e = this.emote;
      if (e === 'wave') { aR = -2.7 + Math.sin(t * 12) * 0.35; aRz = -0.5; }
      else if (e === 'cheer') { aL = aR = -2.9; aLz = 0.4; aRz = -0.4; bodyY = Math.abs(Math.sin(t * 8)) * 0.25; }
      else if (e === 'dance') {
        aL = -1.4 + Math.sin(t * 8) * 1.2; aR = -1.4 - Math.sin(t * 8) * 1.2;
        lL = Math.sin(t * 8) * 0.5; lR = -lL; bodyY = Math.abs(Math.sin(t * 8)) * 0.12; spin = Math.sin(t * 4) * 0.5;
      } else if (e === 'spin') { spin = (2.4 - this.emoteT) * 5.5; aLz = 1.2; aRz = -1.2; }
      else if (e === 'heart') { aL = aR = -1.2; aLz = -0.6; aRz = 0.6; headX = -0.15; }
      else if (e === 'sit') { lL = lR = -1.45; hipsY = 0.36; aL = aR = -0.3; }
      if (this.emoteT <= 0) this.emote = null;
    }

    this.armL.rotation.x = lerp(this.armL.rotation.x, aL, 14);
    this.armR.rotation.x = lerp(this.armR.rotation.x, aR, 14);
    this.armL.rotation.z = lerp(this.armL.rotation.z, aLz, 10);
    this.armR.rotation.z = lerp(this.armR.rotation.z, aRz, 10);
    this.legL.rotation.x = lerp(this.legL.rotation.x, lL, 14);
    this.legR.rotation.x = lerp(this.legR.rotation.x, lR, 14);
    this.hips.position.y = lerp(this.hips.position.y, hipsY + bodyY, 18);
    this.hips.rotation.x = lerp(this.hips.rotation.x, lean, 8);
    this.head.rotation.x = lerp(this.head.rotation.x, headX, 8);
    this.body.rotation.y = spin;
    this.body.rotation.x = lerp(this.body.rotation.x, rootTilt, 8);
    this.body.position.y = rootTilt ? 0.3 : 0;
    if (this.wings.visible) {
      const f = Math.sin(t * (air ? 14 : 3)) * (air ? 0.5 : 0.18);
      this.wingR.rotation.y = -0.3 - f;
      this.wingL.rotation.y = 0.3 + f;
    }
  }

  setMood(m) {
    this.faceMat.map = m === 'wow' ? this.faceWow : this.faceOpen;
  }
}
