import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, applyLevelZero, emptySensorLinkStore, isLevelReference, isSensorLinkStore, isSoundStore, isSyncStore, isTwinStore, levelDifference, markDelay, raceDeltas, relativeMotion, sensorSample, suggestRaceThreshold, updateSensorStats, emptyCounter, reduceCounter, isCounterState, type SensorSample, type SensorStats } from './logic';
import { loadLocal, writeLocal } from './runtime';

export function AppRouter({appId}:{appId:string}) {
  return <SensorLink/>;
}

function SensorLink(){
  const room=useRoom(); const mic=useMicLevel(); const ori=useOrientation(); const motion=useMotion();
  const loaded=useState(()=>loadLocal('sensorlink:v1',emptySensorLinkStore(),isSensorLinkStore))[0];
  const [selected,setSelected]=useState(loaded.state.selected); const [tare,setTare]=useState<number|null>(loaded.state.tare);
  const [running,setRunning]=useState(false); const [starting,setStarting]=useState(false);
  const [remote,setRemote]=useState<SensorSample|null>(loaded.state.lastRemote); const [stats,setStats]=useState<SensorStats>(loaded.state.stats);
  const [restoreNote]=useState(loaded.invalid?'Could not restore the saved sensor session. Starting empty.':''); const [saveError,setSaveError]=useState('');
  const generation=useRef(0); const streaming=useRef(false); const pending=useRef(false); const timer=useRef<ReturnType<typeof setInterval>|null>(null);
  const stop=()=>{generation.current++;streaming.current=false;pending.current=false;if(timer.current!==null)clearInterval(timer.current);timer.current=null;mic.stop();ori.stop();motion.stop();setRunning(false);setStarting(false)};
  useEffect(()=>{
    const visibility=()=>{if(document.hidden)stop()};
    document.addEventListener('visibilitychange',visibility);window.addEventListener('phab:pause',stop);window.addEventListener('pagehide',stop);
    return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('phab:pause',stop);window.removeEventListener('pagehide',stop);stop()};
  },[mic.stop,ori.stop,motion.stop]);
  useEffect(()=>{
    setSaveError(writeLocal('sensorlink:v1',{version:1,selected,tare,lastRemote:remote,stats})?'':'Could not save on this phone.');
  },[selected,tare,remote,stats]);
  useEffect(()=>room.subscribe(message=>{
    if(message.type!=='sensor')return;
    const sample=sensorSample(message.payload);if(!Object.keys(sample).length)return;
    setRemote(sample);setStats(previous=>updateSensorStats(previous,sample));
  }),[room.subscribe]);
  const motionValue=motion.active?relativeMotion(motion.magnitude,tare):null;
  const local=sensorSample({...(selected.sound&&mic.active?{db:mic.db}:{}),...(selected.tilt&&ori.active?{beta:ori.beta,gamma:ori.gamma}:{}),...(selected.motion&&motionValue!==null?{motion:motionValue}:{})});
  const latest=useRef({sample:{} as SensorSample,send:room.send});
  latest.current={sample:local,send:room.send};
  useEffect(()=>{
    if(!running)return;
    timer.current=setInterval(()=>{const {sample,send}=latest.current;if(streaming.current&&Object.keys(sample).length)send('sensor',sample)},160);
    return()=>{if(timer.current!==null)clearInterval(timer.current);timer.current=null};
  },[running]);
  useEffect(()=>{if(running&&!starting&&!mic.active&&!ori.active&&!motion.active)stop()},[running,starting,mic.active,ori.active,motion.active]);
  const start=async()=>{
    if(pending.current||streaming.current||!Object.values(selected).some(Boolean))return;
    const id=++generation.current;pending.current=true;setStarting(true);
    // Begin all selected permission requests in the user gesture; each hook owns its cleanup.
    const results=await Promise.allSettled([...(selected.sound?[mic.start()]:[]),...(selected.tilt?[ori.start()]:[]),...(selected.motion?[motion.start()]:[])]);
    if(id!==generation.current)return;
    pending.current=false;setStarting(false);
    if(results.some(result=>result.status==='fulfilled')){streaming.current=true;setRunning(true)}else stop();
  };
  const fields=[['db','SOUND',' dBFS'],['gamma','TILT X','°'],['beta','TILT Y','°'],['motion',tare===null?'MOTION':'MOTION − TARE',' m/s²']] as const;
  const metrics=(sample:SensorSample|null)=>sample&&Object.keys(sample).length?<div className="metrics four">{fields.filter(([key])=>sample[key]!==undefined).map(([key,label,unit])=><BigMetric key={key} value={fmt(sample[key]!,2)+unit} label={label}/>)}</div>:<p>No sample yet.</p>;
  return <><RoomPanel room={room}/><section className="panel">
    <p>Leave this phone by what you want to watch. Read it from the other phone. SOUND is dBFS, not dB SPL. TILT is degrees. MOTION is m/s² from acceleration including gravity, until you tare.</p>
    <div className="checklist">{(['sound','tilt','motion'] as const).map(key=><label key={key}><input type="checkbox" checked={selected[key]} disabled={running||starting} onChange={event=>{const checked=event.target.checked;setSelected(previous=>({...previous,[key]:checked}))}}/>{key.toUpperCase()}</label>)}</div>
    <button className="primary" disabled={!running&&!starting&&!Object.values(selected).some(Boolean)} onClick={running||starting?stop:start}>{starting?'STOP · STARTING':running?'STOP STREAM':'START STREAM'}</button>
    <div className="twocol"><button disabled={!motion.active||!Number.isFinite(motion.magnitude)} onClick={()=>setTare(motion.magnitude)}>TARE MOTION</button><button disabled={tare===null} onClick={()=>setTare(null)}>CLEAR TARE</button></div>
    {tare!==null&&<p className="muted">Tare subtracts {fmt(tare,2)} m/s² on this phone. The stream sends that relative value. Not a calibrated accelerometer.</p>}
    {selected.sound&&mic.error&&<p role="alert">SOUND · {mic.error}</p>}{selected.tilt&&ori.error&&<p role="alert">TILT · {ori.error}</p>}{selected.motion&&motion.error&&<p role="alert">MOTION · {motion.error}</p>}
    <div className="panel-title">THIS PHONE</div>{metrics(Object.keys(local).length?local:null)}
    <div className="panel-title">LAST REMOTE SAMPLE</div>{metrics(remote)}
    <div className="panel-title">REMOTE SESSION · MIN / MAX</div>{fields.filter(([key])=>stats[key]).map(([key,label,unit])=><div key={key} className="muted">{label} · {fmt(stats[key]!.min,2)} / {fmt(stats[key]!.max,2)}{unit}</div>)}
    <button className="ghost" onClick={()=>{setRemote(null);setStats({})}}>RESET REMOTE SESSION</button>
    <p className="muted">Numbers on this phone work offline. The other phone updates only while the room is connected. Samples are sent about every 160 ms while streaming; that interval was not measured on a device. Hiding the app stops the microphone and sensors. Reconnect is manual, with no retry loop.</p>
    {restoreNote&&<p role="alert">{restoreNote}</p>}{saveError&&<p role="alert">{saveError}</p>}
    <p className="muted">{saveError?'':'Selection, tare and last remote sample saved on this phone.'}</p>
  </section></>;
}
