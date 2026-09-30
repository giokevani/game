// Blossom Kitchen logic tests: data integrity, texts, economy, progress, save.
import test from 'node:test';
import assert from 'node:assert/strict';
import { WORDS, WORD, RECIPES, RECIPE, RESTAURANTS, HOUSES, CHOP, LEVELS_PER, levelInfo, makeOrder, recipeWords, starsFor } from '../../cook/src/data.js';
import { stepPrompt, orderSentence, dishPhrase, translit, HOWTO, withEn, withRu } from '../../cook/src/text.js';
import { newState, upgrade, loadState, saveState, dishPay, finishLevel, levelOpen, restaurantOpen, busyOpen, buyHouse, canBuy, nextHouse, totalStars, levelKey, seeWords } from '../../cook/src/state.js';
import { rng } from '../../src/engine/builder.js';

const STEP_TYPES = ['add', 'stir', 'chop', 'cook', 'pour', 'spread', 'place', 'stack', 'roll', 'slice'];

// every combination of variants of a recipe
function allOrders(id) {
  const r = RECIPE[id];
  const keys = Object.keys(r.vary);
  const out = [];
  const rec = (i, v) => {
    if (i === keys.length) {
      const seq = keys.map((k) => r.vary[k].indexOf(v[k]));
      let n = 0;
      out.push(makeOrder(id, () => { const k = keys[n]; const idx = seq[n++]; return (idx + 0.5) / r.vary[k].length; }));
      return;
    }
    for (const o of r.vary[keys[i]]) rec(i + 1, { ...v, [keys[i]]: o });
  };
  rec(0, {});
  return out;
}

test('word list: unique ids, English + Russian + emoji for each', () => {
  const ids = new Set();
  for (const w of WORDS) {
    assert.ok(!ids.has(w.id), 'duplicate ' + w.id);
    ids.add(w.id);
    assert.ok(w.en && w.ru && w.emoji && w.cat && w.acc, 'incomplete word ' + w.id);
    assert.match(w.ru, /[а-яё]/i, 'Russian text should be Cyrillic: ' + w.id);
  }
  assert.ok(WORDS.length >= 90, `only ${WORDS.length} words`);
});

test('17 recipes across 5 restaurants, all steps valid', () => {
  assert.equal(RECIPES.length, 17);
  const used = new Set();
  for (const R of RESTAURANTS) for (const id of R.recipes) { assert.ok(RECIPE[id], id); used.add(id); }
  assert.equal(used.size, 17, 'every recipe is on a menu exactly once');
  for (const r of RECIPES) {
    assert.ok(WORD[r.id], 'dish word ' + r.id);
    assert.ok(r.price > 0);
    for (const o of allOrders(r.id)) {
      assert.ok(o.steps.length >= 3, `${r.id} too short`);
      for (const st of o.steps) {
        assert.ok(STEP_TYPES.includes(st.t), st.t);
        const s = JSON.stringify(st);
        assert.ok(!s.includes('$'), `unresolved variant in ${r.id}: ${s}`);
        if (st.t === 'chop') assert.ok(CHOP[st.item], `no chop model for ${st.item}`);
        if (st.items) for (const i of st.items) assert.ok(WORD[i], `unknown word ${i} in ${r.id}`);
        if (st.t === 'place') assert.ok(st.n >= 1 && WORD[st.item], `${r.id} place ${st.item}`);
        const p = stepPrompt(st);
        assert.ok(p.en && p.ru, `prompt for ${r.id}/${st.t}`);
        assert.doesNotMatch(p.en, /undefined|\$/);
        assert.doesNotMatch(p.ru, /undefined|\$/);
        assert.ok(HOWTO[st.t], 'how-to tip for ' + st.t);
      }
    }
  }
});

