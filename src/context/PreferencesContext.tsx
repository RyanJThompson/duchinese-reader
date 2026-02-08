import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { getItem, setItem } from '../lib/storage';
import { fetchRemotePreferences, pushRemotePreferences } from '../lib/sync';
import { PreferencesContext, type Script, type Theme } from './preferencesContextValue';

function applyDarkClass(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [script, setScript] = useState<Script>(() => getItem('reader:script', 'simplified'));
  const [showPinyin, setShowPinyin] = useState(() => getItem('reader:pinyin', false));
  const [showEnglish, setShowEnglish] = useState(() => getItem('reader:english', false));
  const [theme, setThemeState] = useState<Theme>(() => getItem('reader:theme', 'auto'));
  const [showAudioPlayer, setShowAudioPlayer] = useState(() => getItem('reader:showAudioPlayer', false));

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    setItem('reader:theme', t);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      applyDarkClass(true);
      return;
    }
    if (theme === 'light') {
      applyDarkClass(false);
      return;
    }
    // auto
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    applyDarkClass(mq.matches);
    const handler = (e: MediaQueryListEvent) => applyDarkClass(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const toggleScript = useCallback(() => {
    setScript((prev) => {
      const next = prev === 'simplified' ? 'traditional' : 'simplified';
      setItem('reader:script', next);
      return next;
    });
  }, []);

  const togglePinyin = useCallback(() => {
    setShowPinyin((prev) => {
      const next = !prev;
      setItem('reader:pinyin', next);
      return next;
    });
  }, []);

  const toggleEnglish = useCallback(() => {
    setShowEnglish((prev) => {
      const next = !prev;
      setItem('reader:english', next);
      return next;
    });
  }, []);

  const toggleAudioPlayer = useCallback(() => {
    setShowAudioPlayer((prev) => {
      const next = !prev;
      setItem('reader:showAudioPlayer', next);
      pushRemotePreferences({ showAudioPlayer: next }).catch(() => {});
      return next;
    });
  }, []);

  useEffect(() => {
    fetchRemotePreferences()
      .then((remote) => {
        if (remote.showAudioPlayer != null) {
          const local = getItem('reader:showAudioPlayer', undefined as boolean | undefined);
          if (local == null) {
            setShowAudioPlayer(remote.showAudioPlayer);
            setItem('reader:showAudioPlayer', remote.showAudioPlayer);
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <PreferencesContext.Provider value={{ script, toggleScript, showPinyin, togglePinyin, showEnglish, toggleEnglish, theme, setTheme, showAudioPlayer, toggleAudioPlayer }}>
      {children}
    </PreferencesContext.Provider>
  );
}

