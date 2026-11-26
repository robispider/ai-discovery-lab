# Session run sheet: 3-hour AI foundation lab

A click-by-click guide for the facilitator. Timings follow the agenda on the lab's home page.
**Offline** = built into this lab, no internet. **Online** = external tool, needs internet.

---

## The night before (20 minutes)

1. **Review the Bangla text.** All Bangla was machine-drafted. Check especially:
   - [assets/complaints-data.js](../assets/complaints-data.js) (complaints and keywords)
   - the corpus in [experiments/nextword.html](../experiments/nextword.html)
2. **Open the lab on the presentation laptop** in one of two ways:
   - **Simplest:** double-click `index.html`. Everything works except the optional local-LLM panel.
   - **For phones too:** in a terminal in this folder, run `node serve.js`. It prints a `http://192.168.x.x:8000/`
     address; participants on the **same Wi-Fi** open that on their phones. No internet is needed.
   - **Online alternative:** the GitHub Pages address (if published).
3. **Click through each built-in experiment once with Wi-Fi off.** Open TensorFlow Playground
   (optional practice for Experiment 6), Teachable Machine (7), and Transformer Explainer (10)
   while you have internet.
4. **Teachable Machine:** allow webcam access once in the browser. Have real objects ready: a banana peel or
   vegetable scraps, a plastic bottle, newspaper. Also bring an "unfamiliar" object, such as a phone or a cup.
5. **Projector:** press **A+** (top right) for larger text. ◐ switches light/dark (light is usually better on projectors).
   **বাংলা / English** switches the language on every page.

---

## Agenda

| Time | Block | Open |
| --- | --- | --- |
| 0:00–0:15 | What is AI? | Home page, the **families of AI** map |
| 0:15–0:35 | Classical AI | Exp 1 Route, Exp 2 Expert system |
| 0:35–1:10 | Machine learning | Exp 3 Tree (main one), Exp 4 Regression, Exp 5 Clusters |
| 1:10–1:35 | Neural networks | Exp 6 guided lesson (offline), then TensorFlow Playground |
| 1:35–1:55 | Image recognition | Exp 7 Teachable Machine (online, webcam) |
| 1:55–2:05 | Break | |
| 2:05–2:20 | Reinforcement learning | Exp 8 Traffic |
| 2:20–2:45 | Language models | Exp 9 Next word, Exp 10 Transformer Explainer (online) |
| 2:45–3:00 | Right AI for the job, ethics | Exp 11 Bangla complaints + discussion |

**If short on time**, drop Exp 4 and Exp 10. Exp 3, 8, 9 and 11 carry the core messages.

---

## Experiment scripts

### 0. Families of AI (home page)
- Point out that LLMs sit *inside* neural networks, inside machine learning, inside AI.
- Ask: "Which of these have you already used without knowing?"

### 1. Route finding (offline)
1. Press **Dijkstra**: it explores widely and finds 63 min.
2. Press **A\***: the same 63 min, but it explores fewer places. "A good rule of thumb saves work."
3. Press **BFS**: 73 min. It counts streets and ignores traffic, so it drives through the market.
4. Press **Greedy**: it explores very little but takes 89 min. "Fast decisions are not always good ones."
5. **Block the west bridge**: the route now has to cross the market (73 min).
6. **Block both bridges**: no route. "AI cannot invent a road."
- **Message:** intelligent behaviour without any data or training.

### 2. Expert system (offline)
1. Click the sample complaints: each goes to the right department, and the page shows which rule fired.
2. **Tricky** complaints:
   - "রাস্তার বাতি…" goes to **Roads** (wrong), because "রাস্তা" matched first.
   - The smell complaint matches no rule.
   - Banglish matches nothing.
3. Invite a participant to fix a rule live, then show that the fix breaks something else.
- **Message:** humans supply the knowledge. Rules are transparent but brittle and costly to maintain.

### 3. Waterlogging decision tree (offline, the most important ML demo)
1. **Explore:** show the scatter plot. "Red = flooded. Can you see the pattern?"
2. Depth 3, press **Train the tree**. The tree grows question by question, and accuracy rises.
3. Read the rules aloud. "Nobody programmed these. The machine found them."
4. **Use:** move the sliders and follow the orange path.
5. **Break it A:** press **Try every depth**. At depth 12, training reaches 100% but the test score falls
   (about 85% down to 80%). That is memorising.
6. **Break it B:** set training to 5%. The rules become unstable.
7. **Break it C (key moment):** tick *"70% of floods in informal settlements were never reported"*.
   - Test accuracy still looks fine (about 81%).
   - The **Reality check** shows the model now warns **0%** of informal settlements that actually flood,
     compared with about 70% before.
   - Ask: "Who gets the drainage budget if we follow this model?"
- **CSV download** gives the same data for Orange, if you want hands-on work later.

### 4. Waste regression (offline)
1. **Learn step by step**: the line moves and the error curve falls.
2. Read the learned rule ("waste ≈ 3.4 + 0.43 × population").
3. Predict for a new ward. Then drag the slider far right, into "no data here".
4. Tick **5 market wards**, then **Best fit instantly**. The line swings, and R² drops from 93% to 28%.
- **Message:** correlation is not causation.

### 5. Clusters (offline)
1. **Find groups** with k = 4. Ask participants to **name each group** from its profile card.
2. **Reveal how the data was generated** and compare with their names.
3. **Break it:** turn off scaling and the groups get worse. Try k = 2 and k = 8, and a new random start.
- **Message:** the machine finds groups; humans give them meaning.

