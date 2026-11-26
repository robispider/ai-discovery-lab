/*
 * Seeded synthetic pump vibration waveforms for Lesson 14
 * (Stormwater pump health: vibration sensing & Edge AI).
 * 160 labelled windows (120 train, 40 unseen test) at 200 Hz, plus
 * live-demo waveform generators, passing-truck confounders, and heat drift.
 */
import {
  extractPumpFeatures,
  PUMP_CLASSES,
  SAMPLE_RATE,
  WINDOW_SIZE,
  type PumpClass,
  type PumpFeatures,
  type PumpSample,
} from '../engines/iot/pump';
import { gauss, rng } from '../engines/random';

export const PUMP_CLASS_NAMES: Record<PumpClass, { en: string; bn: string }> = {
  idle: { en: 'Pump off (idle)', bn: 'পাম্প বন্ধ (স্থির)' },
  healthy: { en: 'Healthy hum', bn: 'সুস্থ স্বাভাবিক চলা' },
  bearing: { en: 'Early bearing wear', bn: 'বিয়ারিং ক্ষয়ের শুরু' },
  cavitation: { en: 'Blocked suction / cavitation', bn: 'মুখে আবর্জনা / ক্যাভিটেশন' },
};

/** Synthesises one 128-sample (0.64 s) accelerometer window at 200 Hz. */
export function synthPumpWave(
  kind: PumpClass | 'truck',
  r: () => number,
  phaseOffset = 0,
): number[] {
  const out = new Array<number>(WINDOW_SIZE);
  const p1 = phaseOffset + r() * Math.PI * 2;
  const p2 = r() * Math.PI * 2;
  const p3 = r() * Math.PI * 2;

  for (let i = 0; i < WINDOW_SIZE; i++) {
    const t = i / SAMPLE_RATE;
    if (kind === 'idle') {
      out[i] = gauss(r) * 0.045;
      continue;
    }
    if (kind === 'healthy') {
      const shaftAmp = 0.56 + (r() - 0.5) * 0.06;
      out[i] =
        shaftAmp * Math.sin(2 * Math.PI * 25 * t + p1) +
        0.16 * Math.sin(2 * Math.PI * 46 * t + p2) +
        gauss(r) * 0.04;
      continue;
    }
    if (kind === 'bearing') {
      // Overall RMS (~0.51 g) stays close to healthy (~0.47 g), hiding in the high-frequency band!
      const impact = i % 21 === 4 ? 0.58 : i % 21 === 5 ? -0.42 : 0;
      out[i] =
        0.44 * Math.sin(2 * Math.PI * 25 * t + p1) +
        0.37 * Math.sin(2 * Math.PI * 76 * t + p2) +
        0.25 * Math.sin(2 * Math.PI * 84 * t + p3) +
        impact +
        gauss(r) * 0.045;
      continue;
    }
    if (kind === 'cavitation') {
      out[i] =
        0.4 * Math.sin(2 * Math.PI * 25 * t + p1) +
        0.56 * Math.sin(2 * Math.PI * 44 * t + p2) +
        0.42 * Math.sin(2 * Math.PI * 52 * t + p3) +
        gauss(r) * 0.075;
      continue;
    }
    // 'truck': healthy pump + heavy lorry passing outside the pump house (strong 12 Hz rumble + rattle)
    out[i] =
      0.52 * Math.sin(2 * Math.PI * 25 * t + p1) +
      0.86 * Math.sin(2 * Math.PI * 12 * t + p2) +
      0.26 * Math.sin(2 * Math.PI * 72 * t + p3) +
      gauss(r) * 0.06;
  }

  return out.map((v) => Number(v.toFixed(4)));
}

function buildPumpDataset(seed = 1402): PumpSample[] {
  const r = rng(seed);
  const rows: PumpSample[] = [];
  // 30 train + 10 test per class = 120 train, 40 test
  for (const label of PUMP_CLASSES) {
    for (let i = 0; i < 40; i++) {
      const split = i < 30 ? 'train' : 'test';
      const samples = synthPumpWave(label, r);
      rows.push({
        id: `${label}-${i + 1}`,
        split,
        label,
        samples,
        features: extractPumpFeatures(samples),
      });
    }
  }
  return rows;
}

export const PUMP_SAMPLES: PumpSample[] = buildPumpDataset(1402);
export const PUMP_TRAIN: PumpSample[] = PUMP_SAMPLES.filter((s) => s.split === 'train');
export const PUMP_TEST: PumpSample[] = PUMP_SAMPLES.filter((s) => s.split === 'test');

/** Simulates cheap piezo gain inflation (+130%) and DC drift (+0.45 g) in a hot 45 °C tin pump-shed. */
export function applyHeatDrift(samples: readonly number[], gain = 2.3, dcOffset = 0.45): PumpSample['features'] {
  const drifted = samples.map((v) => v * gain + dcOffset);
  return extractPumpFeatures(drifted);
}

export interface TimelineWindow {
  step: number;
  event: 'healthy' | 'truck' | 'bearing';
  samples: number[];
  features: PumpFeatures;
}

/**
 * 10-window pump-house timeline:
 * Windows 1..2 healthy, 3..4 heavy lorry passes outside, 5..6 healthy again, 7..10 real bearing fault begins!
 */
export function buildTruckAndFaultTimeline(seed = 1499): TimelineWindow[] {
  const r = rng(seed);
  const plan: ('healthy' | 'truck' | 'bearing')[] = [
    'healthy',
    'healthy',
    'truck',
    'truck',
    'healthy',
    'healthy',
    'bearing',
    'bearing',
    'bearing',
    'bearing',
  ];
  return plan.map((event, idx) => {
    const samples = synthPumpWave(event, r, idx * 0.7);
    return {
      step: idx + 1,
      event,
      samples,
      features: extractPumpFeatures(samples),
    };
  });
}

export const TRUCK_TIMELINE: TimelineWindow[] = buildTruckAndFaultTimeline(1499);
