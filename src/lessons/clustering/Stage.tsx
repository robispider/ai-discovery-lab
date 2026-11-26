import { useEffect } from 'react';
import { FEATURES, HIDDEN_TYPES, NEIGHBOURHOODS, type FeatureKey } from '../../data/neighbourhoods';
import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Callout, Card, Pill } from '../kit';
import { groupColor, useCluster } from './store';
import './clustering.css';

/** Drives the animated run while the stage is on screen. */
function useRunner() {
  const running = useCluster((s) => s.running);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => useCluster.getState().tick(), 600);
    return () => clearInterval(id);
  }, [running]);
}

export function ClusterStage() {
  useRunner();
  const step = useLab((s) => s.step);
  switch (step) {
    case 'understand':
      return <Understand />;
    case 'explore':
      return <Explore />;
    case 'train':
      return <Train />;
    case 'evaluate':
      return <Evaluate />;
    case 'break':
      return <BreakIt />;
    case 'apply':
      return <Apply />;
  }
}

function Understand() {
  const { bi, pick } = useT();
  return (
    <div className="lab-view">
      <p className="lab-lead">
        {bi(
          '200 neighbourhoods, 4 measurements each. Nobody tells the machine the right answer: it groups similar neighbourhoods by itself. Your job is to interpret the groups.',
          '২০০টি এলাকা, প্রতিটির ৪টি পরিমাপ। যন্ত্রকে কেউ সঠিক উত্তর বলে দেয় না: সে নিজেই একই রকম এলাকাগুলোকে দলে ভাগ করে। আপনার কাজ দলগুলোর অর্থ বোঝা।',
        )}
      </p>
      <div className="cl-features">
        {FEATURES.map((f, i) => (
          <div key={f.k} className="cl-feature">
            <span className="mono muted">{['①', '②', '③', '④'][i]}</span>
            <b>{pick(f)}</b>
          </div>
        ))}
      </div>
      <div className="lab-cols">
        <Card title={bi('Supervised (lessons 3–4)', 'সুপারভাইজড (পাঠ ৩–৪)')}>
          <p className="muted">
            {bi(
              'Every record comes with the right answer, and the machine learns to predict it.',
              'প্রতিটি রেকর্ডের সাথে সঠিক উত্তর থাকে, আর যন্ত্র তা অনুমান করতে শেখে।',
            )}
          </p>
        </Card>
        <Card title={bi('Unsupervised (this lesson)', 'আনসুপারভাইজড (এই পাঠ)')}>
          <p className="muted">
            {bi(
              'No answers at all. The machine only measures which neighbourhoods are close to each other.',
              'কোনো উত্তরই নেই। কোন এলাকাগুলো পরস্পরের কাছাকাছি, যন্ত্র শুধু সেটাই মাপে।',
            )}
          </p>
        </Card>
      </div>
    </div>
  );
}

