/**
 * build-epubs.ts — Generate EPUB ebooks from scraped DuChinese lesson data.
 *
 * For PERSONAL USE: produces clean simplified-Chinese EPUBs for reading in
 * Migaku's Reader (or any EPUB reader). The body is pure hanzi — no inline
 * pinyin or translations — so Migaku's own word segmentation, dictionary
 * lookups, and card creation work correctly.
 *
 * Structure:
 *   - One EPUB per course (chapters ordered by course_position)
 *   - Standalone lessons bundled into one EPUB per level
 *
 * Usage:
 *   pnpm build:epubs                     # build everything into ./epubs
 *   pnpm build:epubs --out my-ebooks     # custom output dir
 *   pnpm build:epubs --data public/data  # custom data dir
 *   pnpm build:epubs --limit 3           # only first 3 books (quick test)
 *   pnpm build:epubs --course "Tales of the Tang Dynasty"   # one course
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

// epub-gen-memory ships as CJS with the generator on `.default`; unwrap for ESM.
const require = createRequire(import.meta.url);
const epubMod = require('epub-gen-memory');
const epub: (options: Record<string, unknown>, content: { title: string; content: string }[]) => Promise<Buffer> =
  epubMod.default ?? epubMod;

// Patch the default EPUB3 package template to drop the standalone Table-of-Contents
// reading page from the spine. toc.xhtml (nav) and toc.ncx stay in the manifest, so
// readers — Migaku included — still get a chapter list in their navigation menu;
// there's just no extra page to flip past at the start of each book.
const CONTENT_OPF_NO_TOC_PAGE: string = (epubMod.optionsDefaults(3).contentOPF as string).replace(
  /[ \t]*<itemref idref="toc" \/>\s*\n/,
  '',
);

// ---- CLI args ----------------------------------------------------------------
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
const DATA_DIR = resolve(arg('data') ?? 'public/data');
const OUT_DIR = resolve(arg('out') ?? 'epubs');
const LIMIT = arg('limit') ? Number(arg('limit')) : undefined;
const ONLY_COURSE = arg('course');

// ---- Types (only the fields we use) ------------------------------------------
interface IndexEntry {
  id: string;
  title: string;
  level: string;
  course_title: string | null;
  course_position: number | null;
  release_at_formatted: string | null;
}
interface LessonFile {
  id: string;
  title: string;
  fullText: { simplified: string; traditional: string };
}

const LEVEL_ORDER = [
  'newbie',
  'elementary',
  'intermediate',
  'upper intermediate',
  'advanced',
  'master',
];
// Short codes used as a filename prefix, e.g. "[INT] Tales of the Tang Dynasty.epub".
const LEVEL_CODE: Record<string, string> = {
  newbie: 'NB',
  elementary: 'EL',
  intermediate: 'INT',
  'upper intermediate': 'UI',
  advanced: 'ADV',
  master: 'MST',
};

/** A single level code if a book is one level, or a "MIN-MAX" range if it spans several. */
function levelCode(entries: IndexEntry[]): string {
  const levels = [...new Set(entries.map((e) => e.level).filter(Boolean))].sort(
    (a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b),
  );
  if (levels.length === 0) return 'NA';
  const codes = levels.map((l) => LEVEL_CODE[l] ?? l.slice(0, 3).toUpperCase());
  return codes.length === 1 ? codes[0] : `${codes[0]}-${codes[codes.length - 1]}`;
}
const titleCase = (s: string) =>
  s.replace(/\b\w/g, (c) => c.toUpperCase());
const sanitize = (s: string) =>
  s.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim().slice(0, 120);
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---- Turn one lesson's simplified text into clean XHTML ----------------------
function lessonToXhtml(text: string, chapterNum: number): string {
  // English "Chapter X" eyebrow above the Chinese title. lang="en" keeps it out of
  // Migaku's Chinese word segmentation; the hanzi body below stays pure.
  const label = `<p class="chapter-label" lang="en">Chapter ${chapterNum}</p>`;
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  let body: string;
  if (lines.length === 0) {
    body = '<p>&#160;</p>';
  } else if (lines.length === 1) {
    body = `<p>${escapeHtml(lines[0])}</p>`;
  } else {
    const [heading, ...rest] = lines;
    body =
      `<h1 lang="zh-Hans">${escapeHtml(heading)}</h1>\n` +
      rest.map((l) => `<p>${escapeHtml(l)}</p>`).join('\n');
  }
  return label + '\n' + body;
}

interface Book {
  title: string;
  filename: string;
  entries: IndexEntry[];
}

function loadLesson(id: string): LessonFile | null {
  const p = join(DATA_DIR, 'lessons', `${id}.json`);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8')) as LessonFile;
  } catch {
    return null;
  }
}

