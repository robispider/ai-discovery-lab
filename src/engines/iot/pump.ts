/*
 * Vibration / acoustic signal-processing & Edge AI engine for Lesson 14
 * (Stormwater pump health: vibration sensing & Edge AI).
 * Pure TypeScript, no React: DFT band-power feature extraction, and 4 selectable AI brains:
 *   1. Simple Loudness Threshold (RMS)
 *   2. Unsupervised Anomaly Z-Score (trained ONLY on healthy pump waves)
 *   3. Spectral Nearest-Centroid Classifier (80 bytes)
 *   4. TinyML Neural Network (5 -> 6 -> 4 MLP, 256 bytes, live hidden activations)
 */
import { rng } from '../random';

export const SAMPLE_RATE = 200; // 200 Hz accelerometer
export const WINDOW_SIZE = 128; // 0.64 seconds per window

export type PumpClass = 'idle' | 'healthy' | 'bearing' | 'cavitation';
export type PumpAiMode = 'threshold' | 'zscore' | 'centroid' | 'tiny-nn';

export const PUMP_CLASSES: readonly PumpClass[] = ['idle', 'healthy', 'bearing', 'cavitation'];
export const PUMP_AI_MODES: readonly PumpAiMode[] = ['threshold', 'zscore', 'centroid', 'tiny-nn'];

export interface PumpFeatures {
  rms: number;
  lowBand: number;
  midBand: number;
  highBand: number;
  crest: number;
  spectrum: number[];
}

export interface FeatureVector {
  values: [number, number, number, number, number];
}

/** Extracts physical time & frequency features from a 128-sample vibration window. */
export function extractPumpFeatures(samples: readonly number[]): PumpFeatures {
  const n = samples.length;
  if (n === 0) {
    return { rms: 0, lowBand: 0, midBand: 0, highBand: 0, crest: 1, spectrum: [] };
  }

  let sum = 0;
  for (let i = 0; i < n; i++) sum += samples[i];
  const mean = sum / n;

  let sq = 0;
  let peak = 0;
  const centered = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const v = samples[i] - mean;
    centered[i] = v;
    sq += v * v;
    const av = Math.abs(v);
    if (av > peak) peak = av;
  }
  const rms = Math.sqrt(sq / n);
  const crest = peak / Math.max(0.04, rms);

  const maxBin = Math.min(60, Math.floor(n / 2) - 1);
  const spectrum: number[] = [];
  let lowBand = 0;
  let midBand = 0;
  let highBand = 0;

  for (let k = 1; k <= maxBin; k++) {
    let re = 0;
    let im = 0;
    const step = (-2 * Math.PI * k) / n;
    for (let i = 0; i < n; i++) {
      const ang = step * i;
      re += centered[i] * Math.cos(ang);
      im += centered[i] * Math.sin(ang);
    }
    const mag = (2 * Math.sqrt(re * re + im * im)) / n;
    spectrum.push(Number(mag.toFixed(4)));
    if (k >= 3 && k <= 20) lowBand += mag;
    else if (k >= 21 && k <= 38) midBand += mag;
    else if (k >= 39 && k <= 60) highBand += mag;
  }

  return {
    rms: Number(rms.toFixed(3)),
    lowBand: Number(lowBand.toFixed(3)),
    midBand: Number(midBand.toFixed(3)),
    highBand: Number(highBand.toFixed(3)),
    crest: Number(crest.toFixed(2)),
    spectrum,
  };
}

export function toModelVector(f: PumpFeatures, normalizeRatios = true): FeatureVector {
  if (normalizeRatios) {
    const total = Math.max(0.08, f.lowBand + f.midBand + f.highBand);
    const active = f.rms < 0.14 ? 0 : 1;
    return {
      values: [
        active,
        (f.lowBand / total) * active,
        (f.midBand / total) * active,
        (f.highBand / total) * active,
        Math.min(1.5, (f.crest - 1.2) / 2.5),
      ],
    };
  }
  return {
    values: [f.rms * 1.6, f.lowBand, f.midBand, f.highBand, (f.crest - 1.2) / 2.5],
  };
}

