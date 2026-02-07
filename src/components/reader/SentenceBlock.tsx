import type { Sentence } from '../../types/reader';

interface SentenceBlockProps {
  sentence: Sentence;
  script: 'simplified' | 'traditional';
  showPinyin: boolean;
  showEnglish: boolean;
  onSeek?: (time: number) => void;
}

export default function SentenceBlock({ sentence, script, showPinyin, showEnglish, onSeek }: SentenceBlockProps) {
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
            onClick={() => onSeek(sentence.audioTime!)}
            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer text-xs flex-shrink-0"
            title="Play from here"
          >
            ▶
          </button>
        )}
      </div>
      {showEnglish && sentence.english && (
        <div className="text-sm text-gray-500 dark:text-gray-400">{sentence.english}</div>
      )}
    </div>
  );
}
