// Map with fast travel, and the settings menu (sound, graphics, backup).
import * as THREE from 'three';
import { h, modal, toast, click, confirmBox, promptBox } from './ui.js';
import { WORLD, ROADS, PATHS, PLAZA, BUILDINGS, POND, PIER, ZONES, HOME_PLOT, shoreZ, BALLOON, GARDEN, PLAYGROUND, SKY_ISLAND } from '../data/map.js';
import { exportCode, importCode, wipeGame, saveGame } from '../core/save.js';
import { levelFromXP } from '../core/state.js';

const TRAVEL = {
  home: [HOME_PLOT.cx, HOME_PLOT.front + 4],
  square: [0, 6],
  park: [80, -22],
  beach: [0, 44],
  cove: [-112, 46],
  sky: [2, -94, SKY_ISLAND.y + 0.15],
};

export function setupMenus(game) {
  const st = game.state;

  game.openMap = () => {
    const W = 640, H = 520;
    const cv = h('canvas', { width: W, height: H });
    const sx = (x) => ((x - WORLD.minX) / (WORLD.maxX - WORLD.minX)) * W;
    const sz = (z) => ((z - WORLD.minZ) / (WORLD.maxZ - WORLD.minZ)) * H;
    const x = cv.getContext('2d');
    x.fillStyle = '#a8dd8a'; x.fillRect(0, 0, W, H);
    // sand + sea
    x.fillStyle = '#f7e2ad'; x.beginPath(); x.moveTo(0, H);
    for (let wx = WORLD.minX; wx <= WORLD.maxX; wx += 5) x.lineTo(sx(wx), sz(shoreZ(wx) - 22));
    x.lineTo(W, H); x.fill();
    x.fillStyle = '#8fd3e8'; x.beginPath(); x.moveTo(0, H);
    for (let wx = WORLD.minX; wx <= WORLD.maxX; wx += 5) x.lineTo(sx(wx), sz(shoreZ(wx)));
    x.lineTo(W, H); x.fill();
    x.fillStyle = '#cfc6da';
    for (const r of ROADS) { const [a, b, c, d] = r.rect; x.fillRect(sx(a), sz(b), sx(c) - sx(a), sz(d) - sz(b)); }
    x.fillStyle = '#f5e4c4';
    for (const p of PATHS) { const [a, b, c, d] = p.rect; x.fillRect(sx(a), sz(b), sx(c) - sx(a), sz(d) - sz(b)); }
    x.beginPath(); x.arc(sx(PLAZA.x), sz(PLAZA.z), (PLAZA.r / 300) * W, 0, 7); x.fill();
    x.fillStyle = '#8fd3e8'; x.beginPath(); x.ellipse(sx(POND.x), sz(POND.z), (POND.rx / 300) * W, (POND.rz / 244) * H, 0, 0, 7); x.fill();
    x.fillStyle = '#c9976b'; x.fillRect(sx(PIER.x1), sz(PIER.z1), sx(PIER.x2) - sx(PIER.x1), sz(PIER.z2) - sz(PIER.z1));
    x.fillStyle = '#b8825a'; x.fillRect(sx(GARDEN.x - 2), sz(GARDEN.z - 2), (18 / 300) * W, (7 / 244) * H);
    for (const b of BUILDINGS) {
      const rot = Math.abs(Math.sin(b.face)) > 0.5;
      const w = rot ? b.d : b.w, d = rot ? b.w : b.d;
      x.fillStyle = b.roof || '#b3adbd';
      x.fillRect(sx(b.x - w / 2), sz(b.z - d / 2), (w / 300) * W, (d / 244) * H);
    }
    // home plot
    const hs = st.house.size * 2;
    x.strokeStyle = '#ff8fc0'; x.lineWidth = 3;
    x.strokeRect(sx(HOME_PLOT.cx - hs / 2), sz(HOME_PLOT.front - hs), (hs / 300) * W, (hs / 244) * H);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '22px "Apple Color Emoji","Noto Color Emoji",sans-serif';
    const icon = (e, wx, wz) => x.fillText(e, sx(wx), sz(wz));
    icon('🏠', HOME_PLOT.cx, HOME_PLOT.front - hs / 2);
    for (const b of BUILDINGS) if (b.icon) icon(b.icon, b.x, b.z);
    icon('🎈', BALLOON.x, BALLOON.z); icon('🛝', PLAYGROUND.x, PLAYGROUND.z); icon('🌱', GARDEN.x + 6, GARDEN.z + 2); icon('🎣', 30, PIER.z2);
    if (st.unlocks.cave) icon('💎', -124, 46);
    // quest npcs
    for (const n of game.npcs?.list || []) if (n.marker) { x.font = '20px sans-serif'; icon('❗', n.pos.x, n.pos.z - 4); }
    // pet + player
    const p = game.player.pos;
    x.fillStyle = '#ff5d9e'; x.strokeStyle = '#ffffff'; x.lineWidth = 3;
    x.beginPath(); x.arc(sx(p.x), sz(p.z), 9, 0, 7); x.fill(); x.stroke();
    x.beginPath(); const f = game.player.facing;
    x.moveTo(sx(p.x) + Math.sin(f) * 16, sz(p.z) + Math.cos(f) * 16); x.lineTo(sx(p.x) + Math.sin(f + 2.5) * 8, sz(p.z) + Math.cos(f + 2.5) * 8); x.lineTo(sx(p.x) + Math.sin(f - 2.5) * 8, sz(p.z) + Math.cos(f - 2.5) * 8); x.fill();
    if (p.y > 40) { x.font = '600 18px Fredoka, sans-serif'; x.fillStyle = '#5a4a6a'; x.fillText('☁️ You are on Sky Island', W / 2, 20); }
    const buttons = h('div', { class: 'row', style: { marginTop: '10px' } });
    for (const z of ZONES) {
      const found = st.collections.zones.includes(z.id);
      buttons.appendChild(h('button', { class: 'btn small ' + (found ? 'sky' : 'ghost disabled'), onclick: () => {
        click();
        if (!found) return;
        if (z.id === 'sky' && !st.unlocks.sky) return;
        m.close();
        game.vehicles?.dismount();
        const [tx, tz, ty] = TRAVEL[z.id];
        game.fx.burst(game.player.pos, 'puff');
        game.player.teleport(tx, ty, tz);
        game.pets?.actor?.place(new THREE.Vector3(tx - 1, game.player.pos.y, tz - 1));
        game.rig.snap(game.player.pos);
        game.fx.burst(game.player.pos, 'sparkle');
        game.audio?.play('sparkle');
      } }, found ? `${z.icon} ${z.name}` : `❓ ${z.name}`));
    }
    buttons.appendChild(h('button', { class: 'btn small sun', onclick: () => {
      click();
      m.close();
      game.cafeSys?.goTo();
      game.fx.burst(game.player.pos, 'sparkle');
      game.audio?.play('sparkle');
    } }, '🍳 Blossom Kitchen'));
    const m = modal('🗺️ Blossom Bay', (b) => {
      cv.style.width = '100%'; cv.style.height = 'auto'; cv.style.borderRadius = '16px';
      b.append(cv, h('div', { class: 'muted', style: { marginTop: '6px' } }, 'Tap a place you have found to travel there:'), buttons);
    });
  };

  game.openSettings = () => {
    const s = st.settings;
    const m = modal('⚙️ Menu', (b, close) => {
      const tog = (label, key, fn) => {
        const btn = h('button', { class: 'btn small ' + (s[key] ? 'mint' : 'ghost'), onclick: () => { click(); s[key] = !s[key]; fn?.(s[key]); btn.className = 'btn small ' + (s[key] ? 'mint' : 'ghost'); btn.textContent = s[key] ? 'On' : 'Off'; } }, s[key] ? 'On' : 'Off');
        return h('div', { class: 'toggle' }, h('span', {}, label), btn);
      };
      b.append(
        tog('🎵 Music', 'music', (v) => game.audio?.setMusic(v)),
        tog('🔔 Sounds', 'sfx', (v) => game.audio?.setSfx(v)),
        h('div', { class: 'toggle' }, h('span', {}, '✨ Graphics'), h('div', { class: 'row' }, ...['auto', 'high', 'medium', 'low'].map((q) => h('button', { class: 'btn small ' + (s.quality === q ? '' : 'ghost'), onclick: () => { click(); s.quality = q; game.quality.set(q); close(); game.openSettings(); } }, q[0].toUpperCase() + q.slice(1))))),
        h('div', { class: 'muted' }, `Now running at ${game.quality.level.name} quality, about ${Math.round(game.quality.fps)} frames per second.`),
        h('div', { class: 'section-title' }, '💾 Save'),
        h('div', { class: 'muted' }, 'The game saves by itself on this phone. For extra safety, copy a backup code and keep it somewhere (for example in Notes).'),
        h('div', { class: 'row', style: { marginTop: '8px' } },
          h('button', { class: 'btn small sky', onclick: async () => {
            click(); game.save();
            const code = exportCode(st);
            try { await navigator.clipboard.writeText(code); toast('Backup code copied! Paste it into Notes.', { icon: '📋' }); }
            catch { modal('Backup code', (bb) => { const ta = h('textarea', { style: { width: '100%', height: '160px', fontSize: '11px' } }); ta.value = code; bb.appendChild(ta); }, { narrow: true }); }
          } }, '📋 Copy backup code'),
          h('button', { class: 'btn small ghost', onclick: async () => {
            click();
            const code = await promptBox('Restore', 'Paste your backup code:', '', 200000);
            if (!code || !code.startsWith('BB1:')) return;
            try { const ns = importCode(code); game.noSave = true; saveGame(ns); location.reload(); } catch { toast('That code did not work 😕', { icon: '⚠️' }); }
          } }, '📥 Restore')),
        h('div', { class: 'section-title' }, '🧑 Player'),
        h('div', { class: 'muted' }, `${st.player.name || 'Blossom'} · Level ${levelFromXP(st.player.xp).level} · played ${Math.floor(st.stats.playTime / 60)} min`),
        h('div', { class: 'row', style: { marginTop: '8px' } },
          h('button', { class: 'btn small lav', onclick: () => { click(); close(); game.openWardrobe(); } }, '👗 Change look'),
          h('button', { class: 'btn small ghost', onclick: () => { click(); close(); game.player.teleport(HOME_PLOT.cx, undefined, HOME_PLOT.front + 4, Math.PI); game.rig.snap(game.player.pos); } }, '🏠 Go home'),
          h('button', { class: 'btn small danger', onclick: async () => {
            click();
            if (!(await confirmBox('Start over?', 'This deletes EVERYTHING — your house, pets and coins. Are you sure?', 'Delete everything', 'Keep playing'))) return;
            if (!(await confirmBox('Really sure?', 'There is no way back. Tap once more to start a new game.', 'Yes, start over', 'No!'))) return;
            game.noSave = true; wipeGame(); location.reload();
          } }, '🗑️ Start over')),
        h('div', { class: 'section-title' }, '💡 How to play'),
        h('div', { class: 'muted', style: { lineHeight: 1.5 } }, 'Drag on the left side to walk, drag on the right to look around, pinch to zoom. Tap the pink button to use things. Earn coins with jobs 🧁💐🌱🎣📦 and pet care 🐾, then decorate your home in 🔨 Build! Tip: add Blossom Bay to your Home Screen (Share → Add to Home Screen) to play full screen.'),
        h('div', { class: 'muted', style: { marginTop: '10px', fontSize: '12px' } }, 'Blossom Bay v1.0 · everything is made in code · no ads, no chat, no purchases.'));
    }, { narrow: true });
  };
}
