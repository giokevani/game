// Pets: eggs you care for until they hatch, pets that follow you, have needs,
// grow up through five stages and learn tricks.
import * as THREE from 'three';
import { SPECIES, SPEC, EGGS, EGG, STAGES, TRICKS, NEEDS, NEED, PET_ACC, PACC, RARITY, stageOf, rollEgg, eggOdds, needReward } from '../data/pets.js';
import { buildPet, buildEgg } from './model.js';
import { emojiSprite, setSpriteEmoji } from '../engine/fx.js';
import { renderObject, lazyThumb } from '../house/thumbs.js';
import { h, modal, toast, celebrate, click, promptBox, tabs, fmt } from '../ui/ui.js';
import { spend, uid, level as levelOf } from '../core/state.js';
import { PLAZA, POND, PLAYGROUND, BUILDINGS } from '../data/map.js';
import { ORIGIN, FLOOR_Y } from '../house/view.js';
import * as HM from '../house/model.js';

const MAX_HOME_PETS = 4;

export function petThumb(spId, accId) {
  const key = `p:${spId}:${accId || 'none'}`;
  return renderObject(buildPet(spId, { acc: accId }).group, key);
}
export function eggThumb(eggId) {
  return renderObject(buildEgg(eggId).group, 'e:' + eggId);
}

class PetActor {
  constructor(game, data, isEgg) {
    this.game = game;
    this.data = data;
    this.isEgg = isEgg;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.facing = 0;
    this.t = Math.random() * 5;
    this.action = null;
    this.actionT = 0;
    this.home = false;
    this.wander = null;
    this.build();
  }
  build() {
    if (this.model) this.game.scene.remove(this.model.group);
    this.model = this.isEgg ? buildEgg(this.data.type) : buildPet(this.data.species, { acc: this.data.acc });
    this.stage = this.isEgg ? 1 : stageOf(this.data.tasks);
    const s = this.isEgg ? 1 : STAGES[this.stage].scale;
    this.model.group.scale.setScalar(s);
    this.bubble = emojiSprite('💗');
    this.bubble.visible = false;
    this.bubble.position.y = (this.isEgg ? 0.95 : 1.25);
    this.bubble.scale.setScalar(0.55 / s);
    this.model.group.add(this.bubble);
    this.game.scene.add(this.model.group);
    this.sparkle = !this.isEgg && (this.stage >= 4 || this.model.glow);
  }
  dispose() { this.game.scene.remove(this.model.group); }
  place(p) { this.pos.copy(p); this.sync(); }
  sync() { this.model.group.position.copy(this.pos); this.model.group.rotation.y = this.facing; }

  setNeed(icon) {
    if (!icon) { this.bubble.visible = false; this.needIcon = null; return; }
    if (this.needIcon !== icon) { setSpriteEmoji(this.bubble, icon); this.needIcon = icon; }
    this.bubble.visible = true;
  }

  trick(name) { this.action = name; this.actionT = name === 'fly' ? 3 : 1.6; this.game.audio?.play('pop'); }

  update(dt, target, o = {}) {
    this.t += dt;
    const world = this.game.world;
    let speed = 0;
    if (this.goTo) {
      const d = Math.hypot(this.goTo.x - this.pos.x, this.goTo.z - this.pos.z);
      if (d > 0.35) this.moveToward(this.goTo, dt, 6);
      else { this.goTo = null; }
      speed = d > 0.35 ? 1 : 0;
    } else if (target) {
      const d = Math.hypot(target.x - this.pos.x, target.z - this.pos.z);
      if (d > 26 || Math.abs(target.y - this.pos.y) > 6) { this.pos.set(target.x, target.y, target.z); this.game.fx?.burst(this.pos, 'puff'); }
      else if (d > (o.near ?? 1.3)) { this.moveToward(target, dt, Math.min(12, 3 + d * 1.6)); speed = 1; }
    }
    // gravity / ground
    const g = world.groundAt(this.pos.x, this.pos.z, this.pos.y + 0.5);
    this.pos.y += (g - this.pos.y) * Math.min(1, dt * 12);
    this.animate(dt, speed);
    this.sync();
  }

