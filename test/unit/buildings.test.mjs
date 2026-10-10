import test from 'node:test';
import assert from 'node:assert/strict';
import {prefab,PREFABS,placement} from '../../src/house/buildings.js';
import * as HM from '../../src/house/model.js';
import {FURN} from '../../src/data/furniture.js';
import {World} from '../../src/world/world.js';
import * as THREE from 'three';
import {HouseView} from '../../src/house/view.js';
test('every prefab is free-standing, has 1–3 floors and valid furniture',()=>{
 for(const def of PREFABS){const b=prefab(def.id);assert.ok(b.floors.length>=1&&b.floors.length<=3);for(const h of b.floors)for(const f of h.furniture){const copy={...h,furniture:h.furniture.filter(x=>x.uid!==f.uid)};assert.ok(HM.checkPlace(copy,FURN,FURN[f.id],f.x,f.z,f.r).ok,def.id+':'+f.id);}}
});
test('placement rejects overlap, water and steep terrain',()=>{
 const w={waterY:-.32,boxes:[],groundAt:()=>0};assert.equal(placement(w,[],500,0,-500),null);
 assert.ok(placement(w,[{realm:'home',x:500,y:0,z:-500}],500,0,-500));w.groundAt=()=>-2;assert.ok(placement(w,[],500,-2,-500));w.groundAt=x=>x/2;assert.ok(placement(w,[],500,250,-500));
});
test('building placement preserves story locations without blocking a different cloud height',()=>{
 const w={waterY:-100,boxes:[],groundAt:()=>46,interactables:[{adventure:true,x:500,y:46,z:-500}]};assert.match(placement(w,[],500,46,-500),/discoveries/);w.interactables[0].y=96;assert.equal(placement(w,[],500,46,-500),null);
 w.boxes=[{tag:'adventure',x1:495,x2:505,z1:-505,z2:-495,bot:46,top:53}];assert.match(placement(w,[],500,46,-500),/buildings/);
});
test('rebuilding one house leaves another house platforms and colliders intact',()=>{
 const scene=new THREE.Scene(),w=new World(scene,{}),a=new HouseView(scene,w,{origin:{x:0,y:46,z:0},tag:'a',fence:false}),b=new HouseView(scene,w,{origin:{x:100,y:96,z:0},tag:'b',fence:false});
 a.rebuild(HM.newHouse());b.rebuild(HM.newHouse());const n=w.boxes.filter(c=>c.tag==='b').length;a.rebuild(HM.newHouse());assert.equal(w.boxes.filter(c=>c.tag==='b').length,n);assert.equal(w.groundAt(114,24,97),96.25);assert.notEqual(a.uniforms,b.uniforms);
});
