import { useEffect, useMemo, type ReactNode } from 'react';
import {
  DRAIN_WARDS,
  STORM_EPISODES,
  TEST_STORMS,
  TRAIN_STORMS,
} from '../../data/drainSensors';
import {
  checkSensorHealth,
  cleanStream,
  DRAIN_AI_MODES,
  evaluateController,
  evaluatePlacement,
  featureImportance,
  FLOOD_CM,
  injectFault,
  predictDrainTree,
  predictLevelAhead,
  PUMP_SPINUP_MIN,
  runDrainAi,
  type DrainAiMode,
  type FaultMode,
} from '../../engines/iot/drain';
import { rng, shuffle } from '../../engines/random';
import { countLeaves, type TreeNode } from '../../engines/tree';
import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Bars, Card, Choice, LineChart, Pill, Slider } from '../kit';
import './drain-sensors.css';
import { HardwareScene } from './HardwareScene';
import { useDrainSensors, type ApplyBrainId, type CivicCaseId } from './store';

const AI_META: Record<
  DrainAiMode,
  { icon: string; name: [string, string]; sub: [string, string] }
> = {
  rule: {
    icon: '📏',
    name: ['IF–THEN Rule', 'যদি–তবে নিয়ম'],
    sub: ['Raw level ≥ cutoff', 'শুধু কাঁচা উচ্চতা দেখে'],
  },
  tree: {
    icon: '🌳',
    name: ['Decision Tree', 'ডিসিশন ট্রি'],
    sub: ['3 clean sensor questions', '৩টি পরিষ্কার সেন্সর প্রশ্ন'],
  },
  timeseries: {
    icon: '📈',
    name: ['+30m Trend AI', '+৩০মি ট্রেন্ড এআই'],
    sub: ['Slope + khal + rain fusion', 'গতি + খাল + বৃষ্টি সমন্বয়'],
  },
  cloud: {
    icon: '☁️',
    name: ['Cloud Server AI', 'ক্লাউড সার্ভার এআই'],
    sub: ['Needs live 4G internet', 'সার্বক্ষণিক ইন্টারনেট লাগে'],
  },
};

