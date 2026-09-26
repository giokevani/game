// Procedural model builder: collects primitive parts with colours and merges
// them into one vertex-coloured geometry, so a whole model is one draw call.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const geoCache = new Map();
const tmpColor = new THREE.Color();
const tmpMat = new THREE.Matrix4();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const tmpScale = new THREE.Vector3();
const tmpPos = new THREE.Vector3();

function cached(key, make) {
  let g = geoCache.get(key);
  if (!g) {
    g = make();
    g.deleteAttribute('uv');
    if (g.index) g = g.toNonIndexed();
    geoCache.set(key, g);
  }
  return g;
}

const r2 = (v) => Math.round(v * 1000) / 1000;

export const Geo = {
  box(w, h, d, radius) {
    const rad = radius ?? Math.min(0.08, Math.min(w, h, d) * 0.22);
    if (rad <= 0.025) return cached(`b${r2(w)}|${r2(h)}|${r2(d)}`, () => new THREE.BoxGeometry(w, h, d));
    const seg = rad >= 0.1 && Math.min(w, h, d) > 0.25 ? 2 : 1;
    return cached(`rb${r2(w)}|${r2(h)}|${r2(d)}|${r2(rad)}|${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, rad));
  },
  cyl(rt, rb, h, seg = 14) {
    return cached(`c${r2(rt)}|${r2(rb)}|${r2(h)}|${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1));
  },
  sphere(r, ws = 12, hs = 8) {
    return cached(`s${r2(r)}|${ws}|${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
  },
  ico(r, detail = 1) {
    return cached(`i${r2(r)}|${detail}`, () => new THREE.IcosahedronGeometry(r, detail));
  },
  cone(r, h, seg = 12) {
    return cached(`k${r2(r)}|${r2(h)}|${seg}`, () => new THREE.ConeGeometry(r, h, seg, 1));
  },
  torus(r, t, rs = 8, ts = 20, arc = Math.PI * 2) {
    return cached(`t${r2(r)}|${r2(t)}|${rs}|${ts}|${r2(arc)}`, () => new THREE.TorusGeometry(r, t, rs, ts, arc));
  },
  plane(w, h) {
    return cached(`p${r2(w)}|${r2(h)}`, () => new THREE.PlaneGeometry(w, h));
  },
  // extruded 2D shape (x,y points) with depth along z
  shape(key, pts, depth, bevel = 0.02) {
    return cached(`sh${key}|${r2(depth)}`, () => {
      const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
      const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 10 });
      g.translate(0, 0, -depth / 2);
      return g;
    });
  },
  lathe(key, pts, seg = 16) {
    return cached(`la${key}|${seg}`, () => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg));
  },
};

export class Builder {
  constructor() {
    this.parts = [];
  }

  // generic: add a cached geometry with colour and transform
  add(geo, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    tmpEuler.set(rx, ry, rz);
    tmpQuat.setFromEuler(tmpEuler);
    tmpScale.set(sx, sy, sz);
    tmpPos.set(x, y, z);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);
    const g = geo.clone();
    g.applyMatrix4(tmpMat);
    tmpColor.set(color);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      col[i * 3] = tmpColor.r;
      col[i * 3 + 1] = tmpColor.g;
      col[i * 3 + 2] = tmpColor.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.parts.push(g);
    return this;
  }

  // box sitting with its bottom at y (convenient for furniture)
  box(w, h, d, color, x = 0, y = 0, z = 0, o = {}) {
    return this.add(Geo.box(w, h, d, o.r), color, x, y + h / 2, z, o.rx || 0, o.ry || 0, o.rz || 0);
  }
  // box centred at y
  cbox(w, h, d, color, x = 0, y = 0, z = 0, o = {}) {
    return this.add(Geo.box(w, h, d, o.r), color, x, y, z, o.rx || 0, o.ry || 0, o.rz || 0);
  }
  cyl(rt, rb, h, color, x = 0, y = 0, z = 0, o = {}) {
    return this.add(Geo.cyl(rt, rb, h, o.seg || 14), color, x, y + (o.center ? 0 : h / 2), z, o.rx || 0, o.ry || 0, o.rz || 0);
  }
  sphere(r, color, x = 0, y = 0, z = 0, o = {}) {
    return this.add(Geo.sphere(r, o.ws || (r < 0.2 ? 8 : 12), o.hs || (r < 0.2 ? 6 : 8)), color, x, y, z, o.rx || 0, o.ry || 0, o.rz || 0, o.sx || 1, o.sy || 1, o.sz || 1);
  }
  ico(r, color, x = 0, y = 0, z = 0, o = {}) {
    return this.add(Geo.ico(r, o.detail ?? 1), color, x, y, z, o.rx || 0, o.ry || 0, o.rz || 0, o.sx || 1, o.sy || 1, o.sz || 1);
  }
  cone(r, h, color, x = 0, y = 0, z = 0, o = {}) {
    return this.add(Geo.cone(r, h, o.seg || 12), color, x, y + (o.center ? 0 : h / 2), z, o.rx || 0, o.ry || 0, o.rz || 0);
  }
  torus(r, t, color, x = 0, y = 0, z = 0, o = {}) {
    return this.add(Geo.torus(r, t, o.rs || 8, o.ts || 20, o.arc ?? Math.PI * 2), color, x, y, z, o.rx || 0, o.ry || 0, o.rz || 0);
  }
  plane(w, h, color, x = 0, y = 0, z = 0, o = {}) {
    return this.add(Geo.plane(w, h), color, x, y, z, o.rx || 0, o.ry || 0, o.rz || 0);
  }
  // merge another builder's parts with an offset/rotation
  merge(other, x = 0, y = 0, z = 0, ry = 0, s = 1) {
    tmpEuler.set(0, ry, 0);
    tmpQuat.setFromEuler(tmpEuler);
    tmpMat.compose(tmpPos.set(x, y, z), tmpQuat, tmpScale.set(s, s, s));
    for (const p of other.parts) {
      const g = p.clone();
      g.applyMatrix4(tmpMat);
      this.parts.push(g);
    }
    return this;
  }

  // Merge to one geometry. ao: darken towards the ground and on undersides.
  build(o = {}) {
    if (!this.parts.length) return new THREE.BufferGeometry();
    const g = mergeGeometries(this.parts, false);
    const ao = o.ao ?? 0.28;
    const aoH = o.aoHeight ?? 0.9;
    const base = o.aoBase ?? 0;
    if (ao > 0) {
      const pos = g.attributes.position.array;
      const nor = g.attributes.normal.array;
      const col = g.attributes.color.array;
      for (let i = 0; i < pos.length; i += 3) {
        const h = Math.min(1, Math.max(0, (pos[i + 1] - base) / aoH));
        let f = 1 - ao * (1 - h * h * (3 - 2 * h));
        if (nor[i + 1] < -0.5) f *= 0.82;
        col[i] *= f; col[i + 1] *= f; col[i + 2] *= f;
      }
    }
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  }
}

// helpers for colours
export function shade(hex, f) {
  const c = new THREE.Color(hex);
  const hsl = {};
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l * f)));
  return '#' + c.getHexString();
}

export function mix(a, b, t) {
  return '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
}

// deterministic random
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return (s >>> 0) / 4294967296;
  };
}
