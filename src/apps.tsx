import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';

export function AppRouter({appId}:{appId:string}) {
  switch(appId){
    case 'wallcheck': return <WallCheck/>;
    case 'captioncast': return <CaptionCast/>;
    case 'signme': return <SignMe/>;
    case 'lagcheck': return <LagCheck/>;
    case 'tapback': return <TapBack/>;
    case 'papercheck': return <PaperCheck/>;
    case 'comparesound': return <CompareSound/>;
    case 'showmethat': return <ShowMeThat/>;
    case 'counttogether': return <CountTogether/>;
    case 'phablabphone': return <PhabLabPhone/>;
    case 'twinlevel': return <TwinLevel/>;
    case 'sensorlink': return <SensorLink/>;
    case 'syncmark': return <SyncMark/>;
    case 'soundrace': return <SoundRace/>;
    case 'framematch': return <FrameMatch/>;
    case 'relaytap': return <RelayTap/>;
    default: return <PhabLabPhone/>;
  }
}

function WallCheck(){
  const room=useRoom(); const [base,setBase]=useState<number|null>(null); const [test,setTest]=useState<number|null>(null); const [busy,setBusy]=useState(false);
  useEffect(()=>{ if(room.lastMessage?.type==='tone') beep(700,.7); },[room.lastMessage]);
  const measure=async(kind:'base'|'test')=>{setBusy(true);room.send('tone');await new Promise(r=>setTimeout(r,100));try{const r=await sampleMic(1200);kind==='base'?setBase(r.db):setTest(r.db);}finally{setBusy(false)}};
  const diff=base!=null&&test!=null?test-base:null;
  return <><RoomPanel room={room}/><section className="panel"><div className="panel-title">ISOLATION TEST</div><p>Put one phone by the source and one on the other side. Keep playback at a comfortable volume.</p><div className="twocol"><button onClick={()=>measure('base')} disabled={busy}>1 · OPEN / BASELINE</button><button onClick={()=>measure('test')} disabled={busy}>2 · CLOSED / TEST</button></div><div className="metrics"><BigMetric value={base==null?'—':fmt(base)+' dBFS'} label="BASE"/><BigMetric value={test==null?'—':fmt(test)+' dBFS'} label="TEST"/></div>{diff!=null&&<><BigMetric value={fmt(diff)+' dB'} label="CHANGE (RELATIVE)"/><ActionShare text={`WallCheck result: ${fmt(diff)} dB relative change.`}/></>}</section></>;
}

function CaptionCast(){
  const room=useRoom(); const [text,setText]=useState(''); const [listening,setListening]=useState(false); const stopRef=useRef<null|(()=>Promise<void>)>(null);
  useEffect(()=>{if(room.lastMessage?.type==='caption')setText(String(room.lastMessage.payload||''));},[room.lastMessage]);
  const start=async()=>{try{stopRef.current=await speechStart(t=>{setText(t);room.send('caption',t)});setListening(true);}catch(e){setText('Speech recognition unavailable on this device.');}};
  const stop=async()=>{await stopRef.current?.();stopRef.current=null;setListening(false)};
  return <><RoomPanel room={room}/><section className="panel"><div className="panel-title">LIVE CAPTION</div><div className="caption">{text||'Speak on one phone. Read on the other.'}</div><button className="primary" onClick={listening?stop:start}>{listening?'STOP':'START SPEAKING'}</button></section></>;
}

function SignMe(){
  const room=useRoom(); const [text,setText]=useState('READY'); const [remote,setRemote]=useState('READY'); const [tone,setTone]=useState<'dark'|'light'|'alert'>('dark');
  useEffect(()=>{if(room.lastMessage?.type==='sign'){const p=room.lastMessage.payload as any;setRemote(p?.text||'');setTone(p?.tone||'dark')}},[room.lastMessage]);
  const send=()=>{room.send('sign',{text,tone});setRemote(text)};
  return <><RoomPanel room={room}/><section className={`signscreen ${tone}`}><div>{remote}</div></section><section className="panel"><input value={text} onChange={e=>setText(e.target.value)} placeholder="MESSAGE"/><div className="seg"><button onClick={()=>setTone('dark')}>DARK</button><button onClick={()=>setTone('light')}>LIGHT</button><button onClick={()=>setTone('alert')}>ALERT</button></div><button className="primary" onClick={send}>SEND TO SCREENS</button></section></>;
}