  moveToward(t, dt, v) {
    const dx = t.x - this.pos.x, dz = t.z - this.pos.z;
    const d = Math.hypot(dx, dz) || 1;
    const step = Math.min(d, v * dt);
    this.pos.x += (dx / d) * step;
    this.pos.z += (dz / d) * step;
    this.game.world.resolve(this.pos, 0.25, this.pos.y);
    const want = Math.atan2(dx, dz);
    let diff = Math.atan2(Math.sin(want - this.facing), Math.cos(want - this.facing));
    this.facing += diff * Math.min(1, dt * 10);
  }

  animate(dt, speed) {
    const m = this.model;
    const t = this.t;
    const inner = m.inner;
    let y = 0, sx = 1, sy = 1, rx = 0, ry = 0, rz = 0;
    if (this.isEgg) {
      y = speed ? Math.abs(Math.sin(t * 9)) * 0.14 : 0;
      rz = speed ? Math.sin(t * 9) * 0.15 : Math.sin(t * 2) * 0.05;
      if (this.hatching) { rz = Math.sin(t * 40) * 0.3 * this.hatching; sy = 1 + Math.sin(t * 20) * 0.05; }
    } else {
      if (speed) { y = Math.abs(Math.sin(t * 11)) * 0.12; rx = 0.08; }
      else { sy = 1 + Math.sin(t * 3) * 0.025; sx = 1 - Math.sin(t * 3) * 0.012; }
      const swing = speed ? Math.sin(t * 11) * 0.7 : 0;
      m.legs.forEach((l, i) => { l.rotation.x = (i % 2 ? swing : -swing) * (i < 2 ? 1 : -1); });
      if (m.tail) m.tail.rotation.y = Math.sin(t * (speed ? 14 : 5)) * 0.4;
      const flap = m.wings.length ? Math.sin(t * (this.action === 'fly' || this.action === 'jump' ? 22 : 4)) * (this.action ? 0.6 : 0.15) : 0;
      m.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * (0.2 + flap); });
      if (this.action) {
        this.actionT -= dt;
        const a = this.action;
        const p = 1 - this.actionT / (a === 'fly' ? 3 : 1.6);
        if (a === 'sit') { rx = -0.35; y = -0.05; }
        else if (a === 'jump') y = Math.sin(Math.min(1, p * 1.5) * Math.PI) * 0.9;
        else if (a === 'spin') ry = p * Math.PI * 4;
        else if (a === 'dance') { rz = Math.sin(t * 12) * 0.3; y = Math.abs(Math.sin(t * 12)) * 0.15; }
        else if (a === 'fly') { y = Math.sin(p * Math.PI) * 2.2; ry = p * Math.PI * 2; if (Math.random() < 0.3) this.game.fx?.burst(this.pos, 'glitter', { dy: y + 0.4 }); }
        else if (a === 'eat') { rx = 0.35 + Math.sin(t * 16) * 0.1; }
        else if (a === 'sleep') { rx = 0; sy = 0.8; y = -0.05; if (Math.random() < dt * 1.2) this.game.fx?.burst(this.pos, 'zzz', { dy: 0.8 }); }
        else if (a === 'wash') { rz = Math.sin(t * 18) * 0.2; if (Math.random() < dt * 8) this.game.fx?.burst(this.pos, 'bubbles', { n: 2, dy: 0.5 }); }
        else if (a === 'happy') { y = Math.abs(Math.sin(t * 10)) * 0.25; }
        if (this.actionT <= 0) this.action = null;
      }
      if (this.sparkle && Math.random() < dt * 2.5) this.game.fx?.burst(this.pos, 'glitter', { dy: 0.3 + Math.random() * 0.6, spread: 0.8 });
    }
    inner.position.y = y;
    inner.scale.set(sx, sy, sx);
    inner.rotation.set(rx, ry, rz);
    this.bubble.position.y = (this.isEgg ? 0.95 : 1.25) + Math.sin(t * 3) * 0.05 + (y > 0 ? y : 0);
  }
}

