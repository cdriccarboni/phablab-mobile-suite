import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, raceDeltas, markDelay, emptyCounter, reduceCounter, isCounterState, isLevelReference, levelDifference, sensorSample, updateSensorStats, avOffset, type LevelReference, type SensorSample, type SensorStats } from './logic';
import { MARKER_COLORS, POCKET_TONE_HZ, checklistLines, clampOpacity, isMarker, isPhotoDataUrl, nextSignalCount, normalizeCaption, nudgeMarker, parseSignPayload, pushCaption, rankByMs, reactionMs, relativeLevelChange, type Marker } from './app-logic';

export function AppRouter({appId}:{appId:string}) {
  return <CompareSound/>;
}

function CompareSound(){
  const [before,setBefore]=useState<number|null>(null); const [after,setAfter]=useState<number|null>(null); const [busy,setBusy]=useState(false);
  const go=async(which:'before'|'after')=>{setBusy(true);try{const r=await sampleMic(1800);which==='before'?setBefore(r.db):setAfter(r.db)}finally{setBusy(false)}};
  const d=relativeLevelChange(before,after);
  return <section className="panel"><div className="panel-title">BEFORE / AFTER</div><p>Keep the phone in the same place and compare two setups under the same sound conditions.</p><div className="twocol"><button onClick={()=>go('before')} disabled={busy}>BEFORE</button><button onClick={()=>go('after')} disabled={busy}>AFTER</button></div><div className="metrics"><BigMetric value={before==null?'—':fmt(before)+' dBFS'} label="BEFORE"/><BigMetric value={after==null?'—':fmt(after)+' dBFS'} label="AFTER"/></div>{d!=null&&<><BigMetric value={(d>0?'+':'')+fmt(d)+' dB'} label="RELATIVE CHANGE"/><ActionShare text={`CompareSound: ${fmt(d)} dB relative before/after change.`}/></>}</section>;
}
