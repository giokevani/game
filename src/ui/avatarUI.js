// Character creator, boutique (Sparkle Style), wardrobe and emotes.
import * as THREE from 'three';
import { Avatar } from '../player/avatar.js';
import { AVATAR_ITEMS, SKINS, HAIR_COLORS, CLOTH_COLORS, EYE_COLORS, EMOTES } from '../data/avatar.js';
import { h, modal, toast, click, fmt, root } from './ui.js';
import { spend, level as levelOf } from '../core/state.js';
import { BUILDINGS } from '../data/map.js';

let pr = null;
function preview() {
  if (pr) return pr;
  const canvas = document.createElement('canvas');
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  r.setSize(200, 260, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8c8e0, 2.0));
  const d = new THREE.DirectionalLight(0xffffff, 1.8); d.position.set(2, 4, 5); scene.add(d);
  const cam = new THREE.PerspectiveCamera(28, 200 / 260, 0.1, 50);
  cam.position.set(0, 1.25, 5.2);
  cam.lookAt(0, 1.0, 0);
  pr = { r, scene, cam, canvas, avatar: null, raf: 0 };
  return pr;
}

const SLOTS = [
  { id: 'look', name: 'Me', icon: '😊' },
  { id: 'hair', name: 'Hair', icon: '💇‍♀️' },
  { id: 'top', name: 'Tops', icon: '👕' },
  { id: 'bottom', name: 'Bottoms', icon: '👖' },
  { id: 'dress', name: 'Dresses', icon: '👗' },
  { id: 'hat', name: 'Hats', icon: '🎀' },
  { id: 'acc', name: 'Extras', icon: '🕶️' },
];
const COLOR_KEY = { hair: ['hairColor', HAIR_COLORS], top: ['topColor', CLOTH_COLORS], bottom: ['bottomColor', CLOTH_COLORS], dress: ['dressColor', CLOTH_COLORS], hat: ['hatColor', CLOTH_COLORS], acc: ['accColor', CLOTH_COLORS] };

