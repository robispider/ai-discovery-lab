import { describe, expect, it } from 'vitest';
import {
  BALANCED_SAMPLE_IDS,
  computeFeatureMap,
  convolvePatch,
  DEFAULT_CONDITION,
  EVAL_ITEMS,
  evaluateBatch,
  extractFeatures,
  extractFeaturesFromRgbGrid,
  getWasteItem,
  IMBALANCED_SAMPLE_IDS,
  predictHead,
  renderPixelGrid,
  samplesFromIds,
  STARTER_SAMPLE_IDS,
  trainHead,
} from './index';

describe('vision transfer-learning engine', () => {
  it('computes deterministic 10×10 pixel grids and 8×8 3×3 convolution feature maps', () => {
    const bottle = getWasteItem('pet-bottle');
    const grid = renderPixelGrid(bottle, DEFAULT_CONDITION);
    expect(grid).toHaveLength(10);
    expect(grid[0]).toHaveLength(10);

    const patch = convolvePatch(grid, 4, 4, 'shine');
    expect(patch.inputs).toHaveLength(3);
    expect(patch.products).toHaveLength(3);
    expect(patch.relu).toBe(Math.max(0, patch.rawSum));

    const fmap = computeFeatureMap(grid, 'vertical');
    expect(fmap).toHaveLength(8);
    expect(fmap[0]).toHaveLength(8);
  });

  it('trains the 21-parameter waste head to high accuracy on unseen items', () => {
    const samples = samplesFromIds(BALANCED_SAMPLE_IDS);
    const { model, lossHistory } = trainHead(samples, 50);

    expect(lossHistory[lossHistory.length - 1]).toBeLessThan(lossHistory[0]);
    expect(lossHistory[lossHistory.length - 1]).toBeLessThan(0.35);

    const summary = evaluateBatch(model, EVAL_ITEMS, DEFAULT_CONDITION);
    expect(summary.accuracyPct).toBeGreaterThanOrEqual(83);
    expect(summary.correct).toBeGreaterThanOrEqual(5);
  });

  it('shows confident misclassification on an unseen aluminum metal can', () => {
    const { model } = trainHead(samplesFromIds(STARTER_SAMPLE_IDS), 50);
    const can = getWasteItem('metal-can');
    const pred = predictHead(model, extractFeatures(can, DEFAULT_CONDITION));

    // Softmax forces a guess among the 3 known bins; shiny metal gets routed to Plastic with high confidence!
    expect(pred.topClass).toBe('plastic');
    expect(pred.confidence).toBeGreaterThan(0.7);
  });

  it('demonstrates background shortcut bias when banana peel sits on a blue tray', () => {
    const { model } = trainHead(samplesFromIds(BALANCED_SAMPLE_IDS), 50);
    const banana = getWasteItem('banana');

    const cleanPred = predictHead(model, extractFeatures(banana, DEFAULT_CONDITION));
    expect(cleanPred.topClass).toBe('organic');

    const biasedPred = predictHead(
      model,
      extractFeatures(banana, {
        lighting: 'daylight',
        background: 'blue-tray',
        autoWhiteBalance: false,
        shortcutBias: true,
      }),
    );
    expect(biasedPred.topClass).toBe('plastic');
  });

  it('routes low-confidence items to manual review when threshold is raised', () => {
    const { model } = trainHead(samplesFromIds(IMBALANCED_SAMPLE_IDS), 45);
    const muddy = getWasteItem('muddy-paper');
    const pred = predictHead(model, extractFeatures(muddy, DEFAULT_CONDITION), 0.92);
    expect(pred.uncertain).toBe(true);
    expect(pred.routedTo).toBe('manual');
  });

  it('extracts 6 normalized features from a raw RGB webcam grid', () => {
    const grid = renderPixelGrid(getWasteItem('veg-scraps'), DEFAULT_CONDITION);
    const features = extractFeaturesFromRgbGrid(grid);
    expect(features).toHaveLength(6);
    for (const v of features) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    // Green vegetable scraps should register higher green/organic hue than specular shine
    expect(features[0]).toBeGreaterThan(features[2]);
  });
});
