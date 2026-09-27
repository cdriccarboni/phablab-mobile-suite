import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, raceDeltas, markDelay, emptyCounter, reduceCounter, isCounterState, isLevelReference, levelDifference, sensorSample, updateSensorStats, avOffset, type LevelReference, type SensorSample, type SensorStats } from './logic';
import { MARKER_COLORS, POCKET_TONE_HZ, checklistLines, clampOpacity, isMarker, isPhotoDataUrl, nextSignalCount, normalizeCaption, nudgeMarker, parseSignPayload, pushCaption, rankByMs, reactionMs, relativeLevelChange, type Marker } from './app-logic';

export function AppRouter({appId}:{appId:string}) {
  return <SignMe/>;
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
