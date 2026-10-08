import './style.css';
import { Game } from './game.js';
import { h } from './ui/ui.js';
import { applyFreePlayData } from './core/freeplay.js';

applyFreePlayData();

const fill = document.getElementById('load-fill');
const text = document.getElementById('load-text');
const loading = document.getElementById('loading');

function progress(p, msg) {
  fill.style.width = Math.round(p * 100) + '%';
  if (msg) text.textContent = msg;
}

async function boot() {
  try {
    await Promise.race([
      Promise.all([document.fonts.load('600 40px Fredoka'), document.fonts.load('400 20px Fredoka'), document.fonts.load('700 40px Fredoka')]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* fonts optional */ }
  const game = new Game();
  window.__bb = game;
  const mods = await import('./systems.js');
  mods.registerSystems(game);
  await game.init(progress);
  game.start();
  const card = loading.querySelector('.load-card');
  text.textContent = game.fresh ? 'Your new life in Blossom Bay awaits!' : 'Welcome back!';
  const btn = h('button', { class: 'btn big tap-start' }, game.fresh ? '🌸 Play' : '▶ Continue');
  card.appendChild(btn);
  const go = () => {
    game.audio.unlock();
    loading.classList.add('hide');
    setTimeout(() => loading.remove(), 700);
    game.emit('start');
  };
  btn.addEventListener('click', go, { once: true });
  if (new URLSearchParams(location.search).has('autostart')) go();
  // iOS only allows sound after a touch
  window.addEventListener('pointerdown', () => game.audio.unlock(), { passive: true });
}

boot().catch((e) => {
  console.error(e);
  text.textContent = 'Oops! Something went wrong. Please reload. (' + (e?.message || e) + ')';
});

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
