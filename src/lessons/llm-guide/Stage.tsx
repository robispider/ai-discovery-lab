import {
  ANATOMY,
  CIVIC_CATS,
  CIVIC_MODELS,
  HW_OPTS,
  MODELS,
  QUANTS,
  SIM_PROMPTS,
  USE_OPTS,
} from '../../data/llm';
import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Callout, Card } from '../kit';
import {
  archSteps,
  hardwareAdvice,
  HOSTING_COMPARE,
  plan,
  privacyNote,
  vramFor,
  waypoints,
  type Arch,
  type HwId,
  type Pair,
  type UseId,
} from './content';
import { CELLS, useLlm } from './store';
import './llm-guide.css';

/** Renders the <b>…</b> emphasis used in the guide's text without injecting HTML. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(<b>.*?<\/b>)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('<b>') ? <b key={i}>{p.slice(3, -4)}</b> : p.replace(/<\/?i>/g, ''),
      )}
    </>
  );
}

function usePair() {
  const { bi } = useT();
  return (p: Pair | readonly string[]) => bi(p[0], p[1]);
}

export function LlmGuideStage() {
  const step = useLab((s) => s.step);
  switch (step) {
    case 'understand':
      return <ModelChapter />;
    case 'explore':
      return <ContextChapter />;
    case 'train':
      return <GpuChapter />;
    case 'evaluate':
      return <HostingChapter />;
    case 'break':
      return <BreakIt />;
    case 'apply':
      return <CivicChapter />;
  }
}

function ModelChapter() {
  const { bi, num } = useT();
  const s = useLlm();
  const m = MODELS.find((x) => x.id === s.model)!;
  const q = QUANTS.find((x) => x.id === s.quant)!;
  const vram = vramFor(m.b, q.bytesPerParam);
  const hw = hardwareAdvice(vram);
  return (
    <div className="lab-view">
      <p className="lab-lead">
        <Rich
          text={bi(
            'An AI model is <b>not</b> a database of saved answers and does not search the internet by itself. It is one frozen file holding <b>billions of tuned numbers (weights)</b> learned in training, plus a small program that runs math through those numbers.',
            'একটি এআই মডেল সংরক্ষিত উত্তরের ডেটাবেস <b>নয়</b>, নিজে থেকে ইন্টারনেটও খোঁজে না। এটি একটি স্থির ফাইল, যাতে প্রশিক্ষণে শেখা <b>শত কোটি সমন্বিত সংখ্যা (ওয়েট)</b> থাকে, আর থাকে একটি ছোট প্রোগ্রাম যা সেই সংখ্যাগুলো দিয়ে গণনা চালায়।',
          )}
        />
      </p>
      <div className="lab-row lg-pickers">
        <div>
          <span className="eyebrow">{bi('1. Model size (parameters)', '১. মডেলের আকার (প্যারামিটার)')}</span>
          <div className="lab-row">
            {MODELS.map((x) => (
              <button
                key={x.id}
                type="button"
                className="chip-btn"
                aria-pressed={x.id === s.model}
                onClick={() => {
                  s.set({ model: x.id });
                  s.sendToken();
                }}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="eyebrow">
            {bi('2. Number precision (quantization)', '২. সংখ্যার সূক্ষ্মতা (কোয়ান্টাইজেশন)')}
          </span>
          <div className="lab-row">
            {QUANTS.map((x) => (
              <button
                key={x.id}
                type="button"
                className="chip-btn"
                aria-pressed={x.id === s.quant}
                onClick={() => {
                  s.set({ quant: x.id });
                  s.sendToken();
                }}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="lab-cols">
        <Card
          title={bi(
            'Inside a model: token → layers of weights → next token',
            'মডেলের ভেতরে: টোকেন → ওয়েটের স্তর → পরের টোকেন',
          )}
          aside={
            <button type="button" className="btn small" onClick={s.sendToken}>
              ▶ {bi('Send a token', 'একটি টোকেন পাঠান')}
            </button>
          }
        >
          <LayerViz cols={m.cols} rows={m.rows} pulse={s.pulse} />
          <p className="lg-small">
            <b>
              {m.label} ({q.label}):
            </b>{' '}
            {bi(m.en, m.bn)}.{' '}
            {bi(
              `Every single word generated passes through all ${m.layers} layers of numbers!`,
              `প্রতিটি নতুন শব্দ তৈরি করতে সিগন্যালকে সব ${num(m.layers)}টি স্তরের সংখ্যার ভেতর দিয়ে যেতে হয়!`,
            )}
          </p>
        </Card>
        <Card
          title={bi('What this model file looks like', 'এই মডেল ফাইলটি কেমন')}
          aside={
            <span className="lab-pill ok mono">
              civic-{m.id}-{q.id}.gguf
            </span>
          }
        >
          <div className="lab-stats">
            <div className="lab-stat">
              <span className="lab-stat-k">{bi('Parameters (numbers)', 'প্যারামিটার (সংখ্যা)')}</span>
              <span className="lab-stat-v">{m.label}</span>
            </div>
            <div className="lab-stat">
              <span className="lab-stat-k">{bi('File / VRAM needed', 'ফাইল / প্রয়োজনীয় VRAM')}</span>
              <span className="lab-stat-v">~{num(vram < 10 ? vram.toFixed(1) : Math.round(vram))} GB</span>
            </div>
            <div className="lab-stat">
              <span className="lab-stat-k">{bi('Transformer layers', 'ট্রান্সফর্মার স্তর')}</span>
              <span className="lab-stat-v">{num(m.layers)}</span>
            </div>
          </div>
          <div className="lg-quant">
            <div className="lg-quant-title">
              <span>{bi('Storage per weight number', 'প্রতিটি ওয়েট সংখ্যার জায়গা')}</span>
              <b>{num(q.bits)} bits</b>
            </div>
            <div className="lg-bits">
              {Array.from({ length: 16 }, (_, i) => (
                <span key={i} className={i < q.bits ? 'on' : undefined}>
                  {(i * 7 + q.bits) % 2}
                </span>
              ))}
            </div>
            <p className="lg-small">
              {bi('Example weight:', 'উদাহরণ ওয়েট:')} <b className="mono">{q.sample}</b> — {bi(q.en, q.bn)}
            </p>
          </div>
          <HardwareFit gb={vram} fit={hw} />
        </Card>
      </div>
    </div>
  );
}

function HardwareFit({ fit }: { gb: number; fit: ReturnType<typeof hardwareAdvice> }) {
  const { bi } = useT();
  const p = usePair();
  return (
    <div className="lg-hw">
      <div className="lg-hw-head">
        <b>{bi('Recommended hardware:', 'প্রয়োজনীয় হার্ডওয়্যার:')}</b>
        <span className={fit.heavy ? 'lab-pill warn' : 'lab-pill ok'}>{p(fit.tier)}</span>
      </div>
      <div className="lg-gauge">
        <i className={fit.heavy ? 'heavy' : undefined} style={{ width: `${fit.pct.toFixed(0)}%` }} />
      </div>
      <p className="lg-small muted">{p(fit.desc)}</p>
    </div>
  );
}

/** Columns of weight squares; a pulse sweeps through them each time a token is sent. */
function LayerViz({ cols, rows, pulse }: { cols: number; rows: number; pulse: number }) {
  const { bi } = useT();
  const W = 600;
  const H = 260;
  const x0 = 110;
  const x1 = W - 120;
  const gap = (x1 - x0) / cols;
  const cell = Math.min(18, (H - 60) / rows - 4);
  const words = [
    [bi('drains', 'ড্রেন'), 0.46],
    [bi('roads', 'রাস্তা'), 0.31],
    [bi('waste', 'ময়লা'), 0.23],
  ] as const;
  return (
    <svg
      className="lg-layers"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={bi(
        `A token passing through ${cols} layer groups of weights`,
        `${cols}টি ওয়েট-স্তরের ভেতর দিয়ে একটি টোকেন যাচ্ছে`,
      )}
    >
      <g>
        <rect x={10} y={H / 2 - 20} width={80} height={40} rx={10} className="lg-tok" />
        <text x={50} y={H / 2 + 5} textAnchor="middle">
          “{bi('clean', 'পরিষ্কার')}”
        </text>
      </g>
      {Array.from({ length: cols }, (_, c) => (
        <g key={`${pulse}-${c}`} className="lg-col" style={{ animationDelay: `${c * 0.12}s` }}>
          {Array.from({ length: rows }, (_, r) => (
            <rect
              key={r}
              x={x0 + c * gap + (gap - cell) / 2}
              y={30 + r * ((H - 60) / rows)}
              width={cell}
              height={cell}
              rx={3}
              style={{ opacity: 0.35 + (((c * 31 + r * 17) % 10) / 10) * 0.65 }}
            />
          ))}
        </g>
      ))}
      <path d={`M90 ${H / 2} H${x0}`} className="lg-wire" />
      <path d={`M${x1} ${H / 2} H${W - 110}`} className="lg-wire" />
      {words.map(([w, p], i) => (
        <g key={w} transform={`translate(${W - 108} ${H / 2 - 40 + i * 30})`}>
          <rect width={100 * p * 2} height={20} rx={5} className={i === 0 ? 'lg-out top' : 'lg-out'} />
          <text x={6} y={14}>
            {w} {Math.round(p * 100)}%
          </text>
        </g>
      ))}
    </svg>
  );
}

