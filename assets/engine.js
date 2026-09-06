/* ============================================================
   SAMU: A LINK TO THE MATH — ENGINE.JS
   Subject-agnostic game engine. Reads window.QUIZ_DATA.

   REGLA DEL PROYECTO: este archivo NO contiene texto visible.
   Todo lo que el jugador lee vive en `assets/ui.js` (chrome) o en
   `subjects/<slug>/data.js` (contenido). Si un `grep` de un nombre
   de jefe, de mundo o de boton devuelve una linea de este archivo,
   esta mal.

   Never edit this file to add a subject; only add a data file.
   ============================================================ */
(function () {
  'use strict';

  var DATA = window.QUIZ_DATA;

  /* ---------- UI: chrome compartido + override por materia ----------
     Prioridad: ui.js  <  DATA.ui  <  DATA.meta.mate (solo companero).
     Mezcla profunda: una materia puede pisar una sola clave sin
     copiar el resto. */
  function deepMerge(base, over) {
    if (!over || typeof over !== 'object') return base;
    var out = {}, k;
    for (k in base) if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = base[k];
    for (k in over) {
      if (!Object.prototype.hasOwnProperty.call(over, k)) continue;
      var b = base[k], o = over[k];
      if (o && typeof o === 'object' && !(o instanceof Array) &&
          b && typeof b === 'object' && !(b instanceof Array)) {
        out[k] = deepMerge(b, o);
      } else {
        out[k] = o;
      }
    }
    return out;
  }

  var UI = deepMerge(window.GAME_UI || {}, (DATA && DATA.ui) || {});
  if (DATA && DATA.meta && DATA.meta.mate) UI.mate = deepMerge(UI.mate || {}, DATA.meta.mate);

  /* Sustituye {clave} por el valor. Los valores se pasan YA escapados
     cuando vienen de datos; las plantillas de ui.js pueden llevar HTML. */
  function fmt(tpl, vals) {
    if (tpl == null) return '';
    return String(tpl).replace(/\{(\w+)\}/g, function (m, k) {
      return (vals && vals[k] != null) ? String(vals[k]) : m;
    });
  }

  if (!DATA) {
    document.body.innerHTML = '<p style="padding:40px">' + ((UI.err && UI.err.noData) || '') + '</p>';
    return;
  }

  /* La clave de guardado NO cambia aunque el juego cambie de nombre.
     Renombrarla borraria el progreso de quien ya venia jugando. */
  var SAVE_KEY = 'samuel-quest:' + DATA.meta.slug;
  var SAVE_VERSION = 3;
  var KEYS = ['A', 'B', 'C', 'D', 'E'];

  /* ---------- SAVE STATE ----------
     Migracion v2 -> v3: solo ANADE campos con valores por defecto.
     Nunca borra niveles, estrellas ni XP. */
  function blankLevel() {
    return { done: false, stars: 0, best: 0, plays: 0, bossClean: false, history: [] };
  }
  function normalizeLevel(ls) {
    if (!ls || typeof ls !== 'object') return blankLevel();
    ls.done      = !!ls.done;
    if (typeof ls.stars !== 'number' || ls.stars < 0) ls.stars = 0;
    if (typeof ls.best  !== 'number' || ls.best  < 0) ls.best  = 0;
    if (typeof ls.plays !== 'number' || ls.plays < 0) ls.plays = 0;
    if (typeof ls.bossClean !== 'boolean') ls.bossClean = false;
    if (!(ls.history instanceof Array)) ls.history = [];
    return ls;
  }
  function blankSave() {
    return {
      version: SAVE_VERSION,
      levels: {}, totalXP: 0, sound: true, music: true,
      skills: {}, bestComboEver: 0
    };
  }
  function migrate(s) {
    if (typeof s.totalXP !== 'number' || s.totalXP < 0) s.totalXP = 0;
    if (typeof s.music !== 'boolean') s.music = true;
    if (typeof s.sound !== 'boolean') s.sound = true;
    if (!s.skills || typeof s.skills !== 'object' || s.skills instanceof Array) s.skills = {};
    if (typeof s.bestComboEver !== 'number' || s.bestComboEver < 0) s.bestComboEver = 0;
    Object.keys(s.levels).forEach(function (id) { s.levels[id] = normalizeLevel(s.levels[id]); });
    s.version = SAVE_VERSION;
    return s;
  }
  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return blankSave();
      var s = JSON.parse(raw);
      if (!s || typeof s !== 'object' || !s.levels || typeof s.levels !== 'object') return blankSave();
      return migrate(s);
    } catch (e) { return blankSave(); }
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(STATE)); } catch (e) { /* private mode */ }
  }
  var STATE = load();

  /* ---------- HEROE (transversal a materias) ----------
     Clave NUEVA y separada del progreso: si viviera dentro de
     `samuel-quest:<slug>` el nino tendria que reconfigurar su personaje en
     cada materia. Ninguna clave existente se renombra ni se toca.

     Aqui NUNCA se guarda el nombre real: solo un alias elegido por el nino,
     de 12 caracteres, que no sale del navegador. */
  var HERO_KEY = 'samuel-quest:hero';
  var ALIAS_MAX = 12;

  function blankHero() {
    return {
      v: 1,
      body: 'a',
      alias: '',
      chosen: false,
      /* Valores concretos de la paleta, NO `var(--accent)`.
         Dos razones:
         1. Con `var(--accent)` la armeria mostraba tres filas sin ninguna
            muestra marcada, porque el valor guardado no coincidia con ningun
            hex de la paleta.
         2. El heroe es del NINO y es transversal a materias: que cambiara de
            color al pasar de Mates a Ciencias contradice justo eso.
         Estos tres hex SON los acentos de Mates, asi que el aspecto de v1 se
         conserva exacto. Las botas pasan de #1c2555 (1.16:1, invisible sobre
         el fondo) a un azul que cumple contraste. */
      colors: {
        helm:  '#7ee8fa',   // CYAN   — era var(--accent) en Mates
        body:  '#c77dff',   // PURPLE — era var(--accent-2)
        glove: '#c77dff',   // PURPLE
        boot:  '#5b8cff'    // SKY
      }
    };
  }
  function loadHero() {
    var h = blankHero();
    try {
      var raw = localStorage.getItem(HERO_KEY);
      if (!raw) return h;
      var s = JSON.parse(raw);
      if (!s || typeof s !== 'object') return h;
      if (s.body === 'a' || s.body === 'b') h.body = s.body;
      if (typeof s.alias === 'string') h.alias = s.alias.slice(0, ALIAS_MAX);
      h.chosen = !!s.chosen;
      if (s.colors && typeof s.colors === 'object') {
        ['helm', 'body', 'glove', 'boot'].forEach(function (k) {
          if (typeof s.colors[k] === 'string' && s.colors[k]) h.colors[k] = s.colors[k];
        });
      }
    } catch (e) { /* private mode */ }
    return h;
  }
  function saveHero() {
    try { localStorage.setItem(HERO_KEY, JSON.stringify(HERO)); } catch (e) { /* private mode */ }
  }
  var HERO = loadHero();

  /* Pinta las 4 variables de armadura sobre cualquier contenedor de sprites. */
  function paintHero(node) {
    if (!node || !node.style) return;
    node.style.setProperty('--h-helm',  HERO.colors.helm);
    node.style.setProperty('--h-body',  HERO.colors.body);
    node.style.setProperty('--h-glove', HERO.colors.glove);
    node.style.setProperty('--h-boot',  HERO.colors.boot);
  }
  function paintAllHeroes() {
    paintHero(document.documentElement);
  }

  /* Sustituye {hero} por el alias en cualquier texto de contenido. Si el nino
     no puso alias, se usa el generico de ui.js: nunca queda un hueco raro ni
     el nombre de nadie. */
  function heroText(s) {
    if (s == null) return '';
    var name = HERO.alias || UI.hero.defaultAlias;
    return String(s).replace(/\{hero\}/g, name);
  }

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
    unlock: function () { [392, 523, 659].forEach(function (f, i) { setTimeout(function () { beep(f, .12); }, i * 90); }); },
    // Invocar la calculadora: arpegio ascendente de 3 notas + "ding".
    summon: function () {
      [523, 659, 784].forEach(function (f, i) { setTimeout(function () { beep(f, .10); }, i * 90); });
      setTimeout(function () { beep(1319, .22, 'triangle', .05); }, 300);
    }
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
  function onOff(flag) { return flag ? UI.play.stateOn : UI.play.stateOff; }

  function levelSave(id) {
    if (!STATE.levels[id]) STATE.levels[id] = blankLevel();
    else STATE.levels[id] = normalizeLevel(STATE.levels[id]);
    return STATE.levels[id];
  }
  function isUnlocked(idx) {
    if (idx === 0) return true;
    var prev = DATA.levels[idx - 1];
    return !!levelSave(prev.id).done;
  }

  /* ---------- SPRITE (inline pixel-art hero) ----------
     Ensamblado POR PARTES, no un string por mood. Con 3 moods x 2 cuerpos,
     escribir el SVG entero cada vez son 6 strings casi identicos que se
     desincronizan en cuanto se toca uno. (Deuda declarada en PLAN-V2 §6.)

     Moods: 'idle' | 'happy' | 'sad' | 'summon'
     Cuerpos: 'a' | 'b'  — difieren en pelo, silueta del torso y botas.
     La logica NO sabe de genero: son 'a' y 'b'; las etiquetas visibles
     viven en ui.js.

     Las 4 piezas de armadura se pintan con variables CSS
     (--h-helm / --h-body / --h-glove / --h-boot) que pone el contenedor.
     Asi un solo string sirve para todas las combinaciones y las animaciones
     CSS no cambian.
  -------------------------------------------------------- */
  var BODIES = {
    a: {
      hair:  'M4 1h9v2H4z M3 2h1v4H3z M13 2h1v4h-1z M4 2h9v2H4z',
      torso: 'M5 12h7v6H5z',
      boots: 'M5 18h3v2H5z M9 18h3v2H9z'
    },
    b: {
      hair:  'M4 1h9v2H4z M4 2h9v2H4z M3 2h1v9H3z M13 2h1v9h-1z M2 4h1v6H2z M14 4h1v6h-1z',
      torso: 'M5 12h7v3H5z M6 15h5v3H6z',
      boots: 'M6 18h2v2H6z M9 18h2v2H9z'
    }
  };

  /* Brazos y manos van separados: en v1 los brazos llevaban el color del
     torso y no habia guantes que pintar. */
  var LIMBS = {
    idle:   { arms: 'M3 13h2v3H3z M12 13h2v3h-2z', hands: 'M3 16h2v1H3z M12 16h2v1h-2z' },
    happy:  { arms: 'M3 9h2v4H3z M12 9h2v4h-2z',   hands: 'M3 8h2v1H3z M12 8h2v1h-2z'   },
    sad:    { arms: 'M3 14h2v3H3z M12 14h2v3h-2z', hands: 'M3 17h2v1H3z M12 17h2v1h-2z' },
    // summon: brazo derecho vertical, el izquierdo en reposo (PLAN-V2 §6.2).
    summon: { arms: 'M3 13h2v3H3z M12 7h2v6h-2z',  hands: 'M3 16h2v1H3z M12 6h2v1h-2z'  }
  };

  var FACES = {
    idle:   { eyes: 'M6 6h1v2H6z M10 6h1v2h-1z', mouth: 'M7 10h3v1H7z' },
    happy:  { eyes: 'M5 7h1v1H5z M6 6h1v1H6z M7 7h1v1H7z M9 7h1v1H9z M10 6h1v1h-1z M11 7h1v1h-1z',
              mouth: 'M6 10h5v1H6z M5 9h1v1H5z M11 9h1v1h-1z M7 11h3v1H7z' },
    sad:    { eyes: 'M6 8h1v1H6z M10 8h1v1h-1z', mouth: 'M6 11h5v1H6z M5 10h1v1H5z M11 10h1v1h-1z',
              brow: 'M5 6h2v1H5z M10 6h2v1h-2z' },
    summon: { eyes: 'M6 6h1v2H6z M10 6h1v2h-1z', mouth: 'M7 10h2v2H7z' }   // boca abierta
  };

  var EXTRAS = {
    happy: '<path fill="var(--warn)" d="M1 6h1v1H1z M15 5h1v1h-1z M2 11h1v1H2z M14 10h1v1h-1z"/>',
    sad:   '<path fill="#7ee8fa" d="M13 7h1v2h-1z M13 9h1v1h-1z"/>'
  };

  /* Se dibuja DESPUES del cuerpo: el destello y la calculadora van delante
     de la mano alzada. La animacion es CSS (ver .avatar .flash / .calc). */
  var OVERLAYS = {
    summon:
      '<g class="flash">' +
        '<path fill="var(--warn)" d="M10 4h1v1h-1z M16 4h1v1h-1z M13 0h1v1h-1z M13 8h1v1h-1z"/>' +
      '</g>' +
      '<g class="calc">' +
        '<path fill="#0a0e24" d="M11 0h5v6h-5z"/>' +
        '<path fill="var(--accent)" d="M12 1h3v2h-3z"/>' +
        '<path fill="#eaf0ff" d="M12 4h1v1h-1z M14 4h1v1h-1z"/>' +
      '</g>'
  };

  function heroSVG(mood, hero) {
    hero = hero || HERO;
    var B = BODIES[(hero && hero.body) === 'b' ? 'b' : 'a'];
    var L = LIMBS[mood] || LIMBS.idle;
    var F = FACES[mood] || FACES.idle;

    return '<svg class="avatar" viewBox="0 0 17 20" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true">' +
      (EXTRAS[mood] || '') +
      '<path fill="#2b1a12" d="' + B.hair + '"/>' +
      '<path fill="#e8b088" d="M4 4h9v8H4z"/>' +
      (F.brow ? '<path fill="#141a33" d="' + F.brow + '"/>' : '') +
      '<path fill="#141a33" d="' + F.eyes + '"/>' +
      '<path fill="#8c4a3a" d="' + F.mouth + '"/>' +
      '<path fill="var(--h-helm)"  d="M3 5h1v3H3z M13 5h1v3h-1z M3 4h11v1H3z"/>' +
      '<path fill="var(--h-body)"  d="' + B.torso + ' ' + L.arms + '"/>' +
      '<path fill="var(--h-glove)" d="' + L.hands + '"/>' +
      '<path fill="#fff" d="M8 14h1v3H8z M7 15h3v1H7z"/>' +
      '<path fill="var(--h-boot)"  d="' + B.boots + '"/>' +
      (OVERLAYS[mood] || '') +
      '</svg>';
  }
  window.HeroSprite = heroSVG;
  window.SamuelSprite = heroSVG;   // alias historico

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* ---------- SCENES: moverse ES responder ----------
     Contrato (PLAN-V2 §3.3):

       SCENES[mech]() -> {
         mount(container, ctx), move(delta), jump(i),
         confirm(), markResult(answerOrig, chosenOrig), destroy()
       }
       ctx = { variant, order, keys, pick(origIdx), say(text) }

     La escena SOLO pinta las opciones y traduce el movimiento en una
     eleccion. El Runner, la cola y `seen`/`lastVar`/`tries` no la conocen:
     por eso la garantia anti-repeticion no se puede romper desde aqui.

     `mech` es opcional por familia. Si falta, `doors`. Asi un data.js de v1
     (y cualquier materia futura que no quiera escena propia) sigue valiendo.
  ---------------------------------------------------- */
  var SCENES = {};

  SCENES.doors = function () {
    var corridor = null, startPad = null, heroEl = null;
    var slots = [];            // [{ node, orig }]
    var cursor = -1;           // -1 = casilla de inicio; 0..n-1 = puertas
    var ctx = null, dead = false, onResize = null, stacked = false;

    /* Una opcion puede ser "24" o "Each term is 10 more than the one before it."
       Cuatro frases en columnas estrechas son ilegibles, en movil y fuera de el.
       Por encima de este umbral el corredor se pone VERTICAL: cada puerta es una
       banda a lo ancho y el heroe baja por el carril izquierdo. Es el mismo
       modelo de movimiento (las flechas siguen valiendo), no una mecanica nueva. */
    var STACK_OVER = 12;
    function plain(s) { return String(s).replace(/<[^>]*>/g, ''); }

    function nodeAt(i) { return i < 0 ? startPad : slots[i].node; }

    /* Coloca al heroe bajo la casilla actual. Con prefers-reduced-motion la
       transicion CSS esta anulada, asi que aparece en vez de caminar (§0.4). */
    function place() {
      if (!heroEl || !corridor) return;
      var t = nodeAt(cursor);
      if (!t) return;
      if (stacked) {
        // Corredor vertical: el heroe baja por el carril izquierdo.
        heroEl.style.left = (startPad.offsetLeft + (startPad.offsetWidth / 2)) + 'px';
        heroEl.style.top  = (t.offsetTop + (t.offsetHeight / 2)) + 'px';
      } else {
        heroEl.style.left = (t.offsetLeft + (t.offsetWidth / 2)) + 'px';
        heroEl.style.top  = '';
      }
      slots.forEach(function (s, i) { s.node.classList.toggle('is-here', i === cursor); });
      if (startPad) startPad.classList.toggle('is-here', cursor === -1);
    }

    function announce() {
      if (!ctx) return;
      if (cursor < 0) { ctx.say(UI.scene.sayStart); return; }
      ctx.say(fmt(UI.scene.sayOn, {
        key: ctx.keys[cursor],
        value: slots[cursor].node.getAttribute('data-value')
      }));
    }

    return {
      mount: function (container, context) {
        ctx = context;
        dead = false;
        cursor = -1;

        var v = ctx.variant;
        stacked = ctx.order.some(function (o) { return plain(v.options[o]).length > STACK_OVER; });

        var html =
          '<div class="scene scene--doors' + (stacked ? ' scene--stacked' : '') + '">' +
            '<div class="scene__corridor">' +
              '<div class="scene__row">' +
                '<div class="scene__start" aria-hidden="true">' +
                  '<span class="scene__start-tag">' + UI.scene.startLabel + '</span>' +
                '</div>';
        ctx.order.forEach(function (orig, pos) {
          var label = String(v.options[orig]);
          html +=
            '<button type="button" class="door" data-orig="' + orig + '" data-value="' + esc(label.replace(/<[^>]*>/g, '')) + '" ' +
              'aria-label="' + esc(fmt(UI.scene.doorAria, { key: ctx.keys[pos], value: label.replace(/<[^>]*>/g, '') })) + '">' +
              '<span class="door__key">' + ctx.keys[pos] + '</span>' +
              '<span class="door__frame"><span class="door__value">' + label + '</span></span>' +
            '</button>';
        });
        html +=
              '</div>' +
              '<div class="scene__floor"></div>' +
              // El heroe cuelga del corredor, no del suelo: asi comparte
              // offsetParent con las puertas y basta un offsetLeft para situarlo.
              '<div class="scene__hero">' + heroSVG('idle') + '</div>' +
            '</div>' +
            '<p class="scene__help">' + (stacked ? UI.scene.helpStacked : UI.scene.help) + '</p>' +
          '</div>';
        container.innerHTML = html;

        corridor = container.querySelector('.scene__corridor');
        startPad = container.querySelector('.scene__start');
        heroEl   = container.querySelector('.scene__hero');
        slots = Array.prototype.map.call(container.querySelectorAll('.door'), function (n) {
          return { node: n, orig: parseInt(n.getAttribute('data-orig'), 10) };
        });

        var self = this;
        slots.forEach(function (s, i) {
          // Raton/touch: caminar hasta la puerta y cruzarla.
          s.node.addEventListener('click', function () { self.jump(i); });
          // Tab: el heroe sigue al foco para que vista y teclado no diverjan.
          s.node.addEventListener('focus', function () {
            if (dead) return;
            cursor = i; place();
          });
        });

        onResize = function () { place(); };
        window.addEventListener('resize', onResize);
        place();
      },

      move: function (delta) {
        if (dead) return;
        var next = Math.max(-1, Math.min(slots.length - 1, cursor + delta));
        if (next === cursor) return;
        cursor = next;
        place();
        if (cursor >= 0) slots[cursor].node.focus();
        announce();
      },

      /* Salta a una puerta y la cruza: es el atajo A-D / 1-4 de v1 y el
         camino del raton. Un nino que prefiera no caminar juega igual. */
      jump: function (i) {
        if (dead || i < 0 || i >= slots.length) return;
        cursor = i;
        place();
        this.confirm();
      },

      confirm: function () {
        if (dead) return null;
        if (cursor < 0) { ctx.say(UI.scene.sayNeedMove); return null; }
        dead = true;
        var orig = slots[cursor].orig;
        ctx.pick(orig);
        return orig;
      },

      markResult: function (answerOrig, chosenOrig) {
        slots.forEach(function (s) {
          s.node.disabled = true;
          if (s.orig === answerOrig) s.node.classList.add('is-right');
        });
        var correct = (answerOrig === chosenOrig);
        if (!correct) {
          slots.forEach(function (s) { if (s.orig === chosenOrig) s.node.classList.add('is-wrong', 'shake'); });
          // El heroe vuelve al inicio del tramo.
          cursor = -1;
          place();
          if (heroEl) { var a = heroEl.querySelector('.avatar'); if (a) a.classList.add('avatar--down'); }
        } else {
          if (heroEl) { var b = heroEl.querySelector('.avatar'); if (b) b.classList.add('avatar--cheer'); }
        }
        ctx.say(correct ? UI.scene.sayRight : UI.scene.sayWrong);
      },

      destroy: function () {
        dead = true;
        if (onResize) { window.removeEventListener('resize', onResize); onResize = null; }
        slots = []; corridor = startPad = heroEl = null; ctx = null;
      }
    };
  };

  /* Cambia la cara del companero en la pantalla de juego. */
  function setMate(mood, msg, cls) {
    var box = el('mateSprite');
    if (!box) return;
    box.innerHTML = heroSVG(mood);
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
     cola y se sirve OTRA variante, para que el nino razone de nuevo en vez de
     recordar que boton pulso.

     Garantias:
       1. Se agotan TODAS las variantes antes de reutilizar ninguna.
       2. Al reiniciar el ciclo nunca se repite la ultima servida, asi que es
          imposible ver la misma pregunta dos veces seguidas.
       3. `tries` cuenta los intentos reales de la familia (no se reinicia con
          el ciclo de variantes), asi que "acierto al primer intento" y las
          estrellas siguen siendo correctos por muchas vueltas que de.
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
        '<div id="heroSprite">' + heroSVG('idle') + '</div>' +
        '<div>' +
          '<h1>' + UI.brand + '</h1>' +
          '<p>' + esc(DATA.meta.year) + ' &middot; ' + esc(DATA.meta.subject) + ' &middot; ' + esc(DATA.meta.topic) + '</p>' +
        '</div>' +
      '</header>' +

      /* MAP */
      '<section id="scrMap" class="screen is-on">' +
        '<div class="pixel-box hud">' +
          '<div class="hud__group">' +
            '<span class="hud__stat">' + UI.map.statXP + ' <b id="mapXP">0</b></span>' +
            '<span class="hud__stat">' + UI.map.statLevels + ' <b id="mapDone">0/0</b></span>' +
          '</div>' +
          '<div class="hud__group">' +
            '<button class="btn btn--ghost" id="btnHero" type="button">' + UI.hero.btnHero + '</button>' +
            '<button class="btn btn--ghost" id="btnArm" type="button">' + UI.hero.btnArmoury + '</button>' +
            '<button class="btn btn--ghost" id="btnMusic" type="button"></button>' +
            '<button class="btn btn--ghost" id="btnSound" type="button"></button>' +
            '<button class="btn btn--ghost" id="btnReset" type="button">' + UI.map.btnReset + '</button>' +
          '</div>' +
        '</div>' +
        '<p class="text-dim" style="font-size:15px">' + UI.map.intro + '</p>' +
        '<div class="levels" id="levelList"></div>' +
        '<div id="allDone"></div>' +
      '</section>' +

      /* HERO — primer arranque de cualquier materia */
      '<section id="scrHero" class="screen">' +
        '<div class="pixel-box brief">' +
          '<h2>' + UI.hero.title + '</h2>' +
          '<p class="text-dim" style="font-size:15px">' + UI.hero.intro + '</p>' +
          '<div class="hero-pick" id="heroPick" role="radiogroup" aria-label="' + UI.hero.title + '"></div>' +
          '<h3 class="mt-lg">' + UI.hero.aliasTitle + '</h3>' +
          '<p class="text-dim" style="font-size:14px">' + UI.hero.aliasHelp + '</p>' +
          '<div class="row mt">' +
            '<label class="sr-only" for="heroAlias">' + UI.hero.aliasLabel + '</label>' +
            '<input id="heroAlias" class="field" type="text" maxlength="' + ALIAS_MAX + '" ' +
              'autocomplete="off" autocorrect="off" spellcheck="false">' +
            '<button class="btn btn--ghost" id="heroDice" type="button">' + UI.hero.aliasDice + '</button>' +
          '</div>' +
          '<div class="row row--end mt-lg">' +
            '<button class="btn btn--ghost" id="heroArm" type="button">' + UI.hero.btnArmoury + '</button>' +
            '<button class="btn btn--primary" id="heroGo" type="button">' + UI.hero.btnStart + '</button>' +
          '</div>' +
        '</div>' +
      '</section>' +

      /* ARMERIA */
      '<section id="scrArm" class="screen">' +
        '<div class="pixel-box brief">' +
          '<h2>' + UI.armoury.title + '</h2>' +
          '<p class="text-dim" style="font-size:15px">' + UI.armoury.intro + '</p>' +
          '<div class="armoury">' +
            '<div id="armRows"></div>' +
            '<div class="armoury__preview">' +
              '<span class="armoury__tag">' + UI.armoury.preview + '</span>' +
              '<div id="armPreview"></div>' +
            '</div>' +
          '</div>' +
          '<div class="row row--end mt-lg">' +
            '<button class="btn btn--primary" id="armDone" type="button">' + UI.armoury.btnDone + '</button>' +
          '</div>' +
        '</div>' +
      '</section>' +

      /* BRIEFING */
      '<section id="scrBrief" class="screen">' +
        '<div class="pixel-box brief" id="briefBody"></div>' +
        '<div class="row row--end mt">' +
          '<button class="btn btn--ghost" id="briefBack" type="button">' + UI.brief.back + '</button>' +
          '<button class="btn btn--primary" id="briefGo" type="button">' + UI.brief.start + '</button>' +
        '</div>' +
      '</section>' +

      /* PLAY */
      '<section id="scrPlay" class="screen">' +
        '<div class="pixel-box hud">' +
          '<div class="mate">' +
            '<div class="mate__sprite" id="mateSprite"></div>' +
            '<div class="mate__msg" id="mateMsg"></div>' +
          '</div>' +
          '<div class="hud__group" style="flex:1">' +
            '<span class="hud__stat" id="hudLvl"></span>' +
            '<div class="bar"><div class="bar__fill" id="hudBar"></div></div>' +
            '<span class="hud__stat" id="hudCount">0/0</span>' +
          '</div>' +
          '<div class="hud__group">' +
            '<span class="hud__stat">' + UI.play.statXP + ' <b id="hudXP">0</b></span>' +
            '<span class="hud__stat">' + UI.play.statCombo + ' <b id="hudCombo">0</b></span>' +
          '</div>' +
        '</div>' +
        '<div class="pixel-box stage">' +
          '<div id="qTag" class="q-tag"></div>' +
          '<div id="qStem" class="q-stem"></div>' +
          '<div id="qSub" class="q-sub"></div>' +
          '<div id="qSeq" class="seq"></div>' +
          '<div id="qScene" class="scene-host" role="group" aria-label="' + UI.scene.groupLabel + '"></div>' +
          '<p id="qSay" class="sr-only" role="status" aria-live="polite"></p>' +
          '<div id="qHint" class="hint" role="note"></div>' +
          '<div class="row mt">' +
            '<button class="btn btn--ghost" id="btnHint" type="button">' + UI.play.btnHint + '</button>' +
            '<button class="btn btn--ghost" id="btnMusic2" type="button"></button>' +
            '<button class="btn btn--ghost" id="btnQuit" type="button">' + UI.play.btnQuit + '</button>' +
          '</div>' +
        '</div>' +
        '<div id="qFeed" class="pixel-box feedback" role="status" aria-live="polite"></div>' +
        '<div class="row row--end mt"><button class="btn btn--primary" id="btnNext" type="button" style="display:none"></button></div>' +
      '</section>' +

      /* WIN */
      '<section id="scrWin" class="screen">' +
        '<div class="pixel-box victory" id="winBody"></div>' +
      '</section>' +

      '<footer>' + UI.brand + '</footer>' +
    '</div>' +
    '<div class="combo" id="comboPop"></div>';

  var screens = {
    hero: el('scrHero'), arm: el('scrArm'), map: el('scrMap'),
    brief: el('scrBrief'), play: el('scrPlay'), win: el('scrWin')
  };
  function show(name) {
    Object.keys(screens).forEach(function (k) { screens[k].classList.toggle('is-on', k === name); });
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { /* jsdom / navegadores viejos */ }
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
        '<div class="level-card__num">' + (unlocked ? lv.id : UI.map.lockIcon) + '</div>' +
        '<div>' +
          '<div class="level-card__name">' + esc(lv.name) + '</div>' +
          '<div class="level-card__sub">' + esc(lv.subtitle) + '</div>' +
          '<div class="level-card__sub text-dim" style="margin-top:6px;font-size:13px">' +
            fmt(UI.map.cardMeta, { n: lv.id, count: lv.questions.length }) +
            (ls.done ? fmt(UI.map.cardBest, { xp: ls.best }) : '') +
          '</div>' +
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
    el('btnSound').textContent = STATE.sound ? UI.map.btnSoundOn : UI.map.btnSoundOff;
    el('btnMusic').textContent = STATE.music ? UI.map.btnMusicOn : UI.map.btnMusicOff;
    el('allDone').innerHTML = (done === DATA.levels.length)
      ? '<div class="pixel-box victory mt-lg"><h2>' + UI.map.allDone + '</h2>' +
        '<p>' + fmt(UI.map.allDoneBody, { test: esc(DATA.meta.test) }) + '</p></div>'
      : '';
  }

  /* ---------- HEROE Y ARMERIA ---------- */
  var armFrom = 'map';        // a donde vuelve DONE

  function refreshSprites() {
    paintAllHeroes();
    var h = el('heroSprite');
    if (h) h.innerHTML = heroSVG('idle');
  }

  function renderHeroPick() {
    var box = el('heroPick');
    box.innerHTML = '';
    [['a', UI.hero.bodyA], ['b', UI.hero.bodyB]].forEach(function (p) {
      var on = HERO.body === p[0];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hero-card' + (on ? ' is-on' : '');
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.setAttribute('aria-label', fmt(UI.hero.pickAria, { name: p[1] }));
      b.innerHTML = '<span class="hero-card__art">' + heroSVG('idle', { body: p[0] }) + '</span>' +
                    '<span class="hero-card__name">' + p[1] + '</span>';
      b.addEventListener('click', function () {
        HERO.body = p[0]; saveHero(); SFX.click();
        renderHeroPick(); refreshSprites();
      });
      box.appendChild(b);
    });
  }

  var PIECES = [
    { key: 'helm',  label: UI.armoury.pieceHelm },
    { key: 'body',  label: UI.armoury.pieceBody },
    { key: 'glove', label: UI.armoury.pieceGlove },
    { key: 'boot',  label: UI.armoury.pieceBoot }
  ];

  function updateArmPreview() {
    var p = el('armPreview');
    if (p) p.innerHTML = heroSVG('idle').replace('class="avatar"', 'class="avatar avatar--lg avatar--bob"');
  }

  function renderArmoury(focusRow, focusCol) {
    var rows = el('armRows');
    rows.innerHTML = '';
    PIECES.forEach(function (p, ri) {
      var row = document.createElement('div');
      row.className = 'arm-row';
      var lab = document.createElement('span');
      lab.className = 'arm-row__label';
      lab.textContent = p.label;
      var strip = document.createElement('div');
      strip.className = 'arm-row__strip';
      UI.armoury.colours.forEach(function (c, ci) {
        var on = HERO.colors[p.key] === c.value;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'swatch' + (on ? ' is-on' : '');
        b.style.background = c.value;
        b.setAttribute('data-piece', p.key);
        b.setAttribute('data-row', String(ri));
        b.setAttribute('data-col', String(ci));
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.setAttribute('aria-label', fmt(UI.armoury.swatchAria, { piece: p.label, colour: c.name }));
        b.addEventListener('click', function () {
          HERO.colors[p.key] = c.value; saveHero(); SFX.click();
          renderArmoury(ri, ci); refreshSprites();
        });
        strip.appendChild(b);
      });
      row.appendChild(lab);
      row.appendChild(strip);
      rows.appendChild(row);
    });
    updateArmPreview();
    if (focusRow != null) {
      var again = rows.querySelector('.swatch[data-row="' + focusRow + '"][data-col="' + focusCol + '"]');
      if (again) again.focus();
    }
  }

  /* Flechas entre muestras; Enter/Espacio los aplica el propio <button>. */
  el('armRows').addEventListener('keydown', function (e) {
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains('swatch')) return;
    var r = parseInt(t.getAttribute('data-row'), 10);
    var c = parseInt(t.getAttribute('data-col'), 10);
    var nr = r, nc = c, n = UI.armoury.colours.length;
    if (e.key === 'ArrowRight')     nc = Math.min(n - 1, c + 1);
    else if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1);
    else if (e.key === 'ArrowDown') nr = Math.min(PIECES.length - 1, r + 1);
    else if (e.key === 'ArrowUp')   nr = Math.max(0, r - 1);
    else return;
    e.preventDefault();
    var next = el('armRows').querySelector('.swatch[data-row="' + nr + '"][data-col="' + nc + '"]');
    if (next) next.focus();
  });

  function openHero() {
    el('heroAlias').value = HERO.alias || '';
    renderHeroPick();
    show('hero');
  }
  function openArmoury(from) {
    armFrom = from;
    renderArmoury();
    show('arm');
  }

  el('heroDice').addEventListener('click', function () {
    SFX.click();
    el('heroAlias').value = (pick(UI.hero.aliasWordsA) + ' ' + pick(UI.hero.aliasWordsB)).slice(0, ALIAS_MAX);
  });
  el('heroGo').addEventListener('click', function () {
    // Solo se guarda el alias que el nino escribio. Nunca sale del navegador.
    HERO.alias = String(el('heroAlias').value || '').trim().slice(0, ALIAS_MAX);
    HERO.chosen = true;
    saveHero(); SFX.click();
    refreshSprites(); renderMap(); show('map');
  });
  el('heroArm').addEventListener('click', function () { SFX.click(); openArmoury('hero'); });
  el('armDone').addEventListener('click', function () {
    SFX.click();
    if (armFrom === 'hero') { renderHeroPick(); show('hero'); }
    else { renderMap(); show('map'); }
  });
  el('btnHero').addEventListener('click', function () { SFX.click(); openHero(); });
  el('btnArm').addEventListener('click', function () { SFX.click(); openArmoury('map'); });

  /* ---------- BRIEFING ---------- */
  var currentIdx = 0, run = null;

  function openBrief(idx) {
    currentIdx = idx;
    var lv = DATA.levels[idx];
    el('briefBody').innerHTML =
      '<div class="q-tag">' + fmt(UI.brief.tag, { n: lv.id }) + '</div>' +
      '<h2>' + esc(lv.name) + '</h2>' +
      heroText(lv.briefing.join(''));
    show('brief');
  }

  el('briefBack').addEventListener('click', function () { SFX.click(); renderMap(); show('map'); });
  el('briefGo').addEventListener('click', function () { SFX.click(); startLevel(currentIdx); });

  /* ---------- PLAY ---------- */
  var q = null, locked = false, scene = null;

  function announce(text) {
    var n = el('qSay');
    if (n) n.textContent = text || '';
  }

  /* Monta la escena de la familia. `mech` ausente => `doors`, que es tambien
     el fallback de cualquier mecanica no implementada todavia. */
  function mountScene(mech, variant, order) {
    if (scene) { scene.destroy(); scene = null; }
    var factory = SCENES[mech] || SCENES.doors;
    scene = factory();
    scene.mount(el('qScene'), {
      variant: variant,
      order: order,
      keys: KEYS,
      pick: function (origIdx) { answer(origIdx); },
      say: announce
    });
  }

  function startLevel(idx) {
    var lv = DATA.levels[idx];
    run = new Runner(lv);
    el('hudLvl').textContent = fmt(UI.play.levelTag, { n: lv.id });
    setMate('idle', UI.mate.start);
    if (STATE.music) MUSIC.start();
    show('play');
    nextQuestion();
  }

  function nextQuestion() {
    if (!run.queue.length) return winLevel();
    q = run.current();
    locked = false;

    el('qTag').textContent = q.family.skill.toUpperCase().replace(/-/g, ' ');
    el('qStem').innerHTML = heroText(q.v.stem);
    el('qSub').innerHTML = heroText(q.v.sub || '');
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

    // Escena: las opciones se barajan siempre y la escena las convierte en
    // casillas por las que el heroe se mueve. Moverse ES responder.
    var order = shuffle(q.v.options.map(function (_, i) { return i; }));
    mountScene(q.family.mech, q.v, order);

    // Andamiaje: si ya fallo esta familia antes, la pista aparece sola.
    // Pero DESPUES de la animacion, para que el nino la vea (PLAN-V2 §6.2).
    var retry = q.tries > 1;
    el('qHint').className = 'hint';
    el('qHint').innerHTML = (retry ? UI.play.hintRetry : UI.play.hintLabel)
      + heroText(q.v.hint || UI.play.hintFallback);
    el('btnHint').style.display = retry ? 'none' : 'inline-block';
    el('qFeed').className = 'pixel-box feedback';
    el('btnNext').style.display = 'none';
    setMate('idle', run.combo >= 3 ? fmt(UI.mate.combo, { n: run.combo })
                                   : (retry ? UI.mate.retry : UI.mate.turn));
    updateHUD();
    // El andamiaje automatico usa exactamente el mismo disparador que el boton.
    if (retry) setTimeout(summonHint, 220);
  }

  /* Invocar la calculadora magica. Unico camino a la pista: lo llaman tanto
     el boton HINT como el andamiaje del reintento. Con reduced-motion se salta
     a la fase final y el panel abre ya. */
  function summonHint() {
    var panel = el('qHint');
    if (!panel) return;
    var box = el('mateSprite');
    var reduced = false;
    try {
      reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { /* navegador viejo */ }

    if (!box || reduced) { panel.classList.add('is-on'); return; }

    SFX.summon();
    MUSIC.duck(1200);
    box.innerHTML = heroSVG('summon');
    var sprite = box.querySelector('.avatar');
    if (sprite) sprite.classList.add('avatar--summon');
    var m = el('mateMsg');
    if (m) m.className = 'mate__msg';
    // 0.9 s: alzar (0-0.3) + destello (0.3-0.5) + aparicion (0.5-0.9).
    setTimeout(function () { panel.classList.add('is-on'); }, 900);
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

  function answer(chosen) {
    if (locked) return;
    locked = true;
    var correct = (chosen === q.v.answer);

    // La escena pinta el resultado: ilumina la correcta, marca la elegida y
    // devuelve al heroe al inicio del tramo si fallo.
    if (scene) scene.markResult(q.v.answer, chosen);

    var fb = el('qFeed');
    if (correct) {
      SFX.right();
      MUSIC.duck(900);
      run.resolve(true);
      if (run.combo > (STATE.bestComboEver || 0)) { STATE.bestComboEver = run.combo; save(); }
      setMate('happy', run.combo >= 3 ? fmt(UI.mate.comboPop, { n: run.combo }) : pick(UI.mate.cheers), 'is-good');
      if (run.combo >= 3) popCombo(fmt(UI.mate.comboPop, { n: run.combo }));
      fb.className = 'pixel-box feedback is-on feedback--good';
      fb.innerHTML = '<div class="feedback__title">' + UI.play.goodTitle + '</div>' +
                     '<div class="feedback__body">' + heroText(q.v.explain) + '</div>';
    } else {
      SFX.wrong();
      MUSIC.duck(900);
      run.resolve(false);
      setMate('sad', pick(UI.mate.consoles), 'is-bad');
      fb.className = 'pixel-box feedback is-on feedback--bad';
      fb.innerHTML = '<div class="feedback__title">' + UI.play.badTitle + '</div>' +
                     '<div class="feedback__body">' + heroText(q.v.explain) +
                     '<p style="margin-top:12px;color:var(--warn)">' + UI.play.badNote + '</p></div>';
    }
    el('btnHint').style.display = 'none';
    el('btnNext').style.display = 'inline-block';
    el('btnNext').innerHTML = run.queue.length ? UI.play.btnNext : UI.play.btnFinish;
    el('btnNext').focus();
    updateHUD();
  }

  el('btnNext').addEventListener('click', function () { SFX.click(); nextQuestion(); });
  el('btnHint').addEventListener('click', function () { SFX.click(); summonHint(); });
  el('btnQuit').addEventListener('click', function () {
    if (window.confirm(UI.play.confirmQuit)) { renderMap(); show('map'); }
  });

  /* ---------- TECLADO ----------
     Flechas mueven una casilla. Enter/Espacio cruza la casilla actual.
     A-D / 1-4 saltan directo a una puerta y la cruzan (atajo de v1: sirve
     para lectores de pantalla y para quien prefiera no caminar).
     Nada se mantiene pulsado, nada depende de repeticion de tecla. */
  document.addEventListener('keydown', function (e) {
    if (!screens.play.classList.contains('is-on')) return;

    var nextVisible = el('btnNext').style.display !== 'none';
    if ((e.key === 'Enter' || e.key === ' ') && nextVisible) {
      e.preventDefault(); el('btnNext').click(); return;
    }
    if (!scene || locked) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); scene.move(1);  return; }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); scene.move(-1); return; }
    if (e.key === 'Enter' || e.key === ' ')              { e.preventDefault(); scene.confirm(); return; }

    var k = e.key.toUpperCase();
    var idx = KEYS.indexOf(k);
    if (idx === -1 && /^[1-5]$/.test(k)) idx = parseInt(k, 10) - 1;
    if (idx === -1) return;
    e.preventDefault();
    scene.jump(idx);
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
    // Historial: ultimas 5 partidas de este nivel (lo consume la Fase 3).
    ls.history.push({ xp: run.xp, first: run.firstTry, misses: run.misses, combo: run.bestCombo, at: Date.now() });
    if (ls.history.length > 5) ls.history = ls.history.slice(-5);
    if (run.bestCombo > (STATE.bestComboEver || 0)) STATE.bestComboEver = run.bestCombo;
    save();

    SFX.level();
    MUSIC.duck(2600);
    var nextLv = DATA.levels[currentIdx + 1];
    el('winBody').innerHTML =
      '<div style="display:flex;justify-content:center">' + heroSVG('happy').replace('class="avatar"', 'class="avatar avatar--lg avatar--bob"') + '</div>' +
      '<h2>' + fmt(UI.win.title, { n: lv.id }) + '</h2>' +
      '<div class="stars">' + starStr(stars) + '</div>' +
      '<div class="victory__stats">' +
        '<div><span>' + UI.win.statXP     + '</span>' + run.xp + '</div>' +
        '<div><span>' + UI.win.statFirst  + '</span>' + run.firstTry + '/' + run.total + '</div>' +
        '<div><span>' + UI.win.statCombo  + '</span>' + run.bestCombo + '</div>' +
        '<div><span>' + UI.win.statMisses + '</span>' + run.misses + '</div>' +
      '</div>' +
      '<p class="text-dim" style="font-size:15px">' +
        (stars === 3 ? UI.win.verdict3 : stars === 2 ? UI.win.verdict2 : UI.win.verdict1) +
      '</p>' +
      (nextLv && wasNew
        ? '<p class="mt" style="color:var(--good);font-family:var(--font-ui);font-size:11px">' +
          fmt(UI.win.unlocked, { n: nextLv.id, name: esc(nextLv.name) }) + '</p>'
        : '') +
      '<div class="row mt-lg" style="justify-content:center">' +
        '<button class="btn btn--ghost" id="winReplay" type="button">' + UI.win.btnReplay + '</button>' +
        '<button class="btn btn--primary" id="winMap" type="button">' + UI.win.btnMap + '</button>' +
      '</div>';

    if (nextLv && wasNew) setTimeout(SFX.unlock, 700);

    el('winReplay').addEventListener('click', function () { SFX.click(); startLevel(currentIdx); });
    el('winMap').addEventListener('click', function () { SFX.click(); renderMap(); show('map'); });
    show('win');
  }

  /* ---------- MAP CONTROLS ---------- */
  el('btnSound').addEventListener('click', function () {
    STATE.sound = !STATE.sound; save(); SFX.click();
    el('btnSound').textContent = STATE.sound ? UI.map.btnSoundOn : UI.map.btnSoundOff;
  });

  function toggleMusic() {
    STATE.music = !STATE.music;
    save();
    if (STATE.music) MUSIC.start(); else MUSIC.stop();
    el('btnMusic').textContent = STATE.music ? UI.map.btnMusicOn : UI.map.btnMusicOff;
    el('btnMusic2').textContent = fmt(UI.play.btnMusic, { state: onOff(STATE.music) });
  }
  el('btnMusic').addEventListener('click', toggleMusic);
  el('btnMusic2').addEventListener('click', toggleMusic);
  el('btnMusic2').textContent = fmt(UI.play.btnMusic, { state: onOff(STATE.music) });

  // Los navegadores solo permiten audio tras una interaccion del usuario.
  document.addEventListener('click', function once() {
    document.removeEventListener('click', once);
    if (STATE.music) MUSIC.start();
  });

  // Silencia si el jugador cambia de pestana.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) MUSIC.stop();
    else if (STATE.music) MUSIC.start();
  });
  el('btnReset').addEventListener('click', function () {
    if (window.confirm(fmt(UI.map.confirmReset, { topic: DATA.meta.topic }))) {
      STATE = blankSave(); save(); renderMap();
    }
  });

  /* ---------- ARRANQUE ----------
     El heroe es transversal: si aun no se ha elegido en NINGUNA materia,
     lo primero que se ve es la pantalla HERO. */
  paintAllHeroes();
  refreshSprites();
  renderMap();
  if (!HERO.chosen) openHero(); else show('map');
})();
