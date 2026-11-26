export function weightedTotal(a: number, b: number, wa: number, wb: number, bias: number): number {
  return a * wa + b * wb + bias;
}

export const TRAINING_EXAMPLES = [
  { rounds: 1, sacks: 3 },
  { rounds: 2, sacks: 6 },
  { rounds: 3, sacks: 9 },
] as const;

export const TEST_EXAMPLE = { rounds: 4, sacks: 12 };
export const INITIAL_WEIGHT = 2;
export const WEIGHT_STEP = 0.25;
export const MIN_WEIGHT = 0;
export const MAX_WEIGHT = 5;

export function averageGap(weight: number): number {
  const total = TRAINING_EXAMPLES.reduce(
    (sum, { rounds, sacks }) => sum + Math.abs(rounds * weight - sacks),
    0,
  );
  return total / TRAINING_EXAMPLES.length;
}

/** A small search around the current weight, scored on the training examples. */
export function compareWeights(weight: number) {
  const current = { weight, gap: averageGap(weight) };
  const candidates = [weight - WEIGHT_STEP, weight, weight + WEIGHT_STEP]
    .filter((value) => value >= MIN_WEIGHT && value <= MAX_WEIGHT)
    .map((value) => ({ weight: value, gap: averageGap(value) }));
  const best = candidates.reduce((best, option) => (option.gap < best.gap ? option : best), current);
  return { current, candidates, best };
}

export const DISPATCH_CASES = [
  { a: 0, b: 0, expected: 0 },
  { a: 1, b: 0, expected: 1 },
  { a: 0, b: 1, expected: 1 },
  { a: 1, b: 1, expected: 0 },
] as const;

export const ONE_REPORT_THRESHOLD = 0.5;
export const TWO_REPORT_THRESHOLD = 1.5;

export function dispatch(a: number, b: number) {
  const sum = a + b;
  const any = Number(sum >= ONE_REPORT_THRESHOLD);
  const both = Number(sum >= TWO_REPORT_THRESHOLD);
  return { sum, any, both, output: any - both };
}

export function divider(angle: number, shift: number) {
  const radians = (angle / 180) * Math.PI;
  const wa = Math.cos(radians);
  const wb = Math.sin(radians);
  const bias = -(wa + wb) / 2 - shift;
  return (a: number, b: number) => weightedTotal(a, b, wa, wb, bias);
}
