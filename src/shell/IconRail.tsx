import { Link, useLocation } from 'react-router';
import { useT, type MessageKey } from '../i18n';
import { useLab } from '../store/useLab';
import { RailIcon, type RailIconId } from '../ui/Icon';

interface RailItem {
  id: RailIconId;
  label: MessageKey;
  to: string;
  /** Path prefix that marks this item as the current section. */
  match: string;
  bottom?: boolean;
}

export function IconRail() {
  const { t } = useT();
  const { pathname } = useLocation();
  const lastLesson = useLab((s) => s.lastLesson);

  const items: RailItem[] = [
    { id: 'home', label: 'nav.home', to: '/', match: '/' },
    { id: 'lessons', label: 'nav.lessons', to: `/lesson/${lastLesson}`, match: '/lesson' },
    { id: 'map', label: 'nav.map', to: '/map', match: '/map' },
    { id: 'glossary', label: 'nav.glossary', to: '/glossary', match: '/glossary' },
    { id: 'session', label: 'nav.session', to: '/session', match: '/session' },
    { id: 'settings', label: 'nav.settings', to: '/settings', match: '/settings', bottom: true },
  ];

  const isCurrent = (match: string) => (match === '/' ? pathname === '/' : pathname.startsWith(match));

  return (
    <nav className="rail" aria-label={t('nav.main')}>
      {items.map((item) => (
        <Link
          key={item.id}
          to={item.to}
          className={item.bottom ? 'rail-item rail-bottom' : 'rail-item'}
          aria-current={isCurrent(item.match) ? 'page' : undefined}
        >
          <RailIcon id={item.id} />
          <span>{t(item.label)}</span>
        </Link>
      ))}
    </nav>
  );
}
