import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, raceDeltas, markDelay, emptyCounter, reduceCounter, isCounterState, isLevelReference, levelDifference, sensorSample, updateSensorStats, avOffset, type LevelReference, type SensorSample, type SensorStats } from './logic';
import { MARKER_COLORS, POCKET_TONE_HZ, checklistLines, clampOpacity, isMarker, isPhotoDataUrl, nextSignalCount, normalizeCaption, nudgeMarker, parseSignPayload, pushCaption, rankByMs, reactionMs, relativeLevelChange, type Marker } from './app-logic';

export function AppRouter({appId}:{appId:string}) {
  return <WallCheck/>;
}

function WallCheck(){
  const room=useRoom(); const [base,setBase]=useState<number|null>(null); const [test,setTest]=useState<number|null>(null); const [busy,setBusy]=useState(false);
  useEffect(()=>{ if(room.lastMessage?.type==='tone') beep(700,.7); },[room.lastMessage]);
  const measure=async(kind:'base'|'test')=>{setBusy(true);room.send('tone');await new Promise(r=>setTimeout(r,100));try{const r=await sampleMic(1200);kind==='base'?setBase(r.db):setTest(r.db);}finally{setBusy(false)}};
  const diff=relativeLevelChange(base,test);
  return <><RoomPanel room={room}/><section className="panel"><div className="panel-title">ISOLATION TEST</div><p>Put one phone by the source and one on the other side. Keep playback at a comfortable volume.</p><div className="twocol"><button onClick={()=>measure('base')} disabled={busy}>1 · OPEN / BASELINE</button><button onClick={()=>measure('test')} disabled={busy}>2 · CLOSED / TEST</button></div><div className="metrics"><BigMetric value={base==null?'—':fmt(base)+' dBFS'} label="BASE"/><BigMetric value={test==null?'—':fmt(test)+' dBFS'} label="TEST"/></div>{diff!=null&&<><BigMetric value={fmt(diff)+' dB'} label="CHANGE (RELATIVE)"/><ActionShare text={`WallCheck result: ${fmt(diff)} dB relative change.`}/></>}</section></>;
}
