import { useLayoutEffect } from 'react';
import { translate } from '../i18n';
import { applyThemeAttr, useLab } from '../store/useLab';

/**
 * Mirrors language and theme onto <html>, where the CSS tokens and fonts pick them up.
 * Layout effects run before every normal effect, so canvases that read tokens in an effect
 * already see the new theme.
 */
export function usePreferences() {
  const lang = useLab((s) => s.lang);
  const theme = useLab((s) => s.theme);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    document.title = translate(lang, 'app.name');
  }, [lang]);

  useLayoutEffect(() => applyThemeAttr(theme), [theme]);
}
