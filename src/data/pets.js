// Pets, eggs, needs and growth. Pure data + helpers (unit tested).
export const RARITY = {
  common: { name: 'Common', color: '#9fb3c8' },
  uncommon: { name: 'Uncommon', color: '#5cc98a' },
  rare: { name: 'Rare', color: '#5fb8ff' },
  ultra: { name: 'Ultra-Rare', color: '#b07dff' },
  legendary: { name: 'Legendary', color: '#ff8fb0' },
};

// body: quad | bird | blob.  ears/tail/extras drive the procedural model.
export const SPECIES = [
  { id: 'cat', name: 'Kitty', rar: 'common', body: 'quad', col: '#ffb56b', belly: '#fff1dc', ears: 'cat', tail: 'long', extras: ['stripes', 'whiskers'] },
  { id: 'dog', name: 'Puppy', rar: 'common', body: 'quad', col: '#d9a877', belly: '#fff4e6', ears: 'floppy', tail: 'short', extras: ['snout', 'spot'] },
  { id: 'bunny', name: 'Bunny', rar: 'common', body: 'quad', col: '#f4eef2', belly: '#ffffff', ears: 'bunny', tail: 'puff', extras: ['snout'] },
  { id: 'hamster', name: 'Hamster', rar: 'common', body: 'blob', col: '#f2c28c', belly: '#fff6e8', ears: 'round', tail: 'none', extras: ['cheeks'] },
  { id: 'chick', name: 'Chick', rar: 'common', body: 'bird', col: '#ffe066', belly: '#fff3a8', ears: 'none', tail: 'fan', extras: ['beak'] },
  { id: 'frog', name: 'Froggy', rar: 'common', body: 'blob', col: '#8fd66f', belly: '#e8f7c8', ears: 'none', tail: 'none', extras: ['topeyes'] },
  { id: 'fox', name: 'Fox', rar: 'uncommon', body: 'quad', col: '#ff8a47', belly: '#ffffff', ears: 'fox', tail: 'fluffy', extras: ['snout', 'socks'] },
  { id: 'panda', name: 'Panda', rar: 'uncommon', body: 'quad', col: '#ffffff', belly: '#ffffff', accent: '#3a3446', ears: 'bear', tail: 'short', extras: ['eyepatch', 'socks'] },
  { id: 'penguin', name: 'Penguin', rar: 'uncommon', body: 'bird', col: '#3f4a6b', belly: '#ffffff', ears: 'none', tail: 'none', extras: ['beak', 'flippers'] },
  { id: 'koala', name: 'Koala', rar: 'uncommon', body: 'quad', col: '#a9a9b8', belly: '#e8e8f0', ears: 'koala', tail: 'none', extras: ['nose'] },
  { id: 'hedgehog', name: 'Hedgehog', rar: 'uncommon', body: 'blob', col: '#b58a6a', belly: '#f5dcc0', ears: 'round', tail: 'none', extras: ['spikes', 'snout'] },
  { id: 'duck', name: 'Duckling', rar: 'uncommon', body: 'bird', col: '#fff6d6', belly: '#ffffff', ears: 'none', tail: 'fan', extras: ['bill'] },
  { id: 'redpanda', name: 'Red Panda', rar: 'rare', body: 'quad', col: '#d9643a', belly: '#3a2a30', accent: '#fff1e0', ears: 'bear', tail: 'ringed', extras: ['mask'] },
  { id: 'owl', name: 'Owl', rar: 'rare', body: 'bird', col: '#b08968', belly: '#f3dfc6', ears: 'tufts', tail: 'fan', extras: ['beak', 'bigeyes'] },
  { id: 'deer', name: 'Fawn', rar: 'rare', body: 'quad', col: '#c98a5a', belly: '#fff1e0', ears: 'deer', tail: 'puff', extras: ['antlers', 'spots'] },
  { id: 'otter', name: 'Otter', rar: 'rare', body: 'quad', col: '#8a6248', belly: '#e8cfb2', ears: 'round', tail: 'long', extras: ['whiskers', 'snout'] },
  { id: 'turtle', name: 'Turtle', rar: 'rare', body: 'quad', col: '#8fd6a0', belly: '#e8f7c8', ears: 'none', tail: 'short', extras: ['shell'] },
  { id: 'axolotl', name: 'Axolotl', rar: 'rare', body: 'blob', col: '#ffb3d0', belly: '#ffe3ee', ears: 'none', tail: 'fish', extras: ['gills'] },
  { id: 'unicorn', name: 'Unicorn', rar: 'ultra', body: 'quad', col: '#ffffff', belly: '#fff6fb', accent: '#ff9ad5', ears: 'deer', tail: 'mane', extras: ['horn', 'mane', 'snout'] },
  { id: 'seal', name: 'Seal Pup', rar: 'ultra', body: 'blob', col: '#e6ecf5', belly: '#ffffff', ears: 'none', tail: 'fish', extras: ['whiskers', 'flippers'] },
  { id: 'flamingo', name: 'Flamingo', rar: 'ultra', body: 'bird', col: '#ff9ac4', belly: '#ffc4dc', ears: 'none', tail: 'fan', extras: ['beak', 'longlegs'] },
  { id: 'snowleopard', name: 'Snow Leopard', rar: 'ultra', body: 'quad', col: '#f0f0f5', belly: '#ffffff', accent: '#7d7590', ears: 'cat', tail: 'fluffy', extras: ['spots', 'whiskers'] },
  { id: 'parrot', name: 'Parrot', rar: 'ultra', body: 'bird', col: '#4fd17a', belly: '#ffe066', accent: '#ff5d6f', ears: 'none', tail: 'long', extras: ['beak', 'crest'] },
  { id: 'raccoon', name: 'Raccoon', rar: 'ultra', body: 'quad', col: '#9a93a6', belly: '#e6e1ec', accent: '#3a3446', ears: 'cat', tail: 'ringed', extras: ['mask', 'snout'] },
  { id: 'dragon', name: 'Dragon', rar: 'legendary', body: 'quad', col: '#8f7bff', belly: '#ffe39a', accent: '#ff9ad5', ears: 'dragon', tail: 'dragon', extras: ['dragonwings', 'horns', 'spines', 'snout'] },
  { id: 'phoenix', name: 'Phoenix', rar: 'legendary', body: 'bird', col: '#ff6b4a', belly: '#ffd24d', accent: '#ffe27a', ears: 'none', tail: 'long', extras: ['beak', 'crest', 'glow', 'wings'] },
  { id: 'pegasus', name: 'Pegasus', rar: 'legendary', body: 'quad', col: '#f5f7ff', belly: '#ffffff', accent: '#8fc8ff', ears: 'deer', tail: 'mane', extras: ['wings', 'mane', 'snout'] },
  { id: 'kitsune', name: 'Kitsune', rar: 'legendary', body: 'quad', col: '#fff4e0', belly: '#ffffff', accent: '#ff7a9a', ears: 'fox', tail: 'nine', extras: ['snout', 'marks', 'glow'] },
  { id: 'starbunny', name: 'Star Bunny', rar: 'legendary', body: 'quad', col: '#c9b8ff', belly: '#fff6c8', accent: '#fff07a', ears: 'bunny', tail: 'puff', extras: ['stars', 'glow', 'snout'] },
  { id: 'crystaldragon', name: 'Crystal Dragon', rar: 'legendary', body: 'quad', col: '#8fe8ff', belly: '#e8fbff', accent: '#ff9ad5', ears: 'dragon', tail: 'dragon', extras: ['dragonwings', 'horns', 'crystals', 'snout', 'glow'] },
];
export const SPEC = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

