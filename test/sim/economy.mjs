// Economy / pacing simulation. Plays the real quest list, prices and rewards
// minute by minute with a "typical player" model and reports when things happen.
// The player model is an ASSUMPTION (see MODEL below) - it is an estimate, not a
// measurement of a real child playing.
import { QUESTS } from '../../src/data/quests.js';
import { FURNITURE, FURN } from '../../src/data/furniture.js';
import { AVATAR_ITEMS } from '../../src/data/avatar.js';
import { EGGS, EGG, rollEgg, stageOf, needReward, SPECIES } from '../../src/data/pets.js';
import { SEEDS, jobLevel, payMul, cakeRules, floristRules, rollFish, FISH, deliveryPay } from '../../src/data/jobs.js';
import { newState, levelFromXP } from '../../src/core/state.js';
import * as HM from '../../src/house/model.js';
import { RESTAURANTS, LEVELS_PER, levelInfo, makeOrder } from '../../cook/src/data.js';
import { cafeView, dishPay, dishXP, finishLevel, levelOpen, restaurantOpen, levelKey } from '../../cook/src/state.js';

const MODEL = {
  hourMix: { job: 20, pets: 12, build: 16, explore: 12 },   // minutes per hour
  secondsPerCake: [14, 14, 15, 18, 18],                      // by baker level, incl. mistakes
  mistakeRate: 0.15,
  secondsPerBouquet: 20,
  secondsPerFish: 26,
  secondsPerDelivery: 45,
  petTaskEveryMin: 1.4,
  buildBuysPerMinute: 1,     // choosing, placing, recolouring and moving things takes time
  shellFindRate: 0.45,       // chance per explore minute, scaled by how many are left
  npcMeetRate: 0.35,
  cafeShare: 0.5,            // half of the job time is spent cooking in the café
  cafeQuality: [0.7, 1.0],   // cooking score range per dish
  // café seconds per step type (hands-on cooking), plus per step / per guest / per level overheads
  cafeStep: { add: (s) => 2 + s.items.length * 1.6, stir: (s) => 1.5 + s.turns * 1.1, chop: () => 5, cook: (s) => (s.flip ? 9 : 6), pour: () => 4,
    spread: () => 5, place: (s) => 1.5 + s.n * 0.7, stack: (s) => 1.5 + s.layers.length * 1.1, roll: () => 4, slice: (s) => 1.5 + s.cuts * 1.1 },
  cafeStepOverhead: 1.4, cafeGuestOverhead: 9, cafeLevelOverhead: 40,
};

let seed = Number(process.env.SEED || 12345);
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const s = newState();
s.house = HM.newHouse();
const lvl = () => levelFromXP(s.player.xp).level;
const log = [];
let minute = 0;
const spent = { furniture: 0, house: 0, land: 0, eggs: 0, avatar: 0, vehicles: 0, seeds: 0 };
const earned = { jobs: 0, cafe: 0, pets: 0, quests: 0, shells: 0, stickers: 0, stars: 0 };
const give = (c, xp, src) => { s.player.coins += c; s.stats.coinsEarned += c; s.player.xp += xp; earned[src] = (earned[src] || 0) + c; };
const pay = (c, cat) => { if (s.player.coins < c) return false; s.player.coins -= c; spent[cat] += c; return true; };
s.stats.homeStars = 1;

// ---- pets
let mainPet = null;
function activeCompanion() { return s.eggs[0] || mainPet; }
function petTask() {
  const c = activeCompanion();
  if (!c) return;
  const stage = c.species ? stageOf(c.tasks) : 0;
  c.tasks++;
  s.stats.petTasks++;
  const r = needReward(stage);
  give(r.coins, r.xp, 'pets');
  if (!c.species && c.tasks >= EGG[c.type].hatch) {
    const sp = rollEgg(c.type, rnd());
    s.eggs.shift();
    const p = { species: sp, tasks: 0 };
    s.pets.push(p);
    s.stats.eggsHatched++;
    if (!mainPet) mainPet = p;
  }
}

