import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Presets, ResetButton } from '../kit';
import { TrainSliders } from './Stage';
import { useTree } from './store';

export function TreeControls() {
  const { bi, num } = useT();
  const setStep = useLab((s) => s.setStep);
  const { setDepth, setSplit, setBias, runSweep, reset } = useTree.getState();
  return (
    <>
      <TrainSliders />
      <Presets
        items={[
          {
            label: bi(`Depth ${12}: overfit`, `গভীরতা ${num(12)}: ওভারফিট`),
            brk: true,
            onPick: () => {
              setDepth(12);
              runSweep();
              setStep('evaluate');
            },
          },
          {
            label: bi('Only 40 study days', 'মাত্র ৪০টি পড়ার দিন'),
            brk: true,
            onPick: () => {
              setSplit(5);
              setStep('break');
            },
          },
          {
            label: bi('Biased records', 'পক্ষপাতদুষ্ট রেকর্ড'),
            brk: true,
            onPick: () => {
              setBias(true);
              setStep('break');
            },
          },
        ]}
      />
      <ResetButton onReset={reset} />
    </>
  );
}
