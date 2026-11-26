import type { Bi } from '../../i18n';
import type { CycleStep } from '../../store/useLab';

export { RightAiStage } from './Stage';
export { RightAiControls } from './Controls';

export const rightAiSteps: Record<CycleStep, Bi> = {
  understand: {
    en: 'One task, three approaches, the same test complaints. Decide what “best” means before you look at scores.',
    bn: 'একটি কাজ, তিনটি পদ্ধতি, একই টেস্ট অভিযোগ। স্কোর দেখার আগে ঠিক করুন “সেরা” মানে কী।',
  },
  explore: {
    en: '360 labelled complaints: 90 are held back as the standard test, plus 10 written to be hard.',
    bn: '৩৬০টি লেবেলযুক্ত অভিযোগ: ৯০টি সাধারণ টেস্টের জন্য আলাদা রাখা, আর ১০টি ইচ্ছা করে কঠিন করে লেখা।',
  },
  train: {
    en: 'Machine learning learns from the training complaints. Try a complaint and compare the rules with the model.',
    bn: 'মেশিন লার্নিং প্রশিক্ষণের অভিযোগ থেকে শেখে। একটি অভিযোগ লিখে নিয়ম আর মডেলের তুলনা করুন।',
  },
  evaluate: {
    en: 'Run the comparison: accuracy on both tests, speed, what each needs, and whether it can explain itself.',
    bn: 'তুলনা চালান: দুই টেস্টে নির্ভুলতা, গতি, কোনটির কী লাগে, এবং নিজেকে ব্যাখ্যা করতে পারে কি না।',
  },
  break: {
    en: 'Cut the training data to 12 examples and run again. Then look at the hard test: easy tests flatter every model.',
    bn: 'প্রশিক্ষণ ডেটা ১২টিতে নামিয়ে আবার চালান। তারপর কঠিন টেস্ট দেখুন: সহজ টেস্ট সব মডেলকেই ভালো দেখায়।',
  },
  apply: {
    en: 'Choose for your office: accuracy, cost, privacy, explanation, maintenance, and a human review path.',
    bn: 'আপনার অফিসের জন্য বাছুন: নির্ভুলতা, খরচ, গোপনীয়তা, ব্যাখ্যা, রক্ষণাবেক্ষণ, আর মানুষের যাচাইয়ের পথ।',
  },
};
