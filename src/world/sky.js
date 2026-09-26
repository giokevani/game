// Sky dome, sun/moon lighting, clouds, stars and the day/night cycle.
import * as THREE from 'three';
import { Builder } from '../engine/builder.js';
import { uniforms } from '../engine/materials.js';

const C = (h) => new THREE.Color(h);

// key frames over the day (t: 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset)
const KEYS = [
  { t: 0.0, top: C('#141a44'), hor: C('#343a78'), sun: C('#8fa6ff'), sunI: 0.3, hemiSky: C('#5a64b0'), hemiGround: C('#2b3355'), hemiI: 0.42, fog: C('#2e3266'), night: 1 },
  { t: 0.2, top: C('#2a2d66'), hor: C('#8a6fa8'), sun: C('#ffb38a'), sunI: 0.4, hemiSky: C('#8a7fc0'), hemiGround: C('#4a4666'), hemiI: 0.7, fog: C('#7c6a9e'), night: 0.8 },
  { t: 0.27, top: C('#6fb3ff'), hor: C('#ffc6a8'), sun: C('#ffc98f'), sunI: 1.6, hemiSky: C('#ffd9c4'), hemiGround: C('#9fc98a'), hemiI: 1.1, fog: C('#ffd6c4'), night: 0.1 },
  { t: 0.36, top: C('#5aaeff'), hor: C('#c9ecff'), sun: C('#fff3dc'), sunI: 2.5, hemiSky: C('#d6ecff'), hemiGround: C('#a6d08e'), hemiI: 1.25, fog: C('#d3ecfb'), night: 0 },
  { t: 0.64, top: C('#5aaeff'), hor: C('#d4efff'), sun: C('#fff1d6'), sunI: 2.5, hemiSky: C('#d6ecff'), hemiGround: C('#a6d08e'), hemiI: 1.25, fog: C('#d6eefc'), night: 0 },
  { t: 0.73, top: C('#7f8fe8'), hor: C('#ffb48f'), sun: C('#ffae7a'), sunI: 1.7, hemiSky: C('#ffc3b0'), hemiGround: C('#b3a07a'), hemiI: 1.05, fog: C('#ffc0a8'), night: 0.15 },
  { t: 0.8, top: C('#3a3a7e'), hor: C('#c77aa6'), sun: C('#ff9aa8'), sunI: 0.6, hemiSky: C('#9a7ab8'), hemiGround: C('#4c4466'), hemiI: 0.75, fog: C('#9c6f9e'), night: 0.75 },
  { t: 0.88, top: C('#141a44'), hor: C('#343a78'), sun: C('#8fa6ff'), sunI: 0.3, hemiSky: C('#5a64b0'), hemiGround: C('#2b3355'), hemiI: 0.42, fog: C('#2e3266'), night: 1 },
  { t: 1.0, top: C('#141a44'), hor: C('#343a78'), sun: C('#8fa6ff'), sunI: 0.3, hemiSky: C('#5a64b0'), hemiGround: C('#2b3355'), hemiI: 0.42, fog: C('#2e3266'), night: 1 },
];

function sample(t) {
  let a = KEYS[0], b = KEYS[1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (t >= KEYS[i].t && t <= KEYS[i + 1].t) { a = KEYS[i]; b = KEYS[i + 1]; break; }
  }
  const f = (t - a.t) / Math.max(1e-5, b.t - a.t);
  const s = f * f * (3 - 2 * f);
  const out = {};
  for (const k of Object.keys(a)) {
    if (k === 't') continue;
    out[k] = a[k].isColor ? a[k].clone().lerp(b[k], s) : a[k] + (b[k] - a[k]) * s;
  }
  return out;
}

