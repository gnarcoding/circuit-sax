import { useEffect,useMemo,useRef, type MutableRefObject } from 'react';
import { Canvas,useFrame,useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls,Html,Line } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitImpl } from 'three-stdlib';
import { makeVisual } from './geometry';
import { type Part,type Vec3 } from './data/manifest';
import { layerInfo,type Connection,type Layer } from './data/connections';
import { partOffset,visibilityFor,type Visibility } from './logic';
import type { AssetState } from './assets';
export type CameraCommand={serial:number;view:'isometric'|'front'|'back'|'left'|'right'|'fit';id?:string};
export interface SceneProps {
  parts:Part[];assets:AssetState;selected:string|null;onSelect:(id:string)=>void;
  explosion:number;staged:boolean;extract:number;visibility:Visibility;
  connections:Connection[];layers:Layer[];showConnections:boolean;globalConnections:boolean;
  cameraCommand:CameraCommand;autoRotate:boolean;stopRotate:()=>void;xray:boolean;lowEffects:boolean;reducedMotion:boolean;
  simulation:boolean;pressed:Set<string>;onKey:(key:string)=>void;active:boolean;pressPreview:boolean;
}
type Registry=MutableRefObject<Map<string,THREE.Group>>;
const emptyRaycast=()=>{};
const initialLinePoints:Vec3[]=[[0,0,0],[0,1,0]];
function PartObject({part,props,registry}:{part:Part;props:SceneProps;registry:Registry}){
  const ref=useRef<THREE.Group>(null!);const invalidate=useThree(s=>s.invalidate);
  const mesh=props.assets.meshes.get(part.assetId??'');
  const object=useMemo(()=>makeVisual(part,mesh),[part.id,mesh]);
  const materialCopies=useMemo(()=>{
    const all:{mesh:THREE.Mesh;original:THREE.Material|THREE.Material[];copy:THREE.Material|THREE.Material[]}[]=[];
    object.traverse(o=>{if(o instanceof THREE.Mesh){const original=o.material;const copy=Array.isArray(original)?original.map(m=>m.clone()):original.clone();o.material=copy;all.push({mesh:o,original,copy});}});return all;
  },[object]);
  useEffect(()=>()=>{materialCopies.forEach(({copy})=>(Array.isArray(copy)?copy:[copy]).forEach(m=>m.dispose()));},[materialCopies]);
  useEffect(()=>{registry.current.set(part.id,ref.current);return()=>{registry.current.delete(part.id);};},[part.id,registry]);
  const visible=visibilityFor(part.id,props.visibility)!=='hidden';
  const ghost=props.visibility.ghost&&props.selected!==null&&props.selected!==part.id;
  const selected=props.selected===part.id;
  useEffect(()=>{
    materialCopies.forEach(({mesh,copy})=>{
      mesh.raycast=ghost||!visible?emptyRaycast:mesh instanceof THREE.InstancedMesh?THREE.InstancedMesh.prototype.raycast:THREE.Mesh.prototype.raycast;
      (Array.isArray(copy)?copy:[copy]).forEach(material=>{
        if(material instanceof THREE.MeshStandardMaterial){material.emissive.set(selected?'#21b8cf':props.simulation&&part.key&&props.pressed.has(part.key)?'#628457':'#000000');material.emissiveIntensity=selected?.3:.18;material.wireframe=props.xray;}
        material.transparent=ghost||props.xray||material instanceof THREE.MeshBasicMaterial;material.opacity=ghost?.12:props.xray?.55:1;material.depthWrite=!ghost&&!props.xray;
      });
    });invalidate();
  },[selected,ghost,visible,props.xray,props.pressed,props.simulation,materialCopies,invalidate,part.key]);
  useFrame(({clock},delta)=>{
    const target=partOffset(part,props.explosion,props.staged,selected?props.extract:0);
    const preview=selected&&props.pressPreview&&part.kind==='stl';
    if((props.simulation&&part.key&&props.pressed.has(part.key)&&part.kind==='stl')||preview)target[2]-=2;
    const t=new THREE.Vector3(...target);const distance=ref.current.position.distanceTo(t);
    if(distance>.005){ref.current.position.lerp(t,props.reducedMotion?1:1-Math.exp(-delta*12));invalidate();}else ref.current.position.copy(t);
    const phaseId=['pressure','teensy','shield','headphones'].indexOf(part.id);
    if(props.simulation&&phaseId>=0&&!selected){
      const illuminated=props.active&&(props.reducedMotion||Math.floor(clock.elapsedTime*1.3)%4===phaseId);
      materialCopies.forEach(({copy})=>(Array.isArray(copy)?copy:[copy]).forEach(m=>{if(m instanceof THREE.MeshStandardMaterial){m.emissive.set(illuminated?'#247d89':'#000000');m.emissiveIntensity=illuminated?.55:0;}}));
      if(props.active&&!props.reducedMotion)invalidate();
    }
  });
  const click=(e:ThreeEvent<MouseEvent>)=>{if(!visible||ghost||e.delta>4)return;e.stopPropagation();props.stopRotate();if(props.simulation&&part.key)props.onKey(part.key);else props.onSelect(part.id);};
  const children=props.parts.filter(p=>p.parent===part.id&&!p.route);
  return <group ref={ref} name={part.id} position={part.position} rotation={part.rotation}>
    <group visible={visible} onClick={click}><primitive object={object} dispose={null}/>
      {selected&&<Html position={[0,part.size[1]/2+7,5]} center style={{pointerEvents:'none'}}><span className="part-tag">{part.name}</span></Html>}
    </group>
    {children.map(child=><PartObject key={child.id} part={child} props={props} registry={registry}/>)}
  </group>;
}
function endpoint(registry:Registry,parts:Part[],id:string,anchor:string):THREE.Vector3|null {
  const object=registry.current.get(id);const part=parts.find(p=>p.id===id);if(!object||!part)return null;
  object.updateWorldMatrix(true,false);return object.localToWorld(new THREE.Vector3(...(part.anchors[anchor]??[0,0,0])));
}
function routePoints(a:THREE.Vector3,b:THREE.Vector3,bend:Vec3):THREE.Vector3[]{const mid=a.clone().lerp(b,.5).add(new THREE.Vector3(...bend));return new THREE.CatmullRomCurve3([a,a.clone().lerp(mid,.5),mid,b.clone().lerp(mid,.5),b]).getPoints(32);}
function PhysicalCable({part,props,registry}:{part:Part;props:SceneProps;registry:Registry}){
  const root=useRef<THREE.Group>(null!);
  const ref=useRef<THREE.Mesh>(null!);const plugA=useRef<THREE.Mesh>(null!),plugB=useRef<THREE.Mesh>(null!);
  const last=useRef('');const invalidate=useThree(s=>s.invalidate);const route=part.route!;
  const visible=visibilityFor(part.id,props.visibility)!=='hidden';const ghost=props.visibility.ghost&&props.selected!==null&&props.selected!==part.id;
  const material=useMemo(()=>new THREE.MeshStandardMaterial({color:part.color,roughness:.65}),[part.color]);
  useEffect(()=>{registry.current.set(part.id,root.current);return()=>{registry.current.delete(part.id);};},[part.id,registry]);
  useEffect(()=>()=>{material.dispose();ref.current?.geometry.dispose();},[material]);
  useFrame(()=>{
    const a=endpoint(registry,props.parts,route.from.id,route.from.anchor),b=endpoint(registry,props.parts,route.to.id,route.to.anchor);if(!a||!b)return;
    const signature=[...a.toArray(),...b.toArray()].map(n=>n.toFixed(2)).join();
    if(signature!==last.current){last.current=signature;
      const curve=new THREE.CatmullRomCurve3(routePoints(a,b,route.bend));
      const geometry=new THREE.TubeGeometry(curve,40,route.radius,props.lowEffects?5:8,false);ref.current.geometry.dispose();ref.current.geometry=geometry;
      plugA.current.position.copy(a);plugB.current.position.copy(b);invalidate();
    }
    material.emissive.set(props.selected===part.id?'#40d8e5':'#000000');material.emissiveIntensity=.5;material.transparent=ghost;material.opacity=ghost?.1:1;material.depthWrite=!ghost;
  });
  const click=(e:ThreeEvent<MouseEvent>)=>{if(ghost||e.delta>4)return;e.stopPropagation();props.stopRotate();props.onSelect(part.id);};
  return <group ref={root} name={part.id} visible={visible} onClick={click}>
    <mesh ref={ref} material={material} raycast={ghost?emptyRaycast:THREE.Mesh.prototype.raycast}><bufferGeometry/></mesh>
    <mesh ref={plugA} raycast={ghost?emptyRaycast:THREE.Mesh.prototype.raycast}><boxGeometry args={[route.radius*3,route.radius*4,route.radius*2.5]}/><meshStandardMaterial color={part.group==='Breath path'?'#7c9eaa':'#313c4b'} transparent={ghost} opacity={ghost?.1:1}/></mesh>
    <mesh ref={plugB} raycast={ghost?emptyRaycast:THREE.Mesh.prototype.raycast}><boxGeometry args={[route.radius*3,route.radius*4,route.radius*2.5]}/><meshStandardMaterial color={part.group==='Breath path'?'#7c9eaa':'#a1aab5'} transparent={ghost} opacity={ghost?.1:1}/></mesh>
  </group>;
}
function ConnectionPath({edge,props,registry,index,count}:{edge:Connection;props:SceneProps;registry:Registry;index:number;count:number}){
  const line=useRef<any>(null);const label=useRef<THREE.Group>(null!);const pulse=useRef<THREE.Mesh>(null!);const last=useRef('');
  const curveRef=useRef<THREE.CatmullRomCurve3|null>(null);const info=layerInfo[edge.layer];const invalidate=useThree(s=>s.invalidate);
  useFrame(({clock})=>{
    const a=endpoint(registry,props.parts,edge.from.id,edge.from.anchor),b=endpoint(registry,props.parts,edge.to.id,edge.to.anchor);if(!a||!b||!line.current)return;
    const signature=props.selected+':'+[index,count,...a.toArray(),...b.toArray()].map(n=>n.toFixed(2)).join();
    if(signature!==last.current){last.current=signature;
      const lane=Math.max(-4,Math.min(4,index-(count-1)/2));
      let bend:Vec3=edge.layer==='mechanical'?[12,0,8]:[55+index%3*13,lane*26,35];
      const selectedPart=props.parts.find(p=>p.id===props.selected);
      const origin=selectedPart&&!selectedPart.route?endpoint(registry,props.parts,selectedPart.id,'center'):null;
      if(origin&&index>=0&&!props.globalConnections&&!props.simulation){const labelPoint=origin.add(new THREE.Vector3(100,lane*32,65));bend=labelPoint.sub(a.clone().lerp(b,.5)).toArray() as Vec3;}
      const pts=routePoints(a,b,bend);curveRef.current=new THREE.CatmullRomCurve3(pts);line.current.geometry.setPositions(pts.flatMap(p=>p.toArray()));line.current.computeLineDistances();label.current.position.copy(pts[16]);invalidate();}
    if(props.active&&!props.reducedMotion&&curveRef.current){pulse.current.position.copy(curveRef.current.getPointAt((clock.elapsedTime*.32)%1));invalidate();}
  });
  return <group>
    <Line ref={line} name={`connection-${edge.id}`} points={initialLinePoints} color={info.color} lineWidth={edge.layer==='audio'?3:1.7} dashed={edge.layer!=='power'} dashSize={edge.layer==='air'?8:edge.layer==='mechanical'?1:edge.layer==='audio'?7:4} gapSize={edge.layer==='mechanical'?3:2} depthTest={false} renderOrder={20} raycast={emptyRaycast}/>
    <group ref={label}>{!props.globalConnections&&!(props.selected==='teensy'&&(edge.id.startsWith('key-')||edge.layer==='mechanical'))&&<Html center style={{pointerEvents:'none'}}><span className="connection-tag" style={{borderColor:info.color}}>{edge.label}</span></Html>}</group>
    <mesh ref={pulse} visible={props.active&&edge.layer!=='mechanical'&&!props.reducedMotion} raycast={emptyRaycast}><sphereGeometry args={[1.7,8,6]}/><meshBasicMaterial color={info.color}/></mesh>
  </group>;
}
function CameraRig({props,registry}:{props:SceneProps;registry:Registry}){
  const controls=useRef<OrbitImpl>(null!);const {camera,invalidate,size}=useThree();
  const desired=useRef<{position:THREE.Vector3;target:THREE.Vector3}|null>(null);
  useEffect(()=>{
    const cmd=props.cameraCommand;let box=new THREE.Box3();
    const selected=cmd.id?props.parts.find(p=>p.id===cmd.id):null;
    if(selected){const root=registry.current.get(selected.id);if(root){root.updateWorldMatrix(true,true);const own=root.children[0];box.setFromObject(own);
      if(selected.kind==='switch')props.parts.filter(p=>p.parent===selected.id&&visibilityFor(p.id,props.visibility)!=='hidden').forEach(p=>{const cap=registry.current.get(p.id);if(cap)box.union(new THREE.Box3().setFromObject(cap.children[0]));});
    }}
    if(box.isEmpty()){
      props.parts.filter(p=>visibilityFor(p.id,props.visibility)!=='hidden').forEach(p=>{
        const object=registry.current.get(p.id);if(object){object.updateWorldMatrix(true,true);const own=new THREE.Box3().setFromObject(object.children[0]);box.union(own);}
      });
    }
    if(box.isEmpty())box.setFromCenterAndSize(new THREE.Vector3(10,40,0),new THREE.Vector3(230,450,120));
    const center=box.getCenter(new THREE.Vector3());const extent=box.getSize(new THREE.Vector3());
    if(size.width<500)center.y+=extent.y*.08;
    const directions:Record<string,Vec3>={front:[0,0,1],back:[0,0,-1],left:[-1,0,.03],right:[1,0,.03],isometric:[.43,.18,1],fit:[.45,.2,1]};
    const fov=(camera as THREE.PerspectiveCamera).fov*Math.PI/180;
    const distance=Math.max(extent.y,extent.x/(size.width/size.height),extent.z*.8)/(2*Math.tan(fov/2))*(size.width<500?1.6:1.25)+extent.z*.35;
    desired.current={position:center.clone().add(new THREE.Vector3(...directions[cmd.view]).normalize().multiplyScalar(Math.max(distance,35))),target:center};invalidate();
  },[props.cameraCommand,props.parts,props.assets.loading,size.width,size.height,camera,invalidate,registry]);
  useFrame((_,delta)=>{
    const d=desired.current;if(d&&controls.current){const alpha=props.reducedMotion?1:1-Math.exp(-delta*8);camera.position.lerp(d.position,alpha);controls.current.target.lerp(d.target,alpha);controls.current.update();if(camera.position.distanceTo(d.position)<.05){camera.position.copy(d.position);controls.current.target.copy(d.target);desired.current=null;}else invalidate();}
    if(props.autoRotate)invalidate();
  });
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.12} minDistance={12} maxDistance={2200} autoRotate={props.autoRotate&&!props.reducedMotion} autoRotateSpeed={.5} onStart={()=>{desired.current=null;props.stopRotate();}}/>;
}
function World(props:SceneProps){
  const registry=useRef(new Map<string,THREE.Group>());
  const {gl,camera,size,scene}=useThree();
  useEffect(()=>{
    if(!import.meta.env.DEV)return;
    // Read-only diagnostics for repeatable tests of the actual rendered scene.
    const diagnostics=()=>({
      parts:props.parts.filter(p=>!p.route).map(p=>{const object=registry.current.get(p.id);const world=object?object.getWorldPosition(new THREE.Vector3()):new THREE.Vector3();const projected=world.clone().project(camera);return {id:p.id,local:object?.position.toArray(),world:world.toArray(),screen:[(projected.x+1)*size.width/2,(1-projected.y)*size.height/2],visible:visibilityFor(p.id,props.visibility)!=='hidden'};}),
      selected:props.selected,explosion:props.explosion,drawCalls:gl.info.render.calls,triangles:gl.info.render.triangles,camera:camera.position.toArray(),
      connections:props.connections.map(e=>({id:e.id,from:endpoint(registry,props.parts,e.from.id,e.from.anchor)?.toArray(),to:endpoint(registry,props.parts,e.to.id,e.to.anchor)?.toArray()})),
      paths:props.connections.flatMap(e=>{const line=scene.getObjectByName(`connection-${e.id}`) as THREE.Mesh|undefined;const start=line?.geometry.getAttribute('instanceStart'),end=line?.geometry.getAttribute('instanceEnd');return start&&end?[{id:e.id,segments:start.count,from:[start.getX(0),start.getY(0),start.getZ(0)],to:[end.getX(end.count-1),end.getY(end.count-1),end.getZ(end.count-1)]}]:[];}),
    });
    (window as unknown as {__LAB_TEST__?:typeof diagnostics}).__LAB_TEST__=diagnostics;
    return()=>{delete (window as unknown as {__LAB_TEST__?:typeof diagnostics}).__LAB_TEST__;};
  },[props,gl,camera,size,scene]);
  const causalIds=['usb','pressure-branch','pressure-port','drain-air','raw-sensor','conditioned','i2s','analog'];
  const adjacent=props.connections.filter(e=>props.layers.includes(e.layer)&&(props.simulation?(causalIds.includes(e.id)||(e.id.startsWith('key-')&&props.pressed.has(e.id.slice(4)))):(props.globalConnections||e.from.id===props.selected||e.to.id===props.selected||e.via===props.selected)));
  const edges=adjacent.filter(e=>visibilityFor(e.from.id,props.visibility)!=='hidden'&&visibilityFor(e.to.id,props.visibility)!=='hidden');
  const labelledEdges=edges.filter(e=>!(props.selected==='teensy'&&(e.id.startsWith('key-')||e.layer==='mechanical')));
  return <>
    <ambientLight intensity={.6}/><hemisphereLight args={['#d1ebff','#3b291a',1.2]}/>
    <directionalLight position={[100,200,300]} intensity={2}/><directionalLight position={[-160,60,-150]} color="#72b5cf" intensity={1.4}/>
    <gridHelper args={[1100,44,'#24343d','#17252e']} position={[0,-211,0]}/>
    {props.parts.filter(p=>!p.parent&&!p.route).map(p=><PartObject key={p.id} part={p} props={props} registry={registry}/>)}
    {props.parts.filter(p=>p.route).map(p=><PhysicalCable key={p.id} part={p} props={props} registry={registry}/>)}
    {props.showConnections&&edges.map(e=><ConnectionPath key={e.id} edge={e} props={props} registry={registry} index={labelledEdges.indexOf(e)} count={labelledEdges.length}/>)}
    <CameraRig props={props} registry={registry}/>
  </>;
}
export function Scene(props:SceneProps){
  return <Canvas camera={{position:[350,170,590],fov:37,near:.1,far:5000}} dpr={props.lowEffects?1:[1,1.5]} frameloop="demand" gl={{antialias:!props.lowEffects,alpha:true,preserveDrawingBuffer:true,powerPreference:'high-performance'}} onPointerMissed={()=>props.stopRotate()} fallback={<div role="alert">WebGL is unavailable. Enable hardware acceleration and reload to explore the 3D scene.</div>}>
    <World {...props}/>
  </Canvas>;
}
