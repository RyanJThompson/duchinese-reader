import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface RecentEntry {
  id: string;
  visitedAt: number;
}

export interface SyncedRecents {
  entries: RecentEntry[];
  clearedAt: number;
}

export interface SyncedLearnedEntry {
  id: string;
  learnedAt: number | null;
  updatedAt: number;
  deletedAt?: number;
}

export interface SyncedPreferences {
  showAudioPlayer?: boolean;
  showPinyin?: boolean;
  showEnglish?: boolean;
  script?: 'simplified' | 'traditional';
  theme?: 'light' | 'dark' | 'auto';
  audioPosition?: 'top' | 'bottom';
  fontScale?: number;
}

// Mirror of the reader font-scale bounds in src/lib/fontScale.ts. Kept inline so
// the serverless functions don't import client code.
const FONT_SCALE_MIN = 0.6;
const FONT_SCALE_MAX = 3;

function hasBearerOrHeaderToken(req: VercelRequest, token: string, headerName: string): boolean {
  const auth = req.headers.authorization;
  if (auth === `Bearer ${token}`) return true;

  const header = req.headers[headerName];
  return header === token;
}

function getHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isBasicAuthorized(req: VercelRequest): boolean {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD ?? process.env.APP_PASSWORD;
  if (!expectedUser || !expectedPassword) return false;

  const auth = getHeaderValue(req.headers.authorization);
  if (!auth?.startsWith('Basic ')) return false;

  try {
    const decoded = Buffer.from(auth.slice('Basic '.length), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    if (separator === -1) return false;

    return decoded.slice(0, separator) === expectedUser && decoded.slice(separator + 1) === expectedPassword;
  } catch {
    return false;
  }
}

export function isReaderAuthorized(req: VercelRequest): boolean {
  const token = process.env.READER_ACCESS_TOKEN;
  if (token && hasBearerOrHeaderToken(req, token, 'x-reader-token')) return true;
  return isBasicAuthorized(req);
}

export function isSyncAuthorized(req: VercelRequest): boolean {
  const token = process.env.SYNC_ACCESS_TOKEN;
  if (!token) return false;
  return hasBearerOrHeaderToken(req, token, 'x-sync-token');
}

export function syncUnavailable(res: VercelResponse, fallback: unknown) {
  return res.status(200).json(fallback);
}

export function methodNotAllowed(res: VercelResponse) {
  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ error: 'Method not allowed' });
}

export function badRequest(res: VercelResponse, message = 'Invalid request body') {
  return res.status(400).json({ error: message });
}

export function normalizeStringArray(value: unknown, max = 5000): string[] | null {
  if (!Array.isArray(value) || value.length > max) return null;
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || item.length === 0 || item.length > 128) return null;
    result.push(item);
  }
  return result;
}

function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function normalizeLearned(value: unknown, now = Date.now()): SyncedLearnedEntry[] | null {
  const legacyIds = normalizeStringArray(value);
  if (legacyIds) {
    return legacyIds.map((id) => ({ id, learnedAt: null, updatedAt: now }));
  }

  if (!Array.isArray(value) || value.length > 5000) return null;
  const result: SyncedLearnedEntry[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const entry = item as Partial<SyncedLearnedEntry>;
    if (typeof entry.id !== 'string' || entry.id.length === 0 || entry.id.length > 128) return null;
    if (entry.learnedAt !== null && entry.learnedAt !== undefined && !isTimestamp(entry.learnedAt)) return null;
    if (!isTimestamp(entry.updatedAt)) return null;
    if (entry.deletedAt !== undefined && !isTimestamp(entry.deletedAt)) return null;

    result.push({
      id: entry.id,
      learnedAt: entry.learnedAt ?? null,
      updatedAt: entry.updatedAt,
      ...(entry.deletedAt !== undefined ? { deletedAt: entry.deletedAt } : {}),
    });
  }

  return result;
}

export function normalizeRecents(value: unknown): SyncedRecents | null {
  if (Array.isArray(value)) {
    const entries = normalizeRecentEntries(value);
    return entries ? { entries, clearedAt: 0 } : null;
  }

  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<SyncedRecents>;
  const entries = normalizeRecentEntries(candidate.entries);
  if (!entries) return null;
  if (candidate.clearedAt !== undefined && !isTimestamp(candidate.clearedAt)) return null;
  return { entries, clearedAt: candidate.clearedAt ?? 0 };
}

function normalizeRecentEntries(value: unknown): RecentEntry[] | null {
  if (!Array.isArray(value) || value.length > 100) return null;

  const result: RecentEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const entry = item as Partial<RecentEntry>;
    if (typeof entry.id !== 'string' || entry.id.length === 0 || entry.id.length > 128) return null;
    if (!isTimestamp(entry.visitedAt)) return null;
    result.push({ id: entry.id, visitedAt: entry.visitedAt });
  }

  return result;
}

export function normalizePreferences(value: unknown): SyncedPreferences | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const prefs = value as Partial<SyncedPreferences>;

  const bool = (v: unknown): v is boolean => typeof v === 'boolean';
  const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): v is T =>
    typeof v === 'string' && (allowed as readonly string[]).includes(v);

  if (prefs.showAudioPlayer !== undefined && !bool(prefs.showAudioPlayer)) return null;
  if (prefs.showPinyin !== undefined && !bool(prefs.showPinyin)) return null;
  if (prefs.showEnglish !== undefined && !bool(prefs.showEnglish)) return null;
  if (prefs.script !== undefined && !oneOf(prefs.script, ['simplified', 'traditional'] as const)) return null;
  if (prefs.theme !== undefined && !oneOf(prefs.theme, ['light', 'dark', 'auto'] as const)) return null;
  if (prefs.audioPosition !== undefined && !oneOf(prefs.audioPosition, ['top', 'bottom'] as const)) return null;
  if (prefs.fontScale !== undefined && !(typeof prefs.fontScale === 'number' && Number.isFinite(prefs.fontScale))) return null;

  // Clamp the font scale into range rather than rejecting an out-of-bounds value,
  // so an unexpectedly large/small client value can't drop the whole payload.
  const clampedFontScale = prefs.fontScale !== undefined
    ? Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, prefs.fontScale as number))
    : undefined;

  return {
    ...(prefs.showAudioPlayer !== undefined ? { showAudioPlayer: prefs.showAudioPlayer } : {}),
    ...(prefs.showPinyin !== undefined ? { showPinyin: prefs.showPinyin } : {}),
    ...(prefs.showEnglish !== undefined ? { showEnglish: prefs.showEnglish } : {}),
    ...(prefs.script !== undefined ? { script: prefs.script } : {}),
    ...(prefs.theme !== undefined ? { theme: prefs.theme } : {}),
    ...(prefs.audioPosition !== undefined ? { audioPosition: prefs.audioPosition } : {}),
    ...(clampedFontScale !== undefined ? { fontScale: clampedFontScale } : {}),
  };
}
