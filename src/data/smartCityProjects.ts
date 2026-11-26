import type { Bi } from '../i18n';
import { lessonLabel, type FamilyId, type LessonNumber, type ThumbId } from '../lessons/types';
import { SMART_CITY_REFERENCES, type ProjectEntry, type ProjectLink } from './smartCityReferences';

const sources = new Map(SMART_CITY_REFERENCES.map((entry) => [entry.id, entry.links[0]]));
const intro: Bi = { en: 'Introductory', bn: 'প্রাথমিক' };
const medium: Bi = { en: 'Intermediate', bn: 'মধ্যম' };
const advanced: Bi = { en: 'Advanced', bn: 'উন্নত' };

function reference(id: string): ProjectLink {
  const link = sources.get(id);
  if (!link) throw new Error(`Unknown smart-city reference: ${id}`);
  return link;
}

export function lesson(n: LessonNumber): ProjectLink {
  const label = lessonLabel(n);
  return { label: { en: `Related lesson ${label}`, bn: `সংশ্লিষ্ট পাঠ ${label}` }, url: `/lesson/${n}` };
}

function project(
  id: string,
  title: Bi,
  summary: Bi,
  tag: Bi,
  icon: ThumbId,
  family: FamilyId,
  firstSource: string,
  more: ProjectLink[] = [],
): ProjectEntry {
  return { id, title, summary, tag, icon, family, links: [reference(firstSource), ...more] };
}

