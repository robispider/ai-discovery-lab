/*
 * Time-series IoT engine for Lesson 13 (Smart drain & canal flood sensors).
 * Pure TypeScript, no React: median spike rejection, moving-average smoothing,
 * 4 selectable AI / control brains (IF-THEN Rule, CART Decision Tree,
 * Multi-sensor +30m Trend Forecaster, and Remote Cloud API),
 * sensor-health diagnostics, and ward placement coverage analysis.
 */
import { buildTree, leafFor, pathFor, type Row, type TreeNode } from '../tree';

export const TICK_MINUTES = 5;
export const FLOOD_CM = 85;
export const FORECAST_TICKS = 6; // 30 minutes ahead (6 × 5 min)
export const PUMP_SPINUP_MIN = 20;

export type FaultMode = 'none' | 'spikes' | 'stuck' | 'dropout';
export type DrainAiMode = 'rule' | 'tree' | 'timeseries' | 'cloud';

export const DRAIN_AI_MODES: readonly DrainAiMode[] = ['rule', 'tree', 'timeseries', 'cloud'];

export interface DrainTick {
  /** Minutes since start of episode (0, 5, 10, …). */
  minute: number;
  /** True physical water depth in the ward drain (cm), hidden in real life. */
  trueLevelCm: number;
  /** Raw ultrasonic reading arriving from the drain node (cm), or null if packet dropped. */
  rawLevelCm: number | null;
  /** Upstream canal water level 1.2 km away (cm). */
  upstreamCm: number;
  /** Rainfall intensity from tipping-bucket gauge (mm/hr). */
  rainMmHr: number;
}

export interface StormEpisode {
  id: string;
  split: 'train' | 'test';
  floods: boolean;
  name: { en: string; bn: string };
  ticks: DrainTick[];
}

export interface CleanedTick {
  minute: number;
  rawLevelCm: number | null;
  trueLevelCm: number;
  /** Packet-gap filled + median spike-rejected + moving-average smoothed level (cm). */
  cleanLevelCm: number;
  /** 15-minute (3-tick) rate of rise in cm per 15 min. */
  rise15m: number;
  upstreamCm: number;
  rainMmHr: number;
  spikeRejected: boolean;
  packetDropped: boolean;
}

/** Injects realistic field faults into an episode's raw sensor stream. */
export function injectFault(ticks: readonly DrainTick[], mode: FaultMode): DrainTick[] {
  if (mode === 'none') return ticks.map((t) => ({ ...t }));
  return ticks.map((t, i) => {
    if (mode === 'spikes') {
      const extraSpike = i === 7 || i === 14 || i === 22;
      return {
        ...t,
        rawLevelCm: extraSpike ? Math.min(135, Math.round(t.trueLevelCm + 58)) : t.rawLevelCm,
      };
    }
    if (mode === 'stuck') {
      const stuckVal = ticks[6]?.rawLevelCm ?? 36;
      return {
        ...t,
        rawLevelCm: i >= 7 ? stuckVal : t.rawLevelCm,
      };
    }
    if (mode === 'dropout') {
      const dropped = i >= 5 && i % 3 !== 0;
      return {
        ...t,
        rawLevelCm: dropped ? null : t.rawLevelCm,
      };
    }
    return { ...t };
  });
}

function median3(a: number, b: number, c: number): number {
  return a + b + c - Math.min(a, b, c) - Math.max(a, b, c);
}

/**
 * Cleans a raw IoT water-level stream:
 * 1. Holds last known reading across dropped packets.
 * 2. Optional 3-point median filter to reject 1-tick debris splashes.
 * 3. Moving-average smoothing over `smoothWindow` ticks (1 = no smoothing).
 */
