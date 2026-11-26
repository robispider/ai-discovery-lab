import type { Bi } from '../../i18n';
import type { CycleStep } from '../../store/useLab';

export { ClusterStage } from './Stage';
export { ClusterControls } from './Controls';

export const clusterSteps: Record<CycleStep, Bi> = {
  understand: {
    en: 'No right answers this time. The machine groups similar neighbourhoods by itself; people decide what the groups mean.',
    bn: 'এবার কোনো সঠিক উত্তর নেই। যন্ত্র নিজেই একই রকম এলাকাগুলোকে দলে ভাগ করে; দলগুলোর অর্থ ঠিক করে মানুষ।',
  },
  explore: {
    en: 'Look at the 200 neighbourhoods. Change the axes: do you already see groups? Notice how different the units are.',
    bn: '২০০টি এলাকা দেখুন। অক্ষ বদলান: এখনই কি দল দেখা যাচ্ছে? এককগুলো কতটা আলাদা, লক্ষ করুন।',
  },
  train: {
    en: 'Press Find groups. Each step, every neighbourhood joins its nearest centre, then each centre moves to the middle of its group.',
    bn: '"দল খোঁজো" চাপুন। প্রতি ধাপে প্রতিটি এলাকা নিকটতম কেন্দ্রে যোগ দেয়, তারপর প্রতিটি কেন্দ্র দলের মাঝখানে সরে যায়।',
  },
  evaluate: {
    en: 'There is no score to check. Read each group’s averages and give it a name a ward officer would understand.',
    bn: 'যাচাই করার মতো কোনো স্কোর নেই। প্রতিটি দলের গড় পড়ুন এবং এমন নাম দিন যা একজন ওয়ার্ড কর্মকর্তা বুঝবেন।',
  },
  break: {
    en: 'Turn off scaling, try k = 2 and k = 8, and a new random start. Same data, different stories.',
    bn: 'স্কেলিং বন্ধ করুন, k = ২ ও k = ৮ এবং নতুন এলোমেলো শুরু চেষ্টা করুন। একই ডেটা, ভিন্ন গল্প।',
  },
  apply: {
    en: 'Choosing k, the measurements and the names are human decisions. Where could grouping help your ward?',
    bn: 'k, পরিমাপ ও নাম বাছাই মানুষের সিদ্ধান্ত। আপনার ওয়ার্ডে দলে ভাগ করা কোথায় কাজে লাগতে পারে?',
  },
};
