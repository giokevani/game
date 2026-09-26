// Jobs: bakery, florist and fishing mini-games, the community garden and
// package delivery around town.
import * as THREE from 'three';
import { JOBS, JOB, jobLevel, JOB_LEVELS, payMul, SEEDS, SEED, growth, FISH, FISH_BY, deliveryPay, deliveryTime } from '../data/jobs.js';
import { bakeryGame, floristGame, fishingGame } from './minigames.js';
import { Builder } from '../engine/builder.js';
import { M } from '../engine/materials.js';
import { emojiSprite } from '../engine/fx.js';
import { h, modal, toast, celebrate, click, fmt } from '../ui/ui.js';
import { spend, level as levelOf } from '../core/state.js';
import { BUILDINGS, PIER, POND, GARDEN } from '../data/map.js';

const doorOf = (b, out = 1.4) => ({ x: b.x + Math.sin(b.face) * (b.d / 2 + out), z: b.z + Math.cos(b.face) * (b.d / 2 + out) });

function plantGeo(seed, stage) {
  const s = SEED[seed];
  const b = new Builder();
  const leaf = '#6fbf5a', leaf2 = '#82cc68';
  if (stage === 0) { b.cyl(0.02, 0.02, 0.15, leaf, 0, 0, 0, { seg: 4 }); b.sphere(0.06, leaf2, 0.04, 0.16, 0, { sy: 0.5 }); return b.build({ ao: 0 }); }
  const n = stage === 1 ? 3 : 5;
  const hgt = stage === 1 ? 0.3 : seed === 'sunflower' || seed === 'corn' ? 0.9 : 0.5;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    b.sphere(0.12 + stage * 0.03, i % 2 ? leaf : leaf2, Math.cos(a) * 0.12, hgt * 0.5, Math.sin(a) * 0.12, { sy: 1.6, sx: 0.6, rz: Math.cos(a) * 0.5, rx: Math.sin(a) * 0.5 });
  }
  b.cyl(0.03, 0.04, hgt, leaf, 0, 0, 0, { seg: 5 });
  if (stage >= 2) {
    const c = s.col;
    const big = stage === 3;
    if (seed === 'pumpkin' || seed === 'melon') b.sphere(big ? 0.28 : 0.15, c, 0.15, 0.2, 0.1, { sy: 0.8 });
    else if (seed === 'sunflower') { b.cyl(big ? 0.18 : 0.1, big ? 0.18 : 0.1, 0.05, c, 0, hgt + 0.1, 0.05, { rx: 1.2, seg: 12, center: true }); b.cyl(0.08, 0.08, 0.06, '#8a5a3c', 0, hgt + 0.1, 0.08, { rx: 1.2, seg: 10, center: true }); }
    else if (seed === 'corn') b.cyl(0.07, 0.05, big ? 0.3 : 0.18, c, 0.1, hgt * 0.6, 0.05, { seg: 8, rz: -0.3 });
    else if (seed === 'carrot') b.cone(0.07, big ? 0.25 : 0.12, c, 0, 0.02, 0.0, { seg: 8, rx: Math.PI, center: false });
    else if (seed === 'lavender') for (let i = 0; i < 5; i++) b.cyl(0.03, 0.02, big ? 0.3 : 0.15, c, Math.cos(i) * 0.1, hgt, Math.sin(i) * 0.1, { seg: 5 });
    else for (let i = 0; i < (big ? 5 : 2); i++) b.sphere(big ? 0.08 : 0.05, s.rainbow ? ['#ff8fc0', '#ffd45e', '#7fc6ff', '#b58cff', '#8fe39a'][i] : c, Math.cos(i * 1.3) * 0.16, hgt * 0.5 + (i % 2) * 0.12, Math.sin(i * 1.3) * 0.16);
  }
  return b.build({ ao: 0 });
}

