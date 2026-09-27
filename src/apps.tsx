import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, raceDeltas, markDelay, emptyCounter, reduceCounter, isCounterState, isLevelReference, levelDifference, sensorSample, updateSensorStats, avOffset, type LevelReference, type SensorSample, type SensorStats } from './logic';
import { MARKER_COLORS, POCKET_TONE_HZ, checklistLines, clampOpacity, isMarker, isPhotoDataUrl, nextSignalCount, normalizeCaption, nudgeMarker, parseSignPayload, pushCaption, rankByMs, reactionMs, relativeLevelChange, type Marker } from './app-logic';

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
  const diff=relativeLevelChange(base,test);
  return <><RoomPanel room={room}/><section className="panel"><div className="panel-title">ISOLATION TEST</div><p>Put one phone by the source and one on the other side. Keep playback at a comfortable volume.</p><div className="twocol"><button onClick={()=>measure('base')} disabled={busy}>1 · OPEN / BASELINE</button><button onClick={()=>measure('test')} disabled={busy}>2 · CLOSED / TEST</button></div><div className="metrics"><BigMetric value={base==null?'—':fmt(base)+' dBFS'} label="BASE"/><BigMetric value={test==null?'—':fmt(test)+' dBFS'} label="TEST"/></div>{diff!=null&&<><BigMetric value={fmt(diff)+' dB'} label="CHANGE (RELATIVE)"/><ActionShare text={`WallCheck result: ${fmt(diff)} dB relative change.`}/></>}</section></>;
}

function CaptionCast(){
  const room=useRoom();
  const [captions,setCaptions]=useState<string[]>([]); const [status,setStatus]=useState<'idle'|'starting'|'listening'|'stopping'>('idle');
  const [error,setError]=useState(''); const [fontSize,setFontSize]=useState(48); const [display,setDisplay]=useState(false);
  const mounted=useRef(true);
  const session=useRef<{cancelled:boolean;starting:boolean;cleanup:()=>Promise<void>}|null>(null);
  const latestSent=useRef('');
  const updateCaption=(value:string)=>setCaptions(previous=>pushCaption(previous,value));
  useEffect(()=>room.subscribe(message=>{
    if(message.type==='caption'&&typeof message.payload==='string')updateCaption(message.payload);
  }),[room.subscribe]);
  const stop=()=>{
    const active=session.current;if(!active)return;
    active.cancelled=true;
    if(mounted.current)setStatus('stopping');
    void active.cleanup().finally(()=>{
      if(!active.starting&&session.current===active){session.current=null;if(mounted.current)setStatus('idle')}
    });
  };
  useEffect(()=>{
    mounted.current=true;
    const visibility=()=>{if(document.hidden)stop()};
    document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',stop);window.addEventListener('phab:pause',stop);
    return()=>{mounted.current=false;stop();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',stop);window.removeEventListener('phab:pause',stop)};
  },[]);
  const start=async()=>{
    if(session.current||document.hidden||!mounted.current)return;
    const listeners:{remove:()=>Promise<void>}[]=[];
    let engine:typeof import('@capgo/capacitor-speech-recognition').SpeechRecognition|undefined;
    let started=false; let cleaning=Promise.resolve();
    const active={cancelled:false,starting:true,cleanup:()=>{
      cleaning=cleaning.then(async()=>{
        await Promise.all(listeners.splice(0).map(listener=>listener.remove().catch(()=>{})));
        if(started&&engine){started=false;try{await engine.stop()}catch{if(mounted.current)setError('Could not stop speech recognition. Please close this screen and try again.')}}
      });
      return cleaning;
    }};
    session.current=active;setStatus('starting');setError('');latestSent.current='';
    const current=()=>!active.cancelled&&mounted.current&&!document.hidden;
    try{
      engine=(await import('@capgo/capacitor-speech-recognition')).SpeechRecognition;
      if(!current())return;
      let permission=await engine.checkPermissions();
      if(!current())return;
      if(permission.speechRecognition!=='granted')permission=await engine.requestPermissions();
      if(!current())return;
      if(permission.speechRecognition!=='granted')throw new Error('Microphone / speech permission denied. You can still receive captions.');
      listeners.push(await engine.addListener('partialResults',event=>{
        if(!current())return;
        const caption=normalizeCaption(event.matches?.[0]||event.accumulatedText||event.accumulated||'');
        if(!caption||caption===latestSent.current)return;
        latestSent.current=caption;updateCaption(caption);room.send('caption',caption);
      }));
      if(!current())return;
      listeners.push(await engine.addListener('error',event=>{
        if(current()){setError(event.message||'Speech recognition failed. Try starting again.');stop()}
      }));
      if(!current())return;
      listeners.push(await engine.addListener('listeningState',event=>{
        if(current()&&(event.state==='stopped'||event.status==='stopped')){
          if(event.reason==='error')setError('Speech recognition failed. Try starting again.');
          stop();
        }
      }));
      if(!current())return;
      const onDevice=await engine.isOnDeviceRecognitionAvailable().catch(()=>({available:false}));
      if(!current())return;
      started=true;
      await engine.start({partialResults:true,addPunctuation:true,popup:false,useOnDeviceRecognition:!!onDevice.available});
      // A stop during native startup must also stop the late-started recognizer.
      if(!current()){started=true;return}
      setStatus('listening');
    }catch(e){
      if(current())setError(e instanceof Error?e.message:'Speech recognition unavailable. You can still receive captions.');
      active.cancelled=true;
    }finally{
      if(!current()){
        await active.cleanup();
        if(session.current===active){session.current=null;if(mounted.current)setStatus('idle')}
      }
      active.starting=false;
    }
  };
  return <>{!display&&<RoomPanel room={room}/>}<section className="panel" style={display?{position:'fixed',inset:0,zIndex:100,borderRadius:0,overflowY:'auto',display:'flex',flexDirection:'column',padding:'max(18px, env(safe-area-inset-top)) 18px max(18px, env(safe-area-inset-bottom))',background:'#020305'}:undefined}>
    <div className="panel-title">LIVE CAPTION</div>
    <button onClick={()=>setDisplay(value=>!value)}>{display?'EXIT DISPLAY':'FULL-SCREEN DISPLAY'}</button>
    <label className="slider">CAPTION SIZE · {fontSize}px<input type="range" min="28" max="96" step="4" value={fontSize} onChange={event=>setFontSize(Number(event.target.value))}/></label>
    <div className="caption" aria-live="polite" aria-atomic="true" style={{fontSize,lineHeight:1.2,overflowWrap:'anywhere',flex:display?1:undefined,flexShrink:0}}>{captions[0]||'Speak on one phone. Read on the other.'}</div>
    {captions.length>1&&<div><div className="panel-title">RECENT CAPTIONS</div><ol style={{paddingLeft:24,overflowWrap:'anywhere',fontSize:20,lineHeight:1.5}}>{captions.slice(1).map(caption=><li key={caption}>{caption}</li>)}</ol></div>}
    {error&&<p role="alert">{error}</p>}
    <button className="primary" disabled={status==='stopping'} onClick={()=>status==='idle'?void start():stop()}>{status==='starting'?'CANCEL START':status==='listening'?'STOP SPEAKING':status==='stopping'?'STOPPING…':'START SPEAKING'}</button>
    {!display&&<p>Receiving captions needs no microphone. Start speaking only on the phone sending captions.</p>}
  </section></>;
}

function SignMe(){
  const room=useRoom(); const [text,setText]=useState('READY'); const [remote,setRemote]=useState('READY'); const [tone,setTone]=useState<'dark'|'light'|'alert'>('dark');
  const [display,setDisplay]=useState(false);
  useEffect(()=>room.subscribe(message=>{
    if(message.type!=='sign')return;
    const parsed=parseSignPayload(message.payload);
    if(!parsed)return;
    setRemote(parsed.text);setTone(parsed.tone);
  }),[room.subscribe]);
  const send=(message=text)=>{room.send('sign',{text:message,tone});setRemote(message)};
  return <>{!display&&<RoomPanel room={room}/>}<section className={`signscreen ${tone}`} style={display?{position:'fixed',inset:0,zIndex:100,borderRadius:0,display:'flex',flexDirection:'column',gap:24,overflowY:'auto',justifyContent:'flex-start',padding:'max(18px, env(safe-area-inset-top)) 18px max(18px, env(safe-area-inset-bottom))'}:undefined}>
    {display&&<button onClick={()=>setDisplay(false)} style={{fontSize:16,flexShrink:0}}>EXIT DISPLAY</button>}
    <div aria-live="polite" aria-atomic="true" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxWidth:'100%',margin:display?'auto 0':undefined,fontSize:display?'clamp(48px, 16vw, 160px)':undefined}}>{remote}</div>
  </section>{!display&&<section className="panel">
    <button onClick={()=>setDisplay(true)}>DISPLAY MODE</button>
    <div className="twocol">{['READY','STOP','✓','←','→','↑','↓'].map(preset=><button key={preset} onClick={()=>{setText(preset);send(preset)}}>{preset}</button>)}</div>
    <input aria-label="Message" value={text} onChange={event=>setText(event.target.value)} placeholder="MESSAGE"/>
    <div className="seg">{(['dark','light','alert'] as const).map(value=><button key={value} aria-pressed={tone===value} onClick={()=>setTone(value)}>{value.toUpperCase()}</button>)}</div>
    <button className="primary" onClick={()=>send()}>SEND TO SCREENS</button>
  </section>}</>;
}

