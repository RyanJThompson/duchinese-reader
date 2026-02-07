import type { VocabWord } from '../../types/reader';
import { usePreferences } from '../../context/PreferencesContext';

interface VocabularyPanelProps {
  vocabulary: VocabWord[];
}

const HSK_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-red-100 text-red-700',
  6: 'bg-purple-100 text-purple-700',
};

export default function VocabularyPanel({ vocabulary }: VocabularyPanelProps) {
  const { script } = usePreferences();

  if (vocabulary.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Vocabulary ({vocabulary.length})
      </h3>
      <div className="space-y-1">
        {vocabulary.map((word, i) => (
          <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-gray-900">
                  {script === 'simplified' ? word.simplified : word.traditional}
                </span>
                <span className="text-sm text-gray-400">{word.pinyin}</span>
                {word.hsk && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${HSK_COLORS[word.hsk] || 'bg-gray-100 text-gray-600'}`}>
                    HSK{word.hsk}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 whitespace-pre-line">{word.meaning}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
