/* Evaluation helpers shared by the machine-learning lessons. */

/** Share of rows where `predict(row)` equals `truth(row)`. */
export function accuracy<R, L>(rows: R[], predict: (r: R) => L, truth: (r: R) => L): number {
  if (!rows.length) return 0;
  let ok = 0;
  for (const r of rows) if (predict(r) === truth(r)) ok++;
  return ok / rows.length;
}

/**
 * Take n rows from `pool`, round-robin over the classes, so even a tiny training set has every
 * class (same order as the legacy capstone page).
 */
export function balancedSample<R, C extends string>(
  pool: R[],
  n: number,
  label: (r: R) => C,
  classes: C[],
): R[] {
  const per = new Map<C, R[]>();
  for (const c of classes) per.set(c, []);
  for (const r of pool) per.get(label(r))?.push(r);
  const out: R[] = [];
  const longest = Math.max(0, ...classes.map((c) => per.get(c)!.length));
  for (let i = 0; i < longest && out.length < n; i++)
    for (const c of classes) {
      const row = per.get(c)![i];
      if (out.length < n && row) out.push(row);
    }
  return out;
}

/** Milliseconds taken to run `fn` over `inputs` until `times` calls have been made. */
export function timeIt<I>(fn: (input: I) => unknown, inputs: I[], times = 1000): number {
  const t0 = performance.now();
  for (let n = 0; n < times; n++) fn(inputs[n % inputs.length]);
  return performance.now() - t0;
}

/** Confusion counts: rows are the truth, columns the prediction. */
export function confusion<C extends string>(pairs: { truth: C; pred: C | null }[], classes: C[]) {
  const m = classes.map(() => classes.map(() => 0));
  for (const { truth, pred } of pairs) {
    const i = classes.indexOf(truth);
    const j = pred ? classes.indexOf(pred) : -1;
    if (i >= 0 && j >= 0) m[i][j]++;
  }
  return m;
}
