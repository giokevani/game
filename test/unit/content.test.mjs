import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPECIES, SPEC, EGGS, EGG, STAGES, NEEDS, rollEgg, stageOf, eggOdds } from '../../src/data/pets.js';
import { CAKE, cakeRules, randomCake, sameCake, randomBouquet, sameBouquet, FISH, rollFish, SEEDS, growth, deliveryPay, jobLevel, JOB_LEVELS } from '../../src/data/jobs.js';
import { QUESTS, STICKERS } from '../../src/data/quests.js';
import { NPCS, NPC } from '../../src/data/npcs.js';
import { FURNITURE, FURN, CATEGORIES, PALETTE } from '../../src/data/furniture.js';
import { AVATAR_ITEMS } from '../../src/data/avatar.js';
import { FLOORS, WALLPAPERS, EXTERIORS, OPENINGS } from '../../src/data/houseStyles.js';
import { ZONES, BUILDINGS, WORLD } from '../../src/data/map.js';
import { newState, MAX_LEVEL } from '../../src/core/state.js';
import { Builder } from '../../src/engine/builder.js';

test('egg odds: every species hatches from some egg and rolls match weights', () => {
  const hatchable = new Set(EGGS.flatMap((e) => Object.keys(e.table)));
  for (const s of SPECIES) assert.ok(hatchable.has(s.id), `${s.id} can never hatch`);
  for (const e of EGGS) for (const sp of Object.keys(e.table)) assert.ok(SPEC[sp], `${e.id} lists unknown ${sp}`);
  const counts = {};
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 20000; i++) { const s = rollEgg('garden', r()); counts[s] = (counts[s] || 0) + 1; }
  for (const o of eggOdds('garden')) assert.ok(Math.abs((counts[o.id] || 0) / 200 - o.pct) < 1.5, `${o.id} odds off`);
});

test('pet stages and needs', () => {
  assert.equal(stageOf(0), 0);
  assert.equal(stageOf(STAGES[4].tasks), 4);
  for (let i = 1; i < STAGES.length; i++) assert.ok(STAGES[i].tasks > STAGES[i - 1].tasks);
  for (const n of NEEDS) assert.ok(n.uses || n.zone, n.id);
  for (const n of NEEDS.filter((x) => x.zone)) assert.ok(ZONES.some((z) => z.id === n.zone), n.zone);
});

test('cakes and bouquets are always makeable', () => {
  for (let lvl = 1; lvl <= 5; lvl++) for (let i = 0; i < 200; i++) {
    const c = randomCake(lvl);
    assert.ok(c.tiers.length <= cakeRules(lvl).tiers);
    for (const t of c.tiers) {
      assert.ok(CAKE.bases.find((b) => b.id === t.base).lvl <= lvl);
      assert.ok(CAKE.frostings.find((b) => b.id === t.frost).lvl <= lvl);
    }
    assert.ok(sameCake(c, JSON.parse(JSON.stringify(c))));
    const b = randomBouquet(lvl);
    assert.ok(sameBouquet(b, { flowers: [...b.flowers].reverse(), ribbon: b.ribbon }), 'order of flowers does not matter');
  }
  assert.equal(sameCake({ tiers: [{ base: 'vanilla', frost: 'pink' }], tops: ['cherry'] }, { tiers: [{ base: 'vanilla', frost: 'white' }], tops: ['cherry'] }), false);
});

test('fish: night fish only at night, every fish catchable', () => {
  const seen = new Set();
  for (let i = 0; i < 40000; i++) {
    const night = i % 2 === 0;
    const id = rollFish(5, night);
    const f = FISH.find((x) => x.id === id);
    if (f.night) assert.ok(night);
    if (f.day) assert.ok(!night);
    seen.add(f.id);
  }
  for (const f of FISH) assert.ok(seen.has(f.id), `${f.id} never caught`);
});

