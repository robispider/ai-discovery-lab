import { useEffect, useState, type CSSProperties } from 'react';
import { weightedTotal } from '../../engines/neural';
import { useT } from '../../i18n';
import { Card, ResetButton, Slider } from '../kit';
import { ArtificialNeuron, HumanNeuron } from './NeuronArt';

const START = { a: 2, b: 1, wa: 3, wb: 4, bias: 1 };
const PHASES = [0, 1, 2] as const;
const TARGETS = [
  { x: 19, y: 25.6 },
  { x: 19, y: 74.4 },
  { x: 49.4, y: 50 },
  { x: 90.3, y: 50 },
];

export function NeuronCalculator() {
  const { bi, num } = useT();
  const [values, setValues] = useState(START);
  const [phase, setPhase] = useState<(typeof PHASES)[number] | null>(null);
  const [focusedInput, setFocusedInput] = useState<'a' | 'b' | null>(null);
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);
  const { a, b, wa, wb, bias } = values;
  const total = weightedTotal(a, b, wa, wb, bias);
  const format = (value: number) => num(value < 0 ? `−${-value}` : value);
  const factor = (value: number) => (value < 0 ? `(${format(value)})` : format(value));
  const add = (value: number) => `${value < 0 ? '−' : '+'} ${format(Math.abs(value))}`;
  const titles = [bi('Multiply', 'গুণ করুন'), bi('Add', 'যোগ করুন'), bi('Read output', 'ফল দেখুন')];
  const biology = [
    bi('Dendrites receive signals.', 'ডেনড্রাইট সংকেত গ্রহণ করে।'),
    bi('The neuron combines incoming signals.', 'নিউরন আসা সংকেতগুলো একসঙ্গে প্রক্রিয়া করে।'),
    bi(
      'If the neuron fires, a signal travels along the axon.',
      'নিউরন সক্রিয় হলে অ্যাক্সন দিয়ে সংকেত এগিয়ে যায়।',
    ),
  ];
  const stages = [
    [
      focusedInput !== 'b' && `${format(a)} × ${factor(wa)} = ${format(a * wa)}`,
      focusedInput !== 'a' && `${format(b)} × ${factor(wb)} = ${format(b * wb)}`,
    ]
      .filter(Boolean)
      .join(' · '),
    `${format(a * wa)} ${add(b * wb)} ${add(bias)} = ${format(total)}`,
    `${bi('Output', 'আউটপুট')} = ${format(total)}`,
  ];
  const selectedWeight = focusedInput === 'a' ? 'wa' : focusedInput === 'b' ? 'wb' : null;

  useEffect(() => {
    if (!playing || phase === null) return;
    const timer = window.setTimeout(() => {
      if (phase === 2) setPlaying(false);
      else setPhase(phase === 0 ? 1 : 2);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [playing, phase, replay]);

  function inspect(next: (typeof PHASES)[number], input: 'a' | 'b' | null = null) {
    setPlaying(false);
    setPhase(next);
    setFocusedInput(input);
    setReplay((run) => run + 1);
  }

  function change(key: keyof typeof START, value: number) {
    setValues((current) => ({ ...current, [key]: value }));
    const input = key === 'a' || key === 'wa' ? 'a' : key === 'b' || key === 'wb' ? 'b' : null;
    inspect(input ? 0 : 1, input);
  }

  function play() {
    if (playing) {
      setPlaying(false);
      return;
    }
    setPhase(0);
    setFocusedInput(null);
    setReplay((run) => run + 1);
    setPlaying(true);
  }

  return (
    <Card
      title={bi('Follow the signal through a neuron', 'নিউরনের ভেতর সংকেতের পথ দেখুন')}
      aside={
        <ResetButton
          onReset={() => {
            setValues(START);
            setPhase(null);
            setPlaying(false);
          }}
        />
      }
    >
      <div className="lab-row neuron-transport">
        <button type="button" className="btn" onClick={play}>
          {playing ? bi('Stop animation', 'অ্যানিমেশন থামান') : bi('Run signal', 'সংকেত চালান')}
        </button>
        <div className="seg" role="group" aria-label={bi('Calculation steps', 'হিসাবের ধাপ')}>
          {PHASES.map((step) => (
            <button key={step} type="button" aria-pressed={phase === step} onClick={() => inspect(step)}>
              {num(step + 1)} {titles[step]}
            </button>
          ))}
        </div>
      </div>
      <div className="neuron-comparison">
        <section className="neuron-figure biological">
          <h4>{bi('Human neuron', 'মানবদেহের নিউরন')}</h4>
          <HumanNeuron phase={phase} replay={replay} />
          <div className="neuron-parts" aria-hidden="true">
            <span>{bi('Dendrites', 'ডেনড্রাইট')}</span>
            <span>{bi('Cell body', 'কোষদেহ')}</span>
            <span>{bi('Axon', 'অ্যাক্সন')}</span>
          </div>
          <p>
            {phase === null
              ? bi('Receives → combines → sends a signal', 'সংকেত গ্রহণ → প্রক্রিয়া → প্রেরণ')
              : biology[phase]}
          </p>
        </section>
        <section className="neuron-figure artificial">
          <h4>{bi('Artificial neuron (ANN)', 'কৃত্রিম নিউরন (ANN)')}</h4>
          <div className="neuron-interactive-art">
            <ArtificialNeuron
              phase={phase}
              focusedInput={focusedInput}
              replay={replay}
              a={format(a)}
              b={format(b)}
              wa={format(wa)}
              wb={format(wb)}
              productA={format(a * wa)}
              productB={format(b * wb)}
              bias={format(bias)}
              result={format(total)}
              showOutput={!playing || phase === 2}
            />
            {TARGETS.map(({ x, y }, i) => (
              <button
                key={i}
                type="button"
                className={i < 2 ? 'neuron-target neuron-input-target' : 'neuron-target'}
                style={{ '--target-x': `${x}%`, '--target-y': `${y}%` } as CSSProperties}
                aria-label={
                  [
                    bi('Inspect input A calculation', 'ইনপুট A-এর হিসাব দেখুন'),
                    bi('Inspect input B calculation', 'ইনপুট B-এর হিসাব দেখুন'),
                    bi('Inspect the sum', 'যোগফল দেখুন'),
                    bi('Inspect the output', 'আউটপুট দেখুন'),
                  ][i]
                }
                onClick={() => inspect(i < 2 ? 0 : i === 2 ? 1 : 2, i === 0 ? 'a' : i === 1 ? 'b' : null)}
              />
            ))}
          </div>
          <div className="neuron-parts" aria-hidden="true">
            <span>{bi('Inputs × weights', 'ইনপুট × গুণক')}</span>
            <span>{bi('Sum + bias', 'যোগফল + বায়াস')}</span>
            <span>{bi('Output', 'আউটপুট')}</span>
          </div>
          <div className="neuron-calculation">
            <p className="neuron-formula mono" aria-live="polite">
              {phase === null
                ? `${format(a)} × ${factor(wa)} + ${format(b)} × ${factor(wb)} ${add(bias)} = ${format(total)}`
                : stages[phase]}
            </p>
            {selectedWeight && (
              <div
                className="neuron-weight-buttons"
                role="group"
                aria-label={bi('Edit selected weight', 'বেছে নেওয়া গুণক বদলান')}
              >
                <button
                  type="button"
                  className="btn ghost"
                  aria-label={bi('Decrease selected weight', 'বেছে নেওয়া গুণক কমান')}
                  disabled={values[selectedWeight] <= -5}
                  onClick={() => change(selectedWeight, values[selectedWeight] - 1)}
                >
                  −
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  aria-label={bi('Increase selected weight', 'বেছে নেওয়া গুণক বাড়ান')}
                  disabled={values[selectedWeight] >= 5}
                  onClick={() => change(selectedWeight, values[selectedWeight] + 1)}
                >
                  +
                </button>
              </div>
            )}
          </div>
          <div className="visually-hidden" role="status">
            <span>{bi('Output', 'আউটপুট')}</span>
            <strong>{format(total)}</strong>
          </div>
        </section>
      </div>
      <div className="neuron-edit">
        <InputCounter title={bi('Input A', 'ইনপুট A')} value={a} onChange={(value) => change('a', value)} />
        <InputCounter title={bi('Input B', 'ইনপুট B')} value={b} onChange={(value) => change('b', value)} />
        <Slider
          label={bi('Weight A', 'গুণক A')}
          min={-5}
          max={5}
          value={wa}
          onChange={(value) => change('wa', value)}
          format={format}
        />
        <Slider
          label={bi('Weight B', 'গুণক B')}
          min={-5}
          max={5}
          value={wb}
          onChange={(value) => change('wb', value)}
          format={format}
        />
        <Slider
          label={bi('Bias', 'বায়াস')}
          min={-5}
          max={5}
          value={bias}
          onChange={(value) => change('bias', value)}
          format={format}
        />
      </div>
      <p className="lab-lead">
        {bi(
          'Both diagrams show inputs, a combination, and an output. The artificial neuron uses a simplified arithmetic rule. Try changing a weight (multiplier) or the bias (extra amount).',
          'দুটি ছবিতেই ইনপুট আসে, একসঙ্গে প্রক্রিয়া হয় এবং ফল বের হয়। কৃত্রিম নিউরন সরল পাটিগণিত ব্যবহার করে। কোনো গুণক বা বায়াস (অতিরিক্ত সংখ্যা) বদলে দেখুন।',
        )}
      </p>
    </Card>
  );
}

function InputCounter({
  title,
  value,
  onChange,
}: {
  title: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const { bi, num } = useT();
  return (
    <div className="neural-input" role="group" aria-label={title}>
      <span>{title}</span>
      <div>
        <button
          type="button"
          className="btn ghost"
          aria-label={bi(`Decrease ${title}`, `${title} কমান`)}
          disabled={value <= 0}
          onClick={() => onChange(value - 1)}
        >
          −
        </button>
        <b className="mono">{num(value)}</b>
        <button
          type="button"
          className="btn ghost"
          aria-label={bi(`Increase ${title}`, `${title} বাড়ান`)}
          disabled={value >= 5}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
