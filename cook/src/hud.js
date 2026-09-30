// In-game overlay: money, level info, the English prompt with Russian help,
// the order ticket, step dots and the one-time how-to tips.
import { h, fmt, click } from '../../src/ui/ui.js';
import { WORD } from './data.js';
import { ru, speak } from './i18n.js';
import { dishPhrase } from './text.js';

export class Hud {
  constructor(game) {
    this.g = game;
    const root = document.getElementById('ui');
    this.coinsTxt = h('span', { class: 'txt' }, '0');
    this.coins = h('div', { class: 'pill coins' }, h('span', { class: 'ico' }, '🪙'), this.coinsTxt);
    this.starsTxt = h('span', { class: 'txt' }, '0');
    this.stars = h('div', { class: 'pill stars-pill' }, h('span', { class: 'ico' }, '⭐'), this.starsTxt);
    this.levelTxt = h('div', { class: 'pill lvl-pill hide' });
    this.guests = h('div', { class: 'pill hide' });
    this.tl = h('div', { class: 'hud-tl' }, h('div', { class: 'hud-row' }, this.coins, this.stars), h('div', { class: 'hud-row' }, this.levelTxt, this.guests));
    this.pauseBtn = h('button', { class: 'mbtn hide', 'aria-label': 'Pause', onclick: () => { click(); game.pause(); } }, '⏸');
    this.tr = h('div', { class: 'hud-tr' }, this.pauseBtn);
    // cooking overlay
    this.promptEn = h('span', { class: 'en' });
    this.promptRu = h('div', { class: 'ru' });
    this.say = h('button', { class: 'say-btn', 'aria-label': 'Say it', onclick: (e) => { e.stopPropagation(); speak(this.promptEn.textContent, true); } }, '🔊');
    this.dots = h('div', { class: 'dots' });
    this.bar = h('i');
    this.prompt = h('div', { class: 'prompt hide' }, h('div', { class: 'en-row' }, this.promptEn, this.say), this.promptRu, h('div', { class: 'step-bar' }, this.bar), this.dots);
    this.ticket = h('div', { class: 'ticket hide' });
    this.order = h('div', { class: 'stack-order hide' });
    this.bottom = h('div', { class: 'cook-bottom' });
    this.tip = h('div', { class: 'tip hide' });
    this.bubbles = h('div', { class: 'bubbles' });
    root.append(this.bubbles, this.tl, this.tr, this.prompt, this.ticket, this.order, this.bottom, this.tip);
    game.kitchen.bottom = this.bottom;
    this.lastCoins = null;
  }

  update(s) {
    if (this.lastCoins !== null && s.coins > this.lastCoins) { this.coins.classList.remove('bump'); void this.coins.offsetWidth; this.coins.classList.add('bump'); }
    this.lastCoins = s.coins;
    this.coinsTxt.textContent = fmt(s.coins);
    this.starsTxt.textContent = String(Object.values(s.stars).reduce((a, b) => a + b, 0));
  }

  levelMode(on, label = '', guests = '') {
    this.levelTxt.classList.toggle('hide', !on);
    this.guests.classList.toggle('hide', !on);
    this.pauseBtn.classList.toggle('hide', !on);
    this.stars.classList.toggle('hide', on);
    this.levelTxt.textContent = label;
    this.guests.textContent = guests;
  }
  setGuests(txt) { this.guests.textContent = txt; }

  cookMode(on, orders, idx) {
    this.prompt.classList.toggle('hide', !on);
    this.ticket.classList.toggle('hide', !on);
    this.bubbles.classList.toggle('hide', on);
    if (!on) { this.bottom.innerHTML = ''; this.hideTip(); this.stackOrder(null); return; }
    this.ticket.innerHTML = '';
    this.ticket.appendChild(h('div', { class: 't-head' }, 'ORDER'));
    orders.forEach((o, i) => {
      const w = WORD[o.recipe];
      const extras = Object.values(o.vary).filter((v) => typeof v === 'string' && WORD[v]).map((v) => WORD[v].emoji).join('');
      const p = dishPhrase(o);
      this.ticket.appendChild(h('div', { class: 't-dish' + (i === idx ? ' now' : i < idx ? ' done' : '') },
        h('div', { class: 't-em' }, w.emoji, h('small', {}, extras)),
        h('div', { class: 't-txt' }, p.en[0].toUpperCase() + p.en.slice(1), this.g.state.settings.help ? h('small', {}, ru(p.ru)) : null)));
    });
  }

  setStep(i, n, pr) {
    this.promptEn.textContent = pr.en;
    const help = this.g.state.settings.help;
    this.promptRu.textContent = help ? ru(pr.ru) : '';
    this.promptRu.classList.toggle('hide', !help);
    this.dots.innerHTML = '';
    for (let k = 0; k < n; k++) this.dots.appendChild(h('i', { class: k < i ? 'd' : k === i ? 'on' : '' }));
    this.stepProgress(0);
    this.prompt.classList.remove('pop'); void this.prompt.offsetWidth; this.prompt.classList.add('pop');
  }
  stepProgress(f) { this.bar.style.width = Math.round(Math.max(0, Math.min(1, f)) * 100) + '%'; }

  stackOrder(layers, idx = 0) {
    this.order.classList.toggle('hide', !layers);
    if (!layers) return;
    this.order.innerHTML = '';
    [...layers].reverse().forEach((id, r) => {
      const i = layers.length - 1 - r;
      this.order.appendChild(h('div', { class: 'so' + (i < idx ? ' done' : i === idx ? ' now' : '') }, h('span', {}, WORD[id]?.emoji || '•'), ' ', WORD[id]?.en || id));
    });
  }

  showTip(text) {
    this.tip.innerHTML = '';
    this.tip.append(h('div', { class: 'tip-face' }, '👩‍🍳'), h('div', { class: 'tip-txt' }, ru(text)), h('button', { class: 'tip-x', onclick: () => { click(); this.hideTip(); } }, 'OK'));
    this.tip.classList.remove('hide');
    clearTimeout(this.tipT);
    this.tipT = setTimeout(() => this.hideTip(), 9000);
  }
  hideTip() { this.tip.classList.add('hide'); }

  // order bubbles over waiting customers
  makeBubble(c, onTap) {
    const em = h('div', { class: 'b-em' });
    const pat = h('i');
    const btn = h('button', { class: 'bubble interactive', onclick: () => onTap(c) }, em, h('div', { class: 'pat' }, pat));
    const el = h('div', { class: 'bubble-pos' }, btn);
    this.bubbles.appendChild(el);
    return {
      el,
      set(orders, delivered) { em.textContent = orders.slice(delivered).map((o) => WORD[o.recipe].emoji).join(' '); },
      patience(p) { pat.style.width = Math.round(p * 100) + '%'; pat.style.background = p > 0.5 ? '#4fd1ae' : p > 0.25 ? '#ffc94d' : '#ff6f6f'; btn.classList.toggle('hurry', p < 0.25); },
      place(x, y, show) { el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`; el.style.display = show ? '' : 'none'; },
      remove() { el.remove(); },
    };
  }
}
