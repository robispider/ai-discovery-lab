import type { Bi } from '../../i18n';
import type { CycleStep } from '../../store/useLab';

export { RobotStage } from './Stage';
export { RobotPanelControls } from './Controls';

export const robotSteps: Record<CycleStep, Bi> = {
  understand: {
    en: 'Collect the waste and bring it back to the depot. The robot starts with five units of battery. Can it make the trip?',
    bn: 'বিন থেকে বর্জ্য তুলে ডিপোতে ফেরত আনুন। রোবটের ব্যাটারিতে শুরুতে পাঁচ ইউনিট চার্জ আছে। এই চার্জে পুরো পথ যাওয়া যাবে কি?',
  },
  explore: {
    en: 'Drive east to the bin and try to return. Then restart and take the detour north to the charger. Compare the rewards.',
    bn: 'পূর্বে বিনের কাছে গিয়ে ফেরার চেষ্টা করুন। তারপর আবার শুরু করে উত্তরে চার্জারের কাছে যান। দুইবারের পুরস্কার তুলনা করুন।',
  },
  train: {
    en: 'Watch one action update the Q-table. Then train hundreds of attempts and see how often the robot delivers the waste.',
    bn: 'একটি চালে Q-সারণি কীভাবে বদলায় দেখুন। তারপর কয়েকশ বার প্রশিক্ষণ দিয়ে দেখুন রোবট কতবার বর্জ্য জমা দিতে পারে।',
  },
  evaluate: {
    en: 'Run the direct route and the learned policy with the same starting battery. Watch where they go and whether they reach the depot with the waste.',
    bn: 'সমান চার্জ নিয়ে সরাসরি পথ ও শেখা পথ দুটো চালান। দেখুন কে কোন দিকে যায় এবং বর্জ্য নিয়ে ডিপোতে ফিরতে পারে কি না।',
  },
  break: {
    en: 'Change the starting battery to three or twelve and replay. Does the policy learned from the five-unit start still work?',
    bn: 'শুরুর চার্জ তিন বা বারো করে আবার চালান। পাঁচ ইউনিট চার্জ নিয়ে শুরু করে যে কৌশল শিখেছিল, তা কি এখনো কাজে লাগে?',
  },
  apply: {
    en: 'Recall the route search in Lesson 1. What did search calculate from the map, and what did the robot learn from its attempts?',
    bn: 'প্রথম পাঠে পথ খোঁজার কথা মনে করুন। মানচিত্র থেকে সার্চ কী হিসাব করেছিল, আর রোবট নিজের চেষ্টা থেকে কী শিখল?',
  },
};
