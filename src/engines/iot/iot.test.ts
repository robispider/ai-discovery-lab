import { describe, expect, it } from 'vitest';
import {
  DRAIN_WARDS,
  EQUITABLE_PLACEMENT,
  TEST_STORMS,
  TRAIN_STORMS,
  VIP_ONLY_PLACEMENT,
} from '../../data/drainSensors';
import {
  applyHeatDrift,
  PUMP_TEST,
  PUMP_TRAIN,
  TRUCK_TIMELINE,
} from '../../data/pumpSensors';
import {
  checkSensorHealth,
  cleanStream,
  evaluateController,
  evaluatePlacement,
  FLOOD_CM,
  injectFault,
  predictDrainTree,
  predictLevelAhead,
  runDrainAi,
  trainDrainTree,
  trainForecaster,
} from './drain';
import {
  applyPersistenceGuard,
  compareEdgeVsCloud,
  evaluateAnyPumpAi,
  evaluatePumpModels,
  extractPumpFeatures,
  predictEdgeModel,
  trainAnomalyModel,
  trainEdgeModel,
  trainTinyMlp,
} from './pump';

describe('drain IoT time-series engine (lesson 13)', () => {
  it('rejects single-tick ultrasonic splash spikes while keeping true surges', () => {
    const shower = TEST_STORMS.find((s) => !s.floods)!;
    const rawMax = Math.max(...shower.ticks.map((t) => t.rawLevelCm ?? 0));
    expect(rawMax).toBeGreaterThanOrEqual(92);

    const cleaned = cleanStream(shower.ticks, { rejectSpikes: true, smoothWindow: 3 });
    const cleanMax = Math.max(...cleaned.map((c) => c.cleanLevelCm));
    expect(cleanMax).toBeLessThan(FLOOD_CM - 10);
    expect(cleaned.some((c) => c.spikeRejected)).toBe(true);
  });

  it('trains a 30-minute forecaster that beats raw and smoothed thresholds on unseen storms', () => {
    const model = trainForecaster(TRAIN_STORMS, { epochs: 160 });
    expect(model.lossHistory.at(-1)!).toBeLessThan(model.lossHistory[0]);

    // 1. Raw threshold (78 cm) gets fooled by debris spikes on safe showers
    const rawEval = evaluateController(
      TEST_STORMS,
      { rejectSpikes: false, smoothWindow: 1 },
      (_c, raw) => (raw.rawLevelCm ?? 0) >= 78,
    );
    expect(rawEval.falseAlarms).toBeGreaterThanOrEqual(2);

    // 2. Smoothed threshold (78 cm) avoids false alarms, but warns too late (< 20 min spin-up)
    const smoothEval = evaluateController(
      TEST_STORMS,
      { rejectSpikes: true, smoothWindow: 3 },
      (c) => c.cleanLevelCm >= 78,
    );
    expect(smoothEval.falseAlarms).toBe(0);
    expect(smoothEval.avgLeadMinutes).toBeLessThan(20);

    // 3. Multi-sensor 30-min AI forecaster warns >= 20 min early with 0 false alarms
    const aiEval = evaluateController(
      TEST_STORMS,
      { rejectSpikes: true, smoothWindow: 3 },
      (c) => predictLevelAhead(model, c) >= 82,
    );
    expect(aiEval.timelyCatches).toBe(aiEval.floodCount);
    expect(aiEval.falseAlarms).toBe(0);
    expect(aiEval.avgLeadMinutes).toBeGreaterThanOrEqual(20);
  });

  it('flags stuck mud-covered sensors and storm packet dropouts', () => {
    const flood = TEST_STORMS.find((s) => s.floods)!;
    const stuckClean = cleanStream(injectFault(flood.ticks, 'stuck'), {
      rejectSpikes: true,
      smoothWindow: 3,
    });
    expect(checkSensorHealth(stuckClean).status).toBe('stuck');

    const dropClean = cleanStream(injectFault(flood.ticks, 'dropout'), {
      rejectSpikes: true,
      smoothWindow: 3,
    });
    expect(checkSensorHealth(dropClean).status).toBe('dropout');
  });

  it('shows VIP-only sensor placement missing most low-lying floods', () => {
    const vip = evaluatePlacement(DRAIN_WARDS, VIP_ONLY_PLACEMENT);
    const fair = evaluatePlacement(DRAIN_WARDS, EQUITABLE_PLACEMENT);
    expect(vip.invisibleFloods).toBe(3);
    expect(fair.invisibleFloods).toBe(0);
  });

  it('supports selectable Decision Tree and Cloud AI modes on drain streams', () => {
    const tree = trainDrainTree(TRAIN_STORMS, { maxDepth: 3 });
    const forecaster = trainForecaster(TRAIN_STORMS, { epochs: 160 });
    const treeEval = evaluateController(
      TEST_STORMS,
      { rejectSpikes: true, smoothWindow: 3 },
      (c) => predictDrainTree(tree, c).triggers,
    );
    expect(treeEval.timelyCatches).toBe(treeEval.floodCount);
    expect(treeEval.falseAlarms).toBe(0);

    const storm = TEST_STORMS[0];
    const cleaned = cleanStream(storm.ticks, { rejectSpikes: true, smoothWindow: 3 });
    const offlineCloud = runDrainAi(
      'cloud',
      cleaned[14],
      storm.ticks[14],
      { forecaster, tree },
      { thresholdCm: 78, forecastAlarmCm: 82, networkDown: true },
    );
    expect(offlineCloud.online).toBe(false);
    expect(offlineCloud.triggers).toBe(false);
  });
});