function LagCheck(){
  const [result,setResult]=useState<number|null>(null); const [running,setRunning]=useState(false); const videoRef=useRef<HTMLVideoElement>(null); const canvasRef=useRef<HTMLCanvasElement>(null);
  const run=async()=>{setRunning(true);setResult(null);const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:true});const video=videoRef.current!;video.srcObject=stream;await video.play();const ctx=new AudioContext();const an=ctx.createAnalyser();an.fftSize=512;ctx.createMediaStreamSource(stream).connect(an);const audio=new Float32Array(an.fftSize);const canvas=canvasRef.current!;const c=canvas.getContext('2d')!;let tAudio:number|null=null,tLight:number|null=null;const start=performance.now();while(performance.now()-start<7000&&(!tAudio||!tLight)){an.getFloatTimeDomainData(audio);let s=0;for(const v of audio)s+=v*v;if(!tAudio&&Math.sqrt(s/audio.length)>.12)tAudio=performance.now();c.drawImage(video,0,0,32,24);const px=c.getImageData(0,0,32,24).data;let lum=0;for(let i=0;i<px.length;i+=4)lum+=(px[i]+px[i+1]+px[i+2])/3;lum/=px.length/4;if(!tLight&&lum>210)tLight=performance.now();await new Promise(r=>setTimeout(r,16));}const offset=avOffset(tAudio,tLight);if(offset!=null)setResult(offset);stream.getTracks().forEach(t=>t.stop());await ctx.close();setRunning(false)};
  return <section className="panel"><div className="panel-title">A/V EVENT DETECTOR</div><p>Point at a screen or source that produces a bright flash and a sound together, then start the scan.</p><video ref={videoRef} playsInline muted className="preview"/><canvas ref={canvasRef} width="32" height="24" hidden/><button className="primary" disabled={running} onClick={run}>{running?'SCANNING…':'SCAN 7 SECONDS'}</button>{result!=null&&<><BigMetric value={(result>0?'+':'')+fmt(result,0)+' ms'} label={result>0?'AUDIO AFTER LIGHT':'AUDIO BEFORE LIGHT'}/><ActionShare text={`LagCheck measured ${fmt(result,0)} ms A/V offset.`}/></>}</section>;
}

function TapBack(){
  const room=useRoom(); const [hits,setHits]=useState(0); const [flash,setFlash]=useState(false);
  useEffect(()=>{if(room.lastMessage?.type==='tap'){setHits(nextSignalCount);setFlash(true);haptic();setTimeout(()=>setFlash(false),350)}},[room.lastMessage]);
  const tap=()=>{room.send('tap');setHits(nextSignalCount);haptic()};
  return <><RoomPanel room={room}/><section className={`tapstage ${flash?'flash':''}`}><button className="mega" onClick={tap}>TAP</button><BigMetric value={String(hits)} label="SIGNALS"/></section></>;
}

