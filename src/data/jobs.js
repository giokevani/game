// Jobs, fish, plants. Pure data + helpers (unit tested).
export const JOBS = [
  { id: 'bakery', name: 'Baker', place: 'Sweet Crumbs', icon: '🧁', building: 'bakery', desc: 'Decorate cakes exactly like the customers ask.' },
  { id: 'florist', name: 'Florist', place: 'Petal Shop', icon: '💐', building: 'florist', desc: 'Remember the bouquet and make it again.' },
  { id: 'garden', name: 'Gardener', place: 'Blossom Park', icon: '🌱', desc: 'Plant seeds, water them and harvest.' },
  { id: 'fishing', name: 'Fisher', place: 'Sunny Pier', icon: '🎣', desc: 'Catch fish with good timing.' },
  { id: 'delivery', name: 'Delivery', place: 'Bay Post', icon: '📦', building: 'postoffice', desc: 'Race packages to houses around town.', lvl: 3 },
];
export const JOB = Object.fromEntries(JOBS.map((j) => [j.id, j]));

// successful tasks needed for job level 1..5
export const JOB_LEVELS = [0, 12, 35, 75, 130];
export function jobLevel(xp) {
  let l = 1;
  for (let i = 0; i < JOB_LEVELS.length; i++) if (xp >= JOB_LEVELS[i]) l = i + 1;
  return l;
}
export const payMul = (lvl) => 1 + (lvl - 1) * 0.2;

// ---------- bakery ----------
export const CAKE = {
  bases: [
    { id: 'vanilla', name: 'Vanilla', color: '#fff0c4', lvl: 1 },
    { id: 'choco', name: 'Chocolate', color: '#8a5a3c', lvl: 1 },
    { id: 'straw', name: 'Strawberry', color: '#ffb3c8', lvl: 2 },
    { id: 'blue', name: 'Blueberry', color: '#b8c4ff', lvl: 3 },
  ],
  frostings: [
    { id: 'pink', name: 'Pink', color: '#ff9ac4', lvl: 1 },
    { id: 'white', name: 'Cream', color: '#ffffff', lvl: 1 },
    { id: 'mint', name: 'Mint', color: '#9ff0cf', lvl: 1 },
    { id: 'lemon', name: 'Lemon', color: '#fff07a', lvl: 2 },
    { id: 'lav', name: 'Lavender', color: '#cbb2ff', lvl: 3 },
  ],
  toppings: [
    { id: 'cherry', name: 'Cherry', icon: '🍒', lvl: 1 },
    { id: 'strawberry', name: 'Strawberry', icon: '🍓', lvl: 1 },
    { id: 'candle', name: 'Candle', icon: '🕯️', lvl: 1 },
    { id: 'star', name: 'Star', icon: '⭐', lvl: 2 },
    { id: 'heart', name: 'Heart', icon: '💗', lvl: 2 },
    { id: 'flower', name: 'Flower', icon: '🌸', lvl: 3 },
    { id: 'choc', name: 'Choc Chip', icon: '🍫', lvl: 4 },
  ],
};
export function cakeRules(lvl) {
  return { tiers: lvl >= 4 ? 2 : 1, toppings: lvl >= 3 ? 2 : 1, time: 80 - Math.min(20, (lvl - 1) * 5), pay: 22 };
}
export function randomCake(lvl, r = Math.random) {
  const pick = (l) => { const ok = l.filter((x) => x.lvl <= lvl); return ok[Math.floor(r() * ok.length)].id; };
  const rules = cakeRules(lvl);
  const tiers = [];
  for (let i = 0; i < (rules.tiers === 2 && r() < 0.6 ? 2 : 1); i++) tiers.push({ base: pick(CAKE.bases), frost: pick(CAKE.frostings) });
  const tops = [];
  for (let i = 0; i < rules.toppings; i++) tops.push(pick(CAKE.toppings));
  return { tiers, tops: tops.sort() };
}
export function sameCake(a, b) {
  if (a.tiers.length !== b.tiers.length) return false;
  for (let i = 0; i < a.tiers.length; i++) if (a.tiers[i].base !== b.tiers[i].base || a.tiers[i].frost !== b.tiers[i].frost) return false;
  return [...a.tops].sort().join() === [...b.tops].sort().join();
}

// ---------- florist ----------
export const FLOWERS = [
  { id: 'rose', icon: '🌹', name: 'Rose', lvl: 1 },
  { id: 'tulip', icon: '🌷', name: 'Tulip', lvl: 1 },
  { id: 'sunflower', icon: '🌻', name: 'Sunflower', lvl: 1 },
  { id: 'daisy', icon: '🌼', name: 'Daisy', lvl: 1 },
  { id: 'blossom', icon: '🌸', name: 'Blossom', lvl: 2 },
  { id: 'hibiscus', icon: '🌺', name: 'Hibiscus', lvl: 3 },
  { id: 'white', icon: '💮', name: 'Snowflower', lvl: 4 },
];
export const RIBBONS = [
  { id: 'pink', color: '#ff8fc0' }, { id: 'blue', color: '#7fc6ff' }, { id: 'yellow', color: '#ffd45e' }, { id: 'purple', color: '#b58cff' },
];
export function floristRules(lvl) {
  return { count: 3 + Math.min(3, lvl - 1), memory: lvl >= 2, show: Math.max(2.5, 5 - lvl * 0.5), time: 75, pay: 28, ribbon: lvl >= 2 };
}
export function randomBouquet(lvl, r = Math.random) {
  const ok = FLOWERS.filter((f) => f.lvl <= lvl);
  const n = floristRules(lvl).count;
  const flowers = [];
  for (let i = 0; i < n; i++) flowers.push(ok[Math.floor(r() * ok.length)].id);
  return { flowers: flowers.sort(), ribbon: floristRules(lvl).ribbon ? RIBBONS[Math.floor(r() * RIBBONS.length)].id : null };
}
export function sameBouquet(a, b) {
  return [...a.flowers].sort().join() === [...b.flowers].sort().join() && (a.ribbon || null) === (b.ribbon || null);
}

