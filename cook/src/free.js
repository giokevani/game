// Free Kitchen: make anything. Put as many ingredients as you like into a
// bowl, pan, pot, plate, glass or blender; chop, mix and cook them in any
// order; give the dish a name and serve it to a guest.
import * as THREE from 'three';
import { Builder, mix } from '../../src/engine/builder.js';
import { h, click, promptBox, celebrate, floaty, toast } from '../../src/ui/ui.js';
import { Avatar } from '../../src/player/avatar.js';
import { addXP } from '../../src/core/state.js';
import * as MD from './models.js';
import { WORD, PANTRY, kindOf } from './data.js';
import { stepPrompt } from './text.js';
import { seeWords } from './state.js';
import { disposeTree } from './steps.js';
import { SPOTS, DOOR, COUNTER_Y } from './restaurant.js';
import { ru, speak } from './i18n.js';

const CONTAINERS = [
  { id: 'bowl', icon: '🥣', en: 'Bowl' }, { id: 'pan', icon: '🍳', en: 'Pan' }, { id: 'pot', icon: '🍲', en: 'Pot' },
  { id: 'plate', icon: '🍽️', en: 'Plate' }, { id: 'glass', icon: '🥤', en: 'Glass' }, { id: 'blender', icon: '🌀', en: 'Blender' },
];
const DISH_WORD = { bowl: 'Salad', pan: 'Pancake', pot: 'Soup', plate: 'Plate', glass: 'Drink', blender: 'Smoothie' };
const ADJ = ['Yummy', 'Super', 'Magic', 'Rainbow', 'Happy', 'Sunny', 'Sparkly'];
const MAX_PIECES = 70; // more food still counts, but only this many bits are drawn
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// a few small bits of one food (berries, peas, candy, ice...)
function smallBits(id) {
  const b = new Builder();
  const c = MD.col(id);
  const n = id === 'rice' || id === 'cereal' ? 9 : 5;
  for (let k = 0; k < n; k++) {
    const a = k * 2.4, r = 0.012 + (k % 3) * 0.014, x = Math.cos(a) * r, z = Math.sin(a) * r, y = 0.012 + (k % 2) * 0.008;
    if (id === 'ice' || id === 'marshmallow') b.cbox(0.026, 0.026, 0.026, c, x, y, z, { r: 0.006, ry: a });
    else if (id === 'cereal') b.torus(0.009, 0.004, c, x, y, z, { rx: Math.PI / 2, ts: 10, rs: 4 });
    else if (id === 'spinach' || id === 'basil') b.sphere(0.02, c, x, y, z, { sy: 0.2, sx: 1.4, ry: a });
    else if (id === 'broccoli') { b.cyl(0.006, 0.008, 0.02, '#8fd46a', x, y - 0.01, z, { seg: 5 }); b.sphere(0.016, c, x, y + 0.012, z); }
    else if (id === 'shrimp') b.torus(0.012, 0.006, c, x, y, z, { arc: Math.PI * 1.3, ts: 10, rs: 5, ry: a });
    else if (id === 'sprinkles') b.cbox(0.014, 0.004, 0.004, ['#ff6fb5', '#7fc6ff', '#ffe066', '#8fe39a'][k % 4], x, y, z, { ry: a * 1.7, r: 0 });
    else if (id === 'gummy') { b.sphere(0.011, ['#ff5a5a', '#ffd45e', '#8fe39a', '#ff9ccc'][k % 4], x, y, z, { sy: 1.3 }); }
    else b.sphere(id === 'rice' ? 0.006 : 0.012, c, x, y, z, { sx: id === 'rice' || id === 'beans' ? 1.6 : 1 });
  }
  return MD.meshOf(b, MD.FOOD, { ao: 0 });
}

