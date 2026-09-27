import { Capacitor } from '@capacitor/core';
import { restoreState } from './logic.ts';

export function capabilities() {
  return {
    camera: !!navigator.mediaDevices?.getUserMedia,
    microphone: !!navigator.mediaDevices?.getUserMedia && typeof AudioContext !== 'undefined',
    orientation: typeof DeviceOrientationEvent !== 'undefined',
    motion: typeof DeviceMotionEvent !== 'undefined',
    haptics: Capacitor.isPluginAvailable('Haptics') || typeof navigator.vibrate === 'function',
    sharing: !!navigator.share || !!navigator.clipboard?.writeText,
    qr: 'BarcodeDetector' in window && !!navigator.mediaDevices?.getUserMedia,
    speech: Capacitor.isPluginAvailable('SpeechRecognition'),
  };
}

export function loadLocal<T>(key: string, fallback: T, valid: (v: unknown) => v is T): { state: T; restored: boolean; invalid: boolean } {
  try {
    const raw = localStorage.getItem(`phab:${key}`);
    if (raw === null) return { state: fallback, restored: false, invalid: false };
    const parsed = restoreState(raw, valid, fallback);
    return { state: parsed.state, restored: parsed.restored, invalid: !parsed.restored };
  } catch { return { state: fallback, restored: false, invalid: true }; }
}
export function readLocal<T>(key: string, fallback: T, valid: (v: unknown) => v is T): T {
  return loadLocal(key, fallback, valid).state;
}
export function writeLocal(key: string, value: unknown) {
  try { localStorage.setItem(`phab:${key}`, JSON.stringify(value)); return true; } catch { return false; }
}
export function senderIdentity() {
  // Session storage isolates tabs and retains identity across refresh/reconnect.
  try {
    let id = sessionStorage.getItem('phab:sender');
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('phab:sender', id); }
    return id;
  } catch { return crypto.randomUUID(); }
}

/** A scope also disposes resources acquired after cancellation (permission dialogs). */
export class ResourceScope {
  private resources = new Set<() => void>();
  closed = false;
  own(cleanup: () => void) {
    if (this.closed) cleanup(); else this.resources.add(cleanup);
    return cleanup;
  }
  check() { if (this.closed) throw new Error('Stopped. Start again when the app is visible.'); }
  close = () => {
    if (this.closed) return;
    this.closed = true;
    for (const cleanup of this.resources) { try { cleanup(); } catch { /* Continue disposing other resources. */ } }
    this.resources.clear();
  };
}
const scopes = new Set<ResourceScope>();
export function stopResources() { for (const scope of scopes) scope.close(); }
export function resourceScope() {
  const scope = new ResourceScope();
  scopes.add(scope); scope.own(() => scopes.delete(scope));
  if (typeof document !== 'undefined' && document.hidden) scope.close();
  return scope;
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopResources(); });
  window.addEventListener('pagehide', stopResources);
}
if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
  void import('@capacitor/app').then(({ App }) => App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) { stopResources(); window.dispatchEvent(new Event('phab:pause')); }
  })).catch(() => { /* Web visibility remains available. */ });
}
export async function openMedia(scope: ResourceScope, constraints: MediaStreamConstraints) {
  scope.check();
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera/microphone unavailable. Use a supported browser over HTTPS.');
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  scope.own(() => stream.getTracks().forEach(t => t.stop())); scope.check();
  return stream;
}
export async function audioAnalyser(scope: ResourceScope, stream: MediaStream) {
  scope.check();
  const ctx = new AudioContext(); scope.own(() => { void ctx.close().catch(() => {}); });
  await ctx.resume(); scope.check();
  const analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
  ctx.createMediaStreamSource(stream).connect(analyser);
  return analyser;
}
export function rmsOf(data: Float32Array) { let sum = 0; for (const value of data) sum += value * value; return Math.sqrt(sum / data.length); }
export function explainError(e: unknown) { return e instanceof Error ? e.message : 'Unable to start. Check permission and try again.'; }
