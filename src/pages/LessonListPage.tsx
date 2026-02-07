import { useCallback, useState } from 'react';
import type { ContentType, Level } from '../types/reader';
import { useData } from '../context/useData';
import { useLearned } from '../context/useLearned';
import { useLessons } from '../hooks/useLessons';
import FilterBar from '../components/list/FilterBar';
import LessonGrid from '../components/list/LessonGrid';

export default function LessonListPage() {
  const { lessons, seriesMap, courseMap, loading, error } = useData();
  const { learnedSet, isLearned } = useLearned();

  const [search, setSearch] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<Set<Level>>(new Set());
  const [hideLearned, setHideLearned] = useState(false);
  const [contentType, setContentType] = useState<ContentType | null>(null);

  const toggleLevel = useCallback((level: Level) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }, []);

  const filtered = useLessons({
    lessons,
    search,
    levels: selectedLevels,
    hideLearned,
    learnedSet,
    contentType,
    collapseSeries: true,
    seriesMap,
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center text-gray-400 dark:text-gray-500">Loading lessons...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        selectedLevels={selectedLevels}
        onToggleLevel={toggleLevel}
        hideLearned={hideLearned}
        onToggleHideLearned={() => setHideLearned((h) => !h)}
        contentType={contentType}
        onContentTypeChange={setContentType}
        resultCount={filtered.length}
      />
      <LessonGrid lessons={filtered} isLearned={isLearned} courseMap={courseMap} />
    </div>
  );
}
