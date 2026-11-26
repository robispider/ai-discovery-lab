import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import {
  ALGS,
  BLOCKED,
  BUILDING,
  H,
  isEnd,
  moveEnd,
  passable,
  setBlocked,
  W,
  WATER,
  type Alg,
} from '../../engines/search';
import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Callout, Card } from '../kit';
import { useTokens } from '../kit/hooks';
import { drawMap, MAP_TOKENS } from './drawMap';
import { settled, useRoute, type MissionId } from './store';
import './route.css';

const INFO: Record<Alg, { ico: string; name: string; nick: [string, string]; how: [string, string] }> = {
  bfs: {
    ico: '🌊',
    name: 'BFS',
    nick: ['The Ripple', 'ঢেউ'],
    how: [
      'Spreads out one block at a time in every direction, like a ripple. Counts blocks, ignores traffic.',
      'ঢেউয়ের মতো সব দিকে এক ব্লক করে ছড়ায়। ব্লক গোনে, যানজট দেখে না।',
    ],
  },
  dijkstra: {
    ico: '🧭',
    name: 'Dijkstra',
    nick: ['The Careful Planner', 'সতর্ক পরিকল্পনাকারী'],
    how: [
      'Always continues the quickest trip found so far. Guaranteed fastest, but checks almost everywhere.',
      'সবসময় এ পর্যন্ত পাওয়া সবচেয়ে কম সময়ের পথটি এগিয়ে নেয়। দ্রুততম নিশ্চিত, তবে প্রায় সব জায়গা যাচাই করে।',
    ],
  },
  astar: {
    ico: '🎯',
    name: 'A*',
    nick: ['The Smart Local', 'অভিজ্ঞ স্থানীয় চালক'],
    how: [
      'Time so far + a guess of the distance left to the station. Fastest route with far less checking.',
      'এ পর্যন্ত সময় + স্টেশন পর্যন্ত বাকি দূরত্বের আন্দাজ। অনেক কম যাচাই করেই দ্রুততম পথ।',
    ],
  },
  greedy: {
    ico: '🏃',
    name: 'Greedy',
    nick: ['The Impatient Driver', 'অধৈর্য চালক'],
    how: [
      'Only asks "which way gets me closer to the station?" Decides fast, but can drive into a jam.',
      'শুধু ভাবে "কোন দিকে গেলে স্টেশনের কাছে যাব?" দ্রুত সিদ্ধান্ত নেয়, কিন্তু যানজটে ঢুকে পড়তে পারে।',
    ],
  },
};

const label = (a: Alg) => `${INFO[a].ico} ${INFO[a].name}`;

export function RouteStage() {
  const step = useLab((s) => s.step);
  switch (step) {
    case 'understand':
      return <Understand />;
    case 'explore':
      return <Explore />;
    case 'train':
      return <Drive />;
    case 'evaluate':
      return <Race />;
    case 'break':
      return <BreakIt />;
    case 'apply':
      return <Apply />;
  }
}

function Understand() {
  const { bi } = useT();
  return (
    <div className="lab-view">
      <p className="lab-lead">
        {bi(
          'Every morning a garbage truck 🚛 leaves the depot and must reach the transfer station 🏁 across the canal. The market roads are jammed, and only two bridges cross the water. Which way is fastest? There is no data and no training here: just step-by-step rules written by people.',
          'প্রতিদিন সকালে একটি ময়লার গাড়ি 🚛 ডিপো থেকে বের হয় এবং খাল পেরিয়ে ট্রান্সফার স্টেশনে 🏁 পৌঁছাতে হয়। বাজারের রাস্তায় যানজট, আর খাল পার হওয়ার সেতু মাত্র দুটি। কোন পথে সবচেয়ে দ্রুত যাওয়া যায়? এখানে কোনো ডেটা বা প্রশিক্ষণ নেই: শুধু মানুষের লেখা ধাপে ধাপে নিয়ম।',
        )}
      </p>
      <Card>
        <CityMap />
        <Legend />
      </Card>
    </div>
  );
}

