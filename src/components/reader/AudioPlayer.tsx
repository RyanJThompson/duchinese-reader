import { useState } from 'react';
import type { AudioControls } from '../../hooks/useAudio';
import { usePreferences } from '../../context/usePreferences';

interface AudioPlayerProps {
  audio: AudioControls;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SKIP_SECONDS = 5;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Curved arrow (counter-clockwise) with a "5" — jump back 5s.
function SkipBackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <text x="12.5" y="15.5" fontSize="9" fontWeight="700" fill="currentColor" stroke="none" textAnchor="middle">5</text>
    </svg>
  );
}

// Curved arrow (clockwise) with a "5" — jump forward 5s.
function SkipForwardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <text x="11.5" y="15.5" fontSize="9" fontWeight="700" fill="currentColor" stroke="none" textAnchor="middle">5</text>
    </svg>
  );
}

// Shows where the bar will move TO when pressed.
function PositionIcon({ position }: { position: 'top' | 'bottom' }) {
  return position === 'top' ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="3" x2="12" y2="16" />
      <polyline points="6 11 12 17 18 11" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="3" x2="20" y2="3" />
      <polyline points="6 13 12 7 18 13" />
      <line x1="12" y1="8" x2="12" y2="21" />
    </svg>
  );
}

export default function AudioPlayer({ audio }: AudioPlayerProps) {
  const { playing, currentTime, duration, toggle, seek, skip, setPlaybackRate } = audio;
  const { audioPosition, toggleAudioPosition } = usePreferences();
  const [rate, setRate] = useState(audio.playbackRate);

  const cycleSpeed = () => {
    setRate((prev) => {
      const idx = SPEEDS.indexOf(prev);
      const next = SPEEDS[(idx + 1) % SPEEDS.length];
      setPlaybackRate(next);
      return next;
    });
  };

  const iconBtn =
    'flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer';

  return (
    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
      <button onClick={() => skip(-SKIP_SECONDS)} className={iconBtn} title="Back 5 seconds" aria-label="Back 5 seconds">
        <SkipBackIcon />
      </button>
      <button
        onClick={toggle}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer text-sm shrink-0"
        title={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="1" y="0" width="4" height="14" rx="1" />
            <rect x="9" y="0" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <polygon points="2,0 14,7 2,14" />
          </svg>
        )}
      </button>
      <button onClick={() => skip(SKIP_SECONDS)} className={iconBtn} title="Forward 5 seconds" aria-label="Forward 5 seconds">
        <SkipForwardIcon />
      </button>
      <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right tabular-nums">
        {formatTime(currentTime)}
      </span>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={(e) => seek(Number(e.target.value))}
        className="flex-1 min-w-0 h-1 accent-red-600"
        aria-label="Audio position"
      />
      <span className="text-xs text-gray-500 dark:text-gray-400 w-10 tabular-nums">
        {formatTime(duration)}
      </span>
      <button
        onClick={cycleSpeed}
        className="px-2 py-1 rounded text-xs font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer tabular-nums shrink-0"
        aria-label="Playback speed"
      >
        {rate}x
      </button>
      <button
        onClick={toggleAudioPosition}
        className={`${iconBtn} shrink-0`}
        title={audioPosition === 'top' ? 'Move player to bottom' : 'Move player to top'}
        aria-label={audioPosition === 'top' ? 'Move player to bottom' : 'Move player to top'}
      >
        <PositionIcon position={audioPosition} />
      </button>
    </div>
  );
}
