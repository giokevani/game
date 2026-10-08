// Build mode: touch-friendly house editor (floors, walls, doors & windows,
// paint, furniture placement) with an orbiting top-down camera.
import * as THREE from 'three';
import * as HM from './model.js';
import { ORIGIN, FLOOR_Y, itemGroup } from './view.js';
import { FURN, FURNITURE, CATEGORIES, PALETTE } from '../data/furniture.js';
import { FLOORS, WALLPAPERS, EXTERIORS, ROOF_COLORS, OPENINGS, FLOOR, WALLPAPER, EXTERIOR, OPENING, PRICES } from '../data/houseStyles.js';
import { h, root, click, toast, modal, celebrate, confirmBox, fmt } from '../ui/ui.js';
import { spend, addCoins } from '../core/state.js';
import { unlockedLevel } from '../core/freeplay.js';
import { furnitureThumb, lazyThumb } from './thumbs.js';

const T = HM.TILE;

const TOOLS = [
  { id: 'move', icon: '👆', label: 'Select' },
  { id: 'furniture', icon: '🛋️', label: 'Furniture' },
  { id: 'floor', icon: '🟫', label: 'Floors' },
  { id: 'walls', icon: '🧱', label: 'Walls' },
  { id: 'openings', icon: '🚪', label: 'Doors' },
  { id: 'paint', icon: '🎨', label: 'Paint' },
  { id: 'erase', icon: '🧽', label: 'Erase' },
  { id: 'house', icon: '🏡', label: 'House' },
];

// small 2D preview of a floor / wallpaper pattern
const patCache = new Map();
export function patternPreview(style) {
  const key = style.id;
  if (patCache.has(key)) return patCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 72;
  const x = c.getContext('2d');
  x.fillStyle = style.color;
  x.fillRect(0, 0, 72, 72);
  const lt = 'rgba(255,255,255,0.55)', dk = 'rgba(80,50,60,0.18)';
  const p = style.pat;
  if (p === 1) { x.fillStyle = lt; for (let i = 0; i < 72; i += 14) x.fillRect(i, 0, 7, 72); }
  if (p === 2) { x.fillStyle = lt; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.beginPath(); x.arc(9 + i * 18, 9 + j * 18 + (i % 2) * 9, 4, 0, 7); x.fill(); } }
  if (p === 3) { x.fillStyle = dk; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) x.fillRect(i * 18, j * 18, 18, 18); }
  if (p === 4 || p === 15) { x.strokeStyle = dk; x.lineWidth = 2; for (let j = 0; j < 72; j += 12) { x.beginPath(); x.moveTo(0, j); x.lineTo(72, j); x.stroke(); x.beginPath(); x.moveTo((j * 7) % 60 + 6, j); x.lineTo((j * 7) % 60 + 6, j + 12); x.stroke(); } }
  if (p === 5 || p === 3) { x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 2; for (let i = 0; i <= 72; i += 24) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 72); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(72, i); x.stroke(); } }
  if (p === 6) { x.strokeStyle = 'rgba(255,245,235,0.9)'; x.lineWidth = 2; for (let j = 0; j < 72; j += 10) { x.beginPath(); x.moveTo(0, j); x.lineTo(72, j); x.stroke(); for (let i = (j / 10) % 2 ? 0 : 12; i < 72; i += 24) { x.beginPath(); x.moveTo(i, j); x.lineTo(i, j + 10); x.stroke(); } } }
  if (p === 7 || p === 8 || p === 11) { x.font = '16px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; const e = p === 7 ? '💗' : p === 8 ? '⭐' : '🌸'; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) x.fillText(e, 12 + i * 24 + (j % 2) * 8, 12 + j * 24); }
  if (p === 9) { x.fillStyle = lt; x.fillRect(0, 36, 72, 36); x.fillStyle = dk; x.fillRect(0, 34, 72, 3); }
  if (p === 10) { x.fillStyle = lt; for (let i = -72; i < 72; i += 16) { x.beginPath(); x.moveTo(i, 72); x.lineTo(i + 8, 72); x.lineTo(i + 80, 0); x.lineTo(i + 72, 0); x.fill(); } }
  if (p === 12) { for (let i = 0; i < 200; i++) { x.fillStyle = i % 2 ? lt : dk; x.fillRect(Math.random() * 72, Math.random() * 72, 2, 2); } }
  if (p === 13) { x.strokeStyle = 'rgba(160,150,170,0.5)'; x.lineWidth = 1.5; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(0, 10 + i * 18); x.bezierCurveTo(24, i * 18, 48, 30 + i * 12, 72, 14 + i * 16); x.stroke(); } }
  if (p === 14) { x.fillStyle = dk; for (let j = 0; j < 72; j += 12) x.fillRect(0, j, 72, 2); }
  if (p === 16) { const g = x.createLinearGradient(0, 0, 72, 72); ['#ffb3b3', '#ffe0a3', '#fff7a8', '#baf0bf', '#b8dcff', '#dcc8ff'].forEach((cc, i) => g.addColorStop(i / 5, cc)); x.fillStyle = g; x.fillRect(0, 0, 72, 72); }
  const url = c.toDataURL();
  patCache.set(key, url);
  return url;
}

