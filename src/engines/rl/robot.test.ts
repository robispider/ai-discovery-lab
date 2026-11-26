import { describe, expect, it } from 'vitest';
import { CAPACITY, directRoute, RobotLearner, runRoute, startRobot, TRAIN_BATTERY } from './robot';

describe('waste-collection robot (lesson 8B)', () => {
  it('runs flat on the direct route at the training battery and succeeds on a full charge', () => {
    expect(runRoute(TRAIN_BATTERY, directRoute).at(-1)?.after).toMatchObject({
      outcome: 'flat',
      carrying: true,
    });
    expect(runRoute(CAPACITY, directRoute).at(-1)?.after.outcome).toBe('delivered');
  });

  it('learns to recharge before collecting waste within one live training batch', () => {
    const learner = new RobotLearner();
    for (let i = 0; i < 600; i++) {
      let state = startRobot();
      while (state.outcome === 'running') state = learner.learn(state, i).after;
    }
    const route = runRoute(TRAIN_BATTERY, (state) => learner.choose(state));
    const recharge = route.findIndex((step) => step.event === 'charge');
    const collect = route.findIndex((step) => step.event === 'collect');
    expect(recharge).toBeGreaterThanOrEqual(0);
    expect(recharge).toBeLessThan(collect);
    expect(route[recharge].reward).toBe(-1);
    expect(route.at(-1)?.after.outcome).toBe('delivered');
  });
});
