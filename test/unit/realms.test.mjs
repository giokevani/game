import test from 'node:test';
import assert from 'node:assert/strict';
import {REALMS,doorSpot} from '../../src/world/realms.js';
import {World} from '../../src/world/world.js';
import {Player} from '../../src/player/player.js';
import * as THREE from 'three';
test('six English realms have unique ids, safe doors and Space low gravity',()=>{assert.equal(new Set(REALMS.map(r=>r.id)).size,6);assert.deepEqual(REALMS.map(r=>r.name),['Space','Heaven','Hell','Candy Land','Underwater Kingdom','Ice Kingdom']);assert.ok(REALMS[0].gravity<30);for(let i=0;i<6;i++)assert.equal(doorSpot(i).z,40);});
test('realm physics uses its own floor and water level',()=>{const w=new World(new THREE.Scene(),{}, {height:()=>0,waterY:-100});const p=new Player(w,{root:new THREE.Group(),update(){}});p.pos.set(0,0,0);p.gravity=8;const input={getMove:()=>({x:0,y:0}),consumeJump:()=>true};p.update(.05,input,0);assert.ok(p.pos.y>.4);assert.equal(p.swimming,false);assert.equal(w.inWater(0,0),false);});
