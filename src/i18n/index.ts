import { useCallback } from 'react';
import en from './en.json';
import bn from './bn.json';
import { useLab, type Lang } from '../store/useLab';

export type MessageKey = keyof typeof en;

/** Text in both languages. `bn` may be missing while a translation is pending. */
export interface Bi {
  en: string;
  bn?: string;
}

const dictionaries: Record<Lang, Partial<Record<MessageKey, string>>> = { en, bn };

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

/** Writes the digits of a number or string in the chosen language. */
export function digits(value: number | string, lang: Lang): string {
  const s = String(value);
  return lang === 'bn' ? s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]) : s;
}

/** Looks up a UI string; falls back to English, then to the key itself. */
export function translate(lang: Lang, key: MessageKey, vars?: Record<string, string | number>): string {
  const template = dictionaries[lang][key] ?? en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? digits(vars[name], lang) : `{${name}}`,
  );
}

/** Picks the text for the current language. `missing` is true when Bangla fell back to English. */
export function pickBi(text: Bi, lang: Lang): { text: string; missing: boolean } {
  if (lang === 'bn') {
    return text.bn ? { text: text.bn, missing: false } : { text: text.en, missing: true };
  }
  return { text: text.en, missing: false };
}

export function useT() {
  const lang = useLab((s) => s.lang);
  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );
  const pick = useCallback((text: Bi) => pickBi(text, lang).text, [lang]);
  const num = useCallback((value: number | string) => digits(value, lang), [lang]);
  /** Inline text in both languages, for experiment copy that lives with its lesson. */
  const bi = useCallback((en: string, bn: string) => (lang === 'bn' ? bn : en), [lang]);
  return { t, pick, num, bi, lang };
}