export function cleanStream(
  ticks: readonly DrainTick[],
  opts: { rejectSpikes: boolean; smoothWindow: number },
): CleanedTick[] {
  const win = Math.max(1, Math.min(9, Math.round(opts.smoothWindow)));
  const held: number[] = [];
  const dropped: boolean[] = [];
  let last = ticks[0]?.rawLevelCm ?? ticks[0]?.trueLevelCm ?? 25;

  for (const t of ticks) {
    if (t.rawLevelCm === null || Number.isNaN(t.rawLevelCm)) {
      held.push(last);
      dropped.push(true);
    } else {
      last = t.rawLevelCm;
      held.push(t.rawLevelCm);
      dropped.push(false);
    }
  }

  const despiked = held.map((v, i) => {
    if (!opts.rejectSpikes || held.length < 3) return v;
    const prev = held[Math.max(0, i - 1)];
    const next = held[Math.min(held.length - 1, i + 1)];
    return median3(prev, v, next);
  });

  const smoothed = despiked.map((_, i) => {
    const start = Math.max(0, i - win + 1);
    let sum = 0;
    for (let j = start; j <= i; j++) sum += despiked[j];
    return sum / (i - start + 1);
  });

  return ticks.map((t, i) => {
    const prev3 = smoothed[Math.max(0, i - 3)];
    return {
      minute: t.minute,
      rawLevelCm: t.rawLevelCm,
      trueLevelCm: t.trueLevelCm,
      cleanLevelCm: Number(smoothed[i].toFixed(2)),
      rise15m: Number((smoothed[i] - prev3).toFixed(2)),
      upstreamCm: t.upstreamCm,
      rainMmHr: t.rainMmHr,
      spikeRejected: opts.rejectSpikes && !dropped[i] && Math.abs(held[i] - despiked[i]) > 14,
      packetDropped: dropped[i],
    };
  });
}

export interface SensorHealthReport {
  status: 'healthy' | 'stuck' | 'dropout' | 'noisy';
  stuckTicks: number;
  droppedCount: number;
  spikeCount: number;
}

/** Cross-checks the drain sensor against rain & upstream sensors to spot hardware/network faults. */
export function checkSensorHealth(cleaned: readonly CleanedTick[]): SensorHealthReport {
  let droppedCount = 0;
  let spikeCount = 0;
  let maxFlatDuringRain = 0;
  let curFlat = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (c.packetDropped) {
      droppedCount++;
      curFlat = 0;
      continue;
    }
    if (c.spikeRejected) spikeCount++;
    if (
      i > 0 &&
      !cleaned[i - 1].packetDropped &&
      c.rawLevelCm !== null &&
      cleaned[i - 1].rawLevelCm !== null
    ) {
      const prevRaw = cleaned[i - 1].rawLevelCm!;
      const sameReading = Math.abs(c.rawLevelCm - prevRaw) < 0.25;
      const stormActive = c.rainMmHr >= 25 || c.upstreamCm >= 75;
      if (sameReading && stormActive) {
        curFlat++;
        if (curFlat > maxFlatDuringRain) maxFlatDuringRain = curFlat;
      } else {
        curFlat = 0;
      }
    }
  }

  if (maxFlatDuringRain >= 4) {
    return { status: 'stuck', stuckTicks: maxFlatDuringRain + 1, droppedCount, spikeCount };
  }
  if (droppedCount >= Math.ceil(cleaned.length * 0.3)) {
    return { status: 'dropout', stuckTicks: 0, droppedCount, spikeCount };
  }
  if (spikeCount >= 3) {
    return { status: 'noisy', stuckTicks: 0, droppedCount, spikeCount };
  }
  return { status: 'healthy', stuckTicks: 0, droppedCount, spikeCount };
}

export interface ForecasterModel {
  bias: number;
  weights: [number, number, number, number];
  lossHistory: number[];
}

const SCALES: [number, number, number, number] = [100, 30, 140, 100];

export const FEATURE_NAMES = ['level', 'rise15m', 'upstream', 'rain'] as const;

function featuresOf(c: CleanedTick): [number, number, number, number] {
  return [
    c.cleanLevelCm / SCALES[0],
    c.rise15m / SCALES[1],
    c.upstreamCm / SCALES[2],
    c.rainMmHr / SCALES[3],
  ];
}

export function drainRowOf(c: CleanedTick): Row {
  return {
    level: Math.round(c.cleanLevelCm),
    rise15m: Math.round(c.rise15m),
    upstream: c.upstreamCm,
    rain: c.rainMmHr,
  };
}

/** Predicts water depth `FORECAST_TICKS` (30 min) ahead in cm. */
export function predictLevelAhead(model: ForecasterModel, c: CleanedTick): number {
  const x = featuresOf(c);
  const y =
    model.bias +
    model.weights[0] * x[0] +
    model.weights[1] * x[1] +
    model.weights[2] * x[2] +
    model.weights[3] * x[3];
  return Math.max(10, Math.min(145, Number(y.toFixed(2))));
}

