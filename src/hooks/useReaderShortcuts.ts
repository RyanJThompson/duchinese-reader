import { useEffect, useRef } from 'react';

export interface ReaderShortcutHandlers {
  onTogglePlay?: () => void;
  onSkip?: (delta: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onTogglePinyin: () => void;
  onToggleEnglish: () => void;
  onToggleScript: () => void;
  onToggleLearned: () => void;
  onIncreaseFont?: () => void;
  onDecreaseFont?: () => void;
  onResetFont?: () => void;
}

const SKIP_SECONDS = 5;

/**
 * Keyboard shortcuts for the reader:
 *   space      play / pause
 *   ← / →      skip back / forward 5s
 *   [ / ]      previous / next chapter
 *   p / e / s  toggle pinyin / English / script
 *   l          toggle learned
 *   + / -      increase / decrease font size   (0 resets)
 * Ignored while a text input/textarea/contentEditable is focused (e.g. search).
 * Handlers are read from a ref so the listener stays stable across renders.
 */
export function useReaderShortcuts(handlers: ReaderShortcutHandlers) {
  const ref = useRef(handlers);

  // Keep the ref pointed at the latest handlers without re-subscribing the
  // listener (updating a ref during render is disallowed, so do it in an effect).
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;

      const h = ref.current;
      switch (e.key) {
        case ' ':
        case 'Spacebar':
          if (h.onTogglePlay) {
            e.preventDefault();
            h.onTogglePlay();
          }
          break;
        case 'ArrowLeft':
          if (h.onSkip) {
            e.preventDefault();
            h.onSkip(-SKIP_SECONDS);
          }
          break;
        case 'ArrowRight':
          if (h.onSkip) {
            e.preventDefault();
            h.onSkip(SKIP_SECONDS);
          }
          break;
        case '[':
          h.onPrev?.();
          break;
        case ']':
          h.onNext?.();
          break;
        case 'p':
        case 'P':
          h.onTogglePinyin();
          break;
        case 'e':
        case 'E':
          h.onToggleEnglish();
          break;
        case 's':
        case 'S':
          h.onToggleScript();
          break;
        case 'l':
        case 'L':
          h.onToggleLearned();
          break;
        // '+' shares a key with '=' on most keyboards; accept both.
        case '+':
        case '=':
          h.onIncreaseFont?.();
          break;
        case '-':
        case '_':
          h.onDecreaseFont?.();
          break;
        case '0':
          h.onResetFont?.();
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
