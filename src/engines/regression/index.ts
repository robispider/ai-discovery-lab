/*
 * Simple linear regression for lesson 4: ordinary least squares, mean squared error, and
 * gradient descent on standardised x (so the learning rate works for any unit).
 */

export interface Line {
  a: number;
  b: number;
}

export interface Point {
  x: number;
  y: number;
}

export const predict = (l: Line, x: number) => l.a + l.b * x;

export function mse(pts: Point[], l: Line): number {
  let s = 0;
  for (const p of pts) s += (p.y - predict(l, p.x)) ** 2;
  return s / pts.length;
}

export function ols(pts: Point[]): Line {
  const n = pts.length;
  let mx = 0;
  let my = 0;
  for (const p of pts) {
    mx += p.x;
    my += p.y;
  }
  mx /= n;
  my /= n;
  let sxy = 0;
  let sxx = 0;
  for (const p of pts) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
  }
  const b = sxy / sxx;
  return { a: my - b * mx, b };
}

export interface GD {
  pts: Point[];
  mx: number;
  sx: number;
  /** Intercept and slope on standardised x. */
  A: number;
  B: number;
  lr: number;
}

export function gdStart(pts: Point[], lr = 0.09): GD {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const sx = Math.sqrt(pts.reduce((s, p) => s + (p.x - mx) ** 2, 0) / n) || 1;
  return { pts, mx, sx, A: 0, B: 0, lr };
}

/** One step down the error slope. Returns the new state and the line in original units. */
export function gdStep(g: GD): { g: GD; line: Line } {
  let ga = 0;
  let gb = 0;
  for (const p of g.pts) {
    const z = (p.x - g.mx) / g.sx;
    const e = g.A + g.B * z - p.y;
    ga += e;
    gb += e * z;
  }
  const n = g.pts.length;
  const A = g.A - (g.lr * ga) / n;
  const B = g.B - (g.lr * gb) / n;
  const b = B / g.sx;
  return { g: { ...g, A, B }, line: { a: A - (B * g.mx) / g.sx, b } };
}

export interface Stats {
  n: number;
  /** Mean absolute error. */
  mae: number;
  r2: number;
  mse: number;
  /** Share within ±`wide` of the truth. */
  within: number;
  /** Within ±`tight`. */
  spot: number;
  /** Truth higher than predicted by more than `tight`. */
  under: number;
  /** Truth lower than predicted by more than `tight`. */
  over: number;
}

export function evaluate(pts: Point[], l: Line, tight = 2.5, wide = 5): Stats {
  const n = pts.length;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let mae = 0;
  let sse = 0;
  let sst = 0;
  let spot = 0;
  let under = 0;
  let over = 0;
  let w = 0;
  for (const p of pts) {
    const e = p.y - predict(l, p.x);
    mae += Math.abs(e);
    sse += e * e;
    sst += (p.y - my) ** 2;
    if (Math.abs(e) <= wide) w++;
    if (Math.abs(e) <= tight) spot++;
    else if (e > tight) under++;
    else over++;
  }
  return { n, mae: mae / n, r2: Math.max(0, 1 - sse / sst), mse: sse / n, within: w / n, spot, under, over };
}
