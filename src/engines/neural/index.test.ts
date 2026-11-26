import { describe, expect, it } from 'vitest';
import {
  averageGap,
  compareWeights,
  dispatch,
  DISPATCH_CASES,
  INITIAL_WEIGHT,
  TEST_EXAMPLE,
  TRAINING_EXAMPLES,
  weightedTotal,
} from './index';

describe('neural network lesson', () => {
  it('adds both weighted inputs and the bias', () => {
    expect(weightedTotal(2, 1, 3, 4, 1)).toBe(11);
    expect(weightedTotal(3, 1, -1, 4, -2)).toBe(-1);
  });

  it('learns from three examples and predicts the held-back fourth', () => {
    expect(TRAINING_EXAMPLES.map((record) => record.rounds)).not.toContain(TEST_EXAMPLE.rounds);
    let weight = INITIAL_WEIGHT;
    expect(averageGap(weight)).toBe(2);
    for (let step = 0; step < 4; step++) {
      const { best, current } = compareWeights(weight);
      expect(best.gap).toBeLessThan(current.gap);
      weight = best.weight;
    }
    expect(weight).toBe(3);
    expect(compareWeights(weight).best.gap).toBe(0);
    expect(weight * TEST_EXAMPLE.rounds).toBe(TEST_EXAMPLE.sacks);
  });

  it('combines the activations to match all four dispatch cases', () => {
    expect(DISPATCH_CASES.map(({ a, b }) => dispatch(a, b).output)).toEqual([0, 1, 1, 0]);
    expect(dispatch(1, 1)).toEqual({ sum: 2, any: 1, both: 1, output: 0 });
  });
});
