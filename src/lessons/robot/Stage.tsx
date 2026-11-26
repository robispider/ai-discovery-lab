import { useEffect, useState } from 'react';
import {
  actionsFor,
  CAPACITY,
  DELIVERY_BONUS,
  directRoute,
  FLAT_PENALTY,
  MOVES,
  runRoute,
  startRobot,
  TRAIN_BATTERY,
  TURN_LIMIT,
  WIDTH,
  type Experience,
  type RobotState,
} from '../../engines/rl/robot';
import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Callout, Card, Choice, LineChart } from '../kit';
import { RobotBoard, RobotTelemetry } from './Board';
import { CHECKPOINT, TRAIN_BATCH, useRobot } from './store';
import './robot.css';

const ACTION_LABELS = {
  north: { en: 'North', bn: 'উত্তর' },
  east: { en: 'East', bn: 'পূর্ব' },
  south: { en: 'South', bn: 'দক্ষিণ' },
  west: { en: 'West', bn: 'পশ্চিম' },
  charge: { en: 'Recharge', bn: 'চার্জ দিন' },
};
const ARROWS = ['↑', '→', '↓', '←'];
const EVENTS = {
  move: { en: 'Moved', bn: 'এগিয়েছে' },
  collect: { en: 'Picked up waste', bn: 'বর্জ্য তুলেছে' },
  charge: { en: 'Battery refilled', bn: 'ব্যাটারি পূর্ণ' },
  delivered: { en: 'Delivered', bn: 'জমা দিয়েছে' },
  flat: { en: 'Battery ran out', bn: 'চার্জ শেষ' },
  timeout: { en: 'Turn limit', bn: 'চালের সীমা' },
};

export function RobotStage() {
  const step = useLab((s) => s.step);
  return (
    <div className="robot-stage">
      {step === 'understand' || step === 'explore' ? (
        <ManualDrive />
      ) : step === 'train' ? (
        <Training />
      ) : (
        <Comparison />
      )}
    </div>
  );
}

function ManualDrive() {
  const { bi, num, pick } = useT();
  const log = useRobot((s) => s.manual);
  const drive = useRobot((s) => s.drive);
  const resetDrive = useRobot((s) => s.resetDrive);
  const state = log.at(-1)?.after ?? startRobot();
  const actions = actionsFor(state);
  return (
    <>
      <Card title={bi('Drive the robot', 'রোবট চালান')}>
        <RobotBoard state={state} log={log} />
        <div role="status">
          <RobotTelemetry state={state} log={log} />
        </div>
        <div
          className="robot-actions"
          role="group"
          aria-label={bi('Driving controls', 'রোবট চালানোর নিয়ন্ত্রণ')}
        >
          {MOVES.map((action, index) => (
            <button
              key={action}
              type="button"
              className="btn ghost"
              disabled={!actions.includes(action)}
              onClick={() => drive(action)}
            >
              <span aria-hidden="true">{ARROWS[index]}</span> {pick(ACTION_LABELS[action])}
            </button>
          ))}
          <button
            type="button"
            className="btn"
            disabled={!actions.includes('charge')}
            onClick={() => drive('charge')}
          >
            {pick(ACTION_LABELS.charge)}
          </button>
          <button type="button" className="btn ghost" disabled={!state.turn} onClick={resetDrive}>
            {bi('Restart drive', 'আবার চালান')}
          </button>
        </div>
        <ul className="robot-rules">
          <li>{bi('Each action costs 1 point', 'প্রতি চালে ১ পয়েন্ট কাটা হয়')}</li>
          <li>
            {bi(
              `Delivery adds ${DELIVERY_BONUS} points`,
              `বর্জ্য জমা দিলে ${num(DELIVERY_BONUS)} পয়েন্ট যোগ হয়`,
            )}
          </li>
          <li>
            {bi(
              `Running flat costs ${FLAT_PENALTY} extra points`,
              `চার্জ শেষ হলে আরও ${num(FLAT_PENALTY)} পয়েন্ট কাটা হয়`,
            )}
          </li>
        </ul>
      </Card>
      <ExperienceLog log={log} />
    </>
  );
}

