/*
 * Facts and examples for lesson 12 (models, GPUs, hosting, open models for cities).
 * Generated from the legacy llm-concepts.js. Pairs are [English, Bangla]; <b> marks emphasis.
 */
export const MODELS = [
  {
    id: '1.5b',
    label: '1.5B',
    b: 1.5,
    layers: 28,
    cols: 4,
    rows: 5,
    en: 'Tiny · Quick sorting & simple tasks',
    bn: 'ক্ষুদ্র · দ্রুত বাছাই ও সহজ কাজ',
  },
  {
    id: '3b',
    label: '3B',
    b: 3,
    layers: 36,
    cols: 5,
    rows: 5,
    en: 'Small · Runs on normal office laptops',
    bn: 'ছোট · সাধারণ অফিস ল্যাপটপেই চলে',
  },
  {
    id: '8b',
    label: '8B',
    b: 8,
    layers: 32,
    cols: 6,
    rows: 6,
    en: 'Standard · Sweet spot for 1 GPU PC',
    bn: 'স্ট্যান্ডার্ড · ১টি GPU পিসির জন্য সেরা',
  },
  {
    id: '32b',
    label: '32B',
    b: 32,
    layers: 64,
    cols: 7,
    rows: 7,
    en: 'Strong · Great Bangla & policy drafting',
    bn: 'শক্তিশালী · চমৎকার বাংলা ও খসড়া লেখা',
  },
  {
    id: '70b',
    label: '70B',
    b: 70,
    layers: 80,
    cols: 8,
    rows: 8,
    en: 'Department · Needs multi-GPU server',
    bn: 'বিভাগীয় · একাধিক GPU সার্ভার লাগে',
  },
  {
    id: '405b',
    label: '405B+',
    b: 405,
    layers: 126,
    cols: 9,
    rows: 8,
    en: 'Frontier · Giant cloud GPU cluster',
    bn: 'ফ্রন্টিয়ার · বিশাল ক্লাউড GPU ক্লাস্টার',
  },
];

export const QUANTS = [
  {
    id: 'fp16',
    label: 'FP16 (16-bit)',
    bits: 16,
    bytesPerParam: 2.0,
    sample: '0.14285714',
    en: 'Full precision · Largest file, used in training',
    bn: 'পূর্ণ সূক্ষ্মতা · সবচেয়ে বড় ফাইল, প্রশিক্ষণে ব্যবহৃত',
  },
  {
    id: 'q8',
    label: 'Q8 (8-bit)',
    bits: 8,
    bytesPerParam: 1.05,
    sample: '0.143',
    en: 'Half the memory · Practically identical quality',
    bn: 'অর্ধেক মেমোরি · মান প্রায় একই থাকে',
  },
  {
    id: 'q4',
    label: 'Q4_K_M (4-bit)',
    bits: 4,
    bytesPerParam: 0.62,
    sample: '0.14',
    en: 'Popular self-hosted choice · ~70% smaller, ~97% quality',
    bn: 'জনপ্রিয় সেল্ফ-হোস্টেড পছন্দ · ~৭০% ছোট, ~৯৭% মান',
  },
];

