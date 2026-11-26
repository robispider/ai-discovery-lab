import type { Bi } from '../i18n';
import { lesson } from './smartCityProjects';
import type { ProjectEntry, ProjectLink } from './smartCityReferences';

export const NVIDIA_REFERENCE_GROUPS = [
  { id: 'projects', title: { en: 'Project ideas', bn: 'প্রকল্পের ধারণা' } },
  { id: 'cases', title: { en: 'Real-world case studies', bn: 'বাস্তব প্রয়োগের উদাহরণ' } },
  { id: 'models', title: { en: 'Models and checkpoints', bn: 'মডেল ও চেকপয়েন্ট' } },
  { id: 'stack', title: { en: 'Technology stack', bn: 'প্রযুক্তি স্ট্যাক' } },
] as const;

const source = (en: string, url: string): ProjectLink => ({ label: { en }, url });

const refs = {
  traffic: source('TrafficCamNet', 'https://catalog.ngc.nvidia.com/orgs/nvidia/tao/models/trafficcamnet/-'),
  dash: source('DashCamNet', 'https://catalog.ngc.nvidia.com/orgs/nvidia/tao/models/dashcamnet/-'),
  people: source('PeopleNet', 'https://catalog.ngc.nvidia.com/orgs/nvidia/tao/models/peoplenet/-'),
  dino: source(
    'TAO Grounding DINO',
    'https://catalog.ngc.nvidia.com/orgs/nvidia/tao/models/grounding_dino/-',
  ),
  tft: source(
    'Electricity checkpoint for TFT',
    'https://catalog.ngc.nvidia.com/orgs/nvidia/-/models/tft_pyt_ckpt_base_eletricity_amp/-',
  ),
  cosmos: source('Cosmos 3 Nano Reasoner', 'https://build.nvidia.com/nvidia/cosmos3-nano-reasoner/modelcard'),
  fourcast: source(
    'FourCastNet 3',
    'https://catalog.ngc.nvidia.com/orgs/nvidia/earth-2/models/fourcastnet3/-',
  ),
  corrdiff: source('CorrDiff', 'https://docs.nvidia.com/nim/earth-2/corrdiff/latest/overview.html'),
  corrdiffTaiwan: source(
    'CorrDiff Taiwan checkpoint',
    'https://nvidia.github.io/earth2studio/main/modules/generated/models/dx/CorrDiffTaiwan/',
  ),
  deepstream: source('DeepStream documentation', 'https://docs.nvidia.com/deepstream'),
  compatibility: source(
    'DeepStream and JetPack compatibility',
    'https://docs.nvidia.com/deepstream/text/DS_Installation',
  ),
  analytics: source(
    'DeepStream line-crossing analytics',
    'https://docs.nvidia.com/deepstream/9.2/text/DS_plugin_gst-nvdsanalytics',
  ),
  tracker: source(
    'DeepStream tracker',
    'https://docs.nvidia.com/metropolis/deepstream/9.0/text/DS_plugin_gst-nvtracker.html',
  ),
  metropolis: source(
    'NVIDIA Metropolis for smart cities',
    'https://www.nvidia.com/en-us/industries/smart-cities-and-spaces/',
  ),
  tao: source(
    'TAO deployment guide',
    'https://docs.nvidia.com/tao/tao-toolkit/latest/text/tao_deploy/tao_deploy_overview.html',
  ),
  tensorrt: source(
    'TensorRT documentation',
    'https://docs.nvidia.com/deeplearning/tensorrt/latest/index.html',
  ),
  triton: source('Triton Inference Server repository', 'https://github.com/triton-inference-server/server'),
  cuopt: source('cuOpt repository', 'https://github.com/NVIDIA/cuopt'),
  ortools: source(
    'OR-Tools routing example',
    'https://github.com/google/or-tools/blob/stable/ortools/constraint_solver/samples/cvrptw_break.py',
  ),
  rdd: source('RDD2022 road-damage dataset', 'https://github.com/sekilab/RoadDamageDetector'),
  pytorch: source(
    'NVIDIA Deep Learning Examples',
    'https://github.com/NVIDIA/DeepLearningExamples#time-series-forecasting',
  ),
  vss: source(
    'Video Search and Summarization repository',
    'https://github.com/NVIDIA-AI-Blueprints/video-search-and-summarization',
  ),
  blueprint: source(
    'NVIDIA Smart City AI Blueprint',
    'https://docs.nvidia.com/vss/vision-agent/agent-workflows/industry-specific-examples/smart-city-blueprint/introduction-to-the-nvidia-smart-city-ai-blueprint',
  ),
  nim: source(
    'NIM offerings and software terms',
    'https://docs.nvidia.com/nim/large-language-models/about-nim-llm/nim-offerings',
  ),
  aiNvr: source('AI NVR sample', 'https://docs.nvidia.com/moj/setup/ai-nvr.html'),
  jps: source('Jetson Platform Services', 'https://docs.nvidia.com/jetson/jps/'),
  vst: source('Video Storage Toolkit', 'https://docs.nvidia.com/jetson/jps/vst/VST_Overview.html'),
  earth: source('Earth2Studio repository', 'https://github.com/NVIDIA/earth2studio'),
  swmm: source(
    'EPA Storm Water Management Model',
    'https://www.epa.gov/water-research/storm-water-management-model-swmm',
  ),
  omniverse: source('Omniverse libraries', 'https://docs.nvidia.com/omniverse/'),
  synthetic: source(
    'OpenUSD traffic simulation and synthetic data',
    'https://developer.nvidia.com/blog/developing-smart-city-traffic-management-systems-with-openusd-and-synthetic-data/',
  ),
  kaohsiung: source(
    'NVIDIA Linker Vision case study',
    'https://www.nvidia.com/en-in/customer-stories/linker-vision-ai-smart-city-solutions/',
  ),
  cna: source(
    'Kaohsiung AI Lighthouse coverage from CNA',
    'https://www.cna.com.tw/news/aloc/202610290216.aspx',
  ),
  nota: source(
    'NVIDIA Nota case study',
    'https://developer.nvidia.com/blog/metropolis-spotlight-nota-is-transforming-traffic-management-systems-with-ai/',
  ),
  greyparrot: source('NVIDIA Greyparrot case study', 'https://developer.nvidia.com/blog/?p=94421'),
};

