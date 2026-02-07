import { useState, useMemo } from 'react';
import type { LessonSummary } from '../../types/reader';
import LessonCard from './LessonCard';

const PAGE_SIZE = 60;

interface LessonGridProps {
  lessons: LessonSummary[];
  isLearned: (id: string) => boolean;
}

export default function LessonGrid({ lessons, isLearned }: LessonGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visible = useMemo(() => lessons.slice(0, visibleCount), [lessons, visibleCount]);
  const hasMore = visibleCount < lessons.length;

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visible.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} learned={isLearned(lesson.id)} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Load more ({lessons.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
