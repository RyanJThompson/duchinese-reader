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
  newbie: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300',
  elementary: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300',
  intermediate: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300',
  'upper intermediate': 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300',
  advanced: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300',
  master: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300',
};

export function levelIndex(level: Level): number {
  return LEVEL_ORDER.indexOf(level);
}
