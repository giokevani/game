// Quest chain, tracker, guide arrow, stickers, the Bag and the festival.
import * as THREE from 'three';
import { QUESTS, QUEST, CHAPTERS, STICKERS } from '../data/quests.js';
import { NPC } from '../data/npcs.js';
import { FURN } from '../data/furniture.js';
import { FISH, SEEDS, JOBS, jobLevel, JOB_LEVELS } from '../data/jobs.js';
import { SHELL_COUNT } from '../world/collectibles.js';
import { Builder } from '../engine/builder.js';
import { M } from '../engine/materials.js';
import { h, modal, toast, celebrate, click, say, sayAll, tabs, fmt } from '../ui/ui.js';
import { level as levelOf } from '../core/state.js';
import { ZONES } from '../data/map.js';

const MAX_ACTIVE = 3;

export class QuestSystem {
  async init(game) {
    this.game = game;
    game.quests = this;
    const q = game.state.quests;
    q.active ||= []; q.done ||= []; q.metNpcs ||= [];
    this.evalT = 0;
    this.stickerT = 1;
    game.openQuests = () => this.openLog();
    game.openBag = () => this.openBag();
    game.on('start', () => this.onStart());
    // guide arrow
    const ab = new Builder();
    ab.cone(0.28, 0.75, '#ffd24d', 0, 0, 0, { rx: Math.PI / 2, seg: 4, center: true });
    this.arrow = new THREE.Mesh(ab.build({ ao: 0 }), M.glowAlways);
    this.arrow.visible = false;
    game.scene.add(this.arrow);
    this.refreshMarkers();
  }

  get st() { return this.game.state; }

  async onStart() {
    const q = this.st.quests;
    if (!q.done.length && !q.active.length) {
      await new Promise((r) => setTimeout(r, 600));
      if (this.game.fresh) await this.game.characterCreator?.();
      this.startQuest('welcome', true);
    }
    this.refreshTracker();
  }

  available() {
    const q = this.st.quests;
    const lvl = levelOf(this.st);
    const out = [];
    const doneN = q.done.length;
    QUESTS.forEach((qq, i) => {
      if (q.done.includes(qq.id) || q.active.some((a) => a.id === qq.id)) return;
      if (i > doneN + 2) return;
      if ((qq.lvl || 1) > lvl) return;
      if (qq.after && !q.done.includes(qq.after)) return;
      out.push(qq);
    });
    return q.active.length >= MAX_ACTIVE ? [] : out.slice(0, MAX_ACTIVE - q.active.length);
  }

  async startQuest(id, auto = false) {
    const qq = QUEST[id];
    const st = this.st;
    const npc = NPC[qq.npc];
    await sayAll(npc.name, npc.face, qq.lines);
    const base = { ...st.stats };
    st.quests.active.push({ id, base });
    if (qq.give?.egg) { this.game.pets?.giveEgg(qq.give.egg); toast('You got a Starter Egg! 🥚', { icon: '🎁' }); }
    if (qq.give?.unlock) this.unlock(qq.give.unlock);
    this.game.audio?.play('quest');
    toast(`New task: ${qq.title}`, { icon: '📜', kind: 'gold' });
    this.refreshMarkers();
    this.refreshTracker();
    this.game.save();
  }

  unlock(key) {
    const st = this.st;
    if (st.unlocks[key]) return;
    st.unlocks[key] = true;
    if (key === 'cave') this.game.world.openCaveGate(true);
    if (key === 'sky') this.game.balloon?.enable();
    this.game.emit('unlock', key);
  }

  progress(a) {
    const qq = QUEST[a.id];
    const st = this.st;
    return qq.objs.map((o) => {
      let cur = 0;
      if (o.kind === 'stat') cur = (st.stats[o.key] || 0) - (a.base?.[o.key] || 0);
      else if (o.kind === 'abs') cur = o.fn(st, FURN);
      else if (o.kind === 'zone') cur = st.collections.zones.includes(o.zone) ? 1 : 0;
      const n = o.n ?? 1;
      return { text: o.text, cur: Math.min(cur, n), n, done: cur >= n };
    });
  }

  async onTalk(id) {
    const av = this.available().find((q) => q.npc === id);
    if (av) { await this.startQuest(av.id); return true; }
    return false;
  }

  hintFor(id) {
    const a = this.st.quests.active.find((x) => QUEST[x.id].npc === id);
    if (!a) return null;
    const p = this.progress(a).find((o) => !o.done);
    return p ? `Remember: ${p.text} (${p.cur}/${p.n}). You can do it! 💪` : null;
  }

