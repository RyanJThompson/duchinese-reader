import { useContext } from 'react';
import { LearnedContext } from './learnedContextValue';

export function useLearned() {
  const ctx = useContext(LearnedContext);
  if (!ctx) throw new Error('useLearned must be used within LearnedProvider');
  return ctx;
}
