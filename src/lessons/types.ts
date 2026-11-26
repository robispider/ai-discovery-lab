import type { ComponentType } from 'react';
import type { Bi } from '../i18n';

export type FamilyId = 'classical' | 'ml' | 'nn' | 'dl' | 'rl' | 'lm' | 'cap';

export type ThumbId =
  | 'route'
  | 'rules'
  | 'tree'
  | 'regression'
  | 'cluster'
  | 'network'
  | 'camera'
  | 'signal'
  | 'bars'
  | 'tokens'
  | 'compare'
  | 'chip';

export interface Lesson {
  /** Position in the lab, 1-based. Also the URL: #/lesson/3 */
  n: number;
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
  content: {
    how?: Bi;
    breakIt?: Bi;
    notes?: Bi;
  };
  /** The interactive experiment. Undefined until the lesson is ported (Phase 2). */
  Stage?: ComponentType;
  Controls?: ComponentType;
}

/** Identity helper so each lesson file gets full type checking. */
export function defineLesson(lesson: Lesson): Lesson {
  return lesson;
}

export const FAMILIES: Record<FamilyId, Bi> = {
  classical: { en: 'Classical AI', bn: 'ক্লাসিক্যাল এআই' },
  ml: { en: 'Machine learning', bn: 'মেশিন লার্নিং' },
  nn: { en: 'Neural networks', bn: 'নিউরাল নেটওয়ার্ক' },
  dl: { en: 'Deep learning', bn: 'ডিপ লার্নিং' },
  rl: { en: 'Reinforcement learning', bn: 'রিইনফোর্সমেন্ট লার্নিং' },
  lm: { en: 'Language models', bn: 'ভাষা মডেল' },
  cap: { en: 'Capstone', bn: 'সমাপনী' },
};

export const FAMILY_ORDER: FamilyId[] = ['classical', 'ml', 'nn', 'dl', 'rl', 'lm', 'cap'];
