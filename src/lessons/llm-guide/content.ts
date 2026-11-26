/* Rules of thumb for lesson 12, ported from the legacy page. Text pairs are [English, Bangla]. */
import { HW_OPTS } from '../../data/llm';

export type Pair = readonly [string, string];

export interface HardwareFit {
  tier: Pair;
  pct: number;
  heavy: boolean;
  desc: Pair;
}

/** File size on disk ≈ memory needed: parameters × bytes per parameter, plus 15% for the KV cache. */
export const vramFor = (billions: number, bytesPerParam: number) => billions * bytesPerParam * 1.15;

export function hardwareAdvice(gb: number): HardwareFit {
  if (gb <= 4.5)
    return {
      tier: ['Standard Office Laptop (8–16 GB RAM)', 'সাধারণ অফিস ল্যাপটপ (৮–১৬ GB RAM)'],
      pct: Math.min(100, (gb / 48) * 100 + 8),
      heavy: false,
      desc: [
        'Fits easily in normal laptop memory (CPU or integrated GPU). Fast enough for classification and short summaries.',
        'সাধারণ ল্যাপটপের মেমোরিতেই সহজে এঁটে যায়। অভিযোগ শ্রেণিবিন্যাস ও ছোট সারাংশের জন্য যথেষ্ট দ্রুত।',
      ],
    };
  if (gb <= 10)
    return {
      tier: ['Mid-Range GPU PC (12–16 GB VRAM)', 'মাঝারি মানের GPU পিসি (১২–১৬ GB VRAM)'],
      pct: Math.min(100, (gb / 48) * 100 + 12),
      heavy: false,
      desc: [
        'Runs smoothly at 30–60 words/sec on a single desktop GPU (e.g., RTX 4060 Ti 16GB or Mac with 16GB+ unified memory).',
        'একটি ডেস্কটপ GPU-তে (যেমন RTX 4060 Ti 16GB বা 16GB+ Mac) প্রতি সেকেন্ডে ৩০–৬০ শব্দ গতিতে মসৃণভাবে চলে।',
      ],
    };
  if (gb <= 24)
    return {
      tier: ['Single Pro GPU Workstation (24 GB VRAM)', '১টি প্রো GPU ওয়ার্কস্টেশন (২৪ GB VRAM)'],
      pct: Math.min(100, (gb / 48) * 100 + 14),
      heavy: false,
      desc: [
        'Great fit for a City Corporation workstation (e.g., RTX 3090 / 4090 / A5000 24GB). Serves a small team privately.',
        'সিটি কর্পোরেশনের একটি ওয়ার্কস্টেশনের (RTX 3090 / 4090 24GB) জন্য দারুণ। একটি ছোট দল নিরাপদে ব্যবহার করতে পারে।',
      ],
    };
  if (gb <= 80)
    return {
      tier: ['Department AI Server (1–2× 48–80 GB GPUs)', 'বিভাগীয় এআই সার্ভার (১–২টি ৪৮–৮০ GB GPU)'],
      pct: Math.min(100, (gb / 120) * 100 + 16),
      heavy: true,
      desc: [
        'Needs a dedicated rack server GPU (e.g., NVIDIA L40S, A100, or 2× 24GB GPUs). Serves dozens of officers concurrently.',
        'আলাদা র‍্যাক সার্ভার GPU (যেমন NVIDIA L40S, A100 বা ২টি ২৪GB GPU) লাগে। একসাথে অনেক কর্মকর্তা ব্যবহার করতে পারবেন।',
      ],
    };
  return {
    tier: ['Data-Center GPU Cluster (4–8+ H100/B200 GPUs)', 'ডেটা সেন্টার GPU ক্লাস্টার (৪–৮+ H100/B200 GPU)'],
    pct: 100,
    heavy: true,
    desc: [
      'Too huge for a single computer! Only cloud providers or national data centres run models this size.',
      'একটি কম্পিউটারের জন্য অনেক বড়! কেবল ক্লাউড কোম্পানি বা জাতীয় ডেটা সেন্টার এই মাপের মডেল চালায়।',
    ],
  };
}