export const SMART_CITY_PROJECTS = [
  project(
    'potholes',
    { en: 'Automatic pothole detection', bn: 'সড়কের গর্ত শনাক্তকরণ' },
    {
      en: 'Detect potholes in road images and build a map of locations for inspection.',
      bn: 'সড়কের ছবি থেকে গর্ত শনাক্ত করে পরিদর্শনের জন্য অবস্থানের মানচিত্র তৈরি করুন।',
    },
    intro,
    'route',
    'dl',
    'roads/rdd2022',
    [reference('roads/rdd-trained-yolo')],
  ),
  project(
    'roadside-waste',
    { en: 'Roadside garbage identification', bn: 'সড়কের পাশের বর্জ্য শনাক্তকরণ' },
    {
      en: 'Find visible litter in street photographs and flag locations for collection.',
      bn: 'রাস্তার ছবিতে দৃশ্যমান বর্জ্য শনাক্ত করে সংগ্রহের স্থান চিহ্নিত করুন।',
    },
    intro,
    'camera',
    'dl',
    'waste/taco',
    [reference('waste/yolox'), lesson(7)],
  ),
  project(
    'vehicle-counting',
    { en: 'Automatic vehicle counting', bn: 'স্বয়ংক্রিয় যানবাহন গণনা' },
    {
      en: 'Detect and track vehicles in a clip to count how many cross a marked line.',
      bn: 'ভিডিওতে যানবাহন শনাক্ত ও অনুসরণ করে কতটি চিহ্নিত রেখা পেরিয়েছে তা গুনুন।',
    },
    intro,
    'signal',
    'dl',
    'traffic/bytetrack',
    [reference('traffic/rt-detr')],
  ),
  project(
    'bangla-complaints',
    { en: 'Bangla citizen complaint classification', bn: 'বাংলা নাগরিক অভিযোগ শ্রেণিবিন্যাস' },
    {
      en: 'Classify Bangla complaints by topic to help staff send them to the right department.',
      bn: 'বাংলা অভিযোগ বিষয়ভিত্তিক শ্রেণিবিন্যাস করে সঠিক দপ্তরে পাঠাতে কর্মীদের সহায়তা করুন।',
    },
    intro,
    'rules',
    'lm',
    'services/banglabert',
    [lesson(11)],
  ),
  project(
    'document-ocr',
    { en: 'Municipal document digitization', bn: 'পৌর নথি ডিজিটাইজেশন' },
    {
      en: 'Extract searchable text from scanned municipal forms, notices, and records.',
      bn: 'স্ক্যান করা পৌর ফরম, বিজ্ঞপ্তি ও নথি থেকে অনুসন্ধানযোগ্য লেখা বের করুন।',
    },
    intro,
    'tokens',
    'lm',
    'services/tesseract',
    [reference('services/paddleocr')],
  ),
  project(
    'collection-routes',
    { en: 'Garbage truck route optimization', bn: 'বর্জ্য সংগ্রহের গাড়ির রুট উন্নয়ন' },
    {
      en: 'Plan collection stops while accounting for truck capacity, time, and road access.',
      bn: 'গাড়ির ধারণক্ষমতা, সময় ও রাস্তার সুযোগ বিবেচনা করে সংগ্রহের পথ নির্ধারণ করুন।',
    },
    medium,
    'route',
    'classical',
    'simulation/or-tools',
    [reference('waste/attention-model'), lesson(1)],
  ),
  project(
    'urban-noise',
    { en: 'Urban noise pollution monitoring', bn: 'শহরের শব্দদূষণ পর্যবেক্ষণ' },
    {
      en: 'Classify short sound samples into categories such as traffic and machinery.',
      bn: 'স্বল্প দৈর্ঘ্যের শব্দের নমুনাকে যানবাহন ও যন্ত্রপাতির মতো শ্রেণিতে ভাগ করুন।',
    },
    medium,
    'wave',
    'iot',
    'environment/yamnet',
    [reference('environment/panns')],
  ),
  project(
    'waterlogging',
    { en: 'Waterlogging risk prediction', bn: 'জলাবদ্ধতার ঝুঁকি পূর্বাভাস' },
    {
      en: 'Use rainfall, drainage, and ward records to estimate where waterlogging is likely.',
      bn: 'বৃষ্টি, নিষ্কাশন ও ওয়ার্ডের রেকর্ড দিয়ে কোথায় জলাবদ্ধতা হতে পারে তা অনুমান করুন।',
    },
    medium,
    'tree',
    'ml',
    'flood/lightgbm',
    [lesson(3), lesson(13)],
  ),
  project(
    'congestion',
    { en: 'Traffic congestion forecasting', bn: 'যানজটের পূর্বাভাস' },
    {
      en: 'Forecast changes in traffic flow across connected roads.',
      bn: 'পরস্পর যুক্ত সড়কে যান চলাচলের পরিবর্তন পূর্বাভাস দিন।',
    },
    medium,
    'signal',
    'nn',
    'traffic/dcrnn',
    [reference('traffic/graph-wavenet'), reference('simulation/libcity')],
  ),
  project(
    'construction-mapping',
    { en: 'Construction change monitoring', bn: 'নির্মাণের পরিবর্তন পর্যবেক্ষণ' },
    {
      en: 'Compare satellite images across dates to flag building changes for review.',
      bn: 'ভিন্ন তারিখের স্যাটেলাইট ছবি তুলনা করে পর্যালোচনার জন্য ভবনের পরিবর্তন চিহ্নিত করুন।',
    },
    advanced,
    'cluster',
    'dl',
    'mapping/changeformer',
    [reference('mapping/segment-anything-2')],
  ),
  project(
    'signal-control',
    { en: 'Intelligent traffic signal control', bn: 'বুদ্ধিমান ট্রাফিক সংকেত নিয়ন্ত্রণ' },
    {
      en: 'Train and compare signal policies at simulated intersections.',
      bn: 'সিমুলেশনের মোড়ে ট্রাফিক সংকেত নিয়ন্ত্রণের কৌশল শেখান ও তুলনা করুন।',
    },
    advanced,
    'signal',
    'rl',
    'traffic/presslight',
    [reference('simulation/sumo'), reference('traffic/colight'), lesson(8)],
  ),
  project(
    'drainage-floods',
    { en: 'Smart drainage and flood prediction', bn: 'স্মার্ট নিষ্কাশন ও বন্যার পূর্বাভাস' },
    {
      en: 'Explore how rainfall, runoff, and drainage affect flooding in a simulation.',
      bn: 'বৃষ্টি, পানির প্রবাহ ও নিষ্কাশন বন্যাকে কীভাবে প্রভাবিত করে, সিমুলেশনে দেখুন।',
    },
    advanced,
    'sensor',
    'iot',
    'simulation/epa-swmm',
    [reference('flood/neuralhydrology'), lesson(13), lesson(14)],
  ),
];