function AiPickerBar() {
  const { bi } = useT();
  const aiMode = useDrainSensors((s) => s.aiMode);
  const setAiMode = useDrainSensors((s) => s.setAiMode);

  return (
    <div className="ds-ai-bar" role="group" aria-label={bi('Choose AI brain on ESP32', 'ESP32-তে এআই বেছে নিন')}>
      {DRAIN_AI_MODES.map((m) => {
        const meta = AI_META[m];
        return (
          <button
            key={m}
            type="button"
            className="ds-ai-card"
            aria-pressed={aiMode === m}
            onClick={() => setAiMode(m)}
          >
            <span className="ds-ai-ico" aria-hidden="true">
              {meta.icon}
            </span>
            <span>
              <b>{bi(meta.name[0], meta.name[1])}</b>
              <small>{bi(meta.sub[0], meta.sub[1])}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Talk({ avatar, who, children }: { avatar: string; who?: ReactNode; children: ReactNode }) {
  return (
    <div className="ds-talk">
      <span className="ds-avatar" aria-hidden="true">
        {avatar}
      </span>
      <div className="ds-say" aria-live="polite">
        {who && <span className="ds-who">{who}</span>}
        {children}
      </div>
    </div>
  );
}

export function DrainSensorStage() {
  const step = useLab((s) => s.step);
  const stopPlay = useDrainSensors((s) => s.stopPlay);

  useEffect(() => {
    return () => stopPlay();
  }, [stopPlay]);

  return (
    <div className="lab-view">
      <AiPickerBar />
      {step === 'understand' && <Understand />}
      {step === 'explore' && <Explore />}
      {step === 'train' && <Train />}
      {step === 'evaluate' && <Evaluate />}
      {step === 'break' && <BreakIt />}
      {step === 'apply' && <Apply />}
    </div>
  );
}

function Understand() {
  const { bi, num, pick } = useT();
  const aiMode = useDrainSensors((s) => s.aiMode);
  const episodeId = useDrainSensors((s) => s.episodeId);
  const tickIdx = useDrainSensors((s) => s.tickIdx);
  const playing = useDrainSensors((s) => s.playing);
  const splashTick = useDrainSensors((s) => s.splashTick);
  const activePin = useDrainSensors((s) => s.activePin);
  const serialOpen = useDrainSensors((s) => s.serialOpen);
  const serialLines = useDrainSensors((s) => s.serialLines);
  const faultMode = useDrainSensors((s) => s.faultMode);
  const rejectSpikes = useDrainSensors((s) => s.rejectSpikes);
  const smoothWindow = useDrainSensors((s) => s.smoothWindow);
  const model = useDrainSensors((s) => s.model);
  const tree = useDrainSensors((s) => s.tree);
  const thresholdCm = useDrainSensors((s) => s.thresholdCm);
  const forecastAlarmCm = useDrainSensors((s) => s.forecastAlarmCm);
  const healthGuard = useDrainSensors((s) => s.healthGuard);

  const {
    setEpisode,
    setTick,
    togglePlay,
    tossPlastic,
    setActivePin,
    toggleSerial,
    setFault,
  } = useDrainSensors.getState();

  const ep = STORM_EPISODES.find((e) => e.id === episodeId) ?? TEST_STORMS[0];
  const modifiedTicks = useMemo(
    () =>
      injectFault(ep.ticks, faultMode).map((t, i) =>
        splashTick === i ? { ...t, rawLevelCm: 112 } : t,
      ),
    [ep, faultMode, splashTick],
  );
  const cleaned = useMemo(
    () => cleanStream(modifiedTicks, { rejectSpikes, smoothWindow }),
    [modifiedTicks, rejectSpikes, smoothWindow],
  );
  const idx = Math.min(cleaned.length - 1, Math.max(0, tickIdx));
  const cur = cleaned[idx];
  const rawTick = modifiedTicks[idx];
  const health = useMemo(() => checkSensorHealth(cleaned.slice(0, idx + 1)), [cleaned, idx]);

  const decision = useMemo(
    () =>
      runDrainAi(
        aiMode,
        cur,
        rawTick,
        { forecaster: model, tree },
        {
          thresholdCm,
          forecastAlarmCm,
          healthGuard,
          health,
          networkDown: faultMode === 'dropout',
        },
      ),
    [aiMode, cur, rawTick, model, tree, thresholdCm, forecastAlarmCm, healthGuard, health, faultMode],
  );

  const effectiveCm = decision.triggers ? Math.max(24, cur.trueLevelCm - 18) : cur.trueLevelCm;
  const flooded = effectiveCm >= FLOOD_CM;
  const hasPlastic = splashTick === idx || (!rejectSpikes && (rawTick.rawLevelCm ?? 0) - cur.trueLevelCm > 25);

  const residentSpeech = flooded
    ? bi(
        'Water is entering the ground-floor shops! The pump started too late!',
        'নিচতলার দোকানে পানি ঢুকে পড়েছে! পাম্প অনেক দেরিতে চলেছে!',
      )
    : decision.triggers && !ep.floods
      ? bi(
          'Why is the big pump roaring during a harmless shower? That wastes diesel!',
          'হালকা বৃষ্টিতেই বড় পাম্পটা গর্জন করছে কেন? শুধু শুধু ডিজেল নষ্ট!',
        )
      : decision.triggers
        ? bi(
            'Pump spun up 25 minutes early — our lane stayed dry even in heavy rain!',
            '২৫ মিনিট আগেই পাম্প চালু হয়েছে—ভারী বৃষ্টিতেও আমাদের গলি শুকনো!',
          )
        : bi(
            'Road is clear right now. Watch the khal sensor upstream!',
            'রাস্তা এখন ফাঁকা আছে। উজানের খালের সেন্সরের দিকে নজর রাখুন!',
          );

  const brainSpeech =
    !decision.online
      ? bi(
          '4G tower is down in the storm! Cloud AI cannot reply, so the relay stayed OFF.',
          'ঝড়ে ৪জি নেটওয়ার্ক বিচ্ছিন্ন! ক্লাউড এআই উত্তর দিতে পারছে না, তাই পাম্প বন্ধই রয়ে গেছে।',
        )
      : aiMode === 'rule' && hasPlastic
        ? bi(
            'I saw raw=112cm from that floating plastic bottle and panicked — false pump start!',
            'ভাসমান প্লাস্টিক বোতলের ১১২ সেমি প্রতিধ্বনি দেখেই আমি পাম্প চালিয়ে দিয়েছি—ভুয়া সতর্কতা!',
          )
        : aiMode === 'tree'
          ? bi(
              `I asked ${decision.treePath ? decision.treePath.length - 1 : 2} fast questions on cleaned khal & drain sensors right on the ESP32.`,
              `আমি ESP32 চিপেই খাল ও ড্রেনের পরিষ্কার ডেটায় ${num(decision.treePath ? decision.treePath.length - 1 : 2)}টি দ্রুত প্রশ্ন করে সিদ্ধান্ত নিয়েছি।`,
            )
          : aiMode === 'timeseries'
            ? bi(
                `Water is ${Math.round(cur.cleanLevelCm)}cm rising ${cur.rise15m >= 0 ? '+' : ''}${Math.round(cur.rise15m)}cm/15m; I forecast ${decision.displayCm}cm in 30 minutes.`,
                `পানি এখন ${num(Math.round(cur.cleanLevelCm))} সেমি (১৫ মিনিটে ${cur.rise15m >= 0 ? '+' : ''}${num(Math.round(cur.rise15m))} সেমি); ৩০ মিনিট পরে ${num(decision.displayCm)} সেমি হবে অনুমান করছি।`,
              )
            : bi(
                `Sent JSON over 4G to city server → forecast ${decision.displayCm}cm in 30 minutes.`,
                `৪জি দিয়ে সার্ভারে পাঠিয়েছি → ৩০ মিনিট পরে ${num(decision.displayCm)} সেমি পূর্বাভাস এসেছে।`,
              );

  return (
    <div className="lab-cols wide-left">
      <Card>
        <HardwareScene
          tick={cur}
          rawCm={rawTick.rawLevelCm}
          decision={decision}
          faultMode={faultMode}
          hasPlastic={hasPlastic}
          activePin={activePin}
          onPinClick={setActivePin}
        />

        <div className="lab-row">
          <button type="button" className="btn" onClick={togglePlay}>
            {playing
              ? '⏸ ' + bi('Pause storm', 'থামান')
              : '▶ ' + bi('Play live storm', 'ঝড় চালান')}
          </button>
          <div style={{ flex: 1, minWidth: 180 }}>
            <Slider
              label={bi('Storm timeline', 'ঝড়ের সময়রেখা')}
              value={idx}
              min={0}
              max={cleaned.length - 1}
              step={1}
              format={(v) => `${num(v * 5)} min`}
              onChange={setTick}
            />
          </div>
        </div>

        <div className="ds-bubbles">
          <Talk avatar="🧕" who={bi('Shopkeeper', 'দোকানদার')}>
            {residentSpeech}
          </Talk>
          <Talk avatar={AI_META[aiMode].icon} who={`ESP32 · ${bi(AI_META[aiMode].name[0], AI_META[aiMode].name[1])}`}>
            {brainSpeech}
          </Talk>
        </div>

        {/* learn-esp32 style Serial Monitor */}
        <div className="ds-serial">
          <div className="ds-serial-head">
            <span>⚡ SERIAL MONITOR · 115200 BAUD</span>
            <button type="button" className="chip-btn" onClick={toggleSerial}>
              {serialOpen ? bi('Hide', 'লুকান') : bi('Show', 'দেখান')}
            </button>
          </div>
          {serialOpen && (
            <div className="ds-serial-body">
              {serialLines.map((ln, i) => (
                <div key={i} className="ds-serial-line">
                  {ln}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card title={bi('Live storm & chaos triggers', 'ঝড় ও তাৎক্ষণিক পরীক্ষা')}>
        <div className="lab-row">
          {TEST_STORMS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="chip-btn"
              aria-pressed={s.id === ep.id}
              onClick={() => setEpisode(s.id)}
            >
              {pick(s.name)}
            </button>
          ))}
        </div>

        <span className="eyebrow">{bi('Inject real-world chaos live', 'বাস্তব সমস্যার পরীক্ষা করুন')}</span>
        <div className="lab-row">
          <button type="button" className="chip-btn brk" onClick={tossPlastic}>
            🧴 {bi('Toss plastic under sensor', 'সেন্সরের নিচে প্লাস্টিক ফেলুন')}
          </button>
          <button
            type="button"
            className="chip-btn brk"
            aria-pressed={faultMode === 'stuck'}
            onClick={() => setFault(faultMode === 'stuck' ? 'none' : 'stuck')}
          >
            🪵 {bi('Smear mud on sensor', 'সেন্সরে কাদা লাগান')}
          </button>
          <button
            type="button"
            className="chip-btn brk"
            aria-pressed={faultMode === 'dropout'}
            onClick={() => setFault(faultMode === 'dropout' ? 'none' : 'dropout')}
          >
            📵 {bi('Cut storm 4G tower', 'ঝড়ে ৪জি বন্ধ করুন')}
          </button>
        </div>

        <Slider
          label={bi('IF–THEN Rule cutoff', 'যদি–তবে নিয়মের সীমা')}
          value={thresholdCm}
          min={55}
          max={86}
          step={1}
          format={(v) => `${num(v)} cm`}
          onChange={(v) => useDrainSensors.getState().setThresholds({ thresholdCm: v })}
        />

        <Slider
          label={bi('AI +30m forecast trigger', 'এআই +৩০মি পূর্বাভাস সীমা')}
          value={forecastAlarmCm}
          min={70}
          max={90}
          step={1}
          format={(v) => `${num(v)} cm`}
          onChange={(v) => useDrainSensors.getState().setThresholds({ forecastAlarmCm: v })}
        />
      </Card>
    </div>
  );
}

function Explore() {
  const { bi, num, pick } = useT();
  const episodeId = useDrainSensors((s) => s.episodeId);
  const rejectSpikes = useDrainSensors((s) => s.rejectSpikes);
  const smoothWindow = useDrainSensors((s) => s.smoothWindow);
  const cardSeed = useDrainSensors((s) => s.cardSeed);
  const { setEpisode, setClean, shuffleCards, setTick } = useDrainSensors.getState();
  const setStep = useLab((s) => s.setStep);

  const ep = STORM_EPISODES.find((e) => e.id === episodeId) ?? TEST_STORMS[1];
  const cleaned = useMemo(
    () => cleanStream(ep.ticks, { rejectSpikes, smoothWindow }),
    [ep, rejectSpikes, smoothWindow],
  );
  const spikesCaught = cleaned.filter((c) => c.spikeRejected).length;

  const cards = useMemo(() => {
    const all = [...TRAIN_STORMS, ...TEST_STORMS];
    return cardSeed ? shuffle(all, rng(cardSeed * 3571)).slice(0, 6) : all.slice(0, 6);
  }, [cardSeed]);

  return (
    <div className="lab-cols wide-left">
      <Card
        title={bi('Live signal cleaner: raw echo vs filtered stream', 'সংকেত পরিষ্কারক: কাঁচা প্রতিধ্বনি বনাম পরিষ্কার ধারা')}
        aside={
          <Pill tone={spikesCaught > 0 ? 'ok' : 'warn'}>
            {bi('Echo spikes removed', 'বাতিল স্পাইক')}: {num(spikesCaught)}
          </Pill>
        }
      >
        <LineChart
          label={bi('180-minute sensor telemetry', '১৮০ মিনিটের সেন্সর টেলিমেট্রি')}
          ymin={10}
          ymax={138}
          xlabels={cleaned.map((c) => `${c.minute}m`)}
          series={[
            {
              values: cleaned.map((c) => c.rawLevelCm ?? c.cleanLevelCm),
              color: 'var(--c2)',
              dashed: true,
              label: bi('Raw HC-SR04 echo', 'কাঁচা আল্ট্রাসনিক পাঠ'),
            },
            {
              values: cleaned.map((c) => c.cleanLevelCm),
              color: 'var(--c1)',
              label: bi('Cleaned drain level', 'পরিষ্কার উচ্চতা'),
            },
            {
              values: cleaned.map((c) => c.upstreamCm),
              color: 'var(--c5)',
              dashed: true,
              label: bi('Upstream khal (1.2 km)', 'উজানের খাল (১.২ কিমি)'),
            },
          ]}
        />

        <div className="lab-row">
          <label className="ds-switch">
            <input
              type="checkbox"
              checked={rejectSpikes}
              onChange={(e) => setClean({ rejectSpikes: e.target.checked })}
            />
            <span>{bi('3-point median spike killer', '৩-বিন্দু স্পাইক ফিল্টার')}</span>
          </label>
          <div style={{ flex: 1, minWidth: 190 }}>
            <Slider
              label={bi('Smoothing window (lag vs smoothness)', 'স্মুথিং উইন্ডো (মসৃণতা বনাম বিলম্ব)')}
              value={smoothWindow}
              min={1}
              max={7}
              step={1}
              format={(v) => `${num(v)} (${num(v * 5)}m)`}
              onChange={(v) => setClean({ smoothWindow: v })}
            />
          </div>
        </div>
      </Card>

      <Card
        title={bi('Recorded monsoon storm cards', 'পুরোনো ঝড়ের নমুনা কার্ড')}
        aside={
          <button type="button" className="btn ghost small" onClick={shuffleCards}>
            🔀 {bi('Shuffle', 'অন্য ঝড়')}
          </button>
        }
      >
        <div className="ds-recs">
          {cards.map((st) => {
            const peakRain = Math.max(...st.ticks.map((t) => t.rainMmHr));
            const peakUp = Math.max(...st.ticks.map((t) => t.upstreamCm));
            return (
              <button
                key={st.id}
                type="button"
                className={st.id === ep.id ? 'ds-rec sel' : 'ds-rec'}
                onClick={() => {
                  setEpisode(st.id);
                  setTick(13);
                }}
              >
                <b>{pick(st.name)}</b>
                <span className="mono muted">
                  🌧️ {num(peakRain)}mm · 🌊 {num(peakUp)}cm
                </span>
                <span className={st.floods ? 'ds-stamp yes' : 'ds-stamp no'}>
                  {st.floods ? '🌊 ' + bi('FLOODED', 'পানি উঠেছে') : '☀️ ' + bi('SAFE', 'নিরাপদ')}
                </span>
              </button>
            );
          })}
        </div>
        <button type="button" className="btn ghost" onClick={() => setStep('understand')}>
          ▶ {bi('Open selected storm in culvert scene', 'কালভার্ট দৃশ্যে ঝড়টি চালান')}
        </button>
      </Card>
    </div>
  );
}

const FEAT_LABEL: Record<string, [string, string]> = {
  upstream: ['Upstream khal', 'উজানের খাল'],
  level: ['Drain depth', 'ড্রেনের পানি'],
  rain: ['Rainfall', 'বৃষ্টিপাত'],
  rise15m: ['15m rise', '১৫মি বৃদ্ধি'],
};

function MiniDrainTreeSvg({ tree, hotIds }: { tree: TreeNode; hotIds: Set<number> }) {
  const { bi, num } = useT();
  const leaves = Math.max(2, countLeaves(tree, 4));
  const colW = 136;
  const rowH = 82;
  const W = Math.max(360, leaves * colW + 20);
  let maxD = 0;
  let li = 0;
  const pos: Record<number, { x: number; y: number }> = {};

  const place = (n: TreeNode) => {
    maxD = Math.max(maxD, n.depth);
    if (n.f && n.left && n.right) {
      place(n.left);
      place(n.right);
      pos[n.id] = {
        x: (pos[n.left.id].x + pos[n.right.id].x) / 2,
        y: 34 + n.depth * rowH,
      };
    } else {
      pos[n.id] = { x: (li++ + 0.5) * colW + 10, y: 34 + n.depth * rowH };
    }
  };
  place(tree);
  const H = 74 + maxD * rowH;

  const edges: ReactNode[] = [];
  const boxes: ReactNode[] = [];
  const walk = (n: TreeNode) => {
    const p = pos[n.id];
    const isHot = hotIds.has(n.id);
    if (n.f && n.left && n.right) {
      for (const ch of [n.left, n.right]) {
        const q = pos[ch.id];
        const chHot = isHot && hotIds.has(ch.id);
        edges.push(
          <path
            key={`${n.id}-${ch.id}`}
            d={`M${p.x},${p.y + 18} C${p.x},${(p.y + q.y) / 2} ${q.x},${(p.y + q.y) / 2} ${q.x},${q.y - 18}`}
            fill="none"
            stroke={chHot ? 'var(--warn)' : 'var(--line-strong)'}
            strokeWidth={chHot ? 3.2 : 1.6}
            strokeDasharray={chHot ? '6 5' : undefined}
            className={chHot ? 'ds-pipe-flow' : undefined}
          />,
        );
        walk(ch);
      }
      const fl = FEAT_LABEL[n.f] ?? [n.f, n.f];
      boxes.push(
        <g key={n.id} transform={`translate(${p.x} ${p.y})`}>
          <rect
            x="-60"
            y="-18"
            width="120"
            height="36"
            rx="8"
            fill="var(--card)"
            stroke={isHot ? 'var(--warn)' : 'var(--ink)'}
            strokeWidth={isHot ? 2.8 : 1.5}
          />
          <text textAnchor="middle" y="-2" fontSize="10.5" fontWeight="700" fill="var(--ink)">
            {bi(fl[0], fl[1])} ≤ {num(Math.round(n.thr ?? 0))}?
          </text>
          <text textAnchor="middle" y="12" fontSize="9.5" fill="var(--ink-2)">
            n={num(n.n)}
          </text>
        </g>,
      );
    } else {
      const prob = n.n ? n.pos / n.n : 0;
      const fire = prob >= 0.5;
      boxes.push(
        <g key={n.id} transform={`translate(${p.x} ${p.y})`}>
          <rect
            x="-52"
            y="-18"
            width="104"
            height="36"
            rx="18"
            fill={fire ? 'var(--yes-soft)' : 'var(--no-soft)'}
            stroke={isHot ? 'var(--warn)' : fire ? 'var(--yes)' : 'var(--no)'}
            strokeWidth={isHot ? 3 : 1.8}
          />
          <text textAnchor="middle" y="-1" fontSize="10.5" fontWeight="800" fill="var(--ink)">
            {fire ? '⚡ PUMP ON' : '✓ STANDBY'}
          </text>
          <text textAnchor="middle" y="12" fontSize="9.5" fill="var(--ink-2)">
            {num(Math.round(prob * 100))}% ({num(n.n)})
          </text>
        </g>,
      );
    }
  };
  walk(tree);

  return (
    <div className="lab-table-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 360, height: 'auto' }}>
        {edges}
        {boxes}
      </svg>
    </div>
  );
}

function Train() {
  const { bi, num } = useT();
  const aiMode = useDrainSensors((s) => s.aiMode);
  const model = useDrainSensors((s) => s.model);
  const tree = useDrainSensors((s) => s.tree);
  const epochs = useDrainSensors((s) => s.epochs);
  const treeDepth = useDrainSensors((s) => s.treeDepth);
  const flashPct = useDrainSensors((s) => s.flashPct);
  const { setAiMode, retrain, flashFirmware } = useDrainSensors.getState();

  const imp = useMemo(() => featureImportance(model), [model]);
  const sampleTick = useMemo(
    () => cleanStream(TEST_STORMS[0].ticks, { rejectSpikes: true, smoothWindow: 3 })[13],
    [],
  );
  const liveTree = useMemo(() => predictDrainTree(tree, sampleTick), [tree, sampleTick]);
  const hotIds = useMemo(() => new Set(liveTree.path.map((n) => n.id)), [liveTree]);

  return (
    <div className="lab-cols wide-left">
      <Card
        title={
          aiMode === 'tree'
            ? bi('Decision Tree learned from 8 monsoon storms', '৮টি বর্ষার ঝড় থেকে শেখা ডিসিশন ট্রি')
            : bi('+30-minute Sensor-Fusion Trend Model', '+৩০ মিনিটের সেন্সর-ফিউশন ট্রেন্ড মডেল')
        }
        aside={
          <button type="button" className="btn warn small" onClick={flashFirmware}>
            ⚡ {bi('Flash AI to ESP32', 'ESP32-তে ফ্ল্যাশ করুন')}
          </button>
        }
      >
        {flashPct !== null && (
          <div className="ds-flash-bar" role="status">
            <span>
              {flashPct < 40
                ? bi('Compiling C++ weights...', 'ওজন কম্পাইল হচ্ছে...')
                : bi(`Writing to ESP32 over USB-C… ${flashPct}%`, `USB-C দিয়ে ESP32-তে লেখা হচ্ছে… ${num(flashPct)}%`)}
            </span>
            <div className="ds-flash-track">
              <i style={{ width: `${flashPct}%` }} />
            </div>
          </div>
        )}

        <div className="lab-row">
          <button
            type="button"
            className="chip-btn"
            aria-pressed={aiMode === 'tree'}
            onClick={() => setAiMode('tree')}
          >
            🌳 {bi('Inspect Decision Tree', 'ডিসিশন ট্রি দেখুন')}
          </button>
          <button
            type="button"
            className="chip-btn"
            aria-pressed={aiMode !== 'tree'}
            onClick={() => setAiMode('timeseries')}
          >
            📈 {bi('Inspect +30m Trend AI', '+৩০মি ট্রেন্ড এআই দেখুন')}
          </button>
        </div>

        {aiMode === 'tree' ? (
          <>
            <Slider
              label={bi('Tree question depth', 'ট্রির প্রশ্নের গভীরতা')}
              value={treeDepth}
              min={1}
              max={4}
              step={1}
              format={(v) => `${num(v)}`}
              onChange={(v) => retrain({ treeDepth: v })}
            />
            <MiniDrainTreeSvg tree={tree} hotIds={hotIds} />
          </>
        ) : (
          <>
            <div className="lab-row">
              {[15, 50, 160].map((epCount) => (
                <button
                  key={epCount}
                  type="button"
                  className="chip-btn"
                  aria-pressed={epochs === epCount}
                  onClick={() => {
                    retrain({ epochs: epCount });
                    flashFirmware();
                  }}
                >
                  ▶ {bi(`${epCount} epochs`, `${num(epCount)} ধাপ`)}
                </button>
              ))}
            </div>
            <LineChart
              label={bi('Training error (cm)', 'প্রশিক্ষণের ভুল (সেমি)')}
              ymin={0}
              series={[
                {
                  values: model.lossHistory,
                  color: 'var(--accent)',
                  label: bi('30-minute forecast RMSE (cm)', '৩০ মিনিটের পূর্বাভাস ভুল (সেমি)'),
                },
              ]}
            />
          </>
        )}
      </Card>

      <Card title={bi('Sensor fusion weights inside ESP32', 'ESP32-এর ভেতরে সেন্সরের গুরুত্ব')}>
        <Bars
          items={[
            { key: 'up', label: bi('🌊 Upstream khal (1.2 km)', '🌊 উজানের খাল (১.২ কিমি)'), value: imp.upstream },
            { key: 'lvl', label: bi('📏 Local drain depth', '📏 স্থানীয় ড্রেনের গভীরতা'), value: imp.level },
            { key: 'rain', label: bi('🌧️ Rain intensity', '🌧️ বৃষ্টির তীব্রতা'), value: imp.rain },
            { key: 'rise', label: bi('📈 15-min rise speed', '📈 ১৫ মিনিটে বৃদ্ধির গতি'), value: imp.rise15m },
          ]}
        />
        <Talk avatar="🤖" who={bi('ESP32 Flash Memory', 'ESP32 মেমোরি')}>
          {bi(
            'Both models fit in under 120 bytes of flash memory — tiny enough to run every second without internet!',
            'দুটি মডেলই ১২০ বাইটের কম মেমোরিতে এঁটে যায়—তাই ইন্টারনেট ছাড়াই প্রতি সেকেন্ডে চলে!',
          )}
        </Talk>
      </Card>
    </div>
  );
}

function ScoreRing({ pct, label, warn }: { pct: number; label: ReactNode; warn?: boolean }) {
  const { num } = useT();
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const offset = 314.16 * (1 - clamped / 100);
  return (
    <div className={warn ? 'ds-ring warn' : 'ds-ring'}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="bg" cx="60" cy="60" r="50" />
        <circle className="fg" cx="60" cy="60" r="50" style={{ strokeDashoffset: offset }} />
      </svg>
      <div className="ds-ring-v">{num(clamped)}%</div>
      <div className="ds-ring-k">{label}</div>
    </div>
  );
}

function Evaluate() {
  const { bi, num } = useT();
  const aiMode = useDrainSensors((s) => s.aiMode);
  const model = useDrainSensors((s) => s.model);
  const tree = useDrainSensors((s) => s.tree);
  const thresholdCm = useDrainSensors((s) => s.thresholdCm);
  const forecastAlarmCm = useDrainSensors((s) => s.forecastAlarmCm);
  const faultMode = useDrainSensors((s) => s.faultMode);
  const setFault = useDrainSensors((s) => s.setFault);

  const summary = useMemo(() => {
    const storms = TEST_STORMS.map((st) => ({
      ...st,
      ticks: injectFault(st.ticks, faultMode === 'dropout' ? 'dropout' : 'none'),
    }));
    if (aiMode === 'rule') {
      return evaluateController(
        storms,
        { rejectSpikes: false, smoothWindow: 1 },
        (_c, raw) => (raw.rawLevelCm ?? 0) >= thresholdCm,
      );
    }
    if (aiMode === 'tree') {
      return evaluateController(
        storms,
        { rejectSpikes: true, smoothWindow: 3 },
        (c) => predictDrainTree(tree, c).triggers,
      );
    }
    if (aiMode === 'cloud') {
      return evaluateController(storms, { rejectSpikes: true, smoothWindow: 3 }, (c) =>
        c.packetDropped ? false : predictLevelAhead(model, c) >= forecastAlarmCm,
      );
    }
    return evaluateController(
      storms,
      { rejectSpikes: true, smoothWindow: 3 },
      (c) => predictLevelAhead(model, c) >= forecastAlarmCm,
    );
  }, [aiMode, model, tree, thresholdCm, forecastAlarmCm, faultMode]);

  const catchPct = summary.floodCount ? (summary.timelyCatches / summary.floodCount) * 100 : 0;
  const cleanPct = ((4 - summary.falseAlarms - summary.lateOrMissed) / 4) * 100;

  return (
    <div className="lab-cols">
      <Card
        title={`${AI_META[aiMode].icon} ${bi(AI_META[aiMode].name[0], AI_META[aiMode].name[1])} · ${bi('4 unseen storms', '৪টি অদেখা ঝড়ে পরীক্ষা')}`}
        aside={
          <button
            type="button"
            className="chip-btn brk"
            aria-pressed={faultMode === 'dropout'}
            onClick={() => setFault(faultMode === 'dropout' ? 'none' : 'dropout')}
          >
            📵 {bi('Test during 4G blackout', '৪জি ব্ল্যাকআউটে পরীক্ষা')}
          </button>
        }
      >
        <div className="ds-rings">
          <ScoreRing
            pct={catchPct}
            label={bi('Floods caught ≥20m early', '≥২০মি আগে ধরা বন্যা')}
          />
          <ScoreRing
            pct={cleanPct}
            warn
            label={bi('Overall storm reliability', 'সামগ্রিক ঝড় নির্ভরযোগ্যতা')}
          />
        </div>

        <Talk avatar={AI_META[aiMode].icon}>
          {bi(
            `Average pump lead time: ${summary.avgLeadMinutes} min (pumps need ${PUMP_SPINUP_MIN} min). Click the 4 AI buttons at the top to compare!`,
            `গড় আগাম সতর্কতা: ${num(summary.avgLeadMinutes)} মিনিট (পাম্পের দরকার ${num(PUMP_SPINUP_MIN)} মিনিট)। তুলনা করতে ওপরে ৪টি এআই বাটনে চাপুন!`,
          )}
        </Talk>
      </Card>

      <Card title={bi('What happened to the street?', 'রাস্তার কী অবস্থা হলো?')}>
        <div className="ds-tiles">
          <div className="ds-tile good">
            <span>✅ {bi('Warned ≥20m early', 'সময়মতো পাম্প চালু')}</span>
            <div className="ds-tile-n">{num(summary.timelyCatches)}</div>
          </div>
          <div className="ds-tile bad">
            <span>😱 {bi('Too late / missed', 'দেরি / রাস্তা ডুবেছে')}</span>
            <div className="ds-tile-n">{num(summary.lateOrMissed)}</div>
          </div>
          <div className="ds-tile bad">
            <span>🔔 {bi('False pump start', 'ভুয়া সাইরেন / অপচয়')}</span>
            <div className="ds-tile-n">{num(summary.falseAlarms)}</div>
          </div>
          <div className="ds-tile good">
            <span>😌 {bi('Calm & stayed dry', 'নীরব ও শুকনো')}</span>
            <div className="ds-tile-n">{num(summary.trueSafe)}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function BreakIt() {
  const { bi, num, pick } = useT();
  const model = useDrainSensors((s) => s.model);
  const faultMode = useDrainSensors((s) => s.faultMode);
  const healthGuard = useDrainSensors((s) => s.healthGuard);
  const edgeFallback = useDrainSensors((s) => s.edgeFallback);
  const sensorWards = useDrainSensors((s) => s.sensorWards);
  const forecastAlarmCm = useDrainSensors((s) => s.forecastAlarmCm);
  const { setFault, setGuards, setPlacementPreset, toggleWardSensor } =
    useDrainSensors.getState();

  const storm = TEST_STORMS[0];
  const faultyTicks = useMemo(() => injectFault(storm.ticks, faultMode), [storm, faultMode]);
  const cleaned = useMemo(
    () => cleanStream(faultyTicks, { rejectSpikes: true, smoothWindow: 3 }),
    [faultyTicks],
  );
  const health = useMemo(() => checkSensorHealth(cleaned), [cleaned]);

  const firstFloodMin = storm.ticks.find((t) => t.trueLevelCm >= FLOOD_CM)?.minute ?? 95;
  let alarmMin: number | null = null;
  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    const hNow = checkSensorHealth(cleaned.slice(0, i + 1));
    if (faultMode === 'dropout' && !edgeFallback && c.packetDropped) continue;
    const pred = predictLevelAhead(model, c);
    const backupSurge =
      healthGuard && hNow.status === 'stuck' && c.upstreamCm >= 95 && c.rainMmHr >= 50;
    if (pred >= forecastAlarmCm || backupSurge) {
      alarmMin = c.minute;
      break;
    }
  }

  const cov = evaluatePlacement(DRAIN_WARDS, sensorWards);
  // 24 flooded families across the 4 flooded wards (6 per flooded ward)
  const warnedHouses = cov.detectedFloods * 6;
  const missedHouses = cov.invisibleFloods * 6;

  return (
    <div className="lab-cols">
      <Card
        title={bi('1. Mud & blackouts vs Hardware Guards', '১. কাদা ও ব্ল্যাকআউট বনাম হার্ডওয়্যার সুরক্ষা')}
        aside={
          <Pill tone={health.status === 'healthy' ? 'ok' : 'warn'}>
            {health.status === 'stuck'
              ? bi('Sensor stuck (flatline)!', 'সেন্সর আটকে গেছে!')
              : health.status === 'dropout'
                ? bi('65% packets lost!', '৬৫% ডেটা হারিয়েছে!')
                : bi('Stream healthy', 'সেন্সর সচল')}
          </Pill>
        }
      >
        <Choice<FaultMode>
          label={bi('Inject fault', 'ত্রুটি যোগ করুন')}
          value={faultMode}
          onChange={setFault}
          options={[
            { value: 'none', label: bi('Clean', 'স্বাভাবিক') },
            { value: 'stuck', label: '🪵 ' + bi('Mud stuck', 'কাদায় আটকানো') },
            { value: 'dropout', label: '📵 ' + bi('4G blackout', 'নেটওয়ার্ক বন্ধ') },
          ]}
        />

        <LineChart
          label={bi('Actual flood vs faulty sensor', 'আসল পানি বনাম ত্রুটিপূর্ণ সেন্সর')}
          ymin={15}
          ymax={130}
          height={175}
          xlabels={cleaned.map((c) => `${c.minute}m`)}
          series={[
            {
              values: cleaned.map((c) => c.trueLevelCm),
              color: 'var(--yes)',
              label: bi('True drain water', 'আসল পানি'),
            },
            {
              values: cleaned.map((c) => c.cleanLevelCm),
              color: 'var(--c1)',
              dashed: true,
              label: bi('Reported sensor line', 'সেন্সরের রেখা'),
            },
          ]}
        />

        <label className="ds-switch">
          <input
            type="checkbox"
            checked={healthGuard}
            onChange={(e) => setGuards({ healthGuard: e.target.checked })}
          />
          <span>🛡️ {bi('Cross-sensor health check (spot flatline in rain)', 'সেন্সর-স্বাস্থ্য যাচাই (বৃষ্টিতে স্থির পাঠ ধরুন)')}</span>
        </label>
        <label className="ds-switch">
          <input
            type="checkbox"
            checked={edgeFallback}
            onChange={(e) => setGuards({ edgeFallback: e.target.checked })}
          />
          <span>⚡ {bi('Run AI locally on ESP32 (survives 4G blackout)', 'ESP32 চিপেই এআই চালান (নেটওয়ার্ক ছাড়াই চলে)')}</span>
        </label>

        <Talk avatar={alarmMin !== null && firstFloodMin - alarmMin >= PUMP_SPINUP_MIN ? '✅' : '🚨'}>
          {alarmMin !== null && firstFloodMin - alarmMin >= PUMP_SPINUP_MIN
            ? bi(
                `Saved! Pump started at ${alarmMin}m (${firstFloodMin - alarmMin}m before spillover).`,
                `রক্ষা পেয়েছে! পাম্প ${num(alarmMin)} মিনিটে চালু হয়েছে (পানি ওঠার ${num(firstFloodMin - alarmMin)} মিনিট আগে)।`,
              )
            : bi(
                `Street flooded at ${firstFloodMin}m! Flip the shield switches above to fix it.`,
                `${num(firstFloodMin)} মিনিটে রাস্তা ডুবে গেছে! ঠিক করতে ওপরের সুরক্ষা সুইচ চালু করুন।`,
              )}
        </Talk>
      </Card>

      <Card
        title={bi('2. Click wards to place your 4 ESP32 nodes', '২. ৪টি ESP32 সেন্সর বসাতে ওয়ার্ডে ক্লিক করুন')}
        aside={
          <span className="lab-row">
            <button type="button" className="chip-btn brk" onClick={() => setPlacementPreset('vip')}>
              🏛️ {bi('VIP only', 'শুধু ভিআইপি')}
            </button>
            <button type="button" className="chip-btn" onClick={() => setPlacementPreset('equitable')}>
              🌊 {bi('Flood basins', 'নিচু এলাকা')}
            </button>
          </span>
        }
      >
        <div className="ds-ward-grid">
          {DRAIN_WARDS.map((w) => {
            const has = sensorWards.includes(w.id);
            const blind = w.floodedInStorm && !has;
            return (
              <button
                key={w.id}
                type="button"
                className={
                  blind
                    ? 'ds-ward-btn blind-flood'
                    : has
                      ? 'ds-ward-btn has-sensor'
                      : 'ds-ward-btn'
                }
                onClick={() => toggleWardSensor(w.id)}
              >
                <b>
                  {has ? '📡 ' : '⬜ '}
                  {pick(w.name).split('·')[0]}
                </b>
                <span className="muted">
                  {w.zone === 'vip-main' ? '🏢 ' : '🏚️ '}
                  {num(w.elevationM)}m
                </span>
                <Pill tone={blind ? 'yes' : has && w.floodedInStorm ? 'ok' : 'no'}>
                  {blind
                    ? bi('Unseen flood!', 'অদৃশ্য বন্যা!')
                    : w.floodedInStorm
                      ? bi('Detected', 'ধরা পড়েছে')
                      : bi('Dry', 'শুকনো')}
                </Pill>
              </button>
            );
          })}
        </div>

        <div>
          <span className="eyebrow">
            {bi(
              `Flooded homes warned: ${warnedHouses} / ${warnedHouses + missedHouses}`,
              `সতর্কবার্তা পাওয়া ডুবন্ত ঘর: ${num(warnedHouses)} / ${num(warnedHouses + missedHouses)}`,
            )}
          </span>
          <div className="ds-houses" aria-hidden="true">
            {Array.from({ length: warnedHouses }, (_, i) => (
              <i key={`w-${i}`} className="ds-hs warned" />
            ))}
            {Array.from({ length: missedHouses }, (_, i) => (
              <i key={`m-${i}`} className="ds-hs missed" />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

const APPLY_RIGS: Record<
  CivicCaseId,
  {
    icon: string;
    title: [string, string];
    ideal: ApplyBrainId;
    scores: Record<ApplyBrainId, { fit: number; note: [string, string] }>;
  }
> = {
  sump: {
    icon: '🏢',
    title: ['Basement sump pump', 'ভবনের বেজমেন্ট পাম্প'],
    ideal: 'float',
    scores: {
      float: { fit: 98, note: ['৳400 float switch works 10 years offline — zero AI needed!', '৪০০ টাকার ফ্লোট সুইচ ইন্টারনেট ছাড়া ১০ বছর চলে—এআই দরকারই নেই!'] },
      rule: { fit: 72, note: ['Works, but ultrasonic adds cost over a simple float switch.', 'কাজ করে, তবে সাধারণ ফ্লোট সুইচের চেয়ে অযথা খরচ বেশি।'] },
      tree: { fit: 45, note: ['Overkill for one basement tank with no upstream canal.', 'একটি ছোট হাউজের জন্য ডিসিশন ট্রি অপ্রয়োজনীয় জটিলতা।'] },
      timeseries: { fit: 40, note: ['No 30-minute lead time needed for an instant sump pump.', 'তাৎক্ষণিক সাম্প পাম্পে ৩০ মিনিট আগের পূর্বাভাস নিষ্প্রয়োজন।'] },
      cloud: { fit: 20, note: ['Basement floods the day Wi-Fi router loses power!', 'বিদ্যুৎ বা Wi-Fi গেলেই বেজমেন্ট ডুবে যাবে!'] },
    },
  },
  grate: {
    icon: '🗑️',
    title: ['Canal trash-screen clog', 'খালের নেটে ময়লা আটকানো'],
    ideal: 'rule',
    scores: {
      float: { fit: 35, note: ['One float cannot tell high tide apart from a clogged grate.', 'একটি ফ্লোট সুইচ জোয়ার আর ময়লা জমার পার্থক্য বোঝে না।'] },
      rule: { fit: 96, note: ['Two sensors: IF (before − after) > 25 cm → clogged! Pure physics.', 'দুই পাশে ২টি সেন্সর: পার্থক্য > ২৫ সেমি মানেই জ্যাম! সহজ পদার্থবিজ্ঞান।'] },
      tree: { fit: 78, note: ['Works well, though a 1-line difference rule is even clearer.', 'ভালো কাজ করে, তবে বিয়োগের সহজ নিয়মই এখানে যথেষ্ট।'] },
      timeseries: { fit: 74, note: ['Can forecast gradual silt buildup before monsoon.', 'বর্ষার আগে ধীরে ধীরে পলি জমা অনুমান করতে পারে।'] },
      cloud: { fit: 55, note: ['Fine for daily maintenance SMS, risky during storm blackouts.', 'দৈনিক রক্ষণাবেক্ষণে চলে, তবে ঝড়ে সংযোগ বিচ্ছিন্ন হতে পারে।'] },
    },
  },
  pumpstation: {
    icon: '⚡',
    title: ['Ward stormwater pump station', 'ওয়ার্ডের প্রধান পাম্প স্টেশন'],
    ideal: 'timeseries',
    scores: {
      float: { fit: 25, note: ['Triggers at 0 min lead time — streets flood while pumps spin up!', 'পানি ওঠার পর চালু হয়—পাম্প ঘুরতে ঘুরতেই রাস্তা ডুবে যায়!'] },
      rule: { fit: 38, note: ['Fooled by trash echoes or triggers too late.', 'ভাসমান আবর্জনার স্পাইকে ভুয়া সাইরেন বাজায় বা দেরি করে।'] },
      tree: { fit: 90, note: ['Fast, explainable Edge rules on ESP32 with early khal warning!', 'ESP32-তে দ্রুত ও ব্যাখ্যাযোগ্য আগাম সতর্কতা দেয়!'] },
      timeseries: { fit: 97, note: ['Best lead time (+30m) on ESP32 combining slope, khal & rain!', 'গতি, উজানের খাল ও বৃষ্টি মিলিয়ে ESP32-তেই সেরা +৩০মি আগাম সতর্কতা!'] },
      cloud: { fit: 42, note: ['Accurate in dry tests, fails right when storm knocks out 4G!', 'শুকনো দিনে ঠিক থাকে, কিন্তু ঝড়ে ৪জি গেলেই অচল!'] },
    },
  },
  citywide: {
    icon: '🗺️',
    title: ['20-ward flood control room', '২০-ওয়ার্ডের কেন্দ্রীয় নিয়ন্ত্রণ কক্ষ'],
    ideal: 'tree',
    scores: {
      float: { fit: 20, note: ['Gives no city-wide trend or early warning.', 'পুরো শহরের কোনো আগাম চিত্র দিতে পারে না।'] },
      rule: { fit: 44, note: ['Too many false alarms across 20 noisy drains.', '২০টি নয়েজি ড্রেনে অসংখ্য ভুয়া সাইরেন বাজবে।'] },
      tree: { fit: 95, note: ['Auditable rules officers can inspect + Edge safety at every pump!', 'কর্মকর্তারা সহজে নিয়ম যাচাই করতে পারেন + প্রতিটি পাম্পে এজ সুরক্ষা!'] },
      timeseries: { fit: 94, note: ['Great forecasts — pair with equitable sensor placement in low wards!', 'চমৎকার পূর্বাভাস—তবে নিচু বস্তি এলাকায় সমানভাবে সেন্সর বসাতে হবে!'] },
      cloud: { fit: 68, note: ['Great for the central map ONLY if each pump also keeps Edge fallback!', 'কেন্দ্রীয় মানচিত্রের জন্য ভালো, যদি প্রতিটি পাম্পে লোকাল এজ ব্যাকআপও থাকে!'] },
    },
  },
};

const BRAIN_LABELS: Record<ApplyBrainId, [string, string]> = {
  float: ['🔘 Float Switch (No AI)', '🔘 ফ্লোট সুইচ (এআই ছাড়া)'],
  rule: ['📏 IF–THEN Rule', '📏 যদি–তবে নিয়ম'],
  tree: ['🌳 Edge Decision Tree', '🌳 এজ ডিসিশন ট্রি'],
  timeseries: ['📈 Edge +30m Trend AI', '📈 এজ +৩০মি ট্রেন্ড এআই'],
  cloud: ['☁️ Cloud Server AI', '☁️ ক্লাউড সার্ভার এআই'],
};

function Apply() {
  const { bi } = useT();
  const civicCase = useDrainSensors((s) => s.civicCase);
  const applyBrain = useDrainSensors((s) => s.applyBrain);
  const { setCivicCase, setApplyBrain } = useDrainSensors.getState();

  const rig = APPLY_RIGS[civicCase];
  const res = rig.scores[applyBrain];

  return (
    <div className="lab-cols">
      <Card title={bi('1. Pick a city problem & wire an AI brain', '১. সমস্যা বাছুন ও এআই সংযুক্ত করুন')}>
        <div className="lab-row">
          {(Object.keys(APPLY_RIGS) as CivicCaseId[]).map((k) => (
            <button
              key={k}
              type="button"
              className="chip-btn"
              aria-pressed={civicCase === k}
              onClick={() => setCivicCase(k)}
            >
              {APPLY_RIGS[k].icon} {bi(APPLY_RIGS[k].title[0], APPLY_RIGS[k].title[1])}
            </button>
          ))}
        </div>

        <span className="eyebrow">{bi('Choose controller / AI to wire', 'কোন ব্রেইন লাগাবেন বেছে নিন')}</span>
        <div className="lab-row">
          {(Object.keys(BRAIN_LABELS) as ApplyBrainId[]).map((b) => (
            <button
              key={b}
              type="button"
              className="chip-btn"
              aria-pressed={applyBrain === b}
              onClick={() => setApplyBrain(b)}
            >
              {bi(BRAIN_LABELS[b][0], BRAIN_LABELS[b][1])}
            </button>
          ))}
        </div>
      </Card>

      <Card title={bi('2. Live field suitability score', '২. মাঠপর্যায়ের উপযোগিতা স্কোর')}>
        <div className="ds-rings">
          <ScoreRing
            pct={res.fit}
            warn={res.fit < 75}
            label={bi('Engineering fit', 'প্রকৌশল উপযোগিতা')}
          />
        </div>
        <Talk avatar={applyBrain === rig.ideal ? '🏆' : res.fit >= 85 ? '👍' : '⚠️'}>
          {bi(res.note[0], res.note[1])}
        </Talk>
      </Card>
    </div>
  );
}
