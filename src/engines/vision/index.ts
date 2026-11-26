/*
 * Offline computer-vision & transfer-learning engine for Lesson 7 (Waste Recogniser).
 * Synthesizes 10×10 RGB pixel mosaics for illustrated waste items, runs real 3×3 convolution
 * kernels for visual inspection, extracts a 6-feature transfer-learning embedding (also
 * compatible with live browser webcam frames), and trains a 3-class softmax classifier head.
 */
import type { Bi } from '../../i18n';

export type WasteClass = 'organic' | 'plastic' | 'paper';
export type TrueWasteKind = WasteClass | 'metal';

export const WASTE_CLASSES: readonly WasteClass[] = ['organic', 'plastic', 'paper'];

export type KernelId = 'vertical' | 'horizontal' | 'shine' | 'organic';

export type LightingMode = 'daylight' | 'dim-yellow' | 'glare';
export type BackgroundMode = 'belt' | 'blue-tray' | 'wood-table';

export interface CameraCondition {
  lighting: LightingMode;
  background: BackgroundMode;
  autoWhiteBalance: boolean;
  shortcutBias: boolean;
}

export const DEFAULT_CONDITION: CameraCondition = {
  lighting: 'daylight',
  background: 'belt',
  autoWhiteBalance: false,
  shortcutBias: false,
};

export interface WasteItem {
  id: string;
  name: Bi;
  trueClass: TrueWasteKind;
  split: 'train' | 'eval' | 'break';
  /** Base 6-feature visual embedding [organicHue, paperWarmth, specularShine, crispEdges, curvedContour, printTexture] */
  baseFeatures: readonly [number, number, number, number, number, number];
  /** Primary & accent RGB colors for the 10×10 pixel mosaic synthesis */
  palette: {
    main: [number, number, number];
    accent: [number, number, number];
    highlight: [number, number, number];
  };
  shape: 'curved' | 'bottle' | 'bag' | 'box' | 'sheet' | 'cup' | 'can' | 'leaf';
  note: Bi;
}

export const FEATURE_NAMES: readonly { key: string; label: Bi }[] = [
  { key: 'organicHue', label: { en: 'Green / organic hue', bn: 'সবুজ ও জৈব রঙ' } },
  { key: 'paperWarmth', label: { en: 'Brown / fiber warmth', bn: 'বাদামী ও কাগজের আঁশ' } },
  { key: 'specularShine', label: { en: 'Specular shine / gloss', bn: 'চকচকে প্রতিফলন' } },
  { key: 'crispEdges', label: { en: 'Crisp straight edges', bn: 'সোজা ও কোণাকৃতি ধার' } },
  { key: 'curvedContour', label: { en: 'Curved / organic shape', bn: 'বাঁকানো ও জৈব আকার' } },
  { key: 'printTexture', label: { en: 'Paper grain & print', bn: 'কাগজের টেক্সচার ও ছাপা' } },
];

