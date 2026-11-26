import { DRAIN_AI_MODES, type DrainAiMode } from '../../engines/iot/drain';
import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Presets, ResetButton, Slider } from '../kit';
import { useDrainSensors } from './store';

const AI_SHORT: Record<DrainAiMode, [string, string]> = {
  rule: ['📏 Rule', '📏 নিয়ম'],
  tree: ['🌳 Tree', '🌳 ট্রি'],
  timeseries: ['📈 Trend AI', '📈 ট্রেন্ড এআই'],
  cloud: ['☁️ Cloud', '☁️ ক্লাউড'],
};

export function DrainSensorControls() {
  const { bi, num } = useT();
  const setStep = useLab((s) => s.setStep);
  const aiMode = useDrainSensors((s) => s.aiMode);
  const smoothWindow = useDrainSensors((s) => s.smoothWindow);
  const forecastAlarmCm = useDrainSensors((s) => s.forecastAlarmCm);
  const {
    setAiMode,
    setEpisode,
    setTick,
    tossPlastic,
    setClean,
    setThresholds,
    setFault,
    setGuards,
    setPlacementPreset,
    reset,
  } = useDrainSensors.getState();

  return (
    <div className="ds-controls">
      <div className="seg lab-choice" role="group" aria-label={bi('ESP32 AI brain', 'ESP32 এআই মস্তিষ্ক')}>
        {DRAIN_AI_MODES.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={aiMode === m}
            onClick={() => setAiMode(m)}
          >
            {bi(AI_SHORT[m][0], AI_SHORT[m][1])}
          </button>
        ))}
      </div>

      <Presets
        items={[
          {
            label: bi('🌊 Monsoon surge (+30m AI)', '🌊 বর্ষার ঢল (+৩০মি এআই)'),
            onPick: () => {
              setFault('none');
              setAiMode('timeseries');
              setEpisode('te-1');
              setTick(13);
              setStep('understand');
            },
          },
          {
            label: bi('🧴 Plastic fools IF–THEN Rule', '🧴 প্লাস্টিক বোতলে নিয়মের ভুল'),
            onPick: () => {
              setFault('none');
              setAiMode('rule');
              setEpisode('te-2');
              setTick(12);
              tossPlastic();
              setStep('understand');
            },
            brk: true,
          },
          {
            label: bi('Mud-covered stuck sensor', 'কাদায় আটকে যাওয়া সেন্সর'),
            onPick: () => {
              setEpisode('te-1');
              setFault('stuck');
              setGuards({ healthGuard: false, edgeFallback: false });
              setStep('break');
            },
            brk: true,
          },
          {
            label: bi('📵 4G blackout kills Cloud AI', '📵 নেটওয়ার্ক বন্ধে ক্লাউড অচল'),
            onPick: () => {
              setAiMode('cloud');
              setFault('dropout');
              setStep('understand');
            },
            brk: true,
          },
          {
            label: bi('🏛️ VIP-avenue only sensors', '🏛️ শুধু ভিআইপি সড়কে সেন্সর'),
            onPick: () => {
              setPlacementPreset('vip');
              setStep('break');
            },
            brk: true,
          },
        ]}
      />

      <Slider
        label={bi('Smoothing window', 'স্মুথিং উইন্ডো')}
        value={smoothWindow}
        min={1}
        max={7}
        step={1}
        format={(v) => `${num(v)} (${num(v * 5)}m)`}
        onChange={(v) => setClean({ smoothWindow: v })}
      />

      <Slider
        label={bi('AI +30m pump trigger', 'এআই +৩০মি পাম্প সীমা')}
        value={forecastAlarmCm}
        min={72}
        max={90}
        step={1}
        format={(v) => `${num(v)} cm`}
        onChange={(v) => setThresholds({ forecastAlarmCm: v })}
      />

      <div className="lab-row">
        <button type="button" className="btn ghost" onClick={() => setStep('evaluate')}>
          {bi('Compare 4 AIs', '৪টি এআই তুলনা')}
        </button>
        <ResetButton onReset={reset} />
      </div>
    </div>
  );
}
