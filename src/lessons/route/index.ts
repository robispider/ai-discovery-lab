import type { Bi } from '../../i18n';
import type { CycleStep } from '../../store/useLab';

export { RouteStage } from './Stage';
export { RouteControls } from './Controls';

export const routeSteps: Record<CycleStep, Bi> = {
  understand: {
    en: 'A garbage truck must cross the canal to the transfer station. Jammed roads cost 4 minutes per block; clear roads cost 1.',
    bn: 'একটি ময়লার গাড়িকে খাল পেরিয়ে ট্রান্সফার স্টেশনে যেতে হবে। যানজটের রাস্তায় প্রতি ব্লকে ৪ মিনিট, ফাঁকা রাস্তায় ১ মিনিট।',
  },
  explore: {
    en: 'There is no data here, only a map. Block a road, move the truck or the station, and see what changes.',
    bn: 'এখানে কোনো ডেটা নেই, শুধু একটি মানচিত্র। একটি রাস্তা বন্ধ করুন, গাড়ি বা স্টেশন সরান, এবং দেখুন কী বদলায়।',
  },
  train: {
    en: 'Nothing is trained: people wrote these search rules. Pick a driver and watch how it checks the city.',
    bn: 'কিছুই শেখানো হয় না: এই অনুসন্ধানের নিয়ম মানুষের লেখা। একজন চালক বেছে নিন এবং দেখুন সে কীভাবে শহর যাচাই করে।',
  },
  evaluate: {
    en: 'Run all four on the same city. The best method finds the fastest trip with the least checking.',
    bn: 'একই শহরে চারটিই চালান। সেরা পদ্ধতি সবচেয়ে কম যাচাই করে দ্রুততম যাত্রা খুঁজে পায়।',
  },
  break: {
    en: 'Close the west bridge, then both. A search only knows the map it is given.',
    bn: 'পশ্চিম সেতু বন্ধ করুন, তারপর দুটিই। অনুসন্ধান শুধু তাকে দেওয়া মানচিত্রটুকুই জানে।',
  },
  apply: {
    en: 'Intelligent behaviour does not always need data. Where could route search help your services?',
    bn: 'বুদ্ধিমান আচরণের জন্য সবসময় ডেটা লাগে না। আপনার সেবায় পথ অনুসন্ধান কোথায় কাজে লাগতে পারে?',
  },
};