describe('pump vibration & Edge AI engine (lesson 14)', () => {
  it('extracts spectral bands and separates early bearing wear that RMS threshold misses', () => {
    const model = trainEdgeModel(PUMP_TRAIN, true);
    expect(model.byteSize).toBe(80);

    const res = evaluatePumpModels(PUMP_TEST, model, 0.62);
    expect(res.edge.accuracy).toBeGreaterThanOrEqual(0.95);
    expect(res.edge.bearingRecall).toBeGreaterThanOrEqual(0.95);
    // Simple RMS loudness misses early bearing wear!
    expect(res.threshold.bearingRecall).toBeLessThan(0.3);
  });

  it('survives monsoon tin-shed gain drift when spectral ratios are normalized', () => {
    const normModel = trainEdgeModel(PUMP_TRAIN, true);
    const rawModel = trainEdgeModel(PUMP_TRAIN, false);

    const healthyTest = PUMP_TEST.filter((s) => s.label === 'healthy');
    const normRight = healthyTest.filter(
      (s) => predictEdgeModel(normModel, applyHeatDrift(s.samples)).predicted === 'healthy',
    ).length;
    const rawRight = healthyTest.filter(
      (s) => predictEdgeModel(rawModel, applyHeatDrift(s.samples)).predicted === 'healthy',
    ).length;

    expect(normRight).toBe(healthyTest.length);
    expect(rawRight).toBeLessThan(healthyTest.length);
  });

  it('suppresses passing-truck rumble while still catching sustained bearing faults', () => {
    const model = trainEdgeModel(PUMP_TRAIN, true);
    const feats = TRUCK_TIMELINE.map((w) => w.features);

    const guarded = applyPersistenceGuard(feats, model, {
      minConsecutive: 3,
      rejectRoadRumble: true,
    });
    // Windows 2..3 (index 2, 3) are the passing truck -> must NOT alarm
    expect(guarded[2]).toBe(false);
    expect(guarded[3]).toBe(false);
    // Windows 6..9 (4 consecutive bearing windows) -> triggers by index 8!
    expect(guarded[8]).toBe(true);
    expect(guarded[9]).toBe(true);
  });

  it('computes pure sine DFT in the expected frequency band and Edge battery savings', () => {
    const sine75Hz = Array.from({ length: 128 }, (_, i) => Math.sin((2 * Math.PI * 75 * i) / 200));
    const f = extractPumpFeatures(sine75Hz);
    expect(f.highBand).toBeGreaterThan(f.lowBand * 4);

    const dep = compareEdgeVsCloud({ batteryMah: 6000 });
    expect(dep.edge.batteryDays).toBeGreaterThan(dep.cloud.batteryDays * 50);
    expect(dep.edge.dailyBytes).toBeLessThan(1000);
    expect(dep.cloud.dailyBytes).toBeGreaterThan(30_000_000);
  });

  it('trains unsupervised Z-score anomaly and 256-byte TinyML neural net on pump waves', () => {
    const bundle = {
      centroid: trainEdgeModel(PUMP_TRAIN, true),
      zscore: trainAnomalyModel(PUMP_TRAIN, true),
      mlp: trainTinyMlp(PUMP_TRAIN, { normalizeRatios: true, epochs: 180 }),
    };
    expect(bundle.zscore.byteSize).toBe(40);
    expect(bundle.mlp.byteSize).toBe(256);
    expect(bundle.mlp.lossHistory.at(-1)!).toBeLessThan(bundle.mlp.lossHistory[0]);

    const zEval = evaluateAnyPumpAi(PUMP_TEST, 'zscore', bundle);
    const nnEval = evaluateAnyPumpAi(PUMP_TEST, 'tiny-nn', bundle);
    expect(zEval.bearingRecall).toBeGreaterThanOrEqual(0.9);
    expect(nnEval.accuracy).toBeGreaterThanOrEqual(0.92);
    expect(nnEval.bearingRecall).toBeGreaterThanOrEqual(0.9);
  });
});
