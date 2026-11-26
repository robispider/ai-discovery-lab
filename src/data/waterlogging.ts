/*
 * 800 synthetic rainy days for lesson 3, from a hidden logistic rule. Seeded, so every session
 * sees the same days as the legacy page. 70% of floods in informal settlements are marked
 * "unreported" for the biased-records demonstration.
 */
import { rng, shuffle } from '../engines/random';

export interface Day {
  id: number;
  /** Rainfall, mm. */
  rain: number;
  /** Drain blockage, %. */
  block: number;
  /** Street height above the river, m. */
  elev: number;
  /** 1 = informal settlement. */
  inf: number;
  truth: number;
  unreported: boolean;
}

export const DAYS: Day[] = (() => {
  const r = rng(2024);
  const out: Day[] = [];
  for (let i = 0; i < 800; i++) {
    const rain = Math.min(200, Math.round(-Math.log(1 - r()) * 55));
    const block = Math.round(r() * 100);
    const elev = Math.round((1 + r() * 11) * 2) / 2;
    const inf = r() < 0.35 ? 1 : 0;
    const z = 0.06 * (rain - 60) + 0.05 * (block - 50) - 0.55 * (elev - 6) + 1.2 * inf - 0.5;
    const truth = r() < 1 / (1 + Math.exp(-z)) ? 1 : 0;
    const unreported = !!(truth && inf && r() < 0.7);
    out.push({ id: i + 1, rain, block, elev, inf, truth, unreported });
  }
  return out;
})();

/** The order days are dealt into the study pile and the exam pile. */
export const ORDER = shuffle(
  DAYS.map((_, i) => i),
  rng(99),
);

export type FeatureKey = 'rain' | 'block' | 'elev' | 'inf';

export interface Clue {
  key: FeatureKey;
  icon: string;
  en: string;
  bn: string;
  /** Turn a split threshold into the readable cut-off. */
  cut: (t: number) => number;
  q: (v: number) => [string, string];
  val: (d: { rain: number; block: number; elev: number; inf: number }) => [string, string];
}

export const CLUES: Clue[] = [
  {
    key: 'rain',
    icon: '🌧️',
    en: 'Rainfall',
    bn: 'বৃষ্টিপাত',
    cut: (t) => Math.floor(t) + 1,
    q: (v) => [`at least ${v} mm?`, `অন্তত ${v} মিমি?`],
    val: (r) => [`${r.rain} mm`, `${r.rain} মিমি`],
  },
  {
    key: 'block',
    icon: '🗑️',
    en: 'Drain blocked',
    bn: 'ড্রেন বন্ধ',
    cut: (t) => Math.floor(t) + 1,
    q: (v) => [`at least ${v}%?`, `অন্তত ${v}%?`],
    val: (r) => [`${r.block}%`, `${r.block}%`],
  },
  {
    key: 'elev',
    icon: '⛰️',
    en: 'Street height',
    bn: 'রাস্তার উচ্চতা',
    cut: (t) => Math.floor(t * 2) / 2 + 0.5,
    q: (v) => [`at least ${v} m?`, `অন্তত ${v} মি?`],
    val: (r) => [`${r.elev} m`, `${r.elev} মি`],
  },
  {
    key: 'inf',
    icon: '🏚️',
    en: 'Area type',
    bn: 'এলাকার ধরন',
    cut: () => 1,
    q: () => ['informal settlement?', 'অনানুষ্ঠানিক বসতি?'],
    val: (r) => (r.inf ? ['informal settlement', 'অনানুষ্ঠানিক বসতি'] : ['planned area', 'পরিকল্পিত এলাকা']),
  },
];

export const CLUE: Record<FeatureKey, Clue> = Object.fromEntries(CLUES.map((c) => [c.key, c])) as Record<
  FeatureKey,
  Clue
>;

/** Words for tonight's clue values. */
export const WORDS: Record<'rain' | 'block' | 'elev', (v: number) => [string, string]> = {
  rain: (v) =>
    v < 10
      ? ['barely a drizzle', 'ঝিরঝিরে বৃষ্টি']
      : v < 35
        ? ['light rain', 'হালকা বৃষ্টি']
        : v < 70
          ? ['moderate rain', 'মাঝারি বৃষ্টি']
          : v < 120
            ? ['heavy monsoon rain', 'ভারী বর্ষণ']
            : ['extreme cloudburst', 'অতি ভারী বর্ষণ'],
  block: (v) =>
    v < 20
      ? ['mostly clear', 'প্রায় পরিষ্কার']
      : v < 50
        ? ['some plastic and silt', 'কিছু প্লাস্টিক আর কাদা']
        : v < 80
          ? ['badly clogged with plastic', 'প্লাস্টিকে অনেকটা আটকে গেছে']
          : ['almost fully choked', 'প্রায় পুরো বন্ধ'],
  elev: (v) =>
    v < 3
      ? ['low-lying, close to the river', 'নিচু, নদীর কাছাকাছি']
      : v < 7
        ? ['medium height', 'মাঝারি উচ্চতা']
        : ['raised ground', 'উঁচু জমি'],
};

export interface Tonight {
  rain: number;
  block: number;
  elev: number;
  inf: number;
}

export const TONIGHT_PRESETS: Tonight[] = [
  { rain: 150, block: 80, elev: 2, inf: 1 },
  { rain: 150, block: 20, elev: 9.5, inf: 0 },
  { rain: 25, block: 35, elev: 5, inf: 0 },
];
