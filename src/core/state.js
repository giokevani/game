// Game state + pure progression helpers (no DOM / three.js; unit tested).
import { DEFAULT_LOOK } from '../data/avatar.js';

export const SAVE_VERSION = 1;
export const MAX_LEVEL = 30;

// XP needed to go from level n to n+1
export function xpToNext(level) {
  return 100 + level * 55;
}

export function levelFromXP(xp) {
  let lvl = 1;
  let need = xpToNext(1);
  while (xp >= need && lvl < MAX_LEVEL) {
    xp -= need;
    lvl++;
    need = xpToNext(lvl);
  }
  return { level: lvl, into: xp, need };
}

export function totalXPForLevel(level) {
  let t = 0;
  for (let l = 1; l < level; l++) t += xpToNext(l);
  return t;
}

export function newState() {
  return {
    v: SAVE_VERSION,
    created: Date.now(),
    player: {
      name: '',
      coins: 150,
      xp: 0,
      look: { ...DEFAULT_LOOK },
      pos: null,
    },
    owned: {
      avatar: [],       // avatar item ids bought
      vehicles: [],
      recipes: [],
    },
    house: null,        // filled by house module (plot, tiles, walls, furniture)
    pets: [],           // {uid, species, name, xp, age, needs:{}, acc:[]}
    activePet: null,
    eggs: [],           // {uid, type, progress}
    jobs: { bakery: { xp: 0, best: 0 }, florist: { xp: 0, best: 0 }, garden: { xp: 0, best: 0 }, fishing: { xp: 0, best: 0 }, delivery: { xp: 0, best: 0 } },
    garden: [],         // per garden bed {seed, plantedAt, water}
    quests: { active: [], done: [], counters: {}, metNpcs: [] },
    collections: { shells: [], fish: {}, plants: {}, stickers: [], zones: [] },
    unlocks: { cave: false, sky: false, plot: 0 },
    stats: { playTime: 0, coinsEarned: 0, coinsSpent: 0, petTasks: 0, jobsDone: 0, steps: 0, itemsPlaced: 0, eggsHatched: 0, fishCaught: 0, harvests: 0 },
    settings: { music: true, sfx: true, quality: 'auto', joystickHint: true },
    time: 0.34,
    tutorial: 0,
  };
}

export function level(state) {
  return levelFromXP(state.player.xp).level;
}

export function addXP(state, amount) {
  const before = level(state);
  state.player.xp += Math.max(0, Math.round(amount));
  const after = level(state);
  return after > before ? after : 0;
}

export function addCoins(state, amount) {
  const a = Math.round(amount);
  state.player.coins += a;
  if (a > 0) state.stats.coinsEarned += a;
  return a;
}

export function canAfford(state, price) {
  return state.player.coins >= price;
}

export function spend(state, price) {
  if (price < 0 || !canAfford(state, price)) return false;
  state.player.coins -= price;
  state.stats.coinsSpent += price;
  return true;
}

// deep merge saved data onto a fresh state so new fields always exist
function fill(base, saved) {
  if (saved === null || saved === undefined) return base;
  if (Array.isArray(base) || typeof base !== 'object' || base === null) return saved;
  const out = { ...base };
  for (const k of Object.keys(saved)) {
    out[k] = (k in base && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) ? fill(base[k], saved[k]) : saved[k];
  }
  return out;
}

export function migrate(saved) {
  if (!saved || typeof saved !== 'object') return newState();
  const s = fill(newState(), saved);
  s.v = SAVE_VERSION;
  return s;
}

export function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}
