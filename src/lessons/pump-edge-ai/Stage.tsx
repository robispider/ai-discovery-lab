import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  applyHeatDrift,
  PUMP_CLASS_NAMES,
  PUMP_SAMPLES,
  PUMP_TEST,
  synthPumpWave,
  TRUCK_TIMELINE,
} from '../../data/pumpSensors';
import {
  applyPersistenceGuard,
  compareEdgeVsCloud,
  evaluateAnyPumpAi,
  extractPumpFeatures,
  PUMP_AI_MODES,
  PUMP_CLASSES,
  predictTinyMlp,
  runPumpAi,
  WINDOW_SIZE,
  type PumpAiMode,
  type PumpClass,
} from '../../engines/iot/pump';
import { rng } from '../../engines/random';
import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Bars, Card, LineChart, Pill, Slider } from '../kit';
import './pump-edge-ai.css';
import { PumpRigScene } from './PumpRigScene';
import { usePumpEdge, type DeployBrainId, type DeployCaseId } from './store';

const AI_META: Record<
  PumpAiMode,
  { icon: string; name: [string, string]; sub: [string, string] }
> = {
  threshold: {
    icon: '📏',
    name: ['Loudness Rule', 'সরল কম্পন সীমা'],
    sub: ['IF RMS ≥ cutoff', 'শুধু মোট তীব্রতা দেখে'],
  },
  zscore: {
    icon: '🎯',
    name: ['Anomaly Z-Score', 'অ্যানোমালি জেড-স্কোর'],
    sub: ['Learns ONLY healthy hum', 'শুধু সুস্থ পাম্প থেকে শেখে'],
  },
  centroid: {
    icon: '🧭',
    name: ['Spectral Centroids', 'স্পেকট্রাল কেন্দ্র'],
    sub: ['FFT + 4 class stars (80 B)', 'ফ্রিকোয়েন্সি + ৪টি কেন্দ্র'],
  },
  'tiny-nn': {
    icon: '🧠',
    name: ['Tiny Neural Net', 'টাইনি নিউরাল নেটওয়ার্ক'],
    sub: ['5→6→4 MLP on ESP32 (256 B)', 'ESP32 চিপে ৫→৬→৪ নেটওয়ার্ক'],
  },
};

