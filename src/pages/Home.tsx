import { useState } from 'react';
import { Link } from 'react-router';
import { useT, type Bi } from '../i18n';
import { LESSONS } from '../lessons/registry';
import {
  FAMILIES,
  FAMILY_ORDER,
  lessonLabel,
  type FamilyId,
  type Lesson,
  type ThumbId,
} from '../lessons/types';
import { legacyUrl } from '../shell/links';
import { useLab } from '../store/useLab';
import { LessonThumb } from '../ui/Icon';
import './pages.css';

/* One line per family: what makes it different from the others. */
const TAGLINE: Record<FamilyId, Bi> = {
  classical: { en: 'People write the rules', bn: 'নিয়ম লেখে মানুষ' },
  ml: { en: 'Learns patterns from data', bn: 'ডেটা থেকে ধরন শেখে' },
  iot: { en: 'Sensors stream the physical world', bn: 'সেন্সর বাস্তব জগতের ডেটা দেয়' },
  nn: { en: 'Layers of simple neurons', bn: 'সরল নিউরনের স্তর' },
  dl: { en: 'Many layers, learns from pictures', bn: 'অনেক স্তর, ছবি থেকে শেখে' },
  rl: { en: 'Learns by trial and reward', bn: 'চেষ্টা ও পুরস্কারে শেখে' },
  lm: { en: 'Predicts the next word', bn: 'পরের শব্দ অনুমান করে' },
  cap: { en: 'Picks the right AI for the job', bn: 'কাজের জন্য সঠিক এআই বাছে' },
};

const FAMILY_ICON: Record<FamilyId, ThumbId> = {
  classical: 'rules',
  ml: 'regression',
  iot: 'sensor',
  nn: 'network',
  dl: 'camera',
  rl: 'signal',
  lm: 'tokens',
  cap: 'compare',
};

/*
 * The map: nested circles, all touching at the bottom, so each idea sits inside the bigger one
 * (AI ⊃ machine learning ⊃ neural networks ⊃ deep learning ⊃ large language models).
 * Each circle leaves a crescent at the top for its own lessons and its name.
 */
interface Ring {
  fam: FamilyId;
  label: Bi;
  cy: number;
  r: number;
}

const CX = 320;
const RINGS: Ring[] = [
  { fam: 'classical', label: { en: 'Artificial intelligence', bn: 'কৃত্রিম বুদ্ধিমত্তা' }, cy: 245, r: 225 },
  { fam: 'ml', label: { en: 'Machine learning', bn: 'মেশিন লার্নিং' }, cy: 284, r: 182 },
  { fam: 'nn', label: { en: 'Neural networks', bn: 'নিউরাল নেটওয়ার্ক' }, cy: 322, r: 140 },
  { fam: 'dl', label: { en: 'Deep learning', bn: 'ডিপ লার্নিং' }, cy: 356, r: 102 },
  { fam: 'lm', label: { en: 'LLM', bn: 'LLM' }, cy: 388, r: 66 },
];

/*
 * Where each lesson sits. Lesson 9 counts words, so it is a language model but not a deep one:
 * it sits in the machine-learning crescent, not inside the LLM circle.
 */
const SPOT: Record<string, [number, number]> = {
  'route-finding': [296, 76],
  'expert-system': [344, 76],
  'waterlogging-tree': [254, 152],
  'waste-regression': [298, 152],
  'neighbourhood-clusters': [342, 152],
  'next-word': [386, 152],
  'traffic-signal': [165, 266],
  'waste-collection-robot': [162, 312],
  'neural-network': [320, 234],
  'image-recogniser': [320, 300],
  'inside-gpt2': [298, 390],
  'models-and-gpus': [342, 390],
  'right-ai-for-the-job': [556, 450],
  'drain-sensors': [475, 266],
  'pump-edge-ai': [478, 312],
};

const BADGE_R = 17;

