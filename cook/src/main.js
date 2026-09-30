import '../../src/style.css';
import './cook.css';
import { h } from '../../src/ui/ui.js';

const fill = document.getElementById('load-fill');
const text = document.getElementById('load-text');
const loading = document.getElementById('loading');

async function boot() {
  fill.style.width = '20%';
  try {
    await Promise.race([
      Promise.all([document.fonts.load('600 40px Fredoka'), document.fonts.load('400 20px Fredoka'), document.fonts.load('700 40px Fredoka')]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* fonts optional */ }
  fill.style.width = '50%';
  const { Game } = await import('./game.js');
  const Screens = await import('./screens.js');
  const game = new Game();
  window.__cook = game;
  window.__cookScreens = Screens;
  game.loadRestaurant('cafe');
  const s = game.state;
  const best = ['bakery', 'sushi', 'pizza', 'diner', 'cafe'].find((r) => Object.keys(s.stars).some((k) => k.startsWith(r)));
  if (best) game.loadRestaurant(best);
  game.start();
  fill.style.width = '100%';
  text.textContent = game.fresh ? 'Let’s cook!' : 'Welcome back, chef!';
  const btn = h('button', { class: 'btn big tap-start' }, game.fresh ? '🧁 Play' : '▶ Continue');
  loading.querySelector('.load-card').appendChild(btn);
  const go = async () => {
    game.audio.unlock();
    loading.classList.add('hide');
    setTimeout(() => loading.remove(), 700);
    if (!s.scriptChosen) await Screens.chooseScript(game);
    if (!s.intro) {
      game.setView('service');
      await Screens.intro(game);
      game.save();
      game.playLevel('cafe', 1);
    } else Screens.title(game);
  };
  btn.addEventListener('click', go, { once: true });
  if (new URLSearchParams(location.search).has('autostart')) go();
  window.addEventListener('pointerdown', () => game.audio.unlock(), { passive: true });
}

boot().catch((e) => {
  console.error(e);
  text.textContent = 'Oops! Something went wrong. Please reload. (' + (e?.message || e) + ')';
});

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('../sw.js').catch(() => {}));
}
