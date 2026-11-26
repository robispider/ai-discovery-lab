/*
 * Known-answer tests for every engine. The expected numbers are what the legacy pages show for
 * the same seeded data, so the React lessons teach exactly the same results.
 */
import { describe, expect, it } from 'vitest';
import { buildComplaints, DEFAULT_RULES, DEPT_KEYS, HARD, SAMPLES } from '../data/complaints';
import { asVectors, NEIGHBOURHOODS } from '../data/neighbourhoods';
import { DAYS } from '../data/waterlogging';
import { WARDS } from '../data/wards';
import { kmeans, standardize } from './cluster';
import { accuracy as acc, balancedSample } from './metrics';
import { distribution, END, splitLines, tokenize as ngramTokenize, trainAll } from './ngram';
import { rng, shuffle } from './random';
import { evaluate, ols } from './regression';
import { fixedPlan, Learner, PATTERNS, testPolicy, trainEpisode } from './rl/traffic';
import { applyRules } from './rules';
import { blockBridge, buildCity, search } from './search';
import { predictNB, tokenize, trainNB } from './text';
import { accuracy, leafFor, predicts } from './tree';
import { fit, labelOf, rowOf, splitDays } from '../lessons/tree/store';
import { CORPUS } from '../data/corpus';

describe('random', () => {
  it('is seeded and repeatable', () => {
    const a = rng(42);
    const b = rng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(shuffle([1, 2, 3, 4, 5], rng(1)).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('rules engine (lesson 2)', () => {
  it('uses the highest-priority rule and reports conflicts', () => {
    const r = applyRules(DEFAULT_RULES, 'রাস্তার বাতি তিন দিন ধরে জ্বলছে না।');
    expect(r.dept).toBe('road');
    expect(r.fired.map((f) => f.dept)).toEqual(['road', 'light']);
    expect(r.conflict).toBe(true);
  });

  it('cannot guess when no rule matches', () => {
    expect(applyRules(DEFAULT_RULES, 'amader elakay moyla porishkar hoy na').dept).toBeNull();
  });

  it('routes 7 of the 10 sample complaints correctly', () => {
    const right = SAMPLES.filter((s) => applyRules(DEFAULT_RULES, s.text).dept === s.dept).length;
    expect(right).toBe(7);
  });
});

describe('rules vs Naive Bayes (lesson 11)', () => {
  const all = buildComplaints(360, 11);
  const test = all.slice(0, 90);
  const pool = all.slice(90);
  const rows = balancedSample(pool, 270, (r) => r.dept, DEPT_KEYS).map((r) => ({
    text: r.text,
    label: r.dept,
  }));
  const model = trainNB(rows, DEPT_KEYS);

  it('gives the same accuracies as the legacy page', () => {
    const rules = (t: string) => applyRules(DEFAULT_RULES, t).dept;
    const ml = (t: string) => predictNB(model, t).label;
    expect(
      Math.round(
        acc(
          test,
          (r) => rules(r.text),
          (r) => r.dept,
        ) * 100,
      ),
    ).toBe(68);
    expect(
      Math.round(
        acc(
          HARD,
          (r) => rules(r.text),
          (r) => r.dept,
        ) * 100,
      ),
    ).toBe(20);
    expect(
      Math.round(
        acc(
          test,
          (r) => ml(r.text),
          (r) => r.dept,
        ) * 100,
      ),
    ).toBe(98);
    expect(
      Math.round(
        acc(
          HARD,
          (r) => ml(r.text),
          (r) => r.dept,
        ) * 100,
      ),
    ).toBe(80);
  });

  it('tokenizes Bangla with the danda', () => {
    expect(tokenize('ড্রেন বন্ধ। পানি জমে!')).toEqual(['ড্রেন', 'বন্ধ', 'পানি', 'জমে']);
  });
});

describe('k-means (lesson 5)', () => {
  it('converges to k groups covering every neighbourhood', () => {
    const s = kmeans(standardize(asVectors(NEIGHBOURHOODS), true), 4, 1);
    expect(s.done).toBe(true);
    expect(s.assign).toHaveLength(200);
    expect(new Set(s.assign).size).toBe(4);
  });

  it('standardised columns have mean 0', () => {
    const z = standardize(asVectors(NEIGHBOURHOODS), true);
    const mean = z.reduce((t, r) => t + r[0], 0) / z.length;
    expect(Math.abs(mean)).toBeLessThan(1e-9);
  });
});

describe('route search (lesson 1)', () => {
  const city = buildCity();
  it('finds the legacy trip times', () => {
    expect(search(city, 'dijkstra').travel).toBe(63);
    expect(search(city, 'astar').travel).toBe(63);
    expect(search(city, 'astar').order.length).toBe(254);
    expect(search(city, 'bfs').travel).toBe(73);
    expect(search(city, 'greedy').travel).toBe(89);
  });

  it('reports no route when both bridges are closed', () => {
    const closed = blockBridge(blockBridge(city, 4), 24);
    expect(search(closed, 'astar').found).toBe(false);
  });
});

describe('next-word model (lesson 9)', () => {
  it('counts which word follows which', () => {
    const model = trainAll(splitLines(CORPUS.en), 1);
    expect(model['the']['city']).toBeGreaterThan(0);
    const d = distribution(model, ['the'], 1, 1, [])!;
    expect(d.reduce((s, x) => s + x.p, 0)).toBeCloseTo(1);
    expect(distribution(model, ['zebra'], 1, 1, [])).toBeNull();
  });

  it('turns full stops into an end token', () => {
    expect(ngramTokenize('Hello world.')).toEqual(['hello', 'world', END]);
  });
});

describe('decision tree (lesson 3)', () => {
  it('matches the legacy practice and exam scores at depth 3', () => {
    const { train, test } = splitDays(70);
    const tree = fit(train, 3, false);
    const label = (r: Record<string, number>) => r.y;
    const rows = (ds: typeof DAYS) => ds.map((d) => ({ ...rowOf(d), y: labelOf(d, false) }));
    expect(Math.round(accuracy(tree, rows(train), label) * 100)).toBe(86);
    expect(Math.round(accuracy(tree, rows(test), label) * 100)).toBe(84);
    const cm = [
      [0, 0],
      [0, 0],
    ];
    for (const d of test) cm[labelOf(d, false)][predicts(leafFor(tree, rowOf(d)))]++;
    expect(cm).toEqual([
      [125, 13],
      [25, 77],
    ]);
  });
});

describe('regression (lesson 4)', () => {
  it('fits the legacy line through the ward register', () => {
    const pts = WARDS.map((w) => ({ x: w.pop, y: w.waste }));
    const line = ols(pts);
    expect(line.a).toBeCloseTo(3.4, 1);
    expect(line.b).toBeCloseTo(0.432, 3);
    expect(Math.round(evaluate(pts, line).r2 * 100)).toBe(93);
  });
});

describe('traffic Q-learning (lesson 8)', () => {
  it('splits 60 s of green by demand', () => {
    expect(fixedPlan([14, 6])).toEqual([42, 18]);
  });

  it('learns to roughly match the timer in 30 episodes, as on the legacy page', () => {
    const learner = new Learner();
    const rates = [PATTERNS.main[0] / 60, PATTERNS.main[1] / 60];
    for (let e = 0; e < 30; e++) trainEpisode(learner, rates, false, e);
    const r = testPolicy(learner, rates, 30);
    expect(r.agent.average.toFixed(1)).toBe('20.3');
    expect(r.fixed.average.toFixed(1)).toBe('20.0');
  });
});
