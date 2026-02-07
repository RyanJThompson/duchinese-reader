import { Link } from 'react-router';
import type { CourseInfo } from '../../types/reader';
import { LEVEL_LABELS, LEVEL_COLORS } from '../../lib/levels';

interface SeriesCardProps {
  courseInfo: CourseInfo;
}

export default function SeriesCard({ courseInfo }: SeriesCardProps) {
  return (
    <Link
      to={`/series/${encodeURIComponent(courseInfo.title)}`}
      className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow no-underline"
    >
      {courseInfo.imageUrl && (
        <div className="aspect-[16/9] overflow-hidden bg-gray-100">
          <img
            src={courseInfo.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          {courseInfo.levels.map((level) => (
            <span
              key={level}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${LEVEL_COLORS[level]}`}
            >
              {LEVEL_LABELS[level]}
            </span>
          ))}
          <span className="text-[11px] text-gray-400 ml-auto">
            {courseInfo.lessonCount} chapters
          </span>
        </div>
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
          {courseInfo.title}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2">{courseInfo.description}</p>
      </div>
    </Link>
  );
}
