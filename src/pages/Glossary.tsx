import { Link, useSearchParams } from 'react-router';
import { GLOSSARY } from '../data/glossary';
import { useT } from '../i18n';
import { getLesson, LESSONS } from '../lessons/registry';
import { lessonLabel } from '../lessons/types';
import './pages.css';
import './glossary.css';

function normalise(text: string) {
  return text.normalize('NFC').toLowerCase().replace(/[-–—]/g, ' ').trim();
}

export function Glossary() {
  const { t, pick, lang } = useT();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const topic = GLOSSARY.find(({ id }) => id === params.get('topic'))?.id ?? '';
  const lesson = LESSONS.find(({ n }) => String(n) === params.get('lesson'))?.n;
  const words = normalise(query).split(/\s+/).filter(Boolean);
  const collator = new Intl.Collator(lang);
  const groups = GLOSSARY.filter(({ id }) => !topic || id === topic)
    .map((group) => ({
      ...group,
      terms: group.terms
        .filter((entry) => {
          if (lesson !== undefined && !entry.lessons.includes(lesson)) return false;
          const text = normalise(
            [entry.title.en, entry.title.bn, entry.definition.en, entry.definition.bn].join(' '),
          );
          return words.every((word) => text.includes(word));
        })
        .sort((a, b) => collator.compare(pick(a.title), pick(b.title))),
    }))
    .filter(({ terms }) => terms.length > 0);
  const count = groups.reduce((total, group) => total + group.terms.length, 0);

  function setFilter(key: string, value: string, replace = false) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace });
  }

  return (
    <div className="page-pad glossary">
      <header className="home-hero">
        <h1>{t('nav.glossary')}</h1>
        <p className="home-lead">{t('glossary.intro')}</p>
      </header>

      <div className="glossary-toolbar">
        <div className="glossary-controls" role="search">
          <label>
            {t('glossary.search')}
            <input
              type="search"
              value={query}
              onChange={(event) => setFilter('q', event.target.value, true)}
              placeholder={t('glossary.searchHint')}
            />
          </label>
          <label>
            {t('glossary.topic')}
            <select value={topic} onChange={(event) => setFilter('topic', event.target.value)}>
              <option value="">{t('glossary.allTopics')}</option>
              {GLOSSARY.map(({ id, title }) => (
                <option key={id} value={id}>
                  {pick(title)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('glossary.lesson')}
            <select value={lesson ?? ''} onChange={(event) => setFilter('lesson', event.target.value)}>
              <option value="">{t('glossary.allLessons')}</option>
              {LESSONS.map(({ n, short }) => (
                <option key={n} value={n}>
                  {t('glossary.lessonOption', { n: lessonLabel(n), title: pick(short) })}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="glossary-feedback">
          <p role="status">{t(count === 1 ? 'glossary.result' : 'glossary.results', { count })}</p>
          <button
            type="button"
            disabled={!query && !topic && lesson === undefined}
            onClick={() => setParams({})}
          >
            {t('glossary.clear')}
          </button>
        </div>
      </div>

      {groups.length === 0 && <p className="glossary-empty">{t('glossary.empty')}</p>}
      {groups.map((group) => (
        <section key={group.id} className="glossary-topic" aria-labelledby={group.id}>
          <h2 id={group.id}>{pick(group.title)}</h2>
          <dl className="glossary-terms">
            {group.terms.map((entry) => {
              const reference = entry.source ?? group.source;
              return (
                <div key={entry.title.en} className="glossary-term">
                  <dt>
                    {pick(entry.title)}
                    {lang === 'bn' && (
                      <span className="glossary-original" lang="en">
                        {entry.title.en}
                      </span>
                    )}
                  </dt>
                  <dd>
                    <p>{pick(entry.definition)}</p>
                    {entry.lessons.length > 0 && (
                      <ul className="glossary-lessons" aria-label={t('glossary.relatedLessons')}>
                        {entry.lessons.map((n) => {
                          const related = getLesson(n);
                          return (
                            related && (
                              <li key={n}>
                                <Link to={`/lesson/${n}`}>
                                  {t('glossary.lessonOption', {
                                    n: lessonLabel(n),
                                    title: pick(related.short),
                                  })}
                                </Link>
                              </li>
                            )
                          );
                        })}
                      </ul>
                    )}
                    <a
                      className="glossary-source"
                      href={reference.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('references.source')} · <span lang="en">{reference.label}</span>{' '}
                      <span aria-hidden="true">↗</span>
                      <span className="visually-hidden"> {t('references.newTab')}</span>
                    </a>
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}
