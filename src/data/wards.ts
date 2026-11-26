/*
 * 120 synthetic city wards (residents, shops, weighed daily waste) for lesson 4, plus five
 * wholesale bazaars that act as outliers. Seeded: the same wards as the legacy page.
 */
import { gauss, rng } from '../engines/random';

const ZONES_EN = ['Mirpur', 'Uttara', 'Dhanmondi', 'Mohammadpur', 'Badda', 'Khilgaon', 'Rampura', 'Mugda', 'Jatrabari', 'Lalbagh', 'Wari', 'Tejgaon', 'Banani', 'Pallabi', 'Demra', 'Shyampur', 'Kamrangirchar', 'Sutrapur', 'Cantonment', 'Mohakhali']; // prettier-ignore
const ZONES_BN = ['মিরপুর', 'উত্তরা', 'ধানমন্ডি', 'মোহাম্মদপুর', 'বাড্ডা', 'খিলগাঁও', 'রামপুরা', 'মুগদা', 'যাত্রাবাড়ী', 'লালবাগ', 'ওয়ারী', 'তেজগাঁও', 'বনানী', 'পল্লবী', 'ডেমরা', 'শ্যামপুর', 'কামরাঙ্গীরচর', 'সূত্রাপুর', 'ক্যান্টনমেন্ট', 'মহাখালী']; // prettier-ignore

export interface Ward {
  id: number;
  /** Residents, thousands. */
  pop: number;
  /** Shops and businesses. */
  biz: number;
  /** Weighed waste, tonnes per day. */
  waste: number;
  nameEn: string;
  nameBn: string;
  typeEn: string;
  typeBn: string;
  out?: boolean;
}

export const WARDS: Ward[] = (() => {
  const r = rng(7);
  const out: Ward[] = [];
  for (let i = 0; i < 120; i++) {
    const pop = Math.round(15 + r() * 95);
    const biz = Math.round(pop * (6 + r() * 6) + gauss(r) * 40);
    const waste = Math.max(2, 2 + 0.45 * pop + 0.004 * (biz - pop * 9) + gauss(r) * 3.2);
    const zi = i % ZONES_EN.length;
    const dense = biz / Math.max(1, pop) > 10.2;
    out.push({
      id: i + 1,
      pop,
      biz: Math.max(20, biz),
      waste: +waste.toFixed(1),
      nameEn: `Ward #${i + 1} · ${ZONES_EN[zi]}`,
      nameBn: `ওয়ার্ড #${i + 1} · ${ZONES_BN[zi]}`,
      typeEn: dense ? 'Mixed commercial' : 'Residential',
      typeBn: dense ? 'মিশ্র বাণিজ্যিক' : 'আবাসিক',
    });
  }
  return out;
})();

export const BAZAARS: Ward[] = [
  {
    id: 121,
    out: true,
    pop: 18,
    biz: 900,
    waste: 82,
    nameEn: 'Karwan Bazar',
    nameBn: 'কারওয়ান বাজার',
    typeEn: 'Wholesale bazaar',
    typeBn: 'পাইকারি বাজার',
  },
  {
    id: 122,
    out: true,
    pop: 22,
    biz: 1100,
    waste: 88,
    nameEn: 'Jatrabari Arat',
    nameBn: 'যাত্রাবাড়ী আড়ত',
    typeEn: 'Wholesale bazaar',
    typeBn: 'পাইকারি বাজার',
  },
  {
    id: 123,
    out: true,
    pop: 26,
    biz: 950,
    waste: 76,
    nameEn: 'New Market',
    nameBn: 'নিউ মার্কেট',
    typeEn: 'Wholesale bazaar',
    typeBn: 'পাইকারি বাজার',
  },
  {
    id: 124,
    out: true,
    pop: 20,
    biz: 1000,
    waste: 79,
    nameEn: 'Krishi Market',
    nameBn: 'কৃষি মার্কেট',
    typeEn: 'Wholesale bazaar',
    typeBn: 'পাইকারি বাজার',
  },
  {
    id: 125,
    out: true,
    pop: 25,
    biz: 1050,
    waste: 85,
    nameEn: 'Chawkbazar',
    nameBn: 'চকবাজার',
    typeEn: 'Wholesale bazaar',
    typeBn: 'পাইকারি বাজার',
  },
];

