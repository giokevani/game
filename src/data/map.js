// Town layout. Units are metres. +x = east, +z = south (towards the sea).
export const WORLD = { minX: -150, maxX: 150, minZ: -124, maxZ: 120 };

export function shoreZ(x) {
  return 60 + Math.sin(x * 0.031) * 5 + Math.sin(x * 0.083 + 1.3) * 2;
}

// Roads: axis-aligned rectangles [x1, z1, x2, z2]
export const ROADS = [
  { id: 'home', rect: [-132, -62, 66, -54] },
  { id: 'main', rect: [-132, 20, 136, 28] },
  { id: 'west', rect: [-44, -62, -36, 28] },
  { id: 'east', rect: [36, -62, 44, 28] },
];

// cream footpaths
export const PATHS = [
  { rect: [-3, -54, 3, -44] },
  { rect: [-3, 2, 3, 20] },
  { rect: [-36, -12, -14, -8] },
  { rect: [14, -12, 36, -8] },
  { rect: [44, -24, 130, -20] },
  { rect: [86, -60, 90, -24] },
  { rect: [-12, 28, -8, 36] },
  { rect: [27, 28, 33, 46] },
  { rect: [-100, 28, -96, 44] },
];

export const PLAZA = { x: 0, z: -10, r: 14 };

export const HOME_PLOT = { cx: -66, front: -65, sizes: [8, 10, 12, 14], tile: 2 };

// Buildings. face: direction the front door faces (radians around y; 0 = +z / south)
export const BUILDINGS = [
  { id: 'townhall', kind: 'townhall', name: 'Town Hall', x: 0, z: -37, w: 18, d: 11, face: 0, wall: '#fff4e6', roof: '#7fb7e8', icon: '🏛️' },
  { id: 'furniture', kind: 'shop', name: 'Cozy Home', x: -25, z: -22, w: 13, d: 12, face: Math.PI / 2, wall: '#ffd9b3', roof: '#f08a6f', awning: ['#ffffff', '#f08a6f'], icon: '🛋️' },
  { id: 'boutique', kind: 'shop', name: 'Sparkle Style', x: -25, z: 6, w: 13, d: 11, face: Math.PI / 2, wall: '#ffd1e8', roof: '#c77dd1', awning: ['#ffffff', '#e39be8'], icon: '👗' },
  { id: 'petshop', kind: 'shop', name: 'Paw Pals', x: 25, z: -22, w: 13, d: 12, face: -Math.PI / 2, wall: '#d4f2e4', roof: '#4fb39a', awning: ['#ffffff', '#57c9a6'], icon: '🐾' },
  { id: 'bakery', kind: 'shop', name: 'Sweet Crumbs', x: 25, z: 6, w: 13, d: 11, face: -Math.PI / 2, wall: '#fff0c9', roof: '#e8807d', awning: ['#ffffff', '#ff9aa2'], icon: '🧁' },
  { id: 'florist', kind: 'shop', name: 'Petal Shop', x: 57, z: -34, w: 11, d: 10, face: -Math.PI / 2, wall: '#e9e1ff', roof: '#9c7fe0', awning: ['#ffffff', '#b59cf5'], icon: '💐' },
  { id: 'postoffice', kind: 'shop', name: 'Bay Post', x: 57, z: 8, w: 11, d: 10, face: -Math.PI / 2, wall: '#d6ecff', roof: '#5a8fd6', awning: ['#ffffff', '#f5c451'], icon: '📮' },
  { id: 'cars', kind: 'shop', name: 'Zoom Rides', x: -57, z: 6, w: 12, d: 11, face: Math.PI / 2, wall: '#fff3b8', roof: '#f29b38', awning: ['#ffffff', '#f7b955'], icon: '🛵' },
  { id: 'cafe', kind: 'shop', name: 'Blossom Kitchen', x: -92, z: 7, w: 14, d: 11, face: 0, wall: '#ffe0ec', roof: '#ff8fb5', awning: ['#ffffff', '#ff8fb5'], icon: '🍳' },
  { id: 'icecream', kind: 'stand', name: 'Ice Cream', x: -10, z: 39, w: 5, d: 4, face: 0, wall: '#ffe0f0', roof: '#7fd6e8', icon: '🍦' },
  { id: 'fishing', kind: 'stand', name: 'Fishing', x: 22, z: 40, w: 6, d: 5, face: 0, wall: '#cfe9ff', roof: '#4d8fd1', icon: '🎣' },
  // neighbour houses
  { id: 'h1', kind: 'house', x: -104, z: -74, w: 12, d: 10, face: 0, wall: '#fbe3ef', roof: '#e57fa5' },
  { id: 'h2', kind: 'house', x: -26, z: -74, w: 12, d: 10, face: 0, wall: '#e3f4ff', roof: '#6aa6dd' },
  { id: 'h3', kind: 'house', x: 14, z: -74, w: 11, d: 10, face: 0, wall: '#fff5d6', roof: '#e8a24f' },
  { id: 'h4', kind: 'house', x: -100, z: -42, w: 11, d: 10, face: Math.PI, wall: '#e6f7e0', roof: '#72b86a' },
  { id: 'h5', kind: 'house', x: -64, z: -42, w: 12, d: 10, face: Math.PI, wall: '#efe6ff', roof: '#9a7fd6' },
  { id: 'h6', kind: 'house', x: -22, z: -46, w: 11, d: 9, face: Math.PI, wall: '#ffe9dc', roof: '#e07b62' },
  { id: 'h7', kind: 'house', x: 22, z: -46, w: 11, d: 9, face: Math.PI, wall: '#e0fbf6', roof: '#48b5a6' },
  { id: 'h8', kind: 'house', x: 54, z: -74, w: 12, d: 10, face: 0, wall: '#fff0f6', roof: '#d66f9b' },
  { id: 'lighthouse', kind: 'lighthouse', x: 124, z: 58, w: 7, d: 7, face: 0 },
  { id: 'cave', kind: 'cave', x: -124, z: 46, w: 16, d: 12, face: Math.PI / 2 },
];