function PaperCheck(){
  type Item={id:string;t:string;done:boolean};
  const storageKey='papercheck:current-list:v1';
  const newId=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const [initial]=useState(()=>{
    try{
      const saved=localStorage.getItem(storageKey);
      if(!saved)return {raw:'',items:[] as Item[],error:''};
      const value=JSON.parse(saved);
      if(value?.version!==1||typeof value.raw!=='string'||!Array.isArray(value.items)||!value.items.every((item:Item)=>item&&typeof item.id==='string'&&item.id.length>0&&typeof item.t==='string'&&typeof item.done==='boolean')||new Set(value.items.map((item:Item)=>item.id)).size!==value.items.length)throw new Error('Invalid saved list');
      return {raw:value.raw as string,items:value.items as Item[],error:''};
    }catch{return {raw:'',items:[] as Item[],error:'Could not restore the saved list. You can still create a checklist.'}}
  });
  const [list,setList]=useState({raw:initial.raw,items:initial.items});
  const {raw,items}=list;
  const [storageError,setStorageError]=useState(initial.error);
  const [status,setStatus]=useState('');
  const [busy,setBusy]=useState(false);
  const [photo,setPhoto]=useState('');
  const [attempted,setAttempted]=useState(false);
  const [newText,setNewText]=useState('');
  const scanning=useRef(false);
  useEffect(()=>{
    try{localStorage.setItem(storageKey,JSON.stringify({version:1,...list}));setStorageError('')}
    catch{setStorageError('Local save failed. Keep this page open and share your checklist to keep a copy.')}
  },[list]);
  const updateItems=(change:(previous:Item[])=>Item[])=>setList(previous=>({...previous,items:change(previous.items)}));
  const scan=async()=>{
    if(scanning.current)return;
    scanning.current=true;setBusy(true);setAttempted(true);setStatus('Opening camera…');setPhoto('');
    let captured=false;
    try{
      const {Camera,CameraResultType,CameraSource}=await import('@capacitor/camera');
      const pic=await Camera.getPhoto({quality:88,resultType:CameraResultType.Uri,source:CameraSource.Camera,correctOrientation:true});
      captured=true;setPhoto(pic.webPath||'');setList(previous=>({...previous,raw:''}));setStatus('Reading photo…');
      const {Capacitor}=await import('@capacitor/core');
      if(!Capacitor.isNativePlatform())throw new Error('OCR is available only in the Android or iOS app.');
      if(!pic.path)throw new Error('The camera did not provide a local image path.');
      const {TextRecognition}=await import('@capacitor-mlkit/text-recognition');
      const result=await TextRecognition.processImage({path:pic.path});
      const text=(result.text?.trim()||result.blocks?.map(block=>block.text).join('\n').trim()||'');
      if(!text){setStatus('No text recognized. Take a clearer new photo, or paste/type the text below.');return}
      setList(previous=>({...previous,raw:text}));setStatus('Text recognized. Review and edit it below, then make your checklist.');
    }catch(error){
      const detail=error instanceof Error?error.message:'The camera or OCR service is unavailable.';
      setStatus(`${captured?'OCR failed':'Photo not captured'}: ${detail} Paste/type one item per line below, or try a new photo.`);
    }finally{scanning.current=false;setBusy(false)}
  };
  const lines=checklistLines(raw);
  const importRaw=()=>{
    if(!lines.length)return;
    if(items.length&&!window.confirm('Replace the current checklist with the edited text?'))return;
    updateItems(()=>lines.map(t=>({id:newId(),t,done:false})));setStatus('Checklist created. Changes save automatically on this device.');
  };
  const move=(id:string,direction:number)=>updateItems(previous=>{
    const from=previous.findIndex(item=>item.id===id),to=from+direction;
    if(from<0||to<0||to>=previous.length)return previous;
    const next=[...previous];[next[from],next[to]]=[next[to],next[from]];return next;
  });
  const share=async()=>{
    const text=items.map(item=>`${item.done?'✓':'□'} ${item.t}`).join('\n');
    try{
      if(navigator.share){await navigator.share({title:'PaperCheck checklist',text});setStatus('Checklist shared.')}
      else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);setStatus('Checklist copied to clipboard.')}
      else setStatus('Sharing and clipboard are unavailable here. Copy the checklist text below.');
    }catch(error){setStatus(error instanceof Error&&error.name==='AbortError'?'Sharing cancelled.':'Sharing failed. Copy the checklist text below.')}
  };
  return <section className="panel">
    <div className="panel-title">PAPER → CHECKLIST · ULTIMATE</div>
    <button className="primary" onClick={scan} disabled={busy}>{busy?'READING…':attempted?'RE-OCR · NEW PHOTO':'TAKE PHOTO'}</button>
    {photo&&<img className="preview" src={photo} alt="Photographed list" style={{maxHeight:180}}/>}
    {status&&<small role="status">{status}</small>}
    <label htmlFor="papercheck-raw">Review text · one item per line</label>
    <textarea id="papercheck-raw" value={raw} disabled={busy} onChange={event=>setList(previous=>({...previous,raw:event.target.value}))} placeholder="Recognized text appears here. You can also paste or type."/>
    <button onClick={importRaw} disabled={busy||!lines.length}>{items.length?'REPLACE CHECKLIST FROM TEXT':'MAKE CHECKLIST'}</button>
    <small className="muted">{items.filter(item=>item.done).length}/{items.length} checked · {storageError?'Not saved':'Autosaved on this device'}</small>
    {(initial.error||storageError)&&<small role="alert">{storageError||initial.error}</small>}
    <div style={{display:'grid',gap:8}}>{items.map((item,index)=><div key={item.id} style={{display:'grid',gap:6,padding:8,background:'#080c12',borderRadius:13}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <input type="checkbox" aria-label={`Complete item ${index+1}`} checked={item.done} style={{width:24,height:24,flexShrink:0}} onChange={()=>updateItems(previous=>previous.map(value=>value.id===item.id?{...value,done:!value.done}:value))}/>
        <input aria-label={`Item ${index+1} text`} value={item.t} style={{minWidth:0,textDecoration:item.done?'line-through':undefined}} onChange={event=>updateItems(previous=>previous.map(value=>value.id===item.id?{...value,t:event.target.value}:value))}/>
      </div>
      <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
        <button aria-label={`Move item ${index+1} up`} disabled={index===0} onClick={()=>move(item.id,-1)}>↑</button>
        <button aria-label={`Move item ${index+1} down`} disabled={index===items.length-1} onClick={()=>move(item.id,1)}>↓</button>
        <button aria-label={`Delete item ${index+1}`} onClick={()=>updateItems(previous=>previous.filter(value=>value.id!==item.id))}>DELETE</button>
      </div>
    </div>)}</div>
    <form style={{display:'flex',gap:8}} onSubmit={event=>{event.preventDefault();if(!newText.trim())return;updateItems(previous=>[...previous,{id:newId(),t:newText.trim(),done:false}]);setNewText('')}}>
      <input aria-label="New checklist item" placeholder="New item" value={newText} style={{minWidth:0}} onChange={event=>setNewText(event.target.value)}/>
      <button disabled={!newText.trim()} type="submit">ADD</button>
    </form>
    <div className="twocol">
      <button disabled={busy||!items.length} onClick={()=>{updateItems(previous=>previous.map(item=>({...item,id:newId(),done:false})));setStatus('Working copy created with new item IDs and all items unchecked. It is now your saved current list.')}}>DUPLICATE AS NEW</button>
      <button disabled={busy||(!items.length&&!raw&&!newText&&!photo)} onClick={()=>{if(!window.confirm('Reset the current list and draft text?'))return;setList({raw:'',items:[]});setNewText('');setPhoto('');setAttempted(false);setStatus('List reset.')}}>RESET LIST</button>
    </div>
    {items.length>0&&<><button className="ghost" onClick={share}>SHARE CHECKLIST ↗</button><details><summary>Copy checklist text</summary><textarea aria-label="Checklist text to copy" readOnly value={items.map(item=>`${item.done?'✓':'□'} ${item.t}`).join('\n')}/></details></>}
  </section>;
}