/** Trains a transparent linear multi-sensor 30-min-ahead water-level forecaster via gradient descent. */
export function trainForecaster(
  episodes: readonly StormEpisode[],
  opts: { epochs?: number; lr?: number; rejectSpikes?: boolean; smoothWindow?: number } = {},
): ForecasterModel {
  const epochs = opts.epochs ?? 160;
  const lr = opts.lr ?? 0.35;
  const rejectSpikes = opts.rejectSpikes ?? true;
  const smoothWindow = opts.smoothWindow ?? 3;

  const samples: { x: [number, number, number, number]; y: number }[] = [];
  for (const ep of episodes) {
    const cleaned = cleanStream(ep.ticks, { rejectSpikes, smoothWindow });
    for (let t = 0; t + FORECAST_TICKS < cleaned.length; t++) {
      samples.push({
        x: featuresOf(cleaned[t]),
        y: ep.ticks[t + FORECAST_TICKS].trueLevelCm,
      });
    }
  }

  let bias = 25;
  const weights: [number, number, number, number] = [20, 0, 0, 0];
  const lossHistory: number[] = [];
  const n = Math.max(1, samples.length);

  for (let ep = 0; ep < epochs; ep++) {
    let db = 0;
    let dw0 = 0;
    let dw1 = 0;
    let dw2 = 0;
    let dw3 = 0;
    let sqErr = 0;

    for (const s of samples) {
      const pred =
        bias +
        weights[0] * s.x[0] +
        weights[1] * s.x[1] +
        weights[2] * s.x[2] +
        weights[3] * s.x[3];
      const err = pred - s.y;
      sqErr += err * err;
      db += err;
      dw0 += err * s.x[0];
      dw1 += err * s.x[1];
      dw2 += err * s.x[2];
      dw3 += err * s.x[3];
    }

    const step = lr / n;
    bias -= step * db * 0.5;
    weights[0] -= step * dw0 * 1.4;
    weights[1] -= step * dw1 * 1.8;
    weights[2] -= step * dw2 * 1.4;
    weights[3] -= step * dw3 * 1.4;

    if (ep % 8 === 0 || ep === epochs - 1) {
      lossHistory.push(Number(Math.sqrt(sqErr / n).toFixed(2)));
    }
  }

  return {
    bias: Number(bias.toFixed(2)),
    weights: [
      Number(weights[0].toFixed(2)),
      Number(weights[1].toFixed(2)),
      Number(weights[2].toFixed(2)),
      Number(weights[3].toFixed(2)),
    ],
    lossHistory,
  };
}

/** Trains an interpretable CART Decision Tree on sensor streams to warn 30 min before spillover. */
export function trainDrainTree(
  episodes: readonly StormEpisode[],
  opts: { maxDepth?: number; rejectSpikes?: boolean; smoothWindow?: number } = {},
): TreeNode {
  const maxDepth = opts.maxDepth ?? 3;
  const rejectSpikes = opts.rejectSpikes ?? true;
  const smoothWindow = opts.smoothWindow ?? 3;
  const rows: (Row & { y: number })[] = [];

  for (const ep of episodes) {
    const cleaned = cleanStream(ep.ticks, { rejectSpikes, smoothWindow });
    for (let t = 0; t + FORECAST_TICKS < cleaned.length; t++) {
      let floodsSoon = 0;
      for (let k = 0; k <= FORECAST_TICKS; k++) {
        if (ep.ticks[t + k].trueLevelCm >= FLOOD_CM) {
          floodsSoon = 1;
          break;
        }
      }
      rows.push({ ...drainRowOf(cleaned[t]), y: floodsSoon });
    }
  }
  return buildTree(rows, ['upstream', 'level', 'rain', 'rise15m'], maxDepth);
}

export function predictDrainTree(
  tree: TreeNode,
  c: CleanedTick,
): { prob: number; triggers: boolean; path: TreeNode[] } {
  const row = drainRowOf(c);
  const leaf = leafFor(tree, row);
  const prob = leaf.n ? leaf.pos / leaf.n : 0;
  return {
    prob,
    triggers: prob >= 0.5,
    path: pathFor(tree, row),
  };
}

export interface DrainAiDecision {
  mode: DrainAiMode;
  online: boolean;
  triggers: boolean;
  displayCm: number;
  confidence: number;
  treePath?: TreeNode[];
  oledLine1: string;
  oledLine2: string;
  serial: string;
}

