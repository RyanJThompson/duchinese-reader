import type { ContentType, CourseInfo, Lesson, LessonSummary, Level, Sentence, SeriesInfo, VocabWord } from '../../types/reader';
import type { RawCourse, RawIndexEntry, RawLesson } from './types';

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

function mapCourseInfo(raw: RawCourse): CourseInfo {
  return {
    title: raw.title,
    description: raw.description,
    imageUrl: raw.large_image_url || raw.medium_image_url || undefined,
    levels: raw.levels.map(normalizeLevel),
    lessonCount: raw.lesson_count,
    contentType: mapContentType(raw.type),
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
    courseInfo: raw.course ? mapCourseInfo(raw.course) : undefined,
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
/**
 * Build a mapping from word index to syllable index.
 * sentence_indices are word indices into raw.words, not syllable indices
 * into syllable_times. Multi-syllable words cause these to diverge.
 */
function buildWordToSyllableMap(words: Array<{ pinyin?: string }>): number[] {
  const map = [0];
  for (const w of words) {
    const count = w.pinyin ? w.pinyin.split(' ').length : 0;
    map.push(map[map.length - 1] + count);
  }
  return map;
}

export function mapSentences(raw: RawLesson): Sentence[] {
  const translations = raw.raw.sentence_translations;
  const syllableTimes = raw.raw.syllable_times;
  const sentenceIndices = raw.raw.sentence_indices;
  const words = raw.raw.words;

  const wordToSyllable = words ? buildWordToSyllableMap(words) : undefined;

  const result: Sentence[] = [];

  for (let i = 0; i < raw.sentences.length; i++) {
    const s = raw.sentences[i];
    if (isWhitespace(s.simplified)) continue;

    const english = i + 1 < translations.length ? translations[i + 1] : '';

    let audioTime: number | undefined;
    if (syllableTimes && sentenceIndices && wordToSyllable) {
      const wordIdx = sentenceIndices[i];
      if (wordIdx != null) {
        const sylIdx = wordToSyllable[wordIdx];
        if (sylIdx > 0 && sylIdx - 1 < syllableTimes.length) {
          audioTime = syllableTimes[sylIdx - 1];
        } else if (sylIdx === 0) {
          audioTime = 0;
        }
      }
    }

    result.push({
      index: result.length + 1,
      simplified: s.simplified,
      traditional: s.traditional,
      pinyin: s.pinyin,
      english,
      audioTime,
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