function Explore() {
  return (
    <div className="lab-view">
      <Card>
        <Toolbar />
        <CityMap editable />
        <Legend />
      </Card>
    </div>
  );
}

function Drive() {
  return (
    <div className="lab-view">
      <div className="lab-cols wide-left">
        <div className="lab-view">
          <Card>
            <CityMap editable />
          </Card>
          <Narration />
        </div>
        <Drivers />
      </div>
    </div>
  );
}

function Race() {
  const { bi } = useT();
  const runAll = useRoute((s) => s.runAll);
  return (
    <div className="lab-view">
      <Card
        title={bi('Same city, four ways of thinking', 'একই শহর, চিন্তার চারটি ধরন')}
        aside={
          <button type="button" className="btn" onClick={runAll}>
            ▶ {bi('Run all four', 'চারটিই চালান')}
          </button>
        }
      >
        <p className="muted">
          {bi(
            'A good method finds the fastest trip (short purple bar) with little checking (short teal bar).',
            'ভালো পদ্ধতি কম যাচাই করে (ছোট সবুজ-নীল বার) দ্রুততম যাত্রা (ছোট বেগুনি বার) খুঁজে পায়।',
          )}
        </p>
        <RaceGrid />
      </Card>
      <Narration />
    </div>
  );
}

function BreakIt() {
  const { bi } = useT();
  return (
    <div className="lab-view">
      <div className="lab-cols wide-left">
        <div className="lab-view">
          <Card>
            <Toolbar />
            <CityMap editable />
          </Card>
          <Narration />
        </div>
        <div className="lab-view">
          <Card title={bi('Close the bridges', 'সেতু বন্ধ করুন')}>
            <Missions only={['west', 'both']} />
          </Card>
          <Callout kind="break" title={bi('What it cannot do', 'যা সে পারে না')}>
            <p>
              {bi(
                'A search only knows the map it is given. If the map is wrong (a road closed for repairs that nobody marked), the "fastest" route is wrong too. With both bridges blocked, every method correctly reports that no route exists. It cannot invent a road.',
                'অনুসন্ধান শুধু তাকে দেওয়া মানচিত্রটুকুই জানে। মানচিত্র ভুল হলে (মেরামতের জন্য বন্ধ রাস্তা কেউ চিহ্নিত না করলে) "দ্রুততম" পথও ভুল হবে। দুটি সেতু বন্ধ হলে সব পদ্ধতিই ঠিকভাবে জানায় কোনো পথ নেই। নতুন রাস্তা সে বানাতে পারে না।',
              )}
            </p>
          </Callout>
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
              'Intelligent behaviour does not always need data, neural networks or an LLM.',
              'বুদ্ধিমান আচরণের জন্য সবসময় ডেটা, নিউরাল নেটওয়ার্ক বা LLM লাগে না।',
            )}
          </b>{' '}
          {bi(
            '🎯 A* finds the fastest route while checking far fewer places than 🧭 Dijkstra, because a person gave it a good rule of thumb: "how far is the station from here?" The same idea powers navigation apps and vehicle routing.',
            '🎯 A* দ্রুততম পথ খুঁজে পায় এবং 🧭 Dijkstra-র চেয়ে অনেক কম জায়গা যাচাই করে, কারণ মানুষ তাকে একটি ভালো আন্দাজের নিয়ম দিয়েছে: "এখান থেকে স্টেশন কত দূরে?" নেভিগেশন অ্যাপ ও গাড়ির রুট পরিকল্পনা একই ধারণায় চলে।',
          )}
        </p>
      </Callout>
      <Card title={bi('Where search is used in a city', 'শহরে অনুসন্ধান কোথায় ব্যবহৃত হয়')}>
        <ul className="rt-list">
          <li>
            {bi('Daily routes for waste trucks and street sweepers', 'ময়লার গাড়ি ও ঝাড়ুদারদের দৈনিক রুট')}
          </li>
          <li>{bi('Ambulance and fire-service dispatch', 'অ্যাম্বুলেন্স ও ফায়ার সার্ভিস পাঠানো')}</li>
          <li>{bi('Planning detours when a road is dug up', 'রাস্তা খোঁড়া হলে বিকল্প পথ পরিকল্পনা')}</li>
        </ul>
        <p className="muted">
          {bi(
            'Each needs an up-to-date map. Who in your office keeps it current?',
            'প্রতিটির জন্য হালনাগাদ মানচিত্র দরকার। আপনার অফিসে কে এটি হালনাগাদ রাখেন?',
          )}
        </p>
      </Card>
    </div>
  );
}

