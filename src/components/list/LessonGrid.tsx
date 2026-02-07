import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { LessonSummary } from '../../types/reader';
import type { CourseMap } from '../../context/DataContext';
import LessonCard from './LessonCard';
import SeriesCard from './SeriesCard';

const PAGE_SIZE = 60;

interface LessonGridProps {
  lessons: LessonSummary[];
  isLearned: (id: string) => boolean;
  courseMap?: CourseMap;
}

export default function LessonGrid({ lessons, isLearned, courseMap }: LessonGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    setVisibleCount((c) => c + PAGE_SIZE);
  }, []);

  // Reset visible count when the lesson list changes (e.g. filter change)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [lessons]);

  const visible = useMemo(() => lessons.slice(0, visibleCount), [lessons, visibleCount]);
  const hasMore = visibleCount < lessons.length;

  // Auto-load more when the sentinel element is near the viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '400px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visible.map((lesson) => {
          const course = lesson.series && courseMap?.get(lesson.series.title);
          if (course) {
            return <SeriesCard key={`series-${lesson.series!.title}`} courseInfo={course} />;
          }
          return <LessonCard key={lesson.id} lesson={lesson} learned={isLearned(lesson.id)} />;
        })}
      </div>
      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </div>
  );
}
