import * as THREE from 'three';
import * as HM from './model.js';
import { HouseView, FLOOR_Y, ORIGIN } from './view.js';
import { HouseSystem } from './system.js';
import { BuildMode } from './build.js';
import { Builder } from '../engine/builder.js';
import { M } from '../engine/materials.js';
import { FURN } from '../data/furniture.js';
import { HOME_PLOT, isBlocked } from '../data/map.js';
import * as UI from '../ui/ui.js';
export const FLOOR_HEIGHT=HM.WALL_H+FLOOR_Y;
export const PREFABS=[
 {id:'cottage',name:'Pink Cottage',icon:'🏡',floors:1,ext:'ex_pink'},
 {id:'blue_house',name:'Blue Family House',icon:'🏠',floors:2,ext:'ex_blue',roof:'#7fb7e8'},
 {id:'townhouse',name:'Three-floor Townhouse',icon:'🏘️',floors:3,ext:'ex_lilac'},
 {id:'shop',name:'Little Shop',icon:'🏪',floors:1,ext:'ex_cream'},
 {id:'castle',name:'Cloud Castle',icon:'🏰',floors:3,ext:'ex_cream',roofStyle:'flat'},
 {id:'tower',name:'Magic Tower',icon:'🗼',floors:3,ext:'ex_cream',roofStyle:'spire'},
 {id:'scratch',name:'Build from scratch',icon:'🔨',floors:1,ext:'ex_cream'},
];
export function prefab(id){const def=PREFABS.find(d=>d.id===id);if(!def)throw new Error('Unknown building');
 return {kind:id,name:def.name,roofStyle:def.roofStyle||'hip',floors:Array.from({length:def.floors},()=>{const h=HM.newHouse();h.ext=def.ext;h.roof=def.roof||h.roof;if(id==='scratch'){h.tiles={};h.inner={};h.open={};h.furniture=[];}return h;})};
}
export function placement(world,records,x,y,z,realm='home'){
 const half=8, points=[[0,0],[-half,-half],[half,-half],[-half,half],[half,half]];
 if(records.some(b=>b.realm===realm&&Math.abs(b.y-y)<FLOOR_HEIGHT*3&&Math.abs(b.x-x)<16&&Math.abs(b.z-z)<16))return 'Too close to another building';
 const heights=points.map(([dx,dz])=>world.groundAt(x+dx,z+dz,y+.5));
 if(Math.max(...heights)-Math.min(...heights)>.7||heights.some(h=>Math.abs(h-y)>1))return 'Find a flat, wide spot';
 if(heights.some(h=>h<(world.waterY??-.32)+.15))return 'Build on dry land';
 if(realm==='home'&&y<30&&points.some(([dx,dz])=>isBlocked(x+dx,z+dz,1)))return 'Leave room for the town and paths';
 if((world.interactables||[]).some(it=>it.adventure&&Math.abs(y-it.y)<3&&Math.abs(x-it.x)<11&&Math.abs(z-it.z)<11))return 'Leave room for discoveries and friends';
 // Ignore nature trunks; placing a building clears them.
 if(world.boxes.some(c=>!c.off&&(!c.tag||c.tag==='adventure'||c.tag==='skycity')&&y<c.top&&y+3>(c.bot??-Infinity)&&x+half>c.x1&&x-half<c.x2&&z+half>c.z1&&z-half<c.z2))return 'Leave room for buildings';
 return null;
}
export class BuildingSystem {
 init(g){this.game=g;g.buildings=this;g.state.buildings||=[];this.entries=[];this.homeOpen=g.openBuild;g.openBuild=()=>this.open();for(const b of g.state.buildings)this.createViews(b);}
 realm(){return this.game.realm||'home';}
 open(){const g=this.game;if(g.mode!=='play')return;
  const near=this.entries.find(e=>e.record.realm===this.realm()&&Math.hypot(g.player.pos.x-e.record.x,g.player.pos.z-e.record.z)<13&&Math.abs(g.player.pos.y-e.record.y)<12);
  if(near)return this.floorPicker(near);
  if(this.realm()==='home'&&Math.hypot(g.player.pos.x-HOME_PLOT.cx,g.player.pos.z-(HOME_PLOT.front-8))<25&&g.player.pos.y<5)return this.homeOpen();
  UI.modal('🔨 Build anywhere',(b,close)=>{b.append(UI.h('p',{},'Choose a free building, then walk to a clear spot.'));
   for(const p of PREFABS)b.append(UI.h('button',{class:'btn sky','data-prefab':p.id,onclick:()=>{close();this.begin(p.id);}},p.icon+' '+p.name));
  });
 }
 begin(id){const g=this.game;g.vehicles.dismount();this.cancel();this.pending=id;
  this.ghost=new THREE.Mesh(new THREE.PlaneGeometry(16,16).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x7fffd0,transparent:true,opacity:.45,depthWrite:false}));g.scene.add(this.ghost);
  this.bar=UI.h('div',{class:'place-bar interactive'},UI.h('button',{class:'btn mint','data-build-confirm':'',onclick:()=>this.confirm()},'✓ Build here'),UI.h('button',{class:'btn ghost',onclick:()=>this.cancel()},'✕ Cancel'));UI.root().append(this.bar);this.update();
 }
 cancel(){if(this.ghost){this.ghost.removeFromParent();this.ghost.geometry.dispose();this.ghost.material.dispose();}this.bar?.remove();this.pending=null;this.ghost=null;}
 confirm(){if(!this.pending)return null;const g=this.game,p=g.player.pos,err=placement(g.world,g.state.buildings,p.x,p.y,p.z,this.realm());if(err){UI.toast(err);return null;}
  const b={id:'building-'+(g.state.nextBuildingId=(g.state.nextBuildingId||0)+1),realm:this.realm(),x:p.x,y:p.y,z:p.z,...prefab(this.pending)};g.state.buildings.push(b);this.createViews(b);this.clearNature(b);this.cancel();g.player.teleport(b.x,b.y,b.z+10);g.rig.snap(g.player.pos);g.save();return b;
 }
 createViews(record){const g=this.game;if(record.realm!==this.realm())return;
  const entry={record,systems:[],extras:new THREE.Group()};g.scene.add(entry.extras);
  record.floors.forEach((house,i)=>{
   const sys=Object.create(HouseSystem.prototype);sys.game=g;sys.house=house;sys.fixedPlot=true;sys.view=new HouseView(g.scene,g.world,{origin:{x:record.x-14,y:record.y+i*FLOOR_HEIGHT,z:record.z-20},tag:record.id+':'+i,fence:false,roofStyle:i===record.floors.length-1?record.roofStyle:'none'});sys.view.rebuild(house);sys.interacts=[];sys.refreshInteract();sys.build=new BuildMode(g,sys);sys.checkStars=()=>sys.rating();entry.systems.push(sys);
  });
  // Stair landings are kept outside furniture so every floor stays editable.
  for(let i=0;i<record.floors.length;i++){
    const y=record.y+i*FLOOR_HEIGHT,b=new Builder();for(let j=0;j<6;j++)b.box(1.2,.15*(j+1),.3,'#e8c08a',record.x+6,y,record.z-3+j*.3);
    entry.extras.add(new THREE.Mesh(b.build({ao:0}),M.std));
    g.world.addPlatform({x1:record.x+4.5,x2:record.x+7.5,z1:record.z-4,z2:record.z+1,y:y+FLOOR_Y,tag:record.id+':stairs'});
    for(const delta of [-1,1])if(record.floors[i+delta])g.world.addInteract({x:record.x+(delta>0?6:4.5),z:record.z-1,y:y+FLOOR_Y,dy:1.2,r:2,label:delta>0?'Go upstairs':'Go downstairs',icon:'🪜',onUse:()=>{g.player.stand();g.player.teleport(record.x+6,record.y+(i+delta)*FLOOR_HEIGHT+FLOOR_Y,record.z-1);g.rig.snap(g.player.pos);},tag:record.id});
  }
  if(record.roofStyle!=='hip'){
   const b=new Builder(),y=record.y+record.floors.length*FLOOR_HEIGHT;
   if(record.roofStyle==='spire')b.cone(6,5,'#b58cff',record.x,y,record.z+3,{seg:4});
   else {b.box(9,.2,7,'#fff4e6',record.x,y,record.z+3);for(let i=-4;i<=4;i+=2)b.box(1,.7,.6,'#fff4e6',record.x+i,y+.2,record.z+6.3);}
   entry.extras.add(new THREE.Mesh(b.build({ao:0}),M.std));
  }
  this.entries.push(entry);
 }
 clearNature(b){const w=this.game.world;if(b.y>20)return;
  for(const c of w.circles)if(!c.tag&&Math.abs(c.x-b.x)<9&&Math.abs(c.z-b.z)<9)w.removeCollider(c);
  const mat=new THREE.Matrix4();this.game.scene.traverse(o=>{if(!o.isInstancedMesh)return;for(let i=0;i<o.count;i++){o.getMatrixAt(i,mat);const p=new THREE.Vector3().setFromMatrixPosition(mat);if(Math.abs(p.x-b.x)<9&&Math.abs(p.z-b.z)<9&&p.y<20){mat.scale(new THREE.Vector3(0,0,0));o.setMatrixAt(i,mat);}}o.instanceMatrix.needsUpdate=true;});
 }
 floorPicker(e){UI.modal(e.record.name,(b,close)=>{e.systems.forEach((sys,i)=>b.append(UI.h('button',{class:'btn sky','data-floor':i,onclick:()=>{close();sys.build.enter();}},'Edit floor '+(i+1))));
  if(e.systems.length<3)b.append(UI.h('button',{class:'btn mint',onclick:()=>{close();this.addFloor(e);}},'+ Add floor'));
 });}
 addFloor(e){if(e.record.floors.length>=3)return;const h=HM.newHouse();e.record.floors.push(h);this.removeViews(e);this.createViews(e.record);this.game.save();}
 removeViews(e){const w=this.game.world;for(const s of e.systems){s.build.exit();w.removeTagged(s.view.tag);w.removeTagged(s.view.furnTag);w.removeTagged(s.view.tag+':floor');for(const it of s.interacts)w.removeInteract(it);s.view.group.removeFromParent();s.view.clearGroup(s.view.struct);s.view.clearGroup(s.view.furn);Object.values(s.view.mats).forEach(m=>m.dispose());}w.removeTagged(e.record.id+':stairs');w.interactables=w.interactables.filter(it=>it.tag!==e.record.id);e.extras.removeFromParent();e.extras.traverse(o=>o.geometry?.dispose());this.entries.splice(this.entries.indexOf(e),1);}
 update(dt=0){const g=this.game;
  if(this.ghost){const p=g.player.pos;this.ghost.position.set(p.x,p.y+.08,p.z);this.ghost.material.color.set(placement(g.world,g.state.buildings,p.x,p.y,p.z,this.realm())?'#ff8a8a':'#7fffd0');}
  for(const e of this.entries)for(const s of e.systems){const d=g.player.pos.distanceTo(s.view.group.position);s.view.group.visible=d<170||s.build.active;s.view.furn.visible=d<55||s.build.active;s.update(dt,g);if(e.record.floors.indexOf(s.house)<e.record.floors.length-1&&s.view.roofMesh)s.view.roofMesh.visible=false;}
 }
}
