import type { Bi } from '../../i18n';
import type { CycleStep } from '../../store/useLab';

export { RegressionStage } from './Stage';
export { RegressionControls } from './Controls';

export const regressionSteps: Record<CycleStep, Bi> = {
  understand: {
    en: 'How many trucks should a new ward get tomorrow? Change its size and read the line’s forecast in tonnes and trucks.',
    bn: 'একটি নতুন ওয়ার্ডে আগামীকাল কয়টি গাড়ি যাবে? এর আকার বদলান এবং রেখার পূর্বাভাস টন ও গাড়িতে পড়ুন।',
  },
  explore: {
    en: 'Read the ward register: residents, shops and the weighed waste of 120 wards.',
    bn: 'ওয়ার্ডের খাতা পড়ুন: ১২০টি ওয়ার্ডের বাসিন্দা, দোকান ও মাপা বর্জ্য।',
  },
  train: {
    en: 'Watch the line learn: each step it tilts to shrink the squared error. Then try to beat it by hand.',
    bn: 'রেখার শেখা দেখুন: প্রতি ধাপে বর্গ-ভুল কমাতে সে কাত হয়। তারপর নিজে হাতে হারানোর চেষ্টা করুন।',
  },
  evaluate: {
    en: 'How much of the pattern does the line explain, and how many wards get the right number of trucks?',
    bn: 'রেখা প্যাটার্নের কতটা ব্যাখ্যা করে, আর কতগুলো ওয়ার্ড সঠিক সংখ্যক গাড়ি পায়?',
  },
  break: {
    en: 'Three traps: a ward far bigger than any on record, shops as the predictor, and five wholesale bazaars.',
    bn: 'তিনটি ফাঁদ: রেকর্ডের চেয়ে অনেক বড় ওয়ার্ড, দোকান দিয়ে অনুমান, আর পাঁচটি পাইকারি বাজার।',
  },
  apply: {
    en: 'Regression predicts quantities. Where would a forecast in numbers help your department?',
    bn: 'রিগ্রেশন পরিমাণ অনুমান করে। সংখ্যার পূর্বাভাস আপনার বিভাগে কোথায় কাজে লাগতে পারে?',
  },
};
