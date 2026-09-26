// Floors, wallpapers, exteriors, roofs, doors and windows for build mode.
// pat = procedural pattern id used by the house shader:
// 0 plain, 1 stripes, 2 dots, 3 checker, 4 planks, 5 big tiles, 6 bricks, 7 hearts,
// 8 stars, 9 panels, 10 diagonal, 11 flowers, 12 carpet, 13 marble, 14 siding, 15 herringbone,
// 16 rainbow, 17 roof shingles
export const FLOORS = [
  { id: 'fl_oak', name: 'Oak Planks', color: '#d9a877', pat: 4, price: 0 },
  { id: 'fl_honey', name: 'Honey Wood', color: '#e8b979', pat: 4, price: 0 },
  { id: 'fl_white', name: 'White Wood', color: '#f3ece4', pat: 4, price: 10, lvl: 2 },
  { id: 'fl_cherry', name: 'Cherry Wood', color: '#b8735a', pat: 15, price: 25, lvl: 4 },
  { id: 'fl_tile', name: 'Kitchen Tiles', color: '#f4f1ea', pat: 3, price: 10 },
  { id: 'fl_minttile', name: 'Mint Tiles', color: '#bfeee0', pat: 5, price: 15, lvl: 2 },
  { id: 'fl_pinktile', name: 'Pink Tiles', color: '#ffd1e3', pat: 5, price: 15, lvl: 3 },
  { id: 'fl_carpet_pink', name: 'Pink Carpet', color: '#ffc2dc', pat: 12, price: 12 },
  { id: 'fl_carpet_blue', name: 'Blue Carpet', color: '#bcdcff', pat: 12, price: 12 },
  { id: 'fl_carpet_lav', name: 'Lilac Carpet', color: '#d9c7ff', pat: 12, price: 12, lvl: 2 },
  { id: 'fl_carpet_cream', name: 'Cream Carpet', color: '#f5ead6', pat: 12, price: 12 },
  { id: 'fl_marble', name: 'Marble', color: '#f5f3f7', pat: 13, price: 40, lvl: 6 },
  { id: 'fl_hearts', name: 'Heart Carpet', color: '#ffb3cf', pat: 7, price: 30, lvl: 5 },
  { id: 'fl_stars', name: 'Star Carpet', color: '#c3b3ff', pat: 8, price: 30, lvl: 7 },
  { id: 'fl_checker', name: 'Checkerboard', color: '#ffe3ef', pat: 3, price: 20, lvl: 3 },
  { id: 'fl_stone', name: 'Garden Stone', color: '#d7d0c8', pat: 5, price: 10 },
  { id: 'fl_grass', name: 'Fake Grass', color: '#9fd97e', pat: 12, price: 15, lvl: 4 },
  { id: 'fl_rainbow', name: 'Rainbow Floor', color: '#ffffff', pat: 16, price: 80, lvl: 12 },
  { id: 'fl_cloud', name: 'Cloud Floor', color: '#eef6ff', pat: 11, price: 120, lvl: 16 },
];

export const WALLPAPERS = [
  { id: 'wp_cream', name: 'Cream Paint', color: '#fff4e6', pat: 0, price: 0 },
  { id: 'wp_white', name: 'White Paint', color: '#ffffff', pat: 0, price: 0 },
  { id: 'wp_pink', name: 'Pink Paint', color: '#ffd6e6', pat: 0, price: 0 },
  { id: 'wp_mint', name: 'Mint Paint', color: '#d4f5e9', pat: 0, price: 0 },
  { id: 'wp_sky', name: 'Sky Paint', color: '#d6ebff', pat: 0, price: 0 },
  { id: 'wp_lemon', name: 'Lemon Paint', color: '#fff3c2', pat: 0, price: 5 },
  { id: 'wp_lilac', name: 'Lilac Paint', color: '#e7dcff', pat: 0, price: 5 },
  { id: 'wp_peach', name: 'Peach Paint', color: '#ffe0cc', pat: 0, price: 5 },
  { id: 'wp_stripe_pink', name: 'Candy Stripes', color: '#ffd6e6', pat: 1, price: 10, lvl: 2 },
  { id: 'wp_stripe_mint', name: 'Mint Stripes', color: '#d4f5e9', pat: 1, price: 10, lvl: 2 },
  { id: 'wp_dots', name: 'Polka Dots', color: '#fff0f6', pat: 2, price: 12, lvl: 3 },
  { id: 'wp_dots_blue', name: 'Blue Dots', color: '#e3f1ff', pat: 2, price: 12, lvl: 3 },
  { id: 'wp_hearts', name: 'Hearts', color: '#ffe3ee', pat: 7, price: 20, lvl: 4 },
  { id: 'wp_stars', name: 'Starry Night', color: '#c8c3ff', pat: 8, price: 20, lvl: 5 },
  { id: 'wp_flowers', name: 'Flower Garden', color: '#f0fff0', pat: 11, price: 20, lvl: 4 },
  { id: 'wp_panels', name: 'Cottage Panels', color: '#f3f7ff', pat: 9, price: 15, lvl: 3 },
  { id: 'wp_panels_sage', name: 'Sage Panels', color: '#dcebd5', pat: 9, price: 15, lvl: 5 },
  { id: 'wp_brick', name: 'Loft Bricks', color: '#e6a58c', pat: 6, price: 18, lvl: 6 },
  { id: 'wp_diag', name: 'Zig Zag', color: '#fff3c2', pat: 10, price: 18, lvl: 7 },
  { id: 'wp_wood', name: 'Wood Cabin', color: '#d9a877', pat: 4, price: 18, lvl: 6 },
  { id: 'wp_tiles', name: 'Bath Tiles', color: '#e0f4ff', pat: 5, price: 12, lvl: 2 },
  { id: 'wp_marble', name: 'Marble Wall', color: '#f5f3f7', pat: 13, price: 30, lvl: 9 },
  { id: 'wp_rainbow', name: 'Rainbow', color: '#ffffff', pat: 16, price: 60, lvl: 12 },
];

