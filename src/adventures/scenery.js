import * as THREE from 'three';
import {Builder} from '../engine/builder.js';

export function model(builder,scene){const m=new THREE.Mesh(builder.build({ao:.05}),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8}));m.receiveShadow=true;scene.add(m);return m;}
export function friend(story,scene){
 const b=new Builder(),c=story.body;
 b.sphere(.65,c,0,.9,0,{sy:1.2});b.sphere(.68,c,0,1.85,0);
 b.sphere(.4,'#fff4e6',0,.9,.42,{sy:1.1,sz:.3});
 for(const x of [-.23,.23]){b.sphere(.13,'#fffafd',x,1.95,.58);b.sphere(.075,'#35415f',x,1.96,.68);b.sphere(.026,'#ffffff',x-.02,2,.73);b.sphere(.18,c,x,.18,.12,{sy:.6});}
 b.sphere(.09,story.color,0,1.7,.7);
 if(story.kind==='rabbit')for(const x of [-.3,.3]){b.sphere(.22,c,x,2.6,0,{sy:2.5});b.sphere(.13,'#ffc4d9',x,2.65,.16,{sy:2.4,sz:.4});}
 if(story.kind==='fox'||story.kind==='owl')for(const x of [-.42,.42])b.cone(.23,.6,c,x,2.28,0,{seg:5});
 if(story.kind==='dragon'){for(const x of [-.5,.5]){b.cone(.17,.5,'#ffe7a4',x,2.3,0,{seg:5});b.sphere(.45,story.color,x,.95,-.2,{sx:.3,sy:1.2});}b.cone(.25,1,c,0,.5,-.65,{rx:-Math.PI/2,seg:6});}
 if(story.kind==='turtle')b.sphere(.7,'#579c80',0,1,-.35,{sy:1.1,sz:.5});
 if(story.kind==='penguin'||story.kind==='owl')for(const x of [-.65,.65])b.sphere(.3,c,x,1.15,0,{sx:.45,sy:1.5});
 const mesh=model(b,scene);mesh.position.set(0,0,-17);return mesh;
}
export function label(scene,text,x,y,z,color='#fff4e6'){
 const cv=document.createElement('canvas');cv.width=512;cv.height=128;const ctx=cv.getContext('2d');ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(8,8,496,112,30);ctx.fill();ctx.fillStyle='#3b3854';ctx.font='600 42px Fredoka, sans-serif';ctx.textAlign='center';ctx.fillText(text,256,80);
 const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthWrite:false}));sprite.position.set(x,y,z);sprite.scale.set(4,1,1);scene.add(sprite);return sprite;
}
export function landmarks(story,scene){
 const b=new Builder(),c=story.color;
 // Details on the palace make its entrance readable from the meeting place.
 b.box(2.4,3,.15,'#fff4e6',0,0,-35.9);
 for(const x of [-4,-2.5,2.5,4]){b.box(.8,1.3,.16,'#fff4e6',x,4,-35.9);b.box(.55,.95,.18,c,x,4.17,-35.8);}
 for(const x of [-7,7]){b.cyl(.08,.08,3,'#fff4e6',x,14,-40,{seg:5});b.box(1.5,.8,.08,c,x+.7,15.8,-40);}
 // Stepping stones lead from the entrance to the new friend and the palace.
 for(let z=1;z>-35;z-=2.5)b.cyl(.75,.9,.08,'#fff4e6',Math.sin(z*.25)*.8,.02,z,{seg:8});
 // A furnished meeting place, with a reading rug and two seats.
 b.cyl(4,4,.08,c,0,.01,-17,{seg:32});
 for(const x of [-3,3]){b.box(2,.5,1,'#fff4e6',x,.2,-17);b.box(2,.9,.25,c,x,.6,-17.5);}
 b.cyl(.9,.8,.8,'#fff4e6',0,0,-21,{seg:12});b.cyl(1.2,1.2,.12,c,0,.8,-21,{seg:16});
 for(const x of [-7,7]){b.cyl(.12,.12,3.2,'#fff4e6',x,0,-17,{seg:6});b.sphere(.4,c,x,3.3,-17);}
 if(story.id==='space'){
  b.ico(22,'#cbb8e8',-65,28,-120,{detail:2});b.torus(32,1.1,'#eadbb9',-65,28,-120,{rx:1.1,rz:.25,ts:48});
  // A striped rocket and an observatory with a telescope.
  b.cyl(2,2,8,'#fff4e6',-42,0,-52,{seg:14});b.cone(2,3,c,-42,8,-52);b.torus(.75,.15,c,-42,5,-49.98);
  for(const dx of [-2,2])b.cone(.8,3,'#ee8d99',-42+dx,0,-52,{seg:4});
  b.cyl(5,5,4,'#d5c9f2',38,0,-51,{seg:20});b.sphere(5,c,38,4,-51,{sy:.65});b.cyl(.7,.7,5,'#fff4e6',38,5,-47,{rx:Math.PI/3});
 }else if(story.id==='heaven'){
  for(let i=0;i<6;i++)b.sphere(8,'#fffafd',-60+i*24,25+i%2*5,-90,{sx:1.7,sy:.35});
  for(let i=0;i<7;i++)b.torus(8-i*.6,.32,['#f5a7c3','#ffd79b','#fff3a4','#b8e6c6','#a6dcf1','#b8b2ec','#d9b3eb'][i],-40,5,-47,{arc:Math.PI,ts:28});
  for(const x of [-47,-33])b.sphere(3,'#ffffff',x,1,-47,{sy:.5});
  b.box(10,.25,8,'#ffffff',38,.1,-49);for(let i=0;i<9;i++)b.cyl(.15,.15,2+i*.2,c,34+i,0,-52,{seg:6});
 }else if(story.id==='hell'){
  b.cone(8,9,'#9a6576',-42,0,-49,{seg:12});b.torus(2,.45,'#ffcc82',-42,9,-49,{rx:Math.PI/2});
  b.box(9,5,7,'#ebb69d',40,0,-48);b.cone(7,3,'#bf7881',40,5,-48,{seg:4,ry:Math.PI/4});
  b.box(2,3,.15,'#ffe0b8',40,0,-44.4);b.cyl(1.2,1.2,.2,'#ffd9a7',36,.2,-40,{seg:12});
 }else if(story.id==='candy'){
  b.box(10,5,8,'#c9906b',-42,0,-48);b.cone(7.5,4,'#fff2e8',-42,5,-48,{seg:4,ry:Math.PI/4});
  b.box(2.4,3,.15,'#e99ebc',-42,0,-43.9);for(const x of [-45,-39])b.torus(.85,.2,c,x,2.5,-43.8);
  for(let i=0;i<6;i++)b.box(3,.25,2,'#efcba0',29+i*2,.1,-42);b.cyl(4,4,.1,c,35,.01,-51,{seg:24});
 }else if(story.id==='underwater'){
  for(let i=0;i<16;i++)b.torus(2+i%3,.06,'#9ce1d7',-60+i*8,.06,-35-(i%4)*12,{rx:Math.PI/2,ts:16});
  b.sphere(7,'#b88365',40,1,-47,{sx:1.5,sy:.3,sz:.55});b.cyl(.2,.2,10,'#fff4e6',40,1,-47,{seg:6});b.box(6,6,.2,'#a6ece5',37,4,-47);
  for(let i=0;i<9;i++){b.cone(1,3+i%3,['#faa6bc','#c6a6ef','#89d9c6'][i%3],-47+i*1.7,0,-49,{seg:6});b.sphere(.6,c,-47+i*1.7,4,-49);}
 }else{
  b.box(12,8,3,'#b3daf0',40,0,-50);for(let i=0;i<9;i++)b.cyl(.25,.15,8,c,35+i*1.2,0,-48.2,{seg:5});
  b.sphere(5,'#fffafd',-42,1,-49,{sy:.7});b.sphere(2,'#b3daf0',-42,1,-44,{sy:1.1,sz:.6});
  for(const x of [-48,-36])b.cyl(.16,.16,3,'#fff4e6',x,0,-44,{seg:6});
 }
 const mesh=model(b,scene);
 if(story.id==='ice'){
  // Three soft aurora ribbons across the horizon, with no post-processing cost.
  for(let band=0;band<3;band++){const vertices=[];for(let i=0;i<30;i++){const x=-100+i*7,y=10+band*4+Math.sin(i*.3+band)*5,nx=x+7,ny=10+band*4+Math.sin((i+1)*.3+band)*5;vertices.push(x,y,-100,nx,ny,-100,x,y+8,-100,nx,ny,-100,nx,ny+8,-100,x,y+8,-100);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));const aurora=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:['#9de7ca','#bdc2ff','#e2b7f3'][band],transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false}));scene.add(aurora);}
 }
 // One moving world companion; geometry is shared by all its tiny parts.
 const a=new Builder();
 if(story.id==='underwater'){a.sphere(.6,'#ffd7a4',0,0,0,{sx:1.8,sz:.5});a.cone(.6,.8,c,-1,0,0,{rz:Math.PI/2,seg:3,center:true});a.sphere(.08,'#35415f',.65,.15,.25);}
 else {a.ico(.4,c);a.torus(.75,.08,'#fff4e6',0,0,0,{rx:Math.PI/2,ts:12});}
 const moving=model(a,scene);return {mesh,moving};
}
