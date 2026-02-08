import { useState } from 'react';
import type { AudioControls } from '../../hooks/useAudio';

interface AudioPlayerProps {
  audio: AudioControls;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ audio }: AudioPlayerProps) {
  const { playing, currentTime, duration, toggle, seek, setPlaybackRate } = audio;
  const [rate, setRate] = useState(audio.playbackRate);

  const cycleSpeed = () => {
    setRate((prev) => {
      const idx = SPEEDS.indexOf(prev);
      const next = SPEEDS[(idx + 1) % SPEEDS.length];
      setPlaybackRate(next);
      return next;
    });
  };

  return (
    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-2">
      <button
        onClick={toggle}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer text-sm"
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
        className="flex-1 h-1 accent-red-600"
      />
      <span className="text-xs text-gray-500 dark:text-gray-400 w-10 tabular-nums">
        {formatTime(duration)}
      </span>
      <button
        onClick={cycleSpeed}
        className="px-2 py-1 rounded text-xs font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer tabular-nums min-w-[3rem]"
      >
        {rate}x
      </button>
    </div>
  );
}
