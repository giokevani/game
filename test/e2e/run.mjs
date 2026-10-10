// End-to-end tests in Chromium emulating an iPhone 11 Pro (landscape, touch).
// Run: npm run build && npm run test:e2e
import { launch, startServer } from './lib.mjs';
import fs from 'fs';

fs.mkdirSync('test/out', { recursive: true });
const srv = process.env.URL ? { url: process.env.URL, stop() {} } : await startServer(4174);
const { browser, page, errors, context } = await launch();
const results = [];
const ev = (fn, arg) => page.evaluate(fn, arg);
const wait = (ms) => page.waitForTimeout(ms);
const sleepFrames = (n = 10) => ev((n) => new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
const clickDialogs = async (n = 6) => { for (let i = 0; i < n; i++) { const had = await ev(() => { const b = document.querySelector('.dialog .btn'); if (b) { b.click(); return true; } return false; }); if (!had) break; await wait(150); } };
function assert(c, msg) { if (!c) throw new Error(msg); }
// headless Chromium renders in software (few fps) and the game clamps each frame to 50 ms,
// so waits are measured in game time, not wall time
const waitGame = async (sec) => { const t0 = await ev(() => window.__bb.time); await page.waitForFunction((t) => window.__bb.time >= t, t0 + sec, { timeout: 300000, polling: 50 }); };
const holdKey = async (code, sec) => { await page.keyboard.down(code); await waitGame(sec); await page.keyboard.up(code); };

async function test(name, fn) {
  const errBefore = errors.length;
  const t0 = Date.now();
  try {
    await fn();
    if (errors.length > errBefore) throw new Error('console errors: ' + errors.slice(errBefore).join(' | '));
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`  ✓ ${name} (${Date.now() - t0} ms)`);
  } catch (e) {
    results.push({ name, ok: false, err: String(e.message || e) });
    console.log(`  ✗ ${name}\n      ${e.message || e}`);
    await page.screenshot({ path: `test/out/fail-${name.replace(/\W+/g, '_')}.png` }).catch(() => {});
  }
}

