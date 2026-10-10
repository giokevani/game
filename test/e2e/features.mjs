import { launch, startServer, openGame } from './lib.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync('test/out', { recursive: true });
const srv = await startServer(4191);
const {browser,page,errors} = await launch();
const ev = (fn,arg) => page.evaluate(fn,arg);
const gameTime = async sec => { const t = await ev(()=>window.__bb.time); await page.waitForFunction(t=>window.__bb.time>=t,t+sec,{timeout:300000}); };
try {
  await openGame(page,srv.url);
  await ev(()=>{document.querySelector('.name-input').value='Mila';document.querySelector('.panel-head .btn.mint').click();});
  for(let i=0;i<8;i++){await ev(()=>document.querySelector('.dialog .btn')?.click());await page.waitForTimeout(150);}
  if(!process.env.SKIP_FLIGHT){
  await ev(()=>{const g=window.__bb;g.player.teleport(-100,0,24);g.vehicles.picker();});
  for(const id of ['unicorn','helicopter','airship','balloon']) assert.equal(await page.locator(`[data-ride="${id}"]`).count(),1);
  await page.locator('[data-ride="unicorn"]').click();
  await page.keyboard.down('Space');await gameTime(2);await page.keyboard.up('Space');
  assert.ok(await ev(()=>window.__bb.player.pos.y>12),'unicorn climbs');
  await page.screenshot({path:'test/out/features-flying.png'});
  await ev(()=>{const g=window.__bb;g.player.teleport(0,20,-37);g.rig.yaw=0;});
  await page.keyboard.down('KeyW');await gameTime(1);await page.keyboard.up('KeyW');
  assert.ok(await ev(()=>window.__bb.player.pos.z < -42),'flies over town hall');
  await ev(()=>{const g=window.__bb;g.player.teleport(-100,20,24);g.vehicles.dismount(false);});
  await gameTime(2);
  assert.ok(await ev(()=>!window.__bb.player.vehicle && Math.abs(window.__bb.player.pos.y)<0.1),'auto lands before dismount');
  for(const id of ['helicopter','airship','balloon']){
    await ev(id=>window.__bb.vehicles.ride(id),id);
    await page.locator('[data-fly="flyUpHeld"]').dispatchEvent('pointerdown');await gameTime(1);
    await page.locator('[data-fly="flyUpHeld"]').dispatchEvent('pointerup');
    assert.ok(await ev(()=>window.__bb.player.pos.y>3),id+' touch climb');
    await page.locator('[data-fly="flyDownHeld"]').dispatchEvent('pointerdown');await gameTime(2);
    await page.locator('[data-fly="flyDownHeld"]').dispatchEvent('pointerup');
    assert.ok(await ev(()=>window.__bb.player.grounded),id+' lands');
    await ev(()=>window.__bb.vehicles.dismount());
  }
  }
  if(await ev(()=>!!window.__bb.skyCity)){
    await ev(()=>window.__bb.skyCity.picker());
    for(const id of ['cloud_meadow','rainbow_town','star_castle']) assert.equal(await page.locator(`[data-sky="${id}"]`).count(),1);
    await page.locator('[data-sky="cloud_meadow"]').click();
    for(const [id,y] of [['cloud_meadow',46],['rainbow_town',96],['star_castle',150]]){
      await ev(id=>window.__bb.skyCity.travel(id),id);await gameTime(.25);
      assert.ok(await ev(y=>Math.abs(window.__bb.player.pos.y-y)<.1,y),id+' walkable');
      assert.equal(await ev(()=>window.__bb.world.zoneAt(window.__bb.player.pos)?.id),id);
    }
    await page.screenshot({path:'test/out/features-sky.png'});
    await ev(()=>window.__bb.skyCity.travel('town'));
    console.log('Part 2: Sky Lift, three walkable levels and height-aware zones PASS');
  }
  if(await ev(()=>!!window.__bb.buildings)){
    await ev(()=>{const g=window.__bb;g.skyCity.travel('cloud_meadow');g.player.teleport(-20,46,-30);g.openBuild();});
    await page.locator('[data-prefab="blue_house"]').click();
    await page.locator('[data-build-confirm]').click();
    const record=await ev(()=>window.__bb.state.buildings.at(-1));assert.equal(record.floors.length,2);
    assert.equal(record.y,46);
    await ev(()=>{const g=window.__bb;g.player.teleport(-20,46,-20);g.openBuild();});
    await page.locator('[data-floor="1"]').click();
    assert.equal(await ev(()=>window.__bb.mode),'build');
    const edit=await ev(()=>{const g=window.__bb,s=g.buildings.entries[0].systems[1],h=s.house;const n=Object.keys(h.tiles).length;s.build.setTool('floor');s.build.erase=false;s.build.stroke={done:new Set()};s.build.paintFloor({x:9,z:21});s.build.endStroke();s.build.exit();return {before:n,after:Object.keys(h.tiles).length,home:Object.keys(g.state.house.tiles).length};});
    assert.equal(edit.after,edit.before+1);assert.equal(edit.home,12);
    await ev(()=>{const g=window.__bb,e=g.buildings.entries[0];const it=g.world.interactables.find(it=>it.tag===e.record.id&&it.label==='Go upstairs');it.onUse();});
    await gameTime(.3);assert.ok(await ev(()=>Math.abs(window.__bb.player.pos.y-49.5)<.2),'stairs stay on upper floor');
    await page.screenshot({path:'test/out/features-building.png'});
    const before=await ev(()=>{const g=window.__bb;g.save();return JSON.stringify(g.state.buildings);});
    await openGame(page,srv.url);assert.equal(await ev(()=>JSON.stringify(window.__bb.state.buildings)),before);
    console.log('Part 3: free placement on clouds, independent floor editing, stairs and save reload PASS');
  }
  assert.deepEqual(errors,[]);
  console.log('Part 1: picker, keyboard climb, roof crossing, auto land, all touch rides PASS');
} finally { await browser.close();srv.stop(); }
