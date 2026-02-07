import { useMemo } from 'react';
import type { Sentence } from '../../types/reader';
import type { AudioControls } from '../../hooks/useAudio';
import { usePreferences } from '../../context/usePreferences';
import SentenceBlock from './SentenceBlock';

interface ReaderViewProps {
  sentences: Sentence[];
  audio?: AudioControls;
}

export default function ReaderView({ sentences, audio }: ReaderViewProps) {
  const { script, showPinyin, showEnglish } = usePreferences();

  const activeSentenceIndex = useMemo(() => {
    if (!audio?.playing) return -1;
    const t = audio.currentTime;
    let active = -1;
    for (let i = 0; i < sentences.length; i++) {
      if (sentences[i].audioTime != null && sentences[i].audioTime! <= t) {
        active = i;
      }
    }
    return active;
  }, [audio?.playing, audio?.currentTime, sentences]);

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {sentences.map((s, i) => (
        <SentenceBlock
          key={s.index}
          sentence={s}
          script={script}
          showPinyin={showPinyin}
          showEnglish={showEnglish}
          onSeek={audio?.seek}
          onPause={audio?.toggle}
          isActive={i === activeSentenceIndex}
        />
      ))}
    </div>
  );
}
