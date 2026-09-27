import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, raceDeltas, markDelay, emptyCounter, reduceCounter, isCounterState, isLevelReference, levelDifference, sensorSample, updateSensorStats, avOffset, type LevelReference, type SensorSample, type SensorStats } from './logic';
import { MARKER_COLORS, POCKET_TONE_HZ, checklistLines, clampOpacity, isMarker, isPhotoDataUrl, nextSignalCount, normalizeCaption, nudgeMarker, parseSignPayload, pushCaption, rankByMs, reactionMs, relativeLevelChange, type Marker } from './app-logic';

export function AppRouter({appId}:{appId:string}) {
  return <CaptionCast/>;
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
