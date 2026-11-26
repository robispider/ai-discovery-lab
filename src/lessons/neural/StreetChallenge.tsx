import { useState } from 'react';
import { dispatch, DISPATCH_CASES, ONE_REPORT_THRESHOLD, TWO_REPORT_THRESHOLD } from '../../engines/neural';
import { useT } from '../../i18n';
import { Card } from '../kit';
import { DispatchArt, type Unit } from './DispatchArt';

export function StreetChallenge() {
  const { bi, num } = useT();
  const [reports, setReports] = useState({ a: true, b: false });
  const [selected, setSelected] = useState<Unit>('any');
  const [replay, setReplay] = useState(0);
  const a = Number(reports.a);
  const b = Number(reports.b);
  const result = dispatch(a, b);
  const decision =
    result.output === 1
      ? bi('Send one crew', 'একটি দল পাঠান')
      : result.both === 1
        ? bi('Send to coordination', 'সমন্বয়ের জন্য পাঠান')
        : bi('No dispatch', 'দল পাঠাতে হবে না');
  const total = `${num(a)} + ${num(b)} = ${num(result.sum)}`;
  const unitLabels = {
    any: bi('At least one reports', 'অন্তত একটি অভিযোগ'),
    both: bi('Both report', 'দুটি অভিযোগই এসেছে'),
    output: bi('Exactly one crew?', 'ঠিক একটি দল?'),
  };
  const cutoff = selected === 'any' ? ONE_REPORT_THRESHOLD : TWO_REPORT_THRESHOLD;

  function updateReport(street: 'a' | 'b', value: boolean) {
    setReports((current) => ({ ...current, [street]: value }));
    setReplay((run) => run + 1);
  }
  return (
    <Card title={bi('Should we send exactly one crew?', 'ঠিক একটি দল পাঠাব কি?')}>
      <p className="lab-lead">
        {bi(
          'In this made-up service rule, one street’s report needs one crew. If both streets report, the request goes to coordination.',
          'এই অনুশীলনের নিয়মে একটি সড়ক থেকে অভিযোগ এলে একটি দল পাঠানো হয়। দুই সড়ক থেকেই অভিযোগ এলে সমন্বয়ের জন্য পাঠানো হয়।',
        )}
      </p>
      <div className="neuron-dispatch-controls">
        <div className="lab-row" role="group" aria-label={bi('Street reports', 'সড়কের অভিযোগ')}>
          <ReportToggle
            label={bi('Street A reports', 'সড়ক A থেকে অভিযোগ')}
            checked={reports.a}
            onChange={(value) => updateReport('a', value)}
          />
          <ReportToggle
            label={bi('Street B reports', 'সড়ক B থেকে অভিযোগ')}
            checked={reports.b}
            onChange={(value) => updateReport('b', value)}
          />
        </div>
        <button type="button" className="btn ghost" onClick={() => setReplay((run) => run + 1)}>
          {bi('Replay signals', 'আবার সংকেত চালান')}
        </button>
      </div>
      <DispatchArt
        a={a}
        b={b}
        any={result.any}
        both={result.both}
        output={result.output}
        selected={selected}
        onSelect={(unit) => {
          setSelected(unit);
          setReplay((run) => run + 1);
        }}
        replay={replay}
      />
      <div className="neuron-unit-detail">
        <div>
          <b>{unitLabels[selected]}</b>
          <p className="neuron-formula mono" aria-live="polite">
            {selected === 'output'
              ? `${num(result.any)} − ${num(result.both)} = ${num(result.output)}`
              : `${total} → ${num(result[selected])}`}
          </p>
          {selected !== 'output' && (
            <p>
              {bi(
                `Gives 1 at ${cutoff} or above. Otherwise it gives 0.`,
                `${num(cutoff)} বা তার বেশি হলে ১ দেয়। নইলে ০ দেয়।`,
              )}
            </p>
          )}
        </div>
        <strong className="neuron-decision" role="status">
          {decision}
        </strong>
      </div>
      <p className="lab-lead">
        {bi(
          'Select a circle in the hidden or output layer to see its arithmetic. We set these weights and cutoffs by hand.',
          'মাঝের স্তর বা আউটপুটের বৃত্তে চাপ দিয়ে তার হিসাব দেখুন। এই গুণক ও সীমা হাতে ঠিক করা হয়েছে।',
        )}
      </p>
      <details className="neural-trials">
        <summary>{bi('All four report combinations', 'অভিযোগ আসার চারটি সম্ভাবনা')}</summary>
        <table className="neural-table neural-cases">
          <caption className="visually-hidden">
            {bi('All four report combinations', 'অভিযোগ আসার চারটি সম্ভাবনা')}
          </caption>
          <thead>
            <tr>
              <th scope="col">{bi('Street A', 'সড়ক A')}</th>
              <th scope="col">{bi('Street B', 'সড়ক B')}</th>
              <th scope="col">{bi('At least one', 'অন্তত একটি')}</th>
              <th scope="col">{bi('Both', 'দুটিই')}</th>
              <th scope="col">{bi('One crew?', 'একটি দল?')}</th>
            </tr>
          </thead>
          <tbody>
            {DISPATCH_CASES.map((sample) => {
              const row = dispatch(sample.a, sample.b);
              return (
                <tr
                  key={`${sample.a}${sample.b}`}
                  className={sample.a === a && sample.b === b ? 'selected' : undefined}
                >
                  {[sample.a, sample.b, row.any, row.both, row.output].map((value, i) => (
                    <td key={i} className="mono">
                      {num(value)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
    </Card>
  );
}

function ReportToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const { num } = useT();
  return (
    <label className={checked ? 'neural-report active' : 'neural-report'}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
      <b className="mono" aria-hidden="true">
        {num(Number(checked))}
      </b>
    </label>
  );
}
