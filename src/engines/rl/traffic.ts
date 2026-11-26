/*
 * A traffic light that learns (lesson 8): a one-intersection simulator, a fixed-timer controller,
 * and a tabular Q-learning agent with safety rules it cannot override.
 * Ported unchanged from the legacy traffic.js, so training gives the same numbers.
 */
import { rng } from '../random';

export const MIN_GREEN = 6;
export const YELLOW = 3;
export const RED_CLEARANCE = 1;
export const HEADWAY = 2;
export const STARTUP = 2;
export const ALPHA = 0.1;
export const GAMMA = 0.98;
export const EPISODE_SECONDS = 900;
export const BATCH_SIZE = 30;
export const CHECKPOINT_EVERY = 5;
export const TEST_RUNS = 12;
export const WATCH_SEED = 5000;
const STARTING_QUEUES = [2, 1, 2, 3];

/** Cars per minute per approach: [north–south, east–west]. */
export const PATTERNS = { main: [14, 6], balanced: [10, 10], side: [6, 14] } as const;
export type PatternId = keyof typeof PATTERNS;

/** Queue ranges the agent can tell apart. */
export const RANGES = ['0', '1–2', '3–5', '6–9', '10+'];
const LIMITS = [0, 2, 5, 9];

export function bucket(q: number): number {
  let i = 0;
  while (i < LIMITS.length && q > LIMITS[i]) i++;
  return i;
}

/** The timer splits 60 s of green between the roads by demand. */
export function fixedPlan([ns, ew]: readonly number[]): [number, number] {
  const nsGreen = Math.max(10, Math.min(50, 2 * Math.round((30 * ns) / (ns + ew))));
  return [nsGreen, 60 - nsGreen];
}

export interface Pending {
  state: number;
  action: number;
  reward: number;
  discount: number;
}

export interface QUpdate {
  action: number;
  state: number;
  previous: number;
  target: number;
  next: number;
}

/**
 * Tabular Q-learning. State = which road has green × queue range on green × queue range on red
 * (2 × 5 × 5 = 50 states), actions Keep (0) or Switch (1).
 */
export class Learner {
  values = new Float64Array(100);
  visits = new Uint32Array(100);
  updates = 0;

  state(sim: Intersection): number {
    return sim.phase * 25 + bucket(sim.queue(sim.phase)) * 5 + bucket(sim.queue(1 - sim.phase));
  }

  best(state: number): number {
    return this.values[state * 2 + 1] > this.values[state * 2] ? 1 : 0;
  }

  seen(state: number): boolean {
    return this.visits[state * 2] + this.visits[state * 2 + 1] > 0;
  }

  explorationRate(): number {
    return 0.05 + 0.2 * Math.exp(-this.updates / 3000);
  }

  update(pending: Pending, nextState: number | null, track = false): QUpdate | undefined {
    const future = nextState === null ? 0 : this.values[nextState * 2 + this.best(nextState)];
    const i = pending.state * 2 + pending.action;
    const previous = this.values[i];
    const target = pending.reward + pending.discount * future;
    this.values[i] += ALPHA * (target - previous);
    this.updates++;
    if (track)
      return { action: pending.action, state: pending.state, previous, target, next: this.values[i] };
  }

  choose(sim: Intersection, state: number, learning: boolean) {
    if (learning && sim.pending)
      sim.lastUpdate = this.update(sim.pending, state, Boolean(sim.motion)) ?? null;
    const explore = learning && sim.exploration() < this.explorationRate();
    const action = explore ? Number(sim.exploration() < 0.5) : this.best(state);
    if (learning) {
      this.visits[state * 2 + action]++;
      sim.pending = { state, action, reward: 0, discount: 1 };
    }
    return { action, explore };
  }
}

export type Context =
  'timer' | 'yellow' | 'allRed' | 'minimum' | 'extension' | 'explore' | 'learned' | 'unseen';

export interface TickInfo {
  nsBefore: number;
  ewBefore: number;
  phaseBefore: number;
  action: number;
  context: Context;
  remaining: number;
  waiting: number;
  clearance: number;
}

export interface LaneMotion {
  /** Id of the car that arrived this tick, or -1. */
  entered: number;
  departed: boolean;
  crossing: { id: number; time: number; fresh: boolean }[];
}

/** Arms 0–1 are north–south, 2–3 east–west. Phase 0 = north–south green. */
export class Intersection {
  arrival: () => number;
  exploration: () => number;
  arrivalOffsets: number[];
  q: number[];
  heads = [0, 0, 0, 0];
  time = 0;
  phase = 0;
  green = 0;
  clearance = 0;
  wait = [0, 0];
  arrived: number[];
  crossed = 0;
  pending: Pending | null = null;
  lastState: number | null = null;
  lastTick: TickInfo | null = null;
  lastUpdate: QUpdate | null = null;
  /** Per-arm car movement, kept only for the intersections people watch. */
  motion: LaneMotion[] | null;

  constructor(arrivalSeed: number, trackCars = false) {
    this.arrival = rng(arrivalSeed);
    this.exploration = rng(arrivalSeed ^ 0x9e3779b9);
    // Offsetting the arrival waves imitates platoons from upstream signals.
    this.arrivalOffsets = Array.from({ length: 4 }, () => Math.floor(this.arrival() * 60));
    this.q = trackCars ? STARTING_QUEUES.slice() : [0, 0, 0, 0];
    this.arrived = [this.queue(0), this.queue(1)];
    this.motion = trackCars ? this.q.map(() => ({ entered: -1, departed: false, crossing: [] })) : null;
  }

  queue(phase: number): number {
    return this.q[phase * 2] + this.q[phase * 2 + 1];
  }

  averageWait(): number {
    return (this.wait[0] + this.wait[1]) / (this.arrived[0] + this.arrived[1] || 1);
  }

