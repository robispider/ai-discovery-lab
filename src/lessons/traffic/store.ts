import { create } from 'zustand';
import {
  BATCH_SIZE,
  CHECKPOINT_EVERY,
  fixedPlan,
  Intersection,
  Learner,
  PATTERNS,
  testPolicy,
  trainEpisode,
  WATCH_SEED,
  type Evaluation,
  type PatternId,
} from '../../engines/rl/traffic';

/*
 * The simulator objects are mutable (as in the legacy page). The store keeps them and bumps
 * `frame` whenever they change, so React re-renders.
 */

interface TrafficState {
  ns: number;
  ew: number;
  mainOnly: boolean;
  live: boolean;
  speed: number;
  learner: Learner;
  fixed: Intersection;
  agent: Intersection;
  plan: [number, number];
  running: boolean;
  /** 0..1 between simulation ticks, for smooth car movement. */
  fraction: number;
  snap: boolean;
  frame: number;
  bursts: number;
  burstMsg: 0 | 1 | null;
  episodes: number;
  history: Evaluation[];
  benchmark: [number, number] | null;
  latest: Evaluation | null;
  /** Episodes done in the running batch, or null when not training. */
  batch: number | null;
  selected: number | null;
  setRates: (ns: number, ew: number) => void;
  setPattern: (p: PatternId) => void;
  setMainOnly: (v: boolean) => void;
  setLive: (v: boolean) => void;
  setSpeed: (v: number) => void;
  play: (on: boolean) => void;
  step: () => void;
  restart: () => void;
  burst: (phase: 0 | 1) => void;
  train: () => void;
  evaluate: () => void;
  forget: () => void;
  select: (s: number | null) => void;
  reset: () => void;
}

const rates = (s: { ns: number; ew: number }) => [s.ns / 60, s.ew / 60] as [number, number];
const same = (a: readonly number[] | null, b: readonly number[]) => !!a && a[0] === b[0] && a[1] === b[1];

let raf = 0;
let last: number | null = null;

export const useTraffic = create<TrafficState>()((set, get) => {
  const freshWatch = (s: { ns: number; ew: number }) => ({
    fixed: new Intersection(WATCH_SEED, true),
    agent: new Intersection(WATCH_SEED, true),
    plan: fixedPlan(rates(s)),
    fraction: 0,
    snap: true,
    bursts: 0,
    burstMsg: null,
  });

  const tickWatch = () => {
    const s = get();
    const r = rates(s);
    s.fixed.tick(r, s.plan);
    s.agent.tick(r, s.learner, s.live, s.mainOnly);
  };

  const animate = (now: number) => {
    const s = get();
    if (!s.running) return;
    let fraction = s.fraction;
    if (last !== null) fraction += Math.min(0.1, (now - last) / 1000) * s.speed;
    last = now;
    let snap = s.snap;
    if (fraction >= 1) {
      while (fraction >= 1) {
        tickWatch();
        fraction--;
      }
      snap = false;
    }
    set({ fraction, snap, frame: s.frame + 1 });
    raf = requestAnimationFrame(animate);
  };

  const stopLoop = () => {
    cancelAnimationFrame(raf);
    last = null;
  };

  const evaluatePolicy = (r: [number, number], checkpoint: boolean) => {
    const s = get();
    let { history, latest, benchmark } = s;
    if (!same(benchmark, r)) {
      history = [];
      benchmark = r;
      latest = null;
    }
    if (!latest || latest.updates !== s.learner.updates) latest = testPolicy(s.learner, r, s.episodes);
    if (checkpoint && history.at(-1)?.episodes !== s.episodes) history = [...history, latest].slice(-60);
    set({ history, latest, benchmark });
  };

  return {
    ns: PATTERNS.main[0],
    ew: PATTERNS.main[1],
    mainOnly: false,
    live: false,
    speed: 6,
    learner: new Learner(),
    running: false,
    frame: 0,
    episodes: 0,
    history: [],
    benchmark: null,
    latest: null,
    batch: null,
    selected: null,
    ...freshWatch({ ns: PATTERNS.main[0], ew: PATTERNS.main[1] }),

    setRates: (ns, ew) => {
      const s = get();
      // Before the run starts, the timer re-plans for the new traffic.
      set(s.fixed.time === 0 ? { ns, ew, plan: fixedPlan(rates({ ns, ew })) } : { ns, ew });
    },
    setPattern: (p) => get().setRates(PATTERNS[p][0], PATTERNS[p][1]),
    setMainOnly: (mainOnly) => {
      set({ mainOnly });
      get().forget();
    },
    setLive: (live) => {
      get().agent.pending = null;
      set((s) => ({ live, frame: s.frame + 1 }));
    },
    setSpeed: (speed) => set({ speed }),
    play: (on) => {
      if (on === get().running) return;
      stopLoop();
      set({ running: on });
      if (on) raf = requestAnimationFrame(animate);
    },
    step: () => {
      get().play(false);
      tickWatch();
      set((s) => ({ fraction: 0, snap: true, frame: s.frame + 1 }));
    },
    restart: () => {
      get().play(false);
      set((s) => ({ ...freshWatch(s), frame: s.frame + 1 }));
    },
    burst: (phase) => {
      const s = get();
      for (const sim of [s.fixed, s.agent]) {
        sim.addCars(phase * 2, s.bursts % 2 ? 2 : 3);
        sim.addCars(phase * 2 + 1, s.bursts % 2 ? 3 : 2);
      }
      set({ bursts: s.bursts + 1, burstMsg: phase, frame: s.frame + 1 });
    },
    train: () => {
      const s = get();
      if (s.batch !== null) return;
      s.play(false);
      const r = rates(s);
      const mainOnly = s.mainOnly;
      set({ batch: 0 });
      evaluatePolicy(r, true);
      const frame = () => {
        const st = get();
        if (st.batch === null) return;
        trainEpisode(st.learner, r, mainOnly, st.episodes);
        const done = st.batch + 1;
        set({ episodes: st.episodes + 1, batch: done });
        if (done % CHECKPOINT_EVERY === 0) evaluatePolicy(r, true);
        if (done === BATCH_SIZE) {
          set((x) => ({ batch: null, ...freshWatch(x), frame: x.frame + 1 }));
          return;
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    },
    evaluate: () => evaluatePolicy(rates(get()), false),
    forget: () => {
      get().play(false);
      set((s) => ({
        learner: new Learner(),
        episodes: 0,
        history: [],
        benchmark: null,
        latest: null,
        selected: null,
        batch: null,
        ...freshWatch(s),
        frame: s.frame + 1,
      }));
    },
    select: (selected) => set({ selected }),
    reset: () => {
      get().play(false);
      set({ ns: PATTERNS.main[0], ew: PATTERNS.main[1], mainOnly: false, live: false, speed: 6 });
      get().forget();
    },
  };
});

export const currentRates = rates;
export const sameRates = same;
