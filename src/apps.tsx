import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, applyLevelZero, emptySensorLinkStore, isLevelReference, isSensorLinkStore, isSoundStore, isSyncStore, isTwinStore, levelDifference, markDelay, raceDeltas, relativeMotion, sensorSample, suggestRaceThreshold, updateSensorStats, emptyCounter, reduceCounter, isCounterState, type SensorSample, type SensorStats } from './logic';
import { loadLocal, writeLocal } from './runtime';

export function AppRouter({appId}:{appId:string}) {
  return <TwinLevel/>;
}

function TwinLevel(){
  const room=useRoom(); const ori=useOrientation();
  const loaded=useState(()=>loadLocal('twinlevel:v1',{version:1 as const,reference:null,zero:null},isTwinStore))[0];
  const [store,setStore]=useState(loaded.state); const [restoreNote]=useState(loaded.invalid?'Could not restore the saved angle. Starting empty.':''); const [saveError,setSaveError]=useState('');
  const [starting,setStarting]=useState(false); const pending=useRef(false); const generation=useRef(0);
  useEffect(()=>{setSaveError(writeLocal('twinlevel:v1',store)?'':'Could not save on this phone.');},[store]);
  useEffect(()=>room.subscribe(message=>{const reference=message.payload;if(message.type==='levelref'&&isLevelReference(reference))setStore(previous=>({...previous,reference}))}),[room.subscribe]);
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
  const raw=isLevelReference({b:ori.beta,g:ori.gamma})?{b:ori.beta,g:ori.gamma}:null;
  const shown=raw?applyLevelZero(raw,store.zero):null;
  const valid=!!(ori.active&&shown);
  const delta=valid&&shown?levelDifference(shown,store.reference):null;
  const capture=()=>{if(!valid||!shown)return;setStore(previous=>({...previous,reference:shown}));room.send('levelref',shown)};
  const direction=(value:number,axis:'X'|'Y')=>Math.abs(value)<.01?'ALIGNED':axis==='X'?(value>0?'→ INCREASE X':'← DECREASE X'):(value>0?'↑ INCREASE Y':'↓ DECREASE Y');
  const share=delta?delta.match?`TwinLevel matched two surfaces to within ${fmt(delta.total,2)}°.`:`TwinLevel difference: ${fmt(delta.total,2)}°.`:'';
  return <><RoomPanel room={room}/><section className="panel">
    <p>Capture an angle here. Move this phone, or send the angle and match it there. Values are degrees.</p>
    <button onClick={toggle}>{starting?'CANCEL START':ori.active?'STOP SENSOR':'START LEVEL'}</button>
    {ori.error&&<p role="alert">{ori.error}</p>}
    <div className="twocol"><button disabled={!raw} onClick={()=>raw&&setStore(previous=>({...previous,zero:raw}))}>ZERO HERE</button><button disabled={!store.zero} onClick={()=>setStore(previous=>({...previous,zero:null}))}>CLEAR ZERO</button></div>
    <button className="primary" disabled={!valid} onClick={capture}>CAPTURE REFERENCE</button>
    <button className="ghost" disabled={!store.reference} onClick={()=>setStore(previous=>({...previous,reference:null}))}>CLEAR REFERENCE</button>
    <div className="metrics"><BigMetric value={fmt(shown?.g??NaN)+'°'} label="TILT X"/><BigMetric value={fmt(shown?.b??NaN)+'°'} label="TILT Y"/></div>
    {store.reference&&<p className="muted">Reference X {fmt(store.reference.g,2)}° · Y {fmt(store.reference.b,2)}°{store.zero?' · local zero on':''}</p>}
    {delta&&<><div className="metrics"><BigMetric value={fmt(delta.x,2)+'°'} label={'Δ X · '+direction(delta.x,'X')}/><BigMetric value={fmt(delta.y,2)+'°'} label={'Δ Y · '+direction(delta.y,'Y')}/></div><BigMetric value={fmt(delta.total,2)+'°'} label={delta.match?'TOTAL · UNDER 1°':'TOTAL DIFFERENCE'}/><ActionShare text={share}/></>}
    <p className="muted">Works offline on this phone. Pairing needs internet and only copies the captured degrees. ZERO HERE is a local offset, not a certified calibration. UNDER 1° is a display threshold, not a measured accuracy. Hiding the app stops the sensor. Reconnect is manual.</p>
    {restoreNote&&<p role="alert">{restoreNote}</p>}{saveError&&<p role="alert">{saveError}</p>}
    <p className="muted">{saveError?'':'Reference saved on this phone.'}</p>
  </section></>;
}
