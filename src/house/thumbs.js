// Renders small preview pictures of furniture (and pets) for shop cards.
import * as THREE from 'three';
import { itemGroup } from './view.js';
import { FURN } from '../data/furniture.js';

let r = null, scene, cam;
const cache = new Map();
const queue = [];
let busy = false;

function setup() {
  const canvas = document.createElement('canvas');
  canvas.width = 160; canvas.height = 160;
  r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1);
  r.setSize(160, 160, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc0d8, 1.9));
  const d = new THREE.DirectionalLight(0xffffff, 2.0);
  d.position.set(3, 5, 4);
  scene.add(d);
  cam = new THREE.PerspectiveCamera(30, 1, 0.05, 100);
}

export function renderObject(obj, key) {
  if (cache.has(key)) return cache.get(key);
  if (!r) setup();
  scene.add(obj);
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const rad = Math.max(size.x, size.y, size.z) * 0.62 + 0.05;
  const dist = rad / Math.tan((cam.fov * Math.PI) / 360) * 1.05;
  cam.position.set(center.x + dist * 0.55, center.y + dist * 0.45, center.z + dist * 0.7);
  cam.lookAt(center);
  r.render(scene, cam);
  const url = r.domElement.toDataURL('image/png');
  scene.remove(obj);
  cache.set(key, url);
  return url;
}

export function furnitureThumb(id, c) {
  const key = 'f:' + id + ':' + (c ?? FURN[id].c);
  if (cache.has(key)) return cache.get(key);
  return renderObject(itemGroup(id, c ?? FURN[id].c), key);
}

// fill <img> elements lazily a few per frame so menus open instantly
export function lazyThumb(img, make, key) {
  if (cache.has(key)) { img.src = cache.get(key); return; }
  queue.push({ img, make, key });
  if (!busy) pump();
}

function pump() {
  busy = true;
  requestAnimationFrame(() => {
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < 12) {
      const { img, make, key } = queue.shift();
      if (!img.isConnected) continue;
      try { img.src = make(); } catch (e) { console.warn('thumb failed', key, e); }
    }
    if (queue.length) pump(); else busy = false;
  });
}
