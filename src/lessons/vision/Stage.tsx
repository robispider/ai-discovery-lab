import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  BREAK_ITEMS,
  computeFeatureMap,
  CONV_KERNELS,
  convolvePatch,
  DEFAULT_CONDITION,
  EVAL_ITEMS,
  evaluateBatch,
  extractFeatures,
  FEATURE_NAMES,
  getWasteItem,
  predictHead,
  renderPixelGrid,
  TRAIN_ITEMS,
  WASTE_CLASSES,
  type KernelId,
  type WasteClass,
} from '../../engines/vision';
import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Bars, Callout, Card, Choice, LineChart, Pill, Slider } from '../kit';
import { TeachableMachineLink } from './Controls';
import { SorterScene } from './SorterScene';
import {
  availableTrainItemsFor,
  useVision,
  type VisionCivicCaseId,
  type VisionSetupId,
} from './store';
import './vision.css';
import { CLASS_META } from './meta';
import { WasteGlyph, WasteSvg } from './WasteArt';
import { WebcamMini } from './WebcamMini';

const KERNEL_IDS: KernelId[] = ['vertical', 'horizontal', 'shine', 'organic'];

function Talk({ avatar, who, children }: { avatar: string; who?: ReactNode; children: ReactNode }) {
  return (
    <div className="vis-talk">
      <span className="vis-avatar" aria-hidden="true">
        {avatar}
      </span>
      <div className="vis-say" aria-live="polite">
        {who && <span className="vis-who">{who}</span>}
        {children}
      </div>
    </div>
  );
}

function ScoreRing({ pct, label, warn }: { pct: number; label: ReactNode; warn?: boolean }) {
  const { num } = useT();
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const offset = 314.16 * (1 - clamped / 100);
  return (
    <div className={warn ? 'vis-ring warn' : 'vis-ring'}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="bg" cx="60" cy="60" r="50" />
        <circle className="fg" cx="60" cy="60" r="50" style={{ strokeDashoffset: offset }} />
      </svg>
      <div className="vis-ring-v">{num(clamped)}%</div>
      <div className="vis-ring-k">{label}</div>
    </div>
  );
}

