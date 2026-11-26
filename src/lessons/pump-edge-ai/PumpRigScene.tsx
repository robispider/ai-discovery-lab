/*
 * Live animated Pump-House + ESP32 + MPU-6050 + Breadboard + OLED Workbench for Lesson 14.
 * Inspired by learn-esp32.vercel.app (cel-shaded ESP32, half breadboard, glowing dome LEDs,
 * I2C wires with flowing pulses, live pixel OLED waveform, clickable part callout pins)
 * and legacy/experiments/tree.html (live animated city context & characters).
 */
import type { PumpAiDecision, PumpClass, PumpFeatures } from '../../engines/iot/pump';
import { useT } from '../../i18n';
import type { PumpPinId } from './store';

interface Props {
  kind: PumpClass | 'truck';
  micActive: boolean;
  samples: readonly number[];
  features: PumpFeatures;
  decision: PumpAiDecision;
  activePin: PumpPinId | null;
  onPinClick: (pin: PumpPinId) => void;
}

const PIN_INFO: Record<PumpPinId, { title: [string, string]; body: [string, string] }> = {
  mpu6050: {
    title: ['MPU-6050 Accelerometer (I2C · 200 Hz)', 'MPU-6050 কম্পন সেন্সর (I2C · ২০০ Hz)'],
    body: [
      'Tiny MEMS mass on micro-springs bolted to the bearing housing. Samples 200 vibrations per second.',
      'বিয়ারিংয়ের ওপর নাট দিয়ে লাগানো ক্ষুদ্র সেন্সর, যা প্রতি সেকেন্ডে ২০০ বার কম্পন মাপে।',
    ],
  },
  esp32: {
    title: ['ESP32 Edge AI Microcontroller', 'ESP32 এজ এআই মাইক্রোকন্ট্রোলার'],
    body: [
      'Runs the Fourier transform + your chosen AI model (40–256 bytes) locally on battery with zero internet.',
      'ইন্টারনেট ছাড়াই ব্যাটারিতে ফুরিয়ার ট্রান্সফর্ম ও আপনার বাছা এআই মডেল (৪০–২৫৬ বাইট) চালায়।',
    ],
  },
  oled: {
    title: ['128×64 OLED Live Oscilloscope', '১২৮×৬৪ OLED সরাসরি তরঙ্গ পর্দা'],
    body: [
      'Draws the live vibration wave, 3 frequency bars, and the AI verdict right at the pump station.',
      'পাম্পঘরেই সরাসরি কম্পনের তরঙ্গ, ৩টি ফ্রিকোয়েন্সি বার ও এআই-এর সিদ্ধান্ত দেখায়।',
    ],
  },
  leds: {
    title: ['Breadboard Status Dome LEDs (GPIO 2 / 4)', 'ব্রেডবোর্ডের সতর্কবাতি LED (GPIO 2 / 4)'],
    body: [
      'Green LED = healthy pump; glowing Red LED = maintenance alert before midnight breakdown!',
      'সবুজ বাতি = সুস্থ পাম্প; লাল উজ্জ্বল বাতি = মধ্যরাতে পাম্প নষ্ট হওয়ার আগেই সতর্কসংকেত!',
    ],
  },
  pump: {
    title: ['Stormwater Centrifugal Pump', 'স্টর্মওয়াটার সেন্ট্রিফিউগাল পাম্প'],
    body: [
      'Healthy shafts hum smoothly at 25 Hz. Worn bearings add 75 Hz metallic rattle days before seizing.',
      'সুস্থ শ্যাফট ২৫ Hz-এ মসৃণ ঘোরে। বিয়ারিং ক্ষয় হলে নষ্ট হওয়ার কয়েক দিন আগেই ৭৫ Hz ধাতব কম্পন শুরু হয়।',
    ],
  },
};