const skyVert = `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}`;
const skyFrag = `
uniform vec3 topColor; uniform vec3 horColor; uniform vec3 sunDir; uniform vec3 sunColor; uniform float night; uniform float uTime; uniform vec3 moonDir;
varying vec3 vDir;
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y, -0.2, 1.0);
  float g = pow(max(h, 0.0), 0.55);
  vec3 col = mix(horColor, topColor, g);
  col = mix(col, horColor * 0.92, smoothstep(0.0, -0.2, h));
  float sd = max(dot(d, normalize(sunDir)), 0.0);
  col += sunColor * (pow(sd, 700.0) * 3.0 + pow(sd, 18.0) * 0.35 + pow(sd, 3.0) * 0.12) * (1.0 - night * 0.8);
  // moon
  float md = max(dot(d, normalize(moonDir)), 0.0);
  col += vec3(0.95, 0.95, 1.0) * (smoothstep(0.9993, 0.9996, md) * 1.2 + pow(md, 60.0) * 0.15) * night;
  // stars
  if (night > 0.01 && d.y > 0.0) {
    vec3 sp = floor(d * 220.0);
    float s = hash(sp);
    float tw = 0.6 + 0.4 * sin(uTime * 2.0 + s * 40.0);
    col += vec3(1.0, 0.95, 0.9) * step(0.9965, s) * tw * night * smoothstep(0.0, 0.25, d.y);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export class Sky {
  constructor(scene) {
    this.scene = scene;
    this.t = 0.34; // start in the morning
    this.dayLength = 20 * 60; // seconds per full day
    this.paused = false;

    this.uniforms = {
      topColor: { value: new THREE.Color() },
      horColor: { value: new THREE.Color() },
      sunDir: { value: new THREE.Vector3(0, 1, 0) },
      moonDir: { value: new THREE.Vector3(0, 1, 0) },
      sunColor: { value: new THREE.Color() },
      night: uniforms.uNight,
      uTime: uniforms.uTime,
    };
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(500, 32, 16),
      new THREE.ShaderMaterial({ uniforms: this.uniforms, vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false, fog: false })
    );
    dome.renderOrder = -10;
    dome.frustumCulled = false;
    this.dome = dome;
    scene.add(dome);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x88aa77, 1.2);
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xffffff, 2.5);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -34; sc.right = 34; sc.top = 34; sc.bottom = -34; sc.near = 1; sc.far = 160;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.03;
    this.sun.shadow.radius = 3;
    scene.add(this.sun);
    scene.add(this.sun.target);

    scene.fog = new THREE.Fog(0xd3ecfb, 90, 330);

    this.clouds = this.makeClouds();
    scene.add(this.clouds);
    this.state = sample(this.t);
    this.focus = new THREE.Vector3();
    this.rain = 0;
  }

  makeClouds() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.35, flatShading: false, fog: false });
    this.cloudMat = mat;
    const rnd = (a, b) => a + Math.random() * (b - a);
    for (let i = 0; i < 16; i++) {
      const b = new Builder();
      const n = 4 + Math.floor(Math.random() * 4);
      for (let k = 0; k < n; k++) {
        const r = rnd(4, 8);
        b.ico(r, '#ffffff', (k - n / 2) * rnd(4, 6), rnd(-1, 2), rnd(-3, 3), { detail: 2, sy: 0.7 });
      }
      const m = new THREE.Mesh(b.build({ ao: 0 }), mat);
      const ang = Math.random() * Math.PI * 2;
      const dist = rnd(160, 300);
      m.position.set(Math.cos(ang) * dist, rnd(70, 110), Math.sin(ang) * dist);
      m.userData = { ang, dist, speed: rnd(0.002, 0.006) };
      m.rotation.y = Math.random() * Math.PI;
      group.add(m);
    }
    return group;
  }

  get hour() { return (this.t * 24) % 24; }
  get isNight() { return this.state.night > 0.5; }

  setTime(t) { this.t = ((t % 1) + 1) % 1; }

  update(dt, focus) {
    if (!this.paused) this.t = (this.t + dt / this.dayLength) % 1;
    const s = sample(this.t);
    this.state = s;
    const ang = (this.t - 0.25) * Math.PI * 2; // sunrise at 0.25
    const sunDir = new THREE.Vector3(Math.cos(ang) * 0.8, Math.sin(ang), 0.45).normalize();
    const moonDir = sunDir.clone().multiplyScalar(-1);
    moonDir.y = Math.abs(moonDir.y) * 0.8 + 0.2;
    moonDir.normalize();
    this.uniforms.sunDir.value.copy(sunDir);
    this.uniforms.moonDir.value.copy(moonDir);

    const rainDim = 1 - this.rain * 0.45;
    const grey = new THREE.Color('#a9b2c4');
    this.uniforms.topColor.value.copy(s.top).lerp(grey, this.rain * 0.6);
    this.uniforms.horColor.value.copy(s.hor).lerp(grey, this.rain * 0.5);
    this.uniforms.sunColor.value.copy(s.sun);
    uniforms.uNight.value = s.night;

    // light comes from the sun by day and the moon by night
    const lightDir = sunDir.y > -0.05 ? sunDir : moonDir;
    this.focus.copy(focus);
    this.sun.position.copy(this.focus).addScaledVector(lightDir, 80);
    this.sun.target.position.copy(this.focus);
    this.sun.color.copy(s.sun);
    this.sun.intensity = s.sunI * rainDim;
    this.hemi.color.copy(s.hemiSky);
    this.hemi.groundColor.copy(s.hemiGround);
    this.hemi.intensity = s.hemiI * (1 - this.rain * 0.2);
    this.scene.fog.color.copy(s.fog).lerp(grey, this.rain * 0.5);
    this.scene.fog.near = 90 - this.rain * 50;
    this.scene.fog.far = 330 - this.rain * 150;
    this.scene.environmentIntensity = 0.15 + 0.25 * (1 - s.night);

    this.cloudMat.emissiveIntensity = 0.1 + 0.35 * (1 - s.night);
    this.cloudMat.color.copy(s.hor).lerp(new THREE.Color('#ffffff'), 0.6).lerp(grey, this.rain * 0.7);

    for (const c of this.clouds.children) {
      c.userData.ang += c.userData.speed * dt;
      c.position.x = Math.cos(c.userData.ang) * c.userData.dist + focus.x * 0.5;
      c.position.z = Math.sin(c.userData.ang) * c.userData.dist + focus.z * 0.5;
    }
    this.dome.position.copy(focus);
  }

  setShadowSize(size, enabled) {
    this.sun.castShadow = enabled;
    if (this.sun.shadow.mapSize.x !== size) {
      this.sun.shadow.mapSize.set(size, size);
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null;
    }
  }
}
