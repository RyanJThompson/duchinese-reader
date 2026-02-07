import { useMemo } from 'react';
import type { ContentType, Level, LessonSummary } from '../types/reader';
import type { SeriesMap } from '../context/DataContext';
import { levelIndex } from '../lib/levels';

interface UseLessonsOptions {
  lessons: LessonSummary[];
  search: string;
  levels: Set<Level>;
  hideLearned: boolean;
  learnedSet: Set<string>;
  contentType: ContentType | null;
  collapseSeries: boolean;
  seriesMap: SeriesMap;
}

export function useLessons({
  lessons,
  search,
  levels,
  hideLearned,
  learnedSet,
  contentType,
  collapseSeries,
  seriesMap,
}: UseLessonsOptions) {
  return useMemo(() => {
    const query = search.toLowerCase().trim();
    const seenSeries = new Set<string>();

    return lessons
      .filter((l) => {
        // Level filter: for series lessons, match if any course level matches
        if (levels.size > 0) {
          if (l.courseInfo) {
            if (!l.courseInfo.levels.some((cl) => levels.has(cl))) return false;
          } else {
            if (!levels.has(l.level)) return false;
          }
        }

        // Hide learned: for series, hide only if ALL chapters are learned
        if (hideLearned) {
          if (collapseSeries && l.series) {
            const chapterIds = seriesMap.get(l.series.title);
            if (chapterIds && chapterIds.every((id) => learnedSet.has(id))) return false;
          } else {
            if (learnedSet.has(l.id)) return false;
          }
        }

        // Content type filter
        if (contentType) {
          if (contentType === 'standalone') {
            if (l.series) return false;
          } else {
            if (l.contentType !== contentType) return false;
          }
        }

        // Search: match lesson title/synopsis AND course title/description for series
        if (query) {
          let haystack = `${l.title} ${l.synopsis}`.toLowerCase();
          if (l.courseInfo) {
            haystack += ` ${l.courseInfo.title} ${l.courseInfo.description}`.toLowerCase();
          }
          if (!haystack.includes(query)) return false;
        }

        // Collapse series: only keep first occurrence per series
        if (collapseSeries && l.series) {
          if (seenSeries.has(l.series.title)) return false;
          seenSeries.add(l.series.title);
        }

        return true;
      })
      .sort((a, b) => {
        const ld = levelIndex(a.level) - levelIndex(b.level);
        if (ld !== 0) return ld;
        return b.date.localeCompare(a.date);
      });
  }, [lessons, search, levels, hideLearned, learnedSet, contentType, collapseSeries, seriesMap]);
}