export type Arch = 'cloud' | 'self' | 'hybrid';

/** The four steps a request takes in each set-up. */
export function archSteps(arch: Arch, sensitive: boolean): [Pair, Pair][] {
  if (arch === 'cloud')
    return [
      [
        ['1. Leaves Office', '১. অফিস থেকে বের হলো'],
        ['Prompt encrypted & sent over public internet.', 'প্রম্পট পাবলিক ইন্টারনেট দিয়ে পাঠানো হলো।'],
      ],
      [
        ['2. API Gateway', '২. API গেটওয়ে'],
        ['Vendor checks API key & counts input tokens.', 'কোম্পানি API কী যাচাই ও টোকেন গণনা করে।'],
      ],
      [
        ['3. Cloud GPU Cluster', '৩. ক্লাউড GPU ক্লাস্টার'],
        ['Prefill + KV cache runs on shared H100 GPUs.', 'শেয়ার্ড H100 GPU-তে উত্তর হিসাব হয়।'],
      ],
      [
        ['4. Streamed Back', '৪. টোকেন ফেরত এলো'],
        ['Words stream back one by one · billed per token.', 'একটি করে শব্দ ফেরত আসে · প্রতি টোকেনে বিল।'],
      ],
    ];
  if (arch === 'self')
    return [
      [
        ['1. Internal LAN', '১. অফিস LAN-এ গেল'],
        ['Stays strictly inside City Hall network.', 'সম্পূর্ণ সিটি কর্পোরেশন নেটওয়ার্কের ভেতরে।'],
      ],
      [
        ['2. Local RAG Lookup', '২. লোকাল RAG সার্চ'],
        ['Searches local City Acts & circulars first.', 'নিজস্ব সিটি আইন ও সার্কুলার থেকে তথ্য খোঁজে।'],
      ],
      [
        ['3. Local GPU Runs', '৩. নিজস্ব GPU চলে'],
        ['Ollama/vLLM computes tokens on city GPU.', 'নিজস্ব GPU-তে Ollama/vLLM উত্তর তৈরি করে।'],
      ],
      [
        ['4. Zero Leak Reply', '৪. নিরাপদ উত্তর'],
        ['Tokens stream to officer · $0 per token.', 'কর্মকর্তার স্ক্রিনে উত্তর আসে · কোনো টোকেন বিল নেই।'],
      ],
    ];
  return sensitive
    ? [
        [
          ['1. Privacy Check', '১. গোপনীয়তা যাচাই'],
          ['Router detects citizen names & phone numbers!', 'রাউটার নাগরিকের নাম ও ফোন নম্বর শনাক্ত করেছে!'],
        ],
        [
          ['2. Blocked from Cloud', '২. ক্লাউড ব্লকড'],
          ['Sensitive prompt kept inside City Firewall.', 'গোপনীয় তথ্য ফায়ারওয়ালের ভেতরে রাখা হলো।'],
        ],
        [
          ['3. Local GPU Runs', '৩. নিজস্ব GPU চলে'],
          ['Self-hosted Qwen/Gemma summarizes safely.', 'সেল্ফ-হোস্টেড মডেল নিরাপদে সারাংশ করে।'],
        ],
        [
          ['4. Compliant Reply', '৪. নিরাপদ উত্তর'],
          ['Citizen privacy 100% protected.', 'নাগরিকের গোপনীয়তা ১০০% সুরক্ষিত।'],
        ],
      ]
    : [
        [
          ['1. Privacy Check', '১. গোপনীয়তা যাচাই'],
          ['No personal data found — public notice.', 'কোনো ব্যক্তিগত তথ্য নেই — সাধারণ নোটিশ।'],
        ],
        [
          ['2. Routed to Cloud', '২. ক্লাউডে পাঠানো হলো'],
          ['Uses top frontier model for polished Bangla.', 'সুন্দর বাংলার জন্য সেরা ক্লাউড মডেল ব্যবহার করে।'],
        ],
        [
          ['3. Cloud GPU Runs', '৩. ক্লাউড GPU চলে'],
          ['Drafts clear civic awareness notice.', 'স্পষ্ট সচেতনতামূলক নোটিশের খসড়া তৈরি করে।'],
        ],
        [
          ['4. Officer Reviews', '৪. কর্মকর্তা যাচাই করেন'],
          ['Human officer edits before publishing.', 'প্রকাশের আগে কর্মকর্তা যাচাই ও সম্পাদনা করেন।'],
        ],
      ];
}

