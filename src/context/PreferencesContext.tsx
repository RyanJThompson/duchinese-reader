import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { getItem, setItem } from '../lib/storage';

type Script = 'simplified' | 'traditional';

interface PreferencesContextValue {
  script: Script;
  toggleScript: () => void;
  showPinyin: boolean;
  togglePinyin: () => void;
  showEnglish: boolean;
  toggleEnglish: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [script, setScript] = useState<Script>(() => getItem('reader:script', 'simplified'));
  const [showPinyin, setShowPinyin] = useState(() => getItem('reader:pinyin', true));
  const [showEnglish, setShowEnglish] = useState(() => getItem('reader:english', true));

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

  return (
    <PreferencesContext.Provider value={{ script, toggleScript, showPinyin, togglePinyin, showEnglish, toggleEnglish }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
