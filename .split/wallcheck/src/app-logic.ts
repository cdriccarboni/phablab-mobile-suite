export function relativeLevelChange(before: number | null, after: number | null): number | null {
  if (before == null || after == null || !Number.isFinite(before) || !Number.isFinite(after)) return null;
  return after - before;
}

export function normalizeCaption(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function pushCaption(previous: string[], value: string): string[] {
  const caption = normalizeCaption(value);
  if (!caption) return previous;
  if (previous[0] === caption) return previous;
  return [caption, ...previous.filter((item) => item !== caption)].slice(0, 7);
}

export type SignTone = 'dark' | 'light' | 'alert';

export function parseSignPayload(payload: unknown): { text: string; tone: SignTone } | null {
  if (!payload || typeof payload !== 'object' || !('text' in payload) || !('tone' in payload)) return null;
  const record = payload as { text: unknown; tone: unknown };
  if (typeof record.text !== 'string') return null;
  if (record.tone !== 'dark' && record.tone !== 'light' && record.tone !== 'alert') return null;
  return { text: record.text, tone: record.tone };
}

export function checklistLines(raw: string): string[] {
  return raw.split(/\r?\n/).map((line) => line.replace(/^\s*(?:[-•□☐☑✓✔]|\[(?: |x|X)\]|\d+[.)])\s*/, '').trim()).filter(Boolean);
}

export const MARKER_COLORS = ['#ff345f', '#ffdd3c', '#16c8ff'] as const;
export type Marker = { x: number; y: number; shape: 'ARROW' | 'CIRCLE'; color: string };

export function isPhotoDataUrl(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 12_000_000 && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

export function isMarker(value: unknown): value is Marker | null {
  if (value === null) return true;
  if (!value || typeof value !== 'object') return false;
  const marker = value as Record<string, unknown>;
  return typeof marker.x === 'number' && Number.isFinite(marker.x) && marker.x >= 0 && marker.x <= 1
    && typeof marker.y === 'number' && Number.isFinite(marker.y) && marker.y >= 0 && marker.y <= 1
    && (marker.shape === 'ARROW' || marker.shape === 'CIRCLE')
    && typeof marker.color === 'string' && (MARKER_COLORS as readonly string[]).includes(marker.color);
}

export function nudgeMarker(x: number, y: number, key: string): { x: number; y: number } {
  const dx = key === 'ArrowRight' ? 0.02 : key === 'ArrowLeft' ? -0.02 : 0;
  const dy = key === 'ArrowDown' ? 0.02 : key === 'ArrowUp' ? -0.02 : 0;
  return {
    x: Math.max(0, Math.min(1, x + dx)),
    y: Math.max(0, Math.min(1, y + dy)),
  };
}

export function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
}

export function reactionMs(now: number, signalAt: number | null, armed: boolean): number | null {
  if (!armed || signalAt == null || !Number.isFinite(now) || !Number.isFinite(signalAt)) return null;
  const ms = now - signalAt;
  return ms >= 0 ? ms : null;
}

export function rankByMs<T extends { ms: number }>(board: T[]): T[] {
  return [...board].sort((a, b) => a.ms - b.ms);
}

export function nextSignalCount(hits: number): number {
  if (!Number.isFinite(hits)) return 1;
  return hits + 1;
}

export const POCKET_TONE_HZ = 660;
