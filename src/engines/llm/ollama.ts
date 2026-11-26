/*
 * Optional local language model through Ollama (lesson 11). Nothing leaves the laptop: the request
 * goes to http://localhost:11434 by default. Used only when the facilitator presses the button.
 */

export interface OllamaOptions {
  url: string;
  model: string;
  timeoutMs?: number;
}

/** Ask the model a classification prompt and return the first allowed label that appears. */
export async function classifyWithOllama<L extends string>(
  prompt: string,
  labels: L[],
  { url, model, timeoutMs = 60000 }: OllamaOptions,
  aliases: Record<string, L> = {},
): Promise<L | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      signal: ctl.signal,
      body: JSON.stringify({ model, prompt, stream: false, options: { temperature: 0 } }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
    const out = String(((await res.json()) as { response?: string }).response ?? '').toLowerCase();
    return firstLabel(out, labels, aliases);
  } finally {
    clearTimeout(timer);
  }
}

/** The allowed label that appears earliest in `text`, or null. */
export function firstLabel<L extends string>(
  text: string,
  labels: L[],
  aliases: Record<string, L> = {},
): L | null {
  let hit: L | null = null;
  let pos = Infinity;
  for (const [word, label] of [...labels.map((l) => [l, l] as const), ...Object.entries(aliases)]) {
    const i = text.indexOf(word);
    if (i >= 0 && i < pos) {
      pos = i;
      hit = label as L;
    }
  }
  return hit;
}