export const PIER = { x1: 27, x2: 33, z1: 44, z2: 98, y: 0.7 };

export const PARK = { x1: 48, z1: -100, x2: 140, z2: 14 };
export const POND = { x: 96, z: -44, rx: 13, rz: 9 };
export const GARDEN = { x: 70, z: -60, cols: 4, rows: 2, gap: 4 };
export const PLAYGROUND = { x: 110, z: -6 };
export const BALLOON = { x: 118, z: -76 };
export const CAVE_GATE = { x: -106, z: 46, r: 5 };
export const SKY_ISLAND = { x: 0, y: 82, z: -112, r: 24 };

export const SKY_LIFT = { x: -14, z: 15 };
export const SKY_LEVELS = [
  {id:'cloud_meadow',name:'Cloud Meadow',x:-20,z:-30,y:46,r:28,icon:'☁️'},
  {id:'rainbow_town',name:'Rainbow Town',x:50,z:-30,y:96,r:30,icon:'🌈'},
  {id:'star_castle',name:'Star Castle',x:-10,z:-60,y:150,r:30,icon:'⭐'},
];

// Zones for discovery + pet "wants to go to" needs
export const ZONES = [
  ...SKY_LEVELS.map(l => ({...l, minY:l.y-2, maxY:l.y+12})),
  { id: 'home', name: 'Home Street', x: -40, z: -64, r: 40, icon: '🏡' },
  { id: 'square', name: 'Town Square', x: 0, z: -10, r: 30, icon: '⛲' },
  { id: 'park', name: 'Blossom Park', x: 92, z: -40, r: 42, icon: '🌳' },
  { id: 'beach', name: 'Sunny Beach', x: 10, z: 48, r: 45, icon: '🏖️' },
  { id: 'cove', name: 'Crystal Cove', x: -124, z: 46, r: 22, icon: '💎' },
  { id: 'sky', name: 'Sky Island', x: 0, z: -104, r: 30, y: 60, icon: '☁️' },
];

function inRect(x, z, r, pad = 0) {
  return x > r[0] - pad && x < r[2] + pad && z > r[1] - pad && z < r[3] + pad;
}

// Is a point covered by something (for scattering trees/grass)?
export function isBlocked(x, z, pad = 0) {
  if (Math.hypot(x-SKY_LIFT.x,z-SKY_LIFT.z)<4+pad) return true;
  for (const r of ROADS) if (inRect(x, z, r.rect, pad + 1)) return true;
  for (const p of PATHS) if (inRect(x, z, p.rect, pad)) return true;
  if (Math.hypot(x - PLAZA.x, z - PLAZA.z) < PLAZA.r + pad + 1) return true;
  for (const b of BUILDINGS) {
    const rot = Math.abs(Math.sin(b.face)) > 0.5;
    const hw = (rot ? b.d : b.w) / 2 + 2.5 + pad;
    const hd = (rot ? b.w : b.d) / 2 + 2.5 + pad;
    if (Math.abs(x - b.x) < hw && Math.abs(z - b.z) < hd) return true;
  }
  const big = HOME_PLOT.sizes[HOME_PLOT.sizes.length - 1] * HOME_PLOT.tile;
  if (x > HOME_PLOT.cx - big / 2 - 2 - pad && x < HOME_PLOT.cx + big / 2 + 2 + pad && z > HOME_PLOT.front - big - 2 - pad && z < HOME_PLOT.front + 2 + pad) return true;
  if (inRect(x, z, [PIER.x1, PIER.z1 - 4, PIER.x2, PIER.z2], pad + 1)) return true;
  if (((x - POND.x) / (POND.rx + 2 + pad)) ** 2 + ((z - POND.z) / (POND.rz + 2 + pad)) ** 2 < 1) return true;
  if (inRect(x, z, [GARDEN.x - 4, GARDEN.z - 4, GARDEN.x + GARDEN.cols * GARDEN.gap + 1, GARDEN.z + GARDEN.rows * GARDEN.gap + 1], pad)) return true;
  if (Math.hypot(x - PLAYGROUND.x, z - PLAYGROUND.z) < 11 + pad) return true;
  if (Math.hypot(x - BALLOON.x, z - BALLOON.z) < 7 + pad) return true;
  if (z > shoreZ(x) - 1 - pad) return true;
  return false;
}

export function zoneAt(x, z, y = 0) {
  for (const zn of ZONES) {
    if (zn.minY !== undefined) { if(y >= zn.minY && y <= zn.maxY && Math.hypot(x-zn.x,z-zn.z)<zn.r) return zn; continue; }
    if (zn.id === 'sky') {
      if (y > 40 && Math.hypot(x - zn.x, z - zn.z) < zn.r + 10) return zn;
      continue;
    }
    if (y < 30 && Math.hypot(x - zn.x, z - zn.z) < zn.r) return zn;
  }
  return null;
}