export const EGGS = [
  { id: 'starter', name: 'Starter Egg', price: 0, lvl: 1, col: '#fff1c4', spots: '#ffb3d0', hatch: 3, table: { cat: 30, dog: 30, bunny: 25, fox: 10, panda: 5 }, hidden: true },
  { id: 'garden', name: 'Garden Egg', price: 150, lvl: 1, col: '#c8f0b0', spots: '#ffffff', hatch: 4, table: { cat: 14, dog: 14, bunny: 14, hamster: 14, chick: 12, frog: 12, fox: 7, hedgehog: 6, duck: 5, redpanda: 2 } },
  { id: 'ocean', name: 'Ocean Egg', price: 500, lvl: 4, col: '#a8e3ff', spots: '#ffffff', hatch: 5, table: { duck: 22, penguin: 22, turtle: 16, otter: 14, axolotl: 12, seal: 8, flamingo: 6 } },
  { id: 'jungle', name: 'Jungle Egg', price: 900, lvl: 7, col: '#8fd66f', spots: '#ffe066', hatch: 6, table: { koala: 22, panda: 20, owl: 14, redpanda: 14, parrot: 12, raccoon: 10, snowleopard: 6, kitsune: 2 } },
  { id: 'crystal', name: 'Crystal Egg', price: 1800, lvl: 10, unlock: 'cave', col: '#e0c6ff', spots: '#8fe8ff', hatch: 7, table: { deer: 26, owl: 20, unicorn: 18, snowleopard: 16, dragon: 12, crystaldragon: 8 } },
  { id: 'star', name: 'Star Egg', price: 3500, lvl: 14, unlock: 'sky', col: '#fff3a8', spots: '#c9b8ff', hatch: 8, table: { unicorn: 24, pegasus: 20, starbunny: 18, phoenix: 14, dragon: 12, kitsune: 12 } },
];
export const EGG = Object.fromEntries(EGGS.map((e) => [e.id, e]));

