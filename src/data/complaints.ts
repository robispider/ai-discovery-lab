/*
 * Synthetic citizen complaints (Bangla + some English) for lessons 2 and 11.
 * NOT real complaints. Bangla wording should be reviewed by the facilitator.
 * Generated from public/legacy/assets/complaints-data.js; the seeded builder gives the same data.
 */
import type { Rule } from '../engines/rules';
import { rng, shuffle } from '../engines/random';

export type DeptId = 'waste' | 'drain' | 'road' | 'light' | 'mosquito' | 'licence';

export interface Complaint {
  text: string;
  dept: DeptId;
  /** Deliberately hard for keyword rules. */
  tricky?: boolean;
}

export const DEPTS: Record<DeptId, { en: string; bn: string; icon: string }> = {
  waste: { en: 'Waste management', bn: 'বর্জ্য ব্যবস্থাপনা', icon: '🗑️' },
  drain: { en: 'Drainage', bn: 'পানি নিষ্কাশন', icon: '🌊' },
  road: { en: 'Roads', bn: 'সড়ক', icon: '🛣️' },
  light: { en: 'Street lights', bn: 'সড়কবাতি', icon: '💡' },
  mosquito: { en: 'Mosquito control', bn: 'মশক নিয়ন্ত্রণ', icon: '🦟' },
  licence: { en: 'Trade licence', bn: 'ট্রেড লাইসেন্স', icon: '📄' },
};

export const DEPT_KEYS = Object.keys(DEPTS) as DeptId[];

/** Default expert-system rules: IF the complaint contains any keyword THEN department. Order = priority. */
export const DEFAULT_RULES: Rule<DeptId>[] = [
  { dept: 'waste', words: ['garbage', 'waste', 'trash', 'dustbin', 'ময়লা', 'আবর্জনা', 'বর্জ্য', 'ডাস্টবিন'] },
  { dept: 'drain', words: ['drain', 'waterlogging', 'sewer', 'ড্রেন', 'নালা', 'জলাবদ্ধতা', 'পানি জমে'] },
  { dept: 'road', words: ['road', 'pothole', 'footpath', 'রাস্তা', 'গর্ত', 'ফুটপাত'] },
  { dept: 'light', words: ['street light', 'streetlight', 'lamp', 'বাতি', 'লাইট', 'অন্ধকার'] },
  { dept: 'mosquito', words: ['mosquito', 'dengue', 'larva', 'মশা', 'ডেঙ্গু', 'লার্ভা'] },
  { dept: 'licence', words: ['licence', 'license', 'লাইসেন্স', 'ট্রেড'] },
];

export const SAMPLES: Complaint[] = [
  { text: 'Garbage has not been collected from our lane for 5 days.', dept: 'waste' },
  { text: 'আমাদের এলাকার ড্রেন বন্ধ হয়ে পানি জমে আছে।', dept: 'drain' },
  { text: 'স্কুলের সামনের রাস্তায় বড় গর্ত হয়েছে।', dept: 'road' },
  { text: 'মশার উপদ্রব খুব বেড়েছে, ডেঙ্গুর ভয় পাচ্ছি।', dept: 'mosquito' },
  { text: 'How do I renew my trade licence?', dept: 'licence' },
  { text: 'রাস্তার বাতি তিন দিন ধরে জ্বলছে না।', dept: 'light', tricky: true },
  { text: 'রাস্তার পাশে ময়লার স্তূপ জমে আছে।', dept: 'waste', tricky: true },
  { text: 'বাজারের পাশে দুর্গন্ধে টেকা যায় না।', dept: 'waste', tricky: true },
  { text: 'amader elakay moyla porishkar hoy na', dept: 'waste', tricky: true },
  { text: 'জমে থাকা পানিতে লার্ভা দেখা যাচ্ছে।', dept: 'mosquito', tricky: true },
];

