import fs from 'node:fs';
import path from 'node:path';
import { mapLesson } from '../src/adapters/duchinese/mappers';
import type { RawLesson } from '../src/adapters/duchinese/types';

const fixtureDir = path.resolve('public/data/lessons');
const crashFixtures = ['843.json', 'T110.json'];

function readFixture(file: string): RawLesson {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, file), 'utf-8')) as RawLesson;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

for (const fixture of crashFixtures) {
  const lesson = mapLesson(readFixture(fixture));
  assert(lesson.sentences.length > 0, `${fixture} should map sentences`);
}

console.log('Reader verification passed.');
