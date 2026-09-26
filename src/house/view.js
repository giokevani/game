// Turns the pure house model into meshes: patterned floors and walls (with a
// cut-away shader so you can see inside), doors, windows, hip roofs and
// merged furniture.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { M } from '../engine/materials.js';
import { Builder, shade } from '../engine/builder.js';
import * as HM from './model.js';
import { FLOOR, WALLPAPER, EXTERIOR, OPENING } from '../data/houseStyles.js';
import { FURN, PALETTE } from '../data/furniture.js';
import { HOME_PLOT } from '../data/map.js';

export const FLOOR_Y = 0.25;
export const ORIGIN = { x: HOME_PLOT.cx - HM.MAXP, z: HOME_PLOT.front - HM.MAXP * HM.TILE };
const T = HM.TILE;
const WH = HM.WALL_H;
const TRIM = '#ffffff';

export const houseUniforms = {
  uFocus: { value: new THREE.Vector3() },
  uCamPos: { value: new THREE.Vector3() },
  uCutMode: { value: 0 },
  uCutH: { value: 1.0 },
};

const PATTERN_GLSL = `
float bbHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float bbNoise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(bbHash(i),bbHash(i+vec2(1,0)),u.x), mix(bbHash(i+vec2(0,1)),bbHash(i+vec2(1,1)),u.x), u.y); }
vec3 bbHsv(vec3 c){ vec4 K = vec4(1., 2./3., 1./3., 3.); vec3 p = abs(fract(c.xxx + K.xyz) * 6. - K.www); return c.z * mix(K.xxx, clamp(p - K.xxx, 0., 1.), c.y); }
float bbHeart(vec2 p){ p.x = abs(p.x);
  if (p.y + p.x > 1.0) return sqrt(dot(p - vec2(0.25,0.75), p - vec2(0.25,0.75))) - sqrt(2.0)/4.0;
  vec2 q = p - 0.5*max(p.x+p.y,0.0);
  return sqrt(min(dot(p - vec2(0.,1.), p - vec2(0.,1.)), dot(q,q))) * sign(p.x-p.y); }
float bbStar(vec2 p, float r, float rf){
  const vec2 k1 = vec2(0.809016994375, -0.587785252292); const vec2 k2 = vec2(-k1.x,k1.y);
  p.x = abs(p.x); p -= 2.0*max(dot(k1,p),0.0)*k1; p -= 2.0*max(dot(k2,p),0.0)*k2; p.x = abs(p.x); p.y -= r;
  vec2 ba = rf*vec2(-k1.y,k1.x) - vec2(0,1); float h = clamp(dot(p,ba)/dot(ba,ba), 0.0, r);
  return length(p-ba*h) * sign(p.y*ba.x-p.x*ba.y); }
vec3 bbPattern(vec3 c, float pat, vec3 wp, vec3 n) {
  int p = int(pat + 0.5);
  if (p == 0) return c;
  vec2 uv = abs(n.y) > 0.5 ? wp.xz : (abs(n.x) > 0.5 ? vec2(wp.z, wp.y) : vec2(wp.x, wp.y));
  vec3 lt = mix(c, vec3(1.0), 0.6);
  if (p == 1) return mix(c, lt, step(0.5, fract(uv.x * 2.5)) * 0.75);
  if (p == 2) { vec2 q = uv * 3.0; q.y += 0.5 * mod(floor(q.x), 2.0); vec2 g = fract(q) - 0.5; return mix(c, lt, smoothstep(0.2, 0.15, length(g))); }
  if (p == 3) { vec2 q = floor(uv * 2.0); float ch = mod(q.x + q.y, 2.0); vec2 f = fract(uv * 2.0); float gr = step(min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)), 0.025);
    return mix(mix(c, c * 0.8, ch), vec3(0.95), gr * 0.6); }
  if (p == 4) { float row = floor(uv.y * 5.0); float u2 = uv.x + bbHash(vec2(row, 3.1)) * 3.0; float plank = floor(u2 / 1.3);
    float v = 0.9 + 0.16 * bbHash(vec2(row, plank)); vec3 col = c * v;
    col *= 1.0 - 0.06 * bbNoise(vec2(u2 * 6.0, uv.y * 60.0));
    float seam = step(fract(uv.y * 5.0), 0.05) + step(fract(u2 / 1.3), 0.012); return mix(col, c * 0.62, clamp(seam, 0.0, 1.0)); }
  if (p == 5) { vec2 f = fract(uv * 2.0); float gr = step(min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)), 0.03);
    return mix(c * (0.95 + 0.07 * bbHash(floor(uv * 2.0))), vec3(1.0), gr * 0.55); }
  if (p == 6) { vec2 q = uv * vec2(3.3, 8.0); q.x += 0.5 * mod(floor(q.y), 2.0); vec2 f = fract(q);
    float m = step(f.y, 0.1) + step(f.x, 0.05); vec3 b = c * (0.88 + 0.18 * bbHash(floor(q))); return mix(b, vec3(0.96, 0.93, 0.9), clamp(m, 0.0, 1.0)); }
  if (p == 7) { vec2 q = uv * 2.5; q.x += 0.5 * mod(floor(q.y), 2.0); vec2 g = (fract(q) - vec2(0.5, 0.3)) * 3.2; float d = bbHeart(g);
    return mix(c, mix(c, vec3(1.0, 0.45, 0.65), 0.7), smoothstep(0.03, -0.03, d)); }
  if (p == 8) { vec2 q = uv * 2.5; q.x += 0.5 * mod(floor(q.y), 2.0); vec2 g = fract(q) - 0.5; float d = bbStar(g, 0.2, 0.45);
    return mix(c, vec3(1.0, 0.93, 0.55), smoothstep(0.02, -0.02, d)); }
  if (p == 9) { float y = wp.y; if (abs(n.y) > 0.5) return c;
    if (y < 1.3) { vec3 pc = mix(c, vec3(1.0), 0.45); float fx = fract(uv.x * 1.4); float frame = step(fx, 0.06) + step(1.0 - fx, 0.06) + step(abs(y - 0.72), 0.36) * 0.0;
      float inset = step(0.12, fx) * step(fx, 0.88) * step(0.45, y) * step(y, 1.1); pc = mix(pc, pc * 0.9, inset * (1.0 - step(0.16, fx) * step(fx, 0.84) * step(0.49, y) * step(y, 1.06)));
      return mix(pc, pc * 0.85, step(abs(y - 1.27), 0.03)); }
    return c; }
  if (p == 10) return mix(c, lt, step(0.5, fract((uv.x + uv.y) * 2.0)) * 0.7);
  if (p == 11) { vec2 q = uv * 2.2; q.x += 0.5 * mod(floor(q.y), 2.0); vec2 g = fract(q) - 0.5; float a = atan(g.y, g.x); float r = length(g);
    float petal = 0.14 + 0.07 * cos(a * 5.0); vec3 pc = mix(vec3(1.0, 0.6, 0.78), vec3(0.75, 0.65, 1.0), step(0.5, bbHash(floor(q))));
    vec3 col = mix(c, pc, smoothstep(petal + 0.02, petal, r)); return mix(col, vec3(1.0, 0.86, 0.35), smoothstep(0.055, 0.04, r)); }
  if (p == 12) return c * (0.93 + 0.1 * bbNoise(uv * 38.0));
  if (p == 13) { float v = sin(uv.x * 2.5 + bbNoise(uv * 2.0) * 5.0 + uv.y * 1.5); float vein = smoothstep(0.96, 1.0, abs(v));
    return mix(c * (0.97 + 0.04 * bbNoise(uv * 9.0)), vec3(0.78, 0.76, 0.82), vein * 0.6); }
  if (p == 14) { if (abs(n.y) > 0.5) return c; float f = fract(wp.y * 4.0); return c * (0.86 + 0.16 * smoothstep(0.0, 0.9, f)) * (1.0 - 0.18 * step(f, 0.06)); }
  if (p == 15) { vec2 cell = floor(uv * 2.5); vec2 f = fract(uv * 2.5); float flip = mod(cell.x + cell.y, 2.0);
    float s = flip > 0.5 ? f.x : f.y; float pl = floor(s * 4.0); vec3 col = c * (0.9 + 0.14 * bbHash(cell * 7.0 + pl));
    return mix(col, c * 0.7, step(fract(s * 4.0), 0.07)); }
  if (p == 16) { float h = fract((uv.x + uv.y) * 0.3); return bbHsv(vec3(h, 0.32, 1.0)); }
  if (p == 17) { float f = fract(wp.y * 5.0); float row = floor(wp.y * 5.0); float u = (abs(n.x) > abs(n.z) ? wp.z : wp.x) * 3.0 + row * 0.5;
    float sc = length(vec2(fract(u) - 0.5, f * 0.9)); return c * (0.8 + 0.25 * smoothstep(0.0, 1.0, f)) * (1.0 - 0.15 * smoothstep(0.52, 0.56, sc)); }
  return c;
}`;

