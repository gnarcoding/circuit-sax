import { useEffect,useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import type { Vec3 } from './data/manifest';
export interface AssetRecord {id:string;file:string;url:string;triangles:number;min:Vec3;max:Vec3;extent:Vec3;center:Vec3;stem:Vec3;sha256:string;error?:string}
export interface Inventory {revision:string;assets:AssetRecord[];sourceFiles:{path:string;url?:string;error?:string;sha256?:string}[];extraFiles:string[]}
export interface AssetState {inventory?:Inventory;meshes:Map<string,THREE.BufferGeometry>;errors:string[];loading:boolean}
let pending:Promise<AssetState>|undefined;
async function loadAssets():Promise<AssetState>{
  const response=await fetch('/assets/inventory.json');if(!response.ok)throw Error('Asset inventory missing. Run npm run prepare-assets.');
  const inventory:Inventory=await response.json();const meshes=new Map<string,THREE.BufferGeometry>();const errors:string[]=[];
  await Promise.all(inventory.assets.map(async asset=>{
    try{
      if(asset.error)throw Error(asset.error);
      const r=await fetch(asset.url);if(!r.ok)throw Error(`HTTP ${r.status}`);const buffer=await r.arrayBuffer();
      if(new TextDecoder().decode(buffer.slice(0,150)).includes('git-lfs'))throw Error('Git LFS pointer instead of mesh');
      if(buffer.byteLength<84||new DataView(buffer).getUint32(80,true)*50+84!==buffer.byteLength)throw Error('Malformed STL');
      const geo=new STLLoader().parse(buffer);const center=Number(asset.id.split('_')[0])<17?asset.stem:asset.center;
      geo.translate(-center[0],-center[1],-center[2]);geo.computeBoundingBox();geo.computeBoundingSphere();meshes.set(asset.id,geo);
    }catch(error){errors.push(`${asset.file}: ${String(error)}`);}
  }));
  inventory.sourceFiles.filter(f=>f.error).forEach(f=>errors.push(`${f.path}: ${f.error}`));
  if(inventory.extraFiles.length)errors.push(`Unmapped extra assets: ${inventory.extraFiles.join(', ')}`);
  return {inventory,meshes,errors,loading:false};
}
export function useAssets(){const [state,set]=useState<AssetState>({meshes:new Map(),errors:[],loading:true});useEffect(()=>{let live=true;pending??=loadAssets();pending.then(s=>{if(live)set(s);}).catch(e=>{if(live)set({meshes:new Map(),loading:false,errors:[String(e)]});});return()=>{live=false;};},[]);return state;}
