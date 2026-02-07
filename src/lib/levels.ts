import type { Level } from '../types/reader';

export const LEVEL_ORDER: Level[] = [
  'newbie',
  'elementary',
  'intermediate',
  'upper intermediate',
  'advanced',
  'master',
];

export const LEVEL_LABELS: Record<Level, string> = {
  newbie: 'Newbie',
  elementary: 'Elementary',
  intermediate: 'Intermediate',
  'upper intermediate': 'Upper Int.',
  advanced: 'Advanced',
  master: 'Master',
};

export const LEVEL_COLORS: Record<Level, string> = {
  newbie: 'bg-green-100 text-green-800',
  elementary: 'bg-blue-100 text-blue-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  'upper intermediate': 'bg-orange-100 text-orange-800',
  advanced: 'bg-red-100 text-red-800',
  master: 'bg-purple-100 text-purple-800',
};

export function levelIndex(level: Level): number {
  return LEVEL_ORDER.indexOf(level);
}