function makeHouseMaterial(o = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, side: o.side ?? THREE.FrontSide, ...o.mat });
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, houseUniforms);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', `#include <common>
attribute float aPat; attribute vec2 aWallC; varying float vPat; varying vec2 vWallC; varying vec3 vWPos; varying vec3 vWN;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vPat = aPat; vWallC = aWallC; vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);`);
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
uniform vec3 uFocus; uniform vec3 uCamPos; uniform float uCutMode; uniform float uCutH;
varying float vPat; varying vec2 vWallC; varying vec3 vWPos; varying vec3 vWN;
${PATTERN_GLSL}`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
if (uCutMode > 0.5 && vWallC.x > -9000.0) {
  if (uCutMode > 1.5) { if (vWPos.y > uCutH) discard; }
  else {
    vec2 toW = vWallC - uFocus.xz; vec2 toC = uCamPos.xz - uFocus.xz;
    if (dot(toW, normalize(toC)) > 0.35 && vWPos.y > uCutH) discard;
  }
}`)
      .replace('#include <color_fragment>', `#include <color_fragment>
diffuseColor.rgb = bbPattern(diffuseColor.rgb, vPat, vWPos, normalize(vWN));
if (!gl_FrontFacing) diffuseColor.rgb = vec3(0.93, 0.9, 0.92);`);
  };
  m.customProgramCacheKey = () => 'house' + (o.side ?? 0) + (o.mat?.transparent ? 't' : '');
  return m;
}

export const HMAT = {
  wall: makeHouseMaterial({ side: THREE.DoubleSide }),
  floor: makeHouseMaterial(),
  roof: makeHouseMaterial({ side: THREE.DoubleSide }),
  glass: makeHouseMaterial({ mat: { transparent: true, opacity: 0.42, depthWrite: false, roughness: 0.08 } }),
};

// ---------- geometry writer with custom attributes ----------
const boxCache = new Map();
function boxGeo(w, h, d) {
  const k = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
  let g = boxCache.get(k);
  if (!g) { g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); boxCache.set(k, g); }
  return g;
}
const tmpC = new THREE.Color();

class GW {
  constructor() { this.pos = []; this.nor = []; this.col = []; this.pat = []; this.wc = []; }
  push(p, n, color, pat, wc) {
    tmpC.set(color);
    for (let i = 0; i < p.length; i += 3) {
      this.pos.push(p[i], p[i + 1], p[i + 2]);
      this.nor.push(n[i], n[i + 1], n[i + 2]);
      this.col.push(tmpC.r, tmpC.g, tmpC.b);
      this.pat.push(pat);
      this.wc.push(wc ? wc[0] : -9999, wc ? wc[1] : -9999);
    }
  }
  // axis-aligned box centred at (x,y,z), optionally rotated 90deg (swap)
  box(w, h, d, x, y, z, color, pat = 0, wc = null) {
    const g = boxGeo(w, h, d);
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    const pp = new Float32Array(p.length);
    for (let i = 0; i < p.length; i += 3) { pp[i] = p[i] + x; pp[i + 1] = p[i + 1] + y; pp[i + 2] = p[i + 2] + z; }
    this.push(pp, n, color, pat, wc);
  }
  tri(a, b, c, color, pat = 0) {
    const ab = new THREE.Vector3().subVectors(b, a), ac = new THREE.Vector3().subVectors(c, a);
    const n = ab.cross(ac).normalize();
    this.push([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z], [n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z], color, pat, null);
  }
  quad(a, b, c, d, color, pat = 0) { this.tri(a, b, c, color, pat); this.tri(a, c, d, color, pat); }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aPat', new THREE.Float32BufferAttribute(this.pat, 1));
    g.setAttribute('aWallC', new THREE.Float32BufferAttribute(this.wc, 2));
    g.computeBoundingSphere();
    return g;
  }
}

// ---------- furniture model cache ----------
const itemCache = new Map();
export function itemGeometries(id, c) {
  const item = FURN[id];
  const color = PALETTE[c ?? item.c] || PALETTE[0];
  const key = id + '|' + color;
  if (itemCache.has(key)) return itemCache.get(key);
  const p = { std: new Builder(), glow: new Builder(), gloss: new Builder(), glowAlways: new Builder(), metal: new Builder() };
  item.m(p, color);
  const out = {};
  for (const k of Object.keys(p)) if (p[k].parts.length) out[k] = p[k].build({ ao: k === 'std' ? 0.18 : 0, aoHeight: Math.max(0.3, item.h * 0.6) });
  itemCache.set(key, out);
  return out;
}

export function itemGroup(id, c) {
  const g = new THREE.Group();
  const geos = itemGeometries(id, c);
  for (const [k, geo] of Object.entries(geos)) {
    const m = new THREE.Mesh(geo, M[k]);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  return g;
}

const tmpM4 = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const UPV = new THREE.Vector3(0, 1, 0);

export class HouseView {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.group = new THREE.Group();
    this.group.position.set(ORIGIN.x, 0, ORIGIN.z);
    scene.add(this.group);
    this.struct = new THREE.Group();
    this.furn = new THREE.Group();
    this.group.add(this.struct, this.furn);
    this.doors = [];
    this.roofMesh = null;
    this.furnColliders = [];
    this.house = null;
    this.buildMode = false;
    this.makeGrid();
    this.platform = world.addPlatform({ test: (x, z) => this.house && HM.insideHouse(this.house, x - ORIGIN.x, z - ORIGIN.z), y: FLOOR_Y });
  }

  toLocal(v) { return { x: v.x - ORIGIN.x, z: v.z - ORIGIN.z }; }
  toWorld(x, z) { return { x: x + ORIGIN.x, z: z + ORIGIN.z }; }

  makeGrid() {
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uOrigin: { value: new THREE.Vector2(ORIGIN.x, ORIGIN.z) } },
      vertexShader: 'uniform vec2 uOrigin; varying vec2 vP; void main(){ vP = (modelMatrix * vec4(position,1.0)).xz - uOrigin; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `varying vec2 vP; void main(){
        vec2 f = fract(vP / 2.0); float t = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
        vec2 f2 = fract(vP / 0.5); float t2 = min(min(f2.x, 1.0 - f2.x), min(f2.y, 1.0 - f2.y));
        float a = smoothstep(0.03, 0.0, t) * 0.75 + smoothstep(0.06, 0.0, t2) * 0.18;
        gl_FragColor = vec4(1.0, 1.0, 1.0, a); }`,
    });
    const g = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    this.grid = new THREE.Mesh(g, mat);
    this.grid.renderOrder = 5;
    this.grid.visible = false;
    this.group.add(this.grid);
    // tile hover highlight
    this.hover = new THREE.Mesh(new THREE.PlaneGeometry(T, T).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x7fffd0, transparent: true, opacity: 0.45, depthWrite: false }));
    this.hover.renderOrder = 6;
    this.hover.visible = false;
    this.group.add(this.hover);
    this.edgeHover = new THREE.Mesh(new THREE.BoxGeometry(T, 3.1, 0.3), new THREE.MeshBasicMaterial({ color: 0x7fffd0, transparent: true, opacity: 0.5, depthWrite: false }));
    this.edgeHover.renderOrder = 6;
    this.edgeHover.visible = false;
    this.group.add(this.edgeHover);
  }

  setGrid(on, size) {
    this.grid.visible = on;
    if (on) {
      const r = HM.plotRange(size);
      const w = (r.i1 - r.i0) * T, d = (r.j1 - r.j0) * T;
      this.grid.scale.set(w, 1, d);
      this.grid.position.set((r.i0 * T + r.i1 * T) / 2, FLOOR_Y + 0.03, (r.j0 * T + r.j1 * T) / 2);
    }
  }

  showTile(i, j, color = 0x7fffd0) {
    if (i === null) { this.hover.visible = false; return; }
    this.hover.visible = true;
    this.hover.material.color.setHex(color);
    this.hover.position.set((i + 0.5) * T, FLOOR_Y + 0.05, (j + 0.5) * T);
  }

  showEdge(key, color = 0x7fffd0) {
    if (!key) { this.edgeHover.visible = false; return; }
    const { t, i, j } = HM.edgeTiles(key);
    this.edgeHover.visible = true;
    this.edgeHover.material.color.setHex(color);
    if (t === 'h') { this.edgeHover.position.set((i + 0.5) * T, FLOOR_Y + 1.5, j * T); this.edgeHover.rotation.y = 0; }
    else { this.edgeHover.position.set(i * T, FLOOR_Y + 1.5, (j + 0.5) * T); this.edgeHover.rotation.y = Math.PI / 2; }
  }

  rebuild(house, excludeUid = null) {
    this.house = house;
    this.rebuildStructure(house);
    this.rebuildFurniture(house, excludeUid);
  }

  clearGroup(g) {
    for (const c of [...g.children]) {
      g.remove(c);
      c.traverse?.((o) => { if (o.geometry && !o.userData.keepGeo) o.geometry.dispose(); });
    }
  }

  rebuildStructure(h) {
    this.clearGroup(this.struct);
    this.world.removeTagged('house');
    this.doors = [];
    const floor = new GW(), walls = new GW(), roof = new GW();
    const glass = new GW();

    // floors + foundation
    for (const [k, t] of Object.entries(h.tiles)) {
      const [i, j] = k.split(',').map(Number);
      const f = FLOOR[t.f] || FLOOR.fl_oak;
      floor.box(T, FLOOR_Y, T, (i + 0.5) * T, FLOOR_Y / 2, (j + 0.5) * T, f.color, f.pat);
    }
    const ex = EXTERIOR[h.ext] || EXTERIOR.ex_cream;

    // walls
    const posts = new Set();
    for (const e of HM.allWallEdges(h)) {
      const horiz = e.t === 'h';
      const cx = horiz ? (e.i + 0.5) * T : e.i * T;
      const cz = horiz ? e.j * T : (e.j + 0.5) * T;
      const wc = [cx + ORIGIN.x, cz + ORIGIN.z];
      const side = (tile, dir) => {
        const tt = h.tiles[HM.tkey(tile[0], tile[1])];
        if (!tt) return { color: ex.color, pat: ex.pat };
        const wp = WALLPAPER[tt.w[dir]] || WALLPAPER.wp_cream;
        return { color: wp.color, pat: wp.pat };
      };
      // side A = north/west, side B = south/east
      const sA = side(e.a, horiz ? 2 : 1), sB = side(e.b, horiz ? 0 : 3);
      const op = e.open ? OPENING[e.open] : null;
      // pieces along the edge: [from, to, yFrom, yTo] in edge-local coords (-1..1 along, 0..WH up)
      let pieces = [[-1, 1, 0, WH]];
      if (op) {
        if (op.kind === 'door' || op.kind === 'arch') {
          const hw = op.kind === 'arch' ? 0.7 : 0.55, hh = op.kind === 'arch' ? 2.45 : 2.25;
          pieces = [[-1, -hw, 0, WH], [hw, 1, 0, WH], [-hw, hw, hh, WH]];
        } else {
          const hw = op.w / 2, y0 = op.y, y1 = op.y + op.h;
          pieces = [[-1, -hw, 0, WH], [hw, 1, 0, WH], [-hw, hw, 0, y0], [-hw, hw, y1, WH]];
        }
      }
      const put = (a, b, y0, y1, off, s) => {
        const len = b - a, mid = (a + b) / 2;
        const hgt = y1 - y0;
        if (len <= 0.001 || hgt <= 0.001) return;
        if (horiz) walls.box(len, hgt, 0.1, cx + mid, FLOOR_Y + y0 + hgt / 2, cz + off, s.color, s.pat, wc);
        else walls.box(0.1, hgt, len, cx + off, FLOOR_Y + y0 + hgt / 2, cz + mid, s.color, s.pat, wc);
      };
      for (const [a, b, y0, y1] of pieces) {
        put(a, b, y0, y1, -0.05, sA);
        put(a, b, y0, y1, 0.05, sB);
      }
      // top trim
      if (horiz) walls.box(T, 0.08, 0.24, cx, FLOOR_Y + WH + 0.04, cz, TRIM, 0, wc);
      else walls.box(0.24, 0.08, T, cx, FLOOR_Y + WH + 0.04, cz, TRIM, 0, wc);
      // skirting boards inside
      for (const [s, off] of [[sA, -0.11], [sB, 0.11]]) {
        if (s.pat === ex.pat && s.color === ex.color && e.exterior && ((off < 0 && !e.ha) || (off > 0 && !e.hb))) continue;
        for (const [a, b, y0] of pieces) {
          if (y0 > 0) continue;
          const len = b - a, mid = (a + b) / 2;
          if (horiz) walls.box(len, 0.12, 0.03, cx + mid, FLOOR_Y + 0.06, cz + off, TRIM, 0, wc);
          else walls.box(0.03, 0.12, len, cx + off, FLOOR_Y + 0.06, cz + mid, TRIM, 0, wc);
        }
      }
      // posts at both ends
      const ends = horiz ? [[e.i * T, e.j * T], [(e.i + 1) * T, e.j * T]] : [[e.i * T, e.j * T], [e.i * T, (e.j + 1) * T]];
      for (const [px, pz] of ends) {
        const k = px + ',' + pz;
        if (posts.has(k)) continue;
        posts.add(k);
        walls.box(0.26, WH + 0.02, 0.26, px, FLOOR_Y + WH / 2, pz, e.exterior ? shade(ex.color, 1.04) : TRIM, 0, [px + ORIGIN.x, pz + ORIGIN.z]);
      }
      // colliders (skip the doorway)
      const wx = ORIGIN.x, wz = ORIGIN.z;
      const walk = op && (op.kind === 'door' || op.kind === 'arch');
      const segs = walk ? [[-1, op.kind === 'arch' ? -0.7 : -0.55], [op.kind === 'arch' ? 0.7 : 0.55, 1]] : [[-1, 1]];
      for (const [a, b] of segs) {
        if (horiz) this.world.addBox(wx + cx + a - 0.02, wz + cz - 0.14, wx + cx + b + 0.02, wz + cz + 0.14, { tag: 'house' });
        else this.world.addBox(wx + cx - 0.14, wz + cz + a - 0.02, wx + cx + 0.14, wz + cz + b + 0.02, { tag: 'house' });
      }
      // openings: frames, glass, doors
      if (op) this.buildOpening(op, e, cx, cz, horiz, walls, glass, wc);
    }

    // foundation skirt around the house
    for (const e of HM.allWallEdges(h)) {
      if (!e.exterior) continue;
      const horiz = e.t === 'h';
      const out = (horiz ? (e.ha ? 1 : -1) : (e.ha ? 1 : -1)) * 0.16;
      if (horiz) floor.box(T + 0.3, FLOOR_Y + 0.06, 0.2, (e.i + 0.5) * T, (FLOOR_Y + 0.06) / 2 - 0.03, e.j * T + out, '#e6ddd2', 5);
      else floor.box(0.2, FLOOR_Y + 0.06, T + 0.3, e.i * T + out, (FLOOR_Y + 0.06) / 2 - 0.03, (e.j + 0.5) * T, '#e6ddd2', 5);
    }

    this.buildRoof(h, roof);

    const fm = new THREE.Mesh(floor.geo(), HMAT.floor);
    fm.receiveShadow = true; fm.castShadow = false;
    const wm = new THREE.Mesh(walls.geo(), HMAT.wall);
    wm.receiveShadow = true; wm.castShadow = true;
    this.struct.add(fm, wm);
    if (glass.pos.length) { const gm = new THREE.Mesh(glass.geo(), HMAT.glass); gm.renderOrder = 3; this.struct.add(gm); }
    if (roof.pos.length) {
      this.roofMesh = new THREE.Mesh(roof.geo(), HMAT.roof);
      this.roofMesh.castShadow = true;
      this.roofMesh.receiveShadow = true;
      this.struct.add(this.roofMesh);
    } else this.roofMesh = null;
    this.buildPlotFence(h);
  }

  buildOpening(op, e, cx, cz, horiz, walls, glass, wc) {
    const place = (g, w, hh, d, color, along, y, off = 0) => {
      if (horiz) g.box(w, hh, d, cx + along, y, cz + off, color, 0, wc);
      else g.box(d, hh, w, cx + off, y, cz + along, color, 0, wc);
    };
    if (op.kind === 'window') {
      const hw = op.w / 2, y0 = FLOOR_Y + op.y, y1 = y0 + op.h;
      place(glass, op.w, op.h, 0.04, '#cfefff', 0, (y0 + y1) / 2);
      place(walls, op.w + 0.16, 0.1, 0.26, TRIM, 0, y1 + 0.05);
      place(walls, op.w + 0.24, 0.1, 0.34, TRIM, 0, y0 - 0.05);
      place(walls, 0.08, op.h, 0.26, TRIM, -hw - 0.04, (y0 + y1) / 2);
      place(walls, 0.08, op.h, 0.26, TRIM, hw + 0.04, (y0 + y1) / 2);
      place(walls, op.w, 0.05, 0.08, TRIM, 0, (y0 + y1) / 2);
      place(walls, 0.05, op.h, 0.08, TRIM, 0, (y0 + y1) / 2);
    } else {
      const arch = op.kind === 'arch';
      const hw = arch ? 0.7 : 0.55, hh = arch ? 2.45 : 2.25;
      place(walls, hw * 2 + 0.2, 0.12, 0.28, TRIM, 0, FLOOR_Y + hh + 0.06);
      place(walls, 0.1, hh, 0.28, TRIM, -hw - 0.05, FLOOR_Y + hh / 2);
      place(walls, 0.1, hh, 0.28, TRIM, hw + 0.05, FLOOR_Y + hh / 2);
      if (!arch) {
        // door leaf on a hinge
        const leaf = new Builder();
        const col = op.color;
        leaf.box(1.08, 2.2, 0.07, col, 0.54, 0, 0, { r: 0.03 });
        if (op.glass) leaf.box(0.8, 1.6, 0.09, '#cfefff', 0.54, 0.4, 0, { r: 0.02 });
        else {
          leaf.box(0.78, 0.8, 0.09, shade(col, 0.92), 0.54, 1.2, 0, { r: 0.02 });
          leaf.box(0.78, 0.8, 0.09, shade(col, 0.92), 0.54, 0.2, 0, { r: 0.02 });
        }
        leaf.sphere(0.06, '#ffd36b', 0.95, 1.05, 0.08);
        leaf.sphere(0.06, '#ffd36b', 0.95, 1.05, -0.08);
        const g = leaf.build({ ao: 0 });
        const n = g.attributes.position.count;
        g.setAttribute('aPat', new THREE.Float32BufferAttribute(new Float32Array(n), 1));
        const wca = new Float32Array(n * 2);
        for (let k = 0; k < n; k++) { wca[k * 2] = wc[0]; wca[k * 2 + 1] = wc[1]; }
        g.setAttribute('aWallC', new THREE.Float32BufferAttribute(wca, 2));
        const pivot = new THREE.Group();
        const m = new THREE.Mesh(g, HMAT.wall);
        m.castShadow = true;
        pivot.add(m);
        if (horiz) pivot.position.set(cx - 0.54, FLOOR_Y, cz);
        else { pivot.position.set(cx, FLOOR_Y, cz + 0.54); pivot.rotation.y = Math.PI / 2; }
        pivot.userData = { base: pivot.rotation.y, open: 0, wx: cx + ORIGIN.x, wz: cz + ORIGIN.z };
        this.struct.add(pivot);
        this.doors.push(pivot);
      }
    }
  }

  buildRoof(h, gw) {
    // greedy rectangles over the floor tiles
    const covered = new Set();
    const keys = Object.keys(h.tiles).map((k) => k.split(',').map(Number)).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const rects = [];
    for (const [i, j] of keys) {
      if (covered.has(i + ',' + j)) continue;
      let w = 1;
      while (h.tiles[(i + w) + ',' + j] && !covered.has((i + w) + ',' + j)) w++;
      let d = 1;
      outer: while (true) {
        for (let x = i; x < i + w; x++) if (!h.tiles[x + ',' + (j + d)] || covered.has(x + ',' + (j + d))) break outer;
        d++;
      }
      for (let x = i; x < i + w; x++) for (let z = j; z < j + d; z++) covered.add(x + ',' + z);
      rects.push([i, j, w, d]);
    }
    const roofCol = h.roof;
    const yb = FLOOR_Y + WH + 0.08;
    const o = 0.4;
    let biggest = null;
    for (const [i, j, w, d] of rects) {
      const x0 = i * T - o, x1 = (i + w) * T + o, z0 = j * T - o, z1 = (j + d) * T + o;
      const W = x1 - x0, D = z1 - z0;
      const hr = Math.min(W, D) * 0.36;
      const V = (x, y, z) => new THREE.Vector3(x, y, z);
      if (W >= D) {
        const zc = (z0 + z1) / 2, ra = x0 + D / 2, rb = x1 - D / 2;
        gw.quad(V(x0, yb, z1), V(x1, yb, z1), V(rb, yb + hr, zc), V(ra, yb + hr, zc), roofCol, 17);
        gw.quad(V(x1, yb, z0), V(x0, yb, z0), V(ra, yb + hr, zc), V(rb, yb + hr, zc), roofCol, 17);
        gw.tri(V(x0, yb, z0), V(x0, yb, z1), V(ra, yb + hr, zc), roofCol, 17);
        gw.tri(V(x1, yb, z1), V(x1, yb, z0), V(rb, yb + hr, zc), roofCol, 17);
      } else {
        const xc = (x0 + x1) / 2, ra = z0 + W / 2, rb = z1 - W / 2;
        gw.quad(V(x0, yb, z0), V(x0, yb, z1), V(xc, yb + hr, rb), V(xc, yb + hr, ra), roofCol, 17);
        gw.quad(V(x1, yb, z1), V(x1, yb, z0), V(xc, yb + hr, ra), V(xc, yb + hr, rb), roofCol, 17);
        gw.tri(V(x1, yb, z0), V(x0, yb, z0), V(xc, yb + hr, ra), roofCol, 17);
        gw.tri(V(x0, yb, z1), V(x1, yb, z1), V(xc, yb + hr, rb), roofCol, 17);
      }
      // eaves trim
      gw.box(W, 0.14, 0.14, (x0 + x1) / 2, yb - 0.02, z0, TRIM);
      gw.box(W, 0.14, 0.14, (x0 + x1) / 2, yb - 0.02, z1, TRIM);
      gw.box(0.14, 0.14, D, x0, yb - 0.02, (z0 + z1) / 2, TRIM);
      gw.box(0.14, 0.14, D, x1, yb - 0.02, (z0 + z1) / 2, TRIM);
      if (!biggest || w * d > biggest[2] * biggest[3]) biggest = [i, j, w, d, hr];
    }
    if (biggest) {
      const [i, j, w, d] = biggest;
      const cx = (i + w * 0.72) * T, cz = (j + d * 0.35) * T;
      gw.box(0.7, 2.6, 0.7, cx, yb + 1.1, cz, '#e3a08f', 6);
      gw.box(0.86, 0.18, 0.86, cx, yb + 2.45, cz, '#cf8a79');
    }
  }

  buildPlotFence(h) {
    const r = HM.plotRange(h.size);
    const b = new Builder();
    const x0 = r.i0 * T, x1 = r.i1 * T, z0 = r.j0 * T, z1 = r.j1 * T;
    const post = (x, z) => b.box(0.14, 0.75, 0.14, '#ffffff', x, 0, z, { r: 0.03 });
    const rail = (xa, za, xb, zb) => {
      const len = Math.hypot(xb - xa, zb - za);
      const ry = Math.atan2(zb - za, xb - xa);
      for (const y of [0.3, 0.6]) b.add(new THREE.BoxGeometry(len, 0.08, 0.06).toNonIndexed().deleteAttribute('uv'), '#ffffff', (xa + xb) / 2, y, (za + zb) / 2, 0, -ry, 0);
    };
    const gateL = (x0 + x1) / 2 - 2.5, gateR = (x0 + x1) / 2 + 2.5;
    for (let x = x0; x <= x1 + 0.01; x += 2) { post(x, z0); if (x <= gateL + 0.01 || x >= gateR - 0.01) post(x, z1); }
    for (let z = z0 + 2; z < z1 - 0.01; z += 2) { post(x0, z); post(x1, z); }
    rail(x0, z0, x1, z0); rail(x0, z0, x0, z1); rail(x1, z0, x1, z1);
    rail(x0, z1, gateL, z1); rail(gateR, z1, x1, z1);
    // stepping-stone path from the gate to the street
    for (let k = 0; k < 3; k++) b.box(1.6, 0.06, 0.7, '#efe3cf', (x0 + x1) / 2, 0, z1 + 0.6 + k * 0.95, { r: 0.1 });
    const m = new THREE.Mesh(b.build({ ao: 0.2, aoHeight: 0.6 }), M.std);
    m.castShadow = true; m.receiveShadow = true;
    this.struct.add(m);
    const wx = ORIGIN.x, wz = ORIGIN.z;
    this.world.addBox(wx + x0 - 0.1, wz + z0 - 0.1, wx + x1 + 0.1, wz + z0 + 0.1, { tag: 'house' });
    this.world.addBox(wx + x0 - 0.1, wz + z0, wx + x0 + 0.1, wz + z1, { tag: 'house' });
    this.world.addBox(wx + x1 - 0.1, wz + z0, wx + x1 + 0.1, wz + z1, { tag: 'house' });
    this.world.addBox(wx + x0, wz + z1 - 0.1, wx + gateL, wz + z1 + 0.1, { tag: 'house' });
    this.world.addBox(wx + gateR, wz + z1 - 0.1, wx + x1, wz + z1 + 0.1, { tag: 'house' });
  }

  rebuildFurniture(h, excludeUid = null) {
    this.clearGroup(this.furn);
    this.world.removeTagged('furn');
    const buckets = {};
    for (const f of h.furniture) {
      if (f.uid === excludeUid) continue;
      const item = FURN[f.id];
      if (!item) continue;
      const geos = itemGeometries(f.id, f.c);
      const base = this.baseY(f, item);
      tmpQ.setFromAxisAngle(UPV, f.r * Math.PI / 2);
      tmpM4.compose(new THREE.Vector3(f.x, base, f.z), tmpQ, new THREE.Vector3(1, 1, 1));
      for (const [k, g] of Object.entries(geos)) {
        const c = g.clone();
        c.applyMatrix4(tmpM4);
        (buckets[k] ||= []).push(c);
      }
      // solid furniture blocks walking
      if (item.place === 'floor' && item.h > 0.35 && !(f.y > 0.01) && item.fp[0] * item.fp[1] > 0.2 && !['bounce'].includes(item.use)) {
        const bx = HM.itemBox(item, f.x, f.z, f.r);
        const pad = 0.08;
        this.world.addBox(ORIGIN.x + bx.x0 + pad, ORIGIN.z + bx.z0 + pad, ORIGIN.x + bx.x1 - pad, ORIGIN.z + bx.z1 - pad, { tag: 'furn', top: base + Math.min(item.h, 0.6) });
      }
    }
    for (const [k, list] of Object.entries(buckets)) {
      const g = mergeGeometries(list, false);
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, M[k]);
      m.castShadow = true;
      m.receiveShadow = true;
      this.furn.add(m);
    }
  }

  // world-y of the bottom of a placed item (plot local)
  baseY(f, item) {
    const inside = this.house && HM.insideHouse(this.house, f.x, f.z);
    if (item.place === 'wall') return FLOOR_Y + (f.y ?? item.y ?? 1.5);
    return (inside ? FLOOR_Y : 0.02) + (f.y || 0);
  }

  update(dt, playerPos, camera, mode) {
    // doors swing open when someone is close
    for (const d of this.doors) {
      const near = mode === 'play' && Math.hypot(playerPos.x - d.userData.wx, playerPos.z - d.userData.wz) < 2.2;
      d.userData.open += ((near ? 1 : 0) - d.userData.open) * Math.min(1, dt * 6);
      d.rotation.y = d.userData.base - d.userData.open * 1.45;
    }
    const inside = this.house && HM.insideHouse(this.house, playerPos.x - ORIGIN.x, playerPos.z - ORIGIN.z) && playerPos.y < FLOOR_Y + 2.5;
    this.playerInside = inside;
    houseUniforms.uFocus.value.copy(playerPos);
    houseUniforms.uCamPos.value.copy(camera.position);
    if (mode === 'build') { houseUniforms.uCutMode.value = 2; houseUniforms.uCutH.value = FLOOR_Y + 0.9; }
    else if (inside) { houseUniforms.uCutMode.value = 1; houseUniforms.uCutH.value = FLOOR_Y + 0.95; }
    else houseUniforms.uCutMode.value = 0;
    if (this.roofMesh) this.roofMesh.visible = !(mode === 'build' || inside);
  }
}