function ContextChapter() {
  const { bi } = useT();
  return (
    <div className="lab-view">
      <Card
        title={bi(
          "Context window = the model's working desk (short-term memory)",
          'কনটেক্সট উইন্ডো = মডেলের কাজের টেবিল (স্বল্পমেয়াদি স্মৃতি)',
        )}
      >
        <p className="muted">
          {bi(
            'A model has no memory between chats. Every time you reply, your instructions, attached documents and chat history are placed on its desk together. Add city circulars and watch what happens when the desk overflows!',
            'চ্যাটের মাঝে মডেলের কোনো স্মৃতি থাকে না। প্রতিবার উত্তর দিলে আপনার নির্দেশনা, সংযুক্ত ডকুমেন্ট ও আগের কথোপকথন একসাথে তার টেবিলে রাখা হয়। সিটি সার্কুলার যোগ করুন এবং দেখুন টেবিল উপচে পড়লে কী হয়!',
          )}
        </p>
        <ContextDesk />
        <p className="muted lg-small">{bi('1 page ≈ 600 tokens.', '১ পৃষ্ঠা ≈ ৬০০ টোকেন।')}</p>
      </Card>
    </div>
  );
}

function ContextDesk() {
  const { bi, num } = useT();
  const used = useLlm((s) => s.ctxUsed);
  const limit = useLlm((s) => s.ctxLimit);
  const set = useLlm((s) => s.set);
  const pages = Math.round(used / 600);
  const sysTok = 1000;
  const docTok = Math.round((used - sysTok) * 0.65);
  const chatTok = Math.max(500, used - sysTok - docTok);
  const overflow = Math.max(0, used - limit);
  const fit = Math.min(1, limit / Math.max(used, limit));
  const sysW = (sysTok / limit) * 100;
  const docW = (Math.min(docTok, Math.max(0, limit - sysTok)) / limit) * 100;
  const chatW = (Math.min(chatTok, Math.max(0, limit - sysTok - docTok)) / limit) * 100;
  const freeW = Math.max(0, 100 - sysW - docW - chatW);
  const k = (t: number) => `${num((t / 1000).toFixed(1))}K`;
  return (
    <div className="lab-view">
      <div className="lab-row lg-ctx-controls">
        <label className="lab-slider lg-grow">
          <span className="lab-slider-head">
            <span>{bi('Attached city documents + chat history', 'সংযুক্ত সিটি ডকুমেন্ট + চ্যাটের ইতিহাস')}</span>
            <b className="mono">
              {num(used.toLocaleString())} {bi(`tokens (~${pages} pages)`, `টোকেন (~${num(pages)} পৃষ্ঠা)`)}
            </b>
          </span>
          <input
            type="range"
            min={1000}
            max={42000}
            step={1000}
            value={used}
            onChange={(e) => set({ ctxUsed: Number(e.target.value) })}
          />
        </label>
        <div className="seg" role="group" aria-label={bi('Desk size', 'টেবিলের আকার')}>
          {[8000, 32000, 128000].map((n) => (
            <button key={n} type="button" aria-pressed={limit === n} onClick={() => set({ ctxLimit: n })}>
              {num(n / 1000)}K
            </button>
          ))}
        </div>
      </div>
      <div className="lg-desk">
        {overflow > 0 && (
          <div
            className="lg-block dropped"
            style={{ flex: `${Math.min(40, (overflow / used) * 100).toFixed(1)} 1 0` }}
          >
            <span>⚠️ {bi('Dropped', 'মুছে গেছে')}</span>
            <small>{k(overflow)}</small>
          </div>
        )}
        <div className="lg-block sys" style={{ flex: `${Math.max(8, sysW * fit).toFixed(1)} 1 0` }}>
          <span>{bi('System rules', 'নির্দেশনা')}</span>
          <small>1K</small>
        </div>
        {docW > 1 && (
          <div className="lg-block doc" style={{ flex: `${(docW * fit).toFixed(1)} 1 0` }}>
            <span>{bi('City circulars / PDFs', 'সিটি সার্কুলার / PDF')}</span>
            <small>{k(docTok)}</small>
          </div>
        )}
        {chatW > 1 && (
          <div className="lg-block chat" style={{ flex: `${(chatW * fit).toFixed(1)} 1 0` }}>
            <span>{bi('Chat history', 'চ্যাটের কথা')}</span>
            <small>{k(chatTok)}</small>
          </div>
        )}
        {freeW > 2 && overflow === 0 && (
          <div className="lg-block free" style={{ flex: `${freeW.toFixed(1)} 1 0` }}>
            <span>{bi('Free desk space', 'খালি জায়গা')}</span>
            <small>{k(limit - used)}</small>
          </div>
        )}
      </div>
      <p className={overflow > 0 ? 'lg-note bad' : 'lg-note good'} aria-live="polite">
        {overflow > 0
          ? bi(
              `🚨 Desk overflowed by ${overflow.toLocaleString()} tokens! The oldest parts of your document or earlier rules fall off the desk: the model literally cannot see them any more. Use a bigger context or RAG search.`,
              `🚨 টেবিল ${num(overflow.toLocaleString())} টোকেন উপচে পড়েছে! আপনার ডকুমেন্ট বা আগের নির্দেশনার পুরোনো অংশ টেবিল থেকে পড়ে গেছে: মডেল সেগুলো আর দেখতেই পাচ্ছে না। বড় কনটেক্সট নিন বা RAG সার্চ ব্যবহার করুন।`,
            )
          : bi(
              `✅ Everything fits on the ${limit / 1000}K working desk (${Math.round((used / limit) * 100)}% full). A bigger context also uses extra GPU memory (KV cache).`,
              `✅ সবকিছু ${num(limit / 1000)}K কাজের টেবিলে এঁটে গেছে (${num(Math.round((used / limit) * 100))}% পূর্ণ)। বড় কনটেক্সট বেশি GPU মেমোরি (KV cache) ব্যবহার করে।`,
            )}
      </p>
    </div>
  );
}