### 6. Neural networks with basic arithmetic (offline)

1. **Understand.** Click **Run signal** to compare the two neuron diagrams. Click an artificial neuron's
   connection or circle to pause on its arithmetic. Ask for the result of `2 × 3 + 1 × 4 + 1`, then move a weight and repeat.
2. **Explore data.** Select two rounds and compare the initial guess of four sacks with the six in the example.
3. **Train.** Click **Train one step** and open the nearby weight trials. Start at weight 2 and step four times
   to reach 3. Ask why the model kept each new weight.
4. **Evaluate.** Ask for a prediction for four rounds, then reveal the record.
5. **Break it.** Toggle both street reports and watch the signals move. Click each hidden neuron and the
   output circle to see its calculation.
6. **Apply.** Move and turn the divider. Switch on **Two hidden units** and watch all four cases match.
   Open **TensorFlow Playground** (online) to experiment with learning a similar pattern.

### 7. Teachable Machine (online, webcam)
Follow the steps under Experiment 7 on the home page.
- Collect 30–50 images per class, with participants holding the objects.
- **Break it:** use an unfamiliar object, dim the lights, change the background.
- **Message:** high confidence ≠ correct, and the data matters more than the model.

### 8. Traffic signal (offline)
1. **Watch both** before training. The untrained agent never switches, and the side road piles up.
2. Click **Train 30 episodes**. Each point tests the current policy on the same 12 traffic runs, which are separate from training. Compare wait, the share of cars that cleared, and the number of runs in which the agent had less wait than the demand-adjusted timer.
3. **Watch both** again and select a cell in the strategy table (K/S) to inspect both Q-values and how often each action was tried.
4. Point at the **safety rules** box. Both controllers enforce the 6 s minimum green, 3 s yellow, and 1 s all-red clearance.
5. Choose **Main road only (N–S)** and train again. Compare the East–West delay and the share of cars that cleared.
   Ask: "Who decides the reward in a real city?"

### 9. Next-word prediction (offline)
1. **Audience game:** read "The city corporation collects…". Count hands and click once per vote.
2. Generate **before training**: gibberish.
3. **Train**, then **Write a sentence**. Look for a sentence that sounds right but is false, such as
   "…collects holding tax every month". That is a hallucination in miniature.
4. Switch to **2 previous words**: the model often copies training sentences exactly.
5. Switch to **বাংলা** and repeat.

### 10. Transformer Explainer (online)
Follow the steps under Experiment 10 on the home page.
- Stress that this is **inference**, not training.
- Only now introduce ChatGPT, Claude and Gemini as applications built on much larger models of this kind.

### 11. Bangla complaint routing: the right AI for the job (offline)
1. **Run the comparison.**
   - **Rules:** about 68% on the standard test, 20% on the hard test.
   - **Machine learning:** about 98% on the standard test, 80% on the hard test.
2. Slide training examples down to 12: ML falls to about 32%.
3. Walk through the 10 hard complaints. Both approaches fail on Banglish.
4. Discuss the LLM row: no training needed, but there are cost, hardware, privacy (cloud) and explainability trade-offs.
5. **Optional local LLM:** only if Ollama is installed with a model pulled the night before. Run the lab via
   `node serve.js` and open `http://localhost:8000`.

### 13. Smart drain sensors: noisy streams & early flood warning (offline)
1. **Understand:** scrub through *Test 1: Kalbaishakhi downpour*. Show how upstream khal surge + rising slope starts the stormwater pump 30 minutes before street spillover (85 cm).
2. **Explore:** switch to *Test 2: Short shower + debris spike* and turn off the median spike filter — watch a single floating-plastic echo trigger a false alarm.
3. **Evaluate:** compare Raw threshold, Cleaned threshold, and the 30-min AI forecaster on all 4 unseen storms.
4. **Break it:** inject *Mud / plastic stuck* (flatline) and *Main avenues only* placement. Ask: "If sensors are only on VIP avenues, did IoT fix Lesson 3's bias or automate it?"

### 14. Stormwater pump health: vibration sensing & Edge AI (offline + optional live mic)
1. **Understand:** toggle between *Healthy hum* (~0.47 g RMS) and *Early bearing wear* (~0.51 g RMS). Point out that overall loudness barely moves, while the 61–95 Hz rattle band jumps 6×.
2. **Optional live room demo:** click **Try live mic sensor**, hum softly (lights up low band) and tap the desk (lights up high band). Zero internet needed.
3. **Train & Evaluate:** show the 80-byte microcontroller model (20 numbers vs 8 billion in Lesson 12) and compare battery life: 3 days streaming raw waves to the Cloud vs 700+ days running Edge AI on the chip.
4. **Break it:** send a heavy truck past the pump house and bake the sensor at 45 °C, then turn on multi-window persistence and spectral ratio normalization.

**Closing discussion prompts:**
- Correlation is not causation.
- Historical records contain institutional bias (Exp 3).
- AI predictions must not automatically decide citizens' rights or eligibility for services.
- Always keep a human review path.

---

## If something fails

| Problem | Fallback |
| --- | --- |
| No internet | Skip 6, 7, 10. Use the built-in lessons and describe them. Experiments 3, 8, 9 and 11 carry the core messages. |
| Phones cannot connect | Check they are on the same Wi-Fi as the laptop. Allow Node through the Windows firewall when prompted. Otherwise project only. |
| Webcam blocked | Browser address bar → camera icon → Allow. Otherwise show Teachable Machine's "Upload" option with photos. |
| A page looks stuck | Reload the page. Every experiment starts from the same seeded data. |
