type Phase = 0 | 1 | 2;

export function SignalPath({
  d,
  pulse = false,
  delay = false,
}: {
  d: string;
  pulse?: boolean;
  delay?: boolean;
}) {
  return (
    <>
      <path className="neuron-wire" d={d} />
      {pulse && <path className={delay ? 'neuron-signal delayed' : 'neuron-signal'} pathLength="100" d={d} />}
    </>
  );
}

export function NeuronNode({
  x,
  y,
  r = 30,
  active = false,
  children,
}: {
  x: number;
  y: number;
  r?: number;
  active?: boolean;
  children: string;
}) {
  return (
    <g className={active ? 'neuron-node active' : 'neuron-node'} transform={`translate(${x} ${y})`}>
      <circle className="neuron-halo" r={r + 7} />
      <circle r={r} />
      <text textAnchor="middle" dominantBaseline="central">
        {children}
      </text>
    </g>
  );
}

const BRANCH_TOP = 'M16 36 Q38 39 60 58 T117 80';
const BRANCH_BOTTOM = 'M16 140 Q42 134 63 115 T118 99';
const AXON = 'M174 90 C196 89 208 97 221 99 S248 99 266 91 Q291 78 315 91';

export function HumanNeuron({ phase, replay }: { phase: Phase | null; replay: number }) {
  return (
    <svg className="neuron-art neuron-bio" viewBox="0 0 340 180" aria-hidden="true">
      <g className={phase === 0 ? 'neuron-bio-lines active' : 'neuron-bio-lines'}>
        <path d="M60 58Q54 43 59 25L53 14 M57 35l16-17m-36 24L29 22 17 19M29 22l3-12M71 62l9-22 14-9M80 40l-7-12M95 73l5-22-7-7m7 7 13-7M43 56Q28 60 22 74L8 77m14-3 6 11M25 132l-8-14-10-3m10 3 9-6m32 9-11 23 4 14m-4-14-17 8-5 13m43-51 1 27 12 17m-12-17-7 11m32-45 3 21-8 11m8-11 18 10" />
        <SignalPath key={`top-${replay}`} d={BRANCH_TOP} pulse={phase === 0} />
        <SignalPath key={`bottom-${replay}`} d={BRANCH_BOTTOM} pulse={phase === 0} delay />
      </g>
      <g className={phase === 1 ? 'neuron-soma active' : 'neuron-soma'} key={`soma-${replay}`}>
        <path d="M109 77 Q122 76 125 61 L126 49 Q138 68 148 68 Q168 67 174 81 Q177 87 186 90 Q178 94 174 103 Q164 115 149 115 Q135 112 126 128 L129 110 Q119 101 107 105 Q122 92 109 77Z" />
        <ellipse cx="148" cy="90" rx="12" ry="11" />
        <circle cx="151" cy="88" r="4" />
      </g>
      <g className={phase === 2 ? 'neuron-bio-lines active' : 'neuron-bio-lines'}>
        <SignalPath key={`axon-${replay}`} d={AXON} pulse={phase === 2} />
        <path className="neuron-myelin" d="M193 92l12 3m13 4 14 2m14-2 14-5m14-6 13-3" />
        <path d="M309 89q10-19 20-23m-14 25q7 0 17 4m-17-4q2 16 15 24" />
        <circle cx="329" cy="66" r="3" />
        <circle cx="332" cy="95" r="3" />
        <circle cx="330" cy="115" r="3" />
      </g>
    </svg>
  );
}

export function ArtificialNeuron({
  phase,
  focusedInput,
  replay,
  a,
  b,
  wa,
  wb,
  productA,
  productB,
  bias,
  result,
  showOutput,
}: {
  phase: Phase | null;
  focusedInput: 'a' | 'b' | null;
  replay: number;
  a: string;
  b: string;
  wa: string;
  wb: string;
  productA: string;
  productB: string;
  bias: string;
  result: string;
  showOutput: boolean;
}) {
  const inputA = phase === 0 && focusedInput !== 'b';
  const inputB = phase === 0 && focusedInput !== 'a';
  return (
    <svg className="neuron-art neuron-ann" viewBox="0 0 340 180" aria-hidden="true">
      <SignalPath key={`a-${replay}`} d="M49 46 H92 Q113 46 133 69 L153 86" pulse={inputA} />
      <SignalPath key={`b-${replay}`} d="M49 134 H92 Q113 134 133 111 L153 94" pulse={inputB} delay />
      <SignalPath key={`out-${replay}`} d="M193 90 H291" pulse={phase === 2} />
      <NeuronNode x={35} y={46} r={17} active={inputA}>
        {a}
      </NeuronNode>
      <NeuronNode x={35} y={134} r={17} active={inputB}>
        {b}
      </NeuronNode>
      <g className={inputA ? 'neuron-weight active' : 'neuron-weight'}>
        <rect x="65" y="34" width="49" height="24" rx="7" />
        <text x="89.5" y="46">{`× ${wa}`}</text>
      </g>
      <g className={inputB ? 'neuron-weight active' : 'neuron-weight'}>
        <rect x="65" y="122" width="49" height="24" rx="7" />
        <text x="89.5" y="134">{`× ${wb}`}</text>
      </g>
      {inputA && <text className="neuron-product" x="139" y="42">{`= ${productA}`}</text>}
      {inputB && <text className="neuron-product" x="139" y="138">{`= ${productB}`}</text>}
      <NeuronNode x={168} y={90} r={29} active={phase === 1}>
        {phase === 1 ? result : '+'}
      </NeuronNode>
      <path className="neuron-wire neuron-bias-wire" d="M168 27V61" />
      <g className={phase === 1 ? 'neuron-weight active' : 'neuron-weight'}>
        <rect x="146" y="9" width="44" height="22" rx="7" />
        <text x="168" y="20">
          {bias}
        </text>
      </g>
      <NeuronNode x={307} y={90} r={23} active={phase === 2}>
        {showOutput ? result : '…'}
      </NeuronNode>
    </svg>
  );
}
