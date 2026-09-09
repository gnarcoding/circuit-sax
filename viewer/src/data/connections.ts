import { parts, type Configuration, type Endpoint } from './manifest';
export type Layer = 'mechanical' | 'air' | 'power' | 'control' | 'audio';
export interface Connection { id:string; from:Endpoint; to:Endpoint; layer:Layer; label:string; medium:'Physical cable / tube'|'Board / header'|'Conceptual overlay'; status:'Source-supported'|'Proposed'|'Unresolved'; explanation:string; via?:string; pins?:string; }
export const layerInfo:Record<Layer,{label:string;color:string;style:string}> = {
  mechanical:{label:'Mechanical attachment',color:'#a5adbc',style:'Dotted'},
  air:{label:'Air pressure & drainage',color:'#73d7e4',style:'Long dash'},
  power:{label:'Power & circuit ground',color:'#eab55b',style:'Solid'},
  control:{label:'Key & sensor signals',color:'#83cc9a',style:'Short dash'},
  audio:{label:'Digital / headphone audio',color:'#c0a1ff',style:'Heavy dash'},
};
function edge(id:string,from:string,to:string,layer:Layer,label:string,explanation:string,extra:Partial<Connection>={}):Connection {
  return {id,from:{id:from,anchor:'center'},to:{id:to,anchor:'center'},layer,label,explanation,medium:'Conceptual overlay',status:'Source-supported',...extra};
}
export const connections:Connection[] = [
  ...parts.filter(p=>p.parent).map(p=>edge(`mount-${p.id}`,p.id,p.parent!,'mechanical','Illustrative attachment','The parent assembly carries this part during explosion. Attachment location and fit are inferred.',{status:'Proposed'})),
  ...parts.filter(p=>p.kind==='switch').map(p=>edge(`key-${p.key}`,p.id,'teensy','control',`${p.key} switch → read state`,`Pressed contact is read active-low with INPUT_PULLUP. The line summarizes a board/header relationship, not a literal external wire.`,{medium:'Board / header',pins:`CPP: Teensy GPIO ${p.gpio}; physical board wiring unverified.`,from:{id:p.id,anchor:'signal'},to:{id:'teensy',anchor:'control'}})),
  edge('usb','battery','teensy','power','5 V USB power','The bank supplies power, not notes. Only one USB power source is shown.',{medium:'Physical cable / tube',via:'usb-cable',from:{id:'battery',anchor:'usb'},to:{id:'teensy',anchor:'usb'}}),
  edge('power-shield','teensy','shield','power','3.3 V + circuit GND','Shield supply and circuit return through the interconnect; headphone return is separate.',{medium:'Board / header'}),
  edge('power-sensor','teensy','pressure','power','5 V sensor supply + GND','The MPXV5010GP requires 4.75–5.25 V. This does not make its output safe for the ADC.',{medium:'Board / header',status:'Proposed'}),
  edge('power-imu','teensy','imu','power','Module supply / 3.3 V logic','Exact module supply and pull-ups require review.',{medium:'Board / header',status:'Proposed'}),
  edge('mouth-air','mouthpiece','neck-rest','air','Breath enters neck','Air enters the neck and splits toward exhaust and the pressure branch.'),
  edge('pressure-branch','neck-rest','moisture','air','Pressure branch → barrier','Proposed dry-side protection; pressure is transmitted into a closed branch.',{medium:'Physical cable / tube',status:'Proposed',via:'sensor-tube',from:{id:'neck-rest',anchor:'branch'},to:{id:'moisture',anchor:'inlet'}}),
  edge('pressure-port','moisture','pressure','air','Pressure reaches sensor port','No continuous airflow through the pressure sensor electronics.',{medium:'Physical cable / tube',status:'Proposed',via:'dry-tube',from:{id:'moisture',anchor:'outlet'},to:{id:'pressure',anchor:'port'}}),
  edge('drain-air','neck-rest','drain','air','Separate air / moisture exhaust','Open wet-side path to the drain; not through the sensor.',{medium:'Physical cable / tube',status:'Proposed',via:'drain-tube',from:{id:'neck-rest',anchor:'drain'},to:{id:'drain',anchor:'inlet'}}),
  edge('raw-sensor','pressure','conditioning','control','Raw sensor output · requires conditioning','Nominal sensor output can approach 5 V. Direct connection to the Teensy is incompatible.',{status:'Unresolved'}),
  edge('conditioned','conditioning','teensy','control','Conditioned breath → ADC · unresolved','Required conditioning/protection has no reviewed final design. This is not a safe-to-build schematic.',{status:'Unresolved',pins:'CPP breathPin = GPIO 26 / A12. Assignment alone does not verify wiring.'}),
  edge('motion','imu','teensy','control','Motion → Wire2 I2C','The firmware reads motion for vibrato; the three-key bench omits this module.',{medium:'Board / header',pins:'CPP / PJRC Wire2: SDA 25, SCL 24.'}),
  edge('i2s','teensy','shield','audio','I2S · digital audio','Synthesized samples leave the Teensy over I2S. These are audio data and clock connections.',{medium:'Board / header',pins:'PJRC Rev D/D2: DIN 7, LRCLK 20, BCLK 21, MCLK 23. DOUT 8 is not needed for synth output.'}),
  edge('codec','teensy','shield','control','I2C · codec configuration','I2C sets up the Audio Shield codec. It is a different interface from I2S audio.',{medium:'Board / header',pins:'PJRC / CPP Wire: SDA 18, SCL 19.'}),
  edge('analog','shield','headphones','audio','Analog stereo → headphones','Audio Shield headphone output. Sleeve is isolated HP_VGND; do not join it to circuit GND.',{medium:'Physical cable / tube',via:'headphone-cable',from:{id:'shield',anchor:'jack'},to:{id:'headphones',anchor:'plug'}}),
];
export function configuredConnections(config:Configuration):Connection[] {
  const ids=new Set(parts.filter(p=>p.configurations.includes(config)).map(p=>p.id));
  return connections.map(e=>config==='bench'&&e.layer==='mechanical'&&e.to.id==='main-board'?{...e,to:{...e.to,id:'bench-board'}}:e).filter(e=>ids.has(e.from.id)&&ids.has(e.to.id));
}
export function adjacentConnections(id:string,config:Configuration):Connection[] {
  return configuredConnections(config).filter(e=>e.from.id===id||e.to.id===id||e.via===id);
}
