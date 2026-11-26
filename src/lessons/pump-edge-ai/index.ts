import type { Bi } from '../../i18n';
import type { CycleStep } from '../../store/useLab';

export { PumpEdgeStage } from './Stage';
export { PumpEdgeControls } from './Controls';

export const pumpEdgeSteps: Record<CycleStep, Bi> = {
  understand: {
    en: 'Run the 200 Hz pump rig (or live microphone), click ESP32/breadboard pins, and switch between 4 AI brains (Rule, Z-Score, Centroids, TinyNN).',
    bn: '২০০ Hz পাম্প মঞ্চ (বা সরাসরি মাইক) চালান, ESP32/ব্রেডবোর্ডের পিনে চাপুন এবং ৪টি এআই (নিয়ম, জেড-স্কোর, কেন্দ্র, নিউরাল নেট) বদলে দেখুন।',
  },
  explore: {
    en: 'Click any of the 160 sensor recordings on the FFT frequency map to inspect its live waveform and band energy.',
    bn: 'তরঙ্গ ও ফ্রিকোয়েন্সি শক্তি দেখতে FFT মানচিত্রের ১৬০টি সেন্সর রেকর্ডিংয়ের যেকোনো বিন্দুতে ক্লিক করুন।',
  },
  train: {
    en: 'Compare 40-byte Z-Score, 80-byte Centroids and the live 256-byte 5→6→4 Neural Network — then flash to the ESP32.',
    bn: '৪০-বাইট জেড-স্কোর, ৮০-বাইট কেন্দ্র এবং ২৫৬-বাইটের ৫→৬→৪ নিউরাল নেটওয়ার্ক দেখে ESP32 চিপে ফ্ল্যাশ করুন।',
  },
  evaluate: {
    en: 'Switch AI brains to compare bearing-fault score rings, then run the animated 30-day battery race between Cloud 4G and Edge AI.',
    bn: 'বিয়ারিং ত্রুটি ধরার রিং তুলনা করুন এবং ক্লাউড ৪জি বনাম এজ এআই-এর ৩০ দিনের ব্যাটারি দৌড় চালান।',
  },
  break: {
    en: 'Send a cargo truck past the pump house and raise tin-shed heat to 48 °C — then flip on debouncing and spectral normalization.',
    bn: 'পাম্পঘরের বাইরে ট্রাক চালান এবং তাপমাত্রা ৪৮°সে-তে তুলুন—তারপর পরপর যাচাই ও অনুপাত নরমালাইজেশন চালু করুন।',
  },
  apply: {
    en: 'Choose the right sensing brain (Hardware switch, Edge Z-Score, Edge TinyML, Cloud ML, or Hybrid) for four city projects.',
    bn: 'চারটি পৌর প্রকল্পের জন্য সঠিক সেন্সিং কাঠামো (সুইচ, এজ জেড-স্কোর, এজ টাইনি-এমএল, ক্লাউড বা হাইব্রিড) বেছে নিন।',
  },
};