function GpuChapter() {
  const { bi } = useT();
  return (
    <div className="lab-view">
      <p className="lab-lead">
        <Rich
          text={bi(
            'A <b>CPU</b> has a few very smart cores built for complex step-by-step office tasks. A <b>GPU</b> has <b>thousands of tiny CUDA cores</b> built to do simple math on thousands of numbers at the same instant: first for video-game pixels, now the engine of modern AI.',
            'একটি <b>CPU</b>-তে অল্প কয়েকটি অতি দক্ষ কোর থাকে, ধাপে ধাপে জটিল অফিসের কাজের জন্য তৈরি। একটি <b>GPU</b>-তে <b>হাজার হাজার ছোট CUDA কোর</b> থাকে, একই মুহূর্তে হাজারো সংখ্যায় সহজ গণনা করার জন্য তৈরি: প্রথমে ভিডিও গেমের পিক্সেলের জন্য, এখন আধুনিক এআই-এর ইঞ্জিন।',
          )}
        />
      </p>
      <Race />
      <Anatomy />
    </div>
  );
}

export function Race() {
  const { bi, num } = useT();
  const s = useLlm();
  const r = s.race;
  const done = r.cpuDone >= CELLS && r.gpuDone >= CELLS;
  const grid = (filled: number, gpu: boolean) => (
    <div className={gpu ? 'lg-cells gpu' : 'lg-cells'}>
      {Array.from({ length: CELLS }, (_, i) => {
        const active =
          r.running &&
          i >= Math.floor(filled) &&
          i < Math.floor(filled) + (s.workload === 'ai' ? (gpu ? 32 : 4) : 1);
        return <i key={i} className={i < filled ? 'done' : active ? 'active' : undefined} />;
      })}
    </div>
  );
  let verdict: string;
  if (!done)
    verdict =
      s.workload === 'ai'
        ? bi(
            'Press Start race to watch 8 fast CPU cores race thousands of parallel GPU CUDA cores multiplying neural-network weights.',
            'প্রতিযোগিতা শুরু করুন চাপুন: দেখুন ৮টি দ্রুত CPU কোর বনাম হাজার হাজার সমান্তরাল GPU CUDA কোর কীভাবে নিউরাল নেটওয়ার্কের গুণ-যোগ করে।',
          )
        : bi(
            'Sequential mode: every step depends on the previous one (step 2 must wait for step 1). Who wins now?',
            'ধারাবাহিক মোড: প্রতিটি ধাপ আগের ধাপের ওপর নির্ভর করে (ধাপ ২-কে ধাপ ১-এর জন্য অপেক্ষা করতে হয়)। এবার কে জিতবে?',
          );
  else if (s.workload === 'ai')
    verdict = bi(
      `🏆 GPU + CUDA cores win by ~${(r.cpuMs / Math.max(0.1, r.gpuMs)).toFixed(1)}×! Every number in an AI layer can be multiplied independently, so thousands of cores work at once. That is why GPUs power ChatGPT and local LLMs.`,
      `🏆 GPU ও CUDA কোর ~${num((r.cpuMs / Math.max(0.1, r.gpuMs)).toFixed(1))} গুণ বেশি দ্রুত জিতেছে! এআই-এর প্রতিটি স্তরের সংখ্যা আলাদাভাবে একসাথে গুণ করা যায়, তাই হাজার হাজার কোর একযোগে কাজ করে। এ কারণেই ChatGPT ও লোকাল LLM চালাতে GPU লাগে।`,
    );
  else
    verdict = bi(
      `⚡ CPU wins by ~${(r.gpuMs / Math.max(0.1, r.cpuMs)).toFixed(1)}×! When step 2 must wait for step 1, almost all GPU cores sit idle. GPUs do not replace CPUs: an AI server needs both.`,
      `⚡ এবার CPU ~${num((r.gpuMs / Math.max(0.1, r.cpuMs)).toFixed(1))} গুণ দ্রুত জিতেছে! ধাপ ২ যখন ধাপ ১-এর জন্য অপেক্ষা করে, তখন GPU-এর প্রায় সব কোর বসে থাকে। GPU কখনো CPU-এর বিকল্প নয়: এআই সার্ভারে দুটোই লাগে।`,
    );
  const card = (gpu: boolean) => {
    const filled = gpu ? r.gpuDone : r.cpuDone;
    return (
      <div className="lg-race-card">
        <div className="lab-card-head">
          <div>
            <b>
              {gpu
                ? bi('GPU · thousands of CUDA cores', 'GPU · হাজার হাজার CUDA কোর')
                : bi('CPU · 8 fast specialist cores', 'CPU · ৮টি দ্রুত বিশেষজ্ঞ কোর')}
            </b>
            <div className="muted lg-small">
              {gpu
                ? bi(
                    'Like 200 clerks stamping the whole ward at once',
                    'যেন ২০০ জন কর্মী একসাথে পুরো ওয়ার্ডে সিল দিচ্ছেন',
                  )
                : bi(
                    'Like 4 senior officers working one after another',
                    'যেন ৪ জন জ্যেষ্ঠ কর্মকর্তা একের পর এক কাজ করছেন',
                  )}
            </div>
          </div>
          <span className="mono lg-time">{num((gpu ? r.gpuMs : r.cpuMs).toFixed(1))} ms</span>
        </div>
        {grid(filled, gpu)}
        <div className="lab-bar">
          <span>{num(Math.round((filled / CELLS) * 100))}%</span>
          <span className="lab-bar-track">
            <i
              style={{ width: `${(filled / CELLS) * 100}%`, background: gpu ? 'var(--accent)' : 'var(--c5)' }}
            />
          </span>
          <span />
        </div>
      </div>
    );
  };
  return (
    <Card
      title={bi('Live race: CPU vs GPU', 'সরাসরি প্রতিযোগিতা: CPU বনাম GPU')}
      aside={
        <span className="lab-row">
          <button type="button" className="btn" disabled={r.running} onClick={s.startRace}>
            ▶ {bi('Start race', 'প্রতিযোগিতা শুরু')}
          </button>
          <button type="button" className="btn ghost" onClick={s.resetRace}>
            ↺
          </button>
        </span>
      }
    >
      <div className="seg" role="group" aria-label={bi('Workload', 'কাজের ধরন')}>
        <button type="button" aria-pressed={s.workload === 'ai'} onClick={() => s.setWorkload('ai')}>
          🧠 {bi('AI matrix math (1 token)', 'এআই ম্যাট্রিক্স গণনা (১ টোকেন)')}
        </button>
        <button type="button" aria-pressed={s.workload === 'seq'} onClick={() => s.setWorkload('seq')}>
          📋 {bi('Step-by-step office rule', 'ধাপে ধাপে অফিসের নিয়ম')}
        </button>
      </div>
      <div className="lab-cols">
        {card(false)}
        {card(true)}
      </div>
      <p className={done ? 'lg-note good' : 'lg-note'} aria-live="polite">
        {verdict}
      </p>
    </Card>
  );
}

