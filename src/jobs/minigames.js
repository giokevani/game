// Touch mini-games shown as full-screen overlays. Each calls o.onWin(info)
// for every success so earnings are kept even if the player leaves early.
import { h, root, click, toast } from '../ui/ui.js';
import { CAKE, cakeRules, randomCake, sameCake, FLOWERS, RIBBONS, floristRules, randomBouquet, sameBouquet, FISH_BY, rollFish } from '../data/jobs.js';

const CUSTOMERS = ['👧', '👦', '👵', '👴', '👩', '🧑', '👩‍🦰', '🧒', '👨‍🍳', '🐻', '🐰', '🦊'];
const byId = (l) => Object.fromEntries(l.map((x) => [x.id, x]));
const BASE = byId(CAKE.bases), FROST = byId(CAKE.frostings), TOP = byId(CAKE.toppings), FLOWER = byId(FLOWERS), RIB = byId(RIBBONS);

function overlay(title, onExit) {
  const timerFill = h('i', { style: { width: '100%' } });
  const score = h('div', { class: 'pill', style: { height: '32px', fontSize: '15px' } }, '');
  const exit = h('button', { class: 'btn ghost small', onclick: () => { click(); onExit(); } }, 'Finish ✓');
  const body = h('div', { class: 'mg-body' });
  const el = h('div', { class: 'mg' }, h('div', { class: 'mg-head' }, h('h2', {}, title), h('div', { class: 'timer' }, timerFill), score, exit), body);
  root().appendChild(el);
  return { el, body, timerFill, score, exit };
}

function roundRect(x, X, Y, W, H, r) {
  x.beginPath(); x.moveTo(X + r, Y); x.lineTo(X + W - r, Y); x.quadraticCurveTo(X + W, Y, X + W, Y + r); x.lineTo(X + W, Y + H - r);
  x.quadraticCurveTo(X + W, Y + H, X + W - r, Y + H); x.lineTo(X + r, Y + H); x.quadraticCurveTo(X, Y + H, X, Y + H - r); x.lineTo(X, Y + r); x.quadraticCurveTo(X, Y, X + r, Y); x.closePath();
}

export function drawCake(cv, cake) {
  const x = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  x.clearRect(0, 0, W, H);
  // plate
  x.fillStyle = '#e8f4ff'; x.beginPath(); x.ellipse(W / 2, H * 0.86, W * 0.42, H * 0.07, 0, 0, 7); x.fill();
  x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(W / 2, H * 0.84, W * 0.38, H * 0.055, 0, 0, 7); x.fill();
  let y = H * 0.84;
  const tiers = cake.tiers || [];
  tiers.forEach((t, i) => {
    const tw = W * (0.62 - i * 0.16), th = H * 0.2;
    const tx = W / 2 - tw / 2;
    y -= th;
    x.fillStyle = BASE[t.base]?.color || '#fff0c4';
    roundRect(x, tx, y, tw, th, 10); x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.08)'; x.lineWidth = 2; x.stroke();
    if (t.frost) {
      x.fillStyle = FROST[t.frost].color;
      roundRect(x, tx - 3, y - 6, tw + 6, th * 0.42, 10); x.fill();
      for (let k = 0; k < 6; k++) { x.beginPath(); x.ellipse(tx + (tw / 6) * (k + 0.5), y + th * 0.36, tw / 16, th * 0.18 + (k % 2) * 4, 0, 0, 7); x.fill(); }
    }
  });
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `${Math.round(W * 0.14)}px "Apple Color Emoji","Noto Color Emoji",sans-serif`;
  (cake.tops || []).forEach((tp, i, arr) => {
    const off = (i - (arr.length - 1) / 2) * W * 0.16;
    x.fillText(TOP[tp]?.icon || '', W / 2 + off, y - H * 0.08);
  });
  if (!tiers.length) { x.fillStyle = '#c9b8d6'; x.font = `600 ${Math.round(W * 0.08)}px Fredoka, sans-serif`; x.fillText('Pick a cake base!', W / 2, H * 0.5); }
}