export class PetSystem {
  async init(game) {
    this.game = game;
    game.pets = this;
    game.debug = { ...(game.debug || {}), buildPet, buildEgg, SPECIES, EGGS };
    const st = game.state;
    st.needs ||= [];
    st.items ||= { treats: 0 };
    st.owned.petAcc ||= [];
    this.needTimer = 25;
    this.zoneT = 0;
    this.actor = null;
    this.homeActors = [];
    this.spawnActive();
    this.refreshHome();
    game.openPets = () => this.openPanel();
    // public spots that satisfy needs
    const W = game.world;
    const needOf = (u) => () => game.mode === 'play' && this.actor && st.needs.some((n) => NEED[n.id].uses?.includes(u));
    W.addInteract({ x: PLAZA.x, z: PLAZA.z + 6.5, r: 3, label: 'Pet Drink', icon: '💧', enabled: needOf('drink'), onUse: () => this.useSpot('drink', new THREE.Vector3(PLAZA.x, 0, PLAZA.z + 5.8)) });
    W.addInteract({ x: POND.x - POND.rx - 1.5, z: POND.z, r: 4, label: 'Pet Drink', icon: '💧', enabled: needOf('drink'), onUse: () => this.useSpot('drink', new THREE.Vector3(POND.x - POND.rx - 0.8, 0, POND.z)) });
    W.addInteract({ x: PLAYGROUND.x, z: PLAYGROUND.z + 4, r: 6, label: 'Play!', icon: '🎾', enabled: needOf('playground'), onUse: () => this.useSpot('playground', new THREE.Vector3(PLAYGROUND.x, 0, PLAYGROUND.z + 4)) });
    const ps = BUILDINGS.find((b) => b.id === 'petshop');
    W.addInteract({ x: ps.x - ps.d / 2 - 1.2, z: ps.z, r: 3, label: 'Paw Pals', icon: '🐾', onUse: () => this.openShop() });
    game.on('use', (u, f, item) => this.onUse(u, f, item));
  }

  get state() { return this.game.state; }

  companion() {
    const st = this.state;
    return st.pets.find((p) => p.uid === st.activePet) || st.eggs.find((e) => e.uid === st.activePet) || null;
  }

  spawnActive() {
    this.actor?.dispose();
    this.actor = null;
    const c = this.companion();
    if (!c) { this.state.activePet = null; this.state.needs = []; return; }
    this.actor = new PetActor(this.game, c, !c.species);
    const p = this.game.player.pos;
    this.actor.place(new THREE.Vector3(p.x - 1, p.y, p.z - 1));
  }

  setActive(id) {
    if (this.state.activePet === id) return;
    this.state.activePet = id;
    this.state.needs = [];
    this.needTimer = 20;
    this.spawnActive();
    this.refreshHome();
  }

  refreshHome() {
    for (const a of this.homeActors) a.dispose();
    this.homeActors = [];
    const others = this.state.pets.filter((p) => p.uid !== this.state.activePet).slice(-MAX_HOME_PETS);
    const hs = this.state.house;
    const tiles = Object.keys(hs.tiles);
    if (!tiles.length) return;
    for (const p of others) {
      const a = new PetActor(this.game, p, false);
      a.home = true;
      const [i, j] = tiles[Math.floor(Math.random() * tiles.length)].split(',').map(Number);
      a.place(new THREE.Vector3(ORIGIN.x + i * 2 + 1, FLOOR_Y, ORIGIN.z + j * 2 + 1));
      this.homeActors.push(a);
    }
  }

  // ---------- needs ----------
  addNeed() {
    const st = this.state;
    if (!this.actor || st.needs.length >= 2) return;
    const zone = this.game.world.zoneAt(this.game.player.pos);
    const pool = NEEDS.filter((n) => !st.needs.some((x) => x.id === n.id) && (!n.unlock || st.unlocks[n.unlock]) && (!n.zone || n.zone !== zone?.id));
    // basic needs are more common than trips
    const weighted = pool.flatMap((n) => (n.zone ? [n] : [n, n, n]));
    const n = weighted[Math.floor(Math.random() * weighted.length)];
    if (!n) return;
    st.needs.push({ id: n.id, t: Date.now() });
    this.game.audio?.play('need');
    toast(`${this.actor.isEgg ? 'Your egg' : this.companion().name} is ${n.name.toLowerCase()}! ${n.icon}`, { icon: '🐾', kind: 'pink' });
    this.game.emit('need', n.id);
  }

