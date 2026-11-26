import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { useT } from '../i18n';
import { getLesson } from '../lessons/registry';
import { useLab } from '../store/useLab';
import { Stage } from './Stage';
import { LessonPanel } from './LessonPanel';
import { Filmstrip } from './Filmstrip';

export function LessonView() {
  const { n: param } = useParams();
  const slug = param?.toLowerCase();
  const n = slug === '8b' ? slug : slug === '8a' ? 8 : Number(param);
  const lesson = getLesson(n);
  const visit = useLab((s) => s.visit);
  const setStep = useLab((s) => s.setStep);
  const { t } = useT();

  useEffect(() => {
    if (!lesson) return;
    visit(lesson.n);
    // Every lesson starts at the first step of the cycle.
    setStep('understand');
  }, [lesson, visit, setStep]);

  if (!lesson) {
    return (
      <div className="page-pad">
        <p>{t('lesson.notFound', { n: param ?? '' })}</p>
        <p>
          <Link to="/">{t('nav.home')}</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={`lesson fam-${lesson.family}`}>
      <Stage lesson={lesson} />
      <LessonPanel lesson={lesson} />
      <Filmstrip current={lesson.n} />
    </div>
  );
}
