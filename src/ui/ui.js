// Tiny DOM helpers + reusable UI pieces (modal, toast, dialog, confirm).
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v);
  }
  for (const c of kids.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return el;
}

export const root = () => document.getElementById('ui');

let sfx = null;
export function setUISound(fn) { sfx = fn; }
export function click() { sfx?.('click'); }

// ---------- toasts ----------
let toastBox = null;
export function toast(text, o = {}) {
  if (!toastBox) { toastBox = h('div', { class: 'toasts' }); root().appendChild(toastBox); }
  const t = h('div', { class: 'toast ' + (o.kind || '') }, o.icon ? h('span', { style: { fontSize: '20px' } }, o.icon) : null, text);
  toastBox.appendChild(t);
  while (toastBox.children.length > 3) toastBox.firstChild.remove();
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 450); }, o.time || 2600);
  return t;
}

// big centred celebration text
export function celebrate(big, sub, time = 2200) {
  const el = h('div', { class: 'center-msg' }, h('div', { class: 'big' }, big), sub ? h('div', { class: 'sub' }, sub) : null);
  root().appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .5s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 500); }, time);
}

// floating "+25" text at a screen position
export function floaty(text, x, y, color) {
  const el = h('div', { class: 'floaty' }, text);
  if (color) el.style.textShadow = `0 2px 0 ${color}, 0 3px 8px rgba(0,0,0,.3)`;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  root().appendChild(el);
  requestAnimationFrame(() => { el.style.transform = 'translateY(-60px)'; el.style.opacity = '0'; });
  setTimeout(() => el.remove(), 1300);
}

// ---------- modal ----------
const stack = [];
export function modal(title, body, o = {}) {
  const close = () => {
    const i = stack.indexOf(api);
    if (i >= 0) stack.splice(i, 1);
    bg.remove();
    o.onClose?.();
  };
  const head = h('div', { class: 'panel-head' }, h('h2', {}, title), o.headExtra || null,
    o.noClose ? null : h('button', { class: 'x', onclick: () => { click(); close(); } }, '✕'));
  const bodyEl = h('div', { class: 'panel-body' });
  const panel = h('div', { class: 'panel ' + (o.narrow ? 'narrow' : '') }, head);
  if (o.tabs) panel.appendChild(o.tabs);
  panel.appendChild(bodyEl);
  if (typeof body === 'function') body(bodyEl, close);
  else if (body) bodyEl.appendChild(body);
  const bg = h('div', { class: 'modal-bg' }, panel);
  bg.addEventListener('pointerdown', (e) => { if (e.target === bg && !o.noClose) close(); });
  root().appendChild(bg);
  const api = { close, body: bodyEl, panel, setBody(el) { bodyEl.innerHTML = ''; bodyEl.appendChild(el); } };
  stack.push(api);
  return api;
}
export function anyModalOpen() { return stack.length > 0; }
export function closeAllModals() { while (stack.length) stack[stack.length - 1].close(); }

export function tabs(list, onPick, initial = 0) {
  const el = h('div', { class: 'tabs' });
  const btns = list.map((t, i) => {
    const b = h('button', { class: 'tab' + (i === initial ? ' on' : ''), onclick: () => {
      click();
      btns.forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      onPick(t, i);
    } }, t.icon ? t.icon + ' ' : '', t.name);
    return b;
  });
  btns.forEach((b) => el.appendChild(b));
  return el;
}

export function confirmBox(title, text, yes = 'Yes', no = 'Cancel') {
  return new Promise((res) => {
    const m = modal(title, (b, close) => {
      b.appendChild(h('p', { style: { fontSize: '17px', marginTop: '4px' } }, text));
      b.appendChild(h('div', { class: 'row', style: { justifyContent: 'flex-end' } },
        h('button', { class: 'btn ghost', onclick: () => { click(); close(); res(false); } }, no),
        h('button', { class: 'btn mint', onclick: () => { click(); m.close(); res(true); } }, yes)));
    }, { narrow: true, onClose: () => res(false) });
  });
}

export function promptBox(title, text, value = '', max = 14) {
  return new Promise((res) => {
    let input;
    const m = modal(title, (b) => {
      b.appendChild(h('p', { style: { marginTop: '4px' } }, text));
      input = h('input', { class: 'name-input', value, maxlength: String(max), autocomplete: 'off', autocorrect: 'off', spellcheck: 'false' });
      b.appendChild(input);
      b.appendChild(h('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: '12px' } },
        h('button', { class: 'btn mint', onclick: () => { click(); const v = input.value.trim(); m.close(); res(v || value); } }, 'OK')));
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const v = input.value.trim(); m.close(); res(v || value); } });
    }, { narrow: true, noClose: true });
    setTimeout(() => input?.focus(), 50);
  });
}

// ---------- NPC dialogue ----------
let dialogEl = null;
export function say(who, face, text, options = null) {
  return new Promise((res) => {
    dialogEl?.remove();
    const opts = h('div', { class: 'opts' });
    const done = (v) => { dialogEl?.remove(); dialogEl = null; res(v); };
    if (options) {
      for (const o of options) opts.appendChild(h('button', { class: 'btn small ' + (o.cls || ''), onclick: (e) => { e.stopPropagation(); click(); done(o.value); } }, o.label));
    } else {
      opts.appendChild(h('button', { class: 'btn small', onclick: (e) => { e.stopPropagation(); click(); done(true); } }, 'OK ▶'));
    }
    dialogEl = h('div', { class: 'dialog interactive' },
      h('div', { class: 'face' }, face),
      h('div', { style: { flex: 1 } }, h('div', { class: 'who' }, who), h('div', { class: 'say' }, text), opts));
    root().appendChild(dialogEl);
  });
}
export async function sayAll(who, face, lines) {
  for (const l of lines) await say(who, face, l);
}
export function dialogOpen() { return !!dialogEl; }

export function fmt(n) {
  return n >= 10000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'k' : String(n);
}
