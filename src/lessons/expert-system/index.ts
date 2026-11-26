import type { Bi } from '../../i18n';
import type { CycleStep } from '../../store/useLab';

export { ExpertStage } from './Stage';
export { ExpertControls } from './Controls';

export const expertSteps: Record<CycleStep, Bi> = {
  understand: {
    en: 'An officer writes the knowledge as IF–THEN rules. The computer only applies them, top to bottom. Nothing is learned from data.',
    bn: 'একজন কর্মকর্তা জ্ঞানকে যদি–তবে নিয়ম হিসেবে লেখেন। কম্পিউটার শুধু ওপর থেকে নিচে সেগুলো প্রয়োগ করে। ডেটা থেকে কিছুই শেখে না।',
  },
  explore: {
    en: 'Look at the complaints citizens send. Which words tell you the department? Pick one to route it.',
    bn: 'নাগরিকদের পাঠানো অভিযোগগুলো দেখুন। কোন শব্দ দেখে বিভাগ বোঝা যায়? একটি বেছে নিয়ে পাঠান।',
  },
  train: {
    en: 'There is no training here: a person writes the rules. Edit the keywords, add a rule, or change the order.',
    bn: 'এখানে কোনো প্রশিক্ষণ নেই: নিয়ম লেখেন একজন মানুষ। কীওয়ার্ড বদলান, নিয়ম যোগ করুন বা ক্রম বদলান।',
  },
  evaluate: {
    en: 'Route a complaint and see which rules fired, then check the rules against all ten sample complaints.',
    bn: 'একটি অভিযোগ পাঠিয়ে দেখুন কোন নিয়ম কাজ করল, তারপর দশটি নমুনা অভিযোগে নিয়মগুলো যাচাই করুন।',
  },
  break: {
    en: 'Try the tricky complaints: a street light that mentions a road, a smell with no keyword, Banglish spelling.',
    bn: 'জটিল অভিযোগগুলো চেষ্টা করুন: রাস্তার কথা বলা সড়কবাতি, কীওয়ার্ডহীন দুর্গন্ধ, ইংরেজি হরফে বাংলা।',
  },
  apply: {
    en: 'Rules are transparent but brittle. Write a complaint from your own ward and see whether they cope.',
    bn: 'নিয়ম স্বচ্ছ কিন্তু ভঙ্গুর। আপনার ওয়ার্ডের একটি অভিযোগ লিখে দেখুন নিয়মগুলো সামলাতে পারে কি না।',
  },
};