  complete(a) {
    const st = this.st;
    const qq = QUEST[a.id];
    st.quests.active = st.quests.active.filter((x) => x !== a);
    st.quests.done.push(a.id);
    if (qq.reward.unlock) this.unlock(qq.reward.unlock);
    this.game.reward(qq.reward.coins, qq.reward.xp, 'quest');
    celebrate('Task complete! 🎉', `${qq.title} · +${qq.reward.coins} 🪙`);
    this.game.fx.burst(this.game.player.pos, 'confetti');
    this.game.audio?.play('fanfare');
    this.game.emit('questDone', a.id);
    const ch = qq.ch;
    if (QUESTS.filter((x) => x.ch === ch).every((x) => st.quests.done.includes(x.id)) && CHAPTERS[ch + 1]) {
      setTimeout(() => celebrate(`Chapter ${ch + 2}`, CHAPTERS[ch + 1], 3000), 2600);
    }
    if (qq.final) setTimeout(() => this.ending(), 3000);
    this.refreshMarkers();
    this.refreshTracker();
    this.game.save();
  }

  refreshMarkers() {
    const npcs = this.game.npcs;
    if (!npcs) return;
    const av = new Set(this.available().map((q) => q.npc));
    for (const n of npcs.list) npcs.setMarker(n.d.id, av.has(n.d.id) ? 'quest' : null);
  }

  refreshTracker() {
    if (this.game.jobs?.delivery) return;
    const st = this.st;
    const items = [];
    for (const a of st.quests.active) {
      const p = this.progress(a);
      const o = p.find((x) => !x.done) || p[p.length - 1];
      items.push({ title: QUEST[a.id].title, text: o.text, prog: o.n > 1 ? `${o.cur}/${o.n}` : '' });
    }
    const av = this.available();
    if (items.length < 2 && av[0]) {
      const npc = NPC[av[0].npc];
      items.push({ title: '❗ New task', text: `Talk to ${npc.name}` });
    }
    this.game.hud.setTracker(items.slice(0, 3));
  }

  // where should the guide arrow point?
  guideTarget() {
    const st = this.st;
    const av = this.available();
    for (const a of st.quests.active) {
      const p = this.progress(a);
      const qq = QUEST[a.id];
      const o = qq.objs.find((x, i) => !p[i].done);
      if (o?.kind === 'zone') { const z = ZONES.find((x) => x.id === o.zone); return new THREE.Vector3(z.x, z.y || 0, z.z); }
    }
    if (av[0] && st.quests.active.length === 0) {
      const n = this.game.npcs?.get(av[0].npc);
      if (n) return n.pos;
    }
    if (av[0] && st.quests.done.length < 6) {
      const n = this.game.npcs?.get(av[0].npc);
      if (n) return n.pos;
    }
    return null;
  }

  update(dt, game) {
    const st = this.st;
    // zones visited
    const z = game.world.zoneAt(game.player.pos);
    if (z && !st.collections.zones.includes(z.id)) {
      st.collections.zones.push(z.id);
      toast(`Discovered ${z.name}! ${z.icon}`, { icon: '🧭', kind: 'gold' });
      game.emit('zone', z.id);
    }
    if (z?.id !== this.lastZone) { this.lastZone = z?.id; game.hud.setZone(z); }
    // festival: be in the square at night
    const fest = st.quests.active.find((a) => a.id === 'festival');
    if (fest && !st.quests.festival && z?.id === 'square' && game.sky.state.night > 0.55) { st.quests.festival = true; this.fireworks(); }
    this.evalT -= dt;
    if (this.evalT <= 0) {
      this.evalT = 0.8;
      for (const a of [...st.quests.active]) if (this.progress(a).every((o) => o.done)) this.complete(a);
      this.refreshTracker();
      this.refreshMarkers();
    }
    this.stickerT -= dt;
    if (this.stickerT <= 0) { this.stickerT = 2; this.checkStickers(); }
    // guide arrow
    const tgt = game.mode === 'play' && !game.jobs?.delivery ? this.guideTarget() : null;
    const p = game.player.pos;
    if (tgt && Math.hypot(tgt.x - p.x, tgt.z - p.z) > 6) {
      this.arrow.visible = true;
      this.arrow.position.set(p.x, p.y + 2.9 + Math.sin(game.time * 4) * 0.1, p.z);
      this.arrow.lookAt(tgt.x, p.y + 2.9, tgt.z);
    } else this.arrow.visible = false;
  }

