// Usage: node test/e2e/shot.mjs name "js to run in page" [waitMs]
import { launch, startServer, openGame } from './lib.mjs';
import fs from 'fs';
const [name = 'shot', script = '', wait = '1500'] = process.argv.slice(2);
fs.mkdirSync('test/out', { recursive: true });
const srv = process.env.URL ? { url: process.env.URL, stop() {} } : await startServer();
const { browser, page, errors } = await launch();
try {
  const t0 = Date.now();
  await openGame(page, srv.url);
  console.log('loaded in', Date.now() - t0, 'ms');
  if (script) await page.evaluate(script);
  await page.waitForTimeout(Number(wait));
  await page.screenshot({ path: `test/out/${name}.png` });
  const info = await page.evaluate(() => { const r = window.__bb.renderer.info.render; return { calls: r.calls, tris: r.triangles, fps: window.__bb.quality.fps.toFixed(1) }; });
  console.log(JSON.stringify(info));
} finally {
  console.log('errors:', errors.length ? errors.slice(0, 8).join('\n') : 'none');
  await browser.close();
  srv.stop();
}