export const ANATOMY = [
  {
    id: 'cuda-cores',
    icon: '⚡',
    title: ['CUDA Cores', 'CUDA কোর'],
    sub: ['Parallel math workers', 'সমান্তরাল গণনাকারী'],
    body: [
      'Each CUDA core is a small arithmetic calculator inside an NVIDIA GPU. While a strong CPU has 8–16 cores, a single GPU like an RTX 4090 has <b>16,384 CUDA cores</b> working side by side — turning minutes of AI math into milliseconds.',
      'প্রতিটি CUDA কোর হলো NVIDIA GPU-এর ভেতরের একটি ছোট ক্যালকুলেটর। শক্তিশালী CPU-তে যেখানে ৮–১৬টি কোর থাকে, সেখানে RTX 4090-এর মতো একটি GPU-তেই <b>১৬,৩৮৪টি CUDA কোর</b> একসাথে কাজ করে — মিনিটের কাজ মিলিসেকেন্ডে নামিয়ে আনে।',
    ],
    metric: ['RTX 4090: 16,384 cores · H100: 14,592+', 'RTX 4090: ১৬,৩৮৪ কোর · H100: ১৪,৫৯২+'],
  },
  {
    id: 'tensor-cores',
    icon: '🧮',
    title: ['Tensor Cores', 'টেনসর কোর'],
    sub: ['AI matrix turbochargers', 'এআই ম্যাট্রিক্স টার্বো'],
    body: [
      'Modern GPUs add specialized <b>Tensor Cores</b> alongside CUDA cores. Instead of multiplying two single numbers at a time, one Tensor Core multiplies entire <b>4×4 or 8×8 grids of numbers in one clock tick</b> — built specifically for deep learning and LLMs.',
      'আধুনিক GPU-তে CUDA কোরের পাশাপাশি বিশেষ <b>টেনসর কোর</b> থাকে। একবারে দুটি সংখ্যা গুণ করার বদলে একটি টেনসর কোর <b>এক মুহূর্তেই পুরো ৪×৪ বা ৮×৮ সংখ্যার টেবিল</b> গুণ করে ফেলে — বিশেষভাবে ডিপ লার্নিং ও LLM-এর জন্য তৈরি।',
    ],
    metric: [
      'Up to 8× faster than CUDA cores alone on FP16/FP8',
      'FP16/FP8-এ শুধু CUDA কোরের চেয়ে ৮ গুণ পর্যন্ত দ্রুত',
    ],
  },
  {
    id: 'vram',
    icon: '🗄️',
    title: ['VRAM (GPU Memory)', 'VRAM (GPU মেমোরি)'],
    sub: ['The #1 bottleneck for LLMs', 'LLM-এর সবচেয়ে বড় সীমা'],
    body: [
      '<b>VRAM is the #1 number to check when buying an AI computer.</b> The entire model file must sit inside VRAM right next to the CUDA cores. VRAM moves data at <b>500–3,000 GB/s</b> (10× faster than normal laptop RAM). If a model spills out of VRAM, speed collapses.',
      '<b>এআই কম্পিউটার কেনার সময় সবচেয়ে আগে VRAM দেখুন।</b> পুরো মডেল ফাইলটিকে CUDA কোরের ঠিক পাশের VRAM-এ থাকতে হয়। VRAM-এর গতি <b>৫০০–৩,০০০ GB/সেকেন্ড</b> (সাধারণ RAM-এর ১০ গুণ)। মডেল VRAM-এ না আঁটলে গতি মারাত্মকভাবে কমে যায়।',
    ],
    metric: ['16 GB → 8B–14B · 24 GB → 32B · 80 GB → 70B', '১৬ GB → ৮B–১৪B · ২৪ GB → ৩২B · ৮০ GB → ৭০B'],
  },
  {
    id: 'cuda-sw',
    icon: '🔌',
    title: ['CUDA Software Platform', 'CUDA সফটওয়্যার প্ল্যাটফর্ম'],
    sub: ['The bridge to AI apps', 'এআই অ্যাপের সেতু'],
    body: [
      'CUDA is not just hardware — it is NVIDIA’s software layer that lets AI tools (PyTorch, Ollama, vLLM, llama.cpp) send work directly to GPU cores. AMD (ROCm) and Apple Silicon (Metal) have alternatives, though CUDA remains the widest standard in servers.',
      'CUDA শুধু হার্ডওয়্যার নয় — এটি NVIDIA-র সফটওয়্যার প্ল্যাটফর্ম, যার মাধ্যমে PyTorch, Ollama বা vLLM সরাসরি GPU কোর ব্যবহার করে। AMD (ROCm) ও Apple Silicon (Metal)-এরও বিকল্প আছে, তবে সার্ভারে CUDA সবচেয়ে প্রচলিত।',
    ],
    metric: ['Used by PyTorch, vLLM, Ollama, llama.cpp', 'PyTorch, vLLM, Ollama, llama.cpp-এ ব্যবহৃত'],
  },
];

export const SIM_PROMPTS = [
  {
    id: 'sensitive',
    sensitive: true,
    label: [
      '🔒 Sensitive: Ward 14 complaints + citizen phones',
      '🔒 গোপনীয়: ১৪ নং ওয়ার্ডের অভিযোগ ও নাগরিকের ফোন নম্বর',
    ],
    text: [
      'Summarize Ward 14 drainage complaints with citizen names & phone numbers.',
      '১৪ নং ওয়ার্ডের ড্রেনেজ অভিযোগগুলো নাগরিকের নাম ও ফোন নম্বরসহ সারাংশ করো।',
    ],
  },
  {
    id: 'public',
    sensitive: false,
    label: ['🌐 Public: Draft a dengue awareness notice', '🌐 সাধারণ: ডেঙ্গু সচেতনতা নোটিশের খসড়া'],
    text: [
      'Draft a short public Bangla notice for Friday dengue awareness drive.',
      'শুক্রবার ডেঙ্গু সচেতনতা অভিযানের জন্য বাংলায় সংক্ষিপ্ত নোটিশ লেখো।',
    ],
  },
];

