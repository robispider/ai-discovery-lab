import { create } from 'zustand';
import {
  EQUITABLE_PLACEMENT,
  STORM_EPISODES,
  TEST_STORMS,
  TRAIN_STORMS,
  VIP_ONLY_PLACEMENT,
} from '../../data/drainSensors';
import {
  cleanStream,
  injectFault,
  runDrainAi,
  trainDrainTree,
  trainForecaster,
  type DrainAiMode,
  type FaultMode,
  type ForecasterModel,
} from '../../engines/iot/drain';
import type { TreeNode } from '../../engines/tree';

export type DrainPinId = 'ultrasonic' | 'esp32' | 'oled' | 'relay' | 'khal';
export type CivicCaseId = 'sump' | 'grate' | 'pumpstation' | 'citywide';
export type ApplyBrainId = 'float' | 'rule' | 'tree' | 'timeseries' | 'cloud';

interface DrainSensorState {
  aiMode: DrainAiMode;
  episodeId: string;
  tickIdx: number;
  playing: boolean;
  splashTick: number | null;
  activePin: DrainPinId | null;
  serialOpen: boolean;
  serialLines: string[];
  rejectSpikes: boolean;
  smoothWindow: number;
  thresholdCm: number;
  forecastAlarmCm: number;
  epochs: number;
  treeDepth: number;
  model: ForecasterModel;
  tree: TreeNode;
  flashPct: number | null;
  cardSeed: number;
  faultMode: FaultMode;
  healthGuard: boolean;
  edgeFallback: boolean;
  sensorWards: string[];
  civicCase: CivicCaseId;
  applyBrain: ApplyBrainId;

  setAiMode: (aiMode: DrainAiMode) => void;
  setEpisode: (episodeId: string) => void;
  setTick: (tickIdx: number) => void;
  togglePlay: () => void;
  stopPlay: () => void;
  tossPlastic: () => void;
  setActivePin: (pin: DrainPinId | null) => void;
  toggleSerial: () => void;
  setClean: (patch: { rejectSpikes?: boolean; smoothWindow?: number }) => void;
  setThresholds: (patch: { thresholdCm?: number; forecastAlarmCm?: number }) => void;
  retrain: (patch: { epochs?: number; treeDepth?: number }) => void;
  flashFirmware: () => void;
  shuffleCards: () => void;
  setFault: (faultMode: FaultMode) => void;
  setGuards: (patch: { healthGuard?: boolean; edgeFallback?: boolean }) => void;
  setPlacementPreset: (preset: 'vip' | 'equitable') => void;
  toggleWardSensor: (wardId: string) => void;
  setCivicCase: (civicCase: CivicCaseId) => void;
  setApplyBrain: (applyBrain: ApplyBrainId) => void;
  reset: () => void;
}

let playTimer: ReturnType<typeof setInterval> | undefined;
let flashTimer: ReturnType<typeof setInterval> | undefined;

function clearTimers() {
  if (playTimer) clearInterval(playTimer);
  if (flashTimer) clearInterval(flashTimer);
  playTimer = undefined;
  flashTimer = undefined;
}

function buildModels(epochs: number, treeDepth: number, rejectSpikes: boolean, smoothWindow: number) {
  return {
    model: trainForecaster(TRAIN_STORMS, { epochs, rejectSpikes, smoothWindow }),
    tree: trainDrainTree(TRAIN_STORMS, { maxDepth: treeDepth, rejectSpikes, smoothWindow }),
  };
}

function computeSerialLine(s: {
  aiMode: DrainAiMode;
  episodeId: string;
  tickIdx: number;
  splashTick: number | null;
  faultMode: FaultMode;
  rejectSpikes: boolean;
  smoothWindow: number;
  model: ForecasterModel;
  tree: TreeNode;
  thresholdCm: number;
  forecastAlarmCm: number;
  healthGuard: boolean;
}) {
  const ep = STORM_EPISODES.find((e) => e.id === s.episodeId) ?? TEST_STORMS[0];
  const base = injectFault(ep.ticks, s.faultMode).map((t, i) =>
    s.splashTick === i ? { ...t, rawLevelCm: 112 } : t,
  );
  const cleaned = cleanStream(base, {
    rejectSpikes: s.rejectSpikes,
    smoothWindow: s.smoothWindow,
  });
  const idx = Math.min(cleaned.length - 1, Math.max(0, s.tickIdx));
  const dec = runDrainAi(
    s.aiMode,
    cleaned[idx],
    base[idx],
    { forecaster: s.model, tree: s.tree },
    {
      thresholdCm: s.thresholdCm,
      forecastAlarmCm: s.forecastAlarmCm,
      healthGuard: s.healthGuard,
      networkDown: s.faultMode === 'dropout',
    },
  );
  return dec.serial;
}

const initial = () => {
  const { model, tree } = buildModels(160, 3, true, 3);
  return {
    aiMode: 'timeseries' as DrainAiMode,
    episodeId: 'te-1',
    tickIdx: 13,
    playing: false,
    splashTick: null as number | null,
    activePin: null as DrainPinId | null,
    serialOpen: true,
    serialLines: [
      '[BOOT] ESP32-WROOM-32 · HC-SR04P(GPIO5/18) · SSD1306(I2C)',
      '[01:05] EDGE_TREND clean=62 +30m=86cm => PUMP_ON',
    ],
    rejectSpikes: true,
    smoothWindow: 3,
    thresholdCm: 78,
    forecastAlarmCm: 82,
    epochs: 160,
    treeDepth: 3,
    model,
    tree,
    flashPct: null as number | null,
    cardSeed: 0,
    faultMode: 'none' as FaultMode,
    healthGuard: false,
    edgeFallback: false,
    sensorWards: [...EQUITABLE_PLACEMENT],
    civicCase: 'pumpstation' as CivicCaseId,
    applyBrain: 'timeseries' as ApplyBrainId,
  };
};

