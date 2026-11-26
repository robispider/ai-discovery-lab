# AI Discovery Lab

An interactive, bilingual (English / বাংলা), offline browser lab that teaches the foundations of AI to
non-technical professionals (city corporation officers, social science students) through live experiments.

## Run it

- **Simplest:** double-click `index.html`. Works offline, no installation.
- **For phones on the same Wi-Fi:** run `node serve.js` and share the printed `http://192.168.x.x:8000/` address.
- **Online:** publish the repository with GitHub Pages (Settings → Pages → Deploy from branch `main`, root folder).

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

- Plain HTML/CSS/JavaScript with no build step and no external libraries.
- All datasets are synthetic, seeded and labelled as such.

## Docs

- [docs/SESSION-RUNSHEET.md](docs/SESSION-RUNSHEET.md): click-by-click facilitator script for a 3-hour session
- [docs/PLAN.md](docs/PLAN.md): long-term plan for growing this into a full learning platform
