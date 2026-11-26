import { create } from 'zustand';
import { DAYS, ORDER, type Day, type Tonight } from '../../data/waterlogging';
import { accuracy, buildTree, pathFor, treeDepth, type Row, type TreeNode } from '../../engines/tree';

export const FEATURES = ['rain', 'block', 'elev', 'inf'];

/** What the records say: with biased records, unreported floods are written down as dry. */
export const labelOf = (d: Day, bias: boolean) => (bias && d.unreported ? 0 : d.truth);
export const rowOf = (d: Day | Tonight): Row => ({ rain: d.rain, block: d.block, elev: d.elev, inf: d.inf });

export function splitDays(pct: number) {
  const k = Math.round((DAYS.length * pct) / 100);
  return { train: ORDER.slice(0, k).map((i) => DAYS[i]), test: ORDER.slice(k).map((i) => DAYS[i]) };
}

export function fit(train: Day[], depth: number, bias: boolean): TreeNode {
  return buildTree(
    train.map((d) => ({ ...rowOf(d), y: labelOf(d, bias) })),
    FEATURES,
    depth,
  );
}

export interface Sweep {
  train: number[];
  test: number[];
}

interface TreeState {
  split: number;
  depth: number;
  bias: boolean;
  tonight: Tonight;
  train: Day[];
  test: Day[];
  tree: TreeNode;
  /** Levels of the tree shown; Infinity when fully grown. */
  showDepth: number;
  /** While walking tonight's path: how many questions are revealed. */
  walk: number | null;
  /** Narration key while growing: the level just added, or 'done'. */
  growing: number | 'done' | null;
  sweep: Sweep | null;
  cardSeed: number;
  setSplit: (v: number) => void;
  setDepth: (v: number) => void;
  setBias: (v: boolean) => void;
  setTonight: (t: Partial<Tonight>) => void;
  grow: () => void;
  walkThrough: () => void;
  runSweep: () => void;
  shuffleCards: () => void;
  reset: () => void;
}

let timer: ReturnType<typeof setTimeout> | undefined;
const stop = () => clearTimeout(timer);

const derive = (split: number, depth: number, bias: boolean) => {
  const { train, test } = splitDays(split);
  return { train, test, tree: fit(train, depth, bias) };
};

const sweepFor = (split: number, bias: boolean): Sweep => {
  const { train, test } = splitDays(split);
  const tr: number[] = [];
  const te: number[] = [];
  const label = (r: Row) => r.y;
  const rows = (ds: Day[]) => ds.map((d) => ({ ...rowOf(d), y: labelOf(d, bias) }));
  const trRows = rows(train);
  const teRows = rows(test);
  for (let d = 1; d <= 12; d++) {
    const t = fit(train, d, bias);
    tr.push(accuracy(t, trRows, label));
    te.push(accuracy(t, teRows, label));
  }
  return { train: tr, test: te };
};

const initial = () => ({
  split: 70,
  depth: 3,
  bias: false,
  tonight: { rain: 90, block: 60, elev: 4, inf: 0 },
  showDepth: Infinity,
  walk: null,
  growing: null,
  sweep: null,
  cardSeed: 0,
  ...derive(70, 3, false),
});

export const useTree = create<TreeState>()((set, get) => {
  const refresh = (p: Partial<Pick<TreeState, 'split' | 'depth' | 'bias'>>) => {
    stop();
    const s = { ...get(), ...p };
    set({
      ...p,
      ...derive(s.split, s.depth, s.bias),
      showDepth: Infinity,
      walk: null,
      growing: null,
      sweep: s.sweep ? sweepFor(s.split, s.bias) : null,
    });
  };
  return {
    ...initial(),
    setSplit: (split) => refresh({ split }),
    setDepth: (depth) => refresh({ depth }),
    setBias: (bias) => refresh({ bias }),
    setTonight: (t) => {
      if (get().walk !== null) stop();
      set((s) => ({ tonight: { ...s.tonight, ...t }, walk: null }));
    },
    grow: () => {
      stop();
      const D = treeDepth(get().tree);
      const reduced = matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const wait = reduced ? 600 : D > 5 ? 1100 : 1700;
      let level = 0;
      const step = () => {
        if (level < D) {
          set({ showDepth: level, growing: level, walk: null });
          level++;
          timer = setTimeout(step, wait);
        } else set({ showDepth: Infinity, growing: 'done' });
      };
      step();
    },
    walkThrough: () => {
      stop();
      set({ showDepth: Infinity, growing: null });
      let i = 0;
      const last = pathFor(get().tree, rowOf(get().tonight)).length - 1;
      const reduced = matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const step = () => {
        set({ walk: i });
        if (i < last) {
          i++;
          timer = setTimeout(step, reduced ? 1600 : 2400);
        }
      };
      step();
    },
    runSweep: () => set((s) => ({ sweep: sweepFor(s.split, s.bias) })),
    shuffleCards: () => set((s) => ({ cardSeed: s.cardSeed + 1 })),
    reset: () => {
      stop();
      set(initial());
    },
  };
});