test('garden growth and job levels', () => {
  const now = Date.now();
  assert.equal(growth({ seed: 'carrot', watered: 0 }, now), 0, 'needs water');
  assert.equal(growth({ seed: 'carrot', watered: now - 91000 }, now), 1);
  assert.ok(growth({ seed: 'carrot', watered: now - 45000 }, now) > 0.4);
  assert.equal(jobLevel(0), 1);
  assert.equal(jobLevel(JOB_LEVELS[4]), 5);
  assert.ok(deliveryPay(100, 3) > deliveryPay(20, 1));
  for (const s of SEEDS) assert.ok(s.sell > s.cost, `${s.id} must be profitable`);
});

test('quests reference real NPCs, zones and levels', () => {
  const ids = new Set();
  for (const q of QUESTS) {
    assert.ok(!ids.has(q.id), 'duplicate ' + q.id);
    ids.add(q.id);
    assert.ok(NPC[q.npc], `${q.id}: npc ${q.npc}`);
    assert.ok((q.lvl || 1) <= MAX_LEVEL);
    assert.ok(q.objs.length > 0 && q.lines.length > 0);
    for (const o of q.objs) {
      assert.ok(['stat', 'abs', 'zone'].includes(o.kind));
      if (o.kind === 'zone') assert.ok(ZONES.some((z) => z.id === o.zone));
    }
  }
  assert.ok(QUESTS.some((q) => q.give?.unlock === 'cave'));
  assert.ok(QUESTS.some((q) => q.give?.unlock === 'sky'));
  assert.ok(QUESTS.some((q) => q.reward.unlock === 'festival'));
  // levels never jump backwards by more than a little (story flows)
  let maxL = 1;
  for (const q of QUESTS) { assert.ok((q.lvl || 1) >= maxL - 2, q.id); maxL = Math.max(maxL, q.lvl || 1); }
});

test('stickers evaluate safely on a fresh save', () => {
  const s = newState();
  s.house = { tiles: {}, inner: {}, furniture: [], size: 8 };
  const ids = new Set();
  for (const st of STICKERS) {
    assert.ok(!ids.has(st.id));
    ids.add(st.id);
    assert.doesNotThrow(() => st.test(s), st.id);
    assert.equal(!!st.test(s), false, `${st.id} should not be earned at the start`);
  }
});

test('catalogues: ids unique, prices sane, everything unlockable', () => {
  const all = [...FURNITURE, ...AVATAR_ITEMS, ...FLOORS, ...WALLPAPERS, ...EXTERIORS, ...OPENINGS];
  const seen = new Set();
  for (const x of all) {
    assert.ok(!seen.has(x.id), 'duplicate id ' + x.id);
    seen.add(x.id);
    assert.ok(Number.isFinite(x.price) && x.price >= 0, x.id);
    assert.ok((x.lvl || x.level || 1) <= MAX_LEVEL, `${x.id} level too high`);
  }
  const cats = new Set(CATEGORIES.map((c) => c.id));
  for (const f of FURNITURE) {
    assert.ok(cats.has(f.cat), f.id);
    assert.ok(f.fp[0] > 0 && f.fp[1] > 0, f.id);
    if (f.unlock) assert.ok(['cave', 'sky', 'festival'].includes(f.unlock));
  }
  for (const n of NPCS) assert.ok(n.x > WORLD.minX && n.x < WORLD.maxX && n.z > WORLD.minZ && n.z < WORLD.maxZ, n.id);
  assert.ok(FURNITURE.length >= 110, 'at least 110 furniture items');
  assert.equal(SPECIES.length, 30);
});

test('furniture models build and stay light enough for a phone', () => {
  const tri = (g) => g.attributes.position.count / 3;
  for (const f of FURNITURE) {
    const p = { std: new Builder(), glow: new Builder(), gloss: new Builder(), glowAlways: new Builder(), metal: new Builder() };
    f.m(p, PALETTE[f.c || 0]);
    let n = 0;
    for (const b of Object.values(p)) if (b.parts.length) n += tri(b.build());
    assert.ok(n > 0, `${f.id} is empty`);
    assert.ok(n < 6000, `${f.id} has ${n} triangles`);
  }
});
