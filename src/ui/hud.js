import { h, root, click, fmt } from './ui.js';
import { levelFromXP } from '../core/state.js';

export class HUD {
  constructor(game) {
    this.game = game;
    const r = root();
    this.coinsTxt = h('span', {}, '0');
    this.coins = h('div', { class: 'pill coins interactive' }, h('span', { class: 'ico' }, '🪙'), this.coinsTxt);
    this.lvlTxt = h('div', { class: 'txt' }, 'Level 1');
    this.lvlNum = h('span', { class: 'ico' }, '1');
    this.lvlBar = h('i');
    this.lvl = h('div', { class: 'pill lvl' }, this.lvlNum, this.lvlTxt, h('div', { class: 'bar' }, this.lvlBar));
    this.needs = h('div', { class: 'needs' });
    this.zoneTxt = h('div', { class: 'pill', style: { fontSize: '14px', height: '28px', padding: '0 10px', display: 'none' } });
    this.tl = h('div', { class: 'hud-tl' }, h('div', { class: 'hud-row' }, this.coins, this.lvl), this.needs);
    r.appendChild(this.tl);

    this.tracker = h('div', { class: 'tracker' });
    r.appendChild(this.tracker);

    const mb = (icon, label, fn, id) => {
      const b = h('button', { class: 'mbtn', 'data-id': id, onclick: () => { click(); fn(); } }, icon, h('span', { class: 'lbl' }, label), h('span', { class: 'dot' }));
      return b;
    };
    this.btn = {
      build: mb('🔨', 'Build', () => game.openBuild(), 'build'),
      pets: mb('🐾', 'Pets', () => game.openPets(), 'pets'),
      bag: mb('🎒', 'Bag', () => game.openBag(), 'bag'),
      quests: mb('📜', 'Tasks', () => game.openQuests(), 'quests'),
      map: mb('🗺️', 'Map', () => game.openMap(), 'map'),
      settings: mb('⚙️', 'Menu', () => game.openSettings(), 'settings'),
    };
    this.tr = h('div', { class: 'hud-tr' }, ...Object.values(this.btn));
    r.appendChild(this.tr);

    this.actionIco = h('span', { class: 'ico' }, '✋');
    this.actionLbl = h('span', {}, '');
    this.action = h('button', { class: 'action-btn', onpointerdown: (e) => { e.stopPropagation(); game.input.actionPressed = true; } }, this.actionIco, this.actionLbl);
    this.jump = h('button', { class: 'round-btn', onpointerdown: (e) => { e.stopPropagation(); game.input.jumpPressed = true; } }, '⬆');
    this.emote = h('button', { class: 'round-btn', style: { width: '54px', height: '54px', fontSize: '24px' }, onpointerdown: (e) => { e.stopPropagation(); click(); game.openEmotes(); } }, '😊');
    this.br = h('div', { class: 'hud-br' }, this.action, h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' } }, this.emote, this.jump));
    r.appendChild(this.br);

    this.bl = h('div', { class: 'hud-bl' }, this.zoneTxt);
    r.appendChild(this.bl);
    this.hint = h('div', { class: 'joy-hint' }, 'drag here\nto walk');
    this.hint.innerText = 'Drag here\nto walk';
    r.appendChild(this.hint);

    r.appendChild(h('div', { class: 'portrait-warn enabled' }, h('div', { class: 'ph' }, '📱'), 'Turn your phone sideways to play!'));
    this.lastCoins = null;
    this.lastXP = null;
  }

  setVisible(v) {
    for (const el of [this.tl, this.tr, this.br, this.tracker, this.bl]) el.classList.toggle('hide', !v);
    if (!v) this.hint.classList.add('hide');
  }

  update(state) {
    const c = state.player.coins;
    if (c !== this.lastCoins) {
      this.coinsTxt.textContent = fmt(c);
      if (this.lastCoins !== null) { this.coins.classList.remove('bump'); void this.coins.offsetWidth; this.coins.classList.add('bump'); }
      this.lastCoins = c;
    }
    if (state.player.xp !== this.lastXP) {
      const l = levelFromXP(state.player.xp);
      this.lvlNum.textContent = l.level;
      this.lvlTxt.textContent = 'Level ' + l.level;
      this.lvlBar.style.width = Math.round((l.into / l.need) * 100) + '%';
      this.lastXP = state.player.xp;
    }
  }

  setAction(it) {
    if (!it) { this.action.classList.remove('show'); this.curAction = null; return; }
    if (this.curAction === it) return;
    this.curAction = it;
    this.actionIco.textContent = it.icon || '✋';
    this.actionLbl.textContent = typeof it.label === 'function' ? it.label() : it.label;
    this.action.classList.add('show');
  }

  setZone(z) {
    if (!z) { this.zoneTxt.style.display = 'none'; return; }
    this.zoneTxt.style.display = 'inline-flex';
    this.zoneTxt.textContent = `${z.icon} ${z.name}`;
  }

  setNeeds(list) {
    const key = list.map((n) => n.icon).join('');
    if (key === this.needKey) return;
    this.needKey = key;
    this.needs.innerHTML = '';
    for (const n of list) this.needs.appendChild(h('div', { class: 'need ' + (n.cls || ''), title: n.name }, n.icon));
  }

  setTracker(items) {
    const key = JSON.stringify(items);
    if (key === this.trKey) return;
    this.trKey = key;
    this.tracker.innerHTML = '';
    for (const q of items) this.tracker.appendChild(h('div', { class: 'q' }, h('b', {}, q.title), q.text, q.prog ? h('span', { class: 'prog' }, ' ' + q.prog) : null));
  }

  alert(id, on) {
    this.btn[id]?.classList.toggle('alert', !!on);
  }
}