// ---- jobs
function jobMinute(job) {
  const L = jobLevel(s.jobs[job].xp);
  const doOne = (payAmt, xp) => { give(Math.round(payAmt), xp, 'jobs'); s.jobs[job].xp++; s.stats.jobsDone++; };
  if (job === 'bakery') { const n = 60 / MODEL.secondsPerCake[L - 1] * (1 - MODEL.mistakeRate); for (let i = 0; i < Math.floor(n + rnd()); i++) doOne((cakeRules(L).pay + 9) * payMul(L), 4 + L); }
  if (job === 'florist') { const n = 60 / MODEL.secondsPerBouquet * (1 - MODEL.mistakeRate); for (let i = 0; i < Math.floor(n + rnd()); i++) doOne(floristRules(L).pay * payMul(L), 5 + L); }
  if (job === 'fishing') { const n = 60 / MODEL.secondsPerFish; for (let i = 0; i < Math.floor(n + rnd()); i++) { const fid = rollFish(L, rnd() < 0.3, rnd); const f = FISH.find((x) => x.id === fid); s.collections.fish[f.id] = (s.collections.fish[f.id] || 0) + 1; s.stats.fishCaught++; doOne(f.price * (1 + (L - 1) * 0.15), 5 + L); } }
  if (job === 'delivery') { const n = 60 / MODEL.secondsPerDelivery; for (let i = 0; i < Math.floor(n + rnd()); i++) doOne(deliveryPay(70, L), 10 + L * 2); }
  if (job === 'garden') {
    // 8 beds: replant the best affordable seed; harvests arrive as they grow (real time)
    const ok = SEEDS.filter((x) => x.lvl <= lvl());
    const seedT = ok[ok.length - 1];
    garden.forEach((g, i) => {
      if (!g) { if (pay(seedT.cost, 'seeds')) garden[i] = { seed: seedT, ready: minute + seedT.grow / 60 }; }
      else if (minute >= g.ready) { s.stats.harvests++; s.collections.plants[g.seed.id] = 1; doOne(g.seed.sell * payMul(L), 5 + Math.round(g.seed.sell / 20)); garden[i] = null; }
    });
  }
}
const garden = new Array(8).fill(null);

// split the house into rooms roughly every 3 tiles (walls with a door each)
function partition(h) {
  const keys = Object.keys(h.tiles).map((k) => k.split(',').map(Number));
  const i0 = Math.min(...keys.map((k) => k[0])), j0 = Math.min(...keys.map((k) => k[1]));
  const walls = Object.keys(h.inner).length;
  h.inner = {}; h.open = Object.fromEntries(Object.entries(h.open).filter(([k]) => HM.edgeInfo(h, k).exterior));
  for (const [i, j] of keys) {
    if ((i - i0) % 3 === 0 && i > i0 && h.tiles[(i - 1) + ',' + j]) h.inner[`v,${i},${j}`] = true;
    if ((j - j0) % 3 === 0 && j > j0 && h.tiles[i + ',' + (j - 1)]) h.inner[`h,${i},${j}`] = true;
  }
  const lines = {};
  for (const k of Object.keys(h.inner)) { const [t, a, b] = k.split(','); const key = t === 'v' ? `v${a}|${Math.floor((b - j0) / 3)}` : `h${b}|${Math.floor((a - i0) / 3)}`; if (!lines[key]) { lines[key] = k; h.open[k] = 'door_wood'; } }
  pay(Math.max(0, Object.keys(h.inner).length - walls) * 20, 'house');
}

