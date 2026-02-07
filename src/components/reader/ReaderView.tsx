import type { Sentence } from '../../types/reader';
import { usePreferences } from '../../context/PreferencesContext';
import SentenceBlock from './SentenceBlock';

interface ReaderViewProps {
  sentences: Sentence[];
}

export default function ReaderView({ sentences }: ReaderViewProps) {
  const { script, showPinyin } = usePreferences();

  return (
    <div className="divide-y divide-gray-100">
      {sentences.map((s) => (
        <SentenceBlock
          key={s.index}
          sentence={s}
          script={script}
          showPinyin={showPinyin}
        />
      ))}
    </div>
  );
}
