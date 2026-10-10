import * as THREE from 'three';
import { M, uniforms, canvasTex } from '../engine/materials.js';
import { ChunkMerger } from '../engine/chunks.js';
import { Builder } from '../engine/builder.js';
import { BUILDINGS, PIER, PLAZA, GARDEN, PLAYGROUND, BALLOON, SKY_ISLAND, CAVE_GATE, zoneAt, POND } from '../data/map.js';
import { buildGround, buildRoads, buildWater, terrainHeight, WATER_Y } from './terrain.js';
import * as B from './buildings.js';
import { buildNature } from './nature.js';

const CELL = 8;

export class World {
  constructor(scene, quality, options = {}) {
    this.height = options.height || terrainHeight;
    this.waterY = options.waterY ?? WATER_Y;
    this.scene = scene;
    this.quality = quality;
    this.boxes = [];
    this.circles = [];
    this.platforms = [];
    this.grid = new Map();
    this.interactables = [];
    this.dynamic = []; // objects with update(dt)
    this.signs = [];
  }

  // ---------- collision registry ----------
  _cells(x1, z1, x2, z2, fn) {
    for (let cx = Math.floor(x1 / CELL); cx <= Math.floor(x2 / CELL); cx++)
      for (let cz = Math.floor(z1 / CELL); cz <= Math.floor(z2 / CELL); cz++) fn(`${cx},${cz}`);
  }
  addBox(x1, z1, x2, z2, o = {}) {
    const b = { x1: Math.min(x1, x2), z1: Math.min(z1, z2), x2: Math.max(x1, x2), z2: Math.max(z1, z2), top: o.top ?? 99, bot: o.bot ?? -Infinity, tag: o.tag, off: false };
    this._cells(b.x1, b.z1, b.x2, b.z2, (k) => { if (!this.grid.has(k)) this.grid.set(k, []); this.grid.get(k).push(b); });
    this.boxes.push(b);
    return b;
  }
  addCircle(x, z, r, o = {}) {
    const c = { x, z, r, circle: true, top: o.top ?? 99, bot: o.bot ?? -Infinity, tag: o.tag, off: false };
    this._cells(x - r, z - r, x + r, z + r, (k) => { if (!this.grid.has(k)) this.grid.set(k, []); this.grid.get(k).push(c); });
    this.circles.push(c);
    return c;
  }
  removeCollider(c) {
    c.off = true;
    for(const [key,list] of this.grid){const i=list.indexOf(c);if(i>=0)list.splice(i,1);if(!list.length)this.grid.delete(key);}
    this.boxes=this.boxes.filter(b=>b!==c);this.circles=this.circles.filter(b=>b!==c);
  }
  removeTagged(tag) {
    for (const list of this.grid.values()) {
      for (let i = list.length - 1; i >= 0; i--) if (list[i].tag === tag) list.splice(i, 1);
    }
    this.boxes = this.boxes.filter((b) => b.tag !== tag);
    this.circles = this.circles.filter((c) => c.tag !== tag);
    this.platforms = this.platforms.filter((p) => p.tag !== tag);
  }
  addPlatform(p) { this.platforms.push(p); return p; }

