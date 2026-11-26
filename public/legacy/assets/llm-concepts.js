/* AI Discovery Lab — Interactive visual & animated GPT/LLM concepts.
   Classic script (no modules) so it works offline from file:// and localhost. */
(function () {
  LAB.header({
    home: '../index.html',
    family: ['Language models · visual guide', 'ভাষা মডেল · ভিজ্যুয়াল গাইড']
  });

  var $ = function (id) { return document.getElementById(id); };
  var T = LAB.t;
  var esc = LAB.esc;

  function themeColors() {
    return {
      bg: LAB.css('--surface'),
      bg2: LAB.css('--surface-2'),
      text: LAB.css('--text'),
      muted: LAB.css('--muted'),
      border: LAB.css('--border'),
      accent: LAB.css('--accent'),
      accentSoft: LAB.css('--accent-soft'),
      accent2: LAB.css('--accent-2'),
      accent2Soft: LAB.css('--accent-2-soft'),
      cloud: LAB.css('--llm-cloud'),
      cloudSoft: LAB.css('--llm-cloud-soft'),
      self: LAB.css('--llm-self'),
      selfSoft: LAB.css('--llm-self-soft'),
      purple: LAB.css('--llm-purple'),
      purpleSoft: LAB.css('--llm-purple-soft'),
      yes: LAB.css('--yes'),
      yesSoft: LAB.css('--yes-soft'),
      ok: LAB.css('--ok')
    };
  }

  /* =========================================================================
     CHAPTER 1: WHAT IS A MODEL? (Weights, Quantization, Context Window)
     ========================================================================= */
  var MODELS = [
    { id: '1.5b', label: '1.5B', b: 1.5, layers: 28, cols: 4, rows: 5,
      en: 'Tiny · Quick sorting & simple tasks', bn: 'ক্ষুদ্র · দ্রুত বাছাই ও সহজ কাজ' },
    { id: '3b', label: '3B', b: 3, layers: 36, cols: 5, rows: 5,
      en: 'Small · Runs on normal office laptops', bn: 'ছোট · সাধারণ অফিস ল্যাপটপেই চলে' },
    { id: '8b', label: '8B', b: 8, layers: 32, cols: 6, rows: 6,
      en: 'Standard · Sweet spot for 1 GPU PC', bn: 'স্ট্যান্ডার্ড · ১টি GPU পিসির জন্য সেরা' },
    { id: '32b', label: '32B', b: 32, layers: 64, cols: 7, rows: 7,
      en: 'Strong · Great Bangla & policy drafting', bn: 'শক্তিশালী · চমৎকার বাংলা ও খসড়া লেখা' },
    { id: '70b', label: '70B', b: 70, layers: 80, cols: 8, rows: 8,
      en: 'Department · Needs multi-GPU server', bn: 'বিভাগীয় · একাধিক GPU সার্ভার লাগে' },
    { id: '405b', label: '405B+', b: 405, layers: 126, cols: 9, rows: 8,
      en: 'Frontier · Giant cloud GPU cluster', bn: 'ফ্রন্টিয়ার · বিশাল ক্লাউড GPU ক্লাস্টার' }
  ];

  var QUANTS = [
    { id: 'fp16', label: 'FP16 (16-bit)', bits: 16, bytesPerParam: 2.0, sample: '0.14285714',
      en: 'Full precision · Largest file, used in training', bn: 'পূর্ণ সূক্ষ্মতা · সবচেয়ে বড় ফাইল, প্রশিক্ষণে ব্যবহৃত' },
    { id: 'q8', label: 'Q8 (8-bit)', bits: 8, bytesPerParam: 1.05, sample: '0.143',
      en: 'Half the memory · Practically identical quality', bn: 'অর্ধেক মেমোরি · মান প্রায় একই থাকে' },
    { id: 'q4', label: 'Q4_K_M (4-bit)', bits: 4, bytesPerParam: 0.62, sample: '0.14',
      en: 'Popular self-hosted choice · ~70% smaller, ~97% quality', bn: 'জনপ্রিয় সেল্ফ-হোস্টেড পছন্দ · ~৭০% ছোট, ~৯৭% মান' }
  ];

  var curModel = MODELS[2]; // 8B default
  var curQuant = QUANTS[2]; // Q4 default
  var tokenPulse = { active: false, t: 0, picked: 0 };

  function renderModelControls() {
    $('model-size-btns').innerHTML = MODELS.map(function (m) {
      return '<button class="btn small' + (m.id === curModel.id ? ' on' : '') + '" data-m="' + m.id + '">' + m.label + '</button>';
    }).join('');
    $('model-size-btns').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        curModel = MODELS.find(function (x) { return x.id === b.dataset.m; });
        renderModelControls();
        renderModelStats();
        triggerTokenPulse();
      };
    });

    $('model-quant-btns').innerHTML = QUANTS.map(function (q) {
      return '<button class="btn small' + (q.id === curQuant.id ? ' on' : '') + '" data-q="' + q.id + '">' + q.label + '</button>';
    }).join('');
    $('model-quant-btns').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        curQuant = QUANTS.find(function (x) { return x.id === b.dataset.q; });
        renderModelControls();
        renderModelStats();
        triggerTokenPulse();
      };
    });
  }

  function hardwareAdvice(gb) {
    if (gb <= 4.5) {
      return {
        tier: T('Standard Office Laptop (8–16 GB RAM)', 'সাধারণ অফিস ল্যাপটপ (৮–১৬ GB RAM)'),
        pct: Math.min(100, (gb / 48) * 100 + 8),
        heavy: false,
        desc: T('Fits easily in normal laptop memory (CPU or integrated GPU). Fast enough for classification and short summaries.',
                'সাধারণ ল্যাপটপের মেমোরিতেই সহজে এঁটে যায়। অভিযোগ শ্রেণিবিন্যাস ও ছোট সারাংশের জন্য যথেষ্ট দ্রুত।')
      };
    }
    if (gb <= 10) {
      return {
        tier: T('Mid-Range GPU PC (12–16 GB VRAM)', 'মাঝারি মানের GPU পিসি (১২–১৬ GB VRAM)'),
        pct: Math.min(100, (gb / 48) * 100 + 12),
        heavy: false,
        desc: T('Runs smoothly at 30–60 words/sec on a single desktop GPU (e.g., RTX 4060 Ti 16GB or Mac with 16GB+ unified memory).',
                'একটি ডেস্কটপ GPU-তে (যেমন RTX 4060 Ti 16GB বা 16GB+ Mac) প্রতি সেকেন্ডে ৩০–৬০ শব্দ গতিতে মসৃণভাবে চলে।')
      };
    }
    if (gb <= 24) {
      return {
        tier: T('Single Pro GPU Workstation (24 GB VRAM)', '১টি প্রো GPU ওয়ার্কস্টেশন (২৪ GB VRAM)'),
        pct: Math.min(100, (gb / 48) * 100 + 14),
        heavy: false,
        desc: T('Great fit for a City Corporation workstation (e.g., RTX 3090 / 4090 / A5000 24GB). Serves a small team privately.',
                'সিটি কর্পোরেশনের একটি ওয়ার্কস্টেশনের (RTX 3090 / 4090 24GB) জন্য দারুণ। একটি ছোট দল নিরাপদে ব্যবহার করতে পারে।')
      };
    }
    if (gb <= 80) {
      return {
        tier: T('Department AI Server (1–2× 48–80 GB GPUs)', 'বিভাগীয় এআই সার্ভার (১–২টি ৪৮–৮০ GB GPU)'),
        pct: Math.min(100, (gb / 120) * 100 + 16),
        heavy: true,
        desc: T('Needs a dedicated rack server GPU (e.g., NVIDIA L40S, A100, or 2× 24GB GPUs). Serves dozens of officers concurrently.',
                'আলাদা র‍্যাক সার্ভার GPU (যেমন NVIDIA L40S, A100 বা ২টি ২৪GB GPU) লাগে। একসাথে অনেক কর্মকর্তা ব্যবহার করতে পারবেন।')
      };
    }
    return {
      tier: T('Data-Center GPU Cluster (4–8+ H100/B200 GPUs)', 'ডেটা সেন্টার GPU ক্লাস্টার (৪–৮+ H100/B200 GPU)'),
      pct: 100,
      heavy: true,
      desc: T('Too huge for a single computer! Only cloud providers or national data centres run models this size.',
              'একটি কম্পিউটারের জন্য অনেক বড়! কেবল ক্লাউড কোম্পানি বা জাতীয় ডেটা সেন্টার এই মাপের মডেল চালায়।')
    };
  }

  function renderModelStats() {
    var vram = curModel.b * curQuant.bytesPerParam * 1.15; // +15% KV cache & overhead
    var vramStr = vram < 10 ? vram.toFixed(1) + ' GB' : Math.round(vram) + ' GB';
    $('m-params').textContent = curModel.label;
    $('m-vram').textContent = '~' + vramStr;
    $('m-layers').textContent = curModel.layers;
    $('model-file-badge').textContent = 'civic-' + curModel.id + '-' + curQuant.id + '.gguf';

    var bitsHtml = '';
    for (var i = 0; i < 16; i++) {
      var on = i < curQuant.bits;
      bitsHtml += '<span class="qbit' + (on ? '' : ' off') + '">' + ((i * 7 + curQuant.bits) % 2) + '</span>';
    }
    $('quant-visual').innerHTML =
      '<div class="quant-title"><span>' + T('Storage per weight number', 'প্রতিটি ওয়েট সংখ্যার জায়গা') + '</span><span>' + curQuant.bits + ' bits</span></div>' +
      '<div class="quant-bits">' + bitsHtml + '</div>' +
      '<div class="quant-sample">' + T('Example weight:', 'উদাহরণ ওয়েট:') + ' <b>' + curQuant.sample + '</b> — ' + T(curQuant.en, curQuant.bn) + '</div>';

    var hw = hardwareAdvice(vram);
    $('model-hw-fit').innerHTML =
      '<div class="hw-fit-head"><strong>' + T('Recommended Hardware:', 'প্রয়োজনীয় হার্ডওয়্যার:') + '</strong><span class="pill ' + (hw.heavy ? 'warn' : 'ok') + '">' + hw.tier + '</span></div>' +
      '<div class="hw-gauge-track"><div class="hw-gauge-fill' + (hw.heavy ? ' heavy' : '') + '" style="width:' + hw.pct.toFixed(0) + '%"></div></div>' +
      '<div class="hw-fit-desc">' + hw.desc + '</div>';

    $('model-flow-caption').innerHTML =
      '<b>' + curModel.label + ' (' + curQuant.label + '):</b> ' + T(curModel.en, curModel.bn) + '. ' +
      T('Every single word generated passes through all ' + curModel.layers + ' layers of numbers!',
        'প্রতিটি নতুন শব্দ তৈরি করতে সিগন্যালকে সব ' + curModel.layers + 'টি স্তরের সংখ্যার ভেতর দিয়ে যেতে হয়!');
  }

  function triggerTokenPulse() {
    tokenPulse.active = true;
    tokenPulse.t = 0;
    tokenPulse.picked = (tokenPulse.picked + 1) % 3;
  }

  $('btn-pulse-token').onclick = triggerTokenPulse;

  /* Draw animated model canvas */
  var modelCanvas = $('model-canvas');
  var mctx = modelCanvas.getContext('2d');
  var modelAnimT = 0;

  function drawModelCanvas(ts) {
    var c = themeColors();
    var W = modelCanvas.width, H = modelCanvas.height;
    mctx.clearRect(0, 0, W, H);
    mctx.fillStyle = c.bg;
    mctx.fillRect(0, 0, W, H);

    if (tokenPulse.active) {
      tokenPulse.t += 0.015;
      if (tokenPulse.t >= 1.35) {
        tokenPulse.active = false;
        tokenPulse.t = 0;
      }
    }
    var p = tokenPulse.active ? Math.min(1, tokenPulse.t) : (0.5 + 0.5 * Math.sin(ts * 0.0012));

    // Column 1: Input Token
    var inX = 18, inY = 92, inW = 112, inH = 118;
    mctx.fillStyle = c.purpleSoft;
    mctx.strokeStyle = c.purple;
    mctx.lineWidth = 2;
    roundRect(mctx, inX, inY, inW, inH, 10, true, true);

    mctx.fillStyle = c.text;
    mctx.font = '700 13px sans-serif';
    mctx.textAlign = 'center';
    mctx.fillText(T('Input Token', 'ইনপুট টোকেন'), inX + inW / 2, inY + 24);
    mctx.fillStyle = c.purple;
    mctx.font = '800 16px sans-serif';
    mctx.fillText(T('"drain"', '"ড্রেন"'), inX + inW / 2, inY + 54);
    mctx.fillStyle = c.muted;
    mctx.font = '600 11px monospace';
    mctx.fillText('ID #4812', inX + inW / 2, inY + 76);
    mctx.fillText('[0.42, -0.81…]', inX + inW / 2, inY + 96);

    // Column 2: Stacked Weight Layers (Transformer Blocks)
    var numBlocks = Math.min(5, Math.max(3, Math.round(curModel.cols - 2)));
    var midStart = 166, midEnd = 434;
    var gap = 12;
    var blockW = (midEnd - midStart - gap * (numBlocks - 1)) / numBlocks;
    var blockH = 190, blockY = 58;

    // Header label
    mctx.fillStyle = c.muted;
    mctx.font = '700 12px sans-serif';
    mctx.textAlign = 'center';
    mctx.fillText(
      T('Frozen Model File (' + curModel.layers + ' Layers · ' + curModel.label + ' Weights)',
        'মডেল ফাইল (' + curModel.layers + ' লেয়ার · ' + curModel.label + ' ওয়েট)'),
      (midStart + midEnd) / 2, 34
    );

    // Dashed file container
    mctx.save();
    mctx.setLineDash([5, 4]);
    mctx.strokeStyle = c.border;
    mctx.lineWidth = 1.5;
    roundRect(mctx, midStart - 10, blockY - 12, (midEnd - midStart) + 20, blockH + 34, 12, false, true);
    mctx.restore();

    for (var b = 0; b < numBlocks; b++) {
      var bx = midStart + b * (blockW + gap);
      var stagePos = (b + 0.5) / numBlocks;
      var dist = Math.abs(p - stagePos);
      var lit = tokenPulse.active ? Math.max(0, 1 - dist * 4.2) : Math.max(0, 1 - dist * 3.5) * 0.45;

      mctx.fillStyle = lit > 0.25 ? c.accentSoft : c.bg2;
      mctx.strokeStyle = lit > 0.25 ? c.accent : c.border;
      mctx.lineWidth = lit > 0.25 ? 2 : 1;
      roundRect(mctx, bx, blockY, blockW, blockH, 8, true, true);

      // Weight cells inside each layer
      var rCount = curModel.rows;
      var cCount = 3;
      var pad = 6;
      var cw = (blockW - pad * 2 - (cCount - 1) * 3) / cCount;
      var ch = (blockH - pad * 2 - (rCount - 1) * 3) / rCount;
      for (var r = 0; r < rCount; r++) {
        for (var col = 0; col < cCount; col++) {
          var cx = bx + pad + col * (cw + 3);
          var cy = blockY + pad + r * (ch + 3);
          var wave = 0.25 + 0.75 * Math.abs(Math.sin((b * 3 + r * 2 + col) * 1.1 + ts * 0.002));
          var alpha = curQuant.bits === 16 ? (0.3 + lit * 0.7 * wave) : curQuant.bits === 8 ? (0.25 + lit * 0.65) : (0.2 + lit * 0.55);
          mctx.fillStyle = lit > 0.2 ? c.accent : c.muted;
          mctx.globalAlpha = Math.min(0.95, alpha);
          roundRect(mctx, cx, cy, cw, ch, 2, true, false);
        }
      }
      mctx.globalAlpha = 1;
      mctx.fillStyle = c.muted;
      mctx.font = '600 10px sans-serif';
      mctx.textAlign = 'center';
      mctx.fillText('L' + Math.round(((b + 1) / numBlocks) * curModel.layers), bx + blockW / 2, blockY + blockH + 14);
    }

    // Animated signal particle traveling across
    if (tokenPulse.active) {
      var sigX = inX + inW + (454 - (inX + inW)) * p;
      var sigY = 152 + Math.sin(p * Math.PI * 6) * 26;
      mctx.beginPath();
      mctx.arc(sigX, sigY, 9, 0, Math.PI * 2);
      mctx.fillStyle = c.accent2;
      mctx.globalAlpha = 0.28;
      mctx.fill();
      mctx.beginPath();
      mctx.arc(sigX, sigY, 4.5, 0, Math.PI * 2);
      mctx.globalAlpha = 1;
      mctx.fill();
    }

    // Arrows
    drawArrow(mctx, inX + inW + 4, 152, midStart - 13, 152, c.accent);
    drawArrow(mctx, midEnd + 13, 152, 464, 152, c.accent);

    // Column 3: Output Next-Token Probabilities
    var outX = 468, outY = 74, outW = 116, outH = 156;
    var outLit = tokenPulse.active && tokenPulse.t > 0.85;
    mctx.fillStyle = outLit ? c.accent2Soft : c.bg2;
    mctx.strokeStyle = outLit ? c.accent2 : c.border;
    mctx.lineWidth = outLit ? 2.2 : 1.2;
    roundRect(mctx, outX, outY, outW, outH, 10, true, true);

    mctx.fillStyle = c.text;
    mctx.font = '700 12px sans-serif';
    mctx.textAlign = 'center';
    mctx.fillText(T('Next Token', 'পরের টোকেন'), outX + outW / 2, outY + 22);

    var opts = LAB.lang === 'bn'
      ? [{ w: 'পরিষ্কার', p: 0.68 }, { w: 'বন্ধ', p: 0.21 }, { w: 'মেরামত', p: 0.11 }]
      : [{ w: 'cleaning', p: 0.68 }, { w: 'blocked', p: 0.21 }, { w: 'repair', p: 0.11 }];

    opts.forEach(function (o, idx) {
      var oy = outY + 42 + idx * 36;
      mctx.fillStyle = c.text;
      mctx.font = (idx === 0 ? '700' : '500') + ' 12px sans-serif';
      mctx.textAlign = 'left';
      mctx.fillText(o.w, outX + 10, oy);
      mctx.textAlign = 'right';
      mctx.fillStyle = c.muted;
      mctx.fillText(Math.round(o.p * 100) + '%', outX + outW - 10, oy);
      // Bar
      mctx.fillStyle = c.bg;
      roundRect(mctx, outX + 10, oy + 5, outW - 20, 8, 4, true, false);
      mctx.fillStyle = idx === 0 ? c.accent2 : c.accent;
      var animFill = tokenPulse.active ? Math.min(1, Math.max(0.15, (tokenPulse.t - 0.5) * 2)) : 1;
      roundRect(mctx, outX + 10, oy + 5, (outW - 20) * o.p * animFill, 8, 4, true, false);
    });

    // Bottom footer inside canvas
    mctx.fillStyle = c.muted;
    mctx.font = '600 11px sans-serif';
    mctx.textAlign = 'center';
    mctx.fillText(
      T('Math happens inside the engine · Weights never change during chat (Inference)',
        'চ্যাট করার সময় ওয়েট বদলায় না — কেবল সংখ্যা গুণ করে উত্তর বের হয় (ইনফারেন্স)'),
      W / 2, H - 14
    );

    modelAnimT = requestAnimationFrame(drawModelCanvas);
  }

  /* Context Window Desk */
  var ctxLimit = 8000;
  function renderContextDesk() {
    var used = +$('ctx-slider').value;
    var pages = Math.round(used / 600);
    $('ctx-used-lbl').textContent = used.toLocaleString() + ' ' + T('tokens (~' + pages + ' pages)', 'টোকেন (~' + pages + ' পৃষ্ঠা)');

    var sysTok = 1000;
    var docTok = Math.round((used - sysTok) * 0.65);
    var chatTok = Math.max(500, used - sysTok - docTok);
    var overflow = Math.max(0, used - ctxLimit);

    var html = '';
    if (overflow > 0) {
      var dropPct = Math.min(40, (overflow / used) * 100);
      html += '<div class="ctx-block dropped" style="flex:' + dropPct.toFixed(1) + ' 1 0">' +
        '<span>⚠️ ' + T('Dropped', 'মুছে গেছে') + '</span><small>' + overflow.toLocaleString() + ' ' + T('tok', 'টোকেন') + '</small></div>';
    }
    var fitScale = Math.min(1, ctxLimit / Math.max(used, ctxLimit));
    var sysW = (sysTok / ctxLimit) * 100;
    var docW = (Math.min(docTok, Math.max(0, ctxLimit - sysTok)) / ctxLimit) * 100;
    var chatW = (Math.min(chatTok, Math.max(0, ctxLimit - sysTok - docTok)) / ctxLimit) * 100;
    var freeW = Math.max(0, 100 - sysW - docW - chatW);

    html += '<div class="ctx-block sys" style="flex:' + Math.max(8, sysW * fitScale).toFixed(1) + ' 1 0">' +
      '<span>' + T('System Rules', 'নির্দেশনা') + '</span><small>1K</small></div>';
    if (docW > 1) {
      html += '<div class="ctx-block doc" style="flex:' + (docW * fitScale).toFixed(1) + ' 1 0">' +
        '<span>' + T('City Circulars / PDFs', 'সিটি সার্কুলার / PDF') + '</span><small>' + (docTok / 1000).toFixed(1) + 'K</small></div>';
    }
    if (chatW > 1) {
      html += '<div class="ctx-block chat" style="flex:' + (chatW * fitScale).toFixed(1) + ' 1 0">' +
        '<span>' + T('Chat History', 'চ্যাটের কথা') + '</span><small>' + (chatTok / 1000).toFixed(1) + 'K</small></div>';
    }
    if (freeW > 2 && overflow === 0) {
      html += '<div class="ctx-block free" style="flex:' + freeW.toFixed(1) + ' 1 0">' +
        '<span>' + T('Free Desk Space', 'খালি জায়গা') + '</span><small>' + ((ctxLimit - used) / 1000).toFixed(1) + 'K</small></div>';
    }
    $('ctx-desk').innerHTML = html;

    if (overflow > 0) {
      $('ctx-note').innerHTML = '🚨 ' + T(
        '<b>Desk overflowed by ' + overflow.toLocaleString() + ' tokens!</b> The oldest parts of your document or earlier rules fall off the desk — the model literally cannot see them anymore. Increase context size or use RAG search.',
        '<b>টেবিল ' + overflow.toLocaleString() + ' টোকেন উপচে পড়েছে!</b> আপনার ডকুমেন্ট বা আগের নির্দেশনার পুরোনো অংশ টেবিল থেকে পড়ে গেছে — মডেল সেগুলো আর দেখতেই পাচ্ছে না। বড় কনটেক্সট নিন বা RAG সার্চ ব্যবহার করুন।'
      );
    } else {
      $('ctx-note').innerHTML = '✅ ' + T(
        'Everything fits on the ' + (ctxLimit / 1000) + 'K working desk (' + Math.round((used / ctxLimit) * 100) + '% full). Note: bigger context also uses extra GPU VRAM (KV cache).',
        'সবকিছু ' + (ctxLimit / 1000) + 'K কাজের টেবিলে এঁটে গেছে (' + Math.round((used / ctxLimit) * 100) + '% পূর্ণ)। মনে রাখবেন: বড় কনটেক্সট বেশি GPU VRAM (KV cache) ব্যবহার করে।'
      );
    }
  }

  $('ctx-slider').oninput = renderContextDesk;
  document.querySelectorAll('[data-ctx]').forEach(function (b) {
    b.onclick = function () {
      ctxLimit = +b.dataset.ctx;
      document.querySelectorAll('[data-ctx]').forEach(function (x) { x.classList.toggle('on', x === b); });
      renderContextDesk();
    };
  });

  /* =========================================================================
     CHAPTER 2: CPU VS GPU & CUDA CORES LIVE RACE
     ========================================================================= */
  var TOTAL_CELLS = 160; // 16 cols x 10 rows
  var COLS = 16, ROWS = 10;
  var raceWorkload = 'ai'; // 'ai' or 'seq'
  var race = {
    running: false,
    cpuDone: 0,
    gpuDone: 0,
    cpuMs: 0,
    gpuMs: 0,
    cpuFinished: false,
    gpuFinished: false,
    activeCpu: [],
    activeGpu: [],
    lastTs: 0
  };

  var cpuCanvas = $('cpu-canvas'), cpuctx = cpuCanvas.getContext('2d');
  var gpuCanvas = $('gpu-canvas'), gpuctx = gpuCanvas.getContext('2d');

  function resetRace() {
    race.running = false;
    race.cpuDone = 0;
    race.gpuDone = 0;
    race.cpuMs = 0;
    race.gpuMs = 0;
    race.cpuFinished = false;
    race.gpuFinished = false;
    race.activeCpu = [];
    race.activeGpu = [];
    updateRaceUI();
    drawRaceCanvases();
    $('race-verdict').innerHTML = raceWorkload === 'ai'
      ? T('Press <b>Start Race</b> to watch 8 fast CPU cores race against thousands of parallel GPU CUDA cores multiplying neural network weights.',
          '<b>প্রতিযোগিতা শুরু করুন</b> চাপুন — দেখুন ৮টি দ্রুত CPU কোর বনাম হাজার হাজার সমান্তরাল GPU CUDA কোর কীভাবে নিউরাল নেটওয়ার্কের গুণ-যোগ করে।')
      : T('<b>Sequential mode selected:</b> Every step depends on the previous step (Step 2 must wait for Step 1). Press <b>Start Race</b> — who wins now?',
          '<b>ধারাবাহিক মোড নির্বাচিত:</b> প্রতিটি ধাপ আগের ধাপের ফলের ওপর নির্ভরশীল (ধাপ ২-কে ধাপ ১-এর জন্য অপেক্ষা করতে হবে)। <b>প্রতিযোগিতা শুরু করুন</b> — এবার কে জেতে?');
  }

  function updateRaceUI() {
    var cp = Math.min(100, Math.round((race.cpuDone / TOTAL_CELLS) * 100));
    var gp = Math.min(100, Math.round((race.gpuDone / TOTAL_CELLS) * 100));
    $('cpu-bar').style.width = cp + '%';
    $('gpu-bar').style.width = gp + '%';
    $('cpu-pct').textContent = cp + '%';
    $('gpu-pct').textContent = gp + '%';
    $('cpu-time').textContent = race.cpuMs.toFixed(1) + ' ms';
    $('gpu-time').textContent = race.gpuMs.toFixed(1) + ' ms';
  }

  function drawProcessorCanvas(ctx, canvas, isGpu) {
    var c = themeColors();
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, W, H);

    // Top bank: Cores
    ctx.fillStyle = c.muted;
    ctx.font = '700 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      isGpu ? T('GPU Chip: 64 visual CUDA Cores (real GPUs have 4,000–16,000+)', 'GPU চিপ: ৬৪টি CUDA কোর দেখানো হয়েছে (আসল GPU-তে ৪,০০০–১৬,০০০+)')
            : T('CPU Chip: 4 Large High-Speed Cores (each very smart)', 'CPU চিপ: ৪টি বড় অতি-দ্রুত কোর (প্রতিটি অত্যন্ত বুদ্ধিমান)'),
      14, 18
    );

    if (!isGpu) {
      // 4 big CPU cores
      var cw = 114, ch = 44, gap = 14;
      for (var i = 0; i < 4; i++) {
        var cx = 14 + i * (cw + gap), cy = 26;
        var busy = race.running && !race.cpuFinished && (raceWorkload === 'ai' || i === 0);
        ctx.fillStyle = busy ? c.accent2Soft : c.bg2;
        ctx.strokeStyle = busy ? c.accent2 : c.border;
        ctx.lineWidth = busy ? 2 : 1;
        roundRect(ctx, cx, cy, cw, ch, 8, true, true);
        ctx.fillStyle = busy ? c.accent2 : c.muted;
        ctx.font = '700 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Core ' + (i + 1), cx + cw / 2, cy + 20);
        ctx.font = '600 10px sans-serif';
        ctx.fillText(busy ? T('ACTIVE · 5.2 GHz', 'সক্রিয় · 5.2 GHz') : T('idle', 'অলস'), cx + cw / 2, cy + 35);
      }
    } else {
      // 64 tiny CUDA cores (16 x 4)
      var gCols = 16, gRows = 4;
      var boxW = (W - 28 - (gCols - 1) * 4) / gCols;
      var boxH = 9;
      for (var r = 0; r < gRows; r++) {
        for (var k = 0; k < gCols; k++) {
          var idx = r * gCols + k;
          var gx = 14 + k * (boxW + 4);
          var gy = 26 + r * (boxH + 3);
          var activeCore = false;
          if (race.running && !race.gpuFinished) {
            activeCore = raceWorkload === 'ai' ? true : (idx === 0);
          }
          ctx.fillStyle = activeCore ? c.accent : c.bg2;
          ctx.strokeStyle = activeCore ? c.accent : c.border;
          ctx.lineWidth = 0.8;
          roundRect(ctx, gx, gy, boxW, boxH, 2, true, true);
        }
      }
    }

    // Bottom grid: 160 Workload Operations
    var gridY = 88, gridH = H - gridY - 14;
    var cellW = (W - 28 - (COLS - 1) * 3) / COLS;
    var cellH = (gridH - (ROWS - 1) * 3) / ROWS;
    var doneCount = Math.floor(isGpu ? race.gpuDone : race.cpuDone);
    var activeSet = isGpu ? race.activeGpu : race.activeCpu;

    for (var n = 0; n < TOTAL_CELLS; n++) {
      var col = n % COLS, row = Math.floor(n / COLS);
      var x = 14 + col * (cellW + 3);
      var y = gridY + row * (cellH + 3);
      var isAct = activeSet.indexOf(n) >= 0;
      if (isAct) {
        ctx.fillStyle = isGpu ? c.accent : c.accent2;
      } else if (n < doneCount) {
        ctx.fillStyle = isGpu ? c.accentSoft : c.accent2Soft;
      } else {
        ctx.fillStyle = c.bg2;
      }
      roundRect(ctx, x, y, cellW, cellH, 3, true, false);
      if (isAct) {
        ctx.strokeStyle = c.text;
        ctx.lineWidth = 1;
        roundRect(ctx, x, y, cellW, cellH, 3, false, true);
      }
    }
  }

  function drawRaceCanvases() {
    drawProcessorCanvas(cpuctx, cpuCanvas, false);
    drawProcessorCanvas(gpuctx, gpuCanvas, true);
  }

  function renderRaceVerdict() {
    if (!race.cpuFinished || !race.gpuFinished) return;
    if (raceWorkload === 'ai') {
      var speedup = (race.cpuMs / Math.max(0.1, race.gpuMs)).toFixed(1);
      $('race-verdict').innerHTML = '🏆 ' + T(
        '<b>GPU + CUDA Cores win by ~' + speedup + '×!</b> Because every number in an AI layer can be multiplied independently, thousands of CUDA cores work in parallel at once. That is why GPUs power ChatGPT and local LLMs.',
        '<b>GPU ও CUDA কোর ~' + speedup + ' গুণ বেশি দ্রুত জিতেছে!</b> এআই-এর প্রতিটি স্তরের সংখ্যা আলাদাভাবে একসাথে গুণ করা যায়, তাই হাজার হাজার CUDA কোর একযোগে কাজ করে। এ কারণেই ChatGPT ও লোকাল LLM চালাতে GPU লাগে।'
      );
    } else {
      var cpuWin = (race.gpuMs / Math.max(0.1, race.cpuMs)).toFixed(1);
      $('race-verdict').innerHTML = '⚡ ' + T(
        '<b>CPU wins by ~' + cpuWin + '×!</b> When step 2 must wait for step 1, 99% of the GPU’s CUDA cores sit idle. GPUs do not replace CPUs — a real AI server needs a CPU to run the office software and a GPU to run the AI math.',
        '<b>এবার CPU ~' + cpuWin + ' গুণ দ্রুত জিতেছে!</b> ধাপ ২ যখন ধাপ ১-এর জন্য অপেক্ষা করে, তখন GPU-এর ৯৯% CUDA কোর বসে থাকে। তাই GPU কখনো CPU-এর বিকল্প নয় — একটি এআই সার্ভারে সাধারণ কাজের জন্য CPU এবং এআই গণনার জন্য GPU দুটোই লাগে।'
      );
    }
  }

  function stepRace(ts) {
    if (!race.running) return;
    if (!race.lastTs) race.lastTs = ts;
    var dt = Math.min(0.05, (ts - race.lastTs) / 1000);
    race.lastTs = ts;

    if (raceWorkload === 'ai') {
      // Parallel AI matrix math: GPU processes ~24x more ops per frame
      var cpuRate = 28;   // cells/sec (4 fast cores)
      var gpuRate = 290;  // cells/sec (parallel CUDA cores)
      if (!race.cpuFinished) {
        var prevC = Math.floor(race.cpuDone);
        race.cpuDone = Math.min(TOTAL_CELLS, race.cpuDone + cpuRate * dt);
        race.cpuMs += dt * 1000 * 0.42; // realistic simulated ms
        race.activeCpu = [];
        for (var i = prevC; i < Math.min(TOTAL_CELLS, prevC + 4); i++) race.activeCpu.push(i);
        if (race.cpuDone >= TOTAL_CELLS) { race.cpuFinished = true; race.activeCpu = []; }
      }
      if (!race.gpuFinished) {
        var prevG = Math.floor(race.gpuDone);
        race.gpuDone = Math.min(TOTAL_CELLS, race.gpuDone + gpuRate * dt);
        race.gpuMs += dt * 1000 * 0.14;
        race.activeGpu = [];
        for (var j = prevG; j < Math.min(TOTAL_CELLS, prevG + 32); j++) race.activeGpu.push(j);
        if (race.gpuDone >= TOTAL_CELLS) { race.gpuFinished = true; race.activeGpu = []; }
      }
    } else {
      // Sequential task: only 1 core can work at a time, CPU clock is much faster!
      var cpuSeqRate = 95;
      var gpuSeqRate = 32;
      if (!race.cpuFinished) {
        race.cpuDone = Math.min(TOTAL_CELLS, race.cpuDone + cpuSeqRate * dt);
        race.cpuMs += dt * 1000 * 0.12;
        race.activeCpu = [Math.min(TOTAL_CELLS - 1, Math.floor(race.cpuDone))];
        if (race.cpuDone >= TOTAL_CELLS) { race.cpuFinished = true; race.activeCpu = []; }
      }
      if (!race.gpuFinished) {
        race.gpuDone = Math.min(TOTAL_CELLS, race.gpuDone + gpuSeqRate * dt);
        race.gpuMs += dt * 1000 * 0.36;
        race.activeGpu = [Math.min(TOTAL_CELLS - 1, Math.floor(race.gpuDone))];
        if (race.gpuDone >= TOTAL_CELLS) { race.gpuFinished = true; race.activeGpu = []; }
      }
    }

    updateRaceUI();
    drawRaceCanvases();

    if (race.cpuFinished && race.gpuFinished) {
      race.running = false;
      renderRaceVerdict();
      return;
    }
    requestAnimationFrame(stepRace);
  }

  $('btn-race-start').onclick = function () {
    resetRace();
    race.running = true;
    race.lastTs = 0;
    requestAnimationFrame(stepRace);
  };
  $('btn-race-reset').onclick = resetRace;
  $('race-mode-btns').querySelectorAll('button').forEach(function (b) {
    b.onclick = function () {
      raceWorkload = b.dataset.workload;
      $('race-mode-btns').querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      resetRace();
    };
  });

  /* 4 GPU Hardware Anatomy Cards */
  var ANATOMY = [
    {
      id: 'cuda-cores', icon: '⚡',
      title: ['CUDA Cores', 'CUDA কোর'],
      sub: ['Parallel math workers', 'সমান্তরাল গণনাকারী'],
      body: [
        'Each CUDA core is a small arithmetic calculator inside an NVIDIA GPU. While a strong CPU has 8–16 cores, a single GPU like an RTX 4090 has <b>16,384 CUDA cores</b> working side by side — turning minutes of AI math into milliseconds.',
        'প্রতিটি CUDA কোর হলো NVIDIA GPU-এর ভেতরের একটি ছোট ক্যালকুলেটর। শক্তিশালী CPU-তে যেখানে ৮–১৬টি কোর থাকে, সেখানে RTX 4090-এর মতো একটি GPU-তেই <b>১৬,৩৮৪টি CUDA কোর</b> একসাথে কাজ করে — মিনিটের কাজ মিলিসেকেন্ডে নামিয়ে আনে।'
      ],
      metric: ['RTX 4090: 16,384 cores · H100: 14,592+', 'RTX 4090: ১৬,৩৮৪ কোর · H100: ১৪,৫৯২+']
    },
    {
      id: 'tensor-cores', icon: '🧮',
      title: ['Tensor Cores', 'টেনসর কোর'],
      sub: ['AI matrix turbochargers', 'এআই ম্যাট্রিক্স টার্বো'],
      body: [
        'Modern GPUs add specialized <b>Tensor Cores</b> alongside CUDA cores. Instead of multiplying two single numbers at a time, one Tensor Core multiplies entire <b>4×4 or 8×8 grids of numbers in one clock tick</b> — built specifically for deep learning and LLMs.',
        'আধুনিক GPU-তে CUDA কোরের পাশাপাশি বিশেষ <b>টেনসর কোর</b> থাকে। একবারে দুটি সংখ্যা গুণ করার বদলে একটি টেনসর কোর <b>এক মুহূর্তেই পুরো ৪×৪ বা ৮×৮ সংখ্যার টেবিল</b> গুণ করে ফেলে — বিশেষভাবে ডিপ লার্নিং ও LLM-এর জন্য তৈরি।'
      ],
      metric: ['Up to 8× faster than CUDA cores alone on FP16/FP8', 'FP16/FP8-এ শুধু CUDA কোরের চেয়ে ৮ গুণ পর্যন্ত দ্রুত']
    },
    {
      id: 'vram', icon: '🗄️',
      title: ['VRAM (GPU Memory)', 'VRAM (GPU মেমোরি)'],
      sub: ['The #1 bottleneck for LLMs', 'LLM-এর সবচেয়ে বড় সীমা'],
      body: [
        '<b>VRAM is the #1 number to check when buying an AI computer.</b> The entire model file must sit inside VRAM right next to the CUDA cores. VRAM moves data at <b>500–3,000 GB/s</b> (10× faster than normal laptop RAM). If a model spills out of VRAM, speed collapses.',
        '<b>এআই কম্পিউটার কেনার সময় সবচেয়ে আগে VRAM দেখুন।</b> পুরো মডেল ফাইলটিকে CUDA কোরের ঠিক পাশের VRAM-এ থাকতে হয়। VRAM-এর গতি <b>৫০০–৩,০০০ GB/সেকেন্ড</b> (সাধারণ RAM-এর ১০ গুণ)। মডেল VRAM-এ না আঁটলে গতি মারাত্মকভাবে কমে যায়।'
      ],
      metric: ['16 GB → 8B–14B · 24 GB → 32B · 80 GB → 70B', '১৬ GB → ৮B–১৪B · ২৪ GB → ৩২B · ৮০ GB → ৭০B']
    },
    {
      id: 'cuda-sw', icon: '🔌',
      title: ['CUDA Software Platform', 'CUDA সফটওয়্যার প্ল্যাটফর্ম'],
      sub: ['The bridge to AI apps', 'এআই অ্যাপের সেতু'],
      body: [
        'CUDA is not just hardware — it is NVIDIA’s software layer that lets AI tools (PyTorch, Ollama, vLLM, llama.cpp) send work directly to GPU cores. AMD (ROCm) and Apple Silicon (Metal) have alternatives, though CUDA remains the widest standard in servers.',
        'CUDA শুধু হার্ডওয়্যার নয় — এটি NVIDIA-র সফটওয়্যার প্ল্যাটফর্ম, যার মাধ্যমে PyTorch, Ollama বা vLLM সরাসরি GPU কোর ব্যবহার করে। AMD (ROCm) ও Apple Silicon (Metal)-এরও বিকল্প আছে, তবে সার্ভারে CUDA সবচেয়ে প্রচলিত।'
      ],
      metric: ['Used by PyTorch, vLLM, Ollama, llama.cpp', 'PyTorch, vLLM, Ollama, llama.cpp-এ ব্যবহৃত']
    }
  ];
  var curAnat = 'cuda-cores';

  function renderAnatomy() {
    $('gpu-anatomy-tabs').innerHTML = ANATOMY.map(function (a) {
      return '<button class="anat-btn' + (a.id === curAnat ? ' on' : '') + '" data-a="' + a.id + '">' +
        '<span class="anat-icon">' + a.icon + '</span>' +
        '<strong>' + T(a.title[0], a.title[1]) + '</strong>' +
        '<small>' + T(a.sub[0], a.sub[1]) + '</small></button>';
    }).join('');
    $('gpu-anatomy-tabs').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { curAnat = b.dataset.a; renderAnatomy(); };
    });
    var item = ANATOMY.find(function (x) { return x.id === curAnat; });
    $('gpu-anatomy-detail').innerHTML =
      '<div><h3 style="margin:0 0 6px">' + item.icon + ' ' + T(item.title[0], item.title[1]) + '</h3>' +
      '<p style="margin:0;font-size:.94rem">' + T(item.body[0], item.body[1]) + '</p></div>' +
      '<div class="anat-badge"><div class="muted" style="font-size:.75rem;font-weight:700">' + T('REAL-WORLD SCALE', 'বাস্তব মাপকাঠি') + '</div>' +
      '<div style="font-weight:700;margin-top:3px">' + T(item.metric[0], item.metric[1]) + '</div></div>';
  }

  /* =========================================================================
     CHAPTER 3: HOW GPT SERVICE WORKS VS SELF-HOSTED (Animated SVG Flow)
     ========================================================================= */
  var curArch = 'cloud'; // 'cloud' | 'self' | 'hybrid'
  var curPromptType = 'sensitive'; // 'sensitive' | 'public'
  var simTimer = null;

  var SIM_PROMPTS = [
    {
      id: 'sensitive',
      sensitive: true,
      label: ['🔒 Sensitive: Ward 14 complaints + citizen phones', '🔒 গোপনীয়: ১৪ নং ওয়ার্ডের অভিযোগ ও নাগরিকের ফোন নম্বর'],
      text: ['Summarize Ward 14 drainage complaints with citizen names & phone numbers.', '১৪ নং ওয়ার্ডের ড্রেনেজ অভিযোগগুলো নাগরিকের নাম ও ফোন নম্বরসহ সারাংশ করো।']
    },
    {
      id: 'public',
      sensitive: false,
      label: ['🌐 Public: Draft a dengue awareness notice', '🌐 সাধারণ: ডেঙ্গু সচেতনতা নোটিশের খসড়া'],
      text: ['Draft a short public Bangla notice for Friday dengue awareness drive.', 'শুক্রবার ডেঙ্গু সচেতনতা অভিযানের জন্য বাংলায় সংক্ষিপ্ত নোটিশ লেখো।']
    }
  ];

  function renderHostingPrompts() {
    $('sim-prompt-btns').innerHTML = SIM_PROMPTS.map(function (p) {
      return '<button class="btn small' + (p.id === curPromptType ? ' on' : '') + '" data-sp="' + p.id + '">' + T(p.label[0], p.label[1]) + '</button>';
    }).join('');
    $('sim-prompt-btns').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () {
        curPromptType = b.dataset.sp;
        renderHostingPrompts();
        drawArchSvg();
        renderArchIdleLog();
      };
    });
  }

  function svgBox(x, y, w, h, title, sub, fill, stroke, icon) {
    return '<g>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2"/>' +
      '<text x="' + (x + w / 2) + '" y="' + (y + 30) + '" text-anchor="middle" font-size="20">' + icon + '</text>' +
      '<text x="' + (x + w / 2) + '" y="' + (y + 54) + '" text-anchor="middle" class="arch-node-title">' + esc(title) + '</text>' +
      '<text x="' + (x + w / 2) + '" y="' + (y + 72) + '" text-anchor="middle" class="arch-node-sub">' + esc(sub) + '</text>' +
      '</g>';
  }

  function drawArchSvg() {
    var c = themeColors();
    var svg = $('arch-svg');
    var h = '';

    if (curArch === 'cloud') {
      // Zone 1: City Office
      h += '<rect x="18" y="22" width="210" height="286" rx="14" fill="' + c.selfSoft + '" fill-opacity="0.35" stroke="' + c.self + '" stroke-dasharray="6 4" stroke-width="1.8"/>';
      h += '<text x="32" y="44" class="arch-zone-label" fill="' + c.self + '">' + esc(T('City Corporation Office', 'সিটি কর্পোরেশন অফিস')) + '</text>';

      // Zone 2: Public Internet divider
      h += '<rect x="260" y="55" width="128" height="220" rx="12" fill="' + c.accent2Soft + '" fill-opacity="0.35" stroke="' + c.accent2 + '" stroke-dasharray="4 4" stroke-width="1.5"/>';
      h += '<text x="324" y="82" text-anchor="middle" class="arch-zone-label" fill="' + c.accent2 + '">' + esc(T('Public Internet', 'পাবলিক ইন্টারনেট')) + '</text>';
      h += '<text x="324" y="102" text-anchor="middle" class="arch-node-sub">' + esc(T('Data leaves office', 'তথ্য অফিসের বাইরে যায়')) + '</text>';
      h += '<text x="324" y="255" text-anchor="middle" class="arch-node-sub">' + esc(T('HTTPS / API Key', 'HTTPS / API কী')) + '</text>';

      // Zone 3: External Cloud Vendor
      h += '<rect x="420" y="22" width="482" height="286" rx="14" fill="' + c.cloudSoft + '" fill-opacity="0.45" stroke="' + c.cloud + '" stroke-width="2"/>';
      h += '<text x="436" y="44" class="arch-zone-label" fill="' + c.cloud + '">' + esc(T('Remote Cloud AI Provider (e.g., OpenAI / Google / Anthropic)', 'বিদেশি ক্লাউড এআই প্রোভাইডার (ChatGPT / Gemini / Claude)')) + '</text>';

      // Paths
      h += '<path id="path-req" class="arch-flow-line" d="M 206 146 L 444 146 M 620 146 L 672 146" stroke="' + c.cloud + '"/>';
      h += '<path id="path-res" class="arch-flow-line" d="M 672 192 L 620 192 M 444 192 L 206 192" stroke="' + c.accent2 + '"/>';

      // Nodes
      h += svgBox(42, 118, 164, 92, T('Officer Browser', 'কর্মকর্তার ব্রাউজার'), T('Types prompt & files', 'প্রম্পট ও ফাইল লেখেন'), c.bg, c.self, '💻');
      h += svgBox(444, 118, 176, 92, T('API Gateway & Auth', 'API গেটওয়ে ও বিলিং'), T('Checks key · meters tokens', 'চাবি যাচাই · টোকেন হিসাব'), c.bg, c.cloud, '🛂');
      h += svgBox(672, 92, 206, 144, T('Giant GPU Cluster', 'বিশাল GPU ক্লাস্টার'), T('Hundreds of H100s · Frontier LLM', 'শত শত H100 · ফ্রন্টিয়ার মডেল'), c.bg, c.cloud, '🖥️');
      h += '<text x="775" y="198" text-anchor="middle" class="arch-node-sub">' + esc(T('Batching + KV Cache', 'ব্যাচিং + KV ক্যাশ')) + '</text>';
      h += '<text x="775" y="216" text-anchor="middle" class="arch-node-sub">' + esc(T('Streams tokens back 1-by-1', 'একটি একটি করে টোকেন ফেরত পাঠায়')) + '</text>';

      // Packet circle
      h += '<circle id="sim-packet" cx="124" cy="146" r="10" fill="' + c.accent2 + '" opacity="0"/>';
    } else if (curArch === 'self') {
      // Big City Firewall Boundary
      h += '<rect x="18" y="20" width="710" height="290" rx="16" fill="' + c.selfSoft + '" fill-opacity="0.38" stroke="' + c.self + '" stroke-width="2.5"/>';
      h += '<text x="36" y="44" class="arch-zone-label" fill="' + c.self + '">🛡️ ' + esc(T('City Corporation Private Intranet / Firewall (100% Inside Building)', 'সিটি কর্পোরেশন প্রাইভেট নেটওয়ার্ক / ফায়ারওয়াল (১০০% অফিসের ভেতরে)')) + '</text>';

      // Disconnected public internet box on right
      h += '<rect x="752" y="88" width="150" height="154" rx="12" fill="' + c.bg2 + '" stroke="' + c.border + '" stroke-dasharray="5 5" stroke-width="1.5"/>';
      h += '<text x="827" y="138" text-anchor="middle" font-size="24">🚫🌐</text>';
      h += '<text x="827" y="168" text-anchor="middle" class="arch-node-title">' + esc(T('No Internet', 'ইন্টারনেট নেই')) + '</text>';
      h += '<text x="827" y="188" text-anchor="middle" class="arch-node-sub">' + esc(T('Citizen data never', 'নাগরিকের তথ্য কখনো')) + '</text>';
      h += '<text x="827" y="204" text-anchor="middle" class="arch-node-sub">' + esc(T('leaves this wall', 'বাইরে যায় না')) + '</text>';

      // Paths inside firewall
      h += '<path class="arch-flow-line" d="M 200 135 L 260 135 M 440 135 L 496 135 M 598 188 L 598 214" stroke="' + c.self + '"/>';
      h += '<path class="arch-flow-line" d="M 496 168 L 440 168 M 260 168 L 200 168" stroke="' + c.accent2 + '"/>';

      // Nodes
      h += svgBox(38, 102, 162, 92, T('HQ & Ward PCs', 'সদর ও ওয়ার্ড পিসি'), T('Internal LAN browser', 'অভ্যন্তরীণ LAN ব্রাউজার'), c.bg, c.self, '🏛️');
      h += svgBox(260, 102, 180, 92, T('Open WebUI Portal', 'Open WebUI পোর্টাল'), T('Local ChatGPT-like UI', 'নিজস্ব ChatGPT-র মতো UI'), c.bg, c.self, '💬');
      h += svgBox(496, 86, 206, 102, T('Ollama / vLLM + GPU', 'Ollama / vLLM + GPU'), T('Qwen / Gemma on City GPU', 'সিটি GPU-তে Qwen / Gemma'), c.bg, c.self, '⚡');
      h += svgBox(496, 214, 206, 78, T('City Docs (RAG DB)', 'সিটি ডকুমেন্ট (RAG)'), T('Acts, circulars, tax rules', 'আইন, সার্কুলার, কর বিধি'), c.bg, c.purple, '📚');

      h += '<circle id="sim-packet" cx="118" cy="135" r="10" fill="' + c.self + '" opacity="0"/>';
    } else {
      // Hybrid Architecture
      h += '<rect x="18" y="20" width="585" height="290" rx="16" fill="' + c.selfSoft + '" fill-opacity="0.32" stroke="' + c.self + '" stroke-width="2.2"/>';
      h += '<text x="36" y="44" class="arch-zone-label" fill="' + c.self + '">🛡️ ' + esc(T('City Corporation Internal Zone', 'সিটি কর্পোরেশন অভ্যন্তরীণ নেটওয়ার্ক')) + '</text>';

      h += '<rect x="635" y="20" width="268" height="142" rx="14" fill="' + c.cloudSoft + '" fill-opacity="0.4" stroke="' + c.cloud + '" stroke-width="2"/>';
      h += '<text x="650" y="43" class="arch-zone-label" fill="' + c.cloud + '">☁️ ' + esc(T('Cloud Frontier GPT', 'ক্লাউড ফ্রন্টিয়ার GPT')) + '</text>';

      // Flow lines
      h += '<path class="arch-flow-line" d="M 190 170 L 236 170" stroke="' + c.text + '"/>';
      h += '<path class="arch-flow-line" d="M 398 135 L 448 96 L 656 96" stroke="' + c.cloud + '"/>';
      h += '<path class="arch-flow-line" d="M 398 202 L 424 236 L 440 236" stroke="' + c.self + '"/>';

      // Nodes
      h += svgBox(36, 124, 154, 92, T('Officer PC', 'কর্মকর্তার পিসি'), T('Single unified portal', 'একই ইউনিফাইড পোর্টাল'), c.bg, c.self, '💻');
      h += svgBox(236, 124, 162, 92, T('Privacy Router', 'গোপনীয়তা রাউটার'), T('Checks PII / sensitivity', 'গোপন তথ্য যাচাই করে'), c.bg, c.purple, '🔀');
      h += svgBox(440, 192, 148, 96, T('Self-Hosted GPU', 'নিজস্ব GPU সার্ভার'), T('NID, tax, complaints', 'NID, কর ও অভিযোগ'), c.bg, c.self, '🏛️');
      h += svgBox(656, 62, 226, 84, T('Cloud GPT Service', 'ক্লাউড GPT সার্ভিস'), T('Public notices & research only', 'শুধু সাধারণ নোটিশ ও গবেষণা'), c.bg, c.cloud, '☁️');

      h += '<text x="530" y="84" text-anchor="middle" class="arch-node-sub" fill="' + c.cloud + '">' + esc(T('Public only →', 'শুধু সাধারণ →')) + '</text>';
      h += '<text x="378" y="250" text-anchor="middle" class="arch-node-sub" fill="' + c.self + '">' + esc(T('Private stays local ↓', 'গোপন তথ্য ভেতরে ↓')) + '</text>';

      h += '<circle id="sim-packet" cx="113" cy="170" r="10" fill="' + c.purple + '" opacity="0"/>';
    }

    svg.innerHTML = h;
  }

  function renderArchIdleLog() {
    var p = SIM_PROMPTS.find(function (x) { return x.id === curPromptType; });
    $('arch-log').innerHTML =
      '<div><b>' + T('Selected prompt:', 'নির্বাচিত প্রম্পট:') + '</b> "' + T(p.text[0], p.text[1]) + '"</div>' +
      '<div class="muted" style="margin-top:4px;font-size:.88rem">' +
      T('Click <b>Trace Request</b> above to watch the animated data packet travel step by step.',
        'ধাপে ধাপে ডেটা প্যাকেটের যাত্রা দেখতে উপরের <b>অনুরোধটি চালিয়ে দেখুন</b> বাটনে ক্লিক করুন।') + '</div>';
  }

  function runArchSimulation() {
    if (simTimer) { cancelAnimationFrame(simTimer); simTimer = null; }
    drawArchSvg();
    var p = SIM_PROMPTS.find(function (x) { return x.id === curPromptType; });
    var pkt = $('sim-packet');
    if (!pkt) return;

    // Define waypoints [x, y] for each architecture
    var waypoints;
    if (curArch === 'cloud') {
      waypoints = [[124, 146], [324, 146], [532, 146], [775, 146], [775, 192], [532, 192], [324, 192], [124, 192]];
    } else if (curArch === 'self') {
      waypoints = [[118, 135], [350, 135], [598, 135], [598, 250], [598, 135], [350, 168], [118, 168]];
    } else {
      waypoints = p.sensitive
        ? [[113, 170], [317, 170], [514, 240], [317, 170], [113, 170]]
        : [[113, 170], [317, 170], [520, 96], [769, 96], [520, 96], [317, 170], [113, 170]];
    }

    var stepsText;
    if (curArch === 'cloud') {
      stepsText = [
        [T('1. Leaves Office', '১. অফিস থেকে বের হলো'), T('Prompt encrypted & sent over public internet.', 'প্রম্পট পাবলিক ইন্টারনেট দিয়ে পাঠানো হলো।')],
        [T('2. API Gateway', '২. API গেটওয়ে'), T('Vendor checks API key & counts input tokens.', 'কোম্পানি API কী যাচাই ও টোকেন গণনা করে।')],
        [T('3. Cloud GPU Cluster', '৩. ক্লাউড GPU ক্লাস্টার'), T('Prefill + KV cache runs on shared H100 GPUs.', 'শেয়ার্ড H100 GPU-তে উত্তর হিসাব হয়।')],
        [T('4. Streamed Back', '৪. টোকেন ফেরত এলো'), T('Words stream back one by one · billed per token.', 'একটি করে শব্দ ফেরত আসে · প্রতি টোকেনে বিল।')]
      ];
    } else if (curArch === 'self') {
      stepsText = [
        [T('1. Internal LAN', '১. অফিস LAN-এ গেল'), T('Stays strictly inside City Hall network.', 'সম্পূর্ণ সিটি কর্পোরেশন নেটওয়ার্কের ভেতরে।')],
        [T('2. Local RAG Lookup', '২. লোকাল RAG সার্চ'), T('Searches local City Acts & circulars first.', 'নিজস্ব সিটি আইন ও সার্কুলার থেকে তথ্য খোঁজে।')],
        [T('3. Local GPU Runs', '৩. নিজস্ব GPU চলে'), T('Ollama/vLLM computes tokens on city GPU.', 'নিজস্ব GPU-তে Ollama/vLLM উত্তর তৈরি করে।')],
        [T('4. Zero Leak Reply', '৪. নিরাপদ উত্তর'), T('Tokens stream to officer · $0 per token.', 'কর্মকর্তার স্ক্রিনে উত্তর আসে · কোনো টোকেন বিল নেই।')]
      ];
    } else {
      stepsText = p.sensitive ? [
        [T('1. Privacy Check', '১. গোপনীয়তা যাচাই'), T('Router detects citizen names & phone numbers!', 'রাউটার নাগরিকের নাম ও ফোন নম্বর শনাক্ত করেছে!')],
        [T('2. Blocked from Cloud', '২. ক্লাউড ব্লকড'), T('Sensitive prompt kept inside City Firewall.', 'গোপনীয় তথ্য ফায়ারওয়ালের ভেতরে রাখা হলো।')],
        [T('3. Local GPU Runs', '৩. নিজস্ব GPU চলে'), T('Self-hosted Qwen/Gemma summarizes safely.', 'সেল্ফ-হোস্টেড মডেল নিরাপদে সারাংশ করে।')],
        [T('4. Compliant Reply', '৪. নিরাপদ উত্তর'), T('Citizen privacy 100% protected.', 'নাগরিকের গোপনীয়তা ১০০% সুরক্ষিত।')]
      ] : [
        [T('1. Privacy Check', '১. গোপনীয়তা যাচাই'), T('No personal data found — public notice.', 'কোনো ব্যক্তিগত তথ্য নেই — সাধারণ নোটিশ।')],
        [T('2. Routed to Cloud', '২. ক্লাউডে পাঠানো হলো'), T('Uses top frontier model for polished Bangla.', 'সুন্দর বাংলার জন্য সেরা ক্লাউড মডেল ব্যবহার করে।')],
        [T('3. Cloud GPU Runs', '৩. ক্লাউড GPU চলে'), T('Drafts clear civic awareness notice.', 'স্পষ্ট সচেতনতামূলক নোটিশের খসড়া তৈরি করে।')],
        [T('4. Officer Reviews', '৪. কর্মকর্তা যাচাই করেন'), T('Human officer edits before publishing.', 'প্রকাশের আগে কর্মকর্তা যাচাই ও সম্পাদনা করেন।')]
      ];
    }

    var privacyHtml = '';
    if (curArch === 'cloud' && p.sensitive) {
      privacyHtml = '<div class="privacy-alert danger">⚠️ ' + T(
        'Privacy Warning: Citizen names & phone numbers just left the City Corporation building and travelled to a third-party cloud server! For sensitive municipal data, use a Self-Hosted or Hybrid setup.',
        'গোপনীয়তা সতর্কতা: নাগরিকের নাম ও ফোন নম্বর সিটি কর্পোরেশন ভবনের বাইরে তৃতীয় পক্ষের ক্লাউড সার্ভারে চলে গেছে! সংবেদনশীল তথ্যের জন্য সেল্ফ-হোস্টেড বা হাইব্রিড ব্যবস্থা ব্যবহার করুন।'
      ) + '</div>';
    } else if (curArch === 'self') {
      privacyHtml = '<div class="privacy-alert safe">🛡️ ' + T(
        '100% Data Sovereignty: The prompt, city records, and answer never touched the public internet. Works even during an internet outage.',
        '১০০% ডেটা সার্বভৌমত্ব: প্রম্পট, সিটি রেকর্ড এবং উত্তর কখনোই পাবলিক ইন্টারনেটে যায়নি। ইন্টারনেট না থাকলেও এটি কাজ করে।'
      ) + '</div>';
    } else if (curArch === 'hybrid') {
      privacyHtml = '<div class="privacy-alert safe">✅ ' + (p.sensitive
        ? T('Smart Hybrid Protection: Sensitive citizen data stayed on the self-hosted City GPU automatically.',
            'স্মার্ট হাইব্রিড সুরক্ষা: সংবেদনশীল নাগরিক তথ্য স্বয়ংক্রিয়ভাবে নিজস্ব সিটি GPU-তে থেকেছে।')
        : T('Smart Hybrid Efficiency: Non-sensitive public notice safely used a frontier cloud model without exposing private records.',
            'স্মার্ট হাইব্রিড দক্ষতা: গোপন তথ্য না থাকায় সাধারণ নোটিশটি নিরাপদে ক্লাউড মডেল দিয়ে তৈরি হয়েছে।')) + '</div>';
    } else {
      privacyHtml = '<div class="privacy-alert safe">ℹ️ ' + T(
        'Public content only: Safe to draft on a Cloud GPT service because no private citizen records were included. Still review accuracy before publishing.',
        'শুধু সাধারণ বিষয়বস্তু: ব্যক্তিগত তথ্য না থাকায় ক্লাউড GPT-তে খসড়া করা নিরাপদ। তবুও প্রকাশের আগে তথ্য যাচাই করুন।'
      ) + '</div>';
    }

    $('arch-log').innerHTML =
      '<div><b>' + T('Tracing:', 'ট্রেস চলছে:') + '</b> "' + T(p.text[0], p.text[1]) + '"</div>' +
      '<div class="arch-steps" id="arch-steps-el">' +
      stepsText.map(function (s, idx) {
        return '<div class="arch-step" data-idx="' + idx + '"><b>' + s[0] + '</b><div>' + s[1] + '</div></div>';
      }).join('') + '</div><div id="arch-privacy-slot"></div>';

    var startTs = null;
    var duration = 3600;
    pkt.setAttribute('opacity', '1');
    pkt.setAttribute('fill', (curArch === 'cloud' && p.sensitive) ? themeColors().yes : themeColors().accent2);

    function animPacket(ts) {
      if (!startTs) startTs = ts;
      var u = Math.min(1, (ts - startTs) / duration);
      var segs = waypoints.length - 1;
      var pos = u * segs;
      var idx = Math.min(segs - 1, Math.floor(pos));
      var frac = pos - idx;
      var x = waypoints[idx][0] + (waypoints[idx + 1][0] - waypoints[idx][0]) * frac;
      var y = waypoints[idx][1] + (waypoints[idx + 1][1] - waypoints[idx][1]) * frac;
      pkt.setAttribute('cx', x.toFixed(1));
      pkt.setAttribute('cy', y.toFixed(1));

      var stepIdx = Math.min(3, Math.floor(u * 4));
      var stepEls = document.querySelectorAll('#arch-steps-el .arch-step');
      stepEls.forEach(function (el, i) {
        el.classList.toggle('active', i === stepIdx);
        el.classList.toggle('done', i < stepIdx || u >= 1);
      });

      if (u < 1) {
        simTimer = requestAnimationFrame(animPacket);
      } else {
        simTimer = null;
        var slot = $('arch-privacy-slot');
        if (slot) slot.innerHTML = privacyHtml;
      }
    }
    simTimer = requestAnimationFrame(animPacket);
  }

  $('hosting-mode-btns').querySelectorAll('button').forEach(function (b) {
    b.onclick = function () {
      curArch = b.dataset.arch;
      $('hosting-mode-btns').querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      if (simTimer) { cancelAnimationFrame(simTimer); simTimer = null; }
      drawArchSvg();
      renderArchIdleLog();
    };
  });
  $('btn-sim-send').onclick = runArchSimulation;

  function renderHostingCompare() {
    var rows = [
      [['Citizen Privacy & Sovereignty', 'নাগরিকের গোপনীয়তা ও ডেটা সুরক্ষা'],
       ['Data leaves office to vendor servers (check zero-retention enterprise terms).', 'তথ্য বাইরের সার্ভারে যায় (এন্টারপ্রাইজ শর্ত যাচাই করতে হয়)।'],
       ['100% stays inside City Hall / Gov data centre. Zero external leak.', '১০০% সিটি ভবন বা সরকারি ডেটা সেন্টারের ভেতরেই থাকে।']],
      [['Internet Dependency', 'ইন্টারনেট নির্ভরতা'],
       ['Requires reliable broadband internet at all times.', 'সবসময় নিরবচ্ছিন্ন ইন্টারনেট সংযোগ লাগে।'],
       ['Works completely offline on internal office LAN.', 'ইন্টারনেট ছাড়াই অফিসের অভ্যন্তরীণ LAN-এ চলে।']],
      [['Cost Model', 'খরচের ধরন'],
       ['Low upfront cost; ongoing monthly seats or per-token API bill.', 'শুরুতে কম খরচ; প্রতি মাসে সাবস্ক্রিপশন বা টোকেনপ্রতি বিল।'],
       ['Upfront GPU server purchase + electricity; $0 per query afterwards.', 'শুরুতে GPU সার্ভার ও বিদ্যুৎ খরচ; পরে প্রতি প্রশ্নে খরচ শূন্য।']],
      [['Quality & Bangla Fluency', 'মান ও বাংলা দক্ষতা'],
       ['Highest frontier intelligence out of the box.', 'শুরু থেকেই সর্বোচ্চ বুদ্ধিমত্তা ও নিখুঁত বাংলা।'],
       ['Very strong with 14B–70B open models (Qwen, Gemma), especially with RAG.', '১৪B–৭০B ওপেন মডেল (Qwen, Gemma) + RAG দিয়ে অত্যন্ত কার্যকর।']],
      [['IT Maintenance', 'আইটি রক্ষণাবেক্ষণ'],
       ['Managed entirely by cloud provider.', 'সম্পূর্ণ রক্ষণাবেক্ষণ ক্লাউড কোম্পানি করে।'],
       ['City IT team updates models, manages GPU cooling & backups.', 'সিটি আইটি টিমকে মডেল আপডেট, সার্ভার ও ব্যাকআপ দেখতে হয়।']]
    ];
    $('hosting-compare').innerHTML =
      '<tr><th>' + T('Factor', 'বিষয়') + '</th><th>☁️ ' + T('Cloud GPT Service', 'ক্লাউড GPT সার্ভিস') + '</th><th>🏛️ ' + T('Self-Hosted (Open Source)', 'সেল্ফ-হোস্টেড (ওপেন সোর্স)') + '</th></tr>' +
      rows.map(function (r) {
        return '<tr><td><b>' + T(r[0][0], r[0][1]) + '</b></td><td>' + T(r[1][0], r[1][1]) + '</td><td>' + T(r[2][0], r[2][1]) + '</td></tr>';
      }).join('');
  }

  /* =========================================================================
     CHAPTER 4: USEFUL OPEN-SOURCE MODELS FOR A CITY CORPORATION
     ========================================================================= */
  var CIVIC_CATS = [
    { id: 'all', en: 'All Models', bn: 'সব মডেল' },
    { id: 'chat', en: '💬 Bangla Chat & Drafting', bn: '💬 বাংলা চ্যাট ও খসড়া' },
    { id: 'vision', en: '👁️ Vision & Document OCR', bn: '👁️ ছবি ও ডকুমেন্ট OCR' },
    { id: 'rag', en: '🔍 Document Search (RAG)', bn: '🔍 ডকুমেন্ট সার্চ (RAG)' },
    { id: 'voice', en: '🎙️ Hotline Voice-to-Text', bn: '🎙️ হটলাইন ভয়েস-টু-টেক্সট' },
    { id: 'fast', en: '⚡ Small & Laptop-Ready', bn: '⚡ ছোট ও ল্যাপটপ-বান্ধব' }
  ];
  var curCivicCat = 'all';

  var CIVIC_MODELS = [
    {
      name: 'Qwen 2.5 / Qwen 3',
      maker: 'Alibaba · Apache 2.0',
      sizes: '7B · 14B · 32B',
      cats: ['chat', 'fast'],
      bangla: 92, vramLabel: '6–22 GB', vramPct: 55,
      desc: [
        'One of the strongest open-source families for Bangla + English drafting, complaint triage, and extracting clean tables/JSON from messy citizen messages.',
        'বাংলা ও ইংরেজি খসড়া লেখা, অভিযোগ বাছাই এবং অগোছালো নাগরিক বার্তা থেকে সুন্দর টেবিল/JSON তৈরিতে অন্যতম সেরা ওপেন-সোর্স মডেল।'
      ],
      uses: [
        ['Draft bilingual public notices & meeting minutes', 'বাংলা-ইংরেজি নোটিশ ও সভার কার্যবিবরণীর খসড়া'],
        ['Classify citizen complaints into wards & departments', 'নাগরিকের অভিযোগ ওয়ার্ড ও বিভাগে বণ্টন'],
        ['Answer holding-tax & trade-license FAQs with RAG', 'RAG দিয়ে হোল্ডিং কর ও ট্রেড লাইসেন্সের উত্তর']
      ]
    },
    {
      name: 'Gemma 3',
      maker: 'Google · Open Weights',
      sizes: '4B · 12B · 27B',
      cats: ['chat', 'vision', 'fast'],
      bangla: 90, vramLabel: '4–18 GB', vramPct: 45,
      desc: [
        'Strong multilingual & Bangla understanding plus built-in Vision! One single model can read both citizen text and uploaded photos or scanned forms.',
        'চমৎকার বহুভাষিক ও বাংলা বোঝার ক্ষমতার সাথে বিল্ট-ইন ভিশন! একটি মডেলেই নাগরিকের লেখা ও আপলোড করা ছবি/ফর্ম দুটোই পড়া যায়।'
      ],
      uses: [
        ['Read citizen photos of broken streetlights or waterlogging', 'ভাঙা সড়কবাতি বা জলাবদ্ধতার ছবি বিশ্লেষণ'],
        ['Summarize Bangla PDF circulars on a single GPU PC', 'একটি GPU পিসিতেই বাংলা PDF সার্কুলার সারাংশ'],
        ['Run 4B version offline on ward-office laptops', '৪বি সংস্করণ ওয়ার্ড অফিসের ল্যাপটপে অফলাইনে চালানো']
      ]
    },
    {
      name: 'Qwen2.5-VL (Vision-Language)',
      maker: 'Alibaba · Apache 2.0',
      sizes: '7B · 72B',
      cats: ['vision'],
      bangla: 86, vramLabel: '6–12 GB', vramPct: 40,
      desc: [
        'Specialized vision model that excels at OCR — turning photographed paper applications, tax receipts, and field inspection photos into structured digital records.',
        'বিশেষায়িত ভিশন ও OCR মডেল — ছবি তোলা কাগজের আবেদনপত্র, কর রসিদ ও মাঠ পরিদর্শনের ছবিকে ডিজিটাল ডেটায় রূপান্তর করে।'
      ],
      uses: [
        ['Digitize scanned trade licenses & birth-registration forms', 'স্ক্যান করা ট্রেড লাইসেন্স ও জন্মনিবন্ধন ফর্ম ডিজিটাইজ'],
        ['Verify waste-collection & road-repair field photos', 'বর্জ্য সংগ্রহ ও রাস্তা মেরামতের মাঠের ছবি যাচাই'],
        ['Extract data from printed Bangla/English tables', 'মুদ্রিত বাংলা/ইংরেজি টেবিল থেকে তথ্য বের করা']
      ]
    },
    {
      name: 'BGE-M3 (Multilingual Embeddings)',
      maker: 'BAAI · MIT License',
      sizes: '0.6B (~1.2 GB)',
      cats: ['rag', 'fast'],
      bangla: 94, vramLabel: '~1.2 GB', vramPct: 12,
      desc: [
        'Not a chatbot — a tiny, ultra-fast search brain! It converts City Corporation Acts, bylaws, and circulars (Bangla & English) into meaning-based vectors so your LLM cites real rules.',
        'এটি চ্যাটবট নয় — একটি ক্ষুদ্র ও অতি-দ্রুত সার্চ ইঞ্জিন! এটি সিটি আইন ও সার্কুলারকে ভেক্টরে রূপান্তর করে, যাতে LLM আসল ধারা উল্লেখ করে উত্তর দেয়।'
      ],
      uses: [
        ['Power a zero-hallucination City Rules & Circular search', 'ভুল তথ্যহীন সিটি আইন ও সার্কুলার সার্চ তৈরি'],
        ['Match Bangla citizen questions to English policy PDFs', 'বাংলা প্রশ্নের সাথে ইংরেজি নীতিমালার মিল খোঁজা'],
        ['Find duplicate citizen complaints across wards', 'বিভিন্ন ওয়ার্ডের একই ধরনের পুনরাবৃত্ত অভিযোগ শনাক্ত']
      ]
    },
    {
      name: 'Whisper Large-v3-Turbo',
      maker: 'OpenAI · MIT License',
      sizes: '0.8B (~3 GB)',
      cats: ['voice', 'fast'],
      bangla: 88, vramLabel: '~3 GB', vramPct: 20,
      desc: [
        'Open-source speech-to-text model that listens to Bangla and English voice recordings and converts them to accurate text completely offline.',
        'ওপেন-সোর্স স্পিচ-টু-টেক্সট মডেল, যা সম্পূর্ণ অফলাইনে বাংলা ও ইংরেজি ভয়েস রেকর্ড শুনে নির্ভুল লেখায় রূপান্তর করে।'
      ],
      uses: [
        ['Transcribe 333 / City Hotline voice complaints into tickets', 'সিটি হটলাইনের ভয়েস অভিযোগকে লিখিত টিকেটে রূপান্তর'],
        ['Auto-transcribe council & ward coordination meetings', 'কাউন্সিল ও ওয়ার্ড সমন্বয় সভার অডিও থেকে লেখা তৈরি'],
        ['Let citizens submit voice messages instead of typing', 'লেখার বদলে ভয়েস মেসেজে নাগরিক অভিযোগ গ্রহণ']
      ]
    },
    {
      name: 'Llama 3.1 / 3.3',
      maker: 'Meta · Llama Community License',
      sizes: '8B · 70B',
      cats: ['chat'],
      bangla: 76, vramLabel: '6–45 GB', vramPct: 72,
      desc: [
        'Widely supported open-weights model with huge tooling ecosystem. Great for English policy reports, coding internal dashboards, and reliable API tool-calling.',
        'ব্যাপকভাবে ব্যবহৃত ওপেন-ওয়েটস মডেল। ইংরেজি নীতিমালা বিশ্লেষণ, অভ্যন্তরীণ ড্যাশবোর্ড কোডিং এবং সফটওয়্যার টুল-কলিংয়ে অত্যন্ত দক্ষ।'
      ],
      uses: [
        ['Analyze English donor reports & tender specifications', 'ইংরেজি দাতা সংস্থার প্রতিবেদন ও টেন্ডার ডকুমেন্ট বিশ্লেষণ'],
        ['Generate SQL queries for internal MIS dashboards', 'অভ্যন্তরীণ MIS ডেটাবেসের জন্য SQL কোয়েরি লেখা'],
        ['Connect to ticketing APIs via structured tool calling', 'সফটওয়্যার API-এর মাধ্যমে স্বয়ংক্রিয় টিকেট তৈরি']
      ]
    },
    {
      name: 'DeepSeek-R1-Distill (Qwen-14B / 32B)',
      maker: 'DeepSeek · MIT License',
      sizes: '14B · 32B',
      cats: ['chat'],
      bangla: 84, vramLabel: '10–22 GB', vramPct: 58,
      desc: [
        'A step-by-step "thinking" model that shows its reasoning chain before answering — ideal for auditing numbers, budget checks, and comparing complex clauses.',
        'ধাপে ধাপে "চিন্তা করা" মডেল, যা উত্তর দেওয়ার আগে যুক্তির ধাপগুলো দেখায় — বাজেট হিসাব, অডিট ও জটিল শর্ত যাচাইয়ের জন্য দারুণ।'
      ],
      uses: [
        ['Cross-check ward budget spreadsheets & anomalies', 'ওয়ার্ড বাজেটের হিসাব ও অসঙ্গতি যাচাই'],
        ['Compare contractor bids against checklist criteria', 'ঠিকাদারদের দরপত্রের শর্তাবলি চেকলিস্টের সাথে মেলানো'],
        ['Transparent reasoning trail for officer review', 'কর্মকর্তার যাচাইয়ের জন্য স্পষ্ট যুক্তির ধাপ প্রদর্শন']
      ]
    },
    {
      name: 'Qwen 2.5 (3B) / Phi-4-mini',
      maker: 'Alibaba / Microsoft · Open',
      sizes: '3B–3.8B',
      cats: ['fast', 'chat'],
      bangla: 78, vramLabel: '2.5–3 GB', vramPct: 16,
      desc: [
        'Ultra-compact models designed to run right on ordinary office laptops without buying a GPU — fast for routing, tagging, and quick offline assistance.',
        'অতি-ছোট মডেল, যা আলাদা GPU ছাড়াই সাধারণ অফিস ল্যাপটপে চলে — দ্রুত অভিযোগ ট্যাগিং ও অফলাইন সহায়তার জন্য উপযোগী।'
      ],
      uses: [
        ['Offline complaint tagging at field / ward offices', 'ওয়ার্ড অফিসে অফলাইনে অভিযোগ ট্যাগ করা'],
        ['Quick grammar cleanup & Banglish-to-Bangla normalization', 'দ্রুত বানান ঠিক করা ও Banglish থেকে বাংলা রূপান্তর'],
        ['Zero-budget pilot demos (like Experiment 11!)', 'কোনো বাড়তি বাজেট ছাড়াই পাইলট পরীক্ষা (পরীক্ষা ১১-এর মতো!)']
      ]
    }
  ];

  function renderCivicModels() {
    $('civic-filter-btns').innerHTML = CIVIC_CATS.map(function (c) {
      return '<button class="btn small' + (c.id === curCivicCat ? ' on' : '') + '" data-cc="' + c.id + '">' + T(c.en, c.bn) + '</button>';
    }).join('');
    $('civic-filter-btns').querySelectorAll('button').forEach(function (b) {
      b.onclick = function () { curCivicCat = b.dataset.cc; renderCivicModels(); };
    });

    var list = CIVIC_MODELS.filter(function (m) {
      return curCivicCat === 'all' || m.cats.indexOf(curCivicCat) >= 0;
    });

    $('civic-model-grid').innerHTML = list.map(function (m) {
      return '<article class="model-card">' +
        '<div class="mc-head">' +
          '<div><h3 class="mc-title">' + esc(m.name) + '</h3><div class="mc-maker">' + esc(m.maker) + '</div></div>' +
          '<span class="pill ok">' + esc(m.sizes) + '</span>' +
        '</div>' +
        '<p class="mc-desc">' + T(m.desc[0], m.desc[1]) + '</p>' +
        '<div class="mc-meters">' +
          '<div class="mc-meter"><span>' + T('Bangla skill', 'বাংলা দক্ষতা') + '</span><div class="mc-track"><div class="mc-fill" style="width:' + m.bangla + '%"></div></div><span style="text-align:right;font-weight:700">' + m.bangla + '%</span></div>' +
          '<div class="mc-meter"><span>' + T('VRAM (Q4)', 'VRAM (Q4)') + '</span><div class="mc-track"><div class="mc-fill vram" style="width:' + m.vramPct + '%"></div></div><span style="text-align:right;font-weight:700">' + esc(m.vramLabel) + '</span></div>' +
        '</div>' +
        '<div class="mc-uses"><b>' + T('City Corporation uses:', 'সিটি কর্পোরেশনে ব্যবহার:') + '</b><ul>' +
          m.uses.map(function (u) { return '<li>' + T(u[0], u[1]) + '</li>'; }).join('') +
        '</ul></div>' +
      '</article>';
    }).join('');
  }

  /* Interactive City AI Stack Planner */
  var HW_OPTS = [
    { id: 'laptop', vram: 6, en: 'Standard Office Laptop (16 GB RAM, No dedicated GPU)', bn: 'সাধারণ অফিস ল্যাপটপ (১৬ GB RAM, আলাদা GPU নেই)' },
    { id: 'workstation', vram: 24, en: 'Single GPU Workstation (e.g., RTX 4090 / 3090 · 24 GB VRAM)', bn: '১টি GPU ওয়ার্কস্টেশন (যেমন RTX 4090 / 3090 · ২৪ GB VRAM)' },
    { id: 'server', vram: 96, en: 'Department AI Server (2× 48 GB L40S / A100 · 96 GB VRAM)', bn: 'বিভাগীয় এআই সার্ভার (২× ৪৮ GB GPU · ৯৬ GB VRAM)' },
    { id: 'hybrid', vram: 24, en: 'Hybrid (1 Local 24 GB GPU + Cloud API for public tasks)', bn: 'হাইব্রিড (১টি নিজস্ব ২৪ GB GPU + সাধারণ কাজের জন্য ক্লাউড API)' }
  ];

  var USE_OPTS = [
    { id: 'helpdesk', en: 'Bangla Citizen Helpdesk & City Circular Search (RAG)', bn: 'বাংলা নাগরিক সহায়তা ও সিটি সার্কুলার সার্চ (RAG)' },
    { id: 'complaints', en: 'Complaint Auto-Routing & Hotline Voice-to-Ticket', bn: 'অভিযোগ স্বয়ংক্রিয় বণ্টন ও হটলাইন ভয়েস-টু-টিকেট' },
    { id: 'ocr', en: 'Scanned Forms OCR & Field Photo Inspection', bn: 'স্ক্যান করা ফর্ম OCR ও মাঠের ছবি যাচাই' },
    { id: 'drafting', en: 'Internal Bilingual Notice Drafting & Budget/Policy Review', bn: 'বাংলা-ইংরেজি নোটিশ খসড়া ও বাজেট/নীতিমালা পর্যালোচনা' }
  ];

  function populatePlannerSelects() {
    var hwSel = $('plan-hw'), useSel = $('plan-use');
    var prevHw = hwSel.value || 'workstation';
    var prevUse = useSel.value || 'helpdesk';
    hwSel.innerHTML = HW_OPTS.map(function (h) { return '<option value="' + h.id + '">' + T(h.en, h.bn) + '</option>'; }).join('');
    useSel.innerHTML = USE_OPTS.map(function (u) { return '<option value="' + u.id + '">' + T(u.en, u.bn) + '</option>'; }).join('');
    hwSel.value = prevHw;
    useSel.value = prevUse;
  }

  function renderPlanner() {
    var hw = $('plan-hw').value || 'workstation';
    var use = $('plan-use').value || 'helpdesk';

    var ui = hw === 'server' ? 'Open WebUI + SSO Login' : 'Open WebUI (Local Browser)';
    var engine = hw === 'server' ? 'vLLM (High-Concurrency)' : 'Ollama (1-Click Setup)';
    var model = '', extra = '', vramNeed = 4, capacity = HW_OPTS.find(function (x) { return x.id === hw; }).vram;
    var tip = '';

    if (use === 'helpdesk') {
      model = hw === 'laptop' ? 'Qwen 2.5 3B (Q4)' : hw === 'server' ? 'Qwen 2.5 / 3 32B (Q4/Q8)' : 'Qwen 2.5 / 3 14B (Q4)';
      extra = 'BGE-M3 + Local Vector DB (City Acts PDFs)';
      vramNeed = hw === 'laptop' ? 3.5 : hw === 'server' ? 28 : 11.5;
      tip = T('Index official holding-tax rules, trade-license fee tables, and ward boundaries with BGE-M3 so every answer quotes the exact circular page.',
              'BGE-M3 দিয়ে হোল্ডিং কর বিধি, ট্রেড লাইসেন্স ফি তালিকা ও ওয়ার্ডের তথ্য যুক্ত করুন — যাতে প্রতিটি উত্তরে আসল সার্কুলারের সূত্র থাকে।');
    } else if (use === 'complaints') {
      model = hw === 'laptop' ? 'Qwen 2.5 3B + Whisper Small' : hw === 'server' ? 'Qwen 2.5 32B + Whisper Large-v3-Turbo' : 'Qwen 2.5 14B + Whisper Large-v3-Turbo';
      extra = 'FastAPI Webhook → Complaint Ticket DB';
      vramNeed = hw === 'laptop' ? 4.2 : hw === 'server' ? 26 : 14;
      tip = T('Whisper turns Bangla hotline audio into text; Qwen outputs strict JSON (Ward, Department, Urgency). Keep a human dispatcher checking low-confidence tickets!',
              'Whisper বাংলা হটলাইন অডিওকে লেখায় রূপান্তর করে; Qwen ওয়ার্ড, বিভাগ ও জরুরি মাত্রা নির্ধারণ করে। কম নিশ্চিত টিকেটগুলো অবশ্যই মানুষ যাচাই করবেন!');
    } else if (use === 'ocr') {
      model = hw === 'laptop' ? 'Gemma 3 4B Vision (Q4)' : hw === 'server' ? 'Qwen2.5-VL 7B + Gemma 3 27B Vision' : 'Qwen2.5-VL 7B or Gemma 3 12B Vision';
      extra = 'PDF-to-Image Scanner + Officer Verification UI';
      vramNeed = hw === 'laptop' ? 4.0 : hw === 'server' ? 28 : 11;
      tip = T('Show extracted fields side-by-side with the original scanned form so clerks verify NID numbers and amounts in 5 seconds instead of retyping everything.',
              'স্ক্যান করা মূল ফর্মের পাশে এআই-এর পড়া তথ্য দেখান — যাতে কর্মীরা সব টাইপ না করে মাত্র ৫ সেকেন্ডে NID ও টাকার অঙ্ক যাচাই করতে পারেন।');
    } else {
      model = hw === 'laptop' ? 'Gemma 3 4B (Q4)' : hw === 'server' ? 'Qwen 3 32B + DeepSeek-R1-Distill 32B' : hw === 'hybrid' ? 'Local Qwen 14B + Cloud Frontier API' : 'Gemma 3 12B + DeepSeek-R1-Distill 14B';
      extra = 'Approved Letter Templates + Audit Log';
      vramNeed = hw === 'laptop' ? 3.5 : hw === 'server' ? 44 : 13;
      tip = hw === 'hybrid'
        ? T('Keep citizen memos & internal budgets on Local Qwen 14B; route only public-facing speeches/notices to Cloud Frontier models for polished prose.',
            'নাগরিকের নথি ও অভ্যন্তরীণ বাজেট নিজস্ব Qwen 14B-তে রাখুন; কেবল জনসাধারণের নোটিশ বা ভাষণের খসড়ায় ক্লাউড মডেল ব্যবহার করুন।')
        : T('Store approved City Corporation memo templates so the model writes in your exact official tone and Bangla administrative style.',
            'সিটি কর্পোরেশনের অনুমোদিত চিঠির নমুনা যুক্ত রাখুন, যাতে মডেল আপনার অফিসের সঠিক দাপ্তরিক বাংলা শৈলীতে খসড়া তৈরি করে।');
    }

    var utilPct = Math.min(100, Math.round((vramNeed / capacity) * 100));
    var usersEst = hw === 'laptop' ? T('1 officer (pilot)', '১ জন কর্মকর্তা (পাইলট)')
                 : hw === 'server' ? T('25–80 concurrent officers', 'একসাথে ২৫–৮০ জন কর্মকর্তা')
                 : T('3–12 concurrent officers', 'একসাথে ৩–১২ জন কর্মকর্তা');

    $('planner-out').innerHTML =
      '<div class="viz-head" style="margin-bottom:6px">' +
        '<strong>' + T('Recommended Open-Source Civic Stack', 'প্রস্তাবিত ওপেন-সোর্স সিটি স্ট্যাক') + '</strong>' +
        '<span class="pill ok">👥 ' + usersEst + '</span>' +
      '</div>' +
      '<div class="stack-pipeline">' +
        '<div class="stack-box"><small>' + T('1. Officer Interface', '১. অফিস ইন্টারফেস') + '</small><strong>' + esc(ui) + '</strong><span>' + T('Familiar chat & file upload', 'পরিচিত চ্যাট ও ফাইল আপলোড') + '</span></div>' +
        '<div class="stack-arrow">→</div>' +
        '<div class="stack-box"><small>' + T('2. Serving Engine', '২. সার্ভার ইঞ্জিন') + '</small><strong>' + esc(engine) + '</strong><span>' + T('Runs models on GPU/CPU', 'GPU/CPU-তে মডেল চালায়') + '</span></div>' +
        '<div class="stack-arrow">→</div>' +
        '<div class="stack-box"><small>' + T('3. Open Model(s)', '৩. ওপেন মডেল') + '</small><strong>' + esc(model) + '</strong><span>' + T('Open weights, offline', 'ওপেন ওয়েট, অফলাইন') + '</span></div>' +
        '<div class="stack-arrow">→</div>' +
        '<div class="stack-box"><small>' + T('4. Civic Data Layer', '৪. সিটি ডেটা স্তর') + '</small><strong>' + esc(extra) + '</strong><span>' + T('Grounded in real rules', 'আসল বিধির ওপর ভিত্তি করে') + '</span></div>' +
      '</div>' +
      '<div class="hw-fit-head" style="font-size:.86rem"><span>' + T('Estimated Memory / VRAM Used:', 'আনুমানিক মেমোরি / VRAM ব্যবহার:') + ' <b>~' + vramNeed.toFixed(1) + ' GB / ' + capacity + ' GB</b></span><span>' + utilPct + '%</span></div>' +
      '<div class="hw-gauge-track"><div class="hw-gauge-fill' + (utilPct > 85 ? ' heavy' : '') + '" style="width:' + utilPct + '%"></div></div>' +
      '<p style="margin:10px 0 0;font-size:.9rem">💡 <b>' + T('Rollout tip:', 'বাস্তবায়ন পরামর্শ:') + '</b> ' + tip + '</p>';
  }

  $('plan-hw').onchange = renderPlanner;
  $('plan-use').onchange = renderPlanner;

  /* =========================================================================
     CANVAS HELPERS
     ========================================================================= */
  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function drawArrow(ctx, x1, y1, x2, y2, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    var ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 8 * Math.cos(ang - 0.45), y2 - 8 * Math.sin(ang - 0.45));
    ctx.lineTo(x2 - 8 * Math.cos(ang + 0.45), y2 - 8 * Math.sin(ang + 0.45));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* =========================================================================
     INIT & RE-RENDER ON LANGUAGE / THEME CHANGE
     ========================================================================= */
  function renderAllTextAndStatic() {
    renderModelControls();
    renderModelStats();
    renderContextDesk();
    renderAnatomy();
    renderHostingPrompts();
    drawArchSvg();
    renderArchIdleLog();
    renderHostingCompare();
    renderCivicModels();
    populatePlannerSelects();
    renderPlanner();
    drawRaceCanvases();
  }

  LAB.onLang(function () {
    renderAllTextAndStatic();
    if (!race.running && race.cpuDone === 0) resetRace();
    else if (race.cpuFinished && race.gpuFinished) renderRaceVerdict();
  });
  document.addEventListener('themechange', function () {
    drawArchSvg();
    drawRaceCanvases();
  });

  renderAllTextAndStatic();
  resetRace();
  triggerTokenPulse();
  modelAnimT = requestAnimationFrame(drawModelCanvas);
})();
