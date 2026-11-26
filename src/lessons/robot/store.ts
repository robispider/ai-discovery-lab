import { create } from 'zustand';
import {
  act,
  actionsFor,
  RobotLearner,
  startRobot,
  type Action,
  type Experience,
} from '../../engines/rl/robot';

export const CHECKPOINT = 25;
export const TRAIN_BATCH = 600;

interface Training {
  learner: RobotLearner;
  attempt: Experience[];
  completed: number;
  successes: number;
  checkpoints: { completed: number; successRate: number }[];
}

function freshTraining(): Training {
  return { learner: new RobotLearner(), attempt: [], completed: 0, successes: 0, checkpoints: [] };
}

function advance(training: Training): Training {
  const state = training.attempt.at(-1)?.after ?? startRobot();
  const fresh = state.outcome !== 'running';
  const step = training.learner.learn(fresh ? startRobot() : state, training.completed);
  const attempt = [...(fresh ? [] : training.attempt), step];
  if (step.after.outcome === 'running') return { ...training, attempt };
  const completed = training.completed + 1;
  const successes = training.successes + Number(step.after.outcome === 'delivered');
  if (completed % CHECKPOINT !== 0) return { ...training, attempt, completed, successes };
  const checkpoints = [
    ...training.checkpoints.slice(-39),
    { completed, successRate: successes / CHECKPOINT },
  ];
  return { ...training, attempt, completed, successes: 0, checkpoints };
}

interface RobotLab {
  manual: Experience[];
  training: Training;
  drive: (action: Action) => void;
  resetDrive: () => void;
  trainStep: () => void;
  trainBatch: (count: number) => void;
  resetTraining: () => void;
}

export const useRobot = create<RobotLab>()((set) => ({
  manual: [],
  training: freshTraining(),
  drive: (action) =>
    set(({ manual }) => {
      const state = manual.at(-1)?.after ?? startRobot();
      return actionsFor(state).includes(action) ? { manual: [...manual, act(state, action)] } : {};
    }),
  resetDrive: () => set({ manual: [] }),
  trainStep: () => set(({ training }) => ({ training: advance(training) })),
  trainBatch: (count) =>
    set(({ training }) => {
      const target = training.completed + count;
      while (training.completed < target) training = advance(training);
      return { training };
    }),
  resetTraining: () => set({ training: freshTraining() }),
}));
