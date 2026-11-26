import { useId } from 'react';
import {
  BIN,
  BLOCKS,
  CAPACITY,
  CHARGER,
  DEPOT,
  HEIGHT,
  START,
  WIDTH,
  type Experience,
  type RobotState,
} from '../../engines/rl/robot';
import { useT } from '../../i18n';

const cells = Array.from({ length: WIDTH * HEIGHT }, (_, cell) => cell);
const streets = cells.filter((cell) => !BLOCKS.includes(cell));
const x = (cell: number) => (cell % WIDTH) * 74 + 37;
const y = (cell: number) => Math.floor(cell / WIDTH) * 70 + 36;

export function RobotBoard({ state, log }: { state: RobotState; log: Experience[] }) {
  const { bi } = useT();
  const titleId = useId();
  const descId = useId();
  const points = [START, ...log.map((step) => step.after.cell)];
  const stops = [
    { cell: DEPOT, label: bi('Depot', 'ডিপো'), shape: 'M-9 7V-3L0-10 9-3V7ZM-3 7V0H3V7' },
    { cell: CHARGER, label: bi('Charger', 'চার্জার'), shape: 'M2-11-7 2H-1L-2 11 7-2H1Z' },
    { cell: BIN, label: bi('Waste bin', 'বর্জ্যের বিন'), shape: 'M-7-4H7M-3-4V-8H3V-4M-5-4-4 8H4L5-4M0-1V5' },
    { cell: START, label: bi('Start', 'শুরু'), shape: 'M-4 9V-8H6L3-3 6 2H-4' },
  ];
  return (
    <svg
      className="robot-map"
      viewBox="0 0 518 282"
      role="img"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <title id={titleId}>{bi('Waste collection practice map', 'বর্জ্য সংগ্রহের অনুশীলন মানচিত্র')}</title>
      <desc id={descId}>
        {bi(
          'The robot starts on the main street between the depot to the west and the waste bin to the east. The charger is two blocks north of the starting point.',
          'মূল সড়কে পশ্চিমে ডিপো ও পূর্বে বর্জ্যের বিন। দুইটির মাঝ থেকে রোবট যাত্রা শুরু করে। চার্জার শুরুর স্থান থেকে দুই ঘর উত্তরে।',
        )}
      </desc>
      <rect width="518" height="282" rx="14" className="robot-map-background" />
      {cells
        .filter((cell) => BLOCKS.includes(cell))
        .map((cell) => (
          <g key={cell} transform={`translate(${x(cell)} ${y(cell)})`} className="robot-block">
            <rect x="-23" y="-19" width="46" height="38" rx="7" />
            <path d="M-12 8v-16h8v16m4 0v-10h11v10M-16 8h31" />
          </g>
        ))}
      {streets.flatMap((cell) =>
        [cell % WIDTH === WIDTH - 1 ? -1 : cell + 1, cell + WIDTH]
          .filter((adjacent) => streets.includes(adjacent))
          .map((adjacent) => (
            <line
              key={`${cell}-${adjacent}`}
              className="robot-street"
              x1={x(cell)}
              y1={y(cell)}
              x2={x(adjacent)}
              y2={y(adjacent)}
            />
          )),
      )}
      {streets.map((cell) => (
        <circle key={cell} className="robot-node" cx={x(cell)} cy={y(cell)} r="4" />
      ))}
      <polyline className="robot-trail" points={points.map((cell) => `${x(cell)},${y(cell)}`).join(' ')} />
      {stops.map(({ cell, label, shape }) => (
        <g
          key={cell}
          className={
            cell === BIN && (state.carrying || state.outcome === 'delivered')
              ? 'robot-stop collected'
              : 'robot-stop'
          }
          transform={`translate(${x(cell)} ${y(cell)})`}
        >
          <rect className="robot-landmark" x="-15" y="-15" width="30" height="30" rx="8" />
          <path d={shape} />
          <text y="31" textAnchor="middle">
            {label}
          </text>
        </g>
      ))}
      <g
        className={state.outcome === 'flat' ? 'robot-rover flat' : 'robot-rover'}
        style={{ transform: `translate(${x(state.cell)}px, ${y(state.cell)}px)` }}
      >
        <rect className="robot-rover-frame" x="-18" y="-17" width="36" height="34" rx="10" />
        <path d="M0-12v-4m-10 7h20v14h-20zM-7 5v5m14-5v5M-5-3h.1M5-3h.1M-3 1h6" />
        {state.carrying && state.outcome !== 'delivered' && (
          <rect className="robot-cargo" x="8" y="-19" width="11" height="11" rx="2" />
        )}
      </g>
    </svg>
  );
}

export function RobotTelemetry({ state, log }: { state: RobotState; log: Experience[] }) {
  const { bi, num } = useT();
  const status = {
    running: state.carrying ? bi('Carrying waste', 'বর্জ্য বহন করছে') : bi('Bin still full', 'বিনে বর্জ্য আছে'),
    delivered: bi('Delivered to depot', 'ডিপোতে পৌঁছেছে'),
    flat: bi('Battery ran out', 'চার্জ শেষ'),
    timeout: bi('Turn limit reached', 'চালের সীমা শেষ'),
  }[state.outcome];
  const battery = `${num(state.battery)} / ${num(CAPACITY)}`;
  return (
    <div className="robot-telemetry">
      <div className={state.battery <= 2 ? 'robot-battery low' : 'robot-battery'}>
        <span>
          {bi('Battery', 'ব্যাটারি')} <b className="mono">{battery}</b>
        </span>
        <meter
          min={0}
          max={CAPACITY}
          value={state.battery}
          aria-label={bi('Battery remaining', 'ব্যাটারির অবশিষ্ট চার্জ')}
        />
      </div>
      <div>
        <span>{bi('Score', 'স্কোর')}</span>{' '}
        <b className="mono">{num(log.reduce((total, step) => total + step.reward, 0))}</b>
      </div>
      <strong className={`robot-outcome ${state.outcome}`}>{status}</strong>
    </div>
  );
}