export function setupAvatarUI(game) {
  const st = game.state;
  const owned = (it) => it.price === 0 || st.owned.avatar.includes(it.id);

  function editor(mode) {
    return new Promise((resolve) => {
      const P = preview();
      const look = { ...st.player.look };
      const start = { ...look };
      if (!P.avatar) { P.avatar = new Avatar(look); P.scene.add(P.avatar.root); }
      P.avatar.setLook(look);
      let slot = mode === 'create' ? 'look' : mode === 'shop' ? 'hair' : 'top';
      let spin = 0.4, t = 0;
      const loop = () => {
        P.raf = requestAnimationFrame(loop);
        t += 0.016;
        spin += 0.01;
        P.avatar.root.rotation.y = Math.sin(spin) * 0.6;
        P.avatar.update(0.016, 0, false);
        P.r.render(P.scene, P.cam);
      };
      loop();
      const title = mode === 'create' ? '✨ Create your character' : mode === 'shop' ? '👗 Sparkle Style' : '🚪 My Wardrobe';
      const buyBar = h('div', { style: { minHeight: '40px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' } });
      const nameInput = mode === 'create' ? h('input', { class: 'name-input', value: st.player.name || '', placeholder: 'Your name', maxlength: '14', style: { fontSize: '16px', padding: '6px 10px' } }) : null;
      const left = h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '210px', flexShrink: 0 } }, P.canvas, nameInput, buyBar);
      P.canvas.style.width = '170px'; P.canvas.style.height = '221px'; P.canvas.style.borderRadius = '20px'; P.canvas.style.background = 'linear-gradient(180deg,#fff0f8,#efe6ff)';
      const slotTabs = h('div', { class: 'tabs', style: { padding: '0 0 8px' } });
      const content = h('div', { style: { overflowY: 'auto', flex: 1, touchAction: 'pan-y' } });
      const right = h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, maxHeight: 'calc(100vh - 110px)' } }, slotTabs, content);
      const wrap = h('div', { style: { display: 'flex', gap: '12px', alignItems: 'flex-start' } }, left, right);
      let pending = null; // item to buy
      const m = modal(title, wrap, {
        noClose: mode === 'create',
        headExtra: h('button', { class: 'btn mint small', onclick: () => { click(); done(); } }, mode === 'create' ? "Let's go! ▶" : '✓ Done'),
        onClose: () => finish(),
      });
      const apply = () => { P.avatar.setLook(look); renderBuy(); };
      const renderBuy = () => {
        buyBar.innerHTML = '';
        const unowned = ['hair', 'top', 'bottom', 'dress', 'hat', 'acc'].map((s) => AVATAR_ITEMS.find((i) => i.id === look[s])).filter((i) => i && !owned(i));
        pending = unowned;
        if (!unowned.length) return;
        const cost = unowned.reduce((a, i) => a + i.price, 0);
        if (mode === 'shop') buyBar.appendChild(h('button', { class: 'btn sun', onclick: () => { click(); buy(); } }, `Buy 🪙 ${fmt(cost)}`));
        else buyBar.appendChild(h('div', { class: 'muted', style: { textAlign: 'center' } }, '🔒 Buy this at Sparkle Style'));
      };
      const buy = () => {
        const cost = pending.reduce((a, i) => a + i.price, 0);
        const lvl = levelOf(st);
        const locked = pending.find((i) => (i.level || 1) > lvl);
        if (locked) return toast(`${locked.name} unlocks at level ${locked.level}`, { icon: '🔒' });
        if (!spend(st, cost)) return toast('Not enough coins yet!', { icon: '🪙' });
        for (const i of pending) st.owned.avatar.push(i.id);
        game.audio?.play('coin');
        toast('Bought! You look amazing! ✨', { icon: '👗' });
        game.emit('buyAvatar', pending.map((i) => i.id));
        renderBuy();
        render();
      };
      const swatches = (list, key) => {
        const sw = h('div', { class: 'swatches', style: { margin: '6px 0 10px' } });
        for (const c of list) sw.appendChild(h('button', { class: 'sw' + (look[key] === c ? ' on' : ''), style: { background: c }, onclick: () => { click(); look[key] = c; apply(); [...sw.children].forEach((x) => x.classList.toggle('on', x.style.background === x.style.background && x === sw.children[list.indexOf(c)])); } }));
        return sw;
      };
      const render = () => {
        slotTabs.innerHTML = '';
        for (const s of SLOTS) slotTabs.appendChild(h('button', { class: 'tab' + (s.id === slot ? ' on' : ''), onclick: () => { click(); slot = s.id; render(); } }, s.icon + ' ' + s.name));
        content.innerHTML = '';
        if (slot === 'look') {
          content.append(h('div', { class: 'section-title', style: { marginTop: 0 } }, 'Skin'), swatches(SKINS, 'skin'), h('div', { class: 'section-title' }, 'Eyes'), swatches(EYE_COLORS, 'eyes'), h('div', { class: 'section-title' }, 'Shoes'), swatches(CLOTH_COLORS, 'shoes'));
          return;
        }
        const [ck, cl] = COLOR_KEY[slot];
        content.appendChild(h('div', { class: 'section-title', style: { marginTop: 0 } }, 'Color'));
        content.appendChild(swatches(cl, ck));
        const g = h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))' } });
        const items = AVATAR_ITEMS.filter((i) => i.slot === slot);
        if (slot === 'dress') g.appendChild(h('button', { class: 'card' + (!look.dress ? ' sel' : ''), onclick: () => { click(); look.dress = null; apply(); render(); } }, h('div', { class: 'thumb' }, '🚫'), h('div', { class: 'nm' }, 'No dress')));
        for (const it of items) {
          const own = owned(it);
          const lock = (it.level || 1) > levelOf(st) ? `Lvl ${it.level}` : null;
          const sel = look[slot] === it.id;
          g.appendChild(h('button', { class: 'card' + (sel ? ' sel' : '') + (lock && !own ? ' locked' : ''), onclick: () => {
            click();
            if (mode !== 'shop' && !own) { toast('Get this at Sparkle Style in town!', { icon: '👗' }); }
            look[slot] = it.id;
            if (slot === 'top' || slot === 'bottom') look.dress = null;
            apply(); render();
          } }, h('div', { class: 'thumb', style: { fontSize: '34px' } }, it.icon), h('div', { class: 'nm' }, it.name),
            h('div', { class: 'price' + (own ? ' free' : '') }, own ? (it.price ? '✓ Owned' : 'Free') : lock || `🪙 ${fmt(it.price)}`)));
        }
        content.appendChild(g);
      };
      render();
      renderBuy();
      let finished = false;
      function done() {
        // unowned items can't be kept: fall back to what you had
        for (const s of ['hair', 'top', 'bottom', 'dress', 'hat', 'acc']) {
          const it = AVATAR_ITEMS.find((i) => i.id === look[s]);
          if (it && !owned(it)) look[s] = start[s];
        }
        if (nameInput) st.player.name = nameInput.value.trim().slice(0, 14) || 'Blossom';
        st.player.look = look;
        game.avatar.setLook(look);
        game.emit('look');
        m.close();
      }
      function finish() {
        if (finished) return;
        finished = true;
        cancelAnimationFrame(P.raf);
        resolve();
      }
    });
  }

  game.characterCreator = () => editor('create');
  game.openWardrobe = () => editor('wardrobe');
  const bq = BUILDINGS.find((b) => b.id === 'boutique');
  game.world.addInteract({ x: bq.x + Math.sin(bq.face) * (bq.d / 2 + 1.4), z: bq.z + Math.cos(bq.face) * (bq.d / 2 + 1.4), r: 2.6, label: 'Sparkle Style', icon: '👗', onUse: () => editor('shop') });

  // emotes
  let emoteBox = null;
  game.openEmotes = () => {
    if (emoteBox) { emoteBox.remove(); emoteBox = null; return; }
    emoteBox = h('div', { class: 'interactive', style: { position: 'absolute', right: 'calc(100px + var(--sr))', bottom: 'calc(90px + var(--sb))', background: 'var(--card)', borderRadius: '20px', padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(3, 56px)', gap: '6px', boxShadow: '0 6px 20px rgba(60,20,70,.2)', zIndex: 30 } });
    for (const e of EMOTES) {
      emoteBox.appendChild(h('button', { class: 'tool', onclick: () => {
        click();
        game.avatar.playEmote(e.id, e.id === 'sit' ? 6 : 2.4);
        if (e.id === 'heart') game.fx.burst(game.player.pos, 'hearts');
        if (e.id === 'dance') game.fx.burst(game.player.pos, 'notes', { n: 3 });
        st.stats.emotes = (st.stats.emotes || 0) + 1;
        game.pets?.actor && !game.pets.actor.isEgg && Math.random() < 0.6 && game.pets.actor.trick(e.id === 'dance' ? 'dance' : 'happy');
        game.emit('emote', e.id);
        emoteBox.remove(); emoteBox = null;
      } }, e.icon, h('small', {}, e.name)));
    }
    root().appendChild(emoteBox);
  };
}
