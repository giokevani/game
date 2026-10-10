import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launch,startServer,openGame} from './lib.mjs';
import {STORIES,SKY_SECRETS} from '../../src/adventures/story.js';
fs.mkdirSync('test/out',{recursive:true});
const srv=process.env.URL?{url:process.env.URL,stop(){}}:await startServer(4192);
const {browser,page,errors}=await launch();
const ev=(fn,arg)=>page.evaluate(fn,arg);
async function action(){await page.keyboard.press('KeyE');await page.waitForFunction(()=>!window.__bb.input.actionPressed,null,{timeout:90000,polling:50});await page.waitForTimeout(150);}
async function dismiss(){for(let i=0;i<4;i++){if(!await page.locator('.dialog .btn').count())break;await page.locator('.dialog .btn').first().click();await page.waitForTimeout(150);}}
try{
 await openGame(page,srv.url);
 await ev(()=>{document.querySelector('.name-input').value='Mila';document.querySelector('.panel-head .btn.mint').click();});await page.waitForTimeout(900);await dismiss();
 await ev(()=>window.__bb.openQuests());assert.equal(await page.locator('[data-story]').count(),6);await page.waitForTimeout(600);await page.screenshot({path:'test/out/adventure-journal.png'});
 assert.equal(await page.locator('[data-quick-visit]').count(),6);await page.locator('[data-quick-visit="space"]').click();
 for(const s of STORIES){
  await ev(id=>window.__bb.magicDoors.travel(id),s.id);await page.waitForTimeout(300);
  await ev(()=>{const g=window.__bb;g.player.teleport(0,0,-14.8);g.rig.snap(g.player.pos);});await action();
  assert.match(await page.locator('.dialog .who').innerText(),new RegExp(s.name));await dismiss();
  for(let i=0;i<3;i++){
   await ev(([x,z])=>{const g=window.__bb;g.player.teleport(x,0,z);g.rig.snap(g.player.pos);},s.spots[i]);await action();
   assert.ok(await ev(key=>window.__bb.state.adventures.found.includes(key),`${s.id}:${i}`));
   assert.equal(await ev(()=>window.__bb.world.nearestInteract(window.__bb.player.pos)?.label||null),null,'collected find no longer prompts');
  }
  await ev(()=>{const g=window.__bb;g.player.teleport(0,0,-14.8);g.rig.snap(g.player.pos);});await action();await dismiss();
  assert.ok(await ev(id=>window.__bb.state.adventures.helped.includes(id),s.id));
  const paid=await ev(()=>window.__bb.state.player.coins);await action();await dismiss();assert.equal(await ev(()=>window.__bb.state.player.coins),paid,'friend pays only once');
  const budget=await ev(()=>{const g=window.__bb;g.renderer.render(g.scene,g.camera);return {calls:g.renderer.info.render.calls,triangles:g.renderer.info.render.triangles,items:g.world.interactables.length};});assert.ok(budget.calls<260&&budget.triangles<1100000);
  await page.waitForTimeout(2400);await page.screenshot({path:`test/out/adventure-${s.id}.png`});console.log('PASS',s.title,'dialogue, finds, reward and budget',JSON.stringify(budget));
 }
 await ev(()=>window.__bb.magicDoors.travel('home'));
 for(const s of SKY_SECRETS){await ev(({x,y,z})=>{const g=window.__bb;g.player.teleport(x,y,z);g.rig.snap(g.player.pos);},s);await action();assert.ok(await ev(id=>window.__bb.state.adventures.secrets.includes(id),s.id));await dismiss();}
 assert.ok(await ev(()=>window.__bb.adventures.crown.visible));
 const before=await ev(()=>{const g=window.__bb;g.save();return JSON.stringify(g.state.adventures);});await openGame(page,srv.url);assert.equal(await ev(()=>JSON.stringify(window.__bb.state.adventures)),before);
 await ev(()=>window.__bb.openQuests());assert.equal(await page.locator('.adventure-postcard').count(),3);await page.waitForTimeout(600);await page.screenshot({path:'test/out/adventure-complete.png'});
 await page.getByRole('button',{name:'Town tasks',exact:true}).click();assert.ok(await page.locator('.panel').count(),'original town tasks still available');
 assert.deepEqual(errors,[]);console.log('PASS all six stories, three postcards, constellation, persistence and original tasks; no console errors');
}finally{await browser.close();srv.stop();}
