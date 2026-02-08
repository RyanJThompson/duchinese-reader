import { createContext } from 'react';

export interface RecentEntry {
  id: string;
  visitedAt: number;
}

export interface RecentsContextValue {
  recents: RecentEntry[];
  recordVisit: (id: string) => void;
  clearRecents: () => void;
}

export const RecentsContext = createContext<RecentsContextValue | null>(null);