  onUse(u, f, item) {
    if (!['food', 'water', 'petbed', 'play', 'pettub', 'cook', 'fridge', 'sink', 'sleep', 'bath', 'shower', 'bounce', 'tv', 'arcade'].includes(u)) return;
    const house = this.game.house;
    const target = house ? house.worldPosOf(f, 0, item.fp[1] / 2 + 0.3) : null;
    if (target) target.y = house.view.baseY(f, item);
    if (!this.completeByUse(u, target) && ['food', 'water', 'petbed', 'play', 'pettub'].includes(u)) {
      if (!this.actor) toast('This is for pets! Adopt one at Paw Pals 🐾', { icon: '🐾' });
      else { toast(`${this.actor.isEgg ? 'Your egg' : this.companion().name} doesn't need that right now 💗`, { icon: '🐾' }); this.actor.trick('happy'); this.game.fx?.burst(this.actor.pos, 'hearts'); }
    }
  }

  useSpot(u, at) {
    if (!this.completeByUse(u, at)) toast('Your pet is happy just being with you 💗', { icon: '🐾' });
  }

  completeByUse(u, at) {
    const st = this.state;
    if (!this.actor) return false;
    const need = st.needs.find((n) => NEED[n.id].uses?.includes(u));
    if (!need) return false;
    const act = { food: 'eat', cook: 'eat', fridge: 'eat', snack: 'eat', water: 'eat', sink: 'eat', drink: 'eat', petbed: 'sleep', sleep: 'sleep', pettub: 'wash', bath: 'wash', shower: 'wash' }[u] || 'happy';
    if (at) this.actor.goTo = at.clone();
    setTimeout(() => { if (this.actor) { this.actor.action = act; this.actor.actionT = 2.2; } }, 500);
    setTimeout(() => this.complete(need.id), 2400);
    need.done = true;
    return true;
  }

  complete(needId) {
    const st = this.state;
    const i = st.needs.findIndex((n) => n.id === needId);
    if (i < 0) return;
    st.needs.splice(i, 1);
    const c = this.companion();
    if (!c || !this.actor) return;
    st.stats.petTasks++;
    c.tasks = (c.tasks || 0) + 1;
    const stage = this.actor.isEgg ? 0 : stageOf(c.tasks - 1);
    const r = needReward(stage);
    this.game.fx?.burst(this.actor.pos, 'hearts');
    this.game.reward(r.coins, r.xp, 'pet');
    this.game.emit('petTask', needId, c);
    if (this.actor.isEgg) {
      if (c.tasks >= EGG[c.type].hatch) this.hatch(c);
      else toast(`Egg care ${c.tasks}/${EGG[c.type].hatch} — it's wiggling! 🥚`, { icon: '🥚' });
    } else {
      const ns = stageOf(c.tasks);
      if (ns > stage) {
        this.actor.build();
        this.actor.place(this.actor.pos);
        this.game.fx?.burst(this.actor.pos, 'confetti');
        celebrate(`${c.name} grew up!`, `Now a ${STAGES[ns].name} — new trick: ${TRICKS[STAGES[ns].trick]}`);
        this.game.audio?.play('levelup');
        this.game.emit('petGrow', ns, c);
      }
    }
    this.needTimer = Math.min(this.needTimer, 45 + Math.random() * 25);
  }

