// End-to-end test for Blossom Kitchen (Chromium, iPhone 11 Pro landscape).
// Plays the first customer with real touches/swipes, then checks every recipe,
// the results + quiz, Dream Homes, Word Book, settings and save/reload.
import { launch, startServer } from './lib.mjs';
import fs from 'fs';

fs.mkdirSync('test/out', { recursive: true });
const srv = process.env.URL ? { url: process.env.URL, stop() {} } : await startServer(4175);
const { browser, page, errors } = await launch();
const results = [];
const ok = (name, cond, info = '') => { results.push({ name, pass: !!cond, info }); console.log(`${cond ? 'PASS' : 'FAIL'} ${name} ${info}`); };
const shot = (n) => page.screenshot({ path: `test/out/cook-${n}.png` });
const G = (fn, arg) => page.evaluate(fn, arg);
const waitG = (fn, arg, timeout = 30000) => page.waitForFunction(fn, arg, { timeout, polling: 100 });
const clickText = async (txt) => { await page.locator('button:visible', { hasText: txt }).first().click(); };

async function scr(v) { return G((v) => window.__cook.kitchen.screenOf(v), v); }
async function drag(points, steps = 6) {
  await page.mouse.move(points[0].x, points[0].y);
  await page.mouse.down();
  for (let i = 1; i < points.length; i++) await page.mouse.move(points[i].x, points[i].y, { steps });
  await page.mouse.up();
}

// play the current step for real (touch-like input)
async function playStep() {
  await waitG(() => { const k = window.__cook.kitchen; return k.step && k.finishNow; });
  const st = await G(() => window.__cook.kitchen.step);
  const K = 'window.__cook.kitchen';
  if (st.t === 'add') {
    for (const id of st.items) { await page.locator(`.tray-btn[data-id="${id}"]`).click(); await page.waitForTimeout(700); }
  } else if (st.t === 'stir') {
    const c = await G(() => ({ top: window.__cook.kitchen.cont.top, r: window.__cook.kitchen.cont.r }));
    const pts = [];
    for (let i = 0; i <= 24 * (st.turns + 1); i++) { const a = (i / 24) * Math.PI * 2; pts.push({ x: Math.cos(a) * c.r * 0.6, y: c.top * 0.5, z: Math.sin(a) * c.r * 0.6 }); }
    const sp = [];
    for (const p of pts) sp.push(await scr(p));
    await drag(sp, 2);
  } else if (st.t === 'chop') {
    const cuts = await G(() => { const k = window.__cook.kitchen; const g = k.props.children.find((o) => o.isGroup); return null; });
    // cut lines are the dashed meshes in props
    const lines = await G(() => window.__cook.kitchen.props.children.filter((o) => o.isMesh && o.renderOrder === 20).map((o) => ({ x: o.position.x, y: o.position.y })));
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
    const s = await G(() => window.__cook.kitchen.surface);
    for (let i = 0; i < st.n; i++) {
      const a = (i / st.n) * Math.PI * 2;
      const p = await scr({ x: Math.cos(a) * (s.r || 0.05) * 0.5, y: s.y, z: Math.sin(a) * (s.r || 0.05) * 0.5 });
      await page.mouse.click(p.x, p.y);
      await page.waitForTimeout(450);
    }
  } else {
    await G(() => window.__cook.kitchen.finishNow());
  }
  return st;
}

