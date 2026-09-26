// Screenshots of fixed viewpoints: node test/e2e/views.mjs [filter]
import { launch, startServer, openGame } from './lib.mjs';
import fs from 'fs';
const filter = process.argv[2] || '';
fs.mkdirSync('test/out', { recursive: true });
const VIEWS = {
  plaza: { t: 0.4, pos: [0, 9, 26], look: [0, 3, -20], player: [2, 0, 8] },
  shops: { t: 0.45, pos: [-6, 6, -30], look: [-25, 3, -10], player: [-14, 0, -16] },
  beach: { t: 0.55, pos: [-10, 10, 20], look: [25, 0, 70], player: [0, 0, 45] },
  park: { t: 0.5, pos: [60, 14, -10], look: [100, 0, -45], player: [80, 0, -30] },
  home: { t: 0.38, pos: [-66, 10, -40], look: [-66, 0, -80], player: [-66, 0, -58] },
  night: { t: 0.92, pos: [0, 7, 22], look: [0, 3, -15], player: [2, 0, 8] },
  sunset: { t: 0.745, pos: [30, 5, 30], look: [30, 3, 90], player: [30, 0.7, 55] },
  cove: { t: 0.5, pos: [-95, 10, 60], look: [-125, 2, 45], player: [-100, 0, 46] },
  sky: { t: 0.5, pos: [0, 96, -70], look: [0, 82, -112], player: [0, 82.2, -100] },
};
const srv = process.env.URL ? { url: process.env.URL, stop() {} } : await startServer();
const { browser, page, errors } = await launch();
try {
  await openGame(page, srv.url);
  for (const [name, v] of Object.entries(VIEWS)) {
    if (filter && !name.includes(filter)) continue;
    await page.evaluate((v) => {
      const g = window.__bb;
      g.sky.setTime(v.t); g.sky.paused = true;
      g.player.teleport(v.player[0], v.player[1] || undefined, v.player[2]);
      g.mode = 'cutscene';
      g.rig.override = { pos: new g.camera.position.constructor(...v.pos), look: new g.camera.position.constructor(...v.look), speed: 1000 };
    }, v);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `test/out/view-${name}.png` });
    const info = await page.evaluate(() => { const r = window.__bb.renderer.info.render; return `${r.calls} calls, ${r.triangles} tris`; });
    console.log(name, info);
  }
} finally {
  console.log('errors:', errors.length ? errors.slice(0, 8).join('\n') : 'none');
  await browser.close();
  srv.stop();
}