export function Home() {
  const { t, pick, num } = useT();
  const visited = useLab((s) => s.visited);
  const lastLesson = useLab((s) => s.lastLesson);
  const started = visited.length > 0;
  const [focusFam, setFocusFam] = useState<FamilyId | null>(null);
  const [focusLesson, setFocusLesson] = useState<Lesson | null>(null);

  const focus = (fam: FamilyId | null, lesson: Lesson | null = null) => {
    setFocusFam(fam);
    setFocusLesson(lesson);
  };
  const isDone = (l: Lesson) => visited.includes(l.n);

  return (
    <div className="page-pad home">
      <section className="home-top">
        <div className="home-hero">
          <span className="eyebrow">{t('home.eyebrow')}</span>
          <h1>{t('home.title')}</h1>
          <p className="home-lead">{t('home.lead')}</p>
          <div className="home-actions">
            <Link className="btn" to={`/lesson/${started ? lastLesson : 1}`}>
              {started ? t('home.continue', { n: lessonLabel(lastLesson) }) : t('home.start')} →
            </Link>
            <a className="btn ghost" href={legacyUrl('index.html')}>
              {t('home.legacy')}
            </a>
          </div>

          <ul className="fam-key" aria-label={t('panel.family')}>
            {FAMILY_ORDER.map((fam) => {
              const lessons = LESSONS.filter((l) => l.family === fam);
              const active = focusFam === fam;
              return (
                <li key={fam} className={`fam-${fam}`}>
                  <Link
                    to={`/lesson/${lessons[0].n}`}
                    className={`fam-row${active ? ' is-focus' : ''}`}
                    onMouseEnter={() => focus(fam)}
                    onMouseLeave={() => focus(null)}
                    onFocus={() => focus(fam)}
                    onBlur={() => focus(null)}
                  >
                    <span className="fam-icon">
                      <LessonThumb id={FAMILY_ICON[fam]} size={22} />
                    </span>
                    <span className="fam-text">
                      <strong>{pick(FAMILIES[fam])}</strong>
                      <span>{pick(TAGLINE[fam])}</span>
                    </span>
                    <span className="fam-nums mono">
                      {lessons.map((l) => (
                        <span key={l.id} className={isDone(l) ? 'done' : undefined}>
                          {num(lessonLabel(l.n))}
                        </span>
                      ))}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <figure className="ai-map">
          <svg
            viewBox="86 12 500 470"
            className={focusFam ? 'has-focus' : undefined}
            role="group"
            aria-label={t('home.mapTitle')}
          >
            {RINGS.map((ring) => (
              <g
                key={ring.fam}
                className={`ring fam-${ring.fam}${focusFam === ring.fam ? ' is-focus' : ''}`}
                onMouseEnter={() => focus(ring.fam)}
                onMouseLeave={() => focus(null)}
              >
                <circle cx={CX} cy={ring.cy} r={ring.r} />
                <text x={CX} y={ring.cy - ring.r + (ring.fam === 'lm' ? 22 : 21)} textAnchor="middle">
                  {pick(ring.label)}
                </text>
              </g>
            ))}

            {/* Reinforcement learning: its own group inside machine learning. */}
            <g className={`rl-zone fam-rl${focusFam === 'rl' ? ' is-focus' : ''}`}>
              <rect x={141} y={240} width={44} height={98} rx={22} />
              <text x={163} y={233} textAnchor="middle">
                RL
              </text>
            </g>

            {/* IoT & sensing: physical sensors feeding machine learning and Edge AI. */}
            <g className={`rl-zone fam-iot${focusFam === 'iot' ? ' is-focus' : ''}`}>
              <rect x={455} y={240} width={44} height={98} rx={22} />
              <text x={477} y={233} textAnchor="middle">
                IoT
              </text>
            </g>

            {/* The capstone compares approaches from across the whole map. */}
            <g className="cap-zone fam-cap">
              <path d="M535 440 Q 510 428 485 412" />
              <text x={556} y={420} textAnchor="middle">
                {pick(FAMILIES.cap)}
              </text>
            </g>

            {LESSONS.map((l) => {
              const [x, y] = SPOT[l.id];
              const label = String(lessonLabel(l.n));
              const dim = focusFam !== null && focusFam !== l.family;
              return (
                <Link
                  key={l.id}
                  to={`/lesson/${l.n}`}
                  aria-label={`${t('lesson.number', { n: label })} · ${pick(l.title)}`}
                  className={`badge fam-${l.family}${isDone(l) ? ' done' : ''}${dim ? ' dim' : ''}`}
                  onMouseEnter={() => focus(l.family, l)}
                  onMouseLeave={() => focus(null)}
                  onFocus={() => focus(l.family, l)}
                  onBlur={() => focus(null)}
                >
                  <g transform={`translate(${x} ${y})`}>
                    <g className="badge-body">
                      <circle r={BADGE_R} />
                      <g transform="translate(-10 -10)">
                        <LessonThumb id={l.icon} size={20} />
                      </g>
                      <g transform={`translate(${BADGE_R - 4} ${BADGE_R - 4})`} className="badge-n">
                        <rect
                          x={label.length > 1 ? -10 : -7}
                          y={-7}
                          width={label.length > 1 ? 20 : 14}
                          height={14}
                          rx={7}
                        />
                        <text textAnchor="middle" y={3.5}>
                          {num(label)}
                        </text>
                      </g>
                    </g>
                  </g>
                </Link>
              );
            })}
          </svg>
          <figcaption aria-live="polite">
            {focusLesson ? (
              <>
                <span className={`mono cap-n fam-${focusLesson.family}`}>
                  {num(lessonLabel(focusLesson.n))}
                </span>
                {pick(focusLesson.title)}
              </>
            ) : focusFam ? (
              <span className={`fam-${focusFam} cap-fam`}>{pick(TAGLINE[focusFam])}</span>
            ) : (
              <span className="cap-hint">{t('home.mapHint')}</span>
            )}
          </figcaption>
        </figure>
      </section>

      <section className="home-lessons" aria-labelledby="all-lessons">
        <h2 id="all-lessons" className="eyebrow">
          {t('home.allLessons')}
        </h2>
        <ol className="lesson-grid">
          {LESSONS.map((l) => (
            <li key={l.id} className={`fam-${l.family}`}>
              <Link
                to={`/lesson/${l.n}`}
                className={`lesson-card${isDone(l) ? ' done' : ''}`}
                title={pick(l.title)}
                onMouseEnter={() => focus(l.family, l)}
                onMouseLeave={() => focus(null)}
              >
                <span className="lesson-icon">
                  <LessonThumb id={l.icon} size={30} />
                </span>
                <span className="lesson-n mono">{num(lessonLabel(l.n))}</span>
                <span className="lesson-name">{pick(l.short)}</span>
                {isDone(l) ? (
                  <span className="lesson-flag ok" title={t('home.explored')}>
                    ✓
                  </span>
                ) : l.online ? (
                  <span className="lesson-flag" title={t('home.onlineTool')}>
                    ↗
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
