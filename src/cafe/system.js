// Blossom Kitchen café in town: walk in, cook for guests, walk out again.
// The café code (cook/src) loads the first time she goes in, so the town
// starts as fast as before.
import { BUILDINGS } from '../data/map.js';
import { toast } from '../ui/ui.js';
import { importKitchenSave, cafeView, OLD_SAVE_KEY } from '../../cook/src/state.js';

export const CAFE = BUILDINGS.find((b) => b.id === 'cafe');
export const cafeDoor = (out = 1.6) => ({ x: CAFE.x + Math.sin(CAFE.face) * (CAFE.d / 2 + out), z: CAFE.z + Math.cos(CAFE.face) * (CAFE.d / 2 + out) });

export class CafeSystem {
  async init(game) {
    this.game = game;
    game.cafeSys = this;
    const st = game.state;
    cafeView(st);
    // the stand-alone Blossom Kitchen save moves in once (stars, words, money)
    let moved = 0;
    try {
      const raw = window.localStorage.getItem(OLD_SAVE_KEY);
      if (raw && !st.cafe.imported) moved = importKitchenSave(st, JSON.parse(raw)).coins;
      else st.cafe.imported = true;
    } catch { st.cafe.imported = true; }
    const d = cafeDoor();
    game.world.addInteract({ x: d.x, z: d.z, r: 2.8, label: 'Cook at the Café', icon: '🍳', onUse: () => this.open() });
    const wantCafe = new URLSearchParams(location.search).has('cafe');
    game.on('start', () => {
      if (moved) setTimeout(() => toast(`Your Blossom Kitchen money moved here: +${moved} 🪙`, { icon: '🧁', kind: 'gold', time: 5000 }), 1500);
      if (!st.player.name) return; // brand-new player: make the character first
      if (!st.cafe.announced) {
        st.cafe.announced = true;
        setTimeout(() => toast('New! Blossom Kitchen café on Main Street. Cook there to earn coins!', { icon: '🍳', kind: 'pink', time: 6000 }), 2500);
      }
      if (wantCafe) { this.goTo(); this.open(); }
    });
  }

  // fast travel to the café door
  goTo() {
    const g = this.game;
    const d = cafeDoor(3);
    g.vehicles?.dismount?.();
    g.player.teleport(d.x, undefined, d.z, CAFE.face + Math.PI);
    g.rig.yaw = g.player.facing + Math.PI;
    g.rig.snap(g.player.pos);
  }

  async open() {
    if (this.loading) return;
    if (!this.cafe) {
      this.loading = true;
      toast('Opening the café…', { icon: '🍳', time: 1200 });
      try {
        const { Cafe } = await import('../../cook/src/cafe.js');
        this.cafe = new Cafe(this.game);
        this.game.cafe = this.cafe;
      } finally { this.loading = false; }
    }
    this.game.vehicles?.dismount?.();
    await this.cafe.enter();
  }

  update(dt) { this.cafe?.update(dt); }
}
