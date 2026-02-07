export type Level =
  | 'newbie'
  | 'elementary'
  | 'intermediate'
  | 'upper intermediate'
  | 'advanced'
  | 'master';

export type ContentType = 'course' | 'article_collection' | 'short_story' | 'standalone';

export interface SeriesInfo {
  title: string;
  chapter: number;
  totalChapters: number;
}

export interface CourseInfo {
  title: string;
  description: string;
  imageUrl?: string;
  levels: Level[];
  lessonCount: number;
  contentType: ContentType;
}

export interface LessonSummary {
  id: string;
  title: string;
  level: Level;
  synopsis: string;
  date: string;
  imageUrl?: string;
  audioUrl?: string;
  series?: SeriesInfo;
  contentType: ContentType;
  courseInfo?: CourseInfo;
}

export interface Sentence {
  index: number;
  simplified: string;
  traditional: string;
  pinyin: string;
  english: string;
}

export interface VocabWord {
  simplified: string;
  traditional: string;
  pinyin: string;
  meaning: string;
  hsk?: number;
}

export interface Lesson extends LessonSummary {
  fullText: {
    simplified: string;
    traditional: string;
  };
  sentences: Sentence[];
  vocabulary: VocabWord[];
}
