import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { getItem, setItem } from '../lib/storage';
import { fetchRemoteLearnedEntries, pushRemoteLearned, type SyncedLearnedEntry } from '../lib/sync';
import { LearnedContext } from './learnedContextValue';

const KEY = 'reader:learned';
const TIMESTAMPS_KEY = 'reader:learnedTimestamps';
const SYNC_KEY = 'reader:learnedSync';

interface LearnedState {
  learnedSet: Set<string>;
  learnedAtById: Record<string, number | null>;
  syncById: Record<string, SyncedLearnedEntry>;
}

function readLearnedIds(): string[] {
  const raw = getItem<unknown>(KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === 'string');
}

function readLearnedTimestamps(): Record<string, number | null> {
  const raw = getItem<unknown>(TIMESTAMPS_KEY, {});
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

  const entries = Object.entries(raw as Record<string, unknown>);
  return Object.fromEntries(
    entries.filter(([, value]) => typeof value === 'number' || value === null),
  ) as Record<string, number | null>;
}

function createState(ids = readLearnedIds()): LearnedState {
  const storedTimestamps = readLearnedTimestamps();
  const storedSync = readLearnedSync();
  const learnedAtById: Record<string, number | null> = {};
  const syncById: Record<string, SyncedLearnedEntry> = {};

  for (const id of ids) {
    learnedAtById[id] = storedTimestamps[id] ?? null;
    syncById[id] = storedSync[id] ?? {
      id,
      learnedAt: learnedAtById[id],
      updatedAt: learnedAtById[id] ?? 0,
    };
  }

  for (const [id, entry] of Object.entries(storedSync)) {
    if (ids.includes(id)) continue;
    if (entry.deletedAt != null) syncById[id] = entry;
  }

  return {
    learnedSet: new Set(ids),
    learnedAtById,
    syncById,
  };
}

function readLearnedSync(): Record<string, SyncedLearnedEntry> {
  const raw = getItem<unknown>(SYNC_KEY, {});
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

  const result: Record<string, SyncedLearnedEntry> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const entry = value as Partial<SyncedLearnedEntry>;
    if (entry.id !== id) continue;
    if (entry.learnedAt !== null && entry.learnedAt !== undefined && typeof entry.learnedAt !== 'number') continue;
    if (typeof entry.updatedAt !== 'number') continue;
    if (entry.deletedAt !== undefined && typeof entry.deletedAt !== 'number') continue;
    result[id] = {
      id,
      learnedAt: entry.learnedAt ?? null,
      updatedAt: entry.updatedAt,
      ...(entry.deletedAt !== undefined ? { deletedAt: entry.deletedAt } : {}),
    };
  }

  return result;
}

function persistState(state: LearnedState): void {
  const ids = [...state.learnedSet];
  const learnedAtById: Record<string, number | null> = {};

  for (const id of ids) {
    learnedAtById[id] = state.learnedAtById[id] ?? null;
  }

  setItem(KEY, ids);
  setItem(TIMESTAMPS_KEY, learnedAtById);
  setItem(SYNC_KEY, state.syncById);
}

function syncPayload(state: LearnedState): SyncedLearnedEntry[] {
  return Object.values(state.syncById);
}

function mergeRemoteLearned(prev: LearnedState, remote: SyncedLearnedEntry[]): { state: LearnedState; changed: boolean; shouldPush: boolean } {
  const nextSet = new Set(prev.learnedSet);
  const nextTimestamps = { ...prev.learnedAtById };
  const nextSync = { ...prev.syncById };
  const remoteById = new Map(remote.map((entry) => [entry.id, entry]));
  let changed = false;
  let shouldPush = false;

  for (const remoteEntry of remote) {
    const localEntry = nextSync[remoteEntry.id];
    if (localEntry && localEntry.updatedAt > remoteEntry.updatedAt) {
      shouldPush = true;
      continue;
    }

    if (localEntry && localEntry.updatedAt === remoteEntry.updatedAt) continue;

    nextSync[remoteEntry.id] = remoteEntry;
    changed = true;

    if (remoteEntry.deletedAt != null) {
      nextSet.delete(remoteEntry.id);
      delete nextTimestamps[remoteEntry.id];
    } else {
      nextSet.add(remoteEntry.id);
      nextTimestamps[remoteEntry.id] = remoteEntry.learnedAt;
    }
  }

  for (const id of nextSet) {
    if (!nextSync[id]) {
      const learnedAt = nextTimestamps[id] ?? null;
      nextSync[id] = { id, learnedAt, updatedAt: learnedAt ?? 0 };
      shouldPush = true;
    }
  }

  for (const localEntry of Object.values(nextSync)) {
    const remoteEntry = remoteById.get(localEntry.id);
    if (!remoteEntry || localEntry.updatedAt > remoteEntry.updatedAt) {
      shouldPush = true;
      break;
    }
  }

  return {
    state: {
      learnedSet: nextSet,
      learnedAtById: nextTimestamps,
      syncById: nextSync,
    },
    changed,
    shouldPush,
  };
}

export function LearnedProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LearnedState>(() => createState());
  const { learnedSet } = state;

  const isLearned = useCallback((id: string) => learnedSet.has(id), [learnedSet]);

  const toggleLearned = useCallback((id: string) => {
    setState((prev) => {
      const now = Date.now();
      const nextSet = new Set(prev.learnedSet);
      const nextTimestamps = { ...prev.learnedAtById };
      const nextSync = { ...prev.syncById };

      if (nextSet.has(id)) {
        nextSet.delete(id);
        delete nextTimestamps[id];
        nextSync[id] = { id, learnedAt: null, updatedAt: now, deletedAt: now };
      } else {
        nextSet.add(id);
        nextTimestamps[id] = now;
        nextSync[id] = { id, learnedAt: now, updatedAt: now };
      }

      const nextState = {
        learnedSet: nextSet,
        learnedAtById: nextTimestamps,
        syncById: nextSync,
      };

      persistState(nextState);
      pushRemoteLearned(syncPayload(nextState)).catch(() => {});

      return nextState;
    });
  }, []);

  useEffect(() => {
    fetchRemoteLearnedEntries()
      .then((remote) => {
        setState((prev) => {
          const { state: nextState, changed, shouldPush } = mergeRemoteLearned(prev, remote);
          if (!changed && !shouldPush) return prev;

          persistState(nextState);
          if (shouldPush) pushRemoteLearned(syncPayload(nextState)).catch(() => {});
          return nextState;
        });
      })
      .catch(() => {});
  }, []);

  return (
    <LearnedContext.Provider value={{ learnedSet, isLearned, toggleLearned }}>
      {children}
    </LearnedContext.Provider>
  );
}
