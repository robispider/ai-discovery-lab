/*
 * Live animated Monsoon Street + Culvert + ESP32 IoT Rig for Lesson 13.
 * Combines the illustrated Bangladeshi street style of Lesson 3 (falling rain, clouds,
 * CNG auto-rickshaw, rising floodwater) with the cel-shaded ESP32 + HC-SR04P + live OLED
 * + animated signal wires + clickable callout pins of learn-esp32.
 */
import { useMemo } from 'react';
import {
  FLOOD_CM,
  type CleanedTick,
  type DrainAiDecision,
  type FaultMode,
} from '../../engines/iot/drain';
import { useT } from '../../i18n';
import type { DrainPinId } from './store';

interface Props {
  tick: CleanedTick;
  rawCm: number | null;
  decision: DrainAiDecision;
  faultMode: FaultMode;
  hasPlastic: boolean;
  activePin: DrainPinId | null;
  onPinClick: (pin: DrainPinId) => void;
}

const PIN_INFO: Record<DrainPinId, { title: [string, string]; body: [string, string] }> = {
  ultrasonic: {
    title: ['HC-SR04P Ultrasonic (GPIO 5 / 18)', 'HC-SR04P আল্ট্রাসনিক সেন্সর (GPIO 5 / 18)'],
    body: [
      'Fires a 40 kHz sound ping down the culvert and times the echo to measure water height without touching sewage.',
      'ময়লা পানিতে না ছুঁয়েই ৪০ kHz শব্দতরঙ্গ ছুড়ে প্রতিধ্বনির সময় মেপে পানির উচ্চতা বের করে।',
    ],
  },
  esp32: {
    title: ['ESP32-WROOM-32 Brain', 'ESP32-WROOM-32 মাইক্রোকন্ট্রোলার'],
    body: [
      '240 MHz dual-core chip with Wi-Fi. Runs your chosen AI (Rule, Decision Tree, or +30m Trend) in <1 millisecond.',
      'Wi-Fi সহ ২৪০ MHz ডুয়াল-কোর চিপ। আপনার বাছা এআই (নিয়ম, ট্রি বা +৩০মি ট্রেন্ড) ১ মিলিসেকেন্ডের কম সময়ে চালায়।',
    ],
  },
  oled: {
    title: ['SSD1306 128×64 I2C OLED (GPIO 21 / 22)', 'SSD1306 ১২৮×৬৪ OLED পর্দা (GPIO 21 / 22)'],
    body: [
      'Shows live sensor telemetry, AI forecast and pump state right inside the roadside cabinet.',
      'রাস্তার পাশের বক্সেই সরাসরি সেন্সর পাঠ, এআই পূর্বাভাস ও পাম্পের অবস্থা দেখায়।',
    ],
  },
  relay: {
    title: ['Opto-Isolated Pump Relay (GPIO 26)', 'পাম্প রিলে সুইচ (GPIO 26)'],
    body: [
      'Lets a tiny 3.3V ESP32 pin safely switch the heavy stormwater pump motor before streets flood.',
      'রাস্তা ডোবার আগেই ৩.৩ ভোল্টের ছোট সংকেত দিয়ে বড় স্টর্মওয়াটার পাম্প চালু করে।',
    ],
  },
  khal: {
    title: ['Upstream Khal LoRa Node (1.2 km away)', 'উজানের খালের সেন্সর নোড (১.২ কিমি দূরে)'],
    body: [
      'Radios canal surge height 25 minutes before that water reaches this ward culvert.',
      'পানি এই ওয়ার্ডের কালভার্টে পৌঁছানোর ২৫ মিনিট আগেই উজানের খালের ঢলের খবর পাঠায়।',
    ],
  },
};