export const WASTE_ITEMS: readonly WasteItem[] = [
  // ---- Training pool (12 items: 4 per class) ----
  {
    id: 'banana',
    name: { en: 'Banana peel', bn: 'কলার খোসা' },
    trueClass: 'organic',
    split: 'train',
    baseFeatures: [0.84, 0.28, 0.14, 0.12, 0.92, 0.16],
    palette: { main: [226, 196, 52], accent: [122, 92, 36], highlight: [176, 196, 62] },
    shape: 'curved',
    note: { en: 'Curved yellow-green peel with dark spots', bn: 'বাঁকানো হলুদ-সবুজ খোসা ও গাঢ় দাগ' },
  },
  {
    id: 'mango',
    name: { en: 'Mango skin', bn: 'আমের খোসা' },
    trueClass: 'organic',
    split: 'train',
    baseFeatures: [0.78, 0.24, 0.22, 0.16, 0.86, 0.14],
    palette: { main: [124, 178, 56], accent: [232, 162, 42], highlight: [176, 212, 82] },
    shape: 'curved',
    note: { en: 'Green-gold fruit peel with soft curve', bn: 'সবুজ-সোনালি ফলের খোসা ও বাঁকানো প্রান্ত' },
  },
  {
    id: 'veg-scraps',
    name: { en: 'Vegetable scraps', bn: 'সবজির খোসা' },
    trueClass: 'organic',
    split: 'train',
    baseFeatures: [0.93, 0.18, 0.1, 0.15, 0.82, 0.24],
    palette: { main: [64, 152, 68], accent: [106, 178, 72], highlight: [152, 206, 114] },
    shape: 'leaf',
    note: { en: 'Leafy green kitchen trimmings', bn: 'সবুজ শাকসবজির কাটা অংশ' },
  },
  {
    id: 'tea-leaves',
    name: { en: 'Wet tea leaves', bn: 'ভেজা চা পাতা' },
    trueClass: 'organic',
    split: 'train',
    baseFeatures: [0.72, 0.36, 0.12, 0.1, 0.78, 0.32],
    palette: { main: [78, 112, 54], accent: [104, 82, 48], highlight: [118, 146, 78] },
    shape: 'leaf',
    note: { en: 'Dark organic clump with irregular edges', bn: 'গাঢ় জৈব স্তূপ ও অনিয়মিত কিনারা' },
  },
  {
    id: 'pet-bottle',
    name: { en: 'PET water bottle', bn: 'পানির প্লাস্টিক বোতল' },
    trueClass: 'plastic',
    split: 'train',
    baseFeatures: [0.08, 0.08, 0.92, 0.56, 0.32, 0.14],
    palette: { main: [86, 178, 226], accent: [28, 116, 186], highlight: [236, 248, 255] },
    shape: 'bottle',
    note: { en: 'Clear glossy cylinder with bright highlight', bn: 'স্বচ্ছ চকচকে বোতল ও তীব্র আলোর ঝলক' },
  },
  {
    id: 'poly-bag',
    name: { en: 'Blue polythene bag', bn: 'নীল পলিথিন ব্যাগ' },
    trueClass: 'plastic',
    split: 'train',
    baseFeatures: [0.1, 0.06, 0.84, 0.34, 0.54, 0.18],
    palette: { main: [56, 138, 218], accent: [32, 92, 168], highlight: [204, 232, 252] },
    shape: 'bag',
    note: { en: 'Crinkled glossy film with specular creases', bn: 'ভাঁজ পড়া চকচকে পলিথিন ও উজ্জ্বল দাগ' },
  },
  {
    id: 'soda-bottle',
    name: { en: 'Green soda bottle', bn: 'সবুজ সোডার বোতল' },
    trueClass: 'plastic',
    split: 'train',
    baseFeatures: [0.34, 0.08, 0.9, 0.52, 0.28, 0.18],
    palette: { main: [48, 182, 136], accent: [22, 128, 96], highlight: [232, 255, 246] },
    shape: 'bottle',
    note: { en: 'Green tint but strong glossy plastic specular line', bn: 'সবুজ রঙ হলেও প্লাস্টিকের তীব্র চকচকে রেখা আছে' },
  },
  {
    id: 'food-tub',
    name: { en: 'Clear takeaway tub', bn: 'স্বচ্ছ খাবারের বাটি' },
    trueClass: 'plastic',
    split: 'train',
    baseFeatures: [0.06, 0.12, 0.86, 0.62, 0.24, 0.12],
    palette: { main: [186, 214, 232], accent: [112, 152, 184], highlight: [246, 252, 255] },
    shape: 'cup',
    note: { en: 'Rigid translucent rim with glossy reflection', bn: 'শক্ত স্বচ্ছ কিনারা ও চকচকে প্রতিফলন' },
  },
  {
    id: 'newspaper',
    name: { en: 'Crumpled newspaper', bn: 'দোমড়ানো খবরের কাগজ' },
    trueClass: 'paper',
    split: 'train',
    baseFeatures: [0.08, 0.62, 0.08, 0.72, 0.26, 0.94],
    palette: { main: [216, 208, 192], accent: [96, 102, 110], highlight: [238, 234, 224] },
    shape: 'sheet',
    note: { en: 'Matte off-white sheet packed with ink print texture', bn: 'অনুজ্জ্বল সাদা কাগজে ঘন ছাপার টেক্সচার' },
  },
  {
    id: 'cardboard',
    name: { en: 'Cardboard box', bn: 'কার্ডবোর্ডের বাক্স' },
    trueClass: 'paper',
    split: 'train',
    baseFeatures: [0.1, 0.92, 0.06, 0.92, 0.12, 0.72],
    palette: { main: [188, 138, 86], accent: [138, 92, 48], highlight: [214, 174, 126] },
    shape: 'box',
    note: { en: 'Warm kraft brown fiber with sharp 90° folds', bn: 'বাদামী আঁশযুক্ত কাগজ ও ধারালো ৯০° ভাঁজ' },
  },
  {
    id: 'paper-cup',
    name: { en: 'Paper tea cup', bn: 'কাগজের চায়ের কাপ' },
    trueClass: 'paper',
    split: 'train',
    baseFeatures: [0.08, 0.68, 0.16, 0.74, 0.3, 0.68],
    palette: { main: [224, 202, 172], accent: [176, 122, 74], highlight: [242, 232, 214] },
    shape: 'cup',
    note: { en: 'Matte kraft paper wall with printed band', bn: 'অনুজ্জ্বল কাগজের গায়ে ছাপা নকশা' },
  },
  {
    id: 'kraft-bag',
    name: { en: 'Brown paper bag', bn: 'বাদামী কাগজের ঠোঙা' },
    trueClass: 'paper',
    split: 'train',
    baseFeatures: [0.1, 0.88, 0.08, 0.84, 0.2, 0.78],
    palette: { main: [196, 152, 102], accent: [148, 106, 62], highlight: [220, 186, 144] },
    shape: 'box',
    note: { en: 'Matte brown grocery sack with crisp creases', bn: 'বাদামী মুদিখানার ঠোঙা ও সোজা ভাঁজ' },
  },

  // ---- Held-out unseen evaluation pool (6 items: 2 per class) ----
  {
    id: 'guava',
    name: { en: 'Half-eaten guava', bn: 'আধখাওয়া পেয়ারা' },
    trueClass: 'organic',
    split: 'eval',
    baseFeatures: [0.82, 0.22, 0.18, 0.16, 0.88, 0.18],
    palette: { main: [118, 184, 78], accent: [232, 224, 186], highlight: [176, 218, 122] },
    shape: 'curved',
    note: { en: 'Unseen organic item: green skin and rounded bite', bn: 'অদেখা জৈব বর্জ্য: সবুজ খোসা ও গোলাকার আকার' },
  },
  {
    id: 'spinach',
    name: { en: 'Wilted spinach', bn: 'শুকনো পালং শাক' },
    trueClass: 'organic',
    split: 'eval',
    baseFeatures: [0.9, 0.2, 0.08, 0.12, 0.8, 0.28],
    palette: { main: [54, 134, 64], accent: [36, 94, 46], highlight: [108, 174, 96] },
    shape: 'leaf',
    note: { en: 'Unseen organic item: dark green curled leaves', bn: 'অদেখা জৈব বর্জ্য: গাঢ় সবুজ কোঁকড়ানো পাতা' },
  },
  {
    id: 'milk-sachet',
    name: { en: 'Milk poly pouch', bn: 'দুধের প্লাস্টিক প্যাকেট' },
    trueClass: 'plastic',
    split: 'eval',
    baseFeatures: [0.06, 0.14, 0.82, 0.56, 0.34, 0.34],
    palette: { main: [224, 236, 248], accent: [42, 126, 206], highlight: [252, 254, 255] },
    shape: 'bag',
    note: { en: 'Unseen plastic item: glossy white-blue pouch with print', bn: 'অদেখা প্লাস্টিক: চকচকে সাদা-নীল প্যাকেট' },
  },
  {
    id: 'yogurt-cup',
    name: { en: 'White plastic cup', bn: 'সাদা প্লাস্টিক কাপ' },
    trueClass: 'plastic',
    split: 'eval',
    baseFeatures: [0.05, 0.22, 0.72, 0.6, 0.28, 0.26],
    palette: { main: [236, 240, 246], accent: [148, 172, 198], highlight: [255, 255, 255] },
    shape: 'cup',
    note: { en: 'Tricky plastic cup: looks a little like a paper cup!', bn: 'কঠিন প্লাস্টিক কাপ: দেখতে অনেকটা কাগজের কাপের মতো!' },
  },
  {
    id: 'notebook-page',
    name: { en: 'Torn notebook page', bn: 'ছেঁড়া খাতার পাতা' },
    trueClass: 'paper',
    split: 'eval',
    baseFeatures: [0.06, 0.58, 0.1, 0.84, 0.16, 0.88],
    palette: { main: [232, 228, 214], accent: [98, 132, 172], highlight: [246, 244, 236] },
    shape: 'sheet',
    note: { en: 'Unseen paper item: ruled lines and rectangular corners', bn: 'অদেখা কাগজ: দাগ কাটা পাতা ও সোজা কোণা' },
  },
  {
    id: 'envelope',
    name: { en: 'Office envelope', bn: 'অফিসের খাম' },
    trueClass: 'paper',
    split: 'eval',
    baseFeatures: [0.08, 0.82, 0.1, 0.9, 0.14, 0.74],
    palette: { main: [212, 182, 134], accent: [164, 128, 82], highlight: [232, 208, 168] },
    shape: 'box',
    note: { en: 'Unseen paper item: tan rectangular flap', bn: 'অদেখা কাগজ: বাদামী চারকোণা খাম' },
  },

  // ---- Break-it / Out-of-Distribution items (3) ----
  {
    id: 'metal-can',
    name: { en: 'Aluminum soda can', bn: 'অ্যালুমিনিয়ামের ক্যান' },
    trueClass: 'metal',
    split: 'break',
    baseFeatures: [0.06, 0.1, 0.96, 0.62, 0.24, 0.24],
    palette: { main: [182, 194, 206], accent: [204, 62, 62], highlight: [252, 254, 255] },
    shape: 'can',
    note: {
      en: 'NEVER seen during training! Metallic shine tricks the model into high-confidence Plastic.',
      bn: 'প্রশিক্ষণে কখনো দেখেনি! ধাতব চকচকে ভাব মডেলকে আত্মবিশ্বাসের সাথে প্লাস্টিক বলতে বাধ্য করে।',
    },
  },
  {
    id: 'muddy-paper',
    name: { en: 'Wet muddy newspaper', bn: 'ভেজা কাদামাখা কাগজ' },
    trueClass: 'paper',
    split: 'break',
    baseFeatures: [0.52, 0.56, 0.16, 0.34, 0.68, 0.44],
    palette: { main: [122, 108, 76], accent: [84, 72, 48], highlight: [152, 138, 104] },
    shape: 'sheet',
    note: {
      en: 'Soggy, crumpled & stained: loses crisp paper edges and looks organic.',
      bn: 'ভিজে দোমড়ানো ও কাদামাখা: সোজা ধার হারিয়ে জৈব বর্জ্যের মতো দেখায়।',
    },
  },
  {
    id: 'greasy-box',
    name: { en: 'Oil-stained food box', bn: 'তেলমাখা খাবারের বাক্স' },
    trueClass: 'paper',
    split: 'break',
    baseFeatures: [0.36, 0.54, 0.52, 0.58, 0.38, 0.42],
    palette: { main: [176, 134, 88], accent: [128, 86, 44], highlight: [226, 204, 168] },
    shape: 'box',
    note: {
      en: 'Shiny oil patches raise glossiness, confusing paper and plastic.',
      bn: 'তেলের চকচকে দাগ প্রতিফলন বাড়িয়ে কাগজ ও প্লাস্টিকের মধ্যে বিভ্রান্তি তৈরি করে।',
    },
  },
];

