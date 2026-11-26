/*
 * Building blocks shared by every ported experiment, in the new lab's look.
 * Lessons compose these; they never use literal colours (read tokens with useTokens instead).
 */
import type { ReactNode } from 'react';
import { useT } from '../../i18n';
import './kit.css';

export function Card({
  title,
  aside,
  children,
  className,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className ? `lab-card ${className}` : 'lab-card'}>
      {(title || aside) && (
        <header className="lab-card-head">
          {title && <h3>{title}</h3>}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

/** "Lesson" (teal) and "Break it" (orange) call-outs. */
export function Callout({
  kind,
  title,
  children,
}: {
  kind: 'lesson' | 'break';
  title?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useT();
  return (
    <aside className={`lab-callout ${kind}`}>
      <span className="eyebrow">{title ?? t(kind === 'break' ? 'tabs.break' : 'kit.lesson')}</span>
      <div>{children}</div>
    </aside>
  );
}

export function Stat({ label, value, tone }: { label: ReactNode; value: ReactNode; tone?: 'good' | 'bad' }) {
  return (
    <div className={tone ? `lab-stat ${tone}` : 'lab-stat'}>
      <span className="lab-stat-k">{label}</span>
      <span className="lab-stat-v">{value}</span>
    </div>
  );
}

export function Stats({ children }: { children: ReactNode }) {
  return <div className="lab-stats">{children}</div>;
}

export interface BarItem {
  label: ReactNode;
  value: number;
  key?: string;
}

/** Horizontal bars. Values are 0..1 unless `relative`, which scales to the largest value. */
export function Bars({
  items,
  relative,
  highlightTop = true,
  format,
}: {
  items: BarItem[];
  relative?: boolean;
  highlightTop?: boolean;
  format?: (v: number) => ReactNode;
}) {
  const { num } = useT();
  const max = Math.max(1e-9, ...items.map((i) => i.value));
  return (
    <div className="lab-bars">
      {items.map((it, i) => {
        const w = relative ? (it.value / max) * 100 : it.value * 100;
        const top = highlightTop && it.value === max;
        return (
          <div key={it.key ?? i} className={top ? 'lab-bar top' : 'lab-bar'}>
            <span className="lab-bar-label">{it.label}</span>
            <span className="lab-bar-track">
              <i style={{ width: `${Math.max(0, Math.min(100, w)).toFixed(1)}%` }} />
            </span>
            <span className="lab-bar-v mono">
              {format ? format(it.value) : num(Math.round(it.value * 100)) + '%'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export interface Series {
  values: number[];
  /** CSS colour, usually a token such as var(--c1). */
  color: string;
  label?: ReactNode;
  dashed?: boolean;
}

/** Small SVG line chart. Colours come from tokens, so it follows the theme without redrawing. */
export function LineChart({
  series,
  height = 220,
  ymin,
  ymax,
  xlabels,
  yfmt,
  label,
}: {
  series: Series[];
  height?: number;
  ymin?: number;
  ymax?: number;
  xlabels?: (string | number)[];
  yfmt?: (v: number) => string;
  label: string;
}) {
  const { num } = useT();
  const W = 520;
  const H = height;
  const P = { l: 46, r: 12, t: 12, b: 28 };
  const all = series.flatMap((s) => s.values);
  let lo = ymin ?? Math.min(...all);
  let hi = ymax ?? Math.max(...all);
  if (!Number.isFinite(lo)) lo = 0;
  if (!Number.isFinite(hi) || hi <= lo) hi = lo + 1;
  const n = Math.max(1, ...series.map((s) => s.values.length));
  const xs = (i: number) => P.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - P.l - P.r));
  const ys = (v: number) => H - P.b - ((v - lo) / (hi - lo)) * (H - P.t - P.b);
  const fmt = (v: number) => num(yfmt ? yfmt(v) : Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(2));
  const step = Math.max(1, Math.ceil(n / 10));
  return (
    <figure className="lab-chart-wrap">
      <svg className="lab-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {[0, 1, 2, 3, 4].map((k) => {
          const v = lo + (k / 4) * (hi - lo);
          const y = ys(v);
          return (
            <g key={k}>
              <line
                className="axis"
                x1={P.l}
                x2={W - P.r}
                y1={y}
                y2={y}
                strokeDasharray={k ? '3 4' : undefined}
              />
              <text x={P.l - 6} y={y + 4} textAnchor="end">
                {fmt(v)}
              </text>
            </g>
          );
        })}
        {Array.from({ length: Math.ceil(n / step) }, (_, j) => j * step).map((i) => (
          <text key={i} x={xs(i)} y={H - 8} textAnchor="middle">
            {num(xlabels?.[i] ?? i + 1)}
          </text>
        ))}
        {series.map((s, si) =>
          s.values.length ? (
            <g key={si}>
              <path
                d={s.values.map((v, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join('')}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeDasharray={s.dashed ? '6 5' : undefined}
              />
              {s.values.length < 30 &&
                s.values.map((v, i) => <circle key={i} cx={xs(i)} cy={ys(v)} r={3.5} fill={s.color} />)}
            </g>
          ) : null,
        )}
      </svg>
      {series.some((s) => s.label) && (
        <figcaption className="lab-legend">
          {series.map((s, i) =>
            s.label ? (
              <span key={i}>
                <i style={{ background: s.color }} />
                {s.label}
              </span>
            ) : null,
          )}
        </figcaption>
      )}
    </figure>
  );
}

/** Labelled range slider with the current value shown. */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => ReactNode;
}) {
  const { num } = useT();
  return (
    <label className="lab-slider">
      <span className="lab-slider-head">
        <span>{label}</span>
        <b className="mono">{format ? format(value) : num(value)}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

/** Segmented choice (one of a few). */
export function Choice<V extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: V; label: ReactNode }[];
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <div className="seg lab-choice" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ResetButton({ onReset }: { onReset: () => void }) {
  const { t } = useT();
  return (
    <button type="button" className="btn ghost" onClick={onReset}>
      ↺ {t('kit.reset')}
    </button>
  );
}

/** Named states the facilitator can jump to ("show the overfitted tree"). */
export function Presets({ items }: { items: { label: ReactNode; onPick: () => void; brk?: boolean }[] }) {
  const { t } = useT();
  return (
    <div className="lab-presets" role="group" aria-label={t('kit.presets')}>
      <span className="eyebrow">{t('kit.presets')}</span>
      {items.map((p, i) => (
        <button key={i} type="button" className={p.brk ? 'chip-btn brk' : 'chip-btn'} onClick={p.onPick}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

/** Small tag, e.g. "used" / "ignored". */
export function Pill({ tone, children }: { tone?: 'ok' | 'warn' | 'yes' | 'no'; children: ReactNode }) {
  return <span className={tone ? `lab-pill ${tone}` : 'lab-pill'}>{children}</span>;
}

/** Highlights each of `words` (first occurrence, case-insensitive) inside `text`. */
export function Highlight({ text, words }: { text: string; words: string[] }) {
  const marks: [number, number][] = [];
  const low = text.toLowerCase();
  for (const w of words) {
    const i = w ? low.indexOf(w.toLowerCase()) : -1;
    if (i >= 0) marks.push([i, i + w.length]);
  }
  marks.sort((a, b) => a[0] - b[0]);
  const parts: ReactNode[] = [];
  let at = 0;
  marks.forEach(([s, e], k) => {
    if (s < at) return;
    parts.push(text.slice(at, s), <mark key={k}>{text.slice(s, e)}</mark>);
    at = e;
  });
  parts.push(text.slice(at));
  return <>{parts}</>;
}