  // push a circle (pos, radius) out of colliders; feetY lets you walk over low things
  resolve(pos, radius, feetY = 0) {
    const seen = new Set();
    for (let iter = 0; iter < 2; iter++) {
      this._cells(pos.x - radius, pos.z - radius, pos.x + radius, pos.z + radius, (k) => {
        const list = this.grid.get(k);
        if (!list) return;
        for (const c of list) {
          if (c.off || (iter === 0 && seen.has(c))) continue;
          seen.add(c);
          if (feetY + 1.8 < c.bot || feetY > c.top - 0.05) continue;
          if (c.circle) {
            const dx = pos.x - c.x, dz = pos.z - c.z;
            const d = Math.hypot(dx, dz), m = c.r + radius;
            if (d < m && d > 1e-5) { pos.x = c.x + (dx / d) * m; pos.z = c.z + (dz / d) * m; }
          } else {
            const cx = Math.max(c.x1, Math.min(pos.x, c.x2));
            const cz = Math.max(c.z1, Math.min(pos.z, c.z2));
            const dx = pos.x - cx, dz = pos.z - cz;
            const d2 = dx * dx + dz * dz;
            if (d2 < radius * radius) {
              if (d2 > 1e-8) {
                const d = Math.sqrt(d2);
                pos.x = cx + (dx / d) * radius;
                pos.z = cz + (dz / d) * radius;
              } else {
                // inside the box: push out the shortest way
                const l = pos.x - c.x1, r = c.x2 - pos.x, t = pos.z - c.z1, bt = c.z2 - pos.z;
                const mn = Math.min(l, r, t, bt);
                if (mn === l) pos.x = c.x1 - radius; else if (mn === r) pos.x = c.x2 + radius;
                else if (mn === t) pos.z = c.z1 - radius; else pos.z = c.z2 + radius;
              }
            }
          }
        }
      });
    }
  }

