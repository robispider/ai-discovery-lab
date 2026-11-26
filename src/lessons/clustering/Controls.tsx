import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Presets, ResetButton } from '../kit';
import { RunControls } from './Stage';
import { useCluster } from './store';

export function ClusterControls() {
  const { bi, num } = useT();
  const setStep = useLab((s) => s.setStep);
  const scale = useCluster((s) => s.scale);
  const { setK, setScale, finish, reset } = useCluster.getState();
  const preset = (k: number, withScale: boolean) => () => {
    setK(k);
    if (withScale !== useCluster.getState().scale) setScale(withScale);
    finish();
    setStep('break');
  };
  return (
    <>
      <RunControls />
      <label className="cl-check">
        <input type="checkbox" checked={!scale} onChange={(e) => setScale(!e.target.checked)} />
        <span>{bi('Turn off scaling', 'স্কেলিং বন্ধ করুন')}</span>
      </label>
      <Presets
        items={[
          { label: bi('No scaling', 'স্কেলিং ছাড়া'), onPick: preset(4, false), brk: true },
          { label: `k = ${num(2)}`, onPick: preset(2, true), brk: true },
          { label: `k = ${num(8)}`, onPick: preset(8, true), brk: true },
        ]}
      />
      <ResetButton onReset={reset} />
    </>
  );
}
