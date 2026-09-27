import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, raceDeltas, markDelay, emptyCounter, reduceCounter, isCounterState, isLevelReference, levelDifference, sensorSample, updateSensorStats, avOffset, type LevelReference, type SensorSample, type SensorStats } from './logic';
import { MARKER_COLORS, POCKET_TONE_HZ, checklistLines, clampOpacity, isMarker, isPhotoDataUrl, nextSignalCount, normalizeCaption, nudgeMarker, parseSignPayload, pushCaption, rankByMs, reactionMs, relativeLevelChange, type Marker } from './app-logic';

export function AppRouter({appId}:{appId:string}) {
  return <PhabLabPhone/>;
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
