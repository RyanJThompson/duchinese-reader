# Audio Seek Sync Fix

## Problem

Clicking the play button next to a sentence would seek the audio to the wrong position. The error grew worse for later sentences, drifting by up to 4+ seconds. The last sentence(s) in ~174 lessons had no seek button at all due to out-of-bounds array access.

## Root Cause

The DuChinese data has three relevant arrays in `raw`:

- **`syllable_times`** — end timestamps (seconds) for each syllable in the audio, indexed by syllable position
- **`sentence_indices`** — the starting position of each sentence, indexed by sentence number
- **`words`** — tokenized word entries, each with an optional `pinyin` field

The bug: `sentence_indices` contains **word indices** into the `words` array, not syllable indices into `syllable_times`. The original code used them directly as syllable indices:

```typescript
// WRONG: treats word index as syllable index
audioTime = syllableTimes[sentenceIndices[i]];
```

This works for the first few sentences by coincidence, but multi-syllable words (商店 = 1 word, 2 syllables) cause the two index spaces to diverge. The drift is cumulative — each multi-syllable word adds `(syllable_count - 1)` to the offset.

### Example: Lesson 1947

| Sentence | Word Index | Syllable Index | Drift |
|----------|-----------|---------------|-------|
| 1 "高天：Anne，中午好！" | 6 | 5 | 0 |
| 5 "高天：我去书店。" | 49 | 43 | +6 |
| 9 "高天：来，你呢？" | 97 | 89 | +8 |
| 11 "高天：明天见！" | 113 | 101 | +12 (was OOB) |

`syllable_times` has 106 entries, so word index 113 was out of bounds — no seek button appeared for the last sentence.

## Fix

Build a word-to-syllable mapping by counting pinyin tokens per word in `raw.words`:

```typescript
function buildWordToSyllableMap(words: Array<{ pinyin?: string }>): number[] {
  const map = [0];
  for (const w of words) {
    const count = w.pinyin ? w.pinyin.split(' ').length : 0;
    map.push(map[map.length - 1] + count);
  }
  return map;
}
```

Each word with pinyin contributes its syllable count (e.g., "商店" with pinyin "shāng diàn" → 2 syllables). Words without pinyin (punctuation, whitespace) contribute 0.

The mapping converts a word index to the syllable index of that word's first syllable:

```typescript
const wordIdx = sentenceIndices[i];       // word index from data
const sylIdx = wordToSyllable[wordIdx];   // convert to syllable index
audioTime = sylIdx > 0 ? syllableTimes[sylIdx - 1] : 0;  // end time of previous syllable = start of sentence
```

The `sylIdx - 1` is needed because `syllable_times` contains **end times**. The end of the previous syllable equals the start of the current one.

## Data Format Reference

### `syllable_times`

Array of cumulative end timestamps in seconds. Length equals the total syllable count across the title and all sentences.

- First value is never 0 (it's the end time of the first syllable, e.g., 0.36s)
- Max value approximately equals the audio duration
- Punctuation and whitespace words share the same timestamp as their neighbor (zero duration)

### `sentence_indices`

Array of word indices with one entry per sentence (including whitespace paragraph-break sentences). Maps 1:1 with `sentences[]`.

- `sentence_indices[0]` = word count of the title (title occupies the first N words)
- Even indices typically point to whitespace separator words (`\n`)
- Odd indices point to the first content word of a spoken sentence

### `words`

Tokenized word array. Each entry has:

- `hanzi` — simplified Chinese text (or punctuation/whitespace)
- `pinyin` (optional) — space-separated pinyin; absent for punctuation and whitespace
- `meaning`, `hsk`, `tc_hanzi`, `g` — other optional fields

## Verification

- 0 out-of-bounds cases remain across all 2,340 lessons (previously 174)
- All 38,306 content sentences now have valid audio timestamps
- Seek positions verified in browser: timestamps match expected values within 0.1s
