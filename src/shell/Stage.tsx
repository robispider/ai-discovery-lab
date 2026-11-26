import { useT } from '../i18n';
import type { Lesson } from '../lessons/types';
import { CYCLE, useLab } from '../store/useLab';
import { LessonThumb } from '../ui/Icon';
import { LegacyFrame } from './LegacyFrame';
import { legacyUrl } from './links';

/** The drafting-grid area where the experiment runs, with the six-step learning cycle under it. */
export function Stage({ lesson }: { lesson: Lesson }) {
  const { t, pick } = useT();
  const step = useLab((s) => s.step);
  const LessonStage = lesson.Stage;
  const embedded = !LessonStage && !!lesson.legacy;

  return (
    <section className={step === 'break' ? 'stage breaking' : 'stage'} aria-label={pick(lesson.title)}>
      <div className="stage-head">
        <span className="eyebrow">{pick(lesson.stageCaption)}</span>
        {embedded && lesson.legacy && (
          <a className="stage-full" href={legacyUrl(lesson.legacy)} target="_blank" rel="noopener">
            {t('stage.openFull')} ↗
          </a>
        )}
      </div>
      <div className={embedded ? 'stage-body embed' : 'stage-body'}>
        {LessonStage ? (
          <LessonStage />
        ) : embedded && lesson.legacy ? (
          <LegacyFrame key={lesson.n} path={lesson.legacy} title={pick(lesson.title)} />
        ) : (
          <PlaceholderStage lesson={lesson} />
        )}
      </div>
      <CycleStepper />
      {/* Announce the step for screen readers without moving focus. */}
      <span className="visually-hidden" aria-live="polite">
        {t(`cycle.${step}`)}
      </span>
    </section>
  );
}

function PlaceholderStage({ lesson }: { lesson: Lesson }) {
  const { t } = useT();
  return (
    <div className="stage-placeholder">
      <span className="stage-placeholder-icon">
        <LessonThumb id={lesson.icon} size={72} />
      </span>
      <h2>{t(lesson.online ? 'stage.onlineTitle' : 'stage.placeholderTitle')}</h2>
      <p className="muted">{t(lesson.online ? 'stage.onlineBody' : 'stage.placeholderBody')}</p>
      {lesson.online ? (
        <a className="btn" href={lesson.online.url} target="_blank" rel="noopener noreferrer">
          {t('stage.openTool', { tool: lesson.online.tool })} ↗
        </a>
      ) : lesson.legacy ? (
        <a className="btn" href={legacyUrl(lesson.legacy)} target="_blank" rel="noopener">
          {t('stage.openCurrent')} ↗
        </a>
      ) : null}
    </div>
  );
}

function CycleStepper() {
  const { t, num } = useT();
  const step = useLab((s) => s.step);
  const setStep = useLab((s) => s.setStep);

  return (
    <div className="cycle" role="group" aria-label={t('cycle.label')}>
      {CYCLE.map((id, i) => (
        <button
          key={id}
          type="button"
          className={id === 'break' ? 'brk' : undefined}
          aria-pressed={step === id}
          onClick={() => setStep(id)}
        >
          <b className="mono">{num(i + 1)}</b>
          {t(`cycle.${id}`)}
        </button>
      ))}
    </div>
  );
}
