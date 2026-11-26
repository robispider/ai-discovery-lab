import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Presets, ResetButton } from '../kit';
import { useLlm } from './store';

export function LlmGuideControls() {
  const { bi } = useT();
  const setStep = useLab((s) => s.setStep);
  const { set, startRace, setWorkload, setArch, setPrompt, runTrace, reset } = useLlm.getState();
  return (
    <>
      <p className="try-note muted">
        {bi(
          'Four short chapters: what a model file is, the working desk, CPU vs GPU, and where your data goes.',
          'চারটি ছোট অধ্যায়: মডেল ফাইল কী, কাজের টেবিল, CPU বনাম GPU, আর আপনার তথ্য কোথায় যায়।',
        )}
      </p>
      <Presets
        items={[
          {
            label: bi('Race on AI math', 'এআই গণনায় প্রতিযোগিতা'),
            onPick: () => {
              setWorkload('ai');
              setStep('train');
              startRace();
            },
          },
          {
            label: bi('Sensitive data to the cloud', 'গোপন তথ্য ক্লাউডে'),
            brk: true,
            onPick: () => {
              setArch('cloud');
              setPrompt('sensitive');
              setStep('evaluate');
              runTrace();
            },
          },
          {
            label: bi('Overflow the desk', 'টেবিল উপচে দিন'),
            brk: true,
            onPick: () => {
              set({ ctxUsed: 30000, ctxLimit: 8000 });
              setStep('explore');
            },
          },
          {
            label: bi('70B at full precision', 'পূর্ণ সূক্ষ্মতায় ৭০B'),
            brk: true,
            onPick: () => {
              set({ model: '70b', quant: 'fp16' });
              setStep('understand');
            },
          },
        ]}
      />
      <ResetButton onReset={reset} />
    </>
  );
}