function Explore() {
  const { bi, pick, num } = useT();
  return (
    <div className="lab-view">
      <Plot />
      <Card
        title={bi('The first eight rows', 'প্রথম আটটি সারি')}
        aside={<Pill tone="warn">{bi('Synthetic data', 'কৃত্রিম ডেটা')}</Pill>}
      >
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th>#</th>
                {FEATURES.map((f) => (
                  <th key={f.k}>{pick(f)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NEIGHBOURHOODS.filter((_, i) => i % 25 === 0).map((d, i) => (
                <tr key={i}>
                  <td>{num(i * 25 + 1)}</td>
                  {FEATURES.map((f) => (
                    <td key={f.k}>{num(d[f.k].toFixed(f.d))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted">
          {bi(
            'Density is in thousands while waste per person is below 1. Keep that in mind for Break it.',
            'জনঘনত্ব হাজারের ঘরে, আর মাথাপিছু বর্জ্য ১-এর কম। "ভেঙে দেখি" ধাপের জন্য এটা মনে রাখুন।',
          )}
        </p>
      </Card>
    </div>
  );
}

function Train() {
  return (
    <div className="lab-view">
      <div className="lab-cols wide-left">
        <Plot />
        <RunCard />
      </div>
    </div>
  );
}

function Evaluate() {
  const { bi } = useT();
  return (
    <div className="lab-view">
      <Card title={bi('Group profiles: give each group a name', 'দলের বৈশিষ্ট্য: প্রতিটি দলের একটি নাম দিন')}>
        <Profiles />
      </Card>
      <Plot />
    </div>
  );
}

function BreakIt() {
  const { bi, pick, num } = useT();
  const scale = useCluster((s) => s.scale);
  const revealed = useCluster((s) => s.revealed);
  const { setScale, setRevealed, setK, finish } = useCluster.getState();
  return (
    <div className="lab-view">
      <div className="lab-cols wide-left">
        <Plot />
        <div className="lab-view">
          <Callout kind="break">
            <label className="cl-check">
              <input type="checkbox" checked={!scale} onChange={(e) => setScale(!e.target.checked)} />
              <span>{bi('Turn off scaling (use raw numbers)', 'স্কেলিং বন্ধ করুন (কাঁচা সংখ্যা ব্যবহার)')}</span>
            </label>
            <p>
              {bi(
                'Density is in thousands and waste per person is below 1, so without scaling, density and drainage decide everything. Also try k = 2 and k = 8, and a new random start: same data, different stories.',
                'জনঘনত্ব হাজারের ঘরে, আর মাথাপিছু বর্জ্য ১-এর কম, তাই স্কেলিং ছাড়া জনঘনত্ব ও ড্রেনেজই সব ঠিক করে দেয়। k = ২ ও k = ৮ এবং নতুন এলোমেলো শুরুও চেষ্টা করুন: একই ডেটা, ভিন্ন গল্প।',
              )}
            </p>
            <div className="lab-row">
              {[2, 4, 8].map((k) => (
                <button
                  key={k}
                  type="button"
                  className="btn small ghost"
                  onClick={() => {
                    setK(k);
                    finish();
                  }}
                >
                  k = {num(k)}
                </button>
              ))}
            </div>
          </Callout>
          <RunCard />
          <Card title={bi('How was the data made?', 'ডেটা কীভাবে তৈরি হয়েছিল?')}>
            {revealed ? (
              <p>
                {bi('The data was generated from 4 hidden types: ', 'ডেটা তৈরি হয়েছিল ৪টি লুকানো ধরন থেকে: ')}
                {HIDDEN_TYPES.map((t, i) => (
                  <span key={i}>
                    {i ? ', ' : ''}
                    <b>{pick(t)}</b> ({num(t.n)})
                  </span>
                ))}
                .{' '}
                {bi(
                  'Did the machine find them? Real data rarely has such clean groups.',
                  'যন্ত্র কি সেগুলো খুঁজে পেয়েছে? বাস্তব ডেটায় এত পরিষ্কার দল খুব কমই থাকে।',
                )}
              </p>
            ) : (
              <button type="button" className="btn small ghost" onClick={() => setRevealed(true)}>
                {bi('Reveal how the data was generated', 'ডেটা কীভাবে তৈরি হয়েছিল দেখুন')}
              </button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Apply() {
  const { bi } = useT();
  return (
    <div className="lab-view">
      <Callout kind="lesson">
        <p>
          <b>
            {bi(
              'Machines can find patterns even when nobody provides the correct answers',
              'কেউ সঠিক উত্তর না দিলেও যন্ত্র প্যাটার্ন খুঁজে পেতে পারে',
            )}
          </b>{' '}
          {bi(
            '(unsupervised learning). But the machine does not know what a group means. Choosing k, choosing and scaling the measurements, and naming the groups are human decisions, and they change the story. The same method groups survey respondents in social research.',
            '(আনসুপারভাইজড লার্নিং)। কিন্তু একটি দলের অর্থ কী, যন্ত্র তা জানে না। k বাছাই, পরিমাপ বাছাই ও স্কেলিং, এবং দলের নামকরণ মানুষের সিদ্ধান্ত, এবং এগুলো গল্পটাই বদলে দেয়। সামাজিক গবেষণায় জরিপের উত্তরদাতাদের দলে ভাগ করতেও একই পদ্ধতি ব্যবহৃত হয়।',
          )}
        </p>
      </Callout>
      <Card title={bi('Your groups, with the names you gave them', 'আপনার দেওয়া নামসহ দলগুলো')}>
        <Profiles />
      </Card>
    </div>
  );
}

/** Scatter of two of the four measurements, coloured by group. */
function Plot() {
  const { bi, pick, num } = useT();
  const x = useCluster((s) => s.x);
  const y = useCluster((s) => s.y);
  const assign = useCluster((s) => s.assign);
  const k = useCluster((s) => s.k);
  const setAxis = useCluster((s) => s.setAxis);
  const fx = FEATURES.find((f) => f.k === x)!;
  const fy = FEATURES.find((f) => f.k === y)!;
  const W = 600;
  const H = 380;
  const P = { l: 52, r: 12, t: 10, b: 44 };
  const ext = (key: FeatureKey) => {
    const v = NEIGHBOURHOODS.map((d) => d[key]);
    return [Math.min(...v), Math.max(...v)];
  };
  const ex = ext(x);
  const ey = ext(y);
  const xs = (v: number) => P.l + ((v - ex[0]) / (ex[1] - ex[0])) * (W - P.l - P.r);
  const ys = (v: number) => H - P.b - ((v - ey[0]) / (ey[1] - ey[0])) * (H - P.t - P.b);
  const centres: { c: number; cx: number; cy: number }[] = [];
  if (assign)
    for (let c = 0; c < k; c++) {
      const mem = NEIGHBOURHOODS.filter((_, i) => assign[i] === c);
      if (!mem.length) continue;
      centres.push({
        c,
        cx: xs(mem.reduce((s, d) => s + d[x], 0) / mem.length),
        cy: ys(mem.reduce((s, d) => s + d[y], 0) / mem.length),
      });
    }
  const axisSelect = (axis: 'x' | 'y', value: FeatureKey) => (
    <label className="cl-axis">
      <span className="muted mono">{axis}:</span>
      <select
        className="lab-input"
        value={value}
        onChange={(e) => setAxis(axis, e.target.value as FeatureKey)}
      >
        {FEATURES.map((f) => (
          <option key={f.k} value={f.k}>
            {pick(f)}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <Card>
      <div className="lab-row">
        {axisSelect('x', x)}
        {axisSelect('y', y)}
      </div>
      <svg
        className="lab-chart cl-plot"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={bi(`Scatter plot of ${fx.en} against ${fy.en}`, `${fx.bn} বনাম ${fy.bn} বিন্দুচিত্র`)}
      >
        <line className="axis" x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} />
        <line className="axis" x1={P.l} x2={P.l} y1={P.t} y2={H - P.b} />
        {[0, 1, 2, 3, 4].map((t) => {
          const xv = ex[0] + (t / 4) * (ex[1] - ex[0]);
          const yv = ey[0] + (t / 4) * (ey[1] - ey[0]);
          return (
            <g key={t}>
              <text x={xs(xv)} y={H - P.b + 16} textAnchor="middle">
                {num(xv.toFixed(fx.d))}
              </text>
              <text x={P.l - 6} y={ys(yv) + 4} textAnchor="end">
                {num(yv.toFixed(fy.d))}
              </text>
            </g>
          );
        })}
        <text x={(W + P.l) / 2} y={H - 4} textAnchor="middle">
          {pick(fx)}
        </text>
        <text x={12} y={H / 2} textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`}>
          {pick(fy)}
        </text>
        {NEIGHBOURHOODS.map((d, i) => (
          <circle
            key={i}
            cx={xs(d[x]).toFixed(1)}
            cy={ys(d[y]).toFixed(1)}
            r={5}
            opacity={0.75}
            style={{ fill: assign ? groupColor(assign[i]) : 'var(--ink-2)', transition: 'fill 0.3s' }}
          />
        ))}
        {centres.map(({ c, cx, cy }) => {
          const d = `M${cx - 10},${cy - 10}L${cx + 10},${cy + 10}M${cx + 10},${cy - 10}L${cx - 10},${cy + 10}`;
          return (
            <g key={c}>
              <path d={d} strokeWidth={7} strokeLinecap="round" style={{ stroke: 'var(--ink)' }} />
              <path d={d} strokeWidth={4} strokeLinecap="round" style={{ stroke: groupColor(c) }} />
            </g>
          );
        })}
      </svg>
      <p className="muted cl-note">
        {bi(
          '✕ = group centre. The machine uses all 4 measurements; the chart can only show 2 at a time.',
          '✕ = দলের কেন্দ্র। যন্ত্র ৪টি পরিমাপই ব্যবহার করে; চার্টে একসাথে মাত্র ২টি দেখানো যায়।',
        )}
      </p>
    </Card>
  );
}

/** k, run buttons and the status line. */
export function RunCard() {
  const { bi } = useT();
  return (
    <Card title={bi('Find the groups', 'দল খুঁজুন')}>
      <RunControls />
    </Card>
  );
}

export function RunControls() {
  const { bi, num } = useT();
  const k = useCluster((s) => s.k);
  const assign = useCluster((s) => s.assign);
  const done = useCluster((s) => s.done);
  const iter = useCluster((s) => s.iter);
  const { setK, run, stepOnce, newStart } = useCluster.getState();
  return (
    <div className="lab-view cl-run">
      <label className="lab-slider">
        <span className="lab-slider-head">
          <span>{bi('Number of groups (k)', 'দলের সংখ্যা (k)')}</span>
          <b className="mono">{num(k)}</b>
        </span>
        <input type="range" min={2} max={8} value={k} onChange={(e) => setK(Number(e.target.value))} />
      </label>
      <div className="lab-row">
        <button type="button" className="btn" onClick={run}>
          ▶ {bi('Find groups', 'দল খোঁজো')}
        </button>
        <button type="button" className="btn ghost" onClick={stepOnce}>
          {bi('One step', 'এক ধাপ')}
        </button>
        <button type="button" className="btn ghost" onClick={newStart}>
          🎲 {bi('New random start', 'নতুন এলোমেলো শুরু')}
        </button>
      </div>
      <p className="cl-status" aria-live="polite">
        {!assign
          ? bi('Not grouped yet. Press "Find groups".', 'এখনো দলে ভাগ হয়নি। "দল খোঁজো" চাপুন।')
          : done
            ? '✅ ' +
              bi(
                `Stable after ${iter} steps: no neighbourhood changes group any more.`,
                `${num(iter)} ধাপ পর স্থির: আর কোনো এলাকা দল বদলাচ্ছে না।`,
              )
            : bi(
                `Step ${iter}: each neighbourhood joins the nearest centre, then each centre moves to the middle of its group.`,
                `ধাপ ${num(iter)}: প্রতিটি এলাকা নিকটতম কেন্দ্রে যোগ দেয়, তারপর প্রতিটি কেন্দ্র তার দলের মাঝখানে সরে যায়।`,
              )}
      </p>
    </div>
  );
}

function Profiles() {
  const { bi, pick, num } = useT();
  const assign = useCluster((s) => s.assign);
  const k = useCluster((s) => s.k);
  const names = useCluster((s) => s.names);
  const setName = useCluster((s) => s.setName);
  const finish = useCluster((s) => s.finish);
  if (!assign)
    return (
      <div className="lab-row">
        <p className="muted">{bi('Groups will appear here.', 'দলগুলো এখানে দেখা যাবে।')}</p>
        <button type="button" className="btn small" onClick={finish}>
          ▶ {bi('Find groups now', 'এখনই দল খুঁজুন')}
        </button>
      </div>
    );
  return (
    <div className="cl-profiles">
      {Array.from({ length: k }, (_, c) => c).map((c) => {
        const mem = NEIGHBOURHOODS.filter((_, i) => assign[i] === c);
        if (!mem.length) return null;
        return (
          <div key={c} className="cl-prof" style={{ borderColor: groupColor(c) }}>
            <h4>
              <span className="cl-dot" style={{ background: groupColor(c) }} />
              {bi('Group', 'দল')} {num(c + 1)} <small className="muted">({num(mem.length)})</small>
            </h4>
            <table>
              <tbody>
                {FEATURES.map((f) => (
                  <tr key={f.k}>
                    <td>{pick(f)}</td>
                    <td>
                      <b>{num((mem.reduce((s, d) => s + d[f.k], 0) / mem.length).toFixed(f.d))}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <input
              type="text"
              className="lab-input"
              value={names[c] ?? ''}
              placeholder={bi('Name this group…', 'এই দলের নাম দিন…')}
              aria-label={bi(`Name for group ${c + 1}`, `দল ${num(c + 1)}-এর নাম`)}
              onChange={(e) => setName(c, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}