/** The big city map. Editable maps take clicks to block roads or move the truck and station. */
function CityMap({ editable }: { editable?: boolean }) {
  const { bi, lang } = useT();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const painting = useRef<'block' | 'unblock' | null>(null);
  const city = useRoute((s) => s.city);
  const result = useRoute((s) => s.result);
  const view = useRoute((s) => s.view);
  const mode = useRoute((s) => s.mode);
  const speed = useRoute((s) => s.speed);
  const colors = useTokens(MAP_TOKENS);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cell = Math.max(8, Math.floor(width / W));

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext?.('2d');
    if (!c || !ctx || !width) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = cell * W * dpr;
    c.height = cell * H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMap(ctx, cell, city, {
      colors,
      font: getComputedStyle(document.body).fontFamily,
      t: (en, bn) => (lang === 'bn' ? bn : en),
      result,
      shown: view.shown,
      phase: view.phase,
      truck: view.truck,
      hover: editable ? hover : null,
      hoverBlock: mode === 'block',
      speed,
    });
  }, [cell, width, city, result, view, colors, lang, hover, mode, speed, editable]);

  const cellAt = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - r.left) / (r.width / W)),
      y: Math.floor((e.clientY - r.top) / (r.height / H)),
    };
  };
  const inside = (p: { x: number; y: number }) => p.x >= 0 && p.y >= 0 && p.x < W && p.y < H;

  const paint = (p: { x: number; y: number }) => {
    const s = useRoute.getState();
    const next = setBlocked(s.city, p, painting.current === 'block');
    if (next !== s.city) s.setCity(next);
  };

  const handlers = editable
    ? {
        onPointerDown: (e: ReactPointerEvent<HTMLCanvasElement>) => {
          const p = cellAt(e);
          if (!inside(p)) return;
          const s = useRoute.getState();
          const t = s.city.grid[p.y][p.x];
          if (s.mode === 'block') {
            if (t === BUILDING || t === WATER || isEnd(s.city, p)) return;
            painting.current = t === BLOCKED ? 'unblock' : 'block';
            paint(p);
            e.currentTarget.setPointerCapture(e.pointerId);
          } else if (passable(s.city, p.x, p.y)) {
            s.setCity(moveEnd(s.city, s.mode, p));
          }
        },
        onPointerMove: (e: ReactPointerEvent<HTMLCanvasElement>) => {
          const p = cellAt(e);
          if (painting.current) {
            paint(p);
            return;
          }
          const s = useRoute.getState();
          const t = inside(p) ? s.city.grid[p.y][p.x] : -1;
          const ok =
            s.mode === 'block'
              ? t !== -1 && t !== BUILDING && t !== WATER && !isEnd(s.city, p)
              : inside(p) && passable(s.city, p.x, p.y);
          setHover((h) => (ok ? (h && h.x === p.x && h.y === p.y ? h : p) : null));
        },
        onPointerUp: () => {
          painting.current = null;
        },
        onPointerLeave: () => setHover(null),
      }
    : {};

  return (
    <div ref={wrapRef} className="rt-map-wrap">
      <canvas
        ref={canvasRef}
        className={editable ? 'rt-map editable' : 'rt-map'}
        style={{
          width: cell * W,
          height: cell * H,
          cursor: editable ? (hover ? 'pointer' : 'crosshair') : 'default',
        }}
        role="img"
        aria-label={bi(
          'City map with roads, a canal, two bridges, a garbage truck and a transfer station',
          'রাস্তা, একটি খাল, দুটি সেতু, একটি ময়লার গাড়ি ও একটি ট্রান্সফার স্টেশনসহ শহরের মানচিত্র',
        )}
        {...handlers}
      />
    </div>
  );
}