export const STAGES = [
  { name: 'Baby', tasks: 0, scale: 0.62, trick: 'sit' },
  { name: 'Kid', tasks: 4, scale: 0.74, trick: 'jump' },
  { name: 'Teen', tasks: 10, scale: 0.86, trick: 'spin' },
  { name: 'Grown', tasks: 18, scale: 0.97, trick: 'dance' },
  { name: 'Sparkle', tasks: 30, scale: 1.06, trick: 'fly' },
];
export const TRICKS = { sit: '🪑 Sit', jump: '⬆️ Jump', spin: '🌀 Spin', dance: '💃 Dance', fly: '✨ Fly' };

export function stageOf(tasks) {
  let s = 0;
  for (let i = 0; i < STAGES.length; i++) if (tasks >= STAGES[i].tasks) s = i;
  return s;
}

export const NEEDS = [
  { id: 'hungry', icon: '🍖', name: 'Hungry', uses: ['food', 'cook', 'fridge', 'snack'], hint: 'Use a food bowl, or buy a pet snack at Sweet Crumbs' },
  { id: 'thirsty', icon: '💧', name: 'Thirsty', uses: ['water', 'sink', 'drink'], hint: 'Use a water bowl, or drink at the fountain or pond' },
  { id: 'sleepy', icon: '😴', name: 'Sleepy', uses: ['petbed', 'sleep'], hint: 'Use a pet bed or your own bed' },
  { id: 'dirty', icon: '🧼', name: 'Dirty', uses: ['pettub', 'bath', 'shower'], hint: 'Use a bath, shower or pet bath' },
  { id: 'bored', icon: '🎾', name: 'Bored', uses: ['play', 'bounce', 'tv', 'arcade', 'playground'], hint: 'Play with a toy, or visit the playground in the park' },
  { id: 'park', icon: '🌳', name: 'Wants the park', zone: 'park', hint: 'Walk to Blossom Park together' },
  { id: 'beach', icon: '🏖️', name: 'Wants the beach', zone: 'beach', hint: 'Walk to Sunny Beach together' },
  { id: 'square', icon: '⛲', name: 'Wants the fountain', zone: 'square', hint: 'Visit the fountain in Town Square' },
  { id: 'cove', icon: '💎', name: 'Wants Crystal Cove', zone: 'cove', unlock: 'cave', hint: 'Visit Crystal Cove together' },
  { id: 'sky', icon: '☁️', name: 'Wants Sky Island', zone: 'sky', unlock: 'sky', hint: 'Fly the balloon to Sky Island' },
];
export const NEED = Object.fromEntries(NEEDS.map((n) => [n.id, n]));

export const PET_ACC = [
  { id: 'none', name: 'Nothing', icon: '🚫', price: 0 },
  { id: 'bow', name: 'Bow', icon: '🎀', price: 120 },
  { id: 'flower', name: 'Flower', icon: '🌸', price: 150 },
  { id: 'party', name: 'Party Hat', icon: '🥳', price: 220, lvl: 3 },
  { id: 'glasses', name: 'Cool Shades', icon: '🕶️', price: 260, lvl: 4 },
  { id: 'scarf', name: 'Scarf', icon: '🧣', price: 200, lvl: 3 },
  { id: 'crown', name: 'Crown', icon: '👑', price: 900, lvl: 9 },
  { id: 'halo', name: 'Halo', icon: '😇', price: 1600, lvl: 13 },
];
export const PACC = Object.fromEntries(PET_ACC.map((a) => [a.id, a]));

// pick a species from an egg's odds; r in [0,1)
export function rollEgg(eggId, r = Math.random()) {
  const t = EGG[eggId].table;
  const total = Object.values(t).reduce((a, b) => a + b, 0);
  let x = r * total;
  for (const [sp, w] of Object.entries(t)) {
    x -= w;
    if (x < 0) return sp;
  }
  return Object.keys(t)[0];
}

export function eggOdds(eggId) {
  const t = EGG[eggId].table;
  const total = Object.values(t).reduce((a, b) => a + b, 0);
  return Object.entries(t).map(([id, w]) => ({ id, pct: Math.round((w / total) * 1000) / 10 }));
}

export function needReward(stage) {
  return { coins: 22 + stage * 6, xp: 12 + stage * 3 };
}