function Anatomy() {
  const { bi } = useT();
  const p = usePair();
  const cur = useLlm((s) => s.anatomy);
  const set = useLlm((s) => s.set);
  const item = ANATOMY.find((a) => a.id === cur)!;
  return (
    <Card
      title={bi('4 hardware terms you will hear in AI proposals', 'এআই প্রস্তাবে যে ৪টি হার্ডওয়্যার শব্দ শুনবেন')}
    >
      <div className="lg-anat-tabs" role="tablist">
        {ANATOMY.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={a.id === cur}
            className="lg-anat"
            onClick={() => set({ anatomy: a.id })}
          >
            <span aria-hidden="true">{a.icon}</span>
            <b>{p(a.title)}</b>
            <small>{p(a.sub)}</small>
          </button>
        ))}
      </div>
      <div className="lg-anat-detail" role="tabpanel">
        <p>
          <Rich text={p(item.body)} />
        </p>
        <div className="lg-anat-badge">
          <span className="eyebrow">{bi('Real-world scale', 'বাস্তব মাপকাঠি')}</span>
          <b>{p(item.metric)}</b>
        </div>
      </div>
    </Card>
  );
}

function HostingChapter() {
  const { bi } = useT();
  return (
    <div className="lab-view">
      <p className="lab-lead">
        <Rich
          text={bi(
            'When you type into ChatGPT or Gemini, your message leaves your computer and runs on remote GPU servers. <b>Self-hosting</b> means running an open-source model on hardware inside your own office or government data centre, so citizen data never crosses the public internet.',
            'ChatGPT বা Gemini-তে লিখলে আপনার বার্তা কম্পিউটার ছেড়ে দূরের GPU সার্ভারে চলে। <b>সেল্ফ-হোস্টিং</b> মানে নিজের অফিস বা সরকারি ডেটা সেন্টারের হার্ডওয়্যারে একটি ওপেন-সোর্স মডেল চালানো, যাতে নাগরিকের তথ্য কখনো পাবলিক ইন্টারনেট পার হয় না।',
          )}
        />
      </p>
      <Hosting />
      <CompareTable />
    </div>
  );
}

