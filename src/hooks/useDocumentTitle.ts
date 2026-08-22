import { useEffect } from 'react';

const BASE_TITLE = 'Chinese Reader';

/**
 * Sets document.title per route so browser tabs and back/forward history
 * entries are distinguishable (WCAG 2.4.2). Falls back to the base title
 * when no specific title is provided or on unmount.
 */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
}