export function HardwareScene({
  tick,
  rawCm,
  decision,
  faultMode,
  hasPlastic,
  activePin,
  onPinClick,
}: Props) {
  const { bi, num } = useT();

  const rain = tick.rainMmHr;
  // When pump triggers early (not missed), it draws water down ~18 cm!
  const effectiveTrueCm = decision.triggers
    ? Math.max(24, tick.trueLevelCm - 18)
    : tick.trueLevelCm;
  const streetFlooded = effectiveTrueCm >= FLOOD_CM;
  const streetWaterH = streetFlooded ? Math.min(48, (effectiveTrueCm - FLOOD_CM + 8) * 1.4) : 0;

  // Culvert interior water y: 396 (bottom) up to 248 (street road surface = 85 cm)
  const cmToY = (cm: number) => 396 - Math.min(118, Math.max(12, cm)) * 1.38;
  const waterTopY = cmToY(effectiveTrueCm);
  const predY = cmToY(decision.displayCm);

  const drops = useMemo(
    () =>
      Array.from({ length: 76 }, (_, i) => ({
        x: (i * 67) % 490,
        y: (i * 47) % 245,
        len: 12 + (i % 7),
        delay: -((i * 0.13) % 0.9),
      })),
    [],
  );
  const visibleDrops = Math.round(Math.min(1, rain / 90) * drops.length);

  const beamEndY = faultMode === 'stuck' ? 268 : hasPlastic ? Math.min(waterTopY - 6, 286) : waterTopY;

  const pinBadge = (id: DrainPinId, x: number, y: number, label: string, dotColor: string) => {
    const isSel = activePin === id;
    const w = label.length * 6.8 + 24;
    return (
      <g
        className={isSel ? 'ds-pin active' : 'ds-pin'}
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
        <rect x={-2} y={-11} width={w} height={21} rx={10.5} className="ds-pin-pill" />
        <circle cx={9} cy={-0.5} r={4} fill={dotColor} />
        <text x={18} y={3.5} className="ds-pin-txt">
          {label}
        </text>
      </g>
    );
  };

  return (
    <div className="ds-stage-box">
      <svg
        className="ds-hero-svg"
        viewBox="0 0 820 426"
        role="img"
        aria-label={bi(
          'Animated monsoon street, underground culvert ultrasonic sensor, ESP32 board, live OLED screen and stormwater pump',
          'বর্ষার রাস্তা, মাটির নিচের কালভার্টের আল্ট্রাসনিক সেন্সর, ESP32 বোর্ড, সরাসরি OLED পর্দা এবং নিষ্কাশন পাম্পের অ্যানিমেশন',
        )}
      >
        <defs>
          <linearGradient id="ds-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8bb6d8" />
            <stop offset="1" stopColor="#ddeaf2" />
          </linearGradient>
          <linearGradient id="ds-pcb" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1e293b" />
            <stop offset="1" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="ds-water-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3b82f6" stopOpacity="0.88" />
            <stop offset="1" stopColor="#1d4ed8" stopOpacity="0.96" />
          </linearGradient>
          <pattern id="ds-iso-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgb(20 35 58 / 8%)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* ====== RIGHT WORKBENCH DRAFTING GRID (learn-esp32 aesthetic) ====== */}
        <rect x="478" y="0" width="342" height="426" fill="#f7f3e8" />
        <rect x="478" y="0" width="342" height="426" fill="url(#ds-iso-grid)" />
        <line x1="478" y1="0" x2="478" y2="426" stroke="#cbd5cf" strokeWidth="2" />

        {/* ====== LEFT: DHAKA MONSOON STREET + UNDERGROUND CULVERT ====== */}
        <g>
          {/* Sky + storm darkening */}
          <rect x="0" y="0" width="478" height="236" fill="url(#ds-sky)" />
          <rect
            x="0"
            y="0"
            width="478"
            height="236"
            fill="#1e293b"
            opacity={Math.min(0.74, (rain / 95) * 0.75).toFixed(2)}
          />
          {rain >= 75 && <rect x="0" y="0" width="478" height="236" fill="#ffffff" className="ds-flash" />}

          {/* Sun when calm */}
          {rain < 18 && (
            <circle cx="62" cy="50" r="22" fill="#fbbf24" opacity="0.92" />
          )}

          {/* Drifting monsoon clouds */}
          <g className="ds-cloud" fill={rain > 45 ? '#475569' : '#cbd5e1'} opacity="0.92">
            <ellipse cx="115" cy="44" rx="68" ry="22" />
            <ellipse cx="268" cy="36" rx="86" ry="25" />
            <ellipse cx="408" cy="48" rx="64" ry="20" />
          </g>

          {/* Upstream Khal mini-horizon (left bank) */}
          <rect x="12" y="138" width="96" height="82" rx="6" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
          <rect
            x="14"
            y={218 - Math.min(74, tick.upstreamCm * 0.52)}
            width="92"
            height={Math.min(74, tick.upstreamCm * 0.52)}
            rx="4"
            fill="#2563eb"
          />
          <line x1="60" y1="118" x2="60" y2="138" stroke="#334155" strokeWidth="2.5" />
          <circle cx="60" cy="116" r="4" fill="#f97316" />
          <circle cx="60" cy="116" r="10" fill="none" stroke="#f97316" strokeWidth="1.4" className="ds-radio-ring" />
          <text x="60" y="212" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="700">
            {num(tick.upstreamCm)} cm
          </text>

          {/* Ward buildings & tin-roof shops */}
          <g transform="translate(126 116)">
            <rect width="78" height="104" fill="#eadbc4" stroke="#8a7a5f" strokeWidth="1.5" />
            {[0, 1, 2].map((r) =>
              [0, 1].map((c) => (
                <rect
                  key={`${r}-${c}`}
                  x={13 + c * 32}
                  y={14 + r * 26}
                  width="18"
                  height="16"
                  rx="2"
                  fill={rain > 55 ? '#fcd34d' : '#7fa6c4'}
                />
              )),
            )}
            <rect x="24" y="82" width="30" height="22" fill="#64748b" />
          </g>

          <g transform="translate(216 154)">
            <rect width="84" height="66" fill="#d6cbb5" stroke="#78716c" strokeWidth="1.5" />
            <path d="M-5 4 L42 -14 L89 4 Z" fill="#b4643c" stroke="#7c3f22" strokeWidth="1.5" />
            <rect x="14" y="26" width="24" height="40" fill="#57534e" />
            <rect x="48" y="26" width="22" height="18" fill="#fde68a" />
          </g>

          {/* Roadside IoT Pole + Rain Gauge */}
          <rect x="336" y="96" width="6" height="124" fill="#475569" />
          <rect x="323" y="84" width="32" height="16" rx="3" fill="#f8fafc" stroke="#334155" strokeWidth="1.5" />
          <text x="339" y="78" textAnchor="middle" fill="#f8fafc" fontSize="10.5" fontWeight="700" stroke="#0f172a" strokeWidth="2.5" paintOrder="stroke">
            🌧️ {num(rain)} mm/h
          </text>

          {/* Asphalt Road (y = 220..246) */}
          <rect x="0" y="220" width="478" height="26" fill="#475569" />
          <line x1="0" y1="233" x2="478" y2="233" stroke="#f1f5f9" strokeWidth="2" strokeDasharray="16 12" />

          {/* Green CNG Auto-Rickshaw on the road */}
          <g
            className="ds-cng"
            transform={`translate(${streetFlooded ? 128 : 246} ${streetFlooded ? 196 : 198})`}
          >
            <rect width="54" height="26" rx="9" fill="#15803d" stroke="#14532d" strokeWidth="1.5" />
            <path d="M4 8 Q27 -4 50 8" fill="#166534" />
            <rect x="8" y="6" width="19" height="11" rx="2.5" fill="#cfe8f6" />
            <circle cx="12" cy="27" r="5.5" fill="#1e293b" />
            <circle cx="43" cy="27" r="5.5" fill="#1e293b" />
          </g>

          {/* Rising street floodwater when spillover (>= 85 cm) happens! */}
          {streetWaterH > 0 && (
            <g>
              <rect
                x="0"
                y={246 - streetWaterH}
                width="478"
                height={streetWaterH}
                fill="#2563eb"
                opacity="0.62"
              />
              <path
                d={`M0 ${246 - streetWaterH} q16 -4 32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0 t32 0`}
                fill="none"
                stroke="#bfdbfe"
                strokeWidth="2.5"
                className="ds-wave-line"
              />
            </g>
          )}

          {/* Falling diagonal rain */}
          <g className="ds-rain" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round">
            {drops.slice(0, visibleDrops).map((d, i) => (
              <line
                key={i}
                x1={d.x}
                y1={d.y}
                x2={d.x - 7}
                y2={d.y + d.len}
                style={{ animationDelay: `${d.delay}s` }}
              />
            ))}
          </g>

          {/* ====== UNDERGROUND SOIL & CONCRETE DRAIN CULVERT (y = 246..426) ====== */}
          <rect x="0" y="246" width="478" height="180" fill="#7c6347" />
          {/* Concrete culvert chamber */}
          <rect
            x="28"
            y="254"
            width="336"
            height="152"
            rx="8"
            fill="#1e293b"
            stroke="#94a3b8"
            strokeWidth="4"
          />

          {/* Street spillover warning line inside culvert */}
          <line
            x1="34"
            y1={cmToY(FLOOD_CM)}
            x2="358"
            y2={cmToY(FLOOD_CM)}
            stroke="#f97316"
            strokeWidth="1.6"
            strokeDasharray="5 4"
          />
          <text x="40" y={cmToY(FLOOD_CM) - 5} fill="#fdba74" fontSize="10" fontWeight="700">
            {bi('Spillover', 'উপচে পড়ার সীমা')} {num(FLOOD_CM)}cm
          </text>

          {/* Rising water inside culvert */}
          <rect
            x="31"
            y={waterTopY}
            width="330"
            height={Math.max(6, 403 - waterTopY)}
            rx="4"
            fill="url(#ds-water-grad)"
            className="ds-water-fill"
          />
          <path
            d={`M32 ${waterTopY} q15 -3 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0`}
            fill="none"
            stroke="#93c5fd"
            strokeWidth="2.5"
            className="ds-wave-line"
          />

          {/* Animated water flow dashes */}
          <line
            x1="44"
            y1={Math.min(392, waterTopY + 18)}
            x2="348"
            y2={Math.min(392, waterTopY + 18)}
            stroke="#bfdbfe"
            strokeWidth="2.5"
            strokeDasharray="10 10"
            className="ds-pipe-flow"
          />

          {/* AI +30m ghost water line (shown for Trend / Cloud / Tree) */}
          {decision.mode !== 'rule' && decision.online && (
            <g>
              <line
                x1="34"
                y1={predY}
                x2="358"
                y2={predY}
                stroke="#2dd4bf"
                strokeWidth="2.2"
                strokeDasharray="6 3"
              />
              <text x="352" y={predY - 5} textAnchor="end" fill="#5eead4" fontSize="10.5" fontWeight="700">
                AI +30m: {num(decision.displayCm)}cm
              </text>
            </g>
          )}

          {/* HC-SR04P Ultrasonic Sensor mounted to culvert ceiling! */}
          <g transform="translate(174 256)">
            <rect x="0" y="0" width="52" height="14" rx="2.5" fill="#0284c7" stroke="#e0f2fe" strokeWidth="1.2" />
            <rect x="6" y="12" width="14" height="9" rx="2" fill="#cbd5e1" stroke="#475569" />
            <rect x="32" y="12" width="14" height="9" rx="2" fill="#cbd5e1" stroke="#475569" />
            {faultMode === 'stuck' && (
              <ellipse cx="26" cy="21" rx="24" ry="6" fill="#78350f" stroke="#b45309" strokeWidth="1.5" />
            )}
          </g>

          {/* Animated ultrasonic wave arcs beaming down */}
          <g stroke="#38bdf8" fill="none" strokeWidth="1.8">
            <path d="M188 286 Q200 294 212 286" className="ds-ping p1" />
            <path d="M182 298 Q200 309 218 298" className="ds-ping p2" />
            {beamEndY > 312 && <path d="M176 312 Q200 326 224 312" className="ds-ping p3" />}
            <line
              x1="200"
              y1="278"
              x2="200"
              y2={beamEndY}
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeDasharray="3 4"
              opacity="0.7"
            />
          </g>

          {/* Floating plastic bottle echo obstacle when triggered */}
          {hasPlastic && (
            <g transform={`translate(182 ${Math.min(waterTopY - 12, 282)})`} className="ds-bob">
              <rect width="34" height="13" rx="5" fill="#fb923c" stroke="#fff7ed" strokeWidth="1.4" />
              <rect x="32" y="3" width="6" height="7" rx="1.5" fill="#ea580c" />
              <text x="17" y="-5" textAnchor="middle" fill="#fed7aa" fontSize="10" fontWeight="800">
                112cm ECHO!
              </text>
            </g>
          )}

          {/* Culvert live depth readout */}
          <text x="42" y="394" fill="#e2e8f0" fontSize="11.5" fontWeight="700">
            {bi('True depth', 'আসল গভীরতা')}: {num(Math.round(effectiveTrueCm))} cm ·{' '}
            {bi('Raw echo', 'কাঁচা প্রতিধ্বনি')}: {rawCm === null ? 'LOST' : `${num(rawCm)} cm`}
          </text>

          {/* ====== STORMWATER PUMP IMPELLER HOUSING (bottom-right of culvert) ====== */}
          <g transform="translate(412 332)">
            {/* Discharge pipe */}
            <rect x="18" y="-14" width="48" height="20" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
            {decision.triggers && (
              <line
                x1="22"
                y1="-4"
                x2="64"
                y2="-4"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeDasharray="6 6"
                className="ds-pipe-flow"
              />
            )}
            <circle
              cx="0"
              cy="0"
              r="34"
              fill={decision.triggers ? '#0f766e' : '#334155'}
              stroke={decision.triggers ? '#5eead4' : '#94a3b8'}
              strokeWidth="3"
            />
            <g className={decision.triggers ? 'ds-impeller spin' : 'ds-impeller'}>
              <line x1="-22" y1="0" x2="22" y2="0" stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round" />
              <line x1="0" y1="-22" x2="0" y2="22" stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round" />
              <line x1="-15" y1="-15" x2="15" y2="15" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
              <line x1="15" y1="-15" x2="-15" y2="15" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
              <circle cx="0" cy="0" r="7" fill="#0f172a" stroke="#f8fafc" strokeWidth="2" />
            </g>
            <text
              x="0"
              y="50"
              textAnchor="middle"
              fill="#f8fafc"
              fontSize="11"
              fontWeight="800"
              stroke="#0f172a"
              strokeWidth="3"
              paintOrder="stroke"
            >
              {decision.triggers ? bi('⚡ PUMP ON', '⚡ পাম্প চালু') : bi('PUMP STANDBY', 'পাম্প বন্ধ')}
            </text>
          </g>
        </g>

        {/* ====== RIGHT: CEL-SHADED ESP32 DEVKIT + OLED + RELAY + ANIMATED WIRES ====== */}
        {/* Animated DuPont Jumper Wires from HC-SR04 -> ESP32 -> OLED -> Pump Relay */}
        <g fill="none" strokeLinecap="round">
          {/* TRIG/ECHO sensor cable from culvert to ESP32 */}
          <path d="M226 262 C340 262, 440 164, 520 164" stroke="#0f172a" strokeWidth="5.5" />
          <path
            d="M226 262 C340 262, 440 164, 520 164"
            stroke="#38bdf8"
            strokeWidth="2.8"
            strokeDasharray="8 10"
            className="ds-wire-pulse"
          />

          {/* I2C wires from ESP32 to SSD1306 OLED */}
          <path d="M652 132 C682 132, 682 88, 698 88" stroke="#0284c7" strokeWidth="3.2" />
          <path d="M652 144 C686 144, 686 100, 698 100" stroke="#eab308" strokeWidth="3.2" />

          {/* Relay output wire from ESP32 GPIO 26 down to Pump Relay */}
          <path d="M585 232 C585 292, 530 310, 446 322" stroke="#1e293b" strokeWidth="5" />
          <path
            d="M585 232 C585 292, 530 310, 446 322"
            stroke={decision.triggers ? '#f97316' : '#64748b'}
            strokeWidth="2.8"
            strokeDasharray={decision.triggers ? '7 8' : undefined}
            className={decision.triggers ? 'ds-wire-pulse fast' : undefined}
          />
        </g>

        {/* Cloud / 4G Radio Arcs when Cloud AI mode is selected */}
        {decision.mode === 'cloud' && (
          <g transform="translate(585 52)">
            <rect
              x="-52"
              y="-32"
              width="104"
              height="26"
              rx="13"
              fill={decision.online ? '#0f172a' : '#991b1b'}
            />
            <text x="0" y="-15" textAnchor="middle" fill="#f8fafc" fontSize="10.5" fontWeight="700" className="mono">
              {decision.online ? '☁ CLOUD 4G OK' : '✕ 4G BLACKOUT'}
            </text>
            {decision.online && (
              <>
                <path
                  d="M-22 18 A28 28 0 0 1 22 18"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.2"
                  className="ds-ping p1"
                />
                <path
                  d="M-34 10 A42 42 0 0 1 34 10"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  className="ds-ping p2"
                />
              </>
            )}
          </g>
        )}

        {/* Cel-shaded ESP32 DevKit V1 Board */}
        <g transform="translate(516 78)">
          {/* Drop shadow */}
          <rect x="4" y="6" width="138" height="158" rx="10" fill="rgb(15 23 42 / 22%)" />
          {/* Dark PCB */}
          <rect width="138" height="158" rx="10" fill="url(#ds-pcb)" stroke="#0f172a" strokeWidth="2.5" />
          {/* Copper meander PCB antenna */}
          <path
            d="M42 10 h10 v10 h10 v-10 h10 v10 h10 v-10 h14 v14"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.4"
          />
          {/* Silver ESP-WROOM-32 RF Shield */}
          <rect x="28" y="28" width="82" height="62" rx="4" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
          <text x="69" y="54" textAnchor="middle" fill="#1e293b" fontSize="9.5" fontWeight="800" className="mono">
            ESP-WROOM-32
          </text>
          <text x="69" y="68" textAnchor="middle" fill="#334155" fontSize="8.5" fontWeight="700" className="mono">
            {decision.mode.toUpperCase()}
          </text>
          {/* Gold GPIO header pins (left & right rails) */}
          {Array.from({ length: 11 }, (_, i) => (
            <g key={i}>
              <rect x="7" y={20 + i * 11} width="9" height="6" rx="1" fill="#eab308" stroke="#713f12" strokeWidth="0.8" />
              <rect x="122" y={20 + i * 11} width="9" height="6" rx="1" fill="#eab308" stroke="#713f12" strokeWidth="0.8" />
            </g>
          ))}
          {/* PWR (red) & AI TX (cyan/orange) SMD LEDs */}
          <circle cx="42" cy="112" r="3.5" fill="#ef4444" />
          <circle
            cx="96"
            cy="112"
            r="4"
            fill={decision.triggers ? '#f97316' : '#38bdf8'}
            className="ds-led-blink"
          />
          <text x="42" y="125" textAnchor="middle" fill="#94a3b8" fontSize="7.5" className="mono">
            PWR
          </text>
          <text x="96" y="125" textAnchor="middle" fill="#94a3b8" fontSize="7.5" className="mono">
            AI
          </text>
          {/* EN / BOOT buttons + USB-C port */}
          <rect x="26" y="134" width="14" height="10" rx="2" fill="#94a3b8" />
          <rect x="98" y="134" width="14" height="10" rx="2" fill="#94a3b8" />
          <rect x="50" y="144" width="38" height="18" rx="4" fill="#e2e8f0" stroke="#334155" strokeWidth="2" />
        </g>

        {/* SSD1306 128×64 Live OLED Screen */}
        <g transform="translate(674 52)">
          <rect x="3" y="4" width="134" height="94" rx="8" fill="rgb(15 23 42 / 18%)" />
          <rect width="134" height="94" rx="8" fill="#1d4ed8" stroke="#0f172a" strokeWidth="2" />
          <rect x="8" y="12" width="118" height="72" rx="4" fill="#050e17" stroke="#334155" />
          <text x="67" y="9" textAnchor="middle" fill="#dbeafe" fontSize="7.5" fontWeight="700" className="mono">
            OLED 128×64 · I2C
          </text>
          {/* Glowing pixel text on the OLED */}
          <text x="14" y="30" fill="#facc15" fontSize="9.5" fontWeight="700" className="mono">
            {decision.oledLine1}
          </text>
          <text
            x="14"
            y="47"
            fill={decision.triggers ? '#fb923c' : decision.online ? '#38bdf8' : '#f87171'}
            fontSize="10"
            fontWeight="800"
            className="mono"
          >
            {decision.oledLine2}
          </text>
          {/* Live pixel water bar on OLED */}
          <rect x="14" y="57" width="106" height="9" rx="2" fill="#0f2942" stroke="#0284c7" strokeWidth="1" />
          <rect
            x="15"
            y="58"
            width={Math.min(104, Math.max(4, (decision.displayCm / 120) * 104))}
            height="7"
            rx="1"
            fill={decision.triggers ? '#f97316' : '#38bdf8'}
          />
          <text x="14" y="77" fill="#7dd3fc" fontSize="8" className="mono">
            KHAL:{tick.upstreamCm} RAIN:{rain}
          </text>
        </g>

        {/* Opto-Relay Module Box */}
        <g transform="translate(678 242)">
          <rect width="126" height="74" rx="8" fill="#1e3a8a" stroke="#0f172a" strokeWidth="2" />
          <rect x="12" y="12" width="66" height="48" rx="4" fill="#2563eb" stroke="#93c5fd" strokeWidth="1.2" />
          <circle
            cx="102"
            cy="26"
            r="6"
            fill={decision.triggers ? '#22c55e' : '#334155'}
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          <text x="45" y="35" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="800" className="mono">
            RELAY 10A
          </text>
          <text x="45" y="49" textAnchor="middle" fill="#bfdbfe" fontSize="8.5" className="mono">
            GPIO 26 → {decision.triggers ? 'CLOSED' : 'OPEN'}
          </text>
        </g>

        {/* Clickable Hardware Callout Pins (learn-esp32 style) */}
        {pinBadge('khal', 14, 96, 'KHAL LORA', '#f97316')}
        {pinBadge('ultrasonic', 232, 270, 'HC-SR04P', '#0284c7')}
        {pinBadge('esp32', 520, 250, 'ESP32 AI', '#f97316')}
        {pinBadge('oled', 682, 162, 'OLED', '#0284c7')}
        {pinBadge('relay', 684, 332, 'PUMP RELAY', '#16a34a')}
      </svg>

      {/* Floating Forecast Status Card (tree.html top-left style) */}
      <div className={streetFlooded ? 'ds-float-card bad' : decision.triggers ? 'ds-float-card warn' : 'ds-float-card'}>
        <span className="ds-float-ico" aria-hidden="true">
          {decision.mode === 'rule'
            ? '📏'
            : decision.mode === 'tree'
              ? '🌳'
              : decision.mode === 'cloud'
                ? '☁️'
                : '📈'}
        </span>
        <div>
          <span className="ds-float-k">
            {bi('Minute', 'মিনিট')} {num(tick.minute)} ·{' '}
            {streetFlooded
              ? bi('STREET FLOODED!', 'রাস্তায় পানি উঠেছে!')
              : decision.triggers
                ? bi('Pump started ahead of surge', 'ঢলের আগেই পাম্প চালু')
                : bi('Road clear', 'রাস্তা শুকনো')}
          </span>
          <div className="ds-meter">
            <i style={{ width: `${Math.min(100, Math.round((effectiveTrueCm / FLOOD_CM) * 100))}%` }} />
          </div>
        </div>
      </div>

      {/* Hardware Pin Inspector Popover when user clicks a pin */}
      {activePin && (
        <div className="ds-pin-pop" role="status">
          <div>
            <b>{bi(PIN_INFO[activePin].title[0], PIN_INFO[activePin].title[1])}</b>
            <p>{bi(PIN_INFO[activePin].body[0], PIN_INFO[activePin].body[1])}</p>
          </div>
          <button
            type="button"
            className="btn ghost small"
            onClick={() => onPinClick(activePin)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
