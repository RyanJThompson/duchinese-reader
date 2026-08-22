import { useMemo } from 'react';
import { useData } from '../context/useData';
import { useLearned } from '../context/useLearned';

export interface Progress {
  done: number;
  total: number;
}

export interface ProgressResult {
  /** Learned vs total across the whole catalog. */
  overall: Progress;
  /** Learned vs chapter count, keyed by series title. */
  bySeries: Map<string, Progress>;
}

/**
 * Derives completion stats purely from the already-synced learnedSet and the
 * seriesMap — no backend, no new Redis key. A lesson is "done" when its id is
 * in learnedSet (the existing manual learned toggle).
 */
export function useProgress(): ProgressResult {
  const { lessons, seriesMap } = useData();
  const { learnedSet } = useLearned();

  return useMemo(() => {
    let done = 0;
    for (const l of lessons) if (learnedSet.has(l.id)) done++;

    const bySeries = new Map<string, Progress>();
    for (const [title, ids] of seriesMap) {
      const learned = ids.reduce((n, id) => n + (learnedSet.has(id) ? 1 : 0), 0);
      bySeries.set(title, { done: learned, total: ids.length });
    }

    return { overall: { done, total: lessons.length }, bySeries };
  }, [lessons, seriesMap, learnedSet]);
}