/** What the trace ends with: a privacy warning or reassurance. */
export function privacyNote(arch: Arch, sensitive: boolean): { danger: boolean; text: Pair } {
  if (arch === 'cloud' && sensitive)
    return {
      danger: true,
      text: [
        '⚠️ Privacy warning: citizen names and phone numbers just left the City Corporation building for a third-party cloud server. For sensitive municipal data, use a self-hosted or hybrid set-up.',
        '⚠️ গোপনীয়তা সতর্কতা: নাগরিকের নাম ও ফোন নম্বর সিটি কর্পোরেশন ভবনের বাইরে তৃতীয় পক্ষের ক্লাউড সার্ভারে চলে গেছে! সংবেদনশীল তথ্যের জন্য সেল্ফ-হোস্টেড বা হাইব্রিড ব্যবস্থা ব্যবহার করুন।',
      ],
    };
  if (arch === 'self')
    return {
      danger: false,
      text: [
        '🛡️ 100% data sovereignty: the prompt, city records and answer never touched the public internet. Works even during an internet outage.',
        '🛡️ ১০০% ডেটা সার্বভৌমত্ব: প্রম্পট, সিটি রেকর্ড এবং উত্তর কখনোই পাবলিক ইন্টারনেটে যায়নি। ইন্টারনেট না থাকলেও এটি কাজ করে।',
      ],
    };
  if (arch === 'hybrid')
    return {
      danger: false,
      text: sensitive
        ? [
            '✅ Smart hybrid protection: sensitive citizen data stayed on the self-hosted city GPU automatically.',
            '✅ স্মার্ট হাইব্রিড সুরক্ষা: সংবেদনশীল নাগরিক তথ্য স্বয়ংক্রিয়ভাবে নিজস্ব সিটি GPU-তে থেকেছে।',
          ]
        : [
            '✅ Smart hybrid efficiency: the public notice safely used a frontier cloud model without exposing private records.',
            '✅ স্মার্ট হাইব্রিড দক্ষতা: গোপন তথ্য না থাকায় সাধারণ নোটিশটি নিরাপদে ক্লাউড মডেল দিয়ে তৈরি হয়েছে।',
          ],
    };
  return {
    danger: false,
    text: [
      'ℹ️ Public content only: safe to draft on a cloud GPT service because no private citizen records were included. Still review accuracy before publishing.',
      'ℹ️ শুধু সাধারণ বিষয়বস্তু: ব্যক্তিগত তথ্য না থাকায় ক্লাউড GPT-তে খসড়া করা নিরাপদ। তবুও প্রকাশের আগে তথ্য যাচাই করুন।',
    ],
  };
}