  checkStickers() {
    const st = this.st;
    const got = st.collections.stickers;
    for (const s of STICKERS) {
      if (got.includes(s.id)) continue;
      let ok = false;
      try { ok = !!s.test(st); } catch { ok = false; }
      if (ok) {
        got.push(s.id);
        toast(`New sticker: ${s.name}!`, { icon: s.icon, kind: 'pink', time: 3000 });
        this.game.reward(25, 10, 'sticker');
        this.game.emit('sticker', s.id);
        this.game.hud.alert('bag', true);
        break;
      }
    }
  }

  fireworks() {
    const g = this.game;
    celebrate('🎆 The Blossom Festival! 🎆', 'Look up at the sky!', 3500);
    g.audio?.play('fanfare');
    let n = 0;
    const iv = setInterval(() => {
      const p = new THREE.Vector3(-20 + Math.random() * 40, 18 + Math.random() * 12, -30 + Math.random() * 20);
      g.fx.burst(p, 'confetti', { n: 60, scale: 3, dy: 0 });
      g.fx.burst(p, 'sparkle', { n: 40, scale: 3, dy: 0 });
      g.audio?.play('firework');
      if (++n > 24) clearInterval(iv);
    }, 450);
  }

  async ending() {
    const g = this.game;
    await say('Mayor Maple', '👩‍💼', 'What a festival! And your home won the house contest! 🏆');
    await say('Mayor Maple', '👩‍💼', 'You\'ve made Blossom Bay brighter for everyone. Here is the Festival Trophy — put it somewhere special!');
    await say('Mayor Maple', '👩‍💼', 'There\'s still lots to do: rare pets, every fish, every shell, a bigger mansion… Blossom Bay is your home now. 💗');
  }

  // ---------- panels ----------
  openLog() {
    const st = this.st;
    click();
    modal('📜 Tasks', (b) => {
      if (st.quests.active.length) b.appendChild(h('div', { class: 'section-title', style: { marginTop: 0 } }, 'Doing now'));
      for (const a of st.quests.active) {
        const qq = QUEST[a.id];
        const npc = NPC[qq.npc];
        const li = h('div', { class: 'li' }, h('div', { class: 'big-ico' }, npc.face), h('div', { style: { flex: 1 } }, h('div', { class: 't' }, qq.title),
          ...this.progress(a).map((o) => h('div', { class: 's' }, `${o.done ? '✅' : '⬜'} ${o.text} ${o.n > 1 ? `(${o.cur}/${o.n})` : ''}`))),
          h('div', { class: 'muted' }, `🪙 ${qq.reward.coins}`));
        b.appendChild(li);
      }
      const av = this.available();
      if (av.length) {
        b.appendChild(h('div', { class: 'section-title' }, 'New tasks waiting'));
        for (const qq of av) b.appendChild(h('div', { class: 'li' }, h('div', { class: 'big-ico' }, '❗'), h('div', {}, h('div', { class: 't' }, qq.title), h('div', { class: 's' }, `Talk to ${NPC[qq.npc].name}`))));
      }
      const next = QUESTS.find((qq) => !st.quests.done.includes(qq.id) && !st.quests.active.some((a) => a.id === qq.id) && !av.includes(qq));
      if (next && (next.lvl || 1) > levelOf(st)) b.appendChild(h('div', { class: 'muted', style: { marginTop: '8px' } }, `🔒 More tasks at level ${next.lvl}. Earn stars ⭐ with jobs, pets and shells!`));
      b.appendChild(h('div', { class: 'section-title' }, 'Story'));
      CHAPTERS.forEach((c, i) => {
        const qs = QUESTS.filter((x) => x.ch === i);
        const d = qs.filter((x) => st.quests.done.includes(x.id)).length;
        b.appendChild(h('div', { class: 'li' + (d === qs.length ? ' done' : '') }, h('div', { class: 'big-ico' }, ['🏡', '🌷', '🤝', '🌟', '🎆'][i]),
          h('div', { style: { flex: 1 } }, h('div', { class: 't' }, `Chapter ${i + 1}: ${c}`), h('div', { class: 'progress', style: { marginTop: '4px' } }, h('i', { style: { width: (d / qs.length) * 100 + '%' } }))),
          h('div', { class: 'muted' }, `${d}/${qs.length}`)));
      });
    });
  }

