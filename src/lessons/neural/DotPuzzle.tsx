import { useState } from 'react';
import {
  dispatch,
  DISPATCH_CASES,
  divider,
  ONE_REPORT_THRESHOLD,
  TWO_REPORT_THRESHOLD,
} from '../../engines/neural';
import { useT } from '../../i18n';
import { Card, Choice, Slider } from '../kit';
import { PlaygroundLink } from './Controls';

type Mode = 'one' | 'hidden';
type Point = readonly [number, number];
const field: Point[] = [
  [-0.2, -0.2],
  [1.2, -0.2],
  [1.2, 1.2],
  [-0.2, 1.2],
];
const x = (a: number) => 50 + (a + 0.2) * 136;
const y = (b: number) => 210 - (b + 0.2) * 136;

/** Clips the colored region to the side of a unit's boundary where its score is positive. */
function clip(points: Point[], score: (a: number, b: number) => number): Point[] {
  return points.flatMap((p, i) => {
    const q = points[(i + 1) % points.length];
    const pScore = score(...p);
    const qScore = score(...q);
    const result: Point[] = pScore >= 0 ? [p] : [];
    if (pScore >= 0 !== qScore >= 0) {
      const fraction = pScore / (pScore - qScore);
      result.push([p[0] + fraction * (q[0] - p[0]), p[1] + fraction * (q[1] - p[1])]);
    }
    return result;
  });
}

export function DotPuzzle() {
  const { bi, num } = useT();
  const [mode, setMode] = useState<Mode>('one');
  const [angle, setAngle] = useState(45);
  const [position, setPosition] = useState(34);
  const line = divider(angle, (position - 50) / 50);
  const predicted = (a: number, b: number) =>
    mode === 'one' ? Number(line(a, b) >= 0) : dispatch(a, b).output;
  const correct = DISPATCH_CASES.filter(({ a, b, expected }) => predicted(a, b) === expected).length;
  const area =
    mode === 'one'
      ? clip(field, line)
      : clip(
          clip(field, (a, b) => a + b - ONE_REPORT_THRESHOLD),
          (a, b) => TWO_REPORT_THRESHOLD - a - b,
        );

  return (
    <Card title={bi('Can one line sort the four dots?', 'একটি রেখা কি চারটি বিন্দু ঠিকভাবে ভাগ করতে পারে?')}>
      <div className="neural-puzzle">
        <div className="neural-puzzle-controls">
          <Choice
            label={bi('Network to show', 'কোন নেটওয়ার্ক দেখাবেন')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'one', label: bi('One divider', 'একটি রেখা') },
              { value: 'hidden', label: bi('Two hidden units', 'মাঝের দুটি ইউনিট') },
            ]}
          />
          <p className="lab-lead" role="status">
            <strong>{bi(`${correct} of 4 cases match.`, `৪টির মধ্যে ${num(correct)}টি মিলেছে।`)}</strong>{' '}
            {mode === 'one'
              ? bi(
                  'Try putting both circles in the shaded area and both squares outside it.',
                  'দুটি বৃত্তই রঙিন অংশে এবং দুটি বর্গই তার বাইরে রাখার চেষ্টা করুন।',
                )
              : bi(
                  'The two cutoffs form a band that contains both circles. Each hidden unit supplies one boundary.',
                  'দুটি সীমার মাঝের রঙিন অংশে দুইটি বৃত্তই পড়েছে। প্রতিটি ইউনিট একটি করে সীমানা তৈরি করে।',
                )}
          </p>
          {mode === 'one' && (
            <>
              <Slider
                label={bi('Turn the line', 'রেখা ঘোরান')}
                min={0}
                max={360}
                step={5}
                value={angle}
                onChange={setAngle}
                format={(value) => `${num(value)}°`}
              />
              <Slider
                label={bi('Move the line', 'রেখা সরান')}
                min={0}
                max={100}
                value={position}
                onChange={setPosition}
              />
            </>
          )}
          <div className="neural-legend">
            <span>
              <i className="circle" aria-hidden="true" /> {bi('Send one crew', 'একটি দল পাঠান')}
            </span>
            <span>
              <i className="square" aria-hidden="true" /> {bi('Other action', 'অন্য পদক্ষেপ')}
            </span>
          </div>
        </div>
        <svg
          className="neural-plot"
          viewBox="0 0 260 249"
          role="img"
          aria-label={bi(
            `Four street-report combinations on a grid. The current network matches ${correct} of 4.`,
            `ছকে অভিযোগের চারটি সম্ভাবনা। বর্তমান নেটওয়ার্কে ৪টির মধ্যে ${num(correct)}টি মিলেছে।`,
          )}
        >
          <rect className="neural-plot-field" x={x(-0.2)} y={y(1.2)} width="190.4" height="190.4" />
          <polygon className="neural-plot-area" points={area.map(([a, b]) => `${x(a)},${y(b)}`).join(' ')} />
          {[0, 1].map((mark) => (
            <g key={mark} className="neural-plot-grid">
              <path d={`M${x(mark)} ${y(-0.2)}V${y(1.2)} M${x(-0.2)} ${y(mark)}H${x(1.2)}`} />
              <text x={x(mark)} y="225" textAnchor="middle">
                {num(mark)}
              </text>
              <text x="39" y={y(mark) + 4} textAnchor="end">
                {num(mark)}
              </text>
            </g>
          ))}
          <text x="145" y="244" textAnchor="middle">
            {bi('Street A', 'সড়ক A')}
          </text>
          <text transform="translate(18 115) rotate(-90)" textAnchor="middle">
            {bi('Street B', 'সড়ক B')}
          </text>
          {DISPATCH_CASES.map(({ a, b, expected }) => (
            <g key={`${a}${b}`} className={expected ? 'neural-dot positive' : 'neural-dot'}>
              {predicted(a, b) !== expected && (
                <circle className="neural-plot-miss" cx={x(a)} cy={y(b)} r="13" />
              )}
              {expected ? (
                <circle cx={x(a)} cy={y(b)} r="7" />
              ) : (
                <rect x={x(a) - 6} y={y(b) - 6} width="12" height="12" rx="2" />
              )}
            </g>
          ))}
        </svg>
      </div>
      <div className="neural-handoff">
        <p className="lab-lead">
          {bi(
            'Try the four-corner pattern (XOR) in TensorFlow Playground. Compare training with zero hidden layers and with a hidden layer.',
            'TensorFlow Playground-এ চার কোণের বিন্যাস (XOR) নিয়ে চেষ্টা করুন। মাঝের স্তর ছাড়া এবং মাঝের স্তর দিয়ে প্রশিক্ষণের ফল তুলনা করুন।',
          )}
        </p>
        <PlaygroundLink primary />
      </div>
    </Card>
  );
}