export const HOSTING_COMPARE: [Pair, Pair, Pair][] = [
  [
    ['Citizen Privacy & Sovereignty', 'নাগরিকের গোপনীয়তা ও ডেটা সুরক্ষা'],
    [
      'Data leaves office to vendor servers (check zero-retention enterprise terms).',
      'তথ্য বাইরের সার্ভারে যায় (এন্টারপ্রাইজ শর্ত যাচাই করতে হয়)।',
    ],
    [
      '100% stays inside City Hall / Gov data centre. Zero external leak.',
      '১০০% সিটি ভবন বা সরকারি ডেটা সেন্টারের ভেতরেই থাকে।',
    ],
  ],
  [
    ['Internet Dependency', 'ইন্টারনেট নির্ভরতা'],
    ['Requires reliable broadband internet at all times.', 'সবসময় নিরবচ্ছিন্ন ইন্টারনেট সংযোগ লাগে।'],
    ['Works completely offline on internal office LAN.', 'ইন্টারনেট ছাড়াই অফিসের অভ্যন্তরীণ LAN-এ চলে।'],
  ],
  [
    ['Cost Model', 'খরচের ধরন'],
    [
      'Low upfront cost; ongoing monthly seats or per-token API bill.',
      'শুরুতে কম খরচ; প্রতি মাসে সাবস্ক্রিপশন বা টোকেনপ্রতি বিল।',
    ],
    [
      'Upfront GPU server purchase + electricity; $0 per query afterwards.',
      'শুরুতে GPU সার্ভার ও বিদ্যুৎ খরচ; পরে প্রতি প্রশ্নে খরচ শূন্য।',
    ],
  ],
  [
    ['Quality & Bangla Fluency', 'মান ও বাংলা দক্ষতা'],
    ['Highest frontier intelligence out of the box.', 'শুরু থেকেই সর্বোচ্চ বুদ্ধিমত্তা ও নিখুঁত বাংলা।'],
    [
      'Very strong with 14B–70B open models (Qwen, Gemma), especially with RAG.',
      '১৪B–৭০B ওপেন মডেল (Qwen, Gemma) + RAG দিয়ে অত্যন্ত কার্যকর।',
    ],
  ],
  [
    ['IT Maintenance', 'আইটি রক্ষণাবেক্ষণ'],
    ['Managed entirely by cloud provider.', 'সম্পূর্ণ রক্ষণাবেক্ষণ ক্লাউড কোম্পানি করে।'],
    [
      'City IT team updates models, manages GPU cooling & backups.',
      'সিটি আইটি টিমকে মডেল আপডেট, সার্ভার ও ব্যাকআপ দেখতে হয়।',
    ],
  ],
];

export type HwId = 'laptop' | 'workstation' | 'server' | 'hybrid';
export type UseId = 'helpdesk' | 'complaints' | 'ocr' | 'drafting';

export interface Plan {
  ui: string;
  engine: string;
  model: string;
  extra: string;
  vramNeed: number;
  capacity: number;
  users: Pair;
  tip: Pair;
}

