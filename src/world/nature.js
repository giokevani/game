import * as THREE from 'three';
import { Builder, rng } from '../engine/builder.js';
import { M } from '../engine/materials.js';
import { isBlocked as blocked0, shoreZ, WORLD, PARK, POND } from '../data/map.js';

// nothing grows on the sand
const isBlocked = (x, z, pad = 0) => blocked0(x, z, pad) || z > shoreZ(x) - 21 - pad;
const isBlockedPalm = (x, z, pad = 0) => blocked0(x, z, pad);
import { terrainHeight } from './terrain.js';

export function treeGeo(kind, lod = 0) {
  const b = new Builder();
  const D = lod ? 0 : 1;
  const trunk = '#a0714f';
  if (kind === 'round') {
    b.cyl(0.28, 0.4, 2.6, trunk, 0, 0, 0, { seg: 6 });
    b.ico(1.9, '#72c05a', 0, 3.6, 0, { detail: D });
    b.ico(1.4, '#86cf68', 0.9, 4.3, 0.4, { detail: D });
    b.ico(1.3, '#63b04f', -0.9, 3.9, -0.3, { detail: D });
    b.ico(1.1, '#94d974', 0.1, 5.0, -0.2, { detail: D });
  } else if (kind === 'blossom') {
    b.cyl(0.26, 0.42, 2.4, '#8f6048', 0, 0, 0, { seg: 8 });
    b.cyl(0.14, 0.2, 1.4, '#8f6048', 0.5, 2.2, 0, { seg: 6, rz: -0.6 });
    b.ico(1.8, '#ffb3d0', 0, 3.6, 0, { detail: D });
    b.ico(1.3, '#ffc7de', 1.1, 4.0, 0.5, { detail: D });
    b.ico(1.25, '#f79cc4', -1.0, 3.8, -0.4, { detail: D });
    b.ico(1.0, '#ffd6e8', 0.2, 4.8, -0.3, { detail: D });
    b.ico(0.9, '#ffb3d0', -0.4, 4.4, 0.9, { detail: D });
  } else if (kind === 'pine') {
    b.cyl(0.22, 0.32, 1.4, trunk, 0, 0, 0, { seg: 7 });
    b.cone(1.9, 2.4, '#4f9e5c', 0, 1.1, 0, { seg: lod ? 6 : 9 });
    b.cone(1.5, 2.1, '#5aae66', 0, 2.5, 0, { seg: lod ? 6 : 9 });
    b.cone(1.05, 1.8, '#66bb70', 0, 3.8, 0, { seg: lod ? 6 : 9 });
  } else if (kind === 'palm') {
    for (let i = 0; i < 6; i++) b.cyl(0.24 - i * 0.015, 0.27 - i * 0.015, 0.9, i % 2 ? '#c49a6c' : '#b08556', i * 0.12, i * 0.85, 0, { seg: 8, rz: -0.08 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      b.add(boxNI(0.7, 0.08, 2.6), i % 2 ? '#5fbf5a' : '#4fae4f', 0.8 + Math.sin(a) * 1.1, 5.2, Math.cos(a) * 1.1, 0.45, a, 0);
    }
    b.sphere(0.25, '#8a6038', 0.6, 5.0, 0.2);
    b.sphere(0.25, '#8a6038', 0.9, 5.0, -0.1);
  } else if (kind === 'bush') {
    b.ico(0.8, '#6fbe58', 0, 0.55, 0, { detail: D });
    b.ico(0.6, '#82cc68', 0.6, 0.45, 0.2, { detail: D });
    b.ico(0.55, '#5fae4e', -0.55, 0.4, -0.1, { detail: D });
  } else if (kind === 'flowerbush') {
    b.ico(0.75, '#6fbe58', 0, 0.55, 0, { detail: D });
    b.ico(0.55, '#82cc68', 0.55, 0.45, 0.2, { detail: D });
    const c = ['#ff8fc0', '#ffffff', '#ffd45e'];
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4;
      b.sphere(0.12, c[i % 3], Math.cos(a) * 0.62, 0.5 + (i % 3) * 0.28, Math.sin(a) * 0.62, { ws: 6, hs: 5 });
    }
  } else if (kind === 'rock') {
    b.ico(0.9, '#b3adbd', 0, 0.3, 0, { detail: 0, sy: 0.7 });
    b.ico(0.55, '#9f98ab', 0.7, 0.15, 0.3, { detail: 0 });
  }
  return b.build({ ao: 0.35, aoHeight: kind === 'bush' || kind === 'flowerbush' || kind === 'rock' ? 0.6 : 2.5 });
}