export class BuildMode {
  constructor(game, sys) {
    this.game = game;
    this.sys = sys;
    this.active = false;
    this.tool = 'move';
    this.floorStyle = 'fl_oak';
    this.erase = false;
    this.opening = 'door_wood';
    this.paintKind = 'walls';
    this.paintStyle = 'wp_pink';
    this.cat = 'living';
    this.cam = { yaw: 0, pitch: 0.95, dist: 26, target: new THREE.Vector3(), tYaw: 0 };
    this.ray = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR_Y);
    this.pointers = new Map();
    this.ghost = null;
    this.onDown = (e) => this.down(e);
    this.onMove = (e) => this.move(e);
    this.onUp = (e) => this.up(e);
    this.onWheel = (e) => { if (!this.active) return; this.cam.dist = Math.max(8, Math.min(46, this.cam.dist + e.deltaY * 0.02)); };
  }

  get house() { return this.sys.house; }
  get state() { return this.game.state; }
  get lvl() { return unlockedLevel(); } // free play: everything is open

  enter() {
    if (this.active) return;
    const g = this.game;
    if (g.mode !== 'play') return;
    this.active = true;
    g.mode = 'build';
    g.input.buildMode = true;
    g.hud.setVisible(false);
    g.player.stand();
    const r = HM.plotRange(this.house.size);
    const cx = ORIGIN.x + (r.i0 + r.i1) * T / 2, cz = ORIGIN.z + (r.j0 + r.j1) * T / 2;
    this.cam.target.set(cx, 0, cz + 2);
    this.cam.dist = this.house.size * 1.7 + 6;
    this.cam.yaw = 0; this.cam.tYaw = 0;
    this.sys.view.setGrid(true, this.house.size);
    const cv = g.renderer.domElement;
    cv.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
    cv.addEventListener('wheel', this.onWheel, { passive: true });
    this.buildUI();
    this.setTool('move');
    g.audio?.play('open');
    g.emit('buildmode');
  }

  exit() {
    if (!this.active) return;
    if (this.ghost) this.cancelGhost();
    const g = this.game;
    this.active = false;
    g.mode = 'play';
    g.input.buildMode = false;
    g.hud.setVisible(true);
    this.sys.view.setGrid(false);
    this.sys.view.showTile(null);
    this.sys.view.showEdge(null);
    const cv = g.renderer.domElement;
    cv.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
    cv.removeEventListener('wheel', this.onWheel);
    this.ui?.remove();
    this.ui = null;
    g.camera.clearViewOffset();
    this.viewOff = 0;
    // don't leave the player stuck inside a wall
    g.world.resolve(g.player.pos, g.player.radius, g.player.pos.y);
    g.player.pos.y = g.world.groundAt(g.player.pos.x, g.player.pos.z, g.player.pos.y + 1);
    g.player.sync();
    g.rig.snap(g.player.pos);
    this.sys.checkStars();
    g.save();
  }

  // ---------- UI ----------
  buildUI() {
    this.ui = h('div', { class: 'build-ui' });
    this.coinsEl = h('span', {});
    this.starsEl = h('span', { class: 'stars' });
    this.valueEl = h('span', { class: 'muted' });
    const top = h('div', { class: 'build-top' },
      h('div', { class: 'pill coins' }, h('span', { class: 'ico' }, '🪙'), this.coinsEl),
      h('button', { class: 'mbtn', onclick: () => { click(); this.cam.tYaw += Math.PI / 4; } }, '⟲'),
      h('div', { class: 'pill', style: { gap: '8px', padding: '0 12px' } }, this.starsEl, this.valueEl),
      h('button', { class: 'mbtn', onclick: () => { click(); this.cam.tYaw -= Math.PI / 4; } }, '⟳'));
    const done = h('button', { class: 'btn mint build-done', onclick: () => { click(); this.exit(); } }, '✓ Done');
    this.bar = h('div', { class: 'build-bar' });
    this.toolBtns = {};
    for (const t of TOOLS) {
      const b = h('button', { class: 'tool', onclick: () => { click(); this.setTool(t.id); } }, t.icon, h('small', {}, t.label));
      this.toolBtns[t.id] = b;
      this.bar.appendChild(b);
    }
    this.drawer = h('div', { class: 'build-drawer hide' });
    this.placeBar = h('div', { class: 'place-bar hide' });
    this.ui.append(top, done, this.drawer, this.placeBar, this.bar);
    root().appendChild(this.ui);
    this.refreshTop();
  }

  refreshTop() {
    if (!this.ui) return;
    this.coinsEl.textContent = fmt(this.state.player.coins);
    const r = this.sys.rating();
    this.starsEl.textContent = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
    this.valueEl.textContent = r.next ? `${r.score}/${r.next} pts` : 'Dream home!';
  }

  setTool(id) {
    if (this.ghost) this.cancelGhost();
    this.tool = id;
    for (const [k, b] of Object.entries(this.toolBtns)) b.classList.toggle('on', k === id);
    this.sys.view.showTile(null);
    this.sys.view.showEdge(null);
    this.drawer.innerHTML = '';
    this.drawer.classList.remove('hide');
    this.drawer.classList.toggle('short', ['move', 'walls'].includes(id));
    const hint = (t) => this.drawer.appendChild(h('div', { class: 'hint' }, t));
    if (id === 'move') { hint('👆 Tap furniture to move, turn, recolor or sell it. Drag to spin the camera, pinch to zoom.'); }
    else if (id === 'furniture') this.furnitureDrawer();
    else if (id === 'floor') this.styleDrawer('floor');
    else if (id === 'walls') hint(`🧱 Tap the line between two floor tiles to add or remove a wall (${PRICES.wall} 🪙). Outside walls build themselves!`);
    else if (id === 'openings') this.openingDrawer();
    else if (id === 'paint') this.styleDrawer('paint');
    else if (id === 'house') { this.drawer.classList.add('hide'); this.housePanel(); }
    else if (id === 'erase') { this.drawer.classList.add('short'); hint('🧽 Tap or drag over floor to remove it. Its walls and doors go too, and furniture goes back into your bag.'); }
    if (id === 'erase') this.erase = true;
    else if (id !== 'floor') this.erase = false;
  }

  card(o) {
    const img = h('img', { alt: '' });
    const locked = o.locked;
    const el = h('button', { class: 'card' + (o.sel ? ' sel' : '') + (locked ? ' locked' : ''), onclick: () => { click(); o.onPick(); } },
      h('div', { class: 'thumb' }, o.emoji ? o.emoji : img),
      h('div', { class: 'nm' }, o.name),
      h('div', { class: 'price' + (o.price === 0 ? ' free' : '') }, locked ? locked : o.price === 0 ? 'Free' : `🪙 ${fmt(o.price)}`),
      locked ? h('span', { class: 'lock' }, '🔒') : null);
    if (o.thumb) lazyThumb(img, o.thumb, o.thumbKey);
    else if (o.src) img.src = o.src;
    return el;
  }

  lockText(o) {
    if (o.unlock && !this.state.unlocks[o.unlock]) return o.unlock === 'cave' ? 'Crystal Cove' : o.unlock === 'sky' ? 'Sky Island' : 'Festival prize';
    if ((o.lvl || 1) > this.lvl) return `Level ${o.lvl}`;
    return null;
  }

  furnitureDrawer() {
    const tabs = h('div', { class: 'tabs icon-tabs', style: { paddingTop: '8px' } });
    const strip = h('div', { class: 'strip' });
    const catName = h('div', { class: 'hint', style: { padding: '0 12px', fontSize: '15px' } }, CATEGORIES.find((c) => c.id === this.cat).name);
    const show = () => {
      strip.innerHTML = '';
      const items = FURNITURE.filter((f) => f.cat === this.cat).sort((a, b) => (a.lvl || 1) - (b.lvl || 1) || a.price - b.price);
      for (const it of items) {
        const lock = this.lockText(it);
        strip.appendChild(this.card({ name: it.name, price: it.price, locked: lock, thumb: () => furnitureThumb(it.id), thumbKey: 'f:' + it.id + ':' + it.c,
          onPick: () => {
            if (lock) { toast(`Unlocks at ${lock}`, { icon: '🔒' }); return; }
            if (this.state.player.coins < it.price) { toast('Not enough coins yet — try a job in town!', { icon: '🪙' }); this.game.audio?.play('no'); return; }
            this.startGhost(it.id, it.c);
          } }));
      }
      strip.scrollLeft = 0;
    };
    for (const c of CATEGORIES) {
      const b = h('button', { class: 'tab' + (c.id === this.cat ? ' on' : ''), title: c.name, onclick: () => { click(); this.cat = c.id; [...tabs.children].forEach((x) => x.classList.remove('on')); b.classList.add('on'); catName.textContent = c.name; show(); } }, c.icon);
      tabs.appendChild(b);
    }
    this.drawer.append(tabs, catName, strip);
    show();
  }

  styleDrawer(kind) {
    const strip = h('div', { class: 'strip' });
    const head = h('div', { class: 'tabs', style: { paddingTop: '8px' } });
    const render = () => {
      strip.innerHTML = '';
      if (kind === 'floor') {
        strip.appendChild(this.card({ name: 'Erase', price: 0, emoji: '🧽', sel: this.erase, onPick: () => { this.erase = true; render(); } }));
        for (const f of FLOORS) {
          const lock = this.lockText(f);
          strip.appendChild(this.card({ name: f.name, price: PRICES.tile + f.price, locked: lock, src: patternPreview(f), sel: !this.erase && this.floorStyle === f.id,
            onPick: () => { if (lock) return toast(`Unlocks at ${lock}`, { icon: '🔒' }); this.erase = false; this.floorStyle = f.id; render(); } }));
        }
      } else {
        const list = this.paintKind === 'walls' ? WALLPAPERS : FLOORS;
        for (const f of list) {
          const lock = this.lockText(f);
          const price = this.paintKind === 'walls' ? PRICES.paint + f.price : f.price;
          strip.appendChild(this.card({ name: f.name, price, locked: lock, src: patternPreview(f), sel: this.paintStyle === f.id,
            onPick: () => { if (lock) return toast(`Unlocks at ${lock}`, { icon: '🔒' }); this.paintStyle = f.id; render(); } }));
        }
      }
    };
    if (kind === 'floor') head.appendChild(h('div', { class: 'hint', style: { padding: '2px 4px' } }, '🟫 Tap or drag on the grid to lay floor. New tiles make your house bigger!'));
    else {
      for (const k of ['walls', 'floors']) {
        const b = h('button', { class: 'tab' + (this.paintKind === k ? ' on' : ''), onclick: () => {
          click(); this.paintKind = k; this.paintStyle = k === 'walls' ? 'wp_pink' : 'fl_oak';
          [...head.querySelectorAll('.tab')].forEach((x) => x.classList.remove('on')); b.classList.add('on'); render();
        } }, k === 'walls' ? '🖌️ Wallpaper' : '🟫 Floor');
        head.appendChild(b);
      }
      head.appendChild(h('div', { class: 'hint', style: { padding: '2px 4px' } }, 'Pick a style, then tap a room.'));
    }
    this.drawer.append(head, strip);
    render();
  }

  openingDrawer() {
    const strip = h('div', { class: 'strip' });
    const render = () => {
      strip.innerHTML = '';
      strip.appendChild(this.card({ name: 'Remove', price: 0, emoji: '🧽', sel: this.opening === 'remove', onPick: () => { this.opening = 'remove'; render(); } }));
      for (const o of OPENINGS) {
        const lock = this.lockText(o);
        const emoji = o.kind === 'door' ? '🚪' : o.kind === 'arch' ? '⛩️' : o.round ? '⭕' : '🪟';
        strip.appendChild(this.card({ name: o.name, price: o.price, locked: lock, emoji, sel: this.opening === o.id,
          onPick: () => { if (lock) return toast(`Unlocks at ${lock}`, { icon: '🔒' }); this.opening = o.id; render(); } }));
      }
    };
    this.drawer.append(h('div', { class: 'hint', style: { paddingBottom: '0' } }, '🚪 Pick a door or window, then tap a wall.'), strip);
    render();
  }

  housePanel() {
    const r = this.sys.rating();
    modal('My House', (b, close) => {
      const P = r.parts;
      const rows = [['🏠 Space', P.space], ['🚪 Rooms', P.rooms], ['🛋️ Furniture', P.furniture], ['🌈 Variety', P.variety], ['🎨 Style', P.style], ['💡 Lights', P.lights], ['🌷 Garden', P.garden], ['🪟 Doors & windows', P.windows], ['🛁 Bed, bath & kitchen', P.essentials]];
      b.appendChild(h('div', { class: 'section-title' }, `Home Rating ${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)} — ${r.score} points`));
      b.appendChild(h('div', { class: 'muted' }, r.next ? `${r.next - r.score} more points for the next star. House value: 🪙 ${fmt(r.value)}` : `Maximum stars! House value: 🪙 ${fmt(r.value)}`));
      b.appendChild(h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', marginTop: '8px' } },
        rows.map(([n, v]) => h('div', { class: 'li' }, h('div', { class: 't', style: { flex: 1 } }, n), h('b', {}, String(v))))));
      // plot size
      const idx = HM.PLOT_SIZES.indexOf(this.house.size);
      b.appendChild(h('div', { class: 'section-title' }, `🌳 Land: ${this.house.size} × ${this.house.size} tiles`));
      if (idx < HM.PLOT_SIZES.length - 1) {
        const next = HM.PLOT_SIZES[idx + 1], price = HM.PLOT_PRICES[idx + 1], need = [0, 4, 8, 13][idx + 1];
        const ok = this.lvl >= need;
        b.appendChild(h('div', { class: 'row' },
          h('div', { class: 'muted', style: { flex: 1 } }, ok ? `Grow your land to ${next} × ${next} for more rooms and a bigger garden.` : `Reach level ${need} to buy more land.`),
          h('button', { class: 'btn sun' + (ok ? '' : ' disabled'), onclick: () => {
            click();
            if (!spend(this.state, price)) { toast('Not enough coins yet!', { icon: '🪙' }); return; }
            this.house.size = next;
            this.state.unlocks.plot = idx + 1;
            this.sys.rebuild();
            this.sys.view.setGrid(true, next);
            this.cam.dist = next * 1.7 + 6;
            close();
            celebrate('More land!', `Your plot is now ${next} × ${next}`);
            this.game.emit('plot', next);
            this.refreshTop();
          } }, `🪙 ${fmt(price)}`)));
      } else b.appendChild(h('div', { class: 'muted' }, 'You own the biggest plot in Blossom Bay!'));
      // exterior
      b.appendChild(h('div', { class: 'section-title' }, '🧱 Outside walls'));
      const ex = h('div', { class: 'grid' });
      for (const e of EXTERIORS) {
        const lock = this.lockText(e);
        ex.appendChild(this.card({ name: e.name, price: e.price, src: patternPreview(e), locked: lock, sel: this.house.ext === e.id, onPick: () => {
          if (lock) return toast(`Unlocks at ${lock}`, { icon: '🔒' });
          if (this.house.ext === e.id) return;
          if (!spend(this.state, e.price)) return toast('Not enough coins yet!', { icon: '🪙' });
          this.house.ext = e.id; this.sys.rebuild(); close(); this.housePanel(); this.refreshTop();
        } }));
      }
      b.appendChild(ex);
      b.appendChild(h('div', { class: 'section-title' }, '🏠 Roof color (free)'));
      const sw = h('div', { class: 'swatches' });
      for (const c of ROOF_COLORS) sw.appendChild(h('button', { class: 'sw' + (this.house.roof === c ? ' on' : ''), style: { background: c }, onclick: () => { click(); this.house.roof = c; this.sys.rebuild(); close(); this.housePanel(); } }));
      b.appendChild(sw);
      b.appendChild(h('div', { class: 'muted', style: { marginTop: '8px' } }, 'Tip: the roof hides while you build and when you walk inside.'));
    }, { onClose: () => { if (this.active && this.tool === 'house') this.setTool('move'); } });
  }

  // ---------- pointer handling ----------
  screenToLocal(x, y) {
    const ndc = new THREE.Vector2((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    this.ray.setFromCamera(ndc, this.game.camera);
    const p = new THREE.Vector3();
    if (!this.ray.ray.intersectPlane(this.plane, p)) return null;
    return { x: p.x - ORIGIN.x, z: p.z - ORIGIN.z };
  }

  isUI(e) { return e.target !== this.game.renderer.domElement; }

  down(e) {
    if (!this.active || this.isUI(e)) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: 0, t: performance.now(), button: e.button });
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      // a second finger means pinch-zoom: forget the paint stroke, and take
      // back any tile the first finger already laid in the last moment
      this.pendingPaint = null;
      if (this.stroke && performance.now() - this.stroke.t0 < 600) this.undoStroke();
      this.stroke = null;
      return;
    }
    if (this.pointers.size > 2) return;
    const loc = this.screenToLocal(e.clientX, e.clientY);
    if (!loc) return;
    if (this.ghost && e.button !== 2) { this.dragGhost = true; this.moveGhost(loc.x, loc.z); return; }
    // painting starts once the finger moves or lifts, so a pinch never paints
    if ((this.tool === 'floor' || this.tool === 'erase') && e.button !== 2) this.pendingPaint = { loc, id: e.pointerId };
  }

  move(e) {
    if (!this.active) return;
    const p = this.pointers.get(e.pointerId);
    const loc0 = this.screenToLocal(e.clientX, e.clientY);
    if (!p) {
      // hover highlight (mouse)
      if (loc0 && e.pointerType === 'mouse') this.hoverAt(loc0);
      return;
    }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    p.moved += Math.abs(dx) + Math.abs(dy);
    if (this.pointers.size === 2 && this.pinch) {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      this.cam.dist = Math.max(8, Math.min(46, this.cam.dist * (this.pinch.d / Math.max(1, d))));
      this.pan(mx - this.pinch.mx, my - this.pinch.my);
      this.pinch = { d, mx, my };
      return;
    }
    if (!loc0) return;
    if (this.dragGhost && this.ghost) { this.moveGhost(loc0.x, loc0.z); return; }
    if (this.pendingPaint && this.pendingPaint.id === e.pointerId && p.moved > 6) { this.startStroke(this.pendingPaint.loc); this.pendingPaint = null; }
    if (this.stroke) { this.paintFloor(loc0); return; }
    this.hoverAt(loc0);
    // otherwise: drag spins the camera
    if (p.moved > 8 && (this.tool === 'move' || this.tool === 'furniture' || e.button === 2 || this.tool === 'house')) {
      this.cam.tYaw -= dx * 0.008;
      this.cam.pitch = Math.max(0.45, Math.min(1.35, this.cam.pitch + dy * 0.004));
    } else if (p.moved > 8 && (this.tool === 'walls' || this.tool === 'openings' || this.tool === 'paint')) {
      this.cam.tYaw -= dx * 0.008;
      this.cam.pitch = Math.max(0.45, Math.min(1.35, this.cam.pitch + dy * 0.004));
    }
  }

  up(e) {
    if (!this.active) return;
    const p = this.pointers.get(e.pointerId);
    this.pointers.delete(e.pointerId);
    if (this.pointers.size < 2) this.pinch = null;
    if (!p) return;
    if (this.pendingPaint && this.pendingPaint.id === e.pointerId) {
      // a single tap paints (or erases) one tile
      const pp = this.pendingPaint;
      this.pendingPaint = null;
      if (this.pointers.size === 0) { this.startStroke(pp.loc); this.endStroke(); }
      return;
    }
    if (this.stroke) { this.endStroke(); return; }
    if (this.dragGhost) { this.dragGhost = false; return; }
    const tap = p.moved < 12 && performance.now() - p.t < 500;
    if (!tap) return;
    const loc = this.screenToLocal(e.clientX, e.clientY);
    if (!loc) return;
    if (this.tool === 'walls') this.tapWall(loc);
    else if (this.tool === 'openings') this.tapOpening(loc);
    else if (this.tool === 'paint') this.tapPaint(loc);
    else if (this.tool === 'move' || this.tool === 'furniture') this.tapSelect(e.clientX, e.clientY, loc);
  }

  pan(dx, dy) {
    const c = this.cam;
    const s = c.dist * 0.0022;
    const fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw);
    const rx = Math.cos(c.yaw), rz = -Math.sin(c.yaw);
    c.target.x += (-dx * rx + dy * fx) * s;
    c.target.z += (-dx * rz + dy * fz) * s;
    const r = HM.plotRange(this.house.size);
    c.target.x = Math.max(ORIGIN.x + r.i0 * T - 4, Math.min(ORIGIN.x + r.i1 * T + 4, c.target.x));
    c.target.z = Math.max(ORIGIN.z + r.j0 * T - 4, Math.min(ORIGIN.z + r.j1 * T + 6, c.target.z));
  }

  hoverAt(loc) {
    const v = this.sys.view;
    if (this.tool === 'floor' || this.tool === 'paint' || this.tool === 'erase') {
      const i = Math.floor(loc.x / T), j = Math.floor(loc.z / T);
      if (HM.inPlot(this.house, i, j)) v.showTile(i, j, this.erase && this.tool !== 'paint' ? 0xff8a8a : 0x7fffd0); else v.showTile(null);
    } else if (this.tool === 'walls' || this.tool === 'openings') {
      const k = this.edgeAt(loc);
      v.showEdge(k);
    }
  }

  edgeAt(loc) {
    const dh = Math.abs(loc.z - Math.round(loc.z / T) * T);
    const dv = Math.abs(loc.x - Math.round(loc.x / T) * T);
    if (Math.min(dh, dv) > 0.7) return null;
    if (dh < dv) return `h,${Math.floor(loc.x / T)},${Math.round(loc.z / T)}`;
    return `v,${Math.round(loc.x / T)},${Math.floor(loc.z / T)}`;
  }

  // ---------- floor painting ----------
  paintFloor(loc) {
    const i = Math.floor(loc.x / T), j = Math.floor(loc.z / T);
    const k = HM.tkey(i, j);
    const s = this.stroke;
    if (!s || s.done.has(k)) return;
    s.done.add(k);
    this.sys.view.showTile(i, j, this.erase ? 0xff8a8a : 0x7fffd0);
    if (!HM.inPlot(this.house, i, j)) { if (!s.warned) { toast('That is outside your land. Buy more land in 🏡 House.', { icon: '🌳' }); s.warned = true; } return; }
    const hs = this.house;
    s.prev ||= {};
    if (!(k in s.prev)) s.prev[k] = hs.tiles[k] ? { ...hs.tiles[k] } : null;
    if (this.erase) {
      if (!hs.tiles[k]) return;
      if (Object.keys(hs.tiles).length <= 1) { toast('Your house needs at least one tile!', { icon: '🏠' }); return; }
      HM.removeTile(hs, i, j);
      addCoins(this.state, PRICES.tile);
      this.game.audio?.play('pop');
    } else {
      const fl = FLOOR[this.floorStyle];
      const cur = hs.tiles[k];
      if (cur && cur.f === fl.id) return;
      const cost = (cur ? 0 : PRICES.tile) + fl.price;
      if (!spend(this.state, cost)) { if (!s.poor) toast('Not enough coins!', { icon: '🪙' }); s.poor = true; return; }
      HM.setTile(hs, i, j, fl.id);
      this.game.audio?.play('place');
      this.game.emit('tile');
    }
    s.dirty = true;
    const now = performance.now();
    if (!s.last || now - s.last > 90) { s.last = now; this.sys.view.rebuildStructure(hs); s.dirty = false; }
    this.refreshTop();
  }

  startStroke(loc) {
    this.stroke = { done: new Set(), prev: {}, blocked: false, spent: 0, t0: performance.now() };
    this.paintFloor(loc);
  }

  // put the tiles of the current stroke back the way they were
  undoStroke() {
    const s = this.stroke;
    if (!s) return;
    for (const [k, prev] of Object.entries(s.prev)) {
      const [i, j] = k.split(',').map(Number);
      if (prev) this.house.tiles[k] = { ...prev }; else HM.removeTile(this.house, i, j);
    }
    this.stroke = null;
    this.afterStructure();
  }

  endStroke() {
    const s = this.stroke;
    this.stroke = null;
    if (!s) return;
    this.afterStructure();
  }

  afterStructure() {
    this.packInvalid();
    this.sys.rebuild();
    this.refreshTop();
  }

  // put away furniture that no longer fits after walls change
  packInvalid() {
    const hs = this.house;
    const bad = [];
    for (const f of hs.furniture) {
      const it = FURN[f.id];
      if (!it) { bad.push(f); continue; }
      if (it.place === 'wall') {
        const s = HM.snapToWall(hs, it, f.x, f.z);
        if (!s.ok || s.r !== f.r || Math.hypot(s.x - f.x, s.z - f.z) > 0.35) bad.push(f);
      } else {
        const res = HM.checkPlace(hs, FURN, it, f.x, f.z, f.r, f.uid);
        if (!res.ok || Math.abs((res.y || 0) - (f.y || 0)) > 0.05) bad.push(f);
      }
    }
    if (!bad.length) return;
    let refund = 0;
    for (const f of bad) {
      hs.furniture.splice(hs.furniture.indexOf(f), 1);
      refund += FURN[f.id]?.price || 0;
    }
    addCoins(this.state, refund);
    toast(`${bad.length} item${bad.length > 1 ? 's were' : ' was'} in the way and got sold back (+${refund} 🪙)`, { icon: '📦', time: 3500 });
  }

  // ---------- walls / openings / paint ----------
  tapWall(loc) {
    const k = this.edgeAt(loc);
    if (!k) return;
    const hs = this.house;
    const e = HM.edgeInfo(hs, k);
    this.sys.view.showEdge(k);
    if (!(e.ha && e.hb)) { toast(e.exterior ? 'Outside walls are automatic — add or erase floor to change them.' : 'Walls go between two floor tiles.', { icon: '🧱' }); return; }
    if (hs.inner[k]) {
      delete hs.inner[k];
      if (hs.open[k]) { addCoins(this.state, OPENING[hs.open[k]]?.price || 0); delete hs.open[k]; }
      addCoins(this.state, PRICES.wall);
      this.game.audio?.play('pop');
    } else {
      if (!spend(this.state, PRICES.wall)) { toast('Not enough coins!', { icon: '🪙' }); return; }
      hs.inner[k] = true;
      this.game.audio?.play('place');
      this.game.emit('wall');
    }
    this.afterStructure();
  }

  tapOpening(loc) {
    const k = this.edgeAt(loc);
    if (!k) return;
    const hs = this.house;
    const e = HM.edgeInfo(hs, k);
    this.sys.view.showEdge(k);
    if (!e.wall) { toast('Tap on a wall.', { icon: '🧱' }); return; }
    const cur = hs.open[k];
    if (this.opening === 'remove') {
      if (!cur) return;
      addCoins(this.state, OPENING[cur]?.price || 0);
      delete hs.open[k];
      this.game.audio?.play('pop');
    } else {
      if (cur === this.opening) { toast('Already there! Pick 🧽 Remove to take it out.', { icon: '🚪' }); return; }
      const o = OPENING[this.opening];
      const refund = cur ? OPENING[cur]?.price || 0 : 0;
      if (this.state.player.coins + refund < o.price) { toast('Not enough coins!', { icon: '🪙' }); return; }
      addCoins(this.state, refund);
      spend(this.state, o.price);
      hs.open[k] = o.id;
      this.game.audio?.play('place');
      this.game.emit('opening', o.kind);
    }
    this.afterStructure();
  }

  tapPaint(loc) {
    const i = Math.floor(loc.x / T), j = Math.floor(loc.z / T);
    const hs = this.house;
    if (!hs.tiles[HM.tkey(i, j)]) { toast('Tap inside a room.', { icon: '🎨' }); return; }
    const room = HM.roomOf(hs, i, j);
    let cost = 0;
    if (this.paintKind === 'walls') {
      const wp = WALLPAPER[this.paintStyle];
      let n = 0;
      for (const k of room) {
        const [ti, tj] = k.split(',').map(Number);
        HM.edgesOfTile(ti, tj).forEach((ek, d) => { if (HM.edgeInfo(hs, ek).wall && hs.tiles[k].w[d] !== wp.id) n++; });
      }
      if (!n) { toast('This room already has that wallpaper!', { icon: '🎨' }); return; }
      cost = n * (PRICES.paint + wp.price);
      if (!spend(this.state, cost)) { toast(`That costs ${cost} 🪙 — not enough coins!`, { icon: '🪙' }); return; }
      HM.paintRoomWalls(hs, i, j, wp.id);
    } else {
      const fl = FLOOR[this.paintStyle];
      const n = room.filter((k) => hs.tiles[k].f !== fl.id).length;
      if (!n) { toast('This room already has that floor!', { icon: '🎨' }); return; }
      cost = n * fl.price;
      if (!spend(this.state, cost)) { toast(`That costs ${cost} 🪙 — not enough coins!`, { icon: '🪙' }); return; }
      HM.paintRoomFloor(hs, i, j, fl.id);
    }
    this.game.audio?.play('sparkle');
    this.game.emit('paint');
    this.sys.rebuild();
    this.refreshTop();
  }

  // ---------- furniture ----------
  tapSelect(sx, sy, loc) {
    if (this.ghost) return;
    const hs = this.house;
    // wall items: closest to the ray
    let best = null, bd = Infinity;
    const ray = this.ray.ray;
    for (const f of hs.furniture) {
      const it = FURN[f.id];
      if (!it) continue;
      if (it.place === 'wall') {
        const c = new THREE.Vector3(ORIGIN.x + f.x, FLOOR_Y + (f.y ?? it.y) + it.h / 2, ORIGIN.z + f.z);
        const d = ray.distanceToPoint(c);
        if (d < 0.6 && d < bd) { bd = d; best = f; }
      }
    }
    if (!best) {
      const hits = hs.furniture.filter((f) => {
        const it = FURN[f.id];
        if (!it || it.place === 'wall') return false;
        const b = HM.itemBox(it, f.x, f.z, f.r);
        return loc.x > b.x0 - 0.1 && loc.x < b.x1 + 0.1 && loc.z > b.z0 - 0.1 && loc.z < b.z1 + 0.1;
      });
      hits.sort((a, b) => (b.y || 0) - (a.y || 0) || (FURN[a.id].place === 'rug') - (FURN[b.id].place === 'rug') || FURN[a.id].fp[0] * FURN[a.id].fp[1] - FURN[b.id].fp[0] * FURN[b.id].fp[1]);
      best = hits[0];
    }
    if (best) this.startGhost(best.id, best.c, best);
  }

  startGhost(id, c, existing = null) {
    if (this.ghost) this.cancelGhost();
    const item = FURN[id];
    let x, z;
    if (existing) { x = existing.x; z = existing.z; }
    else {
      const loc = this.screenToLocal(window.innerWidth / 2, window.innerHeight * 0.45) || { x: 14, z: 22 };
      x = loc.x; z = loc.z;
    }
    const obj = itemGroup(id, c);
    const [w, d] = item.fp;
    const marker = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x5fe8a0, transparent: true, opacity: 0.45, depthWrite: false }));
    marker.scale.set(w + 0.1, 1, d + 0.1);
    marker.position.y = 0.03;
    marker.renderOrder = 7;
    const g = new THREE.Group();
    g.add(obj, marker);
    this.sys.view.group.add(g);
    this.ghost = { id, item, c, r: existing?.r ?? 0, x, z, y: existing?.y || 0, ok: false, obj: g, inner: obj, marker, existing, t: 0 };
    if (existing) this.sys.rebuild({ structure: false, exclude: existing.uid });
    this.moveGhost(x, z);
    this.showPlaceBar();
    this.drawer.classList.add('hide');
    this.game.audio?.play('pick');
  }

  moveGhost(x, z) {
    const gh = this.ghost;
    if (!gh) return;
    const it = gh.item;
    const hs = this.house;
    if (it.place === 'wall') {
      const s = HM.snapToWall(hs, it, x, z);
      if (s.ok) {
        gh.x = s.x; gh.z = s.z; gh.r = s.r; gh.y = gh.existing && gh.existing.r === s.r ? gh.existing.y ?? it.y : it.y ?? 1.5;
        gh.ok = !HM.wallItemClash(hs, FURN, it, { x: s.x, z: s.z, r: s.r, y: gh.y }, gh.existing?.uid);
        gh.reason = gh.ok ? '' : 'Something is already on that wall';
      } else { gh.x = x; gh.z = z; gh.ok = false; gh.reason = s.reason; gh.y = it.y ?? 1.5; }
    } else {
      const s = HM.snapPos(it, x, z, gh.r);
      gh.x = s.x; gh.z = s.z;
      const res = HM.checkPlace(hs, FURN, it, s.x, s.z, gh.r, gh.existing?.uid);
      gh.ok = res.ok; gh.reason = res.reason; gh.y = res.ok ? res.y || 0 : 0;
    }
    const base = this.sys.view.baseY({ x: gh.x, z: gh.z, y: gh.y, r: gh.r }, it);
    gh.obj.position.set(gh.x, base, gh.z);
    gh.obj.rotation.y = gh.r * Math.PI / 2;
    gh.marker.material.color.setHex(gh.ok ? 0x5fe8a0 : 0xff6f7d);
    gh.marker.visible = it.place !== 'wall';
    this.placeOk?.classList.toggle('disabled', !gh.ok);
  }

  showPlaceBar() {
    const gh = this.ghost;
    const it = gh.item;
    this.placeBar.innerHTML = '';
    this.placeBar.classList.remove('hide');
    const rot = h('button', { class: 'btn sky', onclick: () => { click(); if (it.place === 'wall') return toast('Wall items face out from the wall.', { icon: '🖼️' }); gh.r = (gh.r + 1) % 4; this.moveGhost(gh.x, gh.z); } }, '↻ Turn');
    const colors = h('div', { class: 'swatches', style: { background: 'rgba(255,255,255,.9)', padding: '6px 8px', borderRadius: '16px', maxWidth: '260px', overflowX: 'auto', flexWrap: 'nowrap' } });
    for (let i = 0; i < PALETTE.length; i++) {
      colors.appendChild(h('button', { class: 'sw' + (gh.c === i ? ' on' : ''), style: { background: PALETTE[i], width: '28px', height: '28px', flexShrink: 0 }, onclick: () => {
        click(); gh.c = i;
        gh.obj.remove(gh.inner);
        gh.inner = itemGroup(gh.id, i);
        gh.obj.add(gh.inner);
        [...colors.children].forEach((x, k) => x.classList.toggle('on', k === i));
      } }));
    }
    this.placeOk = h('button', { class: 'btn mint', onclick: () => { click(); this.confirmGhost(); } }, gh.existing ? '✓ Done' : `✓ Buy 🪙${fmt(it.price)}`);
    const cancel = h('button', { class: 'btn ghost', onclick: () => { click(); this.cancelGhost(); } }, '✕');
    this.placeBar.append(cancel, rot, colors);
    if (gh.existing) this.placeBar.appendChild(h('button', { class: 'btn danger', onclick: () => { click(); this.sellGhost(); } }, `🗑️ Sell +${fmt(it.price)}`));
    this.placeBar.appendChild(this.placeOk);
    this.placeOk.classList.toggle('disabled', !gh.ok);
    toast(it.place === 'wall' ? 'Drag it onto a wall' : 'Drag to move it, then tap ✓', { icon: '👆', time: 1600 });
  }

  confirmGhost() {
    const gh = this.ghost;
    if (!gh) return;
    if (!gh.ok) { toast(gh.reason || "It doesn't fit there", { icon: '🚫' }); this.game.audio?.play('no'); return; }
    const hs = this.house;
    if (gh.existing) {
      const f = gh.existing;
      // things sitting on top move with it
      const dx = gh.x - f.x, dz = gh.z - f.z;
      if (FURN[f.id].top && (dx || dz || gh.r !== f.r)) {
        for (const o of hs.furniture) {
          if (o.uid !== f.uid && o.y > 0.01 && Math.abs(o.x - f.x) < FURN[f.id].fp[0] && Math.abs(o.z - f.z) < FURN[f.id].fp[0]) { o.x += dx; o.z += dz; }
        }
      }
      Object.assign(f, { x: gh.x, z: gh.z, r: gh.r, y: gh.y, c: gh.c });
      this.game.emit('moved', f.id);
    } else {
      if (!spend(this.state, gh.item.price)) { toast('Not enough coins!', { icon: '🪙' }); return; }
      HM.addFurniture(hs, gh.id, gh.x, gh.z, gh.r, gh.c, gh.y);
      this.state.stats.itemsPlaced++;
      this.game.emit('placed', gh.id, gh.item);
    }
    this.game.audio?.play('place');
    this.game.fx?.burst(new THREE.Vector3(ORIGIN.x + gh.x, FLOOR_Y + 0.3, ORIGIN.z + gh.z), 'sparkle');
    this.clearGhost();
    this.packInvalid();
    this.sys.rebuild({ structure: false });
    this.refreshTop();
    const r = this.sys.checkStars();
    if (this.tool === 'furniture') this.drawer.classList.remove('hide');
    return r;
  }

  sellGhost() {
    const gh = this.ghost;
    if (!gh?.existing) return;
    const hs = this.house;
    const res = HM.removeFurniture(hs, gh.existing.uid);
    let refund = gh.item.price;
    // items resting on it are sold too
    if (gh.item.top) {
      for (const o of res.riders) {
        const it = FURN[o.id];
        const b = HM.itemBox(gh.item, gh.existing.x, gh.existing.z, gh.existing.r);
        if (o.x > b.x0 && o.x < b.x1 && o.z > b.z0 && o.z < b.z1) { hs.furniture.splice(hs.furniture.indexOf(o), 1); refund += it?.price || 0; }
      }
    }
    addCoins(this.state, refund);
    this.game.audio?.play('coin');
    toast(`Sold for ${refund} 🪙`, { icon: '💰' });
    this.clearGhost();
    this.sys.rebuild({ structure: false });
    this.refreshTop();
  }

  cancelGhost() {
    const had = this.ghost?.existing;
    this.clearGhost();
    if (had) this.sys.rebuild({ structure: false });
    if (this.tool === 'furniture') this.drawer.classList.remove('hide');
  }

  clearGhost() {
    const gh = this.ghost;
    if (!gh) return;
    this.sys.view.group.remove(gh.obj);
    this.ghost = null;
    this.dragGhost = false;
    this.placeBar.classList.add('hide');
    this.placeBar.innerHTML = '';
  }

  // ---------- per frame ----------
  update(dt) {
    if (!this.active) return;
    const c = this.cam;
    c.yaw += (c.tYaw - c.yaw) * Math.min(1, dt * 8);
    const cam = this.game.camera;
    const W = window.innerWidth, H = window.innerHeight;
    const off = this.drawer && !this.drawer.classList.contains('hide') ? Math.min(140, W * 0.17) : 0;
    this.viewOff = (this.viewOff || 0) + (off - (this.viewOff || 0)) * Math.min(1, dt * 8);
    cam.setViewOffset(W, H, this.viewOff, 0, W, H);
    const tx = c.target.x, tz = c.target.z;
    const d = c.dist;
    const want = new THREE.Vector3(tx + Math.sin(c.yaw) * Math.cos(c.pitch) * d, Math.sin(c.pitch) * d, tz + Math.cos(c.yaw) * Math.cos(c.pitch) * d);
    cam.position.lerp(want, Math.min(1, dt * 10));
    cam.lookAt(tx, 0, tz);
    this.game.input.consumeLook();
    this.game.input.consumeZoom();
    if (this.ghost) {
      this.ghost.t += dt;
      this.ghost.inner.position.y = 0.08 + Math.sin(this.ghost.t * 5) * 0.04;
    }
    if (this.coinsEl && this.coinsEl.textContent !== fmt(this.state.player.coins)) this.coinsEl.textContent = fmt(this.state.player.coins);
  }
}
