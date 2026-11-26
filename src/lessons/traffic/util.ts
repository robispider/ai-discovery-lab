import { RED_CLEARANCE, type Intersection } from '../../engines/rl/traffic';

/** Light state: which road shows green/yellow, or all red. */
export function lightOf(sim: Intersection) {
  const phase = sim.lastTick?.phaseBefore ?? sim.phase;
  const clearance = sim.lastTick?.clearance ?? 0;
  const allRed = clearance > 0 && clearance <= RED_CLEARANCE;
  const yellow = Math.max(0, clearance - RED_CLEARANCE);
  return { phase, allRed, yellow, clearance };
}
