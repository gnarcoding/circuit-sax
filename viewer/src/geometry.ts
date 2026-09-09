import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Part, Vec3 } from './data/manifest';
const geometryCache = new Map<string,THREE.BufferGeometry>();
const materials = new Map<string,THREE.MeshStandardMaterial>();
function mat(color:string,metal=0,rough=0.48){const key=`${color}-${metal}-${rough}`;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough}));return materials.get(key)!;}
function cached(key:string,make:()=>THREE.BufferGeometry){if(!geometryCache.has(key))geometryCache.set(key,make());return geometryCache.get(key)!;}
function box(g:THREE.Group,size:Vec3,pos:Vec3,color:string,radius=0.5,metal=0){
  const key=`box:${size.join(',')}:${radius}`;
  const m=new THREE.Mesh(cached(key,()=>radius?new RoundedBoxGeometry(...size,2,Math.min(radius,...size.map(v=>v/3))):new THREE.BoxGeometry(...size)),mat(color,metal));m.position.set(...pos);g.add(m);return m;
}
function cylinder(g:THREE.Group,r:number,h:number,pos:Vec3,color:string,rotation:Vec3=[Math.PI/2,0,0],metal=0){const m=new THREE.Mesh(cached(`c:${r}:${h}`,()=>new THREE.CylinderGeometry(r,r,h,24)),mat(color,metal));m.position.set(...pos);m.rotation.set(...rotation);g.add(m);return m;}
function torus(g:THREE.Group,r:number,tube:number,pos:Vec3,color:string,rotation:Vec3=[0,0,0]){const m=new THREE.Mesh(cached(`t:${r}:${tube}`,()=>new THREE.TorusGeometry(r,tube,8,32)),mat(color,0.65));m.position.set(...pos);m.rotation.set(...rotation);g.add(m);return m;}
function localText(g:THREE.Group,text:string,pos:Vec3,width:number,height:number,color='#ecf2e8'){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle=color;ctx.font='500 38px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide}));mesh.position.set(...pos);g.add(mesh);
}
function pcb(g:THREE.Group,part:Part){
  const [w,h,d]=part.size;
  const shape=new THREE.Shape();
  const points: [number,number][] = part.kind==='mainpcb'?[
    [-27,145],[21,145],[21,38],[28,38],[28,22],[20,22],[20,-46],[57,-46],[57,-147],[17,-147],[17,-95],[-26,-95],[-26,-44],[-18,-44],[-18,68],[-27,68]
  ]:[[-w/2+3,-h/2],[w/2-3,-h/2],[w/2,-h/2+3],[w/2,h/2-3],[w/2-3,h/2],[-w/2+3,h/2],[-w/2,h/2-3],[-w/2,-h/2+3]];
  shape.moveTo(...points[0]);points.slice(1).forEach(p=>shape.lineTo(...p));shape.closePath();
  const holes:Vec3[]=part.kind==='mainpcb'?[[-18,137,0],[12,130,0],[12,52,0],[-12,-40,0],[49,-53,0],[49,-137,0],[22,-136,0],[-18,-87,0]]:[[-w/2+5,-h/2+6,0],[-w/2+5,h/2-6,0]];
  holes.forEach(p=>{const hole=new THREE.Path();hole.absarc(p[0],p[1],1.9,0,Math.PI*2,true);shape.holes.push(hole);torus(g,2.5,.45,[p[0],p[1],d/2+.1],'#dfdfb7');});
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.35,bevelThickness:.15,curveSegments:12});geometry.translate(0,0,-d/2);
  g.add(new THREE.Mesh(geometry,mat(part.color,0.22,.43)));
  if(part.kind==='mainpcb'){
    localText(g,'CIRCUIT SAX v2',[35,-54,1.1],36,8);
    localText(g,'EDUCATIONAL RECONSTRUCTION',[36,-141,1.1],38,5);
    // Subtle illustrative copper paths, explicitly disclaimed in the inspector.
    for(let i=0;i<6;i++){
      const pts=[new THREE.Vector3(-13+i*1.3,108,1),new THREE.Vector3(-13+i*1.3,-60+i*2,1),new THREE.Vector3(19+i*1.3,-78+i*2,1)];
      const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:'#aa7c1b',transparent:true,opacity:.55}));g.add(line);
    }
  }
}
function pins(g:THREE.Group,rows:number,spacing:number,x:number,y:number,z:number){
  const geometry=cached('pin',()=>new THREE.BoxGeometry(.65,.65,3));
  const mesh=new THREE.InstancedMesh(geometry,mat('#d9bc73',.75),rows*2);const dummy=new THREE.Object3D();
  for(let row=0;row<rows;row++)for(let side=0;side<2;side++){dummy.position.set(x*(side?1:-1),y+row*spacing,z);dummy.updateMatrix();mesh.setMatrixAt(row*2+side,dummy.matrix);}g.add(mesh);
}
export function makeVisual(part:Part,stl?:THREE.BufferGeometry):THREE.Group {
  const g=new THREE.Group();const [w,h,d]=part.size;const c=part.color;
  switch(part.kind){
    case 'stl': if(stl)g.add(new THREE.Mesh(stl,mat(c,0.03,.32)));else {box(g,[10,10,10],[0,0,0],'#e1a252',1);localText(g,'MESH ERROR',[0,0,6],20,5);}break;
    case 'mainpcb': case 'pcb': pcb(g,part);break;
    case 'switch':
      box(g,[14,14,4],[0,0,-1.5],'#771a33',.8);box(g,[12,12,5],[0,0,2],c,1.2);
      box(g,[4,1.2,3],[0,0,5],'#f9a0aa',.1);box(g,[1.2,4,3],[0,0,5],'#f9a0aa',.1);
      [-5,5].forEach(x=>box(g,[1.2,9,2],[x,0,3.5],'#da5471',.2));pins(g,1,2,3,0,-5);break;
    case 'teensy':
      box(g,part.size,[0,0,0],c,.5);pins(g,24,2.54,7.62,-29.21,1);
      box(g,[10,10,1.4],[0,-2,1.5],'#171f27',.1);localText(g,'NXP',[0,-2,2.3],8,3);
      box(g,[5,6,1],[-1,13,1.3],'#1c2931',.1);box(g,[3,5,1],[3,-14,1.3],'#d2d6cd',.1,.65);
      box(g,[8,5.8,3.1],[0,-29.5,2.1],'#aab9c5',.45,.8);
      box(g,[6.5,.4,1.9],[0,-32.4,2.1],'#121923',.1);
      box(g,[12,12,1.6],[0,23,1.5],'#98a8ac',.4,.7);box(g,[9,.5,.7],[0,29.2,1.5],'#18212b',.1);
      localText(g,'TEENSY 4.1',[0,-18,2],14,3);
      for(let i=0;i<8;i++)box(g,[1.3,2,.8],[i%2?5:-5,-17+i*5,1.2],'#d6b990',.1);break;
    case 'audio':
      box(g,part.size,[0,0,0],c,.6);pins(g,14,2.54,7.62,-16.5,1.3);
      box(g,[7,7,1.6],[-4,2,1.8],'#151e25',.2);box(g,[14,14,2.5],[-7,-10,2.1],'#a0aeb6',.4,.7);
      box(g,[11,.5,1],[-7,-17,2],'#0a151c',.1); // empty SD socket
      box(g,[8,13,6],[12,-12,3.5],'#1b2029',.7);cylinder(g,2.6,1,[12,-19,3.5],'#9ba8b1',[0,0,0],.8);cylinder(g,1.75,1.2,[12,-19.6,3.5],'#05080e',[0,0,0]);
      localText(g,'AUDIO · REV D',[0,12,1.5],28,5);break;
    case 'sensor':
      box(g,[21,10,6],[0,0,0],c,1);cylinder(g,4.2,6,[0,5,0],c,[0,0,0]);cylinder(g,2.5,9,[0,11,0],'#485563',[0,0,0]);cylinder(g,1.1,.5,[0,15.7,0],'#0c1117',[0,0,0]);pins(g,4,2.54,11,-3.8,0);localText(g,'5010GP',[0,-1,3.2],18,4);break;
    case 'imu':
      box(g,part.size,[0,0,0],c,.5);box(g,[4,4,1],[0,0,2],'#18232d',.2);pins(g,4,2.54,7,-4,1);localText(g,'MPU6050',[0,8,1.5],17,4);break;
    case 'protection':
      box(g,part.size,[0,0,0],c,1);localText(g,'ADC ?',[0,0,d/2+.2],21,7,'#151921');break;
    case 'mouthpiece':{
      const points=[new THREE.Vector2(8,-24),new THREE.Vector2(10,-19),new THREE.Vector2(10,0),new THREE.Vector2(8,14),new THREE.Vector2(4,25)];
      g.add(new THREE.Mesh(new THREE.LatheGeometry(points,32),mat(c,0,.22)));
      box(g,[10,42,1],[0,1,8],'#bb9d6c',.6);[-10,1].forEach(y=>torus(g,10.5,1.2,[0,y,0],'#b7b3a5',[Math.PI/2,0,0]));
      [-10,1].forEach(y=>cylinder(g,2,5,[12,y,0],'#c1bba4',[0,0,Math.PI/2],.8));break;
    }
    case 'battery':
      box(g,part.size,[0,0,0],c,5);localText(g,'USB POWER / 5 V',[0,-5,d/2+.2],52,10);
      box(g,[13,1,6],[18,-h/2,.5],'#111a23',.7);box(g,[14,.7,7],[18,-h/2+.4,.5],'#939a9f',.5,.7);
      for(let i=0;i<4;i++)box(g,[2,1,.5],[-6+i*4,29,d/2+.3],'#7cc9d2',.2);break;
    case 'holder':
      box(g,[w,6,4],[0,h/2,-d/2],c,2);box(g,[w,7,4],[0,-h/2,-d/2],c,2);
      [-1,1].forEach(s=>box(g,[3,h,d],[s*w/2,0,0],c,1));box(g,[w,20,3],[0,0,-d/2],c,1);break;
    case 'headphones':{
      const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-35,-18,0),new THREE.Vector3(-40,20,0),new THREE.Vector3(-24,43,0),new THREE.Vector3(0,50,0),new THREE.Vector3(25,42,0),new THREE.Vector3(40,20,0),new THREE.Vector3(35,-18,0)]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve,48,3.3,8,false),mat('#536275',.5)));
      [-1,1].forEach(s=>{const ear=box(g,[15,36,27],[s*35,-21,0],c,5);ear.rotation.z=s*.15;box(g,[7,28,23],[s*28,-21,0],'#0e1722',3);});break;
    }
    case 'header':
      [-1,1].forEach(s=>box(g,[2.5,h,3],[s*(w/2-1),0,0],c,.1));pins(g,Math.max(3,Math.round(h/2.54)),2.54,w/2-1,-h/2+1.27,2);break;
    case 'bracket':box(g,[w,h,1.3],[0,0,0],c,.2,.85);box(g,[w,1.3,d],[0,-h/2,d/2],c,.2,.85);break;
    case 'screw':cylinder(g,1.4,5,[0,0,-2],c,[Math.PI/2,0,0],.9);cylinder(g,3,1.5,[0,0,1],c,[Math.PI/2,0,0],.9);box(g,[3,.65,.2],[0,0,1.85],'#36414c',0);box(g,[.65,3,.2],[0,0,1.85],'#36414c',0);break;
    case 'trap':
      cylinder(g,w/2,h,[0,0,0],c,[0,0,0]);cylinder(g,w/3,4,[0,h/2+2,0],'#b8d7da',[0,0,0]);cylinder(g,w/3,4,[0,-h/2-2,0],'#b8d7da',[0,0,0]);break;
  }
  return g;
}
