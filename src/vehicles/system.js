// Rides from Zoom Rides and the hot-air balloon to Sky Island.
import * as THREE from 'three';
import { Builder, shade } from '../engine/builder.js';
import { M } from '../engine/materials.js';
import { balloon as balloonModel } from '../world/buildings.js';
import { h, modal, toast, click, celebrate, fmt, root } from '../ui/ui.js';
import { spend, level as levelOf } from '../core/state.js';
import { BUILDINGS, BALLOON, SKY_ISLAND } from '../data/map.js';
import { renderObject, lazyThumb } from '../house/thumbs.js';
import { ORIGIN } from '../house/view.js';
import * as HM from '../house/model.js';

export const VEHICLES = [
  { id: 'scooter', name: 'Pastel Scooter', icon: '🛴', price: 400, lvl: 3, speed: 11.5, seatY: 0.25, stand: true },
  { id: 'bike', name: 'Flower Bike', icon: '🚲', price: 1100, lvl: 5, speed: 13 , seatY: 0.55 },
  { id: 'cart', name: 'Golf Cart', icon: '🛺', price: 2600, lvl: 8, speed: 15, seatY: 0.45 },
  { id: 'car', name: 'Bubble Car', icon: '🚗', price: 6000, lvl: 12, speed: 18, seatY: 0.35 },
];
const VCOLORS = ['#ff8fc0', '#7fc6ff', '#ffd45e', '#6fd6b3', '#b58cff', '#ffffff', '#ff6f6f'];

function wheel(b, x, y, z, r = 0.22, w = 0.12) {
  b.cyl(r, r, w, '#3a3446', x, y, z, { rz: Math.PI / 2, seg: 14, center: true });
  b.cyl(r * 0.5, r * 0.5, w + 0.02, '#e8e4f0', x, y, z, { rz: Math.PI / 2, seg: 10, center: true });
}

export function vehicleModel(id, col) {
  const b = new Builder();
  const wheels = [];
  if (id === 'scooter') {
    b.box(0.34, 0.08, 1.1, col, 0, 0.16, 0, { r: 0.04 });
    b.cyl(0.03, 0.03, 1.0, '#c9c3d1', 0, 0.2, 0.52, { seg: 6, rx: -0.2 });
    b.box(0.6, 0.06, 0.06, '#c9c3d1', 0, 1.15, 0.62, { r: 0.02 });
    for (const s of [-1, 1]) b.sphere(0.05, shade(col, 0.8), s * 0.3, 1.18, 0.62);
    wheels.push([0, 0.12, 0.5, 0.12], [0, 0.12, -0.5, 0.12]);
  } else if (id === 'bike') {
    b.cyl(0.03, 0.03, 1.0, col, 0, 0.55, 0, { rx: Math.PI / 2, seg: 6, center: true });
    b.cyl(0.03, 0.03, 0.6, col, 0, 0.3, -0.25, { rx: 0.3, seg: 6 });
    b.cyl(0.03, 0.03, 0.7, col, 0, 0.25, 0.45, { rx: -0.25, seg: 6 });
    b.box(0.22, 0.08, 0.32, '#5d4b6b', 0, 0.9, -0.28, { r: 0.04 });
    b.box(0.6, 0.05, 0.05, '#c9c3d1', 0, 1.05, 0.5, { r: 0.02 });
    b.box(0.34, 0.24, 0.26, '#f3e6d8', 0, 0.62, 0.72, { r: 0.05 });
    for (let i = 0; i < 4; i++) b.sphere(0.06, ['#ff8fc0', '#ffd45e', '#ffffff', '#b58cff'][i], -0.1 + i * 0.07, 0.9, 0.72);
    wheels.push([0, 0.32, 0.55, 0.3], [0, 0.32, -0.55, 0.3]);
  } else if (id === 'cart') {
    b.box(1.3, 0.35, 2.0, col, 0, 0.25, 0, { r: 0.12 });
    b.box(1.2, 0.3, 0.5, '#fff4e6', 0, 0.6, -0.2, { r: 0.1 });
    b.box(1.2, 0.5, 0.14, '#fff4e6', 0, 0.8, -0.5, { r: 0.07 });
    for (const x of [-0.55, 0.55]) for (const z of [-0.8, 0.75]) b.cyl(0.03, 0.03, 1.2, '#c9c3d1', x, 0.6, z, { seg: 6 });
    b.box(1.45, 0.08, 1.9, '#ffffff', 0, 1.8, 0, { r: 0.04 });
    b.box(1.45, 0.1, 0.1, col, 0, 1.76, 0.95, { r: 0.03 });
    b.cyl(0.18, 0.18, 0.04, '#3a3446', 0, 0.9, 0.55, { rx: -1.0, seg: 12, center: true });
    wheels.push([-0.62, 0.22, 0.65, 0.22], [0.62, 0.22, 0.65, 0.22], [-0.62, 0.22, -0.65, 0.22], [0.62, 0.22, -0.65, 0.22]);
  } else {
    b.box(1.5, 0.55, 2.5, col, 0, 0.22, 0, { r: 0.26 });
    b.box(1.3, 0.55, 1.4, shade(col, 1.08), 0, 0.72, -0.2, { r: 0.28 });
    b.box(1.24, 0.4, 0.05, '#cfefff', 0, 0.82, 0.5, { r: 0.1, rx: -0.3 });
    for (const s of [-1, 1]) { b.box(0.05, 0.36, 1.1, '#cfefff', s * 0.66, 0.82, -0.2, { r: 0.08 }); b.sphere(0.12, '#fff7c2', s * 0.5, 0.5, 1.26, { sz: 0.4 }); }
    b.box(1.52, 0.1, 0.2, '#ffffff', 0, 0.3, 1.24, { r: 0.05 });
    b.box(1.52, 0.1, 0.2, '#ffffff', 0, 0.3, -1.24, { r: 0.05 });
    wheels.push([-0.72, 0.28, 0.8, 0.28], [0.72, 0.28, 0.8, 0.28], [-0.72, 0.28, -0.8, 0.28], [0.72, 0.28, -0.8, 0.28]);
  }
  const group = new THREE.Group();
  const body = new THREE.Mesh(b.build({ ao: 0.15, aoHeight: 0.6 }), M.gloss);
  body.castShadow = true;
  group.add(body);
  const wm = [];
  for (const [x, y, z, r] of wheels) {
    const wb = new Builder();
    wheel(wb, 0, 0, 0, r, id === 'bike' || id === 'scooter' ? 0.06 : 0.16);
    const m = new THREE.Mesh(wb.build({ ao: 0 }), M.std);
    m.position.set(x, y, z);
    m.castShadow = true;
    group.add(m);
    wm.push(m);
  }
  return { group, wheels: wm };
}