/** Persistent visual pipeline strip showing where the current cycle step sits in the vision stack. */
function PipelineStrip() {
  const { bi } = useT();
  const step = useLab((s) => s.step);
  const setStep = useLab((s) => s.setStep);

  const nodes = [
    {
      step: 'understand' as const,
      ico: '📷',
      title: bi('1. Pixels & Filters', '১. পিক্সেল ও ফিল্টার'),
      sub: bi('RGB grid → edges', 'আরজিবি → ধার'),
    },
    {
      step: 'explore' as const,
      ico: '🧊',
      title: bi('2. Frozen Backbone', '২. স্থির ব্যাকবোন'),
      sub: bi('1.4M-photo vision', '১৪ লক্ষ ছবির অভিজ্ঞতা'),
    },
    {
      step: 'train' as const,
      ico: '🔥',
      title: bi('3. Train Head', '৩. হেড প্রশিক্ষণ'),
      sub: bi('21 waste weights', '২১টি বর্জ্য গুণক'),
    },
    {
      step: 'evaluate' as const,
      ico: '♻️',
      title: bi('4. Unseen Belt', '৪. অদেখা যাচাই'),
      sub: bi('Confusion & webcam', 'ম্যাট্রিক্স ও ক্যামেরা'),
    },
    {
      step: 'break' as const,
      ico: '⚠️',
      title: bi('5. Break & Guard', '৫. ভাঙা ও সুরক্ষা'),
      sub: bi('Light, tray & OOD', 'আলো, ট্রে ও ধাতু'),
    },
  ];

  return (
    <div className="vis-pipe-bar" role="group" aria-label={bi('Vision pipeline stages', 'ভিশন পাইপলাইনের ধাপ')}>
      {nodes.map((n) => (
        <button
          key={n.step}
          type="button"
          className={n.step === 'break' ? 'vis-pipe-card brk' : 'vis-pipe-card'}
          aria-pressed={step === n.step}
          onClick={() => setStep(n.step)}
        >
          <span className="vis-pipe-ico" aria-hidden="true">
            {n.ico}
          </span>
          <span>
            <b>{n.title}</b>
            <small>{n.sub}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

export function VisionStage() {
  const step = useLab((s) => s.step);
  const stopPlay = useVision((s) => s.stopPlay);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => stopPlay(), [stopPlay]);

  useLayoutEffect(() => {
    const viewport = stageRef.current?.parentElement;
    if (viewport) viewport.scrollTop = 0;
  }, [step]);

  return (
    <div className="lab-view vis-stage" ref={stageRef}>
      <PipelineStrip />
      {step === 'understand' && <Understand />}
      {step === 'explore' && <Explore />}
      {step === 'train' && <Train />}
      {step === 'evaluate' && <Evaluate />}
      {step === 'break' && <BreakIt />}
      {step === 'apply' && <Apply />}
    </div>
  );
}

/* ==========================================================================
 * STEP 1: UNDERSTAND — Live Conveyor Rig + Interactive 3×3 Filter Arithmetic
 * ========================================================================== */
function Understand() {
  const { bi, num, pick } = useT();
  const activeItemId = useVision((s) => s.activeItemId);
  const playing = useVision((s) => s.playing);
  const activePin = useVision((s) => s.activePin);
  const kernelId = useVision((s) => s.kernelId);
  const patchRow = useVision((s) => s.patchRow);
  const patchCol = useVision((s) => s.patchCol);
  const model = useVision((s) => s.model);
  const minConfidence = useVision((s) => s.minConfidence);
  const consoleOpen = useVision((s) => s.consoleOpen);
  const logs = useVision((s) => s.logs);
  const { setActiveItem, togglePlay, setActivePin, setKernel, setPatch, toggleConsole } =
    useVision.getState();

  const item = getWasteItem(activeItemId);
  const grid = useMemo(() => renderPixelGrid(item, DEFAULT_CONDITION), [item]);
  const features = useMemo(() => extractFeatures(item, DEFAULT_CONDITION), [item]);
  const pred = useMemo(() => predictHead(model, features, minConfidence), [model, features, minConfidence]);
  const patch = useMemo(
    () => convolvePatch(grid, patchRow, patchCol, kernelId),
    [grid, patchRow, patchCol, kernelId],
  );
  const featureMap = useMemo(() => computeFeatureMap(grid, kernelId), [grid, kernelId]);
  const kernel = CONV_KERNELS[kernelId];

  const featuredItems = ['banana', 'pet-bottle', 'newspaper', 'mango', 'poly-bag', 'cardboard'];

  return (
    <div className="vis-cols">
      <Card>
        <SorterScene
          item={item}
          pixelGrid={grid}
          features={features}
          prediction={pred}
          condition={DEFAULT_CONDITION}
          playing={playing}
          patchRow={patchRow}
          patchCol={patchCol}
          activePin={activePin}
          onPinClick={setActivePin}
          onPatchSelect={setPatch}
        />

        <div className="lab-row">
          <button type="button" className="btn" onClick={togglePlay}>
            {playing
              ? '⏸ ' + bi('Pause belt', 'বেল্ট থামান')
              : '▶ ' + bi('Run sorting belt', 'বাছাই বেল্ট চালান')}
          </button>
          <div className="vis-item-strip" role="group" aria-label={bi('Pick a waste item on the belt', 'বেল্টের বর্জ্য বাছুন')}>
            {featuredItems.map((id) => {
              const it = getWasteItem(id);
              return (
                <button
                  key={id}
                  type="button"
                  className={id === item.id ? 'vis-item-chip sel' : 'vis-item-chip'}
                  aria-pressed={id === item.id}
                  onClick={() => setActiveItem(id)}
                >
                  <WasteSvg itemId={id} size={26} />
                  <span>{pick(it.name)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="vis-bubbles">
          <Talk avatar="👷" who={bi('Sorting Plant Operator', 'প্ল্যান্ট অপারেটর')}>
            {bi(
              `I see a ${item.name.en.toLowerCase()}. Click any pixel on the 10×10 camera grid or any callout pin to see what the AI sees!`,
              `আমি দেখছি এটি একটি ${item.name.bn}। এআই কীভাবে দেখছে বুঝতে ১০×১০ পিক্সেল গ্রিড বা যেকোনো পিনে ক্লিক করুন!`,
            )}
          </Talk>
          <Talk avatar="📷" who={bi('WasteVision AI', 'ওয়েস্ট-ভিশন এআই')}>
            {bi(
              `I never see “${item.name.en}”. I see 300 RGB numbers, extract 6 visual cues (shine ${Math.round(features[2] * 100)}%, organic hue ${Math.round(features[0] * 100)}%) and route ${Math.round(pred.confidence * 100)}% to ${CLASS_META[pred.topClass].name[0]}.`,
              `আমি “${item.name.bn}” চিনি না। আমি ৩০০টি আরজিবি সংখ্যা থেকে ৬টি বৈশিষ্ট্য বের করি (চকচকে ${num(Math.round(features[2] * 100))}%, জৈব রঙ ${num(Math.round(features[0] * 100))}%) এবং ${num(Math.round(pred.confidence * 100))}% নিশ্চয়তায় ${CLASS_META[pred.topClass].name[1]} বিনে পাঠাই।`,
            )}
          </Talk>
        </div>

        {/* Live Vision Pipeline Console (echoing Lesson 13 Serial Monitor) */}
        <div className="vis-console">
          <div className="vis-console-head">
            <span>⚡ VISION TELEMETRY · 12 FPS · EDGE</span>
            <button type="button" className="chip-btn" onClick={toggleConsole}>
              {consoleOpen ? bi('Hide', 'লুকান') : bi('Show', 'দেখান')}
            </button>
          </div>
          {consoleOpen && (
            <div className="vis-console-body">
              {logs.map((ln, i) => (
                <div key={i} className="vis-console-line">
                  {ln}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Right Card: Lesson 6-style Interactive 3×3 Convolution Arithmetic & Feature Map! */}
      <Card
        title={bi('Inside a CNN layer: 3×3 filter arithmetic', 'সিএনএন স্তরের ভেতরে: ৩×৩ ফিল্টারের হিসাব')}
        aside={
          <Pill tone={patch.relu > 12 ? 'ok' : undefined}>
            ReLU = {num(patch.relu)}
          </Pill>
        }
      >
        <p className="muted vis-compact">
          {bi(
            'Just like Lesson 6’s neuron (input × weight), a convolutional layer slides a tiny 3×3 weight window over the pixels to light up edges, shine or colour.',
            'পাঠ ৬-এর নিউরনের মতোই (ইনপুট × গুণক), একটি কনভোলিউশন স্তর পিক্সেলের ওপর ৩×৩ গুণকের জানালা ঘুরিয়ে ধার, চকচকে ভাব বা রঙ খুঁজে বের করে।',
          )}
        </p>

        <div className="vis-kernel-btns" role="group" aria-label={bi('Convolution filter', 'কনভোলিউশন ফিল্টার')}>
          {KERNEL_IDS.map((kId) => (
            <button
              key={kId}
              type="button"
              className="chip-btn"
              aria-pressed={kernelId === kId}
              onClick={() => setKernel(kId)}
            >
              {pick(CONV_KERNELS[kId].name)}
            </button>
          ))}
        </div>
        <p className="vis-kernel-desc">{pick(kernel.desc)}</p>

        {/* 3×3 Pixel × 3×3 Kernel = Activation Sum */}
        <div className="vis-conv-eq">
          <div className="vis-mat-box">
            <span className="eyebrow">{bi('3×3 pixels', '৩×৩ পিক্সেল')}</span>
            <div className="vis-mat">
              {patch.inputs.flatMap((row, r) =>
                row.map((v, c) => (
                  <span key={`i-${r}-${c}`} className="mono">
                    {num(v)}
                  </span>
                )),
              )}
            </div>
          </div>
          <span className="vis-op" aria-hidden="true">
            ×
          </span>
          <div className="vis-mat-box">
            <span className="eyebrow">{bi('3×3 filter', '৩×৩ ফিল্টার')}</span>
            <div className="vis-mat weight">
              {patch.weights.flatMap((row, r) =>
                row.map((w, c) => (
                  <span key={`w-${r}-${c}`} className={w > 0 ? 'mono pos' : w < 0 ? 'mono neg' : 'mono'}>
                    {w > 0 ? `+${num(w)}` : num(w)}
                  </span>
                )),
              )}
            </div>
          </div>
          <span className="vis-op" aria-hidden="true">
            =
          </span>
          <div className="vis-sum-box" role="status">
            <span className="eyebrow">{bi('Sum → ReLU', 'যোগ → ReLU')}</span>
            <strong className="mono">{num(patch.rawSum)} → {num(patch.relu)}</strong>
            <small className="muted">
              {bi(`Cell (${patchRow}, ${patchCol})`, `ঘর (${num(patchRow)}, ${num(patchCol)})`)}
            </small>
          </div>
        </div>

        {/* 8×8 Interactive Activation Feature Map */}
        <div className="vis-fmap-wrap">
          <div>
            <span className="eyebrow">{bi('Activation feature map (click any cell)', 'অ্যাক্টিভেশন ফিচার ম্যাপ (যেকোনো ঘরে ক্লিক করুন)')}</span>
            <div className="vis-fmap" role="grid" aria-label={bi('8×8 feature map', '৮×৮ ফিচার ম্যাপ')}>
              {featureMap.map((row, r) =>
                row.map((val, c) => {
                  const sel = r + 1 === patchRow && c + 1 === patchCol;
                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      className={sel ? 'vis-fmap-cell sel' : 'vis-fmap-cell'}
                      style={{ '--heat': val } as React.CSSProperties}
                      aria-label={bi(
                        `Inspect row ${r + 1} column ${c + 1}, activation ${Math.round(val * 100)}%`,
                        `সারি ${num(r + 1)} কলাম ${num(c + 1)}, সক্রিয়তা ${num(Math.round(val * 100))}%`,
                      )}
                      onClick={() => setPatch(r + 1, c + 1)}
                    />
                  );
                }),
              )}
            </div>
          </div>
          <div className="vis-fmap-legend">
            <span className="eyebrow">{bi('What lit up?', 'কী জ্বলে উঠল?')}</span>
            <p className="muted">
              {bi(
                'Bright teal squares are where this filter found a strong match. Stacking dozens of filters turns raw pixels into high-level cues like bottle shine or crumpled print.',
                'উজ্জ্বল টিল ঘরগুলোতে ফিল্টারটি শক্তিশালী মিল পেয়েছে। এমন বহু ফিল্টার একের পর এক সাজিয়েই কাঁচা পিক্সেল থেকে বোতলের চকচকে ভাব বা কাগজের ছাপা চেনা যায়।',
              )}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ==========================================================================
 * STEP 2: EXPLORE — Transfer Learning Architecture & 2D Feature Space Map
 * ========================================================================== */
function Explore() {
  const { bi, pick } = useT();
  const activeItemId = useVision((s) => s.activeItemId);
  const transferMode = useVision((s) => s.transferMode);
  const { setActiveItem, setTransferMode } = useVision.getState();

  const item = getWasteItem(activeItemId);
  const features = useMemo(() => extractFeatures(item, DEFAULT_CONDITION), [item]);

  return (
    <div className="vis-cols">
      <Card
        title={bi('Why 15 photos are enough: Transfer Learning', 'মাত্র ১৫টি ছবিই কেন যথেষ্ট: ট্রান্সফার লার্নিং')}
        aside={
          <Choice
            label={bi('Training strategy', 'প্রশিক্ষণের কৌশল')}
            value={transferMode}
            onChange={setTransferMode}
            options={[
              { value: 'transfer', label: '🧊 ' + bi('Transfer learning', 'ট্রান্সফার লার্নিং') },
              { value: 'scratch', label: '🏗️ ' + bi('From scratch', 'শুরু থেকে') },
            ]}
          />
        }
      >
        {/* Visual Deep CNN Stack Diagram */}
        <svg
          className="vis-tl-svg"
          viewBox="0 0 640 226"
          role="img"
          aria-label={bi(
            'Diagram comparing frozen pre-trained CNN layers plus a small trainable waste classifier head versus training every layer from scratch',
            'স্থির প্রি-ট্রেইনড সিএনএন স্তরের সাথে ছোট প্রশিক্ষণযোগ্য বর্জ্য হেড বনাম শুরু থেকে সব স্তর শেখানোর তুলনা চিত্র',
          )}
        >
          {/* Input photo tile */}
          <g transform="translate(12 50)">
            <rect width="74" height="104" rx="10" fill="var(--paper)" stroke="var(--line-strong)" strokeWidth="2" />
            <g transform="translate(7 6) scale(0.75)">
              <WasteGlyph itemId={item.id} />
            </g>
            <text x="37" y="88" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="var(--ink)">
              {bi('Webcam', 'ওয়েবক্যাম')}
            </text>
            <text x="37" y="100" textAnchor="middle" fontSize="8" fill="var(--ink-2)" fontFamily="var(--font-mono)">
              224×224
            </text>
          </g>

          {/* 3 CNN Backbone Layers */}
          {[
            {
              x: 112,
              h: 144,
              y: 30,
              title: bi('Layer 1', 'স্তর ১'),
              sub: bi('Edges & lines', 'ধার ও রেখা'),
              params: '0.2M',
            },
            {
              x: 214,
              h: 124,
              y: 40,
              title: bi('Layer 2–8', 'স্তর ২–৮'),
              sub: bi('Textures & gloss', 'টেক্সচার ও ঝলক'),
              params: '1.1M',
            },
            {
              x: 316,
              h: 104,
              y: 50,
              title: bi('Layer 9–16', 'স্তর ৯–১৬'),
              sub: bi('Shapes & parts', 'আকার ও অংশ'),
              params: '2.2M',
            },
          ].map((l) => {
            const frozen = transferMode === 'transfer';
            return (
              <g key={l.x}>
                <line
                  x1={l.x - 24}
                  y1="102"
                  x2={l.x}
                  y2="102"
                  stroke={frozen ? 'var(--c5)' : 'var(--warn)'}
                  strokeWidth="3"
                  strokeDasharray="5 4"
                />
                <rect
                  x={l.x}
                  y={l.y}
                  width="78"
                  height={l.h}
                  rx="10"
                  fill={frozen ? 'var(--no-soft)' : 'var(--warn-soft)'}
                  stroke={frozen ? 'var(--no)' : 'var(--warn)'}
                  strokeWidth="2.2"
                />
                <text x={l.x + 39} y={l.y + 24} textAnchor="middle" fontSize="15">
                  {frozen ? '🧊' : '🔥'}
                </text>
                <text x={l.x + 39} y={l.y + 44} textAnchor="middle" fontSize="10.5" fontWeight="800" fill="var(--ink)">
                  {l.title}
                </text>
                <text x={l.x + 39} y={l.y + 60} textAnchor="middle" fontSize="9" fill="var(--ink-2)">
                  {l.sub}
                </text>
                <text x={l.x + 39} y={l.y + l.h - 14} textAnchor="middle" fontSize="8.2" fontWeight="700" fill="var(--ink-2)" fontFamily="var(--font-mono)">
                  {l.params} {frozen ? 'LOCKED' : 'TRAIN'}
                </text>
              </g>
            );
          })}

          {/* Arrow to 6-feature bottleneck */}
          <line x1="394" y1="102" x2="424" y2="102" stroke="var(--accent)" strokeWidth="3" />
          <g transform="translate(424 52)">
            <rect width="58" height="100" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
            <text x="29" y="18" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--ink)">
              {bi('Features', 'বৈশিষ্ট্য')}
            </text>
            {features.map((v, i) => (
              <rect
                key={i}
                x="8"
                y={26 + i * 11}
                width={Math.max(5, Math.round(v * 42))}
                height="7"
                rx="3"
                fill="var(--accent)"
              />
            ))}
          </g>

          {/* Trainable Softmax Waste Head */}
          <line x1="482" y1="102" x2="508" y2="102" stroke="var(--warn)" strokeWidth="3" />
          <g transform="translate(508 42)">
            <rect width="118" height="120" rx="10" fill="var(--warn-soft)" stroke="var(--warn)" strokeWidth="2.4" />
            <text x="59" y="22" textAnchor="middle" fontSize="14">
              🔥
            </text>
            <text x="59" y="39" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="var(--ink)">
              {bi('Waste Head', 'বর্জ্য হেড')}
            </text>
            <text x="59" y="54" textAnchor="middle" fontSize="8.5" fill="var(--ink-2)">
              {bi('Only 21 weights!', 'মাত্র ২১টি গুণক!')}
            </text>
            <text x="59" y="76" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--ok)">
              🥬 {bi('Organic', 'জৈব')}
            </text>
            <text x="59" y="92" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--c5)">
              🧴 {bi('Plastic', 'প্লাস্টিক')}
            </text>
            <text x="59" y="108" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--c2)">
              📄 {bi('Paper', 'কাগজ')}
            </text>
          </g>

          {/* Bottom Comparison Banner */}
          <rect
            x="12"
            y="186"
            width="614"
            height="32"
            rx="8"
            fill={transferMode === 'transfer' ? 'var(--accent-soft)' : 'var(--warn-soft)'}
          />
          <text x="319" y="206" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ink)">
            {transferMode === 'transfer'
              ? bi(
                  'Transfer Learning (Teachable Machine): ~15 photos · 2 seconds on a laptop · 3.5M weights reused!',
                  'ট্রান্সফার লার্নিং (Teachable Machine): ~১৫টি ছবি · ল্যাপটপে ২ সেকেন্ড · ৩৫ লক্ষ গুণক পুনর্ব্যবহার!',
                )
              : bi(
                  'Training from scratch: ~10,000+ photos · hours on a GPU · must re-learn edges & textures from zero!',
                  'শুরু থেকে প্রশিক্ষণ: ~১০,০০০+ ছবি · GPU-তে ঘণ্টার পর ঘণ্টা · শূন্য থেকে ধার ও টেক্সচার শিখতে হয়!',
                )}
          </text>
        </svg>

        {/* 2D Feature Space Scatter Plot: Specular Shine vs Organic/Paper Axis */}
        <div className="vis-scatter-section">
          <div>
            <span className="eyebrow">
              {bi(
                'What the frozen backbone already separates (click any waste dot)',
                'স্থির ব্যাকবোন আগেই যা আলাদা করে ফেলেছে (যেকোনো বিন্দুতে ক্লিক করুন)',
              )}
            </span>
            <svg
              className="vis-scatter-svg"
              viewBox="0 0 420 220"
              role="img"
              aria-label={bi(
                '2D scatter plot of waste items by Specular Shine and Organic vs Paper fiber score',
                'চকচকে প্রতিফলন বনাম জৈব-কাগজ অক্ষে বর্জ্যের ২ডি স্ক্যাটার প্লট',
              )}
            >
              <rect x="44" y="14" width="358" height="172" rx="8" fill="var(--paper)" stroke="var(--line)" />
              {/* Region tints */}
              <rect x="44" y="14" width="160" height="86" fill="#16a34a" opacity="0.08" />
              <rect x="235" y="14" width="167" height="172" fill="#0284c7" opacity="0.08" />
              <rect x="44" y="100" width="160" height="86" fill="#ea580c" opacity="0.08" />
              <text x="54" y="30" fontSize="9.5" fontWeight="800" fill="var(--ok)">
                🥬 {bi('Organic zone', 'জৈব এলাকা')}
              </text>
              <text x="392" y="30" textAnchor="end" fontSize="9.5" fontWeight="800" fill="var(--c5)">
                🧴 {bi('Plastic zone (high shine)', 'প্লাস্টিক এলাকা (চকচকে)')}
              </text>
              <text x="54" y="178" fontSize="9.5" fontWeight="800" fill="var(--c2)">
                📄 {bi('Paper zone (matte & warm)', 'কাগজ এলাকা (অনুজ্জ্বল)')}
              </text>

              {/* Axes */}
              <text x="223" y="208" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-2)">
                {bi('Specular shine / gloss →', 'চকচকে প্রতিফলন →')}
              </text>
              <text transform="translate(16 100) rotate(-90)" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-2)">
                {bi('Paper ←  Hue  → Organic', 'কাগজ ← রঙ → জৈব')}
              </text>

              {TRAIN_ITEMS.map((it) => {
                const f = extractFeatures(it, DEFAULT_CONDITION);
                const x = 56 + f[2] * 324; // specular shine
                const yVal = 0.5 + (f[0] - f[1]) * 0.5; // organic vs paper warmth
                const y = 172 - Math.max(0.08, Math.min(0.92, yVal)) * 138;
                const sel = it.id === item.id;
                const fill =
                  it.trueClass === 'organic'
                    ? '#16a34a'
                    : it.trueClass === 'plastic'
                      ? '#0284c7'
                      : '#ea580c';
                // Dedicated clean label offsets so dots in the same cluster never collide
                const offsets: Record<string, [number, number, 'start' | 'middle' | 'end']> = {
                  banana: [11, -3, 'start'],
                  mango: [11, 5, 'start'],
                  'veg-scraps': [11, -11, 'start'],
                  'tea-leaves': [11, 14, 'start'],
                  'pet-bottle': [-11, -9, 'end'],
                  'poly-bag': [-11, 4, 'end'],
                  'soda-bottle': [-11, -12, 'end'],
                  'food-tub': [-11, 14, 'end'],
                  newspaper: [11, -8, 'start'],
                  cardboard: [11, 12, 'start'],
                  'paper-cup': [11, 3, 'start'],
                  'kraft-bag': [11, -1, 'start'],
                };
                const [dx, dy, anchor] = offsets[it.id] ?? [0, -10, 'middle'];
                return (
                  <g
                    key={it.id}
                    className="vis-dot-btn"
                    onClick={() => setActiveItem(it.id)}
                    role="button"
                    tabIndex={0}
                    aria-label={pick(it.name)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveItem(it.id);
                      }
                    }}
                  >
                    {sel && <circle cx={x} cy={y} r="12" fill="none" stroke="var(--ink)" strokeWidth="2.5" />}
                    <circle cx={x} cy={y} r={sel ? 7.5 : 6} fill={fill} stroke="#ffffff" strokeWidth="1.8" />
                    <text
                      x={x + dx}
                      y={y + dy}
                      textAnchor={anchor}
                      fontSize={sel ? '9' : '8'}
                      fontWeight={sel ? 800 : 600}
                      fill="var(--ink)"
                    >
                      {pick(it.name)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </Card>

      {/* Right Card: 6-Feature Backbone Fingerprint of the selected item */}
      <Card
        title={bi('Backbone visual fingerprint', 'ব্যাকবোনের ভিজ্যুয়াল ফিঙ্গারপ্রিন্ট')}
        aside={
          <Pill tone="ok">
            {CLASS_META[item.trueClass as WasteClass]?.icon ?? '🥫'} {pick(item.name)}
          </Pill>
        }
      >
        <div className="vis-fp-hero">
          <WasteSvg itemId={item.id} size={64} />
          <div>
            <strong>{pick(item.name)}</strong>
            <p className="muted">{pick(item.note)}</p>
          </div>
        </div>

        <Bars
          items={FEATURE_NAMES.map((fn, i) => ({
            key: fn.key,
            label: pick(fn.label),
            value: features[i],
          }))}
        />

        <Callout kind="lesson">
          {bi(
            'Because the frozen backbone already turns photos into clean numerical cues, your small 3-class head only has to learn which cues vote for Organic, Plastic or Paper.',
            'স্থির ব্যাকবোন আগেই ছবিকে পরিষ্কার সংখ্যার বৈশিষ্ট্যে রূপ দেয়—তাই আপনার ছোট ৩-শ্রেণির হেডকে শুধু শিখতে হয় কোন বৈশিষ্ট্য জৈব, প্লাস্টিক বা কাগজের পক্ষে ভোট দেয়।',
          )}
        </Callout>
      </Card>
    </div>
  );
}

/* ==========================================================================
 * STEP 3: TRAIN — Live 3-Class Waste Studio (Mini Teachable Machine)
 * ========================================================================== */
function Train() {
  const { bi, num, pick } = useT();
  const samples = useVision((s) => s.samples);
  const model = useVision((s) => s.model);
  const lossHistory = useVision((s) => s.lossHistory);
  const accHistory = useVision((s) => s.accHistory);
  const minConfidence = useVision((s) => s.minConfidence);
  const {
    addItemSample,
    addCustomSample,
    removeSample,
    loadSamplePreset,
    resetHead,
    trainSteps,
  } = useVision.getState();

  const counts: Record<WasteClass, number> = {
    organic: samples.filter((s) => s.label === 'organic').length,
    plastic: samples.filter((s) => s.label === 'plastic').length,
    paper: samples.filter((s) => s.label === 'paper').length,
  };
  const maxC = Math.max(counts.organic, counts.plastic, counts.paper);
  const minC = Math.min(counts.organic, counts.plastic, counts.paper);
  const isImbalanced = maxC >= Math.max(3, minC * 3);

  return (
    <div className="vis-cols">
      <Card
        title={bi('Mini Teachable Machine: Collect waste samples', 'মিনি Teachable Machine: বর্জ্যের নমুনা সংগ্রহ')}
        aside={
          <div className="lab-row">
            <button type="button" className="chip-btn" onClick={() => loadSamplePreset('balanced')}>
              ✨ {bi('Balanced (12)', 'সুষম (১২)')}
            </button>
            <button type="button" className="chip-btn brk" onClick={() => loadSamplePreset('imbalanced')}>
              ⚖️ {bi('Imbalanced trap', 'অসম নমুনার ফাঁদ')}
            </button>
          </div>
        }
      >
        {isImbalanced && (
          <Callout kind="break" title={bi('Class imbalance warning', 'শ্রেণি অসমতার সতর্কতা')}>
            {bi(
              `One bin has ${maxC} photos while another has only ${minC}. The trained head will favour the crowded class even on doubtful items!`,
              `একটি বিনে ${num(maxC)}টি ছবি অথচ আরেকটিতে মাত্র ${num(minC)}টি। মডেল সন্দেহজনক বস্তুকেও বেশি ছবির শ্রেণির দিকে টানবে!`,
            )}
          </Callout>
        )}

        <div className="vis-buckets">
          {WASTE_CLASSES.map((cls) => {
            const clsSamples = samples.filter((s) => s.label === cls);
            const tray = availableTrainItemsFor(cls);
            return (
              <section key={cls} className={`vis-bucket ${cls}`}>
                <header className="vis-bucket-head">
                  <strong>
                    {CLASS_META[cls].icon} {bi(CLASS_META[cls].name[0], CLASS_META[cls].name[1])}
                  </strong>
                  <span className="mono vis-count">
                    {num(clsSamples.length)} {bi('photos', 'ছবি')}
                  </span>
                </header>

                <div className="vis-sample-thumbs">
                  {clsSamples.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="vis-thumb"
                      title={bi('Click to remove sample', 'বাদ দিতে ক্লিক করুন')}
                      onClick={() => removeSample(s.id)}
                    >
                      {s.itemId ? (
                        <WasteSvg itemId={s.itemId} size={32} />
                      ) : (
                        <span className="vis-cam-badge">📷 {s.customLabel}</span>
                      )}
                      <span className="vis-thumb-x" aria-hidden="true">
                        ×
                      </span>
                    </button>
                  ))}
                  {clsSamples.length === 0 && (
                    <span className="muted vis-empty">{bi('Empty bin — add samples below', 'খালি — নিচ থেকে ছবি যোগ করুন')}</span>
                  )}
                </div>

                <div className="vis-add-row">
                  {tray.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      className="chip-btn"
                      onClick={() => addItemSample(cls, it.id)}
                    >
                      + {pick(it.name)}
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Optional Local Webcam Capture */}
        <WebcamMini
          mode="capture"
          model={model}
          minConfidence={minConfidence}
          onCapture={(label, feat, name) => addCustomSample(label, feat, name)}
        />
      </Card>

      {/* Right Card: Train the 21-parameter Softmax Head + Loss Curve + Weight Heatmap */}
      <Card
        title={bi('Train the 21-weight classifier head', '২১-গুণের ক্লাসিফায়ার হেড প্রশিক্ষণ')}
        aside={
          <Pill tone={model.epochs > 0 ? 'ok' : 'warn'}>
            {bi('Epochs', 'ধাপ')}: {num(model.epochs)}
          </Pill>
        }
      >
        <div className="lab-row">
          <button
            type="button"
            className="btn"
            disabled={samples.length === 0}
            onClick={() => trainSteps(20)}
          >
            🔥 {bi('Train +20 epochs', '+২০ ধাপ শেখান')}
          </button>
          <button
            type="button"
            className="btn ghost"
            disabled={samples.length === 0}
            onClick={() => trainSteps(1)}
          >
            +1 {bi('step', 'ধাপ')}
          </button>
          <button type="button" className="btn ghost" onClick={resetHead}>
            ↺ {bi('Reset weights', 'গুণক রিসেট')}
          </button>
        </div>

        <LineChart
          label={bi('Training loss & accuracy over epochs', 'ধাপ অনুযায়ী প্রশিক্ষণের ভুল ও নির্ভুলতা')}
          height={175}
          ymin={0}
          ymax={1.2}
          series={[
            {
              values: lossHistory.length ? lossHistory : [1.1],
              color: 'var(--warn)',
              label: bi('Cross-entropy loss (lower is better)', 'ভুলের হার (কম হলে ভালো)'),
            },
            {
              values: accHistory.length ? accHistory.map((a) => a / 100) : [0.33],
              color: 'var(--accent)',
              label: bi('Training accuracy (0–1)', 'প্রশিক্ষণের নির্ভুলতা (০–১)'),
            },
          ]}
        />

        {/* Visual 3×6 Weight Matrix Heatmap */}
        <div className="vis-wmap-wrap">
          <span className="eyebrow">
            {bi('Learned head weights (teal = votes FOR, orange = votes AGAINST)', 'শেখা গুণক মানচিত্র (টিল = পক্ষে ভোট, কমলা = বিপক্ষে ভোট)')}
          </span>
          <table className="vis-wmap">
            <thead>
              <tr>
                <th scope="col">{bi('Feature', 'বৈশিষ্ট্য')}</th>
                {WASTE_CLASSES.map((cls) => (
                  <th key={cls} scope="col">
                    {CLASS_META[cls].icon} {bi(CLASS_META[cls].name[0], CLASS_META[cls].name[1])}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_NAMES.map((fn, fi) => (
                <tr key={fn.key}>
                  <td>{pick(fn.label)}</td>
                  {WASTE_CLASSES.map((cls, ci) => {
                    const w = model.weights[ci][fi];
                    const mag = Math.min(1, Math.abs(w) / 2.2);
                    const clsName = w >= 0 ? 'w-pos' : 'w-neg';
                    return (
                      <td
                        key={cls}
                        className={`mono ${clsName}`}
                        style={{ '--mag': mag } as React.CSSProperties}
                      >
                        {w >= 0 ? `+${num(w.toFixed(1))}` : `−${num(Math.abs(w).toFixed(1))}`}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ==========================================================================
 * STEP 4: EVALUATE — Animated Score Rings + 6 Unseen Waste Cards + Confusion Matrix
 * ========================================================================== */
function Evaluate() {
  const { bi, num, pick } = useT();
  const model = useVision((s) => s.model);
  const evalItemId = useVision((s) => s.evalItemId);
  const minConfidence = useVision((s) => s.minConfidence);
  const { setEvalItem } = useVision.getState();

  const summary = useMemo(
    () => evaluateBatch(model, EVAL_ITEMS, DEFAULT_CONDITION, minConfidence),
    [model, minConfidence],
  );
  const selectedRow =
    summary.rows.find((r) => r.item.id === evalItemId) ?? summary.rows[0];

  return (
    <div className="vis-cols">
      <Card
        title={bi('Test on 6 unseen waste items', '৬টি অদেখা বর্জ্যে পরীক্ষা')}
        aside={
          <Pill tone={summary.accuracyPct >= 80 ? 'ok' : 'warn'}>
            {num(summary.correct)} / {num(summary.total)} {bi('sorted cleanly', 'সঠিক বাছাই')}
          </Pill>
        }
      >
        <div className="vis-rings">
          <ScoreRing
            pct={summary.accuracyPct}
            label={bi('Unseen accuracy', 'অদেখা নির্ভুলতা')}
            warn={summary.accuracyPct < 70}
          />
          <ScoreRing
            pct={summary.purityPct}
            label={bi('Bin purity', 'বিনের বিশুদ্ধতা')}
            warn={summary.purityPct < 80}
          />
          <ScoreRing
            pct={summary.avgConfidencePct}
            label={bi('Avg confidence', 'গড় আত্মবিশ্বাস')}
          />
        </div>

        <div className="vis-eval-grid">
          {summary.rows.map(({ item, prediction, ok }) => {
            const conf = Math.round(prediction.confidence * 100);
            const isSel = item.id === selectedRow.item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={isSel ? 'vis-eval-card sel' : 'vis-eval-card'}
                aria-pressed={isSel}
                onClick={() => setEvalItem(item.id)}
              >
                <WasteSvg itemId={item.id} size={46} />
                <b>{pick(item.name)}</b>
                <span className="muted mono">
                  {prediction.routedTo === 'manual'
                    ? '✋ ' + bi('Manual', 'মানুষ')
                    : `${CLASS_META[prediction.topClass].icon} ${num(conf)}%`}
                </span>
                <span className={ok ? 'vis-stamp ok' : prediction.routedTo === 'manual' ? 'vis-stamp mid' : 'vis-stamp bad'}>
                  {ok
                    ? '✓ ' + bi('SORTED', 'সঠিক')
                    : prediction.routedTo === 'manual'
                      ? '✋ ' + bi('REVIEW', 'যাচাই')
                      : '✕ ' + bi('WRONG', 'ভুল')}
                </span>
              </button>
            );
          })}
        </div>

        <WebcamMini mode="predict" model={model} minConfidence={minConfidence} />
      </Card>

      <Card title={bi('Selected item & 3×3 confusion matrix', 'নির্বাচিত বস্তু ও ৩×৩ কনফিউশন ম্যাট্রিক্স')}>
        <div className="vis-fp-hero">
          <WasteSvg itemId={selectedRow.item.id} size={56} />
          <div>
            <strong>{pick(selectedRow.item.name)}</strong>
            <p className="muted">{pick(selectedRow.item.note)}</p>
          </div>
        </div>

        <Bars
          items={WASTE_CLASSES.map((cls) => ({
            key: cls,
            label: `${CLASS_META[cls].icon} ${bi(CLASS_META[cls].name[0], CLASS_META[cls].name[1])}`,
            value: selectedRow.prediction.probs[cls],
          }))}
        />

        <div className="vis-cm-wrap">
          <span className="eyebrow">
            {bi('Confusion matrix (rows = true material, columns = predicted bin)', 'কনফিউশন ম্যাট্রিক্স (সারি = আসল বর্জ্য, কলাম = মডেলের বিন)')}
          </span>
          <table className="vis-cm">
            <thead>
              <tr>
                <th>{bi('True \\ Pred', 'আসল \\ মডেল')}</th>
                {WASTE_CLASSES.map((c) => (
                  <th key={c}>{CLASS_META[c].icon}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WASTE_CLASSES.map((trueC, ri) => (
                <tr key={trueC}>
                  <th>
                    {CLASS_META[trueC].icon} {bi(CLASS_META[trueC].name[0], CLASS_META[trueC].name[1])}
                  </th>
                  {WASTE_CLASSES.map((predC, ci) => {
                    const count = summary.confusion[ri][ci];
                    const diag = ri === ci;
                    return (
                      <td
                        key={predC}
                        className={`mono ${diag ? 'cm-ok' : count > 0 ? 'cm-err' : 'cm-zero'}`}
                      >
                        {num(count)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ==========================================================================
 * STEP 5: BREAK IT — Lighting, Blue-Tray Shortcut & Unseen Aluminum Metal Can
 * ========================================================================== */
function BreakIt() {
  const { bi, num, pick } = useT();
  const breakItemId = useVision((s) => s.breakItemId);
  const condition = useVision((s) => s.condition);
  const minConfidence = useVision((s) => s.minConfidence);
  const activePin = useVision((s) => s.activePin);
  const model = useVision((s) => s.model);
  const { setBreakItem, setCondition, setMinConfidence, setActivePin, applyBreakPreset } =
    useVision.getState();

  const item = getWasteItem(breakItemId);
  const grid = useMemo(() => renderPixelGrid(item, condition), [item, condition]);
  const features = useMemo(() => extractFeatures(item, condition), [item, condition]);
  const pred = useMemo(() => predictHead(model, features, minConfidence), [model, features, minConfidence]);
  const confPct = Math.round(pred.confidence * 100);

  const isOod = item.trueClass === 'metal';
  const fooledConfidently =
    (isOod && pred.routedTo !== 'manual') ||
    (!isOod && pred.routedTo !== 'manual' && pred.routedTo !== item.trueClass);

  const breakItemsToPick = [
    getWasteItem('metal-can'),
    getWasteItem('banana'),
    getWasteItem('pet-bottle'),
    ...BREAK_ITEMS.filter((x) => x.id !== 'metal-can'),
  ];

  return (
    <div className="vis-cols">
      <Card>
        <SorterScene
          item={item}
          pixelGrid={grid}
          features={features}
          prediction={pred}
          condition={condition}
          playing={false}
          patchRow={4}
          patchCol={4}
          activePin={activePin}
          onPinClick={setActivePin}
          showAttentionShortcut={condition.shortcutBias && condition.background === 'blue-tray'}
        />

        <div className="vis-bubbles">
          <Talk avatar="⚠️" who={bi('Failure Diagnosis', 'ব্যর্থতার বিশ্লেষণ')}>
            {isOod ? (
              pred.routedTo === 'manual' ? (
                bi(
                  `Caught by confidence cutoff (${confPct}% < ${Math.round(minConfidence * 100)}%)! Routed to human review — though a dedicated “Metal / Other” class is even safer.`,
                  `আত্মবিশ্বাস সীমা (${num(confPct)}% < ${num(Math.round(minConfidence * 100))}%) এটিকে ধরে ফেলেছে! তবে আলাদা “ধাতু / অন্যান্য” শ্রেণি যোগ করা আরও নিরাপদ।`,
                )
              ) : (
                bi(
                  `DANGER: The model NEVER saw aluminum metal, yet softmax forced 100% across its 3 bins and shouted ${CLASS_META[pred.topClass].name[0]} (${confPct}%)! High confidence ≠ correctness.`,
                  `সতর্কতা: মডেল কখনো অ্যালুমিনিয়াম ক্যান দেখেনি, তবুও সফটম্যাক্স ৩টি বিনে ১০০% ভাগ করে ${num(confPct)}% আত্মবিশ্বাসে ${CLASS_META[pred.topClass].name[1]} বলেছে! উচ্চ আত্মবিশ্বাস মানেই সঠিকতা নয়।`,
                )
              )
            ) : condition.shortcutBias && condition.background === 'blue-tray' ? (
              bi(
                `Shortcut learning! Because Plastic training photos were taken on a blue tray, the AI stares at the blue tray beneath the ${item.name.en.toLowerCase()} and predicts ${CLASS_META[pred.topClass].name[0]} (${confPct}%)!`,
                `শর্টকাট শেখা! নীল ট্রেতে প্লাস্টিকের ছবি তোলায় এআই ${item.name.bn}-এর বদলে নিচের নীল ট্রের দিকে তাকিয়ে ${num(confPct)}% নিশ্চয়তায় ${CLASS_META[pred.topClass].name[1]} বলছে!`,
              )
            ) : condition.lighting === 'dim-yellow' && !condition.autoWhiteBalance ? (
              bi(
                `Evening yellow light turned bright highlights warm brown — dropping accuracy on glossy plastics. Try switching on Auto White-Balance!`,
                `সন্ধ্যার হলুদ আলো চকচকে ঝলককে বাদামী করে দিয়েছে। অটো হোয়াইট-ব্যালেন্স চালু করে পার্থক্য দেখুন!`,
              )
            ) : (
              pick(item.note)
            )}
          </Talk>
        </div>

        <Callout kind={fooledConfidently ? 'break' : 'lesson'}>
          {fooledConfidently
            ? bi(
                'Notice how confident the bar looks even when the bin is completely wrong! Softmax always sums to 100% — it cannot say “I have never seen this material” unless you add an Other/Reject class and test real lighting.',
                'দেখুন ভুল বিনে পাঠানোর পরও বারটি কতটা আত্মবিশ্বাসী! সফটম্যাক্সের যোগফল সবসময় ১০০%—তাই আলাদা “অন্যান্য” শ্রেণি ও বাস্তব আলোতে পরীক্ষা ছাড়া মডেল বলতে পারে না “এটি অচেনা বস্তু”।',
              )
            : bi(
                'Good catch! Now try the other failure modes on the right — especially the shiny aluminum can — to see where even a confidence threshold breaks down.',
                'দারুণ! এবার ডান দিকের অন্য সমস্যাগুলো পরীক্ষা করুন—বিশেষ করে চকচকে ধাতব ক্যান—দেখতে কোথায় আত্মবিশ্বাস সীমাও ব্যর্থ হয়।',
              )}
        </Callout>
      </Card>

      <Card title={bi('Break the camera & test guardrails', 'ক্যামেরা বিভ্রান্ত করুন ও সুরক্ষা যাচাই করুন')}>
        <span className="eyebrow">{bi('1. One-click failure scenarios', '১. এক ক্লিকে ব্যর্থতার পরীক্ষা')}</span>
        <div className="lab-row">
          <button
            type="button"
            className="chip-btn brk"
            aria-pressed={breakItemId === 'metal-can'}
            onClick={() => applyBreakPreset('metal-can')}
          >
            🥫 {bi('Unseen metal can', 'অদেখা ধাতব ক্যান')}
          </button>
          <button
            type="button"
            className="chip-btn brk"
            aria-pressed={condition.shortcutBias && condition.background === 'blue-tray'}
            onClick={() => applyBreakPreset('blue-tray')}
          >
            🌿 {bi('Banana on blue tray', 'নীল ট্রেতে কলার খোসা')}
          </button>
          <button
            type="button"
            className="chip-btn brk"
            aria-pressed={condition.lighting === 'dim-yellow'}
            onClick={() => applyBreakPreset('dim-light')}
          >
            🌙 {bi('Dim yellow bulb', 'সন্ধ্যার হলুদ বাতি')}
          </button>
          <button
            type="button"
            className="chip-btn brk"
            aria-pressed={breakItemId === 'muddy-paper'}
            onClick={() => applyBreakPreset('muddy-paper')}
          >
            💧 {bi('Wet muddy paper', 'ভেজা কাদামাখা কাগজ')}
          </button>
        </div>

        <span className="eyebrow">{bi('2. Object under camera', '২. ক্যামেরার নিচের বস্তু')}</span>
        <div className="vis-item-strip">
          {breakItemsToPick.map((it) => (
            <button
              key={it.id}
              type="button"
              className={it.id === item.id ? 'vis-item-chip sel' : 'vis-item-chip'}
              onClick={() => setBreakItem(it.id)}
            >
              <WasteSvg itemId={it.id} size={24} />
              <span>{pick(it.name)}</span>
            </button>
          ))}
        </div>

        <span className="eyebrow">{bi('3. Room lighting & background', '৩. ঘরের আলো ও ব্যাকগ্রাউন্ড')}</span>
        <Choice
          label={bi('Room lighting', 'ঘরের আলো')}
          value={condition.lighting}
          onChange={(lighting) => setCondition({ lighting })}
          options={[
            { value: 'daylight', label: '☀️ ' + bi('Daylight', 'দিনের আলো') },
            { value: 'dim-yellow', label: '🌙 ' + bi('Dim yellow', 'হলুদ কম আলো') },
            { value: 'glare', label: '⚡ ' + bi('Harsh glare', 'তীব্র ঝলক') },
          ]}
        />

        <Choice
          label={bi('Tray background', 'ট্রের ব্যাকগ্রাউন্ড')}
          value={condition.background}
          onChange={(background) => setCondition({ background })}
          options={[
            { value: 'belt', label: bi('Grey belt', 'ধূসর বেল্ট') },
            { value: 'blue-tray', label: bi('Blue tray', 'নীল ট্রে') },
            { value: 'wood-table', label: bi('Wood table', 'কাঠের টেবিল') },
          ]}
        />

        <label className="vis-switch">
          <input
            type="checkbox"
            checked={condition.shortcutBias}
            onChange={(e) => setCondition({ shortcutBias: e.target.checked })}
          />
          <span>
            {bi(
              'Simulate background shortcut (model learned tray colour)',
              'ব্যাকগ্রাউন্ড শর্টকাট চালু করুন (মডেল ট্রের রঙ মুখস্থ করেছে)',
            )}
          </span>
        </label>

        <span className="eyebrow">{bi('4. Engineering guardrails', '৪. প্রকৌশলগত সুরক্ষা')}</span>
        <label className="vis-switch good">
          <input
            type="checkbox"
            checked={condition.autoWhiteBalance}
            onChange={(e) => setCondition({ autoWhiteBalance: e.target.checked })}
          />
          <span>
            {bi(
              'LED lighting hood + Auto White-Balance',
              'এলইডি লাইটিং হুড + অটো হোয়াইট-ব্যালেন্স',
            )}
          </span>
        </label>

        <Slider
          label={bi('Minimum confidence before auto-sorting', 'স্বয়ংক্রিয় বাছাইয়ের ন্যূনতম আত্মবিশ্বাস')}
          value={Math.round(minConfidence * 100)}
          min={50}
          max={95}
          step={5}
          format={(v) => `${num(v)}%`}
          onChange={(v) => setMinConfidence(v / 100)}
        />
      </Card>
    </div>
  );
}

/* ==========================================================================
 * STEP 6: APPLY — 4 Real Civic Vision Scenarios + Google Teachable Machine Launch
 * ========================================================================== */
const CIVIC_CASES: {
  id: VisionCivicCaseId;
  ico: string;
  title: [string, string];
  desc: [string, string];
  best: VisionSetupId;
  why: [string, string];
}[] = [
  {
    id: 'station',
    ico: '🏭',
    title: ['Ward Transfer Station Belt', 'ওয়ার্ড ট্রান্সফার স্টেশন বেল্ট'],
    desc: [
      'Conveyor sorting household waste all day, including stray metal cans and glass.',
      'সারা দিন গৃহস্থালি বর্জ্য বাছাইয়ের বেল্ট, মাঝে মাঝে ধাতব ক্যান ও কাচও আসে।',
    ],
    best: 'four-class-hood',
    why: [
      'Best fit: Enclosed LED hood stops lighting drift, a 4th “Metal / Other” class prevents overconfident misrouting, and uncertain items go to manual review.',
      'সবচেয়ে উপযুক্ত: বন্ধ এলইডি হুড আলোর পরিবর্তন আটকায়, ৪র্থ “ধাতু/অন্যান্য” শ্রেণি ভুল বাছাই কমায় এবং অনিশ্চিত বস্তু মানুষের কাছে যায়।',
    ],
  },
  {
    id: 'night-bin',
    ico: '🌙',
    title: ['Open-Air Night Market Smart Bin', 'রাতের খোলা বাজারের স্মার্ট বিন'],
    desc: [
      'Citizens toss items under flickering streetlamps, monsoon rain and varied shadows.',
      'রাস্তার হলুদ বাতি, বৃষ্টি ও নানা ছায়ার নিচে মানুষ বর্জ্য ফেলেন।',
    ],
    best: 'transfer-box',
    why: [
      'Best fit: Collect training photos across day & night light, add a small rain/glare hood, and run the lightweight transfer-learned model offline on an Edge device.',
      'সবচেয়ে উপযুক্ত: দিন ও রাতের আলোতে ছবি সংগ্রহ করুন, ছোট হুড লাগান এবং এজ ডিভাইসে অফলাইনে হালকা ট্রান্সফার মডেল চালান।',
    ],
  },
  {
    id: 'compost-metal',
    ico: '🧲',
    title: ['Spotting Nails & Cans Hidden in Compost', 'কম্পোস্টের ভেতরে লুকানো পেরেক ও ক্যান খোঁজা'],
    desc: [
      'Detecting buried iron nails and tin cans inside dark wet organic waste before shredding.',
      'মেশিনে দেওয়ার আগে ভেজা গাঢ় জৈব বর্জ্যের ভেতরে লুকানো পেরেক ও টিনের ক্যান ধরা।',
    ],
    best: 'metal-sensor',
    why: [
      'Right tool for the job! A camera cannot see inside a muddy pile — a cheap magnetic/inductive metal sensor beats computer vision completely here.',
      'কাজের জন্য সঠিক যন্ত্র! ক্যামেরা কাদামাখা স্তূপের ভেতর দেখতে পায় না—এখানে সাধারণ চুম্বক বা মেটাল সেন্সর ক্যামেরার চেয়ে বহুগুণ ভালো।',
    ],
  },
  {
    id: 'citizen-app',
    ico: '📱',
    title: ['Citizen Home Sorting Helper App', 'নাগরিকদের বাসায় বর্জ্য বাছাই অ্যাপ'],
    desc: [
      'Residents point their phone at kitchen items on diverse floors, tables and counters.',
      'বাসার মেঝে, টেবিল বা রান্নাঘরের নানা ব্যাকগ্রাউন্ডে নাগরিকরা ফোন ধরে বর্জ্য চিনবেন।',
    ],
    best: 'edge-phone',
    why: [
      'Best fit: Export a compact MobileNet model (e.g. from Teachable Machine) trained on many backgrounds so it runs privately on-phone with zero mobile data.',
      'সবচেয়ে উপযুক্ত: বিভিন্ন ব্যাকগ্রাউন্ডে শেখানো ছোট MobileNet মডেল (Teachable Machine থেকে) ফোনেই অফলাইনে চালান—গোপনীয়তা ও ডেটা দুই-ই বাঁচবে।',
    ],
  },
];

const SETUPS: { id: VisionSetupId; ico: string; label: [string, string] }[] = [
  { id: 'four-class-hood', ico: '💡', label: ['LED hood + 4 classes + manual chute', 'এলইডি হুড + ৪ শ্রেণি + ম্যানুয়াল চুট'] },
  { id: 'transfer-box', ico: '🌗', label: ['Day/night photos + Edge camera', 'দিন-রাতের ছবি + এজ ক্যামেরা'] },
  { id: 'metal-sensor', ico: '🧲', label: ['No camera — use metal sensor!', 'ক্যামেরা নয় — মেটাল সেন্সর!'] },
  { id: 'edge-phone', ico: '📱', label: ['Diverse backgrounds + on-phone model', 'নানা ব্যাকগ্রাউন্ড + ফোনে অফলাইন মডেল'] },
];

function Apply() {
  const { bi, num } = useT();
  const civicCase = useVision((s) => s.civicCase);
  const applySetup = useVision((s) => s.applySetup);
  const { setCivicCase, setApplySetup } = useVision.getState();

  const curCase = CIVIC_CASES.find((c) => c.id === civicCase) ?? CIVIC_CASES[0];
  const isRight = curCase.best === applySetup;

  return (
    <div className="vis-cols">
      <Card title={bi('Match the right vision setup to 4 city problems', '৪টি শহুরে কাজে সঠিক ভিশন সেটআপ বাছুন')}>
        <div className="vis-case-grid">
          {CIVIC_CASES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={c.id === civicCase ? 'vis-case-card sel' : 'vis-case-card'}
              aria-pressed={c.id === civicCase}
              onClick={() => setCivicCase(c.id)}
            >
              <span className="vis-case-ico" aria-hidden="true">
                {c.ico}
              </span>
              <div>
                <b>{bi(c.title[0], c.title[1])}</b>
                <p className="muted">{bi(c.desc[0], c.desc[1])}</p>
              </div>
            </button>
          ))}
        </div>

        <span className="eyebrow">{bi('Pick the engineering setup for this job', 'এই কাজের জন্য সঠিক সেটআপ বেছে নিন')}</span>
        <div className="lab-row">
          {SETUPS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="chip-btn"
              aria-pressed={applySetup === s.id}
              onClick={() => setApplySetup(s.id)}
            >
              {s.ico} {bi(s.label[0], s.label[1])}
            </button>
          ))}
        </div>

        <Callout
          kind={isRight ? 'lesson' : 'break'}
          title={isRight ? bi('Strong match!', 'সঠিক পছন্দ!') : bi('Think about the failure mode', 'ব্যর্থতার ঝুঁকি ভেবে দেখুন')}
        >
          <p role="status">{bi(curCase.why[0], curCase.why[1])}</p>
        </Callout>
      </Card>

      {/* External Reference Handoff Card — Google Teachable Machine (like Lesson 6's TensorFlow Playground handoff) */}
      <Card
        title={bi('Build it live with your real webcam', 'আসল ওয়েবক্যাম দিয়ে সরাসরি তৈরি করুন')}
        aside={<Pill tone="ok">Google Teachable Machine</Pill>}
      >
        <p className="lab-lead">
          {bi(
            'Ready to train a real MobileNet image recogniser on physical objects in your room? Open Google Teachable Machine and follow the 3-step waste recipe:',
            'ঘরের বাস্তব জিনিসপত্র দিয়ে আসল MobileNet মডেল শেখাতে প্রস্তুত? Google Teachable Machine খুলুন এবং ৩ ধাপের বর্জ্য অনুশীলনটি করুন:',
          )}
        </p>

        <ol className="vis-recipe">
          <li>
            <b className="mono">{num(1)}</b>
            <span>
              {bi(
                'Create 3 classes: Organic, Plastic and Paper (plus a 4th “Background / Other” class to catch empty belt & unseen items!).',
                '৩টি শ্রেণি বানান: জৈব, প্লাস্টিক ও কাগজ (সাথে ৪র্থ “অন্যান্য / খালি” শ্রেণি যোগ করলে অদেখা বস্তু ধরতে সুবিধা হয়!)।',
              )}
            </span>
          </li>
          <li>
            <b className="mono">{num(2)}</b>
            <span>
              {bi(
                'Hold each object at different angles and backgrounds (~20 webcam frames per class), then press Train Model.',
                'প্রতিটি বস্তু ভিন্ন কোণে ও ভিন্ন ব্যাকগ্রাউন্ডে ধরে ~২০টি করে ছবি তুলুন, তারপর Train Model চাপুন।',
              )}
            </span>
          </li>
          <li>
            <b className="mono">{num(3)}</b>
            <span>
              {bi(
                'Try breaking it live: dim the room lights or hold up keys / a phone and watch the confidence bar stay high even when wrong!',
                'সরাসরি ভেঙে দেখুন: ঘরের আলো কমান বা চাবি/ফোন ধরুন—দেখুন ভুল হলেও আত্মবিশ্বাসের বার কত উঁচু থাকে!',
              )}
            </span>
          </li>
        </ol>

        <div className="vis-handoff">
          <TeachableMachineLink primary />
        </div>
      </Card>
    </div>
  );
}
