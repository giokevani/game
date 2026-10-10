import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Player, MAX_FLY_Y } from '../../src/player/player.js';
function setup(){
 const w={groundAt:()=>0,resolve:()=>{},waterY:-.32};
 const p=new Player(w,{root:new THREE.Group(),update(){}});
 p.pos.set(0,0,0);p.vehicle={fly:true,speed:16,seatY:.9,climb:9};
 const i={getMove:()=>({x:0,y:0}),consumeJump:()=>false,flyAxis:()=>1};
 return {p,i,w};
}
test('flight climbs, hovers, descends and respects ceiling',()=>{
 const {p,i}=setup();for(let n=0;n<40;n++)p.update(.05,i,0);assert.ok(p.pos.y>15);
 i.flyAxis=()=>0;for(let n=0;n<80;n++)p.update(.05,i,0);assert.ok(Math.abs(p.vel.y)<.01);
 p.pos.y=MAX_FLY_Y; i.flyAxis=()=>1;p.update(.05,i,0);assert.equal(p.pos.y,MAX_FLY_Y);
 p.pos.y=15;i.flyAxis=()=>-1;for(let n=0;n<80;n++)p.update(.05,i,0);assert.equal(p.pos.y,0);assert.ok(p.grounded);
});
test('frozen flying player ignores climb and auto landing returns to surface',()=>{
 const {p,i,w}=setup();p.frozen=true;p.update(.05,i,0);assert.equal(p.pos.y,0);
 p.frozen=false;p.pos.y=80;p.vehicle.autoLand=true;w.groundAt=()=>46;
 for(let n=0;n<80;n++)p.update(.05,i,0);assert.equal(p.pos.y,46);assert.ok(p.grounded);
});