function Training() {
  const { bi, num } = useT();
  const { attempt, completed, checkpoints } = useRobot((s) => s.training);
  const trainStep = useRobot((s) => s.trainStep);
  const trainBatch = useRobot((s) => s.trainBatch);
  const resetTraining = useRobot((s) => s.resetTraining);
  const [target, setTarget] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const running = target !== null && completed < target && !paused;
  const state = attempt.at(-1)?.after ?? startRobot();

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const remaining = target - useRobot.getState().training.completed;
      if (remaining > 0) trainBatch(Math.min(CHECKPOINT, remaining));
    }, 95);
    return () => window.clearInterval(timer);
  }, [running, target, trainBatch]);

  function toggleTraining() {
    if (running) {
      setPaused(true);
      return;
    }
    if (target === null || completed >= target) setTarget(completed + TRAIN_BATCH);
    setPaused(false);
  }

  return (
    <>
      <Card title={bi('Q-learning practice', 'Q-learning অনুশীলন')}>
        <RobotBoard state={state} log={attempt} />
        <RobotTelemetry state={state} log={attempt} />
        <div className="robot-actions">
          <button type="button" className="btn" onClick={toggleTraining}>
            {running
              ? bi('Pause training', 'প্রশিক্ষণ থামান')
              : target !== null && completed < target
                ? bi('Resume training', 'প্রশিক্ষণ চালু করুন')
                : bi(`Train ${TRAIN_BATCH} attempts`, `${num(TRAIN_BATCH)} বার প্রশিক্ষণ দিন`)}
          </button>
          <button type="button" className="btn ghost" disabled={running} onClick={trainStep}>
            {bi('Watch next action', 'পরের চাল দেখুন')}
          </button>
          <button
            type="button"
            className="btn ghost"
            disabled={!attempt.length}
            onClick={() => {
              setTarget(null);
              setPaused(false);
              resetTraining();
            }}
          >
            {bi('Clear training', 'প্রশিক্ষণ মুছুন')}
          </button>
          <span className="robot-attempts">
            {bi('Completed attempts', 'শেষ হয়েছে')} <b className="mono">{num(completed)}</b>
          </span>
        </div>
      </Card>
      <ExperienceLog log={attempt} learning />
      <Card title={bi('Successful deliveries during practice', 'অনুশীলনে সফলভাবে বর্জ্য জমা')}>
        <p className="robot-detail">
          {bi(
            `Share of attempts that reach the depot, per ${CHECKPOINT} attempts.`,
            `প্রতি ${num(CHECKPOINT)} বার চেষ্টায় কত শতাংশ ডিপোতে বর্জ্য জমা দিয়েছে।`,
          )}
        </p>
        {checkpoints.length > 0 && (
          <LineChart
            series={[{ values: checkpoints.map((point) => point.successRate), color: 'var(--accent)' }]}
            xlabels={checkpoints.map((point) => point.completed)}
            ymin={0}
            ymax={1}
            yfmt={(value) => `${Math.round(value * 100)}%`}
            label={bi('Successful deliveries by training batch', 'প্রতি ধাপে সফলভাবে বর্জ্য জমার হার')}
            height={160}
          />
        )}
      </Card>
    </>
  );
}

function stateText(
  state: RobotState,
  num: (value: string | number) => string,
  carrying: string,
  empty: string,
) {
  return `${num((state.cell % WIDTH) + 1)},${num(Math.floor(state.cell / WIDTH) + 1)} · ${num(state.battery)} · ${state.carrying ? carrying : empty}`;
}

