// 40 hidden sparkle shells. Instanced (one draw call); collected ones vanish.
import * as THREE from 'three';
import { Builder } from '../engine/builder.js';
import { M } from '../engine/materials.js';
import { shoreZ, PIER, POND, SKY_ISLAND } from '../data/map.js';
import { toast } from '../ui/ui.js';

// [x, z, yOverride?]  'b' = on the beach (z computed from the shoreline)
const SPOTS = [
  ['b', -88], ['b', -66], ['b', -46], ['b', -28], ['b', -3], ['b', 14], ['b', 46], ['b', 66], ['b', 88], ['b', 106], ['b', 136],
  [30, PIER.z2 + 3, PIER.y],
  [POND.x + POND.rx + 3, POND.z - 6], [107, -9], [124, -66], [84, -70], [132, -92], [70, -30], [58, -92],
  [33, 4], [-33, -22], [0, -48], [7, -3], [-25, 15.5], [64, 10], [-15, 37],
  [-122, -68], [-40, -70], [30, -69], [72, -52],
  [141, -104], [-141, -102], [-141, 4],
  [-120, 40], [-111, 56], [-131, 53], [-115, 46],
  [8, SKY_ISLAND.z + 14, SKY_ISLAND.y + 0.15], [-13, SKY_ISLAND.z + 8, SKY_ISLAND.y + 0.15], [15, SKY_ISLAND.z - 6, SKY_ISLAND.y + 0.15],
];

export const SHELL_COUNT = SPOTS.length;

export class Shells {
  async init(game) {
    this.game = game;
    game.shells = this;
    const st = game.state;
    st.collections.shells ||= [];
    const b = new Builder();
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i / 6) * Math.PI;
      b.sphere(0.07, i % 2 ? '#ffd6ea' : '#fff3f9', Math.sin(a) * 0.12, 0.14 + Math.cos(a) * 0.12, 0, { sx: 0.8, sy: 2.2, sz: 0.5, rz: -a });
    }
    b.sphere(0.07, '#ffc2dc', 0, 0.03, 0, { sx: 1.4, sy: 0.6, sz: 0.6 });
    this.mesh = new THREE.InstancedMesh(b.build({ ao: 0 }), M.glowAlways, SPOTS.length);
    this.mesh.castShadow = true;
    this.pos = SPOTS.map(([x, z, y]) => {
      if (x === 'b') { x = z; z = shoreZ(x) - 7; }
      const p = new THREE.Vector3(x, 0, z);
      if (y === undefined) {
        game.world.resolve(p, 0.6, 0);
        p.y = game.world.groundAt(p.x, p.z, 5);
      } else p.y = y;
      return p;
    });
    this.dummy = new THREE.Object3D();
    this.mesh.frustumCulled = false;
    game.scene.add(this.mesh);
    this.sparkT = 0;
    this.refresh();
  }

  refresh() {
    const got = new Set(this.game.state.collections.shells);
    this.pos.forEach((p, i) => {
      this.dummy.position.copy(p);
      this.dummy.scale.setScalar(got.has(i) ? 0 : 1.6);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    });
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  update(dt, game) {
    const st = game.state;
    const got = st.collections.shells;
    const p = game.player.pos;
    const t = game.time;
    this.sparkT -= dt;
    const spark = this.sparkT <= 0;
    if (spark) this.sparkT = 0.35;
    for (let i = 0; i < this.pos.length; i++) {
      if (got.includes(i)) continue;
      const s = this.pos[i];
      const d = Math.hypot(p.x - s.x, p.z - s.z);
      if (d > 60) continue;
      this.dummy.position.set(s.x, s.y + 0.35 + Math.sin(t * 2 + i) * 0.12, s.z);
      this.dummy.rotation.set(0, t * 1.5 + i, 0);
      this.dummy.scale.setScalar(1.6);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      if (spark && d < 25) game.fx.burst(new THREE.Vector3(s.x, s.y + 0.4, s.z), 'glitter', { spread: 0.8 });
      if (d < 1.3 && Math.abs(p.y - s.y) < 2) {
        got.push(i);
        this.dummy.scale.setScalar(0);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
        game.fx.burst(new THREE.Vector3(s.x, s.y + 0.4, s.z), 'sparkle', { n: 30 });
        game.audio?.play('sparkle');
        game.reward(25, 15, 'shell');
        toast(`Sparkle shell ${got.length}/${SPOTS.length}! 🐚`, { icon: '✨', kind: 'pink' });
        game.emit('shell', got.length);
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