export const EXTERIORS = [
  { id: 'ex_cream', name: 'Cream Siding', color: '#fff1dc', pat: 14, price: 0 },
  { id: 'ex_pink', name: 'Pink Siding', color: '#ffd3e4', pat: 14, price: 0 },
  { id: 'ex_mint', name: 'Mint Siding', color: '#cdf2e2', pat: 14, price: 0 },
  { id: 'ex_blue', name: 'Blue Siding', color: '#d3e8ff', pat: 14, price: 50, lvl: 2 },
  { id: 'ex_lilac', name: 'Lilac Siding', color: '#e4d8ff', pat: 14, price: 50, lvl: 3 },
  { id: 'ex_white', name: 'White Plaster', color: '#fbfaf7', pat: 0, price: 50, lvl: 2 },
  { id: 'ex_brick', name: 'Red Brick', color: '#d98870', pat: 6, price: 120, lvl: 5 },
  { id: 'ex_stone', name: 'Cottage Stone', color: '#d9d1c7', pat: 5, price: 150, lvl: 7 },
  { id: 'ex_wood', name: 'Log Cabin', color: '#c99366', pat: 4, price: 150, lvl: 8 },
  { id: 'ex_yellow', name: 'Sunny Plaster', color: '#fff0a8', pat: 0, price: 80, lvl: 4 },
];

export const ROOF_COLORS = ['#e8807d', '#f0a0b8', '#7fb7e8', '#6fc2a2', '#b59cf5', '#f2b35b', '#8a7a9a', '#5d8fcf', '#d96a8a', '#ffffff'];

export const OPENINGS = [
  { id: 'door_wood', kind: 'door', name: 'Wood Door', price: 40, color: '#b8825a' },
  { id: 'door_pink', kind: 'door', name: 'Pink Door', price: 60, color: '#ff8fb5', lvl: 2 },
  { id: 'door_mint', kind: 'door', name: 'Mint Door', price: 60, color: '#6fd6b3', lvl: 2 },
  { id: 'door_glass', kind: 'door', name: 'Glass Door', price: 120, color: '#ffffff', glass: true, lvl: 5 },
  { id: 'arch', kind: 'arch', name: 'Open Arch', price: 30 },
  { id: 'win_small', kind: 'window', name: 'Small Window', price: 30, w: 0.9, h: 1.0, y: 1.2 },
  { id: 'win_big', kind: 'window', name: 'Big Window', price: 60, w: 1.5, h: 1.4, y: 0.9, lvl: 2 },
  { id: 'win_round', kind: 'window', name: 'Round Window', price: 70, w: 1.0, h: 1.0, y: 1.2, round: true, lvl: 4 },
  { id: 'win_tall', kind: 'window', name: 'Tall Window', price: 90, w: 1.2, h: 2.0, y: 0.5, lvl: 6 },
];

export const PRICES = { tile: 15, wall: 20, paint: 5 };

export const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
export const FLOOR = byId(FLOORS);
export const WALLPAPER = byId(WALLPAPERS);
export const EXTERIOR = byId(EXTERIORS);
export const OPENING = byId(OPENINGS);
