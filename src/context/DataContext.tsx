import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DataAdapter } from '../adapters/types';
import type { CourseInfo, LessonSummary } from '../types/reader';

/** Map from series title → lesson IDs ordered by chapter */
export type SeriesMap = Map<string, string[]>;

/** Map from series title → CourseInfo (deduplicated) */
export type CourseMap = Map<string, CourseInfo>;

interface DataContextValue {
  adapter: DataAdapter;
  lessons: LessonSummary[];
  seriesMap: SeriesMap;
  courseMap: CourseMap;
  loading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextValue | null>(null);

function buildSeriesMap(lessons: LessonSummary[]): SeriesMap {
  const map = new Map<string, { id: string; chapter: number }[]>();
  for (const l of lessons) {
    if (!l.series) continue;
    const key = l.series.title;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push({ id: l.id, chapter: l.series.chapter });
  }
  const result: SeriesMap = new Map();
  for (const [key, entries] of map) {
    entries.sort((a, b) => a.chapter - b.chapter);
    result.set(key, entries.map((e) => e.id));
  }
  return result;
}

function buildCourseMap(lessons: LessonSummary[]): CourseMap {
  const map: CourseMap = new Map();
  for (const l of lessons) {
    if (l.courseInfo && !map.has(l.courseInfo.title)) {
      map.set(l.courseInfo.title, l.courseInfo);
    }
  }
  return map;
}

export function DataProvider({ adapter, children }: { adapter: DataAdapter; children: ReactNode }) {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adapter
      .loadIndex()
      .then(setLessons)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [adapter]);

  const seriesMap = useMemo(() => buildSeriesMap(lessons), [lessons]);
  const courseMap = useMemo(() => buildCourseMap(lessons), [lessons]);

  return (
    <DataContext.Provider value={{ adapter, lessons, seriesMap, courseMap, loading, error }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
