// Café menus and screens: first visit, restaurant picker, level cards, order
// card, results + word quiz, Word Book, help settings.
import * as THREE from 'three';
import { h, modal, click, say, celebrate, root, tabs } from '../../src/ui/ui.js';
import { RESTAURANTS, RESTAURANT, LEVELS_PER, WORDS, WORD } from './data.js';
import { totalStars, restaurantStars, restaurantOpen, levelOpen, busyOpen, levelKey } from './state.js';
import { orderSentence } from './text.js';
import { ru, speak, primeSpeech, canSpeak } from './i18n.js';

const FACES = ['🙂', '😊', '👧', '🧒', '👩', '👦', '🧑', '👱‍♀️', '👩‍🦰', '🧑‍🦱'];
const sayBtn = (text) => h('button', { class: 'say-btn small', onclick: (e) => { e.stopPropagation(); speak(text, true); } }, '🔊');
const ruLine = (g, text, cls = 'ru-help') => (g.state.settings.help ? h('div', { class: cls }, ru(text)) : null);
const starStr = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

// ---------- first start: pick the alphabet for Russian help ----------
export function chooseScript(g) {
  return new Promise((res) => {
    const pickIt = (s) => {
      click(); primeSpeech();
      g.state.settings.script = s;
      g.state.scriptChosen = true;
      g.changed(); g.save();
      el.remove();
      res();
    };
    const el = h('div', { class: 'screen center' },
      h('div', { class: 'card-big' },
        h('div', { class: 'logo-em' }, '🧁'),
        h('h1', {}, 'Blossom Kitchen'),
        h('p', { class: 'muted' }, 'Help in Russian: which letters? / Подсказки на русском:'),
        h('div', { class: 'row center' },
          h('button', { class: 'btn big', onclick: () => pickIt('cyr') }, 'Русские буквы', h('small', {}, 'Привет!')),
          h('button', { class: 'btn big sky', onclick: () => pickIt('lat') }, 'Latinskie bukvy', h('small', {}, 'Privet!'))),
        h('p', { class: 'muted small' }, 'You can change this later in the café: ⚙️ Help.')));
    root().appendChild(el);
  });
}

// ---------- Chef Lily's welcome ----------
export async function intro(g) {
  const lines = [
    ["Hello! I'm Chef Lily. Welcome to your café!", 'Привет! Я шеф Лили. Добро пожаловать в твоё кафе!'],
    ['Cook yummy food for your guests.', 'Готовь вкусную еду для гостей. Они платят монетками 🪙.'],
    ['Then go outside and build your dream house!', 'Потом выходи на улицу и строй дом своей мечты! Кнопка 🔨 Build.'],
    ['Everything is in English. Tap 🔊 to listen!', 'Все задания на английском, а внизу подсказка по-русски. Нажми 🔊, чтобы послушать.'],
  ];
  for (const [en, r] of lines) {
    speak(en);
    await say('Chef Lily', '👩‍🍳', h('div', {}, h('b', {}, en), ' ', sayBtn(en), h('div', { class: 'ru-help' }, ru(r))));
  }
  g.state.intro = true;
  g.changed();
}