export function drawBouquet(cv, b, hidden = false) {
  const x = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  x.clearRect(0, 0, W, H);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if (hidden) {
    x.font = `${Math.round(W * 0.35)}px "Apple Color Emoji","Noto Color Emoji",sans-serif`;
    x.fillText('❓', W / 2, H / 2);
    return;
  }
  // paper cone
  x.fillStyle = '#fff3dc';
  x.beginPath(); x.moveTo(W * 0.25, H * 0.45); x.lineTo(W * 0.75, H * 0.45); x.lineTo(W * 0.52, H * 0.95); x.lineTo(W * 0.48, H * 0.95); x.closePath(); x.fill();
  const fl = b.flowers || [];
  x.font = `${Math.round(W * 0.2)}px "Apple Color Emoji","Noto Color Emoji",sans-serif`;
  fl.forEach((f, i) => {
    const a = fl.length > 1 ? -0.9 + (1.8 * i) / (fl.length - 1) : 0;
    x.fillText(FLOWER[f]?.icon || '', W / 2 + Math.sin(a) * W * 0.26, H * 0.4 - Math.cos(a) * H * 0.18 + (i % 2) * 6);
  });
  if (b.ribbon) {
    x.fillStyle = RIB[b.ribbon].color;
    x.beginPath(); x.ellipse(W * 0.44, H * 0.62, W * 0.07, H * 0.045, -0.5, 0, 7); x.fill();
    x.beginPath(); x.ellipse(W * 0.56, H * 0.62, W * 0.07, H * 0.045, 0.5, 0, 7); x.fill();
    x.beginPath(); x.arc(W / 2, H * 0.62, W * 0.03, 0, 7); x.fill();
  }
  if (!fl.length) { x.fillStyle = '#c9b8d6'; x.font = `600 ${Math.round(W * 0.08)}px Fredoka, sans-serif`; x.fillText('Add flowers!', W / 2, H * 0.3); }
}

// ---------- Bakery ----------
export function bakeryGame(lvl, o) {
  return new Promise((resolve) => {
    const rules = cakeRules(lvl);
    let time = rules.time, done = 0, streak = 0, earned = 0, over = false;
    let order = randomCake(lvl), cake = { tiers: [], tops: [] };
    const ui = overlay('🧁 Sweet Crumbs', () => finish());
    const cust = h('div', { style: { fontSize: '40px' } }, CUSTOMERS[0]);
    const orderCv = h('canvas', { width: 150, height: 150, style: { width: '120px', height: '120px' } });
    const myCv = h('canvas', { width: 220, height: 220, class: 'mg-canvas', style: { width: '190px', height: '190px' } });
    const say = h('div', { style: { fontWeight: 600, fontSize: '14px' } }, 'I would like this cake, please!');
    const choices = h('div', { class: 'choices' });
    const stepTabs = h('div', { class: 'tabs', style: { padding: '0 0 6px' } });
    let step = 0;
    const steps = ['Base', 'Frosting', 'Topping'];
    const setStep = (s) => { step = s; renderChoices(); };
    const renderChoices = () => {
      stepTabs.innerHTML = '';
      steps.forEach((n, i) => stepTabs.appendChild(h('button', { class: 'tab' + (i === step ? ' on' : ''), onclick: () => { click(); setStep(i); } }, `${i + 1}. ${n}`)));
      choices.innerHTML = '';
      if (step === 0) for (const b of CAKE.bases.filter((x) => x.lvl <= lvl)) choices.appendChild(h('button', { class: 'choice', onclick: () => { click(); addBase(b.id); } }, h('span', { style: { display: 'inline-block', width: '36px', height: '28px', borderRadius: '8px', background: b.color, border: '2px solid rgba(0,0,0,.08)' } }), h('small', {}, b.name)));
      if (step === 1) for (const f of CAKE.frostings.filter((x) => x.lvl <= lvl)) choices.appendChild(h('button', { class: 'choice', onclick: () => { click(); addFrost(f.id); } }, h('span', { style: { display: 'inline-block', width: '32px', height: '32px', borderRadius: '50%', background: f.color, border: '2px solid rgba(0,0,0,.08)' } }), h('small', {}, f.name)));
      if (step === 2) for (const t of CAKE.toppings.filter((x) => x.lvl <= lvl)) choices.appendChild(h('button', { class: 'choice', onclick: () => { click(); addTop(t.id); } }, t.icon, h('small', {}, t.name)));
    };
    const addBase = (id) => {
      const top = cake.tiers[cake.tiers.length - 1];
      if (top && !top.frost) top.base = id;
      else if (cake.tiers.length < rules.tiers) cake.tiers.push({ base: id, frost: null });
      else cake.tiers[cake.tiers.length - 1] = { base: id, frost: null };
      drawCake(myCv, cake);
      setStep(1);
    };
    const addFrost = (id) => {
      if (!cake.tiers.length) return toast('Pick a cake base first!', { icon: '🧁' });
      cake.tiers[cake.tiers.length - 1].frost = id;
      drawCake(myCv, cake);
      setStep(cake.tiers.length < rules.tiers && order.tiers.length > cake.tiers.length ? 0 : 2);
    };
    const addTop = (id) => {
      if (cake.tops.length >= rules.toppings) cake.tops.shift();
      cake.tops.push(id);
      drawCake(myCv, cake);
    };
    const newOrder = () => {
      order = randomCake(lvl);
      cake = { tiers: [], tops: [] };
      cust.textContent = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
      say.textContent = order.tiers.length > 1 ? 'A two-layer cake like this, please!' : 'I would like this cake, please!';
      drawCake(orderCv, order);
      drawCake(myCv, cake);
      setStep(0);
    };
    const serve = () => {
      if (over) return;
      if (sameCake(order, cake)) {
        done++; streak++;
        const pay = Math.round((rules.pay + streak * 4) * (1 + (lvl - 1) * 0.2));
        earned += pay;
        o.onWin?.({ pay, streak });
        o.sfx?.('coin');
        say.textContent = ['Yummy! Thank you! 💗', 'Perfect! 😍', 'Wow, so pretty! ✨'][done % 3];
        time = Math.min(rules.time, time + 6);
        setTimeout(newOrder, 700);
      } else {
        streak = 0;
        o.sfx?.('no');
        say.textContent = "Hmm, that's not quite what I asked for… 🤔";
      }
      ui.score.textContent = `✓ ${done}  ·  🪙 ${earned}`;
    };
    ui.body.append(
      h('div', { class: 'order' }, cust, orderCv, say),
      h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' } }, myCv,
        h('div', { class: 'row' }, h('button', { class: 'btn ghost small', onclick: () => { click(); cake = { tiers: [], tops: [] }; drawCake(myCv, cake); setStep(0); } }, '↺ Start over'),
          h('button', { class: 'btn mint', onclick: () => { click(); serve(); } }, '✓ Serve'))),
      h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, maxWidth: '300px' } }, stepTabs, choices));
    ui.score.textContent = '✓ 0  ·  🪙 0';
    newOrder();
    if (o.hooks) Object.assign(o.hooks, { solve: () => { cake = JSON.parse(JSON.stringify(order)); serve(); }, wrong: () => { cake = { tiers: [], tops: [] }; serve(); }, finish: () => finish(), order: () => order });
    const iv = setInterval(() => {
      time -= 0.25;
      ui.timerFill.style.width = Math.max(0, (time / rules.time) * 100) + '%';
      if (time <= 0) finish();
    }, 250);
    function finish() {
      if (over) return;
      over = true;
      clearInterval(iv);
      ui.el.remove();
      resolve({ done, earned });
    }
  });
}