  async hatch(egg) {
    const st = this.state;
    const a = this.actor;
    a.hatching = 1;
    this.game.audio?.play('hatch');
    await new Promise((r) => setTimeout(r, 1800));
    const spId = rollEgg(egg.type);
    const sp = SPEC[spId];
    this.game.fx?.burst(a.pos, 'confetti');
    this.game.fx?.burst(a.pos, 'sparkle', { n: 40 });
    st.eggs = st.eggs.filter((e) => e.uid !== egg.uid);
    const pet = { uid: uid(), species: spId, name: sp.name, tasks: 0, acc: 'none', born: Date.now() };
    st.pets.push(pet);
    st.stats.eggsHatched++;
    st.activePet = pet.uid;
    st.needs = [];
    this.spawnActive();
    this.actor.place(a.pos);
    this.actor.trick('happy');
    celebrate(`It's a ${sp.name}!`, `${RARITY[sp.rar].name} pet ✨`, 2600);
    this.game.audio?.play('fanfare');
    this.game.emit('hatch', spId, sp.rar);
    setTimeout(async () => {
      const name = await promptBox('Name your pet!', `What would you like to call your new ${sp.name}?`, sp.name, 14);
      pet.name = name;
      toast(`Say hi to ${name}! 💗`, { icon: '🐾' });
      this.game.save();
    }, 1500);
  }

  giveEgg(type, activate = true) {
    const e = { uid: uid(), type, tasks: 0 };
    this.state.eggs.push(e);
    if (activate || !this.state.activePet) this.setActive(e.uid);
    this.game.emit('egg', type);
    return e;
  }

  feedTreat() {
    const st = this.state;
    if (!st.items.treats) return toast('No treats left — buy some at Paw Pals!', { icon: '🍪' });
    const n = st.needs.find((x) => x.id === 'hungry' || x.id === 'thirsty');
    if (!n) return toast("Your pet isn't hungry or thirsty right now.", { icon: '🍪' });
    st.items.treats--;
    this.completeByUse(n.id === 'hungry' ? 'snack' : 'drink', null);
  }

  // ---------- per frame ----------
  update(dt, game) {
    const st = this.state;
    const p = game.player;
    if (this.actor) {
      const back = new THREE.Vector3(Math.sin(p.facing) * -1.3 + Math.cos(p.facing) * 0.7, 0, Math.cos(p.facing) * -1.3 - Math.sin(p.facing) * 0.7);
      const target = p.pos.clone().add(back);
      this.actor.update(dt, target, { near: p.seat ? 0.8 : 1.3 });
      if (p.seat && !this.actor.action && Math.random() < dt * 0.3) this.actor.trick('sit');
      const open = st.needs.filter((n) => !n.done);
      this.actor.setNeed(open[0] ? NEED[open[0].id].icon : null);
      game.hud.setNeeds(open.map((n) => ({ icon: NEED[n.id].icon, name: NEED[n.id].name, cls: this.actor.isEgg ? 'egg' : '' })));
      // needs appear over time
      if (game.mode === 'play') {
        this.needTimer -= dt;
        if (this.needTimer <= 0) { this.addNeed(); this.needTimer = 55 + Math.random() * 35; }
      }
      // trip needs complete by being in the zone together
      const zone = game.world.zoneAt(p.pos);
      const trip = open.find((n) => NEED[n.id].zone && zone && NEED[n.id].zone === zone.id);
      if (trip) {
        this.zoneT += dt;
        if (this.zoneT > 3) { this.zoneT = 0; trip.done = true; this.actor.trick('happy'); this.complete(trip.id); }
      } else this.zoneT = 0;
    } else game.hud.setNeeds([]);
    // pets at home wander about
    for (const a of this.homeActors) {
      if (!a.wander || Math.random() < dt * 0.15) {
        const tiles = Object.keys(st.house.tiles);
        const [i, j] = tiles[Math.floor(Math.random() * tiles.length)].split(',').map(Number);
        a.wander = new THREE.Vector3(ORIGIN.x + i * 2 + 0.5 + Math.random(), FLOOR_Y, ORIGIN.z + j * 2 + 0.5 + Math.random());
      }
      a.update(dt, a.wander, { near: 0.4 });
    }
  }

