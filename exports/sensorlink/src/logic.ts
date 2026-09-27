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

export type LevelReference = { b: number; g: number };
export function isLevelReference(value: unknown): value is LevelReference {
  const v = value as LevelReference | null;
  // Gamma from the device is usually within ±90°. A local zero can produce a wider relative angle, still bounded by ±180°.
  return !!v && Number.isFinite(v.b) && Number.isFinite(v.g) && Math.abs(v.b) <= 180 && Math.abs(v.g) <= 180;
}
export function levelDifference(reading: LevelReference, reference: LevelReference | null) {
  if (!reference || !isLevelReference(reading) || !isLevelReference(reference)) return null;
  const y = angleDelta(reference.b, reading.b), x = angleDelta(reference.g, reading.g);
  return { x, y, total: Math.hypot(x, y), match: Math.hypot(x, y) < 1 };
}
export type SensorSample = Partial<Record<'db'|'beta'|'gamma'|'motion', number>>;
export function sensorSample(value: unknown): SensorSample {
  if (!value || typeof value !== 'object') return {};
  const result: SensorSample = {};
  for (const key of ['db','beta','gamma','motion'] as const) {
    const n = (value as SensorSample)[key];
    if (typeof n === 'number' && Number.isFinite(n)) result[key] = n;
  }
  return result;
}
export type SensorStats = Partial<Record<keyof SensorSample, { min: number; max: number }>>;
export function updateSensorStats(stats: SensorStats, sample: SensorSample): SensorStats {
  const next = {...stats};
  for (const key of Object.keys(sensorSample(sample)) as (keyof SensorSample)[]) {
    const n = sample[key]!;
    next[key] = { min: Math.min(stats[key]?.min ?? n, n), max: Math.max(stats[key]?.max ?? n, n) };
  }
  return next;
}
export function markDelay(value: unknown): number | null {
  return typeof value === 'number' && [0, 1000, 3000, 5000].includes(value) ? value : null;
}
export type RaceResult = { id: string; t: number };
export function addRaceResult(results: RaceResult[], id: string, time: unknown): RaceResult[] {
  if (!id || typeof time !== 'number' || !Number.isSafeInteger(time) || time < 0 || results.some(r => r.id === id)) return results;
  return [...results, {id, t: time}].sort((a,b) => a.t-b.t || a.id.localeCompare(b.id));
}
export function raceDeltas(results: RaceResult[]) {
  if (!results.length) return [];
  const first = Math.min(...results.map(r => r.t));
  return results.map(r => ({...r, delta: r.t-first}));
}

/** Local offset: the chosen pose reads 0° on both axes. Degrees, not a factory calibration. */
export function applyLevelZero(reading: LevelReference, zero: LevelReference | null): LevelReference | null {
  if (!isLevelReference(reading)) return null;
  if (zero === null) return { b: reading.b, g: reading.g };
  if (!isLevelReference(zero)) return null;
  const next = { b: angleDelta(reading.b, zero.b), g: angleDelta(reading.g, zero.g) };
  return isLevelReference(next) ? next : null;
}

export type TwinStore = { version: 1; reference: LevelReference | null; zero: LevelReference | null };
export function isTwinStore(value: unknown): value is TwinStore {
  if (!value || typeof value !== 'object') return false;
  const store = value as TwinStore;
  const tilt = (item: unknown) => item === null || isLevelReference(item);
  return store.version === 1 && tilt(store.reference) && tilt(store.zero);
}

export type SensorSelection = { sound: boolean; tilt: boolean; motion: boolean };
export type SensorLinkStore = { version: 1; selected: SensorSelection; tare: number | null; lastRemote: SensorSample | null; stats: SensorStats };
export function emptySensorLinkStore(): SensorLinkStore {
  return { version: 1, selected: { sound: true, tilt: true, motion: true }, tare: null, lastRemote: null, stats: {} };
}
export function isSensorStats(value: unknown): value is SensorStats {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(([key, item]) => {
    if (key !== 'db' && key !== 'beta' && key !== 'gamma' && key !== 'motion') return false;
    if (!item || typeof item !== 'object') return false;
    const stat = item as { min?: unknown; max?: unknown };
    return typeof stat.min === 'number' && typeof stat.max === 'number' && Number.isFinite(stat.min) && Number.isFinite(stat.max) && stat.min <= stat.max;
  });
}
export function isSensorLinkStore(value: unknown): value is SensorLinkStore {
  if (!value || typeof value !== 'object') return false;
  const store = value as SensorLinkStore;
  const selected = store.selected;
  if (store.version !== 1 || !selected || typeof selected.sound !== 'boolean' || typeof selected.tilt !== 'boolean' || typeof selected.motion !== 'boolean') return false;
  if (store.tare !== null && (typeof store.tare !== 'number' || !Number.isFinite(store.tare))) return false;
  if (store.lastRemote !== null) {
    if (!store.lastRemote || typeof store.lastRemote !== 'object' || Array.isArray(store.lastRemote)) return false;
    if (Object.keys(store.lastRemote).length !== Object.keys(sensorSample(store.lastRemote)).length) return false;
  }
  return isSensorStats(store.stats);
}
/** Subtract a stored accelerationIncludingGravity reading. Result stays in m/s² and is relative, not calibrated. */
export function relativeMotion(magnitude: number, tare: number | null): number | null {
  if (!Number.isFinite(magnitude)) return null;
  if (tare === null) return magnitude;
  if (!Number.isFinite(tare)) return null;
  return magnitude - tare;
}

export type SyncStore = { version: 1; delay: number; marks: number[] };
export function isSyncStore(value: unknown): value is SyncStore {
  if (!value || typeof value !== 'object') return false;
  const store = value as SyncStore;
  return store.version === 1 && markDelay(store.delay) !== null && Array.isArray(store.marks) && store.marks.length <= 8 &&
    store.marks.every(mark => Number.isSafeInteger(mark) && mark >= 0);
}

export function isRaceResult(value: unknown): value is RaceResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as RaceResult;
  return typeof result.id === 'string' && result.id.length > 0 && result.id.length <= 120 && Number.isSafeInteger(result.t) && result.t >= 0;
}
export function isRaceList(value: unknown): value is RaceResult[] {
  return Array.isArray(value) && value.length <= 16 && value.every(isRaceResult) && new Set(value.map(result => result.id)).size === value.length;
}
export type SoundStore = { version: 1; threshold: number; heard: RaceResult[] };
export function isSoundStore(value: unknown): value is SoundStore {
  if (!value || typeof value !== 'object') return false;
  const store = value as SoundStore;
  return store.version === 1 && typeof store.threshold === 'number' && store.threshold >= 0.05 - 1e-9 && store.threshold <= 0.35 + 1e-9 && isRaceList(store.heard);
}
/** 1 s ambient peak → threshold. Dimensionless full-scale RMS, clamped to 0.05–0.35. Not a detection guarantee. */
export function suggestRaceThreshold(peak: number): { suggested: number; clipped: boolean } | null {
  if (!Number.isFinite(peak) || peak < 0) return null;
  const target = Math.max(0.05, peak * 1.5);
  const steps = Math.ceil(Number((target * 100).toFixed(8))) / 100;
  return { suggested: Math.min(0.35, steps), clipped: target > 0.35 };
}

export function restoreState<T>(raw: string | null, valid: (value: unknown) => value is T, fallback: T): { state: T; restored: boolean } {
  if (raw === null) return { state: fallback, restored: false };
  try {
    const value: unknown = JSON.parse(raw);
    return valid(value) ? { state: value, restored: true } : { state: fallback, restored: false };
  } catch {
    return { state: fallback, restored: false };
  }
}
