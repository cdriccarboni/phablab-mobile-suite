import type Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import { isMessage, normalizeRoom, SeenMessages, type WireMessage } from './logic.ts';

export type SessionState = { code: string; status: 'idle'|'opening'|'host'|'guest'|'disconnected'|'error'; role: 'host'|'guest'|null; members: number; error: string; presence: string[] };
const initial = (): SessionState => ({code:'',status:'idle',role:null,members:0,error:'',presence:[]});
export class Session {
  state = initial();
  private peer: Peer | null = null;
  private connections = new Map<string, DataConnection>();
  private seen = new SeenMessages();
  private generation = 0;
  private sequence = 0;
  private messagePrefix = crypto.randomUUID();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private listeners = new Set<(message: WireMessage) => void>();
  private factory: (id?: string) => Peer;
  readonly identity: string;
  private app: string;
  private changed: (state: SessionState) => void;
  private timeoutMs: number;
  constructor(factory: (id?: string) => Peer, identity: string, app: string, changed: (state: SessionState) => void, timeoutMs = 15000) {
    this.factory = factory;
    this.identity = identity;
    this.app = app;
    this.changed = changed;
    this.timeoutMs = timeoutMs;
  }
  subscribe = (listener: (message: WireMessage) => void) => { this.listeners.add(listener); return () => {this.listeners.delete(listener);}; };
  private update(patch: Partial<SessionState>) { this.state = {...this.state,...patch}; this.changed(this.state); }
  private dispose() {
    this.generation++;
    clearTimeout(this.timer);
    const peer = this.peer; this.peer = null;
    for (const c of this.connections.values()) c.close();
    this.connections.clear(); peer?.destroy();
  }
  leave = () => { this.dispose(); this.seen.clear(); this.update(initial()); };
  host = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    this.open(Array.from(bytes, b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join(''), 'host');
  };
  join = (input: string) => {
    const code = normalizeRoom(input);
    if (!code) { this.update({error:'Enter the six-character room code.'}); return; }
    this.open(code,'guest');
  };
  reconnect = () => { if (this.state.role && this.state.code) this.open(this.state.code,this.state.role); };
  private open(code: string, role: 'host'|'guest') {
    this.dispose();
    const generation = this.generation;
    const current = () => generation === this.generation;
    this.update({code,role,status:'opening',members:0,presence:[],error:''});
    const hostId = `phab2-${this.app}-${code.toLowerCase()}`;
    const p = this.factory(role === 'host' ? hostId : undefined); this.peer = p;
    this.timer = setTimeout(() => { if (current() && this.state.status === 'opening') { this.dispose(); this.update({status:'error',error:'Connection timed out. Check the code and network, then reconnect.'}); } }, this.timeoutMs);
    p.on('open', () => {
      if (!current()) return;
      if (role === 'host') { clearTimeout(this.timer); this.update({status:'host',presence:[this.identity]}); }
      else this.attach(p.connect(hostId,{reliable:true,metadata:{identity:this.identity,app:this.app}}), generation);
    });
    p.on('connection', c => { if (!current() || role !== 'host' || c.metadata?.app !== this.app) c.close(); else this.attach(c,generation); });
    p.on('error', e => { if(current()) { this.dispose(); this.update({status:'error',members:0,presence:[],error:`Connection failed (${e.type}). Check your network and reconnect.`}); } });
    p.on('disconnected', () => { if(current()) { this.dispose(); this.update({status:'disconnected',members:0,presence:[],error:'Signalling disconnected. Reconnect to rejoin this room.'}); } });
    p.on('close', () => { if(current()) { this.dispose(); this.update({status:'disconnected',members:0,presence:[],error:'Room connection closed.'}); } });
  }
  private write(conn: DataConnection, message: WireMessage) { try { if(conn.open) conn.send(message); } catch { conn.close(); } }
  private presence() {
    const ids = [this.identity,...this.connections.keys()];
    this.update({members:ids.length-1,presence:ids});
    this.send('$presence',ids);
  }
  private attach(conn: DataConnection, generation: number) {
    const hosting = this.state.role === 'host';
    const identity = hosting ? conn.metadata?.identity : 'host';
    if (typeof identity !== 'string' || !identity || identity.length > 120 || identity === this.identity) { conn.close(); return; }
    const current = () => generation === this.generation && this.connections.get(identity) === conn;
    conn.on('open', () => {
      if (generation !== this.generation) {conn.close(); return;}
      const old = this.connections.get(identity);
      this.connections.set(identity,conn); old?.close();
      clearTimeout(this.timer);
      this.update({status:hosting?'host':'guest',error:''});
      if (hosting) this.presence(); else this.update({members:1});
    });
    const closed = () => {
      if (!current()) return;
      this.connections.delete(identity);
      if (hosting) this.presence();
      else this.update({status:'disconnected',members:0,presence:[],error:'Host disconnected. Reconnect when the host is available.'});
    };
    conn.on('close',closed); conn.on('error',closed);
    conn.on('data', raw => {
      if (!current() || !isMessage(raw)) return;
      const message = {...raw,from:hosting?identity:raw.from};
      // Scope deduplication without lengthening the ID relayed to guests.
      if (!this.seen.accept(JSON.stringify([message.from,message.id]))) return;
      if (message.type === '$presence') {
        if (!hosting && Array.isArray(message.payload) && message.payload.length > 0 && message.payload.every(x=>typeof x==='string'))
          this.update({presence:message.payload,members:message.payload.length-1});
        return;
      }
      if (message.type.startsWith('$')) return;
      if (hosting) for (const c of this.connections.values()) if(c !== conn) this.write(c,message);
      for (const listener of this.listeners) listener(message);
    });
  }
  send = (type: string, payload?: unknown) => {
    const message: WireMessage = {id:`${this.messagePrefix}-${++this.sequence}`,type,payload,at:Date.now(),from:this.identity};
    this.seen.accept(JSON.stringify([message.from,message.id]));
    for (const c of this.connections.values()) this.write(c,message);
    return message;
  };
}
