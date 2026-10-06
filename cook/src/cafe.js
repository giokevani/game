// Blossom Kitchen café inside Blossom Bay: walk into the café in town, cook
// for guests step by step, then walk back out and build your house.
import * as THREE from 'three';
import { Avatar } from '../../src/player/avatar.js';
import { AVATAR_ITEMS, SKINS, HAIR_COLORS, CLOTH_COLORS, EYE_COLORS } from '../../src/data/avatar.js';
import { celebrate, floaty, closeAllModals } from '../../src/ui/ui.js';
import { addXP } from '../../src/core/state.js';
import { Kitchen, disposeTree } from './steps.js';
import { buildRestaurant, SPOTS, DOOR, COUNTER_Y } from './restaurant.js';
import { RESTAURANT, levelInfo, makeOrder, recipeWords, LEVELS_PER } from './data.js';
import { cafeView, dishPay, dishXP, finishLevel, seeWords, bestOpen } from './state.js';
import { stepPrompt, resultWord, HOWTO } from './text.js';
import { ru, speak, setLangSettings } from './i18n.js';
import { Hud } from './hud.js';
import * as Screens from './screens.js';
import * as D from './data.js';
import './cook.css';

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const slot = (s) => AVATAR_ITEMS.filter((i) => i.slot === s).map((i) => i.id);
function randomLook() {
  const dress = Math.random() < 0.25 ? pick(slot('dress')) : null;
  return {
    skin: pick(SKINS), hair: pick(slot('hair')), hairColor: pick(HAIR_COLORS), eyes: pick(EYE_COLORS),
    top: pick(slot('top')), topColor: pick(CLOTH_COLORS), bottom: pick(slot('bottom').filter((b) => b !== 'bot_long')), bottomColor: pick(CLOTH_COLORS),
    dress, dressColor: pick(CLOTH_COLORS), shoes: pick(['#ffffff', '#ff8fc0', '#3e3550', '#7fc6ff']),
    hat: Math.random() < 0.4 ? pick(slot('hat').filter((x) => x !== 'hat_none')) : 'hat_none', hatColor: pick(CLOTH_COLORS),
    acc: Math.random() < 0.3 ? pick(['acc_glasses', 'acc_star', 'acc_scarf', 'acc_backpack']) : 'acc_none', accColor: pick(CLOTH_COLORS),
  };
}

const V = new THREE.Vector3();