// ---------- restaurants + levels ----------
export function map(g) {
  const s = g.state;
  modal('🍽️ Blossom Kitchen: pick a menu', (b, close) => {
    b.appendChild(h('div', { class: 'muted' }, `⭐ ${totalStars(s)} stars · earn ⭐ to open new restaurants`));
    const grid = h('div', { class: 'rest-grid' });
    for (const R of RESTAURANTS) {
      const open = restaurantOpen(s, R.id);
      const st = restaurantStars(s, R.id);
      grid.appendChild(h('button', { class: 'rest' + (open ? '' : ' locked'), style: { background: `linear-gradient(180deg, #fff, ${R.wall})` }, onclick: () => {
        click();
        if (!open) { g.audio.play('no'); return; }
        close(); levels(g, R.id);
      } },
      h('div', { class: 'r-em' }, open ? R.emoji : '🔒'),
      h('div', { class: 'r-name' }, R.en), ruLine(g, R.ru, 'r-ru'),
      h('div', { class: 'r-st' }, open ? `⭐ ${st}/${LEVELS_PER * 3}` : `Need ⭐ ${R.stars}`)));
    }
    b.appendChild(grid);
    b.appendChild(h('div', { class: 'row', style: { marginTop: '10px' } },
      h('button', { class: 'btn mint small', onclick: () => { click(); wordBook(g); } }, '📖 Words'),
      h('button', { class: 'btn lav small', onclick: () => { click(); settings(g); } }, '⚙️ Help'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn ghost', onclick: () => { click(); close(); g.leave(); } }, '🚪 Leave café')));
  }, { noClose: true });
}

export function levels(g, rid) {
  const s = g.state;
  const R = RESTAURANT[rid];
  g.loadRestaurant(rid);
  modal(`${R.emoji} ${R.en}`, (b, close) => {
    b.appendChild(h('div', { class: 'row' }, h('div', { class: 'muted' }, R.recipes.map((id) => `${WORD[id].emoji} ${WORD[id].en}`).join(' · '))));
    const grid = h('div', { class: 'lvl-grid' });
    for (let L = 1; L <= LEVELS_PER; L++) {
      const open = levelOpen(s, rid, L);
      const st = s.stars[levelKey(rid, L)] || 0;
      grid.appendChild(h('button', { class: 'lvl-btn' + (open ? '' : ' locked') + (open && !st ? ' next' : ''), onclick: () => {
        click();
        if (!open) { g.audio.play('no'); return; }
        close(); g.playLevel(rid, L);
      } }, h('div', { class: 'n' }, open ? String(L) : '🔒'), h('div', { class: 'st' }, starStr(st))));
    }
    const bo = busyOpen(s, rid);
    grid.appendChild(h('button', { class: 'lvl-btn busy' + (bo ? '' : ' locked'), onclick: () => {
      click();
      if (!bo) { g.audio.play('no'); return; }
      close(); g.playLevel(rid, LEVELS_PER + 1);
    } }, h('div', { class: 'n' }, bo ? '☀️' : '🔒'), h('div', { class: 'st small' }, 'Busy Day'), s.busyBest[rid] ? h('div', { class: 'st small' }, `best ${s.busyBest[rid]}`) : null));
    b.appendChild(grid);
    b.appendChild(h('div', { class: 'row', style: { marginTop: '10px' } },
      h('button', { class: 'btn ghost small', onclick: () => { click(); close(); map(g); } }, '◀ Restaurants'),
      h('button', { class: 'btn ghost small', onclick: () => { click(); close(); g.leave(); } }, '🚪 Leave café')));
  }, { noClose: true });
}

export function levelIntro(g, rid, L, info) {
  return new Promise((res) => {
    const busy = L > LEVELS_PER;
    modal(busy ? '☀️ Busy Day!' : `Level ${L}`, (b, close) => {
      const en = busy ? 'Serve as many guests as you can!' : `Serve ${info.customers} guests.`;
      b.appendChild(h('div', { class: 'big-line' }, en, ' ', sayBtn(en)));
      b.appendChild(ruLine(g, busy ? 'Сегодня много гостей! Обслужи как можно больше.' : `Обслужи ${info.customers} гостей. Нажми на пузырь над гостем, чтобы принять заказ.`));
      b.appendChild(h('div', { class: 'menu-today' }, ...info.recipes.map((id) => h('div', { class: 'mt' }, h('span', {}, WORD[id].emoji), WORD[id].en))));
      b.appendChild(h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '10px' } }, h('button', { class: 'btn big mint', onclick: () => { click(); primeSpeech(); close(); } }, 'Start ▶')));
      speak(en);
    }, { narrow: true, noClose: true, onClose: res });
  });
}

