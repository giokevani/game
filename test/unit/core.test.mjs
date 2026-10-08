import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newState, xpToNext, levelFromXP, totalXPForLevel, addXP, addCoins, spend, migrate, MAX_LEVEL } from '../../src/core/state.js';
import { exportCode, importCode } from '../../src/core/save.js';

test('level curve is increasing and consistent', () => {
  for (let l = 1; l < MAX_LEVEL; l++) assert.ok(xpToNext(l + 1) > xpToNext(l));
  for (const l of [1, 2, 5, 10, 20]) assert.equal(levelFromXP(totalXPForLevel(l)).level, l);
  assert.equal(levelFromXP(totalXPForLevel(5) - 1).level, 4);
  assert.equal(levelFromXP(1e9).level, MAX_LEVEL);
});

test('addXP reports level ups', () => {
  const s = newState();
  assert.equal(addXP(s, 10), 0);
  assert.equal(addXP(s, xpToNext(1)), 2);
});

test('coins: earn, spend, refuse overspending', () => {
  const s = newState();
  const start = s.player.coins;
  addCoins(s, 100);
  assert.equal(s.player.coins, start + 100);
  assert.equal(s.stats.coinsEarned, 100);
  assert.equal(spend(s, 50), true);
  assert.equal(spend(s, 1e6), false);
  assert.equal(spend(s, -5), false);
  assert.equal(s.player.coins, start + 50);
});

test('migrate keeps saved data and fills new fields', () => {
  const old = { player: { coins: 999, xp: 5, look: { skin: '#000000' } }, stats: { playTime: 12 } };
  const s = migrate(old);
  assert.equal(s.player.coins, 999);
  assert.equal(s.player.look.skin, '#000000');
  assert.ok(s.player.look.hair, 'default look fields filled');
  assert.ok(s.jobs.bakery, 'new sections exist');
  assert.equal(s.stats.playTime, 12);
  assert.equal(s.stats.petTasks, 0);
  assert.deepEqual(migrate(null).player.coins, newState().player.coins);
});

test('backup code round trip (with emoji names)', () => {
  const s = newState();
  s.player.name = 'Lili 🌸';
  s.player.coins = 4242;
  const back = importCode(exportCode(s));
  assert.equal(back.player.name, 'Lili 🌸');
  assert.equal(back.player.coins, 4242);
  assert.throws(() => importCode('hello'));
});

test('free play: no levels or prices, except clothes', async () => {
  const { applyFreePlayData, applyFreePlayState } = await import('../../src/core/freeplay.js');
  const { FURNITURE } = await import('../../src/data/furniture.js');
  const { FLOORS, WALLPAPERS, EXTERIORS, OPENINGS, PRICES } = await import('../../src/data/houseStyles.js');
  const { PLOT_PRICES } = await import('../../src/house/model.js');
  const { EGGS, PET_ACC } = await import('../../src/data/pets.js');
  const { SEEDS, JOBS } = await import('../../src/data/jobs.js');
  const { AVATAR_ITEMS } = await import('../../src/data/avatar.js');
  const { QUESTS } = await import('../../src/data/quests.js');
  const clothesBefore = AVATAR_ITEMS.filter((i) => i.price > 0).length;
  applyFreePlayData();
  for (const list of [FURNITURE, FLOORS, WALLPAPERS, EXTERIORS, OPENINGS, EGGS, PET_ACC]) for (const x of list) {
    assert.equal(x.price, 0, x.id);
    assert.ok(!x.unlock && (x.lvl || 1) === 1, x.id);
  }
  assert.ok(Object.values(PRICES).every((p) => p === 0));
  assert.ok(PLOT_PRICES.every((p) => p === 0));
  assert.ok(SEEDS.every((s) => s.cost === 0 && s.grow <= 90), 'seeds free and fast');
  assert.ok(JOBS.every((j) => !j.lvl));
  assert.ok(QUESTS.every((q) => q.lvl === 1));
  assert.equal(AVATAR_ITEMS.filter((i) => i.price > 0).length, clothesBefore, 'clothes still cost coins');
  assert.ok(AVATAR_ITEMS.every((i) => !i.level));
  const st = newState();
  applyFreePlayState(st, ['car', 'yacht']);
  assert.ok(st.unlocks.cave && st.unlocks.sky);
  assert.deepEqual(st.owned.vehicles, ['car', 'yacht']);
});