export const TRAIN_ITEMS = WASTE_ITEMS.filter((i) => i.split === 'train');
export const EVAL_ITEMS = WASTE_ITEMS.filter((i) => i.split === 'eval');
export const BREAK_ITEMS = WASTE_ITEMS.filter((i) => i.split === 'break');

export function getWasteItem(id: string): WasteItem {
  return WASTE_ITEMS.find((i) => i.id === id) ?? WASTE_ITEMS[0];
}

export const STARTER_SAMPLE_IDS: Record<WasteClass, string[]> = {
  organic: ['banana', 'mango', 'veg-scraps'],
  plastic: ['pet-bottle', 'poly-bag', 'food-tub'],
  paper: ['newspaper', 'cardboard', 'paper-cup'],
};

export const BALANCED_SAMPLE_IDS: Record<WasteClass, string[]> = {
  organic: ['banana', 'mango', 'veg-scraps', 'tea-leaves'],
  plastic: ['pet-bottle', 'poly-bag', 'soda-bottle', 'food-tub'],
  paper: ['newspaper', 'cardboard', 'paper-cup', 'kraft-bag'],
};

export const IMBALANCED_SAMPLE_IDS: Record<WasteClass, string[]> = {
  organic: ['banana'],
  plastic: ['pet-bottle', 'poly-bag', 'soda-bottle', 'food-tub', 'pet-bottle', 'poly-bag', 'food-tub'],
  paper: ['newspaper'],
};

