/**
 * API module for DuChinese scraper
 * Handles all HTTP requests to DuChinese and CDN endpoints
 */

// ============================================================================
// Types
// ============================================================================

export interface LessonMeta {
  id: string;
  title: string;
  level: string;
  synopsis: string;
  crd_url: string;
  audio_url: string | null;
  has_course: boolean;
  course?: CourseMeta;
  course_path?: string | null;
  course_title?: string | null;
  course_type?: string | null;
  course_position?: number;
  locked: boolean;
  publication_date: string;
  slug: string;
  // allow additional fields
  [key: string]: unknown;
}

export interface CourseMeta {
  id: number;
  title: string;
  description?: string;
  group?: string;
  path?: string;
  lessons_url?: string;
  lesson_count?: number;
  type?: string;
  slug?: string;
  [key: string]: unknown;
}

export interface CrdWord {
  hanzi: string;
  tc_hanzi?: string;
  pinyin?: string;
  meaning?: string;
  hsk?: number;
}

export interface CrdData {
  words: CrdWord[];
  sentence_indices: number[];
  sentence_translations: string[];
  syllable_times?: number[][];
  version?: number;
  [key: string]: unknown;
}

interface LessonsResponse {
  lessons: LessonMeta[];
  next_page_url: string | null;
}

interface CoursesResponse {
  courses: CourseMeta[];
  next_page_url: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const LESSONS_BASE_URL = 'https://duchinese.net/lessons.json';
const COURSES_BASE_URL = 'https://duchinese.net/lessons/courses.json';
const COURSE_CATEGORIES = ['courses', 'article_collections', 'short_stories'] as const;
const COURSE_FEED_CONCURRENCY = 8;
const PAGE_DELAY_MS = 100;
const DEFAULT_RETRIES = 3;

// ============================================================================
// Utility: Delay
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Utility: Fetch with Retry
// ============================================================================

export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries: number = DEFAULT_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(`Fetch failed (attempt ${attempt + 1}/${retries + 1}): ${lastError.message}`);
        console.warn(`Retrying in ${backoffMs}ms...`);
        await delay(backoffMs);
      }
    }
  }

  throw new Error(`Fetch failed after ${retries + 1} attempts: ${lastError?.message}`);
}

// ============================================================================
// Utility: Process Batch with Concurrency Control
// ============================================================================

export async function processBatch<T>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<void>
): Promise<void> {
  const queue = [...items];
  const workers: Promise<void>[] = [];

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item !== undefined) {
        await processor(item);
      }
    }
  }

  // Spawn N concurrent workers
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
}

// ============================================================================
// API: Fetch All Lessons
// ============================================================================

function authHeaders(cookies: string): HeadersInit {
  return {
    'Cookie': cookies,
    'Accept': 'application/json',
    'User-Agent': 'DuChinese-Scraper/1.0'
  };
}

async function fetchLessonPages(
  startUrl: string,
  cookies: string,
  label: string
): Promise<LessonMeta[]> {
  const lessons: LessonMeta[] = [];
  let currentUrl: string | null = startUrl;
  let pageNumber = 1;

  while (currentUrl !== null) {
    console.log(`Fetching ${label} page ${pageNumber}...`);

    const response = await fetchWithRetry(currentUrl, {
      headers: authHeaders(cookies)
    });

    const data = await response.json() as LessonsResponse;

    if (!Array.isArray(data.lessons)) {
      throw new Error(`Invalid response format: expected 'lessons' array`);
    }

    lessons.push(...data.lessons);
    console.log(`  → Fetched ${data.lessons.length} lessons (total: ${lessons.length})`);

    // next_page_url may be relative — resolve against base
    currentUrl = data.next_page_url
      ? new URL(data.next_page_url, 'https://duchinese.net').href
      : null;
    pageNumber++;

    // Be polite: add delay between page requests
    if (currentUrl !== null) {
      await delay(PAGE_DELAY_MS);
    }
  }

  console.log(`Completed: fetched ${lessons.length} ${label} lessons across ${pageNumber - 1} pages`);
  return lessons;
}

