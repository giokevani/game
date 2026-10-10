// End-to-end test for the Blossom Kitchen café inside Blossom Bay (Chromium,
// iPhone 11 Pro landscape): walk to the café, cook the first guest's dish with
// real touches and swipes, finish the level, leave the café with the money,
// and check saving, the old stand-alone save move and the /cook/ link.
import { launch, startServer } from './lib.mjs';
import fs from 'fs';

fs.mkdirSync('test/out', { recursive: true });
const srv = process.env.URL ? { url: process.env.URL, stop() {} } : await startServer(4175);
const { browser, page, errors } = await launch();
const results = [];
const ok = (name, cond, info = '') => { results.push({ name, pass: !!cond, info }); console.log(`${cond ? 'PASS' : 'FAIL'} ${name} ${info}`); };
const shot = (n) => (page.isClosed() ? Promise.resolve() : page.screenshot({ path: `test/out/cafe-${n}.png` }));
const G = (fn, arg) => page.evaluate(fn, arg);
const waitG = (fn, arg, timeout = 30000) => page.waitForFunction(fn, arg, { timeout, polling: 100 });
const clickText = async (txt) => { await page.locator('button:visible', { hasText: txt }).first().click(); };
const clickDialogs = async (n = 8) => { for (let i = 0; i < n; i++) { const had = await G(() => { const b = document.querySelector('.dialog .opts .btn'); if (b) { b.click(); return true; } return false; }); if (!had) break; await page.waitForTimeout(200); } };

async function scr(v) { return G((v) => window.__bb.cafe.kitchen.screenOf(v), v); }
async function drag(points, steps = 6) {
  await page.mouse.move(points[0].x, points[0].y);
  await page.mouse.down();
  for (let i = 1; i < points.length; i++) await page.mouse.move(points[i].x, points[i].y, { steps });
  await page.mouse.up();
}

// play the current step for real (touch-like input)
async function playStep() {
  await waitG(() => { const k = window.__bb.cafe.kitchen; return k.step && k.finishNow; });
  const st = await G(() => window.__bb.cafe.kitchen.step);
  const K = 'window.__bb.cafe.kitchen';
  if (st.t === 'add') {
    for (const id of st.items) { await page.locator(`.tray-btn[data-id="${id}"]`).click(); await page.waitForTimeout(700); }
  } else if (st.t === 'stir') {
    const c = await G(() => ({ top: window.__bb.cafe.kitchen.cont.top, r: window.__bb.cafe.kitchen.cont.r }));
    const pts = [];
    for (let i = 0; i <= 24 * (st.turns + 1); i++) { const a = (i / 24) * Math.PI * 2; pts.push({ x: Math.cos(a) * c.r * 0.6, y: c.top * 0.5, z: Math.sin(a) * c.r * 0.6 }); }
    const sp = [];
    for (const p of pts) sp.push(await scr(p));
    await drag(sp, 2);
  } else if (st.t === 'chop') {
    const cuts = await G(() => { const k = window.__bb.cafe.kitchen; const g = k.props.children.find((o) => o.isGroup); return null; });
    // cut lines are the dashed meshes in props
    const lines = await G(() => window.__bb.cafe.kitchen.props.children.filter((o) => o.isMesh && o.renderOrder === 20).map((o) => ({ x: o.position.x, y: o.position.y })));
    for (const L of lines) {
      const a = await scr({ x: L.x, y: L.y, z: -0.16 }), b = await scr({ x: L.x, y: L.y, z: 0.16 });
      await drag([a, b], 8);
      await page.waitForTimeout(350);
    }
  } else if (st.t === 'cook') {
    for (let phase = 0; phase < (st.flip ? 2 : 1); phase++) {
      // after a flip, wait until the button says STOP and the heat has restarted
      if (phase === 1) await waitG(() => { const b = document.querySelector('.cook-btn'); const n = document.querySelector('.heat .needle'); return b && b.textContent.includes('STOP') && n && parseFloat(n.style.left) < 40; });
      await waitG(() => { const n = document.querySelector('.heat .needle'); return n && parseFloat(n.style.left) >= 64; }, null, 60000);
      await page.locator('.cook-btn').click();
    }
  } else if (st.t === 'place') {
    const s = await G(() => window.__bb.cafe.kitchen.surface);
    for (let i = 0; i < st.n; i++) {
      const a = (i / st.n) * Math.PI * 2;
      const p = await scr({ x: Math.cos(a) * (s.r || 0.05) * 0.5, y: s.y, z: Math.sin(a) * (s.r || 0.05) * 0.5 });
      await page.mouse.click(p.x, p.y);
      await page.waitForTimeout(450);
    }
  } else {
    await G(() => window.__bb.cafe.kitchen.finishNow());
  }
  return st;
}


