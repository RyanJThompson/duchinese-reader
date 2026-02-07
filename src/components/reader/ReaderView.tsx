import type { Sentence } from '../../types/reader';
import type { AudioControls } from '../../hooks/useAudio';
import { usePreferences } from '../../context/PreferencesContext';
import SentenceBlock from './SentenceBlock';

interface ReaderViewProps {
  sentences: Sentence[];
  audio?: AudioControls;
}

export default function ReaderView({ sentences, audio }: ReaderViewProps) {
  const { script, showPinyin, showEnglish } = usePreferences();

  return (
    <div className="divide-y divide-gray-100">
      {sentences.map((s) => (
        <SentenceBlock
          key={s.index}
          sentence={s}
          script={script}
          showPinyin={showPinyin}
          showEnglish={showEnglish}
          onSeek={audio?.seek}
        />
      ))}
    </div>
  );
}
