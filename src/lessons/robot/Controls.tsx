import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';

export function RobotPanelControls() {
  const { bi } = useT();
  const setStep = useLab((s) => s.setStep);
  return (
    <div className="robot-actions">
      <button type="button" className="btn ghost" onClick={() => setStep('explore')}>
        {bi('Drive manually', 'নিজে চালান')}
      </button>
      <button type="button" className="btn ghost" onClick={() => setStep('train')}>
        {bi('Open training', 'প্রশিক্ষণ খুলুন')}
      </button>
      <button type="button" className="btn ghost" onClick={() => setStep('evaluate')}>
        {bi('Open comparison', 'তুলনা খুলুন')}
      </button>
    </div>
  );
}
