// Pure house logic (no three.js): tiles, automatic walls, rooms, openings,
// furniture placement rules and the Home Rating. Unit tested.
//
// Plot-local coordinates: origin at the plot's north-west corner, +x east,
// +z south (towards the street). A tile (i, j) covers [2i, 2i+2] x [2j, 2j+2].
// Edge keys: "h,i,j" = horizontal edge at z = 2j between tiles (i, j-1) and (i, j)
//            "v,i,j" = vertical edge at x = 2i between tiles (i-1, j) and (i, j)
export const TILE = 2;
export const MAXP = 14;
export const PLOT_SIZES = [8, 10, 12, 14];
export const PLOT_PRICES = [0, 2500, 6000, 12000];
export const WALL_H = 3.0;

export const tkey = (i, j) => `${i},${j}`;

export function plotRange(size) {
  const off = (MAXP - size) / 2;
  return { i0: off, i1: off + size, j0: MAXP - size, j1: MAXP };
}

export function inPlot(house, i, j) {
  const r = plotRange(house.size);
  return i >= r.i0 && i < r.i1 && j >= r.j0 && j < r.j1;
}

export function newHouse() {
  const h = {
    size: 8,
    tiles: {},     // "i,j" -> { f: floorId, w: [N, E, S, W] wallpaper ids }
    inner: {},     // edge key -> true  (interior walls)
    open: {},      // edge key -> opening id (door / window / arch)
    ext: 'ex_cream',
    roof: '#e8807d',
    furniture: [], // { uid, id, x, z, r, c, y }
    nextUid: 1,
  };
  // starter cottage: 4 x 3 tiles near the street with a small bedroom
  for (let i = 5; i < 9; i++) for (let j = 10; j < 13; j++) setTile(h, i, j, i === 8 && j < 12 ? 'fl_carpet_pink' : 'fl_oak');
  h.inner['v,8,10'] = true;
  h.inner['v,8,11'] = true;
  h.inner['h,8,12'] = true;
  h.open['v,8,11'] = 'arch';
  h.open['h,6,13'] = 'door_wood';
  h.open['h,5,13'] = 'win_big';
  h.open['h,8,13'] = 'win_small';
  h.open['v,5,11'] = 'win_small';
  h.open['v,9,10'] = 'win_small';
  h.open['h,6,10'] = 'win_small';
  for (const k of ['8,10', '8,11']) h.tiles[k].w = ['wp_pink', 'wp_pink', 'wp_pink', 'wp_pink'];
  const start = [
    ['bed_single', 17, 21.25, 0, 0], ['nightstand', 17.5, 23.3, 0, 7], ['sofa', 12, 20.75, 0, 5], ['rug_round', 12, 22.75, 0, 0],
    ['coffee_table', 12, 22.75, 0, 7], ['armchair', 15, 23.2, 3, 0], ['plant_big', 10.6, 25.3, 0, 0], ['floor_lamp', 14.9, 20.6, 0, 2],
    ['food_bowl', 10.6, 20.6, 0, 10], ['water_bowl', 10.6, 21.3, 0, 5], ['pet_bed', 15.35, 21.9, 0, 0],
  ];
  for (const [id, x, z, r, c] of start) addFurniture(h, id, x, z, r, c);
  addFurniture(h, 'table_lamp', 17.5, 23.3, 0, 0, 0.55);
  return h;
}

export function setTile(h, i, j, floor) {
  const k = tkey(i, j);
  const prev = h.tiles[k];
  h.tiles[k] = { f: floor, w: prev?.w || ['wp_cream', 'wp_cream', 'wp_cream', 'wp_cream'] };
}

export function removeTile(h, i, j) {
  delete h.tiles[tkey(i, j)];
  // remove interior walls / openings that no longer make sense
  for (const k of edgesOfTile(i, j)) {
    const e = edgeInfo(h, k);
    if (!e.wall) { delete h.open[k]; delete h.inner[k]; }
    else if (!e.interior) delete h.inner[k];
  }
}

export const hasTile = (h, i, j) => !!h.tiles[tkey(i, j)];

