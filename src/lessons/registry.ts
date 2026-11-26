import { defineLesson, type Lesson, type LessonNumber, type LessonReference } from './types';
import { LlmGuideControls, LlmGuideStage, llmGuideSteps } from './llm-guide';
import { RegressionControls, RegressionStage, regressionSteps } from './regression';
import { TreeControls, TreeStage, treeSteps } from './tree';
import { TrafficPanelControls, TrafficStage, trafficSteps } from './traffic';
import { RouteControls, RouteStage, routeSteps } from './route';
import { NextWordControls, NextWordStage, nextWordSteps } from './next-word';
import { RightAiControls, RightAiStage, rightAiSteps } from './right-ai';
import { ClusterControls, ClusterStage, clusterSteps } from './clustering';
import { ExpertControls, ExpertStage, expertSteps } from './expert-system';
import { NeuralControls, NeuralStage, neuralSteps } from './neural';
import { RobotPanelControls, RobotStage, robotSteps } from './robot';
import { DrainSensorControls, DrainSensorStage, drainSensorSteps } from './drain-sensors';
import { PumpEdgeControls, PumpEdgeStage, pumpEdgeSteps } from './pump-edge-ai';
import { VisionControls, VisionStage, visionSteps } from './vision';

const VISION_REFERENCES: LessonReference[] = [
  {
    title: { en: 'Google Teachable Machine', bn: 'Google Teachable Machine' },
    description: {
      en: 'Train a real MobileNet image classifier with your live webcam and export it for the browser or edge devices',
      bn: 'সরাসরি ওয়েবক্যাম দিয়ে আসল MobileNet ছবি চেনার মডেল শেখান এবং ব্রাউজার বা এজ ডিভাইসে ব্যবহার করুন',
    },
    url: 'https://teachablemachine.withgoogle.com/train/image',
  },
];

const IOT_REFERENCES: LessonReference[] = [
  {
    title: { en: 'Learn Arduino', bn: 'Learn Arduino (আরডুইনো শিখুন)' },
    description: {
      en: 'Interactive 3D Arduino Uno lessons: breadboards, sensors, buzzers, and motors',
      bn: 'ইন্টারেক্টিভ ৩ডি আরডুইনো উনো পাঠ: ব্রেডবোর্ড, সেন্সর, বাজার ও মোটর',
    },
    url: 'https://learn-arduino-red.vercel.app/',
  },
  {
    title: { en: 'Learn ESP32', bn: 'Learn ESP32 (ESP32 শিখুন)' },
    description: {
      en: 'Interactive 3D ESP32 lessons: GPIO, Wi-Fi, Bluetooth, ESP-NOW, and HC-SR04P',
      bn: 'ইন্টারেক্টিভ ৩ডি ESP32 পাঠ: GPIO, ওয়াই-ফাই, ব্লুটুথ, ESP-NOW ও HC-SR04P',
    },
    url: 'https://learn-esp32.vercel.app/',
  },
];