export interface PumpSample {
  id: string;
  split: 'train' | 'test';
  label: PumpClass;
  samples: number[];
  features: PumpFeatures;
}

export interface EdgePumpModel {
  normalizeRatios: boolean;
  centroids: Record<PumpClass, [number, number, number, number, number]>;
  paramCount: number;
  byteSize: number;
}

/** 1. Trains the 80-byte Nearest-Centroid Edge classifier. */
export function trainEdgeModel(
  rows: readonly PumpSample[],
  normalizeRatios = true,
): EdgePumpModel {
  const sums: Record<PumpClass, [number, number, number, number, number]> = {
    idle: [0, 0, 0, 0, 0],
    healthy: [0, 0, 0, 0, 0],
    bearing: [0, 0, 0, 0, 0],
    cavitation: [0, 0, 0, 0, 0],
  };
  const counts: Record<PumpClass, number> = {
    idle: 0,
    healthy: 0,
    bearing: 0,
    cavitation: 0,
  };

  for (const r of rows) {
    const v = toModelVector(r.features, normalizeRatios).values;
    counts[r.label]++;
    for (let j = 0; j < 5; j++) sums[r.label][j] += v[j];
  }

  const centroids = {} as Record<PumpClass, [number, number, number, number, number]>;
  for (const c of PUMP_CLASSES) {
    const k = Math.max(1, counts[c]);
    centroids[c] = [
      Number((sums[c][0] / k).toFixed(4)),
      Number((sums[c][1] / k).toFixed(4)),
      Number((sums[c][2] / k).toFixed(4)),
      Number((sums[c][3] / k).toFixed(4)),
      Number((sums[c][4] / k).toFixed(4)),
    ];
  }

  return {
    normalizeRatios,
    centroids,
    paramCount: PUMP_CLASSES.length * 5,
    byteSize: PUMP_CLASSES.length * 5 * 4,
  };
}

export interface EdgePrediction {
  predicted: PumpClass;
  probabilities: Record<PumpClass, number>;
  isFault: boolean;
}

export function predictEdgeModel(model: EdgePumpModel, features: PumpFeatures): EdgePrediction {
  const x = toModelVector(features, model.normalizeRatios).values;
  const temp = 0.12;
  const scores: Record<PumpClass, number> = {
    idle: 0,
    healthy: 0,
    bearing: 0,
    cavitation: 0,
  };

  let maxLogit = -Infinity;
  for (const c of PUMP_CLASSES) {
    const mu = model.centroids[c];
    let distSq = 0;
    for (let j = 0; j < 5; j++) {
      const d = x[j] - mu[j];
      distSq += d * d;
    }
    const logit = -distSq / temp;
    scores[c] = logit;
    if (logit > maxLogit) maxLogit = logit;
  }

  let expSum = 0;
  for (const c of PUMP_CLASSES) {
    scores[c] = Math.exp(scores[c] - maxLogit);
    expSum += scores[c];
  }

  let best: PumpClass = 'healthy';
  let bestP = -1;
  const probabilities = {} as Record<PumpClass, number>;
  for (const c of PUMP_CLASSES) {
    const p = scores[c] / Math.max(1e-9, expSum);
    probabilities[c] = Number(p.toFixed(4));
    if (p > bestP) {
      bestP = p;
      best = c;
    }
  }

  return {
    predicted: best,
    probabilities,
    isFault: best === 'bearing' || best === 'cavitation',
  };
}

/** 2. Unsupervised Anomaly Z-Score Detector — trained ONLY on healthy pump windows! */
export interface AnomalyZModel {
  normalizeRatios: boolean;
  mean: [number, number, number, number, number];
  std: [number, number, number, number, number];
  paramCount: number;
  byteSize: number;
}