export type XKey = 'pop' | 'biz';

export interface Predictor {
  ico: string;
  en: string;
  bn: string;
  shortEn: string;
  shortBn: string;
  unitEn: string;
  unitBn: string;
  /** Slider range; the value is multiplied by `mult` to get the x value. */
  min: number;
  smax: number;
  mult: number;
  start: number;
  word: (v: number) => [string, string];
  presets: { v: number; ico: string; en: string; bn: string }[];
}

export const PREDICTORS: Record<XKey, Predictor> = {
  pop: {
    ico: '👥',
    en: 'Population (thousand)',
    bn: 'জনসংখ্যা (হাজার)',
    shortEn: 'population (k)',
    shortBn: 'জনসংখ্যা (হাজার)',
    unitEn: 'k residents',
    unitBn: 'হাজার বাসিন্দা',
    min: 10,
    smax: 260,
    mult: 1,
    start: 60,
    word: (v) =>
      v < 30
        ? ['quiet residential ward', 'শান্ত আবাসিক ওয়ার্ড']
        : v < 65
          ? ['typical city ward', 'সাধারণ সিটি ওয়ার্ড']
          : v <= 108
            ? ['dense inner-city ward', 'ঘনবসতিপূর্ণ শহরের ওয়ার্ড']
            : ['⚠️ larger than any ward in city records!', '⚠️ শহরের রেকর্ডের যেকোনো ওয়ার্ডের চেয়ে বড়!'],
    presets: [
      { v: 35, ico: '🏘️', en: 'Quiet residential ward (35k)', bn: 'শান্ত আবাসিক ওয়ার্ড (৩৫ হা.)' },
      { v: 85, ico: '🏙️', en: 'Dense city ward (85k)', bn: 'ঘনবসতিপূর্ণ সিটি ওয়ার্ড (৮৫ হা.)' },
      {
        v: 210,
        ico: '🚧',
        en: 'Mega township (210k · outside records!)',
        bn: 'মেগা টাউনশিপ (২১০ হা. · রেকর্ডের বাইরে!)',
      },
    ],
  },
  biz: {
    ico: '🏪',
    en: 'Shops & businesses',
    bn: 'দোকান ও ব্যবসা',
    shortEn: 'shops',
    shortBn: 'দোকানপাট',
    unitEn: 'shops',
    unitBn: 'দোকান',
    min: 10,
    smax: 280,
    mult: 10,
    start: 55,
    word: (v) =>
      v < 350
        ? ['mostly homes, few corner shops', 'মূলত বাসাবাড়ি, অল্প দোকান']
        : v < 800
          ? ['mixed residential & market street', 'মিশ্র আবাসিক ও বাজার সড়ক']
          : v <= 1284
            ? ['busy commercial hub', 'ব্যস্ত বাণিজ্যিক এলাকা']
            : ['⚠️ more shops than any recorded ward!', '⚠️ রেকর্ডের যেকোনো ওয়ার্ডের চেয়ে বেশি দোকান!'],
    presets: [
      { v: 30, ico: '🏘️', en: 'Quiet ward (300 shops)', bn: 'আবাসিক ওয়ার্ড (৩০০ দোকান)' },
      { v: 95, ico: '🏬', en: 'Commercial hub (950 shops)', bn: 'বাণিজ্যিক এলাকা (৯৫০ দোকান)' },
      {
        v: 230,
        ico: '🚧',
        en: 'Mega mall zone (2,300 · outside records!)',
        bn: 'মেগা বাণিজ্যিক জোন (২,৩০০ · বাইরে!)',
      },
    ],
  },
};

/** One compactor truck carries 5 tonnes. */
export const TRUCK_TONNES = 5;
