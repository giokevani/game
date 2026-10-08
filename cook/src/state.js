// Café progress + economy rules (pure logic, unit tested). The café lives
// inside the Blossom Bay save as state.cafe; coins are Blossom Bay coins.
import { RESTAURANTS, RECIPE } from './data.js';

// the old stand-alone Blossom Kitchen save (moved into Blossom Bay once)
export const OLD_SAVE_KEY = 'blossomkitchen-v1';
const OLD_HOUSE_PRICES = { studio: 150, cottage: 400, beach: 800, treehouse: 1500, loft: 2500, villa: 4000, chalet: 6000, mansion: 9000, castle: 13000, palace: 20000 };

export function newCafeState() {
  return {
    words: {},        // word id -> times seen
    tips: [],         // step how-to tips already shown
    stats: { served: 0, perfect: 0, levels: 0, quiz: 0, playSec: 0, earned: 0 },
    intro: false,     // Chef Lily's welcome finished
    scriptChosen: false,
    announced: false, // "the café is open" message shown in town
    imported: false,  // old stand-alone save already moved over
    creations: [],    // dishes she invented in the Free Kitchen: {name, items, n, t}
    settings: { script: 'cyr', voice: true, rate: 0.85, help: true },
  };
}

// Café state as the café code sees it: the stored object plus a live `coins`
// property that reads and writes the Blossom Bay purse. Not saved twice:
// the extra properties are non-enumerable, so JSON.stringify skips them.
export function cafeView(bb) {
  const base = newCafeState();
  const c = bb.cafe || {};
  const s = { ...base, ...c, stats: { ...base.stats, ...(c.stats || {}) }, settings: { ...base.settings, ...(c.settings || {}) } };
  bb.cafe = s;
  Object.defineProperty(s, 'coins', {
    enumerable: false,
    configurable: true,
    get: () => bb.player.coins,
    set: (v) => {
      const d = Math.round(v - bb.player.coins);
      bb.player.coins += d;
      if (d > 0) { bb.stats.coinsEarned += d; s.stats.earned += d; }
    },
  });
  return s;
}

// one-time move of the stand-alone Blossom Kitchen save into Blossom Bay
export function importKitchenSave(bb, old) {
  const cafe = cafeView(bb);
  if (cafe.imported || !old || typeof old !== 'object') { cafe.imported = true; return { coins: 0 }; }
  for (const [k, v] of Object.entries(old.words || {})) cafe.words[k] = (cafe.words[k] || 0) + (v | 0);
  cafe.tips = [...new Set([...cafe.tips, ...(old.tips || [])])];
  if (old.scriptChosen) { cafe.scriptChosen = true; Object.assign(cafe.settings, pick(old.settings || {}, ['script', 'voice', 'rate', 'help'])); }
  if (old.intro) cafe.intro = true;
  // her money comes along, and the stand-alone houses are paid back
  const refund = (old.houses || []).reduce((a, h) => a + (OLD_HOUSE_PRICES[h] || 0), 0);
  const coins = Math.max(0, Math.round((old.coins || 0) + refund));
  bb.player.coins += coins;
  cafe.imported = true;
  return { coins };
}
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));

// ---------- money ----------
// Prices are scaled to the Blossom Bay economy, where a cake job pays about
// 30-55 coins every 15-20 seconds: a café dish pays 50-145 coins but takes
// 30-55 seconds of hands-on cooking.
export const bbPrice = (recipeId) => 35 + Math.round(RECIPE[recipeId].price * 0.9);

// what one served dish pays (quality 0..1)
export function dishPay(recipeId, q) {
  const price = bbPrice(recipeId);
  const base = Math.round(price * (0.5 + 0.5 * q));
  const tip = q >= 0.88 ? Math.round(price * 0.3) : q >= 0.72 ? Math.round(price * 0.12) : 0;
  return { base, tip, total: base + tip };
}
// a little XP for the Blossom Bay save (free play: levels unlock nothing)
export const dishXP = (recipeId, q) => 3 + RESTAURANTS.findIndex((r) => r.recipes.includes(recipeId)) + (q >= 0.88 ? 2 : q >= 0.72 ? 1 : 0);

export function seeWords(s, ids) {
  for (const id of ids) if (id) s.words[id] = (s.words[id] || 0) + 1;
}
