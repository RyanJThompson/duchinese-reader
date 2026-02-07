import { useMemo } from 'react';
import type { ContentType, Level, LessonSummary } from '../types/reader';
import { levelIndex } from '../lib/levels';

interface UseLessonsOptions {
  lessons: LessonSummary[];
  search: string;
  levels: Set<Level>;
  hideLearned: boolean;
  learnedSet: Set<string>;
  contentType: ContentType | null;
  seriesTitle: string | null;
}

export function useLessons({
  lessons,
  search,
  levels,
  hideLearned,
  learnedSet,
  contentType,
  seriesTitle,
}: UseLessonsOptions) {
  return useMemo(() => {
    const query = search.toLowerCase().trim();
    return lessons
      .filter((l) => {
        if (levels.size > 0 && !levels.has(l.level)) return false;
        if (hideLearned && learnedSet.has(l.id)) return false;
        if (contentType && l.contentType !== contentType) return false;
        if (seriesTitle && l.series?.title !== seriesTitle) return false;
        if (query) {
          const haystack = `${l.title} ${l.synopsis}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // When filtering by series, sort by chapter order
        if (seriesTitle && a.series && b.series) {
          return a.series.chapter - b.series.chapter;
        }
        const ld = levelIndex(a.level) - levelIndex(b.level);
        if (ld !== 0) return ld;
        return b.date.localeCompare(a.date);
      });
  }, [lessons, search, levels, hideLearned, learnedSet, contentType, seriesTitle]);
}