export function Hosting() {
  const { bi } = useT();
  const p = usePair();
  const s = useLlm();
  const prompt = SIM_PROMPTS.find((x) => x.id === s.prompt)!;
  const steps = archSteps(s.arch, prompt.sensitive);
  const u = s.trace;
  const stepIdx = u === null ? -1 : Math.min(3, Math.floor(u * 4));
  const note = privacyNote(s.arch, prompt.sensitive);
  const archs: [Arch, string][] = [
    ['cloud', bi('☁️ Cloud GPT service', '☁️ ক্লাউড GPT সার্ভিস')],
    ['self', bi('🏛️ Self-hosted (city server)', '🏛️ সেল্ফ-হোস্টেড (সিটি সার্ভার)')],
    ['hybrid', bi('🔀 Hybrid (smart public-sector pattern)', '🔀 হাইব্রিড (স্মার্ট সরকারি পদ্ধতি)')],
  ];
  return (
    <Card>
      <div className="seg lg-wrap" role="group" aria-label={bi('Set-up', 'ব্যবস্থা')}>
        {archs.map(([a, label]) => (
          <button key={a} type="button" aria-pressed={s.arch === a} onClick={() => s.setArch(a)}>
            {label}
          </button>
        ))}
      </div>
      <div className="lab-row">
        {SIM_PROMPTS.map((sp) => (
          <button
            key={sp.id}
            type="button"
            className={sp.sensitive ? 'chip-btn brk' : 'chip-btn'}
            aria-pressed={s.prompt === sp.id}
            onClick={() => s.setPrompt(sp.id as 'sensitive' | 'public')}
          >
            {p(sp.label)}
          </button>
        ))}
        <button type="button" className="btn" onClick={s.runTrace}>
          ▶ {bi('Trace request', 'অনুরোধ ট্রেস করুন')}
        </button>
      </div>
      <ArchDiagram arch={s.arch} sensitive={prompt.sensitive} u={u} />
      <div className="lg-log">
        <div>
          <b>{u === null ? bi('Selected prompt:', 'নির্বাচিত প্রম্পট:') : bi('Tracing:', 'ট্রেস চলছে:')}</b> “
          {p(prompt.text)}”
        </div>
        {u === null ? (
          <p className="muted lg-small">
            {bi(
              'Press Trace request to watch the data packet travel step by step.',
              'ধাপে ধাপে ডেটা প্যাকেটের যাত্রা দেখতে "অনুরোধ ট্রেস করুন" চাপুন।',
            )}
          </p>
        ) : (
          <>
            <div className="lg-steps">
              {steps.map(([t, d], i) => (
                <div
                  key={i}
                  className={
                    i === stepIdx && u < 1
                      ? 'lg-step active'
                      : i < stepIdx || u >= 1
                        ? 'lg-step done'
                        : 'lg-step'
                  }
                >
                  <b>{p(t)}</b>
                  <span>{p(d)}</span>
                </div>
              ))}
            </div>
            {u >= 1 && <p className={note.danger ? 'lg-note bad' : 'lg-note good'}>{p(note.text)}</p>}
          </>
        )}
      </div>
    </Card>
  );
}

