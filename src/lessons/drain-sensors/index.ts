import type { Bi } from '../../i18n';
import type { CycleStep } from '../../store/useLab';

export { DrainSensorStage } from './Stage';
export { DrainSensorControls } from './Controls';

export const drainSensorSteps: Record<CycleStep, Bi> = {
  understand: {
    en: 'Play a live monsoon storm on the culvert & ESP32 rig, click hardware pins, and switch between 4 AI brains (Rule, Tree, +30m Trend, Cloud).',
    bn: 'কালভার্ট ও ESP32 মঞ্চে সরাসরি ঝড় চালান, যন্ত্রাংশের পিনে ক্লিক করুন এবং ৪টি এআই (নিয়ম, ট্রি, +৩০মি ট্রেন্ড, ক্লাউড) বদলে দেখুন।',
  },
  explore: {
    en: 'Filter floating-plastic echo spikes on the stream cleaner and pick stamped storm cards to test on the street.',
    bn: 'ভাসমান প্লাস্টিকের স্পাইক ফিল্টার করুন এবং সিল মারা ঝড়ের কার্ড বেছে রাস্তায় পরীক্ষা করুন।',
  },
  train: {
    en: 'Inspect and flash either the Decision Tree or the +30-minute Sensor-Fusion model onto the ESP32 over USB-C.',
    bn: 'ডিসিশন ট্রি অথবা +৩০ মিনিটের সেন্সর-ফিউশন মডেল যাচাই করুন এবং USB-C দিয়ে ESP32 চিপে ফ্ল্যাশ করুন।',
  },
  evaluate: {
    en: 'Switch among the 4 AI brains to watch the animated score rings and street outcome tiles update across unseen storms.',
    bn: 'অদেখা ঝড়ে স্কোর রিং ও রাস্তার ফলাফল কীভাবে বদলায় তা দেখতে ৪টি এআই বাটনে চাপুন।',
  },
  break: {
    en: 'Smear mud on the sensor, cut 4G, and click the 8 wards to move your 4 ESP32 nodes — see which flooded homes go unwarned.',
    bn: 'সেন্সরে কাদা লাগান, ৪জি বন্ধ করুন এবং ৮টি ওয়ার্ডে ক্লিক করে ৪টি ESP32 সেন্সর সরিয়ে দেখুন কোন ডুবন্ত ঘরগুলো অদৃশ্য থাকে।',
  },
  apply: {
    en: 'Wire different controllers (Float switch, Rule, Edge Tree, +30m Trend, Cloud) to four real municipal drainage rigs.',
    bn: 'চারটি বাস্তব পৌর ড্রেনেজ প্রকল্পে বিভিন্ন ব্রেইন (ফ্লোট সুইচ, নিয়ম, এজ ট্রি, ট্রেন্ড, ক্লাউড) যুক্ত করে উপযোগিতা দেখুন।',
  },
};
