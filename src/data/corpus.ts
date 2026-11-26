/*
 * Training text for the tiny next-word model (lesson 9): short sentences about city services.
 * Copied from the legacy page.
 */

export const CORPUS: Record<'en' | 'bn', string> = {
  en: [
    'the city corporation collects waste every morning .',
    'the city corporation collects waste from every ward .',
    'the city corporation collects tax from shops and houses .',
    'the city corporation collects holding tax every year .',
    'the city corporation cleans the drains before the rainy season .',
    'the city corporation repairs the roads after the rainy season .',
    'the waste truck comes to our road every morning .',
    'the waste truck takes the waste to the landfill .',
    'heavy rain causes waterlogging on the main road .',
    'blocked drains cause waterlogging in low areas .',
    'the mosquito team sprays medicine in every ward .',
    'dengue cases rise during the rainy season .',
    'citizens can complain about waste on the website .',
    'citizens can pay holding tax online .',
    'citizens can apply for a trade licence online .',
    'the mayor visits the ward every month .',
    'the councillor listens to the citizens of the ward .',
    'the street lights are repaired at night .',
    'the roads are repaired before the rainy season .',
    'the drains are cleaned every month .',
    'the market produces a lot of waste every day .',
    'the hospital produces medical waste every day .',
    'the bus takes students to school every morning .',
    'the school is near the main road .',
    'the park is cleaned every morning .',
    'every ward has a waste collection point .',
    'every citizen has the right to clean water .',
    'clean water reduces disease in the city .',
    'the city needs more trucks for waste collection .',
    'the city needs more drains in low areas .',
  ].join('\n'),
  bn: [
    'সিটি কর্পোরেশন প্রতিদিন ময়লা সংগ্রহ করে ।',
    'সিটি কর্পোরেশন প্রতিদিন সকালে রাস্তা পরিষ্কার করে ।',
    'সিটি কর্পোরেশন প্রতি বছর হোল্ডিং কর আদায় করে ।',
    'সিটি কর্পোরেশন বর্ষার আগে ড্রেন পরিষ্কার করে ।',
    'সিটি কর্পোরেশন বর্ষার পরে রাস্তা মেরামত করে ।',
    'ময়লার গাড়ি প্রতিদিন সকালে আমাদের রাস্তায় আসে ।',
    'ময়লার গাড়ি ময়লা নিয়ে ল্যান্ডফিলে যায় ।',
    'ভারী বৃষ্টিতে প্রধান সড়কে পানি জমে ।',
    'ড্রেন বন্ধ থাকলে নিচু এলাকায় পানি জমে ।',
    'মশক নিধন কর্মীরা প্রতিটি ওয়ার্ডে ওষুধ ছিটায় ।',
    'বর্ষাকালে ডেঙ্গু রোগী বেড়ে যায় ।',
    'নাগরিকরা ওয়েবসাইটে ময়লার অভিযোগ করতে পারেন ।',
    'নাগরিকরা অনলাইনে হোল্ডিং কর দিতে পারেন ।',
    'নাগরিকরা অনলাইনে ট্রেড লাইসেন্সের আবেদন করতে পারেন ।',
    'মেয়র প্রতি মাসে ওয়ার্ড পরিদর্শন করেন ।',
    'কাউন্সিলর ওয়ার্ডের নাগরিকদের কথা শোনেন ।',
    'রাতে সড়কবাতি মেরামত করা হয় ।',
    'বর্ষার আগে রাস্তা মেরামত করা হয় ।',
    'প্রতি মাসে ড্রেন পরিষ্কার করা হয় ।',
    'বাজারে প্রতিদিন অনেক ময়লা জমে ।',
    'হাসপাতালে প্রতিদিন মেডিকেল বর্জ্য তৈরি হয় ।',
    'প্রতিটি ওয়ার্ডে একটি ময়লা সংগ্রহের স্থান আছে ।',
    'প্রত্যেক নাগরিকের নিরাপদ পানির অধিকার আছে ।',
    'নিরাপদ পানি শহরে রোগ কমায় ।',
    'শহরে ময়লা সংগ্রহের জন্য আরও গাড়ি দরকার ।',
    'নিচু এলাকায় আরও ড্রেন দরকার ।',
  ].join('\n'),
};

/** The prompt the generator starts from. */
export const START: Record<'en' | 'bn', string> = { en: 'the city corporation', bn: 'সিটি কর্পোরেশন' };

/** Words offered in the audience game, before anyone adds their own. */
export const VOTE_OPTIONS: Record<'en' | 'bn', string[]> = {
  en: ['waste', 'tax', 'fees', 'information'],
  bn: ['ময়লা', 'কর', 'ফি', 'তথ্য'],
};
