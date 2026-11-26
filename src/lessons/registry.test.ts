import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getLesson, LESSONS } from './registry';

describe('lesson registry', () => {
  it('puts lesson 8B beside lesson 8 and preserves the other lesson numbers', () => {
    expect(LESSONS.map((l) => l.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, '8b', 9, 10, 11, 12, 13, 14]);
  });

  it('uses unique ids', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
  });

  it('has Bangla for every title, short name, summary, stage caption and reference', () => {
    for (const l of LESSONS) {
      for (const field of [l.title, l.short, l.summary, l.stageCaption]) {
        expect(field.bn, `${l.id}: ${field.en}`).toBeTruthy();
      }
      for (const ref of l.references ?? []) {
        expect(ref.title.bn, `${l.id}: ${ref.title.en}`).toBeTruthy();
        if (ref.description) expect(ref.description.bn, `${l.id}: ${ref.description.en}`).toBeTruthy();
      }
    }
  });

  it('gives each lesson a built-in stage, a legacy page or an online tool', () => {
    for (const l of LESSONS) {
      expect(Boolean(l.Stage || l.legacy) !== Boolean(l.online), l.id).toBe(true);
    }
  });

  it('points only at legacy pages that exist', () => {
    for (const l of LESSONS.filter((x) => x.legacy)) {
      expect(existsSync(resolve(process.cwd(), 'public/legacy', l.legacy!)), l.legacy).toBe(true);
    }
  });

  it('finds lessons by number', () => {
    expect(getLesson(3)?.id).toBe('waterlogging-tree');
    expect(getLesson('8b')?.id).toBe('waste-collection-robot');
    expect(getLesson(13)?.id).toBe('drain-sensors');
    expect(getLesson(14)?.id).toBe('pump-edge-ai');
    expect(getLesson(15)).toBeUndefined();
  });
});
