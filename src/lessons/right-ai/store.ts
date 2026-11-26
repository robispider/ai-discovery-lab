import { create } from 'zustand';
import {
  buildComplaints,
  DEFAULT_RULES,
  DEPT_KEYS,
  HARD,
  type Complaint,
  type DeptId,
} from '../../data/complaints';
import { classifyWithOllama } from '../../engines/llm/ollama';
import { balancedSample } from '../../engines/metrics';
import { applyRules } from '../../engines/rules';
import { predictNB, trainNB, type NBModel } from '../../engines/text';

/** 360 labelled complaints: 90 held back as the standard test, the rest available for training. */
export const ALL = buildComplaints(360, 11);
export const TEST = ALL.slice(0, 90);
export const POOL = ALL.slice(90);
export { HARD };

export const rulesPredict = (text: string): DeptId | null => applyRules(DEFAULT_RULES, text).dept;

export function trainOn(n: number): NBModel<DeptId> {
  const rows = balancedSample(POOL, n, (r) => r.dept, DEPT_KEYS);
  return trainNB(
    rows.map((r) => ({ text: r.text, label: r.dept })),
    DEPT_KEYS,
  );
}

export interface LlmResult {
  hardPreds: (DeptId | null)[];
  hard: number;
  std: number;
  msPer: number;
}

interface RightAiState {
  ntrain: number;
  model: NBModel<DeptId>;
  ran: boolean;
  mine: string;
  llmUrl: string;
  llmModel: string;
  llmStatus: string;
  llmError: boolean;
  llmBusy: boolean;
  llm: LlmResult | null;
  setNtrain: (n: number) => void;
  setMine: (t: string) => void;
  run: () => void;
  setLlm: (p: Partial<Pick<RightAiState, 'llmUrl' | 'llmModel'>>) => void;
  runLlm: (progress: (done: number, total: number) => string) => Promise<void>;
  reset: () => void;
}

const MINE = 'বাসার সামনে স্তূপ জমে আছে, দুর্গন্ধে টেকা যায় না';

const initial = {
  ntrain: 270,
  model: trainOn(270),
  ran: false,
  mine: MINE,
  llmUrl: 'http://localhost:11434',
  llmModel: 'qwen2.5:3b',
  llmStatus: '',
  llmError: false,
  llmBusy: false,
  llm: null,
};

const prompt = (text: string) =>
  'You route citizen complaints for a city corporation in Bangladesh. Departments: waste (garbage), drain (drainage, waterlogging), road (roads, footpaths), light (street lights), mosquito (mosquito, dengue), licence (trade licence). ' +
  `Reply with exactly one word from: ${DEPT_KEYS.join(', ')}.\nComplaint: ${text}\nDepartment:`;

export const useRightAi = create<RightAiState>()((set, get) => ({
  ...initial,
  setNtrain: (n) => set({ ntrain: n, model: trainOn(n) }),
  setMine: (mine) => set({ mine }),
  run: () => set({ ran: true }),
  setLlm: (p) => set(p),
  runLlm: async (progress) => {
    const { llmUrl: url, llmModel: model } = get();
    const std = TEST.slice(0, 30);
    const all: Complaint[] = [...HARD, ...std];
    const opts = { url, model };
    set({ llmBusy: true, llmError: false });
    try {
      const preds: (DeptId | null)[] = [];
      const t0 = performance.now();
      for (let i = 0; i < all.length; i++) {
        set({ llmStatus: progress(i + 1, all.length) });
        preds.push(await classifyWithOllama(prompt(all[i].text), DEPT_KEYS, opts, { license: 'licence' }));
      }
      const ms = performance.now() - t0;
      const hardPreds = preds.slice(0, HARD.length);
      set({
        llm: {
          hardPreds,
          hard: hardPreds.filter((p, i) => p === HARD[i].dept).length / HARD.length,
          std: preds.slice(HARD.length).filter((p, i) => p === std[i].dept).length / std.length,
          msPer: ms / all.length,
        },
        llmStatus: `ok:${all.length}:${ms}`,
      });
    } catch (e) {
      set({ llmError: true, llmStatus: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ llmBusy: false });
    }
  },
  reset: () => set({ ...initial, model: trainOn(270) }),
}));

export const nbPredict = (model: NBModel<DeptId>, text: string) => predictNB(model, text).label;