export const CIVIC_CATS = [
  { id: 'all', en: 'All Models', bn: 'সব মডেল' },
  { id: 'chat', en: '💬 Bangla Chat & Drafting', bn: '💬 বাংলা চ্যাট ও খসড়া' },
  { id: 'vision', en: '👁️ Vision & Document OCR', bn: '👁️ ছবি ও ডকুমেন্ট OCR' },
  { id: 'rag', en: '🔍 Document Search (RAG)', bn: '🔍 ডকুমেন্ট সার্চ (RAG)' },
  { id: 'voice', en: '🎙️ Hotline Voice-to-Text', bn: '🎙️ হটলাইন ভয়েস-টু-টেক্সট' },
  { id: 'fast', en: '⚡ Small & Laptop-Ready', bn: '⚡ ছোট ও ল্যাপটপ-বান্ধব' },
];

export const CIVIC_MODELS = [
  {
    name: 'Qwen 2.5 / Qwen 3',
    maker: 'Alibaba · Apache 2.0',
    sizes: '7B · 14B · 32B',
    cats: ['chat', 'fast'],
    bangla: 92,
    vramLabel: '6–22 GB',
    vramPct: 55,
    desc: [
      'One of the strongest open-source families for Bangla + English drafting, complaint triage, and extracting clean tables/JSON from messy citizen messages.',
      'বাংলা ও ইংরেজি খসড়া লেখা, অভিযোগ বাছাই এবং অগোছালো নাগরিক বার্তা থেকে সুন্দর টেবিল/JSON তৈরিতে অন্যতম সেরা ওপেন-সোর্স মডেল।',
    ],
    uses: [
      ['Draft bilingual public notices & meeting minutes', 'বাংলা-ইংরেজি নোটিশ ও সভার কার্যবিবরণীর খসড়া'],
      ['Classify citizen complaints into wards & departments', 'নাগরিকের অভিযোগ ওয়ার্ড ও বিভাগে বণ্টন'],
      ['Answer holding-tax & trade-license FAQs with RAG', 'RAG দিয়ে হোল্ডিং কর ও ট্রেড লাইসেন্সের উত্তর'],
    ],
  },
  {
    name: 'Gemma 3',
    maker: 'Google · Open Weights',
    sizes: '4B · 12B · 27B',
    cats: ['chat', 'vision', 'fast'],
    bangla: 90,
    vramLabel: '4–18 GB',
    vramPct: 45,
    desc: [
      'Strong multilingual & Bangla understanding plus built-in Vision! One single model can read both citizen text and uploaded photos or scanned forms.',
      'চমৎকার বহুভাষিক ও বাংলা বোঝার ক্ষমতার সাথে বিল্ট-ইন ভিশন! একটি মডেলেই নাগরিকের লেখা ও আপলোড করা ছবি/ফর্ম দুটোই পড়া যায়।',
    ],
    uses: [
      ['Read citizen photos of broken streetlights or waterlogging', 'ভাঙা সড়কবাতি বা জলাবদ্ধতার ছবি বিশ্লেষণ'],
      ['Summarize Bangla PDF circulars on a single GPU PC', 'একটি GPU পিসিতেই বাংলা PDF সার্কুলার সারাংশ'],
      ['Run 4B version offline on ward-office laptops', '৪বি সংস্করণ ওয়ার্ড অফিসের ল্যাপটপে অফলাইনে চালানো'],
    ],
  },
  {
    name: 'Qwen2.5-VL (Vision-Language)',
    maker: 'Alibaba · Apache 2.0',
    sizes: '7B · 72B',
    cats: ['vision'],
    bangla: 86,
    vramLabel: '6–12 GB',
    vramPct: 40,
    desc: [
      'Specialized vision model that excels at OCR — turning photographed paper applications, tax receipts, and field inspection photos into structured digital records.',
      'বিশেষায়িত ভিশন ও OCR মডেল — ছবি তোলা কাগজের আবেদনপত্র, কর রসিদ ও মাঠ পরিদর্শনের ছবিকে ডিজিটাল ডেটায় রূপান্তর করে।',
    ],
    uses: [
      [
        'Digitize scanned trade licenses & birth-registration forms',
        'স্ক্যান করা ট্রেড লাইসেন্স ও জন্মনিবন্ধন ফর্ম ডিজিটাইজ',
      ],
      ['Verify waste-collection & road-repair field photos', 'বর্জ্য সংগ্রহ ও রাস্তা মেরামতের মাঠের ছবি যাচাই'],
      ['Extract data from printed Bangla/English tables', 'মুদ্রিত বাংলা/ইংরেজি টেবিল থেকে তথ্য বের করা'],
    ],
  },
  {
    name: 'BGE-M3 (Multilingual Embeddings)',
    maker: 'BAAI · MIT License',
    sizes: '0.6B (~1.2 GB)',
    cats: ['rag', 'fast'],
    bangla: 94,
    vramLabel: '~1.2 GB',
    vramPct: 12,
    desc: [
      'Not a chatbot — a tiny, ultra-fast search brain! It converts City Corporation Acts, bylaws, and circulars (Bangla & English) into meaning-based vectors so your LLM cites real rules.',
      'এটি চ্যাটবট নয় — একটি ক্ষুদ্র ও অতি-দ্রুত সার্চ ইঞ্জিন! এটি সিটি আইন ও সার্কুলারকে ভেক্টরে রূপান্তর করে, যাতে LLM আসল ধারা উল্লেখ করে উত্তর দেয়।',
    ],
    uses: [
      ['Power a zero-hallucination City Rules & Circular search', 'ভুল তথ্যহীন সিটি আইন ও সার্কুলার সার্চ তৈরি'],
      [
        'Match Bangla citizen questions to English policy PDFs',
        'বাংলা প্রশ্নের সাথে ইংরেজি নীতিমালার মিল খোঁজা',
      ],
      ['Find duplicate citizen complaints across wards', 'বিভিন্ন ওয়ার্ডের একই ধরনের পুনরাবৃত্ত অভিযোগ শনাক্ত'],
    ],
  },
  {
    name: 'Whisper Large-v3-Turbo',
    maker: 'OpenAI · MIT License',
    sizes: '0.8B (~3 GB)',
    cats: ['voice', 'fast'],
    bangla: 88,
    vramLabel: '~3 GB',
    vramPct: 20,
    desc: [
      'Open-source speech-to-text model that listens to Bangla and English voice recordings and converts them to accurate text completely offline.',
      'ওপেন-সোর্স স্পিচ-টু-টেক্সট মডেল, যা সম্পূর্ণ অফলাইনে বাংলা ও ইংরেজি ভয়েস রেকর্ড শুনে নির্ভুল লেখায় রূপান্তর করে।',
    ],
    uses: [
      [
        'Transcribe 333 / City Hotline voice complaints into tickets',
        'সিটি হটলাইনের ভয়েস অভিযোগকে লিখিত টিকেটে রূপান্তর',
      ],
      [
        'Auto-transcribe council & ward coordination meetings',
        'কাউন্সিল ও ওয়ার্ড সমন্বয় সভার অডিও থেকে লেখা তৈরি',
      ],
      ['Let citizens submit voice messages instead of typing', 'লেখার বদলে ভয়েস মেসেজে নাগরিক অভিযোগ গ্রহণ'],
    ],
  },
  {
    name: 'Llama 3.1 / 3.3',
    maker: 'Meta · Llama Community License',
    sizes: '8B · 70B',
    cats: ['chat'],
    bangla: 76,
    vramLabel: '6–45 GB',
    vramPct: 72,
    desc: [
      'Widely supported open-weights model with huge tooling ecosystem. Great for English policy reports, coding internal dashboards, and reliable API tool-calling.',
      'ব্যাপকভাবে ব্যবহৃত ওপেন-ওয়েটস মডেল। ইংরেজি নীতিমালা বিশ্লেষণ, অভ্যন্তরীণ ড্যাশবোর্ড কোডিং এবং সফটওয়্যার টুল-কলিংয়ে অত্যন্ত দক্ষ।',
    ],
    uses: [
      [
        'Analyze English donor reports & tender specifications',
        'ইংরেজি দাতা সংস্থার প্রতিবেদন ও টেন্ডার ডকুমেন্ট বিশ্লেষণ',
      ],
      ['Generate SQL queries for internal MIS dashboards', 'অভ্যন্তরীণ MIS ডেটাবেসের জন্য SQL কোয়েরি লেখা'],
      ['Connect to ticketing APIs via structured tool calling', 'সফটওয়্যার API-এর মাধ্যমে স্বয়ংক্রিয় টিকেট তৈরি'],
    ],
  },
  {
    name: 'DeepSeek-R1-Distill (Qwen-14B / 32B)',
    maker: 'DeepSeek · MIT License',
    sizes: '14B · 32B',
    cats: ['chat'],
    bangla: 84,
    vramLabel: '10–22 GB',
    vramPct: 58,
    desc: [
      'A step-by-step "thinking" model that shows its reasoning chain before answering — ideal for auditing numbers, budget checks, and comparing complex clauses.',
      'ধাপে ধাপে "চিন্তা করা" মডেল, যা উত্তর দেওয়ার আগে যুক্তির ধাপগুলো দেখায় — বাজেট হিসাব, অডিট ও জটিল শর্ত যাচাইয়ের জন্য দারুণ।',
    ],
    uses: [
      ['Cross-check ward budget spreadsheets & anomalies', 'ওয়ার্ড বাজেটের হিসাব ও অসঙ্গতি যাচাই'],
      [
        'Compare contractor bids against checklist criteria',
        'ঠিকাদারদের দরপত্রের শর্তাবলি চেকলিস্টের সাথে মেলানো',
      ],
      ['Transparent reasoning trail for officer review', 'কর্মকর্তার যাচাইয়ের জন্য স্পষ্ট যুক্তির ধাপ প্রদর্শন'],
    ],
  },
  {
    name: 'Qwen 2.5 (3B) / Phi-4-mini',
    maker: 'Alibaba / Microsoft · Open',
    sizes: '3B–3.8B',
    cats: ['fast', 'chat'],
    bangla: 78,
    vramLabel: '2.5–3 GB',
    vramPct: 16,
    desc: [
      'Ultra-compact models designed to run right on ordinary office laptops without buying a GPU — fast for routing, tagging, and quick offline assistance.',
      'অতি-ছোট মডেল, যা আলাদা GPU ছাড়াই সাধারণ অফিস ল্যাপটপে চলে — দ্রুত অভিযোগ ট্যাগিং ও অফলাইন সহায়তার জন্য উপযোগী।',
    ],
    uses: [
      ['Offline complaint tagging at field / ward offices', 'ওয়ার্ড অফিসে অফলাইনে অভিযোগ ট্যাগ করা'],
      [
        'Quick grammar cleanup & Banglish-to-Bangla normalization',
        'দ্রুত বানান ঠিক করা ও Banglish থেকে বাংলা রূপান্তর',
      ],
      [
        'Zero-budget pilot demos (like Experiment 11!)',
        'কোনো বাড়তি বাজেট ছাড়াই পাইলট পরীক্ষা (পরীক্ষা ১১-এর মতো!)',
      ],
    ],
  },
];

