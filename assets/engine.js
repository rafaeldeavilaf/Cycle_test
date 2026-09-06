/* ============================================================
   SAMUEL QUEST — ENGINE.JS
   Subject-agnostic game engine. Reads window.QUIZ_DATA.
   Never edit this file to add a subject; only add a data file.
   ============================================================ */
(function () {
  'use strict';

  var DATA = window.QUIZ_DATA;
  if (!DATA) { document.body.innerHTML = '<p style="padding:40px">Missing QUIZ_DATA.</p>'; return; }

  var SAVE_KEY = 'samuel-quest:' + DATA.meta.slug;
  var KEYS = ['A', 'B', 'C', 'D', 'E'];

  /* ---------- SAVE STATE ---------- */
  function blankSave() {
    return { levels: {}, totalXP: 0, sound: true, music: true, version: 2 };
  }
  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return blankSave();
      var s = JSON.parse(raw);
      if (!s || typeof s !== 'object' || !s.levels) return blankSave();
      if (typeof s.music !== 'boolean') s.music = true;   // saves anteriores
      if (typeof s.sound !== 'boolean') s.sound = true;
      return s;
    } catch (e) { return blankSave(); }
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(STATE)); } catch (e) { /* private mode */ }
  }
  var STATE = load();

  /* ---------- AUDIO (no assets, pure WebAudio) ---------- */
  var actx = null;
  function beep(freq, dur, type, vol) {
    if (!STATE.sound) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, actx.currentTime);
      g.gain.setValueAtTime(vol == null ? 0.06 : vol, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + dur);
    } catch (e) { /* audio unavailable */ }
  }
  var SFX = {
    right:  function () { beep(660, .08); setTimeout(function () { beep(990, .12); }, 80); },
    wrong:  function () { beep(200, .18, 'sawtooth', .05); },
    click:  function () { beep(440, .04, 'square', .03); },
    level:  function () { [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { beep(f, .16); }, i * 110); }); },
    unlock: function () { [392, 523, 659].forEach(function (f, i) { setTimeout(function () { beep(f, .12); }, i * 90); }); }
  };

  /* ---------- MUSICA CHIPTUNE ----------
     Secuenciador de 8 compases generado con osciladores. Cero archivos,
     cero peso, cero licencias. Lead cuadrada + bajo triangular + bateria.
     Progresion I-V-vi-IV en Do mayor, 126 BPM.
  --------------------------------------- */
  var MUSIC = (function () {
    var mctx = null, bus = null, noise = null;
    var timer = null, step = 0, nextT = 0, on = false;
    var BPM = 126, EIGHTH = 30 / BPM;   // segundos por corchea

    // 0 = silencio. Notas MIDI.
    var LEAD_A = [
      64,67,72,67, 64,67,72,74,      // C
      74,71,67,71, 74,71,67,69,      // G
      72,69,64,69, 72,69,64,65,      // Am
      69,65,60,65, 69,72,67, 0       // F
    ];
    var LEAD_B = [
      72,76,79,76, 72,76,79,81,      // C (octava alta)
      79,74,71,74, 79,74,71,72,      // G
      76,72,69,72, 76,81,79,76,      // Am
      72,69,65,69, 72,76,72, 0       // F
    ];

    var BASS  = [48,0,55,0, 48,0,55,0,  43,0,50,0, 43,0,50,0,
                 45,0,52,0, 45,0,52,0,  41,0,48,0, 41,0,48,0];
    var KICK  = [1,0,0,0, 1,0,0,0];      // por compas
    var HAT   = [0,1,0,1, 0,1,0,1];

    function f(m) { return 440 * Math.pow(2, (m - 69) / 12); }

    function noiseBuf() {
      if (noise) return noise;
      var len = Math.floor(mctx.sampleRate * 0.2);
      noise = mctx.createBuffer(1, len, mctx.sampleRate);
      var d = noise.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return noise;
    }

    function tone(freq, t, dur, type, vol) {
      var o = mctx.createOscillator(), g = mctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(bus);
      o.start(t); o.stop(t + dur + 0.02);
    }

    function kick(t) {
      var o = mctx.createOscillator(), g = mctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(130, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.11);
      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); g.connect(bus);
      o.start(t); o.stop(t + 0.18);
    }

    function hat(t) {
      var s = mctx.createBufferSource(), g = mctx.createGain(), hp = mctx.createBiquadFilter();
      s.buffer = noiseBuf();
      hp.type = 'highpass'; hp.frequency.value = 7000;
      g.gain.setValueAtTime(0.035, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      s.connect(hp); hp.connect(g); g.connect(bus);
      s.start(t); s.stop(t + 0.05);
    }

    function playStep(i, t) {
      var n = i % 32;                       // 32 corcheas = 4 compases
      var loop = Math.floor(i / 32) % 2;    // alterna frase A / B
      var lead = (loop === 0 ? LEAD_A : LEAD_B)[n];
      if (lead) tone(f(lead), t, EIGHTH * 0.85, 'square', 0.045);
      if (BASS[n]) tone(f(BASS[n]), t, EIGHTH * 1.6, 'triangle', 0.075);
      var b = n % 8;
      if (KICK[b]) kick(t);
      if (HAT[b])  hat(t);
    }

    function scheduler() {
      if (!on || !mctx) return;
      while (nextT < mctx.currentTime + 0.2) {
        playStep(step, nextT);
        nextT += EIGHTH;
        step++;
      }
    }

    var LEVEL = 0.5;
    function setGain(v, tau) {
      if (bus && mctx) bus.gain.setTargetAtTime(v, mctx.currentTime, tau || 0.06);
    }

    var api = {
      start: function () {
        if (on) return;
        try {
          if (!mctx) {
            mctx = new (window.AudioContext || window.webkitAudioContext)();
            bus = mctx.createGain();
            bus.gain.value = LEVEL;
            bus.connect(mctx.destination);
          }
          if (mctx.state === 'suspended') mctx.resume();
          on = true;
          setGain(LEVEL);
          nextT = mctx.currentTime + 0.08;
          scheduler();
          timer = setInterval(scheduler, 45);
        } catch (e) { on = false; }
      },
      stop: function () {
        on = false;
        if (timer) { clearInterval(timer); timer = null; }
        setGain(0, 0.04);
      },
      // Baja el volumen un momento para que se oiga un efecto de sonido.
      duck: function (ms) {
        if (!on) return;
        setGain(0.12, 0.04);
        setTimeout(function () { if (on) setGain(LEVEL, 0.08); }, ms || 1500);
      },
      isOn: function () { return on; }
    };
    return api;
  })();

  /* ---------- UTIL ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function el(id) { return document.getElementById(id); }

  function levelSave(id) {
    if (!STATE.levels[id]) STATE.levels[id] = { done: false, stars: 0, best: 0, plays: 0 };
    return STATE.levels[id];
  }
  function isUnlocked(idx) {
    if (idx === 0) return true;
    var prev = DATA.levels[idx - 1];
    return !!levelSave(prev.id).done;
  }

  /* ---------- SPRITE (inline pixel-art Samuel) ----------
     Moods: 'idle' | 'happy' (celebra) | 'sad' (derrotado)
     Cada mood cambia ojos, boca y BRAZOS. Nada de archivos de imagen.
  -------------------------------------------------------- */
  function samuelSVG(mood) {
    var eyes, brow = '', mouth, arms, extra = '';

    if (mood === 'happy') {
      // ojos cerrados en arco ^ ^
      eyes  = 'M5 7h1v1H5z M6 6h1v1H6z M7 7h1v1H7z M9 7h1v1H9z M10 6h1v1h-1z M11 7h1v1h-1z';
      mouth = 'M6 10h5v1H6z M5 9h1v1H5z M11 9h1v1h-1z M7 11h3v1H7z';
      arms  = 'M3 8h2v5H3z M12 8h2v5h-2z';           // brazos ARRIBA
      // chispas de celebracion
      extra = '<path fill="var(--warn)" d="M1 6h1v1H1z M15 5h1v1h-1z M2 11h1v1H2z M14 10h1v1h-1z"/>';
    } else if (mood === 'sad') {
      eyes  = 'M6 8h1v1H6z M10 8h1v1h-1z';           // ojos pequenos y bajos
      brow  = '<path fill="#141a33" d="M5 6h2v1H5z M10 6h2v1h-2z"/>';
      mouth = 'M6 11h5v1H6z M5 10h1v1H5z M11 10h1v1h-1z';  // comisuras hacia abajo
      arms  = 'M3 14h2v4H3z M12 14h2v4h-2z';         // brazos caidos
      extra = '<path fill="#7ee8fa" d="M13 7h1v2h-1z M13 9h1v1h-1z"/>'; // gota de sudor
    } else {
      eyes  = 'M6 6h1v2H6z M10 6h1v2h-1z';
      mouth = 'M7 10h3v1H7z';
      arms  = 'M3 13h2v4H3z M12 13h2v4h-2z';
    }

    return '<svg class="avatar" viewBox="0 0 17 20" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true">' +
      extra +
      // pelo
      '<path fill="#2b1a12" d="M4 1h9v2H4z M3 2h1v4H3z M13 2h1v4h-1z M4 2h9v2H4z"/>' +
      // cara
      '<path fill="#e8b088" d="M4 4h9v8H4z"/>' +
      brow +
      '<path fill="#141a33" d="' + eyes + '"/>' +
      '<path fill="#8c4a3a" d="' + mouth + '"/>' +
      // diadema / visor con el color de la materia
      '<path fill="var(--accent)" d="M3 5h1v3H3z M13 5h1v3h-1z M3 4h11v1H3z"/>' +
      // torso + brazos
      '<path fill="var(--accent-2)" d="M5 12h7v6H5z ' + arms + '"/>' +
      // emblema del pecho
      '<path fill="#fff" d="M8 14h1v3H8z M7 15h3v1H7z"/>' +
      // piernas
      '<path fill="#1c2555" d="M5 18h3v2H5z M9 18h3v2H9z"/>' +
      '</svg>';
  }
  window.SamuelSprite = samuelSVG;

  var CHEERS = ['NICE ONE!', 'GOT IT!', 'YES!', 'SHARP!', 'CLEAN WORK!', 'THAT\'S IT!'];
  var CONSOLES = ['NOT YET...', 'ALMOST!', 'TRY AGAIN', 'KEEP GOING', 'SHAKE IT OFF'];
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* Cambia la cara de Samuel en la pantalla de juego. */
  function setMate(mood, msg, cls) {
    var box = el('mateSprite');
    if (!box) return;
    box.innerHTML = samuelSVG(mood);
    var sprite = box.querySelector('.avatar');
    if (mood === 'happy') sprite.classList.add('avatar--cheer');
    else if (mood === 'sad') sprite.classList.add('avatar--down');
    else sprite.classList.add('avatar--bob');
    var m = el('mateMsg');
    if (m) { m.textContent = msg || ''; m.className = 'mate__msg' + (cls ? ' ' + cls : ''); }
  }

  /* ---------- QUESTION QUEUE ----------
     Regla anti-repeticion: cada pregunta es una FAMILIA con varias variantes.
     Una familia solo se supera al acertarla. Al fallar vuelve al final de la
     cola y se sirve OTRA variante, para que Samuel razone de nuevo en vez de
     recordar que boton pulso.

     Garantias:
       1. Se agotan TODAS las variantes antes de reutilizar ninguna.
       2. Al reiniciar el ciclo nunca se repite la ultima servida, asi que es
          imposible ver la misma pregunta dos veces seguidas.
       3. `tries` cuenta los intentos reales de la familia (no se reinicia con
          el ciclo de variantes), asi que "acierto al primer intento" y las
          estrellas siguen siendo correctos por muchas vueltas que dé.
  ------------------------------------------------------------- */
  function Runner(level) {
    this.level = level;
    this.queue = shuffle(level.questions.map(function (q, i) { return i; }));
    this.total = level.questions.length;
    this.cleared = 0;
    this.attempts = 0;
    this.firstTry = 0;
    this.misses = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.xp = 0;
    this.seen = {};      // familia -> [variantes ya servidas en este ciclo]
    this.tries = {};     // familia -> intentos reales acumulados
    this.lastVar = {};   // familia -> ultima variante servida
    this.answered = {};
    this.startedAt = Date.now();
  }
  Runner.prototype.current = function () {
    if (!this.queue.length) return null;
    var fi = this.queue[0];
    var fam = this.level.questions[fi];
    var used = this.seen[fi] || [];
    var last = this.lastVar[fi];
    var i, pool = [];

    for (i = 0; i < fam.variants.length; i++) if (used.indexOf(i) === -1) pool.push(i);

    if (!pool.length) {
      // Ciclo agotado: se reinicia, pero nunca con la variante recien vista.
      for (i = 0; i < fam.variants.length; i++) if (i !== last) pool.push(i);
      if (!pool.length) pool = [0];        // familia con una sola variante
      this.seen[fi] = [];
    }

    var vi = pool[Math.floor(Math.random() * pool.length)];
    (this.seen[fi] = this.seen[fi] || []).push(vi);
    this.lastVar[fi] = vi;
    this.tries[fi] = (this.tries[fi] || 0) + 1;
    return {
      familyIndex: fi, variantIndex: vi, family: fam, v: fam.variants[vi],
      tries: this.tries[fi],
      firstAttempt: this.tries[fi] === 1
    };
  };
  Runner.prototype.resolve = function (correct) {
    var fi = this.queue.shift();
    this.attempts++;
    if (correct) {
      this.cleared++;
      this.combo++;
      if (this.combo > this.bestCombo) this.bestCombo = this.combo;
      var base = 100;
      var bonus = Math.min(this.combo, 8) * 20;
      this.xp += base + bonus;
      if (this.tries[fi] === 1) this.firstTry++;
      this.answered[fi] = true;
    } else {
      this.misses++;
      this.combo = 0;
      this.queue.push(fi);   // al final de la cola, con otra variante
    }
  };
  Runner.prototype.progress = function () { return this.cleared / this.total; };
  Runner.prototype.stars = function () {
    var acc = this.firstTry / this.total;
    if (acc >= 0.9) return 3;
    if (acc >= 0.7) return 2;
    return 1;
  };
  Runner.prototype.minutes = function () { return Math.max(1, Math.round((Date.now() - this.startedAt) / 60000)); };

  /* ---------- RENDER: SHELL ---------- */
  var root = el('app');
  root.innerHTML =
    '<div class="wrap">' +
      '<header class="site-head">' +
        '<div id="heroSprite">' + samuelSVG('idle') + '</div>' +
        '<div>' +
          '<h1>SAMUEL QUEST</h1>' +
          '<p>' + esc(DATA.meta.year) + ' &middot; ' + esc(DATA.meta.subject) + ' &middot; ' + esc(DATA.meta.topic) + '</p>' +
        '</div>' +
      '</header>' +

      /* MAP */
      '<section id="scrMap" class="screen is-on">' +
        '<div class="pixel-box hud">' +
          '<div class="hud__group">' +
            '<span class="hud__stat">XP <b id="mapXP">0</b></span>' +
            '<span class="hud__stat">LEVELS <b id="mapDone">0/5</b></span>' +
          '</div>' +
          '<div class="hud__group">' +
            '<button class="btn btn--ghost" id="btnMusic" type="button">MUSIC: ON</button>' +
            '<button class="btn btn--ghost" id="btnSound" type="button">SOUND: ON</button>' +
            '<button class="btn btn--ghost" id="btnReset" type="button">RESET</button>' +
          '</div>' +
        '</div>' +
        '<p class="text-dim" style="font-size:15px">One level per day. About 30 minutes each. Finish a level to unlock the next one.</p>' +
        '<div class="levels" id="levelList"></div>' +
        '<div id="allDone"></div>' +
      '</section>' +

      /* BRIEFING */
      '<section id="scrBrief" class="screen">' +
        '<div class="pixel-box brief" id="briefBody"></div>' +
        '<div class="row row--end mt">' +
          '<button class="btn btn--ghost" id="briefBack" type="button">&lt; MAP</button>' +
          '<button class="btn btn--primary" id="briefGo" type="button">START LEVEL &gt;</button>' +
        '</div>' +
      '</section>' +

      /* PLAY */
      '<section id="scrPlay" class="screen">' +
        '<div class="pixel-box hud">' +
          '<div class="mate">' +
            '<div class="mate__sprite" id="mateSprite"></div>' +
            '<div class="mate__msg" id="mateMsg">LET\'S GO</div>' +
          '</div>' +
          '<div class="hud__group" style="flex:1">' +
            '<span class="hud__stat" id="hudLvl">LV 1</span>' +
            '<div class="bar"><div class="bar__fill" id="hudBar"></div></div>' +
            '<span class="hud__stat" id="hudCount">0/0</span>' +
          '</div>' +
          '<div class="hud__group">' +
            '<span class="hud__stat">XP <b id="hudXP">0</b></span>' +
            '<span class="hud__stat">COMBO <b id="hudCombo">0</b></span>' +
          '</div>' +
        '</div>' +
        '<div class="pixel-box stage">' +
          '<div id="qTag" class="q-tag"></div>' +
          '<div id="qStem" class="q-stem"></div>' +
          '<div id="qSub" class="q-sub"></div>' +
          '<div id="qSeq" class="seq"></div>' +
          '<div id="qOpts" class="options" role="group" aria-label="Answer options"></div>' +
          '<div id="qHint" class="hint" role="note"></div>' +
          '<div class="row mt">' +
            '<button class="btn btn--ghost" id="btnHint" type="button">HINT</button>' +
            '<button class="btn btn--ghost" id="btnMusic2" type="button">MUSIC</button>' +
            '<button class="btn btn--ghost" id="btnQuit" type="button">QUIT</button>' +
          '</div>' +
        '</div>' +
        '<div id="qFeed" class="pixel-box feedback" role="status" aria-live="polite"></div>' +
        '<div class="row row--end mt"><button class="btn btn--primary" id="btnNext" type="button" style="display:none">NEXT &gt;</button></div>' +
      '</section>' +

      /* WIN */
      '<section id="scrWin" class="screen">' +
        '<div class="pixel-box victory" id="winBody"></div>' +
      '</section>' +

      '<footer>Samuel Quest &middot; built for Samuel, Year 6</footer>' +
    '</div>' +
    '<div class="combo" id="comboPop"></div>';

  var screens = { map: el('scrMap'), brief: el('scrBrief'), play: el('scrPlay'), win: el('scrWin') };
  function show(name) {
    Object.keys(screens).forEach(function (k) { screens[k].classList.toggle('is-on', k === name); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- MAP ---------- */
  function starStr(n) {
    var s = '';
    for (var i = 0; i < 3; i++) s += (i < n ? '<span>&#9733;</span>' : '<span class="off">&#9733;</span>');
    return s;
  }

  function renderMap() {
    var list = el('levelList');
    list.innerHTML = '';
    var done = 0;
    DATA.levels.forEach(function (lv, idx) {
      var ls = levelSave(lv.id);
      if (ls.done) done++;
      var unlocked = isUnlocked(idx);
      var card = document.createElement('div');
      card.className = 'pixel-box level-card' + (unlocked ? '' : ' is-locked') + (ls.done ? ' is-done' : '');
      card.innerHTML =
        '<div class="level-card__num">' + (unlocked ? lv.id : '&#128274;') + '</div>' +
        '<div>' +
          '<div class="level-card__name">' + esc(lv.name) + '</div>' +
          '<div class="level-card__sub">' + esc(lv.subtitle) + '</div>' +
          '<div class="level-card__sub text-dim" style="margin-top:6px;font-size:13px">Day ' + lv.id +
            ' &middot; ' + lv.questions.length + ' challenges' +
            (ls.done ? ' &middot; best ' + ls.best + ' XP' : '') + '</div>' +
        '</div>' +
        '<div class="stars">' + starStr(ls.stars) + '</div>';
      if (unlocked) {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        var open = function () { SFX.click(); openBrief(idx); };
        card.addEventListener('click', open);
        card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      }
      list.appendChild(card);
    });
    el('mapXP').textContent = STATE.totalXP;
    el('mapDone').textContent = done + '/' + DATA.levels.length;
    el('btnSound').textContent = 'SOUND: ' + (STATE.sound ? 'ON' : 'OFF');
    el('btnMusic').textContent = 'MUSIC: ' + (STATE.music ? 'ON' : 'OFF');
    el('allDone').innerHTML = (done === DATA.levels.length)
      ? '<div class="pixel-box victory mt-lg"><h2>&#127942; ALL LEVELS CLEARED</h2>' +
        '<p>You are ready for the ' + esc(DATA.meta.test) + '. Replay any level to push for 3 stars.</p></div>'
      : '';
  }

  /* ---------- BRIEFING ---------- */
  var currentIdx = 0, run = null;

  function openBrief(idx) {
    currentIdx = idx;
    var lv = DATA.levels[idx];
    el('briefBody').innerHTML =
      '<div class="q-tag">DAY ' + lv.id + ' &middot; BRIEFING</div>' +
      '<h2>' + esc(lv.name) + '</h2>' +
      lv.briefing.join('');
    show('brief');
  }

  el('briefBack').addEventListener('click', function () { SFX.click(); renderMap(); show('map'); });
  el('briefGo').addEventListener('click', function () { SFX.click(); startLevel(currentIdx); });

  /* ---------- PLAY ---------- */
  var q = null, locked = false;

  function startLevel(idx) {
    var lv = DATA.levels[idx];
    run = new Runner(lv);
    el('hudLvl').textContent = 'LV ' + lv.id;
    setMate('idle', 'LET\'S GO');
    if (STATE.music) MUSIC.start();
    show('play');
    nextQuestion();
  }

  function nextQuestion() {
    if (!run.queue.length) return winLevel();
    q = run.current();
    locked = false;

    el('qTag').textContent = q.family.skill.toUpperCase().replace(/-/g, ' ');
    el('qStem').innerHTML = q.v.stem;
    el('qSub').innerHTML = q.v.sub || '';
    el('qSub').style.display = q.v.sub ? 'block' : 'none';

    // sequence tiles
    var seqBox = el('qSeq');
    if (q.v.seq && q.v.seq.length) {
      seqBox.style.display = 'flex';
      seqBox.innerHTML = q.v.seq.map(function (t) {
        var blank = (t === '?' || t === '' || t === null);
        return '<div class="tile' + (blank ? ' tile--blank' : '') + '">' + esc(blank ? '?' : t) + '</div>';
      }).join('');
    } else { seqBox.style.display = 'none'; seqBox.innerHTML = ''; }

    // options — shuffled every single time
    var order = shuffle(q.v.options.map(function (_, i) { return i; }));
    var box = el('qOpts');
    box.innerHTML = '';
    order.forEach(function (origIdx, pos) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt';
      b.setAttribute('data-orig', String(origIdx));
      b.innerHTML = '<span class="opt__key">' + KEYS[pos] + '</span><span>' + q.v.options[origIdx] + '</span>';
      b.addEventListener('click', function () { answer(origIdx, b); });
      box.appendChild(b);
    });

    // Andamiaje: si ya falló esta familia antes, la pista aparece sola.
    var retry = q.tries > 1;
    el('qHint').className = 'hint' + (retry ? ' is-on' : '');
    el('qHint').innerHTML = (retry ? '<b>You saw this one before &mdash; here is the method:</b> ' : '<b>Hint:</b> ')
      + (q.v.hint || 'Look at the size of each jump.');
    el('btnHint').style.display = retry ? 'none' : 'inline-block';
    el('qFeed').className = 'pixel-box feedback';
    el('btnNext').style.display = 'none';
    setMate('idle', run.combo >= 3 ? 'COMBO x' + run.combo : (retry ? 'ROUND TWO' : 'YOUR TURN'));
    updateHUD();
  }

  function updateHUD() {
    el('hudBar').style.width = Math.round(run.progress() * 100) + '%';
    el('hudCount').textContent = run.cleared + '/' + run.total;
    el('hudXP').textContent = run.xp;
    el('hudCombo').textContent = run.combo;
  }

  function popCombo(text) {
    var p = el('comboPop');
    p.textContent = text;
    p.className = 'combo';
    void p.offsetWidth;
    p.className = 'combo is-on';
  }

  function answer(chosen, btn) {
    if (locked) return;
    locked = true;
    var correct = (chosen === q.v.answer);
    var buttons = el('qOpts').querySelectorAll('.opt');

    Array.prototype.forEach.call(buttons, function (b) {
      b.disabled = true;
      if (parseInt(b.getAttribute('data-orig'), 10) === q.v.answer) b.classList.add('is-right');
    });
    if (!correct) { btn.classList.add('is-wrong', 'shake'); }
    else { btn.classList.add('pop'); }

    var fb = el('qFeed');
    if (correct) {
      SFX.right();
      MUSIC.duck(900);
      run.resolve(true);
      setMate('happy', run.combo >= 3 ? 'COMBO x' + run.combo + '!' : pick(CHEERS), 'is-good');
      if (run.combo >= 3) popCombo('COMBO x' + run.combo + '!');
      fb.className = 'pixel-box feedback is-on feedback--good';
      fb.innerHTML = '<div class="feedback__title">&#10003; CORRECT</div><div class="feedback__body">' + q.v.explain + '</div>';
    } else {
      SFX.wrong();
      MUSIC.duck(900);
      run.resolve(false);
      setMate('sad', pick(CONSOLES), 'is-bad');
      fb.className = 'pixel-box feedback is-on feedback--bad';
      fb.innerHTML = '<div class="feedback__title">&#10007; NOT YET</div><div class="feedback__body">' + q.v.explain +
        '<p style="margin-top:12px;color:var(--warn)"><b>This challenge comes back later with different numbers</b> &mdash; so work out the method, not the answer.</p></div>';
    }
    el('btnHint').style.display = 'none';
    el('btnNext').style.display = 'inline-block';
    el('btnNext').textContent = run.queue.length ? 'NEXT >' : 'FINISH LEVEL >';
    el('btnNext').focus();
    updateHUD();
  }

  el('btnNext').addEventListener('click', function () { SFX.click(); nextQuestion(); });
  el('btnHint').addEventListener('click', function () { SFX.click(); el('qHint').classList.add('is-on'); });
  el('btnQuit').addEventListener('click', function () {
    if (confirm('Leave this level? Progress in this level is not saved.')) { renderMap(); show('map'); }
  });

  // keyboard: A/B/C/D or 1-4
  document.addEventListener('keydown', function (e) {
    if (!screens.play.classList.contains('is-on')) return;
    if (e.key === 'Enter' && el('btnNext').style.display !== 'none') { el('btnNext').click(); return; }
    var k = e.key.toUpperCase();
    var idx = KEYS.indexOf(k);
    if (idx === -1 && /^[1-5]$/.test(k)) idx = parseInt(k, 10) - 1;
    if (idx === -1) return;
    var btns = el('qOpts').querySelectorAll('.opt');
    if (btns[idx] && !btns[idx].disabled) btns[idx].click();
  });

  /* ---------- WIN ---------- */
  function winLevel() {
    if (run.finished) return;      // evita que un doble clic cuente la partida dos veces
    run.finished = true;
    var lv = DATA.levels[currentIdx];
    var ls = levelSave(lv.id);
    var stars = run.stars();
    var wasNew = !ls.done;

    ls.done = true;
    ls.plays++;
    if (stars > ls.stars) ls.stars = stars;
    if (run.xp > ls.best) { STATE.totalXP += (run.xp - ls.best); ls.best = run.xp; }
    save();

    SFX.level();
    MUSIC.duck(2600);
    var nextLv = DATA.levels[currentIdx + 1];
    el('winBody').innerHTML =
      '<div style="display:flex;justify-content:center">' + samuelSVG('happy').replace('class="avatar"', 'class="avatar avatar--lg avatar--bob"') + '</div>' +
      '<h2>LEVEL ' + lv.id + ' CLEARED</h2>' +
      '<div class="stars">' + starStr(stars) + '</div>' +
      '<div class="victory__stats">' +
        '<div><span>XP</span>' + run.xp + '</div>' +
        '<div><span>FIRST TRY</span>' + run.firstTry + '/' + run.total + '</div>' +
        '<div><span>BEST COMBO</span>' + run.bestCombo + '</div>' +
        '<div><span>MISSES</span>' + run.misses + '</div>' +
      '</div>' +
      '<p class="text-dim" style="font-size:15px">' +
        (stars === 3 ? 'Perfect run. You have this topic locked in.'
         : stars === 2 ? 'Strong. Replay to hunt the third star.'
         : 'Cleared it. Replay this level tomorrow &mdash; the questions come back with new numbers.') +
      '</p>' +
      (nextLv && wasNew ? '<p class="mt" style="color:var(--good);font-family:var(--font-ui);font-size:11px">&#128275; UNLOCKED: LEVEL ' + nextLv.id + ' &mdash; ' + esc(nextLv.name) + '</p>' : '') +
      '<div class="row mt-lg" style="justify-content:center">' +
        '<button class="btn btn--ghost" id="winReplay" type="button">REPLAY</button>' +
        '<button class="btn btn--primary" id="winMap" type="button">' + (nextLv ? 'BACK TO MAP >' : 'BACK TO MAP >') + '</button>' +
      '</div>';

    if (nextLv && wasNew) setTimeout(SFX.unlock, 700);

    el('winReplay').addEventListener('click', function () { SFX.click(); startLevel(currentIdx); });
    el('winMap').addEventListener('click', function () { SFX.click(); renderMap(); show('map'); });
    show('win');
  }

  /* ---------- MAP CONTROLS ---------- */
  el('btnSound').addEventListener('click', function () {
    STATE.sound = !STATE.sound; save(); SFX.click();
    el('btnSound').textContent = 'SOUND: ' + (STATE.sound ? 'ON' : 'OFF');
  });

  function toggleMusic() {
    STATE.music = !STATE.music;
    save();
    if (STATE.music) MUSIC.start(); else MUSIC.stop();
    el('btnMusic').textContent = 'MUSIC: ' + (STATE.music ? 'ON' : 'OFF');
    el('btnMusic2').textContent = 'MUSIC: ' + (STATE.music ? 'ON' : 'OFF');
  }
  el('btnMusic').addEventListener('click', toggleMusic);
  el('btnMusic2').addEventListener('click', toggleMusic);
  el('btnMusic2').textContent = 'MUSIC: ' + (STATE.music ? 'ON' : 'OFF');

  // Los navegadores solo permiten audio tras una interaccion del usuario.
  document.addEventListener('click', function once() {
    document.removeEventListener('click', once);
    if (STATE.music) MUSIC.start();
  });

  // Silencia si Samuel cambia de pestana.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) MUSIC.stop();
    else if (STATE.music) MUSIC.start();
  });
  el('btnReset').addEventListener('click', function () {
    if (confirm('Reset all progress for ' + DATA.meta.topic + '?')) {
      STATE = blankSave(); save(); renderMap();
    }
  });

  renderMap();
})();
