import { create } from 'zustand';
import { DEFAULT_RULES, SAMPLES, type DeptId } from '../../data/complaints';
import type { Rule } from '../../engines/rules';

/** A rule as the officer is typing it: the keyword list stays raw text until it is applied. */
export interface DraftRule {
  dept: DeptId;
  input: string;
}

interface ExpertState {
  rules: DraftRule[];
  text: string;
  setText: (text: string) => void;
  setWords: (i: number, input: string) => void;
  setDept: (i: number, dept: DeptId) => void;
  addRule: () => void;
  deleteRule: (i: number) => void;
  /** Rule order is priority: moving a rule up lets it win conflicts. */
  moveRule: (i: number, by: -1 | 1) => void;
  restoreRules: () => void;
  reset: () => void;
}

const defaults = (): DraftRule[] => DEFAULT_RULES.map((r) => ({ dept: r.dept, input: r.words.join(', ') }));

export const useExpert = create<ExpertState>()((set) => ({
  rules: defaults(),
  text: SAMPLES[0].text,
  setText: (text) => set({ text }),
  setWords: (i, input) => set((s) => ({ rules: s.rules.map((r, k) => (k === i ? { ...r, input } : r)) })),
  setDept: (i, dept) => set((s) => ({ rules: s.rules.map((r, k) => (k === i ? { ...r, dept } : r)) })),
  addRule: () => set((s) => ({ rules: [...s.rules, { dept: 'waste', input: '' }] })),
  deleteRule: (i) => set((s) => ({ rules: s.rules.filter((_, k) => k !== i) })),
  moveRule: (i, by) =>
    set((s) => {
      const j = i + by;
      if (j < 0 || j >= s.rules.length) return s;
      const rules = s.rules.slice();
      [rules[i], rules[j]] = [rules[j], rules[i]];
      return { rules };
    }),
  restoreRules: () => set({ rules: defaults() }),
  reset: () => set({ rules: defaults(), text: SAMPLES[0].text }),
}));

export const EASY = SAMPLES.filter((s) => !s.tricky);
export const TRICKY = SAMPLES.filter((s) => s.tricky);

/** The draft rules in the engine's form. */
export function toRules(drafts: DraftRule[]): Rule<DeptId>[] {
  return drafts.map((d) => ({ dept: d.dept, words: d.input.split(',') }));
}
