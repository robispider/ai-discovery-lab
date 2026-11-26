import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Lang = 'en' | 'bn';
export type Theme = 'system' | 'light' | 'dark' | 'projector';

/** The six steps every lesson follows. Index 4 is "Break it". */
export const CYCLE = ['understand', 'explore', 'train', 'evaluate', 'break', 'apply'] as const;
export type CycleStep = (typeof CYCLE)[number];
export const TABS = ['overview', 'how', 'break', 'notes'] as const;
export type PanelTab = (typeof TABS)[number];

/** Puts the theme on <html>, where the CSS tokens pick it up. */
export function applyThemeAttr(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
}

interface LabState {
  lang: Lang;
  theme: Theme;
  /** Lesson numbers (1-based) the viewer has opened. */
  visited: number[];
  lastLesson: number;
  step: CycleStep;
  tab: PanelTab;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  visit: (n: number) => void;
  resetProgress: () => void;
  /** Choosing "Break it" in the cycle also opens the Break it tab, and the other way round. */
  setStep: (step: CycleStep) => void;
  setTab: (tab: PanelTab) => void;
}

export const useLab = create<LabState>()(
  persist(
    (set) => ({
      lang: 'en',
      theme: 'system',
      visited: [],
      lastLesson: 1,
      step: 'understand',
      tab: 'overview',
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => {
        // Before React re-renders, so canvases that read tokens while rendering see the new theme.
        applyThemeAttr(theme);
        set({ theme });
      },
      visit: (n) =>
        set((s) => ({
          lastLesson: n,
          visited: s.visited.includes(n) ? s.visited : [...s.visited, n].sort((a, b) => a - b),
        })),
      resetProgress: () => set({ visited: [], lastLesson: 1 }),
      setStep: (step) =>
        set((s) => ({
          step,
          tab: step === 'break' ? 'break' : s.tab === 'break' ? 'overview' : s.tab,
        })),
      setTab: (tab) =>
        set((s) => ({
          tab,
          step: tab === 'break' ? 'break' : s.step === 'break' ? 'understand' : s.step,
        })),
    }),
    {
      name: 'ai-discovery-lab',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Only preferences and progress survive a reload; the cycle position starts fresh per visit.
      partialize: (s) => ({ lang: s.lang, theme: s.theme, visited: s.visited, lastLesson: s.lastLesson }),
    },
  ),
);
