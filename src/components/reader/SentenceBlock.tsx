import type { Sentence } from '../../types/reader';

interface SentenceBlockProps {
  sentence: Sentence;
  script: 'simplified' | 'traditional';
  showPinyin: boolean;
  showEnglish: boolean;
  onSeek?: (time: number) => void;
  onPause?: () => void;
  isActive?: boolean;
}

export default function SentenceBlock({ sentence, script, showPinyin, showEnglish, onSeek, onPause, isActive }: SentenceBlockProps) {
  const chinese = script === 'simplified' ? sentence.simplified : sentence.traditional;

  return (
    <div className="py-3 space-y-1">
      {showPinyin && sentence.pinyin && (
        <div className="text-sm text-gray-400 dark:text-gray-500">{sentence.pinyin}</div>
      )}
      <div className="flex items-center gap-2">
        <div className="text-xl leading-relaxed text-gray-900 dark:text-gray-100">{chinese}</div>
        {onSeek && sentence.audioTime != null && (
          <button
            onClick={() => isActive && onPause ? onPause() : onSeek!(sentence.audioTime!)}
            className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors cursor-pointer text-xs flex-shrink-0 ${
              isActive
                ? 'text-red-600 bg-red-50 dark:bg-red-950 animate-pulse'
                : 'text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
            }`}
            title={isActive ? 'Playing' : 'Play from here'}
          >
            {isActive ? (
              <svg width="10" height="10" viewBox="0 0 14 14" fill="currentColor">
                <rect x="1" y="0" width="4" height="14" rx="1" />
                <rect x="9" y="0" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 14 14" fill="currentColor">
                <polygon points="2,0 14,7 2,14" />
              </svg>
            )}
          </button>
        )}
      </div>
      {showEnglish && sentence.english && (
        <div className="text-sm text-gray-500 dark:text-gray-400">{sentence.english}</div>
      )}
    </div>
  );
}
