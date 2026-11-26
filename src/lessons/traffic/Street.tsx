/* One animated intersection: the scene, queued and crossing cars, signals and overflow badges. */
import type { Intersection } from '../../engines/rl/traffic';
import { useT } from '../../i18n';
import { lightOf } from './util';

const LANES = [
  {
    x: 198,
    y: 91,
    dx: 0,
    dy: 1,
    angle: 180,
    slots: 4,
    distance: 250,
    labelX: 242,
    labelY: 17,
    moreX: 198,
    moreY: 8,
  },
  {
    x: 242,
    y: 233,
    dx: 0,
    dy: -1,
    angle: 0,
    slots: 4,
    distance: 250,
    labelX: 198,
    labelY: 307,
    moreX: 242,
    moreY: 316,
  },
  {
    x: 296,
    y: 140,
    dx: -1,
    dy: 0,
    angle: -90,
    slots: 6,
    distance: 314,
    labelX: 423,
    labelY: 184,
    moreX: 428,
    moreY: 140,
  },
  {
    x: 144,
    y: 184,
    dx: 1,
    dy: 0,
    angle: 90,
    slots: 6,
    distance: 314,
    labelX: 17,
    labelY: 140,
    moreX: 12,
    moreY: 184,
  },
];
const CAR_COLORS = [
  ['#8ed1eb', '#5eaed9', '#a1dcdf'],
  ['#f6be79', '#ed9575', '#f3d486'],
];
const SIGNALS = [
  [157, 91],
  [283, 233],
  [283, 91],
  [157, 233],
];

interface Sprite {
  key: string;
  x: number;
  y: number;
  angle: number;
  color: string;
  opacity: number;
}

/** Positions interpolate between ticks; each queue keeps first-in, first-out order. */
function sprites(sim: Intersection, progress: number): Sprite[] {
  const out: Sprite[] = [];
  const ease = Math.min(1, progress / 0.86);
  LANES.forEach((lane, arm) => {
    const motion = sim.motion![arm];
    const slots = Math.min(lane.slots, sim.q[arm]);
    const car = (id: number, distance: number, opacity = 1, tag = 'q') =>
      out.push({
        key: `${arm}-${tag}-${id}`,
        x: lane.x + lane.dx * distance,
        y: lane.y + lane.dy * distance,
        angle: lane.angle,
        color: CAR_COLORS[arm < 2 ? 0 : 1][(id + arm) % 3],
        opacity,
      });
    for (let slot = 0; slot < slots; slot++) {
      const id = sim.heads[arm] + slot;
      const target = -slot * 24;
      if (motion.entered === id) {
        const ingress = arm < 2 ? 106 : 158;
        car(id, -ingress + (target + ingress) * ease);
      } else car(id, target - (motion.departed ? 24 * (1 - ease) : 0));
    }
    for (const c of motion.crossing) {
      const elapsed = sim.time - c.time + progress;
      const distance = elapsed * 119 - (c.fresh ? 36 : 0);
      if (distance < lane.distance) car(c.id, distance, c.fresh ? Math.min(1, elapsed * 6) : 1, 'x');
    }
  });
  return out;
}

export function Street({ sim, progress, label }: { sim: Intersection; progress: number; label: string }) {
  const { lang } = useT();
  const { phase, allRed, yellow } = lightOf(sim);
  const compass = lang === 'bn' ? ['উ', 'দ', 'পূ', 'প'] : ['N', 'S', 'E', 'W'];
  return (
    <svg className="tr-map" viewBox="0 0 440 324" role="img" aria-label={label}>
      <use href="#tr-city-scene" />
      {sprites(sim, progress).map((s) => (
        <use
          key={s.key}
          href="#tr-city-car"
          transform={`translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) rotate(${s.angle})`}
          opacity={s.opacity.toFixed(2)}
          style={{ color: s.color }}
        />
      ))}
      {LANES.map((l, i) => (
        <g key={`l${i}`} transform={`translate(${l.labelX} ${l.labelY})`}>
          <rect x={-10} y={-9} width={20} height={18} rx={5} fill="#273538" />
          <text className="tr-map-label">{compass[i]}</text>
        </g>
      ))}
      {SIGNALS.map(([x, y], arm) => {
        const light = !allRed && (arm < 2 ? 0 : 1) === phase ? (yellow ? 'yellow' : 'go') : 'stop';
        return (
          <g key={`s${arm}`} className="tr-signal" data-light={light} transform={`translate(${x} ${y})`}>
            <path d="M1 9v13" stroke="#364840" strokeWidth={2} />
            <ellipse cx={1} cy={22} rx={4} ry={1.7} fill="#364840" opacity={0.45} />
            <rect x={-6} y={-11} width={14} height={31} rx={4} fill="#233435" opacity={0.21} />
            <rect
              x={-8}
              y={-13}
              width={14}
              height={31}
              rx={4}
              fill="#243539"
              stroke="#dde0cb"
              strokeWidth={1}
            />
            <circle className="lamp-red" cx={-1} cy={-6} r={3.2} />
            <circle className="lamp-yellow" cx={-1} cy={2.5} r={3.2} />
            <circle className="lamp-green" cx={-1} cy={11} r={3.2} />
          </g>
        );
      })}
      {LANES.map((l, arm) => {
        const more = sim.q[arm] - l.slots;
        if (more <= 0) return null;
        const text = `+${more}`;
        const width = Math.max(26, text.length * 7 + 6);
        return (
          <g key={`m${arm}`} transform={`translate(${l.moreX} ${l.moreY})`}>
            <rect x={-width / 2} y={-7} width={width} height={14} rx={5} fill="#223638" />
            <text className="tr-map-more">{text}</text>
          </g>
        );
      })}
    </svg>
  );
}
