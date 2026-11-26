import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useT } from '../i18n';
import { LESSONS } from '../lessons/registry';
import { useLab } from '../store/useLab';
import { LessonThumb } from '../ui/Icon';

/** Every lesson along the bottom, coloured by AI family; ticked once visited, tagged when online. */
export function Filmstrip({ current }: { current: number }) {
  const { t, pick, num } = useT();
  const visited = useLab((s) => s.visited);
  const stripRef = useRef<HTMLOListElement>(null);

  // Keep the current lesson in view. Scroll only the strip sideways: scrollIntoView would also
  // scroll the page, which on phones jumps past the stage to the bottom of the lesson.
  useEffect(() => {
    const strip = stripRef.current;
    const card = strip?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!strip || !card) return;
    const s = strip.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    if (c.left < s.left) strip.scrollLeft -= s.left - c.left + 16;
    else if (c.right > s.right) strip.scrollLeft += c.right - s.right + 16;
  }, [current]);

  return (
    <nav className="film" aria-label={t('film.lessons')}>
      <span className="eyebrow film-label">{t('film.lessons')}</span>
      <ol className="strip" ref={stripRef}>
        {LESSONS.map((l) => {
          const isVisited = visited.includes(l.n);
          return (
            <li key={l.id}>
              <Link
                to={`/lesson/${l.n}`}
                className={`film-card fam-${l.family}`}
                aria-current={l.n === current ? 'page' : undefined}
              >
                <LessonThumb id={l.icon} />
                <span className="film-n mono">{num(String(l.n).padStart(2, '0'))}</span>
                <span className="film-t">{pick(l.short)}</span>
                {l.online ? (
                  <span
                    className="film-online"
                    title={t('lesson.onlineTool')}
                    aria-label={t('lesson.onlineTool')}
                  >
                    ↗
                  </span>
                ) : isVisited ? (
                  <span className="film-done" aria-label={t('top.explored')}>
                    ✓
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
