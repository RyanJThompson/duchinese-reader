import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { getItem, setItem } from '../lib/storage';
import { fetchRemotePreferences, pushRemotePreferences } from '../lib/sync';
import { FONT_SCALE_DEFAULT, FONT_SCALE_STEP, clampFontScale } from '../lib/fontScale';
import { PreferencesContext, type AudioPosition, type Script, type Theme } from './preferencesContextValue';

function applyDarkClass(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [script, setScript] = useState<Script>(() => getItem('reader:script', 'simplified'));
  const [showPinyin, setShowPinyin] = useState(() => getItem('reader:pinyin', false));
  const [showEnglish, setShowEnglish] = useState(() => getItem('reader:english', false));
  const [theme, setThemeState] = useState<Theme>(() => getItem('reader:theme', 'auto'));
  const [showAudioPlayer, setShowAudioPlayer] = useState(() => getItem('reader:showAudioPlayer', false));
  const [audioPosition, setAudioPosition] = useState<AudioPosition>(() => getItem('reader:audioPosition', 'top'));
  const [fontScale, setFontScale] = useState<number>(() => clampFontScale(getItem('reader:fontScale', FONT_SCALE_DEFAULT)));

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
      return next;
    });
  }, []);

  const toggleAudioPosition = useCallback(() => {
    setAudioPosition((prev) => {
      const next = prev === 'top' ? 'bottom' : 'top';
      setItem('reader:audioPosition', next);
      return next;
    });
  }, []);

  const stepFontScale = useCallback((delta: number) => {
    setFontScale((prev) => {
      const next = clampFontScale(prev + delta);
      setItem('reader:fontScale', next);
      return next;
    });
  }, []);

  const increaseFontSize = useCallback(() => stepFontScale(FONT_SCALE_STEP), [stepFontScale]);
  const decreaseFontSize = useCallback(() => stepFontScale(-FONT_SCALE_STEP), [stepFontScale]);
  const resetFontSize = useCallback(() => {
    setFontScale(FONT_SCALE_DEFAULT);
    setItem('reader:fontScale', FONT_SCALE_DEFAULT);
  }, []);

  // Hydrate every reader preference from the synced blob on mount. A remote
  // value is adopted only when this device has no local choice yet, so an
  // explicit local setting is never overridden by an older remote one.
  const hydratedRef = useRef(false);
  useEffect(() => {
    const unset = (key: string) => localStorage.getItem(key) === null;
    fetchRemotePreferences()
      .then((remote) => {
        if (remote.showAudioPlayer != null && unset('reader:showAudioPlayer')) {
          setShowAudioPlayer(remote.showAudioPlayer);
          setItem('reader:showAudioPlayer', remote.showAudioPlayer);
        }
        if (remote.showPinyin != null && unset('reader:pinyin')) {
          setShowPinyin(remote.showPinyin);
          setItem('reader:pinyin', remote.showPinyin);
        }
        if (remote.showEnglish != null && unset('reader:english')) {
          setShowEnglish(remote.showEnglish);
          setItem('reader:english', remote.showEnglish);
        }
        if (remote.script != null && unset('reader:script')) {
          setScript(remote.script);
          setItem('reader:script', remote.script);
        }
        if (remote.theme != null && unset('reader:theme')) {
          setThemeState(remote.theme);
          setItem('reader:theme', remote.theme);
        }
        if (remote.audioPosition != null && unset('reader:audioPosition')) {
          setAudioPosition(remote.audioPosition);
          setItem('reader:audioPosition', remote.audioPosition);
        }
        if (remote.fontScale != null && unset('reader:fontScale')) {
          const scale = clampFontScale(remote.fontScale);
          setFontScale(scale);
          setItem('reader:fontScale', scale);
        }
      })
      .catch(() => {})
      .finally(() => {
        hydratedRef.current = true;
      });
  }, []);

  // After hydration, push the FULL preference snapshot whenever any synced
  // preference changes. Sending the whole object (not just the changed field)
  // means a partial payload can never wipe the other fields server-side.
  useEffect(() => {
    if (!hydratedRef.current) return;
    pushRemotePreferences({ showAudioPlayer, showPinyin, showEnglish, script, theme, audioPosition, fontScale }).catch(() => {});
  }, [showAudioPlayer, showPinyin, showEnglish, script, theme, audioPosition, fontScale]);

  return (
    <PreferencesContext.Provider value={{ script, toggleScript, showPinyin, togglePinyin, showEnglish, toggleEnglish, theme, setTheme, showAudioPlayer, toggleAudioPlayer, audioPosition, toggleAudioPosition, fontScale, increaseFontSize, decreaseFontSize, resetFontSize }}>
      {children}
    </PreferencesContext.Provider>
  );
}

