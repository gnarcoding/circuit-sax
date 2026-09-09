import { type Part, type Vec3 } from './data/manifest';
export type Visibility = { hidden:string[]; isolated:string|null; ghost:boolean };
export function visibilityFor(id:string,state:Visibility):'hidden'|'ghost'|'solid' {
  if(state.hidden.includes(id)||(state.isolated && state.isolated!==id)) return 'hidden';
  return 'solid';
}
export function partOffset(part:Part,progress:number,staged:boolean,extract=0):Vec3 {
  const p=Math.min(1,Math.max(0,progress));
  const amount=staged?Math.min(1,Math.max(0,p*4-part.stage)):p;
  const length=Math.hypot(...part.explosion)||1;
  return part.position.map((v,i)=>v+part.explosion[i]*amount+part.explosion[i]/length*extract) as Vec3;
}
// Direct port of getPressedNote(), CPP lines 139–244. Stateful front-F/config
// shortcuts are intentionally unsupported; baseOct stays at 4. No timing emulation.
export function fingering(keys:ReadonlySet<string>,transposition=3):{midi:number|null;written:number|null;reason?:string} {
  if(keys.has('ff')||keys.has('config')) return {midi:null,written:null,reason:'Front-F octave-jump / configuration state is not simulated.'};
  const p=(k:string)=>keys.has(k);
  let note=13+(p('oct')?5:4)*12+transposition;
  const white=['B','A','G','F','E','D','lowC','lowB'];
  for(let i=0;i<8;i++) {
    if(p(white[i])) {
      note-=(i===4||i===7)?1:2;
      if(i===7&&p('lowBb'))note--;
    } else {
      switch(i){
        case 0: if(p('A'))note--;else if(p('palmD')){note++;if(p('palmDs')){note++;if(p('sideTop')&&!p('palmF'))note++;else if(p('palmF'))note+=2;}}break;
        case 1: if(p('bis'))note--;if(p('sideMid'))note++;else if(['F','E','D'].some(p))note--;break;
        case 2: if(p('sideLow'))note++;break;
        case 3: if(p('Gs'))note++;else if(p('E'))note--;break;
        case 6: if(p('Eb'))note++;break;
        case 7: if(p('Cs'))note++;if(p('lowBb'))note-=2;break;
      }
      break;
    }
  }
  return {midi:note,written:note-transposition};
}
export function noteName(midi:number):string {return ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][((midi%12)+12)%12]+(Math.floor(midi/12)-1);}
export function simulationOutput(power:boolean,breath:number,keys:ReadonlySet<string>,transposition:number) {
  const fing=fingering(keys,transposition);
  return {...fing,active:power&&breath>0&&fing.midi!==null};
}
