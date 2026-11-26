import { create } from 'zustand';
import { BAZAARS, PREDICTORS, WARDS, type Ward, type XKey } from '../../data/wards';
import { gdStart, gdStep, mse, ols, type GD, type Line, type Point } from '../../engines/regression';

export const MAX_STEPS = 60;
const SPEED_MS = [220, 150, 90, 50, 25];

export const rowsOf = (outliers: boolean): Ward[] => (outliers ? [...WARDS, ...BAZAARS] : WARDS);
export const pointsOf = (rows: Ward[], xk: XKey): Point[] => rows.map((r) => ({ x: r[xk], y: r.waste }));

interface RegState {
  xk: XKey;
  /** Slider value; the new ward's x is slider × predictor multiplier. */
  slider: number;
  line: Line;
  losses: number[];
  gd: GD | null;
  step: number;
  hand: boolean;
  showRes: boolean;
  outliers: boolean;
  /** The residential-only line, shown dashed when the bazaars are included. */
  ghost: Line | null;
  walk: boolean;
  speed: number;
  cardSeed: number;
  setX: (xk: XKey) => void;
  setSlider: (v: number) => void;
  setShowRes: (v: boolean) => void;
  setOutliers: (v: boolean) => void;
  setSpeed: (v: number) => void;
  /** Gradient descent, animated. */
  learn: () => void;
  bestFit: () => void;
  toggleHand: () => void;
  /** Hand mode: set the line from two dragged points. */
  setLine: (l: Line) => void;
  startWalk: () => void;
  shuffleCards: () => void;
  reset: () => void;
}

let timer: ReturnType<typeof setInterval> | undefined;
const stop = () => clearInterval(timer);

const fitFor = (xk: XKey, outliers: boolean) => {
  const pts = pointsOf(rowsOf(outliers), xk);
  const line = ols(pts);
  return {
    line,
    losses: [mse(pts, line)],
    step: MAX_STEPS,
    gd: null,
    hand: false,
    ghost: outliers ? ols(pointsOf(WARDS, xk)) : null,
  };
};

const initial = () => ({
  xk: 'pop' as XKey,
  slider: PREDICTORS.pop.start,
  showRes: true,
  outliers: false,
  walk: false,
  speed: 3,
  cardSeed: 0,
  ...fitFor('pop', false),
});

export const useRegression = create<RegState>()((set, get) => ({
  ...initial(),
  setX: (xk) => {
    if (xk === get().xk) return;
    stop();
    set({ xk, slider: PREDICTORS[xk].start, walk: false, ...fitFor(xk, get().outliers) });
  },
  setSlider: (slider) => set({ slider, walk: false }),
  setShowRes: (showRes) => set({ showRes }),
  setOutliers: (outliers) => {
    stop();
    set({ outliers, walk: false, ...fitFor(get().xk, outliers) });
  },
  setSpeed: (speed) => {
    set({ speed });
    if (get().gd) {
      stop();
      timer = setInterval(tick, SPEED_MS[speed - 1]);
    }
  },
  learn: () => {
    stop();
    const { xk, outliers } = get();
    const pts = pointsOf(rowsOf(outliers), xk);
    set({
      gd: gdStart(pts),
      line: { a: 0, b: 0 },
      step: 0,
      losses: [mse(pts, { a: 0, b: 0 })],
      hand: false,
      walk: false,
      ghost: outliers ? ols(pointsOf(WARDS, xk)) : null,
    });
    timer = setInterval(tick, SPEED_MS[get().speed - 1]);
  },
  bestFit: () => {
    stop();
    set({ walk: false, ...fitFor(get().xk, get().outliers) });
  },
  toggleHand: () => {
    stop();
    const s = get();
    if (s.hand) {
      set({ hand: false });
      return;
    }
    // A slightly-off starting line, so dragging it feels rewarding.
    const line = { a: 22, b: s.xk === 'pop' ? 0.14 : 0.015 };
    set({ hand: true, gd: null, walk: false, line, losses: [mse(pointsOf(rowsOf(s.outliers), s.xk), line)] });
  },
  setLine: (line) => {
    const s = get();
    set({ line, losses: [mse(pointsOf(rowsOf(s.outliers), s.xk), line)] });
  },
  startWalk: () => {
    stop();
    set({ gd: null, hand: false, walk: true });
  },
  shuffleCards: () => set((s) => ({ cardSeed: s.cardSeed + 1 })),
  reset: () => {
    stop();
    set(initial());
  },
}));

function tick() {
  const s = useRegression.getState();
  if (!s.gd) return stop();
  const { g, line } = gdStep(s.gd);
  const step = s.step + 1;
  const done = step >= MAX_STEPS;
  if (done) stop();
  useRegression.setState({ gd: done ? null : g, line, step, losses: [...s.losses, mse(g.pts, line)] });
}
