import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

// The other half of the bridge: embed mode in the legacy shared script.
const LAB_JS = readFileSync(resolve(process.cwd(), 'public/legacy/assets/lab.js'), 'utf8');

interface LegacyLab {
  embedded: boolean;
  lang: string;
  header: (opts?: object) => void;
}

// Each load adds a message listener to the shared test window; remove them between tests.
const listeners: EventListenerOrEventListenerObject[] = [];

function loadLab(search: string): LegacyLab {
  window.history.replaceState(null, '', `/legacy/experiments/route.html${search}`);
  const add = window.addEventListener;
  window.addEventListener = ((type: string, fn: EventListenerOrEventListenerObject, opts?: unknown) => {
    if (type === 'message') listeners.push(fn);
    add.call(window, type, fn, opts as AddEventListenerOptions);
  }) as typeof window.addEventListener;
  try {
    new Function(LAB_JS)();
  } finally {
    window.addEventListener = add;
  }
  return (window as unknown as { LAB: LegacyLab }).LAB;
}

function post(data: unknown, source: Window | null = window) {
  window.dispatchEvent(new MessageEvent('message', { data, source, origin: window.location.origin }));
}

const root = document.documentElement;

afterEach(() => {
  for (const fn of listeners.splice(0)) window.removeEventListener('message', fn);
  for (const k of Object.keys(root.dataset)) delete root.dataset[k];
  document.body.innerHTML = '';
  window.history.replaceState(null, '', '/');
});

describe('legacy lab.js embed mode', () => {
  it('takes language and theme from the URL and does not save them', () => {
    localStorage.setItem('lab-lang', 'en');
    const LAB = loadLab('?embed=1&lang=bn&theme=projector');
    expect(LAB.embedded).toBe(true);
    expect(LAB.lang).toBe('bn');
    expect(root.dataset).toMatchObject({ embed: '1', lang: 'bn', theme: 'light', big: '1' });
    expect(localStorage.getItem('lab-lang')).toBe('en');
  });

  it('hides its own top bar in embed mode', () => {
    document.body.innerHTML = '<div id="lab-header"></div>';
    loadLab('?embed=1').header({ home: '../index.html' });
    expect(document.getElementById('lab-header')).toHaveProperty('hidden', true);
  });

  it('follows lab:prefs messages from the parent and redraws', () => {
    loadLab('?embed=1&lang=en&theme=light');
    const events: string[] = [];
    for (const name of ['langchange', 'themechange', 'labresize'])
      document.addEventListener(name, () => events.push(name), { once: true });

    post({ type: 'lab:prefs', lang: 'bn', theme: 'dark' });
    expect(root.dataset).toMatchObject({ lang: 'bn', theme: 'dark' });
    expect(root.dataset.big).toBeUndefined();
    expect(events).toEqual(['langchange', 'themechange', 'labresize']);

    post({ type: 'lab:prefs', lang: 'en', theme: 'system' });
    expect(root.dataset.lang).toBe('en');
    expect(root.dataset.theme).toBeUndefined();
  });

  it('ignores unknown values and messages from other windows', () => {
    loadLab('?embed=1&lang=en&theme=light');
    post({ type: 'lab:prefs', lang: 'fr', theme: 'neon' });
    post({ type: 'lab:prefs', lang: 'bn', theme: 'dark' }, null);
    expect(root.dataset).toMatchObject({ lang: 'en', theme: 'light' });
  });

  it('keeps the saved choices when opened on its own', () => {
    localStorage.setItem('lab-lang', 'bn');
    localStorage.setItem('lab-theme', 'dark');
    const LAB = loadLab('');
    expect(LAB.embedded).toBe(false);
    expect(root.dataset.embed).toBeUndefined();
    expect(root.dataset).toMatchObject({ lang: 'bn', theme: 'dark' });
  });
});