export function edgesOfTile(i, j) {
  return [`h,${i},${j}`, `v,${i + 1},${j}`, `h,${i},${j + 1}`, `v,${i},${j}`]; // N, E, S, W
}

// tiles on both sides of an edge: a = north/west, b = south/east
export function edgeTiles(key) {
  const [t, si, sj] = key.split(',');
  const i = +si, j = +sj;
  return t === 'h' ? { a: [i, j - 1], b: [i, j], t, i, j } : { a: [i - 1, j], b: [i, j], t, i, j };
}

export function edgeInfo(h, key) {
  const { a, b, t, i, j } = edgeTiles(key);
  const ha = hasTile(h, a[0], a[1]), hb = hasTile(h, b[0], b[1]);
  const exterior = ha !== hb;
  const interior = ha && hb && !!h.inner[key];
  return { key, t, i, j, a, b, ha, hb, exterior, interior, wall: exterior || interior, open: h.open[key] || null };
}

export function allWallEdges(h) {
  const seen = new Set();
  const out = [];
  for (const k of Object.keys(h.tiles)) {
    const [i, j] = k.split(',').map(Number);
    for (const e of edgesOfTile(i, j)) {
      if (seen.has(e)) continue;
      seen.add(e);
      const info = edgeInfo(h, e);
      if (info.wall) out.push(info);
    }
  }
  return out;
}

// connected rooms (tiles joined by edges that are not walls, or by arches)
export function rooms(h) {
  const seen = new Set();
  const out = [];
  for (const k of Object.keys(h.tiles)) {
    if (seen.has(k)) continue;
    const room = [];
    const stack = [k];
    seen.add(k);
    while (stack.length) {
      const c = stack.pop();
      room.push(c);
      const [i, j] = c.split(',').map(Number);
      const nb = [[i, j - 1, `h,${i},${j}`], [i + 1, j, `v,${i + 1},${j}`], [i, j + 1, `h,${i},${j + 1}`], [i - 1, j, `v,${i},${j}`]];
      for (const [ni, nj, ek] of nb) {
        const nk = tkey(ni, nj);
        if (!h.tiles[nk] || seen.has(nk)) continue;
        if (h.inner[ek] && h.open[ek] !== 'arch') continue;
        seen.add(nk);
        stack.push(nk);
      }
    }
    out.push(room);
  }
  return out;
}

export function roomOf(h, i, j) {
  const k = tkey(i, j);
  return rooms(h).find((r) => r.includes(k)) || null;
}

// paint all wall sides facing into a room
export function paintRoomWalls(h, i, j, wp) {
  const room = roomOf(h, i, j);
  if (!room) return 0;
  let n = 0;
  for (const k of room) {
    const [ti, tj] = k.split(',').map(Number);
    const edges = edgesOfTile(ti, tj);
    edges.forEach((e, d) => {
      if (edgeInfo(h, e).wall && h.tiles[k].w[d] !== wp) { h.tiles[k].w[d] = wp; n++; }
    });
  }
  return n;
}

export function paintRoomFloor(h, i, j, floor) {
  const room = roomOf(h, i, j);
  if (!room) return 0;
  let n = 0;
  for (const k of room) if (h.tiles[k].f !== floor) { h.tiles[k].f = floor; n++; }
  return n;
}

// ---------- furniture ----------
export function itemBox(item, x, z, r) {
  const [w, d] = r % 2 ? [item.fp[1], item.fp[0]] : item.fp;
  return { x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, w, d };
}

const overlap = (a, b, eps = 0.03) => a.x0 < b.x1 - eps && a.x1 > b.x0 + eps && a.z0 < b.z1 - eps && a.z1 > b.z0 + eps;

function wallRects(h) {
  const out = [];
  for (const e of allWallEdges(h)) {
    const T = TILE;
    if (e.t === 'h') out.push({ x0: e.i * T - 0.05, x1: (e.i + 1) * T + 0.05, z0: e.j * T - 0.12, z1: e.j * T + 0.12, e });
    else out.push({ x0: e.i * T - 0.12, x1: e.i * T + 0.12, z0: e.j * T - 0.05, z1: (e.j + 1) * T + 0.05, e });
  }
  return out;
}

