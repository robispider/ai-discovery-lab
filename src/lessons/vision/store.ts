import { create } from 'zustand';
import {
  BALANCED_SAMPLE_IDS,
  createInitialHead,
  DEFAULT_CONDITION,
  extractFeatures,
  getWasteItem,
  IMBALANCED_SAMPLE_IDS,
  predictHead,
  samplesFromIds,
  STARTER_SAMPLE_IDS,
  TRAIN_ITEMS,
  trainHead,
  trainHeadStep,
  type BackgroundMode,
  type CameraCondition,
  type KernelId,
  type LightingMode,
  type TrainingSample,
  type WasteClass,
  type WasteHeadModel,
} from '../../engines/vision';

export type VisionPinId = 'ring' | 'camera' | 'backbone' | 'head' | 'diverter';
export type TransferMode = 'transfer' | 'scratch';
export type VisionCivicCaseId = 'station' | 'night-bin' | 'compost-metal' | 'citizen-app';
export type VisionSetupId = 'transfer-box' | 'four-class-hood' | 'metal-sensor' | 'edge-phone';

const BELT_SEQUENCE = ['banana', 'pet-bottle', 'newspaper', 'mango', 'poly-bag', 'cardboard'];

interface VisionState {
  /** Active waste item on the Understand / Explore stage */
  activeItemId: string;
  playing: boolean;
  activePin: VisionPinId | null;
  kernelId: KernelId;
  patchRow: number;
  patchCol: number;
  transferMode: TransferMode;

  /** Live mini Teachable Machine sample buckets & head model */
  samples: TrainingSample[];
  model: WasteHeadModel;
  lossHistory: number[];
  accHistory: number[];
  trainingPulse: boolean;

  /** Evaluate & Break-it controls */
  evalItemId: string;
  breakItemId: string;
  condition: CameraCondition;
  minConfidence: number;

  /** Apply civic matcher */
  civicCase: VisionCivicCaseId;
  applySetup: VisionSetupId;

  /** Telemetry console */
  consoleOpen: boolean;
  logs: string[];

  setActiveItem: (id: string) => void;
  togglePlay: () => void;
  stopPlay: () => void;
  setActivePin: (pin: VisionPinId | null) => void;
  setKernel: (kernelId: KernelId) => void;
  setPatch: (row: number, col: number) => void;
  setTransferMode: (mode: TransferMode) => void;

  addItemSample: (label: WasteClass, itemId: string) => void;
  addCustomSample: (
    label: WasteClass,
    features: readonly [number, number, number, number, number, number],
    customLabel: string,
  ) => void;
  removeSample: (sampleId: string) => void;
  loadSamplePreset: (preset: 'starter' | 'balanced' | 'imbalanced') => void;
  resetHead: () => void;
  trainSteps: (steps: number) => void;

  setEvalItem: (id: string) => void;
  setBreakItem: (id: string) => void;
  setCondition: (patch: Partial<CameraCondition>) => void;
  setMinConfidence: (v: number) => void;
  applyBreakPreset: (preset: 'healthy' | 'metal-can' | 'blue-tray' | 'dim-light' | 'muddy-paper') => void;

  setCivicCase: (c: VisionCivicCaseId) => void;
  setApplySetup: (s: VisionSetupId) => void;
  toggleConsole: () => void;
  reset: () => void;
}

let beltTimer: ReturnType<typeof setInterval> | undefined;
let sampleSeq = 100;

function clearTimers() {
  if (beltTimer) clearInterval(beltTimer);
  beltTimer = undefined;
}

function logLine(itemId: string, model: WasteHeadModel, cond: CameraCondition, minConf: number): string {
  const item = getWasteItem(itemId);
  const feat = extractFeatures(item, cond);
  const pred = predictHead(model, feat, minConf);
  const pct = Math.round(pred.confidence * 100);
  const gate =
    pred.routedTo === 'manual'
      ? 'MANUAL_REVIEW'
      : pred.routedTo === 'organic'
        ? 'BIN_A(ORGANIC)'
        : pred.routedTo === 'plastic'
          ? 'BIN_B(PLASTIC)'
          : 'BIN_C(PAPER)';
  return `[CAM] ${item.id} (${cond.lighting}) → ${pred.topClass.toUpperCase()} ${pct}% → ${gate}`;
}