export class Cafe {
  // host = the Blossom Bay game (renderer, scene, camera, audio, fx, state, hud)
  constructor(host) {
    this.host = host;
    this.renderer = host.renderer;
    this.scene = host.scene;
    this.camera = host.camera;
    this.fx = host.fx;
    this.audio = host.audio;
    this.state = cafeView(host.state); // café progress; state.coins = Blossom Bay coins
    setLangSettings(this.state.settings);
    this.root = new THREE.Group();
    this.root.visible = false;
    const hemi = new THREE.HemisphereLight('#fff6fb', '#e8d0e8', 1.25);
    const sun = new THREE.DirectionalLight('#fff2e0', 1.7);
    sun.position.set(2.5, 7, 4.5);
    sun.target.position.set(0, 0.8, -1.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 20 });
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 3;
    this.root.add(hemi, sun, sun.target);
    this.scene.add(this.root);
    this.kitchen = new Kitchen(this);
    this.hud = new Hud(this);
    this.world = null;
    this.rid = null;
    this.customers = [];
    this.level = null;
    this.cooking = null;
    this.active = false;
    this.cam = { t: 1, curLook: new THREE.Vector3() };
    this.token = 0;
    this.timeScale = 1; // tests speed up café time
    this.D = D; // used by the automated tests
    this.stepPrompt = stepPrompt;
  }

  save() { this.host.save(); }
  changed() { this.hud.update(this.state); }

  // ---------- walking in and out ----------
  async enter() {
    if (this.active) return;
    const h = this.host;
    this.active = true;
    h.mode = 'cafe';
    h.hud.setVisible(false);
    // hide the town while we are inside (the particle system stays on)
    this.hidden = h.scene.children.filter((o) => o.visible && o !== this.root && o !== h.fx.points);
    for (const o of this.hidden) o.visible = false;
    this.root.visible = true;
    this.hud.show(true);
    this.loadRestaurant(this.rid && this.state.stars ? this.rid : bestOpen(this.state));
    this.setView('service', true);
    this.audio.play('open');
    if (!this.state.scriptChosen) await Screens.chooseScript(this);
    if (!this.state.intro) {
      await Screens.intro(this);
      this.save();
      return this.playLevel('cafe', 1);
    }
    Screens.map(this);
  }

  leave() {
    if (!this.active) return;
    const h = this.host;
    this.quitLevel();
    closeAllModals();
    document.querySelectorAll('.screen').forEach((e) => e.remove());
    for (const o of this.hidden || []) o.visible = true;
    this.hidden = null;
    this.root.visible = false;
    this.hud.show(false);
    this.active = false;
    h.mode = 'play';
    h.hud.setVisible(true);
    // forget the swipes made while cooking, so the town camera doesn't spin
    h.input.consumeLook();
    h.input.consumeZoom();
    h.rig.pitch = 0.38;
    h.rig.yaw = h.player.facing + Math.PI;
    h.rig.snap(h.player.pos);
    h.audio.play('open');
    h.save();
    h.emit('cafeLeave');
  }

  // ---------- scene ----------
  loadRestaurant(rid) {
    if (this.rid === rid && this.world) return;
    if (this.world) { this.root.remove(this.world); disposeTree(this.world); }
    this.rid = rid;
    this.world = buildRestaurant(RESTAURANT[rid]);
    this.world.add(this.kitchen.work);
    this.root.add(this.world);
  }

  views() {
    return {
      service: { pos: [0, 2.6, 2.3], look: [0, 1.25, -1.6] },
      cook: { pos: [0, 1.67, 0.61], look: [0, COUNTER_Y + 0.08, 0.02] },
    };
  }
  setView(name, instant = false) {
    this.view = name;
    const v = this.views()[name];
    this.cam.fromPos = this.camera.position.clone();
    this.cam.fromLook = this.cam.curLook.clone();
    this.cam.toPos = new THREE.Vector3(...v.pos);
    this.cam.toLook = new THREE.Vector3(...v.look);
    this.cam.t = instant ? 1 : 0;
    if (instant) { this.camera.position.copy(this.cam.toPos); this.cam.curLook.copy(this.cam.toLook); }
  }

  // called every frame by Blossom Bay (does nothing while she is in town)
  update(rawDt) {
    if (!this.active) return;
    const dt = rawDt * this.timeScale;
    if (this.camera.fov !== 55) { this.camera.fov = 55; this.camera.updateProjectionMatrix(); }
    if (this.cam.t < 1) {
      this.cam.t = Math.min(1, this.cam.t + dt / 0.9);
      const k = this.cam.t < 0.5 ? 2 * this.cam.t ** 2 : 1 - (-2 * this.cam.t + 2) ** 2 / 2;
      this.camera.position.lerpVectors(this.cam.fromPos, this.cam.toPos, k);
      this.cam.curLook.lerpVectors(this.cam.fromLook, this.cam.toLook, k);
    } else this.camera.position.copy(this.cam.toPos);
    this.camera.lookAt(this.cam.curLook);
    this.kitchen.update(dt);
    this.updateCustomers(dt);
    this.state.stats.playSec += rawDt;
  }

  // ---------- customers ----------
  spawnCustomer(spot) {
    const info = this.level.info;
    const n = Math.random() < info.combo ? 2 : 1;
    const orders = [];
    for (let i = 0; i < n; i++) orders.push(makeOrder(pick(info.recipes)));
    const av = new Avatar(randomLook(), { scale: 0.82 });
    av.root.position.copy(DOOR);
    this.world.add(av.root);
    // guests stand closer together when the phone is upright
    const target = SPOTS[spot].clone();
    if (window.innerWidth < window.innerHeight) target.x *= 0.82;
    const c = {
      av, spot, target, orders, delivered: 0, state: 'walk', patience: 1, greet: Math.floor(Math.random() * 3),
      path: [new THREE.Vector3(DOOR.x, 0, -3.8), new THREE.Vector3(target.x, 0, -2.2), target.clone()], served: [],
    };
    c.bubble = this.hud.makeBubble(c, (cc) => this.tapCustomer(cc));
    c.bubble.set(orders, 0);
    this.customers.push(c);
    this.level.spawned++;
    this.audio.play('open');
    return c;
  }

  updateCustomers(dt) {
    const L = this.level;
    if (L && !L.over && !this.paused) {
      L.spawnT -= dt;
      const busy = new Set(this.customers.filter((c) => c.state !== 'leave').map((c) => c.spot));
      if (L.spawned < L.info.customers && busy.size < L.maxSpots && L.spawnT <= 0) {
        const free = [1, 0, 2].slice(0, 3).filter((s) => !busy.has(s));
        const order = L.maxSpots === 1 ? [1] : L.maxSpots === 2 ? [0, 2, 1] : [1, 0, 2];
        const s = order.find((x) => free.includes(x));
        if (s !== undefined) { this.spawnCustomer(s); L.spawnT = 2.5 + Math.random() * 3.5; }
      }
    }
    const w = window.innerWidth, hgt = window.innerHeight;
    for (const c of [...this.customers]) {
      const a = c.av;
      let speed = 0;
      if ((c.state === 'walk' || c.state === 'leave') && c.path.length) {
        const tgt = c.path[0];
        V.subVectors(tgt, a.root.position);
        V.y = 0;
        const d = V.length();
        const step = 1.9 * dt;
        if (d <= step) { a.root.position.copy(tgt); c.path.shift(); }
        else { V.multiplyScalar(step / d); a.root.position.add(V); a.root.rotation.y = Math.atan2(V.x, V.z); speed = 1; }
        if (!c.path.length) {
          if (c.state === 'walk') { c.state = 'wait'; a.root.rotation.y = 0; a.playEmote('wave', 1.2); this.audio.play('talk'); }
          else { this.removeCustomer(c); continue; }
        }
      } else if (c.state === 'wait' || c.state === 'cook') {
        a.root.rotation.y += (0 - a.root.rotation.y) * Math.min(1, dt * 6);
        if (!this.paused && this.level && !this.level.over) {
          c.patience -= (dt / this.level.info.patience) * (this.cooking ? 0.35 : 1);
          if (c.patience <= 0 && c.state === 'wait') this.customerLeaves(c, false);
        }
      }
      a.update(dt, speed, false);
      // bubble
      const show = c.state === 'wait' && this.view === 'service';
      if (show) {
        V.copy(a.root.position); V.y += 1.78;
        V.project(this.camera);
        c.bubble.place((V.x + 1) / 2 * w, (1 - V.y) / 2 * hgt, V.z < 1);
        c.bubble.patience(Math.max(0, c.patience));
      } else c.bubble.place(0, 0, false);
    }
  }

  customerLeaves(c, happy) {
    c.state = 'leave';
    c.bubble.place(0, 0, false);
    if (!happy) {
      const missed = c.orders.length - c.delivered;
      for (let i = 0; i < missed; i++) this.level.qualities.push(0);
      this.level.left++;
      c.av.setMood('wow');
      this.audio.play('no');
    }
    c.path = [new THREE.Vector3(c.target.x, 0, -2.2), new THREE.Vector3(DOOR.x, 0, -3.8), DOOR.clone()];
    this.level.done++;
    this.hud.setGuests(this.guestText());
    if (this.level.done >= this.level.info.customers) this.level.over = true;
  }

  removeCustomer(c) {
    this.world?.remove(c.av.root);
    disposeTree(c.av.root);
    c.bubble.remove();
    this.customers = this.customers.filter((x) => x !== c);
  }

  clearCustomers() {
    for (const c of [...this.customers]) this.removeCustomer(c);
  }

  guestText() { const L = this.level; return `😊 ${L.served}/${L.info.customers}`; }

  // ---------- the level loop ----------
  async playLevel(rid, L) {
    const token = ++this.token;
    closeAllModals();
    this.loadRestaurant(rid);
    this.clearCustomers();
    this.kitchen.resetOrder({ recipe: null, vary: {}, steps: [] });
    const info = levelInfo(rid, L);
    const busy = L > LEVELS_PER;
    this.level = { rid, L, info, busy, spawned: 0, done: 0, served: 0, left: 0, qualities: [], earned: 0, tips: 0, words: new Set(), spawnT: 0.8, maxSpots: busy ? 3 : L <= 2 ? 1 : L <= 5 ? 2 : 3, over: false };
    const label = `${RESTAURANT[rid].emoji} ${busy ? 'Busy Day' : 'Level ' + L}`;
    this.hud.levelMode(true, label, this.guestText());
    this.setView('service');
    this.level.over = true; // hold spawns during the intro card
    await Screens.levelIntro(this, rid, L, info);
    if (token !== this.token) return;
    this.level.over = false;
    this.audio.play('quest');
    await new Promise((res) => {
      const chk = () => { if (token !== this.token) return; if (this.level.over && !this.cooking) res(); else setTimeout(chk, 250); };
      chk();
    });
    if (token !== this.token) return;
    await new Promise((r) => setTimeout(r, 900));
    const lv = this.level;
    const result = finishLevel(this.state, rid, L, lv.qualities);
    if (result.bonus) lv.earned += result.bonus;
    for (const r of lv.qualities) if (r >= 0.88) this.state.stats.perfect++;
    this.changed();
    this.save();
    this.hud.levelMode(false);
    await Screens.results(this, lv, result);
  }

  quitLevel() {
    this.token++;
    this.level = null;
    this.cooking = null;
    this.paused = false;
    this.kitchen.endStep();
    this.kitchen.updaters.clear();
    this.kitchen.resetOrder({ recipe: null, vary: {}, steps: [] });
    this.hud.cookMode(false);
    this.hud.levelMode(false);
    this.clearCustomers();
    this.setView('service');
  }

  pause() { Screens.pauseMenu(this); }

  async tapCustomer(c) {
    if (this.cooking || this.ordering || c.state !== 'wait' || this.paused) return;
    this.audio.play('talk');
    this.ordering = true;
    const go = await Screens.orderCard(this, c, c.delivered).finally(() => { this.ordering = false; });
    if (!go || c.state !== 'wait' || this.cooking || !this.level) return;
    await this.cook(c);
  }

  async cook(c) {
    const token = this.token;
    this.cooking = c;
    c.state = 'cook';
    const order = c.orders[c.delivered];
    const K = this.kitchen;
    K.resetOrder(order);
    this.hud.cookMode(true, c.orders, c.delivered);
    this.setView('cook');
    await K.wait(0.6);
    const qs = [];
    for (let i = 0; i < order.steps.length; i++) {
      if (token !== this.token) return;
      const st = order.steps[i];
      const pr = stepPrompt(st);
      this.hud.setStep(i, order.steps.length, pr);
      speak(pr.en);
      if (!this.state.tips.includes(st.t)) { this.state.tips.push(st.t); this.hud.showTip(HOWTO[st.t]); }
      seeWords(this.state, pr.words || []);
      (pr.words || []).forEach((wd) => this.level?.words.add(wd));
      qs.push(await K.run(st));
      this.hud.hideTip();
    }
    if (token !== this.token) return;
    K.clearProps();
    const q = qs.reduce((a, b) => a + b, 0) / qs.length;
    seeWords(this.state, recipeWords(order.recipe));
    recipeWords(order.recipe).forEach((wd) => this.level?.words.add(wd));
    const [, en, rus] = resultWord(q);
    this.audio.play(q >= 0.88 ? 'fanfare' : q >= 0.45 ? 'levelup' : 'pop');
    celebrate(`${en} ${'⭐'.repeat(q >= 0.88 ? 3 : q >= 0.72 ? 2 : q >= 0.45 ? 1 : 0)}`, this.state.settings.help ? ru(rus) : '', 1500);
    speak(en);
    K.burst(new THREE.Vector3(0, 0.2, 0), 'confetti', { n: 30, scale: 0.6 });
    await K.wait(1.3);
    if (token !== this.token) return;
    this.hud.cookMode(false);
    this.setView('service');
    await this.serve(c, order, q, token);
  }

  async serve(c, order, q, token) {
    const K = this.kitchen;
    // move the finished dish off the kitchen group
    const served = new THREE.Group();
    while (K.dish.children.length) served.add(K.dish.children[0]);
    K.setDish(null);
    served.position.copy(K.work.position);
    this.world.add(served);
    const from = served.position.clone();
    const to = new THREE.Vector3(c.target.x, COUNTER_Y, -0.3);
    await K.anim(0.7, (k) => { served.position.lerpVectors(from, to, k); served.position.y += Math.sin(k * Math.PI) * 0.35; });
    if (token !== this.token) { disposeTree(served); return; }
    const pay = dishPay(order.recipe, q);
    this.state.coins += pay.total;
    this.state.stats.served++;
    const up = addXP(this.host.state, dishXP(order.recipe, q));
    if (up) setTimeout(() => { this.audio.play('levelup'); celebrate(`Level ${up}!`, 'New things in the shops ✨'); this.host.emit('levelup', up); }, 900);
    this.host.emit('coins', pay.total, 'cafe');
    this.host.emit('cafeDish', order.recipe, q);
    this.level.earned += pay.total;
    this.level.tips += pay.tip;
    this.level.qualities.push(q);
    this.changed();
    this.fx.burst(to.clone().add(new THREE.Vector3(0, 0.3, 0)), 'coins', { n: 8 });
    this.fx.burst(c.av.root.position.clone().add(new THREE.Vector3(0, 1.6, 0)), 'hearts', { n: q >= 0.72 ? 6 : 2 });
    this.audio.play('coin');
    V.copy(to); V.y += 0.4; V.project(this.camera);
    floaty(`+${pay.total}🪙${pay.tip ? ' (tip ' + pay.tip + ')' : ''}`, (V.x + 1) / 2 * window.innerWidth, (1 - V.y) / 2 * window.innerHeight);
    c.av.playEmote(q >= 0.72 ? 'cheer' : 'heart', 1.6);
    speak(q >= 0.72 ? pick(['Yummy! Thank you!', 'Wow, perfect! Thank you!', 'Delicious! Thanks!']) : 'Thank you!');
    c.delivered++;
    c.served.push(served);
    this.cooking = null;
    await K.wait(1.0);
    if (token !== this.token) return;
    if (c.delivered < c.orders.length) {
      c.state = 'wait';
      c.patience = Math.min(1, c.patience + 0.35);
      c.bubble.set(c.orders, c.delivered);
      return;
    }
    // walk away carrying the food
    served.position.set(0, 0, 0);
    c.av.root.attach(served);
    for (const s of c.served) { c.av.root.attach(s); s.position.set(0, 0.95, 0.5); s.scale.setScalar(0.9); }
    this.level.served++;
    this.customerLeaves(c, true);
  }
}
