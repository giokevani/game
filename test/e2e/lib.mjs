// Shared Playwright helpers (Chromium emulating an iPhone 11 Pro in landscape).
import { createRequire } from 'module';
import { spawn } from 'child_process';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
export const { chromium } = pw;

export const IPHONE_11_PRO_LANDSCAPE = {
  viewport: { width: 812, height: 375 },
  deviceScaleFactor: Number(process.env.DPR || 1),
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
};

export async function startServer(port = 4173) {
  const proc = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], { stdio: 'pipe' });
  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('server timeout')), 20000);
    proc.stdout.on('data', (d) => { if (String(d).includes('http')) { clearTimeout(t); res(); } });
  });
  return { url: `http://localhost:${port}/`, stop: () => proc.kill() };
}

export async function launch(opts = {}) {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const context = await browser.newContext({ ...IPHONE_11_PRO_LANDSCAPE, ...opts });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return { browser, context, page, errors };
}

export async function openGame(page, url, query = 'autostart') {
  await page.goto(url + '?' + query, { waitUntil: 'load' });
  if (process.env.DEBUG) page.on('console', (m) => console.log('[page]', m.text()));
  await page.waitForFunction(() => window.__bb && window.__bb.clock, null, { timeout: 90000 });
  await page.waitForTimeout(1500);
}