/** Runs whichever AI brain the user selected on the current sensor tick. */
export function runDrainAi(
  mode: DrainAiMode,
  c: CleanedTick,
  raw: DrainTick,
  models: { forecaster: ForecasterModel; tree: TreeNode },
  opts: {
    thresholdCm: number;
    forecastAlarmCm: number;
    healthGuard?: boolean;
    health?: SensorHealthReport;
    networkDown?: boolean;
  },
): DrainAiDecision {
  const rawVal = raw.rawLevelCm ?? Math.round(c.cleanLevelCm);
  const mm = String(Math.floor(c.minute / 60)).padStart(2, '0') + ':' + String(c.minute % 60).padStart(2, '0');
  const backupSurge =
    Boolean(opts.healthGuard) &&
    opts.health?.status === 'stuck' &&
    c.upstreamCm >= 95 &&
    c.rainMmHr >= 50;

  if (mode === 'rule') {
    const triggers = rawVal >= opts.thresholdCm || backupSurge;
    return {
      mode,
      online: true,
      triggers,
      displayCm: rawVal,
      confidence: triggers ? 1 : 0,
      oledLine1: `IF raw>=${opts.thresholdCm}cm`,
      oledLine2: `RAW:${rawVal}cm ${triggers ? 'PUMP!' : 'IDLE'}`,
      serial: `[${mm}] RULE raw=${rawVal}cm thr=${opts.thresholdCm} => ${triggers ? 'PUMP_ON' : 'WAIT'}`,
    };
  }

  if (mode === 'tree') {
    const tr = predictDrainTree(models.tree, c);
    const triggers = tr.triggers || backupSurge;
    const pct = Math.round(tr.prob * 100);
    return {
      mode,
      online: true,
      triggers,
      displayCm: Math.round(c.cleanLevelCm),
      confidence: tr.prob,
      treePath: tr.path,
      oledLine1: `TREE p=${pct}% (${tr.path.length - 1}Q)`,
      oledLine2: `UP:${c.upstreamCm}cm ${triggers ? 'PUMP!' : 'SAFE'}`,
      serial: `[${mm}] TREE lvl=${Math.round(c.cleanLevelCm)} up=${c.upstreamCm} rain=${c.rainMmHr} => p=${pct}% ${triggers ? 'PUMP_ON' : 'WAIT'}`,
    };
  }

  if (mode === 'cloud') {
    const offline = Boolean(opts.networkDown) || c.packetDropped;
    if (offline) {
      return {
        mode,
        online: false,
        triggers: false,
        displayCm: Math.round(c.cleanLevelCm),
        confidence: 0,
        oledLine1: 'CLOUD 4G: LOST!',
        oledLine2: 'ERR: TIMEOUT',
        serial: `[${mm}] WIFI POST /predict -> ERR_NET_TIMEOUT (pump stays OFF!)`,
      };
    }
    const pred = predictLevelAhead(models.forecaster, c);
    const triggers = pred >= opts.forecastAlarmCm || backupSurge;
    return {
      mode,
      online: true,
      triggers,
      displayCm: Math.round(pred),
      confidence: Math.min(1, Math.max(0, (pred - 45) / 55)),
      oledLine1: `CLOUD +30m:${Math.round(pred)}cm`,
      oledLine2: `200 OK ${triggers ? 'PUMP!' : 'SAFE'}`,
      serial: `[${mm}] CLOUD 200 OK (+180ms) pred30m=${Math.round(pred)}cm => ${triggers ? 'PUMP_ON' : 'WAIT'}`,
    };
  }

  // 'timeseries' (Edge +30m forecaster)
  const pred = predictLevelAhead(models.forecaster, c);
  const triggers = pred >= opts.forecastAlarmCm || backupSurge;
  return {
    mode,
    online: true,
    triggers,
    displayCm: Math.round(pred),
    confidence: Math.min(1, Math.max(0, (pred - 45) / 55)),
    oledLine1: `TREND +30m:${Math.round(pred)}cm`,
    oledLine2: `SLOPE:${c.rise15m >= 0 ? '+' : ''}${Math.round(c.rise15m)} ${triggers ? 'PUMP!' : 'SAFE'}`,
    serial: `[${mm}] EDGE_TREND clean=${Math.round(c.cleanLevelCm)} +30m=${Math.round(pred)}cm => ${triggers ? 'PUMP_ON' : 'WAIT'}`,
  };
}

