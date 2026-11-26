/* Scatter of the wards with the learned line, error pulls, the new ward, and draggable handles. */
import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { PREDICTORS, type Ward } from '../../data/wards';
import { predict } from '../../engines/regression';
import { useT } from '../../i18n';
import { rowsOf, useRegression } from './store';

const W = 760;
const H = 410;
const P = { l: 56, r: 22, t: 24, b: 48 };

export function Plot() {
  const { bi, num } = useT();
  const s = useRegression();
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<0 | 1 | null>(null);
  const [hover, setHover] = useState<Ward | null>(null);
  const X = PREDICTORS[s.xk];
  const rows = rowsOf(s.outliers);
  const nx = s.slider * X.mult;
  const dataMax = Math.max(...rows.map((r) => r[s.xk]));
  const xMax = Math.max(dataMax, nx) * 1.06;
  const pred = Math.max(0, predict(s.line, nx));
  const yMax = Math.max(...rows.map((r) => r.waste), pred, 10) * 1.1;
  const xs = (v: number) => P.l + (v / xMax) * (W - P.l - P.r);
  const ys = (v: number) => H - P.b - (Math.max(-yMax * 0.05, v) / yMax) * (H - P.t - P.b);
  const inv = (py: number) => ((H - P.b - py) / (H - P.t - P.b)) * yMax;
  const handleX = [dataMax * 0.2, dataMax * 0.9];

  const toSvgY = (e: ReactPointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return ((e.clientY - r.top) / r.height) * H;
  };
  const onMove = (e: ReactPointerEvent) => {
    if (drag === null) return;
    const y = inv(toSvgY(e));
    const other = 1 - drag;
    const ox = handleX[other];
    const oy = predict(s.line, ox);
    const hx = handleX[drag];
    const b = (y - oy) / (hx - ox);
    s.setLine({ a: oy - b * ox, b });
  };

  const xTicks = Array.from({ length: 6 }, (_, i) => (xMax / 5) * i);
  const yTicks = Array.from({ length: 5 }, (_, i) => (yMax / 4) * i);
  const unit = bi(X.shortEn, X.shortBn);
  const trips = Math.max(1, Math.ceil(pred / 5));

  return (
    <figure className="lab-chart-wrap rg-plot-wrap">
      <svg
        ref={svgRef}
        className={s.hand ? 'lab-chart rg-plot hand' : 'lab-chart rg-plot'}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={bi(
          `Scatter plot of ${rows.length} wards: ${X.en} against daily waste, with the learned line`,
          `${num(rows.length)}টি ওয়ার্ডের বিন্দুচিত্র: ${X.bn} বনাম দৈনিক বর্জ্য, শেখা রেখাসহ`,
        )}
        onPointerMove={onMove}
        onPointerUp={() => setDrag(null)}
        onPointerLeave={() => setDrag(null)}
      >
        {nx > dataMax && (
          <g>
            <rect
              className="rg-extrap"
              x={xs(dataMax)}
              y={P.t}
              width={W - P.r - xs(dataMax)}
              height={H - P.t - P.b}
            />
            <text x={xs(dataMax) + 8} y={P.t + 16}>
              🚧 {bi('outside the records: only a guess', 'রেকর্ডের বাইরে: কেবল আন্দাজ')}
            </text>
          </g>
        )}
        {yTicks.map((v) => (
          <g key={`y${v}`}>
            <line
              className="axis"
              x1={P.l}
              x2={W - P.r}
              y1={ys(v)}
              y2={ys(v)}
              strokeDasharray={v ? '3 4' : undefined}
            />
            <text x={P.l - 6} y={ys(v) + 4} textAnchor="end">
              {num(Math.round(v))}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <text key={`x${v}`} x={xs(v)} y={H - P.b + 16} textAnchor="middle">
            {num(Math.round(v))}
          </text>
        ))}
        <text x={(W + P.l) / 2} y={H - 8} textAnchor="middle">
          {X.ico} {bi(X.en, X.bn)} →
        </text>
        <text transform={`translate(14 ${H / 2}) rotate(-90)`} textAnchor="middle">
          🗑️ {bi('waste (tonnes/day) →', 'বর্জ্য (টন/দিন) →')}
        </text>

        {s.showRes &&
          rows.map((r) => {
            const e = r.waste - predict(s.line, r[s.xk]);
            return (
              <line
                key={`e${r.id}`}
                x1={xs(r[s.xk])}
                x2={xs(r[s.xk])}
                y1={ys(r.waste)}
                y2={ys(predict(s.line, r[s.xk]))}
                className={e > 0 ? 'rg-res under' : 'rg-res over'}
              />
            );
          })}
        {rows.map((r) =>
          r.out ? (
            <rect
              key={r.id}
              className="rg-bazaar"
              x={xs(r[s.xk]) - 6}
              y={ys(r.waste) - 6}
              width={12}
              height={12}
              transform={`rotate(45 ${xs(r[s.xk])} ${ys(r.waste)})`}
              onPointerEnter={() => setHover(r)}
              onPointerLeave={() => setHover(null)}
            />
          ) : (
            <circle
              key={r.id}
              className="rg-ward"
              cx={xs(r[s.xk])}
              cy={ys(r.waste)}
              r={hover?.id === r.id ? 7 : 4.5}
              onPointerEnter={() => setHover(r)}
              onPointerLeave={() => setHover(null)}
            />
          ),
        )}
        {s.ghost && (
          <line
            className="rg-ghost"
            x1={xs(0)}
            x2={xs(xMax)}
            y1={ys(predict(s.ghost, 0))}
            y2={ys(predict(s.ghost, xMax))}
          />
        )}
        <line
          className="rg-line"
          x1={xs(0)}
          x2={xs(xMax)}
          y1={ys(predict(s.line, 0))}
          y2={ys(predict(s.line, xMax))}
        />

        {/* the new ward */}
        <g className={s.walk ? 'rg-new walk' : 'rg-new'}>
          <line x1={xs(nx)} x2={xs(nx)} y1={H - P.b} y2={ys(pred)} />
          <line x1={P.l} x2={xs(nx)} y1={ys(pred)} y2={ys(pred)} />
          <circle cx={xs(nx)} cy={ys(pred)} r={8} />
          <text x={xs(nx) + 12} y={ys(pred) - 10}>
            {s.walk ? '🚛 ' : ''}
            {bi(
              `${pred.toFixed(1)} t · ${trips} trucks`,
              `${num(pred.toFixed(1))} টন · ${num(trips)}টি গাড়ি`,
            )}
          </text>
        </g>

        {s.hand &&
          handleX.map((hx, i) => (
            <g
              key={i}
              className="rg-handle"
              onPointerDown={(e) => {
                (e.target as Element).setPointerCapture?.(e.pointerId);
                setDrag(i as 0 | 1);
              }}
            >
              <circle cx={xs(hx)} cy={ys(predict(s.line, hx))} r={14} />
              <text x={xs(hx)} y={ys(predict(s.line, hx)) + 5} textAnchor="middle">
                ↕
              </text>
            </g>
          ))}
      </svg>
      {hover && (
        <figcaption className="rg-tip" role="status">
          <b>
            {hover.out ? '🏪 ' : '🏘️ '}
            {bi(hover.nameEn, hover.nameBn)}
          </b>{' '}
          · {bi(hover.typeEn, hover.typeBn)} ·{' '}
          {bi(
            `actual ${hover.waste} t, line says ${predict(s.line, hover[s.xk]).toFixed(1)} t`,
            `আসল ${num(hover.waste)} টন, রেখা বলছে ${num(predict(s.line, hover[s.xk]).toFixed(1))} টন`,
          )}
          {' · '}
          {unit} {num(hover[s.xk])}
        </figcaption>
      )}
    </figure>
  );
}