const PLACES = [
  'মিরপুর ১০',
  'মোহাম্মদপুর',
  'যাত্রাবাড়ী',
  'উত্তরা ৭ নম্বর সেক্টর',
  'ধানমন্ডি',
  'বাড্ডা',
  'কামরাঙ্গীরচর',
  'রামপুরা',
  'খিলগাঁও',
  'লালবাগ',
];
const PLACES_EN = [
  'Mirpur 10',
  'Mohammadpur',
  'Jatrabari',
  'Uttara Sector 7',
  'Dhanmondi',
  'Badda',
  'Rampura',
  'Khilgaon',
];
const DAYS = ['দুই', 'তিন', 'পাঁচ', 'সাত', 'দশ'];
const DAYS_EN = ['2', '3', '5', '7', '10'];

/* {p}=place, {d}=days. Some templates deliberately avoid the rule keywords, or contain keywords of another department. */
const TEMPLATES: Record<DeptId, string[]> = {
  waste: [
    '{p} এলাকায় {d} দিন ধরে ময়লা নেওয়া হচ্ছে না',
    '{p} মোড়ের ডাস্টবিন উপচে পড়ছে',
    'বাসার সামনে আবর্জনার স্তূপ, দুর্গন্ধে থাকা যাচ্ছে না',
    'ময়লার গাড়ি {d} দিন ধরে আসে না',
    '{p} বাজারের পাশে দুর্গন্ধে টেকা যায় না, কেউ পরিষ্কার করে না',
    'রাস্তার পাশে ময়লা ফেলে রাখা হয়েছে, {p}',
    'বাড়ি বাড়ি গিয়ে বর্জ্য সংগ্রহ বন্ধ হয়ে গেছে',
    'পলিথিন আর খাবারের উচ্ছিষ্ট জমে আছে, {p}',
    'Garbage not collected in {pe} for {de} days',
    'The dustbin near {pe} market is overflowing',
  ],
  drain: [
    '{p} এলাকায় ড্রেন বন্ধ হয়ে গেছে',
    'সামান্য বৃষ্টিতেই {p} এলাকায় পানি জমে যায়',
    'নালার নোংরা পানি রাস্তায় উঠে আসছে',
    '{p} এলাকায় জলাবদ্ধতায় চলাচল করা যাচ্ছে না',
    'বৃষ্টির পর {d} দিন ধরে পানি নামছে না',
    'স্যুয়ারেজ লাইন উপচে বাসায় পানি ঢুকছে',
    'ড্রেনের ঢাকনা নেই, {p}',
    'নালা পরিষ্কার না করায় পানি আটকে আছে',
    'Drain blocked near {pe}, water everywhere after rain',
    'Severe waterlogging in {pe} after every rain',
  ],
  road: [
    '{p} এলাকার রাস্তায় বড় গর্ত হয়েছে',
    'রাস্তা ভাঙা, রিকশা চলতে পারে না',
    '{p} এলাকার ফুটপাত দখল হয়ে গেছে',
    'রাস্তা খুঁড়ে {d} সপ্তাহ ধরে ফেলে রাখা হয়েছে',
    'কার্পেটিং উঠে গেছে, গাড়ি উল্টে যাওয়ার অবস্থা',
    'গলির ইট উঠে গেছে, মেরামত দরকার, {p}',
    'স্কুলের সামনে স্পিড ব্রেকার দরকার',
    '{p} মোড়ে সড়কের মাঝখানে বড় খাদ',
    'Big pothole on the main road at {pe}',
    'Broken footpath near {pe} bus stop',
  ],
  light: [
    '{p} এলাকায় {d} দিন ধরে সড়কবাতি জ্বলছে না',
    'রাতে গলি পুরো অন্ধকার থাকে',
    'সন্ধ্যার পর গলিতে কিছু দেখা যায় না, ভয় লাগে',
    'ল্যাম্পপোস্টের বাতি নষ্ট, {p}',
    'রাস্তার লাইট দিনের বেলাতেও জ্বলে থাকে',
    'খুঁটির বাল্ব কেটে গেছে, {p}',
    '{p} মোড়ের বাতি বারবার নিভে যায়',
    'পার্কের আলো নষ্ট, রাতে নিরাপত্তাহীনতা',
    'Street light not working at {pe} for {de} days',
    'The lamp post near {pe} school is broken',
  ],
  mosquito: [
    '{p} এলাকায় মশার উপদ্রব খুব বেড়েছে',
    'জমে থাকা পানিতে লার্ভা দেখা যাচ্ছে',
    'ডেঙ্গুর ভয়ে আছি, ওষুধ ছিটানো হয় না',
    'কয়েল জ্বালিয়েও রাতে ঘুমানো যায় না',
    '{d} সপ্তাহ ধরে ফগার মেশিন আসেনি, {p}',
    'আমাদের বাড়ির দুজন ডেঙ্গুতে আক্রান্ত',
    'নির্মাণাধীন ভবনে পানি জমে মশা জন্মাচ্ছে',
    'সন্ধ্যা হলেই মশার কামড়ে বসা যায় না, {p}',
    'Too many mosquitoes in {pe}, please spray',
    'Dengue cases rising in {pe}, no fogging',
  ],
  licence: [
    'ট্রেড লাইসেন্স নবায়ন কীভাবে করব?',
    'নতুন দোকানের লাইসেন্সের জন্য আবেদন করেছি, এখনো পাইনি',
    'অনলাইনে লাইসেন্স ফি জমা দিতে পারছি না',
    'ব্যবসার অনুমতিপত্র পেতে কী কী কাগজ লাগবে?',
    '{p} এলাকায় দোকান খুলতে নিবন্ধন করতে চাই',
    'লাইসেন্সের নাম সংশোধন করতে চাই',
    'ট্রেড লাইসেন্সের নবায়ন ফি কত?',
    'আবেদনের {d} মাস পরও ব্যবসার সনদ পাইনি',
    'How do I renew my trade licence for my shop in {pe}?',
    'Applied for a new trade license {de} weeks ago, no reply',
  ],
};

