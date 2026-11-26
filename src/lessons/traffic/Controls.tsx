import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Presets, ResetButton } from '../kit';
import { Playback } from './Stage';
import { useTraffic } from './store';

export function TrafficPanelControls() {
  const { bi, num } = useT();
  const setStep = useLab((s) => s.setStep);
  const training = useTraffic((s) => s.batch !== null);
  const episodes = useTraffic((s) => s.episodes);
  const { train, setMainOnly, setPattern, burst, reset, play } = useTraffic.getState();
  return (
    <>
      <Playback />
      <div className="lab-row">
        <button
          type="button"
          className="btn"
          disabled={training}
          onClick={() => {
            train();
            setStep('train');
          }}
        >
          ⚡ {bi('Train 30 episodes', '৩০টি পর্বে শেখান')}
        </button>
        <span className="muted tr-small">{bi(`${episodes} trained`, `${num(episodes)}টি শেখানো`)}</span>
      </div>
      <Presets
        items={[
          {
            label: bi('Reward: main road only', 'পুরস্কার: শুধু প্রধান রাস্তা'),
            brk: true,
            onPick: () => {
              setMainOnly(true);
              setStep('break');
            },
          },
          {
            label: bi('Side-road rush', 'পাশের রাস্তায় ভিড়'),
            brk: true,
            onPick: () => {
              setPattern('side');
              setStep('explore');
            },
          },
          {
            label: bi('+5 cars on E–W', 'পূ–পে +৫ গাড়ি'),
            brk: true,
            onPick: () => {
              burst(1);
              play(true);
              setStep('evaluate');
            },
          },
        ]}
      />
      <ResetButton onReset={reset} />
    </>
  );
}