export function trainAnomalyModel(
  rows: readonly PumpSample[],
  normalizeRatios = true,
): AnomalyZModel {
  const healthyRows = rows.filter((r) => r.label === 'healthy');
  const n = Math.max(1, healthyRows.length);
  const mean: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const r of healthyRows) {
    const v = toModelVector(r.features, normalizeRatios).values;
    for (let j = 0; j < 5; j++) mean[j] += v[j] / n;
  }
  const std: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const r of healthyRows) {
    const v = toModelVector(r.features, normalizeRatios).values;
    for (let j = 0; j < 5; j++) {
      const d = v[j] - mean[j];
      std[j] += (d * d) / n;
    }
  }
  for (let j = 0; j < 5; j++) {
    std[j] = Math.max(0.035, Math.sqrt(std[j]));
  }
  return {
    normalizeRatios,
    mean,
    std,
    paramCount: 10,
    byteSize: 40,
  };
}

export function predictAnomalyModel(
  model: AnomalyZModel,
  features: PumpFeatures,
  zCutoff = 2.6,
): { zScore: number; isFault: boolean } {
  if (features.rms < 0.14) return { zScore: 0.2, isFault: false };
  const x = toModelVector(features, model.normalizeRatios).values;
  let sumSq = 0;
  // Dimensions 1..4 carry spectral shape & impact crest
  for (let j = 1; j < 5; j++) {
    const z = (x[j] - model.mean[j]) / model.std[j];
    sumSq += z * z;
  }
  const zScore = Number(Math.sqrt(sumSq / 4).toFixed(2));
  return { zScore, isFault: zScore >= zCutoff };
}

/** 3. TinyML Neural Network (5 inputs -> 6 ReLU hidden units -> 4 softmax classes = 64 floats = 256 bytes). */
export interface TinyMlpModel {
  normalizeRatios: boolean;
  w1: number[][]; // 6 x 5
  b1: number[]; // 6
  w2: number[][]; // 4 x 6
  b2: number[]; // 4
  lossHistory: number[];
  paramCount: number;
  byteSize: number;
}

export function trainTinyMlp(
  rows: readonly PumpSample[],
  opts: { normalizeRatios?: boolean; epochs?: number; lr?: number } = {},
): TinyMlpModel {
  const normalizeRatios = opts.normalizeRatios ?? true;
  const epochs = opts.epochs ?? 180;
  const lr = opts.lr ?? 0.55;
  const r = rng(1409);

  const H = 6;
  const D = 5;
  const C = PUMP_CLASSES.length;
  const w1 = Array.from({ length: H }, () =>
    Array.from({ length: D }, () => (r() - 0.5) * 0.9),
  );
  const b1 = Array.from({ length: H }, () => 0.1);
  const w2 = Array.from({ length: C }, () =>
    Array.from({ length: H }, () => (r() - 0.5) * 0.9),
  );
  const b2 = Array.from({ length: C }, () => 0);

  const data = rows.map((row) => ({
    x: toModelVector(row.features, normalizeRatios).values,
    y: PUMP_CLASSES.indexOf(row.label),
  }));
  const n = Math.max(1, data.length);
  const lossHistory: number[] = [];

  for (let ep = 0; ep < epochs; ep++) {
    let totalLoss = 0;
    const dw1 = Array.from({ length: H }, () => new Array<number>(D).fill(0));
    const db1 = new Array<number>(H).fill(0);
    const dw2 = Array.from({ length: C }, () => new Array<number>(H).fill(0));
    const db2 = new Array<number>(C).fill(0);

    for (const s of data) {
      const h = new Array<number>(H);
      for (let i = 0; i < H; i++) {
        let z = b1[i];
        for (let j = 0; j < D; j++) z += w1[i][j] * s.x[j];
        h[i] = z > 0 ? z : 0;
      }

      const logits = new Array<number>(C);
      let maxL = -Infinity;
      for (let c = 0; c < C; c++) {
        let z = b2[c];
        for (let i = 0; i < H; i++) z += w2[c][i] * h[i];
        logits[c] = z;
        if (z > maxL) maxL = z;
      }

      let expSum = 0;
      const probs = new Array<number>(C);
      for (let c = 0; c < C; c++) {
        probs[c] = Math.exp(logits[c] - maxL);
        expSum += probs[c];
      }
      for (let c = 0; c < C; c++) probs[c] /= expSum;

      totalLoss -= Math.log(Math.max(1e-9, probs[s.y]));

      const dLogit = probs.map((p, c) => p - (c === s.y ? 1 : 0));
      for (let c = 0; c < C; c++) {
        db2[c] += dLogit[c];
        for (let i = 0; i < H; i++) dw2[c][i] += dLogit[c] * h[i];
      }

      for (let i = 0; i < H; i++) {
        if (h[i] <= 0) continue;
        let dh = 0;
        for (let c = 0; c < C; c++) dh += w2[c][i] * dLogit[c];
        db1[i] += dh;
        for (let j = 0; j < D; j++) dw1[i][j] += dh * s.x[j];
      }
    }

    const step = lr / n;
    for (let i = 0; i < H; i++) {
      b1[i] -= step * db1[i];
      for (let j = 0; j < D; j++) w1[i][j] -= step * dw1[i][j];
    }
    for (let c = 0; c < C; c++) {
      b2[c] -= step * db2[c];
      for (let i = 0; i < H; i++) w2[c][i] -= step * dw2[c][i];
    }

    if (ep % 12 === 0 || ep === epochs - 1) {
      lossHistory.push(Number((totalLoss / n).toFixed(3)));
    }
  }

  return {
    normalizeRatios,
    w1,
    b1,
    w2,
    b2,
    lossHistory,
    paramCount: H * D + H + C * H + C, // 64 floats
    byteSize: (H * D + H + C * H + C) * 4, // 256 bytes
  };
}

