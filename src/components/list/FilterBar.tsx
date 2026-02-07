import type { ContentType, Level } from '../../types/reader';
import { LEVEL_ORDER, LEVEL_LABELS, LEVEL_COLORS } from '../../lib/levels';

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  course: 'Courses',
  article_collection: 'Article Collections',
  short_story: 'Short Stories',
  standalone: 'Standalone',
};

const CONTENT_TYPE_ORDER: ContentType[] = [
  'course',
  'article_collection',
  'short_story',
  'standalone',
];

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedLevels: Set<Level>;
  onToggleLevel: (level: Level) => void;
  hideLearned: boolean;
  onToggleHideLearned: () => void;
  contentType: ContentType | null;
  onContentTypeChange: (value: ContentType | null) => void;
  seriesTitle: string | null;
  onSeriesTitleChange: (value: string | null) => void;
  seriesTitles: string[];
  resultCount: number;
}

export default function FilterBar({
  search,
  onSearchChange,
  selectedLevels,
  onToggleLevel,
  hideLearned,
  onToggleHideLearned,
  contentType,
  onContentTypeChange,
  seriesTitle,
  onSeriesTitleChange,
  seriesTitles,
  resultCount,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Search lessons..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />

        <select
          value={contentType ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onContentTypeChange(val ? (val as ContentType) : null);
            if (!val || val === 'standalone') onSeriesTitleChange(null);
          }}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">All types</option>
          {CONTENT_TYPE_ORDER.map((ct) => (
            <option key={ct} value={ct}>
              {CONTENT_TYPE_LABELS[ct]}
            </option>
          ))}
        </select>

        <select
          value={seriesTitle ?? ''}
          onChange={(e) => onSeriesTitleChange(e.target.value || null)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white max-w-56 truncate focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">All series</option>
          {seriesTitles.map((title) => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hideLearned}
            onChange={onToggleHideLearned}
            className="rounded accent-red-600"
          />
          Hide learned
        </label>
        <span className="text-sm text-gray-400 ml-auto">{resultCount} lessons</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {LEVEL_ORDER.map((level) => {
          const active = selectedLevels.has(level);
          return (
            <button
              key={level}
              onClick={() => onToggleLevel(level)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                active
                  ? LEVEL_COLORS[level]
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {LEVEL_LABELS[level]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
