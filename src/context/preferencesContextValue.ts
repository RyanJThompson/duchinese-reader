import { createContext } from 'react';

export type Script = 'simplified' | 'traditional';
export type Theme = 'light' | 'dark' | 'auto';
export type AudioPosition = 'top' | 'bottom';

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
  audioPosition: AudioPosition;
  toggleAudioPosition: () => void;
  fontScale: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}

/** Reader preferences synced to Redis (see src/lib/sync.ts). */
export interface SyncedPreferences {
  showAudioPlayer?: boolean;
  showPinyin?: boolean;
  showEnglish?: boolean;
  script?: Script;
  theme?: Theme;
  audioPosition?: AudioPosition;
  fontScale?: number;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);
