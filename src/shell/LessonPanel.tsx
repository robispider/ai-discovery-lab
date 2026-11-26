import { useRef, type KeyboardEvent } from 'react';
import { pickBi, useT, type Bi, type MessageKey } from '../i18n';
import { LESSONS } from '../lessons/registry';
import { FAMILIES, type Lesson } from '../lessons/types';
import { TABS, useLab, type PanelTab } from '../store/useLab';
import { legacyUrl } from './links';

const TAB_LABEL: Record<PanelTab, MessageKey> = {
  overview: 'tabs.overview',
  how: 'tabs.how',
  break: 'tabs.break',
  notes: 'tabs.notes',
};

export function LessonPanel({ lesson }: { lesson: Lesson }) {
  const { t, pick, num } = useT();
  const tab = useLab((s) => s.tab);
  const setTab = useLab((s) => s.setTab);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const Controls = lesson.Controls;

  // Arrow keys move between tabs, as in any tab list.
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.indexOf(tab);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setTab(TABS[next]);
    tabRefs.current[next]?.focus();
  };

  return (
    <aside className="panel" aria-label={pick(lesson.title)}>
      <div className="panel-head">
        <span className="chip">{pick(FAMILIES[lesson.family])}</span>
        <span className="panel-pos mono">
          {t('lesson.position', { n: lesson.n, total: LESSONS.length })}
          {lesson.online && <b className="panel-online"> · {t('lesson.onlineTool')}</b>}
        </span>
        <h1 className="panel-title">{pick(lesson.title)}</h1>
      </div>

      <div className="tabs" role="tablist" aria-label={t('tabs.label')} onKeyDown={onTabKey}>
        {TABS.map((id, i) => (
          <button
            key={id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls="lesson-tabpanel"
            tabIndex={tab === id ? 0 : -1}
            className={id === 'break' ? 'brk' : undefined}
            onClick={() => setTab(id)}
          >
            {t(TAB_LABEL[id])}
          </button>
        ))}
      </div>

      <div className="panel-body" role="tabpanel" id="lesson-tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'overview' ? (
          <>
            <p>{pick(lesson.summary)}</p>
            <dl className="facts">
              <dt>{t('panel.family')}</dt>
              <dd>{pick(FAMILIES[lesson.family])}</dd>
              <dt>{t('panel.runs')}</dt>
              <dd>{t(lesson.online ? 'panel.runsOnline' : 'panel.runsOffline')}</dd>
              {lesson.legacy && (
                <>
                  <dt>{t('panel.current')}</dt>
                  <dd className="mono">
                    <a href={legacyUrl(lesson.legacy)} target="_blank" rel="noopener">
                      {lesson.legacy}
                    </a>{' '}
                    <span className="muted">· {num(lesson.legacyLines ?? 0)}</span>
                  </dd>
                </>
              )}
            </dl>
          </>
        ) : (
          <TabText
            text={
              tab === 'how'
                ? lesson.content.how
                : tab === 'break'
                  ? lesson.content.breakIt
                  : lesson.content.notes
            }
          />
        )}
      </div>

      <div className="try">
        <h2 className="eyebrow">{t('panel.tryIt')}</h2>
        {Controls ? (
          <Controls />
        ) : lesson.online ? (
          <a className="btn" href={lesson.online.url} target="_blank" rel="noopener noreferrer">
            {t('stage.openTool', { tool: lesson.online.tool })} ↗
          </a>
        ) : (
          <p className="muted try-note">
            {t(lesson.legacy ? 'panel.controlsInStage' : 'panel.controlsSoon')}
          </p>
        )}
      </div>
    </aside>
  );
}

function TabText({ text }: { text?: Bi }) {
  const { t, lang } = useT();
  if (!text) return <p className="muted">{t('panel.notWritten')}</p>;
  const { text: body, missing } = pickBi(text, lang);
  return (
    <>
      {missing && <span className="pending-tag">{t('panel.englishOnly')}</span>}
      <p lang={missing ? 'en' : undefined}>{body}</p>
    </>
  );
}
