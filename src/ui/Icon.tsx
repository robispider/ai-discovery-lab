import type { ReactNode } from 'react';
import type { ThumbId } from '../lessons/types';

export type RailIconId = 'home' | 'lessons' | 'map' | 'glossary' | 'session' | 'settings';

const RAIL: Record<RailIconId, ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />,
  lessons: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  map: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  glossary: (
    <>
      <path d="M4 4h7a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2.5H4z" />
      <path d="M20 4h-3a3 3 0 0 0-3 3M20 4v13.5h-5" />
    </>
  ),
  session: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2M9 2h6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </>
  ),
};

export function RailIcon({ id }: { id: RailIconId }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {RAIL[id]}
    </svg>
  );
}

const THUMB: Record<ThumbId, ReactNode> = {
  route: (
    <>
      <path d="M4 28V18h12V8h14" />
      <circle cx="4" cy="28" r="2.5" fill="currentColor" />
      <circle cx="30" cy="8" r="2.5" fill="currentColor" />
    </>
  ),
  rules: (
    <>
      <rect x="3" y="6" width="16" height="8" rx="2" />
      <rect x="3" y="20" width="16" height="8" rx="2" />
      <path d="m19 10 10 7M19 24l10-7" />
      <circle cx="30" cy="17" r="2.5" fill="currentColor" />
    </>
  ),
  tree: (
    <>
      <circle cx="17" cy="6" r="3" />
      <path d="m17 9-9 10M17 9l9 10" />
      <circle cx="8" cy="22" r="3" />
      <circle cx="26" cy="22" r="3" fill="currentColor" />
    </>
  ),
  regression: (
    <>
      <path d="M3 30 31 6" />
      <circle cx="8" cy="24" r="1.8" fill="currentColor" />
      <circle cx="14" cy="22" r="1.8" fill="currentColor" />
      <circle cx="20" cy="14" r="1.8" fill="currentColor" />
      <circle cx="27" cy="12" r="1.8" fill="currentColor" />
    </>
  ),
  cluster: (
    <>
      <circle cx="9" cy="10" r="2" fill="currentColor" />
      <circle cx="12" cy="7" r="2" fill="currentColor" />
      <circle cx="24" cy="12" r="2" />
      <circle cx="27" cy="9" r="2" />
      <circle cx="14" cy="25" r="2" fill="currentColor" />
      <circle cx="18" cy="27" r="2" fill="currentColor" />
    </>
  ),
  network: (
    <>
      <circle cx="5" cy="10" r="2.5" />
      <circle cx="5" cy="24" r="2.5" />
      <circle cx="17" cy="6" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
      <circle cx="17" cy="28" r="2.5" />
      <circle cx="29" cy="17" r="2.5" fill="currentColor" />
      <path d="m7 10 8-4M7 10l8 7M7 24l8-7M7 24l8 4M19 6l8 11M19 28l8-11M19 17h8" />
    </>
  ),
  camera: (
    <>
      <rect x="4" y="9" width="26" height="18" rx="3" />
      <circle cx="17" cy="18" r="5" />
      <path d="m11 9 2-4h8l2 4" />
    </>
  ),
  signal: (
    <>
      <rect x="12" y="3" width="10" height="28" rx="3" />
      <circle cx="17" cy="9" r="2" />
      <circle cx="17" cy="17" r="2" />
      <circle cx="17" cy="25" r="2" fill="currentColor" />
    </>
  ),
  robot: (
    <>
      <rect x="6" y="8" width="22" height="17" rx="4" />
      <path d="M17 8V4m-5 12h.1m9.9 0h.1M14 20h6M10 25v4m14-4v4" />
    </>
  ),
  bars: (
    <>
      <rect x="4" y="6" width="22" height="5" rx="2" fill="currentColor" />
      <rect x="4" y="15" width="14" height="5" rx="2" />
      <rect x="4" y="24" width="8" height="5" rx="2" />
    </>
  ),
  tokens: (
    <>
      <rect x="3" y="20" width="8" height="8" rx="2" />
      <rect x="13" y="20" width="8" height="8" rx="2" />
      <rect x="23" y="20" width="8" height="8" rx="2" fill="currentColor" />
      <path d="M27 20C24 6 10 6 7 20" />
    </>
  ),
  compare: (
    <>
      <rect x="5" y="16" width="6" height="14" rx="1.5" />
      <rect x="14" y="9" width="6" height="21" rx="1.5" />
      <rect x="23" y="4" width="6" height="26" rx="1.5" fill="currentColor" />
    </>
  ),
  chip: (
    <>
      <rect x="4" y="4" width="26" height="26" rx="3" />
      <path d="M4 12h26M4 21h26M12 4v26M21 4v26" />
    </>
  ),
};

export function LessonThumb({ id, size = 34 }: { id: ThumbId; size?: number }) {
  return (
    <svg
      viewBox="0 0 34 34"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {THUMB[id]}
    </svg>
  );
}

export function LabMark({ size = 34 }: { size?: number }) {
  return (
    <svg viewBox="0 0 34 34" width={size} height={size} aria-hidden="true">
      <g fill="none" stroke="var(--ink)" strokeWidth="2">
        <path d="M8 24 17 9l9 15z" />
        <path d="M17 9v15" />
      </g>
      <circle cx="17" cy="9" r="4" fill="var(--accent)" />
      <circle cx="8" cy="24" r="4" fill="var(--ink)" />
      <circle cx="26" cy="24" r="4" fill="var(--warn)" />
    </svg>
  );
}