function LagCheck(){
  const [result,setResult]=useState<number|null>(null); const [running,setRunning]=useState(false); const videoRef=useRef<HTMLVideoElement>(null); const canvasRef=useRef<HTMLCanvasElement>(null);
  const run=async()=>{setRunning(true);setResult(null);const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:true});const video=videoRef.current!;video.srcObject=stream;await video.play();const ctx=new AudioContext();const an=ctx.createAnalyser();an.fftSize=512;ctx.createMediaStreamSource(stream).connect(an);const audio=new Float32Array(an.fftSize);const canvas=canvasRef.current!;const c=canvas.getContext('2d')!;let tAudio:number|null=null,tLight:number|null=null;const start=performance.now();while(performance.now()-start<7000&&(!tAudio||!tLight)){an.getFloatTimeDomainData(audio);let s=0;for(const v of audio)s+=v*v;if(!tAudio&&Math.sqrt(s/audio.length)>.12)tAudio=performance.now();c.drawImage(video,0,0,32,24);const px=c.getImageData(0,0,32,24).data;let lum=0;for(let i=0;i<px.length;i+=4)lum+=(px[i]+px[i+1]+px[i+2])/3;lum/=px.length/4;if(!tLight&&lum>210)tLight=performance.now();await new Promise(r=>setTimeout(r,16));}if(tAudio&&tLight)setResult(tAudio-tLight);stream.getTracks().forEach(t=>t.stop());await ctx.close();setRunning(false)};
  return <section className="panel"><div className="panel-title">A/V EVENT DETECTOR</div><p>Point at a screen or source that produces a bright flash and a sound together, then start the scan.</p><video ref={videoRef} playsInline muted className="preview"/><canvas ref={canvasRef} width="32" height="24" hidden/><button className="primary" disabled={running} onClick={run}>{running?'SCANNING…':'SCAN 7 SECONDS'}</button>{result!=null&&<><BigMetric value={(result>0?'+':'')+fmt(result,0)+' ms'} label={result>0?'AUDIO AFTER LIGHT':'AUDIO BEFORE LIGHT'}/><ActionShare text={`LagCheck measured ${fmt(result,0)} ms A/V offset.`}/></>}</section>;
}

function TapBack(){
  const room=useRoom(); const [hits,setHits]=useState(0); const [flash,setFlash]=useState(false);
  useEffect(()=>{if(room.lastMessage?.type==='tap'){setHits(v=>v+1);setFlash(true);haptic();setTimeout(()=>setFlash(false),350)}},[room.lastMessage]);
  const tap=()=>{room.send('tap');setHits(v=>v+1);haptic()};
  return <><RoomPanel room={room}/><section className={`tapstage ${flash?'flash':''}`}><button className="mega" onClick={tap}>TAP</button><BigMetric value={String(hits)} label="SIGNALS"/></section></>;
}

function PaperCheck(){
  const [items,setItems]=useState<{t:string;done:boolean}[]>([]); const [busy,setBusy]=useState(false); const [raw,setRaw]=useState('');
  const scan=async()=>{setBusy(true);try{const {Camera,CameraResultType,CameraSource}:any=await import('@capacitor/camera');const pic=await Camera.getPhoto({quality:88,resultType:CameraResultType.Uri,source:CameraSource.Camera,correctOrientation:true});const mod:any=await import('@capacitor-mlkit/text-recognition');const engine=mod.TextRecognition;const fn=engine.processImage||engine.recognizeText;const res=await fn.call(engine,{path:pic.path||pic.webPath});const text=res.text||res.blocks?.map((b:any)=>b.text).join('\n')||'';setRaw(text);setItems(text.split(/\n+/).map((t:string)=>t.replace(/^[-•□☐\s]+/,'').trim()).filter((t:string)=>t.length>1).map((t:string)=>({t,done:false})));}catch{setRaw('OCR unavailable here. Paste or type one item per line below.')}finally{setBusy(false)}};
  const importRaw=()=>setItems(raw.split(/\n+/).map(t=>t.trim()).filter(Boolean).map(t=>({t,done:false})));
  return <section className="panel"><div className="panel-title">PAPER → CHECKLIST</div><button className="primary" onClick={scan} disabled={busy}>{busy?'READING…':'PHOTOGRAPH LIST'}</button><textarea value={raw} onChange={e=>setRaw(e.target.value)} placeholder="Or paste / type one item per line"/><button onClick={importRaw}>MAKE CHECKLIST</button><div className="checklist">{items.map((x,i)=><label key={i}><input type="checkbox" checked={x.done} onChange={()=>setItems(a=>a.map((v,j)=>j===i?{...v,done:!v.done}:v))}/><span>{x.t}</span></label>)}</div>{items.length>0&&<ActionShare text={items.map(x=>`${x.done?'✓':'□'} ${x.t}`).join('\n')}/>}</section>;
}