async function bootNewPlayer(p, url) {
  await p.goto(url, { waitUntil: 'load' });
  await p.waitForSelector('#loading .tap-start', { timeout: 90000 });
  await p.click('#loading .tap-start');
  await p.waitForSelector('.name-input', { timeout: 20000 });
  await p.fill('.name-input', 'Mila');
  await p.evaluate(() => document.querySelector('.panel-head .btn.mint').click());
  await p.waitForTimeout(800);
}

try {
  // ---------- a new Blossom Bay player ----------
  await bootNewPlayer(page, srv.url);
  await clickDialogs();
  const coins0 = await G(() => window.__bb.state.player.coins);

  // ---------- the café is a building in town ----------
  await G(() => window.__bb.cafeSys.goTo());
  await page.waitForTimeout(1200);
  await shot('01-outside');
  const label = await G(() => { const g = window.__bb; const it = g.world.nearestInteract(g.player.pos); return it && (typeof it.label === 'function' ? it.label() : it.label); });
  ok('café door in town offers cooking', label === 'Cook at the Café', String(label));
  await page.locator('.action-btn').dispatchEvent('pointerdown');
  await waitG(() => window.__bb.cafe?.active && document.querySelector('.card-big'), null, 60000);
  ok('walking in hides the town and the town HUD', await G(() => window.__bb.mode === 'cafe' && !window.__bb.world.ground?.visible));
  await shot('02-script');
  await clickText('Русские буквы');
  for (let i = 0; i < 5; i++) { await page.locator('.dialog .opts button').click(); await page.waitForTimeout(200); }
  await waitG(() => document.querySelector('.cafe-menu'));
  await shot('02b-menu');
  ok('café menu has Free Kitchen and guests, no levels', await G(() => { const t = document.querySelector('.panel').textContent; return t.includes('Free Kitchen') && t.includes('Serve guests') && !/Level|★/.test(t); }));
  await clickText('Serve guests');
  await waitG(() => document.querySelectorAll('.rest').length === 5);
  ok('every menu is open', await G(() => ![...document.querySelectorAll('.rest')].some((r) => r.classList.contains('locked'))));
  await page.locator('.rest', { hasText: 'Pancake' }).click();
  // Free service can choose any breakfast; pin this touch-cooking test to pancakes.
  await G(() => { window.__bb.cafe.level.info.recipes = ['pancakes']; window.__bb.cafe.level.info.combo = 0; });
  await waitG(() => { const b = document.querySelector('.bubble'); return b && b.offsetParent && b.parentElement.style.display !== 'none'; }, null, 60000);
  await page.waitForTimeout(500);
  await shot('03-service');

  // ---------- first guest, cooked by touch ----------
  await page.locator('.bubble').first().click();
  await waitG(() => document.querySelector('.order-say'));
  const sentence = await G(() => document.querySelector('.order-say .en').textContent);
  ok('guest orders in English', /pancakes/i.test(sentence), sentence);
  await clickText("Let's cook");
  const types = [];
  while (await G(() => !!window.__bb.cafe.cooking)) {
    const t0 = await G(() => window.__bb.cafe.kitchen.step?.t);
    if (!t0) { await page.waitForTimeout(200); continue; }
    const rc = await G(() => window.__bb.cafe.kitchen.runCount);
    if (t0 === 'cook') await shot('04-cook');
    const st = await playStep();
    types.push(st.t);
    await waitG((rc) => window.__bb.cafe.kitchen.runCount !== rc || !window.__bb.cafe.cooking, rc, 60000);
    if (types.length > 12) break;
  }
  ok('pancakes cooked by touch', types.join(',').startsWith('add,stir,cook'), types.join(','));
  await waitG((c) => window.__bb.state.player.coins > c, coins0, 30000);
  const coins1 = await G(() => window.__bb.state.player.coins);
  ok('the dish pays Blossom Bay coins', coins1 > coins0 + 30, `${coins0} -> ${coins1}`);

  // ---------- Free Kitchen: any food, as much as she likes ----------
  await page.locator('.cafe-ui .mbtn').click();
  await clickText('Café menu');
  await waitG(() => document.querySelector('.cafe-menu'));
  await clickText('Free Kitchen');
  await waitG(() => document.querySelectorAll('.p-item').length > 10);
  const coinsF = await G(() => window.__bb.state.player.coins);
  await page.locator('.p-tab', { hasText: 'Vegetables' }).click();
  await page.locator('.p-item[data-id="tomato"]').click();
  await page.locator('.p-item[data-id="corn"]').click();
  await page.locator('.p-tab', { hasText: 'Milk' }).click();
  for (const id of ['milk', 'egg', 'cheese', 'cheese']) await page.locator(`.p-item[data-id="${id}"]`).click();
  await page.locator('.p-tab', { hasText: 'Sweets' }).click();
  for (let i = 0; i < 20; i++) await page.locator('.p-item[data-id="sprinkles"]').click();
  await page.waitForTimeout(500);
  await shot('05-free-kitchen');
  const n = await G(() => window.__bb.cafe.free.items.length);
  ok('Free Kitchen takes lots of ingredients', n === 26, `${n} items`);
  await page.locator('.free-btn', { hasText: 'Undo' }).click();
  ok('undo removes the last one', (await G(() => window.__bb.cafe.free.items.length)) === 25);
  // chop the tomato with a real swipe, then mix and cook
  await page.locator('.free-btn', { hasText: 'Chop' }).click();
  await waitG(() => window.__bb.cafe.kitchen.finishNow);
  const lines = await G(() => window.__bb.cafe.kitchen.props.children.filter((o) => o.isMesh && o.renderOrder === 20).map((o) => ({ x: o.position.x, y: o.position.y })));
  for (const L of lines) {
    const a = await G((v) => window.__bb.cafe.kitchen.screenOf(v), { x: L.x, y: L.y, z: -0.16 }), b = await G((v) => window.__bb.cafe.kitchen.screenOf(v), { x: L.x, y: L.y, z: 0.16 });
    await drag([a, b], 8);
    await page.waitForTimeout(350);
  }
  await waitG(() => !window.__bb.cafe.free.busy, null, 30000);
  ok('chopping puts tomato slices into the dish', await G(() => window.__bb.cafe.free.actions.has('chop')));
  await page.locator('.free-btn', { hasText: 'Mix' }).click();
  await waitG(() => window.__bb.cafe.kitchen.finishNow);
  await G(() => window.__bb.cafe.kitchen.finishNow());
  await waitG(() => !window.__bb.cafe.free.busy, null, 30000);
  await page.locator('.free-btn', { hasText: 'Pot' }).click();
  await page.locator('.free-btn', { hasText: 'Cook' }).click();
  await waitG(() => window.__bb.cafe.kitchen.finishNow);
  await G(() => window.__bb.cafe.kitchen.finishNow());
  await waitG(() => !window.__bb.cafe.free.busy, null, 30000);
  await shot('06-cooked');
  await page.locator('.free-btn', { hasText: 'Done' }).click();
  await page.waitForSelector('.name-input');
  await page.fill('.name-input', 'Rainbow Soup');
  await clickText('OK');
  await waitG(() => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Give it to a guest')));
  await clickText('Give it to a guest');
  await waitG((c) => window.__bb.state.player.coins > c, coinsF, 90000);
  ok('a guest pays for her own dish', true, `${coinsF} -> ${await G(() => window.__bb.state.player.coins)}`);
  ok('her dish is saved in My dishes', await G(() => window.__bb.state.cafe.creations[0]?.name === 'Rainbow Soup'));
  await page.waitForTimeout(2500);

  // ---------- leave the café with the money ----------
  const coinsIn = await G(() => window.__bb.state.player.coins);
  await page.locator('.cafe-ui .mbtn').click();
  await clickText('Leave café');
  await page.waitForTimeout(1200);
  const out = await G(() => { const g = window.__bb; return { mode: g.mode, coins: g.state.player.coins, ground: g.world.ground?.visible !== false, hud: !document.querySelector('.cafe-ui:not(.hide)') }; });
  ok('leaving brings her back to town with her coins', out.mode === 'play' && out.coins === coinsIn && out.ground && out.hud, JSON.stringify(out));
  await shot('06-back-in-town');
  // build mode works right after the café
  await G(() => window.__bb.openBuild());
  await page.waitForTimeout(300);
  ok('building catalogue opens away from home', await G(() => document.querySelector('.panel')?.textContent.includes('Build anywhere')));
  await page.locator('.panel-head .x').click();
  await G(() => { const g=window.__bb; g.player.teleport(-66, undefined, -60); g.openBuild(); });
  await page.waitForTimeout(800);
  ok('build mode opens after cooking', await G(() => window.__bb.mode === 'build'));
  await shot('07-build');
  await page.locator('.build-done').click();
  await page.waitForTimeout(600);

  // ---------- every recipe cooks inside Blossom Bay ----------
  const rec = await G(async () => {
    const g = window.__bb, C = g.cafe, K = C.kitchen, out = {};
    if (g.mode !== 'play') return { error: 'mode ' + g.mode };
    await C.enter();
    document.querySelectorAll('.modal-bg').forEach((m) => m.remove());
    C.timeScale = 4;
    C.setView('cook', true);
    for (const r of C.D.RECIPES) {
      const o = C.D.makeOrder(r.id);
      K.resetOrder(o);
      for (const st of o.steps) {
        const p = K.run(st);
        let tries = 0;
        while (!K.finishNow && tries++ < 200) await new Promise((res) => setTimeout(res, 20));
        await K.finishNow?.();
        await Promise.race([p, new Promise((res, rej) => setTimeout(() => rej(new Error(`${r.id}:${st.t} timeout`)), 30000))]);
      }
      out[r.id] = K.dish.children.length;
    }
    K.resetOrder({ recipe: null, vary: {}, steps: [] });
    C.timeScale = 1;
    C.leave();
    return out;
  });
  const empty = Object.entries(rec).filter(([, n]) => !n).map(([k]) => k);
  ok('all 17 recipes cook inside Blossom Bay', Object.keys(rec).length === 17 && !empty.length, empty.length ? 'empty: ' + empty : rec.error || '');

  // ---------- save, reload, and the ?cafe link ----------
  await G(() => window.__bb.save());
  const before = await G(() => ({ coins: window.__bb.state.player.coins, dishes: window.__bb.state.cafe.creations.length }));
  await page.goto(srv.url + 'cook/', { waitUntil: 'load' });
  await page.waitForURL(/\?cafe=1/, { timeout: 20000 });
  ok('old /cook/ link leads to the café in Blossom Bay', page.url().includes('?cafe=1'), page.url());
  await page.waitForSelector('#loading .tap-start', { timeout: 90000 });
  await page.click('#loading .tap-start');
  await waitG(() => window.__bb.cafe?.active, null, 60000);
  const after = await G(() => ({ coins: window.__bb.state.player.coins, dishes: window.__bb.state.cafe.creations.length }));
  ok('progress survives reload and ?cafe opens the café', after.coins === before.coins && after.dishes === before.dishes, JSON.stringify({ before, after }));
  await page.waitForTimeout(800);
  await shot('08-menu');
  await clickText('Leave café');
  await page.waitForTimeout(600);
  ok('menu has a way out', await G(() => window.__bb.mode === 'play'));

  // ---------- the old stand-alone save moves in once ----------
  await page.close(); // one game at a time keeps the software renderer fast enough
  const ctx2 = await browser.newContext({ viewport: { width: 812, height: 375 }, isMobile: true, hasTouch: true });
  await ctx2.addInitScript(() => { try { if (location.protocol.startsWith('http') && !localStorage.getItem('blossombay.save.v1')) localStorage.setItem('blossomkitchen-v1', JSON.stringify({ coins: 120, houses: ['studio'], words: { egg: 1 }, intro: true, scriptChosen: true, settings: { script: 'lat' } })); } catch { /* about:blank */ } });
  const p2 = await ctx2.newPage();
  await bootNewPlayer(p2, srv.url);
  const moved = await p2.evaluate(() => ({ coins: window.__bb.state.player.coins, words: window.__bb.state.cafe.words.egg, script: window.__bb.state.cafe.settings.script }));
  ok('stand-alone Blossom Kitchen money and words move into Blossom Bay', moved.coins === 150 + 270 && moved.words === 1 && moved.script === 'lat', JSON.stringify(moved));
  await ctx2.close();
} catch (e) {
  ok('no exception', false, String(e.stack || e));
  await shot('zz-fail').catch(() => {});
} finally {
  const errs = errors.filter((e) => !/speech/i.test(e));
  ok('no console errors', !errs.length, errs.slice(0, 5).join(' | '));
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  await browser.close();
  srv.stop();
  process.exit(failed.length ? 1 : 0);
}
