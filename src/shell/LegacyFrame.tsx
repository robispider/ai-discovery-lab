import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';
import { useLab } from '../store/useLab';
import { embedSrc, sendPrefs } from './embed';

/**
 * A page from the previous lab, running on the stage. The src is fixed when the frame mounts:
 * later language and theme changes travel by postMessage, so the experiment keeps its state.
 * Give it a key per lesson so a new lesson gets a fresh frame.
 */
export function LegacyFrame({ path, title }: { path: string; title: string }) {
  const { t } = useT();
  const lang = useLab((s) => s.lang);
  const theme = useLab((s) => s.theme);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [src] = useState(() => {
    const { lang, theme } = useLab.getState();
    return embedSrc(path, { lang, theme });
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    sendPrefs(frameRef.current?.contentWindow, { lang, theme });
  }, [lang, theme]);

  return (
    <div className="legacy-frame" aria-busy={!loaded}>
      {!loaded && (
        <p className="legacy-loading muted" role="status">
          {t('stage.loading')}
        </p>
      )}
      <iframe
        ref={frameRef}
        src={src}
        title={title}
        onLoad={() => {
          setLoaded(true);
          // Preferences may have changed while the page was loading.
          const { lang, theme } = useLab.getState();
          sendPrefs(frameRef.current?.contentWindow, { lang, theme });
        }}
      />
    </div>
  );
}
