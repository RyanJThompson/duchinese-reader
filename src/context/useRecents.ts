import { useContext } from 'react';
import { RecentsContext } from './recentsContextValue';

export function useRecents() {
  const ctx = useContext(RecentsContext);
  if (!ctx) throw new Error('useRecents must be used within RecentsProvider');
  return ctx;
}
