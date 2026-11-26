import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';

export function PlaygroundLink({ primary = false }: { primary?: boolean }) {
  const { t } = useT();
  return (
    <a
      className={primary ? 'btn' : 'btn ghost'}
      href="https://playground.tensorflow.org/"
      target="_blank"
      rel="noopener noreferrer"
    >
      {t('stage.openTool', { tool: 'TensorFlow Playground' })} ↗
    </a>
  );
}

export function NeuralControls() {
  const { bi } = useT();
  const setStep = useLab((s) => s.setStep);
  return (
    <div className="lab-row">
      <button type="button" className="btn ghost" onClick={() => setStep('understand')}>
        {bi('One neuron', 'একটি নিউরন')}
      </button>
      <button type="button" className="btn ghost" onClick={() => setStep('train')}>
        {bi('Live training', 'সরাসরি প্রশিক্ষণ')}
      </button>
      <button type="button" className="btn ghost" onClick={() => setStep('break')}>
        {bi('Hidden layer', 'মাঝের স্তর')}
      </button>
      <PlaygroundLink />
    </div>
  );
}