export type PixelRgb = [number, number, number];
export type PixelGrid = PixelRgb[][]; // 10×10

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Synthesize a deterministic 10×10 RGB pixel mosaic of a waste item under current camera lighting & background. */
export function renderPixelGrid(item: WasteItem, condition: CameraCondition = DEFAULT_CONDITION): PixelGrid {
  const N = 10;
  const bg: PixelRgb =
    condition.background === 'blue-tray'
      ? [44, 126, 208]
      : condition.background === 'wood-table'
        ? [154, 112, 74]
        : [74, 84, 96];

  const grid: PixelGrid = [];
  for (let r = 0; r < N; r++) {
    const row: PixelRgb[] = [];
    for (let c = 0; c < N; c++) {
      let px: PixelRgb = [...bg];
      const inside = isShapePixel(item.shape, r, c);
      if (inside === 1) px = [...item.palette.main];
      else if (inside === 2) px = [...item.palette.accent];
      else if (inside === 3) px = [...item.palette.highlight];

      // Subtle deterministic micro-variation so pixels look natural
      const jitter = ((r * 7 + c * 13 + item.id.length * 5) % 9) - 4;
      px = [
        clamp(px[0] + jitter, 0, 255),
        clamp(px[1] + jitter, 0, 255),
        clamp(px[2] + jitter, 0, 255),
      ];

      // Apply lighting degradation unless auto white-balance compensates most of it
      if (condition.lighting === 'dim-yellow') {
        const strength = condition.autoWhiteBalance ? 0.22 : 1;
        px = [
          clamp(Math.round(px[0] * (1 - 0.18 * strength) + 28 * strength), 0, 255),
          clamp(Math.round(px[1] * (1 - 0.34 * strength) + 12 * strength), 0, 255),
          clamp(Math.round(px[2] * (1 - 0.58 * strength)), 0, 255),
        ];
      } else if (condition.lighting === 'glare') {
        const strength = condition.autoWhiteBalance ? 0.25 : 1;
        const beam = Math.max(0, 1 - Math.abs(c - 4.5) / 3.5) * 95 * strength;
        px = [
          clamp(Math.round(px[0] + beam), 0, 255),
          clamp(Math.round(px[1] + beam), 0, 255),
          clamp(Math.round(px[2] + beam), 0, 255),
        ];
      }
      row.push(px);
    }
    grid.push(row);
  }
  return grid;
}

