import type { ReactNode } from 'react';
import {
  BATCH_SIZE,
  PATTERNS,
  RANGES,
  TEST_RUNS,
  type Intersection,
  type PatternId,
  type RoadReport,
} from '../../engines/rl/traffic';
import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Callout, Card, LineChart } from '../kit';
import { SceneDefs } from './SceneDefs';
import { Street } from './Street';
import { currentRates, sameRates, useTraffic } from './store';
import { lightOf } from './util';
import './traffic.css';

/** Text helpers shared by the views. */
function useWords() {
  const { bi, num } = useT();
  const road = (p: number) => (p === 0 ? bi('North–South', 'উত্তর–দক্ষিণ') : bi('East–West', 'পূর্ব–পশ্চিম'));
  const roadShort = (p: number) => (p === 0 ? bi('N–S', 'উ–দ') : bi('E–W', 'পূ–প'));
  const secs = (s: number, d = 0) => num(s.toFixed(d)) + bi(' s', ' সে.');
  const clock = (s: number) =>
    num(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
  return { bi, num, road, roadShort, secs, clock };
}

export function TrafficStage() {
  const step = useLab((s) => s.step);
  let view: ReactNode;
  switch (step) {
    case 'understand':
      view = <Understand />;
      break;
    case 'explore':
      view = <Explore />;
      break;
    case 'train':
      view = <Train />;
      break;
    case 'evaluate':
      view = <Evaluate />;
      break;
    case 'break':
      view = <BreakIt />;
      break;
    case 'apply':
      view = <Apply />;
      break;
  }
  return (
    <>
      <SceneDefs />
      {view}
    </>
  );
}

function Understand() {
  const { bi } = useT();
  return (
    <div className="lab-view">
      <p className="lab-lead">
        {bi(
          'Two intersections get the same traffic. One follows a timer. The other learns when to change the light from the queues it leaves behind.',
          'দুটি মোড়ে একই যানবাহন আসে। একটি টাইমার মেনে চলে। অন্যটি গাড়ির সারি দেখে শেখে কখন বাতি বদলাতে হবে।',
        )}
      </p>
      <Intersections />
      <Safety />
    </div>
  );
}

function Explore() {
  return (
    <div className="lab-view">
      <div className="lab-cols wide-left">
        <Intersections />
        <Card>
          <TrafficInputs />
        </Card>
      </div>
    </div>
  );
}

function Train() {
  return (
    <div className="lab-view">
      <div className="lab-cols">
        <TrainingPanel />
        <PolicyPanel />
      </div>
    </div>
  );
}

function Evaluate() {
  return (
    <div className="lab-view">
      <Intersections />
      <DecisionPanel />
      <Results />
    </div>
  );
}

function BreakIt() {
  const { bi } = useT();
  return (
    <div className="lab-view">
      <Callout kind="break">
        <p>
          <b>{bi('Try changing the goal.', 'লক্ষ্য বদলে দেখুন।')}</b>{' '}
          {bi(
            'Train with the main-road-only reward, then compare East–West wait and the share of cars that cleared in the test. The agent does exactly what its reward asks, not what we meant.',
            'শুধু প্রধান রাস্তার পুরস্কার দিয়ে শেখান, তারপর পরীক্ষায় পূর্ব–পশ্চিমের অপেক্ষা এবং কত ভাগ গাড়ি পার হয়েছে তা তুলনা করুন। এজেন্ট ঠিক তা-ই করে যা তার পুরস্কার চায়, আমরা যা বোঝাতে চেয়েছি তা নয়।',
          )}
        </p>
      </Callout>
      <div className="lab-cols">
        <TrainingPanel />
        <Intersections compact />
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
          {bi(
            'Reinforcement learning learns from rewards by trial and error, not from labelled examples. It needs a simulator to practise in, a reward that says what we really want, and safety rules it can never override. Here the agent may only choose when to switch; the yellow, all-red and minimum green always apply.',
            'রিইনফোর্সমেন্ট লার্নিং লেবেলযুক্ত উদাহরণ থেকে নয়, পুরস্কার থেকে চেষ্টা ও ভুলের মাধ্যমে শেখে। এর জন্য অনুশীলনের একটি সিমুলেটর, আমরা আসলে যা চাই তা বলে এমন পুরস্কার, এবং কখনো অমান্য করা যায় না এমন নিরাপত্তা নিয়ম লাগে। এখানে এজেন্ট শুধু কখন বদলাবে তা বাছতে পারে; হলুদ, সবদিকে লাল ও ন্যূনতম সবুজ সবসময় প্রযোজ্য।',
          )}
        </p>
      </Callout>
      <div className="lab-cols">
        <PolicyPanel />
        <Safety />
      </div>
    </div>
  );
}

/** Both intersections, the clock and playback. */
function Intersections({ compact }: { compact?: boolean }) {
  const { bi, num, road, roadShort, secs, clock } = useWords();
  const s = useTraffic();
  const progress = s.snap || matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 1 : s.fraction;
  const signalText = (sim: Intersection) => {
    const l = lightOf(sim);
    return l.allRed
      ? bi('All red · ', 'সবদিকে লাল · ') + secs(l.clearance)
      : l.yellow
        ? bi('Yellow on ', 'হলুদ বাতি · ') + road(l.phase) + ' · ' + secs(l.yellow)
        : road(l.phase) + bi(' has green', ' · সবুজ বাতি');
  };
  const dot = (sim: Intersection) => {
    const l = lightOf(sim);
    return l.allRed ? 'stop' : l.yellow ? 'yellow' : 'go';
  };
  const agentMode = s.live
    ? bi('Learning during this run', 'এই সিমুলেশনেই শিখছে')
    : s.learner.updates
      ? bi('Using its learned strategy', 'শেখা কৌশল ব্যবহার করছে')
      : bi('Untrained · keeps the first green', 'অপ্রশিক্ষিত · প্রথম সবুজ রাখে');
  const card = (sim: Intersection, kind: 'fixed' | 'agent') => (
    <article className={`tr-street ${kind}`}>
      <header>
        <span className="tr-badge" aria-hidden="true">
          {kind === 'fixed' ? '⏱' : '🤖'}
        </span>
        <div>
          <h4>
            {kind === 'fixed'
              ? bi('Fixed timer', 'নির্দিষ্ট টাইমার')
              : bi('Learning agent', 'শিখতে পারা এজেন্ট')}
          </h4>
          <p>
            {kind === 'fixed'
              ? `${roadShort(0)} ${secs(s.plan[0])} · ${roadShort(1)} ${secs(s.plan[1])}`
              : agentMode}
          </p>
        </div>
      </header>
      <Street
        sim={sim}
        progress={progress}
        label={
          kind === 'fixed'
            ? bi('Intersection run by a fixed timer', 'নির্দিষ্ট টাইমারে চলা মোড়')
            : bi('Intersection run by the learning agent', 'শিখতে পারা এজেন্টে চলা মোড়')
        }
      />
      <div className="tr-signal-line">
        <span className="tr-dot" data-light={dot(sim)} />
        {signalText(sim)}
      </div>
      {!compact && (
        <dl className="tr-stats">
          <div>
            <dt>{bi('Avg wait', 'গড় অপেক্ষা')}</dt>
            <dd>{sim.time ? secs(sim.averageWait(), 1) : '—'}</dd>
          </div>
          <div>
            <dt>
              <i className="tr-key ns" />
              {bi('N–S queue', 'উ–দ সারি')}
            </dt>
            <dd>{num(sim.queue(0))}</dd>
          </div>
          <div>
            <dt>
              <i className="tr-key ew" />
              {bi('E–W queue', 'পূ–প সারি')}
            </dt>
            <dd>{num(sim.queue(1))}</dd>
          </div>
          <div>
            <dt>{bi('Crossed', 'পার হয়েছে')}</dt>
            <dd>{num(sim.crossed)}</dd>
          </div>
        </dl>
      )}
    </article>
  );
  return (
    <Card
      title={bi('The intersection', 'রাস্তার মোড়')}
      aside={
        <span className="tr-clock">
          ⏱ {bi('Sim time', 'সিমুলেশনের সময়')} <b>{clock(s.fixed.time)}</b>
        </span>
      }
    >
      <div className="tr-streets">
        {card(s.fixed, 'fixed')}
        {card(s.agent, 'agent')}
      </div>
      <Playback />
      {!compact && (
        <p className="muted tr-note">
          {bi(
            'Both views get the same arrivals. The fixed timer splits 60 seconds of green by demand when you restart.',
            'দুটি মোড়ে একই যানবাহন আসে। আবার শুরু করলে নির্দিষ্ট টাইমার চাহিদা অনুযায়ী ৬০ সেকেন্ড সবুজের সময় ভাগ করে।',
          )}
        </p>
      )}
    </Card>
  );
}

export function Playback() {
  const { bi, num } = useT();
  const running = useTraffic((s) => s.running);
  const time = useTraffic((s) => s.fixed.time);
  const speed = useTraffic((s) => s.speed);
  const training = useTraffic((s) => s.batch !== null);
  const { play, step, restart, setSpeed } = useTraffic.getState();
  return (
    <div className="lab-row tr-playback">
      <button type="button" className="btn" disabled={training} onClick={() => play(!running)}>
        {running
          ? '⏸ ' + bi('Pause', 'বিরতি')
          : '▶ ' + (time ? bi('Resume', 'আবার চালান') : bi('Watch both', 'দুটোই দেখুন'))}
      </button>
      <button type="button" className="btn ghost" disabled={training} onClick={step}>
        ⏭ {bi('Step', 'এক ধাপ')}
      </button>
      <button type="button" className="btn ghost" disabled={training} onClick={restart}>
        ↺ {bi('Restart', 'আবার শুরু')}
      </button>
      <label className="tr-speed">
        {bi('Speed', 'গতি')}
        <input
          type="range"
          min={1}
          max={24}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <output className="mono">{num(speed)}×</output>
      </label>
    </div>
  );
}

/** Traffic pattern, arrival rates and bursts. */
export function TrafficInputs() {
  const { bi, num, roadShort } = useWords();
  const ns = useTraffic((s) => s.ns);
  const ew = useTraffic((s) => s.ew);
  const burstMsg = useTraffic((s) => s.burstMsg);
  const training = useTraffic((s) => s.batch !== null);
  const { setRates, setPattern, burst } = useTraffic.getState();
  const pattern = (Object.keys(PATTERNS) as PatternId[]).find(
    (k) => PATTERNS[k][0] === ns && PATTERNS[k][1] === ew,
  );
  const names: Record<PatternId, string> = {
    main: bi('Main-road rush', 'প্রধান রাস্তায় ভিড়'),
    balanced: bi('Even traffic', 'সমান যানবাহন'),
    side: bi('Side-road rush', 'পাশের রাস্তায় ভিড়'),
  };
  return (
    <div className="lab-view tr-controls">
      <label className="lab-slider">
        <span className="lab-slider-head">{bi('Traffic pattern', 'যানবাহনের ধরন')}</span>
        <select
          className="lab-input"
          value={pattern ?? 'custom'}
          disabled={training}
          onChange={(e) => setPattern(e.target.value as PatternId)}
        >
          {(Object.keys(PATTERNS) as PatternId[]).map((k) => (
            <option key={k} value={k}>
              {names[k]}
            </option>
          ))}
          <option value="custom" disabled>
            {bi('Custom', 'নিজের পছন্দ')}
          </option>
        </select>
      </label>
      <p className="muted tr-small">
        {bi(
          'Average cars per minute, per approach. Cars arrive in waves.',
          'প্রতি প্রবেশপথে মিনিটে গড় গাড়ি। গাড়ি দলে দলে আসে।',
        )}
      </p>
      <label className="lab-slider">
        <span className="lab-slider-head">
          <span>
            <i className="tr-key ns" />
            {bi('North–South', 'উত্তর–দক্ষিণ')}
          </span>
          <b className="mono">{num(ns)}</b>
        </span>
        <input
          type="range"
          min={3}
          max={27}
          value={ns}
          disabled={training}
          onChange={(e) => setRates(Number(e.target.value), ew)}
        />
      </label>
      <label className="lab-slider">
        <span className="lab-slider-head">
          <span>
            <i className="tr-key ew" />
            {bi('East–West', 'পূর্ব–পশ্চিম')}
          </span>
          <b className="mono">{num(ew)}</b>
        </span>
        <input
          type="range"
          min={3}
          max={27}
          value={ew}
          disabled={training}
          onChange={(e) => setRates(ns, Number(e.target.value))}
        />
      </label>
      <div className="lab-row">
        <button type="button" className="btn small ghost" onClick={() => burst(0)}>
          {bi('+5 N–S cars', 'উ–দে +৫ গাড়ি')}
        </button>
        <button type="button" className="btn small ghost" onClick={() => burst(1)}>
          {bi('+5 E–W cars', 'পূ–পে +৫ গাড়ি')}
        </button>
      </div>
      {burstMsg !== null && (
        <p className="tr-small" role="status">
          {bi('Added 5 cars to ', '৫টি গাড়ি যোগ হয়েছে · ')}
          {roadShort(burstMsg)}
          {bi(' in both views.', ' · দুটি মোড়েই।')}
        </p>
      )}
    </div>
  );
}

function Safety() {
  const { bi } = useT();
  return (
    <Card title={<>🛡 {bi('Safety rules', 'নিরাপত্তা নিয়ম')}</>}>
      <p className="muted">
        {bi(
          'At least 6 s green, then 3 s yellow and 1 s all-red when switching. Green starts with a 2 s delay, then up to one car per lane every 2 s. The agent cannot break these rules; it only chooses when to switch.',
          'অন্তত ৬ সে. সবুজ, বদলানোর সময় ৩ সে. হলুদ ও ১ সে. সবদিকে লাল। সবুজের শুরুতে ২ সে. বিরতি, এরপর প্রতি লেনে প্রতি ২ সে.-তে সর্বোচ্চ একটি গাড়ি যায়। এজেন্ট এই নিয়ম ভাঙতে পারে না; সে শুধু কখন বদলাবে তা বাছে।',
        )}
      </p>
    </Card>
  );
}

/** Observe → Act → Reward for the agent's last tick. */
function DecisionPanel() {
  const { bi, num, road, roadShort, secs, clock } = useWords();
  const agent = useTraffic((s) => s.agent);
  const mainOnly = useTraffic((s) => s.mainOnly);
  useTraffic((s) => s.frame);
  const d = agent.lastTick;
  const phase = d ? d.phaseBefore : agent.phase;
  const ns = d ? d.nsBefore : agent.queue(0);
  const ew = d ? d.ewBefore : agent.queue(1);
  const safetyHold = d && ['minimum', 'yellow', 'allRed'].includes(d.context);
  const reason: Record<string, string> = {
    minimum: bi('Minimum green · ', 'ন্যূনতম সবুজ · ') + secs(d?.remaining ?? 0),
    yellow: bi('Yellow clearance · ', 'হলুদ বাতির সময় · ') + secs(d?.remaining ?? 0),
    allRed: bi('All-red clearance · ', 'সবদিকে লাল বাতির সময় · ') + secs(d?.remaining ?? 0),
    extension: bi('Keep commits to two seconds', 'সবুজ রাখলে দুই সেকেন্ড বাড়ে'),
    explore: bi('Trying a random action', 'এলোমেলো পদক্ষেপ চেষ্টা করছে'),
    learned: bi('Using the learned strategy', 'শেখা কৌশল ব্যবহার করছে'),
    unseen: bi('New situation · defaults to keep', 'নতুন পরিস্থিতি · সবুজ রাখে'),
    timer: '',
  };
  const stages = [
    {
      cls: 'observe',
      icon: '👁',
      title: bi('Observe', 'পর্যবেক্ষণ'),
      value: `${roadShort(0)} ${num(ns)} · ${roadShort(1)} ${num(ew)}`,
      note:
        d?.context === 'allRed'
          ? bi('All red', 'সবদিকে লাল')
          : road(phase) +
            (d?.context === 'yellow'
              ? bi(' was on yellow', ' · হলুদ ছিল')
              : d
                ? bi(' had green', ' · সবুজ ছিল')
                : bi(' has green', ' · সবুজ বাতি')),
    },
    {
      cls: 'act',
      icon: '⇄',
      title: bi('Act', 'পদক্ষেপ'),
      value: !d
        ? '—'
        : safetyHold
          ? bi('Safety hold', 'নিরাপত্তার জন্য বিরতি')
          : d.context === 'extension'
            ? bi('Green extension', 'সবুজের বাড়তি সময়')
            : d.action
              ? bi('Switch roads', 'রাস্তা বদলাও')
              : bi('Keep green', 'সবুজ রাখো'),
      note: d ? reason[d.context] : bi('Keep the green or switch roads', 'সবুজ রাখুন অথবা অন্য রাস্তায় দিন'),
    },
    {
      cls: 'reward',
      icon: '⚡',
      title: bi('Reward', 'পুরস্কার'),
      value: d ? (d.waiting ? '−' + num(d.waiting) : num(0)) : '—',
      note: mainOnly
        ? bi('−1 per car still waiting on N–S', 'উ–দে অপেক্ষমাণ গাড়িপ্রতি −১')
        : bi('−1 per car still waiting', 'অপেক্ষমাণ গাড়িপ্রতি −১'),
    },
  ];
  const u = agent.lastUpdate;
  return (
    <Card
      title={bi('Inside the agent’s decision', 'এজেন্ট যেভাবে সিদ্ধান্ত নেয়')}
      aside={
        <span className="muted tr-small">
          {d
            ? bi('At ', 'সময় ') + clock(agent.time)
            : bi('Step or play to see a decision', 'সিদ্ধান্ত দেখতে এক ধাপ চালান বা শুরু করুন')}
        </span>
      }
    >
      <div className="tr-flow">
        {stages.map((st, i) => (
          <div key={st.cls} className={`tr-stage ${st.cls}`}>
            {i > 0 && (
              <span className="tr-arrow" aria-hidden="true">
                ›
              </span>
            )}
            <span className="tr-stage-icon" aria-hidden="true">
              {st.icon}
            </span>
            <div>
              <h4>{st.title}</h4>
              <strong>{st.value}</strong>
              <p>{st.note}</p>
            </div>
          </div>
        ))}
      </div>
      {u && (
        <p className="tr-small mono">
          {bi('Last live update · ', 'চলার সময় শেষ আপডেট · ')}
          {u.action ? bi('Switch', 'বদলাও') : bi('Keep', 'রাখো')} · Q {num(u.previous.toFixed(1))} →{' '}
          {num(u.next.toFixed(1))}
          {bi(' toward target ', ' লক্ষ্যের দিকে ')}
          {num(u.target.toFixed(1))}
        </p>
      )}
    </Card>
  );
}

/** Reward choice, training buttons and the test chart. */
export function TrainingPanel() {
  const { bi, num, roadShort } = useWords();
  const s = useTraffic();
  const training = s.batch !== null;
  const stale =
    !!s.latest &&
    !training &&
    (!sameRates(s.benchmark, currentRates(s)) || s.latest.updates !== s.learner.updates);
  return (
    <Card title={bi('Train the agent', 'এজেন্টকে শেখান')}>
      <p className="muted tr-small">
        {bi(
          'The agent uses tabular Q-learning. It estimates each action’s future reward and explores less as it gains experience.',
          'এজেন্ট টেবিলভিত্তিক Q-learning ব্যবহার করে। প্রতিটি পদক্ষেপের ভবিষ্যৎ পুরস্কার অনুমান করে এবং অভিজ্ঞতা বাড়লে এলোমেলো চেষ্টা কমায়।',
        )}
      </p>
      <fieldset className="tr-reward" disabled={training}>
        <legend>{bi('Which queues count toward the reward?', 'পুরস্কারে কোন সারি ধরা হবে?')}</legend>
        <label>
          <input type="radio" name="tr-reward" checked={!s.mainOnly} onChange={() => s.setMainOnly(false)} />
          {bi('Both roads', 'দুই রাস্তা')}
        </label>
        <label>
          <input type="radio" name="tr-reward" checked={s.mainOnly} onChange={() => s.setMainOnly(true)} />
          {bi('Main road only (N–S)', 'শুধু প্রধান রাস্তা (উ–দ)')}
        </label>
      </fieldset>
      <p className="muted tr-small">
        {s.mainOnly
          ? bi(
              'Cars waiting on East–West cost the agent nothing. Changing the goal starts training from scratch.',
              'পূর্ব–পশ্চিমে গাড়ি অপেক্ষা করলে এজেন্টের পুরস্কার কমে না। লক্ষ্য বদলালে প্রশিক্ষণ নতুন করে শুরু হয়।',
            )
          : bi(
              'Every car left waiting costs the agent one point per second. Changing the goal clears training.',
              'অপেক্ষমাণ প্রতিটি গাড়ির জন্য প্রতি সেকেন্ডে এজেন্টের এক পয়েন্ট কমে। লক্ষ্য বদলালে আগের প্রশিক্ষণ মুছে যায়।',
            )}
      </p>
      <div className="lab-row">
        <button type="button" className="btn" disabled={training} onClick={s.train}>
          ⚡ {bi(`Train ${BATCH_SIZE} episodes`, `${num(BATCH_SIZE)}টি পর্বে শেখান`)}
        </button>
        <button type="button" className="btn ghost" disabled={training} onClick={s.evaluate}>
          {bi('Evaluate policy', 'কৌশল পরীক্ষা করুন')}
        </button>
        <button type="button" className="btn ghost" disabled={training} onClick={s.forget}>
          {bi('Forget training', 'প্রশিক্ষণ ভুলে যান')}
        </button>
        <label className="tr-live">
          <input
            type="checkbox"
            checked={s.live}
            disabled={training}
            onChange={(e) => s.setLive(e.target.checked)}
          />
          {bi('Learn as it runs', 'চলার সময় শিখুক')}
        </label>
      </div>
      {training && <progress className="tr-progress" max={BATCH_SIZE} value={s.batch ?? 0} />}
      <div className="lab-card-head">
        <h3>{bi('Test wait per car', 'পরীক্ষায় গাড়িপ্রতি অপেক্ষা')}</h3>
        <span className="muted tr-small">
          {training
            ? `${num(s.batch ?? 0)} / ${num(BATCH_SIZE)} ${bi('in this batch', 'এই দফায়')}`
            : bi('Episodes trained · ', 'প্রশিক্ষিত পর্ব · ') + num(s.episodes)}
        </span>
      </div>
      {s.latest && s.benchmark && (
        <p className="muted tr-small">
          {bi('Test traffic · ', 'পরীক্ষার যানবাহন · ')}
          {roadShort(0)} {num(Math.round(s.benchmark[0] * 60))} · {roadShort(1)}{' '}
          {num(Math.round(s.benchmark[1] * 60))}
          {bi(' cars/min per approach', ' গাড়ি/মিনিট প্রতি প্রবেশপথে')}
          {stale && bi(' · Evaluate to refresh', ' · হালনাগাদ করতে পরীক্ষা করুন')}
        </p>
      )}
      {s.history.length ? (
        <LineChart
          height={170}
          ymin={0}
          label={bi(
            'Average accrued wait on held-out traffic runs after each training checkpoint. Solid line: agent. Dashed line: fixed timer.',
            'প্রশিক্ষণের প্রতিটি ধাপের পরে আলাদা পরীক্ষামূলক যানবাহনে গড় অপেক্ষা। টানা রেখা এজেন্টের, ভাঙা রেখা নির্দিষ্ট টাইমারের।',
          )}
          yfmt={(v) => v.toFixed(0)}
          xlabels={s.history.map((h) => h.episodes)}
          series={[
            {
              values: s.history.map((h) => h.fixed.average),
              color: 'var(--ink-2)',
              dashed: true,
              label: bi('Fixed timer', 'নির্দিষ্ট টাইমার'),
            },
            {
              values: s.history.map((h) => h.agent.average),
              color: 'var(--accent)',
              label: bi('Learning agent', 'শিখতে পারা এজেন্ট'),
            },
          ]}
        />
      ) : (
        <p className="muted tr-small">
          {bi('Train to plot the test checkpoints.', 'পরীক্ষার ধাপগুলো লেখচিত্রে দেখতে প্রশিক্ষণ দিন।')}
        </p>
      )}
      <p className="muted tr-small">
        {bi(
          `Each training episode lasts 15 simulated minutes. Every five episodes, both controllers face the same ${TEST_RUNS} separate test runs.`,
          `প্রতিটি প্রশিক্ষণ পর্ব ১৫ মিনিটের। প্রতি পাঁচ পর্বের পর দুটি নিয়ন্ত্রক একই ${num(TEST_RUNS)}টি আলাদা পরীক্ষায় অংশ নেয়।`,
        )}
      </p>
    </Card>
  );
}

function Results() {
  const { bi, num, secs } = useWords();
  const latest = useTraffic((s) => s.latest);
  const evaluate = useTraffic((s) => s.evaluate);
  if (!latest)
    return (
      <Card title={bi('Latest test results', 'সর্বশেষ পরীক্ষার ফল')}>
        <div className="lab-row">
          <p className="muted">
            {bi(
              'Train the agent (step 3), then evaluate it here.',
              'এজেন্টকে শেখান (ধাপ ৩), তারপর এখানে পরীক্ষা করুন।',
            )}
          </p>
          <button type="button" className="btn small ghost" onClick={evaluate}>
            {bi('Evaluate policy', 'কৌশল পরীক্ষা করুন')}
          </button>
        </div>
      </Card>
    );
  const rows: [string, (r: RoadReport) => string][] = [
    [bi('Overall wait / car', 'সব রাস্তায় অপেক্ষা / গাড়ি'), (r) => secs(r.average, 1)],
    [bi('N–S wait / car', 'উ–দ অপেক্ষা / গাড়ি'), (r) => secs(r.roadWait[0], 1)],
    [bi('E–W wait / car', 'পূ–প অপেক্ষা / গাড়ি'), (r) => secs(r.roadWait[1], 1)],
    [bi('Cleared by 15 min', '১৫ মিনিটে পার হয়েছে'), (r) => num((r.cleared * 100).toFixed(1)) + '%'],
  ];
  return (
    <Card title={bi('Latest test results', 'সর্বশেষ পরীক্ষার ফল')}>
      <div className="lab-table-wrap">
        <table className="lab-table">
          <thead>
            <tr>
              <td />
              <th scope="col">{bi('Agent', 'এজেন্ট')}</th>
              <th scope="col">{bi('Timer', 'টাইমার')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([name, fmt]) => (
              <tr key={name}>
                <th scope="row">{name}</th>
                <td>
                  <b>{fmt(latest.agent)}</b>
                </td>
                <td>{fmt(latest.fixed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="tr-small">
        {bi('Agent had less wait in ', 'এজেন্টের অপেক্ষা কম ছিল ')}
        {num(latest.lowerWait)}/{num(TEST_RUNS)}
        {bi(' paired tests.', 'টি জোড়া পরীক্ষায়।')}
      </p>
      <p className="muted tr-small">
        {bi(
          'Wait is time accumulated by every car up to the end of the run, including cars still queued.',
          'পর্ব শেষ হওয়া পর্যন্ত সব গাড়ির অপেক্ষা ধরা হয়, সারিতে থাকা গাড়িসহ।',
        )}
      </p>
    </Card>
  );
}

/** The learned policy as two 5×5 grids, one per green road. */
function PolicyPanel() {
  const { bi, num, roadShort } = useWords();
  const learner = useTraffic((s) => s.learner);
  const selected = useTraffic((s) => s.selected);
  const select = useTraffic((s) => s.select);
  const current = useTraffic((s) => s.agent.lastState);
  useTraffic((s) => s.episodes);
  useTraffic((s) => s.frame);
  const describe = (state: number) =>
    roadShort(Math.floor(state / 25)) +
    bi(' green', ' সবুজ') +
    ' · ' +
    RANGES[Math.floor((state % 25) / 5)] +
    bi(' on green', ' সবুজে') +
    ' · ' +
    RANGES[state % 5] +
    bi(' on red', ' লালে');
  const kind = (state: number) =>
    learner.seen(state) ? (learner.best(state) ? 'switch' : 'keep') : 'unseen';
  const symbol = { keep: 'K', switch: 'S', unseen: '·' };
  let detail = bi(
    'Choose a cell to see its training visits and estimated rewards (Q values).',
    'প্রশিক্ষণে কতবার দেখা হয়েছে ও আনুমানিক পুরস্কার (Q মান) জানতে একটি ঘর বেছে নিন।',
  );
  if (selected !== null) {
    const prefix = describe(selected) + ' · ';
    if (!learner.seen(selected))
      detail =
        prefix +
        bi('Unseen in training. The agent starts by keeping green.', 'প্রশিক্ষণে দেখেনি। এজেন্ট শুরুতে সবুজ রাখে।');
    else {
      const est = (a: number) =>
        `Q ${num(learner.values[selected * 2 + a].toFixed(1))} (${num(learner.visits[selected * 2 + a])}${bi(' tried)', ' বার চেষ্টা)')}`;
      detail = prefix + bi('Keep ', 'রাখো ') + est(0) + ' · ' + bi('Switch ', 'বদলাও ') + est(1);
    }
  }
  return (
    <Card title={bi('What the agent learned', 'এজেন্ট যা শিখেছে')}>
      <p className="muted tr-small">
        {bi(
          'Each cell shows what the agent prefers for that pair of queues. Rows are cars on green; columns are cars on red.',
          'প্রতিটি ঘরে দুই সারির জন্য এজেন্টের পছন্দ দেখা যায়। সারি হলো সবুজ বাতির গাড়ি; কলাম হলো লাল বাতির গাড়ি।',
        )}
      </p>
      <div className="tr-policy-legend">
        <span>
          <i className="keep">K</i>
          {bi('Keep', 'রাখো')}
        </span>
        <span>
          <i className="switch">S</i>
          {bi('Switch', 'বদলাও')}
        </span>
        <span>
          <i className="unseen">·</i>
          {bi('Unseen', 'দেখেনি')}
        </span>
        <span>
          <i className="current" />
          {bi('Last decision', 'শেষ সিদ্ধান্ত')}
        </span>
      </div>
      <div className="tr-policy">
        {[0, 1].map((phase) => (
          <table key={phase} className="tr-policy-table">
            <caption>
              {roadShort(phase)}
              {bi(' green', ' সবুজ')}
            </caption>
            <thead>
              <tr>
                <td />
                {RANGES.map((r) => (
                  <th key={r} scope="col">
                    {num(r)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RANGES.map((r, row) => (
                <tr key={r}>
                  <th scope="row">{num(r)}</th>
                  {RANGES.map((_, col) => {
                    const state = phase * 25 + row * 5 + col;
                    const k = kind(state);
                    return (
                      <td key={col}>
                        <button
                          type="button"
                          className={`${k}${state === current ? ' current' : ''}${state === selected ? ' selected' : ''}`}
                          aria-pressed={state === selected}
                          aria-label={`${describe(state)} · ${k === 'switch' ? bi('Switch', 'বদলাও') : k === 'keep' ? bi('Keep', 'রাখো') : bi('Unseen', 'দেখেনি')}`}
                          onClick={() => select(state)}
                        >
                          {symbol[k]}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
      <p className="tr-small" aria-live="polite">
        {detail}
      </p>
      <details className="tr-explain">
        <summary>{bi('How Q-learning updates the table', 'Q-learning যেভাবে টেবিল হালনাগাদ করে')}</summary>
        <p>
          {bi(
            'The state groups queues into ranges and records which road has green. Keep extends green by 2 s. Switch includes clearance and the next road’s minimum green before another choice.',
            'অবস্থায় গাড়ির সারি কয়েকটি সীমায় ভাগ হয় এবং কোন রাস্তায় সবুজ আছে তা ধরা হয়। রাখলে সবুজ ২ সে. বাড়ে। বদলালে পরের সিদ্ধান্তের আগে হলুদ, সবদিকে লাল এবং অন্য রাস্তার ন্যূনতম সবুজের সময় পার হয়।',
          )}
        </p>
        <p>
          {bi(
            'The target adds the discounted rewards over that interval and the discounted best Q-value at the next decision.',
            'লক্ষ্যে ওই সময়ের ছাড়কৃত পুরস্কার এবং পরের সিদ্ধান্তের সেরা ছাড়কৃত Q মান যোগ হয়।',
          )}
        </p>
        <p>
          <code>Q ← Q + 0.1 × (target − Q)</code>{' '}
          {bi('Discount 0.98 per second.', 'প্রতি সেকেন্ডে ছাড়ের গুণক ০.৯৮।')}
        </p>
      </details>
    </Card>
  );
}
