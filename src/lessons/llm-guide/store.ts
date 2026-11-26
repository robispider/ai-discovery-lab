import { create } from 'zustand';
import type { Arch, HwId, UseId } from './content';

export const CELLS = 160;
export type Workload = 'ai' | 'seq';

interface Race {
  running: boolean;
  cpuDone: number;
  gpuDone: number;
  cpuMs: number;
  gpuMs: number;
}

interface LlmState {
  model: string;
  quant: string;
  pulse: number;
  ctxUsed: number;
  ctxLimit: number;
  workload: Workload;
  race: Race;
  anatomy: string;
  arch: Arch;
  prompt: 'sensitive' | 'public';
  /** 0..1 while a request is being traced; null when idle. */
  trace: number | null;
  civic: string;
  hw: HwId;
  use: UseId;
  set: (
    p: Partial<
      Pick<LlmState, 'model' | 'quant' | 'ctxUsed' | 'ctxLimit' | 'anatomy' | 'civic' | 'hw' | 'use'>
    >,
  ) => void;
  sendToken: () => void;
  setWorkload: (w: Workload) => void;
  startRace: () => void;
  resetRace: () => void;
  setArch: (a: Arch) => void;
  setPrompt: (p: 'sensitive' | 'public') => void;
  runTrace: () => void;
  reset: () => void;
}

const idleRace: Race = { running: false, cpuDone: 0, gpuDone: 0, cpuMs: 0, gpuMs: 0 };
let raceRaf = 0;
let traceRaf = 0;

const initial = {
  model: '8b',
  quant: 'q4',
  pulse: 0,
  ctxUsed: 6000,
  ctxLimit: 8000,
  workload: 'ai' as Workload,
  race: idleRace,
  anatomy: 'cuda-cores',
  arch: 'cloud' as Arch,
  prompt: 'sensitive' as const,
  trace: null,
  civic: 'all',
  hw: 'workstation' as HwId,
  use: 'helpdesk' as UseId,
};

export const useLlm = create<LlmState>()((set, get) => ({
  ...initial,
  set: (p) => set(p),
  sendToken: () => set((s) => ({ pulse: s.pulse + 1 })),
  setWorkload: (workload) => {
    cancelAnimationFrame(raceRaf);
    set({ workload, race: idleRace });
  },
  resetRace: () => {
    cancelAnimationFrame(raceRaf);
    set({ race: idleRace });
  },
  startRace: () => {
    cancelAnimationFrame(raceRaf);
    set({ race: { ...idleRace, running: true } });
    let last = 0;
    // Same rates as the legacy page: the GPU does ~10× more cells per second on parallel AI math,
    // but on a step-by-step job only one core can work and the CPU's faster clock wins.
    const step = (ts: number) => {
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      const { race: r, workload } = get();
      if (!r.running) return;
      const ai = workload === 'ai';
      const cpuRate = ai ? 28 : 95;
      const gpuRate = ai ? 290 : 32;
      const next = { ...r };
      if (next.cpuDone < CELLS) {
        next.cpuDone = Math.min(CELLS, next.cpuDone + cpuRate * dt);
        next.cpuMs += dt * 1000 * (ai ? 0.42 : 0.12);
      }
      if (next.gpuDone < CELLS) {
        next.gpuDone = Math.min(CELLS, next.gpuDone + gpuRate * dt);
        next.gpuMs += dt * 1000 * (ai ? 0.14 : 0.36);
      }
      next.running = next.cpuDone < CELLS || next.gpuDone < CELLS;
      set({ race: next });
      if (next.running) raceRaf = requestAnimationFrame(step);
    };
    raceRaf = requestAnimationFrame(step);
  },
  setArch: (arch) => {
    cancelAnimationFrame(traceRaf);
    set({ arch, trace: null });
  },
  setPrompt: (prompt) => {
    cancelAnimationFrame(traceRaf);
    set({ prompt, trace: null });
  },
  runTrace: () => {
    cancelAnimationFrame(traceRaf);
    let t0 = 0;
    const dur = 3600;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const u = Math.min(1, (ts - t0) / dur);
      set({ trace: u });
      if (u < 1) traceRaf = requestAnimationFrame(step);
    };
    set({ trace: 0 });
    traceRaf = requestAnimationFrame(step);
  },
  reset: () => {
    cancelAnimationFrame(raceRaf);
    cancelAnimationFrame(traceRaf);
    set(initial);
  },
}));
