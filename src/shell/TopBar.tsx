import { Link } from 'react-router';
import { useT } from '../i18n';
import { LESSONS } from '../lessons/registry';
import { useLab } from '../store/useLab';
import { LabMark } from '../ui/Icon';

export function TopBar() {
  const { t, num } = useT();
  const lang = useLab((s) => s.lang);
  const setLang = useLab((s) => s.setLang);
  const visited = useLab((s) => s.visited);
  const total = LESSONS.length;
  const done = visited.length;

  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <LabMark />
        <span>
          <b>{t('app.name')}</b>
          <small>{t('app.tagline')}</small>
        </span>
      </Link>

      <div className="progress" title={t('top.progress', { done, total })}>
        <span className="eyebrow">{t('top.explored')}</span>
        <span
          className="progress-bar"
          role="progressbar"
          aria-label={t('top.progress', { done, total })}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
        >
          <i style={{ width: `${(done / total) * 100}%` }} />
        </span>
        <span className="progress-num mono">
          {num(done)}/{num(total)}
        </span>
      </div>

      <div className="seg" role="group" aria-label={t('top.language')}>
        <button type="button" lang="en" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
          EN
        </button>
        <button type="button" lang="bn" aria-pressed={lang === 'bn'} onClick={() => setLang('bn')}>
          বাংলা
        </button>
      </div>

      <span className="synthetic">{t('top.synthetic')}</span>
    </header>
  );
}