function ArchDiagram({ arch, sensitive, u }: { arch: Arch; sensitive: boolean; u: number | null }) {
  const { bi } = useT();
  const pts = waypoints(arch, sensitive);
  let packet: [number, number] | null = null;
  if (u !== null) {
    const segs = pts.length - 1;
    const pos = u * segs;
    const i = Math.min(segs - 1, Math.floor(pos));
    const f = pos - i;
    packet = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
  }
  const box = (
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    sub: string,
    kind: string,
    icon: string,
  ) => (
    <g className={`lg-node ${kind}`}>
      <rect x={x} y={y} width={w} height={h} rx={12} />
      <text x={x + w / 2} y={y + 30} textAnchor="middle" fontSize="20">
        {icon}
      </text>
      <text x={x + w / 2} y={y + 54} textAnchor="middle" className="lg-node-title">
        {title}
      </text>
      <text x={x + w / 2} y={y + 72} textAnchor="middle" className="lg-node-sub">
        {sub}
      </text>
    </g>
  );
  return (
    <svg
      className="lg-arch"
      viewBox="0 0 920 330"
      role="img"
      aria-label={bi('How a request travels in this set-up', 'এই ব্যবস্থায় একটি অনুরোধ কীভাবে যায়')}
    >
      {arch === 'cloud' && (
        <>
          <rect
            x={18}
            y={22}
            width={210}
            height={286}
            rx={14}
            className="lg-zone self"
            strokeDasharray="6 4"
          />
          <text x={32} y={44} className="lg-zone-label self">
            {bi('City Corporation office', 'সিটি কর্পোরেশন অফিস')}
          </text>
          <rect
            x={260}
            y={55}
            width={128}
            height={220}
            rx={12}
            className="lg-zone net"
            strokeDasharray="4 4"
          />
          <text x={324} y={82} textAnchor="middle" className="lg-zone-label net">
            {bi('Public internet', 'পাবলিক ইন্টারনেট')}
          </text>
          <text x={324} y={102} textAnchor="middle" className="lg-node-sub">
            {bi('Data leaves office', 'তথ্য অফিসের বাইরে যায়')}
          </text>
          <text x={324} y={255} textAnchor="middle" className="lg-node-sub">
            {bi('HTTPS / API key', 'HTTPS / API কী')}
          </text>
          <rect x={420} y={22} width={482} height={286} rx={14} className="lg-zone cloud" />
          <text x={436} y={44} className="lg-zone-label cloud">
            {bi(
              'Remote cloud AI provider (e.g. OpenAI / Google / Anthropic)',
              'বিদেশি ক্লাউড এআই প্রোভাইডার (ChatGPT / Gemini / Claude)',
            )}
          </text>
          <path className="lg-flow cloud" d="M 206 146 L 444 146 M 620 146 L 672 146" />
          <path className="lg-flow net" d="M 672 192 L 620 192 M 444 192 L 206 192" />
          {box(
            42,
            118,
            164,
            92,
            bi('Officer browser', 'কর্মকর্তার ব্রাউজার'),
            bi('Types prompt & files', 'প্রম্পট ও ফাইল লেখেন'),
            'self',
            '💻',
          )}
          {box(
            444,
            118,
            176,
            92,
            bi('API gateway & auth', 'API গেটওয়ে ও বিলিং'),
            bi('Checks key · meters tokens', 'চাবি যাচাই · টোকেন হিসাব'),
            'cloud',
            '🛂',
          )}
          {box(
            672,
            92,
            206,
            144,
            bi('Giant GPU cluster', 'বিশাল GPU ক্লাস্টার'),
            bi('Hundreds of H100s · frontier LLM', 'শত শত H100 · ফ্রন্টিয়ার মডেল'),
            'cloud',
            '🖥️',
          )}
          <text x={775} y={198} textAnchor="middle" className="lg-node-sub">
            {bi('Batching + KV cache', 'ব্যাচিং + KV ক্যাশ')}
          </text>
          <text x={775} y={216} textAnchor="middle" className="lg-node-sub">
            {bi('Streams tokens back 1-by-1', 'একটি একটি করে টোকেন ফেরত পাঠায়')}
          </text>
        </>
      )}
      {arch === 'self' && (
        <>
          <rect x={18} y={20} width={710} height={290} rx={16} className="lg-zone self" />
          <text x={36} y={44} className="lg-zone-label self">
            🛡️{' '}
            {bi(
              'City Corporation private intranet / firewall (100% inside the building)',
              'সিটি কর্পোরেশন প্রাইভেট নেটওয়ার্ক / ফায়ারওয়াল (১০০% অফিসের ভেতরে)',
            )}
          </text>
          <rect
            x={752}
            y={88}
            width={150}
            height={154}
            rx={12}
            className="lg-zone off"
            strokeDasharray="5 5"
          />
          <text x={827} y={138} textAnchor="middle" fontSize="24">
            🚫🌐
          </text>
          <text x={827} y={168} textAnchor="middle" className="lg-node-title">
            {bi('No internet', 'ইন্টারনেট নেই')}
          </text>
          <text x={827} y={188} textAnchor="middle" className="lg-node-sub">
            {bi('Citizen data never', 'নাগরিকের তথ্য কখনো')}
          </text>
          <text x={827} y={204} textAnchor="middle" className="lg-node-sub">
            {bi('leaves this wall', 'বাইরে যায় না')}
          </text>
          <path className="lg-flow self" d="M 200 135 L 260 135 M 440 135 L 496 135 M 598 188 L 598 214" />
          <path className="lg-flow net" d="M 496 168 L 440 168 M 260 168 L 200 168" />
          {box(
            38,
            102,
            162,
            92,
            bi('HQ & ward PCs', 'সদর ও ওয়ার্ড পিসি'),
            bi('Internal LAN browser', 'অভ্যন্তরীণ LAN ব্রাউজার'),
            'self',
            '🏛️',
          )}
          {box(
            260,
            102,
            180,
            92,
            bi('Open WebUI portal', 'Open WebUI পোর্টাল'),
            bi('Local ChatGPT-like UI', 'নিজস্ব ChatGPT-র মতো UI'),
            'self',
            '💬',
          )}
          {box(
            496,
            86,
            206,
            102,
            'Ollama / vLLM + GPU',
            bi('Qwen / Gemma on city GPU', 'সিটি GPU-তে Qwen / Gemma'),
            'self',
            '⚡',
          )}
          {box(
            496,
            214,
            206,
            78,
            bi('City docs (RAG DB)', 'সিটি ডকুমেন্ট (RAG)'),
            bi('Acts, circulars, tax rules', 'আইন, সার্কুলার, কর বিধি'),
            'purple',
            '📚',
          )}
        </>
      )}
      {arch === 'hybrid' && (
        <>
          <rect x={18} y={20} width={585} height={290} rx={16} className="lg-zone self" />
          <text x={36} y={44} className="lg-zone-label self">
            🛡️ {bi('City Corporation internal zone', 'সিটি কর্পোরেশন অভ্যন্তরীণ নেটওয়ার্ক')}
          </text>
          <rect x={635} y={20} width={268} height={142} rx={14} className="lg-zone cloud" />
          <text x={650} y={43} className="lg-zone-label cloud">
            ☁️ {bi('Cloud frontier GPT', 'ক্লাউড ফ্রন্টিয়ার GPT')}
          </text>
          <path className="lg-flow ink" d="M 190 170 L 236 170" />
          <path className="lg-flow cloud" d="M 398 135 L 448 96 L 656 96" />
          <path className="lg-flow self" d="M 398 202 L 424 236 L 440 236" />
          {box(
            36,
            124,
            154,
            92,
            bi('Officer PC', 'কর্মকর্তার পিসি'),
            bi('Single unified portal', 'একই ইউনিফাইড পোর্টাল'),
            'self',
            '💻',
          )}
          {box(
            236,
            124,
            162,
            92,
            bi('Privacy router', 'গোপনীয়তা রাউটার'),
            bi('Checks personal data', 'গোপন তথ্য যাচাই করে'),
            'purple',
            '🔀',
          )}
          {box(
            440,
            192,
            148,
            96,
            bi('Self-hosted GPU', 'নিজস্ব GPU সার্ভার'),
            bi('NID, tax, complaints', 'NID, কর ও অভিযোগ'),
            'self',
            '🏛️',
          )}
          {box(
            656,
            62,
            226,
            84,
            bi('Cloud GPT service', 'ক্লাউড GPT সার্ভিস'),
            bi('Public notices & research only', 'শুধু সাধারণ নোটিশ ও গবেষণা'),
            'cloud',
            '☁️',
          )}
          <text x={530} y={84} textAnchor="middle" className="lg-node-sub">
            {bi('Public only →', 'শুধু সাধারণ →')}
          </text>
          <text x={378} y={250} textAnchor="middle" className="lg-node-sub">
            {bi('Private stays local ↓', 'গোপন তথ্য ভেতরে ↓')}
          </text>
        </>
      )}
      {packet && (
        <circle
          cx={packet[0].toFixed(1)}
          cy={packet[1].toFixed(1)}
          r={10}
          className={arch === 'cloud' && sensitive ? 'lg-packet danger' : 'lg-packet'}
        />
      )}
    </svg>
  );
}

