import { useState } from 'react';
import {
  compareWeights,
  INITIAL_WEIGHT,
  MAX_WEIGHT,
  MIN_WEIGHT,
  TEST_EXAMPLE,
  TRAINING_EXAMPLES,
  WEIGHT_STEP,
} from '../../engines/neural';
import { useT } from '../../i18n';
import { Card, Slider, Stat, Stats } from '../kit';
import { NeuronNode, SignalPath } from './NeuronArt';

export interface TrainingState {
  weight: number;
  last: ReturnType<typeof compareWeights> | null;
}

export function TrainingExamples({
  training,
  onChange,
  train,
}: {
  training: TrainingState;
  onChange: (state: TrainingState) => void;
  train: boolean;
}) {
  const { bi, num } = useT();
  const [selected, setSelected] = useState(1);
  const { weight, last } = training;
  const example = TRAINING_EXAMPLES[selected];
  const guess = example.rounds * weight;
  const selectedGap = Math.abs(guess - example.sacks);
  const proposal = train ? compareWeights(weight) : null;
  const bestFit = proposal?.current.gap === 0;

  function learn() {
    if (proposal) onChange({ weight: proposal.best.weight, last: proposal });
  }

  return (
    <Card
      title={
        train
          ? bi('Teach the model from examples', 'উদাহরণ দিয়ে মডেলকে শেখান')
          : bi('Read the practice examples', 'অনুশীলনের উদাহরণ দেখুন')
      }
    >
      <p className="lab-lead">
        {bi(
          'The model predicts sacks by multiplying the number of rounds by one weight. The table uses made-up collection records.',
          'সংগ্রহের দফার সংখ্যা একটি গুণক দিয়ে গুণ করে মডেল বস্তার সংখ্যা অনুমান করে। ছকে অনুশীলনের জন্য বানানো তথ্য রয়েছে।',
        )}
      </p>
      {train && (
        <div className="neural-train-controls">
          <Slider
            label={bi('Weight (sacks per round)', 'গুণক (প্রতি দফায় বস্তা)')}
            min={MIN_WEIGHT}
            max={MAX_WEIGHT}
            step={WEIGHT_STEP}
            value={weight}
            onChange={(value) => onChange({ weight: value, last: null })}
          />
          <div className="lab-row">
            <button type="button" className="btn" onClick={learn} disabled={bestFit}>
              {bi('Train one step', 'এক ধাপ প্রশিক্ষণ দিন')}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => onChange({ weight: INITIAL_WEIGHT, last: null })}
              disabled={weight === INITIAL_WEIGHT && !last}
            >
              {bi('Reset training', 'প্রশিক্ষণ আবার শুরু করুন')}
            </button>
          </div>
        </div>
      )}
      <div className="neural-training">
        <table className="neural-table">
          <caption className="visually-hidden">
            {bi('Three practice records', 'অনুশীলনের তিনটি রেকর্ড')}
          </caption>
          <thead>
            <tr>
              <th scope="col">{bi('Rounds', 'দফা')}</th>
              <th scope="col">{bi('Actual sacks', 'প্রকৃত বস্তা')}</th>
              <th scope="col">{bi('Model guess', 'মডেলের অনুমান')}</th>
            </tr>
          </thead>
          <tbody>
            {TRAINING_EXAMPLES.map(({ rounds, sacks }, i) => (
              <tr key={rounds} className={selected === i ? 'selected' : undefined}>
                <th scope="row">
                  <button
                    type="button"
                    className="btn ghost mono"
                    aria-pressed={selected === i}
                    aria-label={bi(`Show ${rounds} rounds`, `${num(rounds)} দফা দেখুন`)}
                    onClick={() => setSelected(i)}
                  >
                    {num(rounds)}
                  </button>
                </th>
                <td className="mono">{num(sacks)}</td>
                <td className="mono">{num(rounds * weight)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="neural-example" role="status">
          <svg className="neuron-art neuron-training-art" viewBox="0 0 275 63" aria-hidden="true">
            <g key={`${example.rounds}-${weight}`}>
              <SignalPath d="M58 31.5 H220" pulse />
            </g>
            <NeuronNode x={39} y={31.5} r={18}>
              {num(example.rounds)}
            </NeuronNode>
            <NeuronNode x={138} y={31.5} r={25} active>{`×${num(weight)}`}</NeuronNode>
            <NeuronNode x={239} y={31.5} r={21}>
              {num(guess)}
            </NeuronNode>
          </svg>
          <strong className="neural-equation mono">
            {num(example.rounds)} × {num(weight)} = {num(guess)}
          </strong>
          <ComparisonBar label={bi('Model guess', 'মডেলের অনুমান')} value={guess} max={15} />
          <ComparisonBar label={bi('Actual sacks', 'প্রকৃত বস্তা')} value={example.sacks} max={15} actual />
          <p>
            {bi('Difference', 'পার্থক্য')} <b className="mono">{num(selectedGap)}</b>
          </p>
        </div>
      </div>
      {train && (
        <>
          <div className="neural-training-update" role="status">
            {last ? (
              <>
                <span>
                  {bi('Weight', 'গুণক')}{' '}
                  <b className="mono">
                    {num(last.current.weight)} → {num(last.best.weight)}
                  </b>
                </span>
                <span>
                  {bi('Average gap', 'গড় ভুল')}{' '}
                  <b className="mono">
                    {num(last.current.gap)} → {num(last.best.gap)}
                  </b>
                </span>
              </>
            ) : (
              <span>
                {bi('Average gap', 'গড় ভুল')} <b className="mono">{num(proposal?.current.gap ?? 0)}</b>
              </span>
            )}
            {bestFit && <strong>{bi('All three guesses match.', 'তিনটি অনুমানই সঠিক।')}</strong>}
          </div>
          {last && (
            <details className="neural-trials">
              <summary>{bi('See how the weight was chosen', 'গুণক কীভাবে বেছে নেওয়া হলো দেখুন')}</summary>
              <p className="lab-lead">
                {bi(
                  'The model tried nearby weights. For each weight, it added the three differences and divided by three. It kept the weight with the smallest gap.',
                  'মডেল কাছাকাছি কয়েকটি গুণক যাচাই করেছে। প্রতিটির জন্য তিনটি পার্থক্য যোগ করে তিন দিয়ে ভাগ করেছে। গড় ভুল সবচেয়ে কম এমন গুণকটি রেখেছে।',
                )}
              </p>
              <table className="neural-table">
                <thead>
                  <tr>
                    <th scope="col">{bi('Weight tried', 'যে গুণক যাচাই হয়েছে')}</th>
                    <th scope="col">{bi('Average gap', 'গড় ভুল')}</th>
                    <th scope="col">{bi('Decision', 'সিদ্ধান্ত')}</th>
                  </tr>
                </thead>
                <tbody>
                  {last.candidates.map((candidate) => (
                    <tr
                      key={candidate.weight}
                      className={candidate.weight === last.best.weight ? 'selected' : undefined}
                    >
                      <td className="mono">{num(candidate.weight)}</td>
                      <td className="mono">{num(candidate.gap)}</td>
                      <td>{candidate.weight === last.best.weight ? bi('Kept', 'রাখা হয়েছে') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </>
      )}
    </Card>
  );
}

function ComparisonBar({
  label,
  value,
  max,
  actual = false,
}: {
  label: string;
  value: number;
  max: number;
  actual?: boolean;
}) {
  const { num } = useT();
  return (
    <div className={actual ? 'neural-bar actual' : 'neural-bar'}>
      <span>{label}</span>
      <b className="mono">{num(value)}</b>
      <span className="neural-bar-track" aria-hidden="true">
        <i style={{ width: `${(100 * value) / max}%` }} />
      </span>
    </div>
  );
}

export function NewExample({ weight }: { weight: number }) {
  const { bi, num } = useT();
  const [revealed, setRevealed] = useState(false);
  const guess = TEST_EXAMPLE.rounds * weight;
  const difference = Math.abs(guess - TEST_EXAMPLE.sacks);
  return (
    <Card title={bi('Test a new collection day', 'নতুন দিনের সংগ্রহ যাচাই করুন')}>
      <p className="lab-lead">
        {bi(
          'This record was held back during training. Use the current weight to make a guess for four rounds.',
          'প্রশিক্ষণের সময় এই রেকর্ডটি আলাদা রাখা হয়েছিল। বর্তমান গুণক দিয়ে চার দফায় কত বস্তা হবে অনুমান করুন।',
        )}
      </p>
      <strong className="neural-equation mono">
        {num(TEST_EXAMPLE.rounds)} × {num(weight)} = {num(guess)}
      </strong>
      <div className="lab-row">
        <button type="button" className="btn" onClick={() => setRevealed(!revealed)} aria-expanded={revealed}>
          {revealed
            ? bi('Hide actual count', 'প্রকৃত সংখ্যা আড়াল করুন')
            : bi('Reveal actual count', 'প্রকৃত সংখ্যা দেখুন')}
        </button>
      </div>
      {revealed && (
        <div role="status">
          <Stats>
            <Stat
              label={bi('Guess before training', 'প্রশিক্ষণের আগের অনুমান')}
              value={num(TEST_EXAMPLE.rounds * INITIAL_WEIGHT)}
            />
            <Stat label={bi('Current guess', 'বর্তমান অনুমান')} value={num(guess)} />
            <Stat label={bi('Actual sacks', 'প্রকৃত বস্তা')} value={num(TEST_EXAMPLE.sacks)} />
            <Stat
              label={bi('Difference', 'পার্থক্য')}
              value={num(difference)}
              tone={difference === 0 ? 'good' : undefined}
            />
          </Stats>
        </div>
      )}
    </Card>
  );
}