export const SMART_CITY_DEMOS = [
  project(
    'demo-vehicles',
    { en: 'Detect vehicles in a traffic video', bn: 'ট্রাফিক ভিডিওতে যানবাহন শনাক্ত' },
    {
      en: 'Watch a detector draw boxes around vehicles as they enter the frame.',
      bn: 'ফ্রেমে যানবাহন ঢুকলে মডেল কীভাবে চারদিকে বক্স আঁকে তা দেখুন।',
    },
    { en: 'Computer vision', bn: 'কম্পিউটার ভিশন' },
    'camera',
    'dl',
    'traffic/rt-detr',
    [reference('traffic/bytetrack')],
  ),
  project(
    'demo-waste',
    { en: 'Predict next week’s garbage volume', bn: 'আগামী সপ্তাহের বর্জ্যের পরিমাণ অনুমান' },
    {
      en: 'Fit a Random Forest to collection records, then compare forecasts with held-out data.',
      bn: 'সংগ্রহের রেকর্ড দিয়ে Random Forest প্রশিক্ষণ দিয়ে আলাদা রাখা উপাত্তের সঙ্গে পূর্বাভাস তুলনা করুন।',
    },
    { en: 'Classical machine learning', bn: 'ক্লাসিক্যাল মেশিন লার্নিং' },
    'regression',
    'ml',
    'environment/random-forest',
    [lesson(4)],
  ),
  project(
    'demo-water',
    { en: 'Spot an abnormal water sensor reading', bn: 'পানির সেন্সরের অস্বাভাবিক রিডিং শনাক্ত' },
    {
      en: 'Compare regular readings with a simulated spike and see which values stand out.',
      bn: 'স্বাভাবিক রিডিংয়ের সঙ্গে সিমুলেশনের হঠাৎ বৃদ্ধির তুলনা করে অস্বাভাবিক মানগুলো দেখুন।',
    },
    { en: 'Anomaly detection', bn: 'অস্বাভাবিকতা শনাক্তকরণ' },
    'sensor',
    'iot',
    'water/isolation-forest',
    [lesson(13)],
  ),
  project(
    'demo-electricity',
    { en: 'Forecast future electricity consumption', bn: 'ভবিষ্যৎ বিদ্যুৎ ব্যবহারের পূর্বাভাস' },
    {
      en: 'Feed a demand history to Chronos-2 and plot the forecast against actual demand.',
      bn: 'Chronos-2-কে চাহিদার ইতিহাস দিয়ে প্রকৃত চাহিদার পাশে পূর্বাভাস দেখান।',
    },
    { en: 'Neural forecasting', bn: 'নিউরাল পূর্বাভাস' },
    'network',
    'nn',
    'energy/chronos-2',
  ),
  project(
    'demo-junction',
    { en: 'Teach AI to control a traffic junction', bn: 'এআইকে ট্রাফিক মোড় নিয়ন্ত্রণ শেখান' },
    {
      en: 'Train a DQN agent in SUMO and compare it with a fixed signal timer.',
      bn: 'SUMO-তে DQN এজেন্ট প্রশিক্ষণ দিয়ে নির্ধারিত সময়ের ট্রাফিক সংকেতের সঙ্গে তুলনা করুন।',
    },
    { en: 'Reinforcement learning', bn: 'রিইনফোর্সমেন্ট লার্নিং' },
    'signal',
    'rl',
    'simulation/sumo',
    [reference('energy/dqn'), lesson(8)],
  ),
  project(
    'demo-complaints',
    { en: 'Classify Bangla citizen complaints', bn: 'বাংলা নাগরিক অভিযোগ শ্রেণিবিন্যাস করুন' },
    {
      en: 'Use BanglaBERT to group messages by topic and inspect errors on new examples.',
      bn: 'BanglaBERT দিয়ে বার্তা বিষয়ভিত্তিক ভাগ করুন এবং নতুন উদাহরণে ভুলগুলো দেখুন।',
    },
    { en: 'Natural language processing', bn: 'প্রাকৃতিক ভাষা প্রক্রিয়াকরণ' },
    'rules',
    'lm',
    'services/banglabert',
    [lesson(11)],
  ),
];