export function snapPos(item, x, z, r) {
  const [w, d] = r % 2 ? [item.fp[1], item.fp[0]] : item.fp;
  const g = item.place === 'surface' || item.fp[0] < 0.5 ? 0.25 : 0.5;
  return { x: Math.round((x - w / 2) / g) * g + w / 2, z: Math.round((z - d / 2) / g) * g + d / 2 };
}

// Where can this item go? returns {ok, y, reason, on}
export function checkPlace(h, catalog, item, x, z, r, ignoreUid = null) {
  const box = itemBox(item, x, z, r);
  const range = plotRange(h.size);
  if (box.x0 < range.i0 * TILE - 0.01 || box.x1 > range.i1 * TILE + 0.01 || box.z0 < range.j0 * TILE - 0.01 || box.z1 > range.j1 * TILE + 0.01) {
    return { ok: false, reason: 'Outside your plot' };
  }
  if (item.place === 'wall') return { ok: false, reason: 'Needs a wall' };
  // surfaces: small items can sit on tables / counters
  if (item.place === 'surface' || item.place === 'any') {
    for (const f of h.furniture) {
      if (f.uid === ignoreUid) continue;
      const it = catalog[f.id];
      if (!it?.top) continue;
      const fb = itemBox(it, f.x, f.z, f.r);
      if (x > fb.x0 + 0.05 && x < fb.x1 - 0.05 && z > fb.z0 + 0.05 && z < fb.z1 - 0.05) {
        // nothing else on that spot
        for (const o of h.furniture) {
          if (o.uid === ignoreUid || o.uid === f.uid || !(o.y > 0.01)) continue;
          if (overlap(box, itemBox(catalog[o.id], o.x, o.z, o.r), 0.01) && Math.abs(o.y - it.top - (f.y || 0)) < 0.05) return { ok: false, reason: 'Something is already there' };
        }
        return { ok: true, y: it.top + (f.y || 0), on: f.uid };
      }
    }
    if (item.place === 'surface') return { ok: false, reason: 'Put it on a table or shelf' };
  }
  for (const w of wallRects(h)) {
    if (overlap(box, w, 0.02)) return { ok: false, reason: 'Blocked by a wall' };
  }
  const isRug = item.place === 'rug';
  for (const f of h.furniture) {
    if (f.uid === ignoreUid || (f.y || 0) > 0.01) continue;
    const it = catalog[f.id];
    if (!it) continue;
    if (isRug !== (it.place === 'rug')) continue; // rugs only collide with rugs
    if (overlap(box, itemBox(it, f.x, f.z, f.r))) return { ok: false, reason: 'Too close to ' + it.name };
  }
  return { ok: true, y: 0 };
}

// wall items: snap to the nearest wall side. returns {ok, x, z, r, y, edge}
export function snapToWall(h, item, px, pz) {
  let best = null, bd = 1.4;
  for (const e of allWallEdges(h)) {
    if (e.open) continue;
    const T = TILE;
    let cx, cz, sides;
    if (e.t === 'h') { cx = (e.i + 0.5) * T; cz = e.j * T; sides = [[0, -1, 2, e.ha], [0, 1, 0, e.hb]]; }
    else { cx = e.i * T; cz = (e.j + 0.5) * T; sides = [[-1, 0, 3, e.ha], [1, 0, 1, e.hb]]; }
    for (const [nx, nz, r, ok] of sides) {
      if (!ok && !e.exterior) continue;
      const sx = cx + nx * 0.12, sz = cz + nz * 0.12;
      const d = Math.hypot(px - sx, pz - sz);
      if (d < bd) {
        bd = d;
        // slide along the wall under the finger
        let x = sx, z = sz;
        const half = item.fp[0] / 2;
        if (e.t === 'h') x = Math.max(e.i * T + half + 0.1, Math.min((e.i + 1) * T - half - 0.1, Math.round(px * 4) / 4));
        else z = Math.max(e.j * T + half + 0.1, Math.min((e.j + 1) * T - half - 0.1, Math.round(pz * 4) / 4));
        best = { ok: true, x, z, r, y: item.y ?? 1.5, edge: e.key, side: r };
      }
    }
  }
  return best || { ok: false, reason: 'Move closer to a wall' };
}

