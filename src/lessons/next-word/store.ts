import { create } from 'zustand';
import { CORPUS, START } from '../../data/corpus';
import {
  distribution,
  END,
  sample,
  sentencesOf,
  splitLines,
  tokenize,
  trainNgram,
  vocabulary,
  type NgramModel,
} from '../../engines/ngram';

type CorpusLang = 'en' | 'bn';

export type Note = 'untrained' | 'copied' | 'new' | null;

interface NextWordState {
  votes: Record<string, number>;
  corpusLang: CorpusLang;
  corpus: string;
  n: 1 | 2;
  model: NgramModel | null;
  training: boolean;
  words: number;
  patterns: number;
  start: string;
  temp: number;
  gen: string[];
  lastNew: boolean;
  finished: boolean;
  note: Note;
  vote: (w: string) => void;
  resetVotes: () => void;
  setCorpusLang: (l: CorpusLang) => void;
  setCorpus: (text: string) => void;
  setN: (n: 1 | 2) => void;
  train: () => Promise<void>;
  /** Train instantly (presets). */
  trainNow: () => void;
  setStart: (s: string) => void;
  setTemp: (t: number) => void;
  /** Generate one word. Returns false when the sentence is over or the model is stuck. */
  step: () => boolean;
  clearOut: () => void;
  reset: (lang?: CorpusLang) => void;
}

/** Tokens so far: the start text plus everything generated. */
export const contextOf = (s: { start: string; gen: string[] }) =>
  tokenize(s.start)
    .filter((t) => t !== END)
    .concat(s.gen);

export const vocabOf = (corpus: string) => vocabulary(splitLines(corpus));

const untrained = { model: null, words: 0, patterns: 0 };
const cleared = { gen: [] as string[], finished: false, lastNew: false, note: null as Note };

const base = (lang: CorpusLang) => ({
  votes: {} as Record<string, number>,
  corpusLang: lang,
  corpus: CORPUS[lang],
  n: 1 as const,
  training: false,
  start: START[lang],
  temp: 1,
  ...untrained,
  ...cleared,
});

export const useNextWord = create<NextWordState>()((set, get) => ({
  ...base('en'),
  vote: (w) => set((s) => ({ votes: { ...s.votes, [w]: (s.votes[w] ?? 0) + 1 } })),
  resetVotes: () => set({ votes: {} }),
  setCorpusLang: (l) => set({ corpusLang: l, corpus: CORPUS[l], start: START[l], ...untrained, ...cleared }),
  setCorpus: (corpus) => set({ corpus, ...untrained, ...cleared }),
  setN: (n) => set({ n, ...untrained, ...cleared }),
  train: async () => {
    const { corpus, n } = get();
    const lines = splitLines(corpus);
    const total = lines.reduce((s, l) => s + tokenize(l).length + 1, 0);
    const every = Math.max(1, Math.round(total / 40));
    set({ training: true, ...untrained, ...cleared });
    const it = trainNgram(lines, n);
    let r = it.next();
    while (!r.done) {
      if (r.value.words % every === 0) {
        set({ words: r.value.words, patterns: r.value.patterns });
        await new Promise((res) => setTimeout(res, 25));
      }
      r = it.next();
    }
    const model = r.value;
    const words = Object.values(model).reduce((s, c) => s + Object.values(c).reduce((a, b) => a + b, 0), 0);
    set({ model, training: false, words, patterns: Object.keys(model).length, ...cleared });
  },
  trainNow: () => {
    const { corpus, n } = get();
    const it = trainNgram(splitLines(corpus), n);
    let r = it.next();
    let last = { words: 0, patterns: 0 };
    while (!r.done) {
      last = r.value;
      r = it.next();
    }
    set({ model: r.value, words: last.words, patterns: last.patterns, training: false, ...cleared });
  },
  setStart: (start) => set({ start, ...cleared }),
  setTemp: (temp) => set({ temp }),
  step: () => {
    const s = get();
    if (s.finished) return false;
    const d = distribution(s.model, contextOf(s), s.n, s.temp, vocabOf(s.corpus));
    if (!d) {
      set({ lastNew: false });
      return false;
    }
    const w = sample(d);
    const gen = w === END ? s.gen : [...s.gen, w];
    const finished = w === END || gen.length > 30;
    let note: Note = null;
    if (finished) {
      const text = contextOf({ start: s.start, gen }).join(' ');
      note = !s.model ? 'untrained' : sentencesOf(splitLines(s.corpus)).includes(text) ? 'copied' : 'new';
    }
    set({ gen, finished, note, lastNew: w !== END });
    return !finished;
  },
  clearOut: () => set({ ...cleared }),
  reset: (lang) => set(base(lang ?? get().corpusLang)),
}));