function Toolbar() {
  const { bi } = useT();
  const mode = useRoute((s) => s.mode);
  const { setMode, reset } = useRoute.getState();
  const modes = [
    { id: 'block' as const, label: bi('🚧 Block / open a road', '🚧 রাস্তা বন্ধ / খোলা') },
    { id: 'start' as const, label: bi('🚛 Move truck', '🚛 গাড়ি সরান') },
    { id: 'goal' as const, label: bi('🏁 Move station', '🏁 স্টেশন সরান') },
  ];
  return (
    <div className="lab-row rt-toolbar">
      <span className="muted">{bi('Click the map to:', 'মানচিত্রে ক্লিক করে:')}</span>
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          className="chip-btn"
          aria-pressed={mode === m.id}
          onClick={() => setMode(m.id)}
        >
          {m.label}
        </button>
      ))}
      <span className="rt-spacer" />
      <button type="button" className="btn small ghost" onClick={reset}>
        ↺ {bi('Reset map', 'রিসেট')}
      </button>
    </div>
  );
}

function Legend() {
  const { bi } = useT();
  const items = [
    ['road', bi('Clear road: 1 min per block', 'ফাঁকা রাস্তা: প্রতি ব্লকে ১ মিনিট')],
    ['jam', bi('Traffic jam: 4 min per block', 'যানজট: প্রতি ব্লকে ৪ মিনিট')],
    ['water', bi('Canal', 'খাল')],
    ['bridge', bi('Bridge', 'সেতু')],
    ['blocked', bi('Blocked by you', 'আপনার বন্ধ করা')],
    ['explore', bi('Places the computer checked', 'কম্পিউটার যেসব জায়গা যাচাই করেছে')],
    ['route', bi('Chosen route', 'বেছে নেওয়া পথ')],
  ];
  return (
    <div className="rt-legend">
      {items.map(([k, text]) => (
        <span key={k}>
          <i className={`rt-sw ${k}`} />
          {text}
        </span>
      ))}
    </div>
  );
}

