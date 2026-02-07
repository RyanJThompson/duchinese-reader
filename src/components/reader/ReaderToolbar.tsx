import { usePreferences } from '../../context/PreferencesContext';

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
        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
      >
        &larr; Back
      </button>
      <div className="flex-1" />
      <button
        onClick={toggleScript}
        className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 hover:bg-gray-50 cursor-pointer"
      >
        {script === 'simplified' ? '简' : '繁'}
      </button>
      <button
        onClick={togglePinyin}
        className={`px-3 py-1.5 rounded-lg text-sm border cursor-pointer ${
          showPinyin ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300 hover:bg-gray-50'
        }`}
      >
        Pinyin
      </button>
      <button
        onClick={toggleEnglish}
        className={`px-3 py-1.5 rounded-lg text-sm border cursor-pointer ${
          showEnglish ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300 hover:bg-gray-50'
        }`}
      >
        English
      </button>
      <button
        onClick={onToggleLearned}
        className={`px-3 py-1.5 rounded-lg text-sm border cursor-pointer ${
          learned
            ? 'border-green-300 bg-green-50 text-green-700'
            : 'border-gray-300 hover:bg-gray-50'
        }`}
      >
        {learned ? '✓ Learned' : 'Mark learned'}
      </button>
    </div>
  );
}
