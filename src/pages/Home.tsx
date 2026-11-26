import { Link } from 'react-router';
import { useT } from '../i18n';
import { LESSONS } from '../lessons/registry';
import { FAMILIES, FAMILY_ORDER, lessonLabel } from '../lessons/types';
import { legacyUrl } from '../shell/links';
import { useLab } from '../store/useLab';
import { LessonThumb } from '../ui/Icon';
import './pages.css';

export function Home() {
  const { t, pick, num } = useT();
  const visited = useLab((s) => s.visited);
  const lastLesson = useLab((s) => s.lastLesson);
  const started = visited.length > 0;

  return (
    <div className="page-pad home">
      <section className="home-hero">
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
      </section>

      <section className="home-families" aria-labelledby="by-family">
        <h2 id="by-family" className="eyebrow">
          {t('home.byFamily')}
        </h2>
        <div className="family-grid">
          {FAMILY_ORDER.map((fam) => {
            const lessons = LESSONS.filter((l) => l.family === fam);
            return (
              <div key={fam} className={`family fam-${fam}`}>
                <span className="chip">{pick(FAMILIES[fam])}</span>
                <ul>
                  {lessons.map((l) => (
                    <li key={l.id}>
                      <Link to={`/lesson/${l.n}`} className="family-link">
                        <LessonThumb id={l.icon} size={28} />
                        <span className="mono family-n">{num(lessonLabel(l.n))}</span>
                        <span>{pick(l.title)}</span>
                        {visited.includes(l.n) && <span className="family-done">✓</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
