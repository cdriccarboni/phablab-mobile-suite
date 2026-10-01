import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, raceDeltas, markDelay, emptyCounter, reduceCounter, isCounterState, isLevelReference, levelDifference, sensorSample, updateSensorStats, avOffset, type LevelReference, type SensorSample, type SensorStats } from './logic';
import { MARKER_COLORS, POCKET_TONE_HZ, checklistLines, clampOpacity, isMarker, isPhotoDataUrl, nextSignalCount, normalizeCaption, nudgeMarker, parseSignPayload, pushCaption, rankByMs, reactionMs, relativeLevelChange, type Marker } from './app-logic';

export function AppRouter({appId}:{appId:string}) {
  return <RelayTap/>;
}

function RelayTap(){
  const room=useRoom(); const [signalAt,setSignalAt]=useState<number|null>(null); const [score,setScore]=useState<number|null>(null); const [board,setBoard]=useState<{id:string;ms:number}[]>([]); const [go,setGo]=useState(false);
  useEffect(()=>{if(room.lastMessage?.type==='relaygo'){setGo(true);setSignalAt(performance.now());beep(900,.08);haptic()} if(room.lastMessage?.type==='relayscore'){const p=room.lastMessage.payload as any;setBoard(v=>rankByMs([...v.filter(x=>x.id!==p.id),p]))}},[room.lastMessage]);
  const start=()=>{setBoard([]);setScore(null);setGo(false);setTimeout(()=>{room.send('relaygo');setGo(true);setSignalAt(performance.now());beep(900,.08)},700+Math.random()*1800)};
  const tap=()=>{const ms=reactionMs(performance.now(),signalAt,go);if(ms==null)return;setScore(ms);setGo(false);const p={id:room.code||'LOCAL',ms};setBoard(v=>rankByMs([...v,p]));room.send('relayscore',p);haptic()};
  return <><RoomPanel room={room}/><section className="relay"><button className="primary" onClick={start}>START RANDOM SIGNAL</button><button className={`mega ${go?'ready':''}`} onClick={tap}>{go?'TAP!':'WAIT'}</button>{score!=null&&<><BigMetric value={fmt(score,0)+' ms'} label="REACTION"/><ActionShare text={`RelayTap reaction: ${fmt(score,0)} ms.`}/></>}<ol className="rank">{board.map((x,i)=><li key={i}><strong>#{i+1}</strong><span>{x.id}</span><small>{fmt(x.ms,0)} ms</small></li>)}</ol></section></>;
}
