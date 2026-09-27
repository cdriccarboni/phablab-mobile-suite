import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, raceDeltas, markDelay, emptyCounter, reduceCounter, isCounterState, isLevelReference, levelDifference, sensorSample, updateSensorStats, avOffset, type LevelReference, type SensorSample, type SensorStats } from './logic';
import { MARKER_COLORS, POCKET_TONE_HZ, checklistLines, clampOpacity, isMarker, isPhotoDataUrl, nextSignalCount, normalizeCaption, nudgeMarker, parseSignPayload, pushCaption, rankByMs, reactionMs, relativeLevelChange, type Marker } from './app-logic';

export function AppRouter({appId}:{appId:string}) {
  return <CountTogether/>;
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