/** Returns 0=bg, 1=main, 2=accent, 3=specular highlight. */
function isShapePixel(shape: WasteItem['shape'], r: number, c: number): 0 | 1 | 2 | 3 {
  switch (shape) {
    case 'curved': {
      // Crescent / banana peel arc
      const dist = Math.hypot(r - 6.2, c - 4.8);
      if (dist >= 2.2 && dist <= 4.3 && r >= 2 && r <= 7 && c >= 1 && c <= 8) {
        if (r === 3 && (c === 3 || c === 6)) return 2;
        if (r === 5 && c === 5) return 3;
        return 1;
      }
      return 0;
    }
    case 'leaf': {
      const d1 = Math.hypot((r - 4.5) * 1.1, c - 4.5);
      if (d1 <= 3.4) {
        if (r === c || r + c === 9) return 2;
        if (r === 3 && c === 5) return 3;
        return 1;
      }
      return 0;
    }
    case 'bottle': {
      if (r === 1 && c >= 4 && c <= 5) return 2; // cap
      if (r === 2 && c >= 3 && c <= 6) return 1; // neck
      if (r >= 3 && r <= 8 && c >= 3 && c <= 6) {
        if (c === 4 && r >= 3 && r <= 7) return 3; // vertical specular shine!
        if (r === 5 || r === 6) return 2; // label
        return 1;
      }
      return 0;
    }
    case 'can': {
      if (r >= 2 && r <= 8 && c >= 3 && c <= 6) {
        if (r === 2 || r === 8) return 3;
        if (c === 4) return 3; // bright metallic specular bar
        if (r >= 4 && r <= 6) return 2;
        return 1;
      }
      return 0;
    }
    case 'bag': {
      if (r === 1 && (c === 3 || c === 6)) return 2; // handles
      if (r >= 2 && r <= 8 && c >= 2 && c <= 7) {
        if ((r === 4 && c === 3) || (r === 6 && c === 6)) return 3;
        if (r === 2 && (c === 4 || c === 5)) return 0;
        return 1;
      }
      return 0;
    }
    case 'cup': {
      const halfW = r <= 2 ? 3 : r <= 5 ? 2.6 : 2;
      if (r >= 2 && r <= 8 && Math.abs(c - 4.5) <= halfW) {
        if (r === 2) return 3;
        if (r === 5) return 2;
        if (c === 3 && r <= 6) return 3;
        return 1;
      }
      return 0;
    }
    case 'box': {
      if (r >= 2 && r <= 8 && c >= 1 && c <= 8) {
        if (r === 2 || r === 8 || c === 1 || c === 8) return 2;
        if (r === 4) return 2;
        if (r === 3 && c === 2) return 3;
        return 1;
      }
      return 0;
    }
    case 'sheet': {
      if (r >= 1 && r <= 8 && c >= 2 && c <= 7) {
        if ((r === 3 || r === 5 || r === 7) && c >= 3 && c <= 6) return 2; // text lines
        return 1;
      }
      return 0;
    }
  }
}

export interface ConvKernel {
  id: KernelId;
  name: Bi;
  desc: Bi;
  weights: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number],
  ];
  channel: 'luma' | 'highlight' | 'green';
}

export const CONV_KERNELS: Record<KernelId, ConvKernel> = {
  vertical: {
    id: 'vertical',
    name: { en: 'Vertical edges', bn: 'খাড়া ধার খোঁজা' },
    desc: {
      en: 'Spots straight upright borders like bottle sides, box walls and paper edges.',
      bn: 'বোতলের পাশ, বাক্সের দেয়াল ও কাগজের খাড়া ধার খুঁজে বের করে।',
    },
    weights: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ],
    channel: 'luma',
  },
  horizontal: {
    id: 'horizontal',
    name: { en: 'Horizontal folds', bn: 'আড়াআড়ি ভাঁজ খোঁজা' },
    desc: {
      en: 'Highlights flat tops, box flaps, rims and printed text lines.',
      bn: 'বাক্সের ঢাকনা, কাপের মুখ ও ছাপা অক্ষরের আড়াআড়ি রেখা ধরে।',
    },
    weights: [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ],
    channel: 'luma',
  },
  shine: {
    id: 'shine',
    name: { en: 'Gloss & glare spotter', bn: 'চকচকে ঝলক খোঁজা' },
    desc: {
      en: 'Fires strongly on bright center highlights surrounded by darker plastic or metal.',
      bn: 'গাঢ় প্লাস্টিক বা ধাতুর ওপর তীব্র সাদা আলোর ঝলক দেখলে সক্রিয় হয়।',
    },
    weights: [
      [-1, -1, -1],
      [-1, 8, -1],
      [-1, -1, -1],
    ],
    channel: 'highlight',
  },
  organic: {
    id: 'organic',
    name: { en: 'Green / organic blob', bn: 'সবুজ ও জৈব রঙ খোঁজা' },
    desc: {
      en: 'Sums green-yellow dominance across the 3×3 patch to detect fruit peels and leaves.',
      bn: '৩×৩ অংশে সবুজ-হলুদ জৈব রঙের প্রাধান্য যোগ করে ফলের খোসা ও পাতা চেনে।',
    },
    weights: [
      [1, 1, 1],
      [1, 2, 1],
      [1, 1, 1],
    ],
    channel: 'green',
  },
};

