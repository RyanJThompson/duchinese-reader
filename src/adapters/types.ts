import type { Lesson, LessonSummary } from '../types/reader';

export interface DataAdapter {
  loadIndex(): Promise<LessonSummary[]>;
  loadLesson(id: string): Promise<Lesson | null>;
}