/** What just happened, in words: effort, trip time, the sum, and a verdict. */
function Narration() {
  const { bi, num } = useT();
  const result = useRoute((s) => s.result);
  const ref = useRoute((s) => s.ref);
  const view = useRoute((s) => s.view);
  const min = (n: number) => (
    <>
      {num(n)} <small>{bi('min', 'মিনিট')}</small>
    </>
  );

  let icon = '👉';
  let main: ReactNode = bi(
    'Pick a driver. The computer will check places one by one (teal) until it reaches the station, then the truck drives the route it chose (purple).',
    'একজন চালক বেছে নিন। কম্পিউটার একে একে জায়গা যাচাই করবে (সবুজ-নীল) যতক্ষণ না স্টেশনে পৌঁছায়, তারপর গাড়িটি তার বেছে নেওয়া পথে (বেগুনি) চলবে।',
  );
  let formula: ReactNode = null;
  let insight: { tone: 'good' | 'bad'; body: ReactNode } | null = null;

  if (result && view.phase === 'search') {
    const I = INFO[result.alg];
    icon = '🔍';
    main = (
      <>
        {bi(`${label(result.alg)} is searching… `, `${label(result.alg)} খুঁজছে… `)}
        <span className="rt-light">{bi(I.how[0], I.how[1])}</span>
      </>
    );
  } else if (result && view.phase === 'drive') {
    icon = '🚛';
    main = bi('Route found! The truck is driving it…', 'পথ পাওয়া গেছে! গাড়ি চলছে…');
  } else if (result && view.phase === 'done') {
    const r = result;
    const I = INFO[r.alg];
    if (!r.found) {
      icon = '🚫';
      main = (
        <>
          {bi('No route exists. ', 'কোনো পথ নেই। ')}
          <span className="rt-light">
            {bi(
              `${label(r.alg)} checked every reachable place (${r.order.length}) and proved there is no way across. A computer cannot invent a road.`,
              `${label(r.alg)} পৌঁছানো যায় এমন সব জায়গা (${num(r.order.length)}টি) যাচাই করে প্রমাণ করেছে যে পার হওয়ার কোনো উপায় নেই। কম্পিউটার নতুন রাস্তা বানাতে পারে না।`,
            )}
          </span>
        </>
      );
    } else {
      icon = '✅';
      main = bi(
        `${label(r.alg)} (${I.nick[0]}) found a route: ${r.travel} min trip, after checking ${r.order.length} places.`,
        `${label(r.alg)} (${I.nick[1]}) একটি পথ পেয়েছে: ${num(r.travel)} মিনিটের যাত্রা, ${num(r.order.length)}টি জায়গা যাচাই করে।`,
      );
      formula = (
        <div className="rt-formula">
          <span className="rt-fchip clear">
            {bi(`${r.clear} clear × 1 min`, `${num(r.clear)} ফাঁকা ব্লক × ১ মিনিট`)}
          </span>
          +
          <span className="rt-fchip jam">
            {bi(`${r.jam} jammed × 4 min`, `${num(r.jam)} যানজটের ব্লক × ৪ মিনিট`)}
          </span>
          =<span className="rt-fchip total">{bi(`${r.travel} min`, `${num(r.travel)} মিনিট`)}</span>
        </div>
      );
      const best = ref?.found ? ref.travel : r.travel;
      if (r.travel === best) {
        let extra = '';
        if (r.alg !== 'dijkstra' && ref) {
          const diff = Math.round((1 - r.order.length / ref.order.length) * 100);
          if (diff > 0)
            extra = bi(
              ` And it checked ${diff}% fewer places than 🧭 Dijkstra, the careful planner.`,
              ` আর এটি 🧭 Dijkstra-র চেয়ে ${num(diff)}% কম জায়গা যাচাই করেছে।`,
            );
          else if (diff < 0)
            extra = bi(
              ` But it checked ${-diff}% more places than 🧭 Dijkstra.`,
              ` তবে এটি 🧭 Dijkstra-র চেয়ে ${num(-diff)}% বেশি জায়গা যাচাই করেছে।`,
            );
        }
        insight = {
          tone: 'good',
          body: (
            <>
              🏆 {bi('This is the fastest possible trip.', 'এটাই সম্ভাব্য দ্রুততম যাত্রা।')}
              {extra}
            </>
          ),
        };
      } else {
        const why =
          r.alg === 'bfs'
            ? bi(
                '🌊 BFS counts blocks, not minutes, so a short road through a jam looks just as good to it.',
                '🌊 BFS মিনিট নয়, ব্লক গোনে, তাই যানজটের ভেতর দিয়ে ছোট পথও তার কাছে সমান ভালো মনে হয়।',
              )
            : r.alg === 'greedy'
              ? bi(
                  '🏃 Greedy only heads toward the station, so it drove straight into the traffic jam.',
                  '🏃 Greedy শুধু স্টেশনের দিকে ছোটে, তাই সোজা যানজটে ঢুকে পড়েছে।',
                )
              : '';
        insight = {
          tone: 'bad',
          body: (
            <>
              ⚠️{' '}
              {bi(
                `${r.travel - best} min slower than the fastest possible trip (${best} min). `,
                `সম্ভাব্য দ্রুততম যাত্রার (${num(best)} মিনিট) চেয়ে ${num(r.travel - best)} মিনিট ধীর। `,
              )}
              {why}
            </>
          ),
        };
      }
    }
  }

  const checked = result ? (view.phase === 'idle' ? '–' : num(view.shown)) : '–';
  const trip =
    !result || view.phase === 'search'
      ? result
        ? '…'
        : '–'
      : !result.found && view.phase === 'done'
        ? '—'
        : min(view.minutes ?? 0);

  return (
    <Card className="rt-narr">
      <div className="rt-narr-head" aria-live="polite">
        <span className="rt-narr-icon" aria-hidden="true">
          {icon}
        </span>
        <div className="rt-narr-main">{main}</div>
      </div>
      <div className="rt-meters">
        <div className="rt-meter">
          <span className="lab-stat-k">
            {bi('🔍 Places checked (the computer’s effort)', '🔍 যাচাই করা জায়গা (কম্পিউটারের পরিশ্রম)')}
          </span>
          <span className="rt-meter-v">{checked}</span>
        </div>
        <div className="rt-meter">
          <span className="lab-stat-k">{bi('⏱️ Trip time for the truck', '⏱️ গাড়ির যাত্রার সময়')}</span>
          <span className="rt-meter-v">{trip}</span>
        </div>
      </div>
      {formula}
      {insight && <p className={`rt-insight ${insight.tone}`}>{insight.body}</p>}
    </Card>
  );
}

