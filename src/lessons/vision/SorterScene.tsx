/*
 * Live animated Municipal Waste Sorting Conveyor + AI Vision Arch + Transfer Learning Workbench
 * for Lesson 7 (Image Recogniser). Combines the cel-shaded hardware rig aesthetic of Lesson 13
 * with the live pixel-grid & neural pipeline clarity of Lesson 6.
 */
import {
  WASTE_CLASSES,
  type CameraCondition,
  type HeadPrediction,
  type PixelGrid,
  type WasteItem,
} from '../../engines/vision';
import { useT } from '../../i18n';
import type { VisionPinId } from './store';
import { CLASS_META } from './meta';
import { WasteGlyph } from './WasteArt';

interface Props {
  item: WasteItem;
  pixelGrid: PixelGrid;
  features: readonly number[];
  prediction: HeadPrediction;
  condition: CameraCondition;
  playing: boolean;
  patchRow: number;
  patchCol: number;
  activePin: VisionPinId | null;
  onPinClick: (pin: VisionPinId) => void;
  onPatchSelect?: (row: number, col: number) => void;
  showAttentionShortcut?: boolean;
}

const PIN_INFO: Record<VisionPinId, { title: [string, string]; body: [string, string] }> = {
  ring: {
    title: ['LED Ring Light Hood', 'এলইডি রিং লাইট হুড'],
    body: [
      'Floods the belt with steady white light. Without it, evening yellow bulbs shift colours and fool the classifier.',
      'বেল্টের ওপর সমান সাদা আলো দেয়। এটি ছাড়া সন্ধ্যার হলুদ আলো রঙ বদলে মডেলকে বিভ্রান্ত করে।',
    ],
  },
  camera: {
    title: ['Overhead RGB Camera Sensor', 'ওভারহেড আরজিবি ক্যামেরা সেন্সর'],
    body: [
      'Does not see “a bottle”. It outputs a grid of Red, Green, Blue brightness numbers (0–255) for every pixel.',
      'ক্যামেরা “বোতল” দেখে না—প্রতিটি পিক্সেলের লাল, সবুজ ও নীল আলোর সংখ্যা (০–২৫৫) তৈরি করে।',
    ],
  },
  backbone: {
    title: ['Frozen CNN Backbone (Transfer Learning)', 'স্থির সিএনএন ব্যাকবোন (ট্রান্সফার লার্নিং)'],
    body: [
      'Pre-trained on 1.4 million photos (like MobileNet in Teachable Machine). Already knows edges, gloss and textures — frozen so you only need ~15 waste photos!',
      '১৪ লক্ষ ছবিতে আগে থেকেই শেখা (Teachable Machine-এর MobileNet-এর মতো)। ধার, চকচকে ভাব ও টেক্সচার আগেই চেনে—তাই মাত্র ~১৫টি বর্জ্যের ছবিই যথেষ্ট!',
    ],
  },
  head: {
    title: ['Trainable 3-Class Softmax Head (21 weights)', 'প্রশিক্ষণযোগ্য ৩-শ্রেণির সফটম্যাক্স হেড (২১টি ওজন)'],
    body: [
      'Takes the backbone’s 6 visual cues, multiplies by learned weights and turns the scores into Organic / Plastic / Paper probabilities summing to 100%.',
      'ব্যাকবোনের ৬টি বৈশিষ্ট্যকে শেখা গুণক দিয়ে গুণ করে জৈব, প্লাস্টিক ও কাগজের সম্ভাবনা বের করে (যোগফল ১০০%)।',
    ],
  },
  diverter: {
    title: ['Pneumatic Sorting Gate & Manual Chute', 'নিউমেটিক বাছাই গেট ও ম্যানুয়াল চুট'],
    body: [
      'Pushes the item into the winning bin — or diverts it to human review when confidence falls below your safety threshold.',
      'সর্বোচ্চ সম্ভাবনার বিনে বর্জ্য পাঠায়—অথবা আত্মবিশ্বাস সীমার নিচে থাকলে মানুষের যাচাইয়ের জন্য সরিয়ে দেয়।',
    ],
  },
};