function boxNI(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.deleteAttribute('uv');
  return g.toNonIndexed();
}

function grassTuft() {
  const g = new THREE.BufferGeometry();
  const pos = [], nor = [], col = [];
  const base = new THREE.Color('#7cc45a'), tip = new THREE.Color('#c9f29c');
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI + 0.3;
    const x = Math.cos(a) * 0.08, z = Math.sin(a) * 0.08;
    const w = 0.06, h = 0.24 + (i % 2) * 0.1;
    const lean = (i - 1.5) * 0.08;
    const px = Math.cos(a + 1.57) * w, pz = Math.sin(a + 1.57) * w;
    pos.push(x - px, 0, z - pz, x + px, 0, z + pz, x + lean, h, z + lean * 0.5);
    for (let k = 0; k < 3; k++) nor.push(0, 1, 0);
    col.push(base.r, base.g, base.b, base.r, base.g, base.b, tip.r, tip.g, tip.b);
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

function flowerGeo(color) {
  const b = new Builder();
  b.cyl(0.02, 0.025, 0.35, '#5ea847', 0, 0, 0, { seg: 3 });
  b.cyl(0.16, 0.1, 0.05, color, 0, 0.36, 0, { seg: 5 });
  b.cyl(0.05, 0.05, 0.03, '#ffd84a', 0, 0.41, 0, { seg: 5 });
  return b.build({ ao: 0 });
}

function scatter(count, rand, test, seedTries = 8) {
  const out = [];
  for (let i = 0; i < count; i++) {
    for (let t = 0; t < seedTries; t++) {
      const p = test(rand);
      if (p) { out.push(p); break; }
    }
  }
  return out;
}

export function buildNature(world, quality) {
  const scene = world.scene;
  const rand = rng(1234);
  const dummy = new THREE.Object3D();
  const placed = { round: [], blossom: [], pine: [], palm: [], bush: [], flowerbush: [], rock: [] };
  const add = (kind, x, z, s = 1, collide = true, far = false) => {
    placed[kind].push({ x, z, s, ry: rand() * Math.PI * 2, far });
    if (collide && kind !== 'bush' && kind !== 'flowerbush') world.addCircle(x, z, 0.55 * s);
  };

  // street trees along the roads
  for (let x = -126; x <= 130; x += 13) {
    for (const z of [-66.5, 17.5]) {
      if (!isBlocked(x, z, -0.5)) add(x % 26 === 0 ? 'blossom' : 'round', x, z, 0.95);
    }
  }
  for (let z = -48; z <= 12; z += 12) for (const x of [-47.5, 47.5]) if (!isBlocked(x, z, -0.5)) add('blossom', x, z, 0.9);
  // plaza ring of blossom trees
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.39;
    const x = Math.cos(a) * 17.5, z = -10 + Math.sin(a) * 17.5;
    if (!isBlocked(x, z, -1.2)) add('blossom', x, z, 1.05);
  }
  // park: dense and pretty
  scatter(90, rand, (r) => {
    const x = PARK.x1 + r() * (PARK.x2 - PARK.x1), z = PARK.z1 + r() * (PARK.z2 - PARK.z1);
    if (isBlocked(x, z, 1.5)) return null;
    const k = r();
    add(k < 0.4 ? 'blossom' : k < 0.8 ? 'round' : 'pine', x, z, 0.85 + r() * 0.4);
    return true;
  });
  // outer woods / hills
  scatter(280, rand, (r) => {
    const x = WORLD.minX - 10 + r() * (WORLD.maxX - WORLD.minX + 20);
    const z = WORLD.minZ - 25 + r() * (WORLD.maxZ - WORLD.minZ + 25);
    const edge = Math.max(Math.abs(x) - 118, -z - 96);
    if (edge < 0 && r() > 0.12) return null;
    if (isBlocked(x, z, 1)) return null;
    const h = terrainHeight(x, z);
    if (h < 0) return null;
    add(r() < 0.55 ? 'pine' : r() < 0.7 ? 'blossom' : 'round', x, z, 0.9 + r() * 0.7, edge < 20, edge > 6);
    return true;
  });
  // palms on the beach
  for (let x = -135; x < 140; x += 9 + rand() * 8) {
    const z = shoreZ(x) - 10 - rand() * 4;
    if (isBlockedPalm(x, z, -0.2) || Math.abs(x - 30) < 6 || Math.abs(x + 10) < 5 || x < -104) continue;
    add('palm', x, z, 0.9 + rand() * 0.3);
  }
  // bushes & rocks
  scatter(220, rand, (r) => {
    const x = -140 + r() * 280, z = -110 + r() * 170;
    if (isBlocked(x, z, 0.5)) return null;
    add(r() < 0.35 ? 'flowerbush' : 'bush', x, z, 0.7 + r() * 0.6);
    return true;
  });
  scatter(40, rand, (r) => {
    const x = -140 + r() * 280, z = -115 + r() * 190;
    if (blocked0(x, z, 0.5) && !(z > shoreZ(x) - 6 && z < shoreZ(x) + 3)) return null;
    add('rock', x, z, 0.6 + r() * 0.9, false);
    return true;
  });
  // pond rim
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    add(i % 3 ? 'rock' : 'bush', POND.x + Math.cos(a) * (POND.rx + 1.6), POND.z + Math.sin(a) * (POND.rz + 1.6), 0.6, false);
  }

  const trees = [];
  const groups = new Map();
  for (const [kind, all] of Object.entries(placed)) {
    for (const t of all) {
      const key = t.far ? `${kind}|far` : `${kind}|${Math.floor(t.x / 80)},${Math.floor(t.z / 80)}`;
      if (!groups.has(key)) groups.set(key, { kind, far: t.far, list: [] });
      groups.get(key).list.push(t);
    }
  }
  const geoCache = {};
  for (const { kind, far, list } of groups.values()) {
    const gk = kind + (far ? 1 : 0);
    const mesh = new THREE.InstancedMesh(geoCache[gk] ||= treeGeo(kind, far ? 1 : 0), M.foliage, list.length);
    list.forEach((t, i) => {
      dummy.position.set(t.x, terrainHeight(t.x, t.z) - 0.05, t.z);
      dummy.rotation.set(0, t.ry, 0);
      dummy.scale.setScalar(t.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.castShadow = kind !== 'rock' && !far;
    mesh.receiveShadow = true;
    mesh.computeBoundingSphere();
    scene.add(mesh);
    trees.push(mesh);
  }

  // grass tufts + flowers near the town
  const grassCount = Math.round(9000 * quality.grass);
  const grass = new THREE.InstancedMesh(grassTuft(), M.grass, grassCount);
  const gc = new THREE.Color();
  let gi = 0;
  const grand = rng(99);
  while (gi < grassCount) {
    const x = -140 + grand() * 280, z = -112 + grand() * 172;
    if (isBlocked(x, z, 0.2)) continue;
    dummy.position.set(x, terrainHeight(x, z), z);
    dummy.rotation.set(0, grand() * 6.28, 0);
    const s = 0.8 + grand() * 0.9;
    dummy.scale.set(s, s * (0.8 + grand() * 0.6), s);
    dummy.updateMatrix();
    grass.setMatrixAt(gi, dummy.matrix);
    gc.setHSL(0.22 + grand() * 0.08, 0.35, 0.82 + grand() * 0.14);
    grass.setColorAt(gi, gc);
    gi++;
  }
  grass.receiveShadow = true;
  grass.computeBoundingSphere();
  scene.add(grass);

  const flowers = [];
  const fcols = ['#ff8fc0', '#ffffff', '#ffd45e', '#c59bff', '#ff9a7a'];
  const frand = rng(7);
  for (const c of fcols) {
    const n = Math.round(300 * quality.grass);
    const m = new THREE.InstancedMesh(flowerGeo(c), M.foliage, n);
    let k = 0;
    while (k < n) {
      // clusters
      const cx = -140 + frand() * 280, cz = -112 + frand() * 172;
      if (isBlocked(cx, cz, 0.5)) continue;
      for (let j = 0; j < 6 && k < n; j++) {
        const x = cx + (frand() - 0.5) * 3, z = cz + (frand() - 0.5) * 3;
        if (isBlocked(x, z, 0.2)) continue;
        dummy.position.set(x, terrainHeight(x, z), z);
        dummy.rotation.set(0, frand() * 6.28, 0);
        dummy.scale.setScalar(0.9 + frand() * 0.8);
        dummy.updateMatrix();
        m.setMatrixAt(k++, dummy.matrix);
      }
    }
    m.receiveShadow = true;
    m.computeBoundingSphere();
    scene.add(m);
    flowers.push(m);
  }
  return { trees, grass, flowers };
}
