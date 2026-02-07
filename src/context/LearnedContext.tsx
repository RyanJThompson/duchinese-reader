import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { getItem, setItem } from '../lib/storage';

const KEY = 'reader:learned';

interface LearnedContextValue {
  learnedSet: Set<string>;
  isLearned: (id: string) => boolean;
  toggleLearned: (id: string) => void;
}

const LearnedContext = createContext<LearnedContextValue | null>(null);

export function LearnedProvider({ children }: { children: ReactNode }) {
  const [learnedSet, setLearnedSet] = useState<Set<string>>(
    () => new Set(getItem<string[]>(KEY, [])),
  );

  const isLearned = useCallback((id: string) => learnedSet.has(id), [learnedSet]);

  const toggleLearned = useCallback((id: string) => {
    setLearnedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setItem(KEY, [...next]);
      return next;
    });
  }, []);

  return (
    <LearnedContext.Provider value={{ learnedSet, isLearned, toggleLearned }}>
      {children}
    </LearnedContext.Provider>
  );
}

export function useLearned() {
  const ctx = useContext(LearnedContext);
  if (!ctx) throw new Error('useLearned must be used within LearnedProvider');
  return ctx;
}
