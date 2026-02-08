import { createContext } from 'react';

export type Script = 'simplified' | 'traditional';
export type Theme = 'light' | 'dark' | 'auto';

export interface PreferencesContextValue {
  script: Script;
  toggleScript: () => void;
  showPinyin: boolean;
  togglePinyin: () => void;
  showEnglish: boolean;
  toggleEnglish: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  showAudioPlayer: boolean;
  toggleAudioPlayer: () => void;
}

/** Subset of preferences synced to Redis */
export interface SyncedPreferences {
  showAudioPlayer?: boolean;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);
