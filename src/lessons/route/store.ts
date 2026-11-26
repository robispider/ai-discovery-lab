import { create } from 'zustand';
import {
  ALGS,
  blockBridge,
  buildCity,
  search,
  type Alg,
  type City,
  type SearchResult,
  W,
} from '../../engines/search';

export type Phase = 'idle' | 'search' | 'drive' | 'done';
export type Mode = 'block' | 'start' | 'goal';
export type MissionId = Alg | 'west' | 'both';

interface View {
  phase: Phase;
  shown: number;
  truck: { x: number; y: number } | null;
  /** Minutes driven so far, while the truck moves. */
  minutes: number | null;
}

interface RouteState {
  city: City;
  mode: Mode;
  speed: number;
  result: SearchResult | null;
  /** Finished runs, for the side-by-side comparison. */
  results: Partial<Record<Alg, SearchResult>>;
  /** Dijkstra's answer: the fastest possible trip. */
  ref: SearchResult | null;
  view: View;
  missions: Partial<Record<MissionId, boolean>>;
  setMode: (m: Mode) => void;
  setSpeed: (s: number) => void;
  /** Replace the map (after an edit); clears every result. */
  setCity: (c: City) => void;
  run: (alg: Alg) => void;
  runAll: () => void;
  mission: (id: MissionId) => void;
  reset: () => void;
}

const idle: View = { phase: 'idle', shown: 0, truck: null, minutes: null };
let anim: number | null = null;
const stop = () => {
  if (anim != null) cancelAnimationFrame(anim);
  anim = null;
};

export const useRoute = create<RouteState>()((set, get) => ({
  city: buildCity(),
  mode: 'block',
  speed: 6,
  result: null,
  results: {},
  ref: null,
  view: idle,
  missions: {},
  setMode: (mode) => set({ mode }),
  setSpeed: (speed) => set({ speed }),
  setCity: (city) => {
    stop();
    set({ city, result: null, results: {}, ref: null, view: idle });
  },
  run: (alg) => {
    stop();
    const { city } = get();
    const ref = get().ref ?? search(city, 'dijkstra');
    const r = search(city, alg);
    set((s) => ({ ref, result: r, results: { ...s.results, [alg]: r }, view: { ...idle, phase: 'search' } }));
    const tick = () => {
      const { view, speed } = get();
      const shown = Math.min(r.order.length, view.shown + speed);
      if (shown < r.order.length) {
        set({ view: { ...view, shown } });
        anim = requestAnimationFrame(tick);
        return;
      }
      if (!r.found) {
        set({ view: { ...view, shown, phase: 'done' } });
        anim = null;
        return;
      }
      // The truck drives the chosen route.
      const t0 = performance.now();
      const dur = Math.min(3500, Math.max(1200, r.path.length * 40));
      const drive = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const f = p * (r.path.length - 1);
        const i = Math.floor(f);
        const j = Math.min(i + 1, r.path.length - 1);
        const u = f - i;
        const a = r.path[i];
        const b = r.path[j];
        const truck = {
          x: (a % W) * (1 - u) + (b % W) * u,
          y: Math.floor(a / W) * (1 - u) + Math.floor(b / W) * u,
        };
        const minutes = Math.round(r.cum[i] + (r.cum[j] - r.cum[i]) * u);
        if (p < 1) {
          set({ view: { phase: 'drive', shown, truck, minutes } });
          anim = requestAnimationFrame(drive);
        } else {
          set({ view: { phase: 'done', shown, truck, minutes: r.travel } });
          anim = null;
        }
      };
      anim = requestAnimationFrame(drive);
    };
    anim = requestAnimationFrame(tick);
  },
  runAll: () => {
    const { city } = get();
    const results: Partial<Record<Alg, SearchResult>> = {};
    for (const a of ALGS) results[a] = search(city, a);
    // No animation: the comparison is about the finished runs.
    stop();
    const r = results.astar!;
    set({
      ref: results.dijkstra!,
      results,
      result: r,
      view: { phase: 'done', shown: r.order.length, truck: null, minutes: r.found ? r.travel : null },
    });
  },
  mission: (id) => {
    set((s) => ({ missions: { ...s.missions, [id]: true } }));
    if (id === 'west' || id === 'both') {
      let c = blockBridge(buildCity(), 4);
      if (id === 'both') c = blockBridge(c, 24);
      get().setCity(c);
      get().run('astar');
    } else get().run(id);
  },
  reset: () => {
    stop();
    set({ city: buildCity(), result: null, results: {}, ref: null, view: idle, mode: 'block' });
  },
}));

/** A run is "settled" (safe to show in the comparison) once it is not the one animating. */
export const settled = (s: Pick<RouteState, 'results' | 'result' | 'view'>, a: Alg) => {
  const r = s.results[a];
  return r && (r !== s.result || s.view.phase === 'done' || s.view.phase === 'idle') ? r : null;
};
