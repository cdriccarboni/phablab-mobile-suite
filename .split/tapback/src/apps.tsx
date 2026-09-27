import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, raceDeltas, markDelay, emptyCounter, reduceCounter, isCounterState, isLevelReference, levelDifference, sensorSample, updateSensorStats, avOffset, type LevelReference, type SensorSample, type SensorStats } from './logic';
import { MARKER_COLORS, POCKET_TONE_HZ, checklistLines, clampOpacity, isMarker, isPhotoDataUrl, nextSignalCount, normalizeCaption, nudgeMarker, parseSignPayload, pushCaption, rankByMs, reactionMs, relativeLevelChange, type Marker } from './app-logic';

export function AppRouter({appId}:{appId:string}) {
  return <TapBack/>;
}

function TapBack(){
  const room=useRoom(); const [hits,setHits]=useState(0); const [flash,setFlash]=useState(false);
  useEffect(()=>{if(room.lastMessage?.type==='tap'){setHits(nextSignalCount);setFlash(true);haptic();setTimeout(()=>setFlash(false),350)}},[room.lastMessage]);
  const tap=()=>{room.send('tap');setHits(nextSignalCount);haptic()};
  return <><RoomPanel room={room}/><section className={`tapstage ${flash?'flash':''}`}><button className="mega" onClick={tap}>TAP</button><BigMetric value={String(hits)} label="SIGNALS"/></section></>;
}