export function predictTinyMlp(
  mlp: TinyMlpModel,
  features: PumpFeatures,
): EdgePrediction & { hidden: number[] } {
  const x = toModelVector(features, mlp.normalizeRatios).values;
  const H = mlp.b1.length;
  const C = PUMP_CLASSES.length;
  const hidden = new Array<number>(H);

  for (let i = 0; i < H; i++) {
    let z = mlp.b1[i];
    for (let j = 0; j < 5; j++) z += mlp.w1[i][j] * x[j];
    hidden[i] = Number((z > 0 ? z : 0).toFixed(3));
  }

  const logits = new Array<number>(C);
  let maxL = -Infinity;
  for (let c = 0; c < C; c++) {
    let z = mlp.b2[c];
    for (let i = 0; i < H; i++) z += mlp.w2[c][i] * hidden[i];
    logits[c] = z;
    if (z > maxL) maxL = z;
  }

  let expSum = 0;
  const probabilities = {} as Record<PumpClass, number>;
  let best: PumpClass = 'healthy';
  let bestP = -1;

  for (let c = 0; c < C; c++) {
    logits[c] = Math.exp(logits[c] - maxL);
    expSum += logits[c];
  }
  for (let c = 0; c < C; c++) {
    const cls = PUMP_CLASSES[c];
    const p = logits[c] / Math.max(1e-9, expSum);
    probabilities[cls] = Number(p.toFixed(4));
    if (p > bestP) {
      bestP = p;
      best = cls;
    }
  }

  return {
    predicted: best,
    probabilities,
    hidden,
    isFault: best === 'bearing' || best === 'cavitation',
  };
}

/** 4. Naive baseline: alarm whenever overall vibration RMS exceeds `rmsLimit`. */
export function predictRmsThreshold(features: PumpFeatures, rmsLimit = 0.62): boolean {
  return features.rms >= rmsLimit;
}

export interface PumpAiBundle {
  centroid: EdgePumpModel;
  zscore: AnomalyZModel;
  mlp: TinyMlpModel;
}

export interface PumpAiDecision {
  mode: PumpAiMode;
  isFault: boolean;
  predictedClass: PumpClass | 'anomaly';
  confidence: number;
  zScore?: number;
  hidden?: number[];
  oledLine1: string;
  oledLine2: string;
  serial: string;
}

