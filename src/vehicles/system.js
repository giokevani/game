// Rides (all free): bikes, motorbike and cars on land, three boats on the
// sea and the lake, plus the hot-air balloon to Sky Island.
import * as THREE from 'three';
import { Builder, Geo, shade } from '../engine/builder.js';
import { M } from '../engine/materials.js';
import { balloon as balloonModel } from '../world/buildings.js';
import { h, modal, toast, click, celebrate, fmt, root } from '../ui/ui.js';
import { spend, level as levelOf } from '../core/state.js';
import { BUILDINGS, BALLOON, SKY_ISLAND, POND, WORLD, shoreZ } from '../data/map.js';
import { WATER_Y } from '../world/terrain.js';
import { applyFreePlayState } from '../core/freeplay.js';
import { renderObject, lazyThumb } from '../house/thumbs.js';
import { ORIGIN } from '../house/view.js';
import * as HM from '../house/model.js';

export const VEHICLES = [
  { id: 'scooter', name: 'Pastel Scooter', icon: '🛴', price: 0, lvl: 1, speed: 11.5, seatY: 0.25, stand: true },
  { id: 'bike', name: 'Flower Bike', icon: '🚲', price: 0, lvl: 1, speed: 13, seatY: 0.55 },
  { id: 'motorbike', name: 'Zoom Motorbike', icon: '🏍️', price: 0, lvl: 1, speed: 21, seatY: 0.55 },
  { id: 'cart', name: 'Golf Cart', icon: '🛺', price: 0, lvl: 1, speed: 15, seatY: 0.45 },
  { id: 'car', name: 'Bubble Car', icon: '🚗', price: 0, lvl: 1, speed: 18, seatY: 0.35 },
  { id: 'jeep', name: 'Beach Jeep', icon: '🚙', price: 0, lvl: 1, speed: 19, seatY: 0.6 },
  { id: 'sports', name: 'Sports Car', icon: '🏎️', price: 0, lvl: 1, speed: 25, seatY: 0.22 },
  { id: 'rowboat', name: 'Row Boat', icon: '🚣', price: 0, lvl: 1, speed: 6.5, seatY: 0.25, water: true },
  { id: 'motorboat', name: 'Speed Boat', icon: '🚤', price: 0, lvl: 1, speed: 17, seatY: 0.45, water: true },
  { id: 'yacht', name: 'Little Yacht', icon: '🛥️', price: 0, lvl: 1, speed: 11, seatY: 0.95, water: true },
];
export const VEHICLE = Object.fromEntries(VEHICLES.map((v) => [v.id, v]));
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
  } else if (id === 'motorbike') {
    b.box(0.36, 0.34, 1.2, col, 0, 0.42, 0, { r: 0.14 });
    b.box(0.3, 0.12, 0.6, '#3a3446', 0, 0.76, -0.2, { r: 0.06 });
    b.box(0.4, 0.3, 0.3, shade(col, 0.85), 0, 0.62, 0.42, { r: 0.1 });
    b.cyl(0.035, 0.035, 0.6, '#c9c3d1', 0, 0.55, 0.62, { rx: -0.35, seg: 6 });
    b.box(0.72, 0.05, 0.05, '#3a3446', 0, 1.05, 0.7, { r: 0.02 });
    b.sphere(0.1, '#fff7c2', 0, 0.82, 0.68, { sz: 0.5 });
    b.cyl(0.05, 0.06, 0.5, '#c9c3d1', 0.2, 0.3, -0.45, { rx: Math.PI / 2 - 0.2, seg: 8 });
    wheels.push([0, 0.3, 0.62, 0.3], [0, 0.3, -0.58, 0.3]);
  } else if (id === 'jeep') {
    b.box(1.6, 0.6, 2.6, col, 0, 0.35, 0, { r: 0.12 });
    b.box(1.5, 0.08, 1.5, shade(col, 0.8), 0, 0.95, -0.4, { r: 0.04 });
    for (const x of [-0.7, 0.7]) for (const z of [-1.1, 0.3]) b.cyl(0.04, 0.04, 0.9, '#3a3446', x, 0.95, z, { seg: 6 });
    b.box(1.55, 0.06, 1.5, '#3a3446', 0, 1.82, -0.4, { r: 0.03 });
    b.box(1.4, 0.45, 0.06, '#cfefff', 0, 1.2, 0.35, { r: 0.04, rx: -0.15 });
    for (const s of [-1, 1]) b.sphere(0.13, '#fff7c2', s * 0.55, 0.7, 1.3, { sz: 0.4 });
    b.cyl(0.32, 0.32, 0.2, '#3a3446', 0, 0.75, -1.35, { rx: Math.PI / 2, seg: 14, center: true });
    wheels.push([-0.8, 0.36, 0.9, 0.36], [0.8, 0.36, 0.9, 0.36], [-0.8, 0.36, -0.9, 0.36], [0.8, 0.36, -0.9, 0.36]);
  } else if (id === 'sports') {
    b.box(1.6, 0.35, 3.0, col, 0, 0.2, 0, { r: 0.16 });
    b.box(1.2, 0.3, 1.2, '#3a3446', 0, 0.5, -0.25, { r: 0.2 });
    b.box(1.1, 0.26, 0.05, '#cfefff', 0, 0.62, 0.38, { r: 0.08, rx: -0.6 });
    b.box(1.6, 0.06, 0.3, shade(col, 0.75), 0, 0.72, -1.35, { r: 0.03 });
    for (const s of [-1, 1]) { b.box(0.05, 0.25, 0.3, shade(col, 0.75), s * 0.6, 0.45, -1.35, { r: 0.02 }); b.sphere(0.12, '#fff7c2', s * 0.55, 0.38, 1.48, { sz: 0.35 }); }
    b.box(1.62, 0.06, 2.6, '#ffffff', 0, 0.42, 0, { r: 0.02 });
    wheels.push([-0.78, 0.28, 0.95, 0.28], [0.78, 0.28, 0.95, 0.28], [-0.78, 0.28, -0.95, 0.28], [0.78, 0.28, -0.95, 0.28]);
  } else if (id === 'rowboat') {
    b.box(1.3, 0.45, 2.6, '#c98a4b', 0, -0.25, 0, { r: 0.2 });
    b.cone(0.65, 0.7, '#c98a4b', 0, -0.03, 1.55, { rx: Math.PI / 2, seg: 4, center: true });
    b.box(1.1, 0.1, 2.3, '#e8c08a', 0, 0.0, 0, { r: 0.04 });
    for (const z of [-0.6, 0.5]) b.box(1.2, 0.08, 0.3, '#a8703a', 0, 0.12, z, { r: 0.03 });
    b.box(1.34, 0.08, 2.64, col, 0, 0.14, 0, { r: 0.05 });
    for (const sx of [-1, 1]) { b.cyl(0.03, 0.03, 1.6, '#e8c08a', sx * 0.9, 0.25, 0, { rz: sx * 1.1, seg: 6, center: true }); b.box(0.06, 0.25, 0.14, '#e8c08a', sx * 1.55, -0.15, 0, { r: 0.02 }); }
  } else if (id === 'motorboat') {
    b.box(1.7, 0.6, 3.6, '#ffffff', 0, -0.35, -0.2, { r: 0.25 });
    b.cone(0.85, 1.3, '#ffffff', 0, -0.05, 2.2, { rx: Math.PI / 2, seg: 4, center: true });
    b.box(1.72, 0.14, 3.6, col, 0, -0.05, -0.2, { r: 0.05 });
    b.box(1.5, 0.08, 3.0, '#f3e6d8', 0, 0.2, -0.3, { r: 0.04 });
    b.box(1.3, 0.45, 0.06, '#cfefff', 0, 0.5, 0.75, { r: 0.05, rx: -0.4 });
    b.box(1.0, 0.4, 0.8, shade(col, 0.85), 0, 0.25, -0.6, { r: 0.12 });
    b.box(0.35, 0.7, 0.35, '#3a3446', 0, -0.2, -2.1, { r: 0.08 });
  } else if (id === 'yacht') {
    b.box(2.4, 0.9, 5.2, '#ffffff', 0, -0.5, -0.3, { r: 0.35 });
    b.cone(1.2, 1.8, '#ffffff', 0, -0.05, 3.1, { rx: Math.PI / 2, seg: 4, center: true });
    b.box(2.42, 0.16, 5.2, col, 0, -0.1, -0.3, { r: 0.06 });
    b.box(2.2, 0.08, 4.8, '#e0b27a', 0, 0.4, -0.3, { r: 0.04 });
    b.box(1.5, 0.9, 1.8, '#ffffff', 0, 0.45, -1.1, { r: 0.2 });
    for (const sx of [-1, 1]) b.box(0.05, 0.4, 1.4, '#cfefff', sx * 0.76, 0.9, -1.1, { r: 0.04 });
    b.box(1.6, 0.08, 1.9, shade(col, 0.85), 0, 1.38, -1.1, { r: 0.04 });
    b.cyl(0.06, 0.07, 4.2, '#d0d0da', 0, 0.45, 0.6, { seg: 8 });
    b.add(Geo.shape('yachtSail', [[0, 0], [0, 3.6], [1.6, 0.2]], 0.04, 0.01), '#fff6ea', 0.05, 0.85, 0.65, 0, -Math.PI / 2, 0);
    for (const sx of [-1, 1]) b.cyl(0.03, 0.03, 4.4, '#d0d0da', sx * 1.12, 0.65, -0.3, { rx: Math.PI / 2, seg: 6, center: true });
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
    applyFreePlayState(st, VEHICLES.map((v) => v.id)); // every ride is hers from the start
    this.riding = null;
    this.splashT = 0;
    const cars = BUILDINGS.find((b) => b.id === 'cars');
    game.world.addInteract({ x: cars.x + Math.sin(cars.face) * (cars.d / 2 + 1.4), z: cars.z + Math.cos(cars.face) * (cars.d / 2 + 1.4), r: 2.6, label: 'Zoom Rides', icon: '🛵', onUse: () => this.openShop() });
    // ride button
    this.btn = h('button', { class: 'round-btn', style: { width: '54px', height: '54px', fontSize: '26px', display: 'none' }, onpointerdown: (e) => { e.stopPropagation(); click(); this.toggle(); } }, '🚗');
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
    this.btn.textContent = this.riding ? '🚶' : '🚗';
  }

  // the 🚗 button: get off, or pick any ride
  toggle() {
    if (this.riding) return this.dismount();
    this.picker();
  }

  picker() {
    const g = this.game;
    modal('🚗 Rides', (b, close) => {
      const group = (title, list) => {
        b.appendChild(h('div', { class: 'section-title' }, title));
        const row = h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' } });
        for (const v of list) row.appendChild(h('button', { class: 'card', onclick: () => { click(); close(); this.ride(v.id); } },
          h('div', { class: 'thumb', style: { fontSize: '44px', width: '64px', height: '64px' } }, v.icon), h('div', { class: 'nm' }, v.name)));
        b.appendChild(row);
      };
      group('On land', VEHICLES.filter((v) => !v.water));
      group('On water 🌊 (sea or lake)', VEHICLES.filter((v) => v.water));
      b.appendChild(h('div', { class: 'muted', style: { marginTop: '8px' } }, 'All rides are free! Change colours at Zoom Rides. Tap 🚶 to get off.'));
    }, { narrow: false });
    void g;
  }

  ride(id) {
    const g = this.game;
    const v = VEHICLE[id];
    const house = g.state.house;
    if (HM.insideHouse(house, g.player.pos.x - ORIGIN.x, g.player.pos.z - ORIGIN.z)) return toast('No driving inside the house! 😄', { icon: '🏠' });
    if (g.player.pos.y > 40) return toast('Rides stay on the ground!', { icon: '☁️' });
    if (v.water) {
      const spot = this.findWater(g.player.pos);
      if (!spot) return this.askWater(id);
      g.player.teleport(spot.x, WATER_Y, spot.z, g.player.facing);
    } else if (g.player.swimming) return toast('Swim to the shore first, then hop on! 🏊', { icon: '🌊' });
    this.st.owned.vehicleActive = id;
    this.mount(id);
  }

  // nearest spot with water deep enough for a boat (or null)
  findWater(pos, maxR = 10) {
    const W = this.game.world;
    const ok = (x, z) => x > WORLD.minX && x < WORLD.maxX && z > WORLD.minZ && z < WORLD.maxZ && WATER_Y - W.groundAt(x, z, 5) >= 0.8;
    if (ok(pos.x, pos.z)) return { x: pos.x, z: pos.z };
    for (let r = 2; r <= maxR; r += 2) {
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const x = pos.x + Math.cos(a) * r, z = pos.z + Math.sin(a) * r;
        if (ok(x, z)) return { x, z };
      }
    }
    return null;
  }

  askWater(id) {
    const g = this.game;
    const go = (x, z) => {
      g.player.teleport(x, undefined, z);
      g.rig.snap(g.player.pos);
      this.ride(id);
    };
    modal('🌊 Boats need water', (b, close) => {
      b.appendChild(h('p', {}, 'Where do you want to sail?'));
      b.appendChild(h('div', { class: 'row' },
        h('button', { class: 'btn sky', onclick: () => { click(); close(); go(10, shoreZ(10) - 1); } }, '🏖️ The sea'),
        h('button', { class: 'btn mint', onclick: () => { click(); close(); go(POND.x - POND.rx - 1.5, POND.z); } }, '🦆 The lake')));
    }, { narrow: true });
  }

  mount(id) {
    const g = this.game;
    const v = VEHICLES.find((x) => x.id === id);
    const model = vehicleModel(id, this.st.owned.vehicleColor[id] || VCOLORS[0]);
    g.scene.add(model.group);
    this.riding = { v, model, spin: 0 };
    g.player.vehicle = { speed: v.speed, seatY: v.seatY, water: !!v.water };
    g.player.swimming = false;
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
    // stepping off a boat near the shore puts her on land, else she swims
    if (this.wasBoat(g)) {
      const land = this.findLand(g.player.pos);
      if (land) g.player.teleport(land.x, undefined, land.z, g.player.facing);
    }
    g.player.sync();
    this.refreshBtn();
  }

  wasBoat(g) { return WATER_Y - g.world.groundAt(g.player.pos.x, g.player.pos.z, 5) >= 0.8; }

  findLand(pos) {
    const W = this.game.world;
    for (let r = 2; r <= 6; r += 2) for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const x = pos.x + Math.cos(a) * r, z = pos.z + Math.sin(a) * r;
      if (W.groundAt(x, z, 5) > WATER_Y - 0.2) return { x, z };
    }
    return null;
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
      if (levelOf(st) < 13) return toast('Skye will fly you to Sky Island when you reach level 13! 🎈', { icon: '🔒' });
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
      if (r.v.water) {
        // boats bob and rock, and leave a little wake
        r.model.group.position.y = WATER_Y + Math.sin(game.time * 2) * 0.05;
        r.model.group.rotation.z = Math.sin(game.time * 1.4) * 0.03;
        r.model.group.rotation.x = -Math.min(0.08, sp * 0.004);
        this.splashT -= dt;
        if (sp > 3 && this.splashT <= 0) { this.splashT = 0.25; game.fx.burst(new THREE.Vector3(p.pos.x - Math.sin(p.facing) * 1.5, WATER_Y, p.pos.z - Math.cos(p.facing) * 1.5), 'splash', { n: 3, dy: 0.1, scale: 0.6 }); }
      }
      r.spin += sp * dt * 3;
      for (const w of r.model.wheels) w.rotation.x = r.spin;
      if (game.mode === 'build' || p.pos.y > 40) this.dismount();
      if (HM.insideHouse(game.state.house, p.pos.x - ORIGIN.x, p.pos.z - ORIGIN.z)) this.dismount();
    }
    // swimming: little splashes while she moves
    const p = game.player;
    if (p.swimming) {
      this.splashT -= dt;
      if (Math.hypot(p.vel.x, p.vel.z) > 1 && this.splashT <= 0) {
        this.splashT = 0.35;
        game.fx.burst(new THREE.Vector3(p.pos.x, WATER_Y, p.pos.z), 'splash', { n: 2, dy: 0.1, scale: 0.5 });
        if (Math.random() < 0.3) game.audio?.play('water');
      }
    }
    if (this.btn) {
      const show = game.mode === 'play';
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
        game.player.teleport(f.to.x + off.x, f.up ? f.to.y : undefined, f.to.z + off.z);
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
