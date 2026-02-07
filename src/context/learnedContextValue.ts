import { createContext } from 'react';

export interface LearnedContextValue {
  learnedSet: Set<string>;
  isLearned: (id: string) => boolean;
  toggleLearned: (id: string) => void;
}

export const LearnedContext = createContext<LearnedContextValue | null>(null);
