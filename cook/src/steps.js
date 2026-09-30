// The hands-on cooking steps. Each step is a small touch mini-game on the
// counter and resolves with a quality between 0 and 1.
import * as THREE from 'three';
import { Builder, Geo, mix, shade } from '../../src/engine/builder.js';
import { M } from '../../src/engine/materials.js';
import { h } from '../../src/ui/ui.js';
import * as MD from './models.js';
import { WORD } from './data.js';
import { COUNTER_Y } from './restaurant.js';
import { speak } from './i18n.js';

const CONTAINER = { pancakes: 'bowl', smoothie: 'blender', milkshake: 'blender', spaghetti: 'pan', cupcakes: 'bowl', cake: 'bowl', cookies: 'bowl', fruitsalad: 'bowl', salad: 'bowl', miso: 'pot' };
const ADD_POOL = ['flour', 'egg', 'milk', 'sugar', 'butter', 'chocolate', 'strawberry', 'banana', 'blueberry', 'icecream', 'vanilla', 'cheese', 'tomato', 'apple', 'orange', 'pasta', 'sauce', 'cream', 'rice', 'carrot', 'lemon', 'salt'];
const JUICY = new Set(['tomato', 'orange', 'lemon', 'strawberry', 'cucumber', 'apple', 'pepper']);
const TAU = Math.PI * 2;

const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const tintMat = (hex) => { const m = MD.FOOD.clone(); m.color.set(hex); m.userData.own = true; return m; };

function dashedLine(len, color = '#5a2a6a') {
  const tex = new THREE.CanvasTexture((() => {
    const c = document.createElement('canvas'); c.width = 16; c.height = 256;
    const x = c.getContext('2d');
    for (let i = 0; i < 8; i++) { x.fillStyle = '#ffffff'; x.fillRect(0, i * 32, 16, 20); x.fillStyle = color; x.fillRect(3, i * 32 + 2, 10, 16); }
    return c;
  })());
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.018, len), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 20;
  m.userData.own = true;
  return m;
}

function ghostRing(r = 0.03) {
  const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.75, r, 20), new THREE.MeshBasicMaterial({ color: 0xff7eb6, transparent: true, opacity: 0.8, depthTest: false }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 20;
  return m;
}

function spoon() {
  const b = new Builder();
  b.cyl(0.008, 0.01, 0.26, '#ffb3d1', 0, 0.02, 0);
  b.sphere(0.03, '#ff8fc0', 0, 0.02, 0, { sy: 0.4 });
  return MD.meshOf(b, M.gloss, { ao: 0 });
}

export function disposeTree(o) {
  o.traverse((c) => {
    if (!c.isMesh && !c.isSprite) return;
    if (c.geometry && !c.userData.keep) c.geometry.dispose();
    if (c.material?.userData?.own) { c.material.map?.dispose(); c.material.dispose(); }
    if (c.userData.own && c.material) { c.material.map?.dispose(); c.material.dispose(); }
  });
}

export class Kitchen {
  constructor(game) {
    this.game = game;
    this.work = new THREE.Group();
    this.work.position.set(0, COUNTER_Y, 0.05);
    this.dish = new THREE.Group();
    this.props = new THREE.Group();
    this.work.add(this.dish, this.props);
    this.updaters = new Set();
    this.stepOffs = [];
    this.ray = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.bottom = null; // DOM container for controls (set by the game)
    this.finishNow = null; // test hook: completes the current step
  }

  update(dt) { for (const f of [...this.updaters]) f(dt); }
  every(fn, stepScoped = true) {
    this.updaters.add(fn);
    const off = () => this.updaters.delete(fn);
    if (stepScoped) this.stepOffs.push(off);
    return off;
  }
  anim(dur, fn) {
    return new Promise((res) => {
      let t = 0;
      const f = (dt) => { t += dt; const k = Math.min(1, t / dur); fn(k); if (k >= 1) { this.updaters.delete(f); res(); } };
      this.updaters.add(f);
    });
  }
  wait(s) { return this.anim(s, () => {}); }
  sfx(n) { this.game.audio.play(n); }
  burst(localPos, kind, o) { const p = this.work.localToWorld(localPos.clone()); this.game.fx.burst(p, kind, { dy: 0, spread: 0.08, scale: 0.35, ...o }); }

  // pointer -> point on a horizontal plane at local height y
  local(e, y = 0) {
    const r = this.game.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(ndc, this.game.camera);
    this.plane.constant = -(this.work.position.y + y);
    const p = new THREE.Vector3();
    if (!this.ray.ray.intersectPlane(this.plane, p)) return null;
    return this.work.worldToLocal(p);
  }
  // local point -> screen pixels (used by tests and hints)
  screenOf(v) {
    const p = this.work.localToWorld(new THREE.Vector3(v.x, v.y, v.z)).project(this.game.camera);
    const r = this.game.renderer.domElement.getBoundingClientRect();
    return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
  }
  input(hd) {
    const el = this.game.renderer.domElement;
    let down = false;
    const d = (e) => { if (e.button > 0) return; down = true; hd.down?.(e); };
    const m = (e) => hd.move?.(e, down);
    const u = (e) => { if (!down) return; down = false; hd.up?.(e); };
    el.addEventListener('pointerdown', d);
    window.addEventListener('pointermove', m);
    window.addEventListener('pointerup', u);
    window.addEventListener('pointercancel', u);
    this.stepOffs.push(() => {
      el.removeEventListener('pointerdown', d);
      window.removeEventListener('pointermove', m);
      window.removeEventListener('pointerup', u);
      window.removeEventListener('pointercancel', u);
    });
  }
  endStep() {
    for (const f of this.stepOffs) f();
    this.stepOffs = [];
    this.finishNow = null;
    if (this.bottom) this.bottom.innerHTML = '';
  }
  clearProps() { disposeTree(this.props); this.props.clear(); }
  setDish(kind, ...objs) {
    disposeTree(this.dish);
    this.dish.clear();
    this.dish.visible = true;
    for (const o of objs) this.dish.add(o);
    this.dishKind = kind;
  }
  resetOrder(order) {
    this.order = order;
    this.recipe = order.recipe;
    this.chopped = [];
    this.cooked = {};
    this.mixColor = null;
    this.surface = null;
    this.cont = null;
    this.roll = null;
    this.clearProps();
    this.setDish(null);
    this.dish.position.set(0, 0, 0);
    this.dish.scale.setScalar(1);
    this.dish.rotation.set(0, 0, 0);
  }
  controls(...els) {
    if (!this.bottom) return;
    this.bottom.innerHTML = '';
    for (const e of els) if (e) this.bottom.appendChild(e);
  }
  progress(f) { this.game.hud?.stepProgress(f); }

  // one step: returns quality 0..1
  async run(step) {
    this.step = step;
    this.runCount = (this.runCount || 0) + 1;
    this.clearProps();
    this.progress(0);
    let q = 1;
    try {
      q = await this['s_' + step.t](step);
    } finally {
      this.endStep();
    }
    this.progress(1);
    return Math.max(0, Math.min(1, q));
  }

  // resolve helper: a promise the step (or a test) can finish
  finisher() {
    let done;
    const p = new Promise((r) => { done = r; });
    let fired = false;
    const finish = (q) => { if (fired) return; fired = true; done(q); };
    this.finishNow = () => finish(1);
    return { p, finish };
  }

