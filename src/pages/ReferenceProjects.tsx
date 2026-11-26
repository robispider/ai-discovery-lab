import { Link, useSearchParams } from 'react-router';
import { NVIDIA_REFERENCE_GROUPS, NVIDIA_REFERENCES } from '../data/nvidiaReferences';
import { SMART_CITY_DEMOS, SMART_CITY_PROJECTS } from '../data/smartCityProjects';
import { REFERENCE_GROUPS, SMART_CITY_REFERENCES, type ProjectEntry } from '../data/smartCityReferences';
import { useT, type MessageKey } from '../i18n';
import { LessonThumb } from '../ui/Icon';
import './pages.css';
import './references.css';

const SECTIONS = [
  { id: 'projects', label: 'references.projects', entries: SMART_CITY_PROJECTS },
  { id: 'models', label: 'references.models', entries: SMART_CITY_REFERENCES },
  { id: 'demos', label: 'references.demos', entries: SMART_CITY_DEMOS },
  { id: 'nvidia', label: 'references.nvidia', entries: NVIDIA_REFERENCES },
] as const satisfies readonly { id: string; label: MessageKey; entries: ProjectEntry[] }[];

function updateParams(params: URLSearchParams, changes: Record<string, string>) {
  const next = new URLSearchParams(params);
  for (const [key, value] of Object.entries(changes)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  return next;
}

function matchesQuery(item: ProjectEntry, words: string[]) {
  if (!words.length) return true;
  const copy = [item.title, item.summary, item.tag, ...item.links.map((link) => link.label)]
    .flatMap(({ en, bn }) => [en, bn])
    .join(' ')
    .normalize('NFC')
    .toLowerCase();
  return words.every((word) => copy.includes(word));
}

export function ReferenceProjects() {
  const { t, pick } = useT();
  const [params, setParams] = useSearchParams();
  const section = SECTIONS.find(({ id }) => id === params.get('tab')) ?? SECTIONS[0];
  const query = params.get('q') ?? '';
  const words = query.trim().normalize('NFC').toLowerCase().split(/\s+/).filter(Boolean);
  const topics =
    section.id === 'models' ? REFERENCE_GROUPS : section.id === 'nvidia' ? NVIDIA_REFERENCE_GROUPS : [];
  const topic = topics.find(({ id }) => id === params.get('topic'))?.id ?? '';
  const list = params.get('view') === 'list';
  const filtered = section.entries.filter(
    (entry) => (!topic || entry.category === topic) && matchesQuery(entry, words),
  );

  return (
    <div className="page-pad references">
      <header className="home-hero references-heading">
        <h1>{t('references.title')}</h1>
        <p className="home-lead">{t('references.intro')}</p>
        <p>
          <Link to="/glossary">{t('glossary.referenceLink')}</Link>
        </p>
      </header>

      <div className="references-browser">
        <div className="references-toolbar">
          <nav className="references-tabs" aria-label={t('references.sections')}>
            {SECTIONS.map(({ id, label }) => (
              <Link
                key={id}
                to={{
                  search: updateParams(params, { tab: id === 'projects' ? '' : id, topic: '' }).toString(),
                }}
                aria-current={section.id === id ? 'page' : undefined}
              >
                {t(label)}
              </Link>
            ))}
          </nav>
          <div className="references-filters">
            <label className="references-filter">
              <span>{t('references.search')}</span>
              <input
                type="search"
                value={query}
                onChange={(event) =>
                  setParams(updateParams(params, { q: event.target.value }), { replace: true })
                }
                placeholder={t('references.searchHint')}
              />
            </label>
            {topics.length > 0 && (
              <label className="references-filter">
                <span>{t(section.id === 'nvidia' ? 'references.kind' : 'references.topic')}</span>
                <select
                  value={topic}
                  onChange={(event) => setParams(updateParams(params, { topic: event.target.value }))}
                >
                  <option value="">
                    {t(section.id === 'nvidia' ? 'references.allKinds' : 'references.allTopics')}
                  </option>
                  {topics.map((group) => (
                    <option key={group.id} value={group.id}>
                      {pick(group.title)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="seg references-views" role="group" aria-label={t('references.view')}>
              <button
                type="button"
                aria-pressed={!list}
                onClick={() => setParams(updateParams(params, { view: '' }), { replace: true })}
              >
                {t('references.cards')}
              </button>
              <button
                type="button"
                aria-pressed={list}
                onClick={() => setParams(updateParams(params, { view: 'list' }), { replace: true })}
              >
                {t('references.list')}
              </button>
            </div>
          </div>
        </div>

        <section className="references-content" aria-label={t(section.label)}>
          <p className="references-count mono" role="status">
            {t(filtered.length === 1 ? 'references.result' : 'references.results', {
              count: filtered.length,
            })}
          </p>
          {filtered.length === 0 ? (
            <div className="references-empty">
              <p>{t('references.empty')}</p>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setParams(updateParams(params, { q: '', topic: '' }), { replace: true })}
              >
                {t('references.clear')}
              </button>
            </div>
          ) : (
            <ul className={list ? 'reference-items as-list' : 'reference-items'}>
              {filtered.map((item) => (
                <ReferenceCard key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function ReferenceCard({ item }: { item: ProjectEntry }) {
  const { pick, t, num } = useT();
  const [primary, ...related] = item.links;
  const host = new URL(primary.url).hostname.replace(/^www\./, '');

  return (
    <li className={`fam-${item.family}`}>
      <article className="reference-card">
        <header className="reference-card-head">
          <span className="fam-icon">
            <LessonThumb id={item.icon} size={22} />
          </span>
          <div>
            <p className="reference-tag">{pick(item.tag)}</p>
            <h2>
              <a href={primary.url} target="_blank" rel="noopener noreferrer">
                {pick(item.title)} <span aria-hidden="true">↗</span>
                <span className="visually-hidden"> {t('references.newTab')}</span>
              </a>
            </h2>
          </div>
        </header>
        <p className="reference-description">{pick(item.summary)}</p>
        <footer className="reference-footer">
          <span className="reference-source" aria-label={t('references.source')}>
            {item.title.en === primary.label.en ? host : `${pick(primary.label)} · ${host}`}
          </span>
          {related.length > 0 && (
            <ul className="reference-related" aria-label={t('references.related')}>
              {related.map((link) => (
                <li key={link.url}>
                  {link.url.startsWith('/') ? (
                    <Link to={link.url}>{num(pick(link.label))}</Link>
                  ) : (
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      {pick(link.label)} <span aria-hidden="true">↗</span>
                      <span className="visually-hidden"> {t('references.newTab')}</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </footer>
      </article>
    </li>
  );
}
