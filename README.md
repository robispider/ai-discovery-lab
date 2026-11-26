# AI Discovery Lab

An interactive, bilingual (English / বাংলা), offline browser lab that teaches the foundations of AI to
non-technical professionals (city corporation officers, social science students) through live experiments.

## Run it

The lab is being rebuilt as a React app (see [docs/PLAN.md](docs/PLAN.md)). The new shell is in `src/`.
Until each experiment is ported, the shell runs the previous plain-HTML version of it from
`public/legacy/` inside the stage, and keeps its language and theme in step with the shell.

Requires Node.js 20 or newer.

```sh
npm install
npm run dev               # develop at http://localhost:5173
npm run build             # static site in dist/ (Vercel, GitHub Pages, or serve.js)
npm run build:classroom   # dist-classroom/: the app in one index.html, plus legacy/ beside it
node serve.js             # serve dist/ to phones on the same Wi-Fi (after npm run build)
```

- **Offline venue:** copy the whole `dist-classroom/` folder (not only `index.html`: the experiments
  load from `legacy/` beside it) to the laptop or a USB stick and double-click `index.html`.
  No server and no internet are needed.
- **Phones on the same Wi-Fi:** `npm run build`, then `node serve.js`, and share the printed
  `http://192.168.x.x:8000/` address.
- **Previous version only:** `public/legacy/index.html` still opens by double-click, as before.

| Command | What it checks |
| --- | --- |
| `npm test` | Vitest: UI strings in both languages, lesson registry, store, shell rendering, the shell ↔ legacy page bridge |
| `npm run lint` | ESLint (TypeScript, React hooks) |
| `npm run typecheck` | TypeScript |

## What's inside

| # | Experiment | AI family | Where |
| --- | --- | --- | --- |
| 1 | Garbage truck route finding (BFS, Dijkstra, A*, Greedy) | Classical AI | built in |
| 2 | Complaint routing expert system | Classical AI | built in |
| 3 | Waterlogging decision tree (overfitting, biased records) | Machine learning | built in |
| 4 | Ward waste regression (outliers, extrapolation) | Machine learning | built in |
| 5 | Neighbourhood clustering (k-means, scaling) | Unsupervised learning | built in |
| 6 | Neural network training | Neural networks | TensorFlow Playground (online) |
| 7 | Webcam image recognition | Deep learning | Teachable Machine (online) |
| 8 | Learning traffic signal (Q-learning + safety rules) | Reinforcement learning | built in |
| 9 | Next-word prediction: train a tiny language model | Language models | built in |
| 10 | Inside GPT-2 | Language models | Transformer Explainer (online) |
| 11 | Bangla complaint routing: rules vs ML vs local LLM | Capstone | built in |
| 12 | Visual guide: LLM models, GPU & CUDA cores, self-hosting & civic open source | Language models | built in |

- New shell: Vite + React + TypeScript, React Router (hash URLs such as `#/lesson/3`), Zustand for
  language, theme and progress. Fonts (Archivo, Noto Sans Bengali, JetBrains Mono) are bundled, so
  Bangla renders the same on every machine, offline.
- Themes: light, dark, and a high-contrast projector theme (Settings).
- Legacy experiments on the stage: the shell loads `legacy/experiments/<page>.html?embed=1&lang=…&theme=…`
  in an iframe. In embed mode `public/legacy/assets/lab.js` hides the page's own top bar and cycle,
  and later language or theme changes arrive as `{type: 'lab:prefs'}` messages, so the experiment
  is never reloaded. Opened on its own, a legacy page behaves exactly as before. The shell side is
  `src/shell/embed.ts` and `LegacyFrame.tsx`.
- All datasets are synthetic, seeded and labelled as such. `data/Bengali hate speech .csv` is not used
  by any lesson and is kept out of the app build.

## Project layout

```
src/app/        App, routes, language and theme sync
src/shell/      TopBar, IconRail, Stage + learning cycle, LessonPanel, Filmstrip
src/lessons/    registry.ts: the 12 lessons (titles, family, content); types.ts: defineLesson
src/i18n/       en.json, bn.json, useT()
src/store/      useLab: language, theme, progress, cycle step
src/ui/         design tokens, global styles, icons
src/pages/      Home, Settings, placeholders for the AI map, glossary and session runner
public/legacy/  the previous plain-HTML lab; only lab.js/lab.css gained an embed mode
```

## Docs

- [docs/SESSION-RUNSHEET.md](docs/SESSION-RUNSHEET.md): click-by-click facilitator script for a 3-hour session
- [docs/PLAN.md](docs/PLAN.md): long-term plan for growing this into a full learning platform