// ---- building: buy things that raise the home rating
const ownedItems = new Set(s.house.furniture.map((f) => f.id));
function buildMinute() {
  const h = s.house;
  for (let k = 0; k < MODEL.buildBuysPerMinute; k++) {
    const tiles = Object.keys(h.tiles).length;
    const r = HM.plotRange(h.size);
    const cap = (r.i1 - r.i0) * (r.j1 - r.j0);
    const idx = HM.PLOT_SIZES.indexOf(h.size);
    const needL = [0, 4, 8, 13][idx + 1];
    if (idx < 3 && lvl() >= needL && tiles > cap * 0.45 && s.player.coins > HM.PLOT_PRICES[idx + 1] + 300) { pay(HM.PLOT_PRICES[idx + 1], 'land'); h.size = HM.PLOT_SIZES[idx + 1]; continue; }
    if (tiles < cap * 0.5 && pay(15, 'house')) {
      // grow the house as a rectangle from the street side
      outer: for (let j = r.j1 - 2; j >= r.j0 + 1; j--) for (let i = r.i0 + 1; i < r.i1 - 1; i++) if (!h.tiles[i + ',' + j]) { HM.setTile(h, i, j, 'fl_oak'); break outer; }
      if (Object.keys(h.tiles).length % 6 === 0) partition(h);
      continue;
    }
    // furniture: prefer new items (variety), lights and garden, cheapest first
    const unlockedOk = (f) => (f.lvl || 1) <= lvl() && (!f.unlock || s.unlocks[f.unlock]) && f.price > 0;
    const lights = h.furniture.filter((f) => FURN[f.id].light).length;
    let cand = FURNITURE.filter((f) => unlockedOk(f) && !ownedItems.has(f.id));
    if (lights < 2 + tiles / 8) cand = cand.filter((f) => f.light).concat(cand);
    cand.sort((a, b) => a.price - b.price);
    const pick = cand.find((f) => f.price <= s.player.coins - 50);
    if (pick && pay(pick.price, 'furniture')) { ownedItems.add(pick.id); HM.addFurniture(h, pick.id, 0, 0, 0, 0); s.stats.itemsPlaced++; continue; }
    // style: new wallpaper in a room now and then
    if (rnd() < 0.35 && pay(60, 'house')) { const keys = Object.keys(h.tiles); const t = h.tiles[keys[Math.floor(rnd() * keys.length)]]; t.w[0] = 'wp_' + Math.floor(rnd() * 12); t.f = 'fl_' + Math.floor(rnd() * 8); }
  }
  const rt = HM.homeRating(h, FURN);
  if (rt.stars > (s.stats.homeStars || 0)) { give([0, 100, 250, 500, 900, 1500][rt.stars], 40 * rt.stars, 'stars'); s.stats.homeStars = rt.stars; log.push([minute, `home ${rt.stars} stars (score ${rt.score})`]); }
}

// ---- quests (same availability rules as the game)
function available() {
  const out = [];
  QUESTS.forEach((q, i) => {
    if (s.quests.done.includes(q.id) || s.quests.active.some((a) => a.id === q.id)) return;
    if (i > s.quests.done.length + 2 || (q.lvl || 1) > lvl()) return;
    if (q.after && !s.quests.done.includes(q.after)) return;
    out.push(q);
  });
  return s.quests.active.length >= 3 ? [] : out.slice(0, 3 - s.quests.active.length);
}
function progressOk(a) {
  const q = QUESTS.find((x) => x.id === a.id);
  return q.objs.every((o) => {
    if (o.kind === 'stat') return (s.stats[o.key] || 0) - (a.base[o.key] || 0) >= o.n;
    if (o.kind === 'abs') return o.fn(s, FURN) >= o.n;
    if (o.kind === 'zone') return s.collections.zones.includes(o.zone);
    return false;
  });
}
function questTick() {
  for (const q of available()) {
    s.quests.active.push({ id: q.id, base: { ...s.stats } });
    if (q.give?.egg) s.eggs.push({ type: q.give.egg, tasks: 0 });
    if (q.give?.unlock) s.unlocks[q.give.unlock] = true;
    minute += 1; // walking over and chatting
  }
  for (const a of [...s.quests.active]) {
    if (a.id === 'festival' && !a.started) { a.started = minute; }
    if (a.id === 'festival' && minute - a.started > 12) s.quests.festival = true;
    if (progressOk(a)) {
      const q = QUESTS.find((x) => x.id === a.id);
      s.quests.active = s.quests.active.filter((x) => x !== a);
      s.quests.done.push(a.id);
      give(q.reward.coins, q.reward.xp, 'quests');
      if (q.reward.unlock) s.unlocks[q.reward.unlock] = true;
      log.push([minute, `quest ${s.quests.done.length}/${QUESTS.length}: ${q.title} (level ${lvl()})`]);
    }
  }
}

