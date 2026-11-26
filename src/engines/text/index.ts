/*
 * Text tools for the language lessons: a Bangla + English tokenizer and multinomial Naive Bayes.
 * Ported from the legacy complaints-data.js.
 */

/** Split on whitespace and punctuation, including the Bangla danda (।). */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[।,.!?;:()"'“”‘’\-–—/]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

export interface NBModel<C extends string = string> {
  classes: C[];
  prior: Record<C, number>;
  counts: Record<C, Record<string, number>>;
  totals: Record<C, number>;
  vocab: Set<string>;
  N: number;
}

export interface NBPrediction<C extends string = string> {
  label: C;
  probs: Record<C, number>;
  /** Known words, sorted by how much they pushed toward the winner. */
  evidence: { w: string; score: number }[];
  /** Words never seen in training; they carry no evidence. */
  unknown: number;
}

/** Train with Laplace smoothing. */
export function trainNB<C extends string>(rows: { text: string; label: C }[], classes: C[]): NBModel<C> {
  const m: NBModel<C> = {
    classes,
    prior: {} as Record<C, number>,
    counts: {} as Record<C, Record<string, number>>,
    totals: {} as Record<C, number>,
    vocab: new Set(),
    N: rows.length,
  };
  for (const c of classes) {
    m.prior[c] = 0;
    m.counts[c] = {};
    m.totals[c] = 0;
  }
  for (const row of rows) {
    m.prior[row.label]++;
    const bucket: Record<string, number> = m.counts[row.label];
    for (const w of tokenize(row.text)) {
      bucket[w] = (bucket[w] || 0) + 1;
      m.totals[row.label]++;
      m.vocab.add(w);
    }
  }
  return m;
}

export function predictNB<C extends string>(m: NBModel<C>, text: string): NBPrediction<C> {
  const toks = tokenize(text);
  const V = m.vocab.size;
  const lp = (c: C, w: string) => Math.log(((m.counts[c][w] || 0) + 1) / (m.totals[c] + V));
  const scores = {} as Record<C, number>;
  for (const c of m.classes) {
    let s = Math.log((m.prior[c] + 1) / (m.N + m.classes.length));
    for (const w of toks) if (m.vocab.has(w)) s += lp(c, w);
    scores[c] = s;
  }
  const mx = Math.max(...m.classes.map((c) => scores[c]));
  const probs = {} as Record<C, number>;
  let z = 0;
  for (const c of m.classes) {
    probs[c] = Math.exp(scores[c] - mx);
    z += probs[c];
  }
  for (const c of m.classes) probs[c] /= z;
  const label = m.classes.reduce((a, b) => (probs[a] >= probs[b] ? a : b));
  const known = toks.filter((w) => m.vocab.has(w));
  const evidence = known
    .map((w) => {
      const avg = m.classes.reduce((s, c) => s + lp(c, w), 0) / m.classes.length;
      return { w, score: lp(label, w) - avg };
    })
    .sort((a, b) => b.score - a.score);
  return { label, probs, evidence, unknown: toks.length - known.length };
}