export function pixelChannelValue(px: PixelRgb, channel: ConvKernel['channel']): number {
  const [r, g, b] = px;
  if (channel === 'luma') {
    return Math.round((0.299 * r + 0.587 * g + 0.114 * b) / 25.5); // 0..10 integer for easy arithmetic!
  }
  if (channel === 'highlight') {
    const bright = (r + g + b) / 3;
    return bright > 205 ? Math.round((bright - 160) / 10) : Math.round(bright / 60);
  }
  // green / organic score (high for green or warm yellow-green, low for blue/grey)
  const organic = Math.max(0, g - b * 0.85 + Math.max(0, r - b) * 0.25);
  return clamp(Math.round(organic / 22), 0, 10);
}

export interface PatchConvResult {
  centerRow: number;
  centerCol: number;
  inputs: number[][];
  weights: readonly (readonly number[])[];
  products: number[][];
  rawSum: number;
  relu: number;
  normalized: number;
}

/** Computes exact 3×3 convolution arithmetic centered at (centerRow, centerCol), where both are 1..8. */
export function convolvePatch(
  grid: PixelGrid,
  centerRow: number,
  centerCol: number,
  kernelId: KernelId,
): PatchConvResult {
  const kernel = CONV_KERNELS[kernelId];
  const r0 = clamp(centerRow, 1, grid.length - 2);
  const c0 = clamp(centerCol, 1, grid[0].length - 2);
  const inputs: number[][] = [];
  const products: number[][] = [];
  let rawSum = 0;

  for (let dr = -1; dr <= 1; dr++) {
    const inRow: number[] = [];
    const prodRow: number[] = [];
    for (let dc = -1; dc <= 1; dc++) {
      const val = pixelChannelValue(grid[r0 + dr][c0 + dc], kernel.channel);
      const w = kernel.weights[dr + 1][dc + 1];
      const p = val * w;
      inRow.push(val);
      prodRow.push(p);
      rawSum += p;
    }
    inputs.push(inRow);
    products.push(prodRow);
  }

  const relu = Math.max(0, rawSum);
  const scale = kernelId === 'organic' ? 75 : kernelId === 'shine' ? 40 : 28;
  return {
    centerRow: r0,
    centerCol: c0,
    inputs,
    weights: kernel.weights,
    products,
    rawSum,
    relu,
    normalized: clamp(relu / scale, 0, 1),
  };
}

/** Computes the full 8×8 ReLU activation feature map for a 10×10 RGB grid. */
export function computeFeatureMap(grid: PixelGrid, kernelId: KernelId): number[][] {
  const map: number[][] = [];
  for (let r = 1; r <= grid.length - 2; r++) {
    const row: number[] = [];
    for (let c = 1; c <= grid[0].length - 2; c++) {
      row.push(convolvePatch(grid, r, c, kernelId).normalized);
    }
    map.push(row);
  }
  return map;
}

/** Extracts the 6-feature transfer-learning vector for a waste item under lighting/background conditions. */
export function extractFeatures(
  item: WasteItem,
  condition: CameraCondition = DEFAULT_CONDITION,
): [number, number, number, number, number, number] {
  const f: [number, number, number, number, number, number] = [...item.baseFeatures];

  // Dim yellow lighting shifts hues warmer/browner and suppresses specular contrast
  if (condition.lighting === 'dim-yellow') {
    const s = condition.autoWhiteBalance ? 0.2 : 1;
    f[0] = clamp(f[0] * (1 - 0.25 * s), 0, 1);
    f[1] = clamp(f[1] + 0.42 * s * (1 - f[1]), 0, 1); // warm yellow/brown shift!
    f[2] = clamp(f[2] * (1 - 0.52 * s), 0, 1); // plastic loses bright blue-white shine!
    f[3] = clamp(f[3] * (1 - 0.22 * s), 0, 1);
  } else if (condition.lighting === 'glare') {
    const s = condition.autoWhiteBalance ? 0.22 : 1;
    f[2] = clamp(f[2] + 0.56 * s * (1 - f[2]), 0, 1); // glare adds fake shine to matte paper!
    f[5] = clamp(f[5] * (1 - 0.35 * s), 0, 1);
  }

  // Background shortcut bias: simulates a model that latched onto tray color instead of the object!
  if (condition.shortcutBias) {
    if (condition.background === 'blue-tray') {
      f[2] = clamp(f[2] + 0.62, 0, 1); // blue tray looks like plastic!
      f[0] = clamp(f[0] * 0.45, 0, 1);
      f[1] = clamp(f[1] * 0.45, 0, 1);
    } else if (condition.background === 'wood-table') {
      f[1] = clamp(f[1] + 0.54, 0, 1); // wood table looks like brown cardboard!
      f[3] = clamp(f[3] + 0.35, 0, 1);
      f[2] = clamp(f[2] * 0.45, 0, 1);
    }
  }

  return f;
}