try {
  // ---------- boot + first start ----------
  await page.goto(srv.url + 'cook/?autostart', { waitUntil: 'load' });
  await waitG(() => window.__cook && document.querySelector('.card-big'), null, 90000);
  await shot('01-script');
  await clickText('Русские буквы');
  for (let i = 0; i < 4; i++) { await page.locator('.dialog .opts button').click(); await page.waitForTimeout(200); }
  await waitG(() => [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Start')));
  await shot('02-level-intro');
  await clickText('Start');
  await waitG(() => { const b = document.querySelector('.bubble'); return b && b.style.display !== 'none'; }, null, 60000);
  await page.waitForTimeout(600);
  await shot('03-service');
  ok('customer arrives with an order bubble', true);

  // ---------- first customer, played by touch ----------
  await page.locator('.bubble').first().click();
  await waitG(() => document.querySelector('.order-say'));
  const sentence = await G(() => document.querySelector('.order-say .en').textContent);
  ok('order sentence is English', /pancakes/i.test(sentence), sentence);
  await clickText("Let's cook");
  const types = [];
  let shots = 0;
  while (true) {
    const more = await G(() => !!window.__cook.cooking);
    if (!more) break;
    const t0 = await G(() => window.__cook.kitchen.step?.t);
    if (!t0) { await page.waitForTimeout(200); continue; }
    const before = await G(() => window.__cook.kitchen.step);
    const rc = await G(() => window.__cook.kitchen.runCount);
    if (shots < 3 && ['stir', 'cook', 'chop'].includes(before.t)) { await page.waitForTimeout(500); await shot('04-step-' + before.t); shots++; }
    const st = await playStep();
    types.push(st.t);
    await waitG((rc) => window.__cook.kitchen.runCount !== rc || !window.__cook.cooking, rc, 60000);
    if (types.length > 12) break;
  }
  ok('pancake steps played by touch', types.join(',').startsWith('add,stir,cook'), types.join(','));
  await waitG(() => window.__cook.state.coins > 0, null, 30000);
  const q1 = await G(() => window.__cook.level.qualities[0]);
  ok('first dish served and paid', q1 > 0.4, `quality ${q1?.toFixed(2)}, coins ${await G(() => window.__cook.state.coins)}`);

  // ---------- finish the level quickly ----------
  await G(async () => {
    const g = window.__cook;
    const auto = setInterval(() => {
      if (document.querySelector('.order-say')) [...document.querySelectorAll('button')].find((b) => b.textContent.includes("Let's cook"))?.click();
      else if (!g.cooking) { const c = g.customers.find((x) => x.state === 'wait'); if (c) g.tapCustomer(c); }
      g.kitchen.finishNow?.();
    }, 300);
    window.__auto = auto;
  });
  await waitG(() => document.querySelector('.big-stars') || document.querySelector('.res-list'), null, 240000);
  await G(() => clearInterval(window.__auto));
  await page.waitForTimeout(1200);
  await shot('05-results');
  const st1 = await G(() => window.__cook.state.stars['cafe-1'] || 0);
  ok('level 1 finished with stars', st1 >= 1, `stars ${st1}`);

  // quiz
  const coinsBefore = await G(() => window.__cook.state.coins);
  await clickText('Word Quiz');
  for (let i = 0; i < 3; i++) {
    await waitG(() => document.querySelectorAll('.quiz-opt').length === 3 && !document.querySelector('.quiz-opt.right'));
    if (i === 0) await shot('06-quiz');
    await page.locator('.quiz-opt').first().click();
    await page.waitForTimeout(2100);
  }
  await clickText('OK');
  const coinsAfter = await G(() => window.__cook.state.coins);
  ok('quiz finishes (coins for right answers)', coinsAfter >= coinsBefore, `${coinsBefore} -> ${coinsAfter}`);

  // ---------- every recipe cooks without errors (auto steps) ----------
  await clickText('Menu');
  await page.waitForTimeout(500);
  await shot('07-title');
  const rec = await G(async () => {
    const g = window.__cook, K = g.kitchen, out = {};
    g.timeScale = 4;
    g.loadRestaurant('bakery');
    g.setView('cook', true);
    for (const r of g.D.RECIPES) {
      for (let v = 0; v < 2; v++) {
        const o = g.D.makeOrder(r.id);
        K.resetOrder(o);
        for (const st of o.steps) {
          const p = K.run(st);
          let tries = 0;
          while (!K.finishNow && tries++ < 100) await new Promise((res) => setTimeout(res, 20));
          await K.finishNow?.();
          await Promise.race([p, new Promise((res, rej) => setTimeout(() => rej(new Error(`${r.id}:${st.t} timeout`)), 20000))]);
        }
        out[r.id] = K.dish.children.length;
      }
    }
    return out;
  });
  const empty = Object.entries(rec).filter(([, n]) => !n).map(([k]) => k);
  ok('all 17 recipes cook to a finished dish', Object.keys(rec).length === 17 && !empty.length, empty.length ? 'empty: ' + empty : '');

  // screenshot a few finished dishes
  for (const id of ['pizza', 'burger', 'cake', 'sushi']) {
    await G(async (id) => {
      const g = window.__cook, K = g.kitchen;
      const o = g.D.makeOrder(id); K.resetOrder(o);
      for (const st of o.steps) { const p = K.run(st); while (!K.finishNow) await new Promise((r) => setTimeout(r, 20)); await K.finishNow(); await p; }
      g.hud.cookMode(false);
    }, id);
    await page.waitForTimeout(700);
    await shot('08-dish-' + id);
  }
  await G(() => { const g = window.__cook; g.timeScale = 1; g.kitchen.resetOrder({ recipe: null, vary: {}, steps: [] }); g.setView('title', true); });

  // ---------- Dream Homes ----------
  await G(() => { const g = window.__cook; g.state.coins = 1000; g.changed(); document.querySelector('.screen.title')?.remove(); });
  await G(() => window.__cookScreens?.homes(window.__cook));
  await page.waitForTimeout(800);
  await shot('09-homes');
  await clickText('Buy');
  await page.waitForTimeout(1200);
  const houses = await G(() => window.__cook.state.houses);
  ok('buy a dream home', houses.length === 1 && houses[0] === 'studio', JSON.stringify(houses));
  await shot('10-homes-bought');
  for (let i = 0; i < 9; i++) { await page.locator('.arrow.r').click(); await page.waitForTimeout(250); if (i === 8) await shot('11-palace'); }
  await clickText('Back');

  // ---------- Word Book + settings ----------
  await clickText('Words');
  await page.waitForTimeout(400);
  await shot('12-words');
  const known = await G(() => document.querySelectorAll('.word:not(.unknown)').length);
  ok('word book shows learned words', known >= 5, `${known} food words known`);
  await page.locator('.panel-head .x').click();
  await clickText('Settings');
  await page.locator('.seg button', { hasText: 'Latinica' }).click();
  const script = await G(() => window.__cook.state.settings.script);
  ok('switch Russian help to Latin letters', script === 'lat');
  await page.locator('.panel-head .x').click();

  // ---------- save + reload ----------
  await G(() => window.__cook.save());
  await page.goto(srv.url + 'cook/?autostart', { waitUntil: 'load' });
  await waitG(() => window.__cook && document.querySelector('.title-card'), null, 90000);
  const after = await G(() => ({ houses: window.__cook.state.houses, stars: window.__cook.state.stars['cafe-1'], script: window.__cook.state.settings.script }));
  ok('progress survives reload', after.houses.length === 1 && after.stars >= 1 && after.script === 'lat', JSON.stringify(after));
  await shot('13-title-latin');

  // ---------- Blossom Bay save untouched ----------
  const keys = await G(() => Object.keys(localStorage));
  ok('separate save key from Blossom Bay', keys.includes('blossomkitchen-v1'), keys.join(','));

  const perf = await G(() => { const g = window.__cook; g.loadRestaurant('cafe'); g.setView('service', true); g.renderer.render(g.scene, g.camera); const r = g.renderer.info.render; return { calls: r.calls, tris: r.triangles }; });
  ok('draw calls within budget', perf.calls < 150, JSON.stringify(perf));
} catch (e) {
  ok('no exception', false, String(e.stack || e));
  await shot('zz-fail').catch(() => {});
} finally {
  const errs = errors.filter((e) => !/speech|favicon/i.test(e));
  ok('no console errors', !errs.length, errs.slice(0, 5).join(' | '));
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  await browser.close();
  srv.stop();
  process.exit(failed.length ? 1 : 0);
}
