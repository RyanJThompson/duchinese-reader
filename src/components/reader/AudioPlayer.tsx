import { useAudio } from '../../hooks/useAudio';

interface AudioPlayerProps {
  url: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ url }: AudioPlayerProps) {
  const { playing, currentTime, duration, toggle, seek } = useAudio(url);

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
    </div>
  );
}
