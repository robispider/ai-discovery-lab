import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { ResetButton } from '../kit';
import { Missions } from './Stage';
import { useRoute } from './store';

export function RouteControls() {
  const { bi } = useT();
  const setStep = useLab((s) => s.setStep);
  const speed = useRoute((s) => s.speed);
  const { setSpeed, reset, runAll } = useRoute.getState();
  return (
    <>
      <span className="eyebrow">{bi('Try these, in order', 'ক্রমানুসারে চেষ্টা করুন')}</span>
      <Missions onPick={(id) => setStep(id === 'west' || id === 'both' ? 'break' : 'train')} />
      <label className="rt-speed">
        <span aria-hidden="true">🐢</span>
        <input
          type="range"
          min={1}
          max={40}
          value={speed}
          aria-label={bi('Animation speed', 'অ্যানিমেশনের গতি')}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <span aria-hidden="true">🐇</span>
      </label>
      <div className="lab-row">
        <button
          type="button"
          className="btn"
          onClick={() => {
            runAll();
            setStep('evaluate');
          }}
        >
          ▶ {bi('Run all four', 'চারটিই চালান')}
        </button>
        <ResetButton onReset={reset} />
      </div>
    </>
  );
}
