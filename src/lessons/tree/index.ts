import type { Bi } from '../../i18n';
import type { CycleStep } from '../../store/useLab';

export { TreeStage } from './Stage';
export { TreeControls } from './Controls';

export const treeSteps: Record<CycleStep, Bi> = {
  understand: {
    en: 'Will this street flood tonight? Change the clues and watch the forecast. The machine learned the rules from 800 past days.',
    bn: 'আজ রাতে কি এই রাস্তায় পানি জমবে? সূত্রগুলো বদলান এবং পূর্বাভাস দেখুন। যন্ত্র ৮০০টি পুরোনো দিন থেকে নিয়ম শিখেছে।',
  },
  explore: {
    en: 'Look at the records the tree studies. Each day has four clues and a label: flooded or dry.',
    bn: 'গাছ যে রেকর্ড পড়ে সেগুলো দেখুন। প্রতিটি দিনে চারটি সূত্র ও একটি লেবেল আছে: পানি জমেছিল বা শুকনো।',
  },
  train: {
    en: 'Hide some days for the exam, then watch the tree pick the question that best separates flooded days from dry ones.',
    bn: 'কিছু দিন পরীক্ষার জন্য লুকিয়ে রাখুন, তারপর দেখুন গাছ কীভাবে সেই প্রশ্ন বাছে যা পানি জমা আর শুকনো দিনকে সবচেয়ে ভালো আলাদা করে।',
  },
  evaluate: {
    en: 'The exam uses days the tree never saw. Compare practice and exam, and look at the dangerous mistake: a flood with no warning.',
    bn: 'পরীক্ষায় এমন দিন থাকে যা গাছ কখনো দেখেনি। অনুশীলন আর পরীক্ষা তুলনা করুন, আর বিপজ্জনক ভুলটি দেখুন: সতর্কতা ছাড়া পানি জমা।',
  },
  break: {
    en: 'Overfit it, starve it of data, and feed it biased records. Who gets fewer warnings?',
    bn: 'ওভারফিট করুন, ডেটা কমিয়ে দিন, আর পক্ষপাতদুষ্ট রেকর্ড দিন। কারা কম সতর্কবার্তা পায়?',
  },
  apply: {
    en: 'A readable tree can be checked by people. Before trusting a forecast, ask: whose floods were never written down?',
    bn: 'পড়া যায় এমন ট্রি মানুষ যাচাই করতে পারে। পূর্বাভাসে ভরসা করার আগে জিজ্ঞেস করুন: কাদের বন্যা কখনো লেখা হয়নি?',
  },
};