/** The four search methods, as drivers to pick. */
export function Drivers() {
  const { bi } = useT();
  const result = useRoute((s) => s.result);
  const speed = useRoute((s) => s.speed);
  const { mission, setSpeed } = useRoute.getState();
  return (
    <Card title={bi('Pick a driver', 'একজন চালক বেছে নিন')}>
      <p className="muted rt-small">
        {bi(
          'Each driver is a different search method: a different rule for deciding which street to check next.',
          'প্রতিটি চালক একটি ভিন্ন অনুসন্ধান পদ্ধতি: পরের কোন রাস্তা যাচাই করবে তা ঠিক করার ভিন্ন নিয়ম।',
        )}
      </p>
      <div className="rt-drivers">
        {ALGS.map((a) => {
          const I = INFO[a];
          return (
            <button
              key={a}
              type="button"
              className="rt-driver"
              aria-pressed={result?.alg === a}
              onClick={() => mission(a)}
            >
              <span className="rt-ico" aria-hidden="true">
                {I.ico}
              </span>
              <span>
                <span className="rt-driver-top">
                  <b>{I.name}</b>
                  <span className="muted">{bi(I.nick[0], I.nick[1])}</span>
                  <span className="rt-go">▶ {bi('Run', 'চালান')}</span>
                </span>
                <span className="rt-how">{bi(I.how[0], I.how[1])}</span>
              </span>
            </button>
          );
        })}
      </div>
      <label className="rt-speed">
        <span aria-hidden="true">🐢</span>
        <input
          type="range"
          min={1}
          max={40}
          value={speed}
          aria-label={bi('Animation speed', 'অ্যানিমেশনের গতি')}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <span aria-hidden="true">🐇</span>
      </label>
    </Card>
  );
}

const MISSIONS: { id: MissionId; en: string; bn: string }[] = [
  {
    id: 'bfs',
    en: 'Run 🌊 BFS. Does its route avoid the jammed market roads?',
    bn: '🌊 BFS চালান। এর পথ কি বাজারের যানজট এড়ায়?',
  },
  {
    id: 'dijkstra',
    en: 'Run 🧭 Dijkstra. Is the trip faster? How much did it check?',
    bn: '🧭 Dijkstra চালান। যাত্রা কি দ্রুত হলো? কতটা যাচাই করল?',
  },
  {
    id: 'astar',
    en: 'Run 🎯 A*. Same trip time, but how much less checking?',
    bn: '🎯 A* চালান। একই যাত্রার সময়, কিন্তু কত কম যাচাই?',
  },
  { id: 'greedy', en: 'Run 🏃 Greedy. Why is its trip slower?', bn: '🏃 Greedy চালান। এর যাত্রা ধীর কেন?' },
  {
    id: 'west',
    en: '🚧 Close the west bridge for repairs. What does A* do now?',
    bn: '🚧 মেরামতের জন্য পশ্চিম সেতু বন্ধ করুন। A* এখন কী করে?',
  },
  {
    id: 'both',
    en: '🚧🚧 Close both bridges. Can any method find a way?',
    bn: '🚧🚧 দুটি সেতুই বন্ধ করুন। কোনো পদ্ধতি কি পথ পাবে?',
  },
];

