import { useState } from 'react';
import type { VocabWord } from '../../types/reader';
import { usePreferences } from '../../context/PreferencesContext';

interface VocabularyPanelProps {
  vocabulary: VocabWord[];
}

const HSK_COLORS: Record<number, string> = {
  1: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
  2: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  3: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
  4: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
  5: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  6: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
};

export default function VocabularyPanel({ vocabulary }: VocabularyPanelProps) {
  const { script } = usePreferences();
  const [collapsed, setCollapsed] = useState(false);

  if (vocabulary.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide cursor-pointer hover:text-gray-900 dark:hover:text-gray-100 w-full text-left"
      >
        <span className="text-xs transition-transform" style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
        Vocabulary ({vocabulary.length})
      </button>
      {!collapsed && (
        <div className="space-y-1">
          {vocabulary.map((word, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {script === 'simplified' ? word.simplified : word.traditional}
                  </span>
                  <span className="text-sm text-gray-400 dark:text-gray-500">{word.pinyin}</span>
                  {word.hsk && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${HSK_COLORS[word.hsk] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                      HSK{word.hsk}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">{word.meaning}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