/**
 * Extracts the exact same 6 visual features from any raw 10×10 RGB grid (e.g. a live browser webcam snapshot!).
 * This lets learners test real objects in front of their camera with zero external downloads.
 */
export function extractFeaturesFromRgbGrid(
  grid: PixelGrid,
): [number, number, number, number, number, number] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (!rows || !cols) return [0, 0, 0, 0, 0, 0];

  let greenSum = 0;
  let warmBrownSum = 0;
  let shineCount = 0;
  let edgeSum = 0;
  let colorVar = 0;
  let centerFill = 0;
  const total = rows * cols;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [R, G, B] = grid[r][c];
      const luma = 0.299 * R + 0.587 * G + 0.114 * B;
      // Green / yellow-green organic signal
      if (G > B + 14 && G >= R * 0.8) greenSum += (G - B) / 140;
      // Warm paper / cardboard brown or off-white matte
      if (R > B + 12 && R >= G && luma > 70 && luma < 228) warmBrownSum += (R - B) / 120;
      // Specular highlight / cool blue-white plastic gloss
      if (luma > 218 || (B > R + 16 && luma > 95)) shineCount += 1;

      if (c + 1 < cols) {
        const [R2, G2, B2] = grid[r][c + 1];
        const l2 = 0.299 * R2 + 0.587 * G2 + 0.114 * B2;
        const diff = Math.abs(luma - l2);
        if (diff > 24) edgeSum += 1;
        colorVar += diff;
      }
      if (r >= 2 && r <= rows - 3 && c >= 2 && c <= cols - 3) {
        if (Math.abs(G - B) > 18) centerFill += 1;
      }
    }
  }

  return [
    clamp(greenSum / (total * 0.35), 0.05, 0.96),
    clamp(warmBrownSum / (total * 0.38), 0.05, 0.96),
    clamp(shineCount / (total * 0.32), 0.05, 0.96),
    clamp(edgeSum / (total * 0.42), 0.08, 0.95),
    clamp(centerFill / ((rows - 4) * (cols - 4) * 0.65), 0.1, 0.94),
    clamp(colorVar / (total * 34), 0.08, 0.95),
  ];
}

export interface TrainingSample {
  id: string;
  label: WasteClass;
  itemId?: string;
  features: readonly [number, number, number, number, number, number];
  /** Optional custom name for live webcam captures */
  customLabel?: string;
}

export interface WasteHeadModel {
  /** 3 classes × 6 features = 18 weights */
  weights: number[][];
  /** 3 class biases */
  biases: number[];
  epochs: number;
}

export function createInitialHead(): WasteHeadModel {
  return {
    weights: [
      [0.05, -0.05, -0.05, -0.04, 0.04, -0.02],
      [-0.04, -0.05, 0.06, 0.02, -0.03, -0.04],
      [-0.04, 0.05, -0.05, 0.04, -0.03, 0.06],
    ],
    biases: [0, 0, 0],
    epochs: 0,
  };
}

