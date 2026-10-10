import * as THREE from 'three';
import {Builder} from '../engine/builder.js';
import * as UI from '../ui/ui.js';
import {STORIES,SKY_SECRETS,adventureState,collect,complete,foundCount,nextTarget,compassDirection} from './story.js';
import {friend,label,landmarks,model} from './scenery.js';

export class Adventures {
 init(g){
  this.game=g;g.adventures=this;this.state=adventureState(g.state);this.views=new Map();this.lastRealm=null;
  const oldTasks=g.openQuests;g.openQuests=()=>this.journal(oldTasks);g.openAdventures=()=>this.journal(oldTasks);
  const ring=new Builder();ring.torus(1.7,.08,'#ffd45e',0,.12,0,{rx:Math.PI/2,ts:24});ring.cone(.35,.7,'#ffd45e',0,2,0,{seg:4});
  this.guide=new THREE.Mesh(ring.build({ao:0}),new THREE.MeshBasicMaterial({vertexColors:true}));this.guide.visible=false;
  this.compass=UI.h('div',{class:'adventure-compass',style:{display:'none'}});UI.root().append(this.compass);
  this.buildSecrets(g);
 }
 attach(id){
  if(id==='home'||this.views.has(id))return;
  const g=this.game,s=STORIES.find(s=>s.id===id);if(!s)return;
  const scene=g.scene,world=g.world,v={friend:friend(s,scene),name:label(scene,s.name,0,3.7,-17),items:[],beacon:null,...landmarks(s,scene)};
  // Keep the story destinations and their approach clear of random decoration.
  const destinations=[[0,-17],...s.spots];
  for(const c of [...world.circles])if(destinations.some(([x,z])=>Math.hypot(x-c.x,z-c.z)<4))world.removeCollider(c);
  world.addCircle(0,-17,.65,{bot:0,top:2.8,tag:'adventure'});
  world.addInteract({x:0,y:0,z:-14.8,r:3,dy:2,adventure:true,label:`Talk to ${s.name}`,icon:s.face,onUse:()=>this.talk(s)});
  s.spots.forEach(([x,z],i)=>{
   const b=new Builder();b.ico(.55,s.color,0,0,0,{detail:0});b.torus(.85,.08,'#fff4e6',0,0,0,{rx:Math.PI/2,ts:12});const m=model(b,scene);m.position.set(x,1,z);v.items.push(m);
   world.addInteract({x,y:0,z,r:2.4,dy:2,adventure:true,label:`Find ${s.items[i]}`,icon:'✨',tag:`adventure:${id}:${i}`,enabled:()=>!this.state.found.includes(`${id}:${i}`),onUse:()=>this.find(s,i)});
  });
  const b=new Builder();b.cyl(1.5,1.8,.4,'#fff4e6',0,0,-30);b.cyl(.3,.4,4,s.color,0,.4,-30);b.torus(1,.18,s.color,0,5,-30,{rx:Math.PI/2});v.beacon=model(b,scene);
  v.light=new THREE.Mesh(new THREE.SphereGeometry(.65,12,8),new THREE.MeshBasicMaterial({color:s.color}));v.light.position.set(0,5,-30);scene.add(v.light);
  const boxes={space:[[-47,-56,-37,-48],[32,-57,44,-46]],hell:[[-48,-55,-36,-43],[35,-52,45,-44]],candy:[[-47,-52,-37,-44]],underwater:[[29,-51,51,-44]],ice:[[-46,-53,-38,-46],[34,-52,46,-49]]};
  for(const [x1,z1,x2,z2] of boxes[id]||[])world.addBox(x1,z1,x2,z2,{bot:0,top:12,tag:'adventure'});
  this.views.set(id,v);this.refresh(id);
 }
 refresh(id){const v=this.views.get(id);if(!v)return;v.items.forEach((m,i)=>{m.visible=!this.state.found.includes(`${id}:${i}`);});v.light.visible=this.state.helped.includes(id);
 }
 find(s,i){if(!collect(this.state,s.id,i))return;this.refresh(s.id);this.game.reward(30,10,'discovery');this.game.fx.burst(this.game.player.pos,'sparkle',{n:24});this.game.audio?.play('sparkle');UI.toast(`${s.items[i]} · ${foundCount(this.state,s.id)}/3`,{icon:'✨'});this.game.save();}
 async talk(s){
  if(!this.state.met.includes(s.id)){this.state.met.push(s.id);this.game.save();}
  if(this.state.helped.includes(s.id)){await UI.say(s.name,s.face,`${s.thanks} You can visit whenever you like.`);return;}
  this.state.tracked=s.id;
  if(foundCount(this.state,s.id)<3){await UI.say(s.name,s.face,s.request);await UI.say(s.name,s.face,nextTarget(this.state,s.id).hint);this.game.save();return;}
  if(!complete(this.state,s.id))return;
  this.game.reward(150,50,'friend');this.refresh(s.id);this.game.save();
  await UI.say(s.name,s.face,s.thanks);UI.celebrate(`${s.name} is your friend!`,`${this.state.helped.length}/6 world lights restored`);
  if(this.state.helped.length===STORIES.length){await UI.say('The star keeper','🌟','Six worlds are glowing because of you. Every light holds a story about someone you helped. The sky has a surprise waiting at Star Castle!');}
 }
 buildSecrets(g){this.secretViews=[];
  for(const s of SKY_SECRETS){const b=new Builder();b.box(.8,.12,.6,'#fff4e6');b.box(.25,.02,.22,'#ffb8d6',0,.12,0);const mesh=model(b,g.scene);mesh.position.set(s.x,s.y+.5,s.z);this.secretViews.push({s,mesh});g.world.addInteract({x:s.x,y:s.y,z:s.z,r:2.4,dy:1.5,adventure:true,label:'Read a hidden postcard',icon:'💌',onUse:async()=>{if(!this.state.secrets.includes(s.id)){this.state.secrets.push(s.id);g.reward(40,10,'postcard');g.save();}await UI.say(s.title,'💌',s.text);}});}
  const b=new Builder();b.cyl(2,2.4,.3,'#fff4e6',-10,150,-60);for(let i=0;i<6;i++){const a=i*Math.PI/3;b.ico(.45,STORIES[i].color,-10+Math.cos(a)*2,153,-60+Math.sin(a)*2,{detail:0});}this.crown=model(b,g.scene);this.crown.visible=false;
  g.world.addInteract({x:-10,y:150,z:-57,r:3,dy:2,adventure:true,label:'The friendship constellation',icon:'🌟',onUse:()=>{if(this.state.helped.length<6){UI.say('The star keeper','🌟','Six little lights are waiting here. Visit the magic worlds and help their keepers to make them shine.');return;}g.fx.burst(g.player.pos,'sparkle',{n:80});UI.celebrate('Your friendship constellation','Six worlds. Six friends. A sky full of stories.');}});
 }
 journal(oldTasks){UI.modal('📖 Your adventure journal',(body,close)=>{
  const visit=id=>{close();this.state.tracked=id;this.game.magicDoors.travel(id);this.attach(id);this.game.save();};
  body.append(UI.h('p',{class:'adventure-intro'},'Pick a world to explore. Your friends and finds will stay in this journal.'));
  const shortcuts=UI.h('div',{class:'adventure-shortcuts'});body.append(shortcuts);
  const names={space:'Stars',heaven:'Clouds',hell:'Dragon tea',candy:'Candy',underwater:'Reef',ice:'Snow'};
  for(const s of STORIES)shortcuts.append(UI.h('button',{class:'btn small','data-quick-visit':s.id,onclick:()=>visit(s.id)},s.face+' '+names[s.id]));
  body.append(UI.h('div',{class:'adventure-summary'},`${this.state.helped.length}/6 friends · ${this.state.found.length}/18 discoveries · ${this.state.secrets.length}/3 hidden postcards`));
  const grid=UI.h('div',{class:'adventure-grid'});body.append(grid);
  for(const s of STORIES){const done=this.state.helped.includes(s.id),target=nextTarget(this.state,s.id),n=foundCount(this.state,s.id);const card=UI.h('section',{class:'adventure-card','data-story':s.id},UI.h('div',{class:'adventure-face'},s.face),UI.h('h3',{},s.title),UI.h('p',{},done?`You helped ${s.name}. Their world light is glowing.`:`${s.name} is waiting for you. ${n}/3 finds.`));
   if(target)card.append(UI.h('p',{class:'adventure-clue'},target.hint));
   const row=UI.h('div',{class:'row'});card.append(row);
   row.append(UI.h('button',{class:'btn small','data-visit':s.id,onclick:()=>visit(s.id)},done?'Visit your friend':'Go exploring'));
   if(!done)row.append(UI.h('button',{class:'btn small mint','data-track':s.id,onclick:()=>{this.state.tracked=s.id;this.game.save();close();UI.toast(this.game.realm===s.id?'Follow the golden marker.':'Visit this world through its beach door or your journal.',{icon:'🧭'});}},'Show a clue'));
   card.style.setProperty('--story-color',s.color);grid.append(card);
  }
  body.append(UI.h('h3',{},'Postcards from the sky'),UI.h('p',{},'There is a hidden letter on each cloud level. Look around the gardens and the castle.'));
  for(const s of SKY_SECRETS)if(this.state.secrets.includes(s.id))body.append(UI.h('div',{class:'adventure-postcard'},UI.h('strong',{},s.title),UI.h('p',{},s.text)));
  body.append(UI.h('button',{class:'btn',onclick:()=>{close();oldTasks?.();}},'Town tasks'));
 });}
 update(dt,g){
  if(this.lastRealm!==g.realm){this.lastRealm=g.realm;this.attach(g.realm);g.scene.add(this.guide);}
  g.hud.tracker.style.display=g.realm==='home'?'':'none';
  this.crown.visible=this.state.helped.length===6;
  const v=this.views.get(g.realm);if(v){v.friend.rotation.y=Math.atan2(g.player.pos.x,g.player.pos.z+17);v.friend.position.y=Math.sin(g.time*2)*.035;v.items.forEach((m,i)=>{m.position.y=1+Math.sin(g.time*2+i)*.2;m.rotation.y=g.time*.6;});v.moving.position.set(Math.sin(g.time*.35)*12,6+Math.sin(g.time*.7),-35+Math.cos(g.time*.35)*5);v.moving.rotation.y=-g.time*.35;v.light.scale.setScalar(1+Math.sin(g.time*2)*.1);}
  for(const {s,mesh} of this.secretViews){mesh.rotation.y=Math.sin(g.time*.6)*.15;mesh.position.y=s.y+.5+Math.sin(g.time*1.5)*.08;}
  const t=g.realm===this.state.tracked?nextTarget(this.state,g.realm):null;this.guide.visible=!!t&&g.mode==='play';if(t){this.guide.position.set(t.x,0,t.z);this.guide.rotation.y=g.time*.7;}
  const show=!!t&&g.mode==='play'&&!UI.anyModalOpen()&&!UI.dialogOpen();this.compass.style.display=show?'flex':'none';
  if(show){const dx=t.x-g.player.pos.x,dz=t.z-g.player.pos.z,distance=Math.round(Math.hypot(dx,dz));const text=`${compassDirection(dx,dz,g.rig.yaw)} ${t.name} · ${distance} m`;if(this.compass.textContent!==text)this.compass.textContent=text;}
 }
}
