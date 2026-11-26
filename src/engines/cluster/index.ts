/*
 * k-means clustering, one visible step at a time (lesson 5).
 * Same procedure as the legacy page: optional z-score scaling, random starting centres picked from
 * the data with a seeded shuffle, then assign-and-move steps until no point changes group.
 */
import { rng, shuffle } from '../random';

export type Vec = number[];

/** Z-score each column (mean 0, sd 1), or return the raw numbers when `scale` is false. */
export function standardize(rows: Vec[], scale: boolean): Vec[] {
  if (!rows.length || !scale) return rows.map((r) => r.slice());
  const dims = rows[0].length;
  const mu: number[] = [];
  const sd: number[] = [];
  for (let j = 0; j < dims; j++) {
    const m = rows.reduce((s, r) => s + r[j], 0) / rows.length;
    const v = rows.reduce((s, r) => s + (r[j] - m) ** 2, 0) / rows.length;
    mu[j] = m;
    sd[j] = Math.sqrt(v) || 1;
  }
  return rows.map((r) => r.map((x, j) => (x - mu[j]) / sd[j]));
}

export function dist2(a: Vec, b: Vec): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return s;
}

/** k distinct data points as starting centres; `seed` picks which ones. */
export function initCentres(V: Vec[], k: number, seed: number): Vec[] {
  const r = rng(seed * 7919);
  const idx = shuffle(
    V.map((_, i) => i),
    r,
  ).slice(0, k);
  return idx.map((i) => V[i].slice());
}

export interface KMeansState {
  centres: Vec[];
  /** Group of each point, or null before the first step. */
  assign: number[] | null;
  iter: number;
  /** True once a step changed no assignment. */
  done: boolean;
}

/** One step: every point joins its nearest centre, then every centre moves to its group's mean. */
export function kmeansStep(V: Vec[], s: KMeansState): KMeansState {
  const k = s.centres.length;
  const assign = V.map((v) => {
    let best = 0;
    for (let c = 1; c < k; c++) if (dist2(v, s.centres[c]) < dist2(v, s.centres[best])) best = c;
    return best;
  });
  const done = !!s.assign && assign.every((a, i) => a === s.assign![i]);
  const centres = s.centres.map((old, c) => {
    const mem = V.filter((_, i) => assign[i] === c);
    if (!mem.length) return old;
    return old.map((_, j) => mem.reduce((sum, v) => sum + v[j], 0) / mem.length);
  });
  return { centres, assign, iter: s.iter + 1, done };
}

/** Run to convergence (or maxIter steps). */
export function kmeans(V: Vec[], k: number, seed: number, maxIter = 30): KMeansState {
  let s: KMeansState = { centres: initCentres(V, k, seed), assign: null, iter: 0, done: false };
  while (!s.done && s.iter < maxIter) s = kmeansStep(V, s);
  return s;
}