console.log('Blossom Bay end-to-end tests (Chromium, iPhone 11 Pro landscape emulation)');
try {
  await test('boots with a Play button and a WebGL canvas', async () => {
    await page.goto(srv.url);
    await page.waitForSelector('#loading .tap-start', { timeout: 90000 });
    assert(await ev(() => !!document.querySelector('#app canvas')), 'no canvas');
    assert(await ev(() => !!document.querySelector('#app canvas').getContext('webgl2')), 'no webgl2');
    await page.click('#loading .tap-start');
    await wait(1200);
  });

  await test('character creator: pick hair, name, start', async () => {
    await page.waitForSelector('.panel', { timeout: 5000 });
    await ev(() => [...document.querySelectorAll('.tab')].find((t) => t.textContent.includes('Hair')).click());
    await ev(() => [...document.querySelectorAll('.card')].find((c) => c.textContent.includes('Ponytail')).click());
    await page.fill('.name-input', 'Mila');
    await ev(() => document.querySelector('.panel-head .btn.mint').click());
    await wait(900);
    const s = await ev(() => ({ name: window.__bb.state.player.name, hair: window.__bb.state.player.look.hair }));
    assert(s.name === 'Mila', 'name not saved: ' + s.name);
    assert(s.hair === 'hair_ponytail', 'hair not saved');
  });

  await test('welcome story starts and the tracker shows it', async () => {
    await clickDialogs();
    await wait(1000);
    const t = await ev(() => document.querySelector('.tracker').innerText);
    assert(t.includes('Build mode'), 'tracker: ' + t);
  });

  await test('HUD fits the iPhone screen without overlaps', async () => {
    const r = await ev(() => {
      const els = ['.pill.coins', '.hud-tr', '.round-btn', '.joy-hint'].map((s) => document.querySelector(s)?.getBoundingClientRect());
      return { els: els.map((b) => b && { l: b.left, t: b.top, r: b.right, b: b.bottom }), w: innerWidth, h: innerHeight };
    });
    for (const b of r.els) assert(b && b.l >= 0 && b.t >= 0 && b.r <= r.w && b.b <= r.h, 'element off screen ' + JSON.stringify(b));
    const [coins, tr] = r.els;
    assert(coins.r < tr.l, 'coins overlaps menu buttons');
  });

  await test('walking moves the player and buildings block the way', async () => {
    const a = await ev(() => ({ ...window.__bb.player.pos }));
    await holdKey('KeyW', 1.2);
    const b = await ev(() => ({ ...window.__bb.player.pos }));
    assert(Math.hypot(b.x - a.x, b.z - a.z) > 3, 'did not move');
    // walk straight into the Town Hall
    await ev(() => { const g = window.__bb; g.player.teleport(0, undefined, -24, Math.PI); g.rig.yaw = 0; });
    await holdKey('KeyW', 2.5);
    const c = await ev(() => ({ ...window.__bb.player.pos }));
    assert(c.z > -31.5 + 0.3, 'walked into the town hall: z=' + c.z);
  });

  await test('jumping goes up and lands again', async () => {
    const y0 = await ev(() => window.__bb.player.pos.y);
    await page.keyboard.down('Space'); await waitGame(0.2); await page.keyboard.up('Space');
    const y1 = await ev(() => window.__bb.player.pos.y);
    await waitGame(1.3);
    const y2 = await ev(() => window.__bb.player.pos.y);
    assert(y1 > y0 + 0.5, 'no jump');
    assert(Math.abs(y2 - y0) < 0.05, 'did not land');
  });

  await test('build mode: buy and place furniture, finish first task', async () => {
    await ev(() => { const g = window.__bb; g.player.teleport(-66, undefined, -60, Math.PI); });
    const coins0 = await ev(() => window.__bb.state.player.coins);
    await page.click('.mbtn[data-id="build"]');
    await wait(500);
    assert(await ev(() => window.__bb.mode === 'build'), 'not in build mode');
    await ev(() => [...document.querySelectorAll('.tool')].find((t) => t.textContent.includes('Furniture')).click());
    await wait(300);
    await ev(() => [...document.querySelectorAll('.build-drawer .card')].find((c) => c.textContent.includes('Side Table')).click());
    await wait(200);
    const ok = await ev(() => { const B = window.__bb.house.build; B.moveGhost(14.6, 25.2); return B.ghost?.ok; });
    assert(ok, 'ghost spot not valid');
    await ev(() => document.querySelector('.place-bar .btn.mint').click());
    await wait(200);
    const n = await ev(() => window.__bb.state.house.furniture.filter((f) => f.id === 'side_table').length);
    assert(n === 1, 'side table not placed');
    await ev(() => document.querySelector('.build-done').click());
    await waitGame(1.8);
    const s = await ev(() => ({ coins: window.__bb.state.player.coins, done: window.__bb.state.quests.done }));
    assert(s.done.includes('welcome'), 'welcome task not completed');
    assert(s.coins > coins0 - 30 + 100, 'no task reward');
  });

  await test('walls, floors, doors and paint tools change the house', async () => {
    const r = await ev(() => {
      const g = window.__bb; const B = g.house.build; const hs = g.state.house;
      g.state.player.coins += 2000;
      g.openBuild();
      const t0 = Object.keys(hs.tiles).length;
      B.setTool('floor'); B.erase = false; B.floorStyle = 'fl_minttile';
      B.stroke = { done: new Set() }; B.paintFloor({ x: 9, z: 21 }); B.paintFloor({ x: 9, z: 23 }); B.endStroke();
      B.setTool('walls'); B.tapWall({ x: 10, z: 21 });
      B.setTool('openings'); B.opening = 'door_pink'; B.tapOpening({ x: 10, z: 21 });
      B.setTool('paint'); B.paintKind = 'walls'; B.paintStyle = 'wp_stripe_mint'; B.tapPaint({ x: 9, z: 21 });
      B.exit();
      return { t0, t1: Object.keys(hs.tiles).length, wall: !!hs.inner['v,5,10'], door: hs.open['v,5,10'], paint: hs.tiles['4,10'].w[1] };
    });
    assert(r.t1 === r.t0 + 2, 'tiles ' + JSON.stringify(r));
    assert(r.wall && r.door === 'door_pink', 'wall/door ' + JSON.stringify(r));
    assert(r.paint === 'wp_stripe_mint', 'paint ' + JSON.stringify(r));
  });

  await test('Pip gives an egg; caring for it hatches a pet', async () => {
    await ev(() => { window.__bb.npcs.talk('pip'); });
    await wait(300);
    await clickDialogs();
    await wait(300);
    assert(await ev(() => window.__bb.state.eggs.length === 1), 'no egg');
    for (let i = 0; i < 3; i++) {
      await ev(() => { const g = window.__bb; g.state.needs = [{ id: 'hungry', t: 0 }]; const f = g.state.house.furniture.find((x) => x.id === 'food_bowl'); g.house.use(f, g.debug.FURN.food_bowl); });
      await wait(2800);
    }
    await wait(2200);
    const pets = await ev(() => window.__bb.state.pets.length);
    assert(pets === 1, 'pet did not hatch');
    await page.waitForSelector('.name-input', { timeout: 4000 });
    await page.fill('.name-input', 'Biscuit');
    await ev(() => document.querySelector('.panel .btn.mint').click());
    await wait(300);
    assert(await ev(() => window.__bb.state.pets[0].name === 'Biscuit'), 'pet name not saved');
  });

  await test('bakery: wrong cakes pay nothing, right cakes pay', async () => {
    await ev(() => { const g = window.__bb; g.testHooks = {}; g.jobs.startJob('bakery'); });
    await wait(500);
    const c0 = await ev(() => window.__bb.state.player.coins);
    await ev(() => window.__bb.testHooks.wrong());
    const c1 = await ev(() => window.__bb.state.player.coins);
    assert(c1 === c0, 'wrong cake paid');
    for (let i = 0; i < 3; i++) { await ev(() => window.__bb.testHooks.solve()); await wait(900); }
    const c2 = await ev(() => window.__bb.state.player.coins);
    assert(c2 > c1 + 50, 'right cakes did not pay');
    await ev(() => window.__bb.testHooks.finish());
    await wait(400);
    assert(await ev(() => window.__bb.mode === 'play' && window.__bb.state.jobs.bakery.xp >= 3), 'bakery not finished');
  });

  await test('florist and fishing pay out and fill collections', async () => {
    await ev(() => { window.__bb.jobs.startJob('florist'); });
    await wait(400);
    await ev(() => window.__bb.testHooks.solve()); await wait(1000);
    await ev(() => window.__bb.testHooks.finish()); await wait(300);
    await ev(() => { window.__bb.jobs.startJob('fishing'); });
    await wait(400);
    await ev(() => window.__bb.testHooks.solve()); await wait(300);
    await ev(() => window.__bb.testHooks.finish()); await wait(300);
    const r = await ev(() => ({ fl: window.__bb.state.jobs.florist.xp, fish: Object.keys(window.__bb.state.collections.fish).length, mode: window.__bb.mode }));
    assert(r.fl === 1 && r.fish === 1 && r.mode === 'play', JSON.stringify(r));
  });

  await test('garden: plant, water, grow, harvest', async () => {
    await ev(() => { window.__bb.jobs.seedPicker(0); });
    await wait(300);
    await ev(() => document.querySelector('.panel .card').click());
    await wait(200);
    await ev(() => window.__bb.jobs.useBed(0));
    const r0 = await ev(() => ({ ...window.__bb.state.garden[0] }));
    assert(r0.seed === 'carrot' && r0.watered > 0, 'not planted/watered');
    await ev(() => { window.__bb.state.garden[0].watered = Date.now() - 1e6; });
    await ev(() => window.__bb.jobs.useBed(0));
    const r = await ev(() => ({ bed: window.__bb.state.garden[0], plants: window.__bb.state.collections.plants.carrot }));
    assert(r.bed === null && r.plants === 1, JSON.stringify(r));
  });

  await test('delivery job: reach the house before the timer', async () => {
    await ev(() => { const g = window.__bb; g.state.player.xp = Math.max(g.state.player.xp, 800); g.player.teleport(50, undefined, 8); g.jobs.startJob('delivery'); });
    await wait(300);
    await ev(() => { const g = window.__bb; const t = g.jobs.delivery.target; g.player.teleport(t.x, undefined, t.z); });
    await sleepFrames(20);
    const n = await ev(() => window.__bb.jobs.delivery?.n ?? -1);
    assert(n === 1, 'delivery not counted: ' + n);
    await ev(() => window.__bb.jobs.stopDelivery(false));
  });

  await test('free play: every ride is free; the motorbike is faster than walking', async () => {
    assert(await ev(() => window.__bb.state.owned.vehicles.length >= 10), 'rides not all owned');
    await ev(() => { const g = window.__bb; g.player.teleport(-100, undefined, 24, Math.PI / 2); g.rig.yaw = -Math.PI / 2; g.vehicles.toggle(); });
    await wait(300);
    assert(await ev(() => document.querySelectorAll('.panel .card').length >= 10), 'ride picker not shown');
    await ev(() => [...document.querySelectorAll('.panel .card')].find((c) => c.textContent.includes('Motorbike')).click());
    await wait(200);
    const a = await ev(() => window.__bb.player.pos.x);
    await holdKey('KeyW', 1.5);
    const b = await ev(() => window.__bb.player.pos.x);
    assert(await ev(() => !!window.__bb.player.vehicle), 'not riding');
    assert(b - a > 14, 'ride too slow: ' + (b - a));
    await ev(() => window.__bb.vehicles.dismount());
  });

  await test('swim in the lake, then sail a boat on the sea', async () => {
    // walk into the middle of the lake: she swims
    await ev(() => { const g = window.__bb; g.player.teleport(96, undefined, -44); });
    await waitGame(0.6);
    const sw = await ev(() => { const p = window.__bb.player; return { swim: p.swimming, y: p.pos.y, pose: window.__bb.avatar.pose }; });
    assert(sw.swim && sw.pose === 'swim' && sw.y < -1, 'not swimming ' + JSON.stringify(sw));
    // a speed boat from the ride picker goes onto the water
    await ev(() => { const g = window.__bb; g.vehicles.ride('motorboat'); });
    await wait(200);
    const boat = await ev(() => { const p = window.__bb.player; return { v: !!p.vehicle?.water, y: p.pos.y }; });
    assert(boat.v, 'not in a boat ' + JSON.stringify(boat));
    await ev(() => window.__bb.vehicles.dismount());
    // from land, the boat asks where to sail, and the sea works too
    await ev(() => { const g = window.__bb; g.player.teleport(-66, undefined, -60); g.vehicles.ride('yacht'); });
    await wait(300);
    assert(await ev(() => !!document.querySelector('.panel') && document.querySelector('.panel').textContent.includes('The sea')), 'no water choice');
    await ev(() => [...document.querySelectorAll('.panel .btn')].find((b) => b.textContent.includes('The sea')).click());
    await wait(300);
    const sea = await ev(() => { const g = window.__bb; return { v: g.player.vehicle?.water, z: g.player.pos.z }; });
    assert(sea.v && sea.z > 55, 'yacht not on the sea ' + JSON.stringify(sea));
    const z0 = sea.z;
    await ev(() => { window.__bb.rig.yaw = Math.PI; });
    await holdKey('KeyW', 1.2);
    const z1 = await ev(() => window.__bb.player.pos.z);
    assert(z1 > z0 + 4, 'yacht did not sail ' + z0 + ' -> ' + z1);
    await ev(() => window.__bb.vehicles.dismount());
    await ev(() => { const g = window.__bb; g.player.teleport(-66, undefined, -60); });
  });

  await test('build mode: a pinch never lays floor, and the Erase tool removes it', async () => {
    await page.click('.mbtn[data-id="build"]');
    await wait(400);
    const r = await ev(() => {
      const g = window.__bb, B = g.house.build, hs = g.state.house, cv = g.renderer.domElement;
      B.setTool('floor'); B.erase = false;
      const t0 = Object.keys(hs.tiles).length;
      // two fingers on the grass, spread apart (pinch zoom)
      const fire = (type, id, x, y) => cv.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, pointerType: 'touch', bubbles: true, isPrimary: id === 1 }));
      fire('pointerdown', 1, 300, 300); fire('pointerdown', 2, 360, 300);
      fire('pointermove', 1, 280, 300); fire('pointermove', 2, 390, 300);
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 280, clientY: 300, pointerType: 'touch' }));
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 2, clientX: 390, clientY: 300, pointerType: 'touch' }));
      const t1 = Object.keys(hs.tiles).length;
      // lay one tile, then erase it with the Erase tool
      B.startStroke({ x: 9, z: 27 }); B.endStroke();
      const t2 = Object.keys(hs.tiles).length;
      B.setTool('erase');
      B.startStroke({ x: 9, z: 27 }); B.endStroke();
      const t3 = Object.keys(hs.tiles).length;
      return { t0, t1, t2, t3, eraseBtn: !!document.querySelector('.tool') && [...document.querySelectorAll('.tool')].some((t) => t.textContent.includes('Erase')) };
    });
    assert(r.t1 === r.t0, 'pinch laid floor ' + JSON.stringify(r));
    assert(r.t2 === r.t0 + 1 && r.t3 === r.t0, 'erase failed ' + JSON.stringify(r));
    assert(r.eraseBtn, 'no Erase tool');
    await ev(() => document.querySelector('.build-done').click());
    await wait(300);
  });

  await test('fishing is easy: cast, tap, reel', async () => {
    await ev(() => { window.__bb.jobs.startJob('fishing'); });
    await wait(400);
    await ev(() => [...document.querySelectorAll('.mg .btn')].find((b) => b.textContent.includes('Cast')).click());
    await page.waitForFunction(() => [...document.querySelectorAll('.mg .btn')].some((b) => b.textContent.includes('Catch')), null, { timeout: 30000 });
    const press = () => ev(() => { const b = [...document.querySelectorAll('.mg .btn')].find((x) => /Catch|Reel/.test(x.textContent)); if (!b) return false; b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); return true; });
    await press();
    for (let i = 0; i < 4; i++) { await wait(150); if (!await press()) break; }
    await wait(400);
    const t = await ev(() => document.querySelector('.mg').textContent);
    assert(/You caught/.test(t), 'no fish: ' + t.slice(0, 120));
    await ev(() => [...document.querySelectorAll('.mg .btn')].find((b) => /Done|Finish|✕|Close/.test(b.textContent))?.click() || document.querySelector('.mg .x')?.click());
    await wait(300);
    await ev(() => document.querySelectorAll('.mg').forEach((m) => m.remove()));
    await ev(() => { window.__bb.mode = 'play'; window.__bb.hud.setVisible(true); });
  });

  await test('hot-air balloon flies to Sky Island and back', async () => {
    await ev(() => { const g = window.__bb; g.state.unlocks.sky = true; g.state.player.xp = Math.max(g.state.player.xp, 20000); g.vehicles.balloonUse(true); });
    await waitGame(7.5);
    const up = await ev(() => ({ y: window.__bb.player.pos.y, mode: window.__bb.mode }));
    assert(up.y > 70 && up.mode === 'play', 'not on the island ' + JSON.stringify(up));
    await ev(() => window.__bb.vehicles.balloonUse(false));
    await waitGame(7.5);
    const down = await ev(() => window.__bb.player.pos.y);
    assert(down < 3, 'not back down: ' + down);
  });

  await test('map fast travel to Town Square', async () => {
    await ev(() => { const g = window.__bb; if (!g.state.collections.zones.includes('square')) g.state.collections.zones.push('square'); g.openMap(); });
    await wait(300);
    await ev(() => [...document.querySelectorAll('.panel .btn')].find((b) => b.textContent.includes('Town Square')).click());
    await wait(300);
    const p = await ev(() => ({ ...window.__bb.player.pos }));
    assert(Math.hypot(p.x, p.z + 10) < 22, 'not at the square ' + JSON.stringify(p));
  });

  await test('performance budget in town (draw calls, triangles)', async () => {
    await sleepFrames(10);
    const r = await ev(() => window.__bb.renderer.info.render);
    console.log(`      town view: ${r.calls} draw calls, ${r.triangles} triangles (incl. shadow pass)`);
    assert(r.calls < 260, 'too many draw calls ' + r.calls);
    assert(r.triangles < 1100000, 'too many triangles ' + r.triangles);
  });

  await test('menus open and close cleanly', async () => {
    for (const fn of ['openPets', 'openBag', 'openQuests', 'openSettings', 'openMap']) {
      await ev((fn) => window.__bb[fn](), fn);
      await wait(250);
      assert(await ev(() => !!document.querySelector('.panel')), fn + ' did not open');
      await ev(() => document.querySelector('.panel-head .x').click());
      await wait(150);
    }
    await ev(() => window.__bb.pets.openShop()); await wait(200);
    await ev(() => document.querySelector('.panel-head .x').click());
    assert(await ev(() => !document.querySelector('.modal-bg')), 'modal left open');
  });

  await test('save, reload, everything is still there', async () => {
    const before = await ev(() => { const g = window.__bb; g.save(); const s = g.state; return { coins: s.player.coins, items: s.house.furniture.length, pets: s.pets.length, name: s.player.name, tiles: Object.keys(s.house.tiles).length, quests: s.quests.done.length }; });
    await page.goto(srv.url + '?autostart');
    await page.waitForFunction(() => window.__bb && window.__bb.clock, null, { timeout: 90000 });
    await wait(1500);
    const after = await ev(() => { const s = window.__bb.state; return { coins: s.player.coins, items: s.house.furniture.length, pets: s.pets.length, name: s.player.name, tiles: Object.keys(s.house.tiles).length, quests: s.quests.done.length, creator: !!document.querySelector('.name-input') }; });
    assert(!after.creator, 'character creator shown again');
    for (const k of Object.keys(before)) assert(before[k] === after[k], `${k}: ${before[k]} -> ${after[k]}`);
  });

  await test('backup code restores a save', async () => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const coins = await ev(() => window.__bb.state.player.coins);
    await ev(() => window.__bb.openSettings());
    await wait(200);
    await ev(() => [...document.querySelectorAll('.panel .btn')].find((b) => b.textContent.includes('Copy backup')).click());
    await wait(400);
    const code = await ev(async () => { try { return await navigator.clipboard.readText(); } catch { return document.querySelector('textarea')?.value || ''; } });
    assert(code.startsWith('BB1:'), 'no backup code');
    await ev(() => { document.querySelectorAll('.modal-bg').forEach((m) => m.remove()); const g = window.__bb; g.noSave = true; g.state.player.coins = 1; });
    await ev(() => { window.__bb.noSave = false; window.__bb.openSettings(); });
    await wait(200);
    await ev(() => [...document.querySelectorAll('.panel .btn')].find((b) => b.textContent.includes('Restore')).click());
    await wait(300);
    await page.fill('.name-input', code);
    const nav = page.waitForNavigation({ timeout: 20000 });
    await ev(() => [...document.querySelectorAll('.panel .btn.mint')].pop().click());
    await nav;
    await page.waitForFunction(() => window.__bb && window.__bb.clock, null, { timeout: 90000 });
    await wait(800);
    const c2 = await ev(() => window.__bb.state.player.coins);
    assert(Math.abs(c2 - coins) < 5, `coins after restore ${c2}, expected ${coins}`);
  });

  await test('portrait mode asks to turn the phone', async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await wait(400);
    const vis = await ev(() => getComputedStyle(document.querySelector('.portrait-warn')).display);
    assert(vis === 'flex', 'no rotate hint in portrait');
    await page.setViewportSize({ width: 812, height: 375 });
    await wait(300);
  });
} finally {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed${errors.length ? `, console errors: ${errors.length}` : ''}`);
  fs.writeFileSync('test/out/e2e-results.json', JSON.stringify({ results, errors }, null, 2));
  await browser.close();
  srv.stop();
  process.exit(failed.length ? 1 : 0);
}
