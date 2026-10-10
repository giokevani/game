import * as THREE from 'three';
import { Builder } from '../engine/builder.js';
import { M } from '../engine/materials.js';
import { SKY_LEVELS, SKY_LIFT } from '../data/map.js';
import * as UI from '../ui/ui.js';
export class SkyCity {
  init(g) {
    this.game=g;g.skyCity=this;
    for(const level of SKY_LEVELS){
      const b=new Builder();
      b.cyl(level.r,level.r,1.2,'#fffafd',level.x,level.y-1.2,level.z,{seg:48});
      for(let i=0;i<16;i++){const a=i*Math.PI/8;b.sphere(5,'#fffafd',level.x+Math.cos(a)*(level.r-2),level.y-1.2,level.z+Math.sin(a)*(level.r-2),{sy:.45,ws:10,hs:6});}
      // A clear meadow in the middle leaves room for new homes.
      for(let i=0;i<6;i++){const a=i*Math.PI/3,x=level.x+Math.cos(a)*(level.r-7),z=level.z+Math.sin(a)*(level.r-7);
        b.cyl(.2,.3,2,'#d6afff',x,level.y,z,{seg:6});b.sphere(1.5,['#ffb8d6','#b8eaff','#ffe8a1'][i%3],x,level.y+3,z,{ws:8,hs:6});
        g.world.addCircle(x,z,.5,{bot:level.y,top:level.y+3.5,tag:'skycity'});
      }
      const m=new THREE.Mesh(b.build({ao:0}),M.std);m.receiveShadow=true;g.scene.add(m);
      g.world.addPlatform({x:level.x,z:level.z,r:level.r,y:level.y,tag:'skycity'});
      this.pad(level.x,level.y,level.z+level.r-6);
    }
    this.pad(SKY_LIFT.x,0,SKY_LIFT.z);
  }
  pad(x,y,z){
    const g=this.game,b=new Builder();b.cyl(2.4,2.6,.2,'#b8eaff',x,y,z,{seg:24});b.torus(2.2,.12,'#ffe066',x,y+.3,z,{rx:Math.PI/2,ts:24});
    g.scene.add(new THREE.Mesh(b.build({ao:0}),M.gloss));
    g.world.addInteract({x,y,z,r:3,dy:2,label:'Sky Lift',icon:'☁️',onUse:()=>this.picker()});
  }
  picker(){UI.modal('☁️ Sky Lift',(b,close)=>{
    b.append(UI.h('p',{},'Choose a cloud to visit. You can fly and build on every level!'));
    for(const l of [{id:'town',name:'Blossom Bay',x:SKY_LIFT.x,y:0,z:SKY_LIFT.z,r:0},...SKY_LEVELS])b.append(UI.h('button',{class:'btn sky','data-sky':l.id,onclick:()=>{close();this.travel(l.id);}},l.name));
  });}
  travel(id){const l=id==='town'?{x:SKY_LIFT.x,y:0,z:SKY_LIFT.z,r:0}:SKY_LEVELS.find(l=>l.id===id);if(!l)return;
    const g=this.game;g.vehicles.dismount();g.player.stand();g.player.teleport(l.x,l.y,l.z+(l.r?l.r-8:0));g.rig.snap(g.player.pos);g.pets?.actor?.place(g.player.pos);g.fx.burst(g.player.pos,'sparkle');
  }
}
