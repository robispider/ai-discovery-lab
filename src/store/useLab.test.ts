import { describe, expect, it } from 'vitest';
import { useLab } from './useLab';

describe('lab store', () => {
  it('opens the Break it tab when the cycle reaches Break it, and leaves it afterwards', () => {
    useLab.getState().setStep('break');
    expect(useLab.getState().tab).toBe('break');
    useLab.getState().setStep('apply');
    expect(useLab.getState().tab).toBe('overview');
  });

  it('moves the cycle to Break it when the Break it tab is chosen', () => {
    useLab.getState().setTab('break');
    expect(useLab.getState().step).toBe('break');
    useLab.getState().setTab('notes');
    expect(useLab.getState().step).toBe('understand');
  });

  it('records each visited lesson once, sorted', () => {
    const { visit } = useLab.getState();
    visit(5);
    visit(2);
    visit(5);
    expect(useLab.getState().visited).toEqual([2, 5]);
    expect(useLab.getState().lastLesson).toBe(5);
  });

  it('saves preferences and progress, not the cycle position', () => {
    useLab.getState().setLang('bn');
    useLab.getState().visit(4);
    useLab.getState().setStep('train');
    const saved = JSON.parse(localStorage.getItem('ai-discovery-lab') ?? '{}');
    expect(saved.state).toEqual({ lang: 'bn', theme: 'system', visited: [4], lastLesson: 4 });
  });
});