  addCars(arm: number, count: number) {
    this.q[arm] += count;
    this.arrived[arm < 2 ? 0 : 1] += count;
  }

  /** One simulated second. `controller` is the learner or a fixed plan [nsGreen, ewGreen]. */
  tick(
    rates: readonly number[],
    controller: Learner | readonly number[],
    learning = false,
    mainOnly = false,
  ) {
    for (let arm = 0; arm < 4; arm++) {
      const lane = this.motion?.[arm];
      if (lane) {
        lane.departed = false;
        lane.entered = -1;
        lane.crossing = lane.crossing.filter((car) => this.time - car.time < 3);
      }
      const inPlatoon = (this.time + this.arrivalOffsets[arm]) % 60 < 30;
      if (this.arrival() < rates[arm < 2 ? 0 : 1] * (inPlatoon ? 1.6 : 0.4)) {
        if (lane) lane.entered = this.heads[arm] + this.q[arm];
        this.addCars(arm, 1);
      }
    }

    let context: Context = 'timer';
    let remaining = 0;
    let action = 0;
    const phaseBefore = this.phase;
    const nsBefore = this.queue(0);
    const ewBefore = this.queue(1);
    if (this.clearance) {
      context = this.clearance > RED_CLEARANCE ? 'yellow' : 'allRed';
      remaining = context === 'yellow' ? this.clearance - RED_CLEARANCE : this.clearance;
    } else if (this.green < MIN_GREEN) {
      context = 'minimum';
      remaining = MIN_GREEN - this.green;
    } else if (this.green % HEADWAY) {
      context = 'extension';
    } else if (controller instanceof Learner) {
      const state = controller.state(this);
      const seen = controller.seen(state);
      const choice = controller.choose(this, state, learning);
      this.lastState = state;
      action = choice.action;
      context = choice.explore ? 'explore' : seen ? 'learned' : 'unseen';
    } else {
      action = Number(this.green >= controller[this.phase]);
    }

    if (action) this.clearance = YELLOW + RED_CLEARANCE;
    const clearance = this.clearance;
    if (clearance) {
      this.clearance--;
      if (this.clearance === 0) {
        this.phase = 1 - this.phase;
        this.green = 0;
      }
    } else {
      if (this.green >= STARTUP && this.green % HEADWAY === 0) {
        for (let arm = this.phase * 2; arm < this.phase * 2 + 2; arm++) {
          if (this.q[arm] === 0) continue;
          const lane = this.motion?.[arm];
          if (lane) {
            lane.departed = true;
            lane.crossing.push({
              id: this.heads[arm],
              time: this.time + 1,
              fresh: lane.entered === this.heads[arm],
            });
          }
          this.heads[arm]++;
          this.q[arm]--;
          this.crossed++;
        }
      }
      this.green++;
    }

    const nsWaiting = this.queue(0);
    const ewWaiting = this.queue(1);
    const waiting = mainOnly ? nsWaiting : nsWaiting + ewWaiting;
    if (learning && this.pending) {
      this.pending.reward -= this.pending.discount * waiting;
      this.pending.discount *= GAMMA;
    }
    this.time++;
    this.wait[0] += nsWaiting;
    this.wait[1] += ewWaiting;
    if (this.motion)
      this.lastTick = { nsBefore, ewBefore, phaseBefore, action, context, remaining, waiting, clearance };
  }
}

/** One 15-minute training episode with its own traffic. `episode` is the count trained so far. */
export function trainEpisode(learner: Learner, rates: readonly number[], mainOnly: boolean, episode: number) {
  const trial = new Intersection(100000 + 3 * episode);
  for (let t = 0; t < EPISODE_SECONDS; t++) trial.tick(rates, learner, true, mainOnly);
  if (trial.pending) learner.update(trial.pending, null);
}

export interface RoadReport {
  /** Average accrued wait per car, seconds. */
  average: number;
  /** Share of cars that crossed by the end. */
  cleared: number;
  roadWait: number[];
}

export interface Evaluation {
  episodes: number;
  updates: number;
  agent: RoadReport;
  fixed: RoadReport;
  /** Paired test runs where the agent had less wait. */
  lowerWait: number;
}

/** Both controllers face the same held-out traffic; the agent uses its policy without exploring. */
export function testPolicy(learner: Learner, rates: readonly number[], episodes: number): Evaluation {
  const plan = fixedPlan(rates);
  const arrivals = [0, 0];
  const agentStats = { wait: [0, 0], crossed: 0 };
  const fixedStats = { wait: [0, 0], crossed: 0 };
  let lowerWait = 0;
  for (let run = 0; run < TEST_RUNS; run++) {
    const seed = 200000 + 3 * run;
    const a = new Intersection(seed);
    const f = new Intersection(seed);
    for (let t = 0; t < EPISODE_SECONDS; t++) {
      a.tick(rates, learner);
      f.tick(rates, plan);
    }
    for (let p = 0; p < 2; p++) {
      arrivals[p] += f.arrived[p];
      agentStats.wait[p] += a.wait[p];
      fixedStats.wait[p] += f.wait[p];
    }
    agentStats.crossed += a.crossed;
    fixedStats.crossed += f.crossed;
    if (a.averageWait() < f.averageWait()) lowerWait++;
  }
  const total = arrivals[0] + arrivals[1];
  const report = ({ wait, crossed }: { wait: number[]; crossed: number }): RoadReport => ({
    average: (wait[0] + wait[1]) / total,
    cleared: crossed / total,
    roadWait: wait.map((d, p) => d / arrivals[p]),
  });
  return {
    episodes,
    updates: learner.updates,
    agent: report(agentStats),
    fixed: report(fixedStats),
    lowerWait,
  };
}
