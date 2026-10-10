import test from 'node:test';
import assert from 'node:assert/strict';
import { SKY_LEVELS, zoneAt } from '../../src/data/map.js';
import { Player } from '../../src/player/player.js';
import { World } from '../../src/world/world.js';
import * as THREE from 'three';
test('three distinct cloud heights have landing surfaces and height-aware zones',()=>{
 const w=new World(new THREE.Scene(),{});
 for(const l of SKY_LEVELS){w.addPlatform({x:l.x,z:l.z,r:l.r,y:l.y});assert.equal(w.groundAt(l.x,l.z,l.y+1),l.y);assert.equal(zoneAt(l.x,l.z,l.y).id,l.id);assert.notEqual(zoneAt(l.x,l.z,0)?.id,l.id);}
});
test('elevated walls do not block players on the ground and interactions respect floor height',()=>{
 const w=new World(new THREE.Scene(),{});w.addBox(-2,-2,2,2,{bot:46,top:50});
 const p=new THREE.Vector3(0,0,0);w.resolve(p,.42,0);assert.equal(p.x,0);assert.equal(p.z,0);
 w.addInteract({x:0,z:0,y:46,dy:1,label:'Sky Lift'});assert.equal(w.nearestInteract(p),null);p.y=46;assert.equal(w.nearestInteract(p).label,'Sky Lift');
});

test('ground fast travel stays below cloud platforms',()=>{const w=new World(new THREE.Scene(),{});w.addPlatform({x:0,z:0,r:30,y:46});const p=new Player(w,{root:new THREE.Group(),update(){}});p.teleport(0,undefined,0);assert.equal(p.pos.y,0);p.teleport(0,46,0);assert.equal(p.pos.y,46);});
