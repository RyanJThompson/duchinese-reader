import { useCallback, useEffect, useRef, useState } from 'react';

export interface AudioControls {
  playing: boolean;
  currentTime: number;
  duration: number;
  toggle: () => void;
  seek: (time: number) => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
}

export function useAudio(url?: string): AudioControls {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rateRef = useRef(1);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);

  useEffect(() => {
    if (!url) return;

    const audio = new Audio(url);
    audio.playbackRate = rateRef.current;
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
  }, [url]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
    if (audio.paused) {
      audio.play();
      setPlaying(true);
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    rateRef.current = rate;
    const audio = audioRef.current;
    if (audio) audio.playbackRate = rate;
    setPlaybackRateState(rate);
  }, []);

  return { playing, currentTime, duration, toggle, seek, playbackRate, setPlaybackRate };
}