export class JobSystem {
  async init(game) {
    this.game = game;
    game.jobs = this;
    const st = game.state;
    st.garden = st.garden?.length ? st.garden : new Array(8).fill(null);
    st.collections.fish ||= {};
    st.collections.plants ||= {};
    const W = game.world;
    const B = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));
    const add = (b, job, label, icon) => {
      const d = doorOf(b);
      W.addInteract({ x: d.x, z: d.z, r: 2.6, label, icon, onUse: () => this.startJob(job) });
    };
    add(B.bakery, 'bakery', 'Bake Cakes', '🧁');
    add(B.florist, 'florist', 'Make Bouquets', '💐');
    add(B.postoffice, 'delivery', 'Deliveries', '📦');
    W.addInteract({ x: (PIER.x1 + PIER.x2) / 2, z: PIER.z2 + 2.5, y: PIER.y, r: 4, label: 'Go Fishing', icon: '🎣', onUse: () => this.startJob('fishing') });
    W.addInteract({ x: POND.x + POND.rx + 1.2, z: POND.z, r: 3, label: 'Go Fishing', icon: '🎣', onUse: () => this.startJob('fishing') });
    // garden beds
    this.beds = [];
    W.gardenSpots.forEach((spot, i) => {
      const mesh = new THREE.Mesh(undefined, M.foliage);
      mesh.position.set(spot.x, 0.45, spot.z);
      mesh.castShadow = true;
      game.scene.add(mesh);
      const bubble = emojiSprite('💧');
      bubble.position.set(spot.x, 1.6, spot.z);
      bubble.visible = false;
      game.scene.add(bubble);
      const bed = { i, spot, mesh, bubble, stage: -1, seed: null };
      bed.it = W.addInteract({ x: spot.x, z: spot.z + 2.1, r: 1.8, icon: '🌱', label: () => this.bedLabel(i), onUse: () => this.useBed(i) });
      this.beds.push(bed);
    });
    // seed stand
    W.addInteract({ x: GARDEN.x - 3.5, z: GARDEN.z + 2, r: 2.2, label: 'Garden Guide', icon: '📋', onUse: () => this.gardenInfo() });
    this.delivery = null;
    this.gardenT = 0;
  }

  get state() { return this.game.state; }
  level(id) { return jobLevel(this.state.jobs[id]?.xp || 0); }

  gain(id, n = 1) {
    const j = this.state.jobs[id];
    const before = jobLevel(j.xp);
    j.xp += n;
    const after = jobLevel(j.xp);
    this.state.stats.jobsDone += n;
    this.game.emit('job', id, n);
    if (after > before) {
      setTimeout(() => celebrate(`${JOB[id].name} level ${after}!`, 'Better pay and new things to make ✨'), 300);
      this.game.emit('jobLevel', id, after);
    }
  }

  async startJob(id) {
    const g = this.game;
    if (JOB[id].lvl && levelOf(this.state) < JOB[id].lvl) return toast(`Come back at level ${JOB[id].lvl} for this job!`, { icon: '🔒' });
    if (id === 'delivery') return this.delivery ? this.stopDelivery(false) : this.startDelivery();
    const lvl = this.level(id);
    g.mode = 'minigame';
    g.hud.setVisible(false);
    g.audio?.play('open');
    const sfx = (n) => g.audio?.play(n);
    const hooks = g.testHooks;
    let res;
    try {
      if (id === 'bakery') res = await bakeryGame(lvl, { sfx, hooks, onWin: ({ pay }) => { g.reward(pay, 8 + lvl * 2, 'job'); this.gain('bakery'); } });
      else if (id === 'florist') res = await floristGame(lvl, { sfx, hooks, onWin: ({ pay }) => { g.reward(pay, 9 + lvl * 2, 'job'); this.gain('florist'); } });
      else if (id === 'fishing') res = await fishingGame(lvl, {
        sfx, hooks, night: () => g.sky.state.night > 0.5,
        onWin: ({ fish, pay }) => {
          const c = this.state.collections.fish;
          const isNew = !c[fish];
          c[fish] = (c[fish] || 0) + 1;
          this.state.stats.fishCaught++;
          g.reward(pay, 10 + lvl * 2, 'job');
          this.gain('fishing');
          g.emit('fish', fish, FISH_BY[fish].rar);
          return isNew;
        },
      });
    } finally {
      g.mode = 'play';
      g.hud.setVisible(true);
    }
    if (res?.done) toast(`Great work! You earned ${res.earned} 🪙`, { icon: JOB[id].icon, kind: 'gold' });
    g.save();
  }

  // ---------- garden ----------
  bedLabel(i) {
    const p = this.state.garden[i];
    if (!p) return 'Plant Seeds';
    if (!p.watered) return 'Water';
    const gr = growth(p);
    if (gr >= 1) return 'Harvest';
    return `Growing ${Math.floor(gr * 100)}%`;
  }

  useBed(i) {
    const st = this.state;
    const p = st.garden[i];
    const g = this.game;
    const bed = this.beds[i];
    if (!p) return this.seedPicker(i);
    if (!p.watered) {
      p.watered = Date.now();
      g.fx.burst(new THREE.Vector3(bed.spot.x, 0.6, bed.spot.z), 'splash');
      g.audio?.play('water');
      toast(`Watered! Your ${SEED[p.seed].name} will be ready in ${Math.round(SEED[p.seed].grow / 60 * 10) / 10} min`, { icon: '💧' });
      g.emit('water');
      return;
    }
    const gr = growth(p);
    if (gr < 1) {
      const left = Math.ceil(SEED[p.seed].grow * (1 - gr));
      return toast(`Still growing… ${left > 60 ? Math.ceil(left / 60) + ' min' : left + ' s'} left. Go do something fun!`, { icon: '🌱' });
    }
    const s = SEED[p.seed];
    const lvl = this.level('garden');
    const pay = Math.round(s.sell * payMul(lvl));
    st.garden[i] = null;
    st.collections.plants[s.id] = (st.collections.plants[s.id] || 0) + 1;
    st.stats.harvests++;
    g.fx.burst(new THREE.Vector3(bed.spot.x, 0.8, bed.spot.z), 'petals');
    g.reward(pay, 10 + Math.round(s.sell / 10), 'harvest');
    toast(`Harvested a ${s.name}! ${s.icon}`, { icon: '🧺' });
    this.gain('garden');
    g.emit('harvest', s.id);
    this.refreshBed(i, true);
  }

  seedPicker(i) {
    const st = this.state;
    const lvl = levelOf(st);
    modal('🌱 Choose a seed', (b, close) => {
      b.appendChild(h('div', { class: 'muted', style: { marginBottom: '8px' } }, 'Plant it, water it, and come back when it has grown. Plants keep growing even when you close the game!'));
      const g = h('div', { class: 'grid' });
      for (const s of SEEDS) {
        const lock = s.lvl > lvl ? `Level ${s.lvl}` : null;
        g.appendChild(h('button', { class: 'card' + (lock ? ' locked' : ''), onclick: () => {
          click();
          if (lock) return toast(`Unlocks at ${lock}`, { icon: '🔒' });
          if (!spend(st, s.cost)) return toast('Not enough coins!', { icon: '🪙' });
          st.garden[i] = { seed: s.id, planted: Date.now(), watered: 0 };
          this.game.audio?.play('place');
          this.game.emit('plant', s.id);
          close();
          toast('Planted! Now give it some water 💧', { icon: s.icon });
          this.refreshBed(i, true);
        } }, h('div', { class: 'thumb' }, s.icon), h('div', { class: 'nm' }, s.name), h('div', { class: 'price' }, lock || `🪙 ${s.cost} → ${s.sell}`), h('div', { class: 'muted', style: { fontSize: '11px' } }, `${Math.round(s.grow / 6) / 10} min`)));
      }
      b.appendChild(g);
    });
  }

  gardenInfo() {
    const st = this.state;
    const lvl = this.level('garden');
    modal('📋 Garden Guide', (b) => {
      b.appendChild(h('div', { class: 'muted' }, `Gardener level ${lvl}. Harvest pays ${Math.round(payMul(lvl) * 100)}%.`));
      b.appendChild(h('div', { class: 'section-title' }, `Plant collection: ${Object.keys(st.collections.plants).length} / ${SEEDS.length}`));
      const g = h('div', { class: 'grid' });
      for (const s of SEEDS) {
        const n = st.collections.plants[s.id] || 0;
        g.appendChild(h('div', { class: 'card' + (n ? '' : ' locked') }, h('div', { class: 'thumb' }, n ? s.icon : '❓'), h('div', { class: 'nm' }, n ? s.name : '???'), h('div', { class: 'muted' }, n ? `× ${n}` : '')));
      }
      b.appendChild(g);
    });
  }

  refreshBed(i, force = false) {
    const bed = this.beds[i];
    const p = this.state.garden[i];
    let stage = -1;
    if (p) { const gr = growth(p); stage = !p.watered ? 0 : gr >= 1 ? 3 : gr > 0.5 ? 2 : gr > 0.15 ? 1 : 0; }
    const key = p ? p.seed + stage : '';
    if (!force && bed.key === key) return;
    bed.key = key;
    bed.mesh.geometry?.dispose();
    bed.mesh.geometry = p ? mergeRow(p.seed, stage) : new THREE.BufferGeometry();
    bed.bubble.visible = !!p && (!p.watered || stage === 3);
    if (bed.bubble.visible) {
      const nb = emojiSprite(!p.watered ? '💧' : SEED[p.seed].icon);
      bed.bubble.material = nb.material;
    }
  }

  // ---------- delivery ----------
  startDelivery() {
    const g = this.game;
    this.delivery = { n: 0, max: 4 + this.level('delivery'), earned: 0 };
    toast('Pick up the package and follow the arrow! 📦', { icon: '📮' });
    g.emit('deliveryStart');
    this.nextDelivery();
  }

  nextDelivery() {
    const g = this.game;
    const d = this.delivery;
    const p = g.player.pos;
    const spots = BUILDINGS.filter((b) => (b.kind === 'house' || b.kind === 'shop') && b.id !== 'postoffice').map((b) => ({ ...doorOf(b, 2.2), name: b.name || 'a cozy house' }));
    const far = spots.filter((s) => Math.hypot(s.x - p.x, s.z - p.z) > 28);
    const t = far[Math.floor(Math.random() * far.length)] || spots[0];
    const dist = Math.hypot(t.x - p.x, t.z - p.z);
    const lvl = this.level('delivery');
    d.target = t;
    d.time = deliveryTime(dist, lvl) + (g.player.vehicle ? 0 : 8);
    d.pay = deliveryPay(dist, lvl);
    if (!this.beam) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xff8fc0, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
      this.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 30, 16, 1, true), mat);
      this.beam.renderOrder = 4;
      this.box = emojiSprite('📦');
      this.box.scale.set(1.4, 1.4, 1);
      const ab = new Builder();
      ab.cone(0.35, 0.9, '#ff6fa8', 0, 0, 0, { rx: Math.PI / 2, seg: 4, center: true });
      this.arrow = new THREE.Mesh(ab.build({ ao: 0 }), M.glowAlways);
      g.scene.add(this.beam, this.box, this.arrow);
    }
    this.beam.visible = this.box.visible = this.arrow.visible = true;
    this.beam.position.set(t.x, 15, t.z);
    this.box.position.set(t.x, 2.6, t.z);
  }

  stopDelivery(timeout) {
    const d = this.delivery;
    if (!d) return;
    this.delivery = null;
    if (this.beam) this.beam.visible = this.box.visible = this.arrow.visible = false;
    this.game.hud.setTracker([]);
    this.game.quests?.refreshTracker();
    toast(timeout ? `Out of time! You delivered ${d.n} packages (+${d.earned} 🪙)` : `Shift over: ${d.n} packages delivered (+${d.earned} 🪙)`, { icon: '📦', kind: 'gold' });
  }

  update(dt, game) {
    // garden visuals every second
    this.gardenT -= dt;
    if (this.gardenT <= 0) { this.gardenT = 1; for (let i = 0; i < this.beds.length; i++) this.refreshBed(i); }
    for (const b of this.beds) if (b.bubble.visible) b.bubble.position.y = 1.5 + Math.sin(game.time * 3 + b.i) * 0.08;
    const d = this.delivery;
    if (!d) return;
    if (game.mode === 'play') d.time -= dt;
    const p = game.player.pos;
    const t = d.target;
    const dist = Math.hypot(t.x - p.x, t.z - p.z);
    this.arrow.position.set(p.x, p.y + 3.1, p.z);
    this.arrow.lookAt(t.x, p.y + 3.1, t.z);
    this.box.position.y = 2.6 + Math.sin(game.time * 3) * 0.2;
    game.hud.setTracker([{ title: `📦 Delivery ${d.n + 1}/${d.max}`, text: `To ${t.name} — ${Math.round(dist)} m`, prog: `⏱ ${Math.max(0, Math.ceil(d.time))}s` }]);
    if (dist < 3) {
      d.n++;
      d.earned += d.pay;
      game.fx.burst(new THREE.Vector3(t.x, 1, t.z), 'confetti');
      game.reward(d.pay, 14 + this.level('delivery') * 3, 'job');
      this.gain('delivery');
      if (d.n >= d.max) { this.stopDelivery(false); celebrate('Shift complete!', `All ${d.max} packages delivered 📦`); this.game.reward(60, 20); }
      else this.nextDelivery();
    } else if (d.time <= 0) this.stopDelivery(true);
  }
}

// a garden bed holds a little row of the same plant
const rowCache = new Map();
function mergeRow(seed, stage) {
  const k = seed + stage;
  if (rowCache.has(k)) return rowCache.get(k);
  const b = new Builder();
  const one = plantGeo(seed, stage);
  const holder = new Builder();
  holder.parts.push(one);
  for (const [x, z] of [[-0.8, -0.8], [0, -0.8], [0.8, -0.8], [-0.8, 0], [0, 0], [0.8, 0], [-0.8, 0.8], [0, 0.8], [0.8, 0.8]]) b.merge(holder, x, 0, z, (x + z) * 2);
  const g = b.build({ ao: 0 });
  rowCache.set(k, g);
  return g;
}
