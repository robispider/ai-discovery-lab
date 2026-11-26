/* The trained tree, read from the top. Edge thickness = how many past days flow that way. */
import { useEffect, useRef, type ReactNode } from 'react';
import { CLUE, type FeatureKey } from '../../data/waterlogging';
import { countLeaves, type TreeNode } from '../../engines/tree';
import { useT } from '../../i18n';

export function TreeDiagram({
  tree,
  showDepth,
  path,
  upto,
}: {
  tree: TreeNode;
  showDepth: number;
  /** Tonight's path through the tree. */
  path: TreeNode[];
  /** How far along the path to light up (walk-through), or the whole path. */
  upto: number;
}) {
  const { bi, num } = useT();
  const boxRef = useRef<HTMLDivElement>(null);
  const vis = (n: TreeNode) => !!n.f && n.depth < showDepth;
  const leaves = countLeaves(tree, showDepth);
  const compact = leaves > 14;
  const colW = compact ? 34 : 178;
  const rowH = compact ? 56 : 134;
  const bw = 162;
  const bh = 82;
  const half = compact ? 9 : bh / 2;
  const top = half + 26;
  let maxD = 0;
  let li = 0;
  const pos: Record<number, { x: number; y: number }> = {};
  const place = (n: TreeNode) => {
    maxD = Math.max(maxD, n.depth);
    if (vis(n)) {
      place(n.left!);
      place(n.right!);
      pos[n.id] = { x: (pos[n.left!.id].x + pos[n.right!.id].x) / 2, y: top + n.depth * rowH };
    } else pos[n.id] = { x: (li++ + 0.5) * colW + 10, y: top + n.depth * rowH };
  };
  place(tree);
  const W = leaves * colW + 20;
  const H = top + half + 16 + maxD * rowH;
  const lim = Math.min(upto, path.length - 1);
  const hot = new Set(path.slice(0, lim + 1).map((n) => n.id));
  const now = path[lim];
  const pct = (x: number) => `${num(Math.round(x * 100))}%`;
  const ew = (c: TreeNode) =>
    compact ? 1.5 + 5 * Math.sqrt(c.n / tree.n) : 2 + 14 * Math.sqrt(c.n / tree.n);
  const edgeD = (p: { x: number; y: number }, q: { x: number; y: number }) => {
    const y0 = p.y + half;
    const y3 = q.y - half;
    const ym = (y0 + y3) / 2;
    return `M${p.x},${y0} C${p.x},${ym} ${q.x},${ym} ${q.x},${y3}`;
  };

  const edges: ReactNode[] = [];
  const pills: ReactNode[] = [];
  const nodes: ReactNode[] = [];
  const walk = (n: TreeNode) => {
    const p = pos[n.id];
    if (vis(n)) {
      [n.left!, n.right!].forEach((c, k) => {
        const q = pos[c.id];
        const h = hot.has(n.id) && hot.has(c.id);
        edges.push(
          <path
            key={`e${c.id}`}
            className={h ? 'tw-edge hot' : 'tw-edge'}
            d={edgeD(p, q)}
            strokeWidth={(h ? Math.max(5, ew(c)) : ew(c)).toFixed(1)}
          />,
        );
        if (!compact) {
          const mx = (p.x + q.x) / 2;
          const my = (p.y + half + q.y - half) / 2;
          pills.push(
            <g key={`p${c.id}`} className={h ? 'tw-pill hot' : 'tw-pill'}>
              <rect x={mx - 19} y={my - 10} width={38} height={20} rx={10} />
              <text x={mx} y={my + 4} textAnchor="middle">
                {k ? bi('yes', 'হ্যাঁ') : bi('no', 'না')}
              </text>
            </g>,
          );
        }
        walk(c);
      });
    }
    const leaf = !vis(n);
    const pr = n.pos / n.n;
    if (compact) {
      nodes.push(
        <circle
          key={`n${n.id}`}
          className={`${leaf ? (pr >= 0.5 ? 'tw-cy' : 'tw-cn') : 'tw-cq'}${hot.has(n.id) ? ' hot' : ''}`}
          cx={p.x}
          cy={p.y}
          r={leaf ? 8 : 5.5}
        />,
      );
      return;
    }
    const bwI = bw - 30;
    const bx = p.x - bwI / 2;
    const cls = leaf ? (pr >= 0.5 ? 'ly' : 'ln') : 'q';
    let body: ReactNode;
    if (leaf) {
      body = (
        <>
          <text x={p.x} y={p.y - 19} textAnchor="middle" fontWeight="700" fontSize="13">
            {pr >= 0.5 ? '🌊 ' + bi('Flood risk', 'ঝুঁকি আছে') : '☀️ ' + bi('Low risk', 'ঝুঁকি কম')}
          </text>
          <text
            x={p.x}
            y={p.y + 4}
            textAnchor="middle"
            fontWeight="800"
            fontSize="21"
            className={pr >= 0.5 ? 'tw-yes' : 'tw-no'}
          >
            {pct(pr)}
          </text>
          <text className="tw-meta" x={p.x} y={p.y + 33} textAnchor="middle">
            {bi(`flooded · ${n.n} days`, `পানি জমেছিল · ${num(n.n)} দিন`)}
          </text>
        </>
      );
    } else {
      const c = CLUE[n.f as FeatureKey];
      const q = c.q(c.cut(n.thr!));
      body = (
        <>
          <text x={p.x} y={p.y - 20} textAnchor="middle" fontWeight="700" fontSize="13.5">
            {c.icon} {bi(c.en, c.bn)}
          </text>
          <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize="13">
            {bi(q[0], q[1])}
          </text>
          <text className="tw-meta" x={p.x} y={p.y + 33} textAnchor="middle">
            {bi(`${n.n} days · `, `${num(n.n)} দিন · `)}
            {pct(pr)} 🌊
          </text>
        </>
      );
    }
    nodes.push(
      <g
        key={`n${n.id}`}
        className={`tw-node ${cls}${hot.has(n.id) ? ' hot' : ''}${n === now ? ' now' : ''}`}
      >
        <rect className="box" x={p.x - bw / 2} y={p.y - bh / 2} width={bw} height={bh} rx={12} />
        {body}
        <rect className="bar-n" x={bx} y={p.y + 10} width={bwI} height={7} rx={3.5} />
        <rect className="bar-y" x={bx} y={p.y + 10} width={(bwI * pr).toFixed(1)} height={7} rx={3.5} />
      </g>,
    );
  };
  walk(tree);
  const nowPos = now ? pos[now.id] : null;
  const nowX = nowPos?.x;

  // Keep the current node in view, sideways only (never scroll the page).
  useEffect(() => {
    const box = boxRef.current;
    if (!box || nowX == null) return;
    box.scrollTo?.({ left: nowX - box.clientWidth / 2, behavior: 'smooth' });
  }, [nowX]);

  return (
    <div className="tw-treebox" ref={boxRef}>
      <svg
        className="tw-tree"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={bi(`Decision tree with ${leaves} end groups`, `${num(leaves)}টি শেষ দলসহ ডিসিশন ট্রি`)}
      >
        {edges}
        {pills}
        {nodes}
        {nowPos && (
          <text
            x={nowPos.x + (compact ? 0 : bw / 2 - 4)}
            y={nowPos.y - half - 6}
            textAnchor="middle"
            fontSize="20"
          >
            💧
          </text>
        )}
      </svg>
    </div>
  );
}
