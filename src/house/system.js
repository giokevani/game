// House system: owns the house state, keeps the 3D view in sync and turns
// furniture into things you can use (sit, sleep, cook, change clothes...).
import * as THREE from 'three';
import * as HM from './model.js';
import { HouseView, ORIGIN, FLOOR_Y } from './view.js';
import { FURN } from '../data/furniture.js';
import * as UI from '../ui/ui.js';
import { BuildMode } from './build.js';

const USE_LABEL = {
  sit: ['Sit', '🪑'], sleep: ['Sleep', '😴'], tv: ['Watch TV', '📺'], radio: ['Music', '🎵'], piano: ['Play Piano', '🎹'],
  wardrobe: ['Change Outfit', '👗'], cook: ['Cook', '🍳'], fridge: ['Get Snack', '🍎'], sink: ['Wash Up', '🫧'],
  bath: ['Take a Bath', '🛁'], shower: ['Shower', '🚿'], arcade: ['Play Game', '🕹️'], bounce: ['Bounce!', '🤸'],
  petbed: ['Pet Nap', '🐾'], food: ['Feed Pet', '🍖'], water: ['Give Water', '💧'], play: ['Play with Pet', '🎾'], pettub: ['Wash Pet', '🧼'],
};

export class HouseSystem {
  async init(game) {
    this.game = game;
    if (!game.state.house) game.state.house = HM.newHouse();
    this.house = game.state.house;
    this.view = new HouseView(game.scene, game.world);
    this.view.rebuild(this.house);
    this.interacts = [];
    this.refreshInteract();
    this.build = new BuildMode(game, this);
    game.openBuild = () => this.build.enter();
    game.house = this;
    const lastStars = game.state.stats.homeStars || 0;
    this.lastStars = lastStars;
  }

  rebuild(o = {}) {
    if (o.structure !== false) this.view.rebuildStructure(this.house);
    this.view.rebuildFurniture(this.house, o.exclude ?? null);
    this.refreshInteract();
  }

  rating() { return HM.homeRating(this.house, FURN); }

  // check for new home-rating stars and give rewards
  checkStars() {
    const r = this.rating();
    const best = this.game.state.stats.homeStars || 0;
    if (r.stars > best) {
      this.game.state.stats.homeStars = r.stars;
      const coins = [0, 100, 250, 500, 900, 1500][r.stars];
      setTimeout(() => {
        UI.celebrate(`${'⭐'.repeat(r.stars)}`, `Your home reached ${r.stars} star${r.stars > 1 ? 's' : ''}! +${coins} coins`);
        this.game.reward(coins, 40 * r.stars, 'homestar');
        this.game.emit('homestars', r.stars);
      }, 400);
    }
    return r;
  }

  worldPosOf(f, lx = 0, lz = 0) {
    const a = f.r * Math.PI / 2;
    const c = Math.cos(a), s = Math.sin(a);
    const x = f.x + lx * c + lz * s;
    const z = f.z - lx * s + lz * c;
    return new THREE.Vector3(ORIGIN.x + x, 0, ORIGIN.z + z);
  }

  refreshInteract() {
    const w = this.game.world;
    for (const it of this.interacts) w.removeInteract(it);
    this.interacts = [];
    for (const f of this.house.furniture) {
      const item = FURN[f.id];
      if (!item?.use) continue;
      const [label, icon] = USE_LABEL[item.use] || ['Use', '✋'];
      const base = this.view.baseY(f, item);
      const front = this.worldPosOf(f, 0, item.fp[1] / 2 + 0.35);
      const it = w.addInteract({
        x: front.x, z: front.z, y: base, r: Math.max(1.3, Math.min(2.2, item.fp[0] * 0.8)), label, icon,
        onUse: (game) => this.use(f, item),
        enabled: () => this.game.mode === 'play' && !this.game.player.seat,
      });
      it.furn = f;
      this.interacts.push(it);
    }
  }

