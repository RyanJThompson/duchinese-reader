import { createContext } from 'react';
import type { DataAdapter } from '../adapters/types';
import type { CourseInfo, LessonSummary } from '../types/reader';

/** Map from series title -> lesson IDs ordered by chapter */
export type SeriesMap = Map<string, string[]>;

/** Map from series title -> CourseInfo (deduplicated) */
export type CourseMap = Map<string, CourseInfo>;

export interface DataContextValue {
  adapter: DataAdapter;
  lessons: LessonSummary[];
  seriesMap: SeriesMap;
  courseMap: CourseMap;
  loading: boolean;
  error: string | null;
}

export const DataContext = createContext<DataContextValue | null>(null);