// a piece of a "chunk" food
function chunk(id) {
  if (id === 'sausage') { const m = MD.sausageModel(0.3); m.scale.setScalar(0.5); m.position.y = 0.015; return wrap(m); }
  if (id === 'patty') { const m = MD.sliceMesh('patty', 0.7); m.userData.keep = true; return m; }
  if (id === 'nori') { const m = MD.sliceMesh('nori', 1); m.userData.keep = true; return m; }
  if (id === 'pasta') { const m = MD.wholeModel('pasta'); m.scale.setScalar(0.6); return wrap(m); }
  if (id === 'noodles') { const m = MD.spaghettiPile(null); m.scale.setScalar(0.5); return wrap(m); }
  if (id === 'dough') { const m = MD.doughBall(); m.scale.setScalar(0.5); return wrap(m); }
  if (id === 'tortilla') { const m = MD.doughDisc(0.08, MD.col('tortilla')); return m; }
  if (id === 'bread') { const m = MD.breadSlice(0.2); m.scale.setScalar(0.45); return wrap(m); }
  const b = new Builder();
  const c = MD.col(id);
  if (id === 'icecream') b.sphere(0.035, c, 0, 0.03, 0);
  else if (id === 'bun') b.sphere(0.04, c, 0, 0.015, 0, { sy: 0.6 });
  else if (id === 'croissant') b.torus(0.03, 0.014, c, 0, 0.014, 0, { rx: Math.PI / 2, arc: Math.PI * 1.2, ts: 12, rs: 6 });
  else for (let k = 0; k < 3; k++) b.cbox(0.03, 0.022, 0.03, c, (k - 1) * 0.026, 0.011, (k % 2) * 0.02, { r: 0.006, ry: k });
  return MD.meshOf(b, MD.FOOD, { ao: 0 });
}
function wrap(m) { const g = new THREE.Group(); g.add(m); return g; }

export class FreeKitchen {
  constructor(cafe) {
    this.c = cafe;
    this.K = cafe.kitchen;
    this.ui = null;
  }

  // ---------- open / close ----------
  async open() {
    const c = this.c;
    c.loadRestaurant(c.rid || 'cafe');
    c.hud.levelMode(true, '✨ Free Kitchen', '');
    c.hud.cookMode(true, [], 0);
    c.hud.ticket.classList.add('hide');
    c.setView('cook');
    this.buildUI();
    this.newDish('bowl');
    speak('Make anything you like!');
    if (!c.state.tips.includes('free')) {
      c.state.tips.push('free');
      c.hud.showTip('Нажимай на продукты внизу и добавляй сколько хочешь! Потом режь 🔪, мешай 🥄 или готовь 🔥. В конце нажми ✅.');
    }
  }

  close() {
    this.ui?.remove();
    this.ui = null;
    this.busy = false;
    this.guest = null;
  }

  prompt(en, r) {
    const hud = this.c.hud;
    hud.setStep(0, 0, { en, ru: r });
  }

  // ---------- the dish ----------
  newDish(kind) {
    const K = this.K;
    K.resetOrder({ recipe: 'free', vary: {}, steps: [] });
    this.items = [];
    this.history = [];
    this.actions = new Set();
    this.pieces = 0;
    this.kind = kind;
    const cont = K.ensureContainer(kind);
    cont.fill.visible = false;
    this.prompt('Make anything you like!', 'Готовь что хочешь! Добавляй любые продукты, сколько угодно.');
    this.refresh();
  }

  snap() {
    const c = this.K.cont;
    return { visible: c.fill.visible, color: '#' + c.fill.material.color.getHexString(), level: (c.fill.position.y - c.fillY) / Math.max(0.01, c.top - c.fillY), mixColor: this.K.mixColor, n: c.n, first: c.firstColor };
  }
  restore(s) {
    const c = this.K.cont;
    c.fill.visible = s.visible;
    c.fill.material.color.set(s.color);
    c.fill.position.y = c.fillY + s.level * (c.top - c.fillY);
    c.blobs.position.y = c.fill.position.y + 0.01;
    this.K.mixColor = s.mixColor;
    c.n = s.n;
    c.firstColor = s.first;
  }

  // move everything into another pot or plate
  setContainer(kind) {
    if (this.busy || kind === this.kind) return;
    const K = this.K;
    const old = K.cont;
    const s = this.snap();
    const bits = [...old.blobs.children];
    for (const b of bits) old.blobs.remove(b);
    const cont = K.ensureContainer(kind);
    for (const b of bits) { b.position.x *= cont.r / old.r; b.position.z *= cont.r / old.r; cont.blobs.add(b); }
    this.restore(s);
    this.kind = kind;
    K.sfx('place');
    this.refresh();
  }

