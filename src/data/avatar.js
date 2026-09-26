// Avatar catalogue: everything the boutique sells. price 0 = owned from the start.
export const SKINS = ['#ffe0c7', '#f5c9a6', '#e8b48c', '#c98f63', '#a8704a', '#7a4e33', '#5c3a26'];
export const HAIR_COLORS = ['#2e2230', '#5a3a2a', '#8a5a3a', '#c98a4b', '#f2cf7a', '#fff1c4', '#ff9ec7', '#b58cff', '#7fc8ff', '#ff7a6b', '#7fe0c0', '#ffffff'];
export const CLOTH_COLORS = ['#ff8fc0', '#ff6f91', '#ffb38a', '#ffd45e', '#b8e986', '#6fd6b3', '#7fc6ff', '#5b8def', '#b58cff', '#e0a3ff', '#ffffff', '#f3e6d8', '#8a7a9a', '#3e3550', '#ff4f6d', '#2bb3a0'];
export const EYE_COLORS = ['#3a2a4a', '#5a3a2a', '#2f6fb0', '#3f9a6a', '#8a5ad6'];

export const AVATAR_ITEMS = [
  // hair
  { id: 'hair_bob', slot: 'hair', name: 'Bob', icon: '💇‍♀️', price: 0 },
  { id: 'hair_long', slot: 'hair', name: 'Long Waves', icon: '👱‍♀️', price: 0 },
  { id: 'hair_ponytail', slot: 'hair', name: 'Ponytail', icon: '🎀', price: 0 },
  { id: 'hair_short', slot: 'hair', name: 'Short', icon: '🧑', price: 0 },
  { id: 'hair_pigtails', slot: 'hair', name: 'Pigtails', icon: '👧', price: 150, level: 2 },
  { id: 'hair_bun', slot: 'hair', name: 'Space Buns', icon: '🍡', price: 250, level: 3 },
  { id: 'hair_curly', slot: 'hair', name: 'Curly Cloud', icon: '☁️', price: 300, level: 4 },
  { id: 'hair_braids', slot: 'hair', name: 'Long Braids', icon: '🪢', price: 450, level: 6 },
  { id: 'hair_princess', slot: 'hair', name: 'Princess Updo', icon: '👸', price: 900, level: 10 },
  // tops
  { id: 'top_tee', slot: 'top', name: 'T-Shirt', icon: '👕', price: 0 },
  { id: 'top_tank', slot: 'top', name: 'Tank Top', icon: '🎽', price: 80 },
  { id: 'top_hoodie', slot: 'top', name: 'Cozy Hoodie', icon: '🧥', price: 200, level: 2 },
  { id: 'top_sweater', slot: 'top', name: 'Heart Sweater', icon: '💗', price: 320, level: 4 },
  { id: 'top_blouse', slot: 'top', name: 'Puffy Blouse', icon: '👚', price: 380, level: 5 },
  { id: 'top_jacket', slot: 'top', name: 'Jean Jacket', icon: '🧥', price: 520, level: 7 },
  // bottoms
  { id: 'bot_pants', slot: 'bottom', name: 'Jeans', icon: '👖', price: 0 },
  { id: 'bot_shorts', slot: 'bottom', name: 'Shorts', icon: '🩳', price: 0 },
  { id: 'bot_skirt', slot: 'bottom', name: 'Skirt', icon: '👗', price: 120 },
  { id: 'bot_tutu', slot: 'bottom', name: 'Tutu', icon: '🩰', price: 350, level: 4 },
  { id: 'bot_long', slot: 'bottom', name: 'Long Skirt', icon: '🌸', price: 420, level: 6 },
  // full dresses (replace top + bottom)
  { id: 'dress_sun', slot: 'dress', name: 'Sundress', icon: '👗', price: 400, level: 3 },
  { id: 'dress_party', slot: 'dress', name: 'Party Dress', icon: '💃', price: 800, level: 8 },
  { id: 'dress_gown', slot: 'dress', name: 'Starlight Gown', icon: '✨', price: 2400, level: 14 },
  // hats & hair accessories
  { id: 'hat_none', slot: 'hat', name: 'No Hat', icon: '🚫', price: 0 },
  { id: 'hat_bow', slot: 'hat', name: 'Big Bow', icon: '🎀', price: 100 },
  { id: 'hat_cap', slot: 'hat', name: 'Cap', icon: '🧢', price: 150, level: 2 },
  { id: 'hat_flower', slot: 'hat', name: 'Flower Crown', icon: '🌼', price: 300, level: 3 },
  { id: 'hat_cat', slot: 'hat', name: 'Cat Ears', icon: '🐱', price: 350, level: 4 },
  { id: 'hat_bunny', slot: 'hat', name: 'Bunny Ears', icon: '🐰', price: 350, level: 5 },
  { id: 'hat_beanie', slot: 'hat', name: 'Beanie', icon: '🧶', price: 260, level: 5 },
  { id: 'hat_sun', slot: 'hat', name: 'Sun Hat', icon: '👒', price: 420, level: 6 },
  { id: 'hat_tiara', slot: 'hat', name: 'Tiara', icon: '👑', price: 1500, level: 12 },
  { id: 'hat_unicorn', slot: 'hat', name: 'Unicorn Horn', icon: '🦄', price: 2000, level: 15 },
  // accessories
  { id: 'acc_none', slot: 'acc', name: 'None', icon: '🚫', price: 0 },
  { id: 'acc_glasses', slot: 'acc', name: 'Round Glasses', icon: '👓', price: 120 },
  { id: 'acc_star', slot: 'acc', name: 'Star Shades', icon: '🕶️', price: 300, level: 4 },
  { id: 'acc_backpack', slot: 'acc', name: 'Backpack', icon: '🎒', price: 280, level: 3 },
  { id: 'acc_scarf', slot: 'acc', name: 'Scarf', icon: '🧣', price: 240, level: 5 },
  { id: 'acc_cape', slot: 'acc', name: 'Hero Cape', icon: '🦸', price: 700, level: 8 },
  { id: 'acc_wings', slot: 'acc', name: 'Fairy Wings', icon: '🧚', price: 1800, level: 11 },
  { id: 'acc_angel', slot: 'acc', name: 'Angel Wings', icon: '🪽', price: 3200, level: 16 },
];

export const DEFAULT_LOOK = {
  skin: '#f5c9a6', hair: 'hair_long', hairColor: '#5a3a2a', eyes: '#3a2a4a',
  top: 'top_tee', topColor: '#ff8fc0', bottom: 'bot_shorts', bottomColor: '#7fc6ff', dress: null, dressColor: '#b58cff',
  shoes: '#ffffff', hat: 'hat_none', hatColor: '#ff6f91', acc: 'acc_none', accColor: '#ffd45e',
};

export const EMOTES = [
  { id: 'wave', name: 'Wave', icon: '👋' },
  { id: 'dance', name: 'Dance', icon: '💃' },
  { id: 'cheer', name: 'Cheer', icon: '🙌' },
  { id: 'sit', name: 'Sit', icon: '🪑' },
  { id: 'spin', name: 'Twirl', icon: '🌀' },
  { id: 'heart', name: 'Love', icon: '💖' },
];