type Group = (typeof NVIDIA_REFERENCE_GROUPS)[number]['id'];
type Entry = Omit<ProjectEntry, 'tag' | 'category'>;

function entry(
  id: string,
  title: Bi,
  summary: Bi,
  icon: ProjectEntry['icon'],
  family: ProjectEntry['family'],
  ...links: Entry['links']
): Entry {
  return { id, title, summary, icon, family, links };
}

const entries: Record<Group, Entry[]> = {
  projects: [
    entry(
      'junction-count',
      { en: 'Count vehicles at a junction', bn: 'মোড়ে যানবাহন গণনা' },
      {
        en: 'Run TrafficCamNet on a fixed-camera clip with DeepStream, TensorRT, tracking and line-crossing analytics. Compare with a manual count and check rickshaws and three-wheelers in local footage.',
        bn: 'স্থির ক্যামেরার ভিডিওতে TrafficCamNet, DeepStream, TensorRT, ট্র্যাকিং ও রেখা পার হওয়ার হিসাব ব্যবহার করুন। হাতে গোনা সংখ্যার সঙ্গে মিলিয়ে দেখুন এবং স্থানীয় ভিডিওতে রিকশা ও তিন চাকার যান আলাদাভাবে যাচাই করুন।',
      },
      'signal',
      'dl',
      refs.analytics,
      refs.traffic,
      refs.dash,
      refs.tracker,
      refs.compatibility,
      lesson(8),
    ),
    entry(
      'road-damage',
      { en: 'Map potholes and road damage', bn: 'গর্ত ও সড়কের ক্ষতি মানচিত্রে দেখান' },
      {
        en: 'Start with TAO Grounding DINO, RDD2022 and local road labels. Export through ONNX to TensorRT and DeepStream, then map reviewed detections.',
        bn: 'TAO Grounding DINO, RDD2022 ও চিহ্নিত স্থানীয় সড়কচিত্র দিয়ে শুরু করুন। ONNX হয়ে TensorRT ও DeepStream-এ চালান এবং যাচাই করা সড়কক্ষতি মানচিত্রে দেখান।',
      },
      'route',
      'dl',
      refs.dino,
      refs.rdd,
      refs.tao,
    ),
    entry(
      'waste-routes',
      { en: 'Optimize waste-collection routes', bn: 'বর্জ্য সংগ্রহের রুট উন্নয়ন' },
      {
        en: 'Compare cuOpt and OR-Tools on the same stops, vehicle capacities and collection windows. Measure route length, missed stops and solving time.',
        bn: 'একই স্টপ, গাড়ির ধারণক্ষমতা ও সংগ্রহের সময়সীমা দিয়ে cuOpt ও OR-Tools তুলনা করুন। রুটের দৈর্ঘ্য, বাদ পড়া স্টপ ও হিসাবের সময় মাপুন।',
      },
      'route',
      'classical',
      refs.cuopt,
      refs.ortools,
      lesson(1),
    ),
    entry(
      'electricity',
      { en: 'Forecast electricity demand', bn: 'বিদ্যুতের চাহিদার পূর্বাভাস' },
      {
        en: 'Use NVIDIA’s PyTorch Temporal Fusion Transformer example with historical meter readings. Check the forecast against actual demand and the same hour last week.',
        bn: 'পুরোনো মিটার রিডিংয়ের সঙ্গে NVIDIA-এর PyTorch Temporal Fusion Transformer উদাহরণ ব্যবহার করুন। প্রকৃত চাহিদা এবং আগের সপ্তাহের একই ঘণ্টার সঙ্গে ফল মিলিয়ে দেখুন।',
      },
      'wave',
      'nn',
      refs.tft,
      refs.pytorch,
    ),
    entry(
      'video-search',
      { en: 'Search and summarize traffic video', bn: 'ট্রাফিক ভিডিও খোঁজা ও সংক্ষেপ করা' },
      {
        en: 'Use the Smart City AI Blueprint, VSS and Cosmos 3 Nano Reasoner on a GPU server. Search a recorded clip for a blocked lane and verify the timestamps and summary against the footage.',
        bn: 'GPU সার্ভারে Smart City AI Blueprint, VSS ও Cosmos 3 Nano Reasoner ব্যবহার করুন। ভিডিওতে আটকে থাকা লেন খুঁজে সময় ও সারাংশ মূল ভিডিওর সঙ্গে মিলিয়ে দেখুন।',
      },
      'camera',
      'dl',
      refs.blueprint,
      refs.vss,
      refs.cosmos,
    ),
    entry(
      'occupancy',
      { en: 'Count occupancy at a public facility', bn: 'জনসেবাকেন্দ্রে উপস্থিতি গণনা' },
      {
        en: 'Connect a camera to the Jetson AI NVR sample. Use the Video Storage Toolkit, DeepStream and PeopleNet to produce aggregate entrance or queue counts.',
        bn: 'Jetson AI NVR নমুনার সঙ্গে ক্যামেরা যুক্ত করুন। Video Storage Toolkit, DeepStream ও PeopleNet দিয়ে প্রবেশদ্বার বা সারির মোট সংখ্যা হিসাব করুন।',
      },
      'camera',
      'dl',
      refs.aiNvr,
      refs.people,
      refs.vst,
      refs.jps,
    ),
    entry(
      'rain-drainage',
      { en: 'Simulate rainfall and drainage', bn: 'বৃষ্টি ও পানি নিষ্কাশনের সিমুলেশন' },
      {
        en: 'Evaluate FourCastNet 3 and CorrDiff weather inputs with Earth2Studio, local rainfall records and an EPA SWMM drainage model. Validate regional checkpoints against Bangladesh observations.',
        bn: 'Earth2Studio, স্থানীয় বৃষ্টির রেকর্ড ও EPA SWMM নিষ্কাশন মডেলের সঙ্গে FourCastNet 3 ও CorrDiff থেকে পাওয়া আবহাওয়ার উপাত্ত যাচাই করুন। বাংলাদেশের পর্যবেক্ষণ দিয়ে আঞ্চলিক চেকপয়েন্ট যাচাই করুন।',
      },
      'sensor',
      'iot',
      refs.earth,
      refs.fourcast,
      refs.corrdiff,
      refs.corrdiffTaiwan,
      refs.swmm,
      lesson(13),
    ),
    entry(
      'digital-twin',
      { en: 'Build a digital twin of one junction', bn: 'একটি মোড়ের ডিজিটাল টুইন তৈরি' },
      {
        en: 'Use Omniverse with OpenUSD or the blueprint’s CARLA workflow. Vary the weather and camera angles in a junction simulation and test a detector on the resulting scenes.',
        bn: 'Omniverse ও OpenUSD অথবা ব্লুপ্রিন্টের CARLA পদ্ধতি ব্যবহার করুন। মোড়ের সিমুলেশনে আবহাওয়া ও ক্যামেরার কোণ বদলে দৃশ্যগুলোতে শনাক্তকরণ পরীক্ষা করুন।',
      },
      'cluster',
      'nn',
      refs.synthetic,
      refs.omniverse,
      refs.blueprint,
    ),
  ],
  cases: [
    entry(
      'kaohsiung',
      { en: 'Kaohsiung AI Lighthouse, Taiwan', bn: 'কাওশিয়ুং এআই লাইটহাউস, তাইওয়ান' },
      {
        en: 'Kaohsiung, NVIDIA, Linker Vision and partners demonstrated traffic management, road inspection, water monitoring and environmental maintenance. NVIDIA’s case describes Omniverse, Cosmos Reason and VSS.',
        bn: 'কাওশিয়ুং, NVIDIA, Linker Vision ও অংশীদারেরা যান চলাচল, সড়ক পরিদর্শন, পানি পর্যবেক্ষণ এবং পরিবেশ রক্ষণাবেক্ষণের প্রয়োগ দেখিয়েছে। NVIDIA-এর বিবরণে Omniverse, Cosmos Reason ও VSS রয়েছে।',
      },
      'cluster',
      'iot',
      refs.kaohsiung,
      refs.cna,
      refs.vss,
    ),
    entry(
      'nota',
      { en: 'Nota intelligent intersection, South Korea', bn: 'নোটার বুদ্ধিমান ট্রাফিক মোড়, দক্ষিণ কোরিয়া' },
      {
        en: 'Nota used DeepStream at an intersection in Pyeongtaek to count vehicles, estimate queues and support real-time signal control.',
        bn: 'নোটা পিয়ংটেকের একটি মোড়ে যানবাহন গণনা, সারি অনুমান ও তাৎক্ষণিক সংকেত নিয়ন্ত্রণে DeepStream ব্যবহার করেছে।',
      },
      'signal',
      'rl',
      refs.nota,
      refs.analytics,
      lesson(8),
    ),
    entry(
      'greyparrot',
      { en: 'Greyparrot Analyzer for recycling facilities', bn: 'পুনর্ব্যবহার কেন্দ্রে Greyparrot Analyzer' },
      {
        en: 'Greyparrot uses cameras and an object detector to identify materials on recycling conveyor belts. NVIDIA reports that the system runs local inference on an RTX 4060.',
        bn: 'Greyparrot পুনর্ব্যবহারের বেল্টে উপাদান চিনতে ক্যামেরা ও বস্তু শনাক্তকরণ ব্যবহার করে। NVIDIA-এর তথ্য অনুযায়ী RTX 4060-তে স্থানীয়ভাবে মডেল চলে।',
      },
      'robot',
      'dl',
      refs.greyparrot,
      lesson(7),
    ),
  ],
  models: [
    entry(
      'trafficcamnet',
      { en: 'TrafficCamNet' },
      {
        en: 'Detects cars, people, road signs and two-wheelers. Pair it with tracking and line-crossing logic for counts.',
        bn: 'গাড়ি, মানুষ, সড়কচিহ্ন ও দুই চাকার যান শনাক্ত করে। ট্র্যাকিং ও রেখা পার হওয়ার হিসাবের সঙ্গে ব্যবহার করুন।',
      },
      'signal',
      'dl',
      refs.traffic,
      refs.analytics,
    ),
    entry(
      'dashcamnet',
      { en: 'DashCamNet' },
      {
        en: 'Detects cars, people, bicycles and road signs in a vehicle-camera workflow.',
        bn: 'গাড়ির ক্যামেরার ভিডিওতে গাড়ি, মানুষ, সাইকেল ও সড়কচিহ্ন শনাক্ত করতে ব্যবহার করা যায়।',
      },
      'camera',
      'dl',
      refs.dash,
    ),
    entry(
      'peoplenet',
      { en: 'PeopleNet' },
      {
        en: 'Object detector with person, bag and face classes. Use the person class for aggregate occupancy counts.',
        bn: 'মানুষ, ব্যাগ ও মুখের শ্রেণি রয়েছে। উপস্থিতির মোট সংখ্যা গণনায় মানুষ শ্রেণিটি ব্যবহার করুন।',
      },
      'camera',
      'dl',
      refs.people,
      refs.aiNvr,
    ),
    entry(
      'grounding-dino',
      { en: 'TAO Grounding DINO' },
      {
        en: 'Text-guided object detector with NVIDIA weights for transfer learning. The linked checkpoint uses the NVIDIA Open Model License.',
        bn: 'লেখা দিয়ে কী শনাক্ত করতে হবে বলা যায়। ট্রান্সফার লার্নিংয়ের জন্য NVIDIA-এর চেকপয়েন্টটি NVIDIA Open Model License-এর অধীন।',
      },
      'camera',
      'dl',
      refs.dino,
      refs.tao,
    ),
    entry(
      'tft',
      { en: 'Temporal Fusion Transformer' },
      {
        en: 'PyTorch time-series forecasting example with an electricity-trained checkpoint for comparison or adaptation.',
        bn: 'সময়ভিত্তিক পূর্বাভাসের PyTorch উদাহরণ। বিদ্যুতের উপাত্তে প্রশিক্ষিত চেকপয়েন্ট তুলনা বা অভিযোজনে ব্যবহার করা যায়।',
      },
      'wave',
      'nn',
      refs.tft,
      refs.pytorch,
    ),
    entry(
      'cosmos',
      { en: 'Cosmos 3 Nano Reasoner' },
      {
        en: 'Vision-language model used in the Smart City AI Blueprint for video understanding.',
        bn: 'ভিডিওর বিষয়বস্তু বুঝতে Smart City AI Blueprint-এ ব্যবহৃত ভিশন-ল্যাঙ্গুয়েজ মডেল।',
      },
      'network',
      'dl',
      refs.cosmos,
      refs.blueprint,
    ),
    entry(
      'fourcastnet',
      { en: 'FourCastNet 3' },
      {
        en: 'Global weather forecasting model. The NVIDIA model card lists Apache 2.0.',
        bn: 'বিশ্বব্যাপী আবহাওয়ার পূর্বাভাসের মডেল। NVIDIA মডেল কার্ডে Apache 2.0 উল্লেখ আছে।',
      },
      'wave',
      'nn',
      refs.fourcast,
      refs.earth,
    ),
    entry(
      'corrdiff',
      { en: 'CorrDiff' },
      {
        en: 'Weather downscaling to obtain finer spatial detail. Review geographic coverage and the terms of the specific weights and container.',
        bn: 'আরও সূক্ষ্ম স্থানিক আবহাওয়ার উপাত্ত তৈরির মডেল। নির্দিষ্ট চেকপয়েন্ট ও কনটেইনারের অঞ্চল ও ব্যবহারের শর্ত দেখুন।',
      },
      'wave',
      'nn',
      refs.corrdiff,
      refs.corrdiffTaiwan,
      refs.earth,
    ),
  ],
  stack: [
    entry(
      'metropolis',
      { en: 'NVIDIA Metropolis' },
      {
        en: 'NVIDIA’s vision AI ecosystem for smart spaces, including edge video analytics and city-scale examples.',
        bn: 'স্মার্ট স্থানে প্রান্তিক ভিডিও বিশ্লেষণ ও শহরজুড়ে প্রয়োগের NVIDIA ভিশন এআই ব্যবস্থা।',
      },
      'camera',
      'dl',
      refs.metropolis,
      refs.deepstream,
      refs.blueprint,
    ),
    entry(
      'deepstream',
      { en: 'DeepStream, tracking and analytics' },
      {
        en: 'Build camera pipelines for detection, object tracking, regions of interest and line crossings.',
        bn: 'ক্যামেরায় বস্তু শনাক্তকরণ, ট্র্যাকিং, নির্দিষ্ট অঞ্চল ও রেখা পার হওয়ার হিসাবের পাইপলাইন তৈরি করুন।',
      },
      'camera',
      'dl',
      refs.deepstream,
      refs.tracker,
      refs.analytics,
    ),
    entry(
      'jetson',
      { en: 'Jetson and JetPack compatibility' },
      {
        en: 'Use the support matrix to match the target Jetson hardware, JetPack release and DeepStream SDK version.',
        bn: 'Jetson হার্ডওয়্যার, JetPack রিলিজ ও DeepStream SDK সংস্করণ মিলিয়ে নিতে সামঞ্জস্যের ছক দেখুন।',
      },
      'chip',
      'iot',
      refs.compatibility,
      refs.jps,
    ),
    entry(
      'tao-tensorrt',
      { en: 'TAO, ONNX and TensorRT' },
      {
        en: 'Fine-tune computer vision models with TAO, export ONNX and build optimized inference with TensorRT.',
        bn: 'TAO দিয়ে ভিশন মডেল ফাইন-টিউন করুন, ONNX-এ এক্সপোর্ট করে TensorRT দিয়ে চালান।',
      },
      'network',
      'dl',
      refs.tao,
      refs.tensorrt,
      refs.deepstream,
    ),
    entry(
      'triton',
      { en: 'Triton Inference Server' },
      {
        en: 'Shared model serving for a GPU server or edge system. The linked server repository uses BSD-3-Clause.',
        bn: 'GPU সার্ভার বা এজ সিস্টেমে মডেল চালানোর সেবা। লিংকে দেওয়া সার্ভার রিপোজিটরি BSD-3-Clause ব্যবহার করে।',
      },
      'chip',
      'nn',
      refs.triton,
    ),
    entry(
      'vss',
      { en: 'Video Search and Summarization (VSS)' },
      {
        en: 'Reference stack for video search, visual questions and summaries, with a smart-city workflow.',
        bn: 'ভিডিও খোঁজা, ছবি-ভিডিও নিয়ে প্রশ্ন ও সারাংশের রেফারেন্স স্ট্যাক। এতে স্মার্ট সিটির কাজের উদাহরণও আছে।',
      },
      'camera',
      'dl',
      refs.vss,
      refs.blueprint,
      refs.cosmos,
    ),
    entry(
      'jetson-services',
      { en: 'Jetson Platform Services, VST and AI NVR' },
      {
        en: 'Edge video reference stack covering camera discovery, streaming, storage and local analytics.',
        bn: 'ক্যামেরা খোঁজা, স্ট্রিমিং, সংরক্ষণ ও স্থানীয় বিশ্লেষণের এজ ভিডিও রেফারেন্স স্ট্যাক।',
      },
      'sensor',
      'iot',
      refs.jps,
      refs.vst,
      refs.aiNvr,
    ),
    entry(
      'cuopt',
      { en: 'cuOpt and OR-Tools comparison' },
      {
        en: 'cuOpt is a GPU-accelerated optimization engine under Apache 2.0. The linked OR-Tools example provides a routing comparison with capacities and time windows.',
        bn: 'cuOpt হলো Apache 2.0-এর অধীন GPU-ভিত্তিক অপ্টিমাইজেশন ইঞ্জিন। ধারণক্ষমতা ও সময়সীমাসহ রুট তুলনার জন্য OR-Tools উদাহরণ দেওয়া আছে।',
      },
      'route',
      'classical',
      refs.cuopt,
      refs.ortools,
    ),
    entry(
      'pytorch-examples',
      { en: 'NVIDIA PyTorch forecasting examples' },
      {
        en: 'Training and evaluation examples for forecasting, including the Temporal Fusion Transformer.',
        bn: 'Temporal Fusion Transformer-সহ পূর্বাভাস মডেলের প্রশিক্ষণ ও মূল্যায়নের উদাহরণ।',
      },
      'wave',
      'nn',
      refs.pytorch,
      refs.tft,
    ),
    entry(
      'earth2studio',
      { en: 'Earth2Studio and EPA SWMM' },
      {
        en: 'Earth2Studio provides weather-model workflows. EPA SWMM models urban stormwater and drainage with local network data.',
        bn: 'Earth2Studio-তে আবহাওয়া মডেল চালানোর পদ্ধতি আছে। EPA SWMM স্থানীয় নেটওয়ার্কের উপাত্ত দিয়ে বৃষ্টির পানি ও নিষ্কাশনের সিমুলেশন করে।',
      },
      'sensor',
      'iot',
      refs.earth,
      refs.swmm,
      refs.corrdiff,
    ),
    entry(
      'omniverse-openusd',
      { en: 'Omniverse, OpenUSD and CARLA' },
      {
        en: 'Linked examples show how to build digital twins and use synthetic traffic scenes to train or test detectors.',
        bn: 'লিংকের উদাহরণে ডিজিটাল টুইন তৈরি এবং কৃত্রিম ট্রাফিক দৃশ্য দিয়ে শনাক্তকারী মডেল শেখানো বা পরীক্ষা করা দেখানো হয়েছে।',
      },
      'cluster',
      'nn',
      refs.omniverse,
      refs.synthetic,
      refs.blueprint,
    ),
    entry(
      'licensing',
      { en: 'NIM, AI Enterprise and licensing' },
      {
        en: 'Check code, weights and container terms separately. Examples include Apache 2.0 for cuOpt and the NVIDIA Open Model License for TAO Grounding DINO. NIM Certified Production Branch requires an active NVIDIA AI Enterprise subscription.',
        bn: 'কোড, মডেলের ওয়েট ও কনটেইনারের শর্ত আলাদা করে দেখুন। cuOpt-এর Apache 2.0 ও TAO Grounding DINO-এর NVIDIA Open Model License উদাহরণ। NIM Certified Production Branch-এর জন্য সক্রিয় NVIDIA AI Enterprise সাবস্ক্রিপশন লাগে।',
      },
      'rules',
      'classical',
      refs.nim,
      refs.cuopt,
      refs.dino,
    ),
  ],
};

export const NVIDIA_REFERENCES: ProjectEntry[] = NVIDIA_REFERENCE_GROUPS.flatMap(({ id, title }) =>
  entries[id].map((item) => ({ ...item, category: id, tag: title })),
);
