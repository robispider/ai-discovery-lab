/*
 * CART decision tree with Gini impurity (lesson 3). It tries every feature and every cut-off,
 * keeps the split that makes the two groups purest, and repeats inside each group up to a depth
 * limit. Same algorithm as the legacy page.
 */

export interface TreeNode {
  id: number;
  /** Rows that reached this node. */
  n: number;
  /** How many of them were positive. */
  pos: number;
  depth: number;
  /** The feature asked about; undefined on a leaf. */
  f?: string;
  thr?: number;
  left?: TreeNode;
  right?: TreeNode;
}

export type Row = Record<string, number>;

export function gini(p: number, n: number): number {
  if (!n) return 0;
  const q = p / n;
  return 2 * q * (1 - q);
}

/** Fit a tree. Each row needs the feature values and `y` (0 or 1). */
export function buildTree(rows: (Row & { y: number })[], features: string[], maxDepth: number): TreeNode {
  let nid = 0;
  const build = (rs: (Row & { y: number })[], depth: number): TreeNode => {
    const n = rs.length;
    let pos = 0;
    for (const r of rs) pos += r.y;
    const node: TreeNode = { id: nid++, n, pos, depth };
    if (depth >= maxDepth || n < 2 || pos === 0 || pos === n) return node;
    const parent = gini(pos, n);
    let best: { f: string; thr: number; gain: number } | null = null;
    for (const f of features) {
      const s = rs.slice().sort((a, b) => a[f] - b[f]);
      let lp = 0;
      for (let i = 0; i < n - 1; i++) {
        lp += s[i].y;
        if (s[i][f] === s[i + 1][f]) continue;
        const ln = i + 1;
        const rn = n - ln;
        const gain = parent - (ln * gini(lp, ln) + rn * gini(pos - lp, rn)) / n;
        if (!best || gain > best.gain + 1e-12) best = { f, thr: (s[i][f] + s[i + 1][f]) / 2, gain };
      }
    }
    if (!best || best.gain < 1e-6) return node;
    node.f = best.f;
    node.thr = best.thr;
    const { f, thr } = best;
    node.left = build(
      rs.filter((r) => r[f] <= thr),
      depth + 1,
    );
    node.right = build(
      rs.filter((r) => r[f] > thr),
      depth + 1,
    );
    return node;
  };
  return build(rows, 0);
}

const asks = (n: TreeNode, limit: number) => !!n.f && n.depth < limit;

/** The leaf a row lands in, reading at most `limit` levels of questions. */
export function leafFor(node: TreeNode, row: Row, limit = Infinity): TreeNode {
  let x = node;
  while (asks(x, limit)) x = row[x.f!] <= x.thr! ? x.left! : x.right!;
  return x;
}

/** Root-to-leaf nodes for a row. */
export function pathFor(node: TreeNode, row: Row, limit = Infinity): TreeNode[] {
  const out = [node];
  let x = node;
  while (asks(x, limit)) {
    x = row[x.f!] <= x.thr! ? x.left! : x.right!;
    out.push(x);
  }
  return out;
}

export function treeDepth(node: TreeNode): number {
  return node.f ? 1 + Math.max(treeDepth(node.left!), treeDepth(node.right!)) : 0;
}

export function countLeaves(node: TreeNode, limit = Infinity): number {
  return asks(node, limit) ? countLeaves(node.left!, limit) + countLeaves(node.right!, limit) : 1;
}

/** A leaf predicts positive when at least half of its training rows were positive. */
export const predicts = (leaf: TreeNode) => (leaf.pos / leaf.n >= 0.5 ? 1 : 0);

export function accuracy(node: TreeNode, rows: Row[], label: (r: Row) => number, limit = Infinity): number {
  if (!rows.length) return 0;
  let ok = 0;
  for (const r of rows) if (predicts(leafFor(node, r, limit)) === label(r)) ok++;
  return ok / rows.length;
}

/** Every node at exactly `depth` that asks a question. */
export function questionsAt(node: TreeNode, depth: number): TreeNode[] {
  if (!node.f) return [];
  if (node.depth === depth) return [node];
  if (node.depth > depth) return [];
  return [...questionsAt(node.left!, depth), ...questionsAt(node.right!, depth)];
}
