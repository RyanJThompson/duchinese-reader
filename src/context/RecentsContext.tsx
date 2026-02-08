import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { getItem, setItem } from '../lib/storage';
import { fetchRemoteRecents, pushRemoteRecents } from '../lib/sync';
import { RecentsContext, type RecentEntry } from './recentsContextValue';

const KEY = 'reader:recents';
const MAX = 20;

function mergeRecents(local: RecentEntry[], remote: RecentEntry[]): RecentEntry[] {
  const map = new Map<string, number>();
  for (const e of [...remote, ...local]) {
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
    () => getItem<RecentEntry[]>(KEY, []),
  );

  const recordVisit = useCallback((id: string) => {
    setRecents((prev) => {
      const next = [{ id, visitedAt: Date.now() }, ...prev.filter((e) => e.id !== id)].slice(0, MAX);
      setItem(KEY, next);
      pushRemoteRecents(next).catch(() => {});
      return next;
    });
  }, []);

  const clearRecents = useCallback(() => {
    setRecents([]);
    setItem(KEY, []);
    pushRemoteRecents([]).catch(() => {});
  }, []);

  useEffect(() => {
    fetchRemoteRecents()
      .then((remote) => {
        setRecents((prev) => {
          const merged = mergeRecents(prev, remote);
          const changed = merged.length !== prev.length ||
            merged.some((e, i) => e.id !== prev[i]?.id || e.visitedAt !== prev[i]?.visitedAt);
          if (changed) {
            setItem(KEY, merged);
            if (merged.length > remote.length || merged.some((e, i) => e.id !== remote[i]?.id)) {
              pushRemoteRecents(merged).catch(() => {});
            }
          }
          return changed ? merged : prev;
        });
      })
      .catch(() => {});
  }, []);

  return (
    <RecentsContext.Provider value={{ recents, recordVisit, clearRecents }}>
      {children}
    </RecentsContext.Provider>
  );
}