  // ---------- UI ----------
  openShop() {
    const st = this.state;
    const lvl = levelOf(st);
    let tab = 0;
    const m = modal('🐾 Paw Pals Pet Shop', null, { tabs: tabs([{ name: 'Eggs', icon: '🥚' }, { name: 'Pet Accessories', icon: '🎀' }, { name: 'Treats', icon: '🍪' }], (t, i) => { tab = i; render(); }) });
    const render = () => {
      const b = h('div');
      if (tab === 0) {
        b.appendChild(h('div', { class: 'muted', style: { marginBottom: '8px' } }, 'Buy an egg, care for it, and it hatches into a surprise pet! Rare pets are harder to get.'));
        const g = h('div', { class: 'grid' });
        for (const e of EGGS.filter((x) => !x.hidden)) {
          const lock = e.unlock && !st.unlocks[e.unlock] ? (e.unlock === 'cave' ? 'Crystal Cove' : 'Sky Island') : e.lvl > lvl ? `Level ${e.lvl}` : null;
          const img = h('img');
          const card = h('button', { class: 'card' + (lock ? ' locked' : ''), onclick: () => { click(); this.eggInfo(e, lock, m); } },
            h('div', { class: 'thumb' }, img), h('div', { class: 'nm' }, e.name), h('div', { class: 'price' }, lock || `🪙 ${fmt(e.price)}`), lock ? h('span', { class: 'lock' }, '🔒') : null);
          lazyThumb(img, () => eggThumb(e.id), 'e:' + e.id);
          g.appendChild(card);
        }
        b.appendChild(g);
      } else if (tab === 1) {
        const g = h('div', { class: 'grid' });
        for (const a of PET_ACC.filter((x) => x.id !== 'none')) {
          const owned = st.owned.petAcc.includes(a.id);
          const lock = (a.lvl || 1) > lvl ? `Level ${a.lvl}` : null;
          g.appendChild(h('button', { class: 'card' + (lock ? ' locked' : ''), onclick: () => {
            click();
            if (owned) return toast('You have this! Put it on your pet in the 🐾 Pets menu.', { icon: a.icon });
            if (lock) return toast(`Unlocks at ${lock}`, { icon: '🔒' });
            if (!spend(st, a.price)) return toast('Not enough coins!', { icon: '🪙' });
            st.owned.petAcc.push(a.id);
            this.game.audio?.play('coin');
            toast(`Bought ${a.name}! Dress up your pet in 🐾 Pets.`, { icon: a.icon });
            this.game.emit('buyPetAcc', a.id);
            render();
          } }, h('div', { class: 'thumb' }, a.icon), h('div', { class: 'nm' }, a.name), h('div', { class: 'price' }, owned ? '✓ Owned' : lock || `🪙 ${fmt(a.price)}`)));
        }
        b.appendChild(g);
      } else {
        b.appendChild(h('div', { class: 'li' }, h('div', { class: 'big-ico' }, '🍪'),
          h('div', { style: { flex: 1 } }, h('div', { class: 't' }, 'Pet Treats'), h('div', { class: 's' }, `Feed your pet anywhere when it's hungry or thirsty. You have ${st.items.treats}.`)),
          h('button', { class: 'btn sun small', onclick: () => { click(); if (!spend(st, 15)) return toast('Not enough coins!', { icon: '🪙' }); st.items.treats++; this.game.audio?.play('coin'); render(); } }, '🪙 15'),
          h('button', { class: 'btn sun small', onclick: () => { click(); if (!spend(st, 60)) return toast('Not enough coins!', { icon: '🪙' }); st.items.treats += 5; this.game.audio?.play('coin'); render(); } }, '5 for 🪙 60')));
      }
      m.setBody(b);
    };
    render();
  }

