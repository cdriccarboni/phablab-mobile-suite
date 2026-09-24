import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import QRCode from 'qrcode';

import { Session } from './session';
import type { WireMessage } from './logic';
import { normalizeRoom } from './logic';
import { capabilities, senderIdentity, resourceScope, openMedia, audioAnalyser, rmsOf, explainError, type ResourceScope } from './runtime';
export type { WireMessage } from './logic';

export function useRoom() {
  const [state, setState] = useState<Session['state']>({code:'',status:'idle',role:null,members:0,error:'',presence:[]});
  const [lastMessage, setLastMessage] = useState<WireMessage | null>(null);
  const [session] = useState(() => new Session(id => id ? new Peer(id) : new Peer(), senderIdentity(), import.meta.env.VITE_APP_ID || new URLSearchParams(location.search).get('app') || 'phablabphone', setState));
  useEffect(() => {
    const off = session.subscribe(setLastMessage);
    return () => { off(); session.leave(); };
  }, [session]);
  return {...state, host:session.host, join:session.join, reconnect:session.reconnect, cleanup:session.leave, send:session.send, subscribe:session.subscribe, identity:session.identity, lastMessage};
}
export type Room = ReturnType<typeof useRoom>;

export function usePause(stop: () => void) {
  const latest = useRef(stop); latest.current = stop;
  useEffect(() => {
    const pause = () => latest.current();
    const visibility = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('phab:pause', pause);
    window.addEventListener('pagehide', pause);
    return () => { document.removeEventListener('visibilitychange', visibility); window.removeEventListener('phab:pause', pause); window.removeEventListener('pagehide', pause); pause(); };
  }, []);
}
export function useResources() {
  const ref = useRef<ResourceScope | null>(null);
  const stop = useCallback(() => { ref.current?.close(); ref.current = null; }, []);
  usePause(stop);
  const begin = useCallback(() => { stop(); const scope = resourceScope(); ref.current = scope; return scope; }, [stop]);
  return {begin, stop};
}

export function RoomPanel({ room, label='PAIR PHONES' }: { room: Room; label?: string }) {
  const [joinCode,setJoinCode] = useState(''); const [qr,setQr] = useState('');
  const [scanning,setScanning] = useState(false); const [error,setError] = useState('');
  const video = useRef<HTMLVideoElement>(null); const resources = useResources();
  usePause(() => setScanning(false));
  useEffect(() => {
    let current = true;
    if (!room.code) { setQr(''); return; }
    QRCode.toDataURL(`PHAB:${room.code}`, {margin:1,width:220}).then(value => { if(current) setQr(value); }).catch(() => { if(current) setQr(''); });
    return () => { current = false; };
  }, [room.code]);
  const scan = async () => {
    const scope = resources.begin(); setError(''); setScanning(true);
    try {
      const Detector = (window as any).BarcodeDetector;
      if (!Detector || !(await Detector.getSupportedFormats()).includes('qr_code')) throw new Error('QR scanning unavailable here. Enter the room code.');
      const detector = new Detector({formats:['qr_code']});
      const stream = await openMedia(scope,{video:{facingMode:'environment'}});
      if (!video.current) throw new Error('Camera preview unavailable.');
      video.current.srcObject = stream; await video.current.play(); scope.check();
      const deadline = performance.now() + 30000;
      while (!scope.closed && performance.now() < deadline) {
        const results = await detector.detect(video.current);
        scope.check();
        const code = results.map((r:any) => normalizeRoom(r.rawValue)).find(Boolean);
        if (code) { room.join(code); return; }
        await new Promise(r => setTimeout(r,180));
      }
      if (!scope.closed) setError('No room QR found. Try again or type the code.');
    } catch(e) { if (!scope.closed) setError(explainError(e)); }
    finally { if (!scope.closed) setScanning(false); scope.close(); }
  };
  return <section className="panel room">
    <div className="panel-title">{label}</div>
    {room.status === 'idle' ? <>
      <button className="primary" onClick={room.host}>CREATE ROOM</button>
      <div className="joinrow"><input aria-label="Room code" autoCapitalize="characters" value={joinCode} onChange={e=>setJoinCode(e.target.value)} placeholder="ROOM CODE" maxLength={11}/><button onClick={()=>room.join(joinCode)}>JOIN</button></div>
      {capabilities().qr && <button onClick={scanning?()=>{resources.stop();setScanning(false);}:scan}>{scanning?'CANCEL SCAN':'SCAN ROOM QR'}</button>}
    </> : <>
      <div className="roomcode">{room.code || '…'}</div>
      <div role="status" className="muted">{room.status.toUpperCase()} · {room.members} OTHER PHONES</div>
      {qr && <details><summary>Show pairing QR</summary><img className="qr" src={qr} alt={`Room code ${room.code}`}/></details>}
      {(room.status==='error'||room.status==='disconnected') && <button onClick={room.reconnect}>RECONNECT</button>}
      <button className="ghost" onClick={room.cleanup}>LEAVE</button>
    </>}
    <video ref={video} hidden={!scanning} playsInline muted className="preview"/>
    {(room.error||error) && <p role="alert">{room.error||error}</p>}
    <small className="muted">Internet needed for pairing. Room codes are invitations: share only with people you trust.</small>
  </section>;
}

