/*
 * Tonight's street for lesson 3, drawn from the clues: rain, a drain under the road, the street's
 * height above the river, and the type of area. Water rises when the tree predicts waterlogging.
 * The colours are part of the illustration.
 */
import { useMemo } from 'react';
import type { Tonight } from '../../data/waterlogging';
import { useT } from '../../i18n';

const roadY = (elev: number) => 376 - ((elev - 1) / 11) * 134;
const RIVER_Y = 396;

export function Scene({ tonight, p }: { tonight: Tonight; p: number | null }) {
  const { bi, num } = useT();
  const { rain, block, elev, inf } = tonight;
  const ry = roadY(elev);
  const flood = p !== null && p >= 0.5;
  const water = flood ? 20 + ((p! - 0.5) / 0.5) * 46 : 0;
  const drops = useMemo(
    () =>
      Array.from({ length: 170 }, (_, i) => ({
        x: (i * 97) % 800,
        y: (i * 53) % 330,
        len: 10 + ((i * 7) % 9),
      })),
    [],
  );
  const nDrops = Math.round((rain / 200) * 170);
  const chunks = useMemo(
    () => Array.from({ length: 24 }, (_, i) => ({ x: 360 + i * 14, k: ((i * 37) % 100) / 100 })),
    [],
  );

  return (
    <svg
      className="tw-scene"
      viewBox="0 0 800 420"
      role="img"
      aria-label={bi(
        `A street in the rain: ${rain} mm of rain, drain ${block}% blocked, street ${elev} m above the river.`,
        `বৃষ্টিতে একটি রাস্তা: ${rain} মিমি বৃষ্টি, ড্রেন ${block}% বন্ধ, রাস্তা নদী থেকে ${elev} মি উঁচু।`,
      )}
    >
      <defs>
        <linearGradient id="tw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fd0f0" />
          <stop offset="1" stopColor="#dff0f7" />
        </linearGradient>
      </defs>
      <rect width="800" height="420" fill="url(#tw-sky)" />
      <rect width="800" height="420" fill="#2c3a4a" opacity={((rain / 200) * 0.7).toFixed(2)} />
      {rain < 12 && (
        <g>
          <circle cx="92" cy="66" r="28" fill="#ffd45e" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const c = Math.cos((a * Math.PI) / 180);
            const s = Math.sin((a * Math.PI) / 180);
            return (
              <line
                key={a}
                x1={92 + c * 36}
                y1={66 + s * 36}
                x2={92 + c * 46}
                y2={66 + s * 46}
                stroke="#ffd45e"
                strokeWidth="4"
                strokeLinecap="round"
              />
            );
          })}
        </g>
      )}
      <g opacity={Math.min(1, rain / 90).toFixed(2)} fill="#5d6b7a">
        <ellipse cx="160" cy="54" rx="90" ry="26" />
        <ellipse cx="420" cy="40" rx="120" ry="30" />
        <ellipse cx="690" cy="60" rx="100" ry="26" />
      </g>

      {/* ground from the road down to the river */}
      <path d={`M0 ${ry + 30} L800 ${ry + 30} L800 ${RIVER_Y} L0 ${RIVER_Y} Z`} fill="#9c8c6c" />
      <rect x="0" y={RIVER_Y} width="800" height="24" fill="#4f86b8" />
      <path
        d={`M0 ${RIVER_Y + 2} q20 -4 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0`}
        fill="none"
        stroke="#9cc6ea"
        strokeWidth="2"
      />

      {/* houses */}
      {inf ? (
        <g>
          {[30, 150, 255, 600, 700].map((x, i) => (
            <g key={x} transform={`translate(${x} ${ry - 62 - (i % 2) * 6})`}>
              <rect width="86" height="62" fill="#a7a08c" />
              <path d="M-6 4 L43 -16 L92 4 Z" fill="#8f9aa3" stroke="#6f7a83" />
              <path d="M2 -3h80M8 -9h68" stroke="#b9c3cb" />
              <rect x="34" y="28" width="18" height="34" fill="#5c4a3a" />
            </g>
          ))}
        </g>
      ) : (
        <g>
          {[24, 140, 600, 700].map((x, i) => (
            <g key={x} transform={`translate(${x} ${ry - 120 + (i % 2) * 20})`}>
              <rect
                width="92"
                height={120 - (i % 2) * 20}
                fill={i % 2 ? '#e7d6bf' : '#d7c8b4'}
                stroke="#bfae96"
              />
              {[0, 1, 2].map((r) =>
                [0, 1, 2].map((c) => (
                  <rect
                    key={`${r}${c}`}
                    x={12 + c * 26}
                    y={14 + r * 32}
                    width="16"
                    height="18"
                    fill="#7fa6bf"
                  />
                )),
              )}
            </g>
          ))}
        </g>
      )}

      {/* road */}
      <rect x="0" y={ry} width="800" height="30" fill="#4a5056" />
      <path d={`M0 ${ry + 15} H800`} stroke="#e8e2c8" strokeWidth="2" strokeDasharray="18 14" />
      {/* the drain under the road, with plastic and silt */}
      <rect x="352" y={ry + 34} width="348" height="20" rx="4" fill="#6b5b45" stroke="#4b3f30" />
      <rect
        x="356"
        y={ry + 38}
        width="340"
        height="12"
        rx="3"
        fill={flood ? '#6a8fb3' : '#5a7da0'}
        opacity={(1 - block / 100) * 0.9 + 0.1}
      />
      {chunks.map((c, i) =>
        c.k < block / 100 ? (
          <circle key={i} cx={c.x + 6} cy={ry + 44} r={5} fill={i % 3 ? '#8a6b45' : '#d9d2c0'} />
        ) : null,
      )}
      <text x="526" y={ry + 70} textAnchor="middle" className="tw-label">
        🗑️ {bi(`drain ${block}% blocked`, `ড্রেন ${num(block)}% বন্ধ`)}
      </text>

      {/* auto-rickshaw */}
      <g transform={`translate(${flood ? 180 : 420} ${ry - 18})`}>
        <rect width="56" height="30" rx="10" fill="#2f9e5b" />
        <rect x="8" y="5" width="22" height="13" rx="3" fill="#cde9f2" />
        <circle cx="12" cy="31" r="6" fill="#222" />
        <circle cx="46" cy="31" r="6" fill="#222" />
      </g>

      {/* flood water */}
      {flood && <rect x="0" y={ry + 30 - water} width="800" height={water} fill="#3f7fc0" opacity="0.55" />}
      {!flood && rain > 25 && (
        <g opacity={Math.min(1, rain / 90)} fill="#6f9fc8">
          <ellipse cx="410" cy={ry + 28} rx="28" ry="3" />
          <ellipse cx="540" cy={ry + 28} rx="38" ry="3" />
          <ellipse cx="660" cy={ry + 28} rx="22" ry="3" />
        </g>
      )}

      {/* height above the river */}
      <path d={`M770 ${ry + 30} V${RIVER_Y}`} stroke="#fff" strokeWidth="2" strokeDasharray="4 4" />
      <text x="760" y={(ry + 30 + RIVER_Y) / 2} textAnchor="end" className="tw-label strong">
        {bi(`${elev} m`, `${num(elev)} মি`)}
      </text>
      <text x="760" y={(ry + 30 + RIVER_Y) / 2 + 16} textAnchor="end" className="tw-label">
        {bi('above river', 'নদী থেকে উঁচু')}
      </text>

      {/* rain */}
      <g stroke="#dbe9f5" strokeWidth="1.4" opacity="0.8">
        {drops.slice(0, nDrops).map((d, i) => (
          <line key={i} x1={d.x} y1={d.y} x2={d.x - 4} y2={d.y + d.len} />
        ))}
      </g>
    </svg>
  );
}
