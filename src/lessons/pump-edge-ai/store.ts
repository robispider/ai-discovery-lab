import { create } from 'zustand';
import { PUMP_TRAIN, synthPumpWave } from '../../data/pumpSensors';
import {
  extractPumpFeatures,
  runPumpAi,
  trainAnomalyModel,
  trainEdgeModel,
  trainTinyMlp,
  type PumpAiBundle,
  type PumpAiMode,
  type PumpClass,
} from '../../engines/iot/pump';
import { rng } from '../../engines/random';

export type PumpPinId = 'mpu6050' | 'esp32' | 'oled' | 'leds' | 'pump';
export type DeployCaseId = 'pump' | 'lamp' | 'aqi' | 'bridge';
export type DeployBrainId = 'switch' | 'edge-zscore' | 'edge-tinyml' | 'cloud-ml' | 'hybrid';

interface PumpEdgeState {
  aiMode: PumpAiMode;
  liveKind: PumpClass | 'truck';
  waveSeed: number;
  playing: boolean;
  activePin: PumpPinId | null;
  serialOpen: boolean;
  serialLines: string[];
  normalizeRatios: boolean;
  bundle: PumpAiBundle;
  flashPct: number | null;
  selectedSampleId: string;
  rmsLimit: number;
  batteryMah: number;
  raceDay: number;
  racing: boolean;
  shedTempC: number;
  minConsecutive: number;
  rejectRoadRumble: boolean;
  deployCase: DeployCaseId;
  deployBrain: DeployBrainId;

  setAiMode: (aiMode: PumpAiMode) => void;
  setLiveKind: (liveKind: PumpClass | 'truck') => void;
  nextWave: () => void;
  togglePlay: () => void;
  stopAll: () => void;
  setActivePin: (pin: PumpPinId | null) => void;
  toggleSerial: () => void;
  setNormalize: (normalizeRatios: boolean) => void;
  flashFirmware: () => void;
  selectSample: (id: string) => void;
  setRmsLimit: (rmsLimit: number) => void;
  setBatteryMah: (batteryMah: number) => void;
  startBatteryRace: () => void;
  setShedTempC: (shedTempC: number) => void;
  setTruckGuard: (patch: { minConsecutive?: number; rejectRoadRumble?: boolean }) => void;
  setDeployCase: (deployCase: DeployCaseId) => void;
  setDeployBrain: (deployBrain: DeployBrainId) => void;
  reset: () => void;
}

let waveTimer: ReturnType<typeof setInterval> | undefined;
let flashTimer: ReturnType<typeof setInterval> | undefined;
let raceTimer: ReturnType<typeof setInterval> | undefined;

function clearAllTimers() {
  if (waveTimer) clearInterval(waveTimer);
  if (flashTimer) clearInterval(flashTimer);
  if (raceTimer) clearInterval(raceTimer);
  waveTimer = undefined;
  flashTimer = undefined;
  raceTimer = undefined;
}

function buildBundle(normalizeRatios: boolean): PumpAiBundle {
  return {
    centroid: trainEdgeModel(PUMP_TRAIN, normalizeRatios),
    zscore: trainAnomalyModel(PUMP_TRAIN, normalizeRatios),
    mlp: trainTinyMlp(PUMP_TRAIN, { normalizeRatios, epochs: 180 }),
  };
}

function makeSerial(
  aiMode: PumpAiMode,
  liveKind: PumpClass | 'truck',
  waveSeed: number,
  bundle: PumpAiBundle,
  rmsLimit: number,
) {
  const wave = synthPumpWave(liveKind, rng(2400 + waveSeed));
  const feat = extractPumpFeatures(wave);
  return runPumpAi(aiMode, feat, bundle, { rmsLimit }).serial;
}

const initial = () => {
  const bundle = buildBundle(true);
  return {
    aiMode: 'centroid' as PumpAiMode,
    liveKind: 'bearing' as PumpClass | 'truck',
    waveSeed: 1,
    playing: false,
    activePin: null as PumpPinId | null,
    serialOpen: true,
    serialLines: [
      '[BOOT] ESP32 · MPU-6050(200Hz I2C) · SSD1306 OLED',
      '[MPU6050] FFT_CENTROID hi=0.61 => BEARING (96%)',
    ],
    normalizeRatios: true,
    bundle,
    flashPct: null as number | null,
    selectedSampleId: 'bearing-1',
    rmsLimit: 0.62,
    batteryMah: 6000,
    raceDay: 30,
    racing: false,
    shedTempC: 30,
    minConsecutive: 1,
    rejectRoadRumble: false,
    deployCase: 'pump' as DeployCaseId,
    deployBrain: 'edge-tinyml' as DeployBrainId,
  };
};

