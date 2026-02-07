import type { Sentence } from '../../types/reader';

interface SentenceBlockProps {
  sentence: Sentence;
  script: 'simplified' | 'traditional';
  showPinyin: boolean;
}

export default function SentenceBlock({ sentence, script, showPinyin }: SentenceBlockProps) {
  const chinese = script === 'simplified' ? sentence.simplified : sentence.traditional;

  return (
    <div className="py-3 space-y-1">
      {showPinyin && sentence.pinyin && (
        <div className="text-sm text-gray-400">{sentence.pinyin}</div>
      )}
      <div className="text-xl leading-relaxed text-gray-900">{chinese}</div>
      {sentence.english && (
        <div className="text-sm text-gray-500">{sentence.english}</div>
      )}
    </div>
  );
}
