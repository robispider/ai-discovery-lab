/*
 * 200 synthetic neighbourhoods drawn from 4 hidden types (lesson 5). Seeded, so every session
 * gets the same data as the legacy page.
 */
import { gauss, rng } from '../engines/random';

export type FeatureKey = 'density' | 'waste' | 'transit' | 'drain';

export interface Feature {
  k: FeatureKey;
  en: string;
  bn: string;
  /** Decimals to show. */
  d: number;
}

export const FEATURES: Feature[] = [
  { k: 'density', en: 'Density (thousand/km²)', bn: 'জনঘনত্ব (হাজার/বর্গকিমি)', d: 0 },
  { k: 'waste', en: 'Waste per person (kg/day)', bn: 'মাথাপিছু বর্জ্য (কেজি/দিন)', d: 2 },
  { k: 'transit', en: 'Transport access (0–10)', bn: 'গণপরিবহন সুবিধা (০–১০)', d: 1 },
  { k: 'drain', en: 'Drainage coverage (%)', bn: 'ড্রেনেজ কভারেজ (%)', d: 0 },
];

export const HIDDEN_TYPES = [
  { en: 'Dense old city', bn: 'ঘনবসতিপূর্ণ পুরান শহর', n: 55, m: [80, 0.55, 8, 32], s: [22, 0.05, 0.8, 6] },
  { en: 'Planned residential', bn: 'পরিকল্পিত আবাসিক', n: 50, m: [22, 0.8, 6, 88], s: [5, 0.06, 0.8, 5] },
  { en: 'Informal settlement', bn: 'অনানুষ্ঠানিক বসতি', n: 45, m: [85, 0.35, 3, 22], s: [24, 0.04, 0.8, 6] },
  { en: 'Peri-urban fringe', bn: 'শহরতলি', n: 50, m: [8, 0.38, 2, 30], s: [3, 0.05, 0.7, 8] },
];

export type Neighbourhood = Record<FeatureKey, number> & { type: number };

export const NEIGHBOURHOODS: Neighbourhood[] = (() => {
  const r = rng(31);
  const out: Neighbourhood[] = [];
  HIDDEN_TYPES.forEach((t, ti) => {
    for (let i = 0; i < t.n; i++) {
      const o = { type: ti } as Neighbourhood;
      FEATURES.forEach((f, j) => {
        o[f.k] = Math.max(0, t.m[j] + gauss(r) * t.s[j]);
      });
      o.transit = Math.min(10, o.transit);
      o.drain = Math.min(100, o.drain);
      out.push(o);
    }
  });
  return out;
})();

export const asVectors = (rows: Neighbourhood[]) => rows.map((d) => FEATURES.map((f) => d[f.k]));