function ExperienceLog({ log, learning }: { log: Experience[]; learning?: boolean }) {
  const { bi, num, pick } = useT();
  const recent = log.slice(-5);
  const loaded = bi('Loaded', 'বোঝাই');
  const empty = bi('Empty', 'খালি');
  return (
    <Card title={bi('Experience log', 'অভিজ্ঞতার তালিকা')}>
      <p className="robot-detail">
        {recent.length === 0
          ? bi('Take an action to record the first experience.', 'প্রথম অভিজ্ঞতা দেখতে একটি চাল দিন।')
          : bi(
              'State shows map position (column, row), battery and cargo.',
              'অবস্থায় দেখা যায় মানচিত্রের অবস্থান (কলাম, সারি), চার্জ ও বোঝা।',
            )}
      </p>
      {recent.length > 0 && (
        <div className="robot-table">
          <table>
            <thead>
              <tr>
                <th scope="col">{bi('Before', 'আগে')}</th>
                <th scope="col">{bi('Action', 'চাল')}</th>
                <th scope="col">{bi('Reward', 'পুরস্কার')}</th>
                <th scope="col">{bi('After', 'পরে')}</th>
                {learning && <th scope="col">{bi('Q-value update', 'Q-মানের পরিবর্তন')}</th>}
              </tr>
            </thead>
            <tbody>
              {recent.map((step) => (
                <tr key={step.after.turn}>
                  <td>{stateText(step.before, num, loaded, empty)}</td>
                  <td>
                    {pick(ACTION_LABELS[step.action])}
                    {step.event !== 'move' && <small>{pick(EVENTS[step.event])}</small>}
                  </td>
                  <td className={step.reward > 0 ? 'robot-positive mono' : 'mono'}>
                    {num(step.reward > 0 ? `+${step.reward}` : step.reward)}
                  </td>
                  <td>{stateText(step.after, num, loaded, empty)}</td>
                  {step.update && (
                    <td>
                      <span className="mono">
                        {num(step.update.previous.toFixed(2))} → {num(step.update.next.toFixed(2))}
                      </span>
                      <small>
                        {step.update.explored
                          ? bi('Explored', 'নতুন পথ খুঁজেছে')
                          : bi('Used Q-table', 'Q-সারণি মেনেছে')}
                      </small>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Comparison() {
  const { bi, num } = useT();
  const training = useRobot((s) => s.training);
  const step = useLab((s) => s.step);
  const setStep = useLab((s) => s.setStep);
  const [battery, setBattery] = useState(TRAIN_BATTERY);
  const [routes, setRoutes] = useState<{ baseline: Experience[]; learned: Experience[] } | null>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const lastFrame = Math.max(routes?.baseline.length ?? 0, routes?.learned.length ?? 0);
  const inProgress = routes !== null && frame < lastFrame;

  useEffect(() => {
    if (!playing || !inProgress) return;
    const timer = window.setTimeout(() => setFrame((current) => current + 1), 380);
    return () => window.clearTimeout(timer);
  }, [playing, inProgress, frame]);

  function chooseBattery(value: number) {
    setBattery(value);
    setRoutes(null);
    setPlaying(false);
    setFrame(0);
  }

  function play() {
    if (inProgress) {
      setPlaying(!playing);
      return;
    }
    setRoutes({
      baseline: runRoute(battery, directRoute),
      learned: runRoute(battery, (state) => training.learner.choose(state)),
    });
    setFrame(0);
    setPlaying(true);
  }

  const visible = [
    {
      title: bi('Direct route', 'সরাসরি পথ'),
      description: bi('Goes straight to the bin, then back.', 'বিনে সরাসরি যায়, তারপর ডিপোতে ফেরে।'),
      log: routes?.baseline.slice(0, frame) ?? [],
    },
    {
      title: bi('Learned route', 'শেখা পথ'),
      description: bi('Uses the Q-table from training.', 'প্রশিক্ষণে শেখা Q-সারণি ব্যবহার করে।'),
      log: routes?.learned.slice(0, frame) ?? [],
    },
  ];

  return (
    <>
      <Card title={bi('Compare the same mission', 'একই কাজের দুই পথ তুলনা করুন')}>
        <div className="robot-test-settings">
          <b>{bi('Starting battery', 'শুরুর চার্জ')}</b>
          <Choice
            label={bi('Starting battery', 'শুরুর চার্জ')}
            value={battery}
            options={[3, TRAIN_BATTERY, CAPACITY].map((value) => ({
              value,
              label:
                value === TRAIN_BATTERY
                  ? bi(`${value} · Training start`, `${num(value)} · প্রশিক্ষণের শুরু`)
                  : num(value),
            }))}
            onChange={chooseBattery}
          />
        </div>
        <div className="robot-actions">
          {training.completed > 0 ? (
            <>
              <button type="button" className="btn" onClick={play}>
                {inProgress
                  ? playing
                    ? bi('Pause replay', 'তুলনা থামান')
                    : bi('Resume replay', 'তুলনা চালু করুন')
                  : routes
                    ? bi('Replay comparison', 'আবার তুলনা করুন')
                    : bi('Compare routes', 'দুই পথ তুলনা করুন')}
              </button>
              {inProgress && !playing && (
                <button type="button" className="btn ghost" onClick={() => setFrame(frame + 1)}>
                  {bi('Next move', 'পরের চাল')}
                </button>
              )}
            </>
          ) : (
            <button type="button" className="btn" onClick={() => setStep('train')}>
              {bi('Train first', 'আগে প্রশিক্ষণ দিন')}
            </button>
          )}
        </div>
        <p className="robot-detail">
          {battery === TRAIN_BATTERY
            ? bi(
                'Both robots start with the same battery. The Q-table stays fixed during replay.',
                'দুই রোবট একই চার্জ নিয়ে শুরু করে। তুলনার সময় Q-সারণি বদলায় না।',
              )
            : bi(
                'This battery level differs from the training start. See how each route handles it.',
                'প্রশিক্ষণের শুরুতে এই চার্জ ছিল না। দেখুন দুই পথের ফল কী হয়।',
              )}
        </p>
      </Card>
      <div className="robot-comparison">
        {visible.map(({ title, description, log }) => {
          const state = log.at(-1)?.after ?? startRobot(battery);
          return (
            <Card key={title} title={title} className="robot-run">
              <p className="robot-detail">{description}</p>
              <RobotTelemetry state={state} log={log} />
              <RobotBoard state={state} log={log} />
              <div className="robot-run-totals">
                <span>
                  {bi('Actions', 'চাল')} <b className="mono">{num(state.turn)}</b>
                </span>
                <span>
                  {bi('Recharges', 'চার্জ নিয়েছে')}{' '}
                  <b className="mono">{num(log.filter((entry) => entry.action === 'charge').length)}</b>
                </span>
              </div>
            </Card>
          );
        })}
      </div>
      {step === 'apply' && (
        <Callout kind="lesson">
          {bi(
            `The simulator sets street access, battery use and a ${TURN_LIMIT}-action limit. The agent learns which legal action pays off in the long run.`,
            `সিমুলেটর ঠিক করে কোন পথে যাওয়া যাবে, কত চার্জ খরচ হবে এবং সর্বোচ্চ ${num(TURN_LIMIT)}টি চাল দেওয়া যাবে। কোন চাল দীর্ঘমেয়াদে লাভজনক, তা এজেন্ট অভিজ্ঞতা থেকে শেখে।`,
          )}
        </Callout>
      )}
    </>
  );
}
