/* AI Discovery Lab — shared helpers. Classic script (no modules) so pages also work from file://. */
(function () {
  var LAB = (window.LAB = {});

  function load(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var root = document.documentElement;

  /*
   * Embed mode: the new lab shows this page on its stage, in an iframe, as
   *   experiment.html?embed=1&lang=bn&theme=dark
   * The shell supplies the top bar and the learning cycle, so the page hides its own. Language
   * and theme come from the URL at load and from postMessage afterwards, and are not saved, so
   * they never overwrite the choices made when the page is opened on its own.
   */
  var params = new URLSearchParams(location.search);
  LAB.embedded = params.get('embed') === '1';
  var LANGS = ['en', 'bn'];
  var THEMES = ['system', 'light', 'dark', 'projector'];

  /** Shell theme -> this page's attributes. Projector is the light theme with bigger text. */
  function applyTheme(t) {
    if (t === 'system') delete root.dataset.theme;
    else root.dataset.theme = t === 'projector' ? 'light' : t;
    if (t === 'projector') root.dataset.big = '1';
    else delete root.dataset.big;
  }

  if (LAB.embedded) {
    root.dataset.embed = '1';
    LAB.lang = LANGS.indexOf(params.get('lang')) >= 0 ? params.get('lang') : 'en';
    applyTheme(THEMES.indexOf(params.get('theme')) >= 0 ? params.get('theme') : 'system');
  } else {
    LAB.lang = load('lab-lang', 'en');
    var theme = load('lab-theme', '');
    if (theme) root.dataset.theme = theme;
    if (load('lab-big', '') === '1') root.dataset.big = '1';
  }
  root.dataset.lang = LAB.lang;

  /** Pick text for the current language. */
  LAB.t = function (en, bn) { return LAB.lang === 'bn' && bn != null ? bn : en; };
  /** Bilingual HTML snippet that switches with the toggle (no re-render needed). */
  LAB.bi = function (en, bn) { return '<span lang="en">' + en + '</span><span lang="bn">' + bn + '</span>'; };
  LAB.setLang = function (l) {
    LAB.lang = l; root.dataset.lang = l;
    if (!LAB.embedded) save('lab-lang', l);
    document.dispatchEvent(new Event('langchange'));
  };

  // Messages from the shell: {type: 'lab:prefs', lang, theme}. Only the parent window is listened
  // to, and only known values are applied. From file:// every origin is "null", so the origin
  // check applies to served pages only.
  if (LAB.embedded) {
    window.addEventListener('message', function (e) {
      if (e.source !== window.parent) return;
      if (location.protocol !== 'file:' && e.origin !== location.origin) return;
      var d = e.data;
      if (!d || d.type !== 'lab:prefs') return;
      if (LANGS.indexOf(d.lang) >= 0 && d.lang !== LAB.lang) LAB.setLang(d.lang);
      if (THEMES.indexOf(d.theme) >= 0) {
        var before = (root.dataset.theme || '') + '|' + (root.dataset.big || '');
        applyTheme(d.theme);
        if (before !== (root.dataset.theme || '') + '|' + (root.dataset.big || '')) {
          document.dispatchEvent(new Event('themechange'));
          document.dispatchEvent(new Event('labresize'));
        }
      }
    });
  }
  LAB.onLang = function (fn) { document.addEventListener('langchange', fn); };

  LAB.css = function (name) { return getComputedStyle(root).getPropertyValue(name).trim(); };

  /** Seeded random generator so every session shows the same "random" data. */
  LAB.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  LAB.gauss = function (r) {
    var u = 1 - r(), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  LAB.shuffle = function (arr, r) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  LAB.fmt = function (x, d) { return Number(x).toFixed(d == null ? 0 : d); };
  LAB.pct = function (x) { return Math.round(x * 100) + '%'; };
  LAB.sleep = function (ms) { return new Promise(function (res) { setTimeout(res, ms); }); };
  LAB.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  LAB.downloadCSV = function (name, rows) {
    var csv = rows.map(function (r) { return r.join(','); }).join('\n');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  };

  /** Horizontal probability bars. items: [{label, value}] with value in 0..1 */
  LAB.bars = function (el, items, opts) {
    opts = opts || {};
    var max = Math.max.apply(null, items.map(function (i) { return i.value; }).concat([1e-9]));
    el.classList.add('bars');
    el.innerHTML = items.map(function (it) {
      var w = opts.relative ? (it.value / max) * 100 : it.value * 100;
      return '<div class="bar' + (it.value === max && opts.highlightTop !== false ? ' top' : '') + '"><span>' + it.label +
        '</span><div class="track"><div class="fill" style="width:' + w.toFixed(1) + '%"></div></div><span class="pct">' +
        (opts.raw ? it.value : Math.round(it.value * 100) + '%') + '</span></div>';
    }).join('');
  };

  /** Simple SVG line chart. series: [{values:[...], color, label}] */
  LAB.lineChart = function (svg, series, opts) {
    opts = opts || {};
    var W = 520, H = opts.height || 220, P = { l: 44, r: 12, t: 12, b: 30 };
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.classList.add('chart');
    var n = Math.max.apply(null, series.map(function (s) { return s.values.length; }));
    var all = [].concat.apply([], series.map(function (s) { return s.values; }));
    var ymin = opts.ymin != null ? opts.ymin : Math.min.apply(null, all);
    var ymax = opts.ymax != null ? opts.ymax : Math.max.apply(null, all);
    if (!isFinite(ymin)) ymin = 0;
    if (!isFinite(ymax) || ymax <= ymin) ymax = ymin + 1;
    n = Math.max(n, 1);
    var xs = function (i) { return P.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - P.l - P.r)); };
    var ys = function (v) { return H - P.b - ((v - ymin) / (ymax - ymin)) * (H - P.t - P.b); };
    var h = '';
    for (var k = 0; k <= 4; k++) {
      var v = ymin + (k / 4) * (ymax - ymin), y = ys(v);
      h += '<line class="axis" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y + '" y2="' + y + '" stroke-dasharray="' + (k ? '3 4' : '') + '"/>';
      h += '<text x="' + (P.l - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + (opts.yfmt ? opts.yfmt(v) : (Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(2))) + '</text>';
    }
    var labels = opts.xlabels || [];
    var step = Math.max(1, Math.ceil(n / 10));
    for (var i = 0; i < n; i += step) {
      h += '<text x="' + xs(i) + '" y="' + (H - 10) + '" text-anchor="middle">' + (labels[i] != null ? labels[i] : i + 1) + '</text>';
    }
    series.forEach(function (s) {
      if (!s.values.length) return;
      var d = s.values.map(function (v, i) { return (i ? 'L' : 'M') + xs(i).toFixed(1) + ',' + ys(v).toFixed(1); }).join('');
      h += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.5" stroke-linejoin="round"/>';
      if (s.values.length < 30) s.values.forEach(function (v, i) { h += '<circle cx="' + xs(i) + '" cy="' + ys(v) + '" r="3.5" fill="' + s.color + '"/>'; });
    });
    svg.innerHTML = h;
  };

  /** Inject the top bar. opts: {home, family:[en,bn], synthetic:true} */
  LAB.header = function (opts) {
    opts = opts || {};
    var el = document.getElementById('lab-header');
    if (!el) return;
    if (LAB.embedded) { el.hidden = true; return; }
    el.className = 'topbar';
    el.innerHTML =
      '<a class="brand" href="' + (opts.home || 'index.html') + '"><span class="logo">AI</span>' +
      LAB.bi('AI Discovery Lab', 'এআই ডিসকভারি ল্যাব') + '</a>' +
      (opts.family ? '<span class="fam">' + LAB.bi(opts.family[0], opts.family[1]) + '</span>' : '') +
      (opts.synthetic ? '<span class="synthetic">' + LAB.bi('Synthetic teaching data', 'শিক্ষণের জন্য কৃত্রিম ডেটা') + '</span>' : '') +
      '<span class="spacer"></span>' +
      '<button class="btn small" id="lab-lang" title="Language / ভাষা">' + LAB.bi('বাংলা', 'English') + '</button>' +
      '<button class="btn small" id="lab-big" title="Bigger text for projector">A+</button>' +
      '<button class="btn small" id="lab-theme" title="Light / dark">◐</button>';
    document.getElementById('lab-lang').onclick = function () { LAB.setLang(LAB.lang === 'en' ? 'bn' : 'en'); };
    document.getElementById('lab-big').onclick = function () {
      var on = root.dataset.big === '1';
      if (on) delete root.dataset.big; else root.dataset.big = '1';
      save('lab-big', on ? '' : '1');
      document.dispatchEvent(new Event('labresize'));
    };
    document.getElementById('lab-theme').onclick = function () {
      var dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
      save('lab-theme', root.dataset.theme);
      document.dispatchEvent(new Event('themechange'));
    };
  };

  /** Learning-cycle strip. here = index of the emphasised step, or -1 */
  LAB.cycle = function (el) {
    var steps = [['Understand', 'বুঝি'], ['Explore data', 'ডেটা দেখি'], ['Train', 'শেখাই'], ['Evaluate', 'যাচাই'], ['Break it', 'ভেঙে দেখি'], ['Apply', 'প্রয়োগ']];
    el.className = 'cycle';
    if (LAB.embedded) { el.hidden = true; return; }
    el.innerHTML = steps.map(function (s, i) { return '<span>' + (i + 1) + '. ' + LAB.bi(s[0], s[1]) + '</span>'; }).join('');
  };
})();
