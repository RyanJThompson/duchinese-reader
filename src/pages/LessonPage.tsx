import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useLesson } from '../hooks/useLesson';
import { useAudio } from '../hooks/useAudio';
import { useLearned } from '../context/LearnedContext';
import { useData } from '../context/DataContext';
import { LEVEL_LABELS, LEVEL_COLORS } from '../lib/levels';
import ReaderToolbar from '../components/reader/ReaderToolbar';
import ReaderView from '../components/reader/ReaderView';
import VocabularyPanel from '../components/reader/VocabularyPanel';
import AudioPlayer from '../components/reader/AudioPlayer';

function useChapterNav(seriesTitle?: string, lessonId?: string) {
  const { seriesMap } = useData();
  if (!seriesTitle || !lessonId) return { prev: null, next: null, position: 0, total: 0 };
  const ids = seriesMap.get(seriesTitle);
  if (!ids) return { prev: null, next: null, position: 0, total: 0 };
  const idx = ids.indexOf(lessonId);
  if (idx === -1) return { prev: null, next: null, position: 0, total: ids.length };
  return {
    prev: idx > 0 ? ids[idx - 1] : null,
    next: idx < ids.length - 1 ? ids[idx + 1] : null,
    position: idx + 1,
    total: ids.length,
  };
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lesson, loading, error } = useLesson(id);
  const { isLearned, toggleLearned } = useLearned();
  const chapterNav = useChapterNav(lesson?.series?.title, lesson?.id);
  const audio = useAudio(lesson?.audioUrl);
  const [playerCollapsed, setPlayerCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center text-gray-400">Loading lesson...</div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center text-red-500">
          {error || 'Lesson not found'}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`max-w-3xl mx-auto px-4 py-6 space-y-6 ${lesson.audioUrl ? 'pb-24' : ''}`}>
        <ReaderToolbar
          learned={isLearned(lesson.id)}
          onToggleLearned={() => toggleLearned(lesson.id)}
          onBack={() => navigate('/')}
        />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${LEVEL_COLORS[lesson.level]}`}>
              {LEVEL_LABELS[lesson.level]}
            </span>
            <span className="text-xs text-gray-400">{lesson.date}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{lesson.synopsis}</p>
        </div>

        {lesson.series && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700">{lesson.series.title}</div>
              <div className="text-xs text-gray-400">
                Chapter {chapterNav.position} of {chapterNav.total}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {chapterNav.prev ? (
                <Link
                  to={`/lesson/${chapterNav.prev}`}
                  className="px-3 py-1 rounded text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 no-underline"
                >
                  &larr; Previous
                </Link>
              ) : (
                <span className="px-3 py-1 rounded text-xs font-medium text-gray-300 border border-gray-100">
                  &larr; Previous
                </span>
              )}
              <div className="flex-1" />
              {chapterNav.next ? (
                <Link
                  to={`/lesson/${chapterNav.next}`}
                  className="px-3 py-1 rounded text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 no-underline"
                >
                  Next &rarr;
                </Link>
              ) : (
                <span className="px-3 py-1 rounded text-xs font-medium text-gray-300 border border-gray-100">
                  Next &rarr;
                </span>
              )}
            </div>
          </div>
        )}

        <ReaderView sentences={lesson.sentences} audio={lesson.audioUrl ? audio : undefined} />

        <VocabularyPanel vocabulary={lesson.vocabulary} />

        {lesson.series && (chapterNav.prev || chapterNav.next) && (
          <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
            {chapterNav.prev ? (
              <Link
                to={`/lesson/${chapterNav.prev}`}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 no-underline"
              >
                &larr; Previous Chapter
              </Link>
            ) : <div />}
            <div className="flex-1" />
            {chapterNav.next && (
              <Link
                to={`/lesson/${chapterNav.next}`}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 no-underline"
              >
                Next Chapter &rarr;
              </Link>
            )}
          </div>
        )}
      </div>

      {lesson.audioUrl && (
        <div className="fixed bottom-0 left-0 right-0 z-20">
          <div className="max-w-3xl mx-auto px-4">
            <button
              onClick={() => setPlayerCollapsed((c) => !c)}
              className="px-3 py-1 text-xs font-medium bg-gray-200 hover:bg-gray-300 rounded-t-lg cursor-pointer border border-b-0 border-gray-300"
            >
              {playerCollapsed ? 'Show Player' : 'Hide Player'}
            </button>
          </div>
          {!playerCollapsed && (
            <div className="bg-white border-t border-gray-200 shadow-lg">
              <div className="max-w-3xl mx-auto px-4 py-2">
                <AudioPlayer audio={audio} />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
