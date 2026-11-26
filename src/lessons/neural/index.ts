import type { Bi } from '../../i18n';
import type { CycleStep } from '../../store/useLab';

export { NeuralControls } from './Controls';
export { NeuralStage } from './Stage';

export const neuralSteps: Record<CycleStep, Bi> = {
  understand: {
    en: 'Run the signal, then select a connection or circle in the artificial neuron to see its calculation.',
    bn: 'সংকেত চালান। তারপর কৃত্রিম নিউরনের কোনো সংযোগ বা বৃত্তে চাপ দিয়ে হিসাব দেখুন।',
  },
  explore: {
    en: 'Look at three practice examples. Pick a row and compare the model’s guess with the number of sacks actually collected.',
    bn: 'অনুশীলনের তিনটি উদাহরণ দেখুন। একটি সারি বেছে নিয়ে মডেলের অনুমানের সঙ্গে বাস্তবে সংগৃহীত বস্তার সংখ্যা মেলান।',
  },
  train: {
    en: 'Try changing the multiplier yourself, then let the model try a small change and keep the value with the smallest average gap.',
    bn: 'নিজে গুণক বদলে দেখুন। তারপর মডেলকে কাছাকাছি মান যাচাই করতে দিন। গড় ভুল সবচেয়ে কম হলে সেই মানটি রাখা হবে।',
  },
  evaluate: {
    en: 'Make a prediction for four collection rounds. Reveal the actual number and compare it with the guess.',
    bn: 'চার দফা সংগ্রহের জন্য অনুমান করুন। প্রকৃত বস্তার সংখ্যা দেখিয়ে অনুমানের সঙ্গে তুলনা করুন।',
  },
  break: {
    en: 'Toggle the reports from the two streets. Follow how two connected units decide whether to send exactly one crew.',
    bn: 'দুই সড়কের অভিযোগ চালু বা বন্ধ করুন। ঠিক একটি দল পাঠানো হবে কি না, দুটি সংযুক্ত ইউনিট কীভাবে ঠিক করে তা দেখুন।',
  },
  apply: {
    en: 'Try to separate the four cases with one line. Switch to two hidden units, then continue to TensorFlow Playground.',
    bn: 'একটি রেখা দিয়ে চারটি ঘটনা আলাদা করার চেষ্টা করুন। তারপর মাঝের দুটি ইউনিট চালু করে TensorFlow Playground-এ যান।',
  },
};
