import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { useData } from '../context/DataContext';
import { useLearned } from '../context/LearnedContext';
import { LEVEL_LABELS, LEVEL_COLORS } from '../lib/levels';
import type { LessonSummary } from '../types/reader';

export default function SeriesPage() {
  const { title } = useParams<{ title: string }>();
  const decodedTitle = decodeURIComponent(title ?? '');
  const { lessons, courseMap } = useData();
  const { isLearned } = useLearned();

  const courseInfo = courseMap.get(decodedTitle);

  const chapters = useMemo(() => {
    return lessons
      .filter((l): l is LessonSummary & { series: NonNullable<LessonSummary['series']> } =>
        l.series?.title === decodedTitle
      )
      .sort((a, b) => a.series.chapter - b.series.chapter);
  }, [lessons, decodedTitle]);

  const learnedCount = useMemo(
    () => chapters.filter((c) => isLearned(c.id)).length,
    [chapters, isLearned],
  );

  if (!courseInfo || chapters.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center text-gray-400">Series not found.</div>
        <div className="text-center mt-4">
          <Link to="/" className="text-red-600 hover:text-red-700 text-sm">Back to lessons</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        &larr; Back to lessons
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6">
        {courseInfo.imageUrl && (
          <div className="sm:w-72 flex-shrink-0">
            <img
              src={courseInfo.imageUrl}
              alt=""
              className="w-full rounded-xl object-cover"
            />
          </div>
        )}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">{courseInfo.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {courseInfo.levels.map((level) => (
              <span
                key={level}
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[level]}`}
              >
                {LEVEL_LABELS[level]}
              </span>
            ))}
            <span className="text-sm text-gray-400">
              {chapters.length} chapters
            </span>
          </div>
          <p className="text-sm text-gray-600">{courseInfo.description}</p>
          <div className="text-sm text-gray-500">
            {learnedCount}/{chapters.length} learned
          </div>
        </div>
      </div>

      {/* Chapter list */}
      <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
        {chapters.map((ch, i) => {
          const learned = isLearned(ch.id);
          return (
            <Link
              key={ch.id}
              to={`/lesson/${ch.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors no-underline"
            >
              <span className="text-sm text-gray-400 w-8 text-right flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{ch.title}</div>
                <div className="text-xs text-gray-500 truncate">{ch.synopsis}</div>
              </div>
              {learned && (
                <span className="text-green-500 flex-shrink-0" title="Learned">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