// ---------- fishing ----------
export const FISH = [
  { id: 'sardine', name: 'Sardine', icon: '🐟', rar: 'common', w: 30, price: 12, speed: 0.8 },
  { id: 'clown', name: 'Clownfish', icon: '🐠', rar: 'common', w: 24, price: 18, speed: 0.9 },
  { id: 'crab', name: 'Crab', icon: '🦀', rar: 'common', w: 22, price: 16, speed: 0.7 },
  { id: 'shrimp', name: 'Shrimp', icon: '🦐', rar: 'common', w: 20, price: 14, speed: 1.0 },
  { id: 'starfish', name: 'Starfish', icon: '⭐', rar: 'common', w: 16, price: 20, speed: 0.5 },
  { id: 'puffer', name: 'Pufferfish', icon: '🐡', rar: 'uncommon', w: 12, price: 36, speed: 1.1 },
  { id: 'squid', name: 'Squid', icon: '🦑', rar: 'uncommon', w: 10, price: 44, speed: 1.3 },
  { id: 'jelly', name: 'Jellyfish', icon: '🪼', rar: 'uncommon', w: 10, price: 40, speed: 1.0, night: true },
  { id: 'shell', name: 'Nautilus', icon: '🐚', rar: 'uncommon', w: 9, price: 48, speed: 0.9 },
  { id: 'octopus', name: 'Octopus', icon: '🐙', rar: 'rare', w: 6, price: 88, speed: 1.5 },
  { id: 'lobster', name: 'Lobster', icon: '🦞', rar: 'rare', w: 5, price: 104, speed: 1.4 },
  { id: 'sunfish', name: 'Sunfish', icon: '🐠', rar: 'rare', w: 4, price: 120, speed: 1.5, day: true, hue: 40 },
  { id: 'moonfish', name: 'Moon Fish', icon: '🐟', rar: 'rare', w: 4, price: 128, speed: 1.6, night: true, hue: 220 },
  { id: 'shark', name: 'Tiny Shark', icon: '🦈', rar: 'ultra', w: 2.2, price: 240, speed: 1.9 },
  { id: 'golden', name: 'Golden Fish', icon: '🐟', rar: 'legendary', w: 0.8, price: 480, speed: 2.1, hue: 45, gold: true },
  { id: 'rainbow', name: 'Rainbow Fish', icon: '🐠', rar: 'legendary', w: 0.6, price: 640, speed: 2.2, rainbow: true },
];
export const FISH_BY = Object.fromEntries(FISH.map((f) => [f.id, f]));
export function rollFish(lvl, night, r = Math.random) {
  const pool = FISH.filter((f) => (!f.night || night) && (!f.day || !night));
  // higher job level = better odds for rarer fish
  const boost = (f) => f.w * (f.rar === 'common' ? 1 : 1 + (lvl - 1) * 0.35);
  const total = pool.reduce((s, f) => s + boost(f), 0);
  let x = r() * total;
  for (const f of pool) { x -= boost(f); if (x < 0) return f.id; }
  return pool[0].id;
}

// ---------- gardening ----------
export const SEEDS = [
  { id: 'carrot', name: 'Carrot', icon: '🥕', cost: 5, grow: 90, sell: 20, lvl: 1, col: '#ff9a3d' },
  { id: 'tomato', name: 'Tomato', icon: '🍅', cost: 8, grow: 150, sell: 32, lvl: 1, col: '#ff5d5d' },
  { id: 'strawberry', name: 'Strawberry', icon: '🍓', cost: 12, grow: 200, sell: 48, lvl: 2, col: '#ff4f6d' },
  { id: 'corn', name: 'Corn', icon: '🌽', cost: 18, grow: 280, sell: 70, lvl: 2, col: '#ffd84a' },
  { id: 'sunflower', name: 'Sunflower', icon: '🌻', cost: 15, grow: 240, sell: 60, lvl: 3, col: '#ffc92e' },
  { id: 'pumpkin', name: 'Pumpkin', icon: '🎃', cost: 25, grow: 360, sell: 100, lvl: 4, col: '#ff8a2e' },
  { id: 'lavender', name: 'Lavender', icon: '🪻', cost: 22, grow: 320, sell: 90, lvl: 5, col: '#b58cff' },
  { id: 'melon', name: 'Watermelon', icon: '🍉', cost: 35, grow: 480, sell: 150, lvl: 6, col: '#5fbf5a' },
  { id: 'rainbowrose', name: 'Rainbow Rose', icon: '🌹', cost: 60, grow: 600, sell: 250, lvl: 9, col: '#ff8fc0', rainbow: true },
  { id: 'goldapple', name: 'Golden Apple', icon: '🍏', cost: 100, grow: 900, sell: 440, lvl: 12, col: '#ffd24d', gold: true },
];
export const SEED = Object.fromEntries(SEEDS.map((s) => [s.id, s]));

// growth 0..1 from timestamps (plants only grow once watered)
export function growth(plot, now = Date.now()) {
  if (!plot || !plot.seed || !plot.watered) return 0;
  const s = SEED[plot.seed];
  return Math.max(0, Math.min(1, (now - plot.watered) / 1000 / s.grow));
}

// ---------- delivery ----------
export function deliveryPay(dist, lvl) {
  return Math.round((28 + dist * 0.38) * payMul(lvl));
}
export function deliveryTime(dist, lvl) {
  return Math.round(18 + dist / 5.2 - (lvl - 1) * 1.5);
}
