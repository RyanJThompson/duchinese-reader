/**
 * API module for DuChinese scraper
 * Handles all HTTP requests to DuChinese and CDN endpoints
 */

// ============================================================================
// Types
// ============================================================================

export interface LessonMeta {
  id: number;
  title: string;
  level: string;
  synopsis: string;
  crd_url: string;
  audio_url: string | null;
  has_course: boolean;
  course?: {
    title: string;
    slug: string;
    description?: string;
  };
  course_position?: number;
  locked: boolean;
  publication_date: string;
  slug: string;
  // allow additional fields
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

// ============================================================================
// Constants
// ============================================================================

const LESSONS_BASE_URL = 'https://duchinese.net/lessons.json';
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

export async function fetchAllLessons(cookies: string): Promise<LessonMeta[]> {
  const allLessons: LessonMeta[] = [];
  let currentUrl: string | null = LESSONS_BASE_URL;
  let pageNumber = 1;

  while (currentUrl !== null) {
    console.log(`Fetching lessons page ${pageNumber}...`);

    const response = await fetchWithRetry(currentUrl, {
      headers: {
        'Cookie': cookies,
        'Accept': 'application/json',
        'User-Agent': 'DuChinese-Scraper/1.0'
      }
    });

    const data = await response.json() as LessonsResponse;

    if (!Array.isArray(data.lessons)) {
      throw new Error(`Invalid response format: expected 'lessons' array`);
    }

    allLessons.push(...data.lessons);
    console.log(`  → Fetched ${data.lessons.length} lessons (total: ${allLessons.length})`);

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

  console.log(`\nCompleted: fetched ${allLessons.length} lessons across ${pageNumber - 1} pages`);
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