export class VehicleSystem {
  async init(game) {
    this.game = game;
    game.vehicles = this;
    const st = game.state;
    st.owned.vehicleColor ||= {};
    this.riding = null;
    const cars = BUILDINGS.find((b) => b.id === 'cars');
    game.world.addInteract({ x: cars.x + Math.sin(cars.face) * (cars.d / 2 + 1.4), z: cars.z + Math.cos(cars.face) * (cars.d / 2 + 1.4), r: 2.6, label: 'Zoom Rides', icon: '🛵', onUse: () => this.openShop() });
    // ride button
    this.btn = h('button', { class: 'round-btn', style: { width: '54px', height: '54px', fontSize: '26px', display: 'none' }, onpointerdown: (e) => { e.stopPropagation(); click(); this.toggle(); } }, '🛵');
    game.hud.rideSlot.appendChild(this.btn);
    this.refreshBtn();
    // balloon
    this.balloon = balloonModel();
    this.balloonMesh = new THREE.Mesh(this.balloon.build({ ao: 0 }), M.std);
    this.balloonMesh.castShadow = true;
    this.balloonMesh.position.set(BALLOON.x, 0.5, BALLOON.z);
    game.scene.add(this.balloonMesh);
    this.skyDock = new THREE.Vector3(SKY_ISLAND.x + 14, SKY_ISLAND.y + 0.15, SKY_ISLAND.z + 12);
    this.balloonSky = this.balloonMesh.clone();
    this.balloonSky.position.copy(this.skyDock);
    game.scene.add(this.balloonSky);
    this.docks = [new THREE.Vector3(BALLOON.x, 0.5, BALLOON.z), this.skyDock.clone()];
    game.world.addInteract({ x: BALLOON.x + 2.6, z: BALLOON.z + 2.6, r: 3.5, label: 'Hot-Air Balloon', icon: '🎈', onUse: () => this.balloonUse(true) });
    game.world.addInteract({ x: this.skyDock.x - 2.5, z: this.skyDock.z - 2.5, y: this.skyDock.y, r: 3.5, label: 'Fly Home', icon: '🎈', onUse: () => this.balloonUse(false) });
    game.balloon = { enable: () => {} };
    this.flight = null;
  }

