import { useCallback, useEffect, useRef, useState } from 'react';
import { getItem, setItem } from '../lib/storage';

export interface AudioControls {
  playing: boolean;
  currentTime: number;
  duration: number;
  toggle: () => void;
  seek: (time: number) => void;
  skip: (delta: number) => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
}

const RATE_KEY = 'reader:playbackRate';
const posKey = (lessonId: string) => `reader:audioPos:${lessonId}`;

// Don't persist/resume within this margin of the start or end of the track.
const EDGE_SECONDS = 5;

export function useAudio(url?: string, lessonId?: string): AudioControls {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rateRef = useRef<number>(getItem(RATE_KEY, 1));
  const [audioState, setAudioState] = useState({
    url,
    playing: false,
    currentTime: 0,
    duration: 0,
  });
  const [playbackRate, setPlaybackRateState] = useState(() => getItem(RATE_KEY, 1));

  useEffect(() => {
    if (!url) {
      audioRef.current = null;
      return;
    }

    const audio = new Audio(url);
    audio.playbackRate = rateRef.current;
    audioRef.current = audio;

    const key = lessonId ? posKey(lessonId) : null;
    let restored = false;
    let lastSavedAt = 0;

    // Persist a resume point, but not when we're basically at the very start or
    // near the end (where resuming would be pointless / annoying).
    const saveProgress = () => {
      if (!key) return;
      const d = audio.duration;
      const t = audio.currentTime;
      if (!Number.isFinite(d) || d <= 0) return;
      if (t < 1 || t > d - EDGE_SECONDS) {
        localStorage.removeItem(key);
      } else {
        setItem(key, t);
      }
    };

    // Once the duration is known, jump to the saved resume point (once).
    const maybeRestore = () => {
      if (restored || !key) return;
      const d = audio.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      restored = true;
      const saved = getItem<number>(key, 0);
      if (saved > 0 && saved < d - EDGE_SECONDS) {
        audio.currentTime = saved;
        setAudioState((prev) => ({
          ...(prev.url === url ? prev : { url, playing: false, currentTime: 0, duration: 0 }),
          url,
          currentTime: saved,
        }));
      }
    };

    const onTimeUpdate = () => {
      setAudioState((prev) => ({
        ...(prev.url === url ? prev : { url, playing: false, currentTime: 0, duration: 0 }),
        url,
        currentTime: audio.currentTime,
      }));
      const t = audio.currentTime;
      if (t - lastSavedAt >= 5 || t < lastSavedAt) {
        lastSavedAt = t;
        saveProgress();
      }
    };
    const onDurationChange = () => {
      setAudioState((prev) => ({
        ...(prev.url === url ? prev : { url, playing: false, currentTime: 0, duration: 0 }),
        url,
        duration: audio.duration,
      }));
      maybeRestore();
    };
    const onEnded = () => {
      if (key) localStorage.removeItem(key);
      setAudioState((prev) => ({ ...prev, url, playing: false }));
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('loadedmetadata', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      saveProgress();
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('loadedmetadata', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, [url, lessonId]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play()
        .then(() => setAudioState((prev) => ({ ...prev, url, playing: true })))
        .catch(() => setAudioState((prev) => ({ ...prev, url, playing: false })));
    } else {
      audio.pause();
      setAudioState((prev) => ({ ...prev, url, playing: false }));
    }
  }, [url]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setAudioState((prev) => ({ ...prev, url, currentTime: time }));
    if (audio.paused) {
      audio.play()
        .then(() => setAudioState((prev) => ({ ...prev, url, playing: true })))
        .catch(() => setAudioState((prev) => ({ ...prev, url, playing: false })));
    }
  }, [url]);

  // Jump relative to the current position, clamped, without changing play state.
  const skip = useCallback((delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const max = Number.isFinite(audio.duration) ? audio.duration : Infinity;
    const target = Math.max(0, Math.min(audio.currentTime + delta, max));
    audio.currentTime = target;
    setAudioState((prev) => ({ ...prev, url, currentTime: target }));
  }, [url]);

  const setPlaybackRate = useCallback((rate: number) => {
    rateRef.current = rate;
    setItem(RATE_KEY, rate);
    const audio = audioRef.current;
    if (audio) audio.playbackRate = rate;
    setPlaybackRateState(rate);
  }, []);

  const currentAudioState = audioState.url === url
    ? audioState
    : { url, playing: false, currentTime: 0, duration: 0 };

  return {
    playing: currentAudioState.playing,
    currentTime: currentAudioState.currentTime,
    duration: currentAudioState.duration,
    toggle,
    seek,
    skip,
    playbackRate,
    setPlaybackRate,
  };
}
