/*
 * Cel-shaded SVG illustrations for every waste item in Lesson 7 (Waste Recogniser).
 * Drawn on a clean 80×80 canvas so each item works on the conveyor belt, sample studio cards,
 * evaluation grid and break-it camera view.
 */

export function WasteSvg({
  itemId,
  size = 56,
  className,
}: {
  itemId: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={className}
      aria-hidden="true"
    >
      <WasteGlyph itemId={itemId} />
    </svg>
  );
}

/** Inline `<g>` artwork so `SorterScene.tsx` can place items directly onto the conveyor belt! */
export function WasteGlyph({ itemId }: { itemId: string }) {
  switch (itemId) {
    case 'banana':
      return (
        <g stroke="#422006" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
          <path d="M16 56 C20 30, 38 18, 60 20 C56 34, 48 48, 30 60 Z" fill="#facc15" />
          <path d="M30 60 C46 56, 62 46, 68 34 C58 34, 48 42, 34 52 Z" fill="#eab308" />
          <path d="M14 54 C20 48, 28 46, 36 50" fill="none" stroke="#854d0e" strokeWidth="2" />
          <rect x="57" y="14" width="6" height="9" rx="2" fill="#713f12" transform="rotate(14 60 18)" />
          <circle cx="34" cy="36" r="2.2" fill="#713f12" stroke="none" />
          <circle cx="44" cy="32" r="1.8" fill="#713f12" stroke="none" />
          <circle cx="48" cy="44" r="2" fill="#713f12" stroke="none" />
        </g>
      );
    case 'mango':
      return (
        <g stroke="#14532d" strokeWidth="2.2" strokeLinejoin="round">
          <path d="M22 52 C14 34, 28 16, 50 18 C66 20, 66 44, 52 58 C40 68, 26 62, 22 52 Z" fill="#84cc16" />
          <path d="M28 50 C26 36, 36 24, 52 24 C60 26, 60 40, 48 52 Z" fill="#f59e0b" stroke="none" opacity="0.82" />
          <path d="M48 18 C52 10, 62 12, 60 20" fill="#15803d" />
          <ellipse cx="38" cy="34" rx="5" ry="2.5" fill="#fef08a" stroke="none" transform="rotate(-25 38 34)" />
        </g>
      );
    case 'veg-scraps':
    case 'spinach':
      return (
        <g stroke="#14532d" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
          <path d="M18 58 C12 38, 26 18, 44 16 C48 30, 40 48, 24 62 Z" fill={itemId === 'spinach' ? '#166534' : '#22c55e'} />
          <path d="M32 62 C36 40, 50 24, 66 24 C66 42, 54 58, 36 64 Z" fill={itemId === 'spinach' ? '#15803d' : '#4ade80'} />
          <path d="M22 58 L41 24 M36 60 L60 32" fill="none" stroke="#bbf7d0" strokeWidth="1.8" />
          {itemId === 'veg-scraps' && (
            <path d="M46 58 L64 48 L60 64 Z" fill="#f97316" stroke="#7c2d12" />
          )}
        </g>
      );
    case 'tea-leaves':
      return (
        <g stroke="#1c1917" strokeWidth="2" strokeLinejoin="round">
          <path d="M16 58 C18 36, 32 24, 46 28 C58 30, 66 44, 64 58 Z" fill="#57534e" />
          <ellipse cx="34" cy="46" rx="12" ry="7" fill="#4d7c0f" transform="rotate(-18 34 46)" />
          <ellipse cx="48" cy="48" rx="11" ry="6" fill="#3f6212" transform="rotate(20 48 48)" />
          <ellipse cx="42" cy="37" rx="9" ry="5" fill="#65a30d" />
          <circle cx="28" cy="54" r="3" fill="#78350f" stroke="none" />
          <circle cx="52" cy="54" r="3.5" fill="#78350f" stroke="none" />
        </g>
      );
    case 'guava':
      return (
        <g stroke="#14532d" strokeWidth="2.2" strokeLinejoin="round">
          <circle cx="40" cy="42" r="22" fill="#84cc16" />
          <path d="M46 24 C56 26, 62 36, 58 48 C50 46, 46 38, 46 24 Z" fill="#fef3c7" stroke="#65a30d" />
          <circle cx="52" cy="36" r="1.5" fill="#b45309" stroke="none" />
          <circle cx="54" cy="41" r="1.5" fill="#b45309" stroke="none" />
          <path d="M36 20 C36 12, 46 12, 48 16" fill="none" stroke="#15803d" strokeWidth="2.4" />
        </g>
      );
    case 'pet-bottle':
    case 'soda-bottle': {
      const tint = itemId === 'soda-bottle' ? '#34d399' : '#7dd3fc';
      const dark = itemId === 'soda-bottle' ? '#065f46' : '#0369a1';
      const label = itemId === 'soda-bottle' ? '#059669' : '#0284c7';
      return (
        <g stroke={dark} strokeWidth="2.2" strokeLinejoin="round">
          <rect x="33" y="10" width="14" height="7" rx="2" fill={label} />
          <path d="M34 17 L46 17 L52 28 L52 64 C52 68, 48 70, 40 70 C32 70, 28 68, 28 64 L28 28 Z" fill={tint} fillOpacity="0.88" />
          <rect x="28" y="37" width="24" height="15" fill={label} fillOpacity="0.85" />
          <line x1="34" y1="26" x2="34" y2="62" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" opacity="0.9" />
          <line x1="46" y1="30" x2="46" y2="35" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </g>
      );
    }
    case 'poly-bag':
    case 'milk-sachet': {
      const isMilk = itemId === 'milk-sachet';
      return (
        <g stroke="#1e40af" strokeWidth="2.2" strokeLinejoin="round">
          {!isMilk ? (
            <>
              <path d="M24 26 L24 14 C24 12, 31 12, 31 16 L31 28 L49 28 L49 16 C49 12, 56 12, 56 14 L56 26 L62 64 L18 64 Z" fill="#60a5fa" fillOpacity="0.88" />
              <path d="M28 36 L36 56 M48 34 L54 52" stroke="#dbeafe" strokeWidth="2.6" strokeLinecap="round" />
            </>
          ) : (
            <>
              <rect x="20" y="18" width="40" height="46" rx="5" fill="#f0f9ff" />
              <rect x="20" y="34" width="40" height="14" fill="#2563eb" />
              <line x1="27" y1="23" x2="27" y2="57" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" />
            </>
          )}
        </g>
      );
    }
    case 'food-tub':
    case 'yogurt-cup':
      return (
        <g stroke="#0369a1" strokeWidth="2.2" strokeLinejoin="round">
          <path d="M18 26 L62 26 L55 62 L25 62 Z" fill={itemId === 'yogurt-cup' ? '#f8fafc' : '#e0f2fe'} fillOpacity="0.92" />
          <rect x="14" y="21" width="52" height="7" rx="3" fill="#bae6fd" />
          <line x1="28" y1="32" x2="31" y2="56" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M22 44 L58 44" stroke="#38bdf8" strokeWidth="2" />
        </g>
      );
    case 'newspaper':
    case 'notebook-page':
    case 'muddy-paper': {
      const muddy = itemId === 'muddy-paper';
      const ruled = itemId === 'notebook-page';
      return (
        <g stroke={muddy ? '#44403c' : '#475569'} strokeWidth="2.2" strokeLinejoin="round">
          <path
            d="M18 16 L54 14 L64 24 L60 66 L16 64 Z"
            fill={muddy ? '#a8926d' : ruled ? '#fafaf5' : '#e7e5d8'}
          />
          <path d="M54 14 L54 24 L64 24" fill={muddy ? '#786344' : '#cbd5e1'} />
          {[28, 36, 44, 52, 58].map((y) => (
            <line
              key={y}
              x1="24"
              y1={y}
              x2="54"
              y2={y}
              stroke={ruled ? '#60a5fa' : '#64748b'}
              strokeWidth={y === 28 && !ruled ? 3 : 1.6}
            />
          ))}
          {muddy && (
            <>
              <circle cx="34" cy="44" r="10" fill="#78350f" opacity="0.52" stroke="none" />
              <circle cx="48" cy="52" r="7" fill="#57534e" opacity="0.48" stroke="none" />
            </>
          )}
        </g>
      );
    }
    case 'cardboard':
    case 'kraft-bag':
    case 'envelope':
    case 'greasy-box': {
      const greasy = itemId === 'greasy-box';
      const isEnv = itemId === 'envelope';
      return (
        <g stroke="#78350f" strokeWidth="2.2" strokeLinejoin="round">
          {isEnv ? (
            <>
              <rect x="14" y="24" width="52" height="36" rx="3" fill="#e6c89c" />
              <path d="M14 24 L40 44 L66 24" fill="#d4ad75" />
            </>
          ) : (
            <>
              <polygon points="16,30 40,18 64,30 64,60 40,70 16,60" fill="#d4a373" />
              <polygon points="16,30 40,42 64,30 40,18" fill="#e6be94" />
              <line x1="40" y1="42" x2="40" y2="70" />
              <line x1="28" y1="24" x2="52" y2="36" stroke="#92400e" strokeWidth="2" />
            </>
          )}
          {greasy && (
            <>
              <ellipse cx="38" cy="32" rx="11" ry="6" fill="#92400e" opacity="0.45" stroke="none" />
              <ellipse cx="42" cy="30" rx="5" ry="2.2" fill="#fef3c7" opacity="0.7" stroke="none" />
            </>
          )}
        </g>
      );
    }
    case 'paper-cup':
      return (
        <g stroke="#7c2d12" strokeWidth="2.2" strokeLinejoin="round">
          <path d="M22 22 L58 22 L52 64 L28 64 Z" fill="#e7d3b7" />
          <rect x="19" y="17" width="42" height="6" rx="3" fill="#f5efe6" />
          <path d="M24 37 L56 37 L54 49 L26 49 Z" fill="#c2783e" />
        </g>
      );
    case 'metal-can':
      return (
        <g stroke="#334155" strokeWidth="2.2" strokeLinejoin="round">
          <rect x="24" y="16" width="32" height="48" rx="6" fill="#cbd5e1" />
          <ellipse cx="40" cy="18" rx="16" ry="4.5" fill="#f1f5f9" />
          <rect x="24" y="29" width="32" height="22" fill="#dc2626" />
          <line x1="33" y1="20" x2="33" y2="60" stroke="#ffffff" strokeWidth="4.2" strokeLinecap="round" opacity="0.92" />
          <line x1="49" y1="22" x2="49" y2="58" stroke="#94a3b8" strokeWidth="2" />
        </g>
      );
    default:
      return <circle cx="40" cy="40" r="20" fill="var(--accent)" />;
  }
}
