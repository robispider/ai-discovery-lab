import { useMemo, type ReactNode } from 'react';
import { BAZAARS, PREDICTORS, WARDS, TRUCK_TONNES, type XKey } from '../../data/wards';
import { evaluate, ols, predict } from '../../engines/regression';
import { rng, shuffle } from '../../engines/random';
import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Callout, Card, LineChart, Pill } from '../kit';
import { Plot } from './Plot';
import { MAX_STEPS, pointsOf, rowsOf, useRegression } from './store';
import './regression.css';

const fmtLine = (a: number, b: number) => `${a.toFixed(1)} ${b >= 0 ? '+' : '−'} ${Math.abs(b).toFixed(3)}`;

export function RegressionStage() {
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

function Talk({ avatar, who, children }: { avatar: string; who?: ReactNode; children: ReactNode }) {
  return (
    <div className="rg-talk">
      <span className="rg-avatar" aria-hidden="true">
        {avatar}
      </span>
      <div className="rg-say" aria-live="polite">
        {who && <span className="rg-who">{who}</span>}
        {children}
      </div>
    </div>
  );
}

function Understand() {
  const { bi } = useT();
  return (
    <div className="lab-view">
      <p className="lab-lead">
        {bi(
          'Every morning the Conservancy Department must decide how many 5-tonne compactor trucks to send to each ward: too few leaves garbage on the street, too many wastes fuel. Lesson 3 predicted a category; here the machine learns a line that predicts a number.',
          'প্রতিদিন সকালে বর্জ্য ব্যবস্থাপনা বিভাগকে ঠিক করতে হয় প্রতিটি ওয়ার্ডে কয়টি ৫-টনের কম্প্যাক্টর গাড়ি পাঠাবে: কম হলে রাস্তায় ময়লা জমে, বেশি হলে জ্বালানি নষ্ট হয়। পাঠ ৩ একটি শ্রেণি অনুমান করেছিল; এখানে যন্ত্র একটি রেখা শেখে যা একটি সংখ্যা অনুমান করে।',
        )}
      </p>
      <Forecast />
    </div>
  );
}

/** The new ward: its clue, the line's forecast and what it means for trucks, crew and cost. */
function Forecast() {
  const { bi, num } = useT();
  const s = useRegression();
  const X = PREDICTORS[s.xk];
  const rows = rowsOf(s.outliers);
  const nx = s.slider * X.mult;
  const dmax = Math.max(...rows.map((r) => r[s.xk]));
  const extrap = nx > dmax;
  const pred = Math.max(0, predict(s.line, nx));
  const trips = Math.max(1, Math.ceil(pred / TRUCK_TONNES));
  const crew = Math.max(4, Math.round(pred * 1.15));
  const cost = Math.round(trips * 3200 + crew * 550);
  const word = X.word(nx);
  const eq = `${fmtLine(s.line.a, s.line.b)} × ${nx} = ${pred.toFixed(1)}`;
  const setStep = useLab((x) => x.setStep);
  return (
    <div className="lab-cols wide-left">
      <Card>
        <WardScene pred={pred} trips={trips} nx={nx} extrap={extrap} xk={s.xk} />
        <Talk avatar="📏">
          {extrap
            ? bi(
                `I plugged ${nx} ${X.unitEn} into my line: ${eq} t (${trips} trucks). ⚠️ Caution: the largest ward I ever studied had only ${dmax}. Extending a line this far is only a guess!`,
                `আমি ${num(nx)} ${X.unitBn} আমার রেখায় বসিয়ে পেলাম ${num(eq)} টন (${num(trips)}টি গাড়ি)। ⚠️ সতর্কতা: আমি যে সবচেয়ে বড় ওয়ার্ড দেখেছি তাতে ছিল মাত্র ${num(dmax)}। এতদূর রেখা টানা কেবল আন্দাজ!`,
              )
            : bi(
                `I plugged ${nx} ${X.unitEn} into my learned line: ${eq} t. At 5 tonnes per compactor truck, that means ${trips} truck trips tomorrow morning.`,
                `আমি ${num(nx)} ${X.unitBn} আমার শেখা রেখায় বসিয়ে পেলাম ${num(eq)} টন। প্রতি গাড়িতে ৫ টন হিসেবে আগামীকাল সকালে লাগবে ${num(trips)}টি গাড়ির ট্রিপ।`,
              )}
        </Talk>
      </Card>
      <Card title={bi("Change the new ward's clues", 'নতুন ওয়ার্ডের তথ্য বদলান')}>
        <PredictorChoice />
        <label className="lab-slider">
          <span className="lab-slider-head">
            <span>
              {X.ico} {bi(X.en, X.bn)}
            </span>
            <b className="mono">
              {num(nx)}
              {s.xk === 'pop' ? bi('k', ' হা.') : ''}
            </b>
          </span>
          <input
            type="range"
            min={X.min}
            max={X.smax}
            value={s.slider}
            onChange={(e) => s.setSlider(Number(e.target.value))}
          />
          <span className={extrap ? 'rg-word warn' : 'muted rg-word'}>{bi(word[0], word[1])}</span>
        </label>
        <div className="rg-ops">
          <div>
            <span>🚛 {bi('Trucks', 'গাড়ি')}</span>
            <b>{num(trips)}</b>
          </div>
          <div>
            <span>👷 {bi('Crew', 'কর্মী')}</span>
            <b>{num(crew)}</b>
          </div>
          <div>
            <span>💰 {bi('Daily BDT', 'দৈনিক টাকা')}</span>
            <b>৳{num(Math.round(cost / 1000))}k</b>
          </div>
        </div>
        <span className="muted rg-small">
          {bi('Try a City Corporation scenario:', 'একটি সিটি কর্পোরেশন পরিস্থিতি চেষ্টা করুন:')}
        </span>
        <div className="lab-row">
          {X.presets.map((p) => (
            <button
              key={p.v}
              type="button"
              className={p.v > 108 && s.xk === 'pop' ? 'chip-btn brk' : 'chip-btn'}
              aria-pressed={Math.abs(s.slider - p.v) <= 2}
              onClick={() => s.setSlider(p.v)}
            >
              {p.ico} {bi(p.en, p.bn)}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => {
            s.startWalk();
            setStep('train');
          }}
        >
          ▶ {bi('Show me how the line calculates this', 'রেখা কীভাবে হিসাব করে দেখাও')}
        </button>
      </Card>
    </div>
  );
}

function PredictorChoice() {
  const { bi } = useT();
  const xk = useRegression((s) => s.xk);
  const setX = useRegression((s) => s.setX);
  const opt = (k: XKey) => (
    <button type="button" aria-pressed={xk === k} onClick={() => setX(k)}>
      {PREDICTORS[k].ico} {k === 'pop' ? bi('Population', 'জনসংখ্যা') : bi('Shops & biz', 'দোকানপাট')}
    </button>
  );
  return (
    <div className="seg" role="group" aria-label={bi('Predict from', 'যা দিয়ে অনুমান')}>
      {opt('pop')}
      {opt('biz')}
    </div>
  );
}

/** A simple ward street: buildings that grow with the clue, the transfer station's waste mound, and trucks. */
function WardScene({
  pred,
  trips,
  nx,
  extrap,
  xk,
}: {
  pred: number;
  trips: number;
  nx: number;
  extrap: boolean;
  xk: XKey;
}) {
  const { bi, num } = useT();
  const nBuild = Math.min(10, Math.max(2, Math.round((xk === 'pop' ? nx / 12 : nx / 140) + 1)));
  const mound = Math.min(1, pred / 60);
  const flood = pred > 0 ? Math.min(1, pred / 90) : 0;
  return (
    <div className="rg-scene-wrap">
      <svg
        className="rg-scene"
        viewBox="0 0 800 300"
        role="img"
        aria-label={bi(
          `A ward street. Forecast: ${pred.toFixed(1)} tonnes of waste, ${trips} trucks.`,
          `একটি ওয়ার্ডের রাস্তা। পূর্বাভাস: ${num(pred.toFixed(1))} টন বর্জ্য, ${num(trips)}টি গাড়ি।`,
        )}
      >
        <defs>
          <linearGradient id="rg-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd9a8" />
            <stop offset="1" stopColor="#fff3df" />
          </linearGradient>
        </defs>
        <rect width="800" height="300" fill="url(#rg-sky)" />
        <circle cx="90" cy="60" r="30" fill="#ffc24d" />
        {Array.from({ length: nBuild }, (_, i) => {
          const w = 60;
          const x = 20 + i * 52;
          const h = 70 + ((i * 37) % 60) + (xk === 'pop' ? 30 : 0);
          return (
            <g key={i} transform={`translate(${x} ${210 - h})`}>
              <rect
                width={w - 8}
                height={h}
                fill={xk === 'pop' ? (i % 2 ? '#d7c8b4' : '#c9b8a2') : i % 2 ? '#e9c79f' : '#d9a878'}
                stroke="#a99880"
              />
              {xk === 'biz' && (
                <rect y={h - 26} width={w - 8} height={10} fill={['#c0392b', '#2e86c1', '#27ae60'][i % 3]} />
              )}
              {Array.from({ length: Math.floor(h / 26) }, (_, r) => (
                <g key={r}>
                  <rect x={8} y={10 + r * 24} width={12} height={12} fill="#7fa6bf" />
                  <rect x={30} y={10 + r * 24} width={12} height={12} fill="#7fa6bf" />
                </g>
              ))}
            </g>
          );
        })}
        <rect y="210" width="800" height="40" fill="#4a5056" />
        <path d="M0 230 H800" stroke="#e8e2c8" strokeWidth="2" strokeDasharray="18 14" />
        <rect y="250" width="800" height="50" fill="#b9a983" />
        {/* transfer station */}
        <g transform="translate(600 120)">
          <rect width="170" height="90" fill="#8c9aa3" stroke="#66737b" />
          <text x="85" y="18" textAnchor="middle" className="rg-scene-label">
            STS
          </text>
          <path d={`M15 90 Q85 ${90 - 70 * mound} 155 90 Z`} fill="#6b8e4e" opacity={0.6 + 0.4 * flood} />
        </g>
        {/* trucks */}
        {Array.from({ length: Math.min(trips, 14) }, (_, i) => (
          <text key={i} x={20 + i * 40} y={244} fontSize="26">
            🚛
          </text>
        ))}
        {trips > 14 && (
          <text x={590} y={244} className="rg-scene-label">
            +{num(trips - 14)}
          </text>
        )}
      </svg>
      <div className={extrap ? 'rg-forecast warn' : 'rg-forecast'}>
        <span className="eyebrow">{bi("The line's forecast", 'রেখার পূর্বাভাস')}</span>
        <b>
          🚛{' '}
          {bi(
            `${pred.toFixed(1)} t/day · ${trips} trucks`,
            `${num(pred.toFixed(1))} টন/দিন · ${num(trips)}টি গাড়ি`,
          )}
        </b>
        {extrap && <span className="rg-small">⚠️ {bi('outside city records', 'শহরের রেকর্ডের বাইরে')}</span>}
      </div>
    </div>
  );
}

function Explore() {
  const { bi, num } = useT();
  const outliers = useRegression((s) => s.outliers);
  const seed = useRegression((s) => s.cardSeed);
  const shuffleCards = useRegression((s) => s.shuffleCards);
  const cards = useMemo(() => {
    const rows = seed ? shuffle(WARDS, rng(seed * 104729)).slice(0, 6) : WARDS.slice(0, 6);
    return outliers ? [...rows.slice(0, 5), BAZAARS[seed % BAZAARS.length]] : rows;
  }, [seed, outliers]);
  const rows = rowsOf(outliers);
  const csv = () => {
    const out = [['ward', 'population_k', 'businesses', 'waste_tonnes_day', 'type']].concat(
      rows.map((r) => [r.nameEn, String(r.pop), String(r.biz), String(r.waste), r.typeEn]),
    );
    const blob = new Blob(['﻿' + out.map((r) => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ward_waste_synthetic.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="lab-view">
      <Card
        title={bi('The City Corporation ward register', 'সিটি কর্পোরেশনের ওয়ার্ড খাতা')}
        aside={
          <span className="lab-row">
            <Pill tone="warn">{bi('Synthetic data', 'কৃত্রিম ডেটা')}</Pill>
            <button type="button" className="btn small ghost" onClick={shuffleCards}>
              🔀 {bi('Show 6 other wards', 'অন্য ৬টি ওয়ার্ড দেখাও')}
            </button>
            <button type="button" className="btn small ghost" onClick={csv}>
              ⬇ CSV
            </button>
          </span>
        }
      >
        <Talk avatar="📏">
          {bi(
            'Each card is one ward from our conservancy log: how many residents live there, how many shops operate, and how many tonnes of waste our trucks weighed at the landfill. I will study all 120 wards to find one straight-line rule.',
            'প্রতিটি কার্ড আমাদের সিটি কর্পোরেশনের বর্জ্য খাতার একটি ওয়ার্ড: সেখানে কত বাসিন্দা থাকেন, কয়টি দোকান আছে, আর ল্যান্ডফিলের ওজনযন্ত্রে দৈনিক কত টন বর্জ্য মাপা হয়েছে। আমি সব ১২০টি ওয়ার্ড পড়ে একটি সরলরেখার নিয়ম বের করব।',
          )}
        </Talk>
        <div className="lab-cols">
          <div>
            <div className="rg-recs">
              {cards.map((r) => (
                <div key={r.id} className={r.out ? 'rg-rec bazaar' : 'rg-rec'}>
                  <span className="rg-rec-h">
                    {r.out ? '🏪 ' : '🏘️ '}
                    {bi(r.nameEn, r.nameBn)}
                  </span>
                  <span className="rg-rec-cl mono">
                    <span>👥 {num(r.pop)}k</span>
                    <span>🏪 {num(r.biz)}</span>
                    <span>🚛 {num(Math.ceil(r.waste / 5))}</span>
                  </span>
                  {r.out && <span className="rg-rec-note">⚠️ {bi('bazaar outlier!', 'পাইকারি বাজার!')}</span>}
                  <span className={r.out ? 'rg-stamp mkt' : 'rg-stamp'}>
                    🗑️ {num(r.waste)} {bi('t/d', 'টন')}
                  </span>
                </div>
              ))}
            </div>
            <p className="muted rg-small">
              {bi(
                `👥 population (k) · 🏪 shops · 🚛 5-tonne trips · 🗑️ weighed daily waste. Register has ${rows.length} wards${outliers ? ' (including 5 wholesale bazaars)' : ''}.`,
                `👥 জনসংখ্যা (হাজার) · 🏪 দোকান · 🚛 ৫-টনের ট্রিপ · 🗑️ মাপা দৈনিক বর্জ্য। খাতায় মোট ${num(rows.length)}টি ওয়ার্ড${outliers ? ' (৫টি পাইকারি বাজারসহ)' : ''}।`,
              )}
            </p>
          </div>
          <div className="rg-seesaw">
            <span className="eyebrow">{bi('How does a line learn?', 'রেখা কীভাবে শেখে?')}</span>
            <p className="rg-small">
              {bi(
                'Imagine an elastic spring between every ward dot and the line. Red springs pull the line up; blue springs pull it down. Step by step, the AI tilts and shifts the line until the total pull (squared error) is as small as possible.',
                'ভাবুন প্রতিটি ওয়ার্ড বিন্দু ও রেখার মাঝে একটি ইলাস্টিক স্প্রিং আছে। লাল স্প্রিং রেখাকে ওপরে টানে; নীল স্প্রিং নিচে টানে। ধাপে ধাপে এআই রেখাটি কাত করে ও সরায় যতক্ষণ না মোট টান (বর্গ-ভুল) সর্বনিম্ন হয়।',
              )}
            </p>
            <svg viewBox="0 0 300 130" aria-hidden="true" className="rg-seesaw-svg">
              <line x1="26" y1="110" x2="282" y2="110" className="axis" />
              <line x1="26" y1="14" x2="26" y2="110" className="axis" />
              {[
                [56, 96, 108],
                [94, 84, 100],
                [138, 68, 82],
                [184, 54, 66],
                [226, 40, 54],
                [262, 26, 38],
              ].map(([x, y1, y2], i) => (
                <line
                  key={i}
                  x1={x}
                  x2={x}
                  y1={y1}
                  y2={y2}
                  className={i % 2 ? 'rg-res over' : 'rg-res under'}
                />
              ))}
              <line x1="34" y1="104" x2="276" y2="24" className="rg-line" />
              {[56, 76, 94, 118, 138, 162, 184, 206, 226, 246, 262].map((x, i) => (
                <circle
                  key={x}
                  cx={x}
                  cy={[96, 94, 84, 76, 68, 64, 54, 48, 40, 36, 26][i]}
                  r="4.5"
                  className="rg-ward"
                />
              ))}
            </svg>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Train() {
  const { bi, num } = useT();
  const s = useRegression();
  const X = PREDICTORS[s.xk];
  const rows = rowsOf(s.outliers);
  const pts = pointsOf(rows, s.xk);
  const st = evaluate(pts, s.line);
  const nx = s.slider * X.mult;
  const pred = Math.max(0, predict(s.line, nx));
  const trips = Math.max(1, Math.ceil(pred / 5));
  const rule = bi(
    `waste ≈ ${fmtLine(s.line.a, s.line.b)} × ${X.shortEn}`,
    `বর্জ্য ≈ ${num(fmtLine(s.line.a, s.line.b))} × ${X.shortBn}`,
  );
  let say: ReactNode;
  if (s.walk)
    say = bi(
      `🚛 Follow the dashed path on the chart: go right to ${nx} ${X.unitEn}, straight up to my line, then read left: ${pred.toFixed(1)} tonnes/day (${trips} trucks).`,
      `🚛 চার্টে ড্যাশ দেওয়া পথটি অনুসরণ করুন: ডানে যান ${num(nx)} ${X.unitBn} পর্যন্ত, সোজা ওপরে উঠে রেখায় পৌঁছান, তারপর বাঁয়ে পড়ুন ${num(pred.toFixed(1))} টন/দিন (${num(trips)}টি গাড়ি)।`,
    );
  else if (s.gd)
    say = bi(
      `⚙️ Step ${s.step}: red springs (under-planned wards) pull me up; blue springs (over-planned wards) pull me down. Watch the error curve fall!`,
      `⚙️ ধাপ ${num(s.step)}: লাল স্প্রিং (কম অনুমান) আমাকে ওপরে টানছে; নীল স্প্রিং (বেশি অনুমান) নিচে টানছে। ভুলের রেখাটি নামতে দেখুন!`,
    );
  else if (s.hand)
    say = bi(
      '✋ Your turn! Grab the two ↕ circles on the line and try to beat my error score. Watch the red and blue springs shrink as you get closer!',
      '✋ এবার আপনার পালা! রেখার দুটি ↕ বৃত্ত টেনে আমার ভুলের স্কোর হারানোর চেষ্টা করুন। কাছে এলেই লাল ও নীল স্প্রিং ছোট হতে দেখবেন!',
    );
  else if (s.outliers && st.r2 < 0.55)
    say = (
      <>
        {bi(
          '💥 Just 5 wholesale bazaars pulled my line away from the dashed residential-only rule: ',
          '💥 মাত্র ৫টি পাইকারি বাজার আমাকে ড্যাশ দেওয়া আবাসিক নিয়ম থেকে টেনে সরিয়ে দিয়েছে: ',
        )}
        <span className="rg-q">{rule}</span>
        {bi(
          `. R² fell to ${Math.round(st.r2 * 100)}%.`,
          `। R² নেমে এসেছে ${num(Math.round(st.r2 * 100))}%-এ।`,
        )}
      </>
    );
  else
    say = (
      <>
        {bi('🎓 Learned rule: ', '🎓 শেখা নিয়ম: ')}
        <span className="rg-q">{rule}</span>
        {bi(
          '. Point at any ward to see its actual and predicted waste, or try fitting the line by hand!',
          '। যেকোনো ওয়ার্ডে পয়েন্টার রেখে আসল ও অনুমিত বর্জ্য দেখুন, বা নিজে হাতে রেখা টানুন!',
        )}
      </>
    );
  return (
    <div className="lab-view">
      <Talk avatar="📏">{say}</Talk>
      <div className="lab-cols wide-left">
        <Card
          aside={
            <span className={s.gd ? 'rg-badge running' : s.hand ? 'rg-badge hand' : 'rg-badge'}>
              {s.gd
                ? bi(`Learning… step ${s.step}/${MAX_STEPS}`, `শিখছে… ধাপ ${num(s.step)}/${num(MAX_STEPS)}`)
                : s.hand
                  ? bi('Hand-fit mode · drag ↕', 'নিজে হাতে · ↕ টানুন')
                  : bi('Fitted ✓', 'শেখা সম্পন্ন ✓')}
            </span>
          }
        >
          <Plot />
          <div className="lab-legend">
            <span>
              <i style={{ background: 'var(--accent)' }} />
              {bi('City wards', 'সিটি ওয়ার্ড')}
            </span>
            {s.outliers && (
              <span>
                <i style={{ background: 'var(--warn)' }} />
                {bi('Wholesale bazaars', 'পাইকারি বাজার')}
              </span>
            )}
            <span>
              <i style={{ background: 'var(--c3)' }} />
              {bi('Learned rule', 'শেখা নিয়ম')}
            </span>
            {s.ghost && (
              <span>
                <i style={{ background: 'var(--ink-2)' }} />
                {bi('Residential-only rule', 'শুধু আবাসিক নিয়ম')}
              </span>
            )}
            <span>
              <i style={{ background: 'var(--yes)' }} />/<i style={{ background: 'var(--no)' }} />
              {bi('Error pulls', 'ভুলের টান')}
            </span>
          </div>
        </Card>
        <Card title={bi('Train the line', 'রেখাকে শেখান')}>
          <TrainButtons />
          <LineChart
            height={150}
            ymin={0}
            label={bi('Squared error at each learning step', 'প্রতিটি শেখার ধাপে বর্গ-ভুল')}
            series={[
              { values: s.losses, color: 'var(--warn)', label: bi('Squared error (MSE)', 'বর্গ-ভুল (MSE)') },
            ]}
          />
          <LossNote />
        </Card>
      </div>
    </div>
  );
}

export function TrainButtons() {
  const { bi } = useT();
  const s = useRegression();
  return (
    <div className="lab-view">
      <div className="lab-row">
        <button type="button" className="btn" onClick={s.learn}>
          ▶ {bi('Watch it learn', 'শেখা দেখুন')}
        </button>
        <button type="button" className="btn ghost" onClick={s.bestFit}>
          ⚡ {bi('Best fit', 'সেরা রেখা')}
        </button>
        <button type="button" className={s.hand ? 'btn ghost on' : 'btn ghost'} onClick={s.toggleHand}>
          ✋ {bi('Try by hand', 'নিজে হাতে')}
        </button>
      </div>
      <label className="rg-speed">
        <span aria-hidden="true">🐢</span>
        <input
          type="range"
          min={1}
          max={5}
          value={s.speed}
          aria-label={bi('Learning speed', 'শেখার গতি')}
          onChange={(e) => s.setSpeed(Number(e.target.value))}
        />
        <span aria-hidden="true">🐇</span>
      </label>
      <label className="rg-check">
        <input type="checkbox" checked={s.showRes} onChange={(e) => s.setShowRes(e.target.checked)} />
        {bi(
          'Show error pulls (red = overflow, blue = idle trucks)',
          'ভুলের টান দেখান (লাল = ময়লা জমে, নীল = অলস গাড়ি)',
        )}
      </label>
    </div>
  );
}

function LossNote() {
  const { bi, num } = useT();
  const s = useRegression();
  const pts = pointsOf(rowsOf(s.outliers), s.xk);
  const st = evaluate(pts, s.line);
  if (s.hand) {
    const opt = evaluate(pts, ols(pts));
    return (
      <p className="muted rg-small">
        {bi(
          `Your squared error: ${st.mse.toFixed(1)} (AI best possible: ${opt.mse.toFixed(1)}). Drag the ↕ handles to shrink it!`,
          `আপনার বর্গ-ভুল: ${num(st.mse.toFixed(1))} (এআই-এর সেরা: ${num(opt.mse.toFixed(1))})। কমাতে ↕ হাতল টানুন!`,
        )}
      </p>
    );
  }
  if (s.losses.length > 1) {
    const drop = Math.max(
      0,
      Math.round((1 - s.losses[s.losses.length - 1] / Math.max(1e-9, s.losses[0])) * 100),
    );
    return (
      <p className="muted rg-small">
        {bi(
          `Squared error dropped by ${drop}% as the line settled between the ${pts.length} wards.`,
          `${num(pts.length)}টি ওয়ার্ডের মাঝে বসতে গিয়ে বর্গ-ভুল ${num(drop)}% কমেছে।`,
        )}
      </p>
    );
  }
  return (
    <p className="muted rg-small">
      {bi(
        `Squared error (MSE): ${st.mse.toFixed(1)}. Press "Watch it learn" to watch it fall step by step.`,
        `বর্গ-ভুল (MSE): ${num(st.mse.toFixed(1))}। ধাপে ধাপে কমতে দেখতে "শেখা দেখুন" চাপুন।`,
      )}
    </p>
  );
}

function Evaluate() {
  const { bi, num } = useT();
  const s = useRegression();
  const pts = pointsOf(rowsOf(s.outliers), s.xk);
  const st = evaluate(pts, s.line);
  const r2 = Math.round(st.r2 * 100);
  const tk = Math.round(st.within * 100);
  const perTruck = s.line.b > 0.0001 ? 5 / s.line.b : 0;
  const ring = (v: number, cls: string, label: ReactNode) => (
    <div className={`rg-ring ${cls}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="bg" cx="60" cy="60" r="50" />
        <circle
          className="fg"
          cx="60"
          cy="60"
          r="50"
          style={{ strokeDashoffset: (314.16 * (1 - Math.max(0, Math.min(1, v)))).toFixed(1) }}
        />
      </svg>
      <span className="rg-ring-v">{num(Math.round(v * 100))}%</span>
      <span className="rg-ring-k">{label}</span>
    </div>
  );
  const tile = (cls: string, title: string, n: number, desc: string) => (
    <div className={`rg-tile ${cls}`}>
      <span className="rg-tile-t">{title}</span>
      <span className="rg-tile-n">
        {num(n)} <small>/ {num(st.n)}</small>
      </span>
      <span className="rg-tile-bar">
        <i style={{ width: `${((n / st.n) * 100).toFixed(0)}%` }} />
      </span>
      <span className="rg-tile-d">{desc}</span>
    </div>
  );
  return (
    <div className="lab-view">
      <Card
        title={bi(
          'How accurate is this rule for the City Corporation?',
          'সিটি কর্পোরেশনের জন্য এই নিয়ম কতটা নির্ভুল?',
        )}
      >
        <div className="lab-cols">
          <div className="lab-view">
            <div className="rg-rings">
              {ring(
                st.r2,
                r2 < 55 ? 'r2 low' : 'r2',
                <>📊 {bi('Pattern explained (R² score)', 'ব্যাখ্যাকৃত প্যাটার্ন (R² স্কোর)')}</>,
              )}
              {ring(
                st.within,
                'tk',
                <>🚛 {bi('Wards within ±1 truck (±5 t)', '±১ গাড়ির মধ্যে সঠিক ওয়ার্ড (±৫ টন)')}</>,
              )}
            </div>
            <Talk avatar="📏">
              {r2 >= 80
                ? bi(
                    `Strong rule! I explain ${r2}% of daily waste differences and land within ±1 truck on ${tk}% of wards.`,
                    `দারুণ নিয়ম! আমি দৈনিক বর্জ্যের ${num(r2)}% তারতম্য ব্যাখ্যা করতে পারি এবং ${num(tk)}% ওয়ার্ডে ±১ গাড়ির ভেতরে সঠিক অনুমান দিই।`,
                  )
                : bi(
                    `Uh oh: my R² dropped to ${r2}% and average error jumped to ±${st.mae.toFixed(1)} t. One straight line cannot fit both residential wards and wholesale bazaars!`,
                    `ওহো: আমার R² নেমে এসেছে ${num(r2)}%-এ আর গড় ভুল বেড়ে ±${num(st.mae.toFixed(1))} টন! একটি সরলরেখা আবাসিক ওয়ার্ড ও পাইকারি বাজার দুটোই একসাথে মেলাতে পারে না!`,
                  )}
            </Talk>
          </div>
          <div className="rg-tiles">
            {tile(
              'good',
              bi('✅ Spot-on dispatch', '✅ নিখুঁত পাঠানো'),
              st.spot,
              bi(
                'Within ±2.5 tonnes of actual waste: the station clears on schedule.',
                'আসল বর্জ্যের ±২.৫ টনের মধ্যে: সময়মতো পরিষ্কার হয়।',
              ),
            )}
            {tile(
              'bad worst',
              bi('😱 Under-planned (overflow!)', '😱 কম পরিকল্পনা (ময়লা জমে!)'),
              st.under,
              bi(
                'Actual waste was more than 2.5 t higher: garbage left on streets.',
                'আসল বর্জ্য ২.৫ টনের বেশি: রাস্তায় ময়লা পড়ে থাকে।',
              ),
            )}
            {tile(
              'bad',
              bi('💸 Over-planned (idle trucks)', '💸 বেশি পরিকল্পনা (অলস গাড়ি)'),
              st.over,
              bi(
                'Predicted more than 2.5 t too high: extra trips burn diesel.',
                'অনুমান ২.৫ টনের বেশি: বাড়তি ট্রিপে ডিজেল নষ্ট।',
              ),
            )}
            <div className="rg-tile neutral">
              <span className="rg-tile-t">📐 {bi('Average gap & city rule', 'গড় ব্যবধান ও শহরের নিয়ম')}</span>
              <span className="rg-tile-n">
                ±{num(st.mae.toFixed(1))} <small>{bi('t/day', 'টন/দিন')}</small>
              </span>
              <span className="rg-tile-d">
                {perTruck > 0 && perTruck < (s.xk === 'pop' ? 999 : 9999)
                  ? s.xk === 'pop'
                    ? bi(
                        `Roughly +1 compactor truck for every ${perTruck.toFixed(1)}k residents.`,
                        `মোটামুটি প্রতি ${num(perTruck.toFixed(1))} হাজার মানুষে +১টি গাড়ি।`,
                      )
                    : bi(
                        `Roughly +1 compactor truck for every ${Math.round(perTruck)} shops.`,
                        `মোটামুটি প্রতি ${num(Math.round(perTruck))} দোকানে +১টি গাড়ি।`,
                      )
                  : bi('Line is nearly flat!', 'রেখা প্রায় সমতল!')}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function BreakIt() {
  const { bi } = useT();
  const s = useRegression();
  const setStep = useLab((x) => x.setStep);
  return (
    <div className="lab-view">
      <div className="lab-row">
        <span className="rt-spacer" />
        <button type="button" className="btn small ghost" onClick={s.reset}>
          ↺ {bi('Back to normal', 'স্বাভাবিকে ফেরাও')}
        </button>
      </div>
      <div className="lab-cols">
        <Callout
          kind="break"
          title={bi('A. Extrapolation: guessing beyond city records', 'ক. ডেটার বাইরের অনুমান')}
        >
          <p>
            {bi(
              'All 120 recorded wards have fewer than 110k residents. If planners type in a proposed 210k mega township, the straight line happily prints a number, even though the AI has never seen a ward that big!',
              'রেকর্ড করা ১২০টি ওয়ার্ডের সবগুলোতেই বাসিন্দা ১১০ হাজারের কম। পরিকল্পনাকারীরা যদি প্রস্তাবিত ২১০ হাজারের মেগা টাউনশিপ বসান, সরলরেখা নির্দ্বিধায় একটি সংখ্যা দেয়, অথচ এআই এত বড় ওয়ার্ড কখনো দেখেনি!',
            )}
          </p>
          <button
            type="button"
            className="btn small warn"
            onClick={() => {
              s.setX('pop');
              s.setSlider(210);
              setStep('understand');
            }}
          >
            🧪 {bi('Try it: 210k mega township', 'করে দেখুন: ২১০ হাজারের মেগা টাউনশিপ')}
          </button>
        </Callout>
        <Callout kind="break" title={bi('B. Correlation ≠ causation', 'খ. সম্পর্ক মানেই কারণ নয়')}>
          <p>
            {bi(
              'Switch the predictor to shops and businesses. It predicts daily waste almost as well, because busy wards have both more people and more shops. That does not mean closing shops will eliminate household waste!',
              'তথ্য বদলে দোকানপাট বেছে নিন। এটিও দৈনিক বর্জ্য প্রায় একই রকম ভালো অনুমান করে, কারণ ঘনবসতি ওয়ার্ডে মানুষ ও দোকান দুটোই বেশি। এর মানে এই নয় যে দোকান বন্ধ করলে বাসাবাড়ির বর্জ্য কমে যাবে!',
            )}
          </p>
          <button
            type="button"
            className="btn small warn"
            onClick={() => {
              s.setX('biz');
              setStep('evaluate');
            }}
          >
            🧪 {bi('Try it: predict from shops', 'করে দেখুন: দোকান দিয়ে অনুমান')}
          </button>
        </Callout>
      </div>
      <Card
        title={bi(
          "C. Outliers: 5 wholesale bazaars bend the whole city's rule",
          'গ. ব্যতিক্রম: ৫টি পাইকারি বাজার পুরো শহরের নিয়ম বাঁকিয়ে দেয়',
        )}
      >
        <p className="muted">
          {bi(
            'Wholesale bazaars like Karwan Bazar or Jatrabari Arat have few night-time residents, yet produce 76–88 tonnes of vegetable and market waste daily. Flip the switch and watch one straight line try to serve both!',
            'কারওয়ান বাজার বা যাত্রাবাড়ী আড়তের মতো পাইকারি বাজারে রাতে বাসিন্দা কম, কিন্তু দৈনিক ৭৬–৮৮ টন শাকসবজি ও বাজারের বর্জ্য তৈরি হয়। সুইচটি চালু করে দেখুন একটি সরলরেখা দুটোই সামলাতে গেলে কী ঘটে!',
          )}
        </p>
        <label className="rg-check strong">
          <input type="checkbox" checked={s.outliers} onChange={(e) => s.setOutliers(e.target.checked)} />
          {bi(
            'Include 5 wholesale bazaar wards in the training data',
            'প্রশিক্ষণের ডেটায় ৫টি পাইকারি বাজার-ওয়ার্ড যোগ করুন',
          )}
        </label>
        <RealityCheck />
      </Card>
    </div>
  );
}

/** How many trucks the line sends to ordinary residential wards, with and without the bazaars. */
function RealityCheck() {
  const { bi, num } = useT();
  const outliers = useRegression((s) => s.outliers);
  const clean = ols(pointsOf(WARDS, 'pop'));
  const cur = outliers ? ols(pointsOf([...WARDS, ...BAZAARS], 'pop')) : clean;
  const stClean = evaluate(pointsOf(WARDS, 'pop'), clean);
  const stCur = evaluate(pointsOf(rowsOf(outliers), 'pop'), cur);
  const fleet = (title: ReactNode, pop: number) => {
    const need = Math.ceil(predict(clean, pop) / 5);
    const sent = Math.ceil(predict(cur, pop) / 5);
    const diff = sent - need;
    return (
      <div className="rg-fleet">
        <div className="rg-fleet-h">
          <span>{title}</span>
          <b className={diff === 0 ? 'ok' : diff > 0 ? 'warn' : 'yes'}>
            {diff === 0
              ? bi(`${sent} trucks (spot-on ✓)`, `${num(sent)}টি গাড়ি (নিখুঁত ✓)`)
              : diff > 0
                ? bi(
                    `${need} → ${sent} (+${diff} wasted)`,
                    `${num(need)} → ${num(sent)} (+${num(diff)} বাড়তি)`,
                  )
                : bi(
                    `${need} → ${sent} (${diff} short! overflow)`,
                    `${num(need)} → ${num(sent)} (${num(diff)} কম! ময়লা জমে)`,
                  )}
          </b>
        </div>
        <div className="rg-fleet-icons">
          {Array.from({ length: Math.max(need, sent) }, (_, i) => {
            const cls = i < Math.min(need, sent) ? 'ok' : sent > need ? 'extra' : 'miss';
            return (
              <span key={i} className={`rg-truck ${cls}`}>
                {cls === 'miss' ? '🗑️' : '🚛'}
              </span>
            );
          })}
        </div>
      </div>
    );
  };
  return (
    <div className="lab-cols">
      <div className="lab-view">
        {outliers && (
          <div className="lab-row">
            {BAZAARS.map((o) => (
              <Pill key={o.id} tone="warn">
                🏪 {bi(o.nameEn, o.nameBn)} ({num(o.waste)} {bi('t', 'টন')})
              </Pill>
            ))}
          </div>
        )}
        {outliers && (
          <Talk avatar="🏪" who={bi('Salam, Karwan Bazar wholesale trader', 'সালাম, কারওয়ান বাজারের আড়তদার')}>
            {bi(
              'Thousands of trucks unload vegetables here before dawn, even though almost nobody sleeps here at night. Of course our waste does not match our resident count!',
              'ভোর হওয়ার আগেই হাজারো ট্রাক এখানে সবজি নামায়, যদিও রাতে এখানে প্রায় কেউ থাকে না। আমাদের বর্জ্য তো বাসিন্দার সংখ্যার সাথে মিলবে না!',
            )}
          </Talk>
        )}
        <Talk avatar="📏" who={bi('The line', 'রেখা')}>
          {outliers
            ? bi(
                `Those 5 bazaars yanked my left end upward and dropped my R² from ${Math.round(stClean.r2 * 100)}% to ${Math.round(stCur.r2 * 100)}%! Now I send extra trucks to small residential wards and too few to big ones. Bazaars need their own category.`,
                `ওই ৫টি বাজার আমার বাঁ প্রান্ত ওপরে টেনে তুলেছে, আর আমার R² ${num(Math.round(stClean.r2 * 100))}% থেকে নেমে ${num(Math.round(stCur.r2 * 100))}% হয়েছে! এখন ছোট ওয়ার্ডে বাড়তি গাড়ি আর বড় ওয়ার্ডে কম গাড়ি যাচ্ছে। বাজারের জন্য আলাদা শ্রেণি দরকার।`,
              )
            : bi(
                `Right now I study only the 120 ordinary wards (R² = ${Math.round(stClean.r2 * 100)}%), so both small and big residential wards get the right fleet. Flip the switch to add the 5 wholesale bazaars!`,
                `এখন আমি শুধু ১২০টি সাধারণ ওয়ার্ড দেখছি (R² = ${num(Math.round(stClean.r2 * 100))}%), তাই ছোট ও বড় সব আবাসিক ওয়ার্ড ঠিক সংখ্যক গাড়ি পাচ্ছে। এবার সুইচটি চালু করে ৫টি পাইকারি বাজার যোগ করুন!`,
              )}
        </Talk>
      </div>
      <div className="lab-view">
        <b className="rg-small">
          {bi(
            'Reality check: how many 5-tonne trucks go to ordinary residential wards?',
            'বাস্তব যাচাই: সাধারণ আবাসিক ওয়ার্ডে কয়টি ৫-টনের গাড়ি যায়?',
          )}
        </b>
        {fleet(
          <>🏘️ {bi('Quiet residential ward (25k residents)', 'শান্ত আবাসিক ওয়ার্ড (২৫ হাজার বাসিন্দা)')}</>,
          25,
        )}
        {fleet(
          <>🏙️ {bi('Busy residential ward (100k residents)', 'ব্যস্ত আবাসিক ওয়ার্ড (১০০ হাজার বাসিন্দা)')}</>,
          100,
        )}
        <div className="lab-legend">
          <span>🚛 {bi('needed', 'দরকারি')}</span>
          <span className="rg-truck extra">🚛</span> {bi('extra idle truck', 'বাড়তি অলস গাড়ি')}
          <span className="rg-truck miss">🗑️</span> {bi('missing truck', 'যে গাড়ি নেই')}
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
          <b>{bi('Regression predicts quantities:', 'রিগ্রেশন পরিমাণ অনুমান করে:')}</b>{' '}
          {bi(
            'tonnes of waste, water demand, holding-tax collection, or school enrolment. Learning means adjusting the line step by step to shrink prediction errors. But watch three traps: (1) outliers such as wholesale bazaars need their own category; (2) extrapolation far beyond recorded wards is only a guess; (3) correlation is not causation: predicting from shops works, yet it does not tell us which policy reduces waste.',
            'বর্জ্যের টন, পানির চাহিদা, হোল্ডিং ট্যাক্স আয় বা স্কুলে ভর্তি। শেখা মানে ভুল কমাতে ধাপে ধাপে রেখাটি সমন্বয় করা। তবে তিনটি ঝুঁকি মনে রাখুন: (১) পাইকারি বাজারের মতো ব্যতিক্রমের জন্য আলাদা শ্রেণি দরকার; (২) ডেটার বাইরের অনুমান কেবল আন্দাজ; (৩) সম্পর্ক মানেই কারণ নয়: দোকানের সংখ্যা দিয়ে বর্জ্য অনুমান করা যায়, কিন্তু তাতে বোঝা যায় না কোন নীতি বর্জ্য কমাবে।',
          )}
        </p>
      </Callout>
      <Forecast />
    </div>
  );
}