  openBag() {
    const st = this.st;
    this.game.hud.alert('bag', false);
    let tab = 0;
    const m = modal('🎒 My Bag', null, { tabs: tabs([{ name: 'Stickers', icon: '🏅' }, { name: 'Fish', icon: '🐟' }, { name: 'Garden', icon: '🌻' }, { name: 'Jobs', icon: '💼' }, { name: 'Stats', icon: '📊' }], (t, i) => { tab = i; render(); }) });
    const render = () => {
      const b = h('div');
      if (tab === 0) {
        b.appendChild(h('div', { class: 'muted' }, `${st.collections.stickers.length} / ${STICKERS.length} stickers · 🐚 ${st.collections.shells.length}/${SHELL_COUNT} shells`));
        const g = h('div', { class: 'grid', style: { marginTop: '8px' } });
        for (const s of STICKERS) {
          const has = st.collections.stickers.includes(s.id);
          g.appendChild(h('div', { class: 'card' + (has ? '' : ' locked') }, h('div', { class: 'thumb', style: { fontSize: '38px' } }, has ? s.icon : '❔'), h('div', { class: 'nm' }, s.name)));
        }
        b.appendChild(g);
      } else if (tab === 1) {
        b.appendChild(h('div', { class: 'muted' }, `${Object.keys(st.collections.fish).length} / ${FISH.length} fish caught. Some only swim at night 🌙 or in the day ☀️!`));
        const g = h('div', { class: 'grid', style: { marginTop: '8px' } });
        for (const f of FISH) {
          const n = st.collections.fish[f.id] || 0;
          g.appendChild(h('div', { class: 'card' + (n ? '' : ' locked') }, h('span', { class: 'badge rar-' + f.rar }, f.rar), h('div', { class: 'thumb', style: { filter: n && f.hue ? `hue-rotate(${f.hue}deg) saturate(1.5)` : '' } }, n ? f.icon : '❓'), h('div', { class: 'nm' }, n ? f.name : '???'), h('div', { class: 'muted' }, n ? `× ${n}` : '')));
        }
        b.appendChild(g);
      } else if (tab === 2) {
        const g = h('div', { class: 'grid' });
        for (const s of SEEDS) {
          const n = st.collections.plants[s.id] || 0;
          g.appendChild(h('div', { class: 'card' + (n ? '' : ' locked') }, h('div', { class: 'thumb' }, n ? s.icon : '❓'), h('div', { class: 'nm' }, n ? s.name : '???'), h('div', { class: 'muted' }, n ? `× ${n}` : '')));
        }
        b.appendChild(g);
      } else if (tab === 3) {
        for (const j of JOBS) {
          const xp = st.jobs[j.id].xp, l = jobLevel(xp), nx = JOB_LEVELS[l];
          b.appendChild(h('div', { class: 'li' }, h('div', { class: 'big-ico' }, j.icon), h('div', { style: { flex: 1 } }, h('div', { class: 't' }, `${j.name} · Level ${l}`), h('div', { class: 's' }, `${j.desc} (${j.place})`),
            h('div', { class: 'progress', style: { marginTop: '4px' } }, h('i', { style: { width: nx ? Math.round(((xp - JOB_LEVELS[l - 1]) / (nx - JOB_LEVELS[l - 1])) * 100) + '%' : '100%' } }))), h('div', { class: 'muted' }, nx ? `${xp}/${nx}` : 'MAX')));
        }
      } else {
        const s = st.stats;
        const rows = [['⏰ Play time', `${Math.floor(s.playTime / 3600)}h ${Math.floor((s.playTime % 3600) / 60)}m`], ['🪙 Coins earned', fmt(s.coinsEarned)], ['🐾 Pet care tasks', s.petTasks], ['🥚 Eggs hatched', s.eggsHatched], ['🛋️ Items placed', s.itemsPlaced], ['🐟 Fish caught', s.fishCaught], ['🧺 Harvests', s.harvests], ['💼 Jobs done', s.jobsDone], ['🧭 Places found', `${st.collections.zones.length}/${ZONES.length}`], ['📜 Tasks done', `${st.quests.done.length}/${QUESTS.length}`]];
        b.appendChild(h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' } }, rows.map(([k, v]) => h('div', { class: 'li' }, h('div', { class: 't', style: { flex: 1 } }, k), h('b', {}, String(v))))));
      }
      m.setBody(b);
    };
    render();
  }
}