function CompareSound(){
  const [before,setBefore]=useState<number|null>(null); const [after,setAfter]=useState<number|null>(null); const [busy,setBusy]=useState(false);
  const go=async(which:'before'|'after')=>{setBusy(true);try{const r=await sampleMic(1800);which==='before'?setBefore(r.db):setAfter(r.db)}finally{setBusy(false)}};
  const d=relativeLevelChange(before,after);
  return <section className="panel"><div className="panel-title">BEFORE / AFTER</div><p>Keep the phone in the same place and compare two setups under the same sound conditions.</p><div className="twocol"><button onClick={()=>go('before')} disabled={busy}>BEFORE</button><button onClick={()=>go('after')} disabled={busy}>AFTER</button></div><div className="metrics"><BigMetric value={before==null?'—':fmt(before)+' dBFS'} label="BEFORE"/><BigMetric value={after==null?'—':fmt(after)+' dBFS'} label="AFTER"/></div>{d!=null&&<><BigMetric value={(d>0?'+':'')+fmt(d)+' dB'} label="RELATIVE CHANGE"/><ActionShare text={`CompareSound: ${fmt(d)} dB relative before/after change.`}/></>}</section>;
}

function ShowMeThat(){
  const colors=MARKER_COLORS;
  const room=useRoom();
  const [img,setImg]=useState(''); const [marker,setMarker]=useState<Marker|null>(null);
  const [shape,setShape]=useState<Marker['shape']>('ARROW'); const [color,setColor]=useState<string>(colors[0]);
  const [busy,setBusy]=useState(false); const [ready,setReady]=useState(false); const [status,setStatus]=useState('');
  const mounted=useRef(false); const generation=useRef(0); const pending=useRef(false);
  const validPhoto=isPhotoDataUrl;
  const validMarker=isMarker;
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;generation.current++}},[]);
  useEffect(()=>{
    generation.current++;pending.current=false;setBusy(false);setImg('');setMarker(null);setReady(false);setStatus('');
  },[room.code,room.role]);
  useEffect(()=>room.subscribe(message=>{
    if(message.type!=='image'&&message.type!=='image-annotation')return;
    let photo:unknown=message.payload; let mark:unknown=null;
    if(message.type==='image-annotation'){
      if(!message.payload||typeof message.payload!=='object'){setStatus('Received an invalid annotation. Ask the sender to send again.');return}
      const payload=message.payload as Record<string,unknown>;photo=payload.photo;mark=payload.marker;
    }
    if(!validPhoto(photo)||!validMarker(mark)){setStatus('Received an invalid photo or marker. Ask the sender to send again.');return}
    generation.current++;pending.current=false;setBusy(false);
    setImg(previous=>{if(previous!==photo)setReady(false);return photo});setMarker(mark);setStatus('Photo received. Tap to point, then send.');
  }),[room.subscribe]);
  const connected=(room.status==='host'||room.status==='guest')&&room.members>0;
  const shoot=async()=>{
    if(pending.current)return;
    pending.current=true;setBusy(true);setStatus('Opening camera…');const token=++generation.current;
    try{
      const photo=await takePhotoDataUrl();
      if(!mounted.current||token!==generation.current)return;
      if(!validPhoto(photo)){setStatus('No usable photo. Camera cancelled or unavailable; check camera permission and try again.');return}
      setImg(photo);setMarker(null);setReady(false);
      setStatus('Photo ready. Tap to point, then send.');
    }catch{if(mounted.current&&token===generation.current)setStatus('Camera failed. Check camera permission and try again.')}
    finally{if(mounted.current&&token===generation.current){pending.current=false;setBusy(false)}}
  };
  const send=()=>{
    if(!ready||!validPhoto(img)||!validMarker(marker)||!connected)return;
    // Self-contained annotations also work for peers that missed the original photo.
    if(marker)room.send('image-annotation',{photo:img,marker});
    else room.send('image',img);
    setStatus('Sent to the room.');
  };
  return <><RoomPanel room={room}/><section className="panel">
    <div className="panel-title">SHOW ME THAT · TAP TO POINT</div>
    <button className="primary" onClick={shoot} disabled={busy}>{busy?'OPENING CAMERA…':img?'NEW PHOTO':'TAKE PHOTO'}</button>
    {img?<>
      <p id="showmethat-help">Tap the photo to place a marker. Use arrow keys to move it when the photo is focused.</p>
      <div style={{position:'relative',display:'grid',placeItems:'center',background:'#000',borderRadius:14}}>
        <div style={{position:'relative',maxWidth:'100%',lineHeight:0}}>
          <img key={img} src={img} alt="Shared photo; tap to point" draggable={false} tabIndex={0} role="button" aria-describedby="showmethat-help"
            style={{display:'block',maxWidth:'100%',maxHeight:'55vh',width:'auto',height:'auto',objectFit:'contain',cursor:'crosshair',touchAction:'manipulation'}}
            onLoad={()=>setReady(true)} onError={()=>{setReady(false);setStatus('This photo could not be displayed. Try a new photo.')}}
            onClick={event=>{if(!ready)return;const r=event.currentTarget.getBoundingClientRect();if(!r.width||!r.height)return;setMarker({x:Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(event.clientY-r.top)/r.height)),shape,color});setStatus('Marker ready. Send to share it.')}}
            onKeyDown={event=>{if(!ready||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(event.key))return;event.preventDefault();const x=marker?.x??.5,y=marker?.y??.5;setMarker({...nudgeMarker(x,y,event.key),shape,color});setStatus('Marker ready. Send to share it.')}}/>
          {ready&&marker&&<svg aria-label={`${marker.shape.toLowerCase()} marker`} width="48" height="48" viewBox="0 0 48 48" style={{position:'absolute',left:`${marker.x*100}%`,top:`${marker.y*100}%`,transform:marker.shape==='CIRCLE'?'translate(-50%, -50%)':`translate(${marker.x>.5?'-100%':'0'}, ${marker.y>.5?'-100%':'0'}) scale(${marker.x>.5?-1:1}, ${marker.y>.5?-1:1})`,pointerEvents:'none',overflow:'visible',filter:'drop-shadow(0 1px 2px #000)'}}>
            {marker.shape==='CIRCLE'?<><circle cx="24" cy="24" r="18" fill="none" stroke="white" strokeWidth="8"/><circle cx="24" cy="24" r="18" fill="none" stroke={marker.color} strokeWidth="4"/></>:<path d="M 1 1 L 6 24 L 13 17 L 34 38 L 41 31 L 20 10 L 27 3 Z" fill={marker.color} stroke="white" strokeWidth="2" strokeLinejoin="round"/>}
          </svg>}
        </div>
      </div>
      <div className="twocol">{(['ARROW','CIRCLE'] as const).map(value=><button key={value} aria-pressed={shape===value} style={{outline:shape===value?'2px solid white':undefined}} onClick={()=>{setShape(value);setMarker(previous=>previous?{...previous,shape:value}:null)}}>{value}</button>)}</div>
      <div style={{display:'flex',gap:10}}>{colors.map((value,index)=><button key={value} aria-label={['Red marker','Yellow marker','Blue marker'][index]} aria-pressed={color===value} style={{minWidth:48,minHeight:48,background:value,outline:color===value?'3px solid white':undefined}} onClick={()=>{setColor(value);setMarker(previous=>previous?{...previous,color:value}:null)}}/>)}</div>
      <div className="twocol"><button disabled={!marker} onClick={()=>{setMarker(null);setStatus('Marker cleared locally. Send photo to clear it in the room.')}}>CLEAR MARK</button><button className="primary" disabled={!ready||busy||!connected} onClick={send}>{marker?'SEND ANNOTATION':'SEND PHOTO'}</button></div>
      {!connected&&<small>Connect another phone to send this photo.</small>}
    </>:<div className="empty">Take a photo or join a room to receive one.</div>}
    {status&&<small role="status" aria-live="polite">{status}</small>}
  </section></>;
}