export const HW_OPTS = [
  {
    id: 'laptop',
    vram: 6,
    en: 'Standard Office Laptop (16 GB RAM, No dedicated GPU)',
    bn: 'সাধারণ অফিস ল্যাপটপ (১৬ GB RAM, আলাদা GPU নেই)',
  },
  {
    id: 'workstation',
    vram: 24,
    en: 'Single GPU Workstation (e.g., RTX 4090 / 3090 · 24 GB VRAM)',
    bn: '১টি GPU ওয়ার্কস্টেশন (যেমন RTX 4090 / 3090 · ২৪ GB VRAM)',
  },
  {
    id: 'server',
    vram: 96,
    en: 'Department AI Server (2× 48 GB L40S / A100 · 96 GB VRAM)',
    bn: 'বিভাগীয় এআই সার্ভার (২× ৪৮ GB GPU · ৯৬ GB VRAM)',
  },
  {
    id: 'hybrid',
    vram: 24,
    en: 'Hybrid (1 Local 24 GB GPU + Cloud API for public tasks)',
    bn: 'হাইব্রিড (১টি নিজস্ব ২৪ GB GPU + সাধারণ কাজের জন্য ক্লাউড API)',
  },
];

export const USE_OPTS = [
  {
    id: 'helpdesk',
    en: 'Bangla Citizen Helpdesk & City Circular Search (RAG)',
    bn: 'বাংলা নাগরিক সহায়তা ও সিটি সার্কুলার সার্চ (RAG)',
  },
  {
    id: 'complaints',
    en: 'Complaint Auto-Routing & Hotline Voice-to-Ticket',
    bn: 'অভিযোগ স্বয়ংক্রিয় বণ্টন ও হটলাইন ভয়েস-টু-টিকেট',
  },
  { id: 'ocr', en: 'Scanned Forms OCR & Field Photo Inspection', bn: 'স্ক্যান করা ফর্ম OCR ও মাঠের ছবি যাচাই' },
  {
    id: 'drafting',
    en: 'Internal Bilingual Notice Drafting & Budget/Policy Review',
    bn: 'বাংলা-ইংরেজি নোটিশ খসড়া ও বাজেট/নীতিমালা পর্যালোচনা',
  },
];
