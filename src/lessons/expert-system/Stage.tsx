import { useMemo } from 'react';
import { DEPT_KEYS, DEPTS, SAMPLES, type DeptId } from '../../data/complaints';
import { applyRules, type RuleResult } from '../../engines/rules';
import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Callout, Card, Highlight, Pill, Stat, Stats } from '../kit';
import { EASY, toRules, TRICKY, useExpert } from './store';
import './expert.css';

function useDeptName() {
  const { pick } = useT();
  return (d: DeptId) => `${DEPTS[d].icon} ${pick(DEPTS[d])}`;
}

function useResult(): RuleResult<DeptId> | null {
  const rules = useExpert((s) => s.rules);
  const text = useExpert((s) => s.text);
  return useMemo(() => (text.trim() ? applyRules(toRules(rules), text) : null), [rules, text]);
}

export function ExpertStage() {
  const step = useLab((s) => s.step);
  switch (step) {
    case 'understand':
      return <Understand />;
    case 'explore':
      return <Explore />;
    case 'train':
      return <WriteRules />;
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
  const name = useDeptName();
  return (
    <div className="lab-view">
      <div className="ex-flow" aria-label={bi('How a complaint is routed', 'অভিযোগ কীভাবে পাঠানো হয়')}>
        <div className="ex-flow-box">
          <span className="eyebrow">{bi('Input', 'ইনপুট')}</span>
          <b>{bi('Citizen complaint', 'নাগরিকের অভিযোগ')}</b>
          <span className="muted">“{SAMPLES[2].text}”</span>
        </div>
        <span className="ex-flow-arrow" aria-hidden="true">
          →
        </span>
        <div className="ex-flow-box rules">
          <span className="eyebrow">{bi('Knowledge base', 'জ্ঞানভান্ডার')}</span>
          <b>{bi('IF word … THEN department', 'যদি শব্দ … তবে বিভাগ')}</b>
          <span className="muted">
            {bi('Written by a person, checked in order', 'মানুষের লেখা, ক্রম অনুযায়ী যাচাই')}
          </span>
        </div>
        <span className="ex-flow-arrow" aria-hidden="true">
          →
        </span>
        <div className="ex-flow-box out">
          <span className="eyebrow">{bi('Decision', 'সিদ্ধান্ত')}</span>
          <b>{name('road')}</b>
          <span className="muted">{bi('…and the rule that decided it', '…এবং যে নিয়মে সিদ্ধান্ত হলো')}</span>
        </div>
      </div>
      <Card title={bi('Six departments receive complaints', 'ছয়টি বিভাগ অভিযোগ গ্রহণ করে')}>
        <div className="ex-depts">
          {DEPT_KEYS.map((d) => (
            <span key={d} className="ex-dept">
              {name(d)}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Explore() {
  const { bi } = useT();
  const name = useDeptName();
  const setText = useExpert((s) => s.setText);
  const setStep = useLab((s) => s.setStep);
  return (
    <div className="lab-view">
      <Card
        title={bi('Complaints arriving at the ward office', 'ওয়ার্ড অফিসে আসা অভিযোগ')}
        aside={<Pill tone="warn">{bi('Synthetic examples', 'কৃত্রিম উদাহরণ')}</Pill>}
      >
        <p className="muted">
          {bi(
            'Some are in Bangla, some in English. Which words tell you the department? Pick one to route it.',
            'কিছু বাংলায়, কিছু ইংরেজিতে। কোন শব্দ দেখে বিভাগ বোঝা যায়? একটি বেছে নিয়ে পাঠান।',
          )}
        </p>
        <div className="lab-table-wrap">
          <table className="lab-table">
            <thead>
              <tr>
                <th>{bi('Complaint', 'অভিযোগ')}</th>
                <th>{bi('Should go to', 'যাওয়া উচিত')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {EASY.map((s) => (
                <tr key={s.text}>
                  <td>{s.text}</td>
                  <td>{name(s.dept)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn small ghost"
                      onClick={() => {
                        setText(s.text);
                        setStep('evaluate');
                      }}
                    >
                      {bi('Route', 'পাঠান')} →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function WriteRules() {
  const { bi } = useT();
  return (
    <div className="lab-view">
      <Card title={bi('Knowledge base (rules)', 'জ্ঞানভান্ডার (নিয়মসমূহ)')}>
        <p className="muted">
          {bi(
            'Keywords are separated by commas. Edit them live. Rule 1 has the highest priority; use the arrows to change the order.',
            'কীওয়ার্ডগুলো কমা দিয়ে আলাদা। সরাসরি বদলান। ১ নম্বর নিয়মের অগ্রাধিকার সবচেয়ে বেশি; তীর দিয়ে ক্রম বদলান।',
          )}
        </p>
        <RuleEditor />
      </Card>
      <Router compact />
    </div>
  );
}

function Evaluate() {
  const { bi } = useT();
  return (
    <div className="lab-view">
      <div className="lab-cols">
        <Router />
        <Card title={bi('Rules that matched', 'যে নিয়মগুলো মিলেছে')}>
          <RuleList />
        </Card>
      </div>
      <TestAll />
    </div>
  );
}

function BreakIt() {
  const { bi } = useT();
  const setText = useExpert((s) => s.setText);
  const text = useExpert((s) => s.text);
  return (
    <div className="lab-view">
      <Card title={bi('Tricky complaints', 'জটিল অভিযোগ')}>
        <div className="lab-row">
          {TRICKY.map((s) => (
            <button
              key={s.text}
              type="button"
              className="chip-btn brk"
              aria-pressed={text === s.text}
              onClick={() => setText(s.text)}
            >
              {s.text}
            </button>
          ))}
        </div>
      </Card>
      <div className="lab-cols">
        <Router />
        <Card title={bi('Rules that matched', 'যে নিয়মগুলো মিলেছে')}>
          <RuleList />
        </Card>
      </div>
      <Callout kind="break">
        {bi(
          '"রাস্তার বাতি" (street light) contains the word "রাস্তা" (road), so the Roads rule fires first. A smell complaint with no keyword matches nothing. Banglish spelling defeats every rule. Can you fix these by editing the rules (step 3)? Does each fix break something else?',
          '"রাস্তার বাতি" কথাটিতে "রাস্তা" শব্দটি আছে, তাই সড়ক বিভাগের নিয়ম আগে কাজ করে। কীওয়ার্ডহীন দুর্গন্ধের অভিযোগ কোনো নিয়মে মেলে না। ইংরেজি হরফে লেখা বাংলা (Banglish) সব নিয়মকে হারিয়ে দেয়। নিয়ম বদলে (ধাপ ৩) এগুলো ঠিক করতে পারবেন? প্রতিটি সংশোধন কি অন্য কিছু ভেঙে দেয়?',
        )}
      </Callout>
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
              'A human supplies the knowledge; the computer applies it.',
              'জ্ঞান দেয় মানুষ; কম্পিউটার তা প্রয়োগ করে।',
            )}
          </b>{' '}
          {bi(
            'Rules are transparent and easy to audit: you can always say why a decision was made. But they are brittle, and someone must write and maintain every rule. In lesson 3 the machine will learn rules from examples instead.',
            'নিয়ম স্বচ্ছ ও সহজে নিরীক্ষণযোগ্য: সিদ্ধান্ত কেন হলো তা সবসময় বলা যায়। কিন্তু নিয়ম ভঙ্গুর, এবং প্রতিটি নিয়ম কাউকে লিখতে ও হালনাগাদ রাখতে হয়। ৩ নম্বর পাঠে যন্ত্র উদাহরণ থেকে নিজেই নিয়ম শিখবে।',
          )}
        </p>
      </Callout>
      <div className="lab-cols">
        <Router
          title={bi('Write a complaint from your own ward', 'আপনার ওয়ার্ডের একটি অভিযোগ লিখুন')}
          placeholder={bi(
            'e.g. The drain near the school overflows every evening',
            'যেমন: স্কুলের পাশের ড্রেন প্রতি সন্ধ্যায় উপচে পড়ে',
          )}
        />
        <Card title={bi('Where rule systems are still the right tool', 'যেখানে নিয়মভিত্তিক সিস্টেমই সঠিক')}>
          <ul className="ex-list">
            <li>
              {bi(
                'Eligibility checks with a written policy (allowances, licences)',
                'লিখিত নীতিমালার যোগ্যতা যাচাই (ভাতা, লাইসেন্স)',
              )}
            </li>
            <li>
              {bi(
                'Safety limits that must never be learned away',
                'নিরাপত্তার সীমা, যা কখনো শেখার মাধ্যমে বদলানো যাবে না',
              )}
            </li>
            <li>
              {bi(
                'Any decision you must explain to a citizen or an auditor',
                'যে সিদ্ধান্ত নাগরিক বা নিরীক্ষককে ব্যাখ্যা করতে হয়',
              )}
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

/** Complaint box, decision and the trace of which rules fired. */
function Router({
  compact,
  title,
  placeholder,
}: {
  compact?: boolean;
  title?: string;
  placeholder?: string;
}) {
  const { bi, num } = useT();
  const name = useDeptName();
  const text = useExpert((s) => s.text);
  const setText = useExpert((s) => s.setText);
  const result = useResult();

  return (
    <Card title={title ?? bi('Citizen complaint', 'নাগরিকের অভিযোগ')}>
      <textarea
        value={text}
        placeholder={placeholder}
        aria-label={bi('Complaint text', 'অভিযোগের লেখা')}
        rows={compact ? 2 : 3}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="ex-decision" aria-live="polite">
        <span className="eyebrow">{bi('Decision', 'সিদ্ধান্ত')}</span>
        {!result ? (
          <span className="lab-big">–</span>
        ) : result.dept ? (
          <span className="lab-big">{name(result.dept)}</span>
        ) : (
          <span className="lab-big ex-none">
            ❓ {bi('No rule matched: manual review desk', 'কোনো নিয়ম মেলেনি: হাতে-কলমে যাচাইয়ের ডেস্কে')}
          </span>
        )}
      </div>
      {result && !compact && (
        <>
          {result.dept ? (
            <>
              <p className="ex-text">
                <Highlight text={text} words={result.fired.map((f) => f.word)} />
              </p>
              <ol className="ex-trace">
                {result.fired.map((f, k) => (
                  <li key={f.ruleIndex}>
                    {bi('Rule', 'নিয়ম')} {num(f.ruleIndex + 1)}{' '}
                    {bi('fired because it found', 'কাজ করেছে কারণ পাওয়া গেছে')} “<b>{f.word}</b>” →{' '}
                    {name(f.dept)}{' '}
                    {k === 0 ? (
                      <Pill tone="ok">{bi('used (highest priority)', 'গৃহীত (সর্বোচ্চ অগ্রাধিকার)')}</Pill>
                    ) : (
                      <Pill>{bi('ignored', 'উপেক্ষিত')}</Pill>
                    )}
                  </li>
                ))}
              </ol>
              {result.conflict && (
                <p className="ex-conflict">
                  ⚠️{' '}
                  {bi(
                    'Conflict: rules point to different departments. Only rule order decides.',
                    'দ্বন্দ্ব: নিয়মগুলো ভিন্ন ভিন্ন বিভাগ দেখাচ্ছে। শুধু নিয়মের ক্রমই সিদ্ধান্ত নিচ্ছে।',
                  )}
                </p>
              )}
            </>
          ) : (
            <p className="muted">
              {bi(
                'The system has no knowledge about this complaint. It cannot guess.',
                'এই অভিযোগ সম্পর্কে সিস্টেমের কোনো জ্ঞান নেই। সে আন্দাজ করতে পারে না।',
              )}
            </p>
          )}
        </>
      )}
    </Card>
  );
}

/** Read-only rule list with the matching rules lit up. */
function RuleList() {
  const { bi, num } = useT();
  const name = useDeptName();
  const rules = useExpert((s) => s.rules);
  const result = useResult();
  return (
    <ol className="ex-rules readonly">
      {rules.map((r, i) => {
        const fired = result?.fired.some((f) => f.ruleIndex === i);
        const winner = result?.fired[0]?.ruleIndex === i;
        return (
          <li key={i} className={winner ? 'winner' : fired ? 'fired' : undefined}>
            <span className="ex-no mono">{num(i + 1)}</span>
            <span className="ex-words">
              {bi('IF', 'যদি')} <i>{r.input || '…'}</i>
            </span>
            <span className="ex-then">→ {name(r.dept)}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** The editable knowledge base. */
export function RuleEditor() {
  const { bi, num } = useT();
  const name = useDeptName();
  const rules = useExpert((s) => s.rules);
  const { setWords, setDept, deleteRule, moveRule, addRule, restoreRules } = useExpert.getState();
  const result = useResult();
  return (
    <>
      <ol className="ex-rules">
        {rules.map((r, i) => {
          const fired = result?.fired.some((f) => f.ruleIndex === i);
          const winner = result?.fired[0]?.ruleIndex === i;
          return (
            <li key={i} className={winner ? 'winner' : fired ? 'fired' : undefined}>
              <span className="ex-no mono">{num(i + 1)}</span>
              <label className="ex-field">
                <span className="ex-kw">
                  {bi('IF complaint contains any of', 'যদি অভিযোগে এর যেকোনোটি থাকে')}
                </span>
                <input
                  type="text"
                  className="lab-input"
                  value={r.input}
                  onChange={(e) => setWords(i, e.target.value)}
                />
              </label>
              <label className="ex-field">
                <span className="ex-kw">{bi('THEN send to', 'তবে পাঠাও')}</span>
                <select
                  className="lab-input"
                  value={r.dept}
                  onChange={(e) => setDept(i, e.target.value as DeptId)}
                >
                  {DEPT_KEYS.map((d) => (
                    <option key={d} value={d}>
                      {name(d)}
                    </option>
                  ))}
                </select>
              </label>
              <span className="ex-tools">
                <button
                  type="button"
                  className="btn small ghost"
                  aria-label={bi(`Move rule ${i + 1} up`, `নিয়ম ${num(i + 1)} ওপরে নিন`)}
                  disabled={i === 0}
                  onClick={() => moveRule(i, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn small ghost"
                  aria-label={bi(`Move rule ${i + 1} down`, `নিয়ম ${num(i + 1)} নিচে নিন`)}
                  disabled={i === rules.length - 1}
                  onClick={() => moveRule(i, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn small ghost"
                  aria-label={bi(`Delete rule ${i + 1}`, `নিয়ম ${num(i + 1)} মুছুন`)}
                  onClick={() => deleteRule(i)}
                >
                  ✕
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="lab-row">
        <button type="button" className="btn ghost" onClick={addRule}>
          + {bi('Add rule', 'নিয়ম যোগ')}
        </button>
        <button type="button" className="btn ghost" onClick={restoreRules}>
          {bi('Restore default rules', 'মূল নিয়মে ফিরুন')}
        </button>
      </div>
    </>
  );
}

/** Evaluate step: run the current rules on every sample complaint. */
function TestAll() {
  const { bi, num } = useT();
  const name = useDeptName();
  const rules = useExpert((s) => s.rules);
  const rows = useMemo(() => {
    const engineRules = toRules(rules);
    return SAMPLES.map((s) => ({ ...s, got: applyRules(engineRules, s.text).dept }));
  }, [rules]);
  const right = rows.filter((r) => r.got === r.dept).length;
  const none = rows.filter((r) => !r.got).length;
  return (
    <Card title={bi('Test the rules on all 10 sample complaints', '১০টি নমুনা অভিযোগে নিয়মগুলো যাচাই')}>
      <Stats>
        <Stat
          label={bi('Routed correctly', 'সঠিকভাবে পাঠানো')}
          value={`${num(right)}/${num(rows.length)}`}
          tone="good"
        />
        <Stat label={bi('Wrong department', 'ভুল বিভাগ')} value={num(rows.length - right - none)} tone="bad" />
        <Stat label={bi('No rule matched', 'কোনো নিয়ম মেলেনি')} value={num(none)} />
      </Stats>
      <div className="lab-table-wrap">
        <table className="lab-table">
          <thead>
            <tr>
              <th>{bi('Complaint', 'অভিযোগ')}</th>
              <th>{bi('Rules said', 'নিয়মের সিদ্ধান্ত')}</th>
              <th>{bi('Correct', 'সঠিক')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.text}>
                <td>{r.text}</td>
                <td>{r.got ? name(r.got) : '❓'}</td>
                <td>
                  {r.got === r.dept ? <Pill tone="ok">✓</Pill> : <Pill tone="warn">{name(r.dept)}</Pill>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
