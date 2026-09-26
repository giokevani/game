import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as HM from '../../src/house/model.js';
import { FURN, FURNITURE } from '../../src/data/furniture.js';

test('starter house: every piece of furniture is in a valid spot', () => {
  const h = HM.newHouse();
  for (const f of h.furniture) {
    const it = FURN[f.id];
    assert.ok(it, f.id);
    const r = HM.checkPlace(h, FURN, it, f.x, f.z, f.r, f.uid);
    assert.ok(r.ok, `${f.id} invalid: ${r.reason}`);
    assert.ok(Math.abs((r.y || 0) - (f.y || 0)) < 0.01, `${f.id} height`);
  }
  assert.equal(HM.invalidFurniture(h, FURN).length, 0);
});

test('outside walls are automatic, inside walls need both tiles', () => {
  const h = HM.newHouse();
  const walls = HM.allWallEdges(h);
  assert.ok(walls.some((w) => w.exterior));
  assert.ok(walls.some((w) => w.interior));
  const e = HM.edgeInfo(h, 'h,6,13');
  assert.equal(e.exterior, true);
  assert.equal(e.open, 'door_wood');
  // add a tile next to the house: the wall between becomes open
  HM.setTile(h, 4, 11, 'fl_oak');
  assert.equal(HM.edgeInfo(h, 'v,5,11').wall, false);
  HM.removeTile(h, 4, 11);
  assert.equal(HM.edgeInfo(h, 'v,5,11').exterior, true);
});

test('rooms, painting and arches', () => {
  const h = HM.newHouse();
  assert.equal(HM.rooms(h).length, 1, 'arch joins the bedroom');
  h.open['v,8,11'] = 'door_wood';
  assert.equal(HM.rooms(h).length, 2, 'a door separates rooms');
  const n = HM.paintRoomWalls(h, 5, 10, 'wp_mint');
  assert.ok(n > 0);
  assert.equal(h.tiles['5,10'].w[0], 'wp_mint');
  assert.notEqual(h.tiles['8,10'].w[0], 'wp_mint', 'other room untouched');
  assert.equal(HM.paintRoomFloor(h, 8, 10, 'fl_marble'), 2);
});

test('placement rules: walls, overlaps, surfaces, plot edge', () => {
  const h = HM.newHouse();
  const sofa = FURN.sofa;
  assert.equal(HM.checkPlace(h, FURN, sofa, 10.0, 21, 0).ok, false, 'crosses the outside wall');
  assert.equal(HM.checkPlace(h, FURN, sofa, 12, 20.75, 0).ok, false, 'on top of the existing sofa');
  assert.equal(HM.checkPlace(h, FURN, sofa, 2, 2, 0).ok, false, 'outside the small plot');
  assert.equal(HM.checkPlace(h, FURN, FURN.flower_bed, 14, 16, 0).ok, true, 'garden on the grass');
  const vase = HM.checkPlace(h, FURN, FURN.vase_flowers, 12, 22.75, 0);
  assert.ok(vase.ok && vase.y > 0.4, 'vase sits on the coffee table');
  assert.equal(HM.checkPlace(h, FURN, FURN.microwave, 13, 18, 0).ok, false, 'surface items need a table');
  assert.equal(HM.snapToWall(h, FURN.painting_flower, 10.2, 23).ok, false, 'no paintings on windows');
  const wall = HM.snapToWall(h, FURN.painting_flower, 10.2, 21);
  assert.ok(wall.ok, 'painting snaps to the west wall');
  assert.equal(wall.r, 1, 'faces into the room');
});

test('every furniture item fits somewhere on the biggest plot', () => {
  const h = HM.newHouse();
  h.size = 14;
  h.furniture = [];
  for (const it of FURNITURE) {
    if (it.place === 'wall') {
      assert.ok(HM.snapToWall(h, it, 10.2, 21).ok, it.id);
      continue;
    }
    if (it.place === 'surface') {
      HM.addFurniture(h, 'dining_table', 4, 4, 0, 0);
      assert.ok(HM.checkPlace(h, FURN, it, 4, 4, 0).ok, it.id);
      h.furniture = [];
      continue;
    }
    let ok = false;
    for (let x = 1; x < 27 && !ok; x += 0.5) for (let z = 1; z < 18 && !ok; z += 0.5) {
      const p = HM.snapPos(it, x, z, 0);
      if (HM.checkPlace(h, FURN, it, p.x, p.z, 0).ok) ok = true;
    }
    assert.ok(ok, `${it.id} has nowhere to go`);
  }
});

test('home rating: starter is 1 star, bigger homes score more', () => {
  const h = HM.newHouse();
  const r = HM.homeRating(h, FURN);
  assert.equal(r.stars, 1);
  for (let i = 1; i < HM.STAR_POINTS.length; i++) assert.ok(HM.STAR_POINTS[i] > HM.STAR_POINTS[i - 1]);
  h.size = 14;
  for (let i = 1; i < 13; i++) for (let j = 1; j < 13; j++) HM.setTile(h, i, j, 'fl_oak');
  assert.ok(HM.homeRating(h, FURN).score > r.score);
  // the maximum possible score reaches 5 stars
  const max = 200 + 160 + 300 + 240 + 120 + 80 + 100 + 60 + 60;
  assert.ok(max >= HM.STAR_POINTS[5]);
});

test('plot sizes grow from the street side', () => {
  for (const s of HM.PLOT_SIZES) {
    const r = HM.plotRange(s);
    assert.equal(r.i1 - r.i0, s);
    assert.equal(r.j1, HM.MAXP);
  }
  const h = HM.newHouse();
  for (const k of Object.keys(h.tiles)) {
    const [i, j] = k.split(',').map(Number);
    assert.ok(HM.inPlot(h, i, j), 'starter house inside the first plot');
  }
});
