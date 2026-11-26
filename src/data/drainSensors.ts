/*
 * Seeded synthetic monsoon telemetry for Lesson 13 (Smart drain & canal flood sensors).
 * 12 three-hour storm episodes (36 readings at 5-minute intervals): 8 training, 4 unseen test,
 * plus an 8-ward map for demonstrating sensor placement bias.
 */
import {
  TICK_MINUTES,
  type DrainTick,
  type StormEpisode,
  type WardNode,
} from '../engines/iot/drain';
import { gauss, rng } from '../engines/random';

interface StormRecipe {
  id: string;
  split: 'train' | 'test';
  floods: boolean;
  rainPeak: number;
  upstreamPeak: number;
  surgeCenterTick: number;
  splashTick: number;
  name: { en: string; bn: string };
}

const RECIPES: readonly StormRecipe[] = [
  {
    id: 'tr-1',
    split: 'train',
    floods: true,
    rainPeak: 82,
    upstreamPeak: 128,
    surgeCenterTick: 18,
    splashTick: 6,
    name: { en: 'Asharh midnight surge', bn: 'আষাঢ়ের মধ্যরাতের ঢল' },
  },
  {
    id: 'tr-2',
    split: 'train',
    floods: false,
    rainPeak: 36,
    upstreamPeak: 58,
    surgeCenterTick: 16,
    splashTick: 11,
    name: { en: 'Afternoon passing shower', bn: 'বিকেলের ক্ষণস্থায়ী বৃষ্টি' },
  },
  {
    id: 'tr-3',
    split: 'train',
    floods: true,
    rainPeak: 76,
    upstreamPeak: 122,
    surgeCenterTick: 20,
    splashTick: 8,
    name: { en: 'High-tide canal backflow', bn: 'জোয়ারের খাল উপচে পড়া' },
  },
  {
    id: 'tr-4',
    split: 'train',
    floods: false,
    rainPeak: 42,
    upstreamPeak: 63,
    surgeCenterTick: 15,
    splashTick: 13,
    name: { en: 'Morning drizzle & splash', bn: 'সকালের গুঁড়ি বৃষ্টি ও ছিটা' },
  },
  {
    id: 'tr-5',
    split: 'train',
    floods: true,
    rainPeak: 88,
    upstreamPeak: 134,
    surgeCenterTick: 17,
    splashTick: 5,
    name: { en: 'Srabon cloudburst', bn: 'শ্রাবণের ভারী বর্ষণ' },
  },
  {
    id: 'tr-6',
    split: 'train',
    floods: false,
    rainPeak: 30,
    upstreamPeak: 52,
    surgeCenterTick: 19,
    splashTick: 9,
    name: { en: 'Brief evening squall', bn: 'সন্ধ্যার দমকা বৃষ্টি' },
  },
  {
    id: 'tr-7',
    split: 'train',
    floods: true,
    rainPeak: 72,
    upstreamPeak: 118,
    surgeCenterTick: 21,
    splashTick: 10,
    name: { en: 'Two-wave monsoon rain', bn: 'দুই দফা বর্ষার বৃষ্টি' },
  },
  {
    id: 'tr-8',
    split: 'train',
    floods: false,
    rainPeak: 38,
    upstreamPeak: 60,
    surgeCenterTick: 18,
    splashTick: 15,
    name: { en: 'Light rain, clear canal', bn: 'হালকা বৃষ্টি, পরিষ্কার খাল' },
  },
  // Unseen test storms (2 floods, 2 safe showers with debris spikes)
  {
    id: 'te-1',
    split: 'test',
    floods: true,
    rainPeak: 84,
    upstreamPeak: 130,
    surgeCenterTick: 19,
    splashTick: 7,
    name: { en: 'Test 1: Kalbaishakhi downpour', bn: 'পরীক্ষা ১: কালবৈশাখী ভারী বৃষ্টি' },
  },
  {
    id: 'te-2',
    split: 'test',
    floods: false,
    rainPeak: 39,
    upstreamPeak: 61,
    surgeCenterTick: 17,
    splashTick: 12,
    name: { en: 'Test 2: Short shower + debris spike', bn: 'পরীক্ষা ২: ছোট বৃষ্টি + আবর্জনার স্পাইক' },
  },
  {
    id: 'te-3',
    split: 'test',
    floods: true,
    rainPeak: 78,
    upstreamPeak: 124,
    surgeCenterTick: 20,
    splashTick: 6,
    name: { en: 'Test 3: Upstream sluice surge', bn: 'পরীক্ষা ৩: উজানের স্লুইস ঢল' },
  },
  {
    id: 'te-4',
    split: 'test',
    floods: false,
    rainPeak: 33,
    upstreamPeak: 55,
    surgeCenterTick: 16,
    splashTick: 10,
    name: { en: 'Test 4: Evening shower + splash', bn: 'পরীক্ষা ৪: সন্ধ্যার বৃষ্টি + পানির ছিটা' },
  },
];

