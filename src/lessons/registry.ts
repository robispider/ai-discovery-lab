import { defineLesson, type Lesson } from './types';

/*
 * The 12 lessons, in teaching order. Titles and summaries come from the previous index.html.
 * "How it works", "Break it" and "Notes" are English drafts; Bangla is added when each lesson is
 * rebuilt in Phase 2 (the panel marks the fallback). Stage and Controls are added in Phase 2 too.
 */
export const LESSONS: Lesson[] = [
  defineLesson({
    n: 1,
    id: 'route-finding',
    family: 'classical',
    icon: 'route',
    title: { en: 'Garbage truck route finding', bn: 'ময়লার গাড়ির পথ খোঁজা' },
    short: { en: 'Route finding', bn: 'পথ খোঁজা' },
    summary: {
      en: 'Draw blocked roads and watch BFS, Dijkstra and A* search the city map. No data, no training.',
      bn: 'বন্ধ রাস্তা আঁকুন, তারপর BFS, Dijkstra ও A* কীভাবে শহরের মানচিত্রে পথ খোঁজে দেখুন। কোনো ডেটা বা প্রশিক্ষণ নেই।',
    },
    stageCaption: { en: 'Ward street grid · search', bn: 'ওয়ার্ডের রাস্তার গ্রিড · অনুসন্ধান' },
    legacy: 'experiments/route.html',
    legacyLines: 681,
    content: {
      how: {
        en: 'The ward is a grid. BFS explores outward ring by ring. A* adds a hint, the distance to the goal, so it explores fewer cells for the same route.',
      },
      breakIt: {
        en: 'Close a bridge. Both searches still find a route, but A* now explores far more cells because its hint keeps pointing at the closed crossing.',
      },
      notes: {
        en: 'Ask the room: did the computer learn anything? No data and no training, and it is still AI.',
      },
    },
  }),
  defineLesson({
    n: 2,
    id: 'expert-system',
    family: 'classical',
    icon: 'rules',
    title: { en: 'Complaint routing expert system', bn: 'অভিযোগ বণ্টনের এক্সপার্ট সিস্টেম' },
    short: { en: 'Expert system', bn: 'এক্সপার্ট সিস্টেম' },
    summary: {
      en: 'Humans write IF-THEN rules; the computer applies them. Edit the rules and find complaints that break them.',
      bn: 'মানুষ IF-THEN নিয়ম লেখে; কম্পিউটার তা প্রয়োগ করে। নিয়ম বদলান এবং এমন অভিযোগ খুঁজুন যা নিয়মকে ব্যর্থ করে।',
    },
    stageCaption: { en: 'Rule engine', bn: 'নিয়মের ইঞ্জিন' },
    legacy: 'experiments/expert.html',
    legacyLines: 155,
    content: {
      how: {
        en: 'Each rule says: IF the complaint contains this word, THEN send it to this department. The lab shows which rule fired and why.',
      },
      breakIt: {
        en: 'Find a complaint where two rules fire and the system cannot choose, and one where no rule fires at all.',
      },
      notes: {
        en: 'Let one participant add a rule, then find a complaint it misroutes. Rules only know what a person wrote down.',
      },
    },
  }),
  defineLesson({
    n: 3,
    id: 'waterlogging-tree',
    family: 'ml',
    icon: 'tree',
    title: { en: 'Predict waterlogging (decision tree)', bn: 'জলাবদ্ধতার পূর্বাভাস (ডিসিশন ট্রি)' },
    short: { en: 'Waterlogging tree', bn: 'জলাবদ্ধতা ট্রি' },
    summary: {
      en: 'Train a decision tree on 800 records, test it on unseen data, overfit it, and see biased records produce biased predictions.',
      bn: '৮০০টি রেকর্ড দিয়ে ডিসিশন ট্রি শেখান, অদেখা ডেটায় যাচাই করুন, ওভারফিট করুন, এবং পক্ষপাতদুষ্ট রেকর্ড কীভাবে পক্ষপাতদুষ্ট পূর্বাভাস দেয় দেখুন।',
    },
    stageCaption: { en: '800 ward-days · decision tree', bn: '৮০০ ওয়ার্ড-দিন · ডিসিশন ট্রি' },
    legacy: 'experiments/tree.html',
    legacyLines: 1210,
    content: {
      how: {
        en: 'The tree picks the one question that best separates flooded days from dry ones, then asks a new question inside each branch, and repeats.',
      },
      breakIt: {
        en: 'Make the tree very deep. Accuracy on the training records reaches 100% while accuracy on unseen days falls: the tree has memorised the data.',
      },
      notes: {
        en: 'Show overfitting first, then switch on under-reported wards to show how biased records produce biased predictions.',
      },
    },
  }),
  defineLesson({
    n: 4,
    id: 'waste-regression',
    family: 'ml',
    icon: 'regression',
    title: { en: 'Predict daily waste (regression)', bn: 'দৈনিক বর্জ্যের পূর্বাভাস (রিগ্রেশন)' },
    short: { en: 'Waste demand', bn: 'বর্জ্যের চাহিদা' },
    summary: {
      en: 'Fit a line that predicts tonnes of waste per ward. Watch the error shrink, then add an outlier.',
      bn: 'ওয়ার্ডপ্রতি কত টন বর্জ্য হবে তা অনুমানের রেখা তৈরি করুন। ভুল কমতে দেখুন, তারপর একটি ব্যতিক্রমী ওয়ার্ড যোগ করুন।',
    },
    stageCaption: { en: 'Wards · linear fit', bn: 'ওয়ার্ড · সরল রেখা' },
    legacy: 'experiments/regression.html',
    legacyLines: 1679,
    content: {
      how: {
        en: 'A straight line through population and tonnes per day, placed so the average distance from the points (the error) is as small as possible.',
      },
      breakIt: {
        en: 'Add a market ward. One unusual ward drags the line, and the prediction for every other ward changes with it.',
      },
      notes: {
        en: 'Correlation is not causation: population does not create waste by itself. Ask what else could explain the market ward.',
      },
    },
  }),
  defineLesson({
    n: 5,
    id: 'neighbourhood-clusters',
    family: 'ml',
    icon: 'cluster',
    title: { en: 'Discover hidden neighbourhood groups (k-means)', bn: 'এলাকার লুকানো দল খোঁজা (k-means)' },
    short: { en: 'Hidden groups', bn: 'লুকানো দল' },
    summary: {
      en: 'No correct answers given. The machine groups 200 neighbourhoods; you name the groups.',
      bn: 'কোনো সঠিক উত্তর দেওয়া হয়নি। যন্ত্র ২০০টি এলাকাকে দলে ভাগ করে; দলগুলোর নাম দেবেন আপনি।',
    },
    stageCaption: { en: '200 neighbourhoods · k-means', bn: '২০০টি এলাকা · k-means' },
    legacy: 'experiments/cluster.html',
    legacyLines: 209,
    content: {
      how: {
        en: 'k-means drops k centres, gives each neighbourhood to its nearest centre, moves each centre to the middle of its group, and repeats until nothing changes.',
      },
      breakIt: {
        en: 'Change k. The same data tells one story with 2 groups and a different one with 6. The machine never says which is right.',
      },
      notes: {
        en: 'Have the room name each group. The machine does not know what a market area or a dense settlement is; people do.',
      },
    },
  }),
  defineLesson({
    n: 6,
    id: 'neural-network',
    family: 'nn',
    icon: 'network',
    title: { en: 'Watch a neural network learn', bn: 'নিউরাল নেটওয়ার্ককে শিখতে দেখুন' },
    short: { en: 'Neural network', bn: 'নিউরাল নেটওয়ার্ক' },
    summary: {
      en: 'TensorFlow Playground: a real small neural network training in the browser.',
      bn: 'TensorFlow Playground: ব্রাউজারেই একটি ছোট আসল নিউরাল নেটওয়ার্কের প্রশিক্ষণ।',
    },
    stageCaption: { en: 'Tiny network', bn: 'ছোট নেটওয়ার্ক' },
    online: { tool: 'TensorFlow Playground', url: 'https://playground.tensorflow.org/' },
    content: {
      how: {
        en: 'Each neuron can draw one straight line. Hidden neurons combine several lines into a curve that can wrap around the inner dots.',
      },
      breakIt: {
        en: 'Remove every hidden layer and try the circle data. A single straight line cannot separate a ring from its centre.',
      },
      notes: {
        en: 'Opens TensorFlow Playground online. A later phase replaces it with an offline playground.',
      },
    },
  }),
  defineLesson({
    n: 7,
    id: 'image-recogniser',
    family: 'dl',
    icon: 'camera',
    title: { en: 'Train an image recogniser with the webcam', bn: 'ওয়েবক্যাম দিয়ে ছবি চেনার মডেল তৈরি' },
    short: { en: 'Image recogniser', bn: 'ছবি চেনা' },
    summary: {
      en: 'Google Teachable Machine: three classes (organic, plastic, paper waste), trained live with transfer learning.',
      bn: 'Google Teachable Machine: তিনটি শ্রেণি (জৈব, প্লাস্টিক, কাগজ বর্জ্য), ট্রান্সফার লার্নিং দিয়ে সরাসরি প্রশিক্ষণ।',
    },
    stageCaption: { en: 'Waste sorter', bn: 'বর্জ্য বাছাই' },
    online: { tool: 'Teachable Machine', url: 'https://teachablemachine.withgoogle.com/train/image' },
    content: {
      how: {
        en: 'A network already trained on millions of photos turns each webcam frame into numbers. A small classifier learns organic, plastic and paper from your samples.',
      },
      breakIt: {
        en: 'Dim the lights or show an object it never saw. The model can stay confident and still be wrong.',
      },
      notes: { en: 'High confidence is not correctness. Test lighting in the actual room during rehearsal.' },
    },
  }),
  defineLesson({
    n: 8,
    id: 'traffic-signal',
    family: 'rl',
    icon: 'signal',
    title: { en: 'Learning traffic signal (Q-learning)', bn: 'শিখতে পারা ট্রাফিক সিগন্যাল (Q-learning)' },
    short: { en: 'Traffic signal', bn: 'ট্রাফিক সিগন্যাল' },
    summary: {
      en: 'A fixed-time signal versus an agent that learns from rewards, with safety rules it cannot override.',
      bn: 'নির্দিষ্ট-সময়ের সিগন্যাল বনাম পুরস্কার থেকে শেখা এজেন্ট, এমন নিরাপত্তা নিয়মসহ যা এজেন্ট ভাঙতে পারে না।',
    },
    stageCaption: { en: 'Junction · Q-learning', bn: 'মোড় · Q-learning' },
    legacy: 'experiments/traffic.html',
    legacyLines: 1131,
    content: {
      how: {
        en: 'The agent sees the queue on each road, chooses to keep or switch the green, and is rewarded for fewer waiting vehicles. Over many runs it learns which choice pays.',
      },
      breakIt: {
        en: 'Train on morning traffic, then test on evening traffic. The learned policy no longer fits.',
      },
      notes: {
        en: 'The safety shield sits outside the agent: minimum green and all-red are engineered, not learned.',
      },
    },
  }),
  defineLesson({
    n: 9,
    id: 'next-word',
    family: 'lm',
    icon: 'bars',
    title: {
      en: 'Next-word prediction: build a tiny language model',
      bn: 'পরের শব্দ অনুমান: ছোট্ট একটি ভাষা মডেল তৈরি',
    },
    short: { en: 'Next word', bn: 'পরের শব্দ' },
    summary: {
      en: 'Audience guessing game, then train a word-level model live on English or Bangla text and generate sentences.',
      bn: 'দর্শকদের অনুমানের খেলা, তারপর ইংরেজি বা বাংলা লেখায় সরাসরি একটি শব্দভিত্তিক মডেল শিখিয়ে বাক্য তৈরি।',
    },
    stageCaption: { en: 'Word counts → probabilities', bn: 'শব্দ গণনা → সম্ভাবনা' },
    legacy: 'experiments/nextword.html',
    legacyLines: 250,
    content: {
      how: {
        en: 'Count which word follows which in a text, then turn the counts into probabilities. Temperature controls how often a less likely word is picked.',
      },
      breakIt: { en: 'Raise the temperature. Unlikely words start to win and the sentences ramble.' },
      notes: {
        en: 'Run the audience guessing game first, then show that the model does the same thing with counts.',
      },
    },
  }),
  defineLesson({
    n: 10,
    id: 'inside-gpt2',
    family: 'lm',
    icon: 'tokens',
    title: { en: 'Look inside a real GPT-2', bn: 'আসল GPT-2-এর ভেতরে দেখা' },
    short: { en: 'Inside GPT-2', bn: 'GPT-2-এর ভেতরে' },
    summary: {
      en: 'Transformer Explainer runs GPT-2 in the browser and shows tokens, attention and next-token probabilities.',
      bn: 'Transformer Explainer ব্রাউজারে GPT-2 চালায় এবং টোকেন, attention ও পরের টোকেনের সম্ভাবনা দেখায়।',
    },
    stageCaption: { en: 'Tokens and attention', bn: 'টোকেন ও অ্যাটেনশন' },
    online: { tool: 'Transformer Explainer', url: 'https://poloclub.github.io/transformer-explainer/' },
    content: {
      how: {
        en: 'GPT-2 cuts text into tokens, lets each token look back at the earlier ones (attention), and scores every possible next token.',
      },
      breakIt: {
        en: 'Type in Bangla. GPT-2 cuts it into many tiny pieces because it saw very little Bangla during training.',
      },
      notes: { en: 'Online only for now. Open it in a background tab before the session starts.' },
    },
  }),
  defineLesson({
    n: 11,
    id: 'right-ai-for-the-job',
    family: 'cap',
    icon: 'compare',
    title: {
      en: 'The right AI for the job: Bangla complaint routing',
      bn: 'কাজের জন্য সঠিক এআই: বাংলা অভিযোগ বণ্টন',
    },
    short: { en: 'Right AI for the job', bn: 'সঠিক এআই' },
    summary: {
      en: 'Rules vs machine learning (and optionally a local LLM) on the same test set: accuracy, speed, cost and explainability.',
      bn: 'একই টেস্ট সেটে নিয়ম বনাম মেশিন লার্নিং (ও ইচ্ছা হলে লোকাল LLM): নির্ভুলতা, গতি, খরচ ও ব্যাখ্যাযোগ্যতা।',
    },
    stageCaption: { en: 'Same test set, three approaches', bn: 'একই টেস্ট সেট, তিন পদ্ধতি' },
    legacy: 'experiments/complaints.html',
    legacyLines: 401,
    content: {
      how: {
        en: 'Three approaches sort the same held-out Bangla complaints: keyword rules, a Naive Bayes classifier, and optionally a local language model.',
      },
      breakIt: {
        en: 'Add Banglish spellings. Rules miss them, Naive Bayes copes partly, and a language model copes best but is slower and harder to explain.',
      },
      notes: {
        en: 'Close the session here: the most sophisticated AI is not always the most appropriate one.',
      },
    },
  }),
  defineLesson({
    n: 12,
    id: 'models-and-gpus',
    family: 'lm',
    icon: 'chip',
    title: {
      en: 'Visual guide: LLM models, GPU & CUDA cores, self-hosting & civic open source',
      bn: 'ভিজ্যুয়াল গাইড: LLM মডেল, GPU ও CUDA কোর, সেল্ফ-হোস্টিং ও সিটি ওপেন-সোর্স',
    },
    short: { en: 'Models & GPUs', bn: 'মডেল ও GPU' },
    summary: {
      en: 'What a model file holds, CPU vs GPU core race, cloud vs self-hosted privacy flows, and open-source models for city corporations.',
      bn: 'মডেল ফাইলের ভেতরে কী থাকে, CPU বনাম GPU কোরের দৌড়, ক্লাউড বনাম সেল্ফ-হোস্টেড গোপনীয়তা, ও সিটি কর্পোরেশনের জন্য ওপেন-সোর্স মডেল।',
    },
    stageCaption: { en: 'CPU vs GPU', bn: 'CPU বনাম GPU' },
    legacy: 'experiments/llm-concepts.html',
    legacyLines: 1616,
    content: {
      how: {
        en: 'A model file is a very large table of numbers. Running it means many small multiplications, and a GPU does thousands of them at the same moment.',
      },
      breakIt: {
        en: 'Follow a citizen complaint to a cloud model and to a city server. Where does the personal data end up in each case?',
      },
      notes: { en: 'Use the self-hosting part with IT staff. Skip the CUDA detail for a general audience.' },
    },
  }),
];

export function getLesson(n: number): Lesson | undefined {
  return LESSONS.find((l) => l.n === n);
}
