import * as THREE from 'three';
import { Builder } from '../engine/builder.js';
import { M, uniforms } from '../engine/materials.js';
import { shoreZ, ROADS, PATHS, PLAZA, POND, WORLD } from '../data/map.js';

export const WATER_Y = -0.32;

function noise2(x, z) {
  return Math.sin(x * 0.11 + Math.sin(z * 0.07) * 1.3) * 0.5 + Math.sin(z * 0.13 + x * 0.05) * 0.35 + Math.sin((x + z) * 0.31) * 0.15;
}

export function terrainHeight(x, z) {
  let h = 0;
  // rolling hills at the edges of the world
  const beachFade = Math.min(1, Math.max(0, (shoreZ(x) - 18 - z) / 20));
  const ex = Math.max(0, Math.abs(x) - 132) * beachFade;
  const ez = Math.max(0, -z - 112);
  const e = Math.max(ex, ez);
  if (e > 0) h += e * e * 0.011 + e * 0.1 * (1.2 + noise2(x * 1.7, z * 1.7));
  // gentle bumps in the park
  if (x > 60 && x < 135 && z > -100 && z < 10) h += Math.max(0, noise2(x * 0.6, z * 0.6)) * 0.5;
  // beach slope into the sea
  const s = shoreZ(x);
  const bz = z - (s - 14);
  if (bz > 0) {
    if (z < s) h -= (bz / 14) * 0.55;
    else h -= 0.55 + Math.min(4, (z - s) * 0.18);
  }
  // pond
  const pd = ((x - POND.x) / POND.rx) ** 2 + ((z - POND.z) / POND.rz) ** 2;
  if (pd < 1.6) h -= Math.max(0, 1.6 - pd) * 0.9;
  return h;
}

const GRASS = [new THREE.Color('#86cc62'), new THREE.Color('#9ed873'), new THREE.Color('#78bf57'), new THREE.Color('#aee07f')];
const SAND = new THREE.Color('#f7e2ad');
const WET = new THREE.Color('#e6c98e');
const HILL = new THREE.Color('#6fb257');

export function buildGround(scene) {
  const W = 360, D = 320, SX = 144, SZ = 128;
  const geo = new THREE.PlaneGeometry(W, D, SX, SZ);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, -5);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = terrainHeight(x, z);
    pos.setY(i, h);
    const n = noise2(x * 0.7, z * 0.7) * 0.5 + 0.5;
    const n2 = noise2(x * 2.1 + 40, z * 2.3) * 0.5 + 0.5;
    c.copy(GRASS[0]).lerp(GRASS[1], n).lerp(GRASS[2], n2 * 0.35);
    if (n2 > 0.85) c.lerp(GRASS[3], 0.5);
    if (h > 1.5) c.lerp(HILL, Math.min(0.7, (h - 1.5) / 10));
    const s = shoreZ(x);
    const sandT = THREE.MathUtils.smoothstep(z, s - 25, s - 20);
    if (sandT > 0) c.lerp(SAND, sandT);
    if (z > s - 2) c.lerp(WET, THREE.MathUtils.smoothstep(z, s - 2, s + 1));
    const pd = ((x - POND.x) / POND.rx) ** 2 + ((z - POND.z) / POND.rz) ** 2;
    if (pd < 1.5) c.lerp(SAND, THREE.MathUtils.smoothstep(1.5 - pd, 0, 0.35) * 0.8);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  ground.receiveShadow = true;
  scene.add(ground);

  // far ring so the horizon never shows a hard edge
  const far = new THREE.Mesh(new THREE.RingGeometry(150, 900, 48, 1), new THREE.MeshStandardMaterial({ color: '#77b85a', roughness: 1 }));
  far.rotation.x = -Math.PI / 2;
  far.position.set(0, -2.5, -80);
  far.scale.set(1, 0.7, 1);
  scene.add(far);
  return ground;
}

