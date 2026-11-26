# AI Discovery Lab: Build Plan

*An interactive foundation of artificial intelligence for non-technical professionals:
city corporation officers, social science students, teachers.*

> **Status (2026-11-25):** for the first session, a dependency-free version was built in one evening.
> It is plain HTML/JS: `index.html` plus `experiments/*.html`, with 8 built-in experiments and 3 external tools.
> See [SESSION-RUNSHEET.md](SESSION-RUNSHEET.md).
> The architecture below (Vite/React, PWA, TF.js vision, tiny GPT) remains the target for later phases.
> The plain-JS experiments can be ported module by module.
>
> **Update (2026-11-26):** the React shell (Vite + React + TS) now exists in `src/`, with the previous
> lab moved unchanged to `public/legacy/`. Next: show each legacy experiment inside the shell's stage,
> then port the experiments one at a time.
>
> **Update (2026-11-26, later):** the nine built-in experiments now run on the shell's stage in an
> iframe (`?embed=1`), following the shell's language and theme without reloading. Lessons 6, 7 and
> 10 stay as links to their online tools. Next: port the experiments into React one at a time,
> starting with the shortest (expert system, 155 lines).
>
> **Update (2026-11-26, Phase 2):** all nine built-in experiments are ported to React in the new
> lab's design. Each lesson has six step views (understand → apply), step briefs in EN and BN,
> Break-it presets and a reset in the panel. Engines live in `src/engines/` with known-answer tests
> that match the legacy pages' numbers. Conventions: [PORTING.md](PORTING.md). Still to do: Bangla
> review of new step text, facilitator notes per lesson, and the AI map, glossary and session pages.

This plan turns the lab concept (ten live experiments, six modules,
"25% presentation, 75% experimentation") into a buildable product. It covers what
to build, how it fits together, the order to build it in, and when each phase is done.

---

## 1. Goals and non-goals

**Goals**

1. A single **browser-based lab** that runs every core experiment **offline** on an
   ordinary 8 GB laptop with a projector. No API keys, servers or GPU.
2. **Bilingual (English / বাংলা)** throughout: UI, explanations, datasets, facilitator notes.
3. Every module follows the same learning cycle:
   **Understand → Explore Data → Train → Evaluate → Break it → Apply**
   ("Experiment" from the original concept becomes **Break it**: deliberately
   adding bias, noise or unfamiliar inputs, so failure is part of every lesson.)
4. **Transparent algorithms.** Participants can see what the machine is doing: rules
   fired, tree splits, weights changing, Q-values updating, token probabilities.
5. **Reusable**: one facilitator can run a 3-hour session or a full-day workshop
   from the same app, and the app can be handed to other trainers.

**Non-goals (v1)**

- No user accounts, grading, or LMS integration.
- No training of large models. "Tiny GPT" is tiny by design.
- No real citizen data. All datasets are **synthetic and labeled as such**.
- No dependence on third-party websites during a session. External tools
  (TensorFlow Playground, Teachable Machine, Transformer Explainer, Orange) are
  *complements and fallbacks*, not the core.

---

## 2. Key decisions

| Decision | Choice | Why |
| --- | --- | --- |
| App type | Static single-page app, installable as a **PWA** | Works offline after one load; zero hosting cost; can run from a USB stick via a local static server. |
| Framework | **Vite + React + TypeScript** | Large ecosystem for interactive UIs; fast dev loop; static build. (Astro adds little here: almost every page is an interactive widget.) |
| Visuals | **SVG + D3** for diagrams and trees, **Canvas** for grids and simulations, **Plotly.js** (or Observable Plot) for charts | SVG for crisp projector output; Canvas where many elements animate. |
| Classical ML | **Hand-written TypeScript engines** (CART tree, linear regression, k-means, Naive Bayes) | Small (100–300 lines each), easy to animate step by step, no 30 MB Pyodide + scikit-learn download. Pyodide becomes an optional "show me the Python" extra later. |
| Neural nets | Own tiny MLP engine for the 2D playground; **TensorFlow.js** for vision and tiny GPT | The playground needs per-step introspection; vision and GPT need WebGL speed. |
| Vision | **MobileNet (TF.js) feature extractor + k-NN / small dense head** | Same transfer-learning idea as Teachable Machine; trains in seconds. |
| Pretrained LM | **Transformers.js** running GPT-2 (quantized ONNX) | Real pretrained model in the browser, offline once cached. |
| i18n | `react-i18next` with `en.json` / `bn.json`; self-hosted **Noto Sans Bengali** + Inter | Bangla must render correctly offline (no Google Fonts at runtime). |
| Data | Seeded **generator scripts** produce CSVs in `data/` | Reproducible; facilitators can explain the hidden "true rule"; same CSVs open in Orange. |
| Models/weights | Downloaded by a script into `public/models/` (not committed) | Keeps the repo small; script verifies checksums. |
| Tests | **Vitest** for engines, **Playwright** for smoke tests and an offline test | Engines must be correct; demos must not break on stage. |
| Hosting | GitHub Pages (or any static host) + a "classroom bundle" zip | Online for sharing, zip for venues with poor internet. |

