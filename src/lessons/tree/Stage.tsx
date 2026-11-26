import { useMemo, type ReactNode } from 'react';
import {
  CLUE,
  DAYS,
  ORDER,
  TONIGHT_PRESETS,
  WORDS,
  type Day,
  type FeatureKey,
} from '../../data/waterlogging';
import { rng, shuffle } from '../../engines/random';
import {
  countLeaves,
  leafFor,
  pathFor,
  predicts,
  questionsAt,
  treeDepth,
  type TreeNode,
} from '../../engines/tree';
import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Callout, Card, Pill } from '../kit';
import { Scene } from './Scene';
import { labelOf, rowOf, useTree } from './store';
import { TreeDiagram } from './TreeDiagram';
import './tree.css';

function usePct() {
  const { num } = useT();
  return (x: number) => `${num(Math.round(x * 100))}%`;
}

export function TreeStage() {
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

/** A speaker and what they say. */
function Talk({ who, avatar, children }: { who?: ReactNode; avatar: string; children: ReactNode }) {
  return (
    <div className="tw-talk">
      <span className="tw-avatar" aria-hidden="true">
        {avatar}
      </span>
      <div className="tw-say" aria-live="polite">
        {who && <span className="tw-who">{who}</span>}
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
          'Every monsoon, some streets turn into rivers within an hour, while a street two blocks away stays dry. A human wrote the rules in lesson 2. Here the machine studies 800 past rainy days and discovers the rules itself.',
          'প্রতি বর্ষায় কিছু রাস্তা এক ঘণ্টার মধ্যে নদী হয়ে যায়, অথচ দুই গলি দূরের রাস্তা শুকনো থাকে। পাঠ ২-এ নিয়ম লিখেছিল মানুষ। এখানে যন্ত্র ৮০০টি পুরোনো বৃষ্টির দিন পড়ে নিজেই নিয়ম খুঁজে বের করে।',
        )}
      </p>
      <Tonight />
    </div>
  );
}

