// Pacing simulation for Blossom Kitchen: how long until each restaurant,
// each Dream Home, and everything? Uses a time model per step type for an
// 11-year-old player (seconds), including walking in, reading and serving.
import { RESTAURANTS, LEVELS_PER, HOUSES, levelInfo, makeOrder, RECIPE } from '../../cook/src/data.js';
import { newState, finishLevel, dishPay, levelOpen, busyOpen, buyHouse, nextHouse, totalStars, restaurantOpen, levelKey } from '../../cook/src/state.js';
import { rng } from '../../src/engine/builder.js';

const T = { add: (s) => 2 + s.items.length * 1.6, stir: (s) => 1.5 + s.turns * 1.1, chop: () => 5, cook: (s) => (s.flip ? 9 : 6), pour: () => 4,
  spread: () => 5, place: (s) => 1.5 + s.n * 0.7, stack: (s) => 1.5 + s.layers.length * 1.1, roll: () => 4, slice: (s) => 1.5 + s.cuts * 1.1 };
const STEP_OVERHEAD = 1.4, ORDER_OVERHEAD = 9, LEVEL_OVERHEAD = 35; // transitions, reading the order, serving; results + quiz

function sim(seed, skill) {
  const r = rng(seed);
  const s = newState();
  let t = 0;
  const log = { restaurants: {}, houses: {} };
  const q = () => Math.min(1, Math.max(0.3, skill + (r() - 0.5) * 0.3));
  const playLevel = (rid, L) => {
    const info = levelInfo(rid, L);
    const qs = [];
    let earned = 0;
    for (let c = 0; c < info.customers; c++) {
      const dishes = r() < info.combo ? 2 : 1;
      for (let d = 0; d < dishes; d++) {
        const o = makeOrder(info.recipes[Math.floor(r() * info.recipes.length)], r);
        for (const st of o.steps) t += T[st.t](st) + STEP_OVERHEAD;
        const qq = q();
        const pay = dishPay(o.recipe, qq, s);
        earned += pay.total;
        qs.push(qq);
      }
      t += ORDER_OVERHEAD;
    }
    s.coins += earned;
    finishLevel(s, rid, L, qs, earned);
    s.coins += 20; // quiz (about 2 of 3 right)
    t += LEVEL_OVERHEAD;
  };
  const buy = () => {
    let h;
    while ((h = nextHouse(s)) && s.coins >= h.price) { buyHouse(s, h.id); log.houses[h.id] = t / 3600; }
  };
  // strategy: play the next open level; replay for stars if stuck; Busy Days when all done
  let guard = 0;
  while (nextHouse(s) && guard++ < 5000) {
    let played = false;
    for (const R of RESTAURANTS) {
      if (!restaurantOpen(s, R.id)) continue;
      if (!log.restaurants[R.id]) log.restaurants[R.id] = t / 3600;
      for (let L = 1; L <= LEVELS_PER; L++) {
        if (levelOpen(s, R.id, L) && !(s.stars[levelKey(R.id, L)] >= 1)) { playLevel(R.id, L); played = true; break; }
      }
      if (played) break;
    }
    if (!played) {
      // replay the lowest-star level in the best open restaurant, or a Busy Day
      const open = RESTAURANTS.filter((R) => restaurantOpen(s, R.id));
      const R = open[open.length - 1];
      const low = [...Array(LEVELS_PER)].map((_, i) => i + 1).find((L) => (s.stars[levelKey(R.id, L)] || 0) < 3);
      if (low && r() < 0.5) playLevel(R.id, low);
      else if (busyOpen(s, R.id)) playLevel(R.id, LEVELS_PER + 1);
      else playLevel(R.id, low || 1);
    }
    buy();
  }
  return { hours: t / 3600, log, stars: totalStars(s) };
}

for (const [seed, skill] of [[1, 0.8], [2, 0.85], [3, 0.72]]) {
  const res = sim(seed, skill);
  console.log(`seed ${seed} skill ${skill}: all houses after ${res.hours.toFixed(1)} h, stars ${res.stars}`);
  console.log('  restaurants open at (h):', Object.entries(res.log.restaurants).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(', '));
  console.log('  houses bought at (h):', Object.entries(res.log.houses).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(', '));
}
// order time per recipe
const avg = {};
for (const R of RECIPES_OF()) {
  let sec = 0; const r = rng(9);
  for (let i = 0; i < 50; i++) { const o = makeOrder(R, r); for (const st of o.steps) sec += T[st.t](st) + STEP_OVERHEAD; }
  avg[R] = Math.round(sec / 50 + ORDER_OVERHEAD);
}
function RECIPES_OF() { return Object.keys(RECIPE); }
console.log('seconds per order:', JSON.stringify(avg));