export function SorterScene({
  item,
  pixelGrid,
  features,
  prediction,
  condition,
  playing,
  patchRow,
  patchCol,
  activePin,
  onPinClick,
  onPatchSelect,
  showAttentionShortcut = false,
}: Props) {
  const { bi, num, pick } = useT();

  const isTrueOod = item.trueClass === 'metal';
  const isManual = prediction.routedTo === 'manual';
  const isMatch = isManual ? isTrueOod : prediction.routedTo === item.trueClass;
  const confPct = Math.round(prediction.confidence * 100);

  const routedColor =
    prediction.routedTo === 'organic'
      ? '#16a34a'
      : prediction.routedTo === 'plastic'
        ? '#0284c7'
        : prediction.routedTo === 'paper'
          ? '#ea580c'
          : '#a855f7';

  // Angle of the diverter arm pointing toward one of the 3 bins (or manual chute)
  const gateAngle =
    prediction.routedTo === 'organic'
      ? -28
      : prediction.routedTo === 'plastic'
        ? 0
        : prediction.routedTo === 'paper'
          ? 28
          : -52;

  const pinBadge = (id: VisionPinId, x: number, y: number, label: string, dotColor: string) => {
    const isSel = activePin === id;
    const w = label.length * 6.5 + 24;
    return (
      <g
        className={isSel ? 'vis-pin active' : 'vis-pin'}
        transform={`translate(${x} ${y})`}
        onClick={() => onPinClick(id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPinClick(id);
          }
        }}
        aria-label={label}
      >
        <rect x={-2} y={-11} width={w} height={21} rx={10.5} className="vis-pin-pill" />
        <circle cx={9} cy={-0.5} r={4} fill={dotColor} />
        <text x={18} y={3.5} className="vis-pin-txt">
          {label}
        </text>
      </g>
    );
  };

  return (
    <div className="vis-stage-box">
      {/* Clean Live Decision Header Bar above SVG (never overlaps artwork or pins) */}
      <div className={isMatch ? 'vis-status-bar' : isManual ? 'vis-status-bar warn' : 'vis-status-bar bad'}>
        <span className="vis-float-ico" aria-hidden="true">
          {isManual ? '✋' : CLASS_META[prediction.topClass].icon}
        </span>
        <span className="vis-float-k">
          {isManual
            ? bi(`Uncertain (${confPct}%) → Manual review`, `অনিশ্চিত (${num(confPct)}%) → মানুষের যাচাই`)
            : `${bi(CLASS_META[prediction.topClass].name[0], CLASS_META[prediction.topClass].name[1])} · ${num(confPct)}%`}
          {!isMatch && !isManual && (
            <strong className="vis-float-err"> · {bi('WRONG BIN!', 'ভুল বিন!')}</strong>
          )}
        </span>
        <div className="vis-meter">
          <i style={{ width: `${confPct}%` }} />
        </div>
      </div>

      <svg
        className="vis-hero-svg"
        viewBox="0 0 820 412"
        role="img"
        aria-label={bi(
          'Animated municipal waste sorting conveyor belt with overhead AI camera, 10×10 pixel grid, frozen CNN backbone, trainable softmax head and 3 sorting bins',
          'চলমান বর্জ্য বাছাই কনভেয়ার বেল্ট, ওভারহেড এআই ক্যামেরা, ১০×১০ পিক্সেল গ্রিড, স্থির সিএনএন ব্যাকবোন, সফটম্যাক্স হেড ও ৩টি বাছাই বিনের অ্যানিমেশন',
        )}
      >
        <defs>
          <linearGradient id="vis-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dbe6ee" />
            <stop offset="1" stopColor="#eef2ef" />
          </linearGradient>
          <linearGradient id="vis-scan-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={condition.lighting === 'dim-yellow' ? '#f59e0b' : '#38bdf8'} stopOpacity="0.48" />
            <stop offset="1" stopColor={condition.lighting === 'dim-yellow' ? '#f59e0b' : '#38bdf8'} stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="vis-chip" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1e293b" />
            <stop offset="1" stopColor="#0f172a" />
          </linearGradient>
          <pattern id="vis-iso-grid" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M 22 0 L 0 0 0 22" fill="none" stroke="rgb(20 35 58 / 7.5%)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* ====== RIGHT WORKBENCH DRAFTING GRID ====== */}
        <rect x="466" y="0" width="354" height="412" fill="#f7f3e8" />
        <rect x="466" y="0" width="354" height="412" fill="url(#vis-iso-grid)" />
        <line x1="466" y1="0" x2="466" y2="412" stroke="#cbd5cf" strokeWidth="2" />

        {/* ====== LEFT: MUNICIPAL WASTE SORTING STATION ====== */}
        <g>
          {/* Facility backdrop */}
          <rect x="0" y="0" width="466" height="412" fill="url(#vis-wall)" />
          {/* Floor plinth */}
          <rect x="0" y="344" width="466" height="68" fill="#cbd5e1" />
          <line x1="0" y1="344" x2="466" y2="344" stroke="#94a3b8" strokeWidth="2" />

          {/* Lighting tint overlay on the sorting bay */}
          {condition.lighting === 'dim-yellow' && (
            <rect
              x="0"
              y="0"
              width="466"
              height="412"
              fill="#78350f"
              opacity={condition.autoWhiteBalance ? '0.14' : '0.42'}
            />
          )}
          {condition.lighting === 'glare' && (
            <polygon
              points="186,0 264,0 326,280 120,280"
              fill="#ffffff"
              opacity={condition.autoWhiteBalance ? '0.16' : '0.44'}
            />
          )}

          {/* Overhead Aluminium Camera Arch */}
          <rect x="112" y="76" width="12" height="196" rx="3" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
          <rect x="316" y="76" width="12" height="196" rx="3" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
          <rect x="106" y="66" width="228" height="18" rx="5" fill="#475569" stroke="#1e293b" strokeWidth="2" />

          {/* LED Ring Light bar */}
          <rect
            x="166"
            y="84"
            width="108"
            height="10"
            rx="4"
            fill={
              condition.lighting === 'dim-yellow'
                ? '#f59e0b'
                : condition.lighting === 'glare'
                  ? '#ffffff'
                  : '#e0f2fe'
            }
            stroke="#334155"
            strokeWidth="1.4"
          />

          {/* Camera Body + Lens */}
          <rect x="196" y="88" width="48" height="32" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <circle cx="220" cy="118" r="10" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
          <circle cx="220" cy="118" r="5" fill="#38bdf8" className="vis-lens-glow" />

          {/* Scanning Light Cone */}
          <polygon points="212,126 228,126 286,246 154,246" fill="url(#vis-scan-beam)" />
          <line
            x1="168"
            y1="210"
            x2="272"
            y2="210"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray="6 5"
            className="vis-scan-line"
          />

          {/* Conveyor Belt Frame & Rollers */}
          <rect x="18" y="236" width="346" height="32" rx="14" fill="#334155" stroke="#0f172a" strokeWidth="2.5" />
          <line
            x1="34"
            y1="246"
            x2="348"
            y2="246"
            stroke="#94a3b8"
            strokeWidth="4"
            strokeDasharray="12 14"
            className={playing ? 'vis-belt-move fast' : 'vis-belt-move'}
          />
          {[36, 112, 190, 268, 344].map((cx) => (
            <g key={cx} transform={`translate(${cx} 252)`}>
              <circle r="9" fill="#64748b" stroke="#0f172a" strokeWidth="1.8" />
              <circle r="3" fill="#e2e8f0" />
            </g>
          ))}
          {/* Belt legs */}
          <rect x="44" y="268" width="10" height="76" fill="#475569" />
          <rect x="318" y="268" width="10" height="76" fill="#475569" />

          {/* Optional Background Tray under the Waste Item */}
          {condition.background === 'blue-tray' && (
            <g>
              <rect x="166" y="220" width="108" height="17" rx="4" fill="#2563eb" stroke="#1e3a8a" strokeWidth="2" />
              {showAttentionShortcut && condition.shortcutBias && (
                <rect
                  x="162"
                  y="216"
                  width="116"
                  height="25"
                  rx="6"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.8"
                  strokeDasharray="5 4"
                  className="vis-pulse-box"
                />
              )}
            </g>
          )}
          {condition.background === 'wood-table' && (
            <rect x="166" y="220" width="108" height="17" rx="4" fill="#a16207" stroke="#713f12" strokeWidth="2" />
          )}

          {/* Active Waste Item on the Conveyor under the Camera */}
          <g transform="translate(180 156)" className={playing ? 'vis-item-bob' : undefined}>
            <WasteGlyph itemId={item.id} />
            {!showAttentionShortcut && (
              <rect
                x="4"
                y="4"
                width="72"
                height="72"
                rx="8"
                fill="none"
                stroke={routedColor}
                strokeWidth="2.2"
                strokeDasharray="6 4"
              />
            )}
          </g>

          {/* Item label badge under belt */}
          <rect x="134" y="276" width="172" height="24" rx="12" fill="#0f172a" fillOpacity="0.88" />
          <text x="220" y="292" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700">
            {pick(item.name)}
            {isTrueOod ? ' (!)' : ''}
          </text>

          {/* Pneumatic Diverter Arm & 3 Smart Bins (right edge of sorting bay) */}
          <g transform="translate(364 252)">
            {/* Pivot */}
            <circle cx="0" cy="0" r="9" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
            <g transform={`rotate(${gateAngle})`} className="vis-gate-arm">
              <rect x="0" y="-4" width="54" height="8" rx="4" fill={routedColor} stroke="#0f172a" strokeWidth="1.5" />
            </g>
          </g>

          {/* 3 Municipal Bins at bottom */}
          {(
            [
              { cls: 'organic', x: 80, bg: '#15803d', border: '#14532d', emoji: '🥬', tag: bi('Organic', 'জৈব') },
              { cls: 'plastic', x: 186, bg: '#0284c7', border: '#075985', emoji: '🧴', tag: bi('Plastic', 'প্লাস্টিক') },
              { cls: 'paper', x: 292, bg: '#d9480f', border: '#9a3412', emoji: '📄', tag: bi('Paper', 'কাগজ') },
            ] as const
          ).map((b) => {
            const active = prediction.routedTo === b.cls;
            return (
              <g key={b.cls} transform={`translate(${b.x} 314)`}>
                <path
                  d="M0 0 L86 0 L78 72 L8 72 Z"
                  fill={b.bg}
                  fillOpacity={active ? 1 : 0.42}
                  stroke={active ? '#facc15' : b.border}
                  strokeWidth={active ? 3.5 : 1.8}
                />
                <text x="43" y="28" textAnchor="middle" fontSize="18">
                  {b.emoji}
                </text>
                <text x="43" y="48" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="800">
                  {b.tag}
                </text>
                <text x="43" y="63" textAnchor="middle" fill="#fef9c3" fontSize="9.5" fontWeight="700" fontFamily="var(--font-mono)">
                  {num(Math.round(prediction.probs[b.cls] * 100))}%
                </text>
              </g>
            );
          })}

          {/* Manual Review Chute indicator when below confidence threshold */}
          <g transform="translate(390 318)">
            <rect
              width="66"
              height="66"
              rx="10"
              fill={isManual ? '#7e22ce' : '#e2e8f0'}
              stroke={isManual ? '#facc15' : '#94a3b8'}
              strokeWidth={isManual ? 3 : 1.5}
            />
            <text x="33" y="28" textAnchor="middle" fontSize="18">
              ✋
            </text>
            <text
              x="33"
              y="45"
              textAnchor="middle"
              fill={isManual ? '#ffffff' : '#475569'}
              fontSize="8.5"
              fontWeight="800"
            >
              {bi('MANUAL', 'মানুষ')}
            </text>
            <text
              x="33"
              y="57"
              textAnchor="middle"
              fill={isManual ? '#f3e8ff' : '#64748b'}
              fontSize="7.5"
              fontWeight="700"
            >
              {isManual ? bi('DIVERTED', 'সরানো') : bi('STANDBY', 'প্রস্তুত')}
            </text>
          </g>
        </g>

        {/* ====== SIGNAL CABLES: CAMERA → PIXELS → BACKBONE → HEAD → GATE ====== */}
        <g fill="none" strokeLinecap="round">
          <path d="M244 102 C350 102, 412 88, 492 88" stroke="#0f172a" strokeWidth="5" />
          <path
            d="M244 102 C350 102, 412 88, 492 88"
            stroke="#38bdf8"
            strokeWidth="2.6"
            strokeDasharray="8 9"
            className="vis-wire-pulse"
          />
          <path d="M620 116 C648 116, 650 116, 668 116" stroke="#0f172a" strokeWidth="4.5" />
          <path
            d="M620 116 C648 116, 650 116, 668 116"
            stroke="#2dd4bf"
            strokeWidth="2.4"
            strokeDasharray="6 7"
            className="vis-wire-pulse"
          />
          <path d="M736 184 L736 226" stroke="#0f172a" strokeWidth="4.5" />
          <path
            d="M736 184 L736 226"
            stroke="#f97316"
            strokeWidth="2.4"
            strokeDasharray="6 7"
            className="vis-wire-pulse fast"
          />
          <path d="M666 286 C550 286, 480 252, 376 252" stroke="#1e293b" strokeWidth="4.5" />
          <path
            d="M666 286 C550 286, 480 252, 376 252"
            stroke={routedColor}
            strokeWidth="2.6"
            strokeDasharray="7 8"
            className="vis-wire-pulse fast"
          />
        </g>

        {/* ====== RIGHT WORKBENCH: LIVE 10×10 PIXEL SENSOR + FROZEN BACKBONE + SOFTMAX HEAD ====== */}
        {/* 1) Live 10×10 Camera Pixel Grid (interactive click to move 3×3 filter!) */}
        <g transform="translate(492 48)">
          <rect x="-6" y="-22" width="132" height="154" rx="10" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <text x="60" y="-7" textAnchor="middle" fill="#93c5fd" fontSize="8.5" fontWeight="800" fontFamily="var(--font-mono)">
            PIXELS · 10×10 RGB
          </text>
          {pixelGrid.map((row, r) =>
            row.map(([R, G, B], c) => (
              <rect
                key={`${r}-${c}`}
                x={c * 12}
                y={r * 12}
                width="11.4"
                height="11.4"
                rx="1.2"
                fill={`rgb(${R},${G},${B})`}
                className={onPatchSelect ? 'vis-px-cell' : undefined}
                onClick={() => {
                  if (!onPatchSelect) return;
                  onPatchSelect(Math.max(1, Math.min(8, r)), Math.max(1, Math.min(8, c)));
                }}
              />
            )),
          )}
          {/* Glowing 3×3 Convolution Scanner Box */}
          <rect
            x={(patchCol - 1) * 12 - 1}
            y={(patchRow - 1) * 12 - 1}
            width="37.5"
            height="37.5"
            rx="3"
            fill="none"
            stroke="#facc15"
            strokeWidth="2.4"
            pointerEvents="none"
          />
        </g>

        {/* 2) Frozen Pre-trained CNN Backbone Chip */}
        <g transform="translate(668 48)">
          <rect x="3" y="5" width="136" height="136" rx="10" fill="rgb(15 23 42 / 20%)" />
          <rect width="136" height="136" rx="10" fill="url(#vis-chip)" stroke="#0f172a" strokeWidth="2.2" />
          <rect x="8" y="8" width="120" height="22" rx="5" fill="#0e7490" />
          <text x="68" y="23" textAnchor="middle" fill="#ffffff" fontSize="8.2" fontWeight="800" fontFamily="var(--font-mono)">
            🧊 FROZEN BACKBONE
          </text>
          <text x="68" y="42" textAnchor="middle" fill="#94a3b8" fontSize="7.8" fontFamily="var(--font-mono)">
            MobileNet · 1.4M photos
          </text>
          {/* 6 live visual feature channel meters */}
          {features.map((v, i) => (
            <g key={i} transform={`translate(12 ${52 + i * 13})`}>
              <text x="0" y="8" fill="#cbd5e1" fontSize="7.8" fontFamily="var(--font-mono)">
                F{i + 1}
              </text>
              <rect x="18" y="1" width="68" height="7.5" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
              <rect
                x="19"
                y="2"
                width={Math.max(3, Math.round(v * 66))}
                height="5.5"
                rx="2"
                fill={i === 0 ? '#4ade80' : i === 2 ? '#38bdf8' : '#fb923c'}
              />
              <text x="114" y="8" textAnchor="end" fill="#e2e8f0" fontSize="7.8" fontFamily="var(--font-mono)">
                {v.toFixed(2)}
              </text>
            </g>
          ))}
        </g>

        {/* 3) Trainable 3-Class Softmax Head Box */}
        <g transform="translate(666 226)">
          <rect x="3" y="5" width="138" height="122" rx="10" fill="rgb(15 23 42 / 18%)" />
          <rect width="138" height="122" rx="10" fill="#ffffff" stroke="#0f172a" strokeWidth="2.2" />
          <rect x="8" y="8" width="122" height="22" rx="5" fill="#ea580c" />
          <text x="69" y="23" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800" fontFamily="var(--font-mono)">
            🔥 SOFTMAX HEAD (21w)
          </text>
          {WASTE_CLASSES.map((cls, i) => {
            const p = prediction.probs[cls];
            const isWin = prediction.topClass === cls;
            const barColor = cls === 'organic' ? '#16a34a' : cls === 'plastic' ? '#0284c7' : '#ea580c';
            return (
              <g key={cls} transform={`translate(10 ${42 + i * 25})`}>
                <text x="0" y="9" fill="#0f172a" fontSize="8.8" fontWeight={isWin ? 800 : 600}>
                  {CLASS_META[cls].icon} {bi(CLASS_META[cls].name[0], CLASS_META[cls].name[1])}
                </text>
                <text x="118" y="9" textAnchor="end" fill="#0f172a" fontSize="8.8" fontWeight="800" fontFamily="var(--font-mono)">
                  {num(Math.round(p * 100))}%
                </text>
                <rect x="0" y="13" width="118" height="6.5" rx="3" fill="#e2e8f0" />
                <rect
                  x="0"
                  y="13"
                  width={Math.max(3, Math.round(p * 118))}
                  height="6.5"
                  rx="3"
                  fill={barColor}
                />
              </g>
            );
          })}
        </g>

        {/* ====== CLICKABLE HARDWARE & AI CALLOUT PINS ====== */}
        {pinBadge('ring', 124, 42, 'RING LIGHT', '#f59e0b')}
        {pinBadge('camera', 262, 102, 'RGB CAMERA', '#0284c7')}
        {pinBadge('backbone', 494, 206, 'CNN BACKBONE', '#0b7a6e')}
        {pinBadge('head', 670, 366, 'SOFTMAX HEAD', '#ea580c')}
        {pinBadge('diverter', 356, 206, 'DIVERTER ARM', '#16a34a')}
      </svg>

      {/* Hardware Pin Inspector Popover */}
      {activePin && (
        <div className="vis-pin-pop" role="status">
          <div>
            <b>{bi(PIN_INFO[activePin].title[0], PIN_INFO[activePin].title[1])}</b>
            <p>{bi(PIN_INFO[activePin].body[0], PIN_INFO[activePin].body[1])}</p>
          </div>
          <button
            type="button"
            className="btn ghost small"
            onClick={() => onPinClick(activePin)}
            aria-label={bi('Close inspector', 'বন্ধ করুন')}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