// needs driven by active quests (what a kid following the arrows would do)
function questNeeds() {
  const need = new Set();
  for (const a of s.quests.active) {
    const id = a.id;
    if (['firstjob', 'chef'].includes(id)) need.add('bakery');
    if (id === 'flowers') need.add('florist');
    if (['garden'].includes(id)) need.add('garden');
    if (['fishing', 'catch'].includes(id)) need.add('fishing');
    if (id === 'delivery') need.add('delivery');
    if (id === 'style' && s.owned.avatar.length === 0) { const it = AVATAR_ITEMS.find((i) => i.price > 0 && (i.level || 1) <= lvl()); if (pay(it.price, 'avatar')) s.owned.avatar.push(it.id); }
    if (id === 'scooter' && !s.owned.vehicles.length) { if (pay(400, 'vehicles')) s.owned.vehicles.push('scooter'); }
    if ((id === 'twoeggs' || id === 'hatch4') && !s.eggs.length) {
      const egg = [...EGGS].reverse().find((e) => !e.hidden && e.lvl <= lvl() && (!e.unlock || s.unlocks[e.unlock]) && s.player.coins >= e.price + 200);
      if (egg && pay(egg.price, 'eggs')) s.eggs.push({ type: egg.id, tasks: 0 });
    }
  }
  return need;
}

// ---- café (the Blossom Kitchen levels, with the real recipes, pay and unlocks)
const cafe = cafeView(s);
let cafeLvl = null, cafeClock = 0;
function nextCafeLevel() {
  for (const R of [...RESTAURANTS].reverse()) {
    if (!restaurantOpen(cafe, R.id)) continue;
    for (let L = 1; L <= LEVELS_PER; L++) if (levelOpen(cafe, R.id, L) && !(cafe.stars[levelKey(R.id, L)] >= 1)) return [R.id, L];
    const low = [...Array(LEVELS_PER)].map((_, i) => i + 1).find((L) => (cafe.stars[levelKey(R.id, L)] || 0) < 3);
    return [R.id, low || LEVELS_PER + 1];
  }
  return ['cafe', 1];
}
function cafeMinute() {
  cafeClock += 60;
  while (cafeClock > 0) {
    if (!cafeLvl) { const [rid, L] = nextCafeLevel(); cafeLvl = { rid, L, info: levelInfo(rid, L), qs: [] }; }
    const info = cafeLvl.info;
    const o = makeOrder(info.recipes[Math.floor(rnd() * info.recipes.length)], rnd);
    for (const st of o.steps) cafeClock -= MODEL.cafeStep[st.t](st) + MODEL.cafeStepOverhead;
    cafeClock -= MODEL.cafeGuestOverhead;
    const [q0, q1] = MODEL.cafeQuality;
    const q = q0 + rnd() * (q1 - q0);
    const p = dishPay(o.recipe, q);
    give(p.total, dishXP(o.recipe, q), 'cafe');
    cafeLvl.qs.push(q);
    if (cafeLvl.qs.length >= info.customers) {
      const before = s.player.coins;
      finishLevel(cafe, cafeLvl.rid, cafeLvl.L, cafeLvl.qs);
      earned.cafe += s.player.coins - before;
      give(40, 0, 'cafe'); // word quiz, about 2 of 3 right
      cafeClock -= MODEL.cafeLevelOverhead;
      cafeLvl = null;
    }
  }
}

const jobsCycle = ['bakery', 'florist', 'fishing', 'garden', 'delivery'];
const milestones = {};
const mark = (k) => { if (!milestones[k]) milestones[k] = minute; };
let jobIdx = 0;

