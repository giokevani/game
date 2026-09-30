// Usage: node test/e2e/cookshot.mjs <recipe|scene> [portrait]
// Cooks a recipe with the auto helper and screenshots the finished dish in the
// cooking view (or 'service' / 'homes' / 'step:<recipe>:<n>' for a step in progress).
import { launch, startServer } from './lib.mjs';
import fs from 'fs';
fs.mkdirSync('test/out', { recursive: true });
const [what = 'pizza', orient = ''] = process.argv.slice(2);
const srv = process.env.URL ? { url: process.env.URL, stop() {} } : await startServer(4176);
const opts = orient === 'portrait' ? { viewport: { width: 375, height: 812 } } : {};
const { browser, page, errors } = await launch(opts);
try {
  await page.goto(srv.url + 'cook/?autostart', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__cook && document.querySelector('.card-big'), null, { timeout: 90000 });
  await page.evaluate(() => { const s = window.__cook.state; s.scriptChosen = true; s.intro = true; document.querySelector('.screen')?.remove(); window.__cook.timeScale = 4; });
  const [kind, rid, n] = what.split(':');
  if (kind === 'service') {
    await page.evaluate(async () => { const g = window.__cook; g.playLevel('cafe', 7); await new Promise((r) => setTimeout(r, 300)); [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Start'))?.click(); });
    await page.waitForTimeout(9000);
  } else if (kind === 'homesall') {
    await page.evaluate(() => { const g = window.__cook; g.state.coins = 99999; window.__cookScreens.homes(g); });
    for (let i = 0; i < 10; i++) { await page.waitForTimeout(700); await page.screenshot({ path: `test/out/cs-house-${i}.png`, clip: { x: 150, y: 0, width: 512, height: 250 } }); await page.locator('.arrow.r').click(); }
  } else if (kind === 'homes') {
    await page.evaluate(() => { const g = window.__cook; g.state.coins = 99999; window.__cookScreens.homes(g); });
    for (let i = 0; i < Number(rid || 0); i++) { await page.locator('.arrow.r').click(); await page.waitForTimeout(150); }
    await page.waitForTimeout(1500);
  } else {
    const recipe = kind === 'step' ? rid : kind;
    const stop = kind === 'step' ? Number(n) : 99;
    await page.evaluate(async ({ recipe, stop }) => {
      const g = window.__cook, K = g.kitchen;
      g.loadRestaurant(Object.values(g.D.RESTAURANT).find((r) => r.recipes.includes(recipe)).id);
      g.setView('cook', true);
      const o = g.D.makeOrder(recipe);
      K.resetOrder(o);
      g.hud.cookMode(true, [o], 0);
      for (let i = 0; i < o.steps.length; i++) {
        const st = o.steps[i];
        g.hud.setStep(i, o.steps.length, g.stepPrompt(st));
        const p = K.run(st);
        if (i === stop) return;
        while (!K.finishNow) await new Promise((r) => setTimeout(r, 20));
        await K.finishNow();
        await p;
      }
      K.clearProps();
      g.hud.cookMode(false);
    }, { recipe, stop });
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: `test/out/cs-${what.replace(/:/g, '-')}${orient ? '-' + orient : ''}.png` });
  const info = await page.evaluate(() => { const r = window.__cook.renderer.info.render; return { calls: r.calls, tris: r.triangles }; });
  console.log(what, JSON.stringify(info));
} finally {
  const errs = errors;
  console.log('errors:', errs.length ? errs.slice(0, 5).join('\n') : 'none');
  await browser.close();
  srv.stop();
}
