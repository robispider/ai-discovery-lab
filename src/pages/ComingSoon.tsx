import { Link } from 'react-router';
import { useT, type MessageKey } from '../i18n';
import { useLab } from '../store/useLab';
import './pages.css';

/** Placeholder for sections planned in later phases (AI map, glossary, session runner). */
export function ComingSoon({ title }: { title: MessageKey }) {
  const { t } = useT();
  const lastLesson = useLab((s) => s.lastLesson);
  return (
    <div className="page-pad soon">
      <h1>{t(title)}</h1>
      <p className="muted">{t('soon.body')}</p>
      <Link className="btn ghost" to={`/lesson/${lastLesson}`}>
        ← {t('soon.back')}
      </Link>
    </div>
  );
}