function CompareSound(){
  const [before,setBefore]=useState<number|null>(null); const [after,setAfter]=useState<number|null>(null); const [busy,setBusy]=useState(false);
  const go=async(which:'before'|'after')=>{setBusy(true);try{const r=await sampleMic(1800);which==='before'?setBefore(r.db):setAfter(r.db)}finally{setBusy(false)}};
  const d=before!=null&&after!=null?after-before:null;
  return <section className="panel"><div className="panel-title">BEFORE / AFTER</div><p>Keep the phone in the same place and compare two setups under the same sound conditions.</p><div className="twocol"><button onClick={()=>go('before')} disabled={busy}>BEFORE</button><button onClick={()=>go('after')} disabled={busy}>AFTER</button></div><div className="metrics"><BigMetric value={before==null?'—':fmt(before)+' dBFS'} label="BEFORE"/><BigMetric value={after==null?'—':fmt(after)+' dBFS'} label="AFTER"/></div>{d!=null&&<><BigMetric value={(d>0?'+':'')+fmt(d)+' dB'} label="RELATIVE CHANGE"/><ActionShare text={`CompareSound: ${fmt(d)} dB relative before/after change.`}/></>}</section>;
}

function ShowMeThat(){
  const room=useRoom(); const [img,setImg]=useState('');
  useEffect(()=>{if(room.lastMessage?.type==='image')setImg(String(room.lastMessage.payload||''));},[room.lastMessage]);
  const shoot=async()=>{const data=await takePhotoDataUrl();if(data){setImg(data);room.send('image',data)}};
  return <><RoomPanel room={room}/><section className="panel"><button className="primary" onClick={shoot}>TAKE & SEND PHOTO</button>{img?<img className="fullimage" src={img}/>:<div className="empty">The received image appears here full-screen.</div>}</section></>;
}

function CountTogether(){
  const room=useRoom(); const [count,setCount]=useState(0);
  useEffect(()=>{if(room.lastMessage?.type==='count')setCount(Number(room.lastMessage.payload)||0)},[room.lastMessage]);
  const set=(n:number)=>{setCount(n);room.send('count',n);haptic()};
  return <><RoomPanel room={room}/><section className="counter"><button onClick={()=>set(count-1)}>−</button><strong>{count}</strong><button onClick={()=>set(count+1)}>+</button></section><button className="ghost" onClick={()=>set(0)}>RESET</button></>;
}

function PhabLabPhone(){
  const mic=useMicLevel(); const ori=useOrientation(); const motion=useMotion();
  const [micOn,setMicOn]=useState(false); const [oriOn,setOriOn]=useState(false); const [motOn,setMotOn]=useState(false);
  const oriStop=useRef<null|(()=>void)>(null); const motStop=useRef<null|(()=>void)>(null);
  useEffect(()=>()=>{oriStop.current?.();motStop.current?.();mic.stop()},[mic.stop]);
  const toggleOri=async()=>{if(oriOn){oriStop.current?.();oriStop.current=null;setOriOn(false)}else{oriStop.current=await ori.start();setOriOn(true)}};
  const toggleMot=async()=>{if(motOn){motStop.current?.();motStop.current=null;setMotOn(false)}else{motStop.current=await motion.start();setMotOn(true)}};
  return <><section className="hero-lab"><div className="atom">🧪</div><h1>POCKET SENSOR LAB</h1><p>Use the sensors already inside your phone. Measurements are educational/relative, not certified lab readings.</p></section><section className="gridcards"><button onClick={async()=>{if(micOn){mic.stop();setMicOn(false)}else{await mic.start();setMicOn(true)}}}><span>🎤 MICROPHONE</span><strong>{fmt(mic.db)} dBFS</strong></button><button onClick={toggleOri}><span>📐 ORIENTATION</span><strong>{fmt(ori.beta)}° / {fmt(ori.gamma)}°</strong></button><button onClick={toggleMot}><span>📳 MOTION</span><strong>{fmt(motion.magnitude,2)} m/s²</strong></button><button onClick={()=>beep(660,.2)}><span>🔊 TONE</span><strong>660 Hz</strong></button></section></>;
}