function bell(t: number, center: number, width: number): number {
  const z = (t - center) / width;
  return Math.exp(-0.5 * z * z);
}

function buildEpisodes(seed = 1301): StormEpisode[] {
  const r = rng(seed);
  return RECIPES.map((rec) => {
    const ticks: DrainTick[] = [];
    const T = 36;
    for (let i = 0; i < T; i++) {
      // Rain & upstream surge peak ~6 ticks (30 min) BEFORE local ward drain crests!
      const rainEnv = bell(i, rec.surgeCenterTick - 6, rec.floods ? 5.5 : 3.8);
      const upEnv = bell(i, rec.surgeCenterTick - 5, rec.floods ? 6.2 : 4.4);
      const drainEnv = bell(i, rec.surgeCenterTick, rec.floods ? 6.5 : 4.8);

      const rainMmHr = Math.max(0, Math.round(rec.rainPeak * rainEnv + gauss(r) * 2.2));
      const upstreamCm = Math.max(
        28,
        Math.round(32 + (rec.upstreamPeak - 32) * upEnv + gauss(r) * 2.0),
      );

      const peakDrain = rec.floods ? 68 + (rec.rainPeak - 50) * 1.15 : 34 + rec.rainPeak * 0.85;
      const trueLevelCm = Math.max(
        18,
        Math.round(22 + (peakDrain - 22) * drainEnv + gauss(r) * 1.1),
      );

      // Ultrasonic jitter (±2.2 cm) + 1 single-tick floating debris / splash echo
      let raw = Math.round(trueLevelCm + gauss(r) * 2.2);
      if (i === rec.splashTick) {
        raw = Math.max(raw, rec.floods ? 94 : 96);
      }
      raw = Math.max(14, Math.min(138, raw));

      ticks.push({
        minute: i * TICK_MINUTES,
        trueLevelCm,
        rawLevelCm: raw,
        upstreamCm,
        rainMmHr,
      });
    }
    return {
      id: rec.id,
      split: rec.split,
      floods: rec.floods,
      name: rec.name,
      ticks,
    };
  });
}

export const STORM_EPISODES: StormEpisode[] = buildEpisodes(1301);
export const TRAIN_STORMS: StormEpisode[] = STORM_EPISODES.filter((e) => e.split === 'train');
export const TEST_STORMS: StormEpisode[] = STORM_EPISODES.filter((e) => e.split === 'test');

export const DRAIN_WARDS: readonly WardNode[] = [
  {
    id: 'w1',
    name: { en: 'Ward 4 · Civic Boulevard', bn: 'ওয়ার্ড ৪ · সিভিক বুলেভার্ড' },
    zone: 'vip-main',
    elevationM: 7.4,
    floodedInStorm: false,
  },
  {
    id: 'w2',
    name: { en: 'Ward 7 · Officer Colony', bn: 'ওয়ার্ড ৭ · অফিসার্স কলোনি' },
    zone: 'vip-main',
    elevationM: 7.8,
    floodedInStorm: false,
  },
  {
    id: 'w3',
    name: { en: 'Ward 9 · Central Avenue', bn: 'ওয়ার্ড ৯ · সেন্ট্রাল অ্যাভিনিউ' },
    zone: 'vip-main',
    elevationM: 6.5,
    floodedInStorm: true,
  },
  {
    id: 'w4',
    name: { en: 'Ward 11 · North Ring Road', bn: 'ওয়ার্ড ১১ · নর্থ রিং রোড' },
    zone: 'vip-main',
    elevationM: 7.1,
    floodedInStorm: false,
  },
  {
    id: 'w5',
    name: { en: 'Ward 14 · Khalpar Settlement', bn: 'ওয়ার্ড ১৪ · খালপাড় বসতি' },
    zone: 'low-lying',
    elevationM: 3.6,
    floodedInStorm: true,
  },
  {
    id: 'w6',
    name: { en: 'Ward 18 · Tanneries Basin', bn: 'ওয়ার্ড ১৮ · ট্যানারি নিচু এলাকা' },
    zone: 'low-lying',
    elevationM: 3.9,
    floodedInStorm: true,
  },
  {
    id: 'w7',
    name: { en: 'Ward 22 · East Canal Colony', bn: 'ওয়ার্ড ২২ · পূর্ব খাল কলোনি' },
    zone: 'low-lying',
    elevationM: 4.1,
    floodedInStorm: true,
  },
  {
    id: 'w8',
    name: { en: 'Ward 25 · Bamboo Bridge Lane', bn: 'ওয়ার্ড ২৫ · বাঁশের পুল গলি' },
    zone: 'low-lying',
    elevationM: 4.8,
    floodedInStorm: false,
  },
];

export const VIP_ONLY_PLACEMENT = ['w1', 'w2', 'w3', 'w4'] as const;
export const EQUITABLE_PLACEMENT = ['w3', 'w5', 'w6', 'w7'] as const;