export function buildRoads(scene) {
  const b = new Builder();
  const road = '#b7aec4', line = '#fffaf0', curb = '#efe3d0', path = '#f5e4c4';
  for (const r of ROADS) {
    const [x1, z1, x2, z2] = r.rect;
    const w = x2 - x1, d = z2 - z1;
    b.box(w, 0.06, d, road, (x1 + x2) / 2, 0.0, (z1 + z2) / 2, { r: 0 });
    // curbs
    if (w > d) {
      b.box(w, 0.14, 0.5, curb, (x1 + x2) / 2, 0, z1 - 0.2, { r: 0.05 });
      b.box(w, 0.14, 0.5, curb, (x1 + x2) / 2, 0, z2 + 0.2, { r: 0.05 });
      for (let x = x1 + 2; x < x2 - 2; x += 5) b.box(2.4, 0.08, 0.25, line, x, 0.01, (z1 + z2) / 2, { r: 0 });
    } else {
      b.box(0.5, 0.14, d, curb, x1 - 0.2, 0, (z1 + z2) / 2, { r: 0.05 });
      b.box(0.5, 0.14, d, curb, x2 + 0.2, 0, (z1 + z2) / 2, { r: 0.05 });
      for (let z = z1 + 2; z < z2 - 2; z += 5) b.box(0.25, 0.08, 2.4, line, (x1 + x2) / 2, 0.01, z, { r: 0 });
    }
  }
  // zebra crossings where paths meet roads
  const zebra = (x, z, horiz) => {
    for (let i = -2; i <= 2; i++) {
      if (horiz) b.box(0.7, 0.08, 5, line, x + i * 1.2, 0.02, z, { r: 0 });
      else b.box(5, 0.08, 0.7, line, x, 0.02, z + i * 1.2, { r: 0 });
    }
  };
  zebra(0, -58, true); zebra(0, 24, true); zebra(-40, -10, false); zebra(40, -10, false); zebra(40, -22, false); zebra(30, 24, true);
  for (const p of PATHS) {
    const [x1, z1, x2, z2] = p.rect;
    b.box(x2 - x1, 0.05, z2 - z1, path, (x1 + x2) / 2, 0.02, (z1 + z2) / 2, { r: 0 });
  }
  // plaza rings
  const rings = ['#f8ead4', '#eed3b3', '#f8ead4', '#f2dcc0', '#f8ead4', '#eed3b3'];
  rings.forEach((cl, i) => {
    const r = PLAZA.r - i * 2.1;
    if (r > 0.5) b.cyl(r, r, 0.08 + i * 0.004, cl, PLAZA.x, 0.02, PLAZA.z, { seg: 48 });
  });
  const m = new THREE.Mesh(b.build({ ao: 0 }), M.std);
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

const waterVert = `
#include <fog_pars_vertex>
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const waterFrag = `
#include <fog_pars_fragment>
uniform float uTime; uniform float uNight; uniform vec3 uSunDir; uniform vec3 uShallow; uniform vec3 uDeep; uniform vec3 uSky;
uniform float uMode; uniform vec4 uPond;
varying vec3 vWorld;
void main() {
  float x = vWorld.x;
  float dist;
  if (uMode < 0.5) {
    float shore = 60.0 + sin(x * 0.031) * 5.0 + sin(x * 0.083 + 1.3) * 2.0;
    dist = vWorld.z - shore;
  } else {
    vec2 q = (vWorld.xz - uPond.xy) / uPond.zw;
    dist = (1.0 - length(q)) * uPond.w;
  }
  float depth = smoothstep(0.0, uMode < 0.5 ? 45.0 : 7.0, dist);
  vec3 col = mix(uShallow, uDeep, depth);
  // animated normal
  vec2 p = vWorld.xz;
  float t = uTime;
  vec3 n = normalize(vec3(
    sin(p.x * 0.35 + t * 1.1) * 0.08 + sin(p.x * 1.3 + p.y * 0.7 + t * 1.7) * 0.05 + sin(p.y * 2.7 - t * 2.3) * 0.02,
    1.0,
    cos(p.y * 0.3 + t * 0.9) * 0.08 + sin(p.y * 1.1 - p.x * 0.6 + t * 1.5) * 0.05 + cos(p.x * 2.9 + t * 2.1) * 0.02));
  vec3 viewDir = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - max(dot(viewDir, n), 0.0), 3.0);
  col = mix(col, uSky, fres * 0.55);
  vec3 r = reflect(-viewDir, n);
  float spec = pow(max(dot(r, normalize(uSunDir)), 0.0), 120.0);
  col += vec3(1.0, 0.97, 0.9) * spec * 1.6 * (1.0 - uNight * 0.7);
  // sparkles
  float sp = sin(p.x * 3.1 + t * 3.0) * sin(p.y * 2.7 - t * 2.4);
  col += vec3(1.0) * smoothstep(0.96, 1.0, sp) * 0.35 * (1.0 - uNight);
  // foam line on the shore
  float wob = sin(t * 1.2 + x * 0.18) * 0.7 + sin(t * 0.7 + x * 0.05) * 0.5;
  float foam = smoothstep(2.4, 0.0, dist + wob) * (0.65 + 0.35 * sin(x * 0.9 + t * 2.2));
  float foam2 = smoothstep(0.35, 0.0, abs(dist - 4.0 - wob * 1.5)) * 0.35;
  col = mix(col, vec3(1.0), clamp(foam + foam2, 0.0, 1.0) * 0.85);
  col *= (1.0 - uNight * 0.55);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

export function makeWaterMaterial(mode, pond) {
  const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uSunDir: { value: new THREE.Vector3(0.3, 0.8, 0.4) },
    uShallow: { value: new THREE.Color('#6fe0dc') },
    uDeep: { value: new THREE.Color('#2f8fd6') },
    uSky: { value: new THREE.Color('#d6f0ff') },
    uMode: { value: mode },
    uPond: { value: new THREE.Vector4(pond?.x || 0, pond?.z || 0, pond?.rx || 1, pond?.rz || 1) },
  }]);
  u.uTime = uniforms.uTime;
  u.uNight = uniforms.uNight;
  return new THREE.ShaderMaterial({ uniforms: u, vertexShader: waterVert, fragmentShader: waterFrag, fog: true });
}

export function buildWater(scene) {
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(1400, 700, 1, 1), makeWaterMaterial(0));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, WATER_Y, 380);
  scene.add(sea);
  const pondGeo = new THREE.CircleGeometry(1, 40);
  const pond = new THREE.Mesh(pondGeo, makeWaterMaterial(1, POND));
  pond.rotation.x = -Math.PI / 2;
  pond.scale.set(POND.rx + 1.2, POND.rz + 1.2, 1);
  pond.position.set(POND.x, -0.25, POND.z);
  scene.add(pond);
  return { sea, pond, mats: [sea.material, pond.material] };
}

export function clampToWorld(p) {
  p.x = Math.max(WORLD.minX, Math.min(WORLD.maxX, p.x));
  p.z = Math.max(WORLD.minZ, Math.min(WORLD.maxZ, p.z));
}
