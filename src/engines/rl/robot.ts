import { rng } from '../random';

export const WIDTH = 7;
export const HEIGHT = 4;
export const START = 16;
export const CHARGER = 2;
export const BIN = 19;
export const DEPOT = 14;
export const BLOCKS = [0, 4, 6, 7, 10, 13, 21, 24, 27];
export const CAPACITY = 12;
export const TRAIN_BATTERY = 5;
export const TURN_LIMIT = 30;
export const DELIVERY_BONUS = 30;
export const FLAT_PENALTY = 12;

export const MOVES = ['north', 'east', 'south', 'west'] as const;
const ACTIONS = [...MOVES, 'charge'] as const;
export type Action = (typeof ACTIONS)[number];
export type Outcome = 'running' | 'delivered' | 'flat' | 'timeout';
export type Event = 'move' | 'collect' | 'charge' | Exclude<Outcome, 'running'>;

export interface RobotState {
  cell: number;
  battery: number;
  carrying: boolean;
  turn: number;
  outcome: Outcome;
}

export interface Experience {
  before: RobotState;
  action: Action;
  after: RobotState;
  reward: number;
  event: Event;
  update?: { previous: number; next: number; explored: boolean };
}

export function startRobot(battery = TRAIN_BATTERY): RobotState {
  return { cell: START, battery, carrying: false, turn: 0, outcome: 'running' };
}

function destination(cell: number, action: Action): number {
  switch (action) {
    case 'north':
      return cell - WIDTH;
    case 'east':
      return cell % WIDTH === WIDTH - 1 ? -1 : cell + 1;
    case 'south':
      return cell + WIDTH;
    case 'west':
      return cell % WIDTH === 0 ? -1 : cell - 1;
    case 'charge':
      return cell;
  }
}

export function actionsFor(state: RobotState): Action[] {
  if (state.outcome !== 'running') return [];
  return ACTIONS.filter((action) => {
    if (action === 'charge') return state.cell === CHARGER && state.battery < CAPACITY;
    const cell = destination(state.cell, action);
    return cell >= 0 && cell < WIDTH * HEIGHT && !BLOCKS.includes(cell);
  });
}

export function act(state: RobotState, action: Action): Experience {
  const cell = destination(state.cell, action);
  const battery = action === 'charge' ? CAPACITY : state.battery - 1;
  const carrying = state.carrying || cell === BIN;
  const turn = state.turn + 1;
  let outcome: Outcome = 'running';
  if (carrying && cell === DEPOT) outcome = 'delivered';
  else if (battery === 0) outcome = 'flat';
  else if (turn === TURN_LIMIT) outcome = 'timeout';
  const event =
    outcome !== 'running'
      ? outcome
      : action === 'charge'
        ? 'charge'
        : !state.carrying && carrying
          ? 'collect'
          : 'move';
  const reward = -1 + (outcome === 'delivered' ? DELIVERY_BONUS : outcome === 'flat' ? -FLAT_PENALTY : 0);
  return {
    before: state,
    action,
    after: { cell, battery, carrying: carrying && outcome !== 'delivered', turn, outcome },
    reward,
    event,
  };
}

function qIndex(state: RobotState, action: Action): number {
  const key = (state.cell * (CAPACITY + 1) + state.battery) * 2 + Number(state.carrying);
  return key * ACTIONS.length + ACTIONS.indexOf(action);
}

export class RobotLearner {
  private values = new Float64Array(WIDTH * HEIGHT * (CAPACITY + 1) * 2 * ACTIONS.length);
  private random = rng(807);

  private best(state: RobotState, options: Action[]): Action {
    return options.reduce((best, action) =>
      this.values[qIndex(state, action)] > this.values[qIndex(state, best)] ? action : best,
    );
  }

  choose(state: RobotState): Action {
    return this.best(state, actionsFor(state));
  }

  learn(state: RobotState, completed: number): Experience {
    const options = actionsFor(state);
    const explored = this.random() < 0.12 + 0.85 * Math.exp(-completed / 180);
    const action = explored ? options[Math.floor(this.random() * options.length)] : this.best(state, options);
    const step = act(state, action);
    // The end-of-attempt turn limit is a display cutoff. Bootstrap from the underlying state.
    const nextState =
      step.after.outcome === 'timeout' ? { ...step.after, outcome: 'running' as const } : step.after;
    const future =
      nextState.outcome === 'running' ? this.values[qIndex(nextState, this.choose(nextState))] : 0;
    const index = qIndex(state, action);
    const previous = this.values[index];
    this.values[index] += 0.3 * (step.reward + 0.95 * future - previous);
    return { ...step, update: { previous, next: this.values[index], explored } };
  }
}

/** Direct trip along the main street, first to the bin and then back to the depot. */
export function directRoute(state: RobotState): Action {
  return state.carrying ? 'west' : 'east';
}

/** Runs a frozen policy through exactly one attempt. */
export function runRoute(battery: number, choose: (state: RobotState) => Action): Experience[] {
  const log: Experience[] = [];
  let state = startRobot(battery);
  while (state.outcome === 'running') {
    const step = act(state, choose(state));
    log.push(step);
    state = step.after;
  }
  return log;
}