function CountTogether(){
  const room=useRoom(); const [counter,setCounter]=useState(emptyCounter);
  const current=useRef(counter);
  useEffect(()=>{current.current=emptyCounter();setCounter(current.current)},[room.code,room.role]);
  useEffect(()=>room.subscribe(message=>{
    if(room.role==='host'&&message.type==='count-action'){
      current.current=reduceCounter(current.current,message.payload,message.from);
      setCounter(current.current);
      room.send('count-state',current.current);
    }else if(room.role==='guest'&&message.type==='count-state'&&message.from===room.presence[0]&&isCounterState(message.payload)&&message.payload.revision>=current.current.revision){
      current.current=message.payload;
      setCounter(current.current);
    }
  }),[room.subscribe,room.send,room.role,room.presence]);
  useEffect(()=>{
    if(room.role==='host')room.send('count-state',current.current);
  },[room.send,room.role,room.code,room.presence,room.members]);
  const act=(action:{delta?:number;reset?:boolean;revision?:number})=>{
    if(room.role==='guest')room.send('count-action',action);
    else{
      current.current=reduceCounter(current.current,action,room.identity);
      setCounter(current.current);
      if(room.role==='host')room.send('count-state',current.current);
    }
    haptic();
  };
  const reset=()=>{
    const {value,revision}=current.current;
    if(window.confirm(`Reset the count (${value}) to zero?`))act({reset:true,revision});
  };
  return <><RoomPanel room={room}/><section className="counter"><button onClick={()=>act({delta:-1})}>−</button><strong>{counter.value}</strong><button onClick={()=>act({delta:1})}>+</button></section><button className="ghost" onClick={reset}>RESET</button>{counter.history.length>0&&<section className="panel"><div className="panel-title">RECENT HISTORY</div><ul>{counter.history.map((entry,i)=><li key={counter.revision-i}>{entry}</li>)}</ul></section>}</>;
}

function PhabLabPhone(){
  const mic=useMicLevel(); const ori=useOrientation(); const motion=useMotion();
  const [micOn,setMicOn]=useState(false); const [oriOn,setOriOn]=useState(false); const [motOn,setMotOn]=useState(false);
  const oriStop=useRef<null|(()=>void)>(null); const motStop=useRef<null|(()=>void)>(null);
  useEffect(()=>()=>{oriStop.current?.();motStop.current?.();mic.stop()},[mic.stop]);
  const toggleOri=async()=>{if(oriOn){oriStop.current?.();oriStop.current=null;setOriOn(false)}else{oriStop.current=await ori.start();setOriOn(true)}};
  const toggleMot=async()=>{if(motOn){motStop.current?.();motStop.current=null;setMotOn(false)}else{motStop.current=await motion.start();setMotOn(true)}};
  return <><section className="hero-lab"><div className="atom">🧪</div><h1>POCKET SENSOR LAB</h1><p>Use the sensors already inside your phone. Measurements are educational/relative, not certified lab readings.</p></section><section className="gridcards"><button onClick={async()=>{if(micOn){mic.stop();setMicOn(false)}else{await mic.start();setMicOn(true)}}}><span>🎤 MICROPHONE</span><strong>{fmt(mic.db)} dBFS</strong></button><button onClick={toggleOri}><span>📐 ORIENTATION</span><strong>{fmt(ori.beta)}° / {fmt(ori.gamma)}°</strong></button><button onClick={toggleMot}><span>📳 MOTION</span><strong>{fmt(motion.magnitude,2)} m/s²</strong></button><button onClick={()=>beep(POCKET_TONE_HZ,.2)}><span>🔊 TONE</span><strong>{POCKET_TONE_HZ} Hz</strong></button></section></>;
}

