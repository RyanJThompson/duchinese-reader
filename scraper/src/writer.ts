import fs from 'node:fs/promises';
import path from 'node:path';
import type { LessonMeta } from './api';
import type { ParsedLesson } from './parser';

/**
 * Convert text to URL-friendly slug
 */
export function slugify(text: string): string {
  // Check if text is mostly Chinese characters
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g);
  const isMostlyChinese = chineseChars && chineseChars.length > text.length * 0.5;

  if (isMostlyChinese) {
    // For Chinese text, keep Chinese characters and convert to lowercase
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // For non-Chinese text, standard slugification
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Create all required output directories
 */
export async function ensureOutputDirs(outputDir: string, noText: boolean = false): Promise<void> {
  const dirs = [
    path.join(outputDir, 'lessons'),
  ];

  if (!noText) {
    dirs.push(
      path.join(outputDir, 'by-level', 'newbie'),
      path.join(outputDir, 'by-level', 'elementary'),
      path.join(outputDir, 'by-level', 'intermediate'),
      path.join(outputDir, 'by-level', 'upper-intermediate'),
      path.join(outputDir, 'by-level', 'advanced'),
      path.join(outputDir, 'by-level', 'master'),
    );
  }

  await Promise.all(dirs.map(dir => fs.mkdir(dir, { recursive: true })));
}

/**
 * Write master index of all lessons
 */
export async function writeMasterIndex(
  outputDir: string,
  lessons: LessonMeta[]
): Promise<void> {
  const filepath = path.join(outputDir, 'lessons.json');
  await fs.writeFile(filepath, JSON.stringify(lessons, null, 2), 'utf-8');
}

/**
 * Write individual lesson JSON
 */
export async function writeLessonJson(
  outputDir: string,
  lesson: ParsedLesson
): Promise<void> {
  const filepath = path.join(outputDir, 'lessons', `${lesson.id}.json`);
  await fs.writeFile(filepath, JSON.stringify(lesson, null, 2), 'utf-8');
}

/**
 * Write lesson text file organized by level
 */
export async function writeLessonText(
  outputDir: string,
  lesson: ParsedLesson,
  text: string
): Promise<void> {
  // Normalize level name for directory (e.g., "Upper Intermediate" → "upper-intermediate")
  const levelDir = lesson.level.toLowerCase().replace(/\s+/g, '-');
  const slug = slugify(lesson.title);
  const filename = `${lesson.id}-${slug}.txt`;
  const filepath = path.join(outputDir, 'by-level', levelDir, filename);

  await fs.writeFile(filepath, text, 'utf-8');
}

/**
 * Write lesson text file organized by series
 */
export async function writeSeriesText(
  outputDir: string,
  lesson: ParsedLesson,
  text: string
): Promise<void> {
  if (!lesson.series) {
    return;
  }

  const seriesSlug = slugify(lesson.series.title);
  const seriesDir = path.join(outputDir, 'by-series', seriesSlug);

  // Ensure series directory exists
  await fs.mkdir(seriesDir, { recursive: true });

  // Zero-pad chapter number
  const chapterNum = lesson.series.chapter.toString().padStart(2, '0');
  const lessonSlug = slugify(lesson.title);
  const filename = `${chapterNum}-${lessonSlug}.txt`;
  const filepath = path.join(seriesDir, filename);

  await fs.writeFile(filepath, text, 'utf-8');
}

/**
 * Write series information file
 */
export async function writeSeriesInfo(
  outputDir: string,
  seriesSlug: string,
  seriesTitle: string,
  description: string,
  chapters: { position: number; title: string }[]
): Promise<void> {
  const seriesDir = path.join(outputDir, 'by-series', seriesSlug);

  // Ensure series directory exists
  await fs.mkdir(seriesDir, { recursive: true });

  // Format series info
  let content = `=== SERIES: ${seriesTitle} ===\n`;
  content += `${description}\n\n`;
  content += `=== CHAPTERS ===\n`;

  for (const chapter of chapters) {
    content += `${chapter.position}. ${chapter.title}\n`;
  }

  const filepath = path.join(seriesDir, '_series-info.txt');
  await fs.writeFile(filepath, content, 'utf-8');
}

/**
 * Check if a lesson JSON file already exists
 */
export async function lessonJsonExists(
  outputDir: string,
  lessonId: number
): Promise<boolean> {
  const filepath = path.join(outputDir, 'lessons', `${lessonId}.json`);
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}
