// Townsfolk that stroll around, face you, chat and hand out quests.
import * as THREE from 'three';
import { NPCS, NPC } from '../data/npcs.js';
import { Avatar } from '../player/avatar.js';
import { say } from '../ui/ui.js';

function nameTag(text) {
  const c = document.createElement('canvas');
  const x = c.getContext('2d');
  x.font = '600 30px Fredoka, sans-serif';
  const w = Math.ceil(x.measureText(text).width) + 36;
  c.width = w; c.height = 48;
  const y = c.getContext('2d');
  y.fillStyle = 'rgba(255,255,255,0.88)';
  y.beginPath(); y.roundRect ? y.roundRect(0, 0, w, 48, 24) : y.rect(0, 0, w, 48); y.fill();
  y.font = '600 30px Fredoka, sans-serif';
  y.fillStyle = '#7a4e8a';
  y.textAlign = 'center'; y.textBaseline = 'middle';
  y.fillText(text, w / 2, 26);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, transparent: true }));
  s.scale.set((w / 48) * 0.36, 0.36, 1);
  s.renderOrder = 14;
  return s;
}

function markerTex(ch, color) {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = color;
  x.beginPath(); x.arc(48, 48, 40, 0, 7); x.fill();
  x.strokeStyle = '#ffffff'; x.lineWidth = 7; x.stroke();
  x.fillStyle = '#ffffff';
  x.font = '800 60px Fredoka, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(ch, 48, 52);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class NPCSystem {
  async init(game) {
    this.game = game;
    game.npcs = this;
    this.list = [];
    this.markers = { quest: markerTex('!', '#ffb020'), done: markerTex('✓', '#35c28a') };
    for (const d of NPCS) {
      const av = new Avatar(d.look, { scale: d.kid ? 0.82 : 1 });
      const home = new THREE.Vector3(d.x, 0, d.z);
      home.y = game.world.groundAt(d.x, d.z, 5);
      av.root.position.copy(home);
      av.root.rotation.y = d.ry;
      game.scene.add(av.root);
      const tag = nameTag(d.name);
      tag.position.y = 2.35 / (d.kid ? 0.82 : 1);
      av.root.add(tag);
      const mk = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.markers.quest, depthWrite: false }));
      mk.scale.set(0.6, 0.6, 1);
      mk.position.y = 2.95 / (d.kid ? 0.82 : 1);
      mk.visible = false;
      mk.renderOrder = 15;
      av.root.add(mk);
      const n = { d, av, home, pos: home.clone(), facing: d.ry, target: null, wait: Math.random() * 4, tag, mk, marker: null };
      n.it = game.world.addInteract({ x: home.x, z: home.z, y: home.y, r: 2.6, label: `Talk to ${d.name.split(' ').pop()}`, icon: '💬', onUse: () => this.talk(d.id), enabled: () => game.mode === 'play' });
      this.list.push(n);
    }
  }

  get(id) { return this.list.find((n) => n.d.id === id); }

  setMarker(id, type) {
    const n = this.get(id);
    if (!n || n.marker === type) return;
    n.marker = type;
    n.mk.visible = !!type;
    if (type) { n.mk.material.map = this.markers[type]; n.mk.material.needsUpdate = true; }
  }

  async talk(id) {
    const n = this.get(id);
    const g = this.game;
    const p = g.player.pos;
    n.facing = Math.atan2(p.x - n.pos.x, p.z - n.pos.z);
    n.av.playEmote('wave', 1.5);
    n.talking = true;
    g.audio?.play('talk');
    const st = g.state;
    st.quests.metNpcs ||= [];
    if (!st.quests.metNpcs.includes(id)) st.quests.metNpcs.push(id);
    g.emit('talk', id);
    try {
      if (await g.quests?.onTalk(id)) return;
      const d = n.d;
      const line = d.lines[Math.floor(Math.random() * d.lines.length)];
      const hint = g.quests?.hintFor(id);
      await say(d.name, d.face, hint || line);
    } finally {
      n.talking = false;
    }
  }

  update(dt, game) {
    const p = game.player.pos;
    for (const n of this.list) {
      const dist = Math.hypot(p.x - n.pos.x, p.z - n.pos.z);
      const vis = dist < 75 || n.marker;
      n.av.root.visible = vis;
      n.tag.visible = dist < 16;
      if (!vis) continue;
      let speed = 0;
      if (n.talking || dist < 3.2) {
        const want = Math.atan2(p.x - n.pos.x, p.z - n.pos.z);
        n.facing += Math.atan2(Math.sin(want - n.facing), Math.cos(want - n.facing)) * Math.min(1, dt * 6);
      } else if (n.target) {
        const dx = n.target.x - n.pos.x, dz = n.target.z - n.pos.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.2) { n.target = null; n.wait = 2 + Math.random() * 5; }
        else {
          const v = n.d.kid ? 2.4 : 1.4;
          n.pos.x += (dx / d) * v * dt;
          n.pos.z += (dz / d) * v * dt;
          game.world.resolve(n.pos, 0.35, n.pos.y);
          const want = Math.atan2(dx, dz);
          n.facing += Math.atan2(Math.sin(want - n.facing), Math.cos(want - n.facing)) * Math.min(1, dt * 8);
          speed = n.d.kid ? 0.8 : 0.45;
        }
      } else {
        n.wait -= dt;
        if (n.wait <= 0 && n.d.wander > 0) {
          const a = Math.random() * Math.PI * 2, r = Math.random() * n.d.wander;
          n.target = new THREE.Vector3(n.home.x + Math.cos(a) * r, 0, n.home.z + Math.sin(a) * r);
        }
      }
      n.pos.y = game.world.groundAt(n.pos.x, n.pos.z, n.pos.y + 0.5);
      n.av.root.position.copy(n.pos);
      n.av.root.rotation.y = n.facing;
      n.av.update(dt, speed, false);
      n.it.x = n.pos.x; n.it.z = n.pos.z; n.it.y = n.pos.y;
      if (n.mk.visible) n.mk.position.y = 2.95 / n.av.scale + Math.sin(game.time * 3) * 0.08;
    }
  }
}

export { NPC };