function softmax(logits: number[]): number[] {
  const m = Math.max(...logits);
  const exps = logits.map((z) => Math.exp(z - m));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

export interface HeadPrediction {
  probs: Record<WasteClass, number>;
  logits: Record<WasteClass, number>;
  topClass: WasteClass;
  confidence: number;
  routedTo: WasteClass | 'manual';
  uncertain: boolean;
}

export function predictHead(
  model: WasteHeadModel,
  features: readonly number[],
  minConfidence = 0,
): HeadPrediction {
  const rawLogits = WASTE_CLASSES.map((_, ci) => {
    let z = model.biases[ci];
    for (let fi = 0; fi < features.length; fi++) {
      z += model.weights[ci][fi] * features[fi];
    }
    return z;
  });
  const p = softmax(rawLogits);
  const probs: Record<WasteClass, number> = {
    organic: p[0],
    plastic: p[1],
    paper: p[2],
  };
  const logits: Record<WasteClass, number> = {
    organic: rawLogits[0],
    plastic: rawLogits[1],
    paper: rawLogits[2],
  };

  let bestIdx = 0;
  if (p[1] > p[bestIdx]) bestIdx = 1;
  if (p[2] > p[bestIdx]) bestIdx = 2;
  const topClass = WASTE_CLASSES[bestIdx];
  const confidence = p[bestIdx];
  const uncertain = confidence < minConfidence;

  return {
    probs,
    logits,
    topClass,
    confidence,
    routedTo: uncertain ? 'manual' : topClass,
    uncertain,
  };
}

export interface TrainStepResult {
  model: WasteHeadModel;
  loss: number;
  accuracy: number;
}

/** One deterministic gradient-descent epoch on the 21-parameter softmax head. */
export function trainHeadStep(
  model: WasteHeadModel,
  samples: readonly TrainingSample[],
  lr = 0.65,
  l2 = 0.008,
): TrainStepResult {
  if (samples.length === 0) {
    return { model, loss: 1.1, accuracy: 0 };
  }

  const gradW = [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ];
  const gradB = [0, 0, 0];
  let totalLoss = 0;
  let correct = 0;

  for (const s of samples) {
    const pred = predictHead(model, s.features);
    const yi = WASTE_CLASSES.indexOf(s.label);
    const pArr = [pred.probs.organic, pred.probs.plastic, pred.probs.paper];
    totalLoss += -Math.log(Math.max(1e-6, pArr[yi]));
    if (pred.topClass === s.label) correct++;

    for (let ci = 0; ci < 3; ci++) {
      const err = pArr[ci] - (ci === yi ? 1 : 0);
      gradB[ci] += err;
      for (let fi = 0; fi < 6; fi++) {
        gradW[ci][fi] += err * s.features[fi];
      }
    }
  }

  const n = samples.length;
  const nextWeights = model.weights.map((row, ci) =>
    row.map((w, fi) => w - lr * (gradW[ci][fi] / n + l2 * w)),
  );
  const nextBiases = model.biases.map((b, ci) => b - lr * (gradB[ci] / n));

  return {
    model: {
      weights: nextWeights,
      biases: nextBiases,
      epochs: model.epochs + 1,
    },
    loss: totalLoss / n,
    accuracy: correct / n,
  };
}

export function trainHead(
  samples: readonly TrainingSample[],
  epochs = 45,
  startModel: WasteHeadModel = createInitialHead(),
): {
  model: WasteHeadModel;
  lossHistory: number[];
  accHistory: number[];
} {
  let cur = startModel;
  const lossHistory: number[] = [];
  const accHistory: number[] = [];
  for (let e = 0; e < epochs; e++) {
    const res = trainHeadStep(cur, samples);
    cur = res.model;
    lossHistory.push(Number(res.loss.toFixed(3)));
    accHistory.push(Number((res.accuracy * 100).toFixed(1)));
  }
  return { model: cur, lossHistory, accHistory };
}

export function samplesFromIds(map: Record<WasteClass, string[]>): TrainingSample[] {
  const out: TrainingSample[] = [];
  let seq = 1;
  for (const cls of WASTE_CLASSES) {
    for (const itemId of map[cls]) {
      const item = getWasteItem(itemId);
      out.push({
        id: `${cls}-${itemId}-${seq++}`,
        label: cls,
        itemId,
        features: extractFeatures(item, DEFAULT_CONDITION),
      });
    }
  }
  return out;
}

export interface EvalSummary {
  total: number;
  correct: number;
  misrouted: number;
  manualReview: number;
  accuracyPct: number;
  purityPct: number;
  avgConfidencePct: number;
  /** confusion[trueClassIdx][predClassIdx] */
  confusion: number[][];
  rows: {
    item: WasteItem;
    prediction: HeadPrediction;
    ok: boolean;
  }[];
}

export function evaluateBatch(
  model: WasteHeadModel,
  items: readonly WasteItem[],
  condition: CameraCondition = DEFAULT_CONDITION,
  minConfidence = 0,
): EvalSummary {
  const confusion = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  let correct = 0;
  let misrouted = 0;
  let manualReview = 0;
  let confSum = 0;

  const rows = items.map((item) => {
    const features = extractFeatures(item, condition);
    const prediction = predictHead(model, features, minConfidence);
    confSum += prediction.confidence;

    const ti = WASTE_CLASSES.indexOf(item.trueClass as WasteClass);
    const pi = WASTE_CLASSES.indexOf(prediction.topClass);
    if (ti >= 0 && pi >= 0) confusion[ti][pi]++;

    let ok: boolean;
    if (prediction.routedTo === 'manual') {
      manualReview++;
      ok = item.trueClass === 'metal'; // flagging unseen metal for manual review is good!
    } else if (prediction.routedTo === item.trueClass) {
      correct++;
      ok = true;
    } else {
      misrouted++;
      ok = false;
    }
    return { item, prediction, ok };
  });

  const sortedCount = correct + misrouted;
  return {
    total: items.length,
    correct,
    misrouted,
    manualReview,
    accuracyPct: items.length ? Math.round((correct / items.length) * 100) : 0,
    purityPct: sortedCount ? Math.round((correct / sortedCount) * 100) : 100,
    avgConfidencePct: items.length ? Math.round((confSum / items.length) * 100) : 0,
    confusion,
    rows,
  };
}