---

## 3. Architecture

```
ai-discovery-lab/
├─ docs/
│  ├─ PLAN.md                  ← this file
│  ├─ facilitator/             ← per-module scripts: talking points, timing, failure demos
│  └─ datasets.md              ← what each synthetic dataset contains and how it was generated
├─ data/
│  ├─ generators/              ← seeded Node/TS scripts that write the CSVs
│  └─ *.csv / *.json           ← generated datasets (committed, small)
├─ scripts/
│  └─ fetch-models.ts          ← downloads MobileNet + GPT-2 into public/models, verifies hashes
├─ public/models/              ← model weights (git-ignored)
└─ src/
   ├─ app/                     ← routing, layout, language switch, presenter mode
   ├─ ui/                      ← design system: colours, type scale, line-art icons, buttons, sliders
   ├─ shell/                   ← LabShell: the 6-step cycle, step navigator, reset, scenario presets
   ├─ engines/                 ← pure TypeScript, no React, fully unit-tested
   │  ├─ search/               (BFS, Dijkstra, A*, emits an exploration trace)
   │  ├─ rules/                (forward-chaining rule engine, emits which rule fired and why)
   │  ├─ tree/                 (CART with gini/entropy, depth limit, emits split trace)
   │  ├─ regression/           (OLS + gradient-descent version for animation)
   │  ├─ cluster/              (k-means with per-iteration snapshots, elbow helper)
   │  ├─ mlp/                  (tiny MLP with backprop, exposes weights per epoch)
   │  ├─ rl/                   (intersection simulator + tabular Q-learning + safety shield)
   │  ├─ text/                 (Bangla/English tokenizer, TF-IDF, Naive Bayes, n-gram LM)
   │  └─ metrics/              (train/test split, accuracy, confusion matrix, MAE, R²)
   ├─ modules/
   │  ├─ 01-classical/
   │  ├─ 02-machine-learning/
   │  ├─ 03-neural-networks/
   │  ├─ 04-computer-vision/
   │  ├─ 05-reinforcement/
   │  ├─ 06-language-models/
   │  └─ 07-capstone-right-ai/
   ├─ session/                 ← agenda runner: timed 3-hour / full-day plans, script cards
   └─ locales/{en,bn}.json
```

**Rule of thumb:** engines never import React, and modules never contain
algorithms. That keeps every algorithm testable, lets the UI animate engine
*traces*, and lets a curious participant open `engines/tree` and read ~200 lines
of code that really trained the model they just used.

### The LabShell (shared by every module)

Every experiment is defined declaratively and rendered by one shell:

```ts
defineExperiment({
  id: 'waterlogging-tree',
  family: 'machine-learning',
  title: { en: 'Predicting waterlogging', bn: 'জলাবদ্ধতার পূর্বাভাস' },
  steps: { understand, exploreData, train, evaluate, breakIt, apply },
  presets: [...],      // named states the facilitator can jump to on stage
  durationMin: 15,
});
```