  // is a point inside a solid building (ignores the player's own house and furniture)
  blockedAt(x, z, y) {
    const list = this.grid.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`);
    if (!list) return false;
    for (const c of list) {
      if (c.off || c.tag === 'house' || c.tag === 'furn' || y > c.top || y + 1.8 < c.bot) continue;
      if (c.circle) { if (c.r > 1.2 && (x - c.x) ** 2 + (z - c.z) ** 2 < c.r * c.r) return true; }
      else if (x > c.x1 && x < c.x2 && z > c.z1 && z < c.z2) return true;
    }
    return false;
  }

  // ground height under x,z for something whose feet are at currentY
  groundAt(x, z, currentY = 0, step = 0.75) {
    let h = this.height(x, z);
    for (const p of this.platforms) {
      if (p.off) continue;
      let inside;
      if (p.test) inside = p.test(x, z);
      else if (p.r) inside = (x - p.x) ** 2 + (z - p.z) ** 2 < p.r * p.r;
      else inside = x > p.x1 && x < p.x2 && z > p.z1 && z < p.z2;
      if (inside && p.y > h && p.y <= currentY + step) h = p.y;
    }
    return h;
  }

  inWater(x, z) {
    return this.height(x, z) < this.waterY - 0.25 && this.groundAt(x, z, 5) < this.waterY;
  }

  // ---------- interactables ----------
  addInteract(o) {
    const it = { r: 2.5, y: 0, enabled: () => true, ...o };
    this.interactables.push(it);
    return it;
  }
  removeInteract(it) {
    const i = this.interactables.indexOf(it);
    if (i >= 0) this.interactables.splice(i, 1);
  }
  nearestInteract(pos) {
    let best = null, bd = Infinity;
    for (const it of this.interactables) {
      if (!it.enabled()) continue;
      const d = Math.hypot(pos.x - it.x, pos.z - it.z);
      if (d < it.r && Math.abs(pos.y - (it.y || 0)) < (it.dy ?? 4) && d < bd) { bd = d; best = it; }
    }
    return best;
  }

  zoneAt(p) { return zoneAt(p.x, p.z, p.y); }

  // ---------- building the town ----------
  build(progress = () => {}) {
    const scene = this.scene;
    this.ground = buildGround(scene);
    progress(0.35, 'Filling the sea…');
    this.water = buildWater(scene);
    this.roads = buildRoads(scene);
    progress(0.45, 'Building the town…');

    const merger = new ChunkMerger(70);
    const mats = { std: M.std, glow: M.glow, gloss: M.gloss, glowAlways: M.glowAlways };
    const put = (p, x, y, z, ry, o) => {
      for (const k of Object.keys(mats)) if (p[k] && p[k].parts.length) merger.add(p[k].build(o), mats[k], x, y, z, ry);
    };

    const signList = [];
    for (const b of BUILDINGS) {
      let p;
      if (b.kind === 'shop') p = B.shop(b);
      else if (b.kind === 'house') p = B.house(b);
      else if (b.kind === 'townhall') p = B.townhall(b);
      else if (b.kind === 'stand') p = B.stand(b);
      else if (b.kind === 'lighthouse') p = B.lighthouse();
      else if (b.kind === 'cave') p = B.cave();
      if (!p) continue;
      put(p, b.x, 0, b.z, b.face, { aoHeight: 1.2 });
      const rot = Math.abs(Math.sin(b.face)) > 0.5;
      const hw = (rot ? b.d : b.w) / 2, hd = (rot ? b.w : b.d) / 2;
      // tops are the real heights, so flying rides can pass over the roofs
      const top = { lighthouse: 24, cave: 10, stand: 5, townhall: 13, house: 8.5 }[b.kind] ?? 8;
      if (b.kind === 'lighthouse') this.addCircle(b.x, b.z, 3.2, { top });
      else if (b.kind === 'cave') this.addCircle(b.x - 2, b.z, 6.5, { top });
      else if (b.kind === 'stand') this.addBox(b.x - hw, b.z - hd * 0.5, b.x + hw, b.z + hd * 0.6, { top });
      else this.addBox(b.x - hw, b.z - hd, b.x + hw, b.z + hd, { top });
      if (b.kind !== 'stand' && b.kind !== 'cave') this.addPlatform({ x1: b.x - hw, z1: b.z - hd, x2: b.x + hw, z2: b.z + hd, y: top });
      if (b.kind === 'townhall') {
        for (let i = -2; i <= 2; i++) if (i) this.addCircle(b.x + i * 2.3, b.z + b.d / 2 + 1.4, 0.45);
      }
      // signs
      const f = new THREE.Vector3(Math.sin(b.face), 0, Math.cos(b.face));
      if (b.kind === 'shop') signList.push({ id: b.id, text: b.name, b, local: [0, 4.92, b.d / 2 + 0.3], w: Math.min(b.w - 1, 7.2) - 0.3, h: 1.1, f });
      if (b.kind === 'stand') signList.push({ id: b.id, text: b.name, b, local: [0, 4.35, b.d / 2 + 0.02], w: b.w * 0.8 - 0.2, h: 0.75, f });
      if (b.kind === 'townhall') signList.push({ id: b.id, text: b.name, b, local: [0, 7.5, b.d / 2 + 2.28], w: 4.2, h: 1.0, f, color: '#5a8fd6' });
    }
    progress(0.55, 'Hanging up signs…');
    this.buildSigns(signList);

    // plaza fountain + benches + lamps
    put(B.fountain(), PLAZA.x, 0, PLAZA.z, 0);
    this.addCircle(PLAZA.x, PLAZA.z, 5.6, { top: 0.9 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const x = PLAZA.x + Math.cos(a) * 9.5, z = PLAZA.z + Math.sin(a) * 9.5;
      put(B.bench(), x, 0, z, -a - Math.PI / 2);
      this.addCircle(x, z, 0.9, { top: 0.6 });
    }
    const lampSpots = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      lampSpots.push([PLAZA.x + Math.cos(a) * 13, PLAZA.z + Math.sin(a) * 13]);
    }
    for (let x = -120; x <= 130; x += 26) { lampSpots.push([x + 6, -63.2]); lampSpots.push([x + 6, 29.2]); }
    for (let z = -44; z <= 12; z += 20) { lampSpots.push([-34.8, z]); lampSpots.push([34.8, z]); }
    for (let x = 52; x < 130; x += 18) lampSpots.push([x, -18.8]);
    for (const [x, z] of lampSpots) {
      put(B.lamp(), x, 0, z, 0);
      this.addCircle(x, z, 0.3);
    }
    this.lampSpots = lampSpots;

    // park things
    put(B.playground(), PLAYGROUND.x, 0, PLAYGROUND.z, 0);
    this.addCircle(PLAYGROUND.x - 3, PLAYGROUND.z - 1, 1.4);
    this.addBox(PLAYGROUND.x + 0.8, PLAYGROUND.z - 1.2, PLAYGROUND.x + 5.2, PLAYGROUND.z + 0.7);
    const bed = B.gardenBed();
    this.gardenSpots = [];
    for (let r = 0; r < GARDEN.rows; r++) for (let c = 0; c < GARDEN.cols; c++) {
      const x = GARDEN.x + c * GARDEN.gap, z = GARDEN.z + r * GARDEN.gap;
      merger.add(bed.build(), M.std, x, 0, z, 0);
      this.gardenSpots.push({ x, z });
    }
    const gfence = B.fenceRun(GARDEN.cols * GARDEN.gap + 2, '#ffffff');
    merger.add(gfence.build(), M.std, GARDEN.x + (GARDEN.cols - 1) * GARDEN.gap / 2, 0, GARDEN.z - 3, 0);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const x = POND.x + Math.cos(a) * (POND.rx + 4.5), z = POND.z + Math.sin(a) * (POND.rz + 4.5);
      put(B.bench(), x, 0, z, -a - Math.PI / 2);
      this.addCircle(x, z, 0.9, { top: 0.6 });
    }
    put(B.balloonStation(), BALLOON.x, 0, BALLOON.z, 0);
    this.addPlatform({ x: BALLOON.x, z: BALLOON.z, r: 4.6, y: 0.5 });

    // pier
    const pr = B.pier(PIER);
    put(pr.p, pr.cx, 0, pr.cz, 0);
    this.addPlatform({ x1: PIER.x1, z1: PIER.z1 - 0.5, x2: PIER.x2, z2: PIER.z2, y: PIER.y });
    this.addPlatform({ x1: PIER.x1 - 3, z1: PIER.z2, x2: PIER.x2 + 3, z2: PIER.z2 + 6, y: PIER.y });
    this.addBox(PIER.x1 - 0.3, PIER.z1 + 1, PIER.x1 + 0.1, PIER.z2, { top: PIER.y + 1 });
    this.addBox(PIER.x2 - 0.1, PIER.z1 + 1, PIER.x2 + 0.3, PIER.z2, { top: PIER.y + 1 });
    // steps up to the pier
    const st = new Builder();
    for (let i = 0; i < 3; i++) st.box(PIER.x2 - PIER.x1, 0.24 * (i + 1), 0.6, '#c9976b', 0, 0, -i * 0.6, { r: 0.03 });
    merger.add(st.build(), M.std, (PIER.x1 + PIER.x2) / 2, terrainHeight(30, PIER.z1 - 1), PIER.z1 - 0.2, 0);
    this.addPlatform({ x1: PIER.x1, z1: PIER.z1 - 2, x2: PIER.x2, z2: PIER.z1 - 1.1, y: 0.25 + terrainHeight(30, PIER.z1 - 1.5) });
    this.addPlatform({ x1: PIER.x1, z1: PIER.z1 - 1.1, x2: PIER.x2, z2: PIER.z1 - 0.5, y: 0.5 + terrainHeight(30, PIER.z1 - 1) });

    // sky island (far above the park)
    put(B.skyIsland(SKY_ISLAND.r), SKY_ISLAND.x, SKY_ISLAND.y, SKY_ISLAND.z, 0, { aoHeight: 1, aoBase: -2 });
    this.addPlatform({ x: SKY_ISLAND.x, z: SKY_ISLAND.z, r: SKY_ISLAND.r, y: SKY_ISLAND.y + 0.15 });
    this.addBox(SKY_ISLAND.x - 5.5, SKY_ISLAND.z - 12.5, SKY_ISLAND.x + 5.5, SKY_ISLAND.z - 4, { bot: SKY_ISLAND.y, top: SKY_ISLAND.y + 8 });

    // cave gate boulders (removed by a quest)
    const gate = new Builder();
    for (let i = 0; i < 5; i++) gate.ico(1.6 + (i % 2) * 0.6, i % 2 ? '#9f98ab' : '#8a8396', (i - 2) * 1.8, 1.0 + (i % 2) * 0.8, 0, { detail: 1 });
    gate.box(0.2, 1.6, 0.2, '#8a5a3c', 3.4, 0, 1.6);
    gate.box(1.8, 0.9, 0.12, '#fff3d6', 3.4, 1.2, 1.7, { r: 0.05 });
    this.caveGate = new THREE.Mesh(gate.build(), M.std);
    this.caveGate.position.set(CAVE_GATE.x, 0, CAVE_GATE.z);
    this.caveGate.rotation.y = Math.PI / 2;
    this.caveGate.castShadow = true;
    scene.add(this.caveGate);
    this.caveGateCollider = this.addBox(CAVE_GATE.x - 1.5, CAVE_GATE.z - 5, CAVE_GATE.x + 1.5, CAVE_GATE.z + 5);
    // cliffs so the cove can only be reached through the gate
    this.addBox(-150, 30, -104, 34);
    this.addBox(-104, 34, -102, 41);
    this.addBox(-104, 51, -102, 68);
    const cliff = new Builder();
    for (let x = -148; x < -103; x += 3.2) cliff.ico(2.4, x % 2 ? '#a39bbb' : '#8f86a8', x, 1.2, 32, { detail: 1, sy: 1.1 });
    for (const z of [36, 39, 53, 56, 59, 62]) cliff.ico(2.2, '#9a93a6', -103, 1.2, z, { detail: 1 });
    merger.add(cliff.build({ aoHeight: 2 }), M.std, 0, 0, 0, 0);

    merger.build(scene);
    progress(0.62, 'Growing trees…');
    this.nature = buildNature(this, this.quality);
    progress(0.75, 'Waking up the town…');
    this.buildAmbient();
  }

  buildSigns(list) {
    const { tex, uv } = B.buildSignAtlas(list.map((s) => ({ id: s.id, text: s.text, color: s.color })));
    const geos = [];
    for (const s of list) {
      const g = new THREE.PlaneGeometry(s.w, s.h);
      const [u1, v1, u2, v2] = uv[s.id];
      const a = g.attributes.uv;
      a.setXY(0, u1, v2); a.setXY(1, u2, v2); a.setXY(2, u1, v1); a.setXY(3, u2, v1);
      const b = s.b;
      const m = new THREE.Matrix4().makeRotationY(b.face);
      m.setPosition(b.x, 0, b.z);
      const local = new THREE.Matrix4().makeTranslation(...s.local);
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(m, local));
      geos.push(g);
    }
    const merged = mergeAll(geos);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.12 });
    this.signMat = mat;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  buildAmbient() {
    // warm light pools under lamps at night
    const tex = canvasTex(64, 64, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,220,150,0.9)');
      g.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    const poolMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
    const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(7, 7).rotateX(-Math.PI / 2), poolMat, this.lampSpots.length);
    const d = new THREE.Object3D();
    this.lampSpots.forEach(([x, z], i) => { d.position.set(x, 0.12, z); d.updateMatrix(); pools.setMatrixAt(i, d.matrix); });
    pools.renderOrder = 2;
    this.scene.add(pools);
    this.poolMat = poolMat;

    // drifting blossom petals + fireflies around the camera
    this.petals = makeDrift(260, 0xffb8d6, 0.22, false);
    this.fireflies = makeDrift(120, 0xfff3a0, 0.3, true);
    this.scene.add(this.petals.points, this.fireflies.points);

    // fountain spray
    this.spray = makeSpray();
    this.spray.points.position.set(PLAZA.x, 0, PLAZA.z);
    this.scene.add(this.spray.points);
  }

  update(dt, focus) {
    const night = uniforms.uNight.value;
    if (this.poolMat) this.poolMat.opacity = night * 0.85;
    if (this.signMat) this.signMat.emissiveIntensity = 0.12 + night * 0.5;
    this.petals?.update(dt, focus, 1 - night * 0.8);
    this.fireflies?.update(dt, focus, night);
    for (const d of this.dynamic) d.update(dt);
  }

  openCaveGate(animate = true) {
    if (!this.caveGateCollider) return;
    this.removeCollider(this.caveGateCollider);
    this.caveGateCollider = null;
    if (animate) {
      const g = this.caveGate;
      const t0 = performance.now();
      const obj = { update: () => {
        const t = (performance.now() - t0) / 1500;
        g.position.y = -t * 4;
        if (t >= 1) { g.visible = false; this.dynamic.splice(this.dynamic.indexOf(obj), 1); }
      } };
      this.dynamic.push(obj);
    } else this.caveGate.visible = false;
  }
}

function mergeAll(geos) {
  let n = 0;
  for (const g of geos) n += g.index ? g.index.count : g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  let o = 0;
  for (let g of geos) {
    if (g.index) g = g.toNonIndexed();
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    uv.set(g.attributes.uv.array, o * 2);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return out;
}

const dotTex = (() => {
  let t = null;
  return () => t || (t = canvasTex(32, 32, (ctx) => {
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32);
  }));
})();

function makeDrift(n, color, size, glow) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  const seeds = [];
  for (let i = 0; i < n; i++) {
    seeds.push({ x: Math.random() * 60 - 30, y: Math.random() * 12, z: Math.random() * 60 - 30, s: Math.random() * 10, v: 0.4 + Math.random() * 0.6 });
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size, map: dotTex(), transparent: true, depthWrite: false, opacity: 0, sizeAttenuation: true,
    blending: glow ? THREE.AdditiveBlending : THREE.NormalBlending });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  let t = 0;
  return {
    points,
    update(dt, focus, strength) {
      t += dt;
      mat.opacity = strength * (glow ? 1 : 0.9);
      points.visible = strength > 0.02;
      if (!points.visible) return;
      for (let i = 0; i < n; i++) {
        const s = seeds[i];
        if (glow) {
          s.y = 0.6 + Math.sin(t * s.v + s.s) * 0.8 + 1.0;
          s.x += Math.sin(t * 0.7 + s.s) * dt * 0.6;
          s.z += Math.cos(t * 0.6 + s.s * 1.3) * dt * 0.6;
        } else {
          s.y -= dt * s.v * 0.9;
          s.x += Math.sin(t * 1.3 + s.s) * dt * 0.8 + dt * 0.4;
          s.z += Math.cos(t * 1.1 + s.s) * dt * 0.5;
          if (s.y < 0) s.y += 12;
        }
        let x = s.x, z = s.z;
        // wrap around focus
        x = ((((x - focus.x) + 30) % 60) + 60) % 60 - 30 + focus.x;
        z = ((((z - focus.z) + 30) % 60) + 60) % 60 - 30 + focus.z;
        pos[i * 3] = x; pos[i * 3 + 1] = s.y + focus.y * (glow ? 1 : 0.2); pos[i * 3 + 2] = z;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

function makeSpray() {
  const n = 160;
  const geo = new THREE.BufferGeometry();
  const seed = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { seed[i * 3] = Math.random(); seed[i * 3 + 1] = Math.random() * Math.PI * 2; seed[i * 3 + 2] = Math.random(); }
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('seed', new THREE.BufferAttribute(seed, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: uniforms.uTime, map: { value: dotTex() } },
    transparent: true, depthWrite: false,
    vertexShader: `attribute vec3 seed; uniform float uTime; varying float vA;
      void main() {
        float t = fract(uTime * 0.55 + seed.x);
        float r = t * (1.6 + seed.z * 1.2);
        vec3 p = vec3(cos(seed.y) * r, 5.3 + t * 2.6 - t * t * 5.0, sin(seed.y) * r);
        vA = 1.0 - t;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (40.0 + seed.z * 30.0) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform sampler2D map; varying float vA;
      void main() { vec4 c = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vec3(0.85, 0.96, 1.0), c.a * vA * 0.85); }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points };
}
