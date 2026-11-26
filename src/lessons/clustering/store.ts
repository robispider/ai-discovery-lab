import { create } from 'zustand';
import { initCentres, kmeansStep, standardize, type KMeansState } from '../../engines/cluster';
import { asVectors, NEIGHBOURHOODS, type FeatureKey } from '../../data/neighbourhoods';

const RAW = asVectors(NEIGHBOURHOODS);

const COLORS = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6', '--c7', '--c8'];
/** Colour token for a group. */
export const groupColor = (c: number) => `var(${COLORS[c % COLORS.length]})`;

interface ClusterState extends KMeansState {
  k: number;
  scale: boolean;
  seed: number;
  running: boolean;
  x: FeatureKey;
  y: FeatureKey;
  names: Record<number, string>;
  revealed: boolean;
  setK: (k: number) => void;
  setScale: (scale: boolean) => void;
  setAxis: (axis: 'x' | 'y', f: FeatureKey) => void;
  setName: (c: number, name: string) => void;
  setRevealed: (v: boolean) => void;
  /** Start the animated run from fresh centres. */
  run: () => void;
  /** One assign-and-move step (stops any animation). */
  stepOnce: () => void;
  /** Called by the animation timer. */
  tick: () => void;
  newStart: () => void;
  /** Run straight to the end, without animation (for presets). */
  finish: () => void;
  reset: () => void;
}

const vectors = (scale: boolean) => standardize(RAW, scale);

const fresh = (k: number, seed: number, scale: boolean): KMeansState => ({
  centres: initCentres(vectors(scale), k, seed),
  assign: null,
  iter: 0,
  done: false,
});

const initial = {
  k: 4,
  scale: true,
  seed: 1,
  running: false,
  x: 'density' as FeatureKey,
  y: 'drain' as FeatureKey,
  names: {},
  revealed: false,
  ...fresh(4, 1, true),
};

export const useCluster = create<ClusterState>()((set, get) => ({
  ...initial,
  setK: (k) => set((s) => ({ k, names: {}, running: false, ...fresh(k, s.seed, s.scale) })),
  setScale: (scale) => {
    set((s) => ({ scale, ...fresh(s.k, s.seed, scale) }));
    get().run();
  },
  setAxis: (axis, f) => set({ [axis]: f } as Partial<ClusterState>),
  setName: (c, name) => set((s) => ({ names: { ...s.names, [c]: name } })),
  setRevealed: (revealed) => set({ revealed }),
  run: () => set((s) => ({ running: true, ...fresh(s.k, s.seed, s.scale) })),
  stepOnce: () =>
    set((s) => {
      const base = s.done ? fresh(s.k, s.seed, s.scale) : s;
      return { running: false, ...kmeansStep(vectors(s.scale), base) };
    }),
  tick: () =>
    set((s) => {
      const next = kmeansStep(vectors(s.scale), s);
      return { ...next, running: !(next.done || next.iter > 30) };
    }),
  newStart: () => {
    set((s) => ({ seed: s.seed + 1 }));
    get().run();
  },
  finish: () =>
    set((s) => {
      const V = vectors(s.scale);
      let st: KMeansState = fresh(s.k, s.seed, s.scale);
      while (!st.done && st.iter <= 30) st = kmeansStep(V, st);
      return { ...st, running: false };
    }),
  reset: () => set({ ...initial }),
}));
