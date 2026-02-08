import { usePreferences } from '../../context/usePreferences';

interface ReaderToolbarProps {
  learned: boolean;
  onToggleLearned: () => void;
  onBack: () => void;
}

/* SVG-only labels so Migaku Reader cannot detect text inside buttons */

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

/* Script toggle: swap arrows */
function ScriptIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

/* Pinyin: "A" with a tone mark accent above */
function PinyinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 20l7-16 7 16" />
      <path d="M8.5 12h7" />
      <path d="M10 2l2-1.5L14 2" />
    </svg>
  );
}

/* English: globe icon */
function EnglishIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
    </svg>
  );
}

function LearnedIcon({ learned }: { learned: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={learned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label={learned ? 'Learned' : 'Mark learned'}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      {learned && <polyline points="22 4 12 14.01 9 11.01" />}
    </svg>
  );
}

export default function ReaderToolbar({ learned, onToggleLearned, onBack }: ReaderToolbarProps) {
  const { script, toggleScript, showPinyin, togglePinyin, showEnglish, toggleEnglish } = usePreferences();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onBack}
        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
        title="Back"
      >
        <BackIcon />
      </button>
      <div className="flex-1" />
      <button
        onClick={toggleScript}
        className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
        title={script === 'simplified' ? 'Simplified' : 'Traditional'}
      >
        <ScriptIcon />
      </button>
      <button
        onClick={togglePinyin}
        className={`p-1.5 rounded-lg border cursor-pointer ${
          showPinyin ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
        title="Pinyin"
      >
        <PinyinIcon />
      </button>
      <button
        onClick={toggleEnglish}
        className={`p-1.5 rounded-lg border cursor-pointer ${
          showEnglish ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
        title="English"
      >
        <EnglishIcon />
      </button>
      <button
        onClick={onToggleLearned}
        className={`p-1.5 rounded-lg border cursor-pointer ${
          learned
            ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
        title={learned ? 'Learned' : 'Mark learned'}
      >
        <LearnedIcon learned={learned} />
      </button>
    </div>
  );
}
