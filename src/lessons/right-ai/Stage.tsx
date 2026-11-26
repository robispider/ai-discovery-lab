import { useMemo } from 'react';
import { DEFAULT_RULES, DEPT_KEYS, DEPTS, type DeptId } from '../../data/complaints';
import { accuracy, timeIt } from '../../engines/metrics';
import { applyRules } from '../../engines/rules';
import { predictNB } from '../../engines/text';
import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Bars, Callout, Card, Pill, Stat, Stats } from '../kit';
import { ALL, HARD, nbPredict, POOL, rulesPredict, TEST, useRightAi } from './store';
import './right-ai.css';

function useDeptName() {
  const { pick, bi } = useT();
  return (d: DeptId | null) => (d ? `${DEPTS[d].icon} ${pick(DEPTS[d])}` : `❓ ${bi('none', 'কোনোটি নয়')}`);
}

function useFmtMs() {
  const { num } = useT();
  return (ms: number) =>
    ms < 1 ? '< 1 ms' : ms < 1000 ? `${num(Math.round(ms))} ms` : `${num((ms / 1000).toFixed(1))} s`;
}

export function RightAiStage() {
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
  const { bi } = useT();
  const approaches = [
    {
      name: bi('Rules', 'নিয়ম'),
      from: bi('Lesson 2', 'পাঠ ২'),
      body: bi(
        'A person writes keyword rules. No data needed.',
        'একজন মানুষ কীওয়ার্ড নিয়ম লেখেন। ডেটা লাগে না।',
      ),
    },
    {
      name: bi('Machine learning', 'মেশিন লার্নিং'),
      from: bi('Naive Bayes', 'নাইভ বেইজ'),
      body: bi(
        'Learns which words go with which department from labelled past complaints.',
        'লেবেলযুক্ত পুরোনো অভিযোগ থেকে শেখে কোন শব্দ কোন বিভাগের সাথে যায়।',
      ),
    },
    {
      name: bi('Local LLM', 'লোকাল LLM'),
      from: bi('Optional', 'ঐচ্ছিক'),
      body: bi(
        'A general language model given only an instruction. Big, slower, runs on this laptop.',
        'শুধু নির্দেশনা দেওয়া একটি সাধারণ ভাষা মডেল। বড়, ধীর, এই ল্যাপটপেই চলে।',
      ),
    },
  ];
  return (
    <div className="lab-view">
      <p className="lab-lead">
        {bi(
          'One task, several approaches, the same test complaints. Which is most accurate? Fastest? Cheapest? Easiest to explain to a citizen or an auditor?',
          'একটি কাজ, কয়েকটি পদ্ধতি, একই টেস্ট অভিযোগ। কোনটি সবচেয়ে নির্ভুল? দ্রুততম? সবচেয়ে সস্তা? নাগরিক বা নিরীক্ষকের কাছে ব্যাখ্যা করা সবচেয়ে সহজ কোনটি?',
        )}
      </p>
      <div className="lab-cols">
        {approaches.map((a) => (
          <Card key={a.name} title={a.name} aside={<Pill>{a.from}</Pill>}>
            <p className="muted">{a.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Explore() {
  const { bi, num } = useT();
  const name = useDeptName();
  return (
    <div className="lab-view">
      <Stats>
        <Stat label={bi('Labelled complaints', 'লেবেলযুক্ত অভিযোগ')} value={num(ALL.length)} />
        <Stat label={bi('Held back: standard test', 'আলাদা রাখা: সাধারণ টেস্ট')} value={num(TEST.length)} />
        <Stat label={bi('Hard test', 'কঠিন টেস্ট')} value={num(HARD.length)} />
        <Stat label={bi('Departments', 'বিভাগ')} value={num(DEPT_KEYS.length)} />
      </Stats>
      <Card
        title={bi('A few training complaints', 'কয়েকটি প্রশিক্ষণ অভিযোগ')}
        aside={<Pill tone="warn">{bi('Synthetic data', 'কৃত্রিম ডেটা')}</Pill>}
      >
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th>{bi('Complaint', 'অভিযোগ')}</th>
                <th>{bi('Correct department', 'সঠিক বিভাগ')}</th>
              </tr>
            </thead>
            <tbody>
              {POOL.slice(0, 6).map((r) => (
                <tr key={r.text}>
                  <td>{r.text}</td>
                  <td>{name(r.dept)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <HardTable />
    </div>
  );
}

function Train() {
  const { bi } = useT();
  return (
    <div className="lab-view">
      <div className="lab-cols">
        <Card title={bi('Training data for machine learning', 'মেশিন লার্নিংয়ের প্রশিক্ষণ ডেটা')}>
          <TrainSlider />
          <WordsLearned />
        </Card>
        <TryComplaint />
      </div>
    </div>
  );
}

function Evaluate() {
  return (
    <div className="lab-view">
      <Results />
      <HardTable withPreds />
    </div>
  );
}

function BreakIt() {
  const { bi } = useT();
  return (
    <div className="lab-view">
      <Callout kind="break">
        <p>
          {bi(
            'Reduce training examples to 12 and run again. Machine learning needs enough good labelled data; rules need none, but someone must write them. Both fail on Banglish because neither has seen it. The standard test looks much better than the hard one: a test set that is too easy flatters every model.',
            'প্রশিক্ষণ উদাহরণ ১২-তে নামিয়ে আবার চালান। মেশিন লার্নিংয়ের জন্য যথেষ্ট ভালো লেবেলযুক্ত ডেটা লাগে; নিয়মের জন্য ডেটা লাগে না, কিন্তু কাউকে নিয়মগুলো লিখতে হয়। Banglish-এ দুটোই ব্যর্থ, কারণ কেউই তা দেখেনি। সাধারণ টেস্টের ফল কঠিন টেস্টের চেয়ে অনেক ভালো: খুব সহজ টেস্ট সেট সব মডেলকেই ভালো দেখায়।',
          )}
        </p>
      </Callout>
      <Card>
        <TrainSlider />
      </Card>
      <Results />
      <HardTable withPreds />
    </div>
  );
}

function Apply() {
  const { bi } = useT();
  const checks = [
    bi('Accuracy on your own held-out complaints', 'নিজেদের আলাদা রাখা অভিযোগে নির্ভুলতা'),
    bi('Speed and cost per complaint', 'প্রতি অভিযোগে গতি ও খরচ'),
    bi('Can you explain each decision?', 'প্রতিটি সিদ্ধান্ত কি ব্যাখ্যা করা যায়?'),
    bi('Privacy: does citizen data leave the office?', 'গোপনীয়তা: নাগরিকের তথ্য কি অফিসের বাইরে যায়?'),
    bi('Who maintains it next year?', 'আগামী বছর কে এটি রক্ষণাবেক্ষণ করবে?'),
    bi('A human review path for unsure cases', 'অনিশ্চিত ক্ষেত্রে মানুষের যাচাইয়ের পথ'),
  ];
  return (
    <div className="lab-view">
      <Callout kind="lesson">
        <p>
          <b>
            {bi(
              'The most sophisticated AI is not necessarily the most appropriate AI.',
              'সবচেয়ে উন্নত এআই মানেই সবচেয়ে উপযুক্ত এআই নয়।',
            )}
          </b>{' '}
          {bi(
            'Compare accuracy and speed, cost, explainability, privacy and maintenance on your own held-out test data before choosing. And keep a human review path for complaints the system is unsure about.',
            'বেছে নেওয়ার আগে নিজেদের আলাদা রাখা টেস্ট ডেটায় নির্ভুলতা এবং গতি, খরচ, ব্যাখ্যাযোগ্যতা, গোপনীয়তা ও রক্ষণাবেক্ষণ তুলনা করুন। আর যেসব অভিযোগে সিস্টেম নিশ্চিত নয়, সেগুলোর জন্য মানুষের যাচাইয়ের পথ রাখুন।',
          )}
        </p>
      </Callout>
      <div className="lab-cols">
        <Card title={bi('Before you choose an AI system', 'এআই সিস্টেম বাছাইয়ের আগে')}>
          <ul className="ra-checks">
            {checks.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Card>
        <LocalLlm />
      </div>
    </div>
  );
}

export function TrainSlider() {
  const { bi, num } = useT();
  const ntrain = useRightAi((s) => s.ntrain);
  const model = useRightAi((s) => s.model);
  const setNtrain = useRightAi((s) => s.setNtrain);
  return (
    <label className="lab-slider">
      <span className="lab-slider-head">
        <span>{bi('Training examples for machine learning', 'মেশিন লার্নিংয়ের প্রশিক্ষণ উদাহরণ')}</span>
        <b className="mono">{num(model.N)}</b>
      </span>
      <input
        type="range"
        min={12}
        max={270}
        step={6}
        value={ntrain}
        onChange={(e) => setNtrain(Number(e.target.value))}
      />
    </label>
  );
}

/** The words the model now links most strongly to each department. */
function WordsLearned() {
  const { bi, num } = useT();
  const name = useDeptName();
  const model = useRightAi((s) => s.model);
  const top = useMemo(
    () =>
      DEPT_KEYS.map((d) => {
        const counts = model.counts[d];
        const words = Object.keys(counts)
          .filter((w) => w.length > 2)
          .sort((a, b) => counts[b] - counts[a])
          .slice(0, 5);
        return { d, words };
      }),
    [model],
  );
  return (
    <div className="ra-learned">
      <p className="muted">
        {bi(
          `Vocabulary: ${model.vocab.size} words. Most frequent words per department:`,
          `শব্দভান্ডার: ${num(model.vocab.size)}টি শব্দ। প্রতিটি বিভাগে সবচেয়ে বেশি আসা শব্দ:`,
        )}
      </p>
      {top.map(({ d, words }) => (
        <div key={d} className="ra-learned-row">
          <span>{name(d)}</span>
          <span>
            {words.map((w) => (
              <span key={w} className="ra-word">
                {w}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Rules and ML side by side on one complaint. */
function TryComplaint() {
  const { bi } = useT();
  const name = useDeptName();
  const mine = useRightAi((s) => s.mine);
  const setMine = useRightAi((s) => s.setMine);
  const model = useRightAi((s) => s.model);
  const text = mine.trim();
  const r = text ? applyRules(DEFAULT_RULES, text) : null;
  const p = text ? predictNB(model, text) : null;
  return (
    <Card title={bi('Try a complaint', 'একটি অভিযোগ লিখে দেখুন')}>
      <textarea
        value={mine}
        rows={2}
        aria-label={bi('Complaint text', 'অভিযোগের লেখা')}
        onChange={(e) => setMine(e.target.value)}
      />
      {r && p && (
        <>
          <div className="lab-cols ra-pair">
            <div>
              <span className="eyebrow">{bi('Rules', 'নিয়ম')}</span>
              <div className="lab-big ra-big">{name(r.dept)}</div>
              <p className="ra-why">
                {r.fired.length
                  ? r.fired.map((f) => (
                      <span key={f.ruleIndex}>
                        {bi('found', 'পাওয়া গেছে')} “<b>{f.word}</b>” → {name(f.dept)}
                        <br />
                      </span>
                    ))
                  : bi('no rule matched', 'কোনো নিয়ম মেলেনি')}
              </p>
            </div>
            <div>
              <span className="eyebrow">{bi('Machine learning', 'মেশিন লার্নিং')}</span>
              <div className="lab-big ra-big">{name(p.label)}</div>
              <p className="ra-why">
                {p.evidence.length ? (
                  <>
                    {bi('Words that pushed this decision: ', 'যেসব শব্দ এই সিদ্ধান্তকে প্রভাবিত করেছে: ')}
                    {p.evidence
                      .slice(0, 4)
                      .filter((e) => e.score > 0)
                      .map((e) => (
                        <span key={e.w} className="ra-word">
                          {e.w}
                        </span>
                      ))}
                  </>
                ) : (
                  bi(
                    'No known words: it is only guessing from how common each department is.',
                    'কোনো পরিচিত শব্দ নেই: শুধু কোন বিভাগ কত সাধারণ তা দেখে আন্দাজ করছে।',
                  )
                )}
              </p>
            </div>
          </div>
          <Bars
            items={DEPT_KEYS.map((d) => ({ key: d, label: name(d), value: p.probs[d] })).sort(
              (a, b) => b.value - a.value,
            )}
          />
        </>
      )}
    </Card>
  );
}

/** The comparison table on the same test sets. */
function Results() {
  const { bi, num } = useT();
  const fmtMs = useFmtMs();
  const ran = useRightAi((s) => s.ran);
  const run = useRightAi((s) => s.run);
  const model = useRightAi((s) => s.model);
  const llm = useRightAi((s) => s.llm);
  const pct = (v: number) => `${num(Math.round(v * 100))}%`;
  const rows = useMemo(() => {
    const ml = (t: string) => nbPredict(model, t);
    return [
      {
        name: bi('Rules (lesson 2)', 'নিয়ম (পাঠ ২)'),
        fn: rulesPredict,
        needs: bi(
          'An expert to write and maintain keyword rules. No training data.',
          'কীওয়ার্ড নিয়ম লেখা ও হালনাগাদ রাখার জন্য একজন বিশেষজ্ঞ। প্রশিক্ষণ ডেটা লাগে না।',
        ),
        explain: bi('Yes: exactly which rule and keyword fired.', 'হ্যাঁ: ঠিক কোন নিয়ম ও কীওয়ার্ড কাজ করেছে।'),
      },
      {
        name: bi('Machine learning (Naive Bayes)', 'মেশিন লার্নিং (নাইভ বেইজ)'),
        fn: ml,
        needs: bi(
          `Labelled past complaints (${model.N} here). Runs on any laptop.`,
          `লেবেলযুক্ত পুরোনো অভিযোগ (এখানে ${num(model.N)}টি)। যেকোনো ল্যাপটপে চলে।`,
        ),
        explain: bi('Partly: which words pushed the decision.', 'আংশিক: কোন শব্দগুলো সিদ্ধান্তকে প্রভাবিত করেছে।'),
      },
    ].map((r) =>
      ran
        ? {
            ...r,
            std: accuracy(
              TEST,
              (c) => r.fn(c.text),
              (c) => c.dept,
            ),
            hard: accuracy(
              HARD,
              (c) => r.fn(c.text),
              (c) => c.dept,
            ),
            ms: timeIt(
              r.fn,
              TEST.map((c) => c.text),
            ),
          }
        : r,
    );
  }, [bi, num, model, ran]);

  return (
    <Card
      title={bi('Results on the same test set', 'একই টেস্ট সেটে ফলাফল')}
      aside={
        <button type="button" className="btn" onClick={run}>
          ▶ {bi('Run the comparison', 'তুলনা চালাও')}
        </button>
      }
    >
      <div className="lab-table-wrap">
        <table className="lab-table ra-results">
          <thead>
            <tr>
              <th>{bi('Approach', 'পদ্ধতি')}</th>
              <th>{bi('Standard test (90)', 'সাধারণ টেস্ট (৯০)')}</th>
              <th>{bi('Hard test (10)', 'কঠিন টেস্ট (১০)')}</th>
              <th>{bi('Time for 1,000', '১,০০০টিতে সময়')}</th>
              <th>{bi('What it needs', 'যা লাগে')}</th>
              <th>{bi('Can it explain why?', 'কেন, তা ব্যাখ্যা করতে পারে?')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td>
                  <b>{r.name}</b>
                </td>
                {'std' in r ? (
                  <>
                    <td className="ra-num">{pct(r.std)}</td>
                    <td className="ra-num">{pct(r.hard)}</td>
                    <td>{fmtMs(r.ms)}</td>
                  </>
                ) : (
                  <>
                    <td>–</td>
                    <td>–</td>
                    <td>–</td>
                  </>
                )}
                <td>{r.needs}</td>
                <td>{r.explain}</td>
              </tr>
            ))}
            <tr>
              <td>
                <b>{bi('Local LLM (optional)', 'লোকাল LLM (ঐচ্ছিক)')}</b>
              </td>
              {llm ? (
                <>
                  <td className="ra-num">
                    {pct(llm.std)} <small className="muted">({num(30)})</small>
                  </td>
                  <td className="ra-num">{pct(llm.hard)}</td>
                  <td>≈ {fmtMs(llm.msPer * 1000)}</td>
                </>
              ) : (
                <td colSpan={3} className="muted">
                  {bi('Not run. See step 6.', 'চালানো হয়নি। ধাপ ৬ দেখুন।')}
                </td>
              )}
              <td>
                {bi(
                  'No task-specific training, only an instruction. A multi-GB model and a strong computer, or a paid cloud service (where citizen data leaves your office).',
                  'কাজভিত্তিক প্রশিক্ষণ লাগে না, শুধু নির্দেশনা। কয়েক GB-র মডেল ও শক্তিশালী কম্পিউটার, অথবা পেইড ক্লাউড সেবা (যেখানে নাগরিকের তথ্য অফিসের বাইরে যায়)।',
                )}
              </td>
              <td>
                {bi(
                  'It can write a reason, but the reason is generated text, not a guaranteed account of how it decided.',
                  'সে একটি কারণ লিখতে পারে, কিন্তু সেটি তৈরি করা লেখা, সিদ্ধান্ত কীভাবে নেওয়া হলো তার নিশ্চিত বিবরণ নয়।',
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function HardTable({ withPreds }: { withPreds?: boolean }) {
  const { bi } = useT();
  const name = useDeptName();
  const ran = useRightAi((s) => s.ran);
  const model = useRightAi((s) => s.model);
  const llm = useRightAi((s) => s.llm);
  const show = withPreds && ran;
  const cell = (pred: DeptId | null, truth: DeptId) => (
    <td className={pred === truth ? 'ra-ok' : 'ra-bad'}>
      {pred === truth ? '✓ ' : '✗ '}
      {name(pred)}
    </td>
  );
  return (
    <Card title={bi('The 10 hard complaints', '১০টি কঠিন অভিযোগ')}>
      <p className="muted">
        {bi(
          'Written to be difficult: mixed topics, no keywords, Banglish.',
          'ইচ্ছা করে কঠিন করে লেখা: মিশ্র বিষয়, কীওয়ার্ড নেই, Banglish।',
        )}
      </p>
      <div className="lab-table-wrap">
        <table className="lab-table">
          <thead>
            <tr>
              <th>{bi('Complaint', 'অভিযোগ')}</th>
              <th>{bi('Correct', 'সঠিক')}</th>
              {withPreds && (
                <>
                  <th>{bi('Rules', 'নিয়ম')}</th>
                  <th>ML</th>
                  {llm && <th>LLM</th>}
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {HARD.map((r, i) => (
              <tr key={r.text}>
                <td>{r.text}</td>
                <td>{name(r.dept)}</td>
                {withPreds &&
                  (show ? (
                    <>
                      {cell(rulesPredict(r.text), r.dept)}
                      {cell(nbPredict(model, r.text), r.dept)}
                    </>
                  ) : (
                    <>
                      <td>–</td>
                      <td>–</td>
                    </>
                  ))}
                {withPreds && llm && cell(llm.hardPreds[i], r.dept)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function LocalLlm() {
  const { bi, num } = useT();
  const fmtMs = useFmtMs();
  const url = useRightAi((s) => s.llmUrl);
  const model = useRightAi((s) => s.llmModel);
  const status = useRightAi((s) => s.llmStatus);
  const error = useRightAi((s) => s.llmError);
  const busy = useRightAi((s) => s.llmBusy);
  const { setLlm, runLlm } = useRightAi.getState();
  let message = status;
  if (!error && status.startsWith('ok:')) {
    const [, n, ms] = status.split(':');
    message = `✅ ${bi(`Done. ${n} complaints in ${fmtMs(Number(ms))}.`, `সম্পন্ন। ${num(n)}টি অভিযোগে ${fmtMs(Number(ms))}।`)}`;
  }
  return (
    <Card title={bi('Optional: add a local LLM', 'ঐচ্ছিক: লোকাল LLM যোগ করুন')}>
      <p className="muted">
        {bi(
          'Runs on this laptop with Ollama: no cloud, no API key. Pull a small model beforehand (e.g. ollama pull qwen2.5:3b) and open the lab from this computer, not from the website.',
          'Ollama দিয়ে এই ল্যাপটপেই চলে: ক্লাউড বা API কী লাগে না। আগে থেকে একটি ছোট মডেল নামিয়ে রাখুন (যেমন ollama pull qwen2.5:3b) এবং ল্যাবটি ওয়েবসাইট থেকে নয়, এই কম্পিউটার থেকে খুলুন।',
        )}
      </p>
      <div className="lab-row">
        <input
          type="text"
          className="lab-input ra-url"
          value={url}
          aria-label={bi('Ollama address', 'Ollama ঠিকানা')}
          onChange={(e) => setLlm({ llmUrl: e.target.value })}
        />
        <input
          type="text"
          className="lab-input ra-model"
          value={model}
          aria-label={bi('Model name', 'মডেলের নাম')}
          onChange={(e) => setLlm({ llmModel: e.target.value })}
        />
      </div>
      <div className="lab-row">
        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() =>
            runLlm((d, t) =>
              bi(`Asking the LLM… ${d} / ${t}`, `LLM-কে জিজ্ঞেস করা হচ্ছে… ${num(d)} / ${num(t)}`),
            )
          }
        >
          ▶ {bi('Run LLM on hard + 30 standard', 'কঠিন + ৩০টি সাধারণে LLM চালাও')}
        </button>
      </div>
      {message && (
        <p className={error ? 'ra-llm-error' : 'ra-llm-status'} aria-live="polite">
          {error ? (
            <>
              ⚠️{' '}
              {bi(
                'Could not reach the local model. Is Ollama running and the model pulled? ',
                'লোকাল মডেলে পৌঁছানো যায়নি। Ollama কি চালু আছে এবং মডেল নামানো আছে? ',
              )}
              <small className="muted">{message}</small>
            </>
          ) : (
            message
          )}
        </p>
      )}
    </Card>
  );
}
