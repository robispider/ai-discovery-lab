/* Draws the city map for lesson 1 on a canvas. Ported from the legacy page; colours are tokens. */
import {
  BLOCKED,
  BRIDGE,
  BUILDING,
  CONGESTED,
  H,
  ROAD,
  W,
  WATER,
  type City,
  type SearchResult,
} from '../../engines/search';

export const MAP_TOKENS = [
  'm-ground',
  'm-block',
  'm-block-edge',
  'm-park',
  'm-road',
  'm-dash',
  'm-jam',
  'm-water',
  'm-wave',
  'm-bridge',
  'm-rail',
  'm-explore',
  'm-route',
  'm-casing',
  'card',
  'ink',
  'warn',
  'accent',
] as const;
export type MapColors = Record<(typeof MAP_TOKENS)[number], string>;

// Landmarks for each 3×3 city block, row by row (north: homes and services, south: market).
const LANDMARKS = [
  '🏠', '🏫', '🏠', '🕌', '🏢', '🏠', '🏥', '🏠',
  '🏠', '🌳', '🏢', '🏠', '🏠', '🏫', '🌳', '🏠',
  '🏪', '🛒', '🏪', '🏬', '🏪', '🛒', '🏪', '🏬',
  '🏪', '🏠', '🛒', '🏪', '🏠', '🏪', '🛒', '🏭',
]; // prettier-ignore
const BLOCK_ROWS = [1, 5, 13, 17];
// Parked-car colours are decoration, the same in every theme.
const CAR_COLORS = ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#f8fafc', '#a855f7'];
const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
const BLOCK_RED = '#dc2626';

export interface DrawOptions {
  colors: MapColors;
  font: string;
  t: (en: string, bn: string) => string;
  result?: SearchResult | null;
  shown?: number;
  phase?: 'idle' | 'search' | 'drive' | 'done';
  truck?: { x: number; y: number } | null;
  hover?: { x: number; y: number } | null;
  hoverBlock?: boolean;
  speed?: number;
  small?: boolean;
}

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function pill(
  c: CanvasRenderingContext2D,
  cs: number,
  o: DrawOptions,
  text: string,
  px: number,
  py: number,
  opt: { bg?: string; border?: string; bold?: boolean } = {},
) {
  const fs = Math.max(11, Math.round(cs * 0.62));
  c.font = `${opt.bold ? 700 : 600} ${fs}px ${o.font}`;
  const tw = c.measureText(text).width;
  const ph = fs * 1.55;
  const pw = tw + fs;
  const x = Math.max(2, Math.min(W * cs - pw - 2, px - pw / 2));
  const y = Math.max(2, Math.min(H * cs - ph - 2, py - ph / 2));
  c.globalAlpha = 0.92;
  c.fillStyle = opt.bg ?? o.colors.card;
  rr(c, x, y, pw, ph, ph / 2);
  c.fill();
  c.globalAlpha = 1;
  if (opt.border) {
    c.strokeStyle = opt.border;
    c.lineWidth = 2;
    c.stroke();
  }
  c.fillStyle = o.colors.ink;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, x + pw / 2, y + ph / 2 + 1);
}