  add(id) {
    if (this.busy) return;
    const K = this.K, c = K.cont;
    const kind = kindOf(id);
    const color = MD.col(id);
    const before = this.snap();
    const meshes = [];
    if (kind === 'liquid' || kind === 'powder' || id === 'egg') {
      c.n++;
      K.mixColor = K.mixColor ? mix(K.mixColor, color, 1 / c.n) : color;
      if (!c.fill.visible) { c.fill.visible = true; c.fill.material.color.set(color); c.firstColor = color; }
      else c.fill.material.color.set(K.mixColor);
      const step = kind === 'liquid' ? (c.kind === 'glass' || c.kind === 'blender' ? 0.025 : 0.008) : 0.003;
      c.fill.position.y = Math.min(c.top - 0.012, c.fill.position.y + step);
      c.blobs.position.y = c.fill.position.y + 0.01;
      // a swirl of the new colour that disappears when she mixes
      const blob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), new THREE.MeshStandardMaterial({ color, roughness: 0.4 }));
      blob.material.userData.own = true;
      blob.scale.set(1, 0.22, 1);
      const a = Math.random() * Math.PI * 2, rr = Math.random() * c.r * 0.45;
      blob.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr);
      blob.userData.blob = true;
      c.blobs.add(blob);
      meshes.push(blob);
      if (id === 'egg') {
        const b = new Builder();
        b.sphere(0.05, '#fffaf2', 0, 0.002, 0, { sy: 0.12 });
        b.sphere(0.02, '#ffc21a', 0, 0.008, 0, { sy: 0.6 });
        const egg = MD.meshOf(b, MD.FOOD, { ao: 0 });
        egg.position.set(Math.cos(a + 2) * rr, 0.004, Math.sin(a + 2) * rr);
        c.blobs.add(egg);
        meshes.push(egg);
      }
      this.K.burst(new THREE.Vector3(0, c.fill.position.y + 0.05, 0), kind === 'powder' ? 'puff' : 'splash', { n: kind === 'powder' ? 5 : 3, scale: 0.2 });
    } else if (this.pieces < MAX_PIECES) {
      const m = kind === 'whole' ? MD.choppable(id).group : kind === 'small' ? smallBits(id) : chunk(id);
      if (kind === 'whole') { m.scale.setScalar(id === 'watermelon' ? 0.5 : id === 'pineapple' ? 0.6 : 0.75); m.userData.whole = id; }
      const a = Math.random() * Math.PI * 2, rr = Math.random() * c.r * (c.kind === 'glass' ? 0.4 : 0.6);
      m.position.set(Math.cos(a) * rr, 0.004 + Math.random() * 0.01, Math.sin(a) * rr);
      m.rotation.y = Math.random() * Math.PI * 2;
      c.blobs.add(m);
      meshes.push(m);
      this.pieces++;
      const y1 = m.position.y;
      m.position.y = y1 + 0.3;
      K.anim(0.3, (k) => { m.position.y = y1 + 0.3 * (1 - k * k); });
    }
    if (!c.fill.visible && meshes.length && (c.kind === 'pan' || c.kind === 'pot')) { /* solids sit in the empty pan */ }
    this.items.push(id);
    seeWords(this.c.state, [id]); // the Word Book fills up as she cooks
    this.history.push({ id, meshes, before });
    K.sfx('pop');
    speak(WORD[id]?.en || id, false);
    this.c.host.emit('cafeAdd', id);
    this.refresh();
  }

  undo() {
    if (this.busy) return;
    const e = this.history.pop();
    if (!e) return;
    const c = this.K.cont;
    for (const m of e.meshes) { c.blobs.remove(m); disposeTree(m); if (!m.userData.blob) this.pieces = Math.max(0, this.pieces - 1); }
    this.restore(e.before);
    this.items.pop();
    this.K.sfx('pick');
    this.refresh();
  }

  // ---------- actions ----------
  async chop() {
    if (this.busy) return;
    const K = this.K, c = K.cont;
    const piece = [...c.blobs.children].reverse().find((m) => m.userData.whole);
    if (!piece) return toast('Add something to chop first, like a 🍅 tomato!', { icon: '🔪' });
    const id = piece.userData.whole;
    await this.sub(stepPrompt({ t: 'chop', item: id }), async () => {
      c.blobs.remove(piece);
      disposeTree(piece);
      K.dish.visible = false;
      const board = MD.board();
      const food = MD.choppable(id);
      food.group.position.y = 0.03;
      K.props.add(board, food.group);
      await K.cutting(food, 0.03, id);
      K.endStep();
      K.clearProps();
      K.dish.visible = true;
      // the slices go back into the dish
      const slices = [];
      for (let k = 0; k < 7; k++) {
        const s = MD.sliceMesh(id, 0.7);
        s.userData.keep = true;
        const a = Math.random() * Math.PI * 2, rr = Math.random() * c.r * 0.6;
        s.position.set(Math.cos(a) * rr, 0.006 + Math.random() * 0.01, Math.sin(a) * rr);
        s.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * 6, (Math.random() - 0.5) * 0.4);
        c.blobs.add(s);
        slices.push(s);
      }
      const e = this.history.find((x) => x.meshes.includes(piece));
      if (e) e.meshes = e.meshes.filter((m) => m !== piece).concat(slices);
      this.actions.add('chop');
    });
  }

  async mixIt() {
    if (this.busy) return;
    if (!this.items.length) return toast('Add some food first!', { icon: '🥄' });
    const blender = this.kind === 'blender';
    await this.sub(stepPrompt({ t: 'stir', tool: blender ? 'blender' : undefined }), async () => {
      await this.K.run({ t: 'stir', turns: 2, tool: blender ? 'blender' : undefined });
      this.actions.add('mix');
    });
  }

  async cook() {
    if (this.busy) return;
    if (!this.items.length) return toast('Add some food first!', { icon: '🔥' });
    if (this.kind === 'glass' || this.kind === 'blender') return toast('Drinks don\'t go on the stove! 😄 Try a pan or a pot.', { icon: '🥤' });
    const K = this.K, c = K.cont;
    await this.sub({ en: 'Cook it! Stop in the green', ru: 'Готовь! Нажми STOP в зелёной зоне.' }, async () => {
      const onStove = this.kind === 'pan' || this.kind === 'pot';
      if (!onStove) { K.props.add(MD.stove()); K.dish.position.y = 0.03; }
      const needle = h('i', { class: 'needle' });
      const meter = h('div', { class: 'heat' }, h('div', { class: 'z raw' }), h('div', { class: 'z good' }), h('div', { class: 'z burn' }), needle);
      const btn = h('button', { class: 'btn big cook-btn' }, 'STOP ✋');
      K.controls(h('div', { class: 'cook-ctl' }, meter, btn));
      const { p, finish } = K.finisher();
      let heat = 0, sz = 0;
      btn.addEventListener('click', () => finish(heat));
      K.finishNow = () => finish(0.7);
      K.every((dt) => {
        heat = Math.min(1, heat + dt * 0.24);
        needle.style.left = (heat * 100).toFixed(1) + '%';
        if (Math.random() < dt * 6) K.burst(new THREE.Vector3((Math.random() - 0.5) * 0.15, c.top, (Math.random() - 0.5) * 0.1), 'puff', { n: 1, scale: 0.18 });
        sz += dt;
        if (sz > 0.5) { sz = 0; const a = this.c.audio; if (a.ctx && a.sfxOn) a.noiseHit(a.ctx.currentTime, 0.4, this.kind === 'pot' ? 700 : 3200, 0.04); }
        if (heat >= 1) finish(1);
      });
      const hv = await p;
      K.endStep();
      // everything turns golden (or a little burnt!)
      const tone = hv > 0.92 ? '#5a4030' : mix('#ffffff', '#c88040', Math.min(1, hv) * 0.8);
      const tm = MD.FOOD.clone();
      tm.color.set(tone);
      tm.userData.own = true;
      c.blobs.traverse((o) => { if (o.isMesh && !o.userData.blob) o.material = tm; });
      c.fill.material.color.lerp(new THREE.Color('#a06030'), Math.min(1, hv) * 0.35);
      K.mixColor = '#' + c.fill.material.color.getHexString();
      const msg = hv > 0.92 ? ['Oops, a bit crispy!', 'Ой, немного подгорело!'] : hv >= 0.58 ? ['Perfect!', 'Идеально!'] : ['Nice and soft!', 'Мягко и нежно!'];
      celebrate(msg[0], ru(msg[1]), 1200);
      speak(msg[0]);
      K.burst(new THREE.Vector3(0, c.top, 0), 'sparkle', { n: 10 });
      K.clearProps();
      K.dish.position.y = 0;
      this.actions.add('cook');
    });
  }

  // run one action with the pantry hidden
  async sub(pr, fn) {
    this.busy = true;
    this.show(false);
    this.prompt(pr.en, pr.ru);
    try { await fn(); } finally {
      this.busy = false;
      if (this.ui) {
        this.show(true);
        this.prompt('Make anything you like!', 'Готовь что хочешь! Добавляй любые продукты, сколько угодно.');
        this.refresh();
      }
    }
  }

  suggestName() {
    const count = {};
    for (const id of this.items) count[id] = (count[id] || 0) + 1;
    const top = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => WORD[id]?.en || id);
    const word = this.actions.has('cook') && this.kind === 'bowl' ? 'Cake' : DISH_WORD[this.kind];
    return `${pick(ADJ)} ${top.join(' ')} ${word}`.replace(/\s+/g, ' ').trim();
  }

  async done() {
    if (this.busy) return;
    if (!this.items.length) return toast('Add some food first!', { icon: '✨' });
    this.busy = true;
    this.show(false);
    const suggested = this.suggestName();
    let name = await promptBox('✨ Name your dish', 'What is it called? You can type anything!', suggested, 28);
    name = (name || suggested).trim().slice(0, 28) || suggested;
    this.name = name;
    const st = this.c.state;
    const unique = [...new Set(this.items)];
    st.creations = [{ name, items: unique.slice(0, 14), n: this.items.length, t: Date.now() }, ...(st.creations || [])].slice(0, 40);
    st.stats.created = (st.stats.created || 0) + 1;
    this.c.save();
    this.c.audio.play('fanfare');
    celebrate(`${name}!`, ru('Ура! Новое блюдо!'), 1800);
    speak(`You made ${name}!`, false);
    this.K.burst(new THREE.Vector3(0, 0.2, 0), 'confetti', { n: 40, scale: 0.6 });
    this.prompt(`You made: ${name}`, 'Отдай блюдо гостю или приготовь новое.');
    const give = h('button', { class: 'btn big', onclick: () => { click(); this.K.controls(); this.giveToGuest(); } }, '🛎️ Give it to a guest');
    const again = h('button', { class: 'btn big mint', onclick: () => { click(); this.K.controls(); this.busy = false; this.show(true); this.newDish(this.kind); } }, '✨ New dish');
    this.K.controls(h('div', { class: 'cook-ctl' }, give, again));
  }

  // a guest walks in, eats it and pays
  async giveToGuest() {
    const c = this.c, K = this.K;
    c.setView('service');
    const av = new Avatar(c.randomLook(), { scale: 0.82 });
    av.root.position.copy(DOOR);
    c.world.add(av.root);
    const target = SPOTS[1].clone();
    const dummy = { place() {}, patience() {}, remove() {}, set() {} };
    const guest = { av, spot: 1, target, orders: [], delivered: 0, state: 'walk', patience: 1, path: [new THREE.Vector3(DOOR.x, 0, -3.8), new THREE.Vector3(target.x, 0, -2.2), target.clone()], served: [], bubble: dummy };
    c.customers.push(guest);
    this.guest = guest;
    c.audio.play('open');
    await new Promise((res) => { const chk = () => { if (!this.ui || guest.state === 'wait') res(); else setTimeout(chk, 150); }; chk(); });
    if (!this.ui) return;
    // the dish slides over the counter to the guest
    const dish = new THREE.Group();
    while (K.dish.children.length) dish.add(K.dish.children[0]);
    K.setDish(null);
    dish.position.copy(K.work.position);
    c.world.add(dish);
    const from = dish.position.clone(), to = new THREE.Vector3(target.x, COUNTER_Y, -0.3);
    await K.anim(0.7, (k) => { dish.position.lerpVectors(from, to, k); dish.position.y += Math.sin(k * Math.PI) * 0.35; });
    const unique = new Set(this.items).size;
    const pay = Math.min(220, 20 + unique * 4 + Math.min(30, this.items.length) * 3 + this.actions.size * 12);
    c.state.coins += pay;
    addXP(c.host.state, 4 + this.actions.size);
    c.host.emit('coins', pay, 'cafe');
    c.changed();
    c.fx.burst(to.clone().add(new THREE.Vector3(0, 0.3, 0)), 'coins', { n: 8 });
    c.fx.burst(av.root.position.clone().add(new THREE.Vector3(0, 1.6, 0)), 'hearts', { n: 6 });
    c.audio.play('coin');
    const v = to.clone().add(new THREE.Vector3(0, 0.4, 0)).project(c.camera);
    floaty(`+${pay}🪙`, (v.x + 1) / 2 * window.innerWidth, (1 - v.y) / 2 * window.innerHeight);
    av.playEmote('cheer', 1.8);
    const line = pick([`Wow! I love your ${this.name}!`, `Yummy! ${this.name} is delicious!`, `Mmm! Can I have more ${this.name}?`]);
    speak(line);
    toast(line, { icon: '😋', time: 3000 });
    await K.wait(1.6);
    if (!this.ui) { disposeTree(dish); return; }
    av.root.attach(dish);
    dish.position.set(0, 0.95, 0.5);
    dish.scale.setScalar(0.9);
    guest.state = 'leave';
    guest.path = [new THREE.Vector3(target.x, 0, -2.2), new THREE.Vector3(DOOR.x, 0, -3.8), DOOR.clone()];
    this.guest = null;
    c.setView('cook');
    this.busy = false;
    this.show(true);
    this.newDish(this.kind);
  }

  update() {}

  // ---------- UI ----------
  buildUI() {
    this.ui?.remove();
    const left = h('div', { class: 'free-left' });
    this.contBtns = {};
    for (const ct of CONTAINERS) {
      const b = h('button', { class: 'free-btn', onclick: () => { click(); this.setContainer(ct.id); } }, h('span', {}, ct.icon), h('small', {}, ct.en));
      this.contBtns[ct.id] = b;
      left.appendChild(b);
    }
    const act = (icon, label, fn, cls = '') => h('button', { class: 'free-btn ' + cls, onclick: () => { click(); fn(); } }, h('span', {}, icon), h('small', {}, label));
    const right = h('div', { class: 'free-right' },
      act('🔪', 'Chop', () => this.chop()), act('🥄', 'Mix', () => this.mixIt()), act('🔥', 'Cook', () => this.cook()),
      act('↩️', 'Undo', () => this.undo()), act('✅', 'Done', () => this.done(), 'go'));
    this.items$ = h('div', { class: 'p-items' });
    const tabs = h('div', { class: 'p-tabs' });
    const showCat = (cat, btn) => {
      [...tabs.children].forEach((x) => x.classList.remove('on'));
      btn.classList.add('on');
      this.items$.innerHTML = '';
      for (const id of cat.items) {
        const w = WORD[id];
        this.items$.appendChild(h('button', { class: 'p-item', 'data-id': id, onclick: () => this.add(id) }, h('span', { class: 'em' }, w.emoji), h('span', { class: 'w' }, w.en)));
      }
      this.items$.scrollLeft = 0;
    };
    for (const cat of PANTRY) {
      const b = h('button', { class: 'p-tab', onclick: () => { click(); showCat(cat, b); } }, cat.icon, ' ', cat.en);
      tabs.appendChild(b);
    }
    this.chips = h('div', { class: 'free-chips' });
    this.pantry = h('div', { class: 'free-pantry' }, tabs, this.items$);
    this.ui = h('div', { class: 'free-ui' }, this.chips, left, right, this.pantry);
    this.c.hud.box.appendChild(this.ui);
    showCat(PANTRY[0], tabs.children[0]);
  }

  show(on) {
    if (!this.ui) return;
    for (const el of this.ui.querySelectorAll('.free-left, .free-right, .free-pantry')) el.classList.toggle('hide', !on);
  }

  refresh() {
    if (!this.ui) return;
    for (const [k, b] of Object.entries(this.contBtns)) b.classList.toggle('on', k === this.kind);
    const count = {};
    for (const id of this.items) count[id] = (count[id] || 0) + 1;
    this.chips.innerHTML = '';
    const list = Object.entries(count);
    if (!list.length) this.chips.appendChild(h('span', { class: 'muted' }, 'Tap food below to add it 👇'));
    for (const [id, n] of list) this.chips.appendChild(h('span', { class: 'chip' }, WORD[id]?.emoji || '•', n > 1 ? h('b', {}, `×${n}`) : null));
  }
}
