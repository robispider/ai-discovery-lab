import { useEffect, useMemo, useState } from 'react';
import { VOTE_OPTIONS } from '../../data/corpus';
import { distribution, END, splitLines, tokenize, vocabulary } from '../../engines/ngram';
import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Bars, Callout, Card, Slider, Stat, Stats } from '../kit';
import { contextOf, useNextWord, vocabOf } from './store';
import './next-word.css';

export function NextWordStage() {
  const step = useLab((s) => s.step);
  switch (step) {
    case 'understand':
      return <Understand />;
    case 'explore':
      return <Explore />;
    case 'train':
      return <Train />;
    case 'evaluate':
      return <Generate />;
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
          'ChatGPT-style models write one piece at a time: look at the words so far, estimate the probability of every possible next word, pick one, repeat. First let’s do it as people.',
          'ChatGPT-ধরনের মডেল একবারে এক টুকরো করে লেখে: এ পর্যন্ত লেখা শব্দগুলো দেখে, সম্ভাব্য প্রতিটি পরের শব্দের সম্ভাবনা হিসাব করে, একটি বেছে নেয়, আবার একই কাজ করে। চলুন প্রথমে মানুষ হিসেবে করি।',
        )}
      </p>
      <VoteGame />
    </div>
  );
}

function VoteGame() {
  const { bi, lang, num } = useT();
  const votes = useNextWord((s) => s.votes);
  const { vote, resetVotes } = useNextWord.getState();
  const [other, setOther] = useState('');
  const opts = [...VOTE_OPTIONS[lang]];
  for (const k of Object.keys(votes)) if (!opts.includes(k)) opts.push(k);
  const total = Object.values(votes).reduce((s, v) => s + v, 0);
  const add = () => {
    const w = other.trim();
    if (w) vote(w);
    setOther('');
  };
  return (
    <Card title={bi('Audience game: complete the sentence', 'দর্শকদের খেলা: বাক্যটি শেষ করুন')}>
      <p className="nw-prompt">{bi('“The city corporation collects …”', '“সিটি কর্পোরেশন প্রতিদিন …”')}</p>
      <div className="lab-row">
        {opts.map((o) => (
          <button key={o} type="button" className="btn ghost nw-vote" onClick={() => vote(o)}>
            {o} <b className="mono">{num(votes[o] ?? 0)}</b>
          </button>
        ))}
      </div>
      <div className="lab-row">
        <input
          type="text"
          className="lab-input nw-other"
          value={other}
          placeholder={bi('other word…', 'অন্য শব্দ…')}
          aria-label={bi('Another word', 'অন্য শব্দ')}
          onChange={(e) => setOther(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button type="button" className="btn small ghost" onClick={add}>
          +
        </button>
        <button type="button" className="btn small ghost" onClick={resetVotes}>
          ↺ {bi('Reset votes', 'ভোট রিসেট')}
        </button>
      </div>
      {total > 0 && (
        <Bars
          items={opts
            .map((o) => ({ key: o, label: o, value: (votes[o] ?? 0) / total }))
            .sort((a, b) => b.value - a.value)}
        />
      )}
      <p className="muted">
        {bi(
          'Count a show of hands and click once per vote. The votes become a probability distribution. That is exactly what a language model produces for every next word.',
          'হাত তোলা গুনে প্রতি ভোটে একবার ক্লিক করুন। ভোটগুলো একটি সম্ভাবনা বণ্টনে পরিণত হয়। ভাষা মডেল প্রতিটি পরের শব্দের জন্য ঠিক এটাই তৈরি করে।',
        )}
      </p>
    </Card>
  );
}

function Explore() {
  const { bi } = useT();
  return (
    <div className="lab-view">
      <Card title={bi('Training text', 'প্রশিক্ষণের লেখা')}>
        <CorpusPicker />
        <CorpusEditor />
      </Card>
      <Card title={bi('Tokenisation: text becomes numbers', 'টোকেনাইজেশন: লেখা সংখ্যায় রূপান্তর')}>
        <Tokens />
      </Card>
    </div>
  );
}

function CorpusPicker() {
  const corpusLang = useNextWord((s) => s.corpusLang);
  const setCorpusLang = useNextWord((s) => s.setCorpusLang);
  return (
    <div className="seg" role="group" aria-label="Corpus">
      <button type="button" aria-pressed={corpusLang === 'en'} onClick={() => setCorpusLang('en')}>
        English
      </button>
      <button type="button" aria-pressed={corpusLang === 'bn'} onClick={() => setCorpusLang('bn')}>
        বাংলা
      </button>
    </div>
  );
}

function CorpusEditor() {
  const { bi } = useT();
  const corpus = useNextWord((s) => s.corpus);
  const setCorpus = useNextWord((s) => s.setCorpus);
  return (
    <textarea
      className="nw-corpus"
      value={corpus}
      aria-label={bi('Training text', 'প্রশিক্ষণের লেখা')}
      onChange={(e) => setCorpus(e.target.value)}
    />
  );
}

function Tokens() {
  const { bi, num } = useT();
  const corpus = useNextWord((s) => s.corpus);
  const { first, vocab } = useMemo(() => {
    const lines = splitLines(corpus);
    return { first: tokenize(lines[0] ?? ''), vocab: vocabulary(lines) };
  }, [corpus]);
  return (
    <div className="nw-chips">
      {first.map((t, i) => (
        <span key={i} className="nw-chip">
          {t}
          <small className="mono">#{num(vocab.indexOf(t) + 1)}</small>
        </span>
      ))}
      <span className="muted nw-more">
        … {bi(`${vocab.length} different tokens`, `${num(vocab.length)}টি ভিন্ন টোকেন`)}
      </span>
    </div>
  );
}

function Train() {
  const { bi } = useT();
  return (
    <div className="lab-view">
      <Card title={bi('Train the model', 'মডেলকে শেখাও')}>
        <TrainControls />
        <TrainStats />
      </Card>
      <Card title={bi('What it learned: a few counted patterns', 'যা শিখল: কয়েকটি গোনা প্যাটার্ন')}>
        <Patterns />
      </Card>
    </div>
  );
}

export function TrainControls() {
  const { bi } = useT();
  const n = useNextWord((s) => s.n);
  const training = useNextWord((s) => s.training);
  const { setN, train } = useNextWord.getState();
  return (
    <div className="lab-view nw-train">
      <div
        className="nw-radio"
        role="radiogroup"
        aria-label={bi('Context the model looks at', 'মডেল যতগুলো আগের শব্দ দেখে')}
      >
        <span className="muted">{bi('Context the model looks at:', 'মডেল যতগুলো আগের শব্দ দেখে:')}</span>
        {([1, 2] as const).map((k) => (
          <label key={k}>
            <input type="radio" name="nw-n" checked={n === k} onChange={() => setN(k)} />
            {k === 1 ? bi('1 previous word', 'আগের ১টি শব্দ') : bi('2 previous words', 'আগের ২টি শব্দ')}
          </label>
        ))}
      </div>
      <div className="lab-row">
        <button type="button" className="btn" disabled={training} onClick={() => void train()}>
          🧠 {bi('Train the model', 'মডেলকে শেখাও')}
        </button>
      </div>
    </div>
  );
}

function TrainStats() {
  const { bi, num } = useT();
  const words = useNextWord((s) => s.words);
  const patterns = useNextWord((s) => s.patterns);
  const corpus = useNextWord((s) => s.corpus);
  const vocab = useMemo(() => vocabOf(corpus).length, [corpus]);
  return (
    <Stats>
      <Stat label={bi('Words read', 'পড়া শব্দ')} value={num(words)} />
      <Stat label={bi('Vocabulary', 'শব্দভান্ডার')} value={num(vocab)} />
      <Stat
        label={bi('Patterns learned', 'শেখা প্যাটার্ন')}
        value={num(patterns)}
        tone={patterns ? 'good' : undefined}
      />
    </Stats>
  );
}

function Patterns() {
  const { bi, num } = useT();
  const model = useNextWord((s) => s.model);
  if (!model)
    return (
      <p className="muted">{bi('Train the model to see what it counted.', 'কী গুনেছে দেখতে মডেলকে শেখান।')}</p>
    );
  const rows = Object.entries(model)
    .map(([ctx, next]) => ({ ctx, next: Object.entries(next).sort((a, b) => b[1] - a[1]) }))
    .sort((a, b) => b.next.reduce((s, x) => s + x[1], 0) - a.next.reduce((s, x) => s + x[1], 0))
    .slice(0, 8);
  const show = (w: string) => (w === END ? bi('(end)', '(শেষ)') : w === '<s>' ? bi('(start)', '(শুরু)') : w);
  return (
    <div className="lab-table-wrap">
      <table className="lab-table">
        <thead>
          <tr>
            <th>{bi('After…', 'এর পরে…')}</th>
            <th>{bi('…came (times)', '…এসেছে (বার)')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.ctx}>
              <td className="mono">{r.ctx.split(' ').map(show).join(' ')}</td>
              <td>
                {r.next.slice(0, 5).map(([w, c]) => (
                  <span key={w} className="nw-chip">
                    {show(w)}
                    <small className="mono">×{num(c)}</small>
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Generate() {
  return (
    <div className="lab-view">
      <Generator />
    </div>
  );
}

function BreakIt() {
  const { bi } = useT();
  const items = [
    bi(
      'Generate before training: random words, gibberish.',
      'শেখানোর আগে লেখা তৈরি করুন: এলোমেলো শব্দ, অর্থহীন।',
    ),
    bi(
      'Temperature 0.1 = always the most likely word (repetitive). 2.0 = wild.',
      'টেম্পারেচার ০.১ = সবসময় সবচেয়ে সম্ভাব্য শব্দ (একঘেয়ে)। ২.০ = বেপরোয়া।',
    ),
    bi(
      'With 2 previous words, the model often copies training sentences exactly: memorising, not understanding.',
      'আগের ২টি শব্দ দেখলে মডেল প্রায়ই প্রশিক্ষণের বাক্য হুবহু নকল করে: মুখস্থ, বোঝা নয়।',
    ),
    bi(
      'Start with a word that is not in the text: the model has no idea.',
      'লেখায় নেই এমন শব্দ দিয়ে শুরু করুন: মডেল কিছুই জানে না।',
    ),
    bi(
      'Edit the training text (e.g. add a biased sentence many times) and retrain: the output follows the data.',
      'প্রশিক্ষণের লেখা বদলান (যেমন একটি পক্ষপাতদুষ্ট বাক্য কয়েকবার যোগ করুন) এবং আবার শেখান: আউটপুট ডেটাকেই অনুসরণ করে।',
    ),
  ];
  return (
    <div className="lab-view">
      <Callout kind="break">
        <ul className="nw-list">
          {items.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Callout>
      <Generator />
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
            'This tiny model just counts which word follows which. GPT models do the same job, predicting the next token, but with a neural network (a Transformer) trained on trillions of words, so they can handle word combinations they have never seen. They still produce likely text, not verified truth.',
            'এই ছোট্ট মডেলটি শুধু গোনে কোন শব্দের পরে কোন শব্দ আসে। GPT মডেলও একই কাজ করে, পরের টোকেন অনুমান, তবে লক্ষ-কোটি শব্দে শেখানো একটি নিউরাল নেটওয়ার্ক (Transformer) দিয়ে, তাই আগে কখনো দেখেনি এমন শব্দ-সমন্বয়ও সামলাতে পারে। তবুও সে সম্ভাব্য লেখা তৈরি করে, যাচাই করা সত্য নয়।',
          )}
        </p>
      </Callout>
      <div className="lab-cols">
        <Card title={bi('When you use a chatbot at work', 'কাজে চ্যাটবট ব্যবহার করলে')}>
          <ul className="nw-list">
            <li>{bi('Check facts, numbers and names it writes.', 'এর লেখা তথ্য, সংখ্যা ও নাম যাচাই করুন।')}</li>
            <li>
              {bi(
                'Its style follows its training text, including its biases.',
                'এর লেখার ধরন প্রশিক্ষণের লেখাকে অনুসরণ করে, পক্ষপাতসহ।',
              )}
            </li>
            <li>
              {bi(
                'Do not paste citizens’ personal data into online tools.',
                'নাগরিকের ব্যক্তিগত তথ্য অনলাইন টুলে দেবেন না।',
              )}
            </li>
          </ul>
        </Card>
        <Card title={bi('Next: look inside a real GPT-2', 'এরপর: একটি আসল GPT-2-এর ভেতরে দেখুন')}>
          <p className="muted">
            {bi(
              'Lesson 10 opens the Transformer Explainer, which shows a real model doing this same next-word step.',
              'পাঠ ১০-এ Transformer Explainer খোলে, যেখানে একটি আসল মডেল এই একই পরের-শব্দ ধাপ করছে।',
            )}
          </p>
          <a className="btn ghost" href="#/lesson/10">
            {bi('Go to lesson 10', 'পাঠ ১০-এ যান')} →
          </a>
        </Card>
      </div>
    </div>
  );
}

/** Start text, temperature, next word / write a sentence, output and probabilities. */
function Generator() {
  const { bi, num } = useT();
  const s = useNextWord();
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      if (!useNextWord.getState().step()) setAuto(false);
    }, 450);
    return () => clearInterval(id);
  }, [auto]);

  const base = tokenize(s.start).filter((t) => t !== END);
  const dist = useMemo(
    () => (s.finished ? [] : distribution(s.model, contextOf(s), s.n, s.temp, vocabOf(s.corpus))),
    [s],
  );

  return (
    <div className="lab-cols wide-left">
      <Card title={bi('Generate text', 'লেখা তৈরি')}>
        <label className="lab-slider">
          <span className="lab-slider-head">
            <span>{bi('Start with', 'শুরুর শব্দ')}</span>
          </span>
          <input
            type="text"
            className="lab-input"
            value={s.start}
            onChange={(e) => s.setStart(e.target.value)}
          />
        </label>
        <Slider
          label={bi('Temperature (randomness)', 'টেম্পারেচার (এলোমেলোভাব)')}
          value={s.temp}
          min={0.1}
          max={2}
          step={0.1}
          format={(v) => num(v.toFixed(1))}
          onChange={s.setTemp}
        />
        <div className="lab-row">
          <button type="button" className="btn" onClick={() => s.step()}>
            ➜ {bi('Next word', 'পরের শব্দ')}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              if (useNextWord.getState().finished) s.clearOut();
              setAuto(true);
            }}
          >
            ⏩ {bi('Write a sentence', 'একটি বাক্য লেখো')}
          </button>
          <button
            type="button"
            className="btn ghost"
            aria-label={bi('Clear', 'মুছুন')}
            onClick={() => {
              setAuto(false);
              s.clearOut();
            }}
          >
            ↺
          </button>
        </div>
        <div className="nw-out nw-chips" aria-live="polite">
          {base.map((t, i) => (
            <span key={`b${i}`} className="nw-chip">
              {t}
            </span>
          ))}
          {s.gen.map((t, i) => (
            <span key={i} className={i === s.gen.length - 1 && s.lastNew ? 'nw-chip new' : 'nw-chip'}>
              {t}
            </span>
          ))}
        </div>
        <p className="nw-note">
          {!s.model && !s.finished
            ? bi(
                '⚠️ Not trained yet: the model will choose words at random.',
                '⚠️ এখনো শেখানো হয়নি: মডেল এলোমেলোভাবে শব্দ বাছবে।',
              )
            : s.note === 'untrained'
              ? '🎲 ' +
                bi(
                  'Untrained: every word is equally likely. Gibberish.',
                  'অপ্রশিক্ষিত: প্রতিটি শব্দ সমান সম্ভাব্য। অর্থহীন লেখা।',
                )
              : s.note === 'copied'
                ? '⚠️ ' +
                  bi(
                    'Copied exactly from the training text: memorised.',
                    'প্রশিক্ষণের লেখা থেকে হুবহু নকল: মুখস্থ।',
                  )
                : s.note === 'new'
                  ? '✨ ' +
                    bi(
                      'A new sentence that is not in the training text. Is it true? The model does not know.',
                      'একটি নতুন বাক্য, যা প্রশিক্ষণের লেখায় নেই। এটা কি সত্য? মডেল তা জানে না।',
                    )
                  : ''}
        </p>
      </Card>
      <Card title={bi('Model’s probabilities for the next word', 'পরের শব্দের জন্য মডেলের সম্ভাবনা')}>
        {s.finished ? (
          <p className="muted">{bi('Sentence finished.', 'বাক্য শেষ।')}</p>
        ) : dist ? (
          <Bars
            items={dist.slice(0, 8).map((x) => ({
              key: x.w,
              label: x.w === END ? bi('(end of sentence)', '(বাক্য শেষ)') : x.w,
              value: x.p,
            }))}
          />
        ) : (
          <p>
            🤷{' '}
            {bi(
              'The model has never seen this context, so it has no idea what comes next.',
              'মডেল এই প্রসঙ্গ কখনো দেখেনি, তাই পরে কী আসবে সে জানে না।',
            )}
          </p>
        )}
      </Card>
    </div>
  );
}
