import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, raceDeltas, markDelay, emptyCounter, reduceCounter, isCounterState, isLevelReference, levelDifference, sensorSample, updateSensorStats, avOffset, type LevelReference, type SensorSample, type SensorStats } from './logic';
import { MARKER_COLORS, POCKET_TONE_HZ, checklistLines, clampOpacity, isMarker, isPhotoDataUrl, nextSignalCount, normalizeCaption, nudgeMarker, parseSignPayload, pushCaption, rankByMs, reactionMs, relativeLevelChange, type Marker } from './app-logic';

export function AppRouter({appId}:{appId:string}) {
  return <ShowMeThat/>;
}

function ShowMeThat(){
  const colors=MARKER_COLORS;
  const room=useRoom();
  const [img,setImg]=useState(''); const [marker,setMarker]=useState<Marker|null>(null);
  const [shape,setShape]=useState<Marker['shape']>('ARROW'); const [color,setColor]=useState<string>(colors[0]);
  const [busy,setBusy]=useState(false); const [ready,setReady]=useState(false); const [status,setStatus]=useState('');
  const mounted=useRef(false); const generation=useRef(0); const pending=useRef(false);
  const validPhoto=isPhotoDataUrl;
  const validMarker=isMarker;
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;generation.current++}},[]);
  useEffect(()=>{
    generation.current++;pending.current=false;setBusy(false);setImg('');setMarker(null);setReady(false);setStatus('');
  },[room.code,room.role]);
  useEffect(()=>room.subscribe(message=>{
    if(message.type!=='image'&&message.type!=='image-annotation')return;
    let photo:unknown=message.payload; let mark:unknown=null;
    if(message.type==='image-annotation'){
      if(!message.payload||typeof message.payload!=='object'){setStatus('Received an invalid annotation. Ask the sender to send again.');return}
      const payload=message.payload as Record<string,unknown>;photo=payload.photo;mark=payload.marker;
    }
    if(!validPhoto(photo)||!validMarker(mark)){setStatus('Received an invalid photo or marker. Ask the sender to send again.');return}
    generation.current++;pending.current=false;setBusy(false);
    setImg(previous=>{if(previous!==photo)setReady(false);return photo});setMarker(mark);setStatus('Photo received. Tap to point, then send.');
  }),[room.subscribe]);
  const connected=(room.status==='host'||room.status==='guest')&&room.members>0;
  const shoot=async()=>{
    if(pending.current)return;
    pending.current=true;setBusy(true);setStatus('Opening camera…');const token=++generation.current;
    try{
      const photo=await takePhotoDataUrl();
      if(!mounted.current||token!==generation.current)return;
      if(!validPhoto(photo)){setStatus('No usable photo. Camera cancelled or unavailable; check camera permission and try again.');return}
      setImg(photo);setMarker(null);setReady(false);
      setStatus('Photo ready. Tap to point, then send.');
    }catch{if(mounted.current&&token===generation.current)setStatus('Camera failed. Check camera permission and try again.')}
    finally{if(mounted.current&&token===generation.current){pending.current=false;setBusy(false)}}
  };
  const send=()=>{
    if(!ready||!validPhoto(img)||!validMarker(marker)||!connected)return;
    // Self-contained annotations also work for peers that missed the original photo.
    if(marker)room.send('image-annotation',{photo:img,marker});
    else room.send('image',img);
    setStatus('Sent to the room.');
  };
  return <><RoomPanel room={room}/><section className="panel">
    <div className="panel-title">SHOW ME THAT · TAP TO POINT</div>
    <button className="primary" onClick={shoot} disabled={busy}>{busy?'OPENING CAMERA…':img?'NEW PHOTO':'TAKE PHOTO'}</button>
    {img?<>
      <p id="showmethat-help">Tap the photo to place a marker. Use arrow keys to move it when the photo is focused.</p>
      <div style={{position:'relative',display:'grid',placeItems:'center',background:'#000',borderRadius:14}}>
        <div style={{position:'relative',maxWidth:'100%',lineHeight:0}}>
          <img key={img} src={img} alt="Shared photo; tap to point" draggable={false} tabIndex={0} role="button" aria-describedby="showmethat-help"
            style={{display:'block',maxWidth:'100%',maxHeight:'55vh',width:'auto',height:'auto',objectFit:'contain',cursor:'crosshair',touchAction:'manipulation'}}
            onLoad={()=>setReady(true)} onError={()=>{setReady(false);setStatus('This photo could not be displayed. Try a new photo.')}}
            onClick={event=>{if(!ready)return;const r=event.currentTarget.getBoundingClientRect();if(!r.width||!r.height)return;setMarker({x:Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(event.clientY-r.top)/r.height)),shape,color});setStatus('Marker ready. Send to share it.')}}
            onKeyDown={event=>{if(!ready||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(event.key))return;event.preventDefault();const x=marker?.x??.5,y=marker?.y??.5;setMarker({...nudgeMarker(x,y,event.key),shape,color});setStatus('Marker ready. Send to share it.')}}/>
          {ready&&marker&&<svg aria-label={`${marker.shape.toLowerCase()} marker`} width="48" height="48" viewBox="0 0 48 48" style={{position:'absolute',left:`${marker.x*100}%`,top:`${marker.y*100}%`,transform:marker.shape==='CIRCLE'?'translate(-50%, -50%)':`translate(${marker.x>.5?'-100%':'0'}, ${marker.y>.5?'-100%':'0'}) scale(${marker.x>.5?-1:1}, ${marker.y>.5?-1:1})`,pointerEvents:'none',overflow:'visible',filter:'drop-shadow(0 1px 2px #000)'}}>
            {marker.shape==='CIRCLE'?<><circle cx="24" cy="24" r="18" fill="none" stroke="white" strokeWidth="8"/><circle cx="24" cy="24" r="18" fill="none" stroke={marker.color} strokeWidth="4"/></>:<path d="M 1 1 L 6 24 L 13 17 L 34 38 L 41 31 L 20 10 L 27 3 Z" fill={marker.color} stroke="white" strokeWidth="2" strokeLinejoin="round"/>}
          </svg>}
        </div>
      </div>
      <div className="twocol">{(['ARROW','CIRCLE'] as const).map(value=><button key={value} aria-pressed={shape===value} style={{outline:shape===value?'2px solid white':undefined}} onClick={()=>{setShape(value);setMarker(previous=>previous?{...previous,shape:value}:null)}}>{value}</button>)}</div>
      <div style={{display:'flex',gap:10}}>{colors.map((value,index)=><button key={value} aria-label={['Red marker','Yellow marker','Blue marker'][index]} aria-pressed={color===value} style={{minWidth:48,minHeight:48,background:value,outline:color===value?'3px solid white':undefined}} onClick={()=>{setColor(value);setMarker(previous=>previous?{...previous,color:value}:null)}}/>)}</div>
      <div className="twocol"><button disabled={!marker} onClick={()=>{setMarker(null);setStatus('Marker cleared locally. Send photo to clear it in the room.')}}>CLEAR MARK</button><button className="primary" disabled={!ready||busy||!connected} onClick={send}>{marker?'SEND ANNOTATION':'SEND PHOTO'}</button></div>
      {!connected&&<small>Connect another phone to send this photo.</small>}
    </>:<div className="empty">Take a photo or join a room to receive one.</div>}
    {status&&<small role="status" aria-live="polite">{status}</small>}
  </section></>;
}