function initial() {
  const samples = samplesFromIds(STARTER_SAMPLE_IDS);
  const trained = trainHead(samples, 45);
  return {
    activeItemId: 'pet-bottle',
    playing: false,
    activePin: null as VisionPinId | null,
    kernelId: 'shine' as KernelId,
    patchRow: 4,
    patchCol: 4,
    transferMode: 'transfer' as TransferMode,

    samples,
    model: trained.model,
    lossHistory: trained.lossHistory,
    accHistory: trained.accHistory,
    trainingPulse: false,

    evalItemId: 'guava',
    breakItemId: 'metal-can',
    condition: { ...DEFAULT_CONDITION },
    minConfidence: 0.65,

    civicCase: 'station' as VisionCivicCaseId,
    applySetup: 'four-class-hood' as VisionSetupId,

    consoleOpen: true,
    logs: [
      '[BOOT] WasteVision-Cam · MobileNetV2(frozen) + 3-Class Softmax Head (21 params)',
      logLine('pet-bottle', trained.model, DEFAULT_CONDITION, 0.65),
    ],
  };
}

export const useVision = create<VisionState>()((set, get) => ({
  ...initial(),

  setActiveItem: (activeItemId) =>
    set((s) => ({
      activeItemId,
      logs: [...s.logs.slice(-5), logLine(activeItemId, s.model, s.condition, s.minConfidence)],
    })),

  togglePlay: () => {
    if (get().playing) {
      clearTimers();
      set({ playing: false });
      return;
    }
    set({ playing: true });
    beltTimer = setInterval(() => {
      const s = get();
      const idx = BELT_SEQUENCE.indexOf(s.activeItemId);
      const nextId = BELT_SEQUENCE[(idx + 1) % BELT_SEQUENCE.length];
      set({
        activeItemId: nextId,
        logs: [...s.logs.slice(-5), logLine(nextId, s.model, s.condition, s.minConfidence)],
      });
    }, 1800);
  },

  stopPlay: () => {
    clearTimers();
    set({ playing: false });
  },

  setActivePin: (pin) =>
    set((s) => ({ activePin: s.activePin === pin ? null : pin })),

  setKernel: (kernelId) => set({ kernelId }),

  setPatch: (patchRow, patchCol) => set({ patchRow, patchCol }),

  setTransferMode: (transferMode) => set({ transferMode }),

  addItemSample: (label, itemId) =>
    set((s) => {
      const item = getWasteItem(itemId);
      const nextSample: TrainingSample = {
        id: `${label}-${itemId}-${++sampleSeq}`,
        label,
        itemId,
        features: extractFeatures(item, DEFAULT_CONDITION),
      };
      return {
        samples: [...s.samples, nextSample],
        logs: [...s.logs.slice(-5), `[DATA] Added "${item.id}" to ${label.toUpperCase()} bucket`],
      };
    }),

  addCustomSample: (label, features, customLabel) =>
    set((s) => ({
      samples: [
        ...s.samples,
        {
          id: `${label}-cam-${++sampleSeq}`,
          label,
          features,
          customLabel,
        },
      ],
      logs: [...s.logs.slice(-5), `[WEBCAM] Captured "${customLabel}" into ${label.toUpperCase()} bucket`],
    })),

  removeSample: (sampleId) =>
    set((s) => ({
      samples: s.samples.filter((x) => x.id !== sampleId),
    })),

  loadSamplePreset: (preset) => {
    const map =
      preset === 'balanced'
        ? BALANCED_SAMPLE_IDS
        : preset === 'imbalanced'
          ? IMBALANCED_SAMPLE_IDS
          : STARTER_SAMPLE_IDS;
    const samples = samplesFromIds(map);
    const trained = trainHead(samples, 45);
    set((s) => ({
      samples,
      model: trained.model,
      lossHistory: trained.lossHistory,
      accHistory: trained.accHistory,
      logs: [
        ...s.logs.slice(-5),
        `[TRAIN] Loaded ${preset} dataset (${samples.length} photos) → trained 45 epochs`,
      ],
    }));
  },

  resetHead: () =>
    set((s) => ({
      model: createInitialHead(),
      lossHistory: [],
      accHistory: [],
      logs: [...s.logs.slice(-5), '[HEAD] Reset 21 head weights to untrained state'],
    })),

  trainSteps: (steps) =>
    set((s) => {
      let cur = s.model;
      const nextLoss = [...s.lossHistory];
      const nextAcc = [...s.accHistory];
      for (let i = 0; i < steps; i++) {
        const res = trainHeadStep(cur, s.samples);
        cur = res.model;
        nextLoss.push(Number(res.loss.toFixed(3)));
        nextAcc.push(Number((res.accuracy * 100).toFixed(1)));
      }
      const finalAcc = nextAcc[nextAcc.length - 1] ?? 0;
      const finalLoss = nextLoss[nextLoss.length - 1] ?? 1.1;
      return {
        model: cur,
        lossHistory: nextLoss.slice(-80),
        accHistory: nextAcc.slice(-80),
        logs: [
          ...s.logs.slice(-5),
          `[TRAIN] +${steps} epochs (total ${cur.epochs}) · loss=${finalLoss.toFixed(2)} · trainAcc=${Math.round(finalAcc)}%`,
        ],
      };
    }),

  setEvalItem: (evalItemId) => set({ evalItemId }),

  setBreakItem: (breakItemId) =>
    set((s) => ({
      breakItemId,
      logs: [...s.logs.slice(-5), logLine(breakItemId, s.model, s.condition, s.minConfidence)],
    })),

  setCondition: (patch) =>
    set((s) => {
      const condition = { ...s.condition, ...patch };
      return {
        condition,
        logs: [...s.logs.slice(-5), logLine(s.breakItemId, s.model, condition, s.minConfidence)],
      };
    }),

  setMinConfidence: (minConfidence) => set({ minConfidence }),

  applyBreakPreset: (preset) => {
    const s = get();
    let breakItemId = s.breakItemId;
    let activeItemId = s.activeItemId;
    let condition: CameraCondition = { ...DEFAULT_CONDITION };

    if (preset === 'healthy') {
      activeItemId = 'pet-bottle';
      breakItemId = 'banana';
      condition = { lighting: 'daylight', background: 'belt', autoWhiteBalance: false, shortcutBias: false };
    } else if (preset === 'metal-can') {
      breakItemId = 'metal-can';
      condition = { lighting: 'daylight', background: 'belt', autoWhiteBalance: false, shortcutBias: false };
    } else if (preset === 'blue-tray') {
      breakItemId = 'banana';
      condition = { lighting: 'daylight', background: 'blue-tray', autoWhiteBalance: false, shortcutBias: true };
    } else if (preset === 'dim-light') {
      breakItemId = 'pet-bottle';
      condition = { lighting: 'dim-yellow', background: 'belt', autoWhiteBalance: false, shortcutBias: false };
    } else if (preset === 'muddy-paper') {
      breakItemId = 'muddy-paper';
      condition = { lighting: 'daylight', background: 'belt', autoWhiteBalance: false, shortcutBias: false };
    }

    set({
      activeItemId,
      breakItemId,
      condition,
      logs: [...s.logs.slice(-5), logLine(breakItemId, s.model, condition, s.minConfidence)],
    });
  },

  setCivicCase: (civicCase) => set({ civicCase }),
  setApplySetup: (applySetup) => set({ applySetup }),
  toggleConsole: () => set((s) => ({ consoleOpen: !s.consoleOpen })),

  reset: () => {
    clearTimers();
    set(initial());
  },
}));

export function availableTrainItemsFor(label: WasteClass) {
  return TRAIN_ITEMS.filter((i) => i.trueClass === label);
}

export type { BackgroundMode, LightingMode };
