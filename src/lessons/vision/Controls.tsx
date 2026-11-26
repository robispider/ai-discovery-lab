import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Presets, ResetButton, Slider } from '../kit';
import { useVision } from './store';

export const TEACHABLE_MACHINE_URL = 'https://teachablemachine.withgoogle.com/train/image';

export function TeachableMachineLink({ primary = false }: { primary?: boolean }) {
  const { t } = useT();
  return (
    <a
      className={primary ? 'btn' : 'btn ghost'}
      href={TEACHABLE_MACHINE_URL}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t('stage.openTool', { tool: 'Teachable Machine' })} ↗
    </a>
  );
}

export function VisionControls() {
  const { bi, num } = useT();
  const setStep = useLab((s) => s.setStep);
  const minConfidence = useVision((s) => s.minConfidence);
  const { applyBreakPreset, loadSamplePreset, setMinConfidence, reset } = useVision.getState();

  return (
    <div className="vis-controls">
      <Presets
        items={[
          {
            label: bi('♻️ Healthy belt', '♻️ সুস্থ কনভেয়ার বেল্ট'),
            onPick: () => {
              applyBreakPreset('healthy');
              setStep('understand');
            },
          },
          {
            label: bi('⚖️ Imbalanced samples', '⚖️ অসম নমুনার ফাঁদ'),
            onPick: () => {
              loadSamplePreset('imbalanced');
              setStep('train');
            },
            brk: true,
          },
          {
            label: bi('🥫 Unseen metal can', '🥫 অদেখা ধাতব ক্যান'),
            onPick: () => {
              applyBreakPreset('metal-can');
              setStep('break');
            },
            brk: true,
          },
          {
            label: bi('🌿 Blue-tray shortcut', '🌿 নীল ট্রে শর্টকাট'),
            onPick: () => {
              applyBreakPreset('blue-tray');
              setStep('break');
            },
            brk: true,
          },
          {
            label: bi('🌙 Dim evening light', '🌙 সন্ধ্যার কম আলো'),
            onPick: () => {
              applyBreakPreset('dim-light');
              setStep('break');
            },
            brk: true,
          },
        ]}
      />

      <Slider
        label={bi('Manual-review confidence cutoff', 'মানুষের যাচাইয়ের আত্মবিশ্বাস সীমা')}
        value={Math.round(minConfidence * 100)}
        min={50}
        max={95}
        step={5}
        format={(v) => `${num(v)}%`}
        onChange={(v) => setMinConfidence(v / 100)}
      />

      <div className="lab-row">
        <TeachableMachineLink />
        <ResetButton onReset={reset} />
      </div>
    </div>
  );
}
