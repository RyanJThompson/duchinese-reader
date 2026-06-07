import { useMemo } from 'react';
import { Link } from 'react-router';
import { useData } from '../../context/useData';
import { useRecents } from '../../context/useRecents';
import { LEVEL_LABELS, LEVEL_COLORS } from '../../lib/levels';

/**
 * "Jump back in" card showing the most recently read lesson, so the user can
 * continue where they left off without re-finding it. Renders nothing until a
 * recent lesson exists and resolves against the loaded lesson data.
 */
export default function ContinueReading() {
  const { recents } = useRecents();
  const { lessons } = useData();

  const lesson = useMemo(() => {
    const id = recents[0]?.id;
    if (!id) return null;
    return lessons.find((l) => l.id === id) ?? null;
  }, [recents, lessons]);

  if (!lesson) return null;

  return (
    <Link
      to={`/lesson/${lesson.id}`}
      className="group block rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/20 px-4 py-3.5 no-underline transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 mb-1">
            Continue reading
          </div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[lesson.level]}`}>
              {LEVEL_LABELS[lesson.level]}
            </span>
            <span className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {lesson.title}
            </span>
          </div>
          {lesson.synopsis && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{lesson.synopsis}</div>
          )}
        </div>
        <span className="shrink-0 text-sm font-medium text-red-600 dark:text-red-400 group-hover:translate-x-0.5 transition-transform">
          Continue →
        </span>
      </div>
    </Link>
  );
}