// the customer's order: an English sentence with a Russian helper line
export function orderCard(g, c, idx) {
  return new Promise((res) => {
    const orders = c.orders.slice(idx);
    const sen = orderSentence(orders, c.greet);
    speak(sen.en);
    const face = FACES[(c.spot * 3 + c.greet) % FACES.length];
    let done = false;
    const m = modal('Order', (b, close) => {
      b.appendChild(h('div', { class: 'order-say' }, h('div', { class: 'face' }, face), h('div', {},
        h('div', { class: 'en' }, sen.en, ' ', sayBtn(sen.en)), ruLine(g, sen.ru))));
      b.appendChild(h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '8px' } },
        h('button', { class: 'btn ghost', onclick: () => { click(); close(); } }, 'Later'),
        h('button', { class: 'btn big', onclick: () => { click(); done = true; m.close(); } }, "Let's cook! 🍳")));
    }, { narrow: true, onClose: () => res(done) });
  });
}

export function pauseMenu(g) {
  g.paused = true;
  modal('⏸ Pause', (b, close) => {
    b.appendChild(h('div', { class: 'col' },
      h('button', { class: 'btn big mint', onclick: () => { click(); close(); } }, '▶ Continue'),
      h('button', { class: 'btn', onclick: () => { click(); const lv = g.level; close(); if (lv) g.quitLevel(), g.playLevel(lv.rid, lv.L); } }, '🔄 Restart level'),
      h('button', { class: 'btn lav', onclick: () => { click(); settings(g); } }, '⚙️ Settings'),
      h('button', { class: 'btn', onclick: () => { click(); const lv = g.level; close(); g.quitLevel(); levels(g, lv?.rid || g.rid); } }, '📋 Levels'),
      h('button', { class: 'btn ghost', onclick: () => { click(); close(); g.quitLevel(); g.leave(); } }, '🚪 Leave café')));
  }, { narrow: true, onClose: () => { g.paused = false; } });
}

// ---------- results + quiz ----------
export function results(g, lv, result) {
  return new Promise((res) => {
    const s = g.state;
    const avgPct = Math.round(result.avg * 100);
    let quizDone = false;
    g.audio.play(result.stars >= 2 ? 'fanfare' : 'levelup');
    if (result.stars) g.fx.burst(new THREE.Vector3(0, 1.8, -0.5), 'confetti', { n: 60 });
    const m = modal(lv.busy ? '☀️ Busy Day done!' : `Level ${lv.L} done!`, (b, close) => {
      const draw = () => {
        b.innerHTML = '';
        if (!lv.busy) b.appendChild(h('div', { class: 'big-stars' }, ...[0, 1, 2].map((i) => h('span', { class: i < result.stars ? 'on' : '', style: { animationDelay: i * 0.25 + 's' } }, '★'))));
        const en = result.stars === 3 ? 'Perfect! You are a super chef!' : result.stars === 2 ? 'Great job!' : result.stars === 1 ? 'Good job!' : 'Try again!';
        const r = result.stars === 3 ? 'Идеально! Ты супер-повар!' : result.stars === 2 ? 'Отлично!' : result.stars === 1 ? 'Хорошо!' : 'Попробуй ещё раз! Нужна хотя бы 1 звезда.';
        b.appendChild(h('div', { class: 'big-line center' }, en, ' ', sayBtn(en)));
        b.appendChild(ruLine(g, r, 'ru-help center'));
        b.appendChild(h('div', { class: 'res-list' },
          h('div', {}, `😊 Guests served: ${lv.served}/${lv.info.customers}`),
          h('div', {}, `🍽️ Cooking score: ${avgPct}%`),
          h('div', {}, `🪙 Money: +${lv.earned}`, lv.tips ? ` (tips ${lv.tips})` : ''),
          result.bonus ? h('div', {}, `🎁 Level bonus: +${result.bonus}`) : null));
        const words = [...lv.words].filter((w) => WORD[w]).slice(0, 12);
        if (words.length) b.appendChild(h('div', { class: 'words-row' }, ...words.map((w) => h('button', { class: 'wchip', onclick: () => speak(WORD[w].en, true) }, WORD[w].emoji, ' ', WORD[w].en))));
        const nextL = lv.L < LEVELS_PER && result.stars >= 1 ? lv.L + 1 : null;
        b.appendChild(h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '10px' } },
          quizDone ? null : h('button', { class: 'btn big sun', onclick: () => { click(); quiz(g, lv, () => { quizDone = true; draw(); }); } }, '✏️ Word Quiz +60🪙'),
          h('button', { class: 'btn ghost', onclick: () => { click(); close(); g.quitLevel(); g.leave(); } }, '🚪 Leave'),
          h('button', { class: 'btn', onclick: () => { click(); close(); g.quitLevel(); levels(g, lv.rid); } }, '📋 Levels'),
          nextL ? h('button', { class: 'btn mint big', onclick: () => { click(); close(); g.playLevel(lv.rid, nextL); } }, 'Next ▶')
            : !result.stars && !lv.busy ? h('button', { class: 'btn mint big', onclick: () => { click(); close(); g.playLevel(lv.rid, lv.L); } }, '🔄 Again') : null));
      };
      draw();
      if (result.newRestaurant) setTimeout(() => { celebrate(`${result.newRestaurant.emoji} New restaurant!`, ru(result.newRestaurant.ru + ' открыта!'), 2600); g.audio.play('fanfare'); }, 900);
    }, { noClose: true, onClose: res });
    void m;
  });
}

