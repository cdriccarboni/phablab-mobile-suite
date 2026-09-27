import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, applyLevelZero, emptySensorLinkStore, isLevelReference, isSensorLinkStore, isSoundStore, isSyncStore, isTwinStore, levelDifference, markDelay, raceDeltas, relativeMotion, sensorSample, suggestRaceThreshold, updateSensorStats, emptyCounter, reduceCounter, isCounterState, type SensorSample, type SensorStats } from './logic';
import { loadLocal, writeLocal } from './runtime';

export function AppRouter({appId}:{appId:string}) {
  return <SyncMark/>;
}

function SyncMark(){
  const room=useRoom();
  const loaded=useState(()=>loadLocal('syncmark:v1',{version:1 as const,delay:1000,marks:[] as number[]},isSyncStore))[0];
  const [delay,setDelay]=useState(loaded.state.delay); const [flash,setFlash]=useState(false); const [marks,setMarks]=useState<number[]>(loaded.state.marks);
  const [restoreNote]=useState(loaded.invalid?'Could not restore the saved marks. Starting empty.':''); const [saveError,setSaveError]=useState('');
  useEffect(()=>{setSaveError(writeLocal('syncmark:v1',{version:1,delay,marks})?'':'Could not save on this phone.');},[delay,marks]);
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
  return <><RoomPanel room={room}/><section className={`syncstage ${flash?'flash':''}`}><div className="twocol">{[0,1000,3000,5000].map(ms=><button key={ms} aria-pressed={delay===ms} onClick={()=>setDelay(ms)}>{ms/1000} s</button>)}</div><button className="mega" onClick={go}>SYNC MARK</button><p>Approximate sync marker, not professional timecode. Flash + beep after each phone’s own countdown, in milliseconds. No shared clock and no latency were measured. This phone marks even offline. Other phones mark only if they receive the message. Hiding the app cancels a pending mark. Reconnect is manual.</p>{marks.length>0&&<><div className="panel-title">FIRED MARKS · LOCAL TIME</div><ol>{marks.map((time,index)=><li key={`${time}-${index}`}><time dateTime={new Date(time).toISOString()}>{new Date(time).toLocaleTimeString()}.{String(time%1000).padStart(3,'0')}</time></li>)}</ol><button className="ghost" onClick={()=>setMarks([])}>CLEAR MARKS</button></>}{restoreNote&&<p role="alert">{restoreNote}</p>}{saveError&&<p role="alert">{saveError}</p>}<p className="muted">{saveError?'':'Countdown and marks saved on this phone.'}</p></section></>;
}