  eggInfo(e, lock, shop) {
    const st = this.state;
    modal(e.name, (b, close) => {
      const img = h('img', { style: { width: '120px', height: '120px' } });
      lazyThumb(img, () => eggThumb(e.id), 'e:' + e.id);
      const odds = h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' } });
      for (const o of eggOdds(e.id)) {
        const sp = SPEC[o.id];
        const known = st.pets.some((p) => p.species === o.id) || (st.collections.petsSeen || []).includes(o.id);
        const pi = h('img');
        odds.appendChild(h('div', { class: 'card' }, h('span', { class: 'badge rar-' + sp.rar }, RARITY[sp.rar].name), h('div', { class: 'thumb', style: { width: '56px', height: '56px' } }, known ? pi : '❓'), h('div', { class: 'nm' }, known ? sp.name : '???'), h('div', { class: 'muted' }, o.pct + '%')));
        if (known) lazyThumb(pi, () => petThumb(o.id), `p:${o.id}:none`);
      }
      b.append(h('div', { class: 'row' }, img, h('div', { style: { flex: 1 } },
        h('div', { class: 'muted' }, `Care for it ${e.hatch} times to hatch it.`),
        h('button', { class: 'btn big' + (lock ? ' disabled' : ''), style: { marginTop: '10px' }, onclick: () => {
          click();
          if (!spend(st, e.price)) return toast('Not enough coins yet!', { icon: '🪙' });
          this.giveEgg(e.id, !this.companion() || true);
          this.game.audio?.play('coin');
          close(); shop.close();
          celebrate('New egg!', `Take care of your ${e.name} 🥚`);
          this.game.emit('buyEgg', e.id);
        } }, lock ? `🔒 ${lock}` : `Buy 🪙 ${fmt(e.price)}`))), h('div', { class: 'section-title' }, 'What could hatch?'), odds);
    }, { narrow: true });
  }

  openPanel() {
    const st = this.state;
    let tab = 0;
    const m = modal('🐾 My Pets', null, { tabs: tabs([{ name: 'My Pets', icon: '🐶' }, { name: 'Pet Book', icon: '📖' }], (t, i) => { tab = i; render(); }) });
    const render = () => {
      const b = h('div');
      if (tab === 0) {
        if (!st.pets.length && !st.eggs.length) {
          b.appendChild(h('div', { class: 'li' }, h('div', { class: 'big-ico' }, '🥚'), h('div', {}, h('div', { class: 't' }, 'No pets yet!'), h('div', { class: 's' }, 'Visit Paw Pals in Town Square to get an egg.'))));
        }
        const open = st.needs.filter((n) => !n.done);
        if (this.actor && open.length) {
          b.appendChild(h('div', { class: 'section-title' }, 'Needs right now'));
          for (const n of open) b.appendChild(h('div', { class: 'li' }, h('div', { class: 'big-ico' }, NEED[n.id].icon), h('div', {}, h('div', { class: 't' }, NEED[n.id].name), h('div', { class: 's' }, NEED[n.id].hint))));
          if (open.some((n) => n.id === 'hungry' || n.id === 'thirsty')) b.appendChild(h('button', { class: 'btn sun small', style: { marginTop: '6px' }, onclick: () => { click(); m.close(); this.feedTreat(); } }, `🍪 Give a treat (${st.items.treats} left)`));
        }
        const g = h('div', { class: 'grid', style: { marginTop: '10px' } });
        for (const e of st.eggs) {
          const img = h('img');
          const active = st.activePet === e.uid;
          g.appendChild(h('button', { class: 'card' + (active ? ' sel' : ''), onclick: () => { click(); this.setActive(e.uid); render(); } },
            h('div', { class: 'thumb' }, img), h('div', { class: 'nm' }, EGG[e.type].name), h('div', { class: 'muted' }, `${e.tasks}/${EGG[e.type].hatch} care`), active ? h('span', { class: 'badge' }, 'With you') : null));
          lazyThumb(img, () => eggThumb(e.type), 'e:' + e.type);
        }
        for (const p of st.pets) {
          const img = h('img');
          const active = st.activePet === p.uid;
          const s = stageOf(p.tasks);
          g.appendChild(h('button', { class: 'card' + (active ? ' sel' : ''), onclick: () => { click(); this.petDetail(p, m); } },
            h('span', { class: 'badge rar-' + SPEC[p.species].rar }, active ? 'With you' : RARITY[SPEC[p.species].rar].name),
            h('div', { class: 'thumb' }, img), h('div', { class: 'nm' }, p.name), h('div', { class: 'muted' }, STAGES[s].name)));
          lazyThumb(img, () => petThumb(p.species, p.acc), `p:${p.species}:${p.acc || 'none'}`);
        }
        b.appendChild(g);
      } else {
        const seen = new Set(st.pets.map((p) => p.species));
        b.appendChild(h('div', { class: 'muted' }, `You have found ${seen.size} of ${SPECIES.length} pets.`));
        const g = h('div', { class: 'grid', style: { marginTop: '8px' } });
        for (const sp of SPECIES) {
          const img = h('img');
          const has = seen.has(sp.id);
          g.appendChild(h('div', { class: 'card' + (has ? '' : ' locked') }, h('span', { class: 'badge rar-' + sp.rar }, RARITY[sp.rar].name), h('div', { class: 'thumb' }, has ? img : '❓'), h('div', { class: 'nm' }, has ? sp.name : '???')));
          if (has) lazyThumb(img, () => petThumb(sp.id), `p:${sp.id}:none`);
        }
        b.appendChild(g);
      }
      m.setBody(b);
    };
    render();
  }