function TwinLevel(){
  const room=useRoom(); const ori=useOrientation(); const [reference,setReference]=useState<LevelReference|null>(null);
  const [starting,setStarting]=useState(false); const pending=useRef(false); const generation=useRef(0);
  useEffect(()=>room.subscribe(message=>{if(message.type==='levelref'&&isLevelReference(message.payload))setReference(message.payload)}),[room.subscribe]);
  useEffect(()=>{
    const stop=()=>{generation.current++;pending.current=false;setStarting(false);ori.stop()};
    const visibility=()=>{if(document.hidden)stop()};
    document.addEventListener('visibilitychange',visibility);window.addEventListener('phab:pause',stop);window.addEventListener('pagehide',stop);
    return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('phab:pause',stop);window.removeEventListener('pagehide',stop);stop()};
  },[ori.stop]);
  const toggle=async()=>{
    if(ori.active||pending.current){generation.current++;pending.current=false;setStarting(false);ori.stop();return}
    const id=++generation.current;pending.current=true;setStarting(true);
    try{await ori.start()}catch{/* The hook exposes the sensor error. */}
    finally{if(generation.current===id){pending.current=false;setStarting(false)}}
  };
  const reading={b:ori.beta,g:ori.gamma}; const valid=ori.active&&isLevelReference(reading);
  const delta=valid?levelDifference(reading,reference):null;
  const capture=()=>{if(!ori.active||!isLevelReference(reading))return;setReference(reading);room.send('levelref',reading)};
  const direction=(value:number,axis:'X'|'Y')=>Math.abs(value)<.01?'ALIGNED':axis==='X'?(value>0?'→ INCREASE X':'← DECREASE X'):(value>0?'↑ INCREASE Y':'↓ DECREASE Y');
  return <><RoomPanel room={room}/><section className="panel"><button onClick={toggle}>{starting?'CANCEL START':ori.active?'STOP SENSOR':'START LEVEL'}</button>{ori.error&&<p role="alert">{ori.error}</p>}<button className="primary" disabled={!valid} onClick={capture}>CAPTURE REFERENCE</button><div className="metrics"><BigMetric value={fmt(ori.gamma)+'°'} label="TILT X"/><BigMetric value={fmt(ori.beta)+'°'} label="TILT Y"/></div>{delta&&<><div className="metrics"><BigMetric value={fmt(delta.x,2)+'°'} label={'Δ X · '+direction(delta.x,'X')}/><BigMetric value={fmt(delta.y,2)+'°'} label={'Δ Y · '+direction(delta.y,'Y')}/></div><BigMetric value={fmt(delta.total,2)+'°'} label={delta.match?'TOTAL · MATCH ✓':'TOTAL DIFFERENCE'}/><ActionShare text={`TwinLevel: X ${fmt(delta.x,2)}°, Y ${fmt(delta.y,2)}°, total ${fmt(delta.total,2)}°${delta.match?' · MATCH':''}.`}/></>}</section></>;
}

function SensorLink(){
  const room=useRoom(); const mic=useMicLevel(); const ori=useOrientation(); const motion=useMotion();
  const [selected,setSelected]=useState({sound:true,tilt:true,motion:true}); const [running,setRunning]=useState(false); const [starting,setStarting]=useState(false);
  const [remote,setRemote]=useState<SensorSample|null>(null); const [stats,setStats]=useState<SensorStats>({});
  const generation=useRef(0); const streaming=useRef(false); const pending=useRef(false); const timer=useRef<ReturnType<typeof setInterval>|null>(null);
  const stop=()=>{generation.current++;streaming.current=false;pending.current=false;if(timer.current!==null)clearInterval(timer.current);timer.current=null;mic.stop();ori.stop();motion.stop();setRunning(false);setStarting(false)};
  useEffect(()=>{
    const visibility=()=>{if(document.hidden)stop()};
    document.addEventListener('visibilitychange',visibility);window.addEventListener('phab:pause',stop);window.addEventListener('pagehide',stop);
    return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('phab:pause',stop);window.removeEventListener('pagehide',stop);stop()};
  },[mic.stop,ori.stop,motion.stop]);
  useEffect(()=>room.subscribe(message=>{
    if(message.type!=='sensor')return;
    const sample=sensorSample(message.payload);if(!Object.keys(sample).length)return;
    setRemote(sample);setStats(previous=>updateSensorStats(previous,sample));
  }),[room.subscribe]);
  const latest=useRef({sample:{} as SensorSample,send:room.send});
  latest.current={sample:sensorSample({...(selected.sound&&mic.active?{db:mic.db}:{}),...(selected.tilt&&ori.active?{beta:ori.beta,gamma:ori.gamma}:{}),...(selected.motion&&motion.active?{motion:motion.magnitude}:{})}),send:room.send};
  useEffect(()=>{
    if(!running)return;
    timer.current=setInterval(()=>{const {sample,send}=latest.current;if(streaming.current&&Object.keys(sample).length)send('sensor',sample)},160);
    return()=>{if(timer.current!==null)clearInterval(timer.current);timer.current=null};
  },[running]);
  useEffect(()=>{if(running&&!starting&&!mic.active&&!ori.active&&!motion.active)stop()},[running,starting,mic.active,ori.active,motion.active]);
  const start=async()=>{
    if(pending.current||streaming.current||!Object.values(selected).some(Boolean))return;
    const id=++generation.current;pending.current=true;setStarting(true);setRemote(null);setStats({});
    // Begin all selected permission requests in the user gesture; each hook owns its cleanup.
    const results=await Promise.allSettled([...(selected.sound?[mic.start()]:[]),...(selected.tilt?[ori.start()]:[]),...(selected.motion?[motion.start()]:[])]);
    if(id!==generation.current)return;
    pending.current=false;setStarting(false);
    if(results.some(result=>result.status==='fulfilled')){streaming.current=true;setRunning(true)}else stop();
  };
  const fields=[['db','SOUND',' dBFS'],['gamma','TILT X','°'],['beta','TILT Y','°'],['motion','MOTION',' m/s²']] as const;
  return <><RoomPanel room={room}/><section className="panel"><div className="checklist">{(['sound','tilt','motion'] as const).map(key=><label key={key}><input type="checkbox" checked={selected[key]} disabled={running||starting} onChange={event=>{const checked=event.target.checked;setSelected(previous=>({...previous,[key]:checked}))}}/>{key.toUpperCase()}</label>)}</div><button className="primary" disabled={!running&&!starting&&!Object.values(selected).some(Boolean)} onClick={running||starting?stop:start}>{starting?'STOP · STARTING':running?'STOP STREAM':'START STREAM'}</button>{selected.sound&&mic.error&&<p role="alert">SOUND · {mic.error}</p>}{selected.tilt&&ori.error&&<p role="alert">TILT · {ori.error}</p>}{selected.motion&&motion.error&&<p role="alert">MOTION · {motion.error}</p>}<div className="panel-title">LAST REMOTE SAMPLE</div>{remote?<div className="metrics four">{fields.filter(([key])=>remote[key]!==undefined).map(([key,label,unit])=><BigMetric key={key} value={fmt(remote[key]!,2)+unit} label={label}/>)}</div>:<p>Waiting for a remote sample.</p>}<div className="panel-title">REMOTE SESSION · MIN / MAX</div>{fields.filter(([key])=>stats[key]).map(([key,label,unit])=><div key={key} className="muted">{label} · {fmt(stats[key]!.min,2)} / {fmt(stats[key]!.max,2)}{unit}</div>)}<button className="ghost" onClick={()=>{setRemote(null);setStats({})}}>RESET REMOTE SESSION</button></section></>;
}