export function quiz(g, lv, onDone) {
  const s = g.state;
  const pool = WORDS.filter((w) => ['food', 'dish', 'tool', 'color'].includes(w.cat));
  let words = [...lv.words].map((w) => WORD[w]).filter((w) => w && pool.includes(w));
  if (words.length < 3) words = words.concat(pool.filter((w) => s.words[w.id]).slice(0, 6));
  words = words.sort(() => Math.random() - 0.5).slice(0, 3);
  while (words.length < 3) words.push(pool[Math.floor(Math.random() * pool.length)]);
  let qi = 0, right = 0;
  modal('✏️ Word Quiz', (b, close) => {
    const ask = () => {
      b.innerHTML = '';
      if (qi >= words.length) {
        const coins = right * 20;
        s.coins += coins; s.stats.quiz += right;
        g.changed(); g.save();
        g.audio.play(right === 3 ? 'fanfare' : 'coin');
        b.appendChild(h('div', { class: 'big-line center' }, `${right}/3 right! +${coins} 🪙`));
        b.appendChild(ruLine(g, right === 3 ? 'Все ответы верные! Молодец!' : 'Молодец! Слова можно повторить в Word Book 📖.', 'ru-help center'));
        b.appendChild(h('div', { class: 'row', style: { justifyContent: 'center' } }, h('button', { class: 'btn big mint', onclick: () => { click(); close(); } }, 'OK')));
        return;
      }
      const w = words[qi];
      const others = pool.filter((x) => x.id !== w.id && x.emoji !== w.emoji).sort(() => Math.random() - 0.5).slice(0, 2);
      const opts = [w, ...others].sort(() => Math.random() - 0.5);
      const type = qi % 2;
      b.appendChild(h('div', { class: 'muted center' }, `Question ${qi + 1}/3`));
      if (type === 0) {
        b.appendChild(h('div', { class: 'big-line center' }, `Which one is "${w.en}"?`, ' ', sayBtn(w.en)));
        b.appendChild(ruLine(g, 'Найди картинку для этого слова.', 'ru-help center'));
        speak(w.en);
      } else {
        b.appendChild(h('div', { class: 'quiz-em' }, w.emoji));
        b.appendChild(h('div', { class: 'big-line center' }, 'What is this in English?'));
        b.appendChild(ruLine(g, 'Как это по-английски?', 'ru-help center'));
      }
      const row = h('div', { class: 'quiz-opts' });
      let answered = false;
      for (const o of opts) {
        const btn = h('button', { class: 'quiz-opt' + (type === 0 ? ' em' : ''), onclick: () => {
          if (answered) return;
          answered = true;
          const ok = o.id === w.id;
          btn.classList.add(ok ? 'right' : 'wrong');
          if (!ok) row.querySelector(`[data-id="${w.id}"]`)?.classList.add('right');
          if (ok) { right++; g.audio.play('sparkle'); speak(pickOne(['Great job!', 'Yes! ' + w.en + '!', 'Correct!'])); } else { g.audio.play('no'); speak(w.en); }
          setTimeout(() => { qi++; ask(); }, ok ? 1100 : 1900);
        }, 'data-id': o.id }, type === 0 ? o.emoji : o.en);
        row.appendChild(btn);
      }
      b.appendChild(row);
    };
    ask();
  }, { narrow: true, noClose: true, onClose: onDone });
}
const pickOne = (a) => a[Math.floor(Math.random() * a.length)];