export const usePumpEdge = create<PumpEdgeState>()((set, get) => ({
  ...initial(),

  setAiMode: (aiMode) =>
    set((s) => ({
      aiMode,
      serialLines: [
        ...s.serialLines.slice(-5),
        `[MODE] Switched ESP32 brain -> ${aiMode.toUpperCase()}`,
        makeSerial(aiMode, s.liveKind, s.waveSeed, s.bundle, s.rmsLimit),
      ],
    })),

  setLiveKind: (liveKind) =>
    set((s) => {
      const waveSeed = s.waveSeed + 1;
      return {
        liveKind,
        waveSeed,
        serialLines: [
          ...s.serialLines.slice(-5),
          makeSerial(s.aiMode, liveKind, waveSeed, s.bundle, s.rmsLimit),
        ],
      };
    }),

  nextWave: () =>
    set((s) => {
      const waveSeed = s.waveSeed + 1;
      return {
        waveSeed,
        serialLines: [
          ...s.serialLines.slice(-5),
          makeSerial(s.aiMode, s.liveKind, waveSeed, s.bundle, s.rmsLimit),
        ],
      };
    }),

  togglePlay: () => {
    if (get().playing) {
      if (waveTimer) clearInterval(waveTimer);
      waveTimer = undefined;
      set({ playing: false });
      return;
    }
    set({ playing: true });
    waveTimer = setInterval(() => {
      const s = get();
      const waveSeed = s.waveSeed + 1;
      set({
        waveSeed,
        serialLines: [
          ...s.serialLines.slice(-5),
          makeSerial(s.aiMode, s.liveKind, waveSeed, s.bundle, s.rmsLimit),
        ],
      });
    }, 340);
  },

  stopAll: () => {
    clearAllTimers();
    set({ playing: false, racing: false, flashPct: null });
  },

  setActivePin: (activePin) =>
    set((s) => ({ activePin: s.activePin === activePin ? null : activePin })),

  toggleSerial: () => set((s) => ({ serialOpen: !s.serialOpen })),

  setNormalize: (normalizeRatios) =>
    set({
      normalizeRatios,
      bundle: buildBundle(normalizeRatios),
    }),

  flashFirmware: () => {
    if (flashTimer) clearInterval(flashTimer);
    set((s) => ({
      flashPct: 10,
      serialLines: [...s.serialLines.slice(-4), '[USB] Quantizing model & flashing ESP32...'],
    }));
    flashTimer = setInterval(() => {
      const cur = get().flashPct;
      if (cur === null) return;
      if (cur >= 100) {
        if (flashTimer) clearInterval(flashTimer);
        flashTimer = undefined;
        set((s) => ({
          flashPct: null,
          serialLines: [...s.serialLines.slice(-4), '[USB] Flash complete -> Rebooting Edge AI!'],
        }));
        return;
      }
      set({ flashPct: Math.min(100, cur + 24) });
    }, 130);
  },

  selectSample: (selectedSampleId) => set({ selectedSampleId }),

  setRmsLimit: (rmsLimit) => set({ rmsLimit }),

  setBatteryMah: (batteryMah) => set({ batteryMah }),

  startBatteryRace: () => {
    if (raceTimer) clearInterval(raceTimer);
    set({ raceDay: 0, racing: true });
    raceTimer = setInterval(() => {
      const d = get().raceDay + 1;
      if (d >= 30) {
        if (raceTimer) clearInterval(raceTimer);
        raceTimer = undefined;
        set({ raceDay: 30, racing: false });
        return;
      }
      set({ raceDay: d });
    }, 95);
  },

  setShedTempC: (shedTempC) => set({ shedTempC }),

  setTruckGuard: (patch) => set(patch),

  setDeployCase: (deployCase) => set({ deployCase }),
  setDeployBrain: (deployBrain) => set({ deployBrain }),

  reset: () => {
    clearAllTimers();
    set(initial());
  },
}));