export function runPumpAi(
  mode: PumpAiMode,
  features: PumpFeatures,
  bundle: PumpAiBundle,
  opts: { rmsLimit: number; zCutoff?: number },
): PumpAiDecision {
  if (mode === 'threshold') {
    const isFault = predictRmsThreshold(features, opts.rmsLimit);
    return {
      mode,
      isFault,
      predictedClass: isFault ? 'cavitation' : features.rms < 0.14 ? 'idle' : 'healthy',
      confidence: isFault ? 1 : 0,
      oledLine1: `IF rms>=${opts.rmsLimit.toFixed(2)}g`,
      oledLine2: `RMS:${features.rms.toFixed(2)}g ${isFault ? 'FAULT!' : 'OK'}`,
      serial: `[MPU6050] RULE rms=${features.rms.toFixed(2)}g thr=${opts.rmsLimit.toFixed(2)}g => ${isFault ? 'ALARM' : 'OK'}`,
    };
  }

  if (mode === 'zscore') {
    const z = predictAnomalyModel(bundle.zscore, features, opts.zCutoff ?? 2.6);
    return {
      mode,
      isFault: z.isFault,
      predictedClass: z.isFault ? 'anomaly' : features.rms < 0.14 ? 'idle' : 'healthy',
      confidence: Math.min(1, z.zScore / 5),
      zScore: z.zScore,
      oledLine1: `Z-SCORE: ${z.zScore.toFixed(1)}s`,
      oledLine2: z.isFault ? 'ANOMALY!' : 'NORMAL HUM',
      serial: `[MPU6050] ZSCORE dist=${z.zScore.toFixed(2)}sigma => ${z.isFault ? 'UNFAMILIAR_FAULT!' : 'HEALTHY'}`,
    };
  }

  if (mode === 'tiny-nn') {
    const nn = predictTinyMlp(bundle.mlp, features);
    const pct = Math.round(nn.probabilities[nn.predicted] * 100);
    return {
      mode,
      isFault: nn.isFault,
      predictedClass: nn.predicted,
      confidence: nn.probabilities[nn.predicted],
      hidden: nn.hidden,
      oledLine1: `MLP(256B) ${pct}%`,
      oledLine2: nn.predicted.toUpperCase(),
      serial: `[MPU6050] TINY_MLP hi=${features.highBand.toFixed(2)} => ${nn.predicted.toUpperCase()} (${pct}%)`,
    };
  }

  const ce = predictEdgeModel(bundle.centroid, features);
  const pct = Math.round(ce.probabilities[ce.predicted] * 100);
  return {
    mode,
    isFault: ce.isFault,
    predictedClass: ce.predicted,
    confidence: ce.probabilities[ce.predicted],
    oledLine1: `CENTROID(80B) ${pct}%`,
    oledLine2: ce.predicted.toUpperCase(),
    serial: `[MPU6050] FFT_CENTROID hi=${features.highBand.toFixed(2)} => ${ce.predicted.toUpperCase()} (${pct}%)`,
  };
}

export interface PumpEvalMetrics {
  accuracy: number;
  bearingRecall: number;
  falseAlarmRate: number;
}

export function evaluatePumpModels(
  testRows: readonly PumpSample[],
  model: EdgePumpModel,
  rmsLimit = 0.62,
): { edge: PumpEvalMetrics; threshold: PumpEvalMetrics } {
  let edgeCorrect = 0;
  let edgeBearingCaught = 0;
  let edgeFalseAlarms = 0;

  let thFaultCorrect = 0;
  let thBearingCaught = 0;
  let thFalseAlarms = 0;

  let bearingTotal = 0;
  let safeTotal = 0;

  for (const r of testRows) {
    const trueFault = r.label === 'bearing' || r.label === 'cavitation';
    if (r.label === 'bearing') bearingTotal++;
    if (!trueFault) safeTotal++;

    const ep = predictEdgeModel(model, r.features);
    if (ep.predicted === r.label) edgeCorrect++;
    if (r.label === 'bearing' && ep.isFault) edgeBearingCaught++;
    if (!trueFault && ep.isFault) edgeFalseAlarms++;

    const tp = predictRmsThreshold(r.features, rmsLimit);
    if (tp === trueFault) thFaultCorrect++;
    if (r.label === 'bearing' && tp) thBearingCaught++;
    if (!trueFault && tp) thFalseAlarms++;
  }

  const n = Math.max(1, testRows.length);
  return {
    edge: {
      accuracy: edgeCorrect / n,
      bearingRecall: bearingTotal ? edgeBearingCaught / bearingTotal : 0,
      falseAlarmRate: safeTotal ? edgeFalseAlarms / safeTotal : 0,
    },
    threshold: {
      accuracy: thFaultCorrect / n,
      bearingRecall: bearingTotal ? thBearingCaught / bearingTotal : 0,
      falseAlarmRate: safeTotal ? thFalseAlarms / safeTotal : 0,
    },
  };
}