export function drawMap(c: CanvasRenderingContext2D, cs: number, city: City, o: DrawOptions) {
  const C = o.colors;
  const small = !!o.small;
  const { grid, start, goal, original } = city;
  c.fillStyle = C['m-ground'];
  c.fillRect(0, 0, W * cs, H * cs);

  // City blocks with landmarks.
  let bi = 0;
  for (const by of BLOCK_ROWS) {
    for (let bx = 1; bx < W - 1; bx += 4, bi++) {
      const lm = LANDMARKS[bi];
      const inset = Math.max(1, cs * 0.18);
      c.fillStyle = lm === '🌳' ? C['m-park'] : C['m-block'];
      rr(c, bx * cs + inset, by * cs + inset, 3 * cs - 2 * inset, 3 * cs - 2 * inset, Math.max(2, cs * 0.35));
      c.fill();
      if (!small) {
        c.strokeStyle = C['m-block-edge'];
        c.lineWidth = 1;
        c.stroke();
        c.font = `${Math.round(cs * 1.55)}px ${EMOJI_FONT}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(lm, (bx + 1.5) * cs, (by + 1.6) * cs);
      }
    }
  }

  // Roads, jams, water, bridges, blockades.
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = grid[y][x];
      const px = x * cs;
      const py = y * cs;
      if (t === BUILDING) continue;
      if (t === WATER) {
        c.fillStyle = C['m-water'];
        c.fillRect(px, py, cs, cs);
        if (!small && (x + y) % 3 === 0) {
          c.strokeStyle = C['m-wave'];
          c.lineWidth = 1.5;
          c.beginPath();
          c.moveTo(px + cs * 0.15, py + cs * 0.55);
          c.quadraticCurveTo(px + cs * 0.35, py + cs * 0.3, px + cs * 0.55, py + cs * 0.55);
          c.quadraticCurveTo(px + cs * 0.75, py + cs * 0.8, px + cs * 0.95, py + cs * 0.55);
          c.stroke();
        }
        continue;
      }
      const base = t === BLOCKED ? (original[y * W + x] ?? ROAD) : t;
      if (base === BRIDGE) {
        c.fillStyle = C['m-bridge'];
        c.fillRect(px, py, cs, cs);
        if (!small) {
          c.strokeStyle = C['m-rail'];
          c.lineWidth = 1;
          for (let p = 1; p < 4; p++) {
            c.beginPath();
            c.moveTo(px, py + (p * cs) / 4);
            c.lineTo(px + cs, py + (p * cs) / 4);
            c.stroke();
          }
        }
        c.fillStyle = C['m-rail'];
        const rw = Math.max(1.5, cs * 0.14);
        c.fillRect(px - rw, py, rw, cs);
        c.fillRect(px + cs, py, rw, cs);
      } else {
        c.fillStyle = base === CONGESTED ? C['m-jam'] : C['m-road'];
        c.fillRect(px, py, cs, cs);
        if (!small) {
          const horiz = y % 4 === 0 && x % 4 !== 0;
          const vert = x % 4 === 0 && y % 4 !== 0;
          if (base === CONGESTED && (x * 7 + y * 3) % 3 === 0 && (horiz || vert)) {
            c.fillStyle = CAR_COLORS[(x * 5 + y) % CAR_COLORS.length];
            const cw = horiz ? cs * 0.6 : cs * 0.38;
            const ch = horiz ? cs * 0.38 : cs * 0.6;
            rr(c, px + (cs - cw) / 2, py + (cs - ch) / 2, cw, ch, cs * 0.1);
            c.fill();
            c.strokeStyle = 'rgba(0,0,0,.35)';
            c.lineWidth = 1;
            c.stroke();
          } else if (horiz || vert) {
            c.strokeStyle = C['m-dash'];
            c.lineWidth = Math.max(1, cs * 0.08);
            c.beginPath();
            if (horiz) {
              c.moveTo(px + cs * 0.25, py + cs / 2);
              c.lineTo(px + cs * 0.75, py + cs / 2);
            } else {
              c.moveTo(px + cs / 2, py + cs * 0.25);
              c.lineTo(px + cs / 2, py + cs * 0.75);
            }
            c.stroke();
          }
        }
      }
      if (t === BLOCKED) {
        c.save();
        c.beginPath();
        c.rect(px, py, cs, cs);
        c.clip();
        c.fillStyle = '#ffffff';
        c.fillRect(px, py, cs, cs);
        c.strokeStyle = BLOCK_RED;
        c.lineWidth = cs * 0.22;
        for (let s = -cs; s < cs * 2; s += cs * 0.5) {
          c.beginPath();
          c.moveTo(px + s, py + cs);
          c.lineTo(px + s + cs, py);
          c.stroke();
        }
        c.restore();
        c.strokeStyle = '#7f1d1d';
        c.lineWidth = 1;
        c.strokeRect(px + 0.5, py + 0.5, cs - 1, cs - 1);
      }
    }

  // Places the algorithm has checked.
  const r = o.result;
  const phase = o.phase ?? 'done';
  if (r) {
    const n = o.shown ?? r.order.length;
    const wave = Math.max(6, (o.speed ?? 6) * 4);
    c.fillStyle = C['m-explore'];
    for (let i = 0; i < n; i++) {
      const k = r.order[i];
      c.globalAlpha = phase === 'search' && i >= n - wave ? 0.8 : 0.42;
      c.fillRect((k % W) * cs, Math.floor(k / W) * cs, cs, cs);
    }
    c.globalAlpha = 1;

    // The "distance guess" A* and Greedy use, while they search.
    if (!small && phase === 'search' && (r.alg === 'astar' || r.alg === 'greedy')) {
      c.save();
      c.setLineDash([cs * 0.4, cs * 0.3]);
      c.strokeStyle = C.warn;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo((start.x + 0.5) * cs, (start.y + 0.5) * cs);
      c.lineTo((goal.x + 0.5) * cs, (goal.y + 0.5) * cs);
      c.stroke();
      c.restore();
      pill(
        c,
        cs,
        o,
        o.t('📏 distance guess', '📏 দূরত্বের আন্দাজ'),
        ((start.x + goal.x + 1) / 2) * cs,
        ((start.y + goal.y + 1) / 2) * cs - cs,
        {
          border: C.warn,
        },
      );
    }

    // The chosen route.
    if (n >= r.order.length && r.path.length && phase !== 'search') {
      c.lineCap = 'round';
      c.lineJoin = 'round';
      for (const [color, w] of [
        [C['m-casing'], small ? 0.75 : 0.62],
        [C['m-route'], small ? 0.45 : 0.38],
      ] as const) {
        c.strokeStyle = color;
        c.lineWidth = Math.max(small ? 2 : 4, cs * w);
        c.beginPath();
        r.path.forEach((k, i) => {
          const px = ((k % W) + 0.5) * cs;
          const py = (Math.floor(k / W) + 0.5) * cs;
          if (i) c.lineTo(px, py);
          else c.moveTo(px, py);
        });
        c.stroke();
      }
    }
  }

  // Hover highlight while editing.
  if (o.hover) {
    c.strokeStyle = o.hoverBlock ? BLOCK_RED : C.accent;
    c.lineWidth = 2.5;
    c.strokeRect(o.hover.x * cs + 1, o.hover.y * cs + 1, cs - 2, cs - 2);
  }

  // Area labels.
  if (!small && cs >= 12) {
    pill(c, cs, o, o.t('≈ Canal ≈', '≈ খাল ≈'), 14.5 * cs, 10.5 * cs, { bg: C['m-wave'] });
    pill(c, cs, o, o.t('← West bridge', '← পশ্চিম সেতু'), 8 * cs, 10.5 * cs, { bg: C['m-wave'] });
    pill(c, cs, o, o.t('East bridge →', 'পূর্ব সেতু →'), 20.5 * cs, 10.5 * cs, { bg: C['m-wave'] });
    pill(c, cs, o, o.t('🚗 Market area: traffic jams', '🚗 বাজার এলাকা: যানজট'), 18.5 * cs, 16.5 * cs, {
      bg: C['m-jam'],
    });
    pill(c, cs, o, o.t('🚗 Busy road', '🚗 ব্যস্ত রাস্তা'), 6.5 * cs, 4.5 * cs, { bg: C['m-jam'] });
  }

  // Depot, station and truck.
  const tp = o.truck ?? start;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  if (!small) {
    c.font = `${Math.round(cs * 1.5)}px ${EMOJI_FONT}`;
    c.fillText('🏁', (goal.x + 0.5) * cs, (goal.y + 0.4) * cs);
    const gAbove = goal.y > H / 2;
    pill(
      c,
      cs,
      o,
      o.t('Transfer station', 'ট্রান্সফার স্টেশন'),
      (goal.x + 0.5) * cs,
      (goal.y + (gAbove ? -1.1 : 1.6)) * cs,
      {
        bold: true,
      },
    );
    const sBelow = start.y < H / 2;
    pill(c, cs, o, o.t('Depot', 'ডিপো'), (start.x + 0.5) * cs, (start.y + (sBelow ? 1.6 : -1.1)) * cs, {
      bold: true,
    });
    c.font = `${Math.round(cs * 1.5)}px ${EMOJI_FONT}`;
    c.fillText('🚛', (tp.x + 0.5) * cs, (tp.y + 0.5) * cs);
  } else {
    c.font = `${Math.round(cs * 2.4)}px ${EMOJI_FONT}`;
    c.fillText('🏁', (goal.x + 0.5) * cs, (goal.y + 0.3) * cs);
    c.fillText('🚛', (start.x + 0.9) * cs, (start.y + 0.9) * cs);
  }
}