/*
 * Lessons in teaching order.
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
        bn: 'ওয়ার্ডটি একটি গ্রিড। BFS বৃত্তের মতো চারপাশে ছড়িয়ে খোঁজে। A* একটি ইঙ্গিত যোগ করে, স্টেশন পর্যন্ত দূরত্ব, তাই একই পথের জন্য কম ঘর যাচাই করে।',
      },
      breakIt: {
        en: 'Close a bridge. Both searches still find a route, but A* now explores far more cells because its hint keeps pointing at the closed crossing.',
        bn: 'একটি সেতু বন্ধ করুন। দুই অনুসন্ধানই তবু পথ পায়, কিন্তু A* এখন অনেক বেশি ঘর যাচাই করে, কারণ তার ইঙ্গিত বারবার বন্ধ পারাপারের দিকেই দেখায়।',
      },
      notes: {
        en: 'Ask the room: did the computer learn anything? No data and no training, and it is still AI.',
        bn: 'দলকে জিজ্ঞেস করুন: কম্পিউটার কি কিছু শিখেছে? কোনো ডেটা নেই, কোনো প্রশিক্ষণ নেই, তবুও এটি এআই।',
      },
    },
    steps: routeSteps,
    Stage: RouteStage,
    Controls: RouteControls,
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
        bn: 'প্রতিটি নিয়ম বলে: যদি অভিযোগে এই শব্দ থাকে, তবে এই বিভাগে পাঠাও। কোন নিয়ম কাজ করল এবং কেন, ল্যাব তা দেখায়।',
      },
      breakIt: {
        en: 'Find a complaint where two rules fire and the system cannot choose, and one where no rule fires at all.',
        bn: 'এমন অভিযোগ খুঁজুন যেখানে দুটি নিয়ম কাজ করে আর সিস্টেম বাছতে পারে না, আর এমন একটি যেখানে কোনো নিয়মই কাজ করে না।',
      },
      notes: {
        en: 'Let one participant add a rule, then find a complaint it misroutes. Rules only know what a person wrote down.',
        bn: 'একজন অংশগ্রহণকারীকে একটি নিয়ম যোগ করতে দিন, তারপর এমন অভিযোগ খুঁজুন যা সেটি ভুল জায়গায় পাঠায়। মানুষ যা লিখেছে, নিয়ম শুধু ততটুকুই জানে।',
      },
    },
    steps: expertSteps,
    Stage: ExpertStage,
    Controls: ExpertControls,
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
        bn: 'ট্রি সেই একটি প্রশ্ন বাছে যা পানি জমা দিন আর শুকনো দিনকে সবচেয়ে ভালো আলাদা করে, তারপর প্রতিটি শাখার ভেতরে নতুন প্রশ্ন করে, এবং এভাবে চলতে থাকে।',
      },
      breakIt: {
        en: 'Make the tree very deep. Accuracy on the training records reaches 100% while accuracy on unseen days falls: the tree has memorised the data.',
        bn: 'ট্রিকে অনেক গভীর করুন। প্রশিক্ষণের রেকর্ডে নির্ভুলতা ১০০%-এ পৌঁছায়, কিন্তু অদেখা দিনে কমে যায়: ট্রি ডেটা মুখস্থ করেছে।',
      },
      notes: {
        en: 'Show overfitting first, then switch on under-reported wards to show how biased records produce biased predictions.',
        bn: 'প্রথমে ওভারফিটিং দেখান, তারপর কম-জানানো ওয়ার্ডের সুইচ চালু করে দেখান পক্ষপাতদুষ্ট রেকর্ড কীভাবে পক্ষপাতদুষ্ট পূর্বাভাস দেয়।',
      },
    },
    steps: treeSteps,
    Stage: TreeStage,
    Controls: TreeControls,
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
        bn: 'জনসংখ্যা ও দৈনিক টনের মধ্য দিয়ে একটি সরলরেখা, এমনভাবে বসানো যাতে বিন্দুগুলো থেকে গড় দূরত্ব (ভুল) যতটা সম্ভব কম হয়।',
      },
      breakIt: {
        en: 'Add a market ward. One unusual ward drags the line, and the prediction for every other ward changes with it.',
        bn: 'একটি বাজার-ওয়ার্ড যোগ করুন। একটি ব্যতিক্রমী ওয়ার্ড রেখাকে টেনে নেয়, আর তার সাথে বাকি সব ওয়ার্ডের অনুমানও বদলে যায়।',
      },
      notes: {
        en: 'Correlation is not causation: population does not create waste by itself. Ask what else could explain the market ward.',
        bn: 'সম্পর্ক মানেই কারণ নয়: জনসংখ্যা নিজে বর্জ্য তৈরি করে না। জিজ্ঞেস করুন, বাজার-ওয়ার্ডকে আর কী ব্যাখ্যা করতে পারে।',
      },
    },
    steps: regressionSteps,
    Stage: RegressionStage,
    Controls: RegressionControls,
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
        bn: 'k-means k-টি কেন্দ্র বসায়, প্রতিটি এলাকাকে নিকটতম কেন্দ্রে দেয়, প্রতিটি কেন্দ্রকে তার দলের মাঝখানে সরায়, এবং কিছু না বদলানো পর্যন্ত এভাবে চলতে থাকে।',
      },
      breakIt: {
        en: 'Change k. The same data tells one story with 2 groups and a different one with 6. The machine never says which is right.',
        bn: 'k বদলান। একই ডেটা ২টি দলে এক গল্প বলে, ৬টি দলে আরেক গল্প। কোনটি ঠিক, যন্ত্র কখনো বলে না।',
      },
      notes: {
        en: 'Have the room name each group. The machine does not know what a market area or a dense settlement is; people do.',
        bn: 'পুরো দলকে প্রতিটি দলের নাম দিতে বলুন। বাজার এলাকা বা ঘনবসতি কী, যন্ত্র জানে না; মানুষ জানে।',
      },
    },
    steps: clusterSteps,
    Stage: ClusterStage,
    Controls: ClusterControls,
  }),
  defineLesson({
    n: 6,
    id: 'neural-network',
    family: 'nn',
    icon: 'network',
    title: { en: 'Watch a neural network learn', bn: 'নিউরাল নেটওয়ার্ককে শিখতে দেখুন' },
    short: { en: 'Neural network', bn: 'নিউরাল নেটওয়ার্ক' },
    summary: {
      en: 'Change the numbers inside a neuron, train it on three examples, and see why a hidden layer helps. Continue to TensorFlow Playground for free play.',
      bn: 'নিউরনের ভেতরের সংখ্যা বদলান, তিনটি উদাহরণ দিয়ে প্রশিক্ষণ দিন এবং মাঝের স্তর কীভাবে কাজে লাগে দেখুন। নিজের মতো পরীক্ষা করতে TensorFlow Playground-এ যান।',
    },
    stageCaption: { en: 'Neural networks with basic arithmetic', bn: 'সহজ পাটিগণিত দিয়ে নিউরাল নেটওয়ার্ক' },
    content: {
      how: {
        en: 'A neuron multiplies inputs by weights and adds the results with a bias. Some neurons then apply a rule to that total. Here, the two hidden units turn on at different totals and pass their results to the output.',
        bn: 'নিউরন ইনপুটগুলোকে গুণক দিয়ে গুণ করে, তারপর বায়াসসহ ফলগুলো যোগ করে। কিছু নিউরন যোগফলের ওপর একটি নিয়ম প্রয়োগ করে। এখানে মাঝের দুটি ইউনিট আলাদা যোগফলে সক্রিয় হয় এবং তাদের ফল আউটপুটে পাঠায়।',
      },
      breakIt: {
        en: 'One straight line cannot put both circles on one side and both squares on the other. Use Apply to try the divider, then turn on the two hidden units.',
        bn: 'একটি সরলরেখা দিয়ে দুইটি বৃত্তকে এক পাশে এবং দুইটি বর্গকে অন্য পাশে রাখা যায় না। প্রয়োগ ধাপে রেখাটি ঘোরান, তারপর মাঝের দুটি ইউনিট চালু করুন।',
      },
      notes: {
        en: 'Ask someone to guess the output before moving a slider. The trainer searches nearby weights; the crew network uses hand-set weights to make its arithmetic easy to inspect. TensorFlow Playground opens online.',
        bn: 'স্লাইডার সরানোর আগে কাউকে আউটপুট অনুমান করতে বলুন। প্রশিক্ষণে কাছাকাছি গুণক যাচাই করা হয়। দল পাঠানোর উদাহরণে হিসাব সহজে বোঝাতে গুণক হাতে ঠিক করা হয়েছে। TensorFlow Playground অনলাইনে খোলে।',
      },
    },
    steps: neuralSteps,
    Stage: NeuralStage,
    Controls: NeuralControls,
  }),
  defineLesson({
    n: 7,
    id: 'image-recogniser',
    family: 'dl',
    icon: 'camera',
    title: { en: 'Train an image recogniser with the webcam', bn: 'ওয়েবক্যাম দিয়ে ছবি চেনার মডেল তৈরি' },
    short: { en: 'Image recogniser', bn: 'ছবি চেনা' },
    summary: {
      en: 'See how pixels, 3×3 CNN filters and transfer learning sort organic, plastic and paper waste — then break it with dim light, tray bias and unseen metal, and continue in Google Teachable Machine.',
      bn: 'পিক্সেল, ৩×৩ সিএনএন ফিল্টার ও ট্রান্সফার লার্নিং কীভাবে জৈব, প্লাস্টিক ও কাগজ বর্জ্য আলাদা করে তা দেখুন—তারপর কম আলো, ট্রের পক্ষপাত ও অদেখা ধাতব ক্যানে মডেল ভেঙে Google Teachable Machine-এ সরাসরি তৈরি করুন।',
    },
    stageCaption: {
      en: 'Waste sorter · pixels → CNN → transfer learning',
      bn: 'বর্জ্য বাছাই · পিক্সেল → সিএনএন → ট্রান্সফার লার্নিং',
    },
    references: VISION_REFERENCES,
    content: {
      how: {
        en: 'A camera turns light into RGB pixel numbers. Pre-trained CNN filters slide 3×3 windows across those pixels to extract edges, gloss and colour (a frozen backbone trained on millions of photos). Only the tiny 3-class waste head (21 weights) is trained on your organic, plastic and paper samples.',
        bn: 'ক্যামেরা আলোকে আরজিবি পিক্সেল সংখ্যায় বদলে দেয়। আগে থেকেই লক্ষ লক্ষ ছবিতে শেখা সিএনএন ফিল্টারগুলো ৩×৩ জানালা ঘুরিয়ে ধার, চকচকে ভাব ও রঙ বের করে (স্থির ব্যাকবোন)। আপনার জৈব, প্লাস্টিক ও কাগজের নমুনা দিয়ে শুধু ছোট ৩-শ্রেণির হেডটি (২১টি গুণক) শেখানো হয়।',
      },
      breakIt: {
        en: 'Dim the lights, put a banana peel on a blue plastic-training tray, or feed an unseen aluminum can. Because softmax always sums to 100% across its three bins, the model stays highly confident even when completely wrong.',
        bn: 'আলো কমিয়ে দিন, নীল ট্রেতে কলার খোসা রাখুন বা অদেখা অ্যালুমিনিয়াম ক্যান দিন। সফটম্যাক্স সবসময় তিন বিনে ১০০% ভাগ করে বলে পুরোপুরি ভুল হলেও মডেল অত্যন্ত আত্মবিশ্বাসী থাকে।',
      },
      notes: {
        en: 'High confidence is not correctness. Run the interactive conveyor & transfer-learning lab offline first, then open Google Teachable Machine for a live webcam rehearsal in the actual room lighting.',
        bn: 'উচ্চ আত্মবিশ্বাস মানেই সঠিকতা নয়। প্রথমে অফলাইনে কনভেয়ার ও ট্রান্সফার লার্নিং ল্যাবটি চালান, তারপর ঘরের আসল আলোতে সরাসরি অনুশীলনের জন্য Google Teachable Machine খুলুন।',
      },
    },
    steps: visionSteps,
    Stage: VisionStage,
    Controls: VisionControls,
  }),
  defineLesson({
    n: 8,
    alternative: '8b',
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
        bn: 'এজেন্ট প্রতিটি রাস্তার সারি দেখে, সবুজ রাখবে না বদলাবে তা বাছে, এবং কম অপেক্ষমাণ গাড়ির জন্য পুরস্কার পায়। অনেকবার চালানোর পর সে শেখে কোন সিদ্ধান্তে লাভ।',
      },
      breakIt: {
        en: 'Train on morning traffic, then test on evening traffic. The learned policy no longer fits.',
        bn: 'সকালের যানবাহনে শেখান, তারপর সন্ধ্যার যানবাহনে পরীক্ষা করুন। শেখা কৌশল আর খাপ খায় না।',
      },
      notes: {
        en: 'The safety shield sits outside the agent: minimum green and all-red are engineered, not learned.',
        bn: 'নিরাপত্তার সুরক্ষা এজেন্টের বাইরে থাকে: ন্যূনতম সবুজ ও সবদিকে লাল প্রকৌশল দিয়ে ঠিক করা, শেখা নয়।',
      },
    },
    steps: trafficSteps,
    Stage: TrafficStage,
    Controls: TrafficPanelControls,
  }),
  defineLesson({
    n: '8b',
    alternative: 8,
    id: 'waste-collection-robot',
    family: 'rl',
    icon: 'robot',
    title: { en: 'Waste-collection robot (Q-learning)', bn: 'বর্জ্য সংগ্রহের রোবট (Q-learning)' },
    short: { en: 'Waste robot', bn: 'বর্জ্য সংগ্রহের রোবট' },
    summary: {
      en: 'Drive a robot on a small ward map, then train it to find a charging detour and bring the waste back to the depot.',
      bn: 'ওয়ার্ডের ছোট মানচিত্রে রোবট চালান। তারপর চার্জারের কাছে ঘুরে বর্জ্য ডিপোতে ফেরত আনার কৌশল শেখান।',
    },
    stageCaption: { en: 'Ward map · Robot and charger', bn: 'ওয়ার্ডের মানচিত্র · রোবট ও চার্জার' },
    content: {
      how: {
        en: 'The robot sees its position, remaining battery and whether it carries waste. It updates a table of action values from each experience. Recharging costs a turn, but makes the delivery reward possible.',
        bn: 'রোবট তার অবস্থান, অবশিষ্ট চার্জ ও বর্জ্য আছে কি না দেখে। প্রতিটি অভিজ্ঞতা থেকে চালগুলোর মানের সারণি বদলায়। চার্জ দিতে একটি চাল লাগে, কিন্তু তাতে বর্জ্য জমা দিয়ে পুরস্কার পাওয়া সম্ভব হয়।',
      },
      breakIt: {
        en: 'Change the starting battery in the comparison and replay the same learned policy. Training always starts with five units.',
        bn: 'তুলনার সময় শুরুর চার্জ বদলে একই শেখা কৌশল আবার চালান। প্রশিক্ষণে সব সময় পাঁচ ইউনিট চার্জ দিয়ে শুরু হয়।',
      },
      notes: {
        en: 'Let someone try the direct trip first. Ask what makes charging worthwhile when it earns no points on its own.',
        bn: 'প্রথমে একজনকে সরাসরি পথে যেতে দিন। চার্জ দিলে পয়েন্ট পাওয়া যায় না, তবু চার্জ দেওয়া কেন কাজে লাগে তা জানতে চান।',
      },
    },
    steps: robotSteps,
    Stage: RobotStage,
    Controls: RobotPanelControls,
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
        bn: 'একটি লেখায় কোন শব্দের পরে কোন শব্দ আসে গুনুন, তারপর গণনাকে সম্ভাবনায় রূপ দিন। কম সম্ভাব্য শব্দ কতবার বাছা হবে, টেম্পারেচার তা ঠিক করে।',
      },
      breakIt: {
        en: 'Raise the temperature. Unlikely words start to win and the sentences ramble.',
        bn: 'টেম্পারেচার বাড়ান। কম সম্ভাব্য শব্দ জিততে শুরু করে এবং বাক্যগুলো এলোমেলো হয়ে যায়।',
      },
      notes: {
        en: 'Run the audience guessing game first, then show that the model does the same thing with counts.',
        bn: 'প্রথমে দর্শকদের অনুমানের খেলাটি চালান, তারপর দেখান যে মডেলও গণনা দিয়ে একই কাজ করে।',
      },
    },
    steps: nextWordSteps,
    Stage: NextWordStage,
    Controls: NextWordControls,
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
        bn: 'তিনটি পদ্ধতি একই আলাদা রাখা বাংলা অভিযোগ বণ্টন করে: কীওয়ার্ড নিয়ম, একটি নাইভ বেইজ ক্লাসিফায়ার, এবং ইচ্ছা হলে একটি লোকাল ভাষা মডেল।',
      },
      breakIt: {
        en: 'Add Banglish spellings. Rules miss them, Naive Bayes copes partly, and a language model copes best but is slower and harder to explain.',
        bn: 'Banglish বানান যোগ করুন। নিয়ম সেগুলো ধরতে পারে না, নাইভ বেইজ আংশিক পারে, আর ভাষা মডেল সবচেয়ে ভালো পারে কিন্তু ধীর ও ব্যাখ্যা করা কঠিন।',
      },
      notes: {
        en: 'Close the session here: the most sophisticated AI is not always the most appropriate one.',
        bn: 'সেশন এখানে শেষ করুন: সবচেয়ে উন্নত এআই সবসময় সবচেয়ে উপযুক্ত নয়।',
      },
    },
    steps: rightAiSteps,
    Stage: RightAiStage,
    Controls: RightAiControls,
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
        bn: 'মডেল ফাইল হলো সংখ্যার একটি বিশাল টেবিল। এটি চালানো মানে অনেক ছোট ছোট গুণ, আর একটি GPU একই মুহূর্তে হাজারটি গুণ করে।',
      },
      breakIt: {
        en: 'Follow a citizen complaint to a cloud model and to a city server. Where does the personal data end up in each case?',
        bn: 'একটি নাগরিক অভিযোগকে ক্লাউড মডেলে আর সিটি সার্ভারে পাঠিয়ে দেখুন। প্রতিটি ক্ষেত্রে ব্যক্তিগত তথ্য কোথায় গিয়ে পৌঁছায়?',
      },
      notes: {
        en: 'Use the self-hosting part with IT staff. Skip the CUDA detail for a general audience.',
        bn: 'সেল্ফ-হোস্টিংয়ের অংশটি আইটি কর্মীদের সাথে ব্যবহার করুন। সাধারণ দর্শকের জন্য CUDA-র খুঁটিনাটি বাদ দিন।',
      },
    },
    steps: llmGuideSteps,
    Stage: LlmGuideStage,
    Controls: LlmGuideControls,
  }),
  defineLesson({
    n: 13,
    alternative: 14,
    id: 'drain-sensors',
    family: 'iot',
    icon: 'sensor',
    title: {
      en: 'Smart drain sensors: noisy streams & early flood warning',
      bn: 'স্মার্ট ড্রেন সেন্সর: নয়েজি ডেটা ও আগাম জলাবদ্ধতা সতর্কতা',
    },
    short: { en: 'Drain sensors', bn: 'ড্রেন সেন্সর' },
    summary: {
      en: 'Clean noisy ultrasonic water-level and rain streams, train a 30-minute flood forecaster, and test mud, blackouts and VIP-only sensor bias.',
      bn: 'নয়েজি আল্ট্রাসনিক ও বৃষ্টির ডেটা পরিষ্কার করুন, ৩০ মিনিট আগের পূর্বাভাস মডেল শেখান, এবং কাদা, নেটওয়ার্ক বন্ধ ও পক্ষপাতদুষ্ট সেন্সর বসানো পরীক্ষা করুন।',
    },
    stageCaption: {
      en: 'Canal & drain telemetry · time-series AI',
      bn: 'খাল ও ড্রেন টেলিমেট্রি · টাইম-সিরিজ এআই',
    },
    references: IOT_REFERENCES,
    content: {
      how: {
        en: 'A median filter drops single-tick splash echoes, a moving window computes 15-minute rise speed, and a linear time-series model combines drain level, upstream canal surge and rainfall to predict water depth 30 minutes ahead.',
        bn: 'মিডিয়ান ফিল্টার ১ বারের ছিটার স্পাইক বাদ দেয়, চলমান উইন্ডো ১৫ মিনিটে পানি বাড়ার গতি মাপে, আর একটি টাইম-সিরিজ মডেল ড্রেনের উচ্চতা, উজানের ঢল ও বৃষ্টি মিলিয়ে ৩০ মিনিট পরের গভীরতা অনুমান করে।',
      },
      breakIt: {
        en: 'Cover the sensor with mud (flatline), cut storm 4G packets, or install sensors only on VIP avenues. Without sensor-health checks, local Edge triggers and equitable placement, a “Smart City” dashboard misleads.',
        bn: 'সেন্সরে কাদা লাগিয়ে পাঠ স্থির করে দিন, ঝড়ে ইন্টারনেট বিচ্ছিন্ন করুন বা শুধু ভিআইপি সড়কে সেন্সর বসান। স্বাস্থ্য যাচাই, লোকাল এজ ট্রিগার ও ন্যায্য স্থাপন ছাড়া “স্মার্ট সিটি” ড্যাশবোর্ড বিভ্রান্ত করে।',
      },
      notes: {
        en: 'Connect directly back to Lesson 3: sensors avoid citizen reporting delays, yet placement bias and unmaintained hardware recreate the exact same blind spots.',
        bn: 'সরাসরি পাঠ ৩-এর সাথে মিলিয়ে দেখান: সেন্সর নাগরিক অভিযোগের বিলম্ব কমায় ঠিকই, কিন্তু ভুল জায়গায় বসানো বা রক্ষণাবেক্ষণহীন সেন্সর একই অন্ধত্ব ফিরিয়ে আনে।',
      },
    },
    steps: drainSensorSteps,
    Stage: DrainSensorStage,
    Controls: DrainSensorControls,
  }),
  defineLesson({
    n: 14,
    alternative: 13,
    id: 'pump-edge-ai',
    family: 'iot',
    icon: 'wave',
    title: {
      en: 'Stormwater pump health: vibration sensing & Edge AI',
      bn: 'পাম্পের স্বাস্থ্য নির্ণয়: ভাইব্রেশন সেন্সর ও এজ এআই',
    },
    short: { en: 'Pump Edge AI', bn: 'পাম্প এজ এআই' },
    summary: {
      en: 'Turn 200 Hz vibration waves (or your live microphone) into frequency bands, run an 80-byte fault detector on a microcontroller, and compare Edge vs Cloud IoT.',
      bn: '২০০ Hz কম্পন তরঙ্গকে (বা সরাসরি মাইক্রোফোনকে) ফ্রিকোয়েন্সি ব্যান্ডে রূপ দিন, মাইক্রোকন্ট্রোলারে ৮০-বাইটের ত্রুটি নির্ণায়ক চালান এবং এজ বনাম ক্লাউড আইওটি তুলনা করুন।',
    },
    stageCaption: {
      en: 'Waveform → spectrum → 80-byte Edge AI',
      bn: 'তরঙ্গ → স্পেকট্রাম → ৮০-বাইট এজ এআই',
    },
    references: IOT_REFERENCES,
    content: {
      how: {
        en: 'A Fourier transform splits each 0.64-second vibration window into low hum, mid turbulence and high metallic rattle. Four class centroids (20 numbers, 80 bytes) spot early bearing wear even when total loudness barely changes.',
        bn: 'ফুরিয়ার ট্রান্সফর্ম প্রতি ০.৬৪ সেকেন্ডের কম্পনকে নিচু গুনগুন, মাঝারি ঘূর্ণি ও উচ্চ ধাতব ঘর্ষণে ভাগ করে। চারটি শ্রেণির কেন্দ্র (২০টি সংখ্যা, ৮০ বাইট) মোট শব্দ প্রায় না বাড়লেও আগাম বিয়ারিং ক্ষয় ধরে ফেলে।',
      },
      breakIt: {
        en: 'Drive a heavy truck past the pump house or bake a cheap sensor in a 45 °C tin shed. Single-window unnormalized models trigger false alarms until persistence debouncing and ratio normalization are enabled.',
        bn: 'পাম্পঘরের পাশ দিয়ে ভারী ট্রাক চালান বা ৪৫°সে টিনশেডের গরম যোগ করুন। পরপর যাচাই ও অনুপাত নরমালাইজেশন ছাড়া সাধারণ মডেল ভুয়া সতর্কতা বাজায়।',
      },
      notes: {
        en: 'Click “Try live mic sensor” on a laptop to let participants hum (low band) and tap the desk (high band) and watch real physical waves turn into features offline.',
        bn: 'ল্যাপটপে “সরাসরি মাইক সেন্সর” চালিয়ে অংশগ্রহণকারীদের গুনগুন করতে (নিচু ব্যান্ড) ও টেবিলে টোকা দিতে (উচ্চ ব্যান্ড) বলুন—যাতে সবাই বাস্তব তরঙ্গ থেকে বৈশিষ্ট্য বের হওয়া সরাসরি দেখে।',
      },
    },
    steps: pumpEdgeSteps,
    Stage: PumpEdgeStage,
    Controls: PumpEdgeControls,
  }),
];

export function getLesson(n: LessonNumber): Lesson | undefined {
  return LESSONS.find((l) => l.n === n);
}
