import type { Bi } from '../../i18n';
import type { CycleStep } from '../../store/useLab';

export { TrafficStage } from './Stage';
export { TrafficPanelControls } from './Controls';

export const trafficSteps: Record<CycleStep, Bi> = {
  understand: {
    en: 'Two intersections, the same traffic. One runs on a timer; the other will learn when to switch from the queues it leaves.',
    bn: 'দুটি মোড়, একই যানবাহন। একটি টাইমারে চলে; অন্যটি যে সারি রেখে যায় তা দেখে শিখবে কখন বদলাতে হবে।',
  },
  explore: {
    en: 'Watch both run. Change the traffic pattern or add a burst of cars and see the queues grow.',
    bn: 'দুটোই চলতে দেখুন। যানবাহনের ধরন বদলান বা একঝাঁক গাড়ি যোগ করুন এবং সারি বাড়তে দেখুন।',
  },
  train: {
    en: 'Train by trial and error: every car left waiting costs the agent a point. Watch the test wait fall below the timer.',
    bn: 'চেষ্টা ও ভুলের মাধ্যমে শেখান: অপেক্ষমাণ প্রতিটি গাড়ির জন্য এজেন্টের একটি পয়েন্ট কমে। পরীক্ষায় অপেক্ষা টাইমারের নিচে নামতে দেখুন।',
  },
  evaluate: {
    en: 'Watch the trained agent next to the timer and read each decision: observe, act, reward.',
    bn: 'শেখানো এজেন্টকে টাইমারের পাশে চলতে দেখুন এবং প্রতিটি সিদ্ধান্ত পড়ুন: পর্যবেক্ষণ, পদক্ষেপ, পুরস্কার।',
  },
  break: {
    en: 'Reward only the main road and retrain. The agent starves the side road: it does what the reward says.',
    bn: 'শুধু প্রধান রাস্তাকে পুরস্কার দিয়ে আবার শেখান। এজেন্ট পাশের রাস্তাকে বঞ্চিত করে: পুরস্কার যা বলে, সে তা-ই করে।',
  },
  apply: {
    en: 'Read the learned policy. Learning systems in the real world need a simulator, a careful reward and fixed safety rules.',
    bn: 'শেখা কৌশলটি পড়ুন। বাস্তবে শেখার সিস্টেমের জন্য সিমুলেটর, সতর্ক পুরস্কার ও স্থির নিরাপত্তা নিয়ম লাগে।',
  },
};
