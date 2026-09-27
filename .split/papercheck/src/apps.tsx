import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionShare, BigMetric, RoomPanel, beep, fmt, haptic, sampleMic, speechStart, takePhotoDataUrl, useMicLevel, useMotion, useOrientation, useRoom } from './core';
import { addRaceResult, raceDeltas, markDelay, emptyCounter, reduceCounter, isCounterState, isLevelReference, levelDifference, sensorSample, updateSensorStats, avOffset, type LevelReference, type SensorSample, type SensorStats } from './logic';
import { MARKER_COLORS, POCKET_TONE_HZ, checklistLines, clampOpacity, isMarker, isPhotoDataUrl, nextSignalCount, normalizeCaption, nudgeMarker, parseSignPayload, pushCaption, rankByMs, reactionMs, relativeLevelChange, type Marker } from './app-logic';

export function AppRouter({appId}:{appId:string}) {
  return <PaperCheck/>;
}

function PaperCheck(){
  type Item={id:string;t:string;done:boolean};
  const storageKey='papercheck:current-list:v1';
  const newId=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const [initial]=useState(()=>{
    try{
      const saved=localStorage.getItem(storageKey);
      if(!saved)return {raw:'',items:[] as Item[],error:''};
      const value=JSON.parse(saved);
      if(value?.version!==1||typeof value.raw!=='string'||!Array.isArray(value.items)||!value.items.every((item:Item)=>item&&typeof item.id==='string'&&item.id.length>0&&typeof item.t==='string'&&typeof item.done==='boolean')||new Set(value.items.map((item:Item)=>item.id)).size!==value.items.length)throw new Error('Invalid saved list');
      return {raw:value.raw as string,items:value.items as Item[],error:''};
    }catch{return {raw:'',items:[] as Item[],error:'Could not restore the saved list. You can still create a checklist.'}}
  });
  const [list,setList]=useState({raw:initial.raw,items:initial.items});
  const {raw,items}=list;
  const [storageError,setStorageError]=useState(initial.error);
  const [status,setStatus]=useState('');
  const [busy,setBusy]=useState(false);
  const [photo,setPhoto]=useState('');
  const [attempted,setAttempted]=useState(false);
  const [newText,setNewText]=useState('');
  const scanning=useRef(false);
  useEffect(()=>{
    try{localStorage.setItem(storageKey,JSON.stringify({version:1,...list}));setStorageError('')}
    catch{setStorageError('Local save failed. Keep this page open and share your checklist to keep a copy.')}
  },[list]);
  const updateItems=(change:(previous:Item[])=>Item[])=>setList(previous=>({...previous,items:change(previous.items)}));
  const scan=async()=>{
    if(scanning.current)return;
    scanning.current=true;setBusy(true);setAttempted(true);setStatus('Opening camera…');setPhoto('');
    let captured=false;
    try{
      const {Camera,CameraResultType,CameraSource}=await import('@capacitor/camera');
      const pic=await Camera.getPhoto({quality:88,resultType:CameraResultType.Uri,source:CameraSource.Camera,correctOrientation:true});
      captured=true;setPhoto(pic.webPath||'');setList(previous=>({...previous,raw:''}));setStatus('Reading photo…');
      const {Capacitor}=await import('@capacitor/core');
      if(!Capacitor.isNativePlatform())throw new Error('OCR is available only in the Android or iOS app.');
      if(!pic.path)throw new Error('The camera did not provide a local image path.');
      const {TextRecognition}=await import('@capacitor-mlkit/text-recognition');
      const result=await TextRecognition.processImage({path:pic.path});
      const text=(result.text?.trim()||result.blocks?.map(block=>block.text).join('\n').trim()||'');
      if(!text){setStatus('No text recognized. Take a clearer new photo, or paste/type the text below.');return}
      setList(previous=>({...previous,raw:text}));setStatus('Text recognized. Review and edit it below, then make your checklist.');
    }catch(error){
      const detail=error instanceof Error?error.message:'The camera or OCR service is unavailable.';
      setStatus(`${captured?'OCR failed':'Photo not captured'}: ${detail} Paste/type one item per line below, or try a new photo.`);
    }finally{scanning.current=false;setBusy(false)}
  };
  const lines=checklistLines(raw);
  const importRaw=()=>{
    if(!lines.length)return;
    if(items.length&&!window.confirm('Replace the current checklist with the edited text?'))return;
    updateItems(()=>lines.map(t=>({id:newId(),t,done:false})));setStatus('Checklist created. Changes save automatically on this device.');
  };
  const move=(id:string,direction:number)=>updateItems(previous=>{
    const from=previous.findIndex(item=>item.id===id),to=from+direction;
    if(from<0||to<0||to>=previous.length)return previous;
    const next=[...previous];[next[from],next[to]]=[next[to],next[from]];return next;
  });
  const share=async()=>{
    const text=items.map(item=>`${item.done?'✓':'□'} ${item.t}`).join('\n');
    try{
      if(navigator.share){await navigator.share({title:'PaperCheck checklist',text});setStatus('Checklist shared.')}
      else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);setStatus('Checklist copied to clipboard.')}
      else setStatus('Sharing and clipboard are unavailable here. Copy the checklist text below.');
    }catch(error){setStatus(error instanceof Error&&error.name==='AbortError'?'Sharing cancelled.':'Sharing failed. Copy the checklist text below.')}
  };
  return <section className="panel">
    <div className="panel-title">PAPER → CHECKLIST · ULTIMATE</div>
    <button className="primary" onClick={scan} disabled={busy}>{busy?'READING…':attempted?'RE-OCR · NEW PHOTO':'TAKE PHOTO'}</button>
    {photo&&<img className="preview" src={photo} alt="Photographed list" style={{maxHeight:180}}/>}
    {status&&<small role="status">{status}</small>}
    <label htmlFor="papercheck-raw">Review text · one item per line</label>
    <textarea id="papercheck-raw" value={raw} disabled={busy} onChange={event=>setList(previous=>({...previous,raw:event.target.value}))} placeholder="Recognized text appears here. You can also paste or type."/>
    <button onClick={importRaw} disabled={busy||!lines.length}>{items.length?'REPLACE CHECKLIST FROM TEXT':'MAKE CHECKLIST'}</button>
    <small className="muted">{items.filter(item=>item.done).length}/{items.length} checked · {storageError?'Not saved':'Autosaved on this device'}</small>
    {(initial.error||storageError)&&<small role="alert">{storageError||initial.error}</small>}
    <div style={{display:'grid',gap:8}}>{items.map((item,index)=><div key={item.id} style={{display:'grid',gap:6,padding:8,background:'#080c12',borderRadius:13}}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <input type="checkbox" aria-label={`Complete item ${index+1}`} checked={item.done} style={{width:24,height:24,flexShrink:0}} onChange={()=>updateItems(previous=>previous.map(value=>value.id===item.id?{...value,done:!value.done}:value))}/>
        <input aria-label={`Item ${index+1} text`} value={item.t} style={{minWidth:0,textDecoration:item.done?'line-through':undefined}} onChange={event=>updateItems(previous=>previous.map(value=>value.id===item.id?{...value,t:event.target.value}:value))}/>
      </div>
      <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
        <button aria-label={`Move item ${index+1} up`} disabled={index===0} onClick={()=>move(item.id,-1)}>↑</button>
        <button aria-label={`Move item ${index+1} down`} disabled={index===items.length-1} onClick={()=>move(item.id,1)}>↓</button>
        <button aria-label={`Delete item ${index+1}`} onClick={()=>updateItems(previous=>previous.filter(value=>value.id!==item.id))}>DELETE</button>
      </div>
    </div>)}</div>
    <form style={{display:'flex',gap:8}} onSubmit={event=>{event.preventDefault();if(!newText.trim())return;updateItems(previous=>[...previous,{id:newId(),t:newText.trim(),done:false}]);setNewText('')}}>
      <input aria-label="New checklist item" placeholder="New item" value={newText} style={{minWidth:0}} onChange={event=>setNewText(event.target.value)}/>
      <button disabled={!newText.trim()} type="submit">ADD</button>
    </form>
    <div className="twocol">
      <button disabled={busy||!items.length} onClick={()=>{updateItems(previous=>previous.map(item=>({...item,id:newId(),done:false})));setStatus('Working copy created with new item IDs and all items unchecked. It is now your saved current list.')}}>DUPLICATE AS NEW</button>
      <button disabled={busy||(!items.length&&!raw&&!newText&&!photo)} onClick={()=>{if(!window.confirm('Reset the current list and draft text?'))return;setList({raw:'',items:[]});setNewText('');setPhoto('');setAttempted(false);setStatus('List reset.')}}>RESET LIST</button>
    </div>
    {items.length>0&&<><button className="ghost" onClick={share}>SHARE CHECKLIST ↗</button><details><summary>Copy checklist text</summary><textarea aria-label="Checklist text to copy" readOnly value={items.map(item=>`${item.done?'✓':'□'} ${item.t}`).join('\n')}/></details></>}
  </section>;
}