// ---------- Florist ----------
export function floristGame(lvl, o) {
  return new Promise((resolve) => {
    const rules = floristRules(lvl);
    let time = rules.time, done = 0, earned = 0, over = false, hideT = null;
    let order, mine;
    const ui = overlay('💐 Petal Shop', () => finish());
    const cust = h('div', { style: { fontSize: '40px' } }, '👩');
    const orderCv = h('canvas', { width: 160, height: 160, style: { width: '130px', height: '130px' } });
    const myCv = h('canvas', { width: 220, height: 220, class: 'mg-canvas', style: { width: '180px', height: '180px' } });
    const say = h('div', { style: { fontWeight: 600, fontSize: '14px', maxWidth: '150px' } });
    const peek = h('button', { class: 'btn sky small', onclick: () => { click(); if (!rules.memory) return; drawBouquet(orderCv, order); time -= 4; clearTimeout(hideT); hideT = setTimeout(() => drawBouquet(orderCv, order, true), 1500); } }, '👀 Peek');
    const choices = h('div', { class: 'choices' });
    for (const f of FLOWERS.filter((x) => x.lvl <= lvl)) choices.appendChild(h('button', { class: 'choice', onclick: () => { click(); if (mine.flowers.length >= 7) mine.flowers.shift(); mine.flowers.push(f.id); drawBouquet(myCv, mine); } }, f.icon, h('small', {}, f.name)));
    const ribbons = h('div', { class: 'swatches', style: { marginTop: '8px' } });
    if (rules.ribbon) RIBBONS.forEach((r, idx) => ribbons.appendChild(h('button', { class: 'sw', style: { background: r.color }, onclick: () => { click(); mine.ribbon = r.id; [...ribbons.children].forEach((x, k) => x.classList.toggle('on', k === idx)); drawBouquet(myCv, mine); } })));
    const newOrder = () => {
      order = randomBouquet(lvl);
      mine = { flowers: [], ribbon: null };
      [...ribbons.children].forEach((x) => x.classList.remove('on'));
      cust.textContent = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
      say.textContent = rules.memory ? 'Remember my bouquet! 🧠' : 'Can you make this bouquet?';
      drawBouquet(orderCv, order);
      drawBouquet(myCv, mine);
      clearTimeout(hideT);
      if (rules.memory) hideT = setTimeout(() => { drawBouquet(orderCv, order, true); say.textContent = 'What did it look like?'; }, rules.show * 1000);
    };
    const give = () => {
      if (sameBouquet(order, mine)) {
        done++;
        const pay = Math.round(rules.pay * (1 + (lvl - 1) * 0.2));
        earned += pay;
        o.onWin?.({ pay });
        o.sfx?.('coin');
        say.textContent = 'It is beautiful! Thank you! 🌸';
        drawBouquet(orderCv, order);
        time = Math.min(rules.time, time + 8);
        setTimeout(newOrder, 900);
      } else {
        o.sfx?.('no');
        say.textContent = 'Not quite… try again! 💭';
      }
      ui.score.textContent = `✓ ${done}  ·  🪙 ${earned}`;
    };
    ui.body.append(
      h('div', { class: 'order' }, cust, orderCv, say, rules.memory ? peek : null),
      h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' } }, myCv,
        h('div', { class: 'row' }, h('button', { class: 'btn ghost small', onclick: () => { click(); mine.flowers = []; mine.ribbon = null; drawBouquet(myCv, mine); } }, '↺'),
          h('button', { class: 'btn mint', onclick: () => { click(); give(); } }, '🎀 Give'))),
      h('div', { style: { display: 'flex', flexDirection: 'column', flex: 1, maxWidth: '300px' } }, h('div', { class: 'section-title', style: { margin: '0 0 6px' } }, 'Flowers'), choices, rules.ribbon ? h('div', { class: 'section-title', style: { margin: '8px 0 0' } }, 'Ribbon') : null, ribbons));
    ui.score.textContent = '✓ 0  ·  🪙 0';
    newOrder();
    if (o.hooks) Object.assign(o.hooks, { solve: () => { mine = JSON.parse(JSON.stringify(order)); give(); }, wrong: () => { mine = { flowers: [], ribbon: null }; give(); }, finish: () => finish() });
    const iv = setInterval(() => {
      time -= 0.25;
      ui.timerFill.style.width = Math.max(0, (time / rules.time) * 100) + '%';
      if (time <= 0) finish();
    }, 250);
    function finish() {
      if (over) return;
      over = true;
      clearInterval(iv);
      clearTimeout(hideT);
      ui.el.remove();
      resolve({ done, earned });
    }
  });
}

