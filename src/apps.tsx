import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, applyLevelZero, emptySensorLinkStore, isLevelReference, isSensorLinkStore, isSoundStore, isSyncStore, isTwinStore, levelDifference, markDelay, raceDeltas, relativeMotion, sensorSample, suggestRaceThreshold, updateSensorStats, emptyCounter, reduceCounter, isCounterState, type SensorSample, type SensorStats } from './logic';
import { loadLocal, writeLocal } from './runtime';

export function AppRouter({appId}:{appId:string}) {
  return <SoundRace/>;
}

function SoundRace(){
  const room=useRoom(); const [mode,setMode]=useState<'idle'|'arm'|'calibrate'>('idle');
  const loaded=useState(()=>loadLocal('soundrace:v1',{version:1 as const,threshold:.18,heard:[] as {id:string;t:number}[]},isSoundStore))[0];
  const [heard,setHeard]=useState(loaded.state.heard); const [threshold,setThreshold]=useState(loaded.state.threshold);
  const [recommendation,setRecommendation]=useState(''); const [error,setError]=useState('');
  const [restoreNote]=useState(loaded.invalid?'Could not restore the saved ranking. Starting empty.':''); const [saveError,setSaveError]=useState('');
  useEffect(()=>{if(!writeLocal('soundrace:v1',{version:1,threshold,heard}))setSaveError('Could not save on this phone.');else setSaveError('');},[threshold,heard]);
  const owner=useRef<import('./runtime').ResourceScope|null>(null); const generation=useRef(0); const mounted=useRef(true);
  const stop=()=>{generation.current++;owner.current?.close();owner.current=null;if(mounted.current)setMode('idle')};
  useEffect(()=>{
    mounted.current=true;
    const cancel=()=>stop(); const visibility=()=>{if(document.hidden)cancel()};
    document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',cancel);window.addEventListener('phab:pause',cancel);
    return()=>{mounted.current=false;cancel();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',cancel);window.removeEventListener('phab:pause',cancel)};
  },[]);
  useEffect(()=>room.subscribe(message=>{
    if(message.type!=='heard')return;
    const p=message.payload;
    if(p&&typeof p==='object'&&'t' in p)setHeard(v=>addRaceResult(v,message.from,p.t));
  }),[room.subscribe]);
  const start=async(kind:'arm'|'calibrate')=>{
    stop();if(document.hidden||!mounted.current)return;
    const run=generation.current; const current=()=>mounted.current&&generation.current===run;
    setMode(kind);setError('');if(kind==='calibrate')setRecommendation('');
    try {
      const {resourceScope,openMedia,audioAnalyser,rmsOf}=await import('./runtime');
      if(!current())return;
      const scope=resourceScope();owner.current=scope;
      if(kind==='calibrate'){
        const sample=await sampleMic(1000,scope);
        if(!current())return;
        const suggestion=suggestRaceThreshold(sample.peak);
        if(!suggestion){setError('Calibration sample was not a finite RMS value.');stop();return}
        setRecommendation(`Ambient peak RMS ${sample.peak.toFixed(3)} (dimensionless full-scale amplitude, 1 s). Suggested threshold ${suggestion.suggested.toFixed(2)} applied: 1.5× that peak, limited to 0.05–0.35.${suggestion.clipped?' Ambient sound is too high for that margin; try a quieter room.':''} This cannot guarantee detection or prevent false triggers.`);
        setThreshold(suggestion.suggested);stop();return;
      }
      const stream=await openMedia(scope,{audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
      const analyser=await audioAnalyser(scope,stream);const data=new Float32Array(analyser.fftSize);let raf=0;
      scope.own(()=>cancelAnimationFrame(raf));
      const tick=()=>{
        if(scope.closed||!current())return;
        try {
          analyser.getFloatTimeDomainData(data);
          if(rmsOf(data)>threshold){
            const t=Date.now();setHeard(v=>addRaceResult(v,room.identity,t));stop();room.send('heard',{t});void haptic().catch(()=>{});return;
          }
          raf=requestAnimationFrame(tick);
        } catch(e){if(current()){setError(e instanceof Error?e.message:'Microphone failed. Check permissions and try again.');stop()}}
      };tick();
    } catch(e){if(current()){setError(e instanceof Error?e.message:'Microphone unavailable. Check permissions and try again.');stop()}}
  };
  return <><RoomPanel room={room}/><section className="panel">
    <label className="slider">RMS THRESHOLD {threshold.toFixed(2)} <input type="range" min="0.05" max="0.35" step="0.01" value={threshold} disabled={mode!=='idle'} onChange={e=>setThreshold(Number(e.target.value))}/></label>
    <button disabled={mode!=='idle'} onClick={()=>void start('calibrate')}>CALIBRATE AMBIENT · 1 s</button>
    {recommendation&&<p>{recommendation}</p>}
    <button className="primary" onClick={()=>mode==='idle'?void start('arm'):stop()}>{mode==='arm'?'ARMED · TAP TO CANCEL':mode==='calibrate'?'SAMPLING AMBIENT · CANCEL':'ARM MICROPHONE'}</button>
    {error&&<p role="alert">{error}</p>}
    <p>Stay quiet during calibration. Make one clear, comfortable sound after every phone is armed. Deltas are milliseconds between each phone’s own clock, earliest detection first. Clocks are not synchronized and no acoustic delay was measured. This phone can arm offline. A ranking across phones needs a connected room. Hiding the app releases the microphone. Reconnect is manual.</p>
    <ol className="rank">{raceDeltas(heard).map((x,i)=><li key={x.id}><strong>#{i+1}</strong><span>{x.id}</span><small>+{x.delta} ms</small></li>)}</ol>
    <button className="ghost" onClick={()=>{stop();setHeard([])}}>RESET</button>
    {restoreNote&&<p role="alert">{restoreNote}</p>}{saveError&&<p role="alert">{saveError}</p>}
    <p className="muted">{saveError?'':'Threshold and ranking saved on this phone.'}</p>
  </section></>;
}
