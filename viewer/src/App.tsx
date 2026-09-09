import { Component,useCallback,useEffect,useMemo,useRef,useState,type ReactNode } from 'react';
import { Scene,type CameraCommand } from './Scene';
import { useAssets } from './assets';
import { configuredParts,controls,groups,libraryPart,partMap,sourceLinks,assetNames,type Configuration,type Part } from './data/manifest';
import { adjacentConnections,configuredConnections,layerInfo,type Layer } from './data/connections';
import { noteName,simulationOutput,type Visibility } from './logic';
import './style.css';
class SceneBoundary extends Component<{children:ReactNode},{error:string|null}>{
  state={error:null as string|null};static getDerivedStateFromError(error:Error){return {error:error.message};}
  render(){return this.state.error?<div className="scene-error" role="alert"><h2>3D scene could not start</h2><p>{this.state.error}</p><button onClick={()=>location.reload()}>Reload scene</button></div>:this.props.children;}
}
const tour=[
  {title:'The printed keys',id:'cap-B',text:'These are the original sax-shaped meshes. Your fingers press curved caps; the shape helps your hand find its way.',explode:0},
  {title:'The switches underneath',id:'switch-B',text:'Each cap presses a separate mechanical switch. The Teensy reads that contact as pressed or released. The fit and press motion here are illustrative.',explode:.5},
  {title:'The breath path',id:'pressure',text:'Pressure travels into a closed sensor branch. Air and moisture escape down a separate drain. The barrier and voltage protection still need engineering review.',explode:.25},
  {title:'The Teensy brain',id:'teensy',text:'This tiny board is the computer. It combines fingering and breath to create digital audio; no laptop is needed while playing.',explode:.4},
  {title:'The Audio Shield and headphones',id:'shield',text:'I2S carries digital audio into the shield. I2C configures it. The headphone jack supplies analog sound; its return must stay isolated from circuit ground.',explode:.5},
  {title:'Battery-powered playing',id:'battery',text:'Follow the visible USB cable from the power bank to the Micro-B socket. The bank supplies energy, not musical instructions.',explode:.3},
  {title:'Bench versus full instrument',id:'bench-board',text:'The separate three-key bench reuses B, A, G, breath sensing, Teensy and audio. It omits the IMU and does not validate the complete sax mechanics.',explode:0},
];
const allLayers=Object.keys(layerInfo) as Layer[];
export default function App(){
  const assets=useAssets();
  const [configuration,setConfiguration]=useState<Configuration>('full');
  const [mode,setMode]=useState<'assembly'|'simulation'|'library'>('assembly');
  const [libraryAsset,setLibraryAsset]=useState('13_Standard');
  const [selected,setSelected]=useState<string|null>(null);
  const [search,setSearch]=useState('');
  const [explosion,setExplosion]=useState(0);const [staged,setStaged]=useState(false);const [extract,setExtract]=useState(0);
  const [visibility,setVisibility]=useState<Visibility>({hidden:[],isolated:null,ghost:false});
  const [showConnections,setShowConnections]=useState(false);const [globalConnections,setGlobalConnections]=useState(false);const [layers,setLayers]=useState<Layer[]>(allLayers);
  const [camera,setCamera]=useState<CameraCommand>({serial:0,view:'isometric'});
  const [autoRotate,setAutoRotate]=useState(false);const [xray,setXray]=useState(false);const [lowEffects,setLowEffects]=useState(false);
  const reducedMotion=useMemo(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches,[]);
  const [sourcesOpen,setSourcesOpen]=useState(false);const [leftOpen,setLeftOpen]=useState(false);const [rightOpen,setRightOpen]=useState(false);
  const inspectorScroll=useRef<HTMLDivElement>(null);
  const cameraTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [tourStep,setTourStep]=useState<number|null>(null);const [sequence,setSequence]=useState<number|null>(null);
  const [power,setPower]=useState(true);const [breath,setBreath]=useState(0);const [pressed,setPressed]=useState<Set<string>>(new Set());
  const [pressPreview,setPressPreview]=useState(false);const [sound,setSound]=useState(false);const [soundError,setSoundError]=useState('');
  const audio=useRef<{context:AudioContext;gain:GainNode;osc:OscillatorNode}|null>(null);
  const parts=useMemo(()=>mode==='library'?[libraryPart(libraryAsset)]:configuredParts(configuration),[mode,libraryAsset,configuration]);
  const connections=useMemo(()=>mode==='library'?[]:configuredConnections(configuration),[mode,configuration]);
  const chosen=parts.find(p=>p.id===selected);
  const adjacent=chosen&&mode!=='library'?adjacentConnections(chosen.id,configuration):[];
  const output=simulationOutput(power,breath,pressed,configuration==='bench'?0:3);
  const active=mode==='simulation'&&output.active;
  const focus=useCallback((view:CameraCommand['view']='isometric',id?:string)=>{if(cameraTimer.current)clearTimeout(cameraTimer.current);setCamera(old=>({serial:old.serial+1,view,id}));},[]);
  const laterFocus=(view:CameraCommand['view']='isometric',id?:string,delay=600)=>{if(cameraTimer.current)clearTimeout(cameraTimer.current);cameraTimer.current=setTimeout(()=>focus(view,id),delay);};
  const stopRotate=useCallback(()=>setAutoRotate(false),[]);
  const choose=useCallback((id:string)=>{if(cameraTimer.current)clearTimeout(cameraTimer.current);setSelected(id);setExtract(0);setPressPreview(false);setRightOpen(true);setLeftOpen(false);setAutoRotate(false);inspectorScroll.current?.scrollTo({top:0});},[]);
  const restore=()=>{setVisibility({hidden:[],isolated:null,ghost:false});setExtract(0);setPressPreview(false);};
  const resetSimulation=useCallback(()=>{setBreath(0);setPressed(new Set());setPower(true);setSound(false);if(audio.current){const a=audio.current;a.gain.gain.cancelScheduledValues(a.context.currentTime);a.gain.gain.setValueAtTime(0,a.context.currentTime);}},[]);
  const changeConfiguration=(config:Configuration)=>{
    setConfiguration(config);setMode('assembly');setSelected(null);setExplosion(0);restore();setSearch('');setTourStep(null);setSequence(null);resetSimulation();setShowConnections(false);focus();
  };
  const changeMode=(next:typeof mode)=>{setMode(next);setSequence(null);setTourStep(null);restore();resetSimulation();setSelected(next==='library'?`asset-${libraryAsset}`:null);setExplosion(0);setSearch('');setShowConnections(next==='simulation');if(next==='simulation'){setLayers(allLayers);setGlobalConnections(false);}focus();};
  const toggleKey=useCallback((key:string)=>setPressed(old=>{const next=new Set(old);next.has(key)?next.delete(key):next.add(key);return next;}),[]);
  const showTour=(index:number)=>{
    const step=tour[index];setTourStep(index);setSequence(null);setMode('assembly');setConfiguration(index===6?'bench':'full');setSelected(step.id);setExplosion(step.explode);restore();setShowConnections(index>=2&&index<=5);setGlobalConnections(false);setLayers(allLayers);setRightOpen(true);resetSimulation();
    laterFocus('fit',step.id);
  };
  const assemblySequence=(index:number)=>{
    setSequence(index);setTourStep(null);setMode('assembly');setConfiguration('full');setStaged(true);restore();setSelected(null);setShowConnections(false);setExplosion([1,.75,.5,.25,0][index]);focus();
    laterFocus('isometric',undefined,650);
  };
  useEffect(()=>{if(!sound||!audio.current)return;const a=audio.current;a.osc.frequency.setTargetAtTime(output.midi===null?220:440*2**((output.midi-69)/12),a.context.currentTime,.015);a.gain.gain.setTargetAtTime(active?breath/100*.018:0,a.context.currentTime,.01);},[active,breath,output.midi,sound]);
  useEffect(()=>{
    const silence=()=>{if(document.hidden){setSound(false);if(audio.current){const a=audio.current;a.gain.gain.cancelScheduledValues(a.context.currentTime);a.gain.gain.setValueAtTime(0,a.context.currentTime);}}};document.addEventListener('visibilitychange',silence);
    return()=>{document.removeEventListener('visibilitychange',silence);audio.current?.context.close();};
  },[]);
  useEffect(()=>{const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){setSourcesOpen(false);setLeftOpen(false);setRightOpen(false);setAutoRotate(false);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
  useEffect(()=>()=>{if(cameraTimer.current)clearTimeout(cameraTimer.current);},[]);
  async function toggleSound(){
    if(sound){setSound(false);if(audio.current){const a=audio.current;a.gain.gain.cancelScheduledValues(a.context.currentTime);a.gain.gain.setValueAtTime(0,a.context.currentTime);}return;}
    try{if(!audio.current){const context=new AudioContext();const gain=context.createGain();gain.gain.value=0;gain.connect(context.destination);const osc=context.createOscillator();osc.type='sine';osc.connect(gain);osc.start();audio.current={context,gain,osc};}await audio.current.context.resume();setSound(true);setSoundError('');}catch(e){setSoundError(String(e));}
  }
  const visibleCount=parts.filter(p=>!visibility.hidden.includes(p.id)&&(!visibility.isolated||visibility.isolated===p.id)).length;
  const stats=mode==='library'?'ORIGINAL ASSET / NO PLACEMENT':configuration==='full'?'21 PLAYING CONTROLS + CONFIG':'B / A / G · IMU OMITTED';
  return <div className="lab">
    <header className="topbar">
      <div className="wordmark"><span className="mark">CS<span>▥</span></span><div><strong>CIRCUIT SAX <i>//</i></strong><span>ASSEMBLY LAB</span></div></div>
      <nav className="modes" aria-label="Workspace mode">
        <button className={mode==='assembly'?'active':''} onClick={()=>changeMode('assembly')}>Assembly</button>
        <button className={mode==='simulation'?'active':''} onClick={()=>changeMode('simulation')}>Play the signal</button>
        <button className={mode==='library'?'active':''} onClick={()=>changeMode('library')}>Asset library</button>
      </nav>
      <button className="source-button" onClick={()=>setSourcesOpen(true)}>Sources & assumptions ↗</button>
    </header>
    <div className="configbar">
      <div className="config-select"><span className="status-dot"/><label htmlFor="configuration">CONFIGURATION</label><select id="configuration" value={configuration} onChange={e=>changeConfiguration(e.target.value as Configuration)}><option value="full">Full Phase 1 instrument</option><option value="bench">Three-key bench</option></select></div>
      <span className="config-caption">{stats}</span>
      <div className="view-style"><button className={!xray?'active':''} onClick={()=>setXray(false)}>Solid</button><button className={xray?'active':''} onClick={()=>setXray(true)}>X-ray</button><label><input type="checkbox" checked={lowEffects} onChange={e=>setLowEffects(e.target.checked)}/>Low effects</label></div>
    </div>
    <main className="workspace">
      <div className="mobile-panels"><button onClick={()=>{setLeftOpen(!leftOpen);setRightOpen(false);}}>☷ Parts</button><button onClick={()=>{setRightOpen(!rightOpen);setLeftOpen(false);}}>ⓘ Inspector</button></div>
      <aside className={`parts-panel ${leftOpen?'open':''}`} aria-label="Parts tree">
        <div className="panel-title"><span>{mode==='library'?'ASSET LIBRARY':'INSTRUMENT PARTS'}</span><span className="count">{mode==='library'?'19':parts.length}</span></div>
        <input className="search" aria-label="Search parts" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search a part or function…"/>
        <div className="tree-scroll">
        {mode==='library'?<><p className="small muted">Original meshes, independently inspectable. No per-part rescaling.</p>{assetNames.filter(a=>a.toLowerCase().includes(search.toLowerCase())).map(a=><button className={`tree-item ${a===libraryAsset?'selected':''}`} key={a} onClick={()=>{setLibraryAsset(a);setSelected(`asset-${a}`);focus('fit',`asset-${a}`);}}><span className="part-dot mesh"/>{a}.stl</button>)}</>:groups.map(group=>{
          const entries=parts.filter(p=>p.group===group&&`${p.name} ${p.id} ${p.assetId??''} ${p.what}`.toLowerCase().includes(search.toLowerCase()));
          if(!entries.length)return null;
          return <details key={group} open><summary>{group}<span>{entries.length}</span></summary>{entries.map(p=><button key={p.id} className={`tree-item ${selected===p.id?'selected':''} ${visibility.hidden.includes(p.id)?'hidden-part':''}`} onClick={()=>choose(p.id)} title={p.name} data-part-id={p.id}><span className={`part-dot ${p.kind==='stl'?'mesh':''}`}/><span>{p.name}</span>{visibility.hidden.includes(p.id)&&<span>◌</span>}</button>)}</details>;
        })}
        {search&&!(mode==='library'?assetNames.filter(a=>a.toLowerCase().includes(search.toLowerCase())):parts.filter(p=>`${p.name} ${p.id} ${p.assetId??''} ${p.what}`.toLowerCase().includes(search.toLowerCase()))).length&&<p className="small muted">No matching parts. Try a name such as “breath” or “Teensy”.</p>}
        </div>
        <div className="tree-footer"><span><b className="cyan-dot"/>Original mesh</span><span><b className="amber-dot"/>Reconstructed</span><button onClick={restore}>Restore all</button></div>
      </aside>
      <section className="viewport" aria-label="Interactive 3D instrument">
        <div className="scene-heading"><div className="eyebrow">{mode==='simulation'?'SIMULATION · NO HARDWARE CONNECTED':mode==='library'?'PUBLISHED GEOMETRY':'OPEN-PCB INSTRUMENT / PHASE 01'}</div><h1>{mode==='library'?libraryAsset:configuration==='full'?'The whole sax.':'The first three keys.'}</h1><p>{mode==='library'?'Rotate to inspect the original faces, stems and channels.':mode==='simulation'?'Latch keys. Add breath. Follow the sound.':'Orbit to explore. Select any part to look closer.'}</p></div>
        <SceneBoundary><Scene parts={parts} assets={assets} selected={selected} onSelect={choose} explosion={explosion} staged={staged} extract={extract} visibility={visibility} connections={connections} layers={layers} showConnections={showConnections} globalConnections={globalConnections} cameraCommand={camera} autoRotate={autoRotate} stopRotate={stopRotate} xray={xray} lowEffects={lowEffects} reducedMotion={reducedMotion} simulation={mode==='simulation'} pressed={pressed} onKey={toggleKey} active={active} pressPreview={pressPreview}/></SceneBoundary>
        {assets.loading&&<div className="loading" role="status"><span className="status-dot"/> Loading original meshes…</div>}
        {assets.errors.length>0&&<div className="asset-errors" role="alert"><b>Some assets could not load</b>{assets.errors.map(e=><div key={e}>{e}</div>)}<span>Run npm run prepare-assets after restoring the original files.</span></div>}
        <div className="camera-controls" aria-label="Camera views">{(['front','back','left','right','isometric'] as const).map(view=><button key={view} title={`${view} view`} onClick={()=>focus(view)}>{view==='isometric'?'Iso':view[0].toUpperCase()+view.slice(1)}</button>)}<button title="Reset camera to fit visible assembly" onClick={()=>{setAutoRotate(false);focus();}}>Reset view</button><button className={autoRotate?'active':''} aria-pressed={autoRotate} disabled={reducedMotion} onClick={()=>setAutoRotate(!autoRotate)}>↻ Orbit</button></div>
        <div className="scene-meta"><span>{visibleCount} visible parts · {assets.meshes.size}/19 meshes loaded</span><span>Scale: assumed mm</span></div>
        {tourStep!==null&&<div className="guide"><div className="eyebrow">GUIDED TOUR / {tourStep+1} OF 7</div><h3>{tour[tourStep].title}</h3><p>{tour[tourStep].text}</p><div><button disabled={tourStep===0} onClick={()=>showTour(tourStep-1)}>← Previous</button><button onClick={()=>showTour((tourStep+1)%7)}>{tourStep===6?'Replay ↻':'Next →'}</button><button onClick={()=>{setTourStep(null);focus();}}>Close</button></div></div>}
        {sequence!==null&&<div className="guide"><div className="eyebrow">CONCEPTUAL ASSEMBLY / {sequence+1} OF 5</div><h3>{['Start with the separate assemblies','Bring electronics to their mounts','Join the side boards','Seat switches on their boards','Place the printed caps'][sequence]}</h3><p>Educational sequence only. Bracket fit, soldering, clearances and protection circuitry are unresolved.</p><div><button disabled={sequence===0} onClick={()=>assemblySequence(sequence-1)}>← Previous</button><button onClick={()=>assemblySequence((sequence+1)%5)}>{sequence===4?'Replay ↻':'Next →'}</button><button onClick={()=>setSequence(null)}>Close</button></div></div>}
      </section>
      <aside className={`inspector ${rightOpen?'open':''}`} aria-label="Part inspector">
        <div className="panel-title"><span>PART INSPECTOR</span><span>{chosen?'01 SELECTED':'EXPLORE'}</span></div>
        <div className="inspector-scroll" ref={inspectorScroll}>
        {chosen?<>
          <div className="eyebrow">{chosen.group.toUpperCase()}</div><h2>{chosen.name}</h2>
          <div className="badges"><span className={chosen.evidence.geometry==='Original mesh'?'mesh-badge':'warning-badge'}>{chosen.evidence.geometry}</span><span>{chosen.evidence.placement} placement</span><span>{chosen.evidence.function} function</span></div>
          <div className="inspect-actions"><button onClick={()=>focus('fit',chosen.id)}>⌖ Fit selection</button><button onClick={()=>{setVisibility(v=>({...v,isolated:v.isolated===chosen.id?null:chosen.id}));laterFocus('fit',chosen.id,80);}}>{visibility.isolated===chosen.id?'Unisolate':'Isolate'}</button><button onClick={()=>setVisibility(v=>({...v,hidden:v.hidden.includes(chosen.id)?v.hidden.filter(id=>id!==chosen.id):[...v.hidden,chosen.id]}))}>{visibility.hidden.includes(chosen.id)?'Show':'Hide'}</button><button className={visibility.ghost?'active':''} onClick={()=>setVisibility(v=>({...v,ghost:!v.ghost}))}>Ghost others</button></div>
          <section className="explanation"><h3>What is this?</h3><p>{chosen.what}</p><h3>What does it do?</h3><p>{chosen.does}</p><h3>Why do we need it?</h3><p>{chosen.why}</p></section>
          {mode!=='library'&&<><h3>What connects to it?</h3><button className={`wide ${showConnections?'active':''}`} onClick={()=>{setShowConnections(!showConnections);setGlobalConnections(false);}}> {showConnections?'Hide connection paths':'Show connections'}</button><div className="connection-list">{adjacent.map(e=><div key={e.id}><b style={{color:layerInfo[e.layer].color}}>{e.label}</b><span>{e.medium} · {e.status}</span><p>{e.explanation}</p><button className="text-button" onClick={()=>choose(e.from.id===chosen.id?e.to.id:e.from.id)}>Inspect {partMap.get(e.from.id===chosen.id?e.to.id:e.from.id)?.name??'connection'} →</button></div>)}</div></>}
          {chosen.key&&chosen.kind==='stl'&&mode==='assembly'&&<div className="fit-demo"><h3>Cap → switch close-up</h3><p>Separate parts; 2 mm illustrative press. Physical fit is unverified.</p><button onClick={()=>{setVisibility({hidden:parts.filter(p=>p.id!==chosen.id&&p.id!==`switch-${chosen.key}`).map(p=>p.id),isolated:null,ghost:false});setExplosion(.3);laterFocus('fit',`switch-${chosen.key}`,500);}}>Open close-up</button><button aria-pressed={pressPreview} onClick={()=>setPressPreview(!pressPreview)}>{pressPreview?'Release cap':'Press cap'}</button></div>}
          {mode==='assembly'&&Math.hypot(...chosen.explosion)>0&&<div className="extract"><label htmlFor="extract">Extract along part axis <span>{extract} mm</span></label><input id="extract" type="range" min="0" max="70" value={extract} onChange={e=>setExtract(+e.target.value)}/><small>Illustrative movement; drag the slider along the saved extraction axis.</small><button onClick={()=>{setExtract(0);setExplosion(0);setPressPreview(false);}}>Return to assembly</button></div>}
          <div className="uncertainty"><b>Still to resolve</b><p>{chosen.unresolved}</p></div>
          <details className="technical"><summary>Technical details & evidence</summary><dl><dt>Stable ID</dt><dd>{chosen.id}</dd><dt>Model / file</dt><dd>{chosen.assetId?`${chosen.assetId}.stl`:chosen.name}</dd><dt>Quantity / certainty</dt><dd>{chosen.quantity??'One illustrative instance; actual assembly quantities need review.'}</dd><dt>Dimensions</dt><dd>{chosen.dimensions??(chosen.assetId?`${assets.inventory?.assets.find(a=>a.id===chosen.assetId)?.extent?.map(v=>v.toFixed(2)).join(' × ')??'Unavailable'} source-coordinate units; mm assumed.`:'Illustrative envelope; no certified assembly dimensions.')}</dd>{chosen.gpio!==undefined&&<><dt>Firmware GPIO</dt><dd>{chosen.gpio} · CPP assignment, not verified wiring</dd></>}<dt>Sources</dt><dd>{chosen.sources.map(s=><a key={s} href={sourceLinks[s].url} target="_blank" rel="noreferrer">{sourceLinks[s].name} ↗</a>)}</dd></dl>{adjacent.filter(e=>e.pins).map(e=><p className="small" key={e.id}>{e.pins}</p>)}</details>
        </>:<>
          <div className="eyebrow">START EXPLORING</div><h2>One instrument.<br/>Every connection.</h2><p className="intro">Select a key, board or cable in the scene. See what it does, what it connects to, and what still needs checking.</p>
          <div className="overview-counts"><div><strong>{configuration==='full'?'21':'3'}</strong><span>playing controls</span></div><div><strong>{configuration==='full'?'5':'1'}</strong><span>{configuration==='full'?'body PCBs':'bench fixture'}</span></div></div>
          <button className="wide accent" onClick={()=>showTour(0)}>Take the guided tour →</button><button className="wide" onClick={()=>assemblySequence(0)}>Explore assembly sequence</button>
          <div className="reference-thumb"><img src="/assets/references/v2__images__front.png" alt="Original v2 Circuit Sax with yellow boards, pale blue keys, and exposed Teensy"/><span>THE V2 REFERENCE · UPSTREAM PHOTO</span></div>
          <p className="uncertainty">Real printed key meshes. Reconstructed electronics and PCB geometry. All installed placements are inferred.</p>
        </>}
        </div>
        <div className="layers"><div className="panel-title"><span>CONNECTION LAYERS</span><button className="text-button" onClick={()=>setShowConnections(!showConnections)}>{showConnections?'Hide':'Show'}</button></div>{allLayers.map(layer=><label key={layer}><input type="checkbox" checked={layers.includes(layer)} onChange={()=>setLayers(old=>old.includes(layer)?old.filter(l=>l!==layer):[...old,layer])}/><span className={`line-sample ${layer}`} style={{borderColor:layerInfo[layer].color}}/><span>{layerInfo[layer].label}</span><small>{layerInfo[layer].style}</small></label>)}<label><input type="checkbox" checked={globalConnections} onChange={e=>{setGlobalConnections(e.target.checked);setShowConnections(true);}}/>All connections <small>overview</small></label><p>{globalConnections?'Global paths; select a part and turn off overview for labels.':'Paths emphasize the selected part. Overlays are functional relationships, not verified copper traces.'}</p></div>
      </aside>
    </main>
    <footer className="bottom-controls">
      {mode==='simulation'?<div className="simulation-controls"><div className="sim-inputs"><span className="eyebrow">SIMULATION</span><button className={power?'active':''} aria-pressed={power} onClick={()=>{setPower(!power);if(audio.current){const a=audio.current;a.gain.gain.cancelScheduledValues(a.context.currentTime);a.gain.gain.setValueAtTime(0,a.context.currentTime);}}}>Power {power?'on':'off'}</button><label htmlFor="breath">Breath <b>{breath}%</b></label><input id="breath" type="range" min="0" max="100" value={breath} onChange={e=>setBreath(+e.target.value)}/><button className={sound?'active':''} onClick={toggleSound}>{sound?'Mute sound':'Enable sound'}</button><button onClick={resetSimulation}>Reset simulation</button></div><div className="sim-key-row">{controls.filter(c=>configuration==='full'||['B','A','G'].includes(c.key)).map(c=><button key={c.key} aria-pressed={pressed.has(c.key)} className={pressed.has(c.key)?'pressed':''} onClick={()=>toggleKey(c.key)} title={c.name}>{c.key}</button>)}</div><div className={`signal-flow ${active?'signal-active':''}`}><span className={power?'on':''}>1 · Keys + breath</span><i>→</i><span>2 · Teensy synthesizes</span><i>→</i><span>3 · I2S → shield</span><i>→</i><span>4 · Headphones</span><strong role="status">{!power?'Power off · silent':breath===0?'No breath · silent':output.midi===null?'Unsupported state':`${noteName(output.midi)} · concert / MIDI ${output.midi}`}</strong></div><p className="simulation-note">{output.reason??`Written/reference pitch ${output.written===null?'—':noteName(output.written)}; ${configuration==='bench'?'bench transposition 0 (proposed plan fixture)':'CPP default transposition +3 semitones'}. MIDI 60 = C4.`} Static CPP fingering; no portamento, timing, motion or settings emulation. Optional quiet sine tone, not the Teensy synth. {soundError}</p></div>:mode==='library'?<div className="library-footer"><span>19 ORIGINAL STL ASSETS</span><p>No manufacturing fit is implied. Original coordinate bounds and source hashes are in the asset inventory.</p><button onClick={()=>focus('fit',selected??undefined)}>Fit mesh</button></div>:<div className="assembly-controls"><button className="assemble-button" onClick={()=>{setExplosion(explosion>.5?0:1);laterFocus('isometric',undefined,650);}}>{explosion>.5?'↙ Reassemble':'↗ Explode'}</button><div className="explode-slider"><label htmlFor="explode"><span>ASSEMBLED</span><b>{Math.round(explosion*100)}%</b><span>EXPLODED</span></label><input id="explode" aria-label="Explode assembly" type="range" min="0" max="100" value={Math.round(explosion*100)} onChange={e=>{setSequence(null);setExplosion(+e.target.value/100);}} onPointerUp={()=>laterFocus('isometric',undefined,550)}/></div><label className="staged"><input type="checkbox" checked={staged} onChange={e=>setStaged(e.target.checked)}/>Staged groups</label><button onClick={()=>{restore();setExplosion(0);setSelected(null);setShowConnections(false);setTourStep(null);setSequence(null);laterFocus('isometric',undefined,550);}}>Restore assembly</button><button className="tour-button" onClick={()=>showTour(0)}>Guided tour ↗</button></div>}
    </footer>
    <div className="statusbar"><span>Educational reconstruction — assembly fit and wiring not certified.</span><span>LOCAL WORKSPACE <b className="status-dot"/> NO LIVE HARDWARE</span></div>
    {sourcesOpen&&<SourcesModal close={()=>setSourcesOpen(false)} revision={assets.inventory?.revision??'Loading…'}/>}
  </div>;
}
function SourcesModal({close,revision}:{close:()=>void;revision:string}){
  const dialog=useRef<HTMLDialogElement>(null);useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
  return <dialog ref={dialog} className="sources-modal" onCancel={close} onClick={e=>{if(e.target===dialog.current)close();}}><div className="modal-inner"><div className="panel-title"><span>SOURCES & ASSUMPTIONS</span><button autoFocus onClick={close}>Close ×</button></div><h2>Evidence, not a certified digital twin.</h2><p>Original Circuit Sax work by the upstream author, Whackalenso / Niels van Vliet (README and photo attribution). This independent viewer preserves the published files and does not change firmware.</p><dl><dt>Actual checkout revision</dt><dd className="mono">{revision}</dd><dt>Firmware authority</dt><dd>PlatformIO builds <code>src/circuit_sax_v2.cpp</code>. The alternate INO swaps left-pinky GPIOs 29 and 30 and uses a different MPU library. Their mappings are not merged.</dd><dt>Original geometry</dt><dd>All 19 published STLs are loaded with STLLoader. Full scene: 21 cap instances plus two rest meshes. PK23 repeats twice and Standard four times, inferred from the plan. One configuration switch has no identified cap mesh.</dd><dt>Coordinate policy</dt><dd>One scene unit is interpreted as one millimeter, an assumption because STL carries no unit metadata. No independent scaling. Caps are translated using their lowest-plane stem bounds; rests are centered. Original min/max, centers and hashes are retained in the inventory. Switch centers, board angles and every installed placement are inferred.</dd><dt>Reconstruction</dt><dd>Main and four side-board outlines follow the v2 PCB image and photograph. Electronics, switches, cables, mouthpiece, holder, headers and fasteners are procedural approximations. Teensy outline and candidate-bank envelope use documented dimensions; other sizes are illustrative. Traces are decorative, not verified copper.</dd><dt>Version mismatch</dt><dd>Published rest 19 lacks the v2 battery sleeve. Rest 18 neck compatibility is unresolved. Both original meshes remain visible as explicitly uncertain stand-ins; a separate holder proxy supports the candidate bank envelope.</dd><dt>Electrical uncertainties</dt><dd>The 5 V pressure output must pass a reviewed conditioning/protection design before the Teensy 3.3 V ADC. No final wiring or component values are claimed. Headphone HP_VGND stays separate from circuit ground. SD slots are empty and optional shield memory is unpopulated. The pressure branch has no flow through sensor electronics; drainage is separate and moisture isolation is proposed.</dd><dt>Simulation scope</dt><dd>Static <code>getPressedNote()</code> logic is ported from the CPP; full transposition defaults to +3, proposed bench uses 0. Written/reference pitch and concert output are separate. Front-F stateful jumps/config shortcuts are unsupported. Breath is normalized, not a calibrated ADC reading. No live hardware, microphone, circuit simulation, timing or exact firmware audio emulation.</dd><dt>Asset health & licensing</dt><dd>Binary records are validated. Prior plan reports non-manifold / duplicate-face concerns in 14–16, 18 and 19; no mesh repairs or printability certification. Upstream firmware/model license is unresolved. Submodule MIT license does not establish permission for these assets. Clarify licensing before future public distribution. Phase 2 enclosure is excluded.</dd></dl><div className="source-grid">{Object.values(sourceLinks).map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.name} ↗</a>)}<a href="/assets/inventory.json" target="_blank" rel="noreferrer">Asset inventory / original bounds and hashes ↗</a></div><div className="reference-grid">{['front','pcb','neck','thumb_rest'].map(name=><figure key={name}><img src={`/assets/references/v2__images__${name}.png`} alt={`Original v2 ${name.replace('_',' ')} reference`}/><figcaption>v2 / {name}</figcaption></figure>)}</div></div></dialog>;
}
