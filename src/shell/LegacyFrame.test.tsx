import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { useLab } from '../store/useLab';
import { LegacyFrame } from './LegacyFrame';

describe('LegacyFrame', () => {
  it('embeds a legacy page and keeps it in step with the shell without reloading', () => {
    render(<LegacyFrame path="experiments/route.html" title="Route finding" />);
    const frame = screen.getByTitle<HTMLIFrameElement>('Route finding');
    expect(frame.getAttribute('src')).toBe('/legacy/experiments/route.html?embed=1&lang=en&theme=system');

    const post = vi.spyOn(frame.contentWindow!, 'postMessage');
    act(() => useLab.getState().setLang('bn'));
    expect(post).toHaveBeenLastCalledWith(
      { type: 'lab:prefs', lang: 'bn', theme: 'system' },
      expect.any(String),
    );
    expect(frame.getAttribute('src')).toContain('lang=en');
  });
});