  use(f, item) {
    const game = this.game;
    const p = game.player;
    const base = this.view.baseY(f, item);
    const faceAng = f.r * Math.PI / 2;
    const exit = this.worldPosOf(f, 0, item.fp[1] / 2 + 0.5);
    exit.y = base;
    const u = item.use;
    game.emit('use', u, f, item);
    if (u === 'sit' || u === 'piano') {
      const seats = item.seats || [[0, 0, 0]];
      // pick the seat nearest to the player
      let best = seats[0], bd = Infinity;
      for (const s of seats) {
        const wp = this.worldPosOf(f, s[0], s[2]);
        const d = wp.distanceTo(new THREE.Vector3(p.pos.x, 0, p.pos.z));
        if (d < bd) { bd = d; best = s; }
      }
      const sp = this.worldPosOf(f, best[0], best[2]);
      sp.y = base + (best[1] || 0);
      p.sit({ pos: sp, facing: faceAng, exit, pose: 'sit' });
      if (u === 'piano') game.audio?.playTune('piano');
      return;
    }
    if (u === 'sleep') {
      const s = item.sleep || [0, 0.6, 0];
      const sp = this.worldPosOf(f, s[0], item.fp[1] / 2 - 0.3);
      sp.y = base + s[1] - 0.25;
      p.sit({ pos: sp, facing: faceAng, exit, pose: 'sleep' });
      this.sleep();
      return;
    }
    if (u === 'wardrobe') { game.openWardrobe?.(); return; }
    if (u === 'tv') { UI.toast(['A cartoon about a dancing bunny! 🐰', 'The weather: sunny with a chance of rainbows 🌈', 'A cooking show is on! 🧁', 'Pet talent show! 🐶✨'][Math.floor(Math.random() * 4)], { icon: '📺' }); game.avatar.playEmote('cheer', 1.6); return; }
    if (u === 'radio') { game.audio?.toggleMusic?.(); return; }
    if (u === 'cook' || u === 'fridge') {
      game.avatar.playEmote('heart', 1.5);
      UI.toast(u === 'cook' ? 'Yum! You made pancakes 🥞' : 'You grabbed a juicy apple 🍎', { icon: '😋' });
      return;
    }
    if (u === 'bath' || u === 'shower' || u === 'sink') { game.avatar.playEmote('spin', 1.4); game.fx?.burst(p.pos, 'bubbles'); UI.toast('So fresh and clean! ✨', { icon: '🫧' }); return; }
    if (u === 'arcade') { game.avatar.playEmote('dance', 2); UI.toast('New high score! 🏆', { icon: '🕹️' }); return; }
    if (u === 'bounce') { p.vel.y = 17; p.grounded = false; game.audio?.play('boing'); return; }
    // pet items are handled by the pet system through the 'use' event
    if (!game.pets) UI.toast('This is for pets! Adopt one at Paw Pals 🐾', { icon: '🐾' });
  }

  sleep() {
    const g = this.game;
    const night = g.sky.state.night > 0.3;
    const fade = UI.h('div', { style: { position: 'absolute', inset: '0', background: '#1b1f4a', opacity: '0', transition: 'opacity 0.8s', zIndex: 70 } });
    UI.root().appendChild(fade);
    requestAnimationFrame(() => { fade.style.opacity = night ? '0.92' : '0.5'; });
    setTimeout(() => {
      if (night) { g.sky.setTime(0.29); g.state.stats.nightsSlept = (g.state.stats.nightsSlept || 0) + 1; }
      fade.style.opacity = '0';
      setTimeout(() => fade.remove(), 900);
      UI.toast(night ? 'Good morning! ☀️ You feel rested.' : 'What a lovely nap! 😴', { icon: '🌅' });
      g.emit('slept', night);
    }, 1800);
  }

  update(dt, game) {
    this.view.update(dt, game.player.pos, game.camera, game.mode);
    this.build.update(dt);
  }
}
