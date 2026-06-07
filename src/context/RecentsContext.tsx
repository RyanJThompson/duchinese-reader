import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { getItem, setItem } from '../lib/storage';
import { fetchRemoteRecents, pushRemoteRecents } from '../lib/sync';
import { RecentsContext, type RecentEntry } from './recentsContextValue';

const KEY = 'reader:recents';
const CLEARED_AT_KEY = 'reader:recentsClearedAt';
const MAX = 20;

function mergeRecents(local: RecentEntry[], remote: RecentEntry[], clearedAt: number): RecentEntry[] {
  const map = new Map<string, number>();
  for (const e of [...remote, ...local]) {
    if (e.visitedAt <= clearedAt) continue;
    const existing = map.get(e.id);
    if (!existing || e.visitedAt > existing) {
      map.set(e.id, e.visitedAt);
    }
  }
  return [...map.entries()]
    .map(([id, visitedAt]) => ({ id, visitedAt }))
    .sort((a, b) => b.visitedAt - a.visitedAt)
    .slice(0, MAX);
}

export function RecentsProvider({ children }: { children: ReactNode }) {
  const [recents, setRecents] = useState<RecentEntry[]>(
    () => getItem<RecentEntry[]>(KEY, []).filter((entry) => entry.visitedAt > getItem(CLEARED_AT_KEY, 0)),
  );
  const [clearedAt, setClearedAt] = useState(() => getItem(CLEARED_AT_KEY, 0));

  const recordVisit = useCallback((id: string) => {
    setRecents((prev) => {
      const next = [{ id, visitedAt: Date.now() }, ...prev.filter((e) => e.id !== id)].slice(0, MAX);
      setItem(KEY, next);
      pushRemoteRecents({ entries: next, clearedAt }).catch(() => {});
      return next;
    });
  }, [clearedAt]);

  const clearRecents = useCallback(() => {
    const nextClearedAt = Date.now();
    setRecents([]);
    setItem(KEY, []);
    setClearedAt(nextClearedAt);
    setItem(CLEARED_AT_KEY, nextClearedAt);
    pushRemoteRecents({ entries: [], clearedAt: nextClearedAt }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchRemoteRecents()
      .then((remote) => {
        setRecents((prev) => {
          const nextClearedAt = Math.max(clearedAt, remote.clearedAt);
          const merged = mergeRecents(prev, remote.entries, nextClearedAt);
          const changed = merged.length !== prev.length ||
            merged.some((e, i) => e.id !== prev[i]?.id || e.visitedAt !== prev[i]?.visitedAt);
          const clearChanged = nextClearedAt !== clearedAt;
          if (changed || clearChanged) {
            setItem(KEY, merged);
            setItem(CLEARED_AT_KEY, nextClearedAt);
            if (clearChanged) setClearedAt(nextClearedAt);
            if (merged.length > remote.entries.length || merged.some((e, i) => e.id !== remote.entries[i]?.id)) {
              pushRemoteRecents({ entries: merged, clearedAt: nextClearedAt }).catch(() => {});
            }
          }
          return changed ? merged : prev;
        });
      })
      .catch(() => {});
  }, [clearedAt]);

  return (
    <RecentsContext.Provider value={{ recents, recordVisit, clearRecents }}>
      {children}
    </RecentsContext.Provider>
  );
}
