import { usePreferences } from '../../context/usePreferences';

interface ReaderToolbarProps {
  learned: boolean;
  onToggleLearned: () => void;
  onBack: () => void;
}

export default function ReaderToolbar({ learned, onToggleLearned, onBack }: ReaderToolbarProps) {
  const { script, toggleScript, showPinyin, togglePinyin, showEnglish, toggleEnglish } = usePreferences();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onBack}
        className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
      >
        &larr; Back
      </button>
      <div className="flex-1" />
      <button
        onClick={toggleScript}
        className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
      >
        {script === 'simplified' ? '简' : '繁'}
      </button>
      <button
        onClick={togglePinyin}
        className={`px-3 py-1.5 rounded-lg text-sm border cursor-pointer ${
          showPinyin ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        Pinyin
      </button>
      <button
        onClick={toggleEnglish}
        className={`px-3 py-1.5 rounded-lg text-sm border cursor-pointer ${
          showEnglish ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        English
      </button>
      <button
        onClick={onToggleLearned}
        className={`px-3 py-1.5 rounded-lg text-sm border cursor-pointer ${
          learned
            ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        {learned ? '✓ Learned' : 'Mark learned'}
      </button>
    </div>
  );
}