/** Evaluates any of the 4 PumpAiModes on unseen test windows (fault recall vs false alarms). */
export function evaluateAnyPumpAi(
  testRows: readonly PumpSample[],
  mode: PumpAiMode,
  bundle: PumpAiBundle,
  rmsLimit = 0.62,
): PumpEvalMetrics {
  let right = 0;
  let bearingCaught = 0;
  let falseAlarms = 0;
  let bearingTotal = 0;
  let safeTotal = 0;

  for (const r of testRows) {
    const trueFault = r.label === 'bearing' || r.label === 'cavitation';
    if (r.label === 'bearing') bearingTotal++;
    if (!trueFault) safeTotal++;

    const dec = runPumpAi(mode, r.features, bundle, { rmsLimit });
    if (mode === 'threshold' || mode === 'zscore') {
      if (dec.isFault === trueFault) right++;
    } else if (dec.predictedClass === r.label) {
      right++;
    }
    if (r.label === 'bearing' && dec.isFault) bearingCaught++;
    if (!trueFault && dec.isFault) falseAlarms++;
  }

  return {
    accuracy: right / Math.max(1, testRows.length),
    bearingRecall: bearingTotal ? bearingCaught / bearingTotal : 0,
    falseAlarmRate: safeTotal ? falseAlarms / safeTotal : 0,
  };
}

export function applyPersistenceGuard(
  windowFeatures: readonly PumpFeatures[],
  model: EdgePumpModel,
  opts: { minConsecutive: number; rejectRoadRumble: boolean },
): boolean[] {
  let streak = 0;
  return windowFeatures.map((f) => {
    const pred = predictEdgeModel(model, f);
    const roadRumble =
      opts.rejectRoadRumble && f.lowBand > (f.midBand + f.highBand) * 2.2 && f.highBand < 0.18;
    if (pred.isFault && !roadRumble) {
      streak++;
    } else {
      streak = 0;
    }
    return streak >= Math.max(1, opts.minConsecutive);
  });
}

export interface DeploymentStats {
  dailyBytes: number;
  batteryDays: number;
  worksInBlackout: boolean;
}

export function compareEdgeVsCloud(opts: {
  batteryMah: number;
  sampleRateHz?: number;
  alertsPerDay?: number;
}): { cloud: DeploymentStats; edge: DeploymentStats } {
  const fs = opts.sampleRateHz ?? SAMPLE_RATE;
  const alerts = opts.alertsPerDay ?? 2;

  const cloudDailyBytes = fs * 2 * 86400;
  const cloudCurrentMa = 95;
  const cloudDays = Math.max(1, Math.round(opts.batteryMah / (cloudCurrentMa * 24)));

  const edgeDailyBytes = Math.max(64, alerts * 32 + 32);
  const edgeCurrentMa = 0.32;
  const edgeDays = Math.max(1, Math.round(opts.batteryMah / (edgeCurrentMa * 24)));

  return {
    cloud: {
      dailyBytes: cloudDailyBytes,
      batteryDays: cloudDays,
      worksInBlackout: false,
    },
    edge: {
      dailyBytes: edgeDailyBytes,
      batteryDays: edgeDays,
      worksInBlackout: true,
    },
  };
}