const CSS = `
body { font-size: 1.1em; line-height: 1.9; }
.chapter-label { font-size: 0.8em; color: #888; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 0.2em; }
h1 { font-size: 1.35em; line-height: 1.5; margin: 0 0 0.8em; }
p { margin: 0.7em 0; text-indent: 0; }
`;

async function buildBook(book: Book): Promise<boolean> {
  const chapters: { title: string; content: string }[] = [];
  for (const entry of book.entries) {
    const lesson = loadLesson(entry.id);
    const text = lesson?.fullText?.simplified;
    if (!text || !text.trim()) continue;
    const chapterNum = chapters.length + 1; // sequential within the book, skips empties
    chapters.push({ title: entry.title || lesson?.title || entry.id, content: lessonToXhtml(text, chapterNum) });
  }
  if (chapters.length === 0) {
    console.warn(`  ⚠ skipped "${book.title}" — no readable chapters`);
    return false;
  }
  const buffer = await epub(
    {
      title: book.title,
      author: 'DuChinese',
      publisher: 'DuChinese (personal export)',
      lang: 'zh',
      tocTitle: 'Contents',
      prependChapterTitles: false, // we inject our own Chinese heading per chapter
      version: 3,
      contentOPF: CONTENT_OPF_NO_TOC_PAGE, // no standalone TOC reading page
      css: CSS,
      description: `Personal-use export of DuChinese lessons — ${chapters.length} chapters.`,
    },
    chapters,
  );
  writeFileSync(join(OUT_DIR, book.filename), buffer);
  console.log(`  ✓ ${book.filename}  (${chapters.length} chapters)`);
  return true;
}

async function main() {
  const indexPath = join(DATA_DIR, 'lessons.json');
  if (!existsSync(indexPath)) {
    console.error(`No index at ${indexPath}. Run the scraper first.`);
    process.exit(1);
  }
  const index: IndexEntry[] = JSON.parse(readFileSync(indexPath, 'utf8'));
  mkdirSync(OUT_DIR, { recursive: true });

  // --- Group into course books ---
  const courseMap = new Map<string, IndexEntry[]>();
  const standalone: IndexEntry[] = [];
  for (const e of index) {
    if (e.course_title) {
      (courseMap.get(e.course_title) ?? courseMap.set(e.course_title, []).get(e.course_title)!).push(e);
    } else {
      standalone.push(e);
    }
  }

  const books: Book[] = [];

  // Course books, chapters ordered by course_position (fallback: date, id)
  for (const [course, entries] of [...courseMap].sort((a, b) => a[0].localeCompare(b[0]))) {
    entries.sort(
      (a, b) =>
        (a.course_position ?? Infinity) - (b.course_position ?? Infinity) ||
        (a.release_at_formatted ?? '').localeCompare(b.release_at_formatted ?? '') ||
        a.id.localeCompare(b.id),
    );
    books.push({ title: course, filename: `[${levelCode(entries)}] ${sanitize(course)}.epub`, entries });
  }

  // Standalone bundled per level, chapters ordered by release date
  const byLevel = new Map<string, IndexEntry[]>();
  for (const e of standalone) {
    const lvl = e.level || 'uncategorized';
    (byLevel.get(lvl) ?? byLevel.set(lvl, []).get(lvl)!).push(e);
  }
  const sortedLevels = [...byLevel.keys()].sort(
    (a, b) => (LEVEL_ORDER.indexOf(a) + 1 || 99) - (LEVEL_ORDER.indexOf(b) + 1 || 99),
  );
  for (const lvl of sortedLevels) {
    const entries = byLevel.get(lvl)!;
    entries.sort(
      (a, b) =>
        (a.release_at_formatted ?? '').localeCompare(b.release_at_formatted ?? '') ||
        a.id.localeCompare(b.id),
    );
    const title = `DuChinese — Standalone — ${titleCase(lvl)}`;
    books.push({ title, filename: `[${levelCode(entries)}] DuChinese Standalone.epub`, entries });
  }

  // --- Filter / limit ---
  let selected = books;
  if (ONLY_COURSE) selected = books.filter((b) => b.title.toLowerCase().includes(ONLY_COURSE.toLowerCase()));
  if (LIMIT) selected = selected.slice(0, LIMIT);

  console.log(
    `Building ${selected.length} EPUB(s) from ${index.length} lessons` +
      ` (${courseMap.size} courses + ${sortedLevels.length} standalone level bundles)`,
  );
  console.log(`Output: ${OUT_DIR}\n`);

  let ok = 0;
  let chapters = 0;
  for (const book of selected) {
    const before = ok;
    if (await buildBook(book)) {
      ok++;
      chapters += book.entries.length;
    }
    void before;
  }
  console.log(`\nDone. ${ok} ebook(s) written to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
