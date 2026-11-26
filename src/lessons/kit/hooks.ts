import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLab } from '../../store/useLab';

/** Reads design tokens (CSS custom properties) for canvas drawing; re-reads when the theme changes. */
export function useTokens<K extends string>(names: readonly K[]): Record<K, string> {
  const theme = useLab((s) => s.theme);
  const [osDark, setOsDark] = useState(() => matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
  useEffect(() => {
    const mq = matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const on = () => setOsDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const key = names.join('|');
  // setTheme writes the theme attribute before React renders, so the tokens read here are current.
  // theme and osDark are not read inside, but a change to either means the CSS values changed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => readTokens(key.split('|') as K[]), [key, theme, osDark]);
}

function readTokens<K extends string>(names: readonly K[]): Record<K, string> {
  const cs = getComputedStyle(document.documentElement);
  const out = {} as Record<K, string>;
  for (const n of names) out[n] = cs.getPropertyValue(`--${n}`).trim() || '#888';
  return out;
}

/**
 * A canvas that fills its box at the device's pixel ratio and redraws when resized or when `deps`
 * change. `draw` gets a context already scaled to CSS pixels.
 */
export function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  deps: readonly unknown[],
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const c = ref.current;
    if (!c || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setSize((s) => (s.w === width && s.h === height ? s : { w: width, h: height }));
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext?.('2d');
    if (!c || !ctx || !size.w || !size.h) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(size.w * dpr);
    c.height = Math.round(size.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    drawRef.current(ctx, size.w, size.h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, ...deps]);

  return { ref, size };
}