export function featureImportance(model: ForecasterModel): Record<(typeof FEATURE_NAMES)[number], number> {
  const abs = model.weights.map((w) => Math.abs(w));
  const sum = Math.max(1e-6, abs.reduce((a, b) => a + b, 0));
  return {
    level: abs[0] / sum,
    rise15m: abs[1] / sum,
    upstream: abs[2] / sum,
    rain: abs[3] / sum,
  };
}

export interface EpisodeAlarmResult {
  episodeId: string;
  flooded: boolean;
  firstFloodMinute: number | null;
  alarmMinute: number | null;
  leadMinutes: number | null;
  outcome: 'timely' | 'late' | 'missed' | 'false-alarm' | 'true-safe';
}

export interface ControllerSummary {
  results: EpisodeAlarmResult[];
  floodCount: number;
  timelyCatches: number;
  lateOrMissed: number;
  falseAlarms: number;
  trueSafe: number;
  avgLeadMinutes: number;
}

export function evaluateController(
  episodes: readonly StormEpisode[],
  cleanOpts: { rejectSpikes: boolean; smoothWindow: number },
  shouldTrigger: (c: CleanedTick, raw: DrainTick, health: SensorHealthReport) => boolean,
): ControllerSummary {
  const results: EpisodeAlarmResult[] = [];
  let leadSum = 0;
  let leadN = 0;

  for (const ep of episodes) {
    const cleaned = cleanStream(ep.ticks, cleanOpts);
    const firstFloodIdx = ep.ticks.findIndex((t) => t.trueLevelCm >= FLOOD_CM);
    const firstFloodMinute = firstFloodIdx >= 0 ? ep.ticks[firstFloodIdx].minute : null;

    let alarmMinute: number | null = null;
    for (let i = 0; i < cleaned.length; i++) {
      const prefixHealth = checkSensorHealth(cleaned.slice(0, i + 1));
      if (shouldTrigger(cleaned[i], ep.ticks[i], prefixHealth)) {
        alarmMinute = cleaned[i].minute;
        break;
      }
    }

    if (firstFloodMinute !== null) {
      if (alarmMinute === null) {
        results.push({
          episodeId: ep.id,
          flooded: true,
          firstFloodMinute,
          alarmMinute: null,
          leadMinutes: null,
          outcome: 'missed',
        });
      } else {
        const lead = firstFloodMinute - alarmMinute;
        leadSum += lead;
        leadN++;
        results.push({
          episodeId: ep.id,
          flooded: true,
          firstFloodMinute,
          alarmMinute,
          leadMinutes: lead,
          outcome: lead >= PUMP_SPINUP_MIN ? 'timely' : 'late',
        });
      }
    } else {
      results.push({
        episodeId: ep.id,
        flooded: false,
        firstFloodMinute: null,
        alarmMinute,
        leadMinutes: null,
        outcome: alarmMinute !== null ? 'false-alarm' : 'true-safe',
      });
    }
  }

  const floodCount = results.filter((r) => r.flooded).length;
  const timelyCatches = results.filter((r) => r.outcome === 'timely').length;
  const lateOrMissed = results.filter((r) => r.outcome === 'late' || r.outcome === 'missed').length;
  const falseAlarms = results.filter((r) => r.outcome === 'false-alarm').length;
  const trueSafe = results.filter((r) => r.outcome === 'true-safe').length;

  return {
    results,
    floodCount,
    timelyCatches,
    lateOrMissed,
    falseAlarms,
    trueSafe,
    avgLeadMinutes: leadN ? Math.round(leadSum / leadN) : 0,
  };
}

export interface WardNode {
  id: string;
  name: { en: string; bn: string };
  zone: 'vip-main' | 'low-lying';
  elevationM: number;
  floodedInStorm: boolean;
}

export interface PlacementCoverage {
  monitoredWards: number;
  actualFloodedWards: number;
  detectedFloods: number;
  invisibleFloods: number;
  dashboardFloodRate: number;
}

export function evaluatePlacement(
  wards: readonly WardNode[],
  sensorWardIds: readonly string[],
): PlacementCoverage {
  const set = new Set(sensorWardIds);
  const actualFlooded = wards.filter((w) => w.floodedInStorm);
  const detected = actualFlooded.filter((w) => set.has(w.id));
  const monitored = wards.filter((w) => set.has(w.id));
  return {
    monitoredWards: monitored.length,
    actualFloodedWards: actualFlooded.length,
    detectedFloods: detected.length,
    invisibleFloods: actualFlooded.length - detected.length,
    dashboardFloodRate: monitored.length ? detected.length / monitored.length : 0,
  };
}
