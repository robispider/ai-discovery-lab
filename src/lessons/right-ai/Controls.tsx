import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Presets, ResetButton } from '../kit';
import { TrainSlider } from './Stage';
import { useRightAi } from './store';

export function RightAiControls() {
  const { bi, num } = useT();
  const setStep = useLab((s) => s.setStep);
  const { setNtrain, run, setMine, reset } = useRightAi.getState();
  return (
    <>
      <TrainSlider />
      <div className="lab-row">
        <button
          type="button"
          className="btn"
          onClick={() => {
            run();
            setStep('evaluate');
          }}
        >
          ▶ {bi('Run the comparison', 'তুলনা চালাও')}
        </button>
        <ResetButton onReset={reset} />
      </div>
      <Presets
        items={[
          {
            label: bi(`Only ${12} examples`, `মাত্র ${num(12)}টি উদাহরণ`),
            brk: true,
            onPick: () => {
              setNtrain(12);
              run();
              setStep('break');
            },
          },
          {
            label: bi('Banglish complaint', 'Banglish অভিযোগ'),
            brk: true,
            onPick: () => {
              setMine('amader elakay moyla porishkar hoy na');
              setStep('train');
            },
          },
        ]}
      />
    </>
  );
}