  petDetail(p, parent) {
    const st = this.state;
    const sp = SPEC[p.species];
    modal(p.name, (b, close) => {
      const s = stageOf(p.tasks);
      const next = STAGES[s + 1];
      const img = h('img', { style: { width: '130px', height: '130px' } });
      lazyThumb(img, () => petThumb(p.species, p.acc), `p:${p.species}:${p.acc || 'none'}`);
      const active = st.activePet === p.uid;
      const prog = next ? (p.tasks - STAGES[s].tasks) / (next.tasks - STAGES[s].tasks) : 1;
      b.append(h('div', { class: 'row', style: { alignItems: 'flex-start' } }, h('div', { class: 'thumb', style: { borderRadius: '20px', background: '#fdf3ff' } }, img),
        h('div', { style: { flex: 1, minWidth: '180px' } },
          h('div', { class: 't', style: { fontSize: '18px', fontWeight: 700 } }, `${sp.name} · ${RARITY[sp.rar].name}`),
          h('div', { class: 'muted' }, `${STAGES[s].name}${next ? ` — ${next.tasks - p.tasks} more care tasks to ${next.name}` : ' — fully grown and sparkly!'}`),
          h('div', { class: 'progress', style: { margin: '6px 0 10px' } }, h('i', { style: { width: Math.round(prog * 100) + '%' } })),
          h('div', { class: 'row' },
            h('button', { class: 'btn small ' + (active ? 'ghost' : 'mint'), onclick: () => { click(); if (active) { this.setActive(null); } else this.setActive(p.uid); close(); parent.close(); } }, active ? '🏠 Send home' : '🐾 Take with me'),
            h('button', { class: 'btn small sky', onclick: async () => { click(); const n = await promptBox('Rename', 'New name for your pet:', p.name, 14); p.name = n; close(); parent.close(); this.openPanel(); } }, '✏️ Rename')))));
      b.appendChild(h('div', { class: 'section-title' }, 'Tricks'));
      const tr = h('div', { class: 'row' });
      STAGES.forEach((stg, i) => {
        const ok = s >= i;
        tr.appendChild(h('button', { class: 'btn small ' + (ok ? 'lav' : 'ghost disabled'), onclick: () => {
          click();
          if (!active) return toast('Take your pet with you to see tricks!', { icon: '🐾' });
          close(); parent.close();
          this.actor?.trick(stg.trick);
          this.game.emit('trick', stg.trick);
        } }, ok ? TRICKS[stg.trick] : `🔒 ${stg.name}`));
      });
      b.appendChild(tr);
      b.appendChild(h('div', { class: 'section-title' }, 'Accessories'));
      const ac = h('div', { class: 'row' });
      for (const a of PET_ACC) {
        if (a.id !== 'none' && !st.owned.petAcc.includes(a.id)) continue;
        ac.appendChild(h('button', { class: 'btn small ' + ((p.acc || 'none') === a.id ? '' : 'ghost'), onclick: () => {
          click(); p.acc = a.id;
          if (active) { this.actor.build(); this.actor.place(this.actor.pos); } else this.refreshHome();
          close(); this.petDetail(p, parent);
        } }, a.icon + ' ' + a.name));
      }
      if (st.owned.petAcc.length === 0) ac.appendChild(h('div', { class: 'muted' }, 'Buy bows, hats and more at Paw Pals!'));
      b.appendChild(ac);
    }, { narrow: true });
  }
}
