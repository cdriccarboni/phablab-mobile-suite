import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, raceDeltas, markDelay, emptyCounter, reduceCounter, isCounterState, isLevelReference, levelDifference, sensorSample, updateSensorStats, avOffset, type LevelReference, type SensorSample, type SensorStats } from './logic';
import { MARKER_COLORS, POCKET_TONE_HZ, checklistLines, clampOpacity, isMarker, isPhotoDataUrl, nextSignalCount, normalizeCaption, nudgeMarker, parseSignPayload, pushCaption, rankByMs, reactionMs, relativeLevelChange, type Marker } from './app-logic';

export function AppRouter({appId}:{appId:string}) {
  return <FrameMatch/>;
}

function FrameMatch(){
  const [ref,setRef]=useState(''); const [opacity,setOpacity]=useState(.5); const [streaming,setStreaming]=useState(false); const video=useRef<HTMLVideoElement>(null); const streamRef=useRef<MediaStream|null>(null);
  const capture=async()=>{const d=await takePhotoDataUrl();if(d)setRef(d)};
  const live=async()=>{if(streaming){streamRef.current?.getTracks().forEach(t=>t.stop());setStreaming(false);return}const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});streamRef.current=s;if(video.current){video.current.srcObject=s;await video.current.play()}setStreaming(true)};
  useEffect(()=>()=>streamRef.current?.getTracks().forEach(t=>t.stop()),[]);
  return <section className="panel"><div className="panel-title">REFERENCE OVERLAY</div><div className="framebox"><video ref={video} playsInline muted/><>{ref&&<img src={ref} style={{opacity}}/>}</></div><div className="twocol"><button onClick={capture}>REFERENCE PHOTO</button><button onClick={live}>{streaming?'STOP CAMERA':'LIVE CAMERA'}</button></div><label className="slider">OVERLAY <input type="range" min="0" max="1" step=".05" value={opacity} onChange={e=>setOpacity(clampOpacity(Number(e.target.value)))}/></label></section>;
}
