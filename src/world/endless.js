import * as THREE from 'three';
import { terrainHeight, WATER_Y } from './terrain.js';
import { Builder, rng } from '../engine/builder.js';
import { M } from '../engine/materials.js';
export const CHUNK_SIZE=80;
export function townChunk(x,z){return x>=-2&&x<2&&z>=-2&&z<2;}
export function chunkGeometry(cx,cz){
 const geo=new THREE.PlaneGeometry(80,80,32,32).rotateX(-Math.PI/2);geo.translate(cx*80+40,0,cz*80+40);
 const p=geo.attributes.position,n=geo.attributes.normal,c=new Float32Array(p.count*3),color=new THREE.Color();
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=terrainHeight(x,z);p.setY(i,y);
  const dx=(terrainHeight(x+.1,z)-terrainHeight(x-.1,z))/.2,dz=(terrainHeight(x,z+.1)-terrainHeight(x,z-.1))/.2;
  const v=new THREE.Vector3(-dx,1,-dz).normalize();n.setXYZ(i,v.x,v.y,v.z);color.set(y<WATER_Y+.6?'#f7e2ad':(Math.sin(x*.01+z*.02)>0?'#86cc62':'#9ed873'));c.set([color.r,color.g,color.b],i*3);
 }
 geo.setAttribute('color',new THREE.BufferAttribute(c,3));geo.computeBoundingSphere();return geo;
}
export class EndlessWorld {
 init(g){this.game=g;g.endless=this;g.player.bounds=null;this.chunks=new Map();this.material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95});}
 update(){const g=this.game;if(g.realm&&g.realm!=='home')return;const p=g.player.pos,cx=Math.floor(p.x/80),cz=Math.floor(p.z/80),wanted=new Set();
  for(let x=cx-2;x<=cx+2;x++)for(let z=cz-2;z<=cz+2;z++){if(!townChunk(x,z))wanted.add(`${x},${z}`);}
  for(const [key,c] of this.chunks)if(!wanted.has(key)){c.group.removeFromParent();c.group.traverse(o=>o.geometry?.dispose());for(const collider of c.colliders)g.world.removeCollider(collider);this.chunks.delete(key);}
  const candidates=[...wanted].filter(k=>!this.chunks.has(k)).sort((a,b)=>{const [ax,az]=a.split(',').map(Number),[bx,bz]=b.split(',').map(Number);return Math.hypot(ax-cx,az-cz)-Math.hypot(bx-cx,bz-cz);});
  if(candidates.length){const [x,z]=candidates[0].split(',').map(Number);this.load(x,z);}
  const sea=g.world.water?.sea;if(sea){sea.position.x=p.x;sea.position.z=Math.max(380,p.z+250);}
  const far=g.world.ground?.userData.far;if(far)far.position.set(p.x,-5,p.z);
 }
 load(cx,cz){const g=this.game,group=new THREE.Group(),colliders=[],ground=new THREE.Mesh(chunkGeometry(cx,cz),this.material);ground.receiveShadow=true;group.add(ground);
  const b=new Builder(),rand=rng((cx*73856093)^(cz*19349663));
  for(let i=0;i<24;i++){const x=cx*80+rand()*80,z=cz*80+rand()*80,y=terrainHeight(x,z);if(y<WATER_Y+.5||g.state.buildings?.some(h=>h.realm==='home'&&Math.abs(h.x-x)<10&&Math.abs(h.z-z)<10))continue;
   if(i%3===0){b.ico(1,'#b3adbd',x,y+.4,z,{sy:.6,detail:0});}else {b.cyl(.2,.3,2.4,'#a0714f',x,y,z,{seg:5});b.cone(1.7,3.5,cz<0?'#67b878':'#9ed873',x,y+1.5,z,{seg:7});colliders.push(g.world.addCircle(x,z,.5,{bot:y,top:y+5}));}
  }
  if((cx*7+cz*11)%13===0){const x=cx*80+40,z=cz*80+40,y=terrainHeight(x,z);if(y>WATER_Y+.5){b.cyl(4,4,.25,'#ffb8d6',x,y,z,{seg:20});b.torus(3,.3,'#ffe066',x,y+3,z,{ts:20});}}
  if(b.parts.length)group.add(new THREE.Mesh(b.build({ao:0}),M.std));g.scene.add(group);this.chunks.set(`${cx},${cz}`,{group,colliders});
 }
}
