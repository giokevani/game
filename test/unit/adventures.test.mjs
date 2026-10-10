import test from 'node:test';
import assert from 'node:assert/strict';
import {STORIES,SKY_SECRETS,adventureState,collect,complete,nextTarget,foundCount,compassDirection} from '../../src/adventures/story.js';
import {migrate} from '../../src/core/state.js';
test('all world stories have reachable distinct finds and useful clues',()=>{
 assert.equal(new Set(STORIES.map(s=>s.id)).size,6);
 for(const s of STORIES){assert.equal(s.items.length,3);assert.equal(new Set(s.spots.map(p=>p.join(','))).size,3);assert.equal(s.hints.length,3);assert.ok(s.spots.every(([x,z])=>Math.abs(x)<180&&Math.abs(z)<180));}
 assert.equal(new Set(SKY_SECRETS.map(s=>s.y)).size,3);
});
test('discoveries and friend rewards cannot be repeated or completed early',()=>{
 const a=adventureState({});assert.equal(complete(a,'space'),false);assert.equal(collect(a,'fake',0),false);assert.equal(collect(a,'space',9),false);
 for(let i=0;i<3;i++){assert.equal(collect(a,'space',i),true);assert.equal(collect(a,'space',i),false);assert.equal(foundCount(a,'space'),i+1);}
 assert.equal(nextTarget(a,'space').name,'Nova');assert.equal(complete(a,'space'),true);assert.equal(complete(a,'space'),false);assert.equal(nextTarget(a,'space'),null);assert.equal(a.helped.length,1);
});
test('old saves migrate safely, and a completed adventure survives save migration',()=>{
 const a=adventureState(migrate({player:{name:'Jeva'}}));assert.equal(a.tracked,'space');const state={adventures:a};for(let i=0;i<3;i++)collect(a,'candy',i);complete(a,'candy');a.secrets.push('cloud_postcard');
 const copy=adventureState(migrate(JSON.parse(JSON.stringify(state))));assert.deepEqual(copy,a);assert.equal(complete(copy,'candy'),false);assert.equal(nextTarget(copy,'ice').name,'Frost crystal');
});
test('the compass follows the camera, including after a quarter turn',()=>{assert.equal(compassDirection(0,-10,0),'↑');assert.equal(compassDirection(10,0,0),'→');assert.equal(compassDirection(-10,0,0),'←');assert.equal(compassDirection(0,10,0),'↓');assert.equal(compassDirection(-10,0,Math.PI/2),'↑');assert.equal(compassDirection(0,-10,Math.PI/2),'→');assert.equal(compassDirection(1,1,0),'✨');});
