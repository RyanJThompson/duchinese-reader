import { Link } from 'react-router';
import type { LessonSummary } from '../../types/reader';
import { LEVEL_LABELS, LEVEL_COLORS } from '../../lib/levels';

interface LessonCardProps {
  lesson: LessonSummary;
  learned: boolean;
}

export default function LessonCard({ lesson, learned }: LessonCardProps) {
  return (
    <Link
      to={`/lesson/${lesson.id}`}
      className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow no-underline"
    >
      {lesson.imageUrl && (
        <div className="aspect-[16/9] overflow-hidden bg-gray-100">
          <img
            src={lesson.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${LEVEL_COLORS[lesson.level]}`}>
            {LEVEL_LABELS[lesson.level]}
          </span>
          {learned && (
            <span className="text-[11px] text-green-600 font-medium">Learned</span>
          )}
          {lesson.series && (
            <span className="text-[11px] text-gray-400 truncate ml-auto">{lesson.series.title}</span>
          )}
        </div>
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
          {lesson.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2">{lesson.synopsis}</p>
      </div>
    </Link>
  );
}
