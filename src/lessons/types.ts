import type { ComponentType } from 'react';
import type { Bi } from '../i18n';
import type { CycleStep } from '../store/useLab';

export type FamilyId = 'classical' | 'ml' | 'iot' | 'nn' | 'dl' | 'rl' | 'lm' | 'cap';
export type LessonNumber = number | '8b';

export function lessonLabel(n: LessonNumber): number | string {
  if (n === 8) return '8A';
  if (n === '8b') return '8B';
  return n;
}

export type ThumbId =
  | 'route'
  | 'rules'
  | 'tree'
  | 'regression'
  | 'cluster'
  | 'network'
  | 'camera'
  | 'signal'
  | 'robot'
  | 'bars'
  | 'tokens'
  | 'compare'
  | 'chip'
  | 'sensor'
  | 'wave';

export interface LessonReference {
  title: Bi;
  description?: Bi;
  url: string;
}

export interface Lesson {
  /** Stable lesson number or alternate, used in the URL (for example, #/lesson/8b). */
  n: LessonNumber;
  alternative?: LessonNumber;
  id: string;
  family: FamilyId;
  icon: ThumbId;
  title: Bi;
  /** Short name for the lesson strip. */
  short: Bi;
  summary: Bi;
  /** Small caption shown above the stage, e.g. "800 ward-days · decision tree". */
  stageCaption: Bi;
  /** Path of the current plain-HTML version, relative to public/legacy/. */
  legacy?: string;
  /** Lines of HTML + JS in the current version; used to plan the port. */
  legacyLines?: number;
  /** Lessons that open a well-known external tool instead of running in the lab. */
  online?: { tool: string; url: string };
  /** External reference sites or hands-on companions linked from the lesson panel. */
  references?: LessonReference[];
  content: {
    how?: Bi;
    breakIt?: Bi;
    notes?: Bi;
  };
  /** What to do on each step of the learning cycle; shown above the stage. */
  steps?: Record<CycleStep, Bi>;
  /**
   * The interactive experiment, drawn on the stage for the current cycle step. Until a lesson is
   * ported, the previous page runs on the stage instead.
   */
  Stage?: ComponentType;
  /** Compact controls for the panel's "Try it yourself" area: presets, reset, key settings. */
  Controls?: ComponentType;
}

/** Identity helper so each lesson file gets full type checking. */
export function defineLesson(lesson: Lesson): Lesson {
  return lesson;
}

export const FAMILIES: Record<FamilyId, Bi> = {
  classical: { en: 'Classical AI', bn: 'ক্লাসিক্যাল এআই' },
  ml: { en: 'Machine learning', bn: 'মেশিন লার্নিং' },
  iot: { en: 'IoT & sensing', bn: 'আইওটি ও সেন্সিং' },
  nn: { en: 'Neural networks', bn: 'নিউরাল নেটওয়ার্ক' },
  dl: { en: 'Deep learning', bn: 'ডিপ লার্নিং' },
  rl: { en: 'Reinforcement learning', bn: 'রিইনফোর্সমেন্ট লার্নিং' },
  lm: { en: 'Language models', bn: 'ভাষা মডেল' },
  cap: { en: 'Capstone', bn: 'সমাপনী' },
};

export const FAMILY_ORDER: FamilyId[] = ['classical', 'ml', 'iot', 'nn', 'dl', 'rl', 'lm', 'cap'];