export const useDrainSensors = create<DrainSensorState>()((set, get) => ({
  ...initial(),

  setAiMode: (aiMode) =>
    set((s) => {
      const next = { ...s, aiMode };
      return {
        aiMode,
        serialLines: [...s.serialLines.slice(-5), `[MODE] Switched ESP32 brain -> ${aiMode.toUpperCase()}`, computeSerialLine(next)],
      };
    }),

  setEpisode: (episodeId) => {
    set((s) => ({
      episodeId,
      tickIdx: 12,
      splashTick: null,
      serialLines: [...s.serialLines.slice(-5), `[SIM] Loaded storm ${episodeId}`],
    }));
  },

  setTick: (tickIdx) =>
    set((s) => {
      const next = { ...s, tickIdx };
      return {
        tickIdx,
        serialLines: [...s.serialLines.slice(-5), computeSerialLine(next)],
      };
    }),

  togglePlay: () => {
    if (get().playing) {
      if (playTimer) clearInterval(playTimer);
      playTimer = undefined;
      set({ playing: false });
      return;
    }
    set({ playing: true });
    playTimer = setInterval(() => {
      const s = get();
      const nextIdx = (s.tickIdx + 1) % 36;
      const next = { ...s, tickIdx: nextIdx };
      set({
        tickIdx: nextIdx,
        serialLines: [...s.serialLines.slice(-5), computeSerialLine(next)],
      });
    }, 620);
  },

  stopPlay: () => {
    if (playTimer) clearInterval(playTimer);
    playTimer = undefined;
    set({ playing: false });
  },

  tossPlastic: () =>
    set((s) => {
      const splashTick = s.tickIdx;
      const next = { ...s, splashTick };
      return {
        splashTick,
        serialLines: [
          ...s.serialLines.slice(-5),
          '[ECHO] Floating plastic bottle under HC-SR04 -> 112cm spike!',
          computeSerialLine(next),
        ],
      };
    }),

  setActivePin: (activePin) =>
    set((s) => ({ activePin: s.activePin === activePin ? null : activePin })),

  toggleSerial: () => set((s) => ({ serialOpen: !s.serialOpen })),

  setClean: (patch) => {
    const s = get();
    const rejectSpikes = patch.rejectSpikes ?? s.rejectSpikes;
    const smoothWindow = patch.smoothWindow ?? s.smoothWindow;
    const { model, tree } = buildModels(s.epochs, s.treeDepth, rejectSpikes, smoothWindow);
    set({ rejectSpikes, smoothWindow, model, tree });
  },

  setThresholds: (patch) => set(patch),

  retrain: (patch) => {
    const s = get();
    const epochs = patch.epochs ?? s.epochs;
    const treeDepth = patch.treeDepth ?? s.treeDepth;
    const { model, tree } = buildModels(epochs, treeDepth, s.rejectSpikes, s.smoothWindow);
    set({ epochs, treeDepth, model, tree });
  },

  flashFirmware: () => {
    if (flashTimer) clearInterval(flashTimer);
    set((s) => ({
      flashPct: 8,
      serialLines: [...s.serialLines.slice(-4), '[USB] Compiling sketch & quantizing weights...'],
    }));
    flashTimer = setInterval(() => {
      const cur = get().flashPct;
      if (cur === null) {
        if (flashTimer) clearInterval(flashTimer);
        return;
      }
      if (cur >= 100) {
        if (flashTimer) clearInterval(flashTimer);
        flashTimer = undefined;
        set((s) => ({
          flashPct: null,
          serialLines: [...s.serialLines.slice(-4), '[USB] Wrote 96 bytes -> Hard resetting via RTS pin... OK!'],
        }));
        return;
      }
      set({ flashPct: Math.min(100, cur + 23) });
    }, 140);
  },

  shuffleCards: () => set((s) => ({ cardSeed: s.cardSeed + 1 })),

  setFault: (faultMode) =>
    set((s) => {
      const next = { ...s, faultMode };
      return {
        faultMode,
        serialLines: [...s.serialLines.slice(-5), computeSerialLine(next)],
      };
    }),

  setGuards: (patch) => set(patch),

  setPlacementPreset: (preset) =>
    set({
      sensorWards: preset === 'vip' ? [...VIP_ONLY_PLACEMENT] : [...EQUITABLE_PLACEMENT],
    }),

  toggleWardSensor: (wardId) =>
    set((s) => {
      if (s.sensorWards.includes(wardId)) {
        if (s.sensorWards.length <= 1) return s;
        return { sensorWards: s.sensorWards.filter((id) => id !== wardId) };
      }
      if (s.sensorWards.length >= 4) {
        // Move oldest sensor to this ward so city budget stays at 4 nodes!
        return { sensorWards: [...s.sensorWards.slice(1), wardId] };
      }
      return { sensorWards: [...s.sensorWards, wardId] };
    }),

  setCivicCase: (civicCase) => set({ civicCase }),
  setApplyBrain: (applyBrain) => set({ applyBrain }),

  reset: () => {
    clearTimers();
    set(initial());
  },
}));