function AiPickerBar() {
  const { bi } = useT();
  const aiMode = usePumpEdge((s) => s.aiMode);
  const setAiMode = usePumpEdge((s) => s.setAiMode);

  return (
    <div className="pe-ai-bar" role="group" aria-label={bi('Choose Edge AI brain on ESP32', 'ESP32-তে এজ এআই বেছে নিন')}>
      {PUMP_AI_MODES.map((m) => {
        const meta = AI_META[m];
        return (
          <button
            key={m}
            type="button"
            className="pe-ai-card"
            aria-pressed={aiMode === m}
            onClick={() => setAiMode(m)}
          >
            <span className="pe-ai-ico" aria-hidden="true">
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
    <div className="pe-talk">
      <span className="pe-avatar" aria-hidden="true">
        {avatar}
      </span>
      <div className="pe-say" aria-live="polite">
        {who && <span className="pe-who">{who}</span>}
        {children}
      </div>
    </div>
  );
}

/** Optional offline Web Audio microphone capture for live room hum / desk-tap demos. */
function useLiveMic() {
  const [active, setActive] = useState(false);
  const [error, setError] = useState(false);
  const [samples, setSamples] = useState<number[] | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const stop = () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setActive(false);
    setSamples(null);
  };

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  const toggle = async () => {
    if (active) {
      stop();
      return;
    }
    setError(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unavailable');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new window.AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);

      const id = window.setInterval(() => {
        analyser.getFloatTimeDomainData(buf);
        const win = new Array<number>(WINDOW_SIZE);
        for (let i = 0; i < WINDOW_SIZE; i++) {
          win[i] = Math.max(-1.4, Math.min(1.4, buf[i * 8] * 4.5));
        }
        setSamples(win);
      }, 150);

      cleanupRef.current = () => {
        window.clearInterval(id);
        stream.getTracks().forEach((t) => t.stop());
        void ctx.close();
      };
      setActive(true);
    } catch {
      setError(true);
      setActive(false);
    }
  };

  return { active, error, samples, toggle, stop };
}

export function PumpEdgeStage() {
  const step = useLab((s) => s.step);
  const stopAll = usePumpEdge((s) => s.stopAll);

  useEffect(() => {
    return () => stopAll();
  }, [stopAll]);

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
  const aiMode = usePumpEdge((s) => s.aiMode);
  const liveKind = usePumpEdge((s) => s.liveKind);
  const waveSeed = usePumpEdge((s) => s.waveSeed);
  const playing = usePumpEdge((s) => s.playing);
  const activePin = usePumpEdge((s) => s.activePin);
  const serialOpen = usePumpEdge((s) => s.serialOpen);
  const serialLines = usePumpEdge((s) => s.serialLines);
  const bundle = usePumpEdge((s) => s.bundle);
  const rmsLimit = usePumpEdge((s) => s.rmsLimit);

  const { setLiveKind, togglePlay, setActivePin, toggleSerial, setRmsLimit } =
    usePumpEdge.getState();
  const mic = useLiveMic();

  const simSamples = useMemo(
    () => synthPumpWave(liveKind, rng(2400 + waveSeed)),
    [liveKind, waveSeed],
  );
  const activeSamples = mic.active && mic.samples ? mic.samples : simSamples;
  const feat = useMemo(() => extractPumpFeatures(activeSamples), [activeSamples]);
  const decision = useMemo(
    () => runPumpAi(aiMode, feat, bundle, { rmsLimit }),
    [aiMode, feat, bundle, rmsLimit],
  );

  const mechanicSpeech = mic.active
    ? bi(
        'Hum softly for low-frequency motor vibration, or tap your desk to simulate metallic bearing rattle!',
        'মোটরের গুনগুন বোঝাতে মৃদু শব্দ করুন, আর ধাতব বিয়ারিং ক্ষয় বোঝাতে টেবিলে টোকা দিন!',
      )
    : liveKind === 'bearing' && !decision.isFault
      ? bi(
          'Sparks are flying in the bearing, yet the red fault LED stayed OFF! Switch to Spectral or TinyNN above!',
          'বিয়ারিং ক্ষয়ে স্ফুলিঙ্গ উঠছে, অথচ লাল সতর্কবাতি জ্বলেনি! ওপরে স্পেকট্রাল বা নিউরাল এআই বেছে নিন!',
        )
      : liveKind === 'truck' && decision.isFault
        ? bi(
            'False alarm! That was just a cargo truck rolling past the window, not a broken pump!',
            'ভুয়া সাইরেন! ওটা পাম্পের ত্রুটি নয়, জানালার বাইরে দিয়ে মালবাহী ট্রাক গেল!',
          )
        : decision.isFault
          ? bi(
              'Red breadboard LED lit up! We can replace the bearing today before tonight’s monsoon storm.',
              'ব্রেডবোর্ডের লাল বাতি জ্বলেছে! আজ রাতের ঝড়ের আগেই আমরা বিয়ারিং বদলে ফেলতে পারব।',
            )
          : bi(
              'Smooth 25 Hz shaft hum — green LED steady, pump ready for monsoon duty.',
              'মসৃণ ২৫ Hz ঘূর্ণন—সবুজ বাতি স্থির, বর্ষার কাজের জন্য পাম্প প্রস্তুত।',
            );

  const chipSpeech =
    aiMode === 'threshold'
      ? bi(
          `I only check whether total RMS (${feat.rms.toFixed(2)}g) ≥ ${rmsLimit.toFixed(2)}g. Subtle high-pitch bearing rattle hides right past me!`,
          `আমি শুধু মোট RMS (${num(feat.rms.toFixed(2))}g) ≥ ${num(rmsLimit.toFixed(2))}g কি না দেখি। সূক্ষ্ম উচ্চ ফ্রিকোয়েন্সির বিয়ারিং ক্ষয় আমার চোখ এড়িয়ে যায়!`,
        )
      : aiMode === 'zscore'
        ? bi(
            `I studied ONLY healthy pumps! Current vibration is ${decision.zScore?.toFixed(1) ?? '0'}σ away from normal hum.`,
            `আমি শুধু সুস্থ পাম্প শিখেছি! বর্তমান কম্পন স্বাভাবিক অবস্থা থেকে ${num(decision.zScore?.toFixed(1) ?? '0')}σ দূরে।`,
          )
        : aiMode === 'tiny-nn'
          ? bi(
              `My 6 hidden neurons lit up on the 61–95 Hz band (${feat.highBand.toFixed(2)}) → ${decision.oledLine2}!`,
              `আমার ৬টি হিডেন নিউরন ৬১–৯৫ Hz ব্যান্ডে (${num(feat.highBand.toFixed(2))}) সক্রিয় হয়ে বলেছে → ${decision.oledLine2}!`,
            )
          : bi(
              `FFT split the wave into 3 bands; closest 80-byte centroid is ${decision.oledLine2}!`,
              `FFT তরঙ্গকে ৩টি ব্যান্ডে ভাগ করেছে; সবচেয়ে কাছের ৮০-বাইট কেন্দ্র হলো ${decision.oledLine2}!`,
            );

  return (
    <div className="lab-cols wide-left">
      <Card>
        <PumpRigScene
          kind={liveKind}
          micActive={mic.active}
          samples={activeSamples}
          features={feat}
          decision={decision}
          activePin={activePin}
          onPinClick={setActivePin}
        />

        <div className="lab-row">
          <button type="button" className="btn" onClick={togglePlay} disabled={mic.active}>
            {playing
              ? '⏸ ' + bi('Pause sensor stream', 'থামান')
              : '▶ ' + bi('Run live 200 Hz stream', '২০০ Hz সেন্সর চালান')}
          </button>
          <button
            type="button"
            className={mic.active ? 'btn warn' : 'btn ghost'}
            onClick={() => void mic.toggle()}
          >
            {mic.active
              ? '■ ' + bi('Stop live mic', 'মাইক বন্ধ করুন')
              : '🎙 ' + bi('Try live mic sensor', 'সরাসরি মাইক সেন্সর')}
          </button>
        </div>

        <div className="pe-bubbles">
          <Talk avatar="🧑‍🔧" who={bi('Pump Operator', 'পাম্প চালক')}>
            {mechanicSpeech}
          </Talk>
          <Talk avatar={AI_META[aiMode].icon} who={`ESP32 · ${bi(AI_META[aiMode].name[0], AI_META[aiMode].name[1])}`}>
            {chipSpeech}
          </Talk>
        </div>

        <div className="pe-serial">
          <div className="pe-serial-head">
            <span>⚡ SERIAL MONITOR · I2C 0x68 (MPU-6050)</span>
            <button type="button" className="chip-btn" onClick={toggleSerial}>
              {serialOpen ? bi('Hide', 'লুকান') : bi('Show', 'দেখান')}
            </button>
          </div>
          {serialOpen && (
            <div className="pe-serial-body">
              {serialLines.map((ln, i) => (
                <div key={i} className="pe-serial-line">
                  {ln}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card title={bi('Switch physical pump condition', 'পাম্পের ভৌত অবস্থা বদলান')}>
        <div className="lab-row">
          {PUMP_CLASSES.map((c) => (
            <button
              key={c}
              type="button"
              className="chip-btn"
              aria-pressed={!mic.active && liveKind === c}
              onClick={() => {
                if (mic.active) mic.stop();
                setLiveKind(c);
              }}
            >
              {c === 'bearing' ? '⚙️ ' : c === 'cavitation' ? '🫧 ' : c === 'healthy' ? '✅ ' : '⏸ '}
              {pick(PUMP_CLASS_NAMES[c])}
            </button>
          ))}
          <button
            type="button"
            className="chip-btn brk"
            aria-pressed={!mic.active && liveKind === 'truck'}
            onClick={() => {
              if (mic.active) mic.stop();
              setLiveKind('truck');
            }}
          >
            🚚 {bi('Drive heavy truck outside', 'বাইরে ভারী ট্রাক চালান')}
          </button>
        </div>

        {mic.error && (
          <p className="muted">
            {bi(
              'Microphone blocked in this browser mode — simulated 200 Hz accelerometer waves remain active.',
              'এই ব্রাউজারে মাইক্রোফোন অনুমতি মেলেনি—কৃত্রিম ২০০ Hz কম্পন সচল আছে।',
            )}
          </p>
        )}

        <span className="eyebrow">{bi('Live FFT frequency bands', 'সরাসরি FFT ফ্রিকোয়েন্সি ব্যান্ড')}</span>
        <Bars
          relative
          highlightTop={false}
          format={(v) => num(v.toFixed(2))}
          items={[
            { key: 'lo', label: bi('🟢 Low hum (5–32 Hz)', '🟢 নিচু গুনগুন (৫–৩২ Hz)'), value: feat.lowBand },
            { key: 'mi', label: bi('🟣 Mid swirl (33–60 Hz)', '🟣 মাঝারি ঘূর্ণি (৩৩–৬০ Hz)'), value: feat.midBand },
            { key: 'hi', label: bi('🟠 High rattle (61–95 Hz)', '🟠 ধাতব ঘর্ষণ (৬১–৯৫ Hz)'), value: feat.highBand },
          ]}
        />

        <Slider
          label={bi('Loudness Rule cutoff (RMS)', 'সরল নিয়মের কম্পন সীমা (RMS)')}
          value={rmsLimit}
          min={0.4}
          max={0.85}
          step={0.02}
          format={(v) => `${num(v.toFixed(2))} g`}
          onChange={setRmsLimit}
        />
      </Card>
    </div>
  );
}

function Explore() {
  const { bi, num, pick } = useT();
  const selectedSampleId = usePumpEdge((s) => s.selectedSampleId);
  const selectSample = usePumpEdge((s) => s.selectSample);

  const sample = useMemo(
    () => PUMP_SAMPLES.find((s) => s.id === selectedSampleId) ?? PUMP_SAMPLES[65],
    [selectedSampleId],
  );

  const colorFor: Record<PumpClass, string> = {
    idle: 'var(--c8)',
    healthy: 'var(--ok)',
    bearing: 'var(--warn)',
    cavitation: 'var(--c3)',
  };

  const W = 470;
  const H = 240;
  const P = { l: 46, r: 16, t: 16, b: 34 };

  const wavePath = sample.samples
    .map((v, i) => {
      const x = 14 + (i / (sample.samples.length - 1)) * 412;
      const y = 58 - Math.max(-1.3, Math.min(1.3, v)) * 38;
      return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join('');

  return (
    <div className="lab-cols wide-left">
      <Card
        title={bi(
          'Click any of the 160 sensor recordings to inspect its wave',
          'তরঙ্গ দেখতে ১৬০টি সেন্সর রেকর্ডিংয়ের যেকোনো বিন্দুতে ক্লিক করুন',
        )}
      >
        <svg className="pe-svg-box" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={bi('160 pump vibration windows plotted by mid swirl vs high rattle', '১৬০টি পাম্প কম্পন বিন্দুর প্লট')}>
          <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} stroke="var(--line-strong)" />
          <line x1={P.l} x2={P.l} y1={P.t} y2={H - P.b} stroke="var(--line-strong)" />
          <text x={(P.l + W - P.r) / 2} y={H - 8} textAnchor="middle" fontSize="11.5" fill="var(--ink-2)">
            {bi('Mid-band impeller swirl (33–60 Hz) →', 'মাঝারি ব্যান্ডের ঘূর্ণি (৩৩–৬০ Hz) →')}
          </text>
          <text
            x="14"
            y={(P.t + H - P.b) / 2}
            textAnchor="middle"
            fontSize="11.5"
            fill="var(--ink-2)"
            transform={`rotate(-90 14 ${(P.t + H - P.b) / 2})`}
          >
            {bi('High bearing rattle (61–95 Hz) →', 'উচ্চ ধাতব ঘর্ষণ (৬১–৯৫ Hz) →')}
          </text>

          {PUMP_SAMPLES.map((s) => {
            const cx = P.l + Math.min(1, s.features.midBand / 1.25) * (W - P.l - P.r);
            const cy = H - P.b - Math.min(1, s.features.highBand / 0.95) * (H - P.t - P.b);
            const sel = s.id === sample.id;
            return (
              <circle
                key={s.id}
                className="pe-dot"
                cx={cx}
                cy={cy}
                r={sel ? 7.5 : 4.2}
                fill={colorFor[s.label]}
                stroke={sel ? 'var(--ink)' : undefined}
                strokeWidth={sel ? 2.5 : undefined}
                opacity={sel ? 1 : 0.8}
                onClick={() => selectSample(s.id)}
              />
            );
          })}
        </svg>

        <div className="lab-legend">
          {PUMP_CLASSES.map((c) => (
            <span key={c}>
              <i style={{ background: colorFor[c] }} />
              {pick(PUMP_CLASS_NAMES[c])}
            </span>
          ))}
        </div>
      </Card>

      <Card
        title={`${bi('Selected window', 'নির্বাচিত তরঙ্গ')}: #${sample.id}`}
        aside={<Pill tone={sample.label === 'healthy' || sample.label === 'idle' ? 'ok' : 'warn'}>{pick(PUMP_CLASS_NAMES[sample.label])}</Pill>}
      >
        <svg className="pe-svg-box" viewBox="0 0 440 116" aria-label={bi('Oscilloscope wave', 'কম্পন তরঙ্গ')}>
          <line x1="14" y1="58" x2="426" y2="58" stroke="var(--line)" strokeDasharray="3 4" />
          <path d={wavePath} fill="none" stroke="var(--accent)" strokeWidth="2.2" />
        </svg>

        <Bars
          relative
          highlightTop={false}
          format={(v) => num(v.toFixed(2))}
          items={[
            { key: 'rms', label: bi('Total RMS (g)', 'মোট RMS (g)'), value: sample.features.rms },
            { key: 'lo', label: bi('Low 5–32 Hz', 'নিচু ৫–৩২ Hz'), value: sample.features.lowBand },
            { key: 'mi', label: bi('Mid 33–60 Hz', 'মাঝারি ৩৩–৬০ Hz'), value: sample.features.midBand },
            { key: 'hi', label: bi('High 61–95 Hz', 'উচ্চ ৬১–৯৫ Hz'), value: sample.features.highBand },
          ]}
        />
      </Card>
    </div>
  );
}

function NeuralNetDiagram() {
  const { bi, num } = useT();
  const bundle = usePumpEdge((s) => s.bundle);
  const liveKind = usePumpEdge((s) => s.liveKind);
  const waveSeed = usePumpEdge((s) => s.waveSeed);

  const feat = useMemo(
    () => extractPumpFeatures(synthPumpWave(liveKind, rng(2400 + waveSeed))),
    [liveKind, waveSeed],
  );
  const pred = useMemo(() => predictTinyMlp(bundle.mlp, feat), [bundle.mlp, feat]);

  const inLabels = ['Act', 'Low', 'Mid', 'High', 'Crest'];
  const outLabels = ['Idle', 'Healthy', 'Bearing', 'Cavit.'];
  const inY = [34, 72, 110, 148, 186];
  const hidY = [24, 58, 92, 126, 160, 194];
  const outY = [44, 88, 132, 176];

  return (
    <svg className="pe-svg-box" viewBox="0 0 460 218" role="img" aria-label={bi('5 to 6 to 4 TinyML neural network inside ESP32', 'ESP32 চিপের ভেতরে ৫ থেকে ৬ থেকে ৪ নিউরাল নেটওয়ার্ক')}>
      {/* Input -> Hidden edges */}
      {hidY.map((hy, hi) =>
        inY.map((iy, ii) => {
          const w = bundle.mlp.w1[hi][ii];
          return (
            <line
              key={`1-${hi}-${ii}`}
              x1="84"
              y1={iy}
              x2="224"
              y2={hy}
              stroke={w >= 0 ? 'var(--accent)' : 'var(--warn)'}
              strokeWidth={Math.min(3.2, 0.5 + Math.abs(w) * 1.1)}
              opacity="0.48"
            />
          );
        }),
      )}
      {/* Hidden -> Output edges */}
      {outY.map((oy, oi) =>
        hidY.map((hy, hi) => {
          const w = bundle.mlp.w2[oi][hi];
          return (
            <line
              key={`2-${oi}-${hi}`}
              x1="224"
              y1={hy}
              x2="362"
              y2={oy}
              stroke={w >= 0 ? 'var(--accent)' : 'var(--warn)'}
              strokeWidth={Math.min(3.2, 0.5 + Math.abs(w) * 1.1)}
              opacity="0.52"
            />
          );
        }),
      )}

      {/* Input nodes */}
      {inY.map((y, i) => (
        <g key={`in-${i}`} transform={`translate(84 ${y})`}>
          <circle r="12" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.8" />
          <text x="-18" y="4" textAnchor="end" fontSize="10" fontWeight="700" fill="var(--ink)">
            {inLabels[i]}
          </text>
        </g>
      ))}

      {/* Hidden ReLU nodes (glow proportional to live activation!) */}
      {hidY.map((y, i) => {
        const act = pred.hidden[i] ?? 0;
        return (
          <g key={`h-${i}`} transform={`translate(224 ${y})`}>
            <circle
              r="13"
              fill={act > 0.2 ? 'var(--accent-soft)' : 'var(--card)'}
              stroke={act > 0.2 ? 'var(--accent)' : 'var(--line-strong)'}
              strokeWidth={act > 0.2 ? 2.6 : 1.5}
            />
            <text y="3.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--ink)">
              {num(act.toFixed(1))}
            </text>
          </g>
        );
      })}

      {/* Output class nodes */}
      {outY.map((y, i) => {
        const cls = PUMP_CLASSES[i];
        const p = pred.probabilities[cls];
        const win = pred.predicted === cls;
        return (
          <g key={`o-${i}`} transform={`translate(362 ${y})`}>
            <circle
              r="14"
              fill={win ? 'var(--warn-soft)' : 'var(--card)'}
              stroke={win ? 'var(--warn)' : 'var(--ink)'}
              strokeWidth={win ? 3 : 1.5}
            />
            <text x="20" y="4" fontSize="10.5" fontWeight={win ? '800' : '600'} fill="var(--ink)">
              {outLabels[i]} {num(Math.round(p * 100))}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Train() {
  const { bi, num } = useT();
  const aiMode = usePumpEdge((s) => s.aiMode);
  const bundle = usePumpEdge((s) => s.bundle);
  const normalizeRatios = usePumpEdge((s) => s.normalizeRatios);
  const flashPct = usePumpEdge((s) => s.flashPct);
  const { setAiMode, setNormalize, flashFirmware } = usePumpEdge.getState();

  const byteSize =
    aiMode === 'threshold'
      ? 4
      : aiMode === 'zscore'
        ? bundle.zscore.byteSize
        : aiMode === 'tiny-nn'
          ? bundle.mlp.byteSize
          : bundle.centroid.byteSize;

  return (
    <div className="lab-cols wide-left">
      <Card
        title={`${AI_META[aiMode].icon} ${bi(AI_META[aiMode].name[0], AI_META[aiMode].name[1])} · ${num(byteSize)} bytes`}
        aside={
          <button type="button" className="btn warn small" onClick={flashFirmware}>
            ⚡ {bi('Flash AI to ESP32', 'ESP32-তে ফ্ল্যাশ করুন')}
          </button>
        }
      >
        {flashPct !== null && (
          <div className="pe-flash-bar" role="status">
            <span>
              {bi(
                `Flashing ${byteSize} bytes over USB-C to ESP32… ${flashPct}%`,
                `USB-C দিয়ে ESP32-তে ${num(byteSize)} বাইট লেখা হচ্ছে… ${num(flashPct)}%`,
              )}
            </span>
            <div className="pe-flash-track">
              <i style={{ width: `${flashPct}%` }} />
            </div>
          </div>
        )}

        <div className="lab-row">
          <button type="button" className="chip-btn" aria-pressed={aiMode === 'zscore'} onClick={() => setAiMode('zscore')}>
            🎯 {bi('Z-Score (40 B)', 'জেড-স্কোর (৪০ বাইট)')}
          </button>
          <button type="button" className="chip-btn" aria-pressed={aiMode === 'centroid'} onClick={() => setAiMode('centroid')}>
            🧭 {bi('Centroids (80 B)', 'কেন্দ্র (৮০ বাইট)')}
          </button>
          <button type="button" className="chip-btn" aria-pressed={aiMode === 'tiny-nn'} onClick={() => setAiMode('tiny-nn')}>
            🧠 {bi('Tiny Neural Net (256 B)', 'নিউরাল নেট (২৫৬ বাইট)')}
          </button>
        </div>

        {aiMode === 'tiny-nn' ? (
          <NeuralNetDiagram />
        ) : (
          <LineChart
            label={bi('TinyML neural network loss curve', 'প্রশিক্ষণে ভুল কমার রেখা')}
            ymin={0}
            series={[
              {
                values: bundle.mlp.lossHistory,
                color: 'var(--accent)',
                label: bi('Training loss over 180 epochs', '১৮০ ধাপে প্রশিক্ষণের ভুল'),
              },
            ]}
          />
        )}

        <label className="pe-switch">
          <input
            type="checkbox"
            checked={normalizeRatios}
            onChange={(e) => setNormalize(e.target.checked)}
          />
          <span>
            {bi(
              'Normalize frequency band ratios (protects against heat drift)',
              'ফ্রিকোয়েন্সি ব্যান্ড অনুপাত নরমালাইজ করুন (গরমে বিচ্যুতি রোধ করে)',
            )}
          </span>
        </label>
      </Card>

      <Card title={bi('Tiny Edge chip vs Giant GPU model', 'ছোট এজ চিপ বনাম বিশাল GPU মডেল')}>
        <Bars
          relative
          highlightTop={false}
          format={(v) => `${num(v)} B`}
          items={[
            { key: 'z', label: '🎯 Z-Score Anomaly', value: 40 },
            { key: 'c', label: '🧭 Spectral Centroids', value: 80 },
            { key: 'n', label: '🧠 Tiny Neural Net', value: 256 },
          ]}
        />
        <Talk avatar="🔌" who={bi('ESP32 Memory Check', 'ESP32 মেমোরি হিসাব')}>
          {bi(
            'Lesson 12’s 8B LLM needed 5,000,000,000 bytes of GPU VRAM. Here, FFT physics shrinks the problem so 40–256 bytes on a ৳500 chip is enough!',
            'পাঠ ১২-এর ৮বি ভাষা মডেলে লাগত ৫০০ কোটি বাইট GPU মেমোরি। এখানে FFT পদার্থবিজ্ঞান সমস্যাটিকে এত ছোট করেছে যে ৫০০ টাকার চিপে ৪০–২৫৬ বাইটই যথেষ্ট!',
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
    <div className={warn ? 'pe-ring warn' : 'pe-ring'}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="bg" cx="60" cy="60" r="50" />
        <circle className="fg" cx="60" cy="60" r="50" style={{ strokeDashoffset: offset }} />
      </svg>
      <div className="pe-ring-v">{num(clamped)}%</div>
      <div className="pe-ring-k">{label}</div>
    </div>
  );
}

function Evaluate() {
  const { bi, num } = useT();
  const aiMode = usePumpEdge((s) => s.aiMode);
  const bundle = usePumpEdge((s) => s.bundle);
  const rmsLimit = usePumpEdge((s) => s.rmsLimit);
  const batteryMah = usePumpEdge((s) => s.batteryMah);
  const raceDay = usePumpEdge((s) => s.raceDay);
  const racing = usePumpEdge((s) => s.racing);
  const { setBatteryMah, startBatteryRace } = usePumpEdge.getState();

  const metrics = useMemo(
    () => evaluateAnyPumpAi(PUMP_TEST, aiMode, bundle, rmsLimit),
    [aiMode, bundle, rmsLimit],
  );
  const dep = useMemo(() => compareEdgeVsCloud({ batteryMah }), [batteryMah]);

  const cloudRemPct = Math.max(0, Math.round((1 - raceDay / dep.cloud.batteryDays) * 100));
  const edgeRemPct = Math.max(0, Math.round((1 - raceDay / dep.edge.batteryDays) * 100));

  return (
    <div className="lab-cols">
      <Card
        title={`${AI_META[aiMode].icon} ${bi(AI_META[aiMode].name[0], AI_META[aiMode].name[1])} · ${bi('40 unseen pump tests', '৪০টি অদেখা পরীক্ষা')}`}
      >
        <div className="pe-rings">
          <ScoreRing
            pct={metrics.bearingRecall * 100}
            label={bi('Early bearing faults caught', 'আগাম বিয়ারিং ত্রুটি ধরা')}
          />
          <ScoreRing
            pct={(1 - metrics.falseAlarmRate) * 100}
            warn
            label={bi('Calm on healthy pumps', 'সুস্থ পাম্পে ভুয়া সাইরেনমুক্ত')}
          />
        </div>

        <Talk avatar={AI_META[aiMode].icon}>
          {aiMode === 'threshold'
            ? bi(
                'Loudness Rule missed most early bearing faults! Click Z-Score, Centroids or TinyNN at the top to watch the ring jump!',
                'সরল কম্পন সীমা বেশিরভাগ আগাম বিয়ারিং ক্ষয় মিস করেছে! রিং বাড়তে দেখতে ওপরে জেড-স্কোর, কেন্দ্র বা নিউরাল বাটনে চাপুন!',
              )
            : bi(
                `Caught ${Math.round(metrics.bearingRecall * 100)}% of early bearing wear before breakdown!`,
                `পাম্প বিকল হওয়ার আগেই ${num(Math.round(metrics.bearingRecall * 100))}% বিয়ারিং ক্ষয় ধরে ফেলেছে!`,
              )}
        </Talk>
      </Card>

      <Card
        title={bi('30-Day Monsoon Battery Race: Cloud vs Edge', '৩০ দিনের বর্ষায় ব্যাটারি দৌড়: ক্লাউড বনাম এজ')}
        aside={
          <button type="button" className="btn small" onClick={startBatteryRace} disabled={racing}>
            ▶ {bi(`Day ${raceDay} / 30`, `দিন ${num(raceDay)} / ৩০`)}
          </button>
        }
      >
        <Slider
          label={bi('Pump-node battery size', 'সেন্সর ব্যাটারির আকার')}
          value={batteryMah}
          min={2000}
          max={12000}
          step={1000}
          format={(v) => `${num(v)} mAh`}
          onChange={setBatteryMah}
        />

        <div className="pe-batt-row">
          <div className="pe-batt-head">
            <span>☁️ {bi('Stream raw 200 Hz wave over 4G', '২০০ Hz কাঁচা তরঙ্গ ৪জি-তে পাঠানো')}</span>
            <span className="mono">{num(cloudRemPct)}% ({num(dep.cloud.batteryDays)}d max)</span>
          </div>
          <div className="pe-batt-shell bad">
            <i style={{ width: `${cloudRemPct}%` }} />
          </div>
        </div>

        <div className="pe-batt-row">
          <div className="pe-batt-head">
            <span>⚡ {bi('Run Edge AI on ESP32 (send alerts only)', 'ESP32-তে এজ এআই (শুধু সতর্কবার্তা পাঠানো)')}</span>
            <span className="mono">{num(edgeRemPct)}% ({num(dep.edge.batteryDays)}d max)</span>
          </div>
          <div className="pe-batt-shell good">
            <i style={{ width: `${edgeRemPct}%` }} />
          </div>
        </div>

        <Talk avatar={cloudRemPct === 0 ? '🪫' : '🔋'}>
          {bi(
            `Cloud streaming burns ${(dep.cloud.dailyBytes / 1_000_000).toFixed(1)} MB/day and dies in ${dep.cloud.batteryDays} days. Edge AI sends ${dep.edge.dailyBytes} bytes/day and lasts ${dep.edge.batteryDays} days!`,
            `ক্লাউড স্ট্রিমিংয়ে দিনে ${num((dep.cloud.dailyBytes / 1_000_000).toFixed(1))} MB ডেটা খরচ হয় ও ${num(dep.cloud.batteryDays)} দিনেই ব্যাটারি শেষ হয়। এজ এআই দিনে মাত্র ${num(dep.edge.dailyBytes)} বাইট পাঠিয়ে ${num(dep.edge.batteryDays)} দিন চলে!`,
          )}
        </Talk>
      </Card>
    </div>
  );
}

function BreakIt() {
  const { bi, num } = useT();
  const bundle = usePumpEdge((s) => s.bundle);
  const normalizeRatios = usePumpEdge((s) => s.normalizeRatios);
  const shedTempC = usePumpEdge((s) => s.shedTempC);
  const minConsecutive = usePumpEdge((s) => s.minConsecutive);
  const rejectRoadRumble = usePumpEdge((s) => s.rejectRoadRumble);
  const { setNormalize, setShedTempC, setTruckGuard } = usePumpEdge.getState();

  const timelineAlarms = useMemo(
    () =>
      applyPersistenceGuard(
        TRUCK_TIMELINE.map((w) => w.features),
        bundle.centroid,
        { minConsecutive, rejectRoadRumble },
      ),
    [bundle.centroid, minConsecutive, rejectRoadRumble],
  );

  const gainFactor = shedTempC <= 32 ? 1 : 1 + ((shedTempC - 32) / 13) * 1.35;
  const dcOffset = shedTempC <= 32 ? 0 : ((shedTempC - 32) / 13) * 0.45;
  const healthyTest = useMemo(() => PUMP_TEST.filter((s) => s.label === 'healthy'), []);
  const healthyRight = useMemo(
    () =>
      healthyTest.filter((s) => {
        const f =
          gainFactor > 1.02
            ? applyHeatDrift(s.samples, gainFactor, dcOffset)
            : s.features;
        return runPumpAi('centroid', f, bundle, { rmsLimit: 0.62 }).predictedClass === 'healthy';
      }).length,
    [healthyTest, gainFactor, dcOffset, bundle],
  );

  return (
    <div className="lab-cols">
      <Card title={bi('1. Cargo truck rumbles past pump house (#3–#4)', '১. পাম্পঘরের বাইরে মালবাহী ট্রাক (#৩–#৪)')}>
        <div className="pe-timeline">
          {TRUCK_TIMELINE.map((w, i) => {
            const alarm = timelineAlarms[i];
            const isFalse = alarm && w.event !== 'bearing';
            const isTrue = alarm && w.event === 'bearing';
            return (
              <div
                key={w.step}
                className={isFalse ? 'pe-slot alarm' : isTrue ? 'pe-slot caught' : 'pe-slot'}
              >
                <b className="mono">#{num(w.step)}</b>
                <span>
                  {w.event === 'healthy' ? '✅' : w.event === 'truck' ? '🚚' : '⚙️'}
                </span>
                <Pill tone={isFalse ? 'yes' : isTrue ? 'ok' : 'no'}>
                  {alarm ? bi('ALARM', 'সাইরেন') : bi('OK', 'নীরব')}
                </Pill>
              </div>
            );
          })}
        </div>

        <Slider
          label={bi('Debounce: consecutive fault windows needed', 'অ্যালার্ম বাজাতে পরপর কতটি ত্রুটি উইন্ডো লাগবে')}
          value={minConsecutive}
          min={1}
          max={4}
          step={1}
          format={(v) => `${num(v)}`}
          onChange={(v) => setTruckGuard({ minConsecutive: v })}
        />

        <label className="pe-switch">
          <input
            type="checkbox"
            checked={rejectRoadRumble}
            onChange={(e) => setTruckGuard({ rejectRoadRumble: e.target.checked })}
          />
          <span>🛡️ {bi('Filter <18 Hz road rumble', '<১৮ Hz রাস্তার ট্রাকের কম্পন বাদ দিন')}</span>
        </label>
      </Card>

      <Card title={bi('2. Bake the cheap piezo sensor in a tin shed', '২. টিনশেডের তীব্র গরমে সেন্সর বিচ্যুতি')}>
        <Slider
          label={bi('🌡️ Tin pump-shed temperature', '🌡️ পাম্পঘরের তাপমাত্রা')}
          value={shedTempC}
          min={28}
          max={48}
          step={1}
          format={(v) => `${num(v)} °C`}
          onChange={setShedTempC}
        />

        <div className="pe-rings">
          <ScoreRing
            pct={(healthyRight / healthyTest.length) * 100}
            warn={healthyRight < healthyTest.length}
            label={bi('Healthy pumps recognised', 'সঠিকভাবে চেনা সুস্থ পাম্প')}
          />
        </div>

        <label className="pe-switch">
          <input
            type="checkbox"
            checked={normalizeRatios}
            onChange={(e) => setNormalize(e.target.checked)}
          />
          <span>
            ✨ {bi('Fix: Normalize spectral band ratios on ESP32', 'সমাধান: ESP32-তে ফ্রিকোয়েন্সি অনুপাত নরমালাইজ করুন')}
          </span>
        </label>
      </Card>
    </div>
  );
}

const DEPLOY_RIGS: Record<
  DeployCaseId,
  {
    icon: string;
    title: [string, string];
    ideal: DeployBrainId;
    scores: Record<DeployBrainId, { fit: number; note: [string, string] }>;
  }
> = {
  pump: {
    icon: '⚙️',
    title: ['Stormwater pump vibration', 'পাম্পের বিয়ারিং পর্যবেক্ষণ'],
    ideal: 'edge-tinyml',
    scores: {
      switch: { fit: 20, note: ['A simple switch only trips after the pump has already seized!', 'সাধারণ সুইচ পাম্প পুরোপুরি আটকে যাওয়ার পর ট্রিপ করে!'] },
      'edge-zscore': { fit: 88, note: ['Great day-1 choice when you only have healthy pump recordings!', 'শুরুতে যখন শুধু সুস্থ পাম্পের ডেটা থাকে তখন চমৎকার কাজ করে!'] },
      'edge-tinyml': { fit: 98, note: ['80–256B Edge model spots bearing vs cavitation offline for 700+ days!', '৮০–২৫৬ বাইটের এজ মডেল ইন্টারনেট ছাড়াই ৭০০+ দিন চলে ও সঠিক ত্রুটি চেনে!'] },
      'cloud-ml': { fit: 28, note: ['200 Hz raw streaming kills the battery in 3 days and fails in storms!', '২০০ Hz কাঁচা তরঙ্গ পাঠাতে গেলে ৩ দিনেই ব্যাটারি শেষ হয়!'] },
      hybrid: { fit: 92, note: ['Edge chip watches 24/7 and uploads short fault clips for mechanics!', 'এজ চিপ সারাক্ষণ পাহারা দেয় এবং ত্রুটি পেলে ছোট নমুনা প্রকৌশলীকে পাঠায়!'] },
    },
  },
  lamp: {
    icon: '💡',
    title: ['10,000 ward streetlights', '১০,০০০ সড়কবাতি জ্বালানো'],
    ideal: 'switch',
    scores: {
      switch: { fit: 99, note: ['৳30 LDR light sensor switches at dusk — zero AI, zero code, ultra-reliable!', '৩০ টাকার আলোক সেন্সরই সন্ধ্যায় বাতি জ্বালায়—কোনো এআই ছাড়াই শতভাগ নির্ভরযোগ্য!'] },
      'edge-zscore': { fit: 30, note: ['Why run anomaly statistics just to tell night from day?', 'দিন-রাত বোঝার জন্য অ্যানোমালি মডেলের কোনো প্রয়োজন নেই!'] },
      'edge-tinyml': { fit: 25, note: ['Massive waste of microcontrollers on 10,000 poles.', '১০,০০০ খুঁটিতে অযথা মাইক্রোকন্ট্রোলার ও খরচ বাড়বে।'] },
      'cloud-ml': { fit: 15, note: ['10,000 SIM cards just to turn streetlamps on — terrible procurement!', 'শুধু বাতি জ্বালাতে ১০,০০০ সিম কার্ড—ভয়ানক সরকারি অপচয়!'] },
      hybrid: { fit: 40, note: ['Keep dusk switching on a ৳30 LDR; only add simple fault SMS on main roads.', 'বাতি জ্বালানো সাধারণ সেন্সরেই রাখুন; বড় রাস্তায় শুধু নষ্ট বাতির খবর রাখতে পারেন।'] },
    },
  },
  aqi: {
    icon: '🌫️',
    title: ['Ward PM2.5 dust & fog sensors', 'ওয়ার্ডের PM2.5 বায়ুমান সেন্সর'],
    ideal: 'cloud-ml',
    scores: {
      switch: { fit: 30, note: ['Cheap laser dust sensors mistake monsoon fog for smoke without calibration!', 'ক্যালিব্রেশন ছাড়া কমদামি ডাস্ট সেন্সর বর্ষার কুয়াশাকে ধোঁয়া মনে করে!'] },
      'edge-zscore': { fit: 50, note: ['Cannot calibrate PM2.5 micrograms against city reference stations.', 'রেফারেন্স স্টেশনের সাথে মিলিয়ে সঠিক PM2.5 মান বের করতে পারে না।'] },
      'edge-tinyml': { fit: 78, note: ['Local humidity correction works well on the node!', 'নোডের ভেতরেই আর্দ্রতা সমন্বয় ভালো কাজ করে!'] },
      'cloud-ml': { fit: 95, note: ['1 reading every 5 min is tiny bandwidth — server ML calibrates all wards together!', 'প্রতি ৫ মিনিটে ১টি সংখ্যা পাঠাতে সামান্য ডেটা লাগে—সার্ভার এমএল সব ওয়ার্ড একসাথে ক্যালিব্রেট করে!'] },
      hybrid: { fit: 90, note: ['5-min averages + server humidity calibration gives clean public AQI maps.', '৫ মিনিটের গড় ও সার্ভার ক্যালিব্রেশনে নির্ভুল বায়ুমান মানচিত্র মেলে।'] },
    },
  },
  bridge: {
    icon: '🌉',
    title: ['Flyover structural crack monitor', 'ফ্লাইওভারের ফাটল ও কম্পন পর্যবেক্ষণ'],
    ideal: 'hybrid',
    scores: {
      switch: { fit: 22, note: ['Every heavy bus triggers a raw vibration switch!', 'প্রতিটি ভারী বাস গেলেই সাধারণ কম্পন সুইচ বেজে উঠবে!'] },
      'edge-zscore': { fit: 86, note: ['Spots unfamiliar structural resonance shifts right on the girder!', 'গার্ডারে বসেই অপরিচিত কাঠামোগত কম্পনের পরিবর্তন ধরে ফেলে!'] },
      'edge-tinyml': { fit: 82, note: ['Saves battery, though structural engineers also want the raw spike clip.', 'ব্যাটারি বাঁচায়, তবে প্রকৌশলীদের যাচাইয়ের জন্য আসল কম্পন ক্লিপও দরকার হয়।'] },
      'cloud-ml': { fit: 32, note: ['Streaming 500 Hz 24/7 drains solar batteries during cloudy monsoon weeks.', 'মেঘলা বর্ষায় সারাক্ষণ ৫০০ Hz ডেটা পাঠালে সোলার ব্যাটারি বসে যায়।'] },
      hybrid: { fit: 98, note: ['Winner: Edge Z-Score sleeps 99% of the day and uploads 2-second clips on anomalies!', 'সেরা সমাধান: এজ চিপ ৯৯% সময় ব্যাটারি বাঁচায় এবং অস্বাভাবিক কম্পন পেলেই ২ সেকেন্ডের ক্লিপ পাঠায়!'] },
    },
  },
};

const DEPLOY_BRAINS: Record<DeployBrainId, [string, string]> = {
  switch: ['🔘 Hardware Switch (No AI)', '🔘 হার্ডওয়্যার সুইচ (এআই ছাড়া)'],
  'edge-zscore': ['🎯 Edge Anomaly Z-Score', '🎯 এজ অ্যানোমালি জেড-স্কোর'],
  'edge-tinyml': ['🧠 Edge TinyML Classifier', '🧠 এজ টাইনি-এমএল'],
  'cloud-ml': ['☁️ Central Server ML', '☁️ কেন্দ্রীয় সার্ভার এমএল'],
  hybrid: ['🔗 Hybrid (Edge trigger + Server)', '🔗 হাইব্রিড (এজ + সার্ভার)'],
};

function Apply() {
  const { bi } = useT();
  const deployCase = usePumpEdge((s) => s.deployCase);
  const deployBrain = usePumpEdge((s) => s.deployBrain);
  const { setDeployCase, setDeployBrain } = usePumpEdge.getState();

  const rig = DEPLOY_RIGS[deployCase];
  const res = rig.scores[deployBrain];

  return (
    <div className="lab-cols">
      <Card title={bi('1. Pick a municipal sensor project & AI architecture', '১. পৌর প্রকল্প ও এআই কাঠামো বেছে নিন')}>
        <div className="lab-row">
          {(Object.keys(DEPLOY_RIGS) as DeployCaseId[]).map((k) => (
            <button
              key={k}
              type="button"
              className="chip-btn"
              aria-pressed={deployCase === k}
              onClick={() => setDeployCase(k)}
            >
              {DEPLOY_RIGS[k].icon} {bi(DEPLOY_RIGS[k].title[0], DEPLOY_RIGS[k].title[1])}
            </button>
          ))}
        </div>

        <span className="eyebrow">{bi('Where should intelligence run?', 'বুদ্ধিমত্তা কোথায় চলবে?')}</span>
        <div className="lab-row">
          {(Object.keys(DEPLOY_BRAINS) as DeployBrainId[]).map((b) => (
            <button
              key={b}
              type="button"
              className="chip-btn"
              aria-pressed={deployBrain === b}
              onClick={() => setDeployBrain(b)}
            >
              {bi(DEPLOY_BRAINS[b][0], DEPLOY_BRAINS[b][1])}
            </button>
          ))}
        </div>
      </Card>

      <Card title={bi('2. Architecture suitability score', '২. কাঠামোর উপযোগিতা স্কোর')}>
        <div className="pe-rings">
          <ScoreRing
            pct={res.fit}
            warn={res.fit < 75}
            label={bi('Deployment fit', 'বাস্তবায়ন উপযোগিতা')}
          />
        </div>
        <Talk avatar={deployBrain === rig.ideal ? '🏆' : res.fit >= 85 ? '👍' : '⚠️'}>
          {bi(res.note[0], res.note[1])}
        </Talk>
      </Card>
    </div>
  );
}
