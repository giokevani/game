import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createRenderer(container, quality) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', stencil: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = quality.shadows;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(55, 1, 0.2, 900);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.dpr));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // wider view in portrait so the world doesn't feel cramped
    camera.fov = w < h ? 70 : 55;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 250));
  resize();

  return { renderer, scene, camera, resize };
}

// Adaptive quality: watches frame times and steps resolution down if needed.
export class QualityManager {
  constructor(settings) {
    this.levels = [
      { name: 'high', dpr: 2, shadows: true, shadowSize: 2048, grass: 1 },
      { name: 'medium', dpr: 1.6, shadows: true, shadowSize: 1024, grass: 0.7 },
      { name: 'low', dpr: 1.25, shadows: false, shadowSize: 512, grass: 0.4 },
    ];
    const start = settings.quality === 'auto' ? 0 : Math.max(0, this.levels.findIndex((l) => l.name === settings.quality));
    this.index = start;
    this.auto = settings.quality === 'auto';
    this.frames = 0;
    this.time = 0;
    this.fps = 60;
    this.onChange = null;
    this.warmup = 4;
  }
  get level() { return this.levels[this.index]; }
  get dpr() { return this.level.dpr; }
  get shadows() { return this.level.shadows; }
  tick(dt) {
    this.frames++;
    this.time += dt;
    if (this.time >= 2.5) {
      this.fps = this.frames / this.time;
      this.frames = 0;
      this.time = 0;
      if (this.warmup > 0) { this.warmup--; return; }
      if (this.auto && this.fps < 40 && this.index < this.levels.length - 1) {
        this.index++;
        this.warmup = 2;
        this.onChange?.(this.level);
      }
    }
  }
  set(name) {
    this.auto = name === 'auto';
    const i = this.levels.findIndex((l) => l.name === name);
    this.index = i < 0 ? 0 : i;
    this.warmup = 3;
    this.onChange?.(this.level);
  }
}
