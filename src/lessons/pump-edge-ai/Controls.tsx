import { PUMP_AI_MODES, type PumpAiMode } from '../../engines/iot/pump';
import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Presets, ResetButton, Slider } from '../kit';
import { usePumpEdge } from './store';

const AI_SHORT: Record<PumpAiMode, [string, string]> = {
  threshold: ['📏 Rule', '📏 নিয়ম'],
  zscore: ['🎯 Z-Score', '🎯 জেড-স্কোর'],
  centroid: ['🧭 Centroid', '🧭 কেন্দ্র'],
  'tiny-nn': ['🧠 TinyNN', '🧠 নিউরাল'],
};

export function PumpEdgeControls() {
  const { bi, num } = useT();
  const setStep = useLab((s) => s.setStep);
  const aiMode = usePumpEdge((s) => s.aiMode);
  const batteryMah = usePumpEdge((s) => s.batteryMah);
  const rmsLimit = usePumpEdge((s) => s.rmsLimit);
  const {
    setAiMode,
    setLiveKind,
    setNormalize,
    setRmsLimit,
    setBatteryMah,
    startBatteryRace,
    setShedTempC,
    setTruckGuard,
    reset,
  } = usePumpEdge.getState();

  return (
    <div className="pe-controls">
      <div className="seg lab-choice" role="group" aria-label={bi('ESP32 AI brain', 'ESP32 এআই মস্তিষ্ক')}>
        {PUMP_AI_MODES.map((m) => (
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
            label: bi('⚙️ Bearing rattle fools Loudness Rule', '⚙️ বিয়ারিং ক্ষয় মিস করে সরল নিয়ম'),
            onPick: () => {
              setAiMode('threshold');
              setLiveKind('bearing');
              setStep('understand');
            },
            brk: true,
          },
          {
            label: bi('🧠 Watch TinyNN spot bearing rattle', '🧠 টাইনি নিউরাল নেটওয়ার্কে ত্রুটি ধরা'),
            onPick: () => {
              setAiMode('tiny-nn');
              setLiveKind('bearing');
              setStep('understand');
            },
          },
          {
            label: bi('🚚 Heavy truck false alarm', '🚚 ভারী ট্রাকের ভুয়া সতর্কতা'),
            onPick: () => {
              setTruckGuard({ minConsecutive: 1, rejectRoadRumble: false });
              setStep('break');
            },
            brk: true,
          },
          {
            label: bi('🌡️ 45 °C tin-shed sensor drift', '🌡️ ৪৫°সে টিনশেডে সেন্সর বিচ্যুতি'),
            onPick: () => {
              setShedTempC(45);
              setNormalize(false);
              setStep('break');
            },
            brk: true,
          },
          {
            label: bi('🔋 30-day battery drain race', '🔋 ৩০ দিনের ব্যাটারি দৌড়'),
            onPick: () => {
              setStep('evaluate');
              startBatteryRace();
            },
          },
        ]}
      />

      <Slider
        label={bi('RMS loudness cutoff', 'RMS কম্পন সীমা')}
        value={rmsLimit}
        min={0.4}
        max={0.85}
        step={0.02}
        format={(v) => `${num(v.toFixed(2))} g`}
        onChange={setRmsLimit}
      />

      <Slider
        label={bi('Sensor battery capacity', 'ব্যাটারি ক্ষমতা')}
        value={batteryMah}
        min={2000}
        max={12000}
        step={1000}
        format={(v) => `${num(v)} mAh`}
        onChange={setBatteryMah}
      />

      <div className="lab-row">
        <button type="button" className="btn ghost" onClick={() => setStep('train')}>
          {bi('Inspect AI chip', 'এআই চিপ দেখুন')}
        </button>
        <ResetButton onReset={reset} />
      </div>
    </div>
  );
}