function CompareTable() {
  const { bi } = useT();
  const p = usePair();
  return (
    <Card title={bi('Decision matrix: cloud GPT vs self-hosted', 'সিদ্ধান্তের ছক: ক্লাউড GPT বনাম সেল্ফ-হোস্টেড')}>
      <div className="lab-table-wrap">
        <table className="lab-table">
          <thead>
            <tr>
              <th>{bi('Factor', 'বিষয়')}</th>
              <th>☁️ {bi('Cloud GPT service', 'ক্লাউড GPT সার্ভিস')}</th>
              <th>🏛️ {bi('Self-hosted (open source)', 'সেল্ফ-হোস্টেড (ওপেন সোর্স)')}</th>
            </tr>
          </thead>
          <tbody>
            {HOSTING_COMPARE.map(([f, c, h]) => (
              <tr key={f[0]}>
                <td>
                  <b>{p(f)}</b>
                </td>
                <td>{p(c)}</td>
                <td>{p(h)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function BreakIt() {
  const { bi } = useT();
  const s = useLlm();
  const m70 = MODELS.find((x) => x.id === '70b')!;
  const fp16 = QUANTS.find((x) => x.id === 'fp16')!;
  const vram = vramFor(m70.b, fp16.bytesPerParam);
  return (
    <div className="lab-view">
      <Callout kind="break" title={bi('Reality check: common traps', 'বাস্তব যাচাই: সাধারণ ভুল ধারণা')}>
        <ul className="lg-list">
          <li>
            <Rich
              text={bi(
                '<b>"Self-hosted means zero hallucination": false!</b> Local models can still invent facts unless grounded with your real documents (RAG) and human review.',
                '<b>"সেল্ফ-হোস্টেড মানে কোনো ভুল তথ্য নেই": ভুল!</b> আসল ডকুমেন্ট (RAG) ও মানুষের যাচাই ছাড়া লোকাল মডেলও তথ্য বানাতে পারে।',
              )}
            />
          </li>
          <li>
            <Rich
              text={bi(
                '<b>"Any office PC can run a 70B model": false!</b> Without enough GPU memory, a huge model either fails to load or crawls at one word every few seconds.',
                '<b>"যেকোনো অফিস পিসিতে ৭০B মডেল চলে": ভুল!</b> যথেষ্ট GPU মেমোরি না থাকলে বড় মডেল হয় লোডই হয় না, নয়তো কয়েক সেকেন্ডে একটি শব্দ লেখে।',
              )}
            />
          </li>
          <li>
            <Rich
              text={bi(
                '<b>Bangla token tax:</b> Bangla text often uses 2–3× more tokens than English in older models. Always test on real Bangla city forms before buying hardware.',
                '<b>বাংলা টোকেন কর:</b> পুরোনো মডেলে বাংলা লেখায় ইংরেজির চেয়ে ২–৩ গুণ বেশি টোকেন লাগে। হার্ডওয়্যার কেনার আগে আসল বাংলা সিটি ফর্মে পরীক্ষা করুন।',
              )}
            />
          </li>
        </ul>
      </Callout>
      <div className="lab-cols">
        <Card
          title={bi(
            'A 70B model at full precision on one office PC?',
            'এক অফিস পিসিতে পূর্ণ সূক্ষ্মতার ৭০B মডেল?',
          )}
        >
          <p className="lg-small">
            70B × FP16 ≈ <b>~{Math.round(vram)} GB</b>
          </p>
          <HardwareFit gb={vram} fit={hardwareAdvice(vram)} />
        </Card>
        <Card title={bi('Overflow the desk', 'টেবিল উপচে দিন')}>
          <button
            type="button"
            className="btn small warn"
            onClick={() => s.set({ ctxUsed: 30000, ctxLimit: 8000 })}
          >
            🧪 {bi('Attach 50 pages to an 8K desk', '৮K টেবিলে ৫০ পৃষ্ঠা যোগ করুন')}
          </button>
          <ContextDesk />
        </Card>
      </div>
      <Hosting />
    </div>
  );
}

function CivicChapter() {
  const { bi, num } = useT();
  const p = usePair();
  const s = useLlm();
  const list = CIVIC_MODELS.filter(
    (m) => s.civic === 'all' || (m.cats as readonly string[]).includes(s.civic),
  );
  const pl = plan(s.hw, s.use);
  const util = Math.min(100, Math.round((pl.vramNeed / pl.capacity) * 100));
  return (
    <div className="lab-view">
      <Callout kind="lesson" title={bi('Key takeaway for city leaders', 'নগর নেতৃত্বের জন্য মূল শিক্ষা')}>
        <p>
          <Rich
            text={bi(
              'A modern LLM is a <b>compressed file of weights</b> powered by <b>parallel GPU cores</b>. You do not have to choose between "never use AI" and "send private citizen data abroad": open models can run inside your office for sensitive work, with cloud models for public tasks, and a human review path for both.',
              'আধুনিক LLM হলো <b>ওয়েটের একটি সংকুচিত ফাইল</b>, যা চলে <b>সমান্তরাল GPU কোরে</b>। "এআই কখনো নয়" আর "নাগরিকের গোপন তথ্য বিদেশে পাঠানো"-র মধ্যে বাছতে হবে না: সংবেদনশীল কাজে ওপেন মডেল অফিসের ভেতরেই চলতে পারে, সাধারণ কাজে ক্লাউড মডেল, আর দুটোতেই মানুষের যাচাই।',
            )}
          />
        </p>
      </Callout>
      <Card
        title={bi(
          'Useful open-source models for a City Corporation',
          'সিটি কর্পোরেশনের জন্য কাজের ওপেন-সোর্স মডেল',
        )}
      >
        <div className="lab-row">
          {CIVIC_CATS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="chip-btn"
              aria-pressed={s.civic === c.id}
              onClick={() => s.set({ civic: c.id })}
            >
              {bi(c.en, c.bn)}
            </button>
          ))}
        </div>
        <div className="lg-civic">
          {list.map((m) => (
            <article key={m.name} className="lg-model">
              <header>
                <div>
                  <h4>{m.name}</h4>
                  <span className="muted lg-small">{m.maker}</span>
                </div>
                <span className="lab-pill ok">{m.sizes}</span>
              </header>
              <p className="lg-small">{p(m.desc)}</p>
              <div className="lab-bar">
                <span>{bi('Bangla skill', 'বাংলা দক্ষতা')}</span>
                <span className="lab-bar-track">
                  <i style={{ width: `${m.bangla}%` }} />
                </span>
                <span className="lab-bar-v mono">{num(m.bangla)}%</span>
              </div>
              <div className="lab-bar">
                <span>VRAM (Q4)</span>
                <span className="lab-bar-track">
                  <i style={{ width: `${m.vramPct}%`, background: 'var(--c3)' }} />
                </span>
                <span className="lab-bar-v mono">{m.vramLabel}</span>
              </div>
              <b className="lg-small">{bi('City Corporation uses:', 'সিটি কর্পোরেশনে ব্যবহার:')}</b>
              <ul className="lg-list lg-small">
                {m.uses.map((u) => (
                  <li key={u[0]}>{p(u)}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Card>
      <Card title={bi('City AI stack planner', 'সিটি এআই স্ট্যাক পরিকল্পনা')}>
        <div className="lab-cols">
          <label className="lab-slider">
            <span className="lab-slider-head">{bi('Available hardware', 'উপলব্ধ হার্ডওয়্যার')}</span>
            <select
              className="lab-input"
              value={s.hw}
              onChange={(e) => s.set({ hw: e.target.value as HwId })}
            >
              {HW_OPTS.map((h) => (
                <option key={h.id} value={h.id}>
                  {bi(h.en, h.bn)}
                </option>
              ))}
            </select>
          </label>
          <label className="lab-slider">
            <span className="lab-slider-head">
              {bi('City Corporation use case', 'সিটি কর্পোরেশনের ব্যবহার')}
            </span>
            <select
              className="lab-input"
              value={s.use}
              onChange={(e) => s.set({ use: e.target.value as UseId })}
            >
              {USE_OPTS.map((u) => (
                <option key={u.id} value={u.id}>
                  {bi(u.en, u.bn)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="lab-card-head">
          <b>{bi('Recommended open-source civic stack', 'প্রস্তাবিত ওপেন-সোর্স সিটি স্ট্যাক')}</b>
          <span className="lab-pill ok">👥 {p(pl.users)}</span>
        </div>
        <div className="lg-stack">
          {(
            [
              [
                bi('1. Officer interface', '১. অফিস ইন্টারফেস'),
                pl.ui,
                bi('Familiar chat & file upload', 'পরিচিত চ্যাট ও ফাইল আপলোড'),
              ],
              [
                bi('2. Serving engine', '২. সার্ভার ইঞ্জিন'),
                pl.engine,
                bi('Runs models on GPU/CPU', 'GPU/CPU-তে মডেল চালায়'),
              ],
              [
                bi('3. Open model(s)', '৩. ওপেন মডেল'),
                pl.model,
                bi('Open weights, offline', 'ওপেন ওয়েট, অফলাইন'),
              ],
              [
                bi('4. Civic data layer', '৪. সিটি ডেটা স্তর'),
                pl.extra,
                bi('Grounded in real rules', 'আসল বিধির ওপর ভিত্তি করে'),
              ],
            ] as [string, string, string][]
          ).map(([k, v, d], i) => (
            <div key={k} className="lg-stack-box">
              {i > 0 && (
                <span className="lg-stack-arrow" aria-hidden="true">
                  →
                </span>
              )}
              <small>{k}</small>
              <b>{v}</b>
              <span className="muted">{d}</span>
            </div>
          ))}
        </div>
        <div className="lg-hw-head lg-small">
          <span>
            {bi('Estimated memory / VRAM used:', 'আনুমানিক মেমোরি / VRAM ব্যবহার:')}{' '}
            <b>
              ~{num(pl.vramNeed.toFixed(1))} GB / {num(pl.capacity)} GB
            </b>
          </span>
          <span>{num(util)}%</span>
        </div>
        <div className="lg-gauge">
          <i className={util > 85 ? 'heavy' : undefined} style={{ width: `${util}%` }} />
        </div>
        <p className="lg-small">
          💡 <b>{bi('Rollout tip:', 'বাস্তবায়ন পরামর্শ:')}</b> {p(pl.tip)}
        </p>
      </Card>
    </div>
  );
}
