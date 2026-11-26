import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Presets, ResetButton } from '../kit';
import { TrainButtons } from './Stage';
import { useRegression } from './store';

export function RegressionControls() {
  const { bi } = useT();
  const setStep = useLab((s) => s.setStep);
  const { setX, setSlider, setOutliers, reset } = useRegression.getState();
  return (
    <>
      <TrainButtons />
      <Presets
        items={[
          {
            label: bi('210k mega township', '২১০ হাজারের মেগা টাউনশিপ'),
            brk: true,
            onPick: () => {
              setX('pop');
              setSlider(210);
              setStep('understand');
            },
          },
          {
            label: bi('Predict from shops', 'দোকান দিয়ে অনুমান'),
            brk: true,
            onPick: () => {
              setX('biz');
              setStep('evaluate');
            },
          },
          {
            label: bi('Add 5 bazaars', '৫টি বাজার যোগ'),
            brk: true,
            onPick: () => {
              setOutliers(true);
              setStep('break');
            },
          },
        ]}
      />
      <ResetButton onReset={reset} />
    </>
  );
}
