import { useEffect, useRef, useState } from 'react';
import type { Lesson } from '../types/reader';
import { useData } from '../context/useData';

export function useLesson(id: string | undefined) {
  const { adapter } = useData();
  const cache = useRef<Map<string, Lesson>>(new Map());
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const cached = cache.current.get(id);
    if (cached) {
      setLesson(cached);
      return;
    }

    setLoading(true);
    setError(null);

    adapter
      .loadLesson(id)
      .then((result) => {
        if (result) cache.current.set(id, result);
        setLesson(result);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, adapter]);

  return { lesson, loading, error };
}
