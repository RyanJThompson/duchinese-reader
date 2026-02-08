import { useMemo } from 'react';
import { Link } from 'react-router';
import { useData } from '../context/useData';
import { useLearned } from '../context/useLearned';
import { useRecents } from '../context/useRecents';
import { LEVEL_LABELS, LEVEL_COLORS } from '../lib/levels';
import type { LessonSummary } from '../types/reader';

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function RecentsPage() {
  const { lessons, loading } = useData();
  const { isLearned } = useLearned();
  const { recents, clearRecents } = useRecents();

  const lessonMap = useMemo(() => {
    const map = new Map<string, LessonSummary>();
    for (const l of lessons) map.set(l.id, l);
    return map;
  }, [lessons]);

  const entries = useMemo(
    () =>
      recents
        .map((r) => ({ ...r, lesson: lessonMap.get(r.id) }))
        .filter((r): r is typeof r & { lesson: LessonSummary } => !!r.lesson),
    [recents, lessonMap],
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center text-gray-400 dark:text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recent Lessons</h1>
        {entries.length > 0 && (
          <button
            onClick={clearRecents}
            className="text-sm text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 cursor-pointer"
          >
            Clear history
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-gray-400 dark:text-gray-500">No recently visited lessons</p>
          <Link
            to="/"
            className="inline-block text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Browse lessons
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(({ id, visitedAt, lesson }) => (
            <Link
              key={id}
              to={`/lesson/${id}`}
              className="block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 no-underline transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[lesson.level]}`}>
                      {LEVEL_LABELS[lesson.level]}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(visitedAt)}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {lesson.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {lesson.synopsis}
                  </div>
                </div>
                {isLearned(id) && (
                  <span className="shrink-0 text-[11px] text-green-600 dark:text-green-400 font-medium">
                    Learned
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