async function fetchCoursePages(
  startUrl: string,
  cookies: string,
  label: string
): Promise<CourseMeta[]> {
  const courses: CourseMeta[] = [];
  let currentUrl: string | null = startUrl;
  let pageNumber = 1;

  while (currentUrl !== null) {
    console.log(`Fetching ${label} course page ${pageNumber}...`);

    const response = await fetchWithRetry(currentUrl, {
      headers: authHeaders(cookies)
    });

    const data = await response.json() as CoursesResponse;

    if (!Array.isArray(data.courses)) {
      throw new Error(`Invalid response format: expected 'courses' array`);
    }

    courses.push(...data.courses);
    console.log(`  → Fetched ${data.courses.length} courses (total: ${courses.length})`);

    currentUrl = data.next_page_url
      ? new URL(data.next_page_url, 'https://duchinese.net').href
      : null;
    pageNumber++;

    if (currentUrl !== null) {
      await delay(PAGE_DELAY_MS);
    }
  }

  console.log(`Completed: fetched ${courses.length} ${label} courses across ${pageNumber - 1} pages`);
  return courses;
}

function courseKey(course: CourseMeta): string {
  return course.path || String(course.id);
}

function lessonKey(lesson: LessonMeta): string {
  return String(lesson.id);
}

export async function fetchAllLessons(cookies: string): Promise<LessonMeta[]> {
  const lessonsById = new Map<string, LessonMeta>();
  const addLessons = (lessons: LessonMeta[]) => {
    let added = 0;
    for (const lesson of lessons) {
      const key = lessonKey(lesson);
      if (!lessonsById.has(key)) added++;
      lessonsById.set(key, lesson);
    }
    return added;
  };

  const topLevelLessons = await fetchLessonPages(LESSONS_BASE_URL, cookies, 'lesson index');
  addLessons(topLevelLessons);

  const coursesByKey = new Map<string, CourseMeta>();
  for (const category of COURSE_CATEGORIES) {
    const url = `${COURSES_BASE_URL}?category=${category}`;
    const courses = await fetchCoursePages(url, cookies, category);
    for (const course of courses) {
      coursesByKey.set(courseKey(course), course);
    }
  }

  const courseFeeds = Array.from(coursesByKey.values()).filter(
    (course): course is CourseMeta & { lessons_url: string } => typeof course.lessons_url === 'string'
  );
  console.log(`\nFetching lessons from ${courseFeeds.length} course-specific feeds...`);
  await processBatch(courseFeeds, COURSE_FEED_CONCURRENCY, async (course) => {
    const url = new URL(course.lessons_url, 'https://duchinese.net').href;
    const courseLessons = await fetchLessonPages(url, cookies, `course "${course.title}"`);
    const added = addLessons(courseLessons);
    console.log(`  → Added ${added} new lessons from "${course.title}"`);
  });

  const allLessons = Array.from(lessonsById.values());
  console.log(`\nCompleted: fetched ${allLessons.length} unique lessons across lesson and course feeds`);
  return allLessons;
}

// ============================================================================
// API: Fetch CRD Data
// ============================================================================

export async function fetchCrd(crdUrl: string): Promise<CrdData> {
  // CDN files are public - no auth needed
  const response = await fetchWithRetry(crdUrl, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'DuChinese-Scraper/1.0'
    }
  });

  const data = await response.json() as CrdData;

  // Validate required fields
  if (!Array.isArray(data.words)) {
    throw new Error(`Invalid CRD format: missing 'words' array`);
  }
  if (!Array.isArray(data.sentence_indices)) {
    throw new Error(`Invalid CRD format: missing 'sentence_indices' array`);
  }
  if (!Array.isArray(data.sentence_translations)) {
    throw new Error(`Invalid CRD format: missing 'sentence_translations' array`);
  }

  return data;
}