// ---------- Word Book ----------
export function wordBook(g) {
  const s = g.state;
  const cats = [
    { name: 'Food', icon: '🍓', cat: 'food' }, { name: 'Dishes', icon: '🍔', cat: 'dish' }, { name: 'Actions', icon: '🔪', cat: 'verb' },
    { name: 'Kitchen', icon: '🍳', cat: 'tool' }, { name: 'More', icon: '💬', cat: ['phrase', 'color'] },
  ];
  const seen = WORDS.filter((w) => s.words[w.id]).length;
  let body;
  const drawCat = (c) => {
    body.innerHTML = '';
    const list = WORDS.filter((w) => (Array.isArray(c.cat) ? c.cat.includes(w.cat) : w.cat === c.cat));
    const grid = h('div', { class: 'word-grid' });
    for (const w of list) {
      const known = !!s.words[w.id] || w.cat === 'phrase' || w.cat === 'color';
      grid.appendChild(h('button', { class: 'word' + (known ? '' : ' unknown'), onclick: () => { if (!known) { g.audio.play('no'); return; } click(); speak(w.en, true); } },
        h('div', { class: 'w-em' }, known ? w.emoji : '❓'),
        h('div', { class: 'w-en' }, known ? w.en : '???'),
        known && s.settings.help ? h('div', { class: 'w-ru' }, ru(w.ru)) : null));
    }
    body.appendChild(grid);
  };
  const tb = tabs(cats, (c) => drawCat(c));
  modal(`📖 Word Book · ${seen}/${WORDS.length}`, (b) => {
    b.appendChild(h('div', { class: 'muted' }, 'Tap a word to hear it. Cook new dishes to find more words!'));
    b.appendChild(ruLine(g, 'Нажми на слово, чтобы услышать. Готовь новые блюда, чтобы открыть больше слов!'));
    body = h('div');
    b.appendChild(body);
    drawCat(cats[0]);
  }, { tabs: tb });
}

// ---------- settings ----------
export function settings(g) {
  const s = g.state;
  const st = s.settings;
  modal('⚙️ Help & voice', (b) => {
    const row = (label, sub, ctl) => h('div', { class: 'toggle' }, h('div', {}, label, sub ? h('div', { class: 'muted small' }, sub) : null), ctl);
    const sw = (key, onChange) => {
      const btn = h('button', { class: 'sw-btn' + (st[key] ? ' on' : ''), onclick: () => {
        click();
        st[key] = !st[key];
        btn.classList.toggle('on', st[key]);
        onChange?.(st[key]);
        g.changed(); g.save();
      } }, h('i'));
      return btn;
    };
    const seg = (key, opts) => {
      const el = h('div', { class: 'seg' });
      for (const [v, label] of opts) {
        el.appendChild(h('button', { class: st[key] === v ? 'on' : '', onclick: () => { click(); st[key] = v; g.changed(); g.save(); el.querySelectorAll('button').forEach((x) => x.classList.remove('on')); el.querySelectorAll('button')[opts.findIndex((o) => o[0] === v)].classList.add('on'); } }, label));
      }
      return el;
    };
    b.append(
      row('Russian help', ru('Подсказки на русском'), sw('help')),
      row('Russian letters', ru('Буквы для подсказок'), seg('script', [['cyr', 'Кириллица'], ['lat', 'Latinica']])),
      row('Read English aloud', canSpeak() ? 'The phone says every task' : 'Not available on this device', sw('voice')),
      row('Voice speed', null, seg('rate', [[0.7, '🐢 Slow'], [0.85, 'Normal'], [1, '🐇 Fast']])),
      h('p', { class: 'muted small' }, 'Music and sounds: ⚙️ Menu in town.'));
  }, { narrow: true });
}
