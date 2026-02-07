import type { DataAdapter } from '../types';
import type { Lesson, LessonSummary } from '../../types/reader';
import type { RawIndexEntry, RawLesson } from './types';
import { mapIndexEntry, mapLesson } from './mappers';

export class DuChineseAdapter implements DataAdapter {
  private basePath: string;

  constructor(basePath = '/data') {
    this.basePath = basePath;
  }

  async loadIndex(): Promise<LessonSummary[]> {
    const res = await fetch(`${this.basePath}/lessons.json`);
    if (!res.ok) throw new Error(`Failed to load lesson index: ${res.status}`);
    const raw: RawIndexEntry[] = await res.json();
    return raw.map(mapIndexEntry);
  }

  async loadLesson(id: string): Promise<Lesson | null> {
    const res = await fetch(`${this.basePath}/lessons/${id}.json`);
    if (!res.ok) return null;
    const raw: RawLesson = await res.json();
    return mapLesson(raw);
  }
}