while (minute < 60 * 30) {
  const m = minute % 60;
  const { job, pets, build } = MODEL.hourMix;
  const need = questNeeds();
  if (m < job) {
    const unlocked = jobsCycle.filter((j) => j !== 'delivery' || lvl() >= 3);
    const needed = [...need].find((j) => unlocked.includes(j));
    if (!needed && rnd() < MODEL.cafeShare) cafeMinute();
    else jobMinute(needed || unlocked[(jobIdx++ >> 3) % unlocked.length]);
  } else if (m < job + pets) {
    if (minute % 3 !== 0 || true) { for (let i = 0; i < Math.floor(1 / MODEL.petTaskEveryMin + rnd()); i++) petTask(); }
  } else if (m < job + pets + build) {
    buildMinute();
  } else {
    // explore: zones, shells, friends
    const z = ['home', 'square', 'beach', 'park'];
    if (s.unlocks.cave) z.push('cove');
    if (s.unlocks.sky) z.push('sky');
    for (const id of z) if (!s.collections.zones.includes(id) && rnd() < 0.5) { s.collections.zones.push(id); break; }
    const left = 40 - s.collections.shells.length;
    if (rnd() < MODEL.shellFindRate * (left / 40) * 1.6) { s.collections.shells.push(s.collections.shells.length); give(25, 15, 'shells'); }
    if (rnd() < MODEL.npcMeetRate && s.quests.metNpcs.length < 14) s.quests.metNpcs.push('npc' + s.quests.metNpcs.length);
    // sometimes buy a treat for yourself: new outfits or eggs when rich
    if (s.player.coins > 3000 && rnd() < 0.3) {
      const it = AVATAR_ITEMS.find((i) => i.price > 0 && (i.level || 1) <= lvl() && !s.owned.avatar.includes(i.id));
      if (it && pay(it.price, 'avatar')) s.owned.avatar.push(it.id);
    }
    if (s.player.coins > 5000 && !s.eggs.length && rnd() < 0.3) {
      const egg = [...EGGS].reverse().find((e) => !e.hidden && e.lvl <= lvl() && (!e.unlock || s.unlocks[e.unlock]));
      if (egg && pay(egg.price, 'eggs')) s.eggs.push({ type: egg.id, tasks: 0 });
    }
  }
  minute++;
  questTick();
  // stickers ~ 60 over the game: approximate one every 12 minutes of progress
  if (minute % 12 === 0 && s.collections.stickers.length < 50) { s.collections.stickers.push(minute); give(25, 10, 'stickers'); }
  if (s.quests.done.includes('festival')) mark('story');
  if (lvl() >= 10) mark('level10');
  if (lvl() >= 15) mark('level15');
  if ((s.stats.homeStars || 0) >= 5) mark('5stars');
  if (s.house.size === 14) mark('maxLand');
  if (s.collections.shells.length >= 40) mark('allShells');
  if (new Set(s.pets.map((p) => p.species)).size >= 30) mark('allPets');
  if (ownedItems.size >= FURNITURE.filter((f) => f.price > 0).length) mark('allFurniture');
  if (milestones.story && minute > milestones.story + 60 * 4) break;
}

const hrs = (m) => (m === undefined ? 'not reached in sim' : `${(m / 60).toFixed(1)} h`);
console.log('=== Blossom Bay pacing simulation (estimate, see MODEL assumptions in this file) ===');
for (const [t, msg] of log.filter((l) => l[1].startsWith('quest') || l[1].startsWith('home'))) console.log(`${hrs(t).padStart(7)}  ${msg}`);
console.log('--- milestones ---');
for (const k of ['level10', 'level15', '5stars', 'maxLand', 'allShells', 'story', 'allFurniture', 'allPets']) console.log(`${k.padEnd(13)} ${hrs(milestones[k])}`);
console.log('--- totals at end of sim ---');
console.log('level', lvl(), '| pets', s.pets.length, 'species', new Set(s.pets.map((p) => p.species)).size, '| fish kinds', Object.keys(s.collections.fish).length, '| furniture owned', ownedItems.size);
console.log('earned', JSON.stringify(earned));
console.log('spent', JSON.stringify(spent));
export const result = { milestones };
if (process.env.CHECK) {
  const h = milestones.story / 60;
  if (!(h >= 8 && h <= 12)) { console.error(`Story takes ${h.toFixed(1)} h, outside the 8-12 h target`); process.exit(1); }
}
const fr = HM.homeRating(s.house, FURN);
console.log('final home', fr.stars, 'stars, score', fr.score, JSON.stringify(fr.parts), 'tiles', Object.keys(s.house.tiles).length, 'size', s.house.size, 'rooms', HM.rooms(s.house).length);
