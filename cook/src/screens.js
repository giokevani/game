// Café menus and screens: first visit, café menu, menu picker, order
// card, word quiz, Word Book, help settings.
import { h, modal, click, say, root, tabs } from '../../src/ui/ui.js';
import { RESTAURANTS, WORDS, WORD } from './data.js';
import { orderSentence } from './text.js';
import { ru, speak, primeSpeech, canSpeak } from './i18n.js';

const FACES = ['🙂', '😊', '👧', '🧒', '👩', '👦', '🧑', '👱‍♀️', '👩‍🦰', '🧑‍🦱'];
const sayBtn = (text) => h('button', { class: 'say-btn small', onclick: (e) => { e.stopPropagation(); speak(text, true); } }, '🔊');
const ruLine = (g, text, cls = 'ru-help') => (g.state.settings.help ? h('div', { class: cls }, ru(text)) : null);

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
    ['In the Free Kitchen you can make anything!', 'На свободной кухне можно готовить что угодно и смешивать любые продукты!'],
    ['Or cook what your guests order.', 'Или готовь то, что заказывают гости. Они платят монетками 🪙.'],
    ['Then go outside and build your dream house!', 'Потом выходи на улицу и строй дом своей мечты. Всё бесплатно! Кнопка 🔨 Build.'],
    ['Everything is in English. Tap 🔊 to listen!', 'Все задания на английском, а внизу подсказка по-русски. Нажми 🔊, чтобы послушать.'],
  ];
  for (const [en, r] of lines) {
    speak(en);
    await say('Chef Lily', '👩‍🍳', h('div', {}, h('b', {}, en), ' ', sayBtn(en), h('div', { class: 'ru-help' }, ru(r))));
  }
  g.state.intro = true;
  g.changed();
}

// ---------- the café menu (no levels: everything is open) ----------
export function menu(g) {
  modal('🍳 Blossom Kitchen', (b, close) => {
    const big = (cls, icon, title, sub, rsub, fn) => h('button', { class: 'cafe-big ' + cls, onclick: () => { click(); close(); fn(); } },
      h('span', { class: 'ic' }, icon), h('span', {}, h('b', {}, title), h('small', {}, sub), g.state.settings.help ? h('small', { class: 'ru-help' }, ru(rsub)) : null));
    const n = (g.state.creations || []).length;
    b.appendChild(h('div', { class: 'cafe-menu' },
      big('free', '✨', 'Free Kitchen', 'Make anything! Mix any food you like.', 'Готовь что хочешь!', () => g.openFree()),
      big('', '🛎️', 'Serve guests', 'Cook what the guests order.', 'Готовь заказы гостей.', () => pickMenu(g)),
      big('', '📒', `My dishes${n ? ' (' + n + ')' : ''}`, 'Everything you invented.', 'Твои придуманные блюда.', () => myDishes(g)),
      big('', '✏️', 'Word Quiz', '3 questions, coins for each!', 'Викторина: монетки за ответы.', () => quiz(g, null, () => menu(g)))));
    b.appendChild(h('div', { class: 'row', style: { marginTop: '10px' } },
      h('button', { class: 'btn mint small', onclick: () => { click(); wordBook(g); } }, '📖 Words'),
      h('button', { class: 'btn lav small', onclick: () => { click(); settings(g); } }, '⚙️ Help'),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn ghost', onclick: () => { click(); close(); g.leave(); } }, '🚪 Leave café')));
  }, { noClose: true });
}

export function pickMenu(g) {
  modal('🛎️ Which menu today?', (b, close) => {
    const grid = h('div', { class: 'rest-grid' });
    for (const R of RESTAURANTS) {
      grid.appendChild(h('button', { class: 'rest', style: { background: `linear-gradient(180deg, #fff, ${R.wall})` }, onclick: () => { click(); close(); g.serveGuests(R.id); } },
        h('div', { class: 'r-em' }, R.emoji), h('div', { class: 'r-name' }, R.en), ruLine(g, R.ru, 'r-ru'),
        h('div', { class: 'r-st' }, R.recipes.map((id) => WORD[id].emoji).join(' '))));
    }
    b.appendChild(grid);
    b.appendChild(h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn ghost small', onclick: () => { click(); close(); menu(g); } }, '◀ Back')));
  }, { noClose: true });
}

export function myDishes(g) {
  const list = g.state.creations || [];
  modal(`📒 My dishes (${list.length})`, (b, close) => {
    if (!list.length) b.appendChild(h('p', {}, 'Nothing yet! Make something in the ✨ Free Kitchen.'));
    const l = h('div', { class: 'dish-list' });
    for (const d of list) l.appendChild(h('div', { class: 'li' }, h('div', { class: 'big-ico' }, (d.items || []).slice(0, 3).map((id) => WORD[id]?.emoji || '').join('')),
      h('div', { style: { flex: 1 } }, h('div', { class: 't' }, d.name, ' ', sayBtn(d.name)), h('div', { class: 's' }, (d.items || []).map((id) => WORD[id]?.en || id).join(', ')))));
    b.appendChild(l);
    b.appendChild(h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn ghost small', onclick: () => { click(); close(); menu(g); } }, '◀ Back')));
  }, { noClose: true });
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
      h('button', { class: 'btn', onclick: () => { click(); close(); g.quitLevel(); menu(g); } }, '🍳 Café menu'),
      h('button', { class: 'btn lav', onclick: () => { click(); settings(g); } }, '⚙️ Help'),
      h('button', { class: 'btn ghost', onclick: () => { click(); close(); g.quitLevel(); g.leave(); } }, '🚪 Leave café')));
  }, { narrow: true, onClose: () => { g.paused = false; } });
}

// ---------- word quiz ----------
export function quiz(g, recent, onDone) {
  const s = g.state;
  const pool = WORDS.filter((w) => ['food', 'dish', 'tool', 'color'].includes(w.cat));
  let words = [...(recent || [])].map((w) => WORD[w]).filter((w) => w && pool.includes(w));
  if (words.length < 3) words = words.concat(pool.filter((w) => s.words[w.id]).sort(() => Math.random() - 0.5).slice(0, 6));
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