  tray(items, onPick) {
    const el = h('div', { class: 'tray' });
    for (const id of items) {
      const w = WORD[id];
      const b = h('button', { class: 'tray-btn', 'data-id': id }, h('span', { class: 'em' }, w?.emoji || '❓'), h('span', { class: 'w' }, w?.en || id));
      b.addEventListener('click', () => onPick(id, b));
      el.appendChild(b);
    }
    return el;
  }
  shake(btn) { btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake'); this.sfx('no'); }

  // ---------- containers ----------
  ensureContainer(kind) {
    if (this.dishKind === 'cont:' + kind) return this.cont;
    const g = [];
    let fillY, r, top;
    if (kind === 'blender') { g.push(MD.blender()); fillY = 0.14; r = 0.085; top = 0.4; }
    else if (kind === 'pot') { const s = MD.stove(); const p = MD.pot(); p.position.y = 0.03; g.push(s, p); fillY = 0.06; r = 0.165; top = 0.24; }
    else if (kind === 'pan') { const s = MD.stove(); const p = MD.pan(); p.position.y = 0.03; g.push(s, p); fillY = 0.05; r = 0.18; top = 0.1; }
    else { g.push(MD.bowl('#ffffff', 0.2, 0.13)); fillY = 0.03; r = 0.17; top = 0.14; }
    const fill = MD.fill(r, '#ffffff');
    fill.material.userData.own = true;
    fill.position.y = fillY;
    fill.visible = false;
    const blobs = new THREE.Group();
    blobs.position.y = fillY;
    this.setDish('cont:' + kind, ...g, fill, blobs);
    this.cont = { kind, fill, blobs, r, top, n: 0 };
    return this.cont;
  }
  addToContainer(id, color) {
    const c = this.cont;
    c.n++;
    this.mixColor = this.mixColor ? mix(this.mixColor, color, 1 / c.n) : color;
    if (!c.fill.visible) { c.fill.visible = true; c.fill.material.color.set(color); c.firstColor = color; }
    c.fill.position.y += c.kind === 'blender' ? 0.035 : 0.012;
    c.blobs.position.y = c.fill.position.y + 0.012;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), new THREE.MeshStandardMaterial({ color, roughness: 0.4 }));
    b.material.userData.own = true;
    b.scale.set(1, 0.25, 1);
    const a = Math.random() * TAU, rr = Math.random() * c.r * 0.45;
    b.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr);
    b.userData.blob = true;
    c.blobs.add(b);
  }

  // ---------- ADD: pick the right ingredients ----------
  async s_add(step) {
    const c = this.ensureContainer(CONTAINER[this.recipe] || 'bowl');
    const need = new Set(step.items);
    const extra = shuffle(ADD_POOL.filter((i) => !need.has(i))).slice(0, Math.max(2, 6 - need.size));
    const { p, finish } = this.finisher();
    let wrong = 0;
    const tray = this.tray(shuffle([...need, ...extra]), async (id, btn) => {
      if (!need.has(id)) { wrong++; this.shake(btn); return; }
      need.delete(id);
      btn.classList.add('ok');
      btn.disabled = true;
      this.sfx('pick');
      speak(WORD[id].en, false);
      const m = MD.wholeModel(id);
      m.position.set(0, c.top + 0.35, 0);
      this.props.add(m);
      const y0 = m.position.y, y1 = c.fill.position.y + 0.02;
      await this.anim(0.45, (k) => { m.position.y = y0 + (y1 - y0) * k * k; m.rotation.z = k * 2; });
      this.props.remove(m);
      disposeTree(m);
      this.addToContainer(id, MD.col(id));
      this.burst(new THREE.Vector3(0, y1, 0), id === 'flour' || id === 'sugar' ? 'puff' : 'sparkle', { n: 8 });
      this.sfx('pop');
      this.progress(1 - need.size / step.items.length);
      if (!need.size) { await this.wait(0.35); finish(Math.max(0.4, 1 - wrong * 0.2)); }
    });
    this.controls(tray);
    this.finishNow = () => [...tray.children].filter((b) => need.has(b.dataset.id)).forEach((b) => b.click());
    return p;
  }

  // ---------- STIR: draw circles ----------
  async s_stir(step) {
    let c = this.cont;
    if (!c || this.dishKind !== 'cont:' + c.kind) {
      c = this.ensureContainer('bowl');
      c.fill.visible = false;
      for (const id of this.chopped) {
        for (let k = 0; k < 7; k++) {
          const s = MD.sliceMesh(id, 0.75);
          s.userData.keep = true;
          const a = Math.random() * TAU, rr = 0.03 + Math.random() * 0.1;
          s.position.set(Math.cos(a) * rr, 0.01 + Math.random() * 0.05, Math.sin(a) * rr);
          s.rotation.set(Math.random() - 0.5, Math.random() * TAU, Math.random() - 0.5);
          c.blobs.add(s);
        }
      }
      c.blobs.position.y = 0.03;
    }
    const blender = c.kind === 'blender';
    const sp = blender ? null : spoon();
    if (sp) { sp.position.set(c.r * 0.5, c.top - 0.02, 0); sp.rotation.z = -0.3; this.props.add(sp); }
    const { p, finish } = this.finisher();
    const need = step.turns * TAU;
    let acc = 0, last = null, t0 = performance.now(), lastPop = 0;
    const startCol = new THREE.Color(c.firstColor || '#ffffff');
    const endCol = new THREE.Color(this.mixColor || '#ffffff');
    const apply = (delta) => {
      acc += Math.abs(delta);
      const k = Math.min(1, acc / need);
      c.fill.rotation.y += delta;
      c.blobs.rotation.y += delta * 1.2;
      for (const b of c.blobs.children) if (b.userData.blob) b.scale.set(1 - k * 0.95, 0.25 * (1 - k * 0.95), 1 - k * 0.95);
      c.fill.material.color.copy(startCol).lerp(endCol, k);
      if (blender) this.dish.children[0].position.x = (Math.random() - 0.5) * 0.006;
      if (acc - lastPop > TAU) { lastPop = acc; this.sfx(blender ? 'vroom' : 'pop'); }
      this.progress(k);
      if (k >= 1) {
        const secs = (performance.now() - t0) / 1000;
        finish(secs < 14 ? 1 : 0.85);
      }
    };
    this.finishNow = () => { apply(need); };
    this.input({
      down: (e) => { const q = this.local(e, c.top * 0.5); if (q) last = Math.atan2(q.z, q.x); },
      move: (e, down) => {
        if (!down) return;
        const q = this.local(e, c.top * 0.5);
        if (!q) return;
        const a = Math.atan2(q.z, q.x);
        if (last !== null) {
          let d = a - last;
          if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
          if (Math.hypot(q.x, q.z) > 0.015) apply(d);
        }
        last = a;
        if (sp) { const rr = Math.min(c.r * 0.7, Math.hypot(q.x, q.z)); sp.position.set(Math.cos(a) * rr, c.top - 0.02, Math.sin(a) * rr); sp.rotation.set(0, 0, -0.3); }
      },
      up: () => { last = null; },
    });
    this.controls(h('div', { class: 'gesture' }, h('span', { class: 'spin' }, '🔄'), ' Stir'));
    const q = await p;
    if (sp) { this.props.remove(sp); disposeTree(sp); }
    this.burst(new THREE.Vector3(0, c.top, 0), 'sparkle', { n: 10 });
    if (this.recipe === 'spaghetti') {
      const plate = MD.plate();
      const pile = MD.spaghettiPile(this.order.vary.sauce);
      pile.position.y = 0.02;
      this.setDish('spaghetti', plate, pile);
      this.surface = { shape: 'disc', r: 0.08, y: 0.09 };
      this.sfx('place');
    } else if (!blender && this.recipe !== 'miso') {
      this.surface = { shape: 'disc', r: 0.12, y: c.fill.position.y + 0.02 };
    }
    return q;
  }

  // ---------- CHOP: swipe across the dashed lines ----------
  async s_chop(step) {
    const c = MD.choppable(step.item);
    const b = MD.board();
    this.props.add(b);
    c.group.position.y = 0.03;
    this.props.add(c.group);
    this.dish.visible = false;
    const q = await this.cutting(c, 0.03, step.item);
    await this.anim(0.35, (k) => { c.pieces.forEach((pc, i) => { pc.position.z = (i % 2 ? 1 : -1) * 0.02 * k; }); });
    this.chopped.push(step.item);
    this.burst(new THREE.Vector3(0, 0.12, 0), 'sparkle', { n: 14 });
    this.sfx('sparkle');
    await this.wait(0.4);
    this.dish.visible = true;
    return q;
  }

  // shared by chop + sushi slicing: c = choppable, base = y of its bottom
  async cutting(c, base, item) {
    const { p, finish } = this.finisher();
    const top = base + c.height;
    const lines = c.cuts.map((x) => { const l = dashedLine(c.depth * 1.6); l.position.set(x, top + 0.012, 0); this.props.add(l); return { x, l, done: false }; });
    const kn = MD.knife();
    kn.position.set(c.half + 0.12, top + 0.05, 0.12);
    this.props.add(kn);
    let t = 0;
    this.every((dt) => {
      t += dt;
      const next = lines.find((L) => !L.done);
      for (const L of lines) L.l.material.opacity = L.done ? 0 : L === next ? 0.65 + Math.sin(t * 8) * 0.35 : 0.35;
    });
    const scores = [];
    let stroke = [];
    const cut = async (L, acc) => {
      L.done = true;
      scores.push(acc);
      c.pieces.forEach((pc) => { if (pc.position.x > L.x) pc.position.x += 0.016; else pc.position.x -= 0.004; });
      this.sfx('place');
      if (JUICY.has(item)) this.burst(new THREE.Vector3(L.x, top, 0), 'splash', { n: 5, scale: 0.18 });
      this.progress(scores.length / lines.length);
      const y0 = kn.position.y;
      kn.position.x = L.x;
      await this.anim(0.1, (k) => { kn.position.y = y0 - k * 0.06; });
      await this.anim(0.12, (k) => { kn.position.y = y0 - 0.06 + k * 0.06; });
      if (scores.length === lines.length) {
        await this.wait(0.2);
        finish(scores.reduce((a, b) => a + b, 0) / scores.length);
      }
    };
    this.finishNow = () => { for (const L of lines) if (!L.done) { L.done = true; scores.push(1); } finish(1); };
    this.input({
      down: (e) => { const q = this.local(e, top); stroke = q ? [q] : []; },
      move: (e, down) => {
        const q = this.local(e, top);
        if (!q) return;
        kn.position.set(q.x, top + 0.05, q.z + 0.06);
        if (!down) return;
        stroke.push(q);
        const zs = stroke.map((s) => s.z);
        const d = c.depth / 2;
        if (Math.min(...zs) < -d * 0.3 && Math.max(...zs) > d * 0.3) {
          // x where the stroke crosses the middle line
          let xc = stroke[0].x;
          for (let i = 1; i < stroke.length; i++) {
            const a = stroke[i - 1], b2 = stroke[i];
            if ((a.z <= 0 && b2.z >= 0) || (a.z >= 0 && b2.z <= 0)) { const k = a.z === b2.z ? 0 : a.z / (a.z - b2.z); xc = a.x + (b2.x - a.x) * k; break; }
          }
          stroke = [q];
          if (Math.abs(xc) > c.half + 0.06) return;
          let best = null;
          for (const L of lines) if (!L.done && (!best || Math.abs(L.x - xc) < Math.abs(best.x - xc))) best = L;
          if (!best) return;
          const dx = Math.abs(best.x - xc);
          if (dx > 0.1) { this.sfx('no'); return; }
          cut(best, dx < 0.02 ? 1 : Math.max(0.5, 1 - (dx - 0.02) * 7));
        }
      },
      up: () => { stroke = []; },
    });
    this.controls(h('div', { class: 'gesture' }, h('span', { class: 'swipe' }, '👆'), ' Chop'));
    return p;
  }

  // ---------- COOK: stop in the green zone (flip first if asked) ----------
  async s_cook(step) {
    const tool = step.tool;
    let item = null, tint = null, colors, glow = null, parked = null;
    const P = this.props;
    if (tool === 'pan' || tool === 'pot') { P.add(MD.stove()); }
    if (tool === 'pan') {
      const pn = MD.pan(); pn.position.y = 0.03; P.add(pn);
      this.setDish(null);
      const b = new Builder(); b.cyl(0.12, 0.12, 0.018, '#ffffff', 0, 0, 0, { seg: 24 });
      tint = tintMat('#ffe6a8'); item = new THREE.Mesh(b.build({ ao: 0 }), tint); item.position.y = 0.045; P.add(item);
      colors = ['#ffe6a8', '#e8a95a', '#5a3a2a'];
    } else if (tool === 'grill') {
      const gr = MD.grill(); P.add(gr);
      if (step.item === 'patty') { item = MD.sliceMesh('patty', 1.1); item.userData.keep = true; colors = ['#ffb4b4', '#ffffff', '#3a2a2a']; }
      else { item = MD.sausageModel(0.2); item.position.y = 0.03; colors = ['#ffffff', '#c08070', '#3a2020']; }
      tint = tintMat(colors[0]); item.material = tint; item.position.y += 0.08; P.add(item);
    } else if (tool === 'pot') {
      const pt = MD.pot(); pt.position.y = 0.03; P.add(pt);
      const water = MD.fill(0.16, '#bfe6ff'); water.material.userData.own = true; water.position.y = 0.17; P.add(water);
      const b = new Builder();
      if (step.item === 'pasta') for (let k = 0; k < 12; k++) b.torus(0.04 + (k % 4) * 0.02, 0.005, '#ffffff', 0, 0.005, 0, { rx: Math.PI / 2 + (k % 3) * 0.2, ts: 16, rs: 4 });
      else if (step.item === 'rice') for (let k = 0; k < 40; k++) b.sphere(0.012, '#ffffff', Math.cos(k * 2.4) * 0.12 * Math.sqrt((k + 1) / 40), 0, Math.sin(k * 2.4) * 0.12 * Math.sqrt((k + 1) / 40), { sx: 1.8 });
      else {
        for (let k = 0; k < 8; k++) b.cbox(0.03, 0.03, 0.03, '#fbf6ea', Math.cos(k) * 0.08, 0, Math.sin(k) * 0.08, { r: 0.004 });
        for (let k = 0; k < 6; k++) b.torus(0.012, 0.004, '#7cc45a', Math.cos(k * 1.7) * 0.1, 0.01, Math.sin(k * 1.7) * 0.1, { rx: Math.PI / 2, ts: 10, rs: 4 });
        water.material.color.set('#e8c890');
      }
      colors = step.item === 'soup' ? ['#ffffff', '#fff4e0', '#a08060'] : ['#ffffff', step.item === 'pasta' ? '#ffd772' : '#fffdf6', '#c8a060'];
      tint = tintMat(colors[0]); item = new THREE.Mesh(b.build({ ao: 0 }), tint); item.position.y = 0.175; P.add(item);
      this.setDish(null);
      this.every(() => { if (Math.random() < 0.08) this.burst(new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.2, (Math.random() - 0.5) * 0.2), 'bubbles', { n: 1, scale: 0.15 }); });
    } else if (tool === 'fryer') {
      P.add(MD.fryer());
      this.setDish(null);
      item = MD.potatoSticks(); colors = ['#ffffff', '#f0c060', '#8a5020']; tint = tintMat(colors[0]); item.material = tint; item.position.y = 0.22; P.add(item);
      this.every(() => { if (Math.random() < 0.12) this.burst(new THREE.Vector3((Math.random() - 0.5) * 0.25, 0.25, (Math.random() - 0.5) * 0.15), 'bubbles', { n: 1, scale: 0.12 }); });
    } else if (tool === 'toaster') {
      const ts = MD.toaster(); P.add(ts);
      this.setDish(null);
      item = MD.breadSlice(0); colors = ['#ffffff', '#d89050', '#4a2a1a']; tint = tintMat(colors[0]); item.material = tint;
      item.rotation.x = Math.PI / 2; item.position.set(0, 0.2, 0); P.add(item);
    } else if (tool === 'oven') {
      const ov = MD.oven(); ov.position.set(0, 0, -0.12); P.add(ov);
      glow = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.32), new THREE.MeshBasicMaterial({ color: '#3e3a48' }));
      glow.material.userData.own = true;
      glow.position.set(-0.07, 0.27, 0.142); P.add(glow);
      // put the dish into the oven
      if (step.item === 'cake') {
        const tin = new Builder(); tin.cyl(0.19, 0.19, 0.09, '#c8c4d0', 0, 0, 0, { seg: 28 }); tin.cyl(0.18, 0.18, 0.092, MD.col('batter'), 0, 0.001, 0, { seg: 28 });
        this.setDish('tin', MD.meshOf(tin, M.metal, { ao: 0 }));
      }
      parked = this.dish;
      const z0 = parked.position.z;
      await this.anim(0.5, (k) => { parked.position.z = z0 - k * 0.2; parked.scale.setScalar(1 - k * 0.9); parked.position.y = k * 0.14; });
      parked.visible = false;
      colors = ['#3e3a48', '#ff9a3a', '#ff3a1a'];
      tint = glow.material;
    }
    // heat meter
    const G0 = 0.58, G1 = 0.82;
    const needle = h('i', { class: 'needle' });
    const meter = h('div', { class: 'heat' }, h('div', { class: 'z raw' }), h('div', { class: 'z good' }), h('div', { class: 'z burn' }), needle);
    const btn = h('button', { class: 'btn big cook-btn' }, step.flip ? 'FLIP! 🔄' : 'STOP ✋');
    this.controls(h('div', { class: 'cook-ctl' }, meter, btn));
    const { p, finish } = this.finisher();
    let heat = 0, phase = step.flip ? 1 : 2, q1 = 1, busy = false, sizzle = 0;
    const score = (x) => (x >= 1 ? 0.3 : x >= G0 && x <= G1 ? 1 : (x >= G0 - 0.12 && x < G0) || (x > G1 && x <= G1 + 0.1) ? 0.7 : 0.4);
    const ca = new THREE.Color(colors[0]), cb = new THREE.Color(colors[1]), cc = new THREE.Color(colors[2]);
    const setCol = (x) => { if (!tint) return; if (x < 0.7) tint.color.copy(ca).lerp(cb, x / 0.7); else tint.color.copy(cb).lerp(cc, Math.min(1, (x - 0.7) / 0.3)); };
    let doneHeat = 0;
    const press = async () => {
      if (busy) return;
      if (phase === 1) {
        busy = true;
        q1 = score(heat);
        this.sfx('boing');
        speak('Flip!', false);
        const y0 = item.position.y;
        await this.anim(0.45, (k) => { item.position.y = y0 + Math.sin(k * Math.PI) * 0.18; item.rotation.x = k * Math.PI; });
        item.rotation.x = 0;
        heat = 0;
        phase = 2;
        btn.textContent = 'STOP ✋';
        busy = false;
        return;
      }
      busy = true;
      doneHeat = heat;
      finish((step.flip ? (q1 + score(heat)) / 2 : score(heat)));
    };
    btn.addEventListener('click', press);
    this.finishNow = () => { heat = (G0 + G1) / 2; q1 = 1; phase = 2; press(); };
    this.every((dt) => {
      if (busy) return;
      heat = Math.min(1, heat + dt * 0.24);
      needle.style.left = (heat * 100).toFixed(1) + '%';
      setCol(phase === 1 ? heat : Math.max(heat, 0.3));
      sizzle += dt;
      if (sizzle > 0.5 && tool !== 'oven') { sizzle = 0; const a = this.game.audio; if (a.ctx && a.sfxOn) a.noiseHit(a.ctx.currentTime, 0.4, tool === 'pot' ? 700 : 3200, 0.04); }
      if (heat >= 1) { if (phase === 1) press(); else if (!busy) press(); }
      if (tool !== 'oven' && Math.random() < dt * 6) this.burst(new THREE.Vector3((Math.random() - 0.5) * 0.15, 0.12, (Math.random() - 0.5) * 0.1), 'puff', { n: 1, scale: 0.18 });
    });
    const q = await p;
    this.endStep();
    const bake = Math.min(1, Math.max(0.15, doneHeat));
    this.burst(new THREE.Vector3(0, 0.15, 0), q >= 0.7 ? 'sparkle' : 'puff', { n: 12 });
    // result visuals
    const cookedHex = '#' + (tint?.color || new THREE.Color('#ffffff')).getHexString();
    if (tool === 'toaster') await this.anim(0.3, (k) => { item.position.y = 0.2 + Math.sin(k * Math.PI) * 0.15; });
    if (step.item === 'pancakes') {
      const pl = MD.plate(); const st = MD.pancakeStack(mix('#ffe6a8', '#c07030', bake)); st.position.y = 0.02;
      this.setDish('pancakes', pl, st); this.surface = { shape: 'disc', r: 0.1, y: 0.02 + 3 * 0.028 + 0.004 };
    } else if (step.item === 'toast') {
      const pl = MD.plate(); const sl = MD.breadSlice(bake); sl.position.y = 0.02;
      this.setDish('toast', pl, sl); this.surface = { shape: 'rect', w: 0.17, d: 0.17, y: 0.02 + 0.026 };
    } else if (step.item === 'patty' || step.item === 'sausage') {
      this.cooked[step.item] = { hex: cookedHex, bake };
    } else if (step.item === 'fries') {
      const pl = MD.plate(); const fc = MD.friesCone(bake); fc.position.y = 0.02;
      this.setDish('fries', pl, fc); this.surface = { shape: 'disc', r: 0.06, y: 0.24 };
    } else if (step.item === 'pasta') {
      this.cooked.pasta = { bake };
    } else if (step.item === 'rice') {
      const bd = MD.board(); const rm = MD.riceMound(); rm.position.y = 0.03;
      this.setDish('rice', bd, rm);
    } else if (step.item === 'soup') {
      const c = this.ensureContainer('pot');
      c.fill.visible = true; c.fill.material.color.set('#e0b070'); c.fill.position.y = 0.17; c.firstColor = '#e0b070';
      this.mixColor = '#d9a45a';
      item.material = MD.FOOD; this.props.remove(item); c.blobs.add(item); item.position.y = 0.0; c.blobs.position.y = 0.175;
      this.clearProps();
    } else if (tool === 'oven') {
      await this.bakeResult(step.item, bake, parked);
    }
    await this.wait(0.3);
    return q;
  }

  async bakeResult(item, bake, parked) {
    parked.visible = true;
    const brown = mix('#ffffff', '#c07840', Math.max(0, bake - 0.3));
    if (item === 'pizza') {
      parked.traverse((o) => { if (o.isMesh && o.userData.dough) o.material = tintMat(brown); if (o.isMesh && o.userData.cheese) { o.scale.y = 0.4; o.scale.x *= 1.3; o.scale.z *= 1.3; } });
    } else if (item === 'cupcakes') {
      const pl = MD.plate(0.16); const cc = MD.cupcakeModel(bake); cc.position.y = 0.02;
      this.setDish('cupcake', pl, cc); this.surface = { shape: 'disc', r: 0.045, y: 0.24 };
    } else if (item === 'cake') {
      this.cooked.cake = { hex: mix('#ffe6a8', '#d08a40', bake), bake };
      this.setDish(null);
      this.dish.position.set(0, 0, 0);
      this.dish.scale.setScalar(1);
      this.clearProps();
      return;
    } else if (item === 'cookies') {
      const chips = this.order.vary.chip;
      const tr = MD.tray(); const ck = MD.cookies(bake); ck.position.y = 0.0;
      this.setDish('cookies', tr, ck);
      for (let k = 0; k < 6; k++) for (let j = 0; j < 3; j++) {
        const s = MD.sliceMesh(chips, 0.8); s.userData.keep = true;
        s.position.set(-0.14 + (k % 3) * 0.14 + Math.cos(j * 2.1) * 0.025, 0.04, -0.07 + Math.floor(k / 3) * 0.14 + Math.sin(j * 2.1) * 0.025);
        this.dish.add(s);
      }
    }
    const d = this.dish;
    d.visible = true;
    await this.anim(0.5, (k) => { d.position.z = -0.2 * (1 - k); d.scale.setScalar(0.1 + 0.9 * k); d.position.y = 0.14 * (1 - k); });
    d.position.set(0, 0, 0);
    d.scale.setScalar(1);
    this.clearProps();
  }

  // ---------- POUR: hold, release at the line ----------
  async s_pour(step) {
    const it = step.item;
    const liqCol = it === 'batter' ? MD.col('batter') : it === 'miso' ? '#d9a45a' : (this.mixColor || '#ffc0d0');
    let vessel, vh, vr, baseY;
    if (it === 'smoothie' || it === 'milkshake') { vh = it === 'milkshake' ? 0.24 : 0.2; vr = 0.07; vessel = MD.glass(vh, vr + 0.005); baseY = 0.012; }
    else if (it === 'batter') { const b = new Builder(); b.cyl(0.075, 0.055, 0.08, '#ff9ccc', 0, 0, 0, { seg: 16 }); vessel = MD.meshOf(b, MD.FOOD, { ao: 0 }); vh = 0.075; vr = 0.068; baseY = 0.005; }
    else { vessel = MD.bowl('#fff6ea', 0.15, 0.09); vh = 0.075; vr = 0.12; baseY = 0.012; }
    // the source jug above (the bowl / blender / pot the mix came from)
    const src = new THREE.Group();
    const jb = new Builder();
    jb.cyl(0.07, 0.06, 0.14, '#ffffff', 0, 0, 0, { seg: 16 });
    jb.cone(0.03, 0.05, '#ffffff', 0.07, 0.12, 0, { rz: -1.2, seg: 8 });
    jb.torus(0.04, 0.012, '#ff8fc0', -0.075, 0.07, 0, { ts: 12 });
    src.add(MD.meshOf(jb, M.gloss, { ao: 0 }));
    src.position.set(-0.12, vh + 0.2, 0);
    src.rotation.z = -0.9;
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(vr * 0.98, vr * 0.82, 1, 20), new THREE.MeshStandardMaterial({ color: liqCol, roughness: 0.2 }));
    liquid.material.userData.own = true;
    liquid.position.y = baseY;
    liquid.scale.y = 0.0001;
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 8), liquid.material);
    stream.visible = false;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(vr + 0.012, 0.005, 6, 28), new THREE.MeshBasicMaterial({ color: 0xff4f8f }));
    ring.material.userData.own = true;
    ring.rotation.x = Math.PI / 2;
    const target = 0.8;
    ring.position.y = baseY + vh * target;
    this.setDish('pour', vessel, liquid);
    this.props.add(src, stream, ring);
    const btn = h('button', { class: 'btn big cook-btn hold' }, 'POUR 🫗');
    this.controls(h('div', { class: 'cook-ctl' }, h('div', { class: 'hint-line' }, 'Hold & stop at the line'), btn));
    const { p, finish } = this.finisher();
    let lvl = 0, pouring = false, over = false;
    const stop = () => {
      if (!pouring || over) return;
      pouring = false;
      stream.visible = false;
      const d = Math.abs(lvl - target);
      over = true;
      finish(d < 0.06 ? 1 : d < 0.14 ? 0.75 : 0.5);
    };
    const start = () => { if (!over) { pouring = true; this.sfx('water'); } };
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); start(); });
    this.input({ down: start, up: stop });
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointerleave', stop);
    this.finishNow = () => { lvl = target; pouring = true; stop(); };
    let tSnd = 0;
    this.every((dt) => {
      src.rotation.z += ((pouring ? -1.7 : -0.9) - src.rotation.z) * Math.min(1, dt * 10);
      if (!pouring) return;
      lvl += dt * 0.3;
      liquid.scale.y = vh * lvl;
      liquid.position.y = baseY + (vh * lvl) / 2;
      stream.visible = true;
      const topY = src.position.y - 0.02, botY = baseY + vh * lvl;
      stream.scale.y = Math.max(0.01, topY - botY);
      stream.position.set(0, (topY + botY) / 2, 0);
      this.progress(Math.min(1, lvl / target));
      tSnd += dt;
      if (tSnd > 0.5) { tSnd = 0; this.sfx('water'); }
      if (lvl >= 1.02 && !over) { this.burst(new THREE.Vector3(0, baseY + vh, 0), 'splash', { n: 10 }); pouring = false; over = true; stream.visible = false; finish(0.4); }
    });
    const q = await p;
    this.props.remove(src, stream, ring);
    await this.wait(0.2);
    liquid.scale.y = Math.max(liquid.scale.y, vh * 0.5);
    liquid.position.y = baseY + liquid.scale.y / 2;
    const topY = baseY + liquid.scale.y;
    if (it === 'smoothie') {
      const b = new Builder(); b.cyl(0.007, 0.007, 0.3, '#ff6fb5', 0.02, topY - 0.1, 0, { rz: 0.2 }); this.dish.add(MD.meshOf(b, M.gloss, { ao: 0 }));
    } else if (it === 'milkshake') {
      const b = new Builder(); for (let k = 0; k < 3; k++) b.sphere(0.06 - k * 0.015, '#fffaf2', 0, topY + 0.02 + k * 0.03, 0, { sy: 0.7 }); b.cyl(0.007, 0.007, 0.3, '#7fc6ff', -0.03, topY - 0.05, 0, { rz: -0.25 });
      this.dish.add(MD.meshOf(b, MD.FOOD, { ao: 0 }));
      this.surface = { shape: 'disc', r: 0.02, y: topY + 0.1 };
    } else if (it === 'miso') {
      for (let k = 0; k < 5; k++) { const s = MD.sliceMesh(k % 2 ? 'onion' : 'tofu', 0.5); s.userData.keep = true; s.position.set(Math.cos(k * 1.3) * 0.06, topY, Math.sin(k * 1.3) * 0.06); this.dish.add(s); }
    }
    return q;
  }

  // ---------- SPREAD: rub to cover ----------
  async s_spread(step) {
    const color = MD.col(step.color || step.item);
    const { p, finish } = this.finisher();
    if (this.recipe === 'sushi') {
      const mat = MD.sushiMat(); const nori = MD.noriSheet();
      this.setDish('nori', mat, nori);
      this.surface = { shape: 'rect', w: 0.38, d: 0.28, y: 0.026 };
    }
    if (this.dishKind === 'cupcake') {
      // frosting swirl grows while rubbing
      const fr = MD.frosting(color, 0.01);
      fr.position.y = 0.02;
      this.dish.add(fr);
      let amt = 0, last = null;
      const grow = (d) => {
        amt = Math.min(1, amt + d);
        fr.scale.setScalar(Math.max(0.01, amt));
        this.progress(amt);
        if (amt >= 1) finish(1);
      };
      this.finishNow = () => grow(1);
      this.input({
        down: (e) => { last = this.local(e, 0.15); },
        move: (e, down) => { if (!down) return; const q = this.local(e, 0.15); if (q && last) grow(Math.min(0.08, q.distanceTo(last) * 1.3)); last = q; },
        up: () => { last = null; },
      });
      this.controls(h('div', { class: 'gesture' }, h('span', { class: 'rub' }, '👆'), ' Spread'));
      const q = await p;
      this.surface = { shape: 'disc', r: 0.035, y: 0.23 };
      this.burst(new THREE.Vector3(0, 0.2, 0), 'sparkle', { n: 12 });
      return q;
    }
    if (this.dishKind === 'stack' && this.recipe === 'hotdog') this.surface = this.surface || { shape: 'rect', w: 0.26, d: 0.045, y: 0.1 };
    const S = this.surface || { shape: 'disc', r: 0.18, y: 0.03 };
    const w = S.shape === 'disc' ? S.r * 2 : S.w, d = S.shape === 'disc' ? S.r * 2 : S.d;
    const layer = MD.paintLayer(S.shape, S.shape === 'disc' ? S.r : S.w, S.d);
    layer.mesh.material.userData.own = true;
    layer.mesh.position.set(S.x || 0, S.y + 0.003, S.z || 0);
    this.dish.add(layer.mesh);
    const N = 14, cells = new Set();
    let total = 0;
    const inside = (u, v) => (S.shape === 'disc' ? (u - 0.5) ** 2 + (v - 0.5) ** 2 <= 0.25 : true);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (inside((i + 0.5) / N, (j + 0.5) / N)) total++;
    const brush = Math.max(0.04, Math.min(w, d) * 0.28);
    const ctx = layer.ctx, sz = layer.size;
    const rice = step.item === 'rice';
    const dab = (u, v) => {
      const rx = (brush / w) * sz, ry = (brush / d) * sz;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.ellipse(u * sz, v * sz, rx, ry, 0, 0, TAU); ctx.fill();
      if (rice) { ctx.fillStyle = '#e8e8dc'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(u * sz + (Math.random() - 0.5) * rx * 1.6, v * sz + (Math.random() - 0.5) * ry * 1.6, 5, 2.5, Math.random() * 3, 0, TAU); ctx.fill(); } }
      else { ctx.fillStyle = shade(color, 1.12); ctx.beginPath(); ctx.ellipse(u * sz - rx * 0.25, v * sz - ry * 0.25, rx * 0.35, ry * 0.3, 0, 0, TAU); ctx.fill(); }
      layer.tex.needsUpdate = true;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const cu = (i + 0.5) / N, cv = (j + 0.5) / N;
        if (!inside(cu, cv)) continue;
        if (((cu - u) * w) ** 2 + ((cv - v) * d) ** 2 <= (brush * 1.05) ** 2) cells.add(i * N + j);
      }
      const k = cells.size / total;
      this.progress(Math.min(1, k / 0.82));
      if (k >= 0.82) done();
    };
    let finished = false;
    const done = async () => {
      if (finished) return;
      finished = true;
      // fill the rest smoothly
      ctx.save();
      if (S.shape === 'disc') { ctx.beginPath(); ctx.arc(sz / 2, sz / 2, sz / 2 - 2, 0, TAU); ctx.clip(); }
      await this.anim(0.35, (k) => { ctx.globalAlpha = 0.25 * k; ctx.fillStyle = color; ctx.fillRect(0, 0, sz, sz); layer.tex.needsUpdate = true; });
      ctx.restore();
      finish(1);
    };
    this.finishNow = () => { ctx.fillStyle = color; if (S.shape === 'disc') { ctx.beginPath(); ctx.arc(sz / 2, sz / 2, sz / 2 - 2, 0, TAU); ctx.fill(); } else ctx.fillRect(0, 0, sz, sz); layer.tex.needsUpdate = true; finished = true; finish(1); };
    const at = (e) => {
      const q = this.local(e, S.y);
      if (!q) return;
      const u = (q.x - (S.x || 0)) / w + 0.5, v = (q.z - (S.z || 0)) / d + 0.5;
      if (u < -0.1 || u > 1.1 || v < -0.1 || v > 1.1) return;
      dab(u, v);
    };
    this.input({ down: at, move: (e, down) => { if (down) at(e); } });
    this.controls(h('div', { class: 'gesture' }, h('span', { class: 'rub' }, '👆'), ' Spread'));
    const q = await p;
    if (this.dishKind === 'stack' && this.recipe === 'cake') {
      const b = new Builder();
      for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; b.sphere(0.022, color, Math.cos(a) * (S.r - 0.01), S.y + 0.012, Math.sin(a) * (S.r - 0.01)); }
      this.dish.add(MD.meshOf(b, MD.FOOD, { ao: 0 }));
    }
    this.burst(new THREE.Vector3(0, S.y + 0.02, 0), 'sparkle', { n: 12 });
    return q;
  }

  // ---------- PLACE: tap to put toppings ----------
  async s_place(step) {
    const it = step.item;
    const S = this.surface || { shape: 'disc', r: 0.12, y: 0.05 };
    const n = step.n;
    // guide spots
    const spots = [];
    if (it === 'nori') spots.push(new THREE.Vector3(0, S.y, 0));
    else if (this.recipe === 'sushi') for (let i = 0; i < n; i++) spots.push(new THREE.Vector3(-0.12 + (0.24 * i) / Math.max(1, n - 1), S.y, 0.06));
    else if (S.shape === 'rect') for (let i = 0; i < n; i++) spots.push(new THREE.Vector3(-S.w * 0.3 + (S.w * 0.6 * (i % 2 ? 1 : 0)) + (i > 1 ? S.w * 0.15 : 0), S.y, i < 2 ? -S.d * 0.2 : S.d * 0.22));
    else if (n === 1) spots.push(new THREE.Vector3(0, S.y, 0));
    else for (let i = 0; i < n; i++) { const a = (i / n) * TAU + 0.4, rr = S.r * (it === 'candle' ? 0.3 : 0.58); spots.push(new THREE.Vector3(Math.cos(a) * rr, S.y, Math.sin(a) * rr)); }
    const rings = spots.map((s) => { const r = ghostRing(Math.max(0.02, Math.min(0.035, (S.r || 0.1) * 0.35))); r.position.copy(s).add(new THREE.Vector3(0, 0.004, 0)); this.props.add(r); return r; });
    const used = new Set();
    let t = 0;
    this.every((dt) => { t += dt; rings.forEach((r, i) => { r.visible = !used.has(i); r.scale.setScalar(1 + Math.sin(t * 6 + i) * 0.12); }); });
    const { p, finish } = this.finisher();
    let placed = 0;
    const model = () => {
      if (it === 'cheese' && this.recipe === 'pizza') {
        const b = new Builder();
        for (let k = 0; k < 12; k++) { const a = Math.random() * TAU, r = Math.random() * 0.05; b.cbox(0.03, 0.006, 0.008, k % 3 ? '#ffe070' : '#ffd24d', Math.cos(a) * r, 0.004, Math.sin(a) * r, { ry: Math.random() * 3, r: 0 }); }
        const m = MD.meshOf(b, MD.FOOD, { ao: 0 }); m.userData.cheese = true; return m;
      }
      if (it === 'cheese' && this.recipe === 'spaghetti') {
        const b = new Builder();
        for (let k = 0; k < 10; k++) { const a = Math.random() * TAU, r = Math.random() * 0.04; b.cbox(0.02, 0.004, 0.004, '#fff4c0', Math.cos(a) * r, 0.003, Math.sin(a) * r, { ry: Math.random() * 3, r: 0 }); }
        return MD.meshOf(b, MD.FOOD, { ao: 0 });
      }
      if (it === 'strawberry' && !this.chopped.includes(it)) {
        const w = MD.choppable('strawberry');
        w.group.scale.setScalar(0.7);
        return w.group;
      }
      const m = MD.sliceMesh(it, this.recipe === 'cupcakes' ? 0.6 : this.recipe === 'pizza' ? 0.55 : 0.8);
      m.userData.keep = true;
      if (it === 'strawberry' && this.recipe !== 'cake') m.rotation.y = Math.random() * TAU;
      return m;
    };
    const put = async (pt) => {
      if (placed >= n) return;
      // snap to the nearest free guide spot when close
      let best = -1, bd = 1e9;
      spots.forEach((s, i) => { if (used.has(i)) return; const dd = s.distanceTo(pt); if (dd < bd) { bd = dd; best = i; } });
      if (best >= 0) { used.add(best); if (bd < 0.06 || it === 'nori') pt = spots[best].clone(); }
      placed++;
      this.progress(placed / n);
      if (it === 'salt') {
        this.burst(pt.clone().add(new THREE.Vector3(0, 0.08, 0)), 'sparkle', { n: 10, scale: 0.2 });
        this.sfx('pick');
        const s = MD.sliceMesh('salt'); s.userData.keep = true; s.position.copy(pt); this.dish.add(s);
      } else if (it === 'nori') {
        const b = new Builder();
        b.cbox(0.14, 0.07, 0.1, MD.col('nori'), 0, 0.12, 0, { r: 0.012 });
        this.dish.add(MD.meshOf(b, MD.FOOD, { ao: 0 }));
        this.sfx('place');
      } else {
        const m = model();
        m.position.copy(pt).add(new THREE.Vector3(0, 0.15, 0));
        this.dish.add(m);
        this.sfx('pop');
        const y0 = m.position.y, y1 = pt.y + 0.006;
        await this.anim(0.25, (k) => { m.position.y = y0 + (y1 - y0) * k * k; });
        this.burst(pt.clone(), 'sparkle', { n: 4, scale: 0.2 });
      }
      if (placed >= n) { await this.wait(0.35); finish(1); }
    };
    this.finishNow = async () => { while (placed < n) { const i = [...spots.keys()].find((k) => !used.has(k)) ?? 0; await put(spots[i].clone()); } };
    const fits = (q) => {
      if (it === 'nori') return true;
      const x = q.x - (S.x || 0), z = q.z - (S.z || 0);
      return S.shape === 'disc' ? Math.hypot(x, z) <= S.r + 0.04 : Math.abs(x) <= S.w / 2 + 0.04 && Math.abs(z) <= S.d / 2 + 0.04;
    };
    this.input({
      down: (e) => {
        const q = this.local(e, S.y);
        if (!q) return;
        if (fits(q)) { put(q); return; }
        const f = spots.find((s, i) => !used.has(i));
        if (f && q.distanceTo(f) < 0.2) put(f.clone());
      },
    });
    this.controls(h('div', { class: 'gesture' }, h('span', { class: 'tap' }, '👆'), ' Tap ', h('b', {}, `${n}×`)));
    const q = await p;
    rings.forEach((r) => { this.props.remove(r); r.geometry.dispose(); r.material.dispose(); });
    return q;
  }

  // ---------- STACK: tap the layers in order ----------
  async s_stack(step) {
    const layers = step.layers;
    const pool = this.recipe === 'burger' ? ['bun', 'patty', 'cheese', 'tomato', 'lettuce', 'onion']
      : this.recipe === 'hotdog' ? ['bun', 'sausage', 'patty', 'cheese'] : ['cake', 'cream', 'strawberry', 'chocolate'];
    const pl = MD.plate(0.2);
    this.setDish('stack', pl);
    let y = 0.02, idx = 0, wrong = 0;
    const { p, finish } = this.finisher();
    this.game.hud?.stackOrder(layers, 0);
    const layerModel = (id, i) => {
      const b = new Builder();
      let hgt = 0.02;
      if (id === 'bun' && this.recipe === 'hotdog') { const m = MD.hotdogBun(); return { m, hgt: 0.035 }; }
      if (id === 'sausage') { const c = this.cooked.sausage; const m = MD.sausageModel(c ? c.bake : 0.7); m.position.y = 0.028; return { m, hgt: 0.056, group: true }; }
      if (id === 'bun') {
        if (i === 0) { b.cyl(0.085, 0.08, 0.035, '#e0a060', 0, 0, 0, { seg: 20 }); b.cyl(0.08, 0.08, 0.004, '#fff0d0', 0, 0.034, 0, { seg: 20 }); hgt = 0.036; }
        else {
          const pts = [[0, 0]]; for (let k = 0; k <= 8; k++) { const a = (k / 8) * Math.PI / 2; pts.push([Math.cos(a) * 0.082, Math.sin(a) * 0.055]); }
          b.add(Geo.lathe('bunTop', pts, 22), '#e8a860');
          for (let k = 0; k < 9; k++) { const a = k * 2.3, rr = 0.02 + (k % 3) * 0.018; b.sphere(0.006, '#fff6e0', Math.cos(a) * rr, 0.055 * Math.sqrt(1 - (rr / 0.082) ** 2), Math.sin(a) * rr, { sy: 0.6 }); }
          hgt = 0.055;
        }
        return { m: MD.meshOf(b, MD.FOOD, { ao: 0 }), hgt };
      }
      if (id === 'patty') { const m = MD.sliceMesh('patty', 1.35); m.userData.keep = true; const c = this.cooked.patty; if (c) m.material = tintMat(c.hex); return { m, hgt: 0.03 }; }
      if (id === 'cheese') { const m = MD.sliceMesh('cheese', 1.2); m.userData.keep = true; m.rotation.y = Math.PI / 4; return { m, hgt: 0.012 }; }
      if (id === 'lettuce') { const m = MD.sliceMesh('lettuce', 1.45); m.userData.keep = true; return { m, hgt: 0.02 }; }
      if (id === 'cake') { const m = MD.cakeLayer(this.cooked.cake?.hex || '#ffd99a', 0.17, 0.08); return { m, hgt: 0.08 }; }
      if (id === 'cream') { const m = MD.cakeLayer('#fff6ea', 0.165, 0.025); return { m, hgt: 0.025 }; }
      const g = new THREE.Group();
      for (let k = 0; k < 3; k++) { const s = MD.sliceMesh(id, 1.0); s.userData.keep = true; s.position.set(Math.cos(k * 2.1 + 0.5) * 0.045, 0.007, Math.sin(k * 2.1 + 0.5) * 0.045); g.add(s); }
      return { m: g, hgt: 0.015 };
    };
    const tray = this.tray(shuffle([...new Set([...layers, ...pool])]), async (id, btn) => {
      if (idx >= layers.length) return;
      if (id !== layers[idx]) { wrong++; this.shake(btn); return; }
      const i = idx++;
      speak(WORD[id]?.en || id, false);
      this.game.hud?.stackOrder(layers, idx);
      const { m, hgt } = layerModel(id, i);
      const yy = y;
      const base = m.position.y;
      m.position.y = yy + 0.25 + base;
      this.dish.add(m);
      y += hgt;
      this.sfx('place');
      await this.anim(0.25, (k) => { m.position.y = yy + base + 0.25 * (1 - k * k); });
      this.progress(idx / layers.length);
      if (idx >= layers.length) {
        this.surface = this.recipe === 'hotdog' ? { shape: 'rect', w: 0.24, d: 0.04, y: y + 0.004 } : { shape: 'disc', r: 0.16, y };
        this.game.hud?.stackOrder(null);
        await this.wait(0.3);
        finish(Math.max(0.4, 1 - wrong * 0.2));
      }
    });
    this.finishNow = () => {
      while (idx < layers.length) {
        const nx = [...tray.children].find((b) => b.dataset.id === layers[idx]);
        if (!nx) break;
        nx.click();
      }
    };
    this.controls(tray);
    return p;
  }

  // ---------- ROLL: swipe up ----------
  async s_roll(step) {
    const it = step.item;
    const { p, finish } = this.finisher();
    const need = it === 'onigiri' ? 3 : 4;
    let count = 0;
    let from = null, to = null, pin = null, apply;
    if (it === 'dough') {
      const cookies = this.recipe === 'cookies';
      const ball = MD.doughBall();
      const flat = cookies ? MD.cookieDough() : MD.doughDisc(0.22);
      if (!cookies) flat.userData.dough = true;
      flat.scale.setScalar(0.01);
      this.setDish('dough', ball, flat);
      from = ball; to = flat;
      pin = MD.rollingPin(); pin.position.set(0, 0.12, 0.18); this.props.add(pin);
      apply = (k) => { ball.scale.set(1 + k * 0.6, 1 - k * 0.95, 1 + k * 0.6); ball.visible = k < 0.95; flat.scale.setScalar(Math.max(0.01, k)); };
      this.surface = cookies ? { shape: 'rect', w: 0.4, d: 0.26, y: 0.018 } : { shape: 'disc', r: 0.19, y: 0.02 };
      flat.traverse((o) => { if (o.isMesh) o.userData.dough = !cookies; });
    } else if (it === 'sushi') {
      const sheet = new THREE.Group();
      while (this.dish.children.length) sheet.add(this.dish.children[0]);
      const matM = sheet.children[0];
      this.dish.add(matM);
      this.dish.add(sheet);
      const fillCol = MD.col(this.order.vary.fill);
      const roll = MD.sushiRoll(fillCol);
      roll.group.position.set(0, 0.022, -0.08);
      roll.group.scale.setScalar(0.01);
      this.dish.add(roll.group);
      this.roll = roll;
      apply = (k) => { sheet.scale.z = 1 - k * 0.9; sheet.position.z = -k * 0.08; roll.group.scale.setScalar(Math.max(0.01, k)); sheet.visible = k < 0.97; };
    } else {
      const mound = this.dish.children[1] || MD.riceMound();
      const oni = MD.onigiriModel();
      oni.position.y = 0.03;
      oni.scale.setScalar(0.01);
      this.dish.add(oni);
      apply = (k) => { mound.scale.setScalar(Math.max(0.01, 1 - k)); oni.scale.setScalar(Math.max(0.01, k)); };
      this.surface = { shape: 'disc', r: 0.06, y: 0.1 };
    }
    let z0 = null;
    const bump = async () => {
      if (count >= need) return;
      count++;
      this.sfx('pick');
      const k0 = (count - 1) / need, k1 = count / need;
      this.progress(k1);
      await this.anim(0.25, (k) => apply(k0 + (k1 - k0) * k));
      if (count >= need) { this.burst(new THREE.Vector3(0, 0.08, 0), 'sparkle', { n: 14 }); await this.wait(0.3); finish(1); }
    };
    this.finishNow = async () => { while (count < need) await bump(); };
    this.input({
      down: (e) => { const q = this.local(e, 0.05); z0 = q ? q.z : null; },
      move: (e, down) => {
        const q = this.local(e, 0.05);
        if (!q) return;
        if (pin) pin.position.z = Math.max(-0.2, Math.min(0.22, q.z));
        if (!down || z0 === null || count >= need) return;
        if (z0 - q.z > 0.1) { z0 = q.z; bump(); }
      },
      up: () => { z0 = null; },
    });
    this.controls(h('div', { class: 'gesture' }, h('span', { class: 'up' }, '👆'), ' Swipe up'));
    const q = await p;
    if (it === 'dough') { this.dish.remove(from); disposeTree(from); }
    if (it === 'sushi') { /* keep the roll for slicing */ }
    return q;
  }

  // ---------- SLICE: cut the pizza or the sushi roll ----------
  async s_slice(step) {
    if (step.item === 'sushi' && this.roll) {
      const roll = this.roll;
      // bring the roll onto a board in the middle and cut it like chopping
      this.dish.remove(roll.group);
      this.setDish('sushi');
      const bd = MD.board(); this.props.add(bd);
      roll.group.position.set(0, 0.03, 0);
      roll.group.scale.setScalar(1);
      this.props.add(roll.group);
      const q = await this.cutting(roll, 0.03, 'sushi');
      // stand the pieces up on a plate
      this.props.remove(roll.group);
      const pl = MD.plate(0.22);
      this.setDish('sushi', pl);
      roll.pieces.forEach((pc, i) => {
        pc.rotation.set(0, 0, Math.PI / 2);
        pc.position.set(-0.13 + (i % 3) * 0.13, 0.02 + 0.03, i < 3 ? -0.05 : 0.07);
        this.dish.add(pc);
      });
      this.clearProps();
      this.sfx('sparkle');
      return q;
    }
    // pizza: swipe through the middle along the guides
    const S = this.surface || { shape: 'disc', r: 0.2, y: 0.03 };
    const R = (S.r || 0.2) + 0.02;
    const guides = [];
    for (let i = 0; i < step.cuts; i++) {
      const a = (i / step.cuts) * Math.PI;
      const l = dashedLine(R * 2.1);
      l.rotation.z = a;
      l.position.set(0, S.y + 0.03, 0);
      this.props.add(l);
      guides.push({ a, l, done: false });
    }
    const cutter = new Builder();
    cutter.cyl(0.04, 0.04, 0.006, '#d0d0da', 0, 0, 0, { rx: Math.PI / 2, center: true, seg: 20 });
    cutter.cbox(0.02, 0.1, 0.02, '#ff8fc0', 0, 0.07, 0.0, { r: 0.008 });
    const cm = MD.meshOf(cutter, M.metal, { ao: 0 });
    cm.position.set(R + 0.1, S.y + 0.04, 0.1);
    this.props.add(cm);
    const { p, finish } = this.finisher();
    const scores = [];
    let stroke = [];
    let t = 0;
    this.every((dt) => { t += dt; const nx = guides.find((g) => !g.done); guides.forEach((g) => { g.l.material.opacity = g.done ? 0 : g === nx ? 0.65 + Math.sin(t * 8) * 0.35 : 0.35; }); });
    const doCut = (g, q) => {
      g.done = true;
      scores.push(q);
      const b = new Builder();
      b.cbox(R * 2 - 0.03, 0.004, 0.005, '#a0602a', 0, 0, 0, { r: 0 });
      const m = MD.meshOf(b, MD.FOOD, { ao: 0 });
      m.rotation.y = g.a + Math.PI / 2;
      m.position.set(0, S.y + 0.022, 0);
      this.dish.add(m);
      this.sfx('place');
      this.progress(scores.length / guides.length);
      if (scores.length === guides.length) setTimeout(() => finish(scores.reduce((a, b2) => a + b2, 0) / scores.length), 300);
    };
    this.finishNow = () => { for (const g of guides) if (!g.done) doCut(g, 1); };
    this.input({
      down: (e) => { const q = this.local(e, S.y); stroke = q ? [q] : []; },
      move: (e, down) => {
        const q = this.local(e, S.y);
        if (!q) return;
        cm.position.set(q.x, S.y + 0.04, q.z);
        if (!down) return;
        stroke.push(q);
        const a0 = stroke[0];
        const len = a0.distanceTo(q);
        if (len < R * 1.3) return;
        // distance from the pizza centre to the stroke line
        const dx = q.x - a0.x, dz = q.z - a0.z;
        const dist = Math.abs(dx * a0.z - dz * a0.x) / len;
        stroke = [q];
        if (dist > 0.09) { this.sfx('no'); return; }
        let ang = Math.atan2(-dx, -dz);
        if (ang < 0) ang += Math.PI;
        if (ang >= Math.PI) ang -= Math.PI;
        let best = null, bd = 9;
        for (const g of guides) {
          if (g.done) continue;
          let d = Math.abs(g.a - ang); d = Math.min(d, Math.PI - d);
          if (d < bd) { bd = d; best = g; }
        }
        if (!best) return;
        doCut(best, Math.max(0.5, 1 - bd * 0.8 - Math.max(0, dist - 0.03) * 4));
      },
      up: () => { stroke = []; },
    });
    this.controls(h('div', { class: 'gesture' }, h('span', { class: 'swipe' }, '👆'), ' Slice'));
    const q = await p;
    return q;
  }
}
