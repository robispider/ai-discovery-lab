(function () {
  'use strict';

  LAB.header({ home: '../index.html', family: ['Reinforcement learning', 'রিইনফোর্সমেন্ট লার্নিং'] });

  const byId = (id) => document.getElementById(id);
  const t = LAB.t;
  const minGreen = 6;
  const yellowTime = 3;
  const redClearance = 1;
  const headway = 2;
  const startup = 2;
  const alpha = 0.1;
  const gamma = 0.98;
  const episodeSeconds = 900;
  const batchSize = 30;
  const checkpointEvery = 5;
  const testRuns = 12;
  const seed = 5000;
  const startingQueues = [2, 1, 2, 3];
  const patterns = { main: [14, 6], balanced: [10, 10], side: [6, 14] };
  const patternNames = {
    main: ['Main-road rush', 'প্রধান রাস্তায় ভিড়'],
    balanced: ['Even traffic', 'সমান যানবাহন'],
    side: ['Side-road rush', 'পাশের রাস্তায় ভিড়'],
    custom: ['Custom', 'নিজের পছন্দ']
  };
  const ranges = ['0', '1–2', '3–5', '6–9', '10+'];
  const limits = [0, 2, 5, 9];
  function bucket(q) {
    let index = 0;
    while (index < limits.length && q > limits[index]) index++;
    return index;
  }
  const road = (phase) => phase === 0 ? t('North–South', 'উত্তর–দক্ষিণ') : t('East–West', 'পূর্ব–পশ্চিম');
  const roadShort = (phase) => phase === 0 ? t('N–S', 'উ–দ') : t('E–W', 'পূ–প');
  const formatTime = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  const seconds = (s, digits = 0) => s.toFixed(digits) + t(' s', ' সে.');
  const localizedNumber = (n) => n.toLocaleString(LAB.lang === 'bn' ? 'bn-BD' : 'en');

  function fixedPlan([ns, ew]) {
    const nsGreen = Math.max(10, Math.min(50, 2 * Math.round(30 * ns / (ns + ew))));
    return [nsGreen, 60 - nsGreen];
  }

  // A decision spans two seconds for Keep and a full clearance plus minimum
  // green for Switch. Discount each intervening reward and the next state.
  class Learner {
    constructor() {
      this.values = new Float64Array(100);
      this.visits = new Uint32Array(100);
      this.updates = 0;
    }

    state(sim) {
      return sim.phase * 25 + bucket(sim.queue(sim.phase)) * 5 + bucket(sim.queue(1 - sim.phase));
    }

    best(state) {
      return this.values[state * 2 + 1] > this.values[state * 2] ? 1 : 0;
    }

    seen(state) {
      return this.visits[state * 2] + this.visits[state * 2 + 1] > 0;
    }

    explorationRate() {
      return 0.05 + 0.20 * Math.exp(-this.updates / 3000);
    }

    update(pending, nextState, trackUpdate = false) {
      const future = nextState === null ? 0 : this.values[nextState * 2 + this.best(nextState)];
      const i = pending.state * 2 + pending.action;
      const previous = this.values[i];
      const target = pending.reward + pending.discount * future;
      this.values[i] += alpha * (target - previous);
      this.updates++;
      if (trackUpdate) return { action: pending.action, state: pending.state, previous, target, next: this.values[i] };
    }

    choose(sim, state, learning) {
      if (learning && sim.pending) sim.lastUpdate = this.update(sim.pending, state, Boolean(sim.motion));
      const explore = learning && sim.exploration() < this.explorationRate();
      const action = explore ? Number(sim.exploration() < 0.5) : this.best(state);
      if (learning) {
        this.visits[state * 2 + action]++;
        sim.pending = { state, action, reward: 0, discount: 1 };
      }
      return { action, explore };
    }
  }

  class Intersection {
    constructor(arrivalSeed, trackCars = false) {
      this.arrival = LAB.rng(arrivalSeed);
      this.exploration = LAB.rng(arrivalSeed ^ 0x9e3779b9);
      // Offsetting the arrival waves imitates platoons from upstream signals.
      this.arrivalOffsets = Array.from({ length: 4 }, () => Math.floor(this.arrival() * 60));
      this.q = trackCars ? startingQueues.slice() : [0, 0, 0, 0];
      this.heads = [0, 0, 0, 0];
      this.time = 0;
      this.phase = 0;
      this.green = 0;
      this.clearance = 0;
      this.wait = [0, 0];
      this.arrived = [this.queue(0), this.queue(1)];
      this.crossed = 0;
      this.pending = null;
      this.lastState = null;
      this.lastTick = null;
      this.lastUpdate = null;
      this.motion = trackCars ? this.q.map(() => ({ entered: -1, departed: false, crossing: [] })) : null;
    }

    queue(phase) {
      return this.q[phase * 2] + this.q[phase * 2 + 1];
    }

    averageWait() {
      return (this.wait[0] + this.wait[1]) / (this.arrived[0] + this.arrived[1] || 1);
    }

    addCars(arm, count) {
      this.q[arm] += count;
      this.arrived[arm < 2 ? 0 : 1] += count;
    }

    tick(rates, controller, learning = false, mainOnly = false) {
      for (let arm = 0; arm < 4; arm++) {
        const lane = this.motion?.[arm];
        if (lane) {
          lane.departed = false;
          lane.entered = -1;
          lane.crossing = lane.crossing.filter((car) => this.time - car.time < 3);
        }
        const inPlatoon = (this.time + this.arrivalOffsets[arm]) % 60 < 30;
        if (this.arrival() < rates[arm < 2 ? 0 : 1] * (inPlatoon ? 1.6 : 0.4)) {
          if (lane) lane.entered = this.heads[arm] + this.q[arm];
          this.addCars(arm, 1);
        }
      }

      let context = 'timer';
      let remaining = 0;
      let action = 0;
      const phaseBefore = this.phase;
      const nsBefore = this.queue(0);
      const ewBefore = this.queue(1);
      if (this.clearance) {
        context = this.clearance > redClearance ? 'yellow' : 'allRed';
        remaining = context === 'yellow' ? this.clearance - redClearance : this.clearance;
      } else if (this.green < minGreen) {
        context = 'minimum';
        remaining = minGreen - this.green;
      } else if (this.green % headway) {
        context = 'extension';
      } else if (controller instanceof Learner) {
        const state = controller.state(this);
        const seen = controller.seen(state);
        const choice = controller.choose(this, state, learning);
        this.lastState = state;
        action = choice.action;
        context = choice.explore ? 'explore' : seen ? 'learned' : 'unseen';
      } else {
        action = Number(this.green >= controller[this.phase]);
      }

      if (action) this.clearance = yellowTime + redClearance;
      const clearance = this.clearance;
      if (clearance) {
        this.clearance--;
        if (this.clearance === 0) {
          this.phase = 1 - this.phase;
          this.green = 0;
        }
      } else {
        if (this.green >= startup && this.green % headway === 0) {
          for (let arm = this.phase * 2; arm < this.phase * 2 + 2; arm++) {
            if (this.q[arm] === 0) continue;
            const lane = this.motion?.[arm];
            if (lane) {
              lane.departed = true;
              lane.crossing.push({ id: this.heads[arm], time: this.time + 1, fresh: lane.entered === this.heads[arm] });
            }
            this.heads[arm]++;
            this.q[arm]--;
            this.crossed++;
          }
        }
        this.green++;
      }

      const nsWaiting = this.queue(0);
      const ewWaiting = this.queue(1);
      const waiting = mainOnly ? nsWaiting : nsWaiting + ewWaiting;
      if (learning && this.pending) {
        this.pending.reward -= this.pending.discount * waiting;
        this.pending.discount *= gamma;
      }
      this.time++;
      this.wait[0] += nsWaiting;
      this.wait[1] += ewWaiting;
      if (this.motion) this.lastTick = { nsBefore, ewBefore, phaseBefore, action, context, remaining, waiting, clearance };
    }
  }

  // All moving vehicles are small, reusable SVG sprites. Positions interpolate
  // between simulation ticks, and each queue uses FIFO order on its approach.
  const lanes = [
    { x: 198, y: 91, dx: 0, dy: 1, angle: 180, slots: 4, distance: 250, labelX: 242, labelY: 17, moreX: 198, moreY: 8 },
    { x: 242, y: 233, dx: 0, dy: -1, angle: 0, slots: 4, distance: 250, labelX: 198, labelY: 307, moreX: 242, moreY: 316 },
    { x: 296, y: 140, dx: -1, dy: 0, angle: -90, slots: 6, distance: 314, labelX: 423, labelY: 184, moreX: 428, moreY: 140 },
    { x: 144, y: 184, dx: 1, dy: 0, angle: 90, slots: 6, distance: 314, labelX: 17, labelY: 140, moreX: 12, moreY: 184 }
  ];
  const carColors = [['#8ed1eb', '#5eaed9', '#a1dcdf'], ['#f6be79', '#ed9575', '#f3d486']];
  const signalPositions = [[157, 91], [283, 233], [283, 91], [157, 233]];

  function createScene(map) {
    const signals = signalPositions.map(([x, y]) => `
      <g class="map-signal" transform="translate(${x} ${y})">
        <path d="M1 9v13" stroke="#364840" stroke-width="2"/><ellipse cx="1" cy="22" rx="4" ry="1.7" fill="#364840" opacity=".45"/>
        <rect x="-6" y="-11" width="14" height="31" rx="4" fill="#233435" opacity=".21"/>
        <rect x="-8" y="-13" width="14" height="31" rx="4" fill="#243539" stroke="#dde0cb" stroke-width="1"/>
        <circle class="lamp-red" cx="-1" cy="-6" r="3.2"/>
        <circle class="lamp-yellow" cx="-1" cy="2.5" r="3.2"/>
        <circle class="lamp-green" cx="-1" cy="11" r="3.2"/>
      </g>`).join('');
    const labels = lanes.map(({ labelX, labelY }) => `
      <g transform="translate(${labelX} ${labelY})"><rect x="-10" y="-9" width="20" height="18" rx="5" fill="#273538"/>
      <text class="map-label"></text></g>`).join('');
    const cars = lanes.map(({ slots }) => `<g class="map-cars">${'<use href="#city-car" visibility="hidden"/>'.repeat(slots + 4)}</g>`).join('');
    const overflow = lanes.map(({ moreX, moreY }) => `
      <g class="map-more" transform="translate(${moreX} ${moreY})" visibility="hidden">
        <rect x="-15" y="-7" width="30" height="14" rx="5" fill="#223638"/>
        <text class="map-overflow"></text>
      </g>`).join('');
    map.innerHTML = '<use href="#city-scene"/>' + cars + labels + signals + overflow;
    return {
      lights: [...map.querySelectorAll('.map-signal')],
      labels: [...map.querySelectorAll('.map-label')],
      cars: [...map.querySelectorAll('.map-cars')].map((layer) => [...layer.children]),
      overflow: [...map.querySelectorAll('.map-more')]
    };
  }

  function paintMap(view, sim, progress) {
    view.cars.forEach((sprites, arm) => {
      const lane = lanes[arm];
      const motion = sim.motion[arm];
      const slots = Math.min(lane.slots, sim.q[arm]);
      const ease = Math.min(1, progress / 0.86);
      let sprite = 0;

      function paintCar(id, distance, opacity = 1) {
        const car = sprites[sprite++];
        const x = lane.x + lane.dx * distance;
        const y = lane.y + lane.dy * distance;
        car.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${lane.angle})`);
        car.style.color = carColors[arm < 2 ? 0 : 1][(id + arm) % 3];
        car.setAttribute('opacity', opacity.toFixed(2));
        car.setAttribute('visibility', 'visible');
      }

      for (let slot = 0; slot < slots; slot++) {
        const id = sim.heads[arm] + slot;
        const target = -slot * 24;
        if (motion.entered === id) {
          const ingress = arm < 2 ? 106 : 158;
          paintCar(id, -ingress + (target + ingress) * ease);
        } else {
          paintCar(id, target - (motion.departed ? 24 * (1 - ease) : 0));
        }
      }
      for (const car of motion.crossing) {
        const elapsed = sim.time - car.time + progress;
        const distance = elapsed * 119 - (car.fresh ? 36 : 0);
        if (distance < lane.distance) paintCar(car.id, distance, car.fresh ? Math.min(1, elapsed * 6) : 1);
      }
      for (; sprite < sprites.length; sprite++) sprites[sprite].setAttribute('visibility', 'hidden');
    });
  }

  function text(id, value) {
    const el = byId(id);
    if (el.textContent !== value) el.textContent = value;
  }

  function updateMapStatus(view, sim, key) {
    const phase = sim.lastTick?.phaseBefore ?? sim.phase;
    const clearance = sim.lastTick?.clearance ?? 0;
    const allRed = clearance > 0 && clearance <= redClearance;
    const yellow = Math.max(0, clearance - redClearance);
    view.lights.forEach((light, arm) => {
      light.dataset.light = !allRed && (arm < 2 ? 0 : 1) === phase ? (yellow ? 'yellow' : 'go') : 'stop';
      const more = sim.q[arm] - lanes[arm].slots;
      const badge = view.overflow[arm];
      badge.setAttribute('visibility', more > 0 ? 'visible' : 'hidden');
      if (more > 0) {
        const label = '+' + more;
        badge.lastElementChild.textContent = label;
        const width = Math.max(26, label.length * 7 + 6);
        badge.firstElementChild.setAttribute('x', -width / 2);
        badge.firstElementChild.setAttribute('width', width);
      }
    });
    byId('dot-' + key).dataset.light = allRed ? 'stop' : yellow ? 'yellow' : 'go';
    text('signal-' + key, allRed ? t('All red · ', 'সবদিকে লাল · ') + seconds(clearance) : yellow
      ? t('Yellow on ', 'হলুদ বাতি · ') + road(phase) + ' · ' + seconds(yellow)
      : road(phase) + t(' has green', ' · সবুজ বাতি'));
    text('qns-' + key, localizedNumber(sim.queue(0)));
    text('qew-' + key, localizedNumber(sim.queue(1)));
    text('w-' + key, sim.time ? seconds(sim.averageWait(), 1) : '—');
    text('passed-' + key, localizedNumber(sim.crossed));
  }

  const views = { fixed: createScene(byId('map-fixed')), agent: createScene(byId('map-agent')) };
  let learner = new Learner();
  let fixed, agent, watchPlan;
  let history = [];
  let benchmarkRates = null;
  let latestEvaluation = null;
  let episodes = 0;
  let batch = null;
  let runFrame = 0;
  let running = false;
  let lastFrame = null;
  let fraction = 0;
  let snap = true;
  let burstCount = 0;
  let selectedState = null;
  let currentState = null;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const mainOnly = () => byId('reward-ns').checked;
  const liveLearning = () => byId('learn-live').checked;
  const currentRates = () => [Number(byId('ns').value) / 60, Number(byId('ew').value) / 60];

  function updateDecision() {
    const decision = agent.lastTick;
    const phase = decision ? decision.phaseBefore : agent.phase;
    const ns = decision ? decision.nsBefore : agent.queue(0);
    const ew = decision ? decision.ewBefore : agent.queue(1);

    text('observed-queues', `${roadShort(0)} ${localizedNumber(ns)} · ${roadShort(1)} ${localizedNumber(ew)}`);
    text('observed-phase', decision?.context === 'allRed' ? t('All red', 'সবদিকে লাল') : road(phase) + (decision?.context === 'yellow'
      ? t(' was on yellow', ' · হলুদ ছিল')
      : decision ? t(' had green', ' · সবুজ ছিল') : t(' has green', ' · সবুজ বাতি')));
    text('decision-time', decision ? t('At ', 'সময় ') + formatTime(agent.time) : t('Step or play to see a decision', 'সিদ্ধান্ত দেখতে এক ধাপ চালান বা শুরু করুন'));
    text('reward-value', decision ? (decision.waiting ? '−' + localizedNumber(decision.waiting) : '0') : '—');
    text('reward-context', mainOnly()
      ? t('−1 per car still waiting on N–S', 'উ–দে অপেক্ষমাণ গাড়িপ্রতি −১')
      : t('−1 per car still waiting', 'অপেক্ষমাণ গাড়িপ্রতি −১'));

    if (!decision) {
      text('action-value', '—');
      text('action-context', t('Keep the green or switch roads', 'সবুজ রাখুন অথবা অন্য রাস্তায় দিন'));
      return;
    }
    const safetyHold = ['minimum', 'yellow', 'allRed'].includes(decision.context);
    text('action-value', safetyHold ? t('Safety hold', 'নিরাপত্তার জন্য বিরতি')
      : decision.context === 'extension' ? t('Green extension', 'সবুজের বাড়তি সময়')
      : decision.action ? t('Switch roads', 'রাস্তা বদলাও') : t('Keep green', 'সবুজ রাখো'));
    const reason = {
      minimum: t('Minimum green · ', 'ন্যূনতম সবুজ · ') + seconds(decision.remaining),
      yellow: t('Yellow clearance · ', 'হলুদ বাতির সময় · ') + seconds(decision.remaining),
      allRed: t('All-red clearance · ', 'সবদিকে লাল বাতির সময় · ') + seconds(decision.remaining),
      extension: t('Keep commits to two seconds', 'সবুজ রাখলে দুই সেকেন্ড বাড়ে'),
      explore: t('Trying a random action', 'এলোমেলো পদক্ষেপ চেষ্টা করছে'),
      learned: t('Using the learned strategy', 'শেখা কৌশল ব্যবহার করছে'),
      unseen: t('New situation · defaults to keep', 'নতুন পরিস্থিতি · সবুজ রাখে')
    };
    text('action-context', reason[decision.context]);
  }

  function updateWatch() {
    const time = byId('sim-time');
    time.dateTime = 'PT' + fixed.time + 'S';
    text('sim-time', formatTime(fixed.time));
    text('fixed-plan', `${roadShort(0)} ${seconds(watchPlan[0])} · ${roadShort(1)} ${seconds(watchPlan[1])}`);
    updateMapStatus(views.fixed, fixed, 'fixed');
    updateMapStatus(views.agent, agent, 'agent');
    text('agent-mode', liveLearning() ? t('Learning during this run', 'এই সিমুলেশনেই শিখছে')
      : learner.updates ? t('Using its learned strategy', 'শেখা কৌশল ব্যবহার করছে')
        : t('Untrained · keeps the first green', 'অপ্রশিক্ষিত · প্রথম সবুজ রাখে'));
    updateDecision();
    updateLiveLearning();
    highlightCurrent();
  }

  function paintWatch() {
    const progress = snap || reducedMotion.matches ? 1 : fraction;
    paintMap(views.fixed, fixed, progress);
    paintMap(views.agent, agent, progress);
  }

  function resetWatch() {
    fixed = new Intersection(seed, true);
    agent = new Intersection(seed, true);
    watchPlan = fixedPlan(currentRates());
    fraction = 0;
    snap = true;
    burstCount = 0;
    text('burst-message', '');
    updateWatch();
    paintWatch();
  }

  function tickWatch() {
    const rates = currentRates();
    fixed.tick(rates, watchPlan);
    agent.tick(rates, learner, liveLearning(), mainOnly());
  }

  function animate(now) {
    if (lastFrame !== null) fraction += Math.min(0.1, (now - lastFrame) / 1000) * Number(byId('speed').value);
    lastFrame = now;
    if (fraction >= 1) {
      while (fraction >= 1) {
        tickWatch();
        fraction--;
      }
      snap = false;
      updateWatch();
      if (liveLearning()) renderPolicy();
    }
    paintWatch();
    runFrame = requestAnimationFrame(animate);
  }

  function updatePlayback() {
    byId('play-icon').setAttribute('href', running ? '#icon-pause' : '#icon-play');
    text('play-label', running ? t('Pause', 'বিরতি')
      : fixed.time ? t('Resume', 'আবার চালান') : t('Watch both', 'দুটোই দেখুন'));
  }

  function playOrPause(play) {
    if (play !== running) {
      running = play;
      if (running) {
        lastFrame = null;
        runFrame = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(runFrame);
      }
    }
    updatePlayback();
  }

  function burst(phase) {
    for (const sim of [fixed, agent]) {
      sim.addCars(phase * 2, burstCount % 2 ? 2 : 3);
      sim.addCars(phase * 2 + 1, burstCount % 2 ? 3 : 2);
    }
    burstCount++;
    text('burst-message', t('Added 5 cars to ', '৫টি গাড়ি যোগ হয়েছে · ') + roadShort(phase) + t(' in both views.', ' · দুটি মোড়েই।'));
    updateWatch();
    paintWatch();
  }

  function createPolicy() {
    const table = (phase) => `
      <table class="policy-table">
        <caption id="policy-phase-${phase}"></caption>
        <thead><tr><td></td>${ranges.map((range) => `<th scope="col">${range}</th>`).join('')}</tr></thead>
        <tbody>${ranges.map((range, row) => `
          <tr><th scope="row">${range}</th>${ranges.map((_, column) => `
            <td><button type="button" data-state="${phase * 25 + row * 5 + column}" class="unseen">·</button></td>`).join('')}</tr>`
        ).join('')}</tbody>
      </table>`;
    byId('policy').innerHTML = table(0) + table(1);
    return [...byId('policy').querySelectorAll('button')];
  }

  const policyCells = createPolicy();

  function describeState(state) {
    const green = ranges[Math.floor((state % 25) / 5)];
    const red = ranges[state % 5];
    return roadShort(Math.floor(state / 25)) + t(' green', ' সবুজ') + ' · ' +
      green + t(' on green', ' সবুজে') + ' · ' + red + t(' on red', ' লালে');
  }

  function describeAction(state) {
    return learner.seen(state) ? (learner.best(state) ? t('Switch', 'বদলাও') : t('Keep', 'রাখো'))
      : t('Unseen', 'দেখেনি');
  }

  function policyDetail() {
    if (selectedState === null) {
      text('policy-detail', t('Choose a cell to see its training visits and estimated rewards (Q values).',
        'প্রশিক্ষণে কতবার দেখা হয়েছে ও আনুমানিক পুরস্কার (Q মান) জানতে একটি ঘর বেছে নিন।'));
      return;
    }
    const state = selectedState;
    const prefix = describeState(state) + ' · ';
    if (!learner.seen(state)) {
      text('policy-detail', prefix + t('Unseen in training. The agent starts by keeping green.',
        'প্রশিক্ষণে দেখেনি। এজেন্ট শুরুতে সবুজ রাখে।'));
      return;
    }
    const estimate = (action) => {
      const i = state * 2 + action;
      return 'Q ' + learner.values[i].toFixed(1) + ' (' + localizedNumber(learner.visits[i]) + t(' tried)', ' বার চেষ্টা)');
    };
    text('policy-detail', prefix + t('Keep ', 'রাখো ') + estimate(0) + ' · ' + t('Switch ', 'বদলাও ') + estimate(1));
  }

  function updateLiveLearning() {
    const update = agent.lastUpdate;
    const epsilon = (learner.explorationRate() * 100).toFixed(1) + '%';
    text('learning-status', liveLearning()
      ? t('Live exploration · ', 'চলার সময় এলোমেলো পদক্ষেপ · ') + epsilon
      : t('Watch mode uses the best estimated action', 'দেখার মোডে সেরা আনুমানিক পদক্ষেপটি নেওয়া হয়'));
    if (liveLearning()) renderBenchmarkStatus();
    byId('last-q-update').hidden = !update;
    if (!update) return;
    const action = update.action ? t('Switch', 'বদলাও') : t('Keep', 'রাখো');
    text('last-q-update', t('Last live update · ', 'চলার সময় শেষ আপডেট · ') + describeState(update.state) + ' · ' +
      action + ' · Q ' + update.previous.toFixed(1) + ' → ' + update.next.toFixed(1) +
      t(' toward target ', ' লক্ষ্যের দিকে ') + update.target.toFixed(1));
  }

  function highlightCurrent() {
    if (currentState === agent.lastState) return;
    if (currentState !== null) policyCells[currentState].classList.remove('current');
    currentState = agent.lastState;
    if (currentState !== null) policyCells[currentState].classList.add('current');
  }

  function renderPolicy() {
    text('policy-phase-0', roadShort(0) + t(' green', ' সবুজ'));
    text('policy-phase-1', roadShort(1) + t(' green', ' সবুজ'));
    policyCells.forEach((cell, state) => {
      const kind = learner.seen(state) ? (learner.best(state) ? 'switch' : 'keep') : 'unseen';
      const symbol = { keep: 'K', switch: 'S', unseen: '·' }[kind];
      if (cell.textContent !== symbol) cell.textContent = symbol;
      cell.className = kind + (state === currentState ? ' current' : '') + (state === selectedState ? ' selected' : '');
      cell.setAttribute('aria-label', describeState(state) + ' · ' + describeAction(state));
      cell.setAttribute('aria-pressed', String(state === selectedState));
    });
    policyDetail();
  }

  function drawChart() {
    const chart = byId('curve');
    const agentValues = history.map((row) => row.agent.average);
    const fixedValues = history.map((row) => row.fixed.average);
    if (history.length) {
      LAB.lineChart(chart, [
        { values: fixedValues, color: 'var(--traffic-fixed)' },
        { values: agentValues, color: 'var(--traffic-green)' }
      ], {
        height: 164,
        ymin: 0,
        yfmt: (value) => seconds(value),
        xlabels: history.map((row) => localizedNumber(row.episodes))
      });
      const traces = chart.querySelectorAll('path');
      traces[0].setAttribute('stroke-dasharray', '5 4');
    } else {
      chart.innerHTML = [20, 47, 74, 101, 128].map((y) => `
        <path class="chart-gridline" d="M44 ${y}H508" stroke-dasharray="3 4"/>`).join('');
    }
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.id = 'curve-title';
    title.textContent = history.length
      ? t('Average accrued wait on held-out traffic runs after each training checkpoint. Solid line: agent. Dashed line: fixed timer.',
        'প্রশিক্ষণের প্রতিটি ধাপের পরে আলাদা পরীক্ষামূলক যানবাহনে গড় অপেক্ষা। টানা রেখা এজেন্টের, ভাঙা রেখা নির্দিষ্ট টাইমারের।')
      : t('Training chart awaiting results', 'প্রশিক্ষণের ফলের অপেক্ষায় লেখচিত্র');
    chart.prepend(title);
    byId('chart-empty').hidden = history.length > 0;
    byId('back-to-street').hidden = !latestEvaluation || batch !== null;
    text('episodes', batch
      ? `${localizedNumber(batch.done)} / ${batchSize} ${t('in this batch', 'এই দফায়')}`
      : t('Episodes trained · ', 'প্রশিক্ষিত পর্ব · ') + localizedNumber(episodes));
    const last = latestEvaluation;
    renderBenchmarkStatus();
    byId('evaluation-results').hidden = !last;
    if (!last) return;
    for (const key of ['agent', 'fixed']) {
      const result = last[key];
      text('test-wait-' + key, seconds(result.average, 1));
      text('test-ns-' + key, seconds(result.roadWait[0], 1));
      text('test-ew-' + key, seconds(result.roadWait[1], 1));
      text('test-cleared-' + key, (result.cleared * 100).toFixed(1) + '%');
    }
    text('test-wins', t('Agent had less wait in ', 'এজেন্টের অপেক্ষা কম ছিল ') +
      localizedNumber(last.lowerWait) + '/' + localizedNumber(testRuns) + t(' paired tests.', 'টি জোড়া পরীক্ষায়।'));
  }

  function sameRates(a, b) {
    return a && a[0] === b[0] && a[1] === b[1];
  }

  function renderBenchmarkStatus() {
    const last = latestEvaluation;
    if (!last) {
      text('test-conditions', '');
      return;
    }
    const [ns, ew] = benchmarkRates.map((rate) => localizedNumber(Math.round(rate * 60)));
    const conditions = t('Test traffic · ', 'পরীক্ষার যানবাহন · ') + roadShort(0) + ' ' + ns + ' · ' + roadShort(1) + ' ' + ew +
      t(' cars/min per approach', ' গাড়ি/মিনিট প্রতি প্রবেশপথে');
    const stale = !batch && (!sameRates(benchmarkRates, currentRates()) || last.updates !== learner.updates);
    text('test-conditions', conditions + (stale ? t(' · Evaluate to refresh', ' · হালনাগাদ করতে পরীক্ষা করুন') : ''));
  }

  function setTrainingControls(working) {
    for (const id of ['train', 'forget', 'evaluate', 'watch', 'step', 'restart', 'learn-live', 'reward-all', 'reward-ns', 'scenario', 'ns', 'ew']) {
      byId(id).disabled = working;
    }
    byId('train-progress').hidden = !working;
    byId('train-progress').setAttribute('aria-label', t('Episodes trained in this batch', 'এই দফায় প্রশিক্ষিত পর্ব'));
  }

  function trainEpisode(rates, onMainRoad) {
    const trial = new Intersection(100000 + 3 * episodes);
    for (let tick = 0; tick < episodeSeconds; tick++) trial.tick(rates, learner, true, onMainRoad);
    if (trial.pending) learner.update(trial.pending, null);
    episodes++;
  }

  function testPolicy(rates) {
    const plan = fixedPlan(rates);
    const arrivals = [0, 0];
    const stats = () => ({ wait: [0, 0], crossed: 0 });
    const agentStats = stats();
    const fixedStats = stats();
    let lowerWait = 0;
    for (let run = 0; run < testRuns; run++) {
      const heldOutSeed = 200000 + 3 * run;
      const testAgent = new Intersection(heldOutSeed);
      const testFixed = new Intersection(heldOutSeed);
      for (let tick = 0; tick < episodeSeconds; tick++) {
        testAgent.tick(rates, learner);
        testFixed.tick(rates, plan);
      }
      for (let phase = 0; phase < 2; phase++) {
        arrivals[phase] += testFixed.arrived[phase];
        agentStats.wait[phase] += testAgent.wait[phase];
        fixedStats.wait[phase] += testFixed.wait[phase];
      }
      agentStats.crossed += testAgent.crossed;
      fixedStats.crossed += testFixed.crossed;
      if (testAgent.averageWait() < testFixed.averageWait()) lowerWait++;
    }
    const total = arrivals[0] + arrivals[1];
    const report = ({ wait, crossed }) => ({
      average: (wait[0] + wait[1]) / total,
      cleared: crossed / total,
      roadWait: wait.map((delay, phase) => delay / arrivals[phase])
    });
    return { episodes, updates: learner.updates, agent: report(agentStats), fixed: report(fixedStats), lowerWait };
  }

  function evaluatePolicy(rates, checkpoint = false) {
    if (!sameRates(benchmarkRates, rates)) {
      history = [];
      benchmarkRates = rates;
      latestEvaluation = null;
    }
    if (!latestEvaluation || latestEvaluation.updates !== learner.updates) latestEvaluation = testPolicy(rates);
    if (checkpoint && history.at(-1)?.episodes !== episodes) {
      history.push(latestEvaluation);
      if (history.length > 60) history.shift();
    }
  }

  function trainFrame() {
    trainEpisode(batch.rates, batch.mainOnly);
    batch.done++;
    byId('train-progress').value = batch.done;
    if (batch.done % checkpointEvery === 0) evaluatePolicy(batch.rates, true);

    if (batch.done === batchSize) {
      batch = null;
      setTrainingControls(false);
      resetWatch();
      updatePlayback();
      drawChart();
      renderPolicy();
      return;
    }
    if (batch.done % checkpointEvery === 0) {
      drawChart();
      renderPolicy();
    }
    requestAnimationFrame(trainFrame);
  }

  function startTraining() {
    playOrPause(false);
    batch = { rates: currentRates(), mainOnly: mainOnly(), done: 0 };
    byId('train-progress').value = 0;
    setTrainingControls(true);
    evaluatePolicy(batch.rates, true);
    drawChart();
    requestAnimationFrame(trainFrame);
  }

  function forget() {
    playOrPause(false);
    learner = new Learner();
    episodes = 0;
    history = [];
    benchmarkRates = null;
    latestEvaluation = null;
    selectedState = null;
    resetWatch();
    updatePlayback();
    drawChart();
    renderPolicy();
    renderRewardHint();
  }

  function updateRates() {
    text('vns', byId('ns').value);
    text('vew', byId('ew').value);
    const [ns, ew] = [Number(byId('ns').value), Number(byId('ew').value)];
    byId('scenario').value = Object.keys(patterns).find((key) => patterns[key][0] === ns && patterns[key][1] === ew) || 'custom';
    if (fixed.time === 0) {
      watchPlan = fixedPlan(currentRates());
      updateWatch();
    }
    renderBenchmarkStatus();
  }

  function renderRewardHint() {
    text('reward-hint', mainOnly()
      ? t('Cars waiting on East–West cost the agent nothing. Changing the goal starts training from scratch.',
        'পূর্ব–পশ্চিমে গাড়ি অপেক্ষা করলে এজেন্টের পুরস্কার কমে না। লক্ষ্য বদলালে প্রশিক্ষণ নতুন করে শুরু হয়।')
      : t('Every car left waiting costs the agent one point per second. Changing the goal clears training.',
        'অপেক্ষমাণ প্রতিটি গাড়ির জন্য প্রতি সেকেন্ডে এজেন্টের এক পয়েন্ট কমে। লক্ষ্য বদলালে আগের প্রশিক্ষণ মুছে যায়।'));
  }

  function localize() {
    document.documentElement.lang = LAB.lang;
    document.title = t('A Traffic Light That Learns · AI Discovery Lab', 'যে ট্রাফিক বাতি শিখতে পারে · এআই ডিসকভারি ল্যাব');
    for (const option of byId('scenario').options) option.textContent = t(...patternNames[option.value]);
    const compass = LAB.lang === 'bn' ? ['উ', 'দ', 'পূ', 'প'] : ['N', 'S', 'E', 'W'];
    for (const view of Object.values(views)) view.labels.forEach((label, i) => { label.textContent = compass[i]; });
    byId('speed').setAttribute('aria-valuetext', byId('speed').value + t(' times', ' গুণ'));
    text('burst-message', '');
    renderRewardHint();
    updatePlayback();
    updateWatch();
    drawChart();
    renderPolicy();
    setTrainingControls(batch !== null);
  }

  byId('watch').onclick = () => playOrPause(!running);
  byId('step').onclick = () => {
    playOrPause(false);
    fraction = 0;
    snap = true;
    tickWatch();
    updateWatch();
    updatePlayback();
    if (liveLearning()) renderPolicy();
    paintWatch();
  };
  byId('restart').onclick = () => { resetWatch(); updatePlayback(); };
  byId('speed').oninput = () => {
    text('vspeed', byId('speed').value + '×');
    byId('speed').setAttribute('aria-valuetext', byId('speed').value + t(' times', ' গুণ'));
  };
  byId('ns').oninput = updateRates;
  byId('ew').oninput = updateRates;
  byId('scenario').onchange = (event) => {
    const pattern = patterns[event.target.value];
    if (!pattern) return;
    byId('ns').value = pattern[0];
    byId('ew').value = pattern[1];
    updateRates();
  };
  byId('burst-ns').onclick = () => burst(0);
  byId('burst-ew').onclick = () => burst(1);
  byId('train').onclick = startTraining;
  byId('evaluate').onclick = () => {
    evaluatePolicy(currentRates());
    drawChart();
  };
  byId('forget').onclick = forget;
  byId('reward-all').onchange = forget;
  byId('reward-ns').onchange = forget;
  byId('learn-live').onchange = () => { agent.pending = null; updateWatch(); };
  byId('policy').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    selectedState = Number(button.dataset.state);
    renderPolicy();
  });
  reducedMotion.addEventListener('change', paintWatch);

  resetWatch();
  updateRates();
  localize();
  LAB.onLang(localize);
})();
