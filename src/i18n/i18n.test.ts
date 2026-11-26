import { describe, expect, it } from 'vitest';
import en from './en.json';
import bn from './bn.json';
import { digits, pickBi, translate } from './index';

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();

describe('UI strings', () => {
  it('Bangla has exactly the English keys', () => {
    expect(Object.keys(bn).sort()).toEqual(Object.keys(en).sort());
  });

  it('Bangla keeps every {placeholder} of the English string', () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(bn[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it('fills placeholders and writes Bangla digits in Bangla', () => {
    expect(translate('en', 'lesson.position', { n: 3, total: 12 })).toBe('Lesson 3 of 12');
    expect(translate('bn', 'lesson.position', { n: 3, total: 12 })).toBe('পাঠ ৩ / ১২');
    expect(digits('2026', 'bn')).toBe('২০২৬');
  });

  it('falls back to English when a Bangla text is missing', () => {
    expect(pickBi({ en: 'Hello' }, 'bn')).toEqual({ text: 'Hello', missing: true });
    expect(pickBi({ en: 'Hello', bn: 'নমস্কার' }, 'bn')).toEqual({ text: 'নমস্কার', missing: false });
  });
});
