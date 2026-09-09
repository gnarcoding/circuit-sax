import { describe,it,expect } from 'vitest';
import { readFileSync,existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { parts,controls,assetNames,configuredParts,type Configuration } from './data/manifest';
import { connections,configuredConnections,adjacentConnections } from './data/connections';
import { partOffset,visibilityFor,fingering,noteName,simulationOutput } from './logic';
import type { Inventory } from './assets';
// @ts-expect-error Shared plain-JS validator used by the cross-platform preparation script.
import { inspectSTL } from '../scripts/stl.mjs';
const inventory:Inventory=JSON.parse(readFileSync(resolve('public/assets/inventory.json'),'utf8'));
describe('Source assets and manifest',()=>{
  it('rejects missing records, Git LFS pointers and non-finite geometry',()=>{
    expect(()=>inspectSTL(Buffer.from('version https://git-lfs.github.com/spec/v1\noid sha256:test'))).toThrow('Git LFS');
    expect(()=>inspectSTL(Buffer.alloc(20))).toThrow('header');
    const malformed=Buffer.alloc(84);malformed.writeUInt32LE(2,80);expect(()=>inspectSTL(malformed)).toThrow('records');
    const nonfinite=Buffer.alloc(134);nonfinite.writeUInt32LE(1,80);nonfinite.writeFloatLE(NaN,96);expect(()=>inspectSTL(nonfinite)).toThrow('Non-finite');
  });
  it('loads all 19 binary assets and preserves original bytes',()=>{
    expect(inventory.assets).toHaveLength(19);
    for(const a of inventory.assets){expect(a.error).toBeUndefined();expect(existsSync(resolve('public'+a.url))).toBe(true);const original=readFileSync(resolve('../models',a.file));const copy=readFileSync(resolve('public'+a.url));expect(copy.equals(original)).toBe(true);expect(createHash('sha256').update(original).digest('hex')).toBe(a.sha256);expect(copy.length).toBe(84+copy.readUInt32LE(80)*50);expect(a.extent.every(n=>Number.isFinite(n)&&n>0)).toBe(true);}
  });
  it('has unique component, control and connection IDs',()=>{expect(new Set(parts.map(p=>p.id)).size).toBe(parts.length);expect(new Set(controls.map(p=>p.key)).size).toBe(controls.length);expect(new Set(connections.map(e=>e.id)).size).toBe(connections.length);});
  it('separates 21 playing controls plus configuration from the 19 source files',()=>{const full=configuredParts('full');expect(full.filter(p=>p.kind==='switch')).toHaveLength(22);expect(full.filter(p=>p.kind==='stl'&&p.key)).toHaveLength(21);expect(full.filter(p=>p.assetId==='8_PK23')).toHaveLength(2);expect(full.filter(p=>p.assetId==='13_Standard')).toHaveLength(4);expect(full.filter(p=>p.kind==='stl')).toHaveLength(23);expect(full.some(p=>p.id==='cap-config')).toBe(false);});
  it('includes all 19 real STLs in the full instrument',()=>expect(new Set(configuredParts('full').filter(p=>p.assetId).map(p=>p.assetId))).toEqual(new Set(assetNames)));
  it('keeps the separate bench at three keys without an IMU or full PCB',()=>{const bench=configuredParts('bench');expect(bench.filter(p=>p.kind==='switch').map(p=>p.key)).toEqual(['B','A','G']);expect(bench.some(p=>p.id==='imu'||p.id==='main-board')).toBe(false);for(const id of ['teensy','shield','pressure','conditioning','mouthpiece','battery','headphones','usb-cable','headphone-cable'])expect(bench.some(p=>p.id===id)).toBe(true);});
  for(const config of ['full','bench'] as Configuration[]){
    it(`${config}: has valid parents without cycles`,()=>{const ps=configuredParts(config),map=new Map(ps.map(p=>[p.id,p]));for(const p of ps){const seen=new Set([p.id]);let parent=p.parent;while(parent){expect(map.has(parent)).toBe(true);expect(seen.has(parent)).toBe(false);seen.add(parent);parent=map.get(parent)!.parent;}}});
    it(`${config}: all graph and physical-route endpoints resolve to named anchors`,()=>{const ps=configuredParts(config),map=new Map(ps.map(p=>[p.id,p]));for(const e of configuredConnections(config)){for(const end of [e.from,e.to]){expect(map.has(end.id)).toBe(true);expect(map.get(end.id)!.anchors[end.anchor]).toBeDefined();}if(e.via)expect(map.get(e.via)?.kind).toBe('cable');}for(const p of ps)if(p.route)for(const end of [p.route.from,p.route.to])expect(map.get(end.id)?.anchors[end.anchor]).toBeDefined();});
  }
  it('records distinct geometry, placement and function provenance',()=>{for(const p of parts){expect(p.evidence.geometry).toBeTruthy();expect(p.evidence.placement).toBeTruthy();expect(p.evidence.function).toBeTruthy();expect(p.sources.length).toBeGreaterThan(0);expect(p.unresolved.length).toBeGreaterThan(0);if(p.kind==='stl')expect(p.evidence.placement).not.toBe('Documented');}});
  it('traces GPIOs to CPP and does not import the alternate INO pinky map',()=>{const cpp=readFileSync(resolve('../v2/Circuit Sax v2/src/circuit_sax_v2.cpp'),'utf8');expect(cpp).toMatch(/LPKeys\[4\]\s*=\s*\{28, 29, 30, 31\}/);expect(cpp).toMatch(/whiteKeys\[8\]\s*=\s*\{10, 37, 32, 27, 33, 12/);expect(controls.find(c=>c.key==='Cs')?.gpio).toBe(29);expect(controls.find(c=>c.key==='lowB')?.gpio).toBe(30);expect(new Set(controls.map(c=>c.gpio)).size).toBe(22);expect(controls.map(c=>c.gpio)).not.toContain(22);});
  it('keeps pressure conditioning explicit and headphone return separate',()=>{expect(connections.some(e=>e.from.id==='pressure'&&e.to.id==='teensy')).toBe(false);expect(connections.find(e=>e.id==='conditioned')?.status).toBe('Unresolved');expect(connections.filter(e=>e.layer==='power').some(e=>e.to.id==='headphones')).toBe(false);expect(connections.find(e=>e.id==='analog')?.explanation).toContain('HP_VGND');});
});
describe('Explosion, selection and visibility',()=>{
  it('returns exactly to saved transforms after repeated cycles',()=>{for(const p of parts)for(let i=0;i<50;i++){partOffset(p,1,false);partOffset(p,.57,true,22);expect(partOffset(p,0,false,0)).toEqual(p.position);}});
  it('staged movement separates caps before switches and electronics',()=>{const cap=parts.find(p=>p.id==='cap-B')!,sw=parts.find(p=>p.id==='switch-B')!,teensy=parts.find(p=>p.id==='teensy')!;expect(partOffset(cap,.2,true)).not.toEqual(cap.position);expect(partOffset(sw,.2,true)).toEqual(sw.position);expect(partOffset(teensy,.7,true)).toEqual(teensy.position);expect(partOffset(teensy,1,true)).toEqual(partOffset(teensy,1,false));});
  it('supports axis extraction, clamping and return without modifying data',()=>{const p=parts.find(p=>p.id==='cap-B')!;const saved=JSON.stringify(p);expect(partOffset(p,0,false,20)[2]).toBe(p.position[2]+20);expect(partOffset(p,-5,false)).toEqual(p.position);expect(partOffset(p,2,false)).toEqual(partOffset(p,1,false));expect(JSON.stringify(p)).toBe(saved);});
  it('hides explicit IDs, isolates one part, and restores all',()=>{expect(visibilityFor('cap-B',{hidden:['cap-B'],isolated:null,ghost:false})).toBe('hidden');expect(visibilityFor('cap-A',{hidden:[],isolated:'cap-B',ghost:false})).toBe('hidden');expect(visibilityFor('cap-B',{hidden:[],isolated:'cap-B',ghost:true})).toBe('solid');expect(visibilityFor('cap-A',{hidden:[],isolated:null,ghost:false})).toBe('solid');});
  it('selects the same data ID used by the graph and part tree',()=>{const selected='pressure';expect(parts.find(p=>p.id===selected)?.name).toContain('MPXV5010GP');expect(adjacentConnections(selected,'full').map(e=>e.id)).toContain('raw-sensor');expect(adjacentConnections('headphone-cable','full').map(e=>e.id)).toContain('analog');});
});
describe('CPP fingering and simulation',()=>{
  it.each([[[],61],[['B'],59],[['B','A'],57],[['B','A','G'],55]] as [string[],number][])('bench fixture %j → MIDI %i (plan section 4)',(keys,midi)=>{expect(fingering(new Set(keys),0).midi).toBe(midi);});
  it('makes transposition explicit, retaining the written/reference pitch',()=>{expect(fingering(new Set(['B']),3)).toEqual({midi:62,written:59});expect(noteName(60)).toBe('C4');expect(noteName(59)).toBe('B3');});
  it.each([[['A'],60],[['B','bis'],58],[['B','A','sideLow'],58],[['B','A','G','Gs'],56],[['B','A','G','F','E','D'],50],[['palmD','palmDs','palmF'],65],[['B','A','G','F','E','D','lowC','lowB','lowBb'],46],[['B','oct'],71]] as [string[],number][])('CPP branch %j → MIDI %i without transposition',(keys,midi)=>expect(fingering(new Set(keys),0).midi).toBe(midi));
  it('does not treat keys like independent piano notes',()=>{expect(fingering(new Set(['G']),0).midi).toBe(61);expect(fingering(new Set(['B','A','G']),0).midi).toBe(55);});
  it('identifies unsupported stateful shortcuts',()=>{expect(fingering(new Set(['ff'])).midi).toBeNull();expect(fingering(new Set(['config'])).reason).toContain('not simulated');});
  it('produces no active output at zero breath or with power off',()=>{expect(simulationOutput(true,0,new Set(),3).active).toBe(false);expect(simulationOutput(false,100,new Set(),3).active).toBe(false);expect(simulationOutput(true,50,new Set(['B']),3).active).toBe(true);expect(simulationOutput(true,50,new Set(['ff']),3).active).toBe(false);});
});
