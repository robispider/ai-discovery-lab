import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getLesson, LESSONS } from './registry';

describe('lesson registry', () => {
  it('has 12 lessons numbered 1 to 12 in order', () => {
    expect(LESSONS.map((l) => l.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('uses unique ids', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
  });

  it('has Bangla for every title, short name, summary and stage caption', () => {
    for (const l of LESSONS) {
      for (const field of [l.title, l.short, l.summary, l.stageCaption]) {
        expect(field.bn, `${l.id}: ${field.en}`).toBeTruthy();
      }
    }
  });

  it('gives each lesson either a current page or an online tool', () => {
    for (const l of LESSONS) {
      expect(Boolean(l.legacy) !== Boolean(l.online), l.id).toBe(true);
    }
  });

  it('points only at legacy pages that exist', () => {
    for (const l of LESSONS.filter((x) => x.legacy)) {
      expect(existsSync(resolve(process.cwd(), 'public/legacy', l.legacy!)), l.legacy).toBe(true);
    }
  });

  it('finds lessons by number', () => {
    expect(getLesson(3)?.id).toBe('waterlogging-tree');
    expect(getLesson(13)).toBeUndefined();
  });
});