  get st() { return this.game.state; }

  refreshBtn() {
    const own = this.st.owned.vehicles;
    this.btn.style.display = own.length && this.game.mode === 'play' ? 'grid' : 'none';
    const v = VEHICLES.find((x) => x.id === (this.st.owned.vehicleActive || own[own.length - 1]));
    if (v) this.btn.textContent = this.riding ? '🚶' : v.icon;
  }

  toggle() {
    if (this.riding) return this.dismount();
    const own = this.st.owned.vehicles;
    if (!own.length) return;
    const g = this.game;
    const house = g.state.house;
    if (HM.insideHouse(house, g.player.pos.x - ORIGIN.x, g.player.pos.z - ORIGIN.z)) return toast('No driving inside the house! 😄', { icon: '🏠' });
    if (g.player.pos.y > 40) return toast('Rides stay on the ground!', { icon: '☁️' });
    const id = this.st.owned.vehicleActive || own[own.length - 1];
    this.mount(id);
  }

  mount(id) {
    const g = this.game;
    const v = VEHICLES.find((x) => x.id === id);
    const model = vehicleModel(id, this.st.owned.vehicleColor[id] || VCOLORS[0]);
    g.scene.add(model.group);
    this.riding = { v, model, spin: 0 };
    g.player.vehicle = { speed: v.speed, seatY: v.seatY };
    g.avatar.pose = v.stand ? 'stand' : 'drive';
    g.fx.burst(g.player.pos, 'puff');
    g.audio?.play('vroom');
    g.emit('ride', id);
    this.refreshBtn();
  }

  dismount() {
    const g = this.game;
    if (!this.riding) return;
    g.scene.remove(this.riding.model.group);
    this.riding = null;
    g.player.vehicle = null;
    g.avatar.pose = 'stand';
    g.player.sync();
    this.refreshBtn();
  }

  openShop() {
    const st = this.st;
    const lvl = levelOf(st);
    const m = modal('🛵 Zoom Rides', (b) => {
      b.appendChild(h('div', { class: 'muted', style: { marginBottom: '8px' } }, 'Buy a ride, then tap the ride button next to jump to hop on and off!'));
      const g = h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' } });
      for (const v of VEHICLES) {
        const own = st.owned.vehicles.includes(v.id);
        const lock = v.lvl > lvl ? `Level ${v.lvl}` : null;
        const img = h('img');
        const col = st.owned.vehicleColor[v.id] || VCOLORS[0];
        lazyThumb(img, () => renderObject(vehicleModel(v.id, col).group, `v:${v.id}:${col}`), `v:${v.id}:${col}`);
        const sw = h('div', { class: 'swatches', style: { justifyContent: 'center' } });
        if (own) for (const c of VCOLORS) sw.appendChild(h('button', { class: 'sw' + (c === col ? ' on' : ''), style: { background: c, width: '24px', height: '24px' }, onclick: () => { click(); st.owned.vehicleColor[v.id] = c; if (this.riding?.v.id === v.id) { this.dismount(); this.mount(v.id); } m.close(); this.openShop(); } }));
        g.appendChild(h('div', { class: 'card' + (lock && !own ? ' locked' : '') },
          h('div', { class: 'thumb', style: { width: '110px', height: '90px' } }, img), h('div', { class: 'nm' }, v.name), h('div', { class: 'muted' }, `Speed ${v.speed}`),
          own ? h('button', { class: 'btn small ' + (st.owned.vehicleActive === v.id ? 'ghost' : 'mint'), onclick: () => { click(); st.owned.vehicleActive = v.id; this.refreshBtn(); if (this.riding) { this.dismount(); this.mount(v.id); } m.close(); toast(`${v.name} is ready! Tap ${v.icon} to ride.`, { icon: v.icon }); } }, st.owned.vehicleActive === v.id ? '✓ Chosen' : 'Choose')
            : h('button', { class: 'btn small sun' + (lock ? ' disabled' : ''), onclick: () => {
              click();
              if (!spend(st, v.price)) return toast('Not enough coins yet!', { icon: '🪙' });
              st.owned.vehicles.push(v.id);
              st.owned.vehicleActive = v.id;
              this.refreshBtn();
              m.close();
              celebrate(`New ride: ${v.name}!`, `Tap the ${v.icon} button to hop on`);
              this.game.emit('buyVehicle', v.id);
            } }, lock ? `🔒 ${lock}` : `🪙 ${fmt(v.price)}`), sw));
      }
      b.appendChild(g);
    });
  }

