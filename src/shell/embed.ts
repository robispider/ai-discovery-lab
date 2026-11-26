import type { Lang, Theme } from '../store/useLab';
import { legacyUrl } from './links';

/*
 * The bridge between the shell and a legacy experiment page shown in the stage iframe.
 * The other half is the embed mode in public/legacy/assets/lab.js; keep the two in step.
 */

export interface EmbedPrefs {
  lang: Lang;
  theme: Theme;
}

export interface PrefsMessage extends EmbedPrefs {
  type: 'lab:prefs';
}

/** Address of a legacy page in embed mode. Preferences in the URL make the first paint right. */
export function embedSrc(path: string, prefs: EmbedPrefs): string {
  const q = new URLSearchParams({ embed: '1', lang: prefs.lang, theme: prefs.theme });
  return `${legacyUrl(path)}?${q}`;
}

/** Same-origin target, except from file:// where every origin is "null" and only '*' delivers. */
export function targetOrigin(origin: string = window.location.origin): string {
  return !origin || origin === 'null' ? '*' : origin;
}

/** Tell the page in the iframe about the current language and theme. */
export function sendPrefs(target: Window | null | undefined, prefs: EmbedPrefs): void {
  if (!target) return;
  const message: PrefsMessage = { type: 'lab:prefs', lang: prefs.lang, theme: prefs.theme };
  target.postMessage(message, targetOrigin());
}