/** "Try these, in order": the guided missions, ticked as they are done. */
export function Missions({ only, onPick }: { only?: MissionId[]; onPick?: (id: MissionId) => void }) {
  const { bi, num } = useT();
  const done = useRoute((s) => s.missions);
  const mission = useRoute((s) => s.mission);
  return (
    <ol className="rt-missions">
      {MISSIONS.map((m, i) =>
        only && !only.includes(m.id) ? null : (
          <li key={m.id} className={done[m.id] ? 'done' : undefined}>
            <span className="rt-num">{done[m.id] ? '✓' : num(i + 1)}</span>
            <span>{bi(m.en, m.bn)}</span>
            <button
              type="button"
              className="btn small ghost"
              aria-label={bi(`Do mission ${i + 1}`, `মিশন ${num(i + 1)} করুন`)}
              onClick={() => {
                mission(m.id);
                onPick?.(m.id);
              }}
            >
              ▶
            </button>
          </li>
        ),
      )}
    </ol>
  );
}

/** Four small maps with effort and trip-time bars. */
function RaceGrid() {
  const { bi, num } = useT();
  const results = useRoute((s) => s.results);
  const result = useRoute((s) => s.result);
  const view = useRoute((s) => s.view);
  const ref = useRoute((s) => s.ref);
  const done = ALGS.map((a) => [a, settled({ results, result, view }, a)] as const);
  let maxExp = 1;
  let maxT = 1;
  let best = Infinity;
  for (const [, r] of done)
    if (r) {
      maxExp = Math.max(maxExp, r.order.length);
      if (r.found) {
        maxT = Math.max(maxT, r.travel);
        best = Math.min(best, r.travel);
      }
    }
  if (ref?.found) best = ref.travel;
  return (
    <div className="rt-race">
      {done.map(([a, r]) => {
        const I = INFO[a];
        const cls = r ? (r.found ? (r.travel === best ? 'best' : 'slow') : '') : '';
        return (
          <div key={a} className={`rt-rc ${cls}`}>
            <div className="rt-rc-head">
              <span aria-hidden="true">{I.ico}</span>
              <b>{I.name}</b>
              <small className="muted">· {bi(I.nick[0], I.nick[1])}</small>
            </div>
            {!r ? (
              <div className="rt-empty">
                {results[a]
                  ? bi('⏳ Running on the big map…', '⏳ বড় মানচিত্রে চলছে…')
                  : bi('Not run yet', 'এখনো চালানো হয়নি')}
              </div>
            ) : (
              <>
                <MiniMap alg={a} />
                <div className="rt-mbar eff">
                  <span>{bi('Checked', 'যাচাই')}</span>
                  <span className="rt-track">
                    <i style={{ width: `${((r.order.length / maxExp) * 100).toFixed(1)}%` }} />
                  </span>
                  <b>{num(r.order.length)}</b>
                </div>
                <div className="rt-mbar time">
                  <span>{bi('Trip', 'যাত্রা')}</span>
                  <span className="rt-track">
                    <i style={{ width: `${(r.found ? (r.travel / maxT) * 100 : 0).toFixed(1)}%` }} />
                  </span>
                  <b>{r.found ? bi(`${r.travel} min`, `${num(r.travel)} মি.`) : '—'}</b>
                </div>
                <div className="rt-verdict">
                  {!r.found
                    ? bi('🚫 No route', '🚫 কোনো পথ নেই')
                    : r.travel === best
                      ? bi('✅ Fastest trip', '✅ দ্রুততম যাত্রা')
                      : bi(`⚠️ ${r.travel - best} min slower`, `⚠️ ${num(r.travel - best)} মিনিট ধীর`)}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MiniMap({ alg }: { alg: Alg }) {
  const { lang } = useT();
  const ref = useRef<HTMLCanvasElement>(null);
  const city = useRoute((s) => s.city);
  const r = useRoute((s) => s.results[alg]);
  const colors = useTokens(MAP_TOKENS);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext?.('2d');
    if (!c || !ctx || !w || !r) return;
    const cs = Math.max(3, w / W);
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(cs * W * dpr);
    c.height = Math.round(cs * H * dpr);
    c.style.height = `${cs * H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMap(ctx, cs, city, {
      colors,
      font: getComputedStyle(document.body).fontFamily,
      t: (en, bn) => (lang === 'bn' ? bn : en),
      result: r,
      small: true,
      phase: 'done',
    });
  }, [w, r, city, colors, lang]);
  return <canvas ref={ref} className="rt-mini" aria-hidden="true" />;
}
