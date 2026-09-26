// Groups static geometry into spatial chunks per material so the town renders
// in a few dozen draw calls while still getting frustum culling.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();

export class ChunkMerger {
  constructor(size = 70) {
    this.size = size;
    this.buckets = new Map();
  }
  // geo: vertex-coloured geometry in local space; placed at x,z with rotation ry
  add(geo, material, x, y, z, ry = 0, o = {}) {
    const key = `${Math.floor(x / this.size)},${Math.floor(z / this.size)}|${material.uuid}|${o.cast === false ? 0 : 1}`;
    let b = this.buckets.get(key);
    if (!b) {
      b = { material, geos: [], cast: o.cast !== false };
      this.buckets.set(key, b);
    }
    tmpE.set(0, ry, 0);
    tmpQ.setFromEuler(tmpE);
    tmpM.compose(new THREE.Vector3(x, y, z), tmpQ, new THREE.Vector3(1, 1, 1));
    const g = geo.clone();
    g.applyMatrix4(tmpM);
    b.geos.push(g);
  }
  build(parent) {
    const meshes = [];
    for (const b of this.buckets.values()) {
      const g = mergeGeometries(b.geos, false);
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, b.material);
      m.castShadow = b.cast;
      m.receiveShadow = true;
      m.matrixAutoUpdate = false;
      m.updateMatrix();
      parent.add(m);
      meshes.push(m);
    }
    this.buckets.clear();
    return meshes;
  }
}