export async function shareText(title: string, text: string) {
  try {
    if (navigator.share) await navigator.share({ title, text });
    else await navigator.clipboard.writeText(text);
  } catch {}
}

export async function haptic() {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch { navigator.vibrate?.(60); }
}

export function clamp(n:number,min:number,max:number){ return Math.max(min,Math.min(max,n)); }
export function fmt(n:number,d=1){ return Number.isFinite(n) ? n.toFixed(d) : '—'; }
export function dbFromRms(rms:number){ return 20 * Math.log10(Math.max(rms, 1e-6)); }

export async function sampleMic(ms=1500, owner?: ResourceScope) {
  const scope = owner || resourceScope();
  try {
    const stream = await openMedia(scope,{audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    const analyser = await audioAnalyser(scope,stream);
    const data = new Float32Array(analyser.fftSize);
    let sum=0,count=0,peak=0; const end=performance.now()+ms;
    while(performance.now()<end) {
      scope.check(); analyser.getFloatTimeDomainData(data); const rms=rmsOf(data);
      sum+=rms*rms; count++; peak=Math.max(peak,rms);
      await new Promise(r=>setTimeout(r,40));
    }
    scope.check(); const rms=Math.sqrt(sum/Math.max(count,1));
    return {rms,peak,db:dbFromRms(rms)};
  } finally { scope.close(); }
}

export function useMicLevel() {
  const [db,setDb]=useState(NaN); const [active,setActive]=useState(false); const [error,setError]=useState('');
  const resources=useResources();
  const start=useCallback(async()=>{
    const scope=resources.begin(); setError('');
    try {
      const stream=await openMedia(scope,{audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
      const analyser=await audioAnalyser(scope,stream); const data=new Float32Array(analyser.fftSize); let raf=0;
      scope.own(()=>{cancelAnimationFrame(raf);setActive(false);setDb(NaN);}); setActive(true);
      const tick=()=>{if(scope.closed)return; analyser.getFloatTimeDomainData(data);setDb(dbFromRms(rmsOf(data)));raf=requestAnimationFrame(tick);}; tick();
    } catch(e) {if (!scope.closed) setError(explainError(e));scope.close();throw e;}
  },[resources.begin]);
  return {db,active,error,start,stop:resources.stop};
}

function useSensor(kind:'orientation'|'motion') {
  const [values,setValues]=useState({alpha:NaN,beta:NaN,gamma:NaN,magnitude:NaN});
  const [active,setActive]=useState(false); const [error,setError]=useState(''); const resources=useResources();
  const start=useCallback(async()=>{
    const scope=resources.begin(); setError('');
    try {
      const ctor=(kind==='orientation'?window.DeviceOrientationEvent:window.DeviceMotionEvent) as unknown as {requestPermission?:()=>Promise<string>};
      if(!ctor)throw new Error('Sensor API unavailable on this device.');
      if(ctor.requestPermission && await ctor.requestPermission()!=='granted')throw new Error('Sensor permission denied.');
      scope.check(); let received=false;
      const handler=(event:Event)=>{
        if(kind==='orientation') {
          const e=event as DeviceOrientationEvent;
          if(e.beta===null || e.gamma===null)return;
          setValues({alpha:e.alpha??NaN,beta:e.beta,gamma:e.gamma,magnitude:NaN});
        } else {
          const a=(event as DeviceMotionEvent).accelerationIncludingGravity;
          if(!a || a.x===null || a.y===null || a.z===null)return;
          setValues({alpha:NaN,beta:NaN,gamma:NaN,magnitude:Math.hypot(a.x,a.y,a.z)});
        }
        received=true; setError('');
      };
      const name=kind==='orientation'?'deviceorientation':'devicemotion';
      window.addEventListener(name,handler);setActive(true);
      const timeout=setTimeout(()=>{if(!received){setError('No sensor readings received. Hardware may be unavailable.');scope.close();}},3000);
      scope.own(()=>{clearTimeout(timeout);window.removeEventListener(name,handler);setActive(false);setValues({alpha:NaN,beta:NaN,gamma:NaN,magnitude:NaN});});
    } catch(e) {if (!scope.closed) setError(explainError(e));scope.close();throw e;}
    return scope.close;
  },[kind,resources.begin]);
  return {...values,active,error,start,stop:resources.stop};
}
export function useOrientation() {return useSensor('orientation');}
export function useMotion() {return useSensor('motion');}

export async function beep(frequency=880,duration=0.12) {
  const scope=resourceScope();
  try {
    const ctx=new AudioContext(); scope.own(()=>{void ctx.close().catch(()=>{});});
    await ctx.resume(); scope.check();
    const osc=ctx.createOscillator();const gain=ctx.createGain();gain.gain.value=.05;osc.frequency.value=frequency;osc.connect(gain).connect(ctx.destination);
    osc.start();osc.stop(ctx.currentTime+duration);
    await new Promise(r=>setTimeout(r,duration*1000+30));
  } catch { /* Visual feedback remains available when sound is blocked. */ }
  finally {scope.close();}
}

export async function takePhotoDataUrl() {
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const p=await Camera.getPhoto({quality:72,width:1200,resultType:CameraResultType.DataUrl,source:CameraSource.Camera,correctOrientation:true});
    return p.dataUrl || '';
  } catch { return ''; }
}

export async function speechStart(onText:(text:string)=>void) {
  const mod:any = await import('@capgo/capacitor-speech-recognition');
  const SR=mod.SpeechRecognition;
  const perm=await SR.checkPermissions();
  if(perm.speechRecognition!=='granted') await SR.requestPermissions();
  const listener=await SR.addListener('partialResults',(e:any)=>{ const t=e.matches?.[0]||e.accumulatedResult||''; if(t)onText(t); });
  const od=await SR.isOnDeviceRecognitionAvailable().catch(()=>({available:false}));
  await SR.start({partialResults:true,addPunctuation:true,popup:false,useOnDeviceRecognition:!!od.available});
  return async()=>{ try{await SR.stop();}catch{}; try{await listener.remove();}catch{}; };
}

export function BigMetric({value,label}:{value:string;label:string}) {
  return <div className="metric"><strong>{value}</strong><span>{label}</span></div>;
}

export function ActionShare({text}:{text:string}) {
  return <button className="ghost" onClick={()=>shareText('PhabLab result',text)}>SHARE RESULT ↗</button>;
}