function TwinLevel(){
  const room=useRoom(); const ori=useOrientation(); const [active,setActive]=useState(false); const stopRef=useRef<null|(()=>void)>(null); const [ref,setRef]=useState<{b:number;g:number}|null>(null);
  useEffect(()=>{if(room.lastMessage?.type==='levelref')setRef(room.lastMessage.payload as any)},[room.lastMessage]);
  useEffect(()=>()=>stopRef.current?.(),[]);
  const toggle=async()=>{if(active){stopRef.current?.();stopRef.current=null;setActive(false)}else{stopRef.current=await ori.start();setActive(true)}};
  const delta=ref?Math.hypot(ori.beta-ref.b,ori.gamma-ref.g):null;
  return <><RoomPanel room={room}/><section className="panel"><button onClick={toggle}>{active?'STOP SENSOR':'START LEVEL'}</button><button className="primary" disabled={!active} onClick={()=>{const r={b:ori.beta,g:ori.gamma};setRef(r);room.send('levelref',r)}}>CAPTURE REFERENCE</button><div className="metrics"><BigMetric value={fmt(ori.beta)+'°'} label="TILT Y"/><BigMetric value={fmt(ori.gamma)+'°'} label="TILT X"/></div>{delta!=null&&<><BigMetric value={fmt(delta,2)+'°'} label={delta<1?'MATCH ✓':'DIFFERENCE'}/><ActionShare text={`TwinLevel difference: ${fmt(delta,2)}°.`}/></>}</section></>;
}

function SensorLink(){
  const room=useRoom(); const mic=useMicLevel(); const ori=useOrientation(); const motion=useMotion(); const [running,setRunning]=useState(false); const [remote,setRemote]=useState<any>(null); const stops=useRef<(()=>void)[]>([]);
  useEffect(()=>{if(room.lastMessage?.type==='sensor')setRemote(room.lastMessage.payload)},[room.lastMessage]);
  useEffect(()=>{if(!running)return;const id=setInterval(()=>room.send('sensor',{db:mic.db,beta:ori.beta,gamma:ori.gamma,motion:motion.magnitude}),160);return()=>clearInterval(id)},[running,mic.db,ori.beta,ori.gamma,motion.magnitude,room]);
  const toggle=async()=>{if(running){mic.stop();stops.current.forEach(s=>s());stops.current=[];setRunning(false)}else{await mic.start();stops.current=[await ori.start(),await motion.start()];setRunning(true)}};
  const data=remote||{db:mic.db,beta:ori.beta,gamma:ori.gamma,motion:motion.magnitude};
  return <><RoomPanel room={room}/><section className="panel"><button className="primary" onClick={toggle}>{running?'STOP STREAM':'STREAM THIS PHONE'}</button><div className="metrics four"><BigMetric value={fmt(data.db)+' dBFS'} label="SOUND"/><BigMetric value={fmt(data.beta)+'°'} label="TILT"/><BigMetric value={fmt(data.gamma)+'°'} label="ROLL"/><BigMetric value={fmt(data.motion,2)} label="MOTION"/></div></section></>;
}

function SyncMark(){
  const room=useRoom(); const [flash,setFlash]=useState(false); const [last,setLast]=useState<number|null>(null);
  const fire=async(delay=1200)=>{setTimeout(async()=>{setFlash(true);await Promise.all([beep(1000,.08),haptic()]);setLast(Date.now());setTimeout(()=>setFlash(false),180)},delay)};
  useEffect(()=>{if(room.lastMessage?.type==='syncmark'){const d=Number((room.lastMessage.payload as any)?.delay)||1200;fire(d)}},[room.lastMessage]);
  const go=()=>{room.send('syncmark',{delay:1200});fire(1200)};
  return <><RoomPanel room={room}/><section className={`syncstage ${flash?'flash':''}`}><button className="mega" onClick={go}>SYNC MARK</button><p>All joined phones fire a short flash + beep after the same relative countdown.</p>{last&&<BigMetric value={new Date(last).toLocaleTimeString()} label="LAST MARK"/>}</section></>;
}

