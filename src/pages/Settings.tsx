import { useState } from 'react';
import { useT, type MessageKey } from '../i18n';
import { LESSONS } from '../lessons/registry';
import { useLab, type Theme } from '../store/useLab';
import './pages.css';

const THEMES: { id: Theme; label: MessageKey }[] = [
  { id: 'system', label: 'theme.system' },
  { id: 'light', label: 'theme.light' },
  { id: 'dark', label: 'theme.dark' },
  { id: 'projector', label: 'theme.projector' },
];

export function Settings() {
  const { t } = useT();
  const theme = useLab((s) => s.theme);
  const setTheme = useLab((s) => s.setTheme);
  const lang = useLab((s) => s.lang);
  const setLang = useLab((s) => s.setLang);
  const visited = useLab((s) => s.visited);
  const resetProgress = useLab((s) => s.resetProgress);
  const [cleared, setCleared] = useState(false);

  return (
    <div className="page-pad settings">
      <h1>{t('settings.title')}</h1>

      <fieldset className="setting">
        <legend>{t('settings.theme')}</legend>
        <div className="seg" role="group" aria-label={t('settings.theme')}>
          {THEMES.map((th) => (
            <button key={th.id} type="button" aria-pressed={theme === th.id} onClick={() => setTheme(th.id)}>
              {t(th.label)}
            </button>
          ))}
        </div>
        <p className="muted">{t('settings.themeHint')}</p>
      </fieldset>

      <fieldset className="setting">
        <legend>{t('settings.language')}</legend>
        <div className="seg" role="group" aria-label={t('settings.language')}>
          <button type="button" lang="en" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
            English
          </button>
          <button type="button" lang="bn" aria-pressed={lang === 'bn'} onClick={() => setLang('bn')}>
            বাংলা
          </button>
        </div>
      </fieldset>

      <fieldset className="setting">
        <legend>{t('settings.progress')}</legend>
        <p>{t('top.progress', { done: visited.length, total: LESSONS.length })}</p>
        <p className="muted">{t('settings.progressHint')}</p>
        <button
          type="button"
          className="btn ghost"
          onClick={() => {
            resetProgress();
            setCleared(true);
          }}
        >
          {t('settings.reset')}
        </button>
        <p role="status" className="muted">
          {cleared ? t('settings.resetDone') : ''}
        </p>
      </fieldset>
    </div>
  );
}
