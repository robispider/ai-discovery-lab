import type { CSSProperties } from 'react';
import { useT } from '../../i18n';
import { NeuronNode, SignalPath } from './NeuronArt';

const HIDDEN = ['any', 'both', 'output'] as const;
export type Unit = (typeof HIDDEN)[number];
const TARGETS = [
  [49, 23],
  [49, 76],
  [87, 50],
];

export function DispatchArt({
  a,
  b,
  any,
  both,
  output,
  selected,
  onSelect,
  replay,
}: {
  a: number;
  b: number;
  any: number;
  both: number;
  output: number;
  selected: Unit;
  onSelect: (unit: Unit) => void;
  replay: number;
}) {
  const { bi, num } = useT();
  const labels = [
    bi('Inspect at least one report', 'অন্তত একটি অভিযোগের হিসাব দেখুন'),
    bi('Inspect both reports', 'দুটি অভিযোগের হিসাব দেখুন'),
    bi('Inspect the crew decision', 'দল পাঠানোর হিসাব দেখুন'),
  ];
  return (
    <div className="neuron-network">
      <div className="neuron-network-head" aria-hidden="true">
        <span>{bi('Street reports', 'সড়কের অভিযোগ')}</span>
        <span>{bi('Hidden layer', 'মাঝের স্তর')}</span>
        <span>{bi('Output', 'আউটপুট')}</span>
      </div>
      <div className="neuron-interactive-art">
        <svg viewBox="0 0 620 225" className="neuron-art" aria-hidden="true">
          <g key={replay}>
            <SignalPath d="M104 53 H267" pulse={a === 1} />
            <SignalPath d="M104 53 C178 53 190 170 267 170" pulse={a === 1} />
            <SignalPath d="M104 170 C178 170 190 53 267 53" pulse={b === 1} />
            <SignalPath d="M104 170 H267" pulse={b === 1} />
            <SignalPath d="M341 53 C415 53 430 112 501 112" pulse={any === 1} delay />
            <SignalPath d="M341 170 C415 170 430 112 501 112" pulse={both === 1} delay />
          </g>
          <NeuronNode x={78} y={53} r={26} active={a === 1}>
            {num(a)}
          </NeuronNode>
          <NeuronNode x={78} y={170} r={26} active={b === 1}>
            {num(b)}
          </NeuronNode>
          <text className="neuron-network-label" x="40" y="53">
            A
          </text>
          <text className="neuron-network-label" x="40" y="170">
            B
          </text>
          <NeuronNode x={304} y={53} r={37} active={selected === 'any'}>
            {num(any)}
          </NeuronNode>
          <NeuronNode x={304} y={170} r={37} active={selected === 'both'}>
            {num(both)}
          </NeuronNode>
          <text className="neuron-network-weight" x="413" y="59">{`× ${num(1)}`}</text>
          <text className="neuron-network-weight" x="413" y="167">{`× −${num(1)}`}</text>
          <NeuronNode x={541} y={112} r={40} active={selected === 'output'}>
            {num(output)}
          </NeuronNode>
        </svg>
        {HIDDEN.map((unit, index) => (
          <button
            key={unit}
            className="neuron-target"
            type="button"
            style={
              {
                '--target-x': `${TARGETS[index][0]}%`,
                '--target-y': `${TARGETS[index][1]}%`,
              } as CSSProperties
            }
            aria-label={labels[index]}
            aria-pressed={selected === unit}
            onClick={() => onSelect(unit)}
          />
        ))}
      </div>
    </div>
  );
}
