import { describe, expect, it, vi } from 'vitest';
import { embedSrc, sendPrefs, targetOrigin } from './embed';

describe('embed bridge', () => {
  it('builds the embed address with the preferences for the first paint', () => {
    expect(embedSrc('experiments/route.html', { lang: 'bn', theme: 'projector' })).toBe(
      '/legacy/experiments/route.html?embed=1&lang=bn&theme=projector',
    );
  });

  it('posts to its own origin, or to any origin from file://', () => {
    expect(targetOrigin('http://localhost:8000')).toBe('http://localhost:8000');
    expect(targetOrigin('null')).toBe('*');
  });

  it('sends a lab:prefs message and ignores a missing frame', () => {
    const target = { postMessage: vi.fn() } as unknown as Window;
    sendPrefs(target, { lang: 'en', theme: 'dark' });
    expect(target.postMessage).toHaveBeenCalledWith(
      { type: 'lab:prefs', lang: 'en', theme: 'dark' },
      window.location.origin,
    );
    expect(() => sendPrefs(null, { lang: 'en', theme: 'dark' })).not.toThrow();
  });
});
