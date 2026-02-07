import { authenticate } from './auth';
import { fetchAllLessons, fetchCrd, processBatch } from './api';
import type { LessonMeta } from './api';
import { parseCrd, formatLessonText } from './parser';
import {
  ensureOutputDirs,
  writeMasterIndex,
  writeLessonJson,
  writeLessonText,
  writeSeriesText,
  writeSeriesInfo,
  lessonJsonExists,
  slugify,
} from './writer';

interface CliOptions {
  level?: string;
  limit?: number;
  outputDir: string;
  concurrency: number;
  skipExisting: boolean;
  noText: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    outputDir: 'output',
    concurrency: 10,
    skipExisting: false,
    noText: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--level':
        options.level = args[++i];
        break;
      case '--limit':
        options.limit = parseInt(args[++i], 10);
        break;
      case '--output-dir':
        options.outputDir = args[++i];
        break;
      case '--concurrency':
        options.concurrency = parseInt(args[++i], 10);
        break;
      case '--skip-existing':
        options.skipExisting = true;
        break;
      case '--no-text':
        options.noText = true;
        break;
      case '--help':
        console.log(`
DuChinese Lesson Scraper

Usage: npx tsx scraper/src/index.ts [options]

Options:
  --level <name>        Filter by level (e.g., "newbie", "intermediate", "master")
  --limit <n>           Limit number of lessons to process
  --output-dir <path>   Output directory (default: "output")
  --concurrency <n>     Concurrent CRD downloads (default: 10)
  --skip-existing       Skip lessons that already have JSON output
  --no-text             Skip text file outputs (by-level, by-series, series-info)
  --help                Show this help message
`);
        process.exit(0);
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  const startTime = Date.now();

  console.log('=== DuChinese Lesson Scraper ===\n');

  // Step 1: Authenticate
  console.log('Step 1: Authenticating...');
  const email = process.env.DUCHINESE_EMAIL;
  const password = process.env.DUCHINESE_PASSWORD;

  if (!email || !password) {
    console.error('Error: Set DUCHINESE_EMAIL and DUCHINESE_PASSWORD environment variables');
    console.error('Usage: DUCHINESE_EMAIL=you@example.com DUCHINESE_PASSWORD=yourpass pnpm scrape');
    process.exit(1);
  }

  const cookies = await authenticate(email, password);
  console.log('Authenticated successfully.\n');

  // Step 2: Fetch all lesson metadata
  console.log('Step 2: Fetching lesson index...');
  let lessons = await fetchAllLessons(cookies);
  console.log(`Found ${lessons.length} total lessons.\n`);

  // Apply filters
  if (options.level) {
    const levelFilter = options.level.toLowerCase();
    lessons = lessons.filter(l => l.level.toLowerCase() === levelFilter);
    console.log(`Filtered to ${lessons.length} lessons at level "${options.level}"`);
  }

  if (options.limit) {
    lessons = lessons.slice(0, options.limit);
    console.log(`Limited to ${options.limit} lessons`);
  }

  // Step 3: Set up output directories and write master index
  console.log('\nStep 3: Setting up output directories...');
  await ensureOutputDirs(options.outputDir, options.noText);
  await writeMasterIndex(options.outputDir, lessons);
  console.log('Master index written.\n');

  // Pre-compute series chapter counts
  const seriesChapterCounts = new Map<string, number>();
  const seriesLessons = new Map<string, LessonMeta[]>();

  for (const lesson of lessons) {
    if (lesson.has_course && lesson.course) {
      const slug = lesson.course.slug;
      const current = seriesChapterCounts.get(slug) || 0;
      const pos = lesson.course_position || 0;
      seriesChapterCounts.set(slug, Math.max(current, pos));

      if (!seriesLessons.has(slug)) {
        seriesLessons.set(slug, []);
      }
      seriesLessons.get(slug)!.push(lesson);
    }
  }

  // Step 4: Process each lesson
  console.log('Step 4: Processing lessons...\n');
  let processed = 0;
  let skipped = 0;
  let failed = 0;
  const total = lessons.length;
  const errors: { id: number; title: string; error: string }[] = [];

  await processBatch(lessons, options.concurrency, async (lesson) => {
    const idx = processed + skipped + failed + 1;

    // Skip existing if requested
    if (options.skipExisting) {
      const exists = await lessonJsonExists(options.outputDir, lesson.id);
      if (exists) {
        skipped++;
        return;
      }
    }

    const seriesInfo = lesson.has_course && lesson.course
      ? ` (${lesson.course.title} ch. ${lesson.course_position})`
      : '';

    console.log(`[${idx}/${total}] Processing: ${lesson.title}${seriesInfo}...`);

    try {
      // Skip locked lessons (no CRD access)
      if (lesson.locked) {
        console.log(`  → Skipped (locked)`);
        skipped++;
        return;
      }

      if (!lesson.crd_url) {
        console.log(`  → Skipped (no CRD URL)`);
        skipped++;
        return;
      }

      // Fetch CRD data
      const crd = await fetchCrd(lesson.crd_url);

      // Get total chapters for this series
      const totalChapters = lesson.has_course && lesson.course
        ? seriesChapterCounts.get(lesson.course.slug)
        : undefined;

      // Parse
      const parsed = parseCrd(crd, lesson, totalChapters);

      // Write JSON output
      await writeLessonJson(options.outputDir, parsed);

      // Write text outputs unless --no-text
      if (!options.noText) {
        const text = formatLessonText(parsed);
        await writeLessonText(options.outputDir, parsed, text);

        if (parsed.series) {
          await writeSeriesText(options.outputDir, parsed, text);
        }
      }

      processed++;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`  → FAILED: ${errorMsg}`);
      errors.push({ id: lesson.id, title: lesson.title, error: errorMsg });
      failed++;
    }
  });

  // Step 5: Write series info files (unless --no-text)
  if (!options.noText) {
    console.log('\nStep 5: Writing series info files...');

    for (const [slug, members] of seriesLessons.entries()) {
      const firstMember = members[0];
      if (!firstMember.course) continue;

      const seriesSlug = slugify(firstMember.course.title);
      const chapters = members
        .filter(m => m.course_position !== undefined)
        .sort((a, b) => (a.course_position || 0) - (b.course_position || 0))
        .map(m => ({
          position: m.course_position || 0,
          title: m.title,
        }));

      await writeSeriesInfo(
        options.outputDir,
        seriesSlug,
        firstMember.course.title,
        firstMember.course.description || '',
        chapters,
      );
    }
  }

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n=== COMPLETE ===');
  console.log(`Processed: ${processed}`);
  console.log(`Skipped:   ${skipped}`);
  console.log(`Failed:    ${failed}`);
  console.log(`Total:     ${total}`);
  console.log(`Time:      ${elapsed}s`);

  if (errors.length > 0) {
    console.log('\nFailed lessons:');
    for (const e of errors) {
      console.log(`  - [${e.id}] ${e.title}: ${e.error}`);
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