function SyncMark(){
  const room=useRoom(); const [delay,setDelay]=useState(1000); const [flash,setFlash]=useState(false); const [marks,setMarks]=useState<number[]>([]);
  const timers=useRef(new Set<ReturnType<typeof setTimeout>>()); const flashTimer=useRef<ReturnType<typeof setTimeout>|null>(null); const mounted=useRef(false);
  const later=(callback:()=>void,ms:number)=>{const timer=setTimeout(()=>{timers.current.delete(timer);if(mounted.current&&!document.hidden)callback()},ms);timers.current.add(timer);return timer};
  const fire=(ms:number)=>{
    if(!mounted.current||document.hidden)return;
    later(()=>{
      const now=Date.now();setMarks(previous=>[now,...previous].slice(0,8));setFlash(true);
      if(flashTimer.current!==null){clearTimeout(flashTimer.current);timers.current.delete(flashTimer.current)}
      flashTimer.current=later(()=>{setFlash(false);flashTimer.current=null},180);
      void Promise.allSettled([beep(1000,.08),haptic()]);
    },ms);
  };
  useEffect(()=>{
    mounted.current=true;
    const cancel=()=>{timers.current.forEach(clearTimeout);timers.current.clear();flashTimer.current=null;if(mounted.current)setFlash(false)};
    const visibility=()=>{if(document.hidden)cancel()};
    document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',cancel);window.addEventListener('phab:pause',cancel);
    return()=>{mounted.current=false;cancel();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',cancel);window.removeEventListener('phab:pause',cancel)};
  },[]);
  useEffect(()=>room.subscribe(message=>{
    if(message.type!=='syncmark')return;
    const payload=message.payload;
    const ms=markDelay(payload&&typeof payload==='object'&&'delay' in payload?payload.delay:undefined);
    if(ms!==null)fire(ms);
  }),[room.subscribe]);
  const go=()=>{if(document.hidden)return;room.send('syncmark',{delay});fire(delay)};
  return <><RoomPanel room={room}/><section className={`syncstage ${flash?'flash':''}`}><div className="twocol">{[0,1000,3000,5000].map(ms=><button key={ms} aria-pressed={delay===ms} onClick={()=>setDelay(ms)}>{ms/1000} s</button>)}</div><button className="mega" onClick={go}>SYNC MARK</button><p>Approximate sync marker, not professional timecode. Flash + beep after each phone’s relative countdown; network and device delays vary. Tap again for another mark.</p>{marks.length>0&&<><div className="panel-title">FIRED MARKS · LOCAL TIME</div><ol>{marks.map((time,index)=><li key={index}><time dateTime={new Date(time).toISOString()}>{new Date(time).toLocaleTimeString()}.{String(time%1000).padStart(3,'0')}</time></li>)}</ol></>}</section></>;
}

function SoundRace(){
  const room=useRoom(); const [mode,setMode]=useState<'idle'|'arm'|'calibrate'>('idle');
  const [heard,setHeard]=useState<{id:string;t:number}[]>([]); const [threshold,setThreshold]=useState(.18);
  const [recommendation,setRecommendation]=useState(''); const [error,setError]=useState('');
  const owner=useRef<import('./runtime').ResourceScope|null>(null); const generation=useRef(0); const mounted=useRef(true);
  const stop=()=>{generation.current++;owner.current?.close();owner.current=null;if(mounted.current)setMode('idle')};
  useEffect(()=>{
    mounted.current=true;
    const cancel=()=>stop(); const visibility=()=>{if(document.hidden)cancel()};
    document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',cancel);window.addEventListener('phab:pause',cancel);
    return()=>{mounted.current=false;cancel();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',cancel);window.removeEventListener('phab:pause',cancel)};
  },[]);
  useEffect(()=>room.subscribe(message=>{
    if(message.type!=='heard')return;
    const p=message.payload;
    if(p&&typeof p==='object'&&'t' in p)setHeard(v=>addRaceResult(v,message.from,p.t));
  }),[room.subscribe]);
  const start=async(kind:'arm'|'calibrate')=>{
    stop();if(document.hidden||!mounted.current)return;
    const run=generation.current; const current=()=>mounted.current&&generation.current===run;
    setMode(kind);setError('');if(kind==='calibrate')setRecommendation('');
    try {
      const {resourceScope,openMedia,audioAnalyser,rmsOf}=await import('./runtime');
      if(!current())return;
      const scope=resourceScope();owner.current=scope;
      if(kind==='calibrate'){
        const sample=await sampleMic(1000,scope);
        if(!current())return;
        const target=Math.max(.05,sample.peak*1.5);
        const suggested=Math.min(.35,Math.ceil(target*100)/100);
        setRecommendation(`Ambient peak RMS ${sample.peak.toFixed(3)}. Suggested threshold ${suggested.toFixed(2)} (applied): 1.5× this short sample’s peak, limited to 0.05–0.35. ${target>.35?'Ambient sound is too high for that margin; try a quieter room. ':' '}This cannot guarantee detection or prevent false triggers.`);
        setThreshold(suggested);stop();return;
      }
      const stream=await openMedia(scope,{audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
      const analyser=await audioAnalyser(scope,stream);const data=new Float32Array(analyser.fftSize);let raf=0;
      scope.own(()=>cancelAnimationFrame(raf));
      const tick=()=>{
        if(scope.closed||!current())return;
        try {
          analyser.getFloatTimeDomainData(data);
          if(rmsOf(data)>threshold){
            const t=Date.now();setHeard(v=>addRaceResult(v,room.identity,t));stop();room.send('heard',{t});void haptic().catch(()=>{});return;
          }
          raf=requestAnimationFrame(tick);
        } catch(e){if(current()){setError(e instanceof Error?e.message:'Microphone failed. Check permissions and try again.');stop()}}
      };tick();
    } catch(e){if(current()){setError(e instanceof Error?e.message:'Microphone unavailable. Check permissions and try again.');stop()}}
  };
  return <><RoomPanel room={room}/><section className="panel">
    <label className="slider">RMS THRESHOLD {threshold.toFixed(2)} <input type="range" min="0.05" max="0.35" step="0.01" value={threshold} disabled={mode!=='idle'} onChange={e=>setThreshold(Number(e.target.value))}/></label>
    <button disabled={mode!=='idle'} onClick={()=>void start('calibrate')}>CALIBRATE AMBIENT · 1 s</button>
    {recommendation&&<p>{recommendation}</p>}
    <button className="primary" onClick={()=>mode==='idle'?void start('arm'):stop()}>{mode==='arm'?'ARMED · TAP TO CANCEL':mode==='calibrate'?'SAMPLING AMBIENT · CANCEL':'ARM MICROPHONE'}</button>
    {error&&<p role="alert">{error}</p>}
    <p>Stay quiet during calibration. Make one clear, comfortable sound after every phone is armed. Rankings and relative times are approximate: clocks, devices and network are not synchronized lab instruments.</p>
    <ol className="rank">{raceDeltas(heard).map((x,i)=><li key={x.id}><strong>#{i+1}</strong><span>{x.id}</span><small>+{x.delta} ms</small></li>)}</ol>
    <button className="ghost" onClick={()=>{stop();setHeard([])}}>RESET</button>
  </section></>;
}

function FrameMatch(){
  const [ref,setRef]=useState(''); const [opacity,setOpacity]=useState(.5); const [streaming,setStreaming]=useState(false); const video=useRef<HTMLVideoElement>(null); const streamRef=useRef<MediaStream|null>(null);
  const capture=async()=>{const d=await takePhotoDataUrl();if(d)setRef(d)};
  const live=async()=>{if(streaming){streamRef.current?.getTracks().forEach(t=>t.stop());setStreaming(false);return}const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});streamRef.current=s;if(video.current){video.current.srcObject=s;await video.current.play()}setStreaming(true)};
  useEffect(()=>()=>streamRef.current?.getTracks().forEach(t=>t.stop()),[]);
  return <section className="panel"><div className="panel-title">REFERENCE OVERLAY</div><div className="framebox"><video ref={video} playsInline muted/><>{ref&&<img src={ref} style={{opacity}}/>}</></div><div className="twocol"><button onClick={capture}>REFERENCE PHOTO</button><button onClick={live}>{streaming?'STOP CAMERA':'LIVE CAMERA'}</button></div><label className="slider">OVERLAY <input type="range" min="0" max="1" step=".05" value={opacity} onChange={e=>setOpacity(clampOpacity(Number(e.target.value)))}/></label></section>;
}

function RelayTap(){
  const room=useRoom(); const [signalAt,setSignalAt]=useState<number|null>(null); const [score,setScore]=useState<number|null>(null); const [board,setBoard]=useState<{id:string;ms:number}[]>([]); const [go,setGo]=useState(false);
  useEffect(()=>{if(room.lastMessage?.type==='relaygo'){setGo(true);setSignalAt(performance.now());beep(900,.08);haptic()} if(room.lastMessage?.type==='relayscore'){const p=room.lastMessage.payload as any;setBoard(v=>rankByMs([...v.filter(x=>x.id!==p.id),p]))}},[room.lastMessage]);
  const start=()=>{setBoard([]);setScore(null);setGo(false);setTimeout(()=>{room.send('relaygo');setGo(true);setSignalAt(performance.now());beep(900,.08)},700+Math.random()*1800)};
  const tap=()=>{const ms=reactionMs(performance.now(),signalAt,go);if(ms==null)return;setScore(ms);setGo(false);const p={id:room.code||'LOCAL',ms};setBoard(v=>rankByMs([...v,p]));room.send('relayscore',p);haptic()};
  return <><RoomPanel room={room}/><section className="relay"><button className="primary" onClick={start}>START RANDOM SIGNAL</button><button className={`mega ${go?'ready':''}`} onClick={tap}>{go?'TAP!':'WAIT'}</button>{score!=null&&<><BigMetric value={fmt(score,0)+' ms'} label="REACTION"/><ActionShare text={`RelayTap reaction: ${fmt(score,0)} ms.`}/></>}<ol className="rank">{board.map((x,i)=><li key={i}><strong>#{i+1}</strong><span>{x.id}</span><small>{fmt(x.ms,0)} ms</small></li>)}</ol></section></>;
}
