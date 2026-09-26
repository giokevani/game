// Shared materials. Almost everything uses vertex colours so models merge well.
import * as THREE from 'three';

export const uniforms = {
  uTime: { value: 0 },
  uWind: { value: 1 },
  uNight: { value: 0 },
};

function addWind(shader, strength = 1) {
  shader.uniforms.uTime = uniforms.uTime;
  shader.uniforms.uWind = uniforms.uWind;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>
uniform float uTime; uniform float uWind;`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>
{
  vec4 wp = modelMatrix * vec4(position, 1.0);
  #ifdef USE_INSTANCING
    wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  #endif
  float h = max(0.0, position.y);
  float sway = sin(uTime * 1.7 + wp.x * 0.35 + wp.z * 0.27) * 0.5 + sin(uTime * 2.9 + wp.x * 0.8) * 0.25;
  float amt = ${strength.toFixed(3)} * uWind * h * h * 0.018;
  transformed.x += sway * amt;
  transformed.z += cos(uTime * 1.3 + wp.z * 0.4) * amt * 0.6;
}`);
}

// glow: emissive follows vertex colour, strength follows night factor
function addGlow(shader, dayGlow = 0.0) {
  shader.uniforms.uNight = uniforms.uNight;
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>
uniform float uNight;`)
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance = vColor.rgb * (${dayGlow.toFixed(3)} + uNight * 1.6);`);
}

export const M = {
  std: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0.0 }),
  gloss: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.05 }),
  metal: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.6 }),
  foliage: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 }),
  grass: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, side: THREE.DoubleSide }),
  glow: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0, emissive: 0xffffff }),
  glowAlways: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0, emissive: 0xffffff }),
  glass: new THREE.MeshStandardMaterial({ color: 0xcfefff, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.45, depthWrite: false }),
  unlit: new THREE.MeshBasicMaterial({ vertexColors: true }),
};

M.foliage.onBeforeCompile = (s) => addWind(s, 1);
M.foliage.customProgramCacheKey = () => 'foliage';
M.grass.onBeforeCompile = (s) => addWind(s, 9);
M.grass.customProgramCacheKey = () => 'grass';
M.glow.onBeforeCompile = (s) => addGlow(s, 0.0);
M.glow.customProgramCacheKey = () => 'glow';
M.glowAlways.onBeforeCompile = (s) => addGlow(s, 0.55);
M.glowAlways.customProgramCacheKey = () => 'glowAlways';

// cache of single-colour materials (used for UI previews etc.)
const colorMats = new Map();
export function colorMat(hex, o = {}) {
  const key = hex + JSON.stringify(o);
  let m = colorMats.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.7, ...o });
    colorMats.set(key, m);
  }
  return m;
}

// Canvas texture helper
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function mesh(geo, mat, o = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = o.cast ?? true;
  m.receiveShadow = o.receive ?? true;
  if (o.x !== undefined) m.position.set(o.x, o.y || 0, o.z || 0);
  if (o.ry) m.rotation.y = o.ry;
  return m;
}
