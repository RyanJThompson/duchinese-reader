import { useCallback, useEffect, useRef, useState } from 'react';

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

export function useAudio(url?: string): AudioControls {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rateRef = useRef(1);
  const [audioState, setAudioState] = useState({
    url,
    playing: false,
    currentTime: 0,
    duration: 0,
  });
  const [playbackRate, setPlaybackRateState] = useState(1);

  useEffect(() => {
    if (!url) {
      audioRef.current = null;
      return;
    }

    const audio = new Audio(url);
    audio.playbackRate = rateRef.current;
    audioRef.current = audio;

    const onTimeUpdate = () => setAudioState((prev) => ({
      ...(prev.url === url ? prev : { url, playing: false, currentTime: 0, duration: 0 }),
      url,
      currentTime: audio.currentTime,
    }));
    const onDurationChange = () => setAudioState((prev) => ({
      ...(prev.url === url ? prev : { url, playing: false, currentTime: 0, duration: 0 }),
      url,
      duration: audio.duration,
    }));
    const onEnded = () => setAudioState((prev) => ({ ...prev, url, playing: false }));

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, [url]);

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