export function wallItemClash(h, catalog, item, pos, ignoreUid) {
  for (const f of h.furniture) {
    if (f.uid === ignoreUid) continue;
    const it = catalog[f.id];
    if (it?.place !== 'wall' || f.r !== pos.r) continue;
    const a = itemBox(item, pos.x, pos.z, pos.r), b = itemBox(it, f.x, f.z, f.r);
    const yOverlap = Math.abs((f.y || 0) - pos.y) < Math.max(item.h, it.h) * 0.8;
    if (overlap(a, b, 0.02) && yOverlap) return true;
  }
  return false;
}

export function addFurniture(h, id, x, z, r, c, y = 0) {
  const f = { uid: h.nextUid++, id, x, z, r, c, y };
  h.furniture.push(f);
  return f;
}

export function removeFurniture(h, uid) {
  const i = h.furniture.findIndex((f) => f.uid === uid);
  if (i < 0) return null;
  const [f] = h.furniture.splice(i, 1);
  // anything sitting on it falls off (removed + refunded by caller)
  const riders = h.furniture.filter((o) => o.y > 0.01 && Math.abs(o.x - f.x) < 1.5 && Math.abs(o.z - f.z) < 1.5);
  return { removed: f, riders };
}

// are all furniture pieces still valid after a structural change? returns list of uids that are now blocked
export function invalidFurniture(h, catalog) {
  const bad = [];
  for (const f of h.furniture) {
    const it = catalog[f.id];
    if (!it || it.place === 'wall' || (f.y || 0) > 0.01) continue;
    const res = checkPlace(h, catalog, it, f.x, f.z, f.r, f.uid);
    if (!res.ok) bad.push(f.uid);
  }
  return bad;
}

// ---------- Home Rating ----------
export const STAR_POINTS = [0, 150, 380, 640, 880, 1100];

export function homeRating(h, catalog) {
  const tiles = Object.keys(h.tiles).length;
  const rs = rooms(h).filter((r) => r.length >= 1);
  const items = h.furniture.map((f) => catalog[f.id]).filter(Boolean);
  const unique = new Set(items.map((i) => i.id)).size;
  const cats = new Set(items.map((i) => i.cat)).size;
  const lights = items.filter((i) => i.light).length;
  const garden = items.filter((i) => i.cat === 'garden').length;
  const openings = Object.keys(h.open).length;
  const papers = new Set();
  for (const t of Object.values(h.tiles)) for (const w of t.w) papers.add(w);
  const floors = new Set(Object.values(h.tiles).map((t) => t.f)).size;
  const hasBed = items.some((i) => i.use === 'sleep');
  const hasBath = items.some((i) => i.cat === 'bath');
  const hasKitchen = items.some((i) => i.use === 'cook' || i.id === 'fridge');
  const parts = {
    space: Math.min(200, tiles * 2),
    rooms: Math.min(160, rs.length * 16),
    furniture: Math.min(300, items.length * 3),
    variety: Math.min(240, unique * 4 + cats * 6),
    style: Math.min(120, (papers.size - 1) * 8 + (floors - 1) * 8),
    lights: Math.min(80, lights * 6),
    garden: Math.min(100, garden * 6),
    windows: Math.min(60, openings * 3),
    essentials: (hasBed ? 20 : 0) + (hasBath ? 20 : 0) + (hasKitchen ? 20 : 0),
  };
  const score = Object.values(parts).reduce((a, b) => a + b, 0);
  let stars = 0;
  for (let s = 0; s < STAR_POINTS.length; s++) if (score >= STAR_POINTS[s]) stars = s;
  const value = houseValue(h, catalog);
  return { score, stars, parts, value, next: STAR_POINTS[stars + 1] ?? null };
}

export function houseValue(h, catalog) {
  let v = Object.keys(h.tiles).length * 15 + Object.keys(h.inner).length * 20;
  for (const f of h.furniture) v += catalog[f.id]?.price || 0;
  return v;
}

// is a plot-local point inside the house footprint?
export function insideHouse(h, x, z) {
  return hasTile(h, Math.floor(x / TILE), Math.floor(z / TILE));
}
