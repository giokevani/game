import * as THREE from 'three';
import {World} from './world.js';
import {Builder,rng} from '../engine/builder.js';
import * as UI from '../ui/ui.js';
import {STORIES} from '../adventures/story.js';
export const REALMS=[
 {id:'space',name:'Space',icon:'🚀',sky:'#111638',ground:'#8f90ae',accent:'#a8eaff',gravity:8},
 {id:'heaven',name:'Heaven',icon:'😇',sky:'#bddfff',ground:'#fffafd',accent:'#ffd45e',gravity:30},
 {id:'hell',name:'Hell',icon:'🔥',sky:'#c7677f',ground:'#7f586a',accent:'#ffad55',gravity:30},
 {id:'candy',name:'Candy Land',icon:'🍭',sky:'#ffdaee',ground:'#b9e9cf',accent:'#ff8fc0',gravity:30},
 {id:'underwater',name:'Underwater Kingdom',icon:'🐠',sky:'#197ba2',ground:'#e5d5ab',accent:'#76eee2',gravity:18},
 {id:'ice',name:'Ice Kingdom',icon:'❄️',sky:'#b6daf1',ground:'#eefaff',accent:'#83bdeb',gravity:30},
];
export function doorSpot(i){return {x:58+i*12,y:0,z:40};}
export class MagicDoors {
 init(g){this.game=g;g.magicDoors=this;g.realm='home';this.home={scene:g.scene,world:g.world,sky:g.sky};this.cache=new Map();
  REALMS.forEach((r,i)=>{const p=doorSpot(i);this.door(g.scene,g.world,p,r,()=>this.travel(r.id));});
 }
 door(scene,world,p,r,onUse){
  const b=new Builder();b.box(.4,4,.5,'#fff4e6',p.x-1.3,p.y,p.z);b.box(.4,4,.5,'#fff4e6',p.x+1.3,p.y,p.z);b.box(3, .4,.5,'#ffd45e',p.x,p.y+3.8,p.z);
  const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7});const frame=new THREE.Mesh(b.build({ao:0}),mat);scene.add(frame);
  const portal=new THREE.Mesh(new THREE.PlaneGeometry(2.2,3.6),new THREE.MeshBasicMaterial({color:r.accent,side:THREE.DoubleSide,transparent:true,opacity:.8}));portal.position.set(p.x,p.y+1.8,p.z);scene.add(portal);
  world.addInteract({...p,r:3,dy:2,label:r.name,icon:r.icon,onUse});
  // English name is visible above each door.
  const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#fffaf0';ctx.fillRect(0,0,512,96);ctx.fillStyle='#51435f';ctx.textAlign='center';ctx.font='600 38px Fredoka, sans-serif';ctx.fillText(r.name,256,60);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(new THREE.PlaneGeometry(5.5,1),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));sign.material.side=THREE.FrontSide;sign.position.set(p.x,p.y+4.8,p.z+.02);scene.add(sign);const back=sign.clone();back.rotation.y=Math.PI;back.position.z=p.z-.02;scene.add(back);
 }
 make(r){const scene=new THREE.Scene();scene.background=new THREE.Color(r.sky);scene.fog=new THREE.Fog(r.sky,60,260);scene.add(new THREE.HemisphereLight('#ffffff',r.ground,2));const sun=new THREE.DirectionalLight('#fff4e6',2);sun.position.set(20,45,20);scene.add(sun);
  const world=new World(scene,this.game.quality.level,{height:()=>0,waterY:-100});world.zoneAt=()=>({id:r.id,name:r.name,icon:r.icon});
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(800,800).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:r.ground,roughness:.9}));scene.add(ground);
  const b=new Builder(),rand=rng(REALMS.indexOf(r)+21);
  const story=STORIES.find(s=>s.id===r.id);
  for(let i=0;i<65;i++){const x=(rand()-.5)*170,z=(rand()-.5)*170;if(Math.hypot(x,z)<14||(Math.abs(x)<5&&z>-35&&z<0)||story.spots.some(([sx,sz])=>Math.hypot(x-sx,z-sz)<5)||Math.hypot(x,z+17)<6)continue;
   if(r.id==='space'){b.ico(1+rand()*2,r.ground,x,.4,z,{detail:0});b.torus(1.5,.2,r.accent,x,2,z,{ts:12});}
   if(r.id==='heaven'){b.sphere(4,'#ffffff',x,1,z,{sy:.3,ws:8,hs:6});b.cyl(.3,.3,5,'#fff4e6',x,0,z,{seg:8});b.torus(1.5,.2,r.accent,x,5.2,z,{rx:Math.PI/2,ts:12});}
   if(r.id==='hell'){b.cone(2.5,4,r.ground,x,0,z,{seg:7});b.sphere(.8,r.accent,x,4.5,z,{ws:6,hs:5});}
   if(r.id==='candy'){b.cyl(.2,.2,4,'#fffafd',x,0,z,{seg:6});b.sphere(1.8,i%2?r.accent:'#b58cff',x,4,z,{sz:.35,ws:10,hs:6});}
   if(r.id==='underwater'){for(let j=0;j<3;j++)b.cone(.5,3+j,r.accent,x+j*.7,0,z,{seg:5});b.sphere(.6,['#ffa56b','#ffcc66','#c49eff'][i%3],x,4+rand()*3,z,{sx:1.6,sz:.5,ws:8,hs:6});}
   if(r.id==='ice'){b.cone(1.5,6,r.accent,x,0,z,{seg:5});b.ico(1,'#ffffff',x,2,z,{detail:0});}
   world.addCircle(x,z,.7,{bot:0,top:6});
  }
  // A palace gives each world a destination beyond the entrance.
  b.box(12,7,8,r.accent,0,0,-40);for(const x of [-7,7]){b.cyl(2,2,10,'#fff4e6',x,0,-40,{seg:8});b.cone(2.4,4,r.accent,x,10,-40,{seg:8});}
  const decor=new THREE.Mesh(b.build({ao:.1}),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7}));scene.add(decor);world.addBox(-6,-44,6,-36,{top:7});
  if(r.id==='hell'){const lava=new THREE.Mesh(new THREE.CircleGeometry(8,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#ff9a52'}));lava.position.set(20,.05,-15);scene.add(lava);}
  // Keep the return door beside the path, clear of the arrival camera.
  this.door(scene,world,{x:12,y:0,z:8},{name:'Back to Blossom Bay',icon:'🏠',accent:'#ffcce4'},()=>this.travel('home'));
  const particles=new THREE.Points(new THREE.BufferGeometry(),new THREE.PointsMaterial({color:r.accent,size:.25,transparent:true,opacity:.7}));const pos=[];for(let i=0;i<180;i++)pos.push((rand()-.5)*150,rand()*20,(rand()-.5)*150);particles.geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));scene.add(particles);
  const sky={t:this.home.sky.t,state:{night:r.id==='space'?1:0},update(dt){particles.rotation.y+=dt*.01;},setShadowSize(){}};
  return {scene,world,sky,definition:r};
 }
 travel(id){const g=this.game;if(g.mode!=='play')return;const r=REALMS.find(r=>r.id===id);if(id!=='home'&&!r)return;
  g.buildings.cancel();g.player.stand();
  if(g.realm==='home'&&id!=='home')this.returnSpot=doorSpot(REALMS.indexOf(r));
  const dest=id==='home'?this.home:(this.cache.get(id)||this.make(r));if(id!=='home')this.cache.set(id,dest);
  for(const e of [...g.buildings.entries])g.buildings.removeViews(e);
  g.scene=dest.scene;g.world=dest.world;g.sky=dest.sky;g.player.world=g.world;g.rig.world=g.world;g.realm=id;g.player.gravity=r?.gravity||30;g.player.bounds=id==='home'?null:{minX:-180,maxX:180,minZ:-180,maxZ:180};
  g.adventures?.attach(id);
  for(const o of [g.avatar.root,g.pets?.actor?.model.group,g.fx.points,g.vehicles.riding?.model.group])if(o)g.scene.add(o);
  if(id==='home'){const p=this.returnSpot||doorSpot(0);g.player.teleport(p.x,0,p.z+4);}else g.player.teleport(0,0,4);
  for(const b of g.state.buildings)if(b.realm===id)g.buildings.createViews(b);
  g.pets?.actor?.place(g.player.pos);g.rig.override=null;g.rig.snap(g.player.pos);g.hud.setZone({name:r?.name||'Blossom Bay',icon:r?.icon||'🌸'});g.fx.burst(g.player.pos,'sparkle');g.save();
 }
 update(dt,g){if(g.realm==='hell'&&Math.hypot(g.player.pos.x-20,g.player.pos.z+15)<8&&g.player.pos.y<1){g.player.teleport(20,0,-4);g.player.vel.y=9;UI.toast('Hot! 🔥');}}
}
