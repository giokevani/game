// Dev helper: open the game, skip the intro, then run steps from a JSON file.
// Usage: node test/e2e/play.mjs steps.json   (steps: [{js, wait, shot, game}])
import { launch, startServer, openGame } from './lib.mjs';
import fs from 'fs';
const steps = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
fs.mkdirSync('test/out', { recursive: true });
const srv = process.env.URL ? { url: process.env.URL, stop() {} } : await startServer(4190);
const { browser, page, errors } = await launch();
try {
  await openGame(page, srv.url);
  await page.evaluate(() => {
    const g = window.__bb; g.state.player.name = g.state.player.name || 'Jeva';
    document.querySelector('.panel-head .btn.mint')?.click();
    for (let i = 0; i < 8; i++) document.querySelector('.dialog .btn')?.click();
  });
  for (const s of steps) {
    if (s.js) { const r = await page.evaluate(s.js); if (r !== undefined) console.log('>', JSON.stringify(r)); }
    if (s.keys) for (const k of s.keys) await page.keyboard.down(k);
    if (s.game) { const t0 = await page.evaluate(() => window.__bb.time); await page.waitForFunction((t) => window.__bb.time >= t, t0 + s.game, { timeout: 300000, polling: 50 }); }
    if (s.keys) for (const k of s.keys) await page.keyboard.up(k);
    if (s.wait) await page.waitForTimeout(s.wait);
    if (s.shot) { await page.screenshot({ path: `test/out/${s.shot}.png` }); console.log('shot', s.shot); }
  }
} finally {
  console.log('errors:', errors.length ? errors.slice(0, 8).join('\n') : 'none');
  await browser.close();
  srv.stop();
}
