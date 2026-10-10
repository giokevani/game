import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPOTS } from '../../src/world/collectibles.js';
import { BUILDINGS, WORLD, shoreZ, isBlocked, zoneAt, ZONES, HOME_PLOT } from '../../src/data/map.js';
import { terrainHeight } from '../../src/world/terrain.js';

test('40 shells, none inside a building', () => {
  assert.equal(SPOTS.length, 40);
  for (const [x0, z0, y] of SPOTS) {
    const x = x0 === 'b' ? z0 : x0;
    const z = x0 === 'b' ? shoreZ(x) - 7 : z0;
    assert.ok(x >= WORLD.minX && x <= WORLD.maxX && z >= WORLD.minZ && z <= WORLD.maxZ, `shell out of bounds ${x},${z}`);
    for (const b of BUILDINGS) {
      if (b.kind === 'cave' || b.kind === 'lighthouse') continue;
      const rot = Math.abs(Math.sin(b.face)) > 0.5;
      const hw = (rot ? b.d : b.w) / 2, hd = (rot ? b.w : b.d) / 2;
      assert.ok(!(Math.abs(x - b.x) < hw && Math.abs(z - b.z) < hd), `shell ${x},${z} inside ${b.id}`);
    }
    if (y === undefined) assert.ok(terrainHeight(x, z) > -0.9, `shell ${x},${z} under water`);
  }
});

test('zones are where the map says', () => {
  for (const zn of ZONES.filter((z) => z.id !== 'sky' && z.minY === undefined)) assert.equal(zoneAt(zn.x, zn.z, 0)?.id, zn.id);
  assert.equal(zoneAt(0, -104, 80)?.id, 'sky');
});

test('town is flat where people walk, sea is deep', () => {
  assert.ok(Math.abs(terrainHeight(0, -10)) < 0.01);
  assert.ok(Math.abs(terrainHeight(HOME_PLOT.cx, HOME_PLOT.front - 10)) < 0.01);
  assert.ok(terrainHeight(0, shoreZ(0) + 20) < -2);
  assert.ok(isBlocked(0, -10), 'plaza is not for trees');
});