// ---------- Fishing ----------
export function fishingGame(lvl, o) {
  return new Promise((resolve) => {
    let over = false, caught = 0, earned = 0;
    const ui = overlay('🎣 Sunny Pier', () => finish());
    ui.timerFill.parentElement.style.display = 'none';
    const W = 520, H = 120;
    const cv = h('canvas', { width: W, height: H, class: 'mg-canvas', style: { width: 'min(520px, 70vw)', height: 'auto' } });
    const msg = h('div', { style: { fontSize: '20px', fontWeight: 700, textAlign: 'center', minHeight: '30px' } }, 'Tap Cast to throw your line!');
    const bob = h('div', { style: { fontSize: '44px', textAlign: 'center', transition: 'transform .2s' } }, '🎣');
    const btn = h('button', { class: 'btn big', style: { minWidth: '200px' } }, 'Cast');
    const col = h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1 } }, msg, bob, cv, btn);
    ui.body.append(col);
    ui.score.textContent = '🐟 0  ·  🪙 0';
    if (o.hooks) Object.assign(o.hooks, { solve: () => { fish = FISH_BY[rollFish(lvl, o.night?.())]; win(); }, finish: () => finish() });
    cv.style.display = 'none';
    let state = 'idle', fish = null, raf = 0, holding = false;
    let fx = 0.5, fv = 0, zx = 0.3, zv = 0, meter = 0.3, target = 0.5, tLast = 0, biteTimer = 0;
    const zoneW = 0.2 + lvl * 0.025;
    const press = (e) => { e.preventDefault(); holding = true; if (state === 'bite') hook(); };
    const release = () => { holding = false; };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('click', () => { if (state === 'idle') cast(); });
    function cast() {
      state = 'wait';
      btn.textContent = 'Waiting…';
      msg.textContent = 'Shh… wait for a bite';
      bob.textContent = '🟠';
      const wait = 1500 + Math.random() * 3000;
      biteTimer = setTimeout(() => {
        if (over) return;
        state = 'bite';
        msg.textContent = '❗ BITE! Tap now!';
        bob.style.transform = 'translateY(12px)';
        btn.textContent = 'Hook it!';
        o.sfx?.('pop');
        biteTimer = setTimeout(() => { if (state === 'bite') { msg.textContent = 'Too slow — it swam away! 🌊'; reset(); } }, 1300);
      }, wait);
    }
    function hook() {
      clearTimeout(biteTimer);
      fish = FISH_BY[rollFish(lvl, o.night?.())];
      state = 'reel';
      bob.style.transform = '';
      bob.textContent = '🌊';
      msg.textContent = 'Hold the button to move the green zone onto the fish!';
      btn.textContent = 'Hold to reel';
      cv.style.display = 'block';
      fx = 0.5; fv = 0; zx = 0.4; zv = 0; meter = 0.3; target = Math.random();
      tLast = performance.now();
      loop();
    }
    function loop() {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.05, (now - tLast) / 1000);
      tLast = now;
      // fish wanders
      if (Math.random() < dt * (0.8 + fish.speed)) target = Math.random();
      fv += (target - fx) * dt * 6 * fish.speed;
      fv *= 1 - dt * 3;
      fx = Math.max(0.02, Math.min(0.98, fx + fv * dt));
      // zone: hold = move right, release = drift left
      zv += (holding ? 2.2 : -1.8) * dt;
      zv *= 1 - dt * 2.5;
      zx += zv * dt;
      if (zx < 0) { zx = 0; zv = 0; }
      if (zx > 1 - zoneW) { zx = 1 - zoneW; zv = 0; }
      const inside = fx > zx && fx < zx + zoneW;
      meter += (inside ? 0.32 : -0.22 * (0.7 + fish.speed * 0.3)) * dt;
      draw(inside);
      if (meter >= 1) { cancelAnimationFrame(raf); win(); }
      else if (meter <= 0) { cancelAnimationFrame(raf); msg.textContent = `The ${fish.rar === 'common' ? 'fish' : 'big one'} got away! 😮`; reset(); }
    }
    function draw(inside) {
      const x = cv.getContext('2d');
      x.clearRect(0, 0, W, H);
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#bfeeff'); g.addColorStop(1, '#6fcfe8');
      x.fillStyle = g; roundRect(x, 10, 20, W - 20, 60, 20); x.fill();
      x.fillStyle = inside ? 'rgba(90,230,140,0.75)' : 'rgba(90,230,140,0.45)';
      roundRect(x, 10 + zx * (W - 20), 22, zoneW * (W - 20), 56, 16); x.fill();
      x.font = '40px "Apple Color Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.save();
      if (fish.hue) x.filter = `hue-rotate(${fish.hue}deg) saturate(1.5)`;
      if (fish.rainbow) x.filter = `hue-rotate(${(performance.now() / 5) % 360}deg)`;
      x.fillText('🐟', 10 + fx * (W - 20), 52);
      x.restore();
      x.fillStyle = '#f3e4ee'; roundRect(x, 10, 92, W - 20, 16, 8); x.fill();
      x.fillStyle = '#ff8fc0'; roundRect(x, 10, 92, Math.max(8, meter * (W - 20)), 16, 8); x.fill();
    }
    function win() {
      caught++;
      const pay = Math.round(fish.price * (1 + (lvl - 1) * 0.15));
      earned += pay;
      const isNew = o.onWin?.({ fish: fish.id, pay });
      msg.textContent = `You caught a ${fish.name}! ${isNew ? '✨ NEW! ' : ''}+${pay} 🪙`;
      bob.textContent = fish.icon;
      bob.style.filter = fish.hue ? `hue-rotate(${fish.hue}deg) saturate(1.5)` : '';
      o.sfx?.(fish.rar === 'legendary' || fish.rar === 'ultra' ? 'fanfare' : 'coin');
      ui.score.textContent = `🐟 ${caught}  ·  🪙 ${earned}`;
      reset(true);
    }
    function reset(keepIcon) {
      state = 'idle';
      holding = false;
      cv.style.display = 'none';
      if (!keepIcon) { bob.textContent = '🎣'; bob.style.filter = ''; }
      bob.style.transform = '';
      btn.textContent = 'Cast again';
    }
    function finish() {
      if (over) return;
      over = true;
      cancelAnimationFrame(raf);
      clearTimeout(biteTimer);
      ui.el.remove();
      resolve({ done: caught, earned });
    }
  });
}
