import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Presets, ResetButton } from '../kit';
import { TrainControls } from './Stage';
import { useNextWord } from './store';

export function NextWordControls() {
  const { bi, lang } = useT();
  const setStep = useLab((s) => s.setStep);
  const { setN, trainNow, setTemp, setStart, reset, clearOut } = useNextWord.getState();
  const go = (fn: () => void) => () => {
    fn();
    setStep('break');
  };
  return (
    <>
      <TrainControls />
      <Presets
        items={[
          { label: bi('Untrained', 'অপ্রশিক্ষিত'), brk: true, onPick: go(() => reset(lang)) },
          {
            label: bi('Temperature 0.1', 'টেম্পারেচার ০.১'),
            brk: true,
            onPick: go(() => {
              if (!useNextWord.getState().model) trainNow();
              setTemp(0.1);
              clearOut();
            }),
          },
          {
            label: bi('2 words: copies', '২ শব্দ: নকল'),
            brk: true,
            onPick: go(() => {
              setN(2);
              trainNow();
            }),
          },
          {
            label: bi('Unknown start word', 'অজানা শুরুর শব্দ'),
            brk: true,
            onPick: go(() => {
              if (!useNextWord.getState().model) trainNow();
              setStart(lang === 'bn' ? 'চাঁদ' : 'the moon');
            }),
          },
        ]}
      />
      <ResetButton onReset={() => reset(lang)} />
    </>
  );
}