test('chopping comes before the toppings that need it', () => {
  // (the cake gets whole strawberries on purpose)
  for (const r of RECIPES.filter((x) => x.id !== 'cake')) for (const o of allOrders(r.id)) {
    const chopped = new Set();
    for (const st of o.steps) {
      if (st.t === 'chop') chopped.add(st.item);
      if (st.t === 'place' && CHOP[st.item] && !['cheese', 'chocolate'].includes(st.item)) assert.ok(chopped.has(st.item), `${r.id}: ${st.item} placed before chopping`);
    }
  }
});

test('order sentences are proper English with a Russian line', () => {
  for (const r of RECIPES) for (const o of allOrders(r.id)) {
    const s = orderSentence([o], 0);
    assert.match(s.en, /^Hello! I'd like .+, please!$/);
    assert.doesNotMatch(s.en, /undefined|\$|  /);
    assert.match(s.ru, /[а-я]/);
    assert.doesNotMatch(s.ru, /undefined/);
  }
  const burger = makeOrder('burger', () => 0.99); // cheese=false
  assert.match(dishPhrase(burger).en, /no cheese/);
  assert.match(dishPhrase(burger).ru, /без сыра/);
  const two = orderSentence([makeOrder('burger', () => 0), makeOrder('milkshake', () => 0)], 1);
  assert.match(two.en, /^Hi! Can I have a burger with cheese and tomato and a chocolate milkshake, please!$/);
  assert.equal(withEn('strawberry'), 'strawberries');
  assert.equal(withRu('cheese'), 'сыром');
});

test('Russian in Latin letters', () => {
  assert.equal(translit('Привет! Нарежь помидор'), 'Privet! Narezh pomidor');
  assert.equal(translit('Шоколадный коктейль'), 'Shokoladnyy kokteyl');
  assert.equal(translit('Щука, ёжик, юла, яблоко'), 'Schuka, yozhik, yula, yabloko');
});

test('levels ramp up: more guests, more dishes, less patience', () => {
  for (const R of RESTAURANTS) {
    let prev = null;
    for (let L = 1; L <= LEVELS_PER; L++) {
      const i = levelInfo(R.id, L);
      assert.ok(i.recipes.length >= 1 && i.recipes.every((x) => R.recipes.includes(x)));
      if (prev) {
        assert.ok(i.customers >= prev.customers);
        assert.ok(i.recipes.length >= prev.recipes.length);
        assert.ok(i.patience <= prev.patience);
      }
      prev = i;
    }
    assert.equal(levelInfo(R.id, 1).recipes.length, 1, 'level 1 has one dish');
    assert.equal(levelInfo(R.id, LEVELS_PER).recipes.length, R.recipes.length, 'last level has the full menu');
    assert.equal(levelInfo(R.id, LEVELS_PER + 1).customers, 10, 'Busy Day');
  }
});

test('stars from quality', () => {
  assert.equal(starsFor(0.95), 3);
  assert.equal(starsFor(0.8), 2);
  assert.equal(starsFor(0.5), 1);
  assert.equal(starsFor(0.2), 0);
});

test('money: better cooking pays more, houses add +5% each', () => {
  const s = newState();
  const perfect = dishPay('pizza', 1, s), ok = dishPay('pizza', 0.5, s);
  assert.ok(perfect.total > ok.total);
  assert.ok(perfect.tip > 0 && ok.tip === 0);
  s.houses = ['studio', 'cottage'];
  assert.ok(dishPay('pizza', 1, s).base > perfect.base);
  assert.equal(dishPay('pizza', 1, s).base, Math.round(RECIPE.pizza.price * 1.1));
});

test('progress: levels, restaurants and Busy Day unlock in order', () => {
  const s = newState();
  assert.ok(levelOpen(s, 'cafe', 1));
  assert.ok(!levelOpen(s, 'cafe', 2));
  assert.ok(!restaurantOpen(s, 'diner'));
  const r = finishLevel(s, 'cafe', 1, [1, 1, 0.9, 1], 80);
  assert.equal(r.stars, 3);
  assert.ok(r.bonus > 0);
  assert.ok(levelOpen(s, 'cafe', 2));
  // replaying with fewer stars keeps the best
  finishLevel(s, 'cafe', 1, [0.5, 0.5], 20);
  assert.equal(s.stars[levelKey('cafe', 1)], 3);
  for (let L = 2; L <= LEVELS_PER; L++) finishLevel(s, 'cafe', L, [0.8, 0.8], 50);
  assert.ok(busyOpen(s, 'cafe'));
  assert.ok(restaurantOpen(s, 'diner'), `stars ${totalStars(s)}`);
  // no level bonus for Busy Day, but best is recorded
  const b = finishLevel(s, 'cafe', LEVELS_PER + 1, [1, 1, 1], 100);
  assert.equal(b.bonus, 0);
  assert.equal(s.busyBest.cafe, 3);
  // 0 stars don't open the next level
  const t = newState();
  finishLevel(t, 'cafe', 1, [0.2, 0.1], 5);
  assert.ok(!levelOpen(t, 'cafe', 2));
});

test('every restaurant can be unlocked with the stars available before it', () => {
  let before = 0;
  for (const R of RESTAURANTS) {
    assert.ok(R.stars <= before * 0.75 || R.stars === 0, `${R.id} needs ${R.stars} of ${before} possible stars`);
    before += LEVELS_PER * 3;
  }
});

test('Dream Homes: 10 houses, rising prices, buying works', () => {
  assert.equal(HOUSES.length, 10);
  for (let i = 1; i < HOUSES.length; i++) assert.ok(HOUSES[i].price > HOUSES[i - 1].price);
  const s = newState();
  assert.ok(!canBuy(s, 'studio'));
  s.coins = 500;
  assert.ok(buyHouse(s, 'studio'));
  assert.equal(s.coins, 350);
  assert.equal(s.home, 'studio');
  assert.ok(!buyHouse(s, 'studio'), 'cannot buy twice');
  assert.equal(nextHouse(s).id, 'cottage');
});

test('save: round trip, upgrade of old/partial saves, broken data', () => {
  const mem = new Map();
  const store = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  assert.equal(loadState(store).fresh, true);
  const s = newState();
  s.coins = 123; s.houses = ['studio', 'nope']; s.home = 'nope';
  seeWords(s, ['tomato', 'tomato', 'egg']);
  saveState(s, store);
  const l = loadState(store);
  assert.equal(l.fresh, false);
  assert.equal(l.state.coins, 123);
  assert.deepEqual(l.state.houses, ['studio']);
  assert.equal(l.state.home, 'studio');
  assert.equal(l.state.words.tomato, 2);
  const up = upgrade({ coins: 5, settings: { script: 'lat' } });
  assert.equal(up.settings.voice, true);
  assert.equal(up.settings.script, 'lat');
  mem.set('blossomkitchen-v1', '{broken');
  assert.equal(loadState(store).fresh, true);
});

test('Word Book: every recipe teaches its words', () => {
  for (const r of RECIPES) {
    const w = recipeWords(r.id);
    assert.ok(w.includes(r.id));
    assert.ok(w.every((x) => WORD[x]));
  }
  // most words are reachable through cooking
  const reach = new Set();
  for (const r of RECIPES) for (const o of allOrders(r.id)) for (const st of o.steps) for (const x of stepPrompt(st).words || []) reach.add(x);
  for (const r of RECIPES) for (const x of recipeWords(r.id)) reach.add(x);
  const food = WORDS.filter((w) => ['food', 'dish', 'verb'].includes(w.cat));
  const missing = food.filter((w) => !reach.has(w.id)).map((w) => w.id);
  assert.ok(missing.length <= 12, 'unreachable words: ' + missing.join(', '));
});

test('makeOrder is random but valid across many seeds', () => {
  const r = rng(7);
  for (let i = 0; i < 300; i++) {
    const id = RECIPES[Math.floor(r() * RECIPES.length)].id;
    const o = makeOrder(id, r);
    assert.equal(o.recipe, id);
    for (const [k, v] of Object.entries(o.vary)) assert.ok(RECIPE[id].vary[k].includes(v));
  }
});
