import { useEffect } from 'react';
import { translate } from '../i18n';
import { useLab } from '../store/useLab';

/** Mirrors language and theme onto <html>, where the CSS tokens and fonts pick them up. */
export function usePreferences() {
  const lang = useLab((s) => s.lang);
  const theme = useLab((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    document.title = translate(lang, 'app.name');
  }, [lang]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);
}
