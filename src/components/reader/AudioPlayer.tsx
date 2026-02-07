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
  const { playing, currentTime, duration, toggle, seek, playbackRate, setPlaybackRate } = audio;

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(playbackRate);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setPlaybackRate(next);
  };

  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2">
      <button
        onClick={toggle}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer text-sm"
      >
        {playing ? '⏸' : '▶'}
      </button>
      <span className="text-xs text-gray-500 w-10 text-right tabular-nums">
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
      <span className="text-xs text-gray-500 w-10 tabular-nums">
        {formatTime(duration)}
      </span>
      <button
        onClick={cycleSpeed}
        className="px-2 py-1 rounded text-xs font-medium border border-gray-300 hover:bg-gray-100 cursor-pointer tabular-nums min-w-[3rem]"
      >
        {playbackRate}x
      </button>
    </div>
  );
}