/** Build a seeded dataset of n complaints, one department after another, then shuffled. */
export function buildComplaints(n: number, seed: number): Complaint[] {
  const r = rng(seed);
  const pick = <T>(a: T[]): T => a[Math.floor(r() * a.length)];
  const out: Complaint[] = [];
  for (let i = 0; i < n; i++) {
    const dept = DEPT_KEYS[i % DEPT_KEYS.length];
    const text = pick(TEMPLATES[dept])
      .replace('{p}', pick(PLACES))
      .replace('{d}', pick(DAYS))
      .replace('{pe}', pick(PLACES_EN))
      .replace('{de}', pick(DAYS_EN));
    out.push({ text, dept });
  }
  return shuffle(out, r);
}

/** Hand-written, harder test complaints: mixed topics, no keywords, Banglish. */
export const HARD: Complaint[] = [
  { text: 'রাস্তার বাতি তিন দিন ধরে জ্বলছে না', dept: 'light' },
  { text: 'রাস্তার পাশে ময়লার স্তূপ জমে আছে', dept: 'waste' },
  { text: 'জমে থাকা পানিতে মশা জন্মাচ্ছে', dept: 'mosquito' },
  { text: 'বৃষ্টি হলেই হাঁটু পানি, চলাচল বন্ধ', dept: 'drain' },
  { text: 'দোকানের অনুমতিপত্র কবে পাব?', dept: 'licence' },
  { text: 'amader elakay moyla porishkar hoy na', dept: 'waste' },
  { text: 'rastay onek boro gorto', dept: 'road' },
  { text: 'রাতে ঘুমানো যায় না, কামড়ে অস্থির', dept: 'mosquito' },
  { text: 'খুঁটির বাল্ব নষ্ট, রাতে চলাফেরা কঠিন', dept: 'light' },
  { text: 'গলির মুখে স্তূপ হয়ে আছে, গন্ধে টেকা দায়', dept: 'waste' },
];