/** Tonight's street, the clue sliders and the tree's forecast. */
function Tonight({ compact }: { compact?: boolean }) {
  const { bi, num } = useT();
  const pct = usePct();
  const tonight = useTree((s) => s.tonight);
  const tree = useTree((s) => s.tree);
  const bias = useTree((s) => s.bias);
  const setTonight = useTree((s) => s.setTonight);
  const walkThrough = useTree((s) => s.walkThrough);
  const setStep = useLab((s) => s.setStep);
  const leaf = leafFor(tree, rowOf(tonight));
  const p = leaf.pos / leaf.n;
  const flood = p >= 0.5;
  const k = leaf.depth;
  const res: [string, string] =
    flood && tonight.inf
      ? [
          "Water is coming inside again! Lift the rice and the children's books onto the bed.",
          'আবার ঘরে পানি ঢুকছে! চাল আর বাচ্চাদের বই খাটের ওপর তোলো।',
        ]
      : flood
        ? [
            'The ground-floor shops will go under. Move the cars and the stock now!',
            'নিচতলার দোকানে পানি ঢুকবে। এখনই গাড়ি আর মালপত্র সরাও!',
          ]
        : tonight.inf && bias
          ? [
              '"Low risk"? We flood every monsoon. We just stopped reporting it.',
              '"ঝুঁকি কম"? প্রতি বর্ষায় আমাদের এখানে পানি জমে। আমরা শুধু জানানো বন্ধ করেছি।',
            ]
          : tonight.rain < 12
            ? ['Dry and calm tonight. Good for drying clothes.', 'আজ রাত শুকনো আর শান্ত। কাপড় শুকানোর জন্য ভালো।']
            : [
                'Just rain. Take an umbrella, the children can still go to school.',
                'শুধু বৃষ্টি। ছাতা নাও, বাচ্চারা স্কুলে যেতে পারবে।',
              ];
  const drv: [string, string] = flood
    ? ["I'm not driving into that! Find another road.", 'ওই পানিতে আমি যাব না! অন্য রাস্তা দেখেন।']
    : ['Road is clear, hop in!', 'রাস্তা ফাঁকা, উঠে পড়েন!'];

  const slider = (
    key: 'rain' | 'block' | 'elev',
    icon: string,
    name: string,
    min: number,
    max: number,
    step: number,
    unit: string,
  ) => {
    const w = WORDS[key](tonight[key]);
    return (
      <label className="tw-clue">
        <span className="tw-clue-top">
          <span aria-hidden="true">{icon}</span>
          <b>{name}</b>
          <span className="mono">
            {num(tonight[key])}
            {unit}
          </span>
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={tonight[key]}
          onChange={(e) => setTonight({ [key]: Number(e.target.value) })}
        />
        <span className="muted tw-word">{bi(w[0], w[1])}</span>
      </label>
    );
  };

  return (
    <div className="lab-cols wide-left">
      <Card>
        <div className="tw-scene-wrap">
          <Scene tonight={tonight} p={p} />
          <div className={flood ? 'tw-forecast bad' : 'tw-forecast good'}>
            <span className="eyebrow">{bi("The tree's forecast", 'ট্রির পূর্বাভাস')}</span>
            <b>
              {flood
                ? '⚠️ ' + bi('Waterlogging likely', 'জলাবদ্ধতার সম্ভাবনা বেশি')
                : '✓ ' + bi('Waterlogging unlikely', 'জলাবদ্ধতার সম্ভাবনা কম')}{' '}
              · {pct(p)}
            </b>
            <span className="tw-meter">
              <i style={{ width: `${p * 100}%` }} />
            </span>
          </div>
        </div>
        {!compact && (
          <div className="tw-bubbles">
            <Talk avatar={tonight.inf ? '🧕' : '🧑'} who={bi('Resident', 'বাসিন্দা')}>
              {bi(res[0], res[1])}
            </Talk>
            <Talk avatar="🛺" who={bi('CNG driver', 'সিএনজি চালক')}>
              {bi(drv[0], drv[1])}
            </Talk>
          </div>
        )}
        <Talk avatar="🌳">
          {bi(
            `I asked ${k} question${k === 1 ? '' : 's'} about tonight and found ${leaf.n} past days just like it. In ${Math.round(p * 100)}% of them the street flooded.`,
            `আজ রাত নিয়ে আমি ${num(k)}টি প্রশ্ন করেছি এবং ঠিক এমন ${num(leaf.n)}টি পুরোনো দিন পেয়েছি। তার ${pct(p)} দিনে রাস্তায় পানি জমেছিল।`,
          )}
        </Talk>
      </Card>
      <Card title={bi("Change tonight's clues", 'আজ রাতের সূত্রগুলো বদলান')}>
        {slider('rain', '🌧️', bi('Rainfall', 'বৃষ্টিপাত'), 0, 200, 1, bi(' mm', ' মিমি'))}
        {slider('block', '🗑️', bi('Drain blocked', 'ড্রেন বন্ধ'), 0, 100, 1, '%')}
        {slider(
          'elev',
          '⛰️',
          bi('Street height above river', 'নদী থেকে রাস্তার উচ্চতা'),
          1,
          12,
          0.5,
          bi(' m', ' মি'),
        )}
        <div className="seg" role="group" aria-label={bi('Area type', 'এলাকার ধরন')}>
          <button type="button" aria-pressed={!tonight.inf} onClick={() => setTonight({ inf: 0 })}>
            🏢 {bi('Planned area', 'পরিকল্পিত এলাকা')}
          </button>
          <button type="button" aria-pressed={!!tonight.inf} onClick={() => setTonight({ inf: 1 })}>
            🏚️ {bi('Informal settlement', 'অনানুষ্ঠানিক বসতি')}
          </button>
        </div>
        <div className="lab-row">
          {TONIGHT_PRESETS.map((pr, i) => (
            <button key={i} type="button" className="chip-btn" onClick={() => setTonight(pr)}>
              {
                [
                  bi('🌊 Low-lying slum, cloudburst', '🌊 নিচু বস্তি, অতি বৃষ্টি'),
                  bi('⛰️ High ground, clear drain', '⛰️ উঁচু জমি, পরিষ্কার ড্রেন'),
                  bi('🌦️ Light rain', '🌦️ হালকা বৃষ্টি'),
                ][i]
              }
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setStep('train');
            walkThrough();
          }}
        >
          ▶ {bi('Show me how the tree decided', 'ট্রি কীভাবে সিদ্ধান্ত নিল দেখাও')}
        </button>
      </Card>
    </div>
  );
}

function Explore() {
  const { bi, num } = useT();
  const train = useTree((s) => s.train);
  const bias = useTree((s) => s.bias);
  const seed = useTree((s) => s.cardSeed);
  const shuffleCards = useTree((s) => s.shuffleCards);
  const cards = useMemo(() => {
    let rows = seed ? shuffle(train, rng(seed * 7919)).slice(0, 6) : train.slice(0, 6);
    if (bias && !rows.some((x) => x.unreported)) {
      const u = train.find((x) => x.unreported);
      if (u) rows = [...rows.slice(0, 5), u];
    }
    return rows;
  }, [train, seed, bias]);
  const yes = train.filter((d) => labelOf(d, bias)).length;
  const csv = () => {
    const rows = [
      ['rainfall_mm', 'drain_blockage_pct', 'elevation_m', 'informal_settlement', 'waterlogging'],
    ].concat(
      DAYS.map((d) => [
        String(d.rain),
        String(d.block),
        String(d.elev),
        d.inf ? 'yes' : 'no',
        labelOf(d, bias) ? 'yes' : 'no',
      ]),
    );
    const blob = new Blob(['﻿' + rows.map((r) => r.join(',')).join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'waterlogging_synthetic.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="lab-view">
      <Card
        title={bi("The tree's study notes", 'গাছের পড়ার খাতা')}
        aside={
          <span className="lab-row">
            <Pill tone="warn">{bi('Synthetic data', 'কৃত্রিম ডেটা')}</Pill>
            <button type="button" className="btn small ghost" onClick={shuffleCards}>
              🔀 {bi('Show 6 other days', 'অন্য ৬টি দিন দেখাও')}
            </button>
            <button type="button" className="btn small ghost" onClick={csv}>
              ⬇ CSV
            </button>
          </span>
        }
      >
        <div className="lab-cols">
          <div>
            <div className="tw-recs">
              {cards.map((d) => {
                const y = labelOf(d, bias);
                const hid = bias && d.unreported;
                return (
                  <div key={d.id} className={hid ? 'tw-rec hidden-flood' : 'tw-rec'}>
                    <span className="tw-rec-h">{bi(`Rainy day #${d.id}`, `বৃষ্টির দিন #${num(d.id)}`)}</span>
                    <span className="tw-rec-cl mono">
                      <span>🌧️ {num(d.rain)}</span>
                      <span>🗑️ {num(d.block)}%</span>
                      <span>⛰️ {num(d.elev)}</span>
                      <span>{d.inf ? '🏚️' : '🏢'}</span>
                    </span>
                    {hid && (
                      <span className="tw-rec-note">📵 {bi('really flooded!', 'আসলে পানি জমেছিল!')}</span>
                    )}
                    <span className={y ? 'tw-stamp yes' : 'tw-stamp no'}>
                      {y ? '🌊 ' + bi('FLOODED', 'পানি জমেছিল') : '☀️ ' + bi('DRY', 'শুকনো')}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="muted tw-small">
              {bi(
                `🌧️ rain (mm) · 🗑️ drain blocked · ⛰️ height (m) · 🏢/🏚️ area type. Study pile: ${train.length} days, ${yes} flooded.`,
                `🌧️ বৃষ্টি (মিমি) · 🗑️ ড্রেন বন্ধ · ⛰️ উচ্চতা (মি) · 🏢/🏚️ এলাকার ধরন। পড়ার স্তূপ: ${num(train.length)}টি দিন, ${num(yes)}টিতে পানি জমেছিল।`,
              )}
            </p>
          </div>
          <ScatterPlot />
        </div>
      </Card>
    </div>
  );
}

function ScatterPlot() {
  const { bi, num } = useT();
  const train = useTree((s) => s.train);
  const bias = useTree((s) => s.bias);
  const W = 520;
  const H = 280;
  const P = 36;
  const X = (v: number) => P + (v / 200) * (W - P - 8);
  const Y = (v: number) => H - P - (v / 100) * (H - P - 10);
  return (
    <figure className="lab-chart-wrap">
      <svg
        className="lab-chart"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={bi(
          'Rainfall against drain blockage, coloured by flooding',
          'বৃষ্টিপাত বনাম ড্রেন বন্ধ, পানি জমা অনুযায়ী রঙ',
        )}
      >
        <line className="axis" x1={P} y1={H - P} x2={W} y2={H - P} />
        <line className="axis" x1={P} y1={0} x2={P} y2={H - P} />
        {[0, 50, 100, 150, 200].map((v) => (
          <text key={v} x={X(v)} y={H - P + 16} textAnchor="middle">
            {num(v)}
          </text>
        ))}
        {[0, 50, 100].map((v) => (
          <text key={v} x={P - 6} y={Y(v) + 4} textAnchor="end">
            {num(v)}
          </text>
        ))}
        <text x={W / 2 + 18} y={H - 3} textAnchor="middle">
          🌧️ {bi('rainfall (mm) →', 'বৃষ্টিপাত (মিমি) →')}
        </text>
        <text transform={`translate(11,${H / 2 - 18}) rotate(-90)`} textAnchor="middle">
          🗑️ {bi('drain blocked (%) →', 'ড্রেন বন্ধ (%) →')}
        </text>
        {train.map((d) => (
          <g key={d.id}>
            <circle
              cx={X(d.rain).toFixed(1)}
              cy={Y(d.block).toFixed(1)}
              r={3.2}
              opacity={0.6}
              style={{ fill: labelOf(d, bias) ? 'var(--yes)' : 'var(--no)' }}
            />
            {bias && d.unreported && (
              <circle
                cx={X(d.rain).toFixed(1)}
                cy={Y(d.block).toFixed(1)}
                r={5.5}
                fill="none"
                strokeWidth={1.5}
                style={{ stroke: 'var(--yes)' }}
              />
            )}
          </g>
        ))}
      </svg>
      <figcaption className="lab-legend">
        <span>
          <i style={{ background: 'var(--yes)' }} />
          {bi('flooded', 'পানি জমেছিল')}
        </span>
        <span>
          <i style={{ background: 'var(--no)' }} />
          {bi('dry', 'শুকনো')}
        </span>
        {bias && <span>○ {bi('flooded, never reported', 'পানি জমেছিল, কখনো জানানো হয়নি')}</span>}
      </figcaption>
    </figure>
  );
}

function Train() {
  const { bi } = useT();
  const tree = useTree((s) => s.tree);
  const showDepth = useTree((s) => s.showDepth);
  const tonight = useTree((s) => s.tonight);
  const walk = useTree((s) => s.walk);
  const path = pathFor(tree, rowOf(tonight), showDepth);
  const leaves = countLeaves(tree, showDepth);
  return (
    <div className="lab-view">
      <div className="lab-cols">
        <Card title={bi('Study pile and exam pile', 'পড়ার স্তূপ আর পরীক্ষার স্তূপ')}>
          <SplitStrip />
          <TrainSliders />
        </Card>
        <Card title={bi('The tree explains', 'ট্রি ব্যাখ্যা করে')}>
          <TrainTalk />
        </Card>
      </div>
      <Card title={bi('The rules the machine discovered', 'যন্ত্র যে নিয়মগুলো খুঁজে পেয়েছে')}>
        <p className="muted tw-small">
          {leaves > 14
            ? '⚠️ ' +
              bi(
                `This tree has ${leaves} end groups: too many to read. If humans cannot read the rules, can they still check them?`,
                `এই গাছে ${leaves}টি শেষ দল: পড়ার পক্ষে অনেক বেশি। মানুষ যদি নিয়মগুলো পড়তেই না পারে, তাহলে কি যাচাই করতে পারবে?`,
              )
            : bi(
                'Read from the top. Edge thickness = how many past days flow that way. The 💧 shows tonight’s path.',
                'ওপর থেকে পড়ুন। রেখা যত মোটা, তত বেশি পুরোনো দিন সেই পথে যায়। 💧 আজ রাতের পথ দেখায়।',
              )}
        </p>
        <TreeDiagram tree={tree} showDepth={showDepth} path={path} upto={walk ?? path.length - 1} />
      </Card>
    </div>
  );
}

function SplitStrip() {
  const { bi, num } = useT();
  const train = useTree((s) => s.train);
  const test = useTree((s) => s.test);
  const bias = useTree((s) => s.bias);
  const k = train.length;
  return (
    <>
      <svg
        className="tw-strip"
        viewBox="0 0 500 160"
        role="img"
        aria-label={bi(
          '800 records split into a study pile and a hidden exam pile',
          '৮০০টি রেকর্ড পড়ার স্তূপ ও লুকানো পরীক্ষার স্তূপে ভাগ',
        )}
      >
        {ORDER.map((di, i) => (
          <rect
            key={i}
            x={(i % 50) * 10 + 1}
            y={Math.floor(i / 50) * 10 + 1}
            width={8}
            height={8}
            rx={2}
            className={i < k ? (labelOf(DAYS[di], bias) ? 'ty' : 'tn') : 'te'}
          />
        ))}
      </svg>
      <div className="lab-row tw-small">
        <span>
          📚 {bi('Study pile', 'পড়ার স্তূপ')}: <b>{num(k)}</b>
        </span>
        <span>
          🔒 {bi('Hidden exam pile', 'লুকানো পরীক্ষার স্তূপ')}: <b>{num(test.length)}</b>
        </span>
      </div>
    </>
  );
}

export function TrainSliders() {
  const { bi, num } = useT();
  const split = useTree((s) => s.split);
  const depth = useTree((s) => s.depth);
  const growing = useTree((s) => s.growing);
  const { setSplit, setDepth, grow } = useTree.getState();
  const k = Math.round((DAYS.length * split) / 100);
  return (
    <div className="lab-view">
      <label className="lab-slider">
        <span className="lab-slider-head">
          <span>{bi('How many days the tree may study', 'গাছ কতগুলো দিন পড়তে পারবে')}</span>
          <b className="mono">
            {num(split)}% ({num(k)})
          </b>
        </span>
        <input
          type="range"
          min={5}
          max={90}
          step={5}
          value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
        />
      </label>
      <label className="lab-slider">
        <span className="lab-slider-head">
          <span>{bi('How many questions deep the tree may go', 'গাছ কত ধাপ পর্যন্ত প্রশ্ন করতে পারবে')}</span>
          <b className="mono">{num(depth)}</b>
        </span>
        <input
          type="range"
          min={1}
          max={12}
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
        />
      </label>
      <p className="muted tw-small">
        {bi(
          `Up to ${depth} question${depth === 1 ? '' : 's'} per forecast → at most ${2 ** depth} end groups.`,
          `প্রতি পূর্বাভাসে সর্বোচ্চ ${num(depth)}টি প্রশ্ন → সর্বোচ্চ ${num(2 ** depth)}টি শেষ দল।`,
        )}
      </p>
      <button type="button" className="btn" disabled={typeof growing === 'number'} onClick={grow}>
        ▶ {bi('Watch the tree learn', 'গাছের শেখা দেখুন')}
      </button>
    </div>
  );
}

/** The tree narrates its training, or tonight's walk through its questions. */
function TrainTalk() {
  const { bi, num } = useT();
  const pct = usePct();
  const tree = useTree((s) => s.tree);
  const growing = useTree((s) => s.growing);
  const walk = useTree((s) => s.walk);
  const tonight = useTree((s) => s.tonight);
  const test = useTree((s) => s.test);
  const train = useTree((s) => s.train);
  const bias = useTree((s) => s.bias);
  const qText = (n: TreeNode) => {
    const c = CLUE[n.f as FeatureKey];
    const q = c.q(c.cut(n.thr!));
    return bi(`${c.icon} ${c.en}: ${q[0]}`, `${c.icon} ${c.bn}: ${q[1]}`);
  };
  let text: ReactNode;
  if (walk !== null) {
    const path = pathFor(tree, rowOf(tonight));
    const i = Math.min(walk, path.length - 1);
    if (i < path.length - 1) {
      const n = path[i];
      const c = CLUE[n.f as FeatureKey];
      const v = c.val(tonight);
      const yes = rowOf(tonight)[n.f!] > n.thr!;
      text = (
        <>
          <b>{bi(`Question ${i + 1}:`, `প্রশ্ন ${num(i + 1)}:`)}</b> <span className="tw-q">{qText(n)}</span>{' '}
          {bi(`Tonight: ${v[0]} → `, `আজ রাতে: ${v[1]} → `)}
          <b>
            {yes
              ? bi('YES, I go right ↘', 'হ্যাঁ, আমি ডানে যাই ↘')
              : bi('NO, I go left ↙', 'না, আমি বামে যাই ↙')}
          </b>
        </>
      );
    } else {
      const leaf = path[path.length - 1];
      const p = leaf.pos / leaf.n;
      text = bi(
        `🏁 I land in a group of ${leaf.n} past days that answered the same way. The street flooded on ${Math.round(p * 100)}% of them, so tonight I say ${p >= 0.5 ? '⚠️ waterlogging likely' : '✓ waterlogging unlikely'}. That's all a tree does: ask, sort, and count.`,
        `🏁 আমি একই উত্তর দেওয়া ${num(leaf.n)}টি পুরোনো দিনের দলে পৌঁছেছি। তার ${pct(p)} দিনে রাস্তায় পানি জমেছিল, তাই আজ রাতে আমার উত্তর ${p >= 0.5 ? '⚠️ জলাবদ্ধতার সম্ভাবনা বেশি' : '✓ জলাবদ্ধতার সম্ভাবনা কম'}। ট্রি শুধু এটুকুই করে: প্রশ্ন করে, ভাগ করে, আর গোনে।`,
      );
    }
  } else if (growing === 0) {
    const p = tree.pos / tree.n;
    text = bi(
      `📚 I have ${tree.n} past rainy days to study. ${Math.round(p * 100)}% of them flooded. With no questions at all, my best guess would be "${p >= 0.5 ? 'flood' : 'no flood'}" every time. Let me find a better question…`,
      `📚 আমার কাছে পড়ার জন্য ${num(tree.n)}টি পুরোনো বৃষ্টির দিন আছে। এর ${pct(p)} দিনে পানি জমেছিল। কোনো প্রশ্ন না করলে আমার সেরা অনুমান হতো প্রতিবারই "${p >= 0.5 ? 'পানি জমবে' : 'পানি জমবে না'}"। দেখি এর চেয়ে ভালো প্রশ্ন পাই কি না…`,
    );
  } else if (growing === 1 && tree.f) {
    const l = tree.left!.pos / tree.left!.n;
    const r = tree.right!.pos / tree.right!.n;
    text = (
      <>
        {bi(
          '🔍 I tried all 4 clues and every possible cut-off. Best first question: ',
          '🔍 আমি ৪টি সূত্রের প্রতিটি আর সম্ভাব্য সব সীমা পরীক্ষা করেছি। সেরা প্রথম প্রশ্ন: ',
        )}
        <span className="tw-q">{qText(tree)}</span>{' '}
        {bi(
          `It splits the days into a "no" group (${Math.round(l * 100)}% flooded) and a "yes" group (${Math.round(r * 100)}% flooded). Purer groups = better guesses.`,
          `এটি দিনগুলোকে একটি "না" দলে (${pct(l)} দিনে পানি জমেছিল) আর একটি "হ্যাঁ" দলে (${pct(r)} দিনে পানি জমেছিল) ভাগ করে। দল যত বিশুদ্ধ, অনুমান তত ভালো।`,
        )}
      </>
    );
  } else if (typeof growing === 'number') {
    const fresh = questionsAt(tree, growing - 1);
    const names = [...new Set(fresh.map((x) => x.f as FeatureKey))].map((k) => CLUE[k]);
    text = bi(
      `🌱 Level ${growing}: inside each group I asked one more question (${fresh.length} new, about ${names.map((f) => f.icon + ' ' + f.en.toLowerCase()).join(', ')}). Now I have ${countLeaves(tree, growing)} groups.`,
      `🌱 ধাপ ${num(growing)}: প্রতিটি দলের ভেতরে আরও একটি করে প্রশ্ন করেছি (${num(fresh.length)}টি নতুন, ${names.map((f) => f.icon + ' ' + f.bn).join(', ')} নিয়ে)। এখন আমার ${num(countLeaves(tree, growing))}টি দল।`,
    );
  } else {
    const D = treeDepth(tree);
    const trainAcc = scoreOn(tree, train, bias);
    const testAcc = scoreOn(tree, test, bias);
    const L = countLeaves(tree);
    text = bi(
      `🎓 ${D} level${D === 1 ? '' : 's'} of questions, ${L} end groups. Practice score ${Math.round(trainAcc * 100)}%; exam on ${test.length} days I never saw: ${Math.round(testAcc * 100)}%.${L > 14 ? ' That is a lot of rules. Could you check them all?' : ' Follow the 💧 to see tonight’s path.'}`,
      `🎓 ${num(D)} ধাপ প্রশ্ন, ${num(L)}টি শেষ দল। অনুশীলনে স্কোর ${pct(trainAcc)}; যে ${num(test.length)}টি দিন আমি কখনো দেখিনি তার পরীক্ষায়: ${pct(testAcc)}।${L > 14 ? ' অনেক নিয়ম। আপনি কি সবগুলো যাচাই করতে পারবেন?' : ' আজ রাতের পথ দেখতে 💧 অনুসরণ করুন।'}`,
    );
  }
  return <Talk avatar="🌳">{text}</Talk>;
}

/** Share of days the tree labels the same way the records do. */
function scoreOn(tree: TreeNode, days: Day[], bias: boolean, limit = Infinity) {
  if (!days.length) return 0;
  let ok = 0;
  for (const d of days) if (predicts(leafFor(tree, rowOf(d), limit)) === labelOf(d, bias)) ok++;
  return ok / days.length;
}

function Evaluate() {
  return (
    <div className="lab-view">
      <Exam />
      <SweepCard />
    </div>
  );
}

function Exam() {
  const { bi, num } = useT();
  const pct = usePct();
  const tree = useTree((s) => s.tree);
  const train = useTree((s) => s.train);
  const test = useTree((s) => s.test);
  const bias = useTree((s) => s.bias);
  const a = scoreOn(tree, train, bias);
  const b = scoreOn(tree, test, bias);
  const cm = [
    [0, 0],
    [0, 0],
  ];
  for (const d of test) cm[labelOf(d, bias)][predicts(leafFor(tree, rowOf(d)))]++;
  const N = test.length || 1;
  const trPos = train.filter((d) => labelOf(d, bias)).length / (train.length || 1);
  const base = test.filter((d) => labelOf(d, bias) === (trPos >= 0.5 ? 1 : 0)).length / N;
  const guess = trPos >= 0.5 ? bi('flood', 'পানি জমবে') : bi('no flood', 'পানি জমবে না');
  const verdict =
    a - b > 0.08
      ? bi(
          `😬 Practice ${Math.round(a * 100)}%, but exam only ${Math.round(b * 100)}%. I memorised my study pile instead of learning rules that work on new days.`,
          `😬 অনুশীলনে ${pct(a)}, কিন্তু পরীক্ষায় মাত্র ${pct(b)}। আমি নতুন দিনে কাজ করে এমন নিয়ম শিখিনি, পড়ার স্তূপ মুখস্থ করেছি।`,
        )
      : b < base + 0.05
        ? bi(
            `🤔 Exam ${Math.round(b * 100)}%. Just always saying "${guess}" would score ${Math.round(base * 100)}%. I haven't learned much yet.`,
            `🤔 পরীক্ষায় ${pct(b)}। সবসময় "${guess}" বললেও ${pct(base)} পাওয়া যেত। আমি এখনো তেমন কিছু শিখিনি।`,
          )
        : bi(
            `👍 Exam ${Math.round(b * 100)}%, close to my practice score. My rules work on days I've never seen. (Always guessing "${guess}" would only get ${Math.round(base * 100)}%.)`,
            `👍 পরীক্ষায় ${pct(b)}, অনুশীলনের স্কোরের কাছাকাছি। আমার নিয়ম অদেখা দিনেও কাজ করে। (সবসময় "${guess}" বললে মাত্র ${pct(base)} হতো।)`,
          );
  const ring = (v: number, cls: string, label: ReactNode) => (
    <div className={`tw-ring ${cls}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="bg" cx="60" cy="60" r="50" />
        <circle
          className="fg"
          cx="60"
          cy="60"
          r="50"
          style={{ strokeDashoffset: (314.16 * (1 - v)).toFixed(1) }}
        />
      </svg>
      <span className="tw-ring-v">{pct(v)}</span>
      <span className="tw-ring-k">{label}</span>
    </div>
  );
  const tiles: [string, string, number, string][] = [
    ['good', bi('✅ Warned, and it flooded', '✅ সতর্ক করেছে, পানিও জমেছে'), cm[1][1], ''],
    [
      'bad worst',
      bi('😱 Flooded, with NO warning', '😱 পানি জমেছে, কোনো সতর্কতা ছাড়াই'),
      cm[1][0],
      bi('the dangerous mistake', 'বিপজ্জনক ভুল'),
    ],
    [
      'bad',
      bi('🔔 False alarm', '🔔 ভুল সতর্কতা'),
      cm[0][1],
      bi('annoying, not dangerous', 'বিরক্তিকর, বিপজ্জনক নয়'),
    ],
    ['good', bi('😌 Calm, and it stayed dry', '😌 সতর্কতা নেই, পানিও জমেনি'), cm[0][0], ''],
  ];
  return (
    <Card title={bi('The exam: test on days the tree never saw', 'পরীক্ষা: গাছ যে দিনগুলো কখনো দেখেনি')}>
      <div className="lab-cols">
        <div className="lab-view">
          <div className="tw-rings">
            {ring(a, 'tr', <>📚 {bi('Practice score (study pile)', 'অনুশীলনের স্কোর (পড়ার স্তূপ)')}</>)}
            {ring(b, 'te', <>📝 {bi('Exam score (never seen)', 'পরীক্ষার স্কোর (অদেখা)')}</>)}
          </div>
          <Talk avatar="🌳">{verdict}</Talk>
        </div>
        <div className="tw-tiles">
          {tiles.map(([cls, title, v, note]) => (
            <div key={title} className={`tw-tile ${cls}`}>
              <span className="tw-tile-t">{title}</span>
              <span className="tw-tile-n">{num(v)}</span>
              <span className="tw-tile-bar">
                <i style={{ width: `${(v / N) * 100}%` }} />
              </span>
              {note && <span className="tw-tile-note">{note}</span>}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function SweepCard() {
  const { bi, num } = useT();
  const sweep = useTree((s) => s.sweep);
  const depth = useTree((s) => s.depth);
  const { runSweep, setDepth } = useTree.getState();
  if (!sweep)
    return (
      <Card title={bi('Is deeper always better?', 'গভীর মানেই কি ভালো?')}>
        <button type="button" className="btn" onClick={runSweep}>
          📈 {bi('Try every depth', 'সব গভীরতা পরীক্ষা')}
        </button>
      </Card>
    );
  const W = 640;
  const H = 250;
  const P = { l: 46, r: 18, t: 26, b: 34 };
  const xs = (d: number) => P.l + ((d - 1) / 11) * (W - P.l - P.r);
  const ys = (v: number) => H - P.b - ((Math.max(0.5, v) - 0.5) / 0.5) * (H - P.t - P.b);
  let best = 0;
  sweep.test.forEach((v, i) => {
    if (v > sweep.test[best] + 1e-9) best = i;
  });
  const line = (vals: number[]) =>
    vals.map((v, i) => `${i ? 'L' : 'M'}${xs(i + 1).toFixed(1)},${ys(v).toFixed(1)}`).join('');
  return (
    <Card title={bi('Every depth, same study and exam piles', 'সব গভীরতা, একই পড়া ও পরীক্ষার স্তূপ')}>
      <svg
        className="lab-chart tw-sweep"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={bi(
          'Practice and exam score for tree depths 1 to 12',
          'ট্রির গভীরতা ১ থেকে ১২-এর অনুশীলন ও পরীক্ষার স্কোর',
        )}
      >
        <rect
          className="zone"
          x={xs(best + 1)}
          y={P.t}
          width={W - P.r - xs(best + 1)}
          height={H - P.t - P.b}
        />
        <text x={W - P.r - 6} y={P.t + 16} textAnchor="end">
          📖🤯 {bi('memorising zone', 'মুখস্থের এলাকা')}
        </text>
        {[0.5, 0.6, 0.7, 0.8, 0.9, 1].map((v) => (
          <g key={v}>
            <line className="axis" x1={P.l} x2={W - P.r} y1={ys(v)} y2={ys(v)} strokeDasharray="3 4" />
            <text x={P.l - 6} y={ys(v) + 4} textAnchor="end">
              {num(Math.round(v * 100))}%
            </text>
          </g>
        ))}
        {Array.from({ length: 12 }, (_, i) => i + 1).map((d) => (
          <text key={d} x={xs(d)} y={H - P.b + 16} textAnchor="middle">
            {num(d)}
          </text>
        ))}
        <text x={(P.l + W - P.r) / 2} y={H - 2} textAnchor="middle">
          {bi('questions deep (tree depth) →', 'প্রশ্নের গভীরতা (ট্রির গভীরতা) →')}
        </text>
        <line x1={xs(depth)} x2={xs(depth)} y1={P.t} y2={H - P.b} className="now" />
        <text x={xs(depth)} y={P.t - 8} textAnchor="middle">
          👉 {bi('your tree', 'আপনার ট্রি')}
        </text>
        <path
          d={line(sweep.train)}
          fill="none"
          strokeWidth={2.5}
          style={{ stroke: 'var(--ink-2)' }}
          strokeDasharray="6 5"
        />
        <path d={line(sweep.test)} fill="none" strokeWidth={3} style={{ stroke: 'var(--accent)' }} />
        {sweep.test.map((v, i) => (
          <circle
            key={i}
            cx={xs(i + 1)}
            cy={ys(v)}
            r={i === best ? 7 : 3.5}
            style={{ fill: 'var(--accent)' }}
          />
        ))}
        <text x={xs(best + 1)} y={ys(sweep.test[best]) + 22} textAnchor="middle">
          ⭐ {bi('sweet spot', 'সেরা জায়গা')}
        </text>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((d) => (
          <rect
            key={d}
            className="hit"
            x={xs(d) - 20}
            y={P.t}
            width={40}
            height={H - P.t - P.b}
            onClick={() => setDepth(d)}
          >
            <title>{bi(`depth ${d}`, `গভীরতা ${num(d)}`)}</title>
          </rect>
        ))}
      </svg>
      <figcaption className="lab-legend">
        <span>
          <i style={{ background: 'var(--ink-2)' }} />
          📚 {bi('practice (study pile)', 'অনুশীলন (পড়ার স্তূপ)')}
        </span>
        <span>
          <i style={{ background: 'var(--accent)' }} />
          📝 {bi('exam (never seen)', 'পরীক্ষা (অদেখা)')}
        </span>
        <span>{bi('Click a depth to try it.', 'চেষ্টা করতে একটি গভীরতায় ক্লিক করুন।')}</span>
      </figcaption>
    </Card>
  );
}

function BreakIt() {
  const { bi } = useT();
  const bias = useTree((s) => s.bias);
  const { setDepth, setSplit, setBias, runSweep, reset } = useTree.getState();
  return (
    <div className="lab-view">
      <div className="lab-row">
        <span className="rt-spacer" />
        <button type="button" className="btn small ghost" onClick={reset}>
          ↺ {bi('Back to normal', 'স্বাভাবিকে ফেরাও')}
        </button>
      </div>
      <div className="lab-cols">
        <Callout
          kind="break"
          title={bi('A. Overfitting: memorising, not learning', 'ক. ওভারফিটিং: শেখা নয়, মুখস্থ')}
        >
          <p>
            {bi(
              'Let the tree ask 12 questions deep. Its practice score climbs towards 100%, but the exam score falls.',
              'গাছকে ১২ ধাপ গভীর প্রশ্ন করতে দিন। অনুশীলনের স্কোর ১০০%-এর দিকে যায়, কিন্তু পরীক্ষার স্কোর কমে।',
            )}
          </p>
          <button
            type="button"
            className="btn small warn"
            onClick={() => {
              setDepth(12);
              runSweep();
            }}
          >
            🧪 {bi('Try it: depth 12', 'করে দেখুন: গভীরতা ১২')}
          </button>
        </Callout>
        <Callout kind="break" title={bi('B. Too few examples', 'খ. খুব কম উদাহরণ')}>
          <p>
            {bi(
              'Give the tree only 40 days to study. Rules found in a handful of examples rarely hold on new days.',
              'গাছকে মাত্র ৪০টি দিন পড়তে দিন। অল্প কয়েকটি উদাহরণে পাওয়া নিয়ম নতুন দিনে খুব কমই খাটে।',
            )}
          </p>
          <button type="button" className="btn small warn" onClick={() => setSplit(5)}>
            🧪 {bi('Try it: study 40 days', 'করে দেখুন: ৪০টি দিন পড়ুক')}
          </button>
        </Callout>
      </div>
      <Exam />
      <Card
        title={bi(
          'C. Biased records: the floods nobody wrote down',
          'গ. পক্ষপাতদুষ্ট রেকর্ড: যে বন্যা কেউ লেখেনি',
        )}
      >
        <label className="tw-switch">
          <input type="checkbox" checked={bias} onChange={(e) => setBias(e.target.checked)} />
          <span>
            {bi(
              '70% of floods in informal settlements were never reported',
              'অনানুষ্ঠানিক বসতির ৭০% বন্যা কখনো জানানো হয়নি',
            )}
          </span>
        </label>
        <Reality />
      </Card>
    </div>
  );
}

/** Of the test days that really flooded, how many did the tree warn, by area type? */
function Reality() {
  const { bi, num } = useT();
  const pct = usePct();
  const tree = useTree((s) => s.tree);
  const test = useTree((s) => s.test);
  const bias = useTree((s) => s.bias);
  const grp = (inf: number) => {
    const real = test.filter((d) => d.inf === inf && d.truth);
    const marks = real.map((d) => predicts(leafFor(tree, rowOf(d))) === 1);
    const w = marks.filter(Boolean).length;
    return { n: real.length, w, p: real.length ? w / real.length : 0, marks };
  };
  const a = grp(1);
  const b = grp(0);
  const group = (title: ReactNode, g: typeof a) => (
    <div className="tw-grp">
      <div className="tw-grp-h">
        <span>{title}</span>
        <b>
          {bi(
            `${Math.round(g.p * 100)}% warned (${g.w}/${g.n})`,
            `${pct(g.p)} সতর্ক (${num(g.w)}/${num(g.n)})`,
          )}
        </b>
      </div>
      <div className="tw-hs">
        {g.marks.map((m, i) => (
          <i key={i} className={m ? 'w' : 'm'} />
        ))}
      </div>
    </div>
  );
  return (
    <div className="lab-cols">
      <div className="lab-view">
        <p className="muted tw-small">
          {bi(
            'Each square is an exam day that really flooded. Filled = the tree warned; hollow = no warning.',
            'প্রতিটি বর্গ একটি পরীক্ষার দিন, যেদিন আসলেই পানি জমেছিল। ভরাট = ট্রি সতর্ক করেছে; ফাঁপা = কোনো সতর্কতা নেই।',
          )}
        </p>
        {group(<>🏚️ {bi('Informal settlements', 'অনানুষ্ঠানিক বসতি')}</>, a)}
        {group(<>🏢 {bi('Planned areas', 'পরিকল্পিত এলাকা')}</>, b)}
      </div>
      <div className="lab-view">
        {bias && (
          <Talk
            avatar="🧕"
            who={bi('Amena, lives in an informal settlement', 'আমেনা, অনানুষ্ঠানিক বসতির বাসিন্দা')}
          >
            {bi(
              'Water came into our homes again and again. We complained, nobody came, so we stopped reporting.',
              'বারবার আমাদের ঘরে পানি ঢুকেছে। অভিযোগ করেছি, কেউ আসেনি, তাই আর জানাই না।',
            )}
          </Talk>
        )}
        <Talk avatar="🌳" who={bi('The tree', 'ট্রি')}>
          {bias
            ? bi(
                `My records say informal settlements rarely flood, so I warned only ${Math.round(a.p * 100)}% of the ones that really flooded (planned areas: ${Math.round(b.p * 100)}%). I only know what was written down.`,
                `আমার রেকর্ড বলছে অনানুষ্ঠানিক বসতিতে কম পানি জমে, তাই যেগুলোতে আসলেই পানি জমেছিল তার মাত্র ${pct(a.p)} আমি সতর্ক করেছি (পরিকল্পিত এলাকা: ${pct(b.p)})। যা লেখা হয়েছে, আমি শুধু সেটুকুই জানি।`,
              )
            : bi(
                `With complete records I warned ${Math.round(a.p * 100)}% of informal streets and ${Math.round(b.p * 100)}% of planned streets that really flooded. Now flip the switch.`,
                `সম্পূর্ণ রেকর্ড থাকায় যেসব রাস্তায় আসলেই পানি জমেছিল তার মধ্যে অনানুষ্ঠানিক বসতির ${pct(a.p)} আর পরিকল্পিত এলাকার ${pct(b.p)} আমি সতর্ক করেছি। এবার সুইচটি চালু করুন।`,
              )}
        </Talk>
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
              'The machine found the rules itself, from examples.',
              'যন্ত্র উদাহরণ থেকে নিজেই নিয়ম খুঁজে পেয়েছে।',
            )}
          </b>{' '}
          {bi(
            'A shallow tree is readable and can be checked by people. Too deep and it memorises; too little data and it guesses. And it can only learn what was written down: unreported floods become "dry" days, and the people already left out get fewer warnings.',
            'অগভীর ট্রি পড়া যায় এবং মানুষ যাচাই করতে পারে। খুব গভীর হলে মুখস্থ করে; ডেটা খুব কম হলে আন্দাজ করে। আর যা লেখা হয়েছে সে শুধু তা-ই শিখতে পারে: না-জানানো বন্যা "শুকনো" দিন হয়ে যায়, আর যারা আগে থেকেই বাদ পড়েছেন তারা কম সতর্কবার্তা পান।',
          )}
        </p>
      </Callout>
      <Tonight compact />
    </div>
  );
}
