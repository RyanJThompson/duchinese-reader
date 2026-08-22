const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * PUT JSON with status checking + retry. Previously pushes were fire-and-forget
 * and ignored res.ok, so a 5xx / network drop / validation 400 looked identical
 * to success and silently lost the write. Now: retry transient failures (network
 * / 5xx) with backoff, fail fast on 4xx (a malformed payload won't fix itself),
 * and throw on exhaustion so callers can react (mark dirty / retry on next mount).
 */
async function putJSON(url: string, body: unknown): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      lastError = err;
      if (attempt < 2) await sleep(500 * (attempt + 1));
      continue;
    }
    if (res.ok) return;
    if (res.status >= 400 && res.status < 500) {
      throw new Error(`PUT ${url} rejected with ${res.status}`);
    }
    lastError = new Error(`PUT ${url} failed with ${res.status}`);
    if (attempt < 2) await sleep(500 * (attempt + 1));
  }
  throw lastError instanceof Error ? lastError : new Error(`PUT ${url} failed`);
}

export interface SyncedLearnedEntry {
  id: string;
  learnedAt: number | null;
  updatedAt: number;
  deletedAt?: number;
}

export async function fetchRemoteLearned(): Promise<string[]> {
  const res = await fetch('/api/learned');
  if (!res.ok) return [];
  const raw = await res.json();
  if (Array.isArray(raw) && raw.every((id) => typeof id === 'string')) return raw;
  if (Array.isArray(raw)) {
    return raw
      .filter((entry): entry is SyncedLearnedEntry => isSyncedLearnedEntry(entry))
      .filter((entry) => entry.deletedAt == null)
      .map((entry) => entry.id);
  }
  return [];
}

export async function fetchRemoteLearnedEntries(): Promise<SyncedLearnedEntry[]> {
  const res = await fetch('/api/learned');
  if (!res.ok) return [];
  const raw = await res.json();
  if (Array.isArray(raw) && raw.every((id) => typeof id === 'string')) {
    const now = Date.now();
    return raw.map((id) => ({ id, learnedAt: null, updatedAt: now }));
  }
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry): entry is SyncedLearnedEntry => isSyncedLearnedEntry(entry));
}

export async function pushRemoteLearned(ids: string[] | SyncedLearnedEntry[]): Promise<void> {
  await putJSON('/api/learned', ids);
}

export interface RecentEntry {
  id: string;
  visitedAt: number;
}

export interface SyncedRecents {
  entries: RecentEntry[];
  clearedAt: number;
}

export async function fetchRemoteRecents(): Promise<SyncedRecents> {
  const res = await fetch('/api/recents');
  if (!res.ok) return { entries: [], clearedAt: 0 };
  const raw = await res.json();
  if (Array.isArray(raw)) return { entries: raw.filter(isRecentEntry), clearedAt: 0 };
  if (!raw || typeof raw !== 'object') return { entries: [], clearedAt: 0 };
  const candidate = raw as Partial<SyncedRecents>;
  return {
    entries: Array.isArray(candidate.entries) ? candidate.entries.filter(isRecentEntry) : [],
    clearedAt: typeof candidate.clearedAt === 'number' ? candidate.clearedAt : 0,
  };
}

export async function pushRemoteRecents(entries: RecentEntry[] | SyncedRecents): Promise<void> {
  await putJSON('/api/recents', entries);
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

export async function fetchRemotePreferences(): Promise<SyncedPreferences> {
  const res = await fetch('/api/preferences');
  if (!res.ok) return {};
  const raw = await res.json();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const prefs = raw as Partial<SyncedPreferences>;
  const result: SyncedPreferences = {};
  if (typeof prefs.showAudioPlayer === 'boolean') result.showAudioPlayer = prefs.showAudioPlayer;
  if (typeof prefs.showPinyin === 'boolean') result.showPinyin = prefs.showPinyin;
  if (typeof prefs.showEnglish === 'boolean') result.showEnglish = prefs.showEnglish;
  if (prefs.script === 'simplified' || prefs.script === 'traditional') result.script = prefs.script;
  if (prefs.theme === 'light' || prefs.theme === 'dark' || prefs.theme === 'auto') result.theme = prefs.theme;
  if (prefs.audioPosition === 'top' || prefs.audioPosition === 'bottom') result.audioPosition = prefs.audioPosition;
  if (typeof prefs.fontScale === 'number' && Number.isFinite(prefs.fontScale)) result.fontScale = prefs.fontScale;
  return result;
}

export async function pushRemotePreferences(prefs: SyncedPreferences): Promise<void> {
  await putJSON('/api/preferences', prefs);
}

function isSyncedLearnedEntry(value: unknown): value is SyncedLearnedEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<SyncedLearnedEntry>;
  return typeof entry.id === 'string'
    && (entry.learnedAt == null || typeof entry.learnedAt === 'number')
    && typeof entry.updatedAt === 'number'
    && (entry.deletedAt == null || typeof entry.deletedAt === 'number');
}

function isRecentEntry(value: unknown): value is RecentEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<RecentEntry>;
  return typeof entry.id === 'string' && typeof entry.visitedAt === 'number';
}
