// Touch + mouse + keyboard input. Left side of the screen = floating joystick,
// right side = drag to turn the camera, two fingers = pinch zoom.
export class Input {
  constructor(el, ui) {
    this.el = el;
    this.move = { x: 0, y: 0 };
    this.look = { dx: 0, dy: 0 };
    this.zoom = 0;
    this.jumpPressed = false;
    this.actionPressed = false;
    this.flyUpHeld = false;   // ▲ / ▼ buttons while flying
    this.flyDownHeld = false;
    this.keys = new Set();
    this.enabled = true;
    this.pointers = new Map();
    this.joyId = null;
    this.joyOrigin = { x: 0, y: 0 };
    this.pinchDist = 0;
    this.tapHandlers = [];
    this.usedTouch = false;

    this.joy = document.createElement('div');
    this.joy.className = 'joy';
    this.knob = document.createElement('div');
    this.knob.className = 'knob';
    this.joy.appendChild(this.knob);
    ui.appendChild(this.joy);

    el.addEventListener('pointerdown', (e) => this.down(e));
    window.addEventListener('pointermove', (e) => this.moveEv(e));
    window.addEventListener('pointerup', (e) => this.up(e));
    window.addEventListener('pointercancel', (e) => this.up(e));
    el.addEventListener('wheel', (e) => { this.zoom += e.deltaY * 0.01; e.preventDefault(); }, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    // iOS: stop pinch-zooming the page itself
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('touchmove', (e) => { if (e.target === el || el.contains(e.target)) e.preventDefault(); }, { passive: false });
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd < 300 && (e.target === el || el.contains(e.target))) e.preventDefault();
      lastTouchEnd = now;
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      this.keys.add(e.code);
      if (e.code === 'Space') this.jumpPressed = true;
      if (e.code === 'KeyE' || e.code === 'Enter') this.actionPressed = true;
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.flyUpHeld = false; this.flyDownHeld = false; this.resetJoy(); });
  }

  onTap(fn) { this.tapHandlers.push(fn); }

  down(e) {
    if (e.pointerType === 'touch') this.usedTouch = true;
    this.el.setPointerCapture?.(e.pointerId);
    const p = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), type: e.pointerType, button: e.button, moved: 0 };
    const w = window.innerWidth;
    p.role = 'look';
    if (this.enabled && e.pointerType !== 'mouse' && e.clientX < w * 0.42 && this.joyId === null && !this.buildMode) {
      p.role = 'joy';
      this.joyId = e.pointerId;
      this.joyOrigin = { x: e.clientX, y: e.clientY };
      this.joy.style.left = e.clientX + 'px';
      this.joy.style.top = e.clientY + 'px';
      this.joy.classList.add('show');
      this.knob.style.transform = 'translate(0,0)';
    }
    this.pointers.set(e.pointerId, p);
    const looks = [...this.pointers.values()].filter((q) => q.role !== 'joy');
    if (looks.length === 2) this.pinchDist = Math.hypot(looks[0].x - looks[1].x, looks[0].y - looks[1].y);
  }

  moveEv(e) {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    p.moved += Math.abs(dx) + Math.abs(dy);
    if (p.role === 'joy') {
      let jx = e.clientX - this.joyOrigin.x, jy = e.clientY - this.joyOrigin.y;
      const max = 50;
      const d = Math.hypot(jx, jy);
      if (d > max) { jx = (jx / d) * max; jy = (jy / d) * max; }
      this.knob.style.transform = `translate(${jx}px, ${jy}px)`;
      const dead = 6;
      this.move.x = Math.abs(jx) > dead ? jx / max : 0;
      this.move.y = Math.abs(jy) > dead ? jy / max : 0;
      return;
    }
    const looks = [...this.pointers.values()].filter((q) => q.role !== 'joy');
    if (looks.length >= 2) {
      const d = Math.hypot(looks[0].x - looks[1].x, looks[0].y - looks[1].y);
      if (this.pinchDist) this.zoom -= (d - this.pinchDist) * 0.03;
      this.pinchDist = d;
      return;
    }
    if (p.type === 'mouse' && !(e.buttons & 1) && !(e.buttons & 2)) return;
    this.look.dx += dx;
    this.look.dy += dy;
    if (this.onDrag) this.onDrag(p, dx, dy);
  }

  up(e) {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    this.pointers.delete(e.pointerId);
    if (p.role === 'joy') this.resetJoy();
    else if (p.moved < 12 && performance.now() - p.t < 400) {
      for (const fn of this.tapHandlers) fn(p.x, p.y, p);
    }
    if (this.onRelease) this.onRelease(p);
    this.pinchDist = 0;
  }

  resetJoy() {
    this.joyId = null;
    this.move.x = 0; this.move.y = 0;
    this.joy.classList.remove('show');
  }

  // combined movement vector from joystick + keyboard
  getMove() {
    let x = this.move.x, y = this.move.y;
    if (!this.enabled) return { x: 0, y: 0 };
    const k = this.keys;
    if (k.has('KeyW') || k.has('ArrowUp')) y -= 1;
    if (k.has('KeyS') || k.has('ArrowDown')) y += 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    return { x, y };
  }

  // -1..1 up/down while flying: ▲ ▼ buttons, or Space / Shift (also R / F) on a keyboard
  flyAxis() {
    if (!this.enabled) return 0;
    const k = this.keys;
    const up = this.flyUpHeld || k.has('Space') || k.has('KeyR');
    const down = this.flyDownHeld || k.has('ShiftLeft') || k.has('ShiftRight') || k.has('KeyF');
    return (up ? 1 : 0) - (down ? 1 : 0);
  }

  consumeLook() {
    const l = { ...this.look };
    this.look.dx = 0; this.look.dy = 0;
    return l;
  }
  consumeZoom() { const z = this.zoom; this.zoom = 0; return z; }
  consumeJump() { const j = this.jumpPressed; this.jumpPressed = false; return j; }
  consumeAction() { const a = this.actionPressed; this.actionPressed = false; return a; }
}
