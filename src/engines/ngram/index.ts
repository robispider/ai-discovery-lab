/*
 * A tiny n-gram language model (lesson 9): count which word follows the previous 1 or 2 words,
 * then turn the counts into next-word probabilities. Same behaviour as the legacy page.
 */

/** Token that marks the end of a sentence. */
export const END = '⏎';

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/([.।!?])/g, ' $1 ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (/^[.।!?]$/.test(w) ? END : w));
}

/** Counts: context ("w1 w2") → next word → times seen. */
export type NgramModel = Record<string, Record<string, number>>;

export function contextKey(toks: string[], n: number): string {
  const c: string[] = [];
  for (let i = n; i >= 1; i--) c.push(toks[toks.length - i] ?? '<s>');
  return c.join(' ');
}

export function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Every distinct token in order of first appearance; the id is the position + 1. */
export function vocabulary(lines: string[]): string[] {
  const seen = new Set<string>();
  for (const l of lines) for (const t of tokenize(l)) seen.add(t);
  return [...seen];
}

/** The training sentences as plain token strings, to spot exact copies. */
export function sentencesOf(lines: string[]): string[] {
  return lines.map((l) =>
    tokenize(l)
      .filter((t) => t !== END)
      .join(' '),
  );
}

export interface TrainProgress {
  words: number;
  patterns: number;
  model: NgramModel;
}

/** Train one token at a time, so the lab can show the counts growing. */
export function* trainNgram(lines: string[], n: number): Generator<TrainProgress, NgramModel> {
  const model: NgramModel = {};
  let words = 0;
  for (const line of lines) {
    const toks = tokenize(line);
    if (toks[toks.length - 1] !== END) toks.push(END);
    const hist: string[] = [];
    for (const t of toks) {
      const k = contextKey(hist, n);
      model[k] ??= {};
      model[k][t] = (model[k][t] ?? 0) + 1;
      hist.push(t);
      words++;
      yield { words, patterns: Object.keys(model).length, model };
    }
  }
  return model;
}

export function trainAll(lines: string[], n: number): NgramModel {
  const it = trainNgram(lines, n);
  let r = it.next();
  while (!r.done) r = it.next();
  return r.value;
}

export interface Choice {
  w: string;
  p: number;
}

/**
 * Next-word probabilities after `toks`. Untrained (model null): every vocabulary word is equally
 * likely. Unknown context: null. Temperature reshapes the counts (low = greedy, high = wild).
 */
export function distribution(
  model: NgramModel | null,
  toks: string[],
  n: number,
  temperature: number,
  vocab: string[],
): Choice[] | null {
  if (!model) {
    const words = vocab.filter((w) => w !== END);
    return words.map((w) => ({ w, p: 1 / words.length }));
  }
  const c = model[contextKey(toks, n)];
  if (!c) return null;
  const ws = Object.keys(c);
  const adj = ws.map((w) => c[w] ** (1 / temperature));
  const z = adj.reduce((s, v) => s + v, 0);
  return ws.map((w, i) => ({ w, p: adj[i] / z })).sort((a, b) => b.p - a.p);
}

export function sample(dist: Choice[], r: () => number = Math.random): string {
  const x = r();
  let s = 0;
  for (const d of dist) {
    s += d.p;
    if (x <= s) return d.w;
  }
  return dist[dist.length - 1].w;
}