export function PumpRigScene({
  kind,
  micActive,
  samples,
  features,
  decision,
  activePin,
  onPinClick,
}: Props) {
  const { bi, num } = useT();
  const running = micActive || kind !== 'idle';
  const shakeClass =
    features.rms > 0.62 ? 'pe-pump-shake hard' : features.rms > 0.25 ? 'pe-pump-shake mild' : '';

  // Mini waveform path drawn directly inside the 128x64 OLED screen!
  const oledWave = samples
    .slice(0, 64)
    .map((v, i) => {
      const x = 14 + (i / 63) * 102;
      const y = 57 - Math.max(-1.2, Math.min(1.2, v)) * 11;
      return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join('');

  const pinBadge = (id: PumpPinId, x: number, y: number, label: string, dotColor: string) => {
    const isSel = activePin === id;
    const w = label.length * 6.8 + 24;
    return (
      <g
        className={isSel ? 'pe-pin active' : 'pe-pin'}
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
        <rect x={-2} y={-11} width={w} height={21} rx={10.5} className="pe-pin-pill" />
        <circle cx={9} cy={-0.5} r={4} fill={dotColor} />
        <text x={18} y={3.5} className="pe-pin-txt">
          {label}
        </text>
      </g>
    );
  };

  return (
    <div className="pe-stage-box">
      <svg
        className="pe-hero-svg"
        viewBox="0 0 820 416"
        role="img"
        aria-label={bi(
          'Animated stormwater pump with MPU-6050 sensor wired to an ESP32, live OLED oscilloscope and breadboard status LEDs',
          'স্টর্মওয়াটার পাম্পে লাগানো MPU-6050 সেন্সর, ESP32 বোর্ড, সরাসরি OLED পর্দা ও ব্রেডবোর্ডের সতর্কবাতি',
        )}
      >
        <defs>
          <linearGradient id="pe-pcb" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1e293b" />
            <stop offset="1" stopColor="#0f172a" />
          </linearGradient>
          <pattern id="pe-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgb(20 35 58 / 8%)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* ====== RIGHT WORKBENCH CREAM GRID (learn-esp32 style) ====== */}
        <rect x="404" y="0" width="416" height="416" fill="#f7f3e8" />
        <rect x="404" y="0" width="416" height="416" fill="url(#pe-grid)" />

        {/* ====== LEFT: MUNICIPAL PUMP HOUSE & STREET WINDOW ====== */}
        <rect x="0" y="0" width="404" height="416" fill="#e5dfd2" />
        <rect x="0" y="336" width="404" height="80" fill="#9c8d77" />
        <line x1="404" y1="0" x2="404" y2="416" stroke="#cbd5cf" strokeWidth="2" />

        {/* Pump-house street window (top-left) — cargo truck drives past when `truck` is active! */}
        <g transform="translate(26 24)">
          <rect width="236" height="92" rx="6" fill="#9ec5e5" stroke="#475569" strokeWidth="3" />
          <rect x="2" y="64" width="232" height="26" fill="#475569" />
          <line x1="6" y1="77" x2="228" y2="77" stroke="#f8fafc" strokeWidth="1.6" strokeDasharray="12 10" />
          {kind === 'truck' && (
            <g className="pe-truck-drive">
              <rect x="14" y="32" width="66" height="30" rx="4" fill="#ea580c" stroke="#7c2d12" strokeWidth="1.5" />
              <rect x="80" y="40" width="24" height="22" rx="3" fill="#fb923c" stroke="#7c2d12" strokeWidth="1.5" />
              <rect x="88" y="44" width="12" height="9" rx="1.5" fill="#e0f2fe" />
              <circle cx="28" cy="64" r="6.5" fill="#0f172a" />
              <circle cx="64" cy="64" r="6.5" fill="#0f172a" />
              <circle cx="92" cy="64" r="6.5" fill="#0f172a" />
            </g>
          )}
          {/* Window mullions */}
          <line x1="118" y1="0" x2="118" y2="92" stroke="#475569" strokeWidth="2.5" />
        </g>

        {/* Live Mic Badge inside Pump House when microphone is active */}
        {micActive && (
          <g transform="translate(278 36)">
            <rect width="108" height="34" rx="17" fill="#dc2626" />
            <text x="54" y="21" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800" className="mono">
              🎙 LIVE MIC
            </text>
          </g>
        )}

        {/* ====== CAST-IRON STORMWATER PUMP + SPINNING IMPELLER ====== */}
        <g className={shakeClass}>
          {/* Concrete pedestal */}
          <rect x="64" y="314" width="268" height="28" rx="4" fill="#64748b" stroke="#334155" strokeWidth="2" />

          {/* Suction intake pipe (left) & Outfall pipe (top) */}
          <rect x="8" y="232" width="96" height="40" rx="4" fill="#334155" stroke="#0f172a" strokeWidth="2" />
          <rect x="132" y="142" width="44" height="62" rx="4" fill="#334155" stroke="#0f172a" strokeWidth="2" />
          {running && (
            <>
              <line
                x1="14"
                y1="252"
                x2="96"
                y2="252"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeDasharray="8 8"
                className="pe-flow"
              />
              <line
                x1="154"
                y1="198"
                x2="154"
                y2="146"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeDasharray="8 8"
                className="pe-flow"
              />
            </>
          )}

          {/* Cavitation air-bubbles when intake is clogged */}
          {kind === 'cavitation' && (
            <g fill="#bae6fd" opacity="0.9">
              <circle cx="38" cy="244" r="5" className="pe-bubble" />
              <circle cx="62" cy="259" r="6" className="pe-bubble b2" />
              <circle cx="84" cy="246" r="4.5" className="pe-bubble" />
            </g>
          )}

          {/* Motor body (right) + Shaft + Bearing collar */}
          <rect x="218" y="206" width="118" height="96" rx="10" fill="#0f766e" stroke="#0f172a" strokeWidth="2.5" />
          {[0, 1, 2, 3].map((k) => (
            <line
              key={k}
              x1="232"
              y1={224 + k * 18}
              x2="322"
              y2={224 + k * 18}
              stroke="#115e59"
              strokeWidth="4"
            />
          ))}
          {/* Bearing collar between impeller volute and motor */}
          <rect
            x="192"
            y="232"
            width="28"
            height="44"
            rx="4"
            fill={!micActive && kind === 'bearing' ? '#ea580c' : '#94a3b8'}
            stroke="#0f172a"
            strokeWidth="2"
          />

          {/* Metallic micro-sparks when bearing wear is active! */}
          {!micActive && kind === 'bearing' && (
            <g stroke="#facc15" strokeWidth="2.2" strokeLinecap="round" className="pe-sparks">
              <line x1="196" y1="226" x2="188" y2="212" />
              <line x1="206" y1="224" x2="208" y2="208" />
              <line x1="215" y1="227" x2="225" y2="215" />
            </g>
          )}

          {/* Impeller volute casing + spinning rotor */}
          <circle cx="148" cy="254" r="54" fill="#1e3a5f" stroke="#0f172a" strokeWidth="3" />
          <circle cx="148" cy="254" r="38" fill="#0f172a" />
          <g transform="translate(148 254)">
            <g className={running ? 'pe-rotor spin' : 'pe-rotor'}>
              <line x1="-28" y1="0" x2="28" y2="0" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
              <line x1="0" y1="-28" x2="0" y2="28" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
              <line x1="-20" y1="-20" x2="20" y2="20" stroke="#7dd3fc" strokeWidth="5" strokeLinecap="round" />
              <line x1="20" y1="-20" x2="-20" y2="20" stroke="#7dd3fc" strokeWidth="5" strokeLinecap="round" />
              <circle cx="0" cy="0" r="9" fill="#cbd5e1" stroke="#0f172a" strokeWidth="2" />
            </g>
          </g>

          {/* Blue MPU-6050 Accelerometer PCB bolted to the bearing housing! */}
          <g transform="translate(184 186)">
            <rect width="44" height="28" rx="4" fill="#1d4ed8" stroke="#0f172a" strokeWidth="2" />
            <rect x="14" y="7" width="14" height="14" rx="2" fill="#0f172a" />
            <circle cx="7" cy="7" r="2.5" fill="#eab308" />
            <circle cx="37" cy="7" r="2.5" fill="#22c55e" />
          </g>
        </g>

        {/* ====== ANIMATED I2C JUMPER WIRES (MPU-6050 -> ESP32 -> OLED & BREADBOARD) ====== */}
        <g fill="none" strokeLinecap="round">
          <path d="M228 196 C320 196, 370 132, 442 132" stroke="#0f172a" strokeWidth="5.5" />
          <path
            d="M228 196 C320 196, 370 132, 442 132"
            stroke="#38bdf8"
            strokeWidth="2.8"
            strokeDasharray="7 9"
            className="pe-wire-pulse"
          />

          {/* ESP32 -> OLED I2C */}
          <path d="M578 106 C610 106, 616 74, 642 74" stroke="#0284c7" strokeWidth="3.2" />
          <path d="M578 118 C614 118, 620 88, 642 88" stroke="#eab308" strokeWidth="3.2" />

          {/* ESP32 -> Breadboard LED jumper wires (learn-esp32 orange/black arcs!) */}
          <path
            d="M558 198 C595 198, 625 232, 650 268"
            stroke={decision.isFault ? '#f97316' : '#64748b'}
            strokeWidth="4.2"
          />
          <path
            d="M540 206 C575 224, 592 248, 606 268"
            stroke={!decision.isFault ? '#16a34a' : '#64748b'}
            strokeWidth="4.2"
          />
        </g>

        {/* ====== CEL-SHADED ESP32 DEVKIT V1 ====== */}
        <g transform="translate(440 58)">
          <rect x="4" y="6" width="138" height="158" rx="10" fill="rgb(15 23 42 / 20%)" />
          <rect width="138" height="158" rx="10" fill="url(#pe-pcb)" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M42 10 h10 v10 h10 v-10 h10 v10 h10 v-10 h14 v14" fill="none" stroke="#f59e0b" strokeWidth="2.4" />
          <rect x="28" y="28" width="82" height="62" rx="4" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
          <text x="69" y="52" textAnchor="middle" fill="#1e293b" fontSize="9.5" fontWeight="800" className="mono">
            ESP-WROOM-32
          </text>
          <text x="69" y="67" textAnchor="middle" fill="#0f766e" fontSize="8.5" fontWeight="800" className="mono">
            {decision.mode.toUpperCase()}
          </text>
          {Array.from({ length: 11 }, (_, i) => (
            <g key={i}>
              <rect x="7" y={20 + i * 11} width="9" height="6" rx="1" fill="#eab308" stroke="#713f12" strokeWidth="0.8" />
              <rect x="122" y={20 + i * 11} width="9" height="6" rx="1" fill="#eab308" stroke="#713f12" strokeWidth="0.8" />
            </g>
          ))}
          <circle cx="42" cy="112" r="3.5" fill="#ef4444" />
          <circle cx="96" cy="112" r="4" fill={decision.isFault ? '#f97316' : '#38bdf8'} className="pe-blink" />
          <rect x="50" y="144" width="38" height="18" rx="4" fill="#e2e8f0" stroke="#334155" strokeWidth="2" />
        </g>

        {/* ====== LIVE 128×64 OLED OSCILLOSCOPE + VERDICT ====== */}
        <g transform="translate(640 34)">
          <rect x="3" y="4" width="156" height="106" rx="8" fill="rgb(15 23 42 / 18%)" />
          <rect width="156" height="106" rx="8" fill="#1d4ed8" stroke="#0f172a" strokeWidth="2" />
          <rect x="9" y="13" width="138" height="82" rx="4" fill="#050e17" stroke="#334155" />
          <text x="78" y="10" textAnchor="middle" fill="#dbeafe" fontSize="7.5" fontWeight="700" className="mono">
            OLED 128×64 · FFT
          </text>
          <text x="15" y="28" fill="#facc15" fontSize="9.5" fontWeight="700" className="mono">
            {decision.oledLine1}
          </text>
          <text
            x="15"
            y="41"
            fill={decision.isFault ? '#fb923c' : '#4ade80'}
            fontSize="10"
            fontWeight="800"
            className="mono"
          >
            {decision.oledLine2}
          </text>
          {/* Live pixel waveform right on the OLED! */}
          <path d={oledWave} fill="none" stroke="#38bdf8" strokeWidth="1.6" />
          {/* 3 mini FFT bars on the right side of the OLED */}
          <rect x="122" y={84 - Math.min(34, features.lowBand * 36)} width="5" height={Math.min(34, Math.max(3, features.lowBand * 36))} fill="#4ade80" />
          <rect x="130" y={84 - Math.min(34, features.midBand * 36)} width="5" height={Math.min(34, Math.max(3, features.midBand * 36))} fill="#a78bfa" />
          <rect x="138" y={84 - Math.min(34, features.highBand * 36)} width="5" height={Math.min(34, Math.max(3, features.highBand * 36))} fill="#fb923c" />
          <text x="15" y="88" fill="#7dd3fc" fontSize="8" className="mono">
            RMS:{num(features.rms.toFixed(2))}g HI:{num(features.highBand.toFixed(2))}
          </text>
        </g>

        {/* ====== HALF-SIZE BREADBOARD + GLOWING DOME LEDS (learn-esp32 style!) ====== */}
        <g transform="translate(566 244)">
          <rect x="4" y="6" width="228" height="122" rx="8" fill="rgb(15 23 42 / 16%)" />
          <rect width="228" height="122" rx="8" fill="#faf5e8" stroke="#1e293b" strokeWidth="2.2" />
          {/* Power rails */}
          <line x1="14" y1="14" x2="214" y2="14" stroke="#dc2626" strokeWidth="1.8" />
          <line x1="14" y1="21" x2="214" y2="21" stroke="#2563eb" strokeWidth="1.8" />
          <line x1="14" y1="101" x2="214" y2="101" stroke="#dc2626" strokeWidth="1.8" />
          <line x1="14" y1="108" x2="214" y2="108" stroke="#2563eb" strokeWidth="1.8" />
          {/* Center trough */}
          <rect x="10" y="57" width="208" height="8" rx="2" fill="#e2dac7" />
          {/* Breadboard pinholes */}
          {Array.from({ length: 14 }, (_, c) =>
            [32, 44, 74, 86].map((ry) => (
              <rect
                key={`${c}-${ry}`}
                x={20 + c * 14}
                y={ry}
                width="4"
                height="4"
                rx="0.8"
                fill="#334155"
              />
            )),
          )}

          {/* Green OK Dome LED */}
          <g transform="translate(40 34)">
            {!decision.isFault && <circle cx="0" cy="-12" r="20" fill="#22c55e" opacity="0.28" />}
            <line x1="-4" y1="0" x2="-4" y2="16" stroke="#475569" strokeWidth="2.5" />
            <line x1="4" y1="0" x2="4" y2="16" stroke="#475569" strokeWidth="2.5" />
            <path
              d="M-10 0 V-12 A10 10 0 0 1 10 -12 V0 Z"
              fill={!decision.isFault ? '#22c55e' : '#86efac'}
              stroke="#14532d"
              strokeWidth="1.8"
            />
          </g>

          {/* Red FAULT Dome LED */}
          <g transform="translate(96 34)">
            {decision.isFault && (
              <circle cx="0" cy="-12" r="24" fill="#ef4444" opacity="0.38" className="pe-blink" />
            )}
            <line x1="-4" y1="0" x2="-4" y2="16" stroke="#475569" strokeWidth="2.5" />
            <line x1="4" y1="0" x2="4" y2="16" stroke="#475569" strokeWidth="2.5" />
            <path
              d="M-11 0 V-13 A11 11 0 0 1 11 -13 V0 Z"
              fill={decision.isFault ? '#ef4444' : '#fca5a5'}
              stroke="#7f1d1d"
              strokeWidth="1.8"
            />
          </g>

          {/* Axial Resistors */}
          <rect x="136" y="41" width="28" height="8" rx="3" fill="#d97706" stroke="#451a03" strokeWidth="1.2" />
          <rect x="136" y="71" width="28" height="8" rx="3" fill="#d97706" stroke="#451a03" strokeWidth="1.2" />
        </g>

        {/* Clickable Hardware Callout Pins */}
        {pinBadge('mpu6050', 164, 166, 'MPU-6050', '#0284c7')}
        {pinBadge('pump', 76, 356, 'PUMP 25Hz', '#0f766e')}
        {pinBadge('esp32', 446, 232, 'ESP32 AI', '#f97316')}
        {pinBadge('oled', 648, 152, 'OLED FFT', '#0284c7')}
        {pinBadge('leds', 686, 224, 'FAULT LED', '#ef4444')}
      </svg>

      {activePin && (
        <div className="pe-pin-pop" role="status">
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
