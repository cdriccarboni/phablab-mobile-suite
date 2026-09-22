import { useCallback, useEffect, useRef, useState } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import QRCode from 'qrcode';

export type WireMessage = { type: string; payload?: unknown; at: number; from?: string };

function code6() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

export function useRoom() {
  const peerRef = useRef<Peer | null>(null);
  const connsRef = useRef<DataConnection[]>([]);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle'|'opening'|'host'|'guest'|'error'>('idle');
  const [lastMessage, setLastMessage] = useState<WireMessage | null>(null);
  const [members, setMembers] = useState(0);

  const cleanup = useCallback(() => {
    connsRef.current.forEach(c => { try { c.close(); } catch {} });
    connsRef.current = [];
    try { peerRef.current?.destroy(); } catch {}
    peerRef.current = null;
    setMembers(0);
    setStatus('idle');
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const attach = useCallback((conn: DataConnection) => {
    connsRef.current.push(conn);
    const refresh = () => setMembers(connsRef.current.filter(c => c.open).length);
    conn.on('open', refresh);
    conn.on('close', refresh);
    conn.on('error', refresh);
    conn.on('data', (raw) => {
      const msg = raw as WireMessage;
      setLastMessage({ ...msg, from: conn.peer });
    });
  }, []);

  const host = useCallback(() => {
    cleanup();
    const next = code6();
    setCode(next);
    setStatus('opening');
    const p = new Peer(`phab-${next.toLowerCase()}`);
    peerRef.current = p;
    p.on('open', () => setStatus('host'));
    p.on('connection', attach);
    p.on('error', () => setStatus('error'));
  }, [attach, cleanup]);

  const join = useCallback((input: string) => {
    cleanup();
    const normalized = input.trim().replace(/^phab-/i,'').toLowerCase();
    if (!normalized) return;
    setCode(normalized.toUpperCase());
    setStatus('opening');
    const p = new Peer();
    peerRef.current = p;
    p.on('open', () => {
      const conn = p.connect(`phab-${normalized}`, { reliable: true });
      attach(conn);
      conn.on('open', () => setStatus('guest'));
    });
    p.on('error', () => setStatus('error'));
  }, [attach, cleanup]);

  const send = useCallback((type: string, payload?: unknown) => {
    const msg: WireMessage = { type, payload, at: Date.now(), from: peerRef.current?.id };
    for (const c of connsRef.current) if (c.open) c.send(msg);
    return msg;
  }, []);

  return { code, status, members, host, join, send, cleanup, lastMessage };
}

export type Room = ReturnType<typeof useRoom>;

export function RoomPanel({ room, label='PAIR PHONES' }: { room: Room; label?: string }) {
  const [joinCode, setJoinCode] = useState('');
  const [qr, setQr] = useState('');
  useEffect(() => {
    if (!room.code) return setQr('');
    QRCode.toDataURL(`PHAB:${room.code}`, { margin: 1, width: 220 }).then(setQr).catch(() => setQr(''));
  }, [room.code]);
  return <section className="panel room">
    <div className="panel-title">{label}</div>
    {room.status === 'idle' && <>
      <button className="primary" onClick={room.host}>CREATE ROOM</button>
      <div className="joinrow"><input value={joinCode} onChange={e=>setJoinCode(e.target.value)} placeholder="ROOM CODE" maxLength={6}/><button onClick={()=>room.join(joinCode)}>JOIN</button></div>
    </>}
    {room.status !== 'idle' && <>
      <div className="roomcode">{room.code || '…'}</div>
      <div className="muted">{room.status.toUpperCase()} · {room.members} LINKED</div>
      {qr && <img className="qr" src={qr} alt="QR containing room code" />}
      <button className="ghost" onClick={room.cleanup}>LEAVE</button>
    </>}
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

export async function sampleMic(ms=1500) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const data = new Float32Array(analyser.fftSize);
  let sum=0, count=0, peak=0;
  const end = performance.now()+ms;
  while (performance.now()<end) {
    analyser.getFloatTimeDomainData(data);
    let s=0;
    for (const v of data) s += v*v;
    const rms = Math.sqrt(s/data.length);
    sum += rms; count++; peak = Math.max(peak,rms);
    await new Promise(r=>setTimeout(r,40));
  }
  stream.getTracks().forEach(t=>t.stop());
  await ctx.close();
  return { rms: sum/Math.max(1,count), peak, db: dbFromRms(sum/Math.max(1,count)) };
}

export function useMicLevel() {
  const [db,setDb]=useState(-90);
  const stopRef=useRef<()=>void>(()=>{});
  const start=useCallback(async()=>{
    stopRef.current();
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    const ctx=new AudioContext();
    const analyser=ctx.createAnalyser(); analyser.fftSize=1024;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data=new Float32Array(analyser.fftSize);
    let raf=0;
    const tick=()=>{ analyser.getFloatTimeDomainData(data); let s=0; for(const v of data)s+=v*v; setDb(dbFromRms(Math.sqrt(s/data.length))); raf=requestAnimationFrame(tick); };
    tick();
    stopRef.current=()=>{cancelAnimationFrame(raf);stream.getTracks().forEach(t=>t.stop());ctx.close().catch(()=>{});};
  },[]);
  const stop=useCallback(()=>stopRef.current(),[]);
  useEffect(()=>stop,[stop]);
  return {db,start,stop};
}

export function useOrientation() {
  const [o,setO]=useState({alpha:0,beta:0,gamma:0});
  const [active,setActive]=useState(false);
  const start=useCallback(async()=>{
    const Ctor = window.DeviceOrientationEvent as unknown as { requestPermission?:()=>Promise<string> };
    if (Ctor?.requestPermission) { const p=await Ctor.requestPermission(); if(p!=='granted') throw new Error('permission denied'); }
    const handler=(e:DeviceOrientationEvent)=>setO({alpha:e.alpha??0,beta:e.beta??0,gamma:e.gamma??0});
    window.addEventListener('deviceorientation',handler);
    setActive(true);
    return ()=>{window.removeEventListener('deviceorientation',handler);setActive(false);};
  },[]);
  return { ...o, active, start };
}

export function useMotion() {
  const [m,setM]=useState(0);
  const [active,setActive]=useState(false);
  const start=useCallback(async()=>{
    const Ctor = window.DeviceMotionEvent as unknown as { requestPermission?:()=>Promise<string> };
    if (Ctor?.requestPermission) { const p=await Ctor.requestPermission(); if(p!=='granted') throw new Error('permission denied'); }
    const handler=(e:DeviceMotionEvent)=>{
      const a=e.accelerationIncludingGravity; if(!a)return;
      setM(Math.hypot(a.x??0,a.y??0,a.z??0));
    };
    window.addEventListener('devicemotion',handler);
    setActive(true);
    return ()=>{window.removeEventListener('devicemotion',handler);setActive(false);};
  },[]);
  return { magnitude:m, active, start };
}

export async function beep(frequency=880,duration=0.12) {
  const ctx=new AudioContext();
  const osc=ctx.createOscillator(); const gain=ctx.createGain();
  gain.gain.value=.05; osc.frequency.value=frequency; osc.connect(gain).connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime+duration);
  await new Promise(r=>setTimeout(r,duration*1000+30)); await ctx.close();
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