Shell features: step navigator, big **Reset** button, **presets** ("jump to the
overfitted tree"), keyboard shortcuts (→ next step, R reset, P presenter mode),
an always-visible "Synthetic data" badge, and an "AI family" tag linking back
to the landscape map.

### Presenter mode

- Projector-safe: ≥ 24 px body text, high-contrast theme, no hover-only information.
- Facilitator notes in a second window (or hidden panel) synced to the current step.
- Session runner: shows the agenda, a countdown per block, and the next experiment.

---

## 4. Modules and experiments

Each row lists **what is built**, the **"Break it"** moment, and the **external
fallback** if the built version is not ready or fails on the day.

### Module 0: The AI landscape (intro, no training)

- Interactive map of AI families (symbolic, classical ML, neural networks, deep
  learning, RL, LLMs) with the city-service example for each. LLMs drawn
  *inside* the neural-network family.
- Clicking a family jumps to its module. Used at the start and again at the end.

### Module 1: Classical AI

| | Experiment 1: Route finding | Experiment 2: Complaint routing expert system |
| --- | --- | --- |
| Build | Grid over a stylized ward map; draw blocked roads; run **BFS / Dijkstra / A\*** side by side; animate explored cells; counters for "cells explored" and route length. | Editable IF-THEN rule table (keywords → department); submit complaints in EN/BN; show which rule fired and the reasoning chain. |
| Break it | Block the only bridge; add a one-way street; give A\* a bad heuristic. | A complaint that matches no rule, or two conflicting rules. |
| Lesson | Intelligence without data, training or neural networks. | A human supplies the knowledge; the machine only applies it. |
| Fallback | Smart Pathfinder / any A\* visualizer | Paper rule cards |

### Module 2: Machine learning

| | Exp 3: Waterlogging (classification) | Exp 4: Waste demand (regression) | Exp 5: Neighbourhood groups (clustering) |
| --- | --- | --- | --- |
| Data | 800 synthetic ward-days: rainfall, drain blockage %, elevation, distance to canal, label | 120 wards: population, households, businesses, season to tonnes/day | 200 neighbourhoods: density, waste, transit access, drainage coverage |
| Build | Data table + scatter plot; **train/test split slider**; **train** animates the tree growing split by split; depth slider; accuracy + confusion matrix on unseen data; "Use" panel with sliders for a new ward-day | Scatter + fitted line; residuals drawn as lines; gradient-descent animation; MAE/R²; predict a new ward | k slider; iteration-by-iteration animation; cluster profile cards that participants **name themselves** |
| Break it | Depth 20 → perfect train score, worse test score (overfitting). Toggle **"under-reported wards"**: some wards' floods never recorded, so the model learns they are safe. | Add an outlier ward (a market) and see the line swing; extrapolate to a ward 5× bigger | Unscaled features dominate; k=2 vs k=8; same data, different stories |
| Lesson | Rules learned from examples; test on unseen data; biased records give biased predictions | AI predicts quantities; correlation ≠ causation | Patterns without answers; humans interpret clusters |
| Fallback | Orange Data Mining with the same CSV | Orange | Orange |

*Social science variants* (same engines, different CSV): school enrollment
regression, survey-respondent clustering. Datasets are swappable per session.

### Module 3: Neural networks (Experiment 6)

- Own mini-playground: 2D datasets (linear, circle, XOR, spiral), add/remove
  layers and neurons, activation choice, learning-rate slider, **play/pause/step**.
- Live decision-boundary heatmap, edge thickness = weight, training vs test loss curve.
- Guided presets: *single neuron on linear data → fails on circle → add hidden
  layer → succeeds → add 30% label noise → overfits*.
- Fallback: TensorFlow Playground (online).

### Module 4: Computer vision (Experiment 7)

- Webcam capture into three classes (Organic / Plastic / Paper), with thumbnail
  grid and per-class count. Image upload as a no-webcam path.
- Train = MobileNet embeddings + k-NN (instant) or a small dense head (shows epochs).
- Live prediction bars with confidence.
- **Break it**: new object, dim lighting, different background, train only on
  one colour of bottle. Then add representative samples and retrain.
- Lesson: high confidence ≠ correct; data coverage matters more than the model.
- Fallback: Teachable Machine (online).

### Module 5: Reinforcement learning (Experiment 8)

- Canvas simulation of a 4-way intersection; arrival-rate sliders per direction.
- Controllers: **fixed-time** vs **Q-learning** agent.
  State = discretized queue lengths + current phase; actions = keep / switch;
  reward = −(total waiting vehicles).
- A **safety shield** outside the agent enforces minimum green, yellow and
  all-red. The agent cannot override it. This is a key lesson for officers:
  constraints are engineered, not learned.
- Fast-forward training (hundreds of episodes in seconds), learning curve,
  side-by-side average delay, Q-table heatmap.
- **Break it**: train on morning traffic, test on evening traffic; reward only
  one direction's delay.

### Module 6: Language models (Experiments 9 and 10)

1. **Audience game**: "The city corporation collects …" Participants vote, and the
   app shows the vote as a probability distribution.
2. **Counting model (bigram/trigram)**: built from a small text; the probability
   table is fully visible; generate text; see why it rambles.
3. **Tiny GPT trained live** (TF.js): character-level Transformer (~50–100k
   parameters) on a small corpus (Bangladeshi place names, or short civic
   sentences). Stages shown: tokenization → random init (gibberish) → loss
   falling → plausible output. Retrain on a different corpus to show the output
   follows the data.
4. **Pretrained GPT-2 explorer** (Transformers.js): type a prompt, see tokens,
   top-10 next-token probabilities, temperature and top-k sliders, step-by-step
   generation. Note on screen: GPT-2 is English-centric and weak in Bangla,
   which itself is a lesson about training data.
5. Link-out: Transformer Explainer for attention internals (online).
6. Only after this: a short bridge to ChatGPT / Claude / Gemini as *applications
   built around much larger models of the same kind*.

### Module 7: Capstone, "The right AI for the job"

**Bangla citizen complaint routing, solved three ways on the same held-out test set:**

| Approach | Built with | Shown |
| --- | --- | --- |
| Rules | Module 1 rule engine | Accuracy, speed, explainability (rule trace) |
| Classical ML | TF-IDF + Naive Bayes (`engines/text`) | Accuracy, speed, top words per department |
| LLM | **Precomputed** results stored in the repo; optional live call if the facilitator configures a local model (e.g. Ollama) or an API key | Accuracy, speed, cost per 1,000 complaints, explainability |

Result: a comparison table + discussion. *The most sophisticated AI is not
necessarily the most appropriate AI.*

Dataset: ~600 synthetic Bangla complaints across ~6 departments (waste,
drainage, roads, streetlights, mosquito control, trade licence), including
code-mixed Banglish and spelling variants. **Must be reviewed by a native
Bangla speaker familiar with city corporation services.**

### Cross-cutting: Responsible AI

Every **Break it** step ends with one discussion prompt (bias in historical
records, correlation vs causation, automation of rights and eligibility,
over-trust in confidence scores). A closing page collects these into an
"AI in public service checklist" participants can take away.

---

## 5. Datasets

| File | Rows | Used by | Hidden generating rule (documented in `docs/datasets.md`) |
| --- | --- | --- | --- |
| `city-grid.json` | n/a | Exp 1 | Stylized ward map with roads, canal and bridges |
| `complaint-rules.json` | ~20 rules | Exp 2, 7 | Keyword → department |
| `waterlogging.csv` | 800 | Exp 3 | Logistic rule on rainfall × blockage × elevation + noise; optional under-reporting bias column |
| `waste-demand.csv` | 120 | Exp 4 | Linear in population/businesses + seasonal effect + noise |
| `neighbourhoods.csv` | 200 | Exp 5 | 4 latent neighbourhood types |
| `school-enrollment.csv`, `survey.csv` | 150 / 300 | Social science variants | Documented latent structure |
| `complaints-bn.csv` | ~600 | Exp 2, capstone | Templates + paraphrases, human-reviewed |
| `corpus-places.txt`, `corpus-civic.txt` | small | Exp 9 | n/a |

All generators are seeded, so the same numbers appear in every session and in the
facilitator notes. All CSVs open directly in Orange for hands-on follow-up.

---

## 6. Build phases

Estimates assume **one developer working with an AI coding assistant**, part-time.
They are rough sizing, not commitments.

### Phase 0: Foundations (≈ 1–2 weeks)

- Scaffold Vite + React + TS, lint/format, Vitest, Playwright, CI, GitHub Pages deploy.
- Design system: colour tokens (light, dark and projector themes), type scale with
  Bangla font, line-art icon set, slider/button/table components.
- i18n wiring with EN/BN switch; content stored in locale files from day one.
- `LabShell`, step navigator, presets, reset, presenter mode, synthetic-data badge.
- PWA/offline caching.
- Module 0 (AI landscape map).

**Done when:** a placeholder experiment runs through all 6 steps in both languages,
installs as a PWA, and loads with Wi-Fi switched off.

### Phase 1: Pilot-ready MVP (≈ 3–4 weeks)

- Engines: search, rules, tree, regression, k-means, metrics (with unit tests).
- Module 1 (Exp 1, 2) and Module 2 (Exp 3, 4, 5).
- Data generators for those experiments.
- Facilitator notes for each.
- Link-out cards for TF Playground, Teachable Machine and Transformer Explainer, so
  a **full 3-hour session can already run** with external tools covering
  Modules 3–6.

**Done when:** a facilitator can deliver the 3-hour agenda end to end
(own modules + external fallbacks). **Run a pilot session here** and collect feedback
before building further.

### Phase 2: Neural networks and vision (≈ 3 weeks)

- `engines/mlp` + Module 3 playground with guided presets.
- `fetch-models` script; Module 4 webcam classifier with upload fallback.
- Performance pass on an 8 GB laptop (target: playground ≥ 30 fps, vision
  training < 10 s for 150 images).

### Phase 3: Reinforcement learning (≈ 2 weeks)

- Intersection simulator, Q-learning agent, safety shield, fast-forward training.
- Module 5 with fixed-time vs learned comparison and "Break it" scenarios.

### Phase 4: Language models and capstone (≈ 4 weeks)

- Audience voting game, n-gram model, tiny GPT in TF.js, GPT-2 explorer via
  Transformers.js.
- Bangla complaint dataset (generate, then human review), TF-IDF + Naive Bayes,
  precomputed LLM results, comparison view.
- Module 6 and Module 7.

### Phase 5: Hardening and handover (≈ 2 weeks)

- Session runner (3-hour and full-day agendas).
- Full Bangla content review; accessibility pass (keyboard, contrast, font sizes).
- Classroom bundle: zip + one-command local server + preloaded models.
- Facilitator guide PDF; "AI in public service" take-away checklist.
- Rehearsal checklist (below) run on the actual venue laptop and projector.

**Total:** roughly 15–17 part-time weeks for the full v1. Phase 1 alone gives a
usable lab after about 5 weeks.

---

## 7. Quality bar for every experiment ("definition of done")

- [ ] All six cycle steps exist and work in **EN and BN**.
- [ ] Engine has unit tests with a known-answer case.
- [ ] At least **one preset** per key teaching moment, including the failure demo.
- [ ] Works **offline**, on an 8 GB laptop, in Chrome and Edge, at 1280×720
      projector resolution.
- [ ] **Reset** returns to a clean state in under 1 second.
- [ ] Facilitator notes: goal, timing, talking points, expected questions, what to
      do if it breaks.
- [ ] "Synthetic data" badge visible wherever data is shown.

---

## 8. Session-day rehearsal checklist

1. Open the lab once online; confirm "Ready offline" indicator (models cached).
2. Turn Wi-Fi off; click through every module's first preset.
3. Webcam permission granted; test lighting in the actual room.
4. Projector at native resolution; presenter theme on; text readable from the back row.
5. Classroom bundle on a USB stick as a backup.
6. External tools (TF Playground, Teachable Machine, Transformer Explainer) open
   in background tabs, only if internet is available.

---

## 9. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Venue internet fails | PWA + classroom bundle; every core experiment is offline-first |
| Tiny GPT trains too slowly on weak laptops | Pre-trained checkpoints at several stages; "replay training" mode |
| GPT-2 download is large (~100+ MB) | Fetched once during setup and cached; quantized weights; skip-able module |
| Bangla text tokenization or rendering issues | Self-hosted fonts; tokenizer unit tests on real Bangla samples; native-speaker review |
| Synthetic data is mistaken for real city data | Persistent badge, dataset docs, explicit statement in facilitator script |
| External tool links change or disappear | Treated as optional fallbacks only; checked during rehearsal. Some tools in the original concept (e.g. the MicroGPT pages) still need to be verified before they are relied on |
| Scope creep | Phase 1 pilot first; only build further modules after pilot feedback |

---

## 10. Open decisions (need the lab owner's input)

1. **Date of the first session**: decides whether Phase 1 + external fallbacks is
   the target, or more modules must be built first.
2. **Audience setup**: projector-only demos, or participants on their own
   laptops or phones? (Phones change layout priorities and webcam use.)
3. **Bangla reviewer**: who validates the complaint dataset and translations?
4. **LLM in the capstone**: precomputed only, a local model (Ollama on the
   facilitator laptop), or a cloud API?
5. **Hosting and branding**: public GitHub Pages site, or local-only;
   any institutional logo or naming requirements.

---

## 11. Immediate next steps

1. Answer the open decisions above (at least #1 and #2).
2. Start Phase 0: scaffold the app, design tokens, i18n, `LabShell`, offline support.
3. Write `data/generators/waterlogging.ts` and `engines/tree` first. Experiment 3
   is the flagship "machine learns rules from examples" moment and exercises the
   whole shell.
