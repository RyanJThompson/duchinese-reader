import type { CrdData, LessonMeta } from './api';

export interface ParsedSentence {
  index: number;
  simplified: string;
  traditional: string;
  pinyin: string;
  english: string;
}

export interface VocabEntry {
  hanzi: string;
  traditional: string;
  pinyin: string;
  meaning: string;
  hsk: number | null;
}

export interface ParsedLesson {
  id: number;
  title: string;
  level: string;
  date: string;
  synopsis: string;
  audioUrl: string | null;
  series: { title: string; chapter: number; totalChapters: number } | null;
  fullText: { simplified: string; traditional: string };
  sentences: ParsedSentence[];
  vocabulary: VocabEntry[];
  raw: CrdData;
}

/**
 * Parse CRD data into structured lesson format
 */
export function parseCrd(
  crd: CrdData,
  meta: LessonMeta,
  totalChapters?: number
): ParsedLesson {
  const { words, sentence_indices, sentence_translations } = crd;

  // Build full text by concatenating all word hanzi
  const simplifiedFull = words.map(w => w.hanzi).join('');
  const traditionalFull = words.map(w => w.tc_hanzi || w.hanzi).join('');

  // Parse sentences using sentence_indices
  const sentences: ParsedSentence[] = [];

  for (let i = 0; i < sentence_indices.length; i++) {
    const startIdx = sentence_indices[i];
    const endIdx = i + 1 < sentence_indices.length
      ? sentence_indices[i + 1]
      : words.length;

    const sentenceWords = words.slice(startIdx, endIdx);

    // Build sentence text
    const simplified = sentenceWords.map(w => w.hanzi).join('');
    const traditional = sentenceWords.map(w => w.tc_hanzi || w.hanzi).join('');

    // Build pinyin (skip whitespace/newline words)
    const pinyin = sentenceWords
      .filter(w => w.pinyin && w.hanzi.trim() !== '' && w.hanzi !== '\n')
      .map(w => w.pinyin)
      .join(' ');

    const english = sentence_translations[i] || '';

    sentences.push({
      index: i + 1,
      simplified,
      traditional,
      pinyin,
      english
    });
  }

  // Build vocabulary list (deduplicate by hanzi, only include words with meaning)
  const vocabMap = new Map<string, VocabEntry>();

  for (const word of words) {
    // Skip if no meaning or already seen
    if (!word.meaning || word.meaning.trim() === '' || vocabMap.has(word.hanzi)) {
      continue;
    }

    // Skip whitespace/newline words
    if (word.hanzi.trim() === '' || word.hanzi === '\n') {
      continue;
    }

    vocabMap.set(word.hanzi, {
      hanzi: word.hanzi,
      traditional: word.tc_hanzi || word.hanzi,
      pinyin: word.pinyin || '',
      meaning: word.meaning,
      hsk: word.hsk ?? null
    });
  }

  const vocabulary = Array.from(vocabMap.values());

  // Determine series info
  let series: ParsedLesson['series'] = null;
  if (meta.has_course && meta.course && meta.course_position !== undefined) {
    series = {
      title: meta.course.title,
      chapter: meta.course_position,
      totalChapters: totalChapters || meta.course_position
    };
  }

  return {
    id: meta.id,
    title: meta.title,
    level: meta.level,
    date: (meta.release_at_formatted || meta.release_at || '') as string,
    synopsis: meta.synopsis,
    audioUrl: meta.audio_url,
    series,
    fullText: {
      simplified: simplifiedFull,
      traditional: traditionalFull
    },
    sentences,
    vocabulary,
    raw: crd
  };
}

/**
 * Format parsed lesson into AI-friendly text format
 */
export function formatLessonText(lesson: ParsedLesson): string {
  const lines: string[] = [];

  // Metadata section
  lines.push('=== LESSON METADATA ===');
  lines.push(`Title: ${lesson.title}`);
  lines.push(`Level: ${lesson.level}`);

  if (lesson.series) {
    lines.push(
      `Series: ${lesson.series.title} (Chapter ${lesson.series.chapter} of ${lesson.series.totalChapters})`
    );
  }

  lines.push(`Date: ${lesson.date}`);

  if (lesson.audioUrl) {
    lines.push(`Audio: ${lesson.audioUrl}`);
  }

  lines.push(`Synopsis: ${lesson.synopsis}`);
  lines.push('');

  // Full text sections
  lines.push('=== FULL TEXT (SIMPLIFIED) ===');
  lines.push(lesson.fullText.simplified);
  lines.push('');

  lines.push('=== FULL TEXT (TRADITIONAL) ===');
  lines.push(lesson.fullText.traditional);
  lines.push('');

  // Sentence by sentence
  lines.push('=== SENTENCE BY SENTENCE ===');
  lines.push('');

  for (const sentence of lesson.sentences) {
    lines.push(`[${sentence.index}]`);
    lines.push(`Simplified: ${sentence.simplified}`);
    lines.push(`Traditional: ${sentence.traditional}`);
    lines.push(`Pinyin: ${sentence.pinyin}`);
    lines.push(`English: ${sentence.english}`);
    lines.push('');
  }

  // Vocabulary
  lines.push('=== VOCABULARY ===');

  for (const entry of lesson.vocabulary) {
    let vocabLine = `${entry.hanzi} (${entry.pinyin}) - ${entry.meaning}`;
    if (entry.hsk !== null) {
      vocabLine += ` [HSK ${entry.hsk}]`;
    }
    lines.push(vocabLine);
  }

  return lines.join('\n');
}
