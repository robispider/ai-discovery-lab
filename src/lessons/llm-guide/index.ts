import type { Bi } from '../../i18n';
import type { CycleStep } from '../../store/useLab';

export { LlmGuideStage } from './Stage';
export { LlmGuideControls } from './Controls';

export const llmGuideSteps: Record<CycleStep, Bi> = {
  understand: {
    en: 'A model is a file of numbers. Change its size and precision and see how much memory and what hardware it needs.',
    bn: 'মডেল হলো সংখ্যার একটি ফাইল। এর আকার ও সূক্ষ্মতা বদলান এবং দেখুন কত মেমোরি ও কোন হার্ডওয়্যার লাগে।',
  },
  explore: {
    en: 'The model only sees what fits on its desk: rules, documents and chat history together. Add pages until it overflows.',
    bn: 'মডেল শুধু তার টেবিলে যা আঁটে তা-ই দেখে: নির্দেশনা, ডকুমেন্ট ও কথোপকথন একসাথে। উপচে না পড়া পর্যন্ত পৃষ্ঠা যোগ করুন।',
  },
  train: {
    en: 'Why AI needs GPUs: race thousands of small cores against a few fast ones, on AI math and on a step-by-step job.',
    bn: 'এআই-এর কেন GPU লাগে: এআই গণনায় ও ধাপে ধাপে কাজে হাজারো ছোট কোরকে কয়েকটি দ্রুত কোরের সাথে প্রতিযোগিতা করান।',
  },
  evaluate: {
    en: 'Trace a request through a cloud service, a self-hosted server and a hybrid. Where does citizen data go?',
    bn: 'একটি অনুরোধকে ক্লাউড সেবা, নিজস্ব সার্ভার ও হাইব্রিডের ভেতর দিয়ে ট্রেস করুন। নাগরিকের তথ্য কোথায় যায়?',
  },
  break: {
    en: 'Three traps: "self-hosted means no mistakes", "any PC can run a 70B model", and the Bangla token tax.',
    bn: 'তিনটি ভুল ধারণা: "নিজস্ব সার্ভার মানে ভুল নেই", "যেকোনো পিসিতে ৭০B মডেল চলে", আর বাংলা টোকেন কর।',
  },
  apply: {
    en: 'Pick open models for real city tasks and plan a stack that fits your office’s hardware.',
    bn: 'আসল নগর-কাজের জন্য ওপেন মডেল বাছুন এবং আপনার অফিসের হার্ডওয়্যারে মানানসই একটি স্ট্যাক পরিকল্পনা করুন।',
  },
};
