// Save state + economy rules for Blossom Kitchen (pure logic, unit tested).
import { RESTAURANTS, RESTAURANT, LEVELS_PER, HOUSES, HOUSE, houseBonus, starsFor, RECIPE } from './data.js';

export const SAVE_KEY = 'blossomkitchen-v1';

export function newState() {
  return {
    v: 1,
    coins: 0,
    earned: 0,
    stars: {},        // 'cafe-3' -> 0..3
    busyBest: {},     // restaurant -> best served in Busy Day
    houses: [],       // owned house ids, in purchase order
    home: null,       // house she lives in
    words: {},        // word id -> times seen
    tips: [],         // step how-to tips already shown
    stats: { served: 0, perfect: 0, levels: 0, quiz: 0, playSec: 0 },
    intro: false,     // intro finished
    scriptChosen: false,
    settings: { script: 'cyr', voice: true, rate: 0.85, help: true, music: true, sfx: true },
  };
}

export function upgrade(s) {
  const base = newState();
  const out = { ...base, ...s, stats: { ...base.stats, ...(s.stats || {}) }, settings: { ...base.settings, ...(s.settings || {}) } };
  out.houses = (out.houses || []).filter((h) => HOUSE[h]);
  if (out.home && !out.houses.includes(out.home)) out.home = out.houses[0] || null;
  return out;
}

export function loadState(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(SAVE_KEY);
    if (!raw) return { state: newState(), fresh: true };
    return { state: upgrade(JSON.parse(raw)), fresh: false };
  } catch {
    return { state: newState(), fresh: true };
  }
}

export function saveState(s, storage = globalThis.localStorage) {
  try { storage?.setItem(SAVE_KEY, JSON.stringify(s)); return true; } catch { return false; }
}

// ---------- progress ----------
export const levelKey = (rid, L) => `${rid}-${L}`;
export const totalStars = (s) => Object.values(s.stars).reduce((a, b) => a + b, 0);
export const restaurantStars = (s, rid) => {
  let n = 0;
  for (let L = 1; L <= LEVELS_PER; L++) n += s.stars[levelKey(rid, L)] || 0;
  return n;
};
export const restaurantOpen = (s, rid) => totalStars(s) >= RESTAURANT[rid].stars;
export function levelOpen(s, rid, L) {
  if (!restaurantOpen(s, rid)) return false;
  if (L === 1) return true;
  return (s.stars[levelKey(rid, L - 1)] || 0) >= 1;
}
export const busyOpen = (s, rid) => (s.stars[levelKey(rid, LEVELS_PER)] || 0) >= 1;
export const allLevelsDone = (s) => RESTAURANTS.every((r) => busyOpen(s, r.id));

// ---------- money ----------
export const bonus = (s) => houseBonus(s.houses);

// what one served dish pays (quality 0..1)
export function dishPay(recipeId, q, s) {
  const price = RECIPE[recipeId].price;
  const base = Math.round(price * (0.5 + 0.5 * q) * bonus(s));
  const tip = q >= 0.88 ? Math.round(price * 0.3) : q >= 0.72 ? Math.round(price * 0.12) : 0;
  return { base, tip, total: base + tip };
}

// bonus for finishing a level: first clear + new stars
export function levelBonus(rid, L, stars, prevStars) {
  const ri = RESTAURANTS.findIndex((r) => r.id === rid);
  const first = prevStars === 0 && stars > 0 ? 20 + ri * 25 + L * 5 : 0;
  const newStars = Math.max(0, stars - prevStars) * (10 + ri * 10);
  return first + newStars;
}

export function finishLevel(s, rid, L, qualities, earned) {
  const served = qualities.filter((q) => q > 0);
  const avg = qualities.length ? qualities.reduce((a, b) => a + b, 0) / qualities.length : 0;
  const stars = starsFor(avg);
  const key = levelKey(rid, L);
  const prev = s.stars[key] || 0;
  const b = L > LEVELS_PER ? 0 : levelBonus(rid, L, stars, prev);
  if (L <= LEVELS_PER) s.stars[key] = Math.max(prev, stars);
  else s.busyBest[rid] = Math.max(s.busyBest[rid] || 0, served.length);
  s.coins += b;
  s.earned += b + earned;
  s.stats.levels++;
  return { stars, prev, bonus: b, avg, newRestaurant: RESTAURANTS.find((r) => r.stars > 0 && totalStars(s) >= r.stars && totalStars(s) - (s.stars[key] - prev) < r.stars) || null };
}

export function canBuy(s, hid) {
  const h = HOUSE[hid];
  return !!h && !s.houses.includes(hid) && s.coins >= h.price;
}

export function buyHouse(s, hid) {
  if (!canBuy(s, hid)) return false;
  s.coins -= HOUSE[hid].price;
  s.houses.push(hid);
  s.home = hid;
  return true;
}

export const nextHouse = (s) => HOUSES.find((h) => !s.houses.includes(h.id)) || null;

export function seeWords(s, ids) {
  for (const id of ids) if (id) s.words[id] = (s.words[id] || 0) + 1;
}
