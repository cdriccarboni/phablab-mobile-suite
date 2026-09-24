export function normalizeRoom(input: string): string | null {
  const code = input.trim().replace(/^PHAB[:-]/i, '').toUpperCase();
  return /^[A-Z0-9]{6}$/.test(code) ? code : null;
}
export type WireMessage = { id: string; type: string; payload?: unknown; at: number; from: string };
export function isMessage(value: unknown): value is WireMessage {
  if (!value || typeof value !== 'object') return false;
  const m = value as WireMessage;
  return typeof m.id === 'string' && m.id.length > 0 && m.id.length <= 120 &&
    typeof m.type === 'string' && m.type.length > 0 && m.type.length <= 80 &&
    Number.isFinite(m.at) && typeof m.from === 'string' && m.from.length <= 120;
}
export class SeenMessages {
  private ids = new Set<string>();
  accept(id: string) {
    if (this.ids.has(id)) return false;
    this.ids.add(id);
    if (this.ids.size > 4096) this.ids.delete(this.ids.values().next().value!);
    return true;
  }
  clear() { this.ids.clear(); }
}
export type CounterState = { value: number; revision: number; history: string[] };
export const emptyCounter = (): CounterState => ({ value: 0, revision: 0, history: [] });
export function reduceCounter(state: CounterState, action: unknown, sender: string): CounterState {
  if (!action || typeof action !== 'object') return state;
  const a = action as { delta?: number; reset?: boolean; revision?: number };
  if (a.reset !== undefined && typeof a.reset !== 'boolean') return state;
  // A reset must refer to exactly the value that the user confirmed.
  if (a.reset && a.revision !== state.revision) return state;
  if (!a.reset && a.delta !== 1 && a.delta !== -1) return state;
  const value = a.reset ? 0 : state.value + a.delta!;
  if (!Number.isSafeInteger(value) || !Number.isSafeInteger(state.revision + 1)) return state;
  return { value, revision: state.revision + 1, history: [`${sender.slice(-6)} · ${a.reset ? 'reset' : a.delta === 1 ? '+1' : '−1'}`, ...state.history].slice(0, 12) };
}
export function isCounterState(v: unknown): v is CounterState {
  const s = v as CounterState | null;
  return !!s && Number.isSafeInteger(s.value) && Number.isSafeInteger(s.revision) && s.revision >= 0 &&
    Array.isArray(s.history) && s.history.length <= 12 && s.history.every(x => typeof x === 'string');
}
export function summarize(values: number[]) {
  const sorted = values.filter(Number.isFinite).sort((a,b) => a-b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  const lower = sorted[middle-1], upper = sorted[middle];
  const median = sorted.length % 2 ? upper : Math.sign(lower) === Math.sign(upper)
    ? lower + (upper-lower)/2 : (lower+upper)/2;
  return { count: sorted.length, median, min: sorted[0], max: sorted[sorted.length-1] };
}
export function angleDelta(a: number, b: number) { return (((a % 360 - b % 360 + 180) % 360 + 360) % 360) - 180; }
export function avOffset(audio: number | null, light: number | null) {
  return audio !== null && light !== null && Number.isFinite(audio) && Number.isFinite(light) ? audio-light : null;
}