/** A realistic open-source stack for an office's hardware and goal. */
export function plan(hw: HwId, use: UseId): Plan {
  const ui = hw === 'server' ? 'Open WebUI + SSO Login' : 'Open WebUI (Local Browser)';
  const engine = hw === 'server' ? 'vLLM (High-Concurrency)' : 'Ollama (1-Click Setup)';
  const capacity = HW_OPTS.find((x) => x.id === hw)!.vram;
  const users: Pair =
    hw === 'laptop'
      ? ['1 officer (pilot)', '১ জন কর্মকর্তা (পাইলট)']
      : hw === 'server'
        ? ['25–80 concurrent officers', 'একসাথে ২৫–৮০ জন কর্মকর্তা']
        : ['3–12 concurrent officers', 'একসাথে ৩–১২ জন কর্মকর্তা'];
  if (use === 'helpdesk')
    return {
      ui,
      engine,
      capacity,
      users,
      model:
        hw === 'laptop'
          ? 'Qwen 2.5 3B (Q4)'
          : hw === 'server'
            ? 'Qwen 2.5 / 3 32B (Q4/Q8)'
            : 'Qwen 2.5 / 3 14B (Q4)',
      extra: 'BGE-M3 + Local Vector DB (City Acts PDFs)',
      vramNeed: hw === 'laptop' ? 3.5 : hw === 'server' ? 28 : 11.5,
      tip: [
        'Index official holding-tax rules, trade-license fee tables, and ward boundaries with BGE-M3 so every answer quotes the exact circular page.',
        'BGE-M3 দিয়ে হোল্ডিং কর বিধি, ট্রেড লাইসেন্স ফি তালিকা ও ওয়ার্ডের তথ্য যুক্ত করুন — যাতে প্রতিটি উত্তরে আসল সার্কুলারের সূত্র থাকে।',
      ],
    };
  if (use === 'complaints')
    return {
      ui,
      engine,
      capacity,
      users,
      model:
        hw === 'laptop'
          ? 'Qwen 2.5 3B + Whisper Small'
          : hw === 'server'
            ? 'Qwen 2.5 32B + Whisper Large-v3-Turbo'
            : 'Qwen 2.5 14B + Whisper Large-v3-Turbo',
      extra: 'FastAPI Webhook → Complaint Ticket DB',
      vramNeed: hw === 'laptop' ? 4.2 : hw === 'server' ? 26 : 14,
      tip: [
        'Whisper turns Bangla hotline audio into text; Qwen outputs strict JSON (Ward, Department, Urgency). Keep a human dispatcher checking low-confidence tickets!',
        'Whisper বাংলা হটলাইন অডিওকে লেখায় রূপান্তর করে; Qwen ওয়ার্ড, বিভাগ ও জরুরি মাত্রা নির্ধারণ করে। কম নিশ্চিত টিকেটগুলো অবশ্যই মানুষ যাচাই করবেন!',
      ],
    };
  if (use === 'ocr')
    return {
      ui,
      engine,
      capacity,
      users,
      model:
        hw === 'laptop'
          ? 'Gemma 3 4B Vision (Q4)'
          : hw === 'server'
            ? 'Qwen2.5-VL 7B + Gemma 3 27B Vision'
            : 'Qwen2.5-VL 7B or Gemma 3 12B Vision',
      extra: 'PDF-to-Image Scanner + Officer Verification UI',
      vramNeed: hw === 'laptop' ? 4.0 : hw === 'server' ? 28 : 11,
      tip: [
        'Show extracted fields side-by-side with the original scanned form so clerks verify NID numbers and amounts in 5 seconds instead of retyping everything.',
        'স্ক্যান করা মূল ফর্মের পাশে এআই-এর পড়া তথ্য দেখান — যাতে কর্মীরা সব টাইপ না করে মাত্র ৫ সেকেন্ডে NID ও টাকার অঙ্ক যাচাই করতে পারেন।',
      ],
    };
  return {
    ui,
    engine,
    capacity,
    users,
    model:
      hw === 'laptop'
        ? 'Gemma 3 4B (Q4)'
        : hw === 'server'
          ? 'Qwen 3 32B + DeepSeek-R1-Distill 32B'
          : hw === 'hybrid'
            ? 'Local Qwen 14B + Cloud Frontier API'
            : 'Gemma 3 12B + DeepSeek-R1-Distill 14B',
    extra: 'Approved Letter Templates + Audit Log',
    vramNeed: hw === 'laptop' ? 3.5 : hw === 'server' ? 44 : 13,
    tip:
      hw === 'hybrid'
        ? [
            'Keep citizen memos & internal budgets on Local Qwen 14B; route only public-facing speeches/notices to Cloud Frontier models for polished prose.',
            'নাগরিকের নথি ও অভ্যন্তরীণ বাজেট নিজস্ব Qwen 14B-তে রাখুন; কেবল জনসাধারণের নোটিশ বা ভাষণের খসড়ায় ক্লাউড মডেল ব্যবহার করুন।',
          ]
        : [
            'Store approved City Corporation memo templates so the model writes in your exact official tone and Bangla administrative style.',
            'সিটি কর্পোরেশনের অনুমোদিত চিঠির নমুনা যুক্ত রাখুন, যাতে মডেল আপনার অফিসের সঠিক দাপ্তরিক বাংলা শৈলীতে খসড়া তৈরি করে।',
          ],
  };
}

/** Packet waypoints for the request trace. */
export function waypoints(arch: Arch, sensitive: boolean): [number, number][] {
  if (arch === 'cloud') return [[124, 146], [324, 146], [532, 146], [775, 146], [775, 192], [532, 192], [324, 192], [124, 192]];
  if (arch === 'self') return [[118, 135], [350, 135], [598, 135], [598, 250], [598, 135], [350, 168], [118, 168]];
  return sensitive
    ? [[113, 170], [317, 170], [514, 240], [317, 170], [113, 170]]
    : [[113, 170], [317, 170], [520, 96], [769, 96], [520, 96], [317, 170], [113, 170]];
} // prettier-ignore