function SoundRace(){
  const room=useRoom(); const [armed,setArmed]=useState(false); const [heard,setHeard]=useState<{id:string;t:number}[]>([]); const stopRef=useRef<()=>void>(()=>{});
  useEffect(()=>{if(room.lastMessage?.type==='heard'){const p=room.lastMessage.payload as any;setHeard(v=>[...v,p].sort((a,b)=>a.t-b.t))}},[room.lastMessage]);
  const arm=async()=>{const stream=await navigator.mediaDevices.getUserMedia({audio:true});const ctx=new AudioContext();const an=ctx.createAnalyser();an.fftSize=512;ctx.createMediaStreamSource(stream).connect(an);const d=new Float32Array(an.fftSize);let raf=0,done=false;const tick=()=>{an.getFloatTimeDomainData(d);let s=0;for(const v of d)s+=v*v;if(!done&&Math.sqrt(s/d.length)>.18){done=true;const p={id:room.code||'LOCAL',t:Date.now()};setHeard(v=>[...v,p]);room.send('heard',p);haptic();stopRef.current();return}raf=requestAnimationFrame(tick)};stopRef.current=()=>{cancelAnimationFrame(raf);stream.getTracks().forEach(t=>t.stop());ctx.close().catch(()=>{});setArmed(false)};setArmed(true);tick()};
  return <><RoomPanel room={room}/><section className="panel"><button className="primary" onClick={armed?()=>stopRef.current():arm}>{armed?'ARMED · TAP TO CANCEL':'ARM MICROPHONE'}</button><p>Make one clear, comfortable sound after every phone is armed. Ranking is approximate and depends on device clock sync.</p><ol className="rank">{heard.map((x,i)=><li key={i}><strong>#{i+1}</strong><span>{x.id}</span><small>{x.t}</small></li>)}</ol><button className="ghost" onClick={()=>setHeard([])}>RESET</button></section></>;
}

function FrameMatch(){
  const [ref,setRef]=useState(''); const [opacity,setOpacity]=useState(.5); const [streaming,setStreaming]=useState(false); const video=useRef<HTMLVideoElement>(null); const streamRef=useRef<MediaStream|null>(null);
  const capture=async()=>{const d=await takePhotoDataUrl();if(d)setRef(d)};
  const live=async()=>{if(streaming){streamRef.current?.getTracks().forEach(t=>t.stop());setStreaming(false);return}const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});streamRef.current=s;if(video.current){video.current.srcObject=s;await video.current.play()}setStreaming(true)};
  useEffect(()=>()=>streamRef.current?.getTracks().forEach(t=>t.stop()),[]);
  return <section className="panel"><div className="panel-title">REFERENCE OVERLAY</div><div className="framebox"><video ref={video} playsInline muted/><>{ref&&<img src={ref} style={{opacity}}/>}</></div><div className="twocol"><button onClick={capture}>REFERENCE PHOTO</button><button onClick={live}>{streaming?'STOP CAMERA':'LIVE CAMERA'}</button></div><label className="slider">OVERLAY <input type="range" min="0" max="1" step=".05" value={opacity} onChange={e=>setOpacity(Number(e.target.value))}/></label></section>;
}

function RelayTap(){
  const room=useRoom(); const [signalAt,setSignalAt]=useState<number|null>(null); const [score,setScore]=useState<number|null>(null); const [board,setBoard]=useState<{id:string;ms:number}[]>([]); const [go,setGo]=useState(false);
  useEffect(()=>{if(room.lastMessage?.type==='relaygo'){setGo(true);setSignalAt(performance.now());beep(900,.08);haptic()} if(room.lastMessage?.type==='relayscore'){const p=room.lastMessage.payload as any;setBoard(v=>[...v.filter(x=>x.id!==p.id),p].sort((a,b)=>a.ms-b.ms))}},[room.lastMessage]);
  const start=()=>{setBoard([]);setScore(null);setGo(false);setTimeout(()=>{room.send('relaygo');setGo(true);setSignalAt(performance.now());beep(900,.08)},700+Math.random()*1800)};
  const tap=()=>{if(!go||signalAt==null)return;const ms=performance.now()-signalAt;setScore(ms);setGo(false);const p={id:room.code||'LOCAL',ms};setBoard(v=>[...v,p].sort((a,b)=>a.ms-b.ms));room.send('relayscore',p);haptic()};
  return <><RoomPanel room={room}/><section className="relay"><button className="primary" onClick={start}>START RANDOM SIGNAL</button><button className={`mega ${go?'ready':''}`} onClick={tap}>{go?'TAP!':'WAIT'}</button>{score!=null&&<><BigMetric value={fmt(score,0)+' ms'} label="REACTION"/><ActionShare text={`RelayTap reaction: ${fmt(score,0)} ms.`}/></>}<ol className="rank">{board.map((x,i)=><li key={i}><strong>#{i+1}</strong><span>{x.id}</span><small>{fmt(x.ms,0)} ms</small></li>)}</ol></section></>;
}
