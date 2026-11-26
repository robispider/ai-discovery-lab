import type { Bi } from '../../i18n';
import type { CycleStep } from '../../store/useLab';

export { VisionControls } from './Controls';
export { VisionStage } from './Stage';

export const visionSteps: Record<CycleStep, Bi> = {
  understand: {
    en: 'Run the sorting conveyor, click camera/AI pins, and inspect how a 3×3 filter multiplies pixels to spot edges, shine and organic colour.',
    bn: 'বর্জ্য বাছাই বেল্ট চালান, ক্যামেরা ও এআই পিনে ক্লিক করুন এবং ৩×৩ ফিল্টার কীভাবে পিক্সেল গুণ করে ধার, ঝলক ও জৈব রঙ চেনে দেখুন।',
  },
  explore: {
    en: 'Compare training from scratch vs transfer learning. Click waste dots in feature space to see how the frozen backbone already separates classes.',
    bn: 'শুরু থেকে শেখানো বনাম ট্রান্সফার লার্নিং তুলনা করুন। স্থির ব্যাকবোন কীভাবে আগেই বর্জ্যগুলোকে আলাদা করে, তা দেখতে বিন্দুগুলোতে ক্লিক করুন।',
  },
  train: {
    en: 'Collect Organic, Plastic and Paper samples (or snap from your webcam), train the 21-weight head live, and try the imbalanced-data trap.',
    bn: 'জৈব, প্লাস্টিক ও কাগজের ছবি সংগ্রহ করুন (বা ওয়েবক্যামে তুলুন), ২১-গুণের হেড সরাসরি শেখান এবং অসম নমুনার ফাঁদ পরীক্ষা করুন।',
  },
  evaluate: {
    en: 'Check accuracy and bin purity on 6 unseen waste items, inspect the 3×3 confusion matrix, or test live with your webcam.',
    bn: '৬টি অদেখা বর্জ্যে নির্ভুলতা ও বিনের বিশুদ্ধতা দেখুন, ৩×৩ কনফিউশন ম্যাট্রিক্স যাচাই করুন বা সরাসরি ওয়েবক্যামে পরীক্ষা করুন।',
  },
  break: {
    en: 'Feed an unseen aluminum can, turn on evening yellow lighting, or put a banana peel on a blue tray — watch high confidence fail.',
    bn: 'অদেখা ধাতব ক্যান দিন, সন্ধ্যার হলুদ আলো জ্বালান বা নীল ট্রেতে কলার খোসা রাখুন—দেখুন উচ্চ আত্মবিশ্বাসও কীভাবে ভুল করে।',
  },
  apply: {
    en: 'Match the right vision setup to 4 city waste jobs, then launch Google Teachable Machine to train a real webcam model live.',
    bn: 'শহরের ৪টি বর্জ্য বাছাইয়ের কাজে সঠিক ভিশন সেটআপ বাছুন, তারপর সরাসরি ওয়েবক্যাম মডেল বানাতে Google Teachable Machine খুলুন।',
  },
};
