// Raw DuChinese JSON shapes (as they come from the scraper)

export interface RawCourse {
  title: string;
  description: string;
  large_image_url: string;
  medium_image_url: string;
  levels: string[];
  lesson_count: number;
  type: string;
  group: string;
}

export interface RawIndexEntry {
  id: string;
  title: string;
  level: string;
  synopsis: string;
  audio_url: string;
  medium_image_url: string;
  large_image_url: string;
  release_at_formatted: string;
  course: RawCourse | null;
  course_title: string | null;
  course_position: number | null;
  course_type: string | null;
  course_group: string | null;
}

export interface RawSentence {
  index: number;
  simplified: string;
  traditional: string;
  pinyin: string;
  english: string;
}

export interface RawVocab {
  hanzi: string;
  traditional: string;
  pinyin: string;
  meaning: string;
  hsk: number | null;
}

export interface RawSeriesInfo {
  title: string;
  chapter: number;
  totalChapters: number;
}

export interface RawLesson {
  id: string;
  title: string;
  level: string;
  date: string;
  synopsis: string;
  audioUrl: string;
  series: RawSeriesInfo | null;
  fullText: {
    simplified: string;
    traditional: string;
  };
  sentences: RawSentence[];
  vocabulary: RawVocab[];
  raw: {
    sentence_translations: string[];
    syllable_times?: number[];
    sentence_indices?: number[];
    words?: Array<{ pinyin?: string }>;
  };
}
