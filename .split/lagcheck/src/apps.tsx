import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, raceDeltas, markDelay, emptyCounter, reduceCounter, isCounterState, isLevelReference, levelDifference, sensorSample, updateSensorStats, avOffset, type LevelReference, type SensorSample, type SensorStats } from './logic';
import { MARKER_COLORS, POCKET_TONE_HZ, checklistLines, clampOpacity, isMarker, isPhotoDataUrl, nextSignalCount, normalizeCaption, nudgeMarker, parseSignPayload, pushCaption, rankByMs, reactionMs, relativeLevelChange, type Marker } from './app-logic';

export function AppRouter({appId}:{appId:string}) {
  return <LagCheck/>;
}

function LagCheck(){
  const [result,setResult]=useState<number|null>(null); const [running,setRunning]=useState(false); const videoRef=useRef<HTMLVideoElement>(null); const canvasRef=useRef<HTMLCanvasElement>(null);
  const run=async()=>{setRunning(true);setResult(null);const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:true});const video=videoRef.current!;video.srcObject=stream;await video.play();const ctx=new AudioContext();const an=ctx.createAnalyser();an.fftSize=512;ctx.createMediaStreamSource(stream).connect(an);const audio=new Float32Array(an.fftSize);const canvas=canvasRef.current!;const c=canvas.getContext('2d')!;let tAudio:number|null=null,tLight:number|null=null;const start=performance.now();while(performance.now()-start<7000&&(!tAudio||!tLight)){an.getFloatTimeDomainData(audio);let s=0;for(const v of audio)s+=v*v;if(!tAudio&&Math.sqrt(s/audio.length)>.12)tAudio=performance.now();c.drawImage(video,0,0,32,24);const px=c.getImageData(0,0,32,24).data;let lum=0;for(let i=0;i<px.length;i+=4)lum+=(px[i]+px[i+1]+px[i+2])/3;lum/=px.length/4;if(!tLight&&lum>210)tLight=performance.now();await new Promise(r=>setTimeout(r,16));}const offset=avOffset(tAudio,tLight);if(offset!=null)setResult(offset);stream.getTracks().forEach(t=>t.stop());await ctx.close();setRunning(false)};
  return <section className="panel"><div className="panel-title">A/V EVENT DETECTOR</div><p>Point at a screen or source that produces a bright flash and a sound together, then start the scan.</p><video ref={videoRef} playsInline muted className="preview"/><canvas ref={canvasRef} width="32" height="24" hidden/><button className="primary" disabled={running} onClick={run}>{running?'SCANNING…':'SCAN 7 SECONDS'}</button>{result!=null&&<><BigMetric value={(result>0?'+':'')+fmt(result,0)+' ms'} label={result>0?'AUDIO AFTER LIGHT':'AUDIO BEFORE LIGHT'}/><ActionShare text={`LagCheck measured ${fmt(result,0)} ms A/V offset.`}/></>}</section>;
}
