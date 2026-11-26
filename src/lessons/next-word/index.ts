import type { Bi } from '../../i18n';
import type { CycleStep } from '../../store/useLab';

export { NextWordStage } from './Stage';
export { NextWordControls } from './Controls';

export const nextWordSteps: Record<CycleStep, Bi> = {
  understand: {
    en: 'A language model writes by guessing the next word, again and again. Play the audience game first.',
    bn: 'ভাষা মডেল বারবার পরের শব্দ অনুমান করে লেখে। প্রথমে দর্শকদের খেলাটি খেলুন।',
  },
  explore: {
    en: 'Read the training text. The model will only ever know these sentences. Notice how text is cut into numbered tokens.',
    bn: 'প্রশিক্ষণের লেখা পড়ুন। মডেল শুধু এই বাক্যগুলোই জানবে। লক্ষ করুন, লেখা কীভাবে নম্বরযুক্ত টোকেনে ভাগ হয়।',
  },
  train: {
    en: 'Train it: the model counts which word follows the previous one (or two). That is all it learns.',
    bn: 'শেখান: মডেল গোনে আগের একটি (বা দুটি) শব্দের পরে কোন শব্দ আসে। সে শুধু এটুকুই শেখে।',
  },
  evaluate: {
    en: 'Generate text word by word and watch the probabilities. Is the new sentence true? The model cannot tell.',
    bn: 'শব্দে শব্দে লেখা তৈরি করুন এবং সম্ভাবনাগুলো দেখুন। নতুন বাক্যটি কি সত্য? মডেল তা বলতে পারে না।',
  },
  break: {
    en: 'Generate before training, change the temperature, use 2 previous words, or start with an unknown word.',
    bn: 'শেখানোর আগে লেখা তৈরি করুন, টেম্পারেচার বদলান, আগের ২টি শব্দ ব্যবহার করুন, বা অজানা শব্দ দিয়ে শুরু করুন।',
  },
  apply: {
    en: 'GPT does the same job at a vast scale. It writes likely text, not checked facts.',
    bn: 'GPT বিশাল পরিসরে একই কাজ করে। সে সম্ভাব্য লেখা লেখে, যাচাই করা তথ্য নয়।',
  },
};