  balloonUse(up) {
    const st = this.st;
    const g = this.game;
    if (up && !st.unlocks.sky) {
      if (levelOf(st) < 11) return toast('Skye will fly you to Sky Island when you reach level 11! 🎈', { icon: '🔒' });
      return toast('Talk to Skye the pilot first! 🎈', { icon: '💬' });
    }
    if (this.riding) this.dismount();
    const from = up ? new THREE.Vector3(BALLOON.x, 0.5, BALLOON.z) : this.skyDock.clone();
    const to = up ? this.skyDock.clone() : new THREE.Vector3(BALLOON.x, 0.5, BALLOON.z);
    this.flight = { t: 0, dur: 7, from, to, up, mesh: up ? this.balloonMesh : this.balloonSky, other: up ? this.balloonSky : this.balloonMesh };
    this.flight.other.visible = false;
    g.mode = 'cutscene';
    g.hud.setVisible(false);
    g.player.teleport(from.x, from.y + 0.6, from.z, g.player.facing);
    g.pets?.actor?.place(new THREE.Vector3(from.x + 0.4, from.y + 0.6, from.z + 0.4));
    g.audio?.play('open');
  }

  update(dt, game) {
    if (this.riding) {
      const r = this.riding;
      const p = game.player;
      r.model.group.position.set(p.pos.x, p.pos.y, p.pos.z);
      r.model.group.rotation.y = p.facing;
      const sp = Math.hypot(p.vel.x, p.vel.z);
      r.spin += sp * dt * 3;
      for (const w of r.model.wheels) w.rotation.x = r.spin;
      if (game.mode === 'build' || p.pos.y > 40) this.dismount();
      if (HM.insideHouse(game.state.house, p.pos.x - ORIGIN.x, p.pos.z - ORIGIN.z)) this.dismount();
    }
    if (this.btn) {
      const show = this.st.owned.vehicles.length && game.mode === 'play';
      const want = show ? 'grid' : 'none';
      if (this.btn.style.display !== want) this.btn.style.display = want;
    }
    const f = this.flight;
    if (f) {
      f.t += dt / f.dur;
      const t = Math.min(1, f.t);
      const e = t * t * (3 - 2 * t);
      const pos = new THREE.Vector3().lerpVectors(f.from, f.to, e);
      pos.y += Math.sin(t * Math.PI) * 25;
      f.mesh.position.copy(pos);
      f.mesh.rotation.y += dt * 0.3;
      game.player.pos.set(pos.x, pos.y + 0.6, pos.z);
      game.player.sync();
      game.avatar.update(dt, 0, false);
      if (game.pets?.actor) { game.pets.actor.pos.set(pos.x + 0.4, pos.y + 0.6, pos.z + 0.4); game.pets.actor.sync(); }
      game.rig.override = { pos: new THREE.Vector3(pos.x + 14, pos.y + 6, pos.z + 14), look: new THREE.Vector3(pos.x, pos.y + 2, pos.z), speed: 3 };
      if (t >= 1) {
        this.flight = null;
        f.other.visible = true;
        game.rig.override = null;
        game.mode = 'play';
        game.hud.setVisible(true);
        const off = f.up ? new THREE.Vector3(-2.5, 0, -2.5) : new THREE.Vector3(2.8, 0, 2.8);
        game.player.teleport(f.to.x + off.x, undefined, f.to.z + off.z);
        game.rig.snap(game.player.pos);
        if (f.up) celebrate('Sky Island! ☁️', 'Welcome to the castle in the clouds');
      }
    } else if (this.balloonMesh) {
      const bob = Math.sin(game.time * 1.2) * 0.15;
      this.balloonMesh.position.set(this.docks[0].x, this.docks[0].y + bob, this.docks[0].z);
      this.balloonSky.position.set(this.docks[1].x, this.docks[1].y + bob, this.docks[1].z);
    }
  }
}
