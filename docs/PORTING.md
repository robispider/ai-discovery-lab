# Porting a legacy experiment into the new lab

Each page in `public/legacy/experiments/` becomes a React lesson that uses the shell's stage, panel
and six-step learning cycle. Lesson 2 (`src/lessons/expert-system/`) is the reference port.

Status: all nine are ported (lessons 1, 2, 3, 4, 5, 8, 9, 11, 12). Lessons 6, 7 and 10 link to
online tools. New Bangla written during the port (step briefs, panel tab text, a few labels) should
be reviewed by a Bangla-speaking facilitator; text copied from the legacy pages was already reviewed.

## Where things go

| What | Where | Rule |
| --- | --- | --- |
| Algorithms (search, tree, k-means, Q-learning, n-grams…) | `src/engines/<name>/index.ts` | Pure TypeScript, no React, unit-tested with a known-answer case |
| Synthetic datasets | `src/data/<name>.ts` | Seeded with `rng()` from `src/engines/random.ts` (same generator as the legacy `LAB.rng`, so data matches) |
| Lesson state | `src/lessons/<id>/store.ts` | A small Zustand store, not persisted, with a `reset()` |
| Stage | `src/lessons/<id>/Stage.tsx` | One view per cycle step: `understand`, `explore`, `train`, `evaluate`, `break`, `apply` |
| Panel controls | `src/lessons/<id>/Controls.tsx` | Compact: presets (`<Presets>`), key settings, `<ResetButton>` |
| Step briefs | `src/lessons/<id>/index.ts` | `steps: Record<CycleStep, Bi>`: one sentence each, EN and BN |
| Lesson styles | `src/lessons/<id>/<id>.css` | Prefix classes per lesson (`ex-`, `cl-`…); tokens only, no literal colours |

Register the lesson in `src/lessons/registry.ts` with `steps`, `Stage` and `Controls`. Keep `legacy`
so the panel links to the previous version.

## Shared kit (`src/lessons/kit`)

`Card`, `Callout` (lesson / break), `Stat` + `Stats`, `Bars`, `LineChart`, `Slider`, `Choice`,
`Presets`, `ResetButton`, `Pill`, `Highlight`; hooks in `kit/hooks.ts`: `useTokens([...])` reads
CSS tokens for canvas drawing and follows theme changes, `useCanvas(draw, deps)` handles device
pixel ratio and resizing. Layout classes: `lab-view` (vertical stack), `lab-cols` (responsive
columns), `lab-row`, `lab-table`, `lab-lead`, `lab-big`.

Data colours are tokens: `--yes/--no` (two classes), `--ok`, `--c1…--c8` (series), and map colours
`--water --building --road --congested --blocked`.

## Text

Experiment copy lives with its lesson: `const { bi } = useT(); bi('English', 'বাংলা')`. Shell strings
go in `src/i18n/*.json`. Numbers shown to people go through `num()` so Bangla gets Bangla digits.
Copy the legacy Bangla wording; do not machine-translate new Bangla without marking it for review.

## Done when

- All six steps show something useful in EN and BN, and the "Break it" moment has a preset.
- The engine has tests; the lesson renders in `App.test.tsx`-style tests if it has tricky state.
- Works at 1366×768, in the projector theme, and at phone width without sideways scrolling.
