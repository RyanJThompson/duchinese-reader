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
  await fetch('/api/learned', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids),
  });
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
  await fetch('/api/recents', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entries),
  });
}

export interface SyncedPreferences {
  showAudioPlayer?: boolean;
}

export async function fetchRemotePreferences(): Promise<SyncedPreferences> {
  const res = await fetch('/api/preferences');
  if (!res.ok) return {};
  const raw = await res.json();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const prefs = raw as Partial<SyncedPreferences>;
  return {
    ...(typeof prefs.showAudioPlayer === 'boolean' ? { showAudioPlayer: prefs.showAudioPlayer } : {}),
  };
}

export async function pushRemotePreferences(prefs: SyncedPreferences): Promise<void> {
  await fetch('/api/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  });
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
