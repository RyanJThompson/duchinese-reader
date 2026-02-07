import type { ContentType, Lesson, LessonSummary, Level, Sentence, SeriesInfo, VocabWord } from '../../types/reader';
import type { RawIndexEntry, RawLesson } from './types';

const VALID_LEVELS = new Set<string>([
  'newbie', 'elementary', 'intermediate', 'upper intermediate', 'advanced', 'master',
]);

function normalizeLevel(raw: string): Level {
  const lower = raw.toLowerCase().trim();
  if (VALID_LEVELS.has(lower)) return lower as Level;
  return 'intermediate'; // fallback
}

function isWhitespace(text: string): boolean {
  return text.trim().length === 0;
}

function mapIndexSeries(raw: RawIndexEntry): SeriesInfo | undefined {
  if (!raw.course_title) return undefined;
  return {
    title: raw.course_title,
    chapter: raw.course_position ?? 0,
    totalChapters: 0, // not available in index; filled from lesson detail
  };
}

function mapContentType(courseType: string | null): ContentType {
  switch (courseType) {
    case 'course': return 'course';
    case 'multi_lesson': return 'course';
    case 'article_collection': return 'article_collection';
    case 'short_story': return 'short_story';
    default: return 'standalone';
  }
}

export function mapIndexEntry(raw: RawIndexEntry): LessonSummary {
  return {
    id: raw.id,
    title: raw.title,
    level: normalizeLevel(raw.level),
    synopsis: raw.synopsis,
    date: raw.release_at_formatted,
    imageUrl: raw.medium_image_url || undefined,
    audioUrl: raw.audio_url || undefined,
    series: mapIndexSeries(raw),
    contentType: mapContentType(raw.course_type),
  };
}

/**
 * Realign translations from the raw DuChinese format.
 *
 * raw.sentence_translations has one more entry than raw.sentences:
 * translations[0] is for the lesson title, so sentence[i] maps to translations[i+1].
 *
 * We also filter out whitespace-only sentences (paragraph breaks).
 */
export function mapSentences(raw: RawLesson): Sentence[] {
  const translations = raw.raw.sentence_translations;
  const result: Sentence[] = [];

  for (let i = 0; i < raw.sentences.length; i++) {
    const s = raw.sentences[i];
    if (isWhitespace(s.simplified)) continue;

    const english = i + 1 < translations.length ? translations[i + 1] : '';

    result.push({
      index: result.length + 1,
      simplified: s.simplified,
      traditional: s.traditional,
      pinyin: s.pinyin,
      english,
    });
  }

  return result;
}

export function mapVocabulary(raw: RawLesson): VocabWord[] {
  return raw.vocabulary.map((v) => ({
    simplified: v.hanzi,
    traditional: v.traditional,
    pinyin: v.pinyin,
    meaning: v.meaning,
    hsk: v.hsk ?? undefined,
  }));
}

export function mapLesson(raw: RawLesson): Lesson {
  return {
    id: raw.id,
    title: raw.title,
    level: normalizeLevel(raw.level),
    synopsis: raw.synopsis,
    date: raw.date,
    audioUrl: raw.audioUrl || undefined,
    series: raw.series
      ? { title: raw.series.title, chapter: raw.series.chapter, totalChapters: raw.series.totalChapters }
      : undefined,
    contentType: raw.series ? 'course' : 'standalone',
    fullText: raw.fullText,
    sentences: mapSentences(raw),
    vocabulary: mapVocabulary(raw),
  };
}
