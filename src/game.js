import * as THREE from 'three';
import { createRenderer, QualityManager } from './engine/renderer.js';
import { uniforms } from './engine/materials.js';
import { Input } from './engine/input.js';
import { Sky } from './world/sky.js';
import { World } from './world/world.js';
import { Avatar } from './player/avatar.js';
import { Player, CameraRig } from './player/player.js';
import { HUD } from './ui/hud.js';
import * as UI from './ui/ui.js';
import { loadGame, saveGame, requestPersistence } from './core/save.js';
import { addCoins, addXP, level } from './core/state.js';
import { HOME_PLOT } from './data/map.js';
import { FX } from './engine/fx.js';
import { Audio } from './engine/audio.js';

export class Game {
  constructor() {
    this.systems = [];
    this.time = 0;
    this.paused = false;
    this.mode = 'play'; // play | build | minigame | cutscene
  }

  async init(progress) {
    const { state, fresh } = loadGame();
    this.state = state;
    this.fresh = fresh;
    requestPersistence();
    this.audio = new Audio(state.settings);
    progress(0.1, 'Waking up…');
    this.quality = new QualityManager(state.settings);
    const app = document.getElementById('app');
    const { renderer, scene, camera } = createRenderer(app, this.quality);
    this.renderer = renderer; this.scene = scene; this.camera = camera;
    this.quality.onChange = (lvl) => this.applyQuality(lvl);
    // iOS can drop the WebGL context when the app is in the background
    renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.save();
      const o = UI.h('div', { class: 'modal-bg interactive', style: { zIndex: 95 } }, UI.h('div', { class: 'panel narrow', style: { padding: '24px', textAlign: 'center' } },
        UI.h('h2', {}, '🌸 Welcome back!'), UI.h('button', { class: 'btn big', onclick: () => location.reload() }, '▶ Tap to continue')));
      UI.root().appendChild(o);
    });

    this.fx = new FX(scene);
    this.sky = new Sky(scene);
    this.sky.setTime(state.time ?? 0.34);
    progress(0.2, 'Painting the sky…');
    await nextFrame();
    this.world = new World(scene, this.quality.level);
    this.world.build(progress);
    await nextFrame();

    this.avatar = new Avatar(state.player.look);
    scene.add(this.avatar.root);
    this.player = new Player(this.world, this.avatar);
    this.player.onJump = () => this.audio?.play('jump');
    const spawn = state.player.pos;
    if (spawn) this.player.teleport(spawn[0], spawn[1], spawn[2], spawn[3]);
    else this.player.teleport(HOME_PLOT.cx, undefined, HOME_PLOT.front + 5, Math.PI);
    this.rig = new CameraRig(camera, this.world);
    this.rig.yaw = this.player.facing + Math.PI;
    this.rig.snap(this.player.pos);
    this.cameraOpts = () => ({ distMul: this.player.vehicle ? (this.vehicles?.riding?.v.cam ?? 1.4) : 1 });

    this.input = new Input(renderer.domElement, UI.root());
    this.hud = new HUD(this);
    progress(0.85, 'Almost there…');

    for (const s of this.systems) await s.init?.(this);
    this.applyQuality(this.quality.level);
    // warm up shaders so the first frames don't stutter
    renderer.compile(scene, camera);
    progress(1, 'Ready!');
    this.clock = { last: performance.now(), getDelta() { const n = performance.now(); const d = (n - this.last) / 1000; this.last = n; return d; } };
    setInterval(() => this.save(), 10000);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.save(); });
    window.addEventListener('pagehide', () => this.save());
  }

  addSystem(s) { this.systems.push(s); return s; }

  applyQuality(lvl) {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lvl.dpr));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.shadowMap.enabled = lvl.shadows;
    this.sky.setShadowSize(lvl.shadowSize, lvl.shadows);
    this.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);
      const dt = Math.min(0.05, this.clock.getDelta());
      this.frame(dt);
    };
    loop();
  }

  frame(dt) {
    this.time += dt;
    uniforms.uTime.value = this.time;
    this.state.stats.playTime += dt;
    this.quality.tick(dt);
    const busy = this.mode !== 'play' || UI.anyModalOpen() || UI.dialogOpen();
    this.input.enabled = !busy;
    this.player.frozen = busy;
    if (this.mode === 'play') this.player.update(dt, this.input, this.rig.yaw);
    for (const s of this.systems) if(!s.homeOnly || !this.realm || this.realm==='home') s.update?.(dt, this);
    if (this.mode === 'play') this.rig.update(dt, this.input, this.player.pos, this.cameraOpts?.() || {});
    else if (this.mode === 'cutscene') this.rig.update(dt, this.input, this.player.pos);
    this.sky.update(dt, this.player.pos);
    this.state.time = this.sky.t;
    this.world.update(dt, this.player.pos);
    this.fx.update(dt);
    this.audio.night = this.sky.state.night;

    // interaction prompt
    if (this.mode === 'play' && !busy) {
      const it = this.world.nearestInteract(this.player.pos);
      this.hud.setAction(it);
      if (this.input.consumeAction() && it) { UI.click(); it.onUse(this); this.hud.setAction(null); }
    } else {
      this.hud.setAction(null);
      this.input.consumeAction();
    }
    this.hud.update(this.state);
    this.renderer.render(this.scene, this.camera);
  }

  // rewards with feedback
  reward(coins = 0, xp = 0, reason = '') {
    if (coins) addCoins(this.state, coins);
    const up = xp ? addXP(this.state, xp) : 0;
    const parts = [];
    if (coins) parts.push(`+${coins} 🪙`);
    if (xp) parts.push(`+${xp} ⭐`);
    if (parts.length) {
      const p = this.screenPos(this.player.pos, 2.3);
      UI.floaty(parts.join('  '), p.x - 40, p.y);
    }
    this.emit('coins', coins, reason);
    if (up) this.emit('levelup', up); // free play: levels unlock nothing, so no fanfare
    if (coins) this.audio?.play('coin');
    return up;
  }

  screenPos(p, yOff = 0) {
    const v = new THREE.Vector3(p.x, p.y + yOff, p.z).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
  }

  get level() { return level(this.state); }

  // minimal event bus for quests/stickers
  on(ev, fn) { (this._ev ||= {})[ev] ||= []; this._ev[ev].push(fn); }
  emit(ev, ...a) { for (const fn of this._ev?.[ev] || []) fn(...a); }

  save() {
    if (this.noSave) return false;
    const p = this.player.pos;
    const home = this.realm && this.realm !== 'home' ? this.magicDoors.returnSpot : null;
    this.state.player.pos = home ? [home.x,0,home.z+4,this.player.facing] : [p.x,p.y,p.z,this.player.facing];
    return saveGame(this.state);
  }

  // menu hooks (filled in by systems)
  openBuild() { UI.toast('Build mode is coming soon!', { icon: '🔨' }); }
  openPets() { UI.toast('Pets are coming soon!', { icon: '🐾' }); }
  openBag() { UI.toast('Your bag is empty.', { icon: '🎒' }); }
  openQuests() { UI.toast('No tasks yet.', { icon: '📜' }); }
  openMap() { UI.toast('Map coming soon!', { icon: '🗺️' }); }
  openSettings() { UI.toast('Settings coming soon!', { icon: '⚙️' }); }
  openEmotes() { this.avatar.playEmote('wave'); }
}

export function nextFrame() {
  return new Promise((r) => requestAnimationFrame(() => r()));
}
