import test from 'node:test';
import assert from 'node:assert/strict';
import {chunkGeometry,townChunk} from '../../src/world/endless.js';
import {terrainHeight} from '../../src/world/terrain.js';
import {World} from '../../src/world/world.js';
import * as THREE from 'three';
test('endless terrain stays bounded, chunks match at all seam vertices',()=>{
 for(const [cx,cz] of [[2,-2],[-5,4],[100,-100]]){const a=chunkGeometry(cx,cz),b=chunkGeometry(cx+1,cz),pa=a.attributes.position,pb=b.attributes.position;for(let row=0;row<=32;row++){assert.equal(pa.getY(row*33+32),pb.getY(row*33));for(let k=0;k<3;k++)assert.ok(Math.abs(a.attributes.normal.array[(row*33+32)*3+k]-b.attributes.normal.array[row*33*3+k])<1e-5);}a.dispose();b.dispose();}
 for(let n=-20000;n<=20000;n+=80)assert.ok(Math.abs(terrainHeight(n,-500))<10);
 assert.ok(townChunk(0,0));assert.ok(!townChunk(2,0));
});
test('unloading colliders removes grid and registry references',()=>{const w=new World(new THREE.Scene(),{}),c=w.addCircle(10,10,.5);w.removeCollider(c);assert.equal(w.circles.length,0);assert.ok([...w.grid.values()].every(list=>!list.includes(c)));});
