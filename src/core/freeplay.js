// Free play (what she asked for): no levels and no prices. Every house part,
// piece of furniture, pet egg, ride and seed is free and unlocked from the
// start; only clothes in Sparkle Style still cost coins, so jobs and the café
// still have a point. Applied once at start-up, before the systems load.
import { FURNITURE } from '../data/furniture.js';
import { FLOORS, WALLPAPERS, EXTERIORS, OPENINGS, PRICES } from '../data/houseStyles.js';
import { PLOT_PRICES } from '../house/model.js';
import { EGGS, PET_ACC } from '../data/pets.js';
import { JOBS, SEEDS, CAKE, FLOWERS, RIBBONS } from '../data/jobs.js';
import { AVATAR_ITEMS } from '../data/avatar.js';
import { QUESTS } from '../data/quests.js';

export const FREE_PLAY = true;
export const SEED_SPEEDUP = 10; // plants grow 10x faster (carrots in 9 s, golden apples in 90 s)

let applied = false;
export function applyFreePlayData() {
  if (!FREE_PLAY || applied) return;
  applied = true;
  const free = (list) => { for (const x of list) { x.price = 0; x.lvl = 1; delete x.level; delete x.unlock; } };
  free(FURNITURE);
  free(FLOORS); free(WALLPAPERS); free(EXTERIORS); free(OPENINGS);
  for (const k of Object.keys(PRICES)) PRICES[k] = 0;
  for (let i = 0; i < PLOT_PRICES.length; i++) PLOT_PRICES[i] = 0;
  free(EGGS); free(PET_ACC);
  // seeds are free and grow 10x faster; harvests sell for a quarter, so money still means something
  for (const s of SEEDS) { s.cost = 0; s.lvl = 1; s.grow = Math.max(8, Math.round(s.grow / SEED_SPEEDUP)); s.sell = Math.max(5, Math.round(s.sell / 4)); }
  for (const j of JOBS) delete j.lvl;
  // every cake and flower choice is on the shelf (orders still start simple)
  for (const list of [CAKE.bases, CAKE.frostings, CAKE.toppings, FLOWERS, RIBBONS]) for (const x of list) x.lvl = 1;
  // clothes keep their price, but nothing waits for a level
  for (const it of AVATAR_ITEMS) delete it.level;
  for (const q of QUESTS) q.lvl = 1;
}

export function applyFreePlayState(st, vehicleIds = []) {
  if (!FREE_PLAY) return;
  st.unlocks.cave = true;
  st.unlocks.sky = true;
  for (const id of vehicleIds) if (!st.owned.vehicles.includes(id)) st.owned.vehicles.push(id);
}

// level used for "is this unlocked?" checks
export const unlockedLevel = () => 30;
