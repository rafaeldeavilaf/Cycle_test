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
      levels: {}, totalXP: 0, sound: true, music: true, aula: false,
      skills: {}, bestComboEver: 0
    };
  }
  function migrate(s) {
    if (typeof s.totalXP !== 'number' || s.totalXP < 0) s.totalXP = 0;
    if (typeof s.music !== 'boolean') s.music = true;
    if (typeof s.sound !== 'boolean') s.sound = true;
    if (typeof s.aula !== 'boolean') s.aula = false;   // modo aula: sin decoracion ni animacion
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

     El personaje NO tiene nombre. Decision de Rafael: un nombre (el real o un
     alias) es la via mas facil de atribuirle genero, y el heroe es un avatar
     neutro que el nino viste, no un personaje con identidad propia. Por eso
     aqui no se guarda ningun texto libre: solo silueta y colores. */
  var HERO_KEY = 'samuel-quest:hero';

  function blankHero() {
    return {
      v: 1,
      body: 'a',
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
      // Un `alias` de una version anterior se ignora y desaparece al guardar.
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

  /* El contenido va en segunda persona y no lleva nombres. Si un data.js viejo
     trae el token {hero}, se sustituye por "you" para que nunca quede un hueco;
     el harness ademas falla si el token existe en el contenido publicado. */
  function heroText(s) {
    if (s == null) return '';
    return String(s).replace(/\{hero\}/g, UI.hero.you);
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

  /* ---------- MEDALLAS POR HABILIDAD ----------
     0 nada · 1 bronce · 2 plata · 3 oro.

     Antiinflacion (PLAN-V2 §4.3): plata y oro exigen aciertos al primer
     intento EN PARTIDAS DISTINTAS, no dentro de la misma. Por eso `firstHits`
     se incrementa como mucho una vez por partida, al terminar el nivel, y no
     en cada respuesta. Sin esta regla todo seria oro en dos semanas. */
  var MEDAL_SILVER = 3, MEDAL_GOLD = 5;

  function skillRec(tag) {
    var r = STATE.skills[tag];
    if (!r || typeof r !== 'object') { r = STATE.skills[tag] = { hits: 0, firstHits: 0 }; }
    if (typeof r.hits !== 'number' || r.hits < 0) r.hits = 0;
    if (typeof r.firstHits !== 'number' || r.firstHits < 0) r.firstHits = 0;
    return r;
  }
  function medalOf(tag) {
    var r = STATE.skills[tag];
    if (!r) return 0;
    if (r.firstHits >= MEDAL_GOLD) return 3;
    if (r.firstHits >= MEDAL_SILVER) return 2;
    if (r.hits >= 1) return 1;
    return 0;
  }
  function medalName(m) {
    return m === 3 ? UI.score.medalGold
         : m === 2 ? UI.score.medalSilver
         : m === 1 ? UI.score.medalBronze
         : UI.score.medalNone;
  }
  /* Todas las habilidades del juego, en el orden en que aparecen. */
  function allSkills() {
    var seen = {}, out = [];
    DATA.levels.forEach(function (lv) {
      lv.questions.forEach(function (f) {
        if (!seen[f.skill]) { seen[f.skill] = true; out.push(f.skill); }
      });
    });
    return out;
  }
  function skillLabel(tag) { return String(tag).toUpperCase().replace(/-/g, ' '); }

  /* Progreso total: familias cuya habilidad ya tiene medalla (>= bronce). */
  function progressTotals() {
    var done = 0, total = 0;
    DATA.levels.forEach(function (lv) {
      lv.questions.forEach(function (f) {
        total++;
        if (medalOf(f.skill) >= 1) done++;
      });
    });
    return { done: done, total: total, pct: total ? Math.round(done / total * 100) : 0 };
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
  /* Las dos siluetas tienen que distinguirse A SIMPLE VISTA y en miniatura.
     En la primera version se diferenciaban en 5 pixeles de pelo lateral y en
     pantalla parecian el mismo personaje: elegir dejaba de ser una eleccion.
     Ahora 'a' lleva el pelo corto al ras y 'b' una melena que baja hasta los
     hombros, con una segunda capa mas ancha. */
  var BODIES = {
    a: {
      hair:  'M4 1h9v2H4z M4 2h9v2H4z M3 2h1v3H3z M13 2h1v3h-1z',
      torso: 'M5 12h7v6H5z',
      boots: 'M5 18h3v2H5z M9 18h3v2H9z'
    },
    b: {
      hair:  'M4 1h9v2H4z M4 2h9v2H4z' +                 // corona
             ' M3 2h1v11H3z M13 2h1v11h-1z' +            // melena hasta el hombro
             ' M2 4h1v9H2z M14 4h1v9h-1z',               // segunda capa, mas ancha
      torso: 'M5 12h7v3H5z M6 15h5v3H6z',
      boots: 'M6 18h2v2H6z M9 18h2v2H9z'
    }
  };

  /* Brazos y manos van separados: en v1 los brazos llevaban el color del
     torso y no habia guantes que pintar. */
  /* Las manos ocupan 2 pixeles de alto, no 1: con uno solo, pintar los guantes
     en la armeria no se notaba y la pieza parecia rota. */
  var LIMBS = {
    idle:   { arms: 'M3 13h2v2H3z M12 13h2v2h-2z', hands: 'M3 15h2v2H3z M12 15h2v2h-2z' },
    happy:  { arms: 'M3 10h2v3H3z M12 10h2v3h-2z', hands: 'M3 8h2v2H3z M12 8h2v2h-2z'   },
    sad:    { arms: 'M3 14h2v2H3z M12 14h2v2h-2z', hands: 'M3 16h2v2H3z M12 16h2v2h-2z' },
    // summon: brazo derecho vertical, el izquierdo en reposo (PLAN-V2 §6.2).
    summon: { arms: 'M3 13h2v2H3z M12 8h2v5h-2z',  hands: 'M3 15h2v2H3z M12 6h2v2h-2z'  }
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
      // Parallax: el lugar sabe donde esta el heroe dentro del tramo (0..1).
      if (ctx && ctx.onStep) ctx.onStep(cursor < 0 ? 0 : (cursor + 1) / (slots.length + 1));
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
          '</div>';
        container.innerHTML = html;
        if (ctx.help) ctx.help(stacked ? UI.scene.helpStacked : UI.scene.help, stacked);

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
        this.setMood('idle');
        place();
      },

      /* El heroe de la escena es el unico animado del juego: respira en reposo,
         celebra al acertar, se hunde al fallar e invoca la calculadora. */
      setMood: function (m) {
        if (!heroEl) return;
        heroEl.innerHTML = heroSVG(m || 'idle');
        var a = heroEl.querySelector('.avatar');
        if (!a) return;
        if (m === 'happy')       a.classList.add('avatar--cheer');
        else if (m === 'sad')    a.classList.add('avatar--down');
        else if (m === 'summon') a.classList.add('avatar--summon');
        else                     a.classList.add('avatar--bob');
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
          // Playtest H2: el heroe SE QUEDA en la puerta roja. Volver al inicio se
          // leia como castigo (Tomas, el jugador mas fragil) y era puramente
          // cosmetico: la pregunta ya esta resuelta. La cara la pone setMate().
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

  /* El mensaje va al HUD; la REACCION va al heroe de la escena, que es el que
     el nino esta mirando porque es el que mueve. */
  function setMate(mood, msg, cls) {
    var m = el('mateMsg');
    if (m) { m.textContent = msg || ''; m.className = 'mate__msg' + (cls ? ' ' + cls : ''); }
    if (scene && scene.setMood) scene.setMood(mood);
  }

  /* ---------- ENV: el LUGAR detras de la escena ----------
     Hermano de SCENES, no parte de el: la escena pinta opciones y no sabe
     que lugar hay detras; ENV pinta el lugar y no sabe que mecanica hay
     encima. Un nivel declara `env` en data.js:

       env: { palette:{...}, materials:{wall,floor}, far:[...], wall:[...],
              fg:[...], gate:'gate', transition:'slide' }

     Los props vienen de assets/props.js (window.GAME_PROPS) por id. Aqui
     NO hay nombres de lugares: el lugar es la combinacion. Sin `env`, el
     nivel se ve como antes: cualquier data.js existente sigue valiendo.
  ---------------------------------------------------- */
  var ENV = (function () {
    var LIB   = window.GAME_PROPS || { props: {}, materials: {} };
    var host = null, node = null, gateEl = null, active = false;

    /* Comillas SIMPLES: este url() va dentro de un atributo style="..." con
       comillas dobles. Con dobles, el atributo se cortaba en `url(` y ningun
       material se pintaba. Lo encontro el harness. Las simples del SVG van
       codificadas como %27, asi que dentro no queda ninguna. */
    function uri(svg) {
      return "url('data:image/svg+xml," + encodeURIComponent(svg).replace(/'/g, '%27') + "')";
    }
    function propSVG(id, o, xOverride) {
      var p = LIB.props[id];
      if (!p) return '';
      var body = p.layers.map(function (L) {
        return '<path fill="' + L[0] + '"' + (L[2] ? ' class="' + L[2] + '"' : '') + ' d="' + L[1] + '"/>';
      }).join('');
      var sc = o.scale || 1;
      var x = xOverride != null ? xOverride : (o.x != null ? o.x : 50);
      var style = 'left:' + x + '%;width:' + Math.round(p.w * 3 * sc) + 'px;height:' + Math.round(p.h * 3 * sc) + 'px;' +
        (o.y === 'top' ? 'top:' + (o.top != null ? o.top : 4) + '%;' : 'bottom:' + (o.bottom != null ? o.bottom : 0) + '%;');
      return '<svg class="prop prop--' + id + '" viewBox="' + p.vb + '" shape-rendering="crispEdges" aria-hidden="true" style="' + style + '">' + body + '</svg>';
    }
    function layer(cls, items, style) {
      var out = '';
      (items || []).forEach(function (o) {
        if (o.repeat > 1) {
          // N copias repartidas a lo ancho (almenas, estalactitas).
          for (var i = 0; i < o.repeat; i++) out += propSVG(o.prop, o, Math.round((i + 0.5) * 100 / o.repeat));
        } else out += propSVG(o.prop, o);
      });
      // Los props van en un contenedor interior: es el que se desplaza (parallax);
      // el material queda en la capa y se desplaza por background-position.
      return '<div class="env__layer ' + cls + '"' + (style ? ' style="' + style + '"' : '') + '>' +
               '<div class="env__props">' + out + '</div></div>';
    }
    function material(which, id) {
      var m = LIB.materials[id];
      if (!m) return '';
      return 'background-image:linear-gradient(var(--env-' + which + '),var(--env-' + which + ')),' + uri(m.svg) +
             ';background-size:auto,' + (m.w * 2) + 'px ' + (m.h * 2) + 'px;';
    }

    return {
      mount: function (hostEl, env) {
        this.destroy();
        host = hostEl;
        if (!env || !host) { active = false; return; }
        active = true;
        var pal = env.palette || {};
        // Las variables van en el HOST, no en .env: las puertas de la escena
        // (hermana de .env) tambien las necesitan para vestirse del lugar.
        host.style.cssText = Object.keys(pal).map(function (k) { return '--env-' + k + ':' + pal[k]; }).join(';');
        var mats = env.materials || {};
        node = document.createElement('div');
        node.className = 'env';
        node.setAttribute('aria-hidden', 'true');
        node.innerHTML =
          '<div class="env__layer env__sky"></div>' +
          layer('env__far', env.far) +
          layer('env__wall', env.wall, material('wall', mats.wall)) +
          '<div class="env__layer env__floor" style="' + material('floor', mats.floor) + '"></div>' +
          layer('env__fg', env.fg);
        if (env.gate) {
          var far = node.querySelector('.env__far .env__props');
          // A escala 0.5 cabe en la franja de cielo aun cuando --gs llega a 1.
          far.insertAdjacentHTML('beforeend', propSVG(env.gate, { x: 90, scale: 0.5 }));
          gateEl = far.lastElementChild;
          gateEl.classList.add('env__gate');
        }
        host.insertBefore(node, host.firstChild);
        host.classList.add('has-env');
      },
      /* Desliza el lugar un tramo: la animacion es CSS por cambio de clase.
         Se re-dispara quitando y poniendo la clase. Sin temporizadores. */
      shift: function () {
        if (!node) return;
        node.classList.remove('is-shift');
        void node.offsetWidth;
        node.classList.add('is-shift');
      },
      /* 0..1: donde esta el heroe dentro del tramo. Las capas lejanas se
         mueven menos que las cercanas: profundidad con una sola variable. */
      parallax: function (f) {
        if (node) node.style.setProperty('--hx', String(Math.max(0, Math.min(1, f))));
      },
      /* 0..1: tramos superados. La puerta del jefe se acerca. */
      progress: function (f) {
        if (gateEl) gateEl.style.setProperty('--gs', String((0.45 + 0.55 * Math.max(0, Math.min(1, f))).toFixed(3)));
      },
      stacked: function (on) {
        if (host) host.classList.toggle('is-stacked', !!on);
      },
      isActive: function () { return active; },
      destroy: function () {
        if (node && node.parentNode) node.parentNode.removeChild(node);
        if (host) { host.classList.remove('has-env', 'is-stacked'); host.style.cssText = ''; }
        node = null; gateEl = null; active = false;
      }
    };
  })();

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

    // Puntuacion v2: para el tope de estrellas y para las medallas.
    this.famFails = {};     // familia -> fallos en esta partida
    this.maxFamFails = 0;   // el peor atasco de la partida
    this.hitSkills = {};    // skill -> acertada alguna vez en ESTA partida
    this.firstSkills = {};  // skill -> acertada al primer intento en ESTA partida
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
    var skill = this.level.questions[fi].skill;
    this.attempts++;
    if (correct) {
      this.cleared++;
      this.combo++;
      if (this.combo > this.bestCombo) this.bestCombo = this.combo;
      var base = 100;
      var bonus = Math.min(this.combo, 8) * 20;
      this.xp += base + bonus;
      this.hitSkills[skill] = true;
      if (this.tries[fi] === 1) { this.firstTry++; this.firstSkills[skill] = true; }
      this.answered[fi] = true;
    } else {
      this.misses++;
      this.combo = 0;
      this.famFails[fi] = (this.famFails[fi] || 0) + 1;
      if (this.famFails[fi] > this.maxFamFails) this.maxFamFails = this.famFails[fi];
      this.queue.push(fi);   // al final de la cola, con otra variante
    }
  };
  Runner.prototype.progress = function () { return this.cleared / this.total; };
  /* Estrellas = aciertos al primer intento, con UN tope.

     El tope existe porque la media miente: con 16 familias, atascarse siete
     veces en una sola cuesta 1/16 y seguia dando 3 estrellas. El criterio del
     proyecto es explicito: "no domina = falla la misma familia 3 veces". Tres
     estrellas tienen que significar que domina el nivel entero, no 15/16 de el.
     Lo encontro el harness jugando, no leyendo el codigo. */
  Runner.prototype.STUCK_AT = 3;
  Runner.prototype.stars = function () {
    var acc = this.firstTry / this.total;
    var s = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
    if (this.stuck() && s > 2) s = 2;
    return s;
  };
  Runner.prototype.stuck = function () { return this.maxFamFails >= this.STUCK_AT; };
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
            '<button class="btn btn--ghost" id="btnProf" type="button">' + UI.score.btnProfile + '</button>' +
            '<button class="btn btn--ghost" id="btnHero" type="button">' + UI.hero.btnHero + '</button>' +
            '<button class="btn btn--ghost" id="btnArm" type="button">' + UI.hero.btnArmoury + '</button>' +
            '<button class="btn btn--ghost" id="btnMusic" type="button"></button>' +
            '<button class="btn btn--ghost" id="btnSound" type="button"></button>' +
            '<button class="btn btn--ghost" id="btnAula" type="button"></button>' +
            '<button class="btn btn--ghost" id="btnReset" type="button">' + UI.map.btnReset + '</button>' +
          '</div>' +
        '</div>' +
        '<p class="text-dim" style="font-size:15px">' + UI.map.intro + '</p>' +
        '<div id="mapProgress"></div>' +
        '<div class="levels" id="levelList"></div>' +
        '<div id="allDone"></div>' +
      '</section>' +

      /* HERO — primer arranque de cualquier materia */
      '<section id="scrHero" class="screen">' +
        '<div class="pixel-box brief">' +
          '<h2>' + UI.hero.title + '</h2>' +
          '<p class="text-dim" style="font-size:15px">' + UI.hero.intro + '</p>' +
          '<div class="hero-pick" id="heroPick" role="radiogroup" aria-label="' + UI.hero.title + '"></div>' +
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
          '<p class="text-accent" id="armUnlock" style="font-size:14px"></p>' +
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

      /* PERFIL */
      '<section id="scrProf" class="screen">' +
        '<div class="pixel-box brief" id="profBody"></div>' +
        '<div class="row row--end mt">' +
          '<button class="btn btn--primary" id="profBack" type="button">' + UI.score.btnBack + '</button>' +
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
          // Sin sprite aqui: el heroe de la escena es el unico que se anima.
          // Tener tres copias del personaje en pantalla repartia la atencion y
          // dejaba estatico justo al que toma la decision.
          '<div class="mate"><div class="mate__msg" id="mateMsg"></div></div>' +
          '<div class="hud__group" style="flex:1">' +
            '<span class="hud__stat" id="hudLvl"></span>' +
            // El propio camino es la barra: un tramo por familia.
            '<div class="bar path" id="hudPath" aria-hidden="true"></div>' +
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
          // qWorld: el lugar (ENV) detras; qScene: la escena delante.
          '<div id="qWorld" class="world">' +
            '<div id="qScene" class="scene-host" role="group" aria-label="' + UI.scene.groupLabel + '"></div>' +
          '</div>' +
          '<p id="qHelp" class="scene__help"></p>' +
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
    hero: el('scrHero'), arm: el('scrArm'), map: el('scrMap'), prof: el('scrProf'),
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

  /* Marca personal del nivel. Si la mejor partida sigue en el historial se
     anade cuantas acerto al primer intento; si es mas vieja que las ultimas 5,
     solo el XP. Nunca se inventa un dato que no se tiene. */
  function bestLine(ls, lv) {
    var bestRun = null;
    ls.history.forEach(function (h) { if (!bestRun || h.xp > bestRun.xp) bestRun = h; });
    if (bestRun && bestRun.xp === ls.best) {
      return fmt(UI.score.cardBestLine, { xp: ls.best, first: bestRun.first, total: lv.questions.length });
    }
    return fmt(UI.map.cardBest, { xp: ls.best }).replace(/^\s*&middot;\s*/, '');
  }

  function progressBox() {
    var pr = progressTotals();
    return '<div class="progress">' +
      '<div class="progress__head">' +
        '<span>' + UI.score.progressLabel + '</span>' +
        '<span>' + fmt(UI.score.progressBar, { done: pr.done, total: pr.total }) + '</span>' +
      '</div>' +
      '<div class="bar"><div class="bar__fill" style="width:' + pr.pct + '%"></div></div>' +
    '</div>';
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
            (ls.done ? ' &middot; ' + bestLine(ls, lv) : '') +
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
    el('mapProgress').innerHTML = progressBox();
    el('btnSound').textContent = STATE.sound ? UI.map.btnSoundOn : UI.map.btnSoundOff;
    el('btnMusic').textContent = STATE.music ? UI.map.btnMusicOn : UI.map.btnMusicOff;
    el('btnAula').textContent  = STATE.aula ? UI.map.btnAulaOn : UI.map.btnAulaOff;
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

  /* Colores desbloqueados: 4 de salida + 1 por nivel superado con 2+ estrellas.
     Se calcula, no se guarda: si el nino mejora un nivel, aparece solo. */
  var BASE_COLOURS = 4;
  function masteredLevels() {
    var n = 0;
    DATA.levels.forEach(function (lv) { if (levelSave(lv.id).stars >= 2) n++; });
    return n;
  }
  function unlockedColours() {
    return Math.min(UI.armoury.colours.length, BASE_COLOURS + masteredLevels());
  }

  function updateArmPreview() {
    var p = el('armPreview');
    if (p) p.innerHTML = heroSVG('idle').replace('class="avatar"', 'class="avatar avatar--lg avatar--bob"');
  }

  function renderArmoury(focusRow, focusCol) {
    var rows = el('armRows');
    rows.innerHTML = '';
    var have = unlockedColours(), total = UI.armoury.colours.length;
    var line = el('armUnlock');
    if (line) line.innerHTML = have >= total ? fmt(UI.armoury.unlockAll, { total: total })
                                             : fmt(UI.armoury.unlockLine, { have: have, total: total });
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
        // Un color ya elegido (en otra materia, quiza) nunca se bloquea.
        var locked = ci >= have && !on;
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'swatch' + (on ? ' is-on' : '') + (locked ? ' is-locked' : '');
        b.style.background = c.value;
        b.setAttribute('data-piece', p.key);
        b.setAttribute('data-row', String(ri));
        b.setAttribute('data-col', String(ci));
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (locked) {
          var need = ci - have + 1;
          b.disabled = true;
          b.setAttribute('aria-label', fmt(UI.armoury.lockedAria, { piece: p.label, colour: c.name, n: need, s: need === 1 ? '' : 's' }));
          b.innerHTML = '<span class="swatch__lock" aria-hidden="true">&#128274;</span>';
        } else {
          b.setAttribute('aria-label', fmt(UI.armoury.swatchAria, { piece: p.label, colour: c.name }));
          b.addEventListener('click', function () {
            HERO.colors[p.key] = c.value; saveHero(); SFX.click();
            renderArmoury(ri, ci); refreshSprites();
          });
        }
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

  /* ---------- PERFIL ----------
     Todo lo que se ve aqui es del propio nino: su record, sus medallas, su
     historial. No hay nada de nadie mas, ni sale nada del navegador. */
  function renderProfile() {
    var html = '<h2>' + UI.score.title + '</h2>' + progressBox() +
      '<p class="text-dim mt">' + UI.score.bestCombo + ': <b class="text-accent">' + (STATE.bestComboEver || 0) + '</b></p>';

    var played = DATA.levels.some(function (lv) { return levelSave(lv.id).plays > 0; });
    if (!played) {
      html += '<p class="text-dim mt-lg">' + UI.score.noPlays + '</p>';
      el('profBody').innerHTML = html;
      return;
    }

    html += '<h3 class="mt-lg">' + UI.score.medalsTitle + '</h3>' +
            '<p class="text-dim" style="font-size:14px">' + UI.score.medalsHelp + '</p>' +
            '<div class="medal-list">';
    /* Solo las ganadas, de mas valor a menos. Listar tambien las 60 que aun
       no tiene convierte su vitrina en una lista de carencias. Las que faltan
       se cuentan en una linea. */
    var earned = allSkills()
      .map(function (tag) { return { tag: tag, medal: medalOf(tag) }; })
      .filter(function (x) { return x.medal > 0; })
      .sort(function (a, b) { return b.medal - a.medal; });
    earned.forEach(function (x) {
      html += '<span class="medal medal--' + x.medal + '">' +
        fmt(UI.score.medalLine, { skill: esc(skillLabel(x.tag)), medal: medalName(x.medal) }) + '</span>';
    });
    html += '</div>';
    var locked = allSkills().length - earned.length;
    if (locked > 0) {
      html += '<p class="text-dim mt" style="font-size:14px">' + fmt(UI.score.medalsLocked, { n: locked }) + '</p>';
    }

    html += '<h3 class="mt-lg">' + UI.score.historyTitle + '</h3>';
    DATA.levels.forEach(function (lv) {
      var ls = levelSave(lv.id);
      if (!ls.history.length) return;
      html += '<h4 class="prof-lv">' + fmt(UI.score.historyLevel, { n: lv.id }) + ' &middot; ' + esc(lv.name) + '</h4>' +
        '<div class="prof-scroll"><table class="prof-table"><thead><tr>' +
        UI.score.historyHead.map(function (h) { return '<th>' + h + '</th>'; }).join('') +
        '</tr></thead><tbody>';
      ls.history.forEach(function (h, i) {
        html += '<tr><td>' + (i + 1) + '</td><td>' + h.xp + '</td><td>' +
                h.first + '/' + lv.questions.length + '</td><td>' + h.misses + '</td><td>' + h.combo + '</td></tr>';
      });
      html += '</tbody></table></div>';
    });

    el('profBody').innerHTML = html;
  }

  function openHero() {
    renderHeroPick();
    show('hero');
  }
  function openArmoury(from) {
    armFrom = from;
    renderArmoury();
    show('arm');
  }

  el('heroGo').addEventListener('click', function () {
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
  el('btnProf').addEventListener('click', function () { SFX.click(); renderProfile(); show('prof'); });
  el('profBack').addEventListener('click', function () { SFX.click(); renderMap(); show('map'); });

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
  /* ¿Hay que animar? No con reduced-motion ni en modo aula. */
  function motionOff() {
    if (STATE.aula) return true;
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (e) { return false; }
  }

  function mountScene(mech, variant, order) {
    if (scene) { scene.destroy(); scene = null; }
    var hostEl = el('qScene');

    /* Camino de tramos: la escena anterior SALE por la izquierda mientras la
       nueva ENTRA por la derecha. Es CSS por clase; nada bloquea la respuesta:
       el nino puede mover al heroe en el primer frame. La vieja se retira al
       terminar su animacion (o al instante si no hay animacion). */
    var old = hostEl.querySelector('.scene-slot:not(.is-out)');
    var still = motionOff();
    if (old) {
      if (still) { hostEl.removeChild(old); }
      else {
        old.classList.add('is-out');
        old.setAttribute('aria-hidden', 'true');
        var gone = false;
        var drop = function () { if (!gone && old.parentNode) { gone = true; old.parentNode.removeChild(old); } };
        old.addEventListener('animationend', drop);
        setTimeout(drop, 600);   // red de seguridad, no un reloj de juego
      }
      Array.prototype.forEach.call(hostEl.querySelectorAll('.scene-slot.is-out'), function (n) {
        if (n !== old) n.parentNode.removeChild(n);
      });
    }

    var slot = document.createElement('div');
    slot.className = 'scene-slot' + (old && !still ? ' is-in' : '');
    hostEl.appendChild(slot);

    var factory = SCENES[mech] || SCENES.doors;
    scene = factory();
    scene.mount(slot, {
      variant: variant,
      order: order,
      keys: KEYS,
      pick: function (origIdx) { answer(origIdx); },
      say: announce,
      onStep: function (f) { ENV.parallax(f); },
      help: function (html, stacked) {
        var h = el('qHelp'); if (h) h.innerHTML = html;
        ENV.stacked(stacked);
      }
    });
  }

  /* El camino del HUD: un tramo por familia. */
  function buildPath(total) {
    var p = el('hudPath');
    if (!p) return;
    var s = '';
    for (var i = 0; i < total; i++) s += '<i></i>';
    p.innerHTML = s;
  }

  function startLevel(idx) {
    var lv = DATA.levels[idx];
    run = new Runner(lv);
    q = null;
    el('hudLvl').textContent = fmt(UI.play.levelTag, { n: lv.id });
    el('qScene').innerHTML = '';
    ENV.mount(el('qWorld'), lv.env);      // sin env, no pinta nada: se ve como antes
    buildPath(run.total);
    setMate('idle', UI.mate.start);
    if (STATE.music) MUSIC.start();
    show('play');
    nextQuestion();
  }

  function nextQuestion() {
    if (!run.queue.length) return winLevel();
    var first = !q;
    q = run.current();
    locked = false;
    if (!first && !motionOff()) ENV.shift();   // el lugar se desliza un tramo

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
    if (!scene || !scene.setMood || motionOff()) { panel.classList.add('is-on'); return; }

    SFX.summon();
    MUSIC.duck(1200);
    scene.setMood('summon');
    // 0.9 s: alzar (0-0.3) + destello (0.3-0.5) + aparicion (0.5-0.9).
    setTimeout(function () { panel.classList.add('is-on'); }, 900);
  }

  function updateHUD() {
    var segs = el('hudPath') ? el('hudPath').children : [];
    for (var i = 0; i < segs.length; i++) {
      segs[i].className = i < run.cleared ? 'on' : (i === run.cleared ? 'now' : '');
    }
    ENV.progress(run.progress());
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
    if (window.confirm(UI.play.confirmQuit)) { ENV.destroy(); renderMap(); show('map'); }
  });

  /* ---------- TECLADO ----------
     Flechas mueven una casilla. Enter/Espacio cruza la casilla actual.
     A-D / 1-4 saltan directo a una puerta y la cruzan (atajo de v1: sirve
     para lectores de pantalla y para quien prefiera no caminar).
     Nada se mantiene pulsado, nada depende de repeticion de tecla. */
  document.addEventListener('keydown', function (e) {
    if (!screens.play.classList.contains('is-on')) return;
    // Playtest H1: en los teclados viejos del colegio la flecha mantenida repite y
    // el heroe se pasaba de largo dos casillas. Nada depende de la repeticion.
    if (e.repeat) { e.preventDefault(); return; }

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

    // Se leen ANTES de actualizar: son las marcas contra las que se compara.
    var prevBest = ls.best;
    var prevRun  = ls.history.length ? ls.history[ls.history.length - 1] : null;
    var coloursBefore = unlockedColours();

    /* Medallas. `hits` y `firstHits` suben como mucho UNA vez por partida,
       aqui y no en cada respuesta: es lo que hace que plata exija 3 partidas
       distintas y oro 5. */
    var newMedals = [];
    Object.keys(run.hitSkills).forEach(function (tag) {
      var before = medalOf(tag);
      skillRec(tag).hits++;
      if (run.firstSkills[tag]) skillRec(tag).firstHits++;
      var after = medalOf(tag);
      if (after > before) newMedals.push({ tag: tag, medal: after });
    });

    ls.done = true;
    ls.plays++;
    if (stars > ls.stars) ls.stars = stars;
    if (run.xp > ls.best) { STATE.totalXP += (run.xp - ls.best); ls.best = run.xp; }
    ls.history.push({ xp: run.xp, first: run.firstTry, misses: run.misses, combo: run.bestCombo, at: Date.now() });
    if (ls.history.length > 5) ls.history = ls.history.slice(-5);
    if (run.bestCombo > (STATE.bestComboEver || 0)) STATE.bestComboEver = run.bestCombo;
    save();

    // Recompensa por dominio: un color de armadura nuevo si este nivel acaba
    // de llegar a 2+ estrellas por primera vez.
    var coloursAfter = unlockedColours();
    var newColour = coloursAfter > coloursBefore ? UI.armoury.colours[coloursAfter - 1] : null;

    /* Competir contra uno mismo: cuanto sobre el record, y cuanto sobre la
       partida anterior. Son cosas distintas y el nino ve las dos. */
    var beatBest = run.xp > prevBest;
    var recordLine = beatBest
      ? fmt(UI.win.newBest, { n: run.xp - prevBest })
      : (prevBest ? fmt(UI.win.overBest, { n: prevBest - run.xp }) : '');
    var trendLine = !prevRun ? UI.win.firstPlay
      : run.xp > prevRun.xp ? fmt(UI.win.upFrom,   { n: run.xp - prevRun.xp })
      : run.xp < prevRun.xp ? fmt(UI.win.downFrom, { n: prevRun.xp - run.xp })
      : UI.win.sameAs;

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
      '<div class="score-lines">' +
        (recordLine ? '<p class="' + (beatBest ? 'score-best' : 'text-dim') + '">' + recordLine + '</p>' : '') +
        '<p class="' + (prevRun && run.xp > prevRun.xp ? 'score-up' :
                        prevRun && run.xp < prevRun.xp ? 'score-down' : 'text-dim') + '">' + trendLine + '</p>' +
      '</div>' +
      /* La primera partida de un nivel da bronce en TODAS sus habilidades a la
         vez: 16 medallas de golpe no son un premio, son ruido. Se muestran las
         mejores 4 y se cuenta el resto. Las de mas valor van primero. */
      (function () {
        if (!newMedals.length) return '';
        var top = newMedals.slice().sort(function (a, b) { return b.medal - a.medal; });
        var shown = top.slice(0, 4), rest = top.length - shown.length;
        return '<div class="medals-new"><span class="medals-new__tag">' + UI.win.medalsNew + '</span>' +
          shown.map(function (m) {
            return '<span class="medal medal--' + m.medal + '">' +
              fmt(UI.score.medalLine, { skill: esc(skillLabel(m.tag)), medal: medalName(m.medal) }) + '</span>';
          }).join('') +
          (rest > 0 ? '<span class="medal">' + fmt(UI.win.medalsMore, { n: rest }) + '</span>' : '') +
          '</div>';
      })() +
      (newColour
        ? '<p class="score-best"><span class="swatch swatch--inline" style="background:' + newColour.value + '" aria-hidden="true"></span> ' +
          fmt(UI.win.colourNew, { colour: newColour.name }) + '</p>'
        : '') +
      '<p class="text-dim" style="font-size:15px">' +
        (stars === 3 ? UI.win.verdict3
         : run.stuck() ? UI.win.verdictStuck
         : stars === 2 ? UI.win.verdict2 : UI.win.verdict1) +
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

  /* Modo aula (PLAN-AMBIENTES R6): apaga animacion ambiental, parallax,
     transicion y particulas. Para TDAH y para proyectores de colegio. Se
     recuerda. La clase en <html> la lee el CSS; motionOff() la lee el JS. */
  function applyAula() {
    document.documentElement.classList.toggle('is-aula', !!STATE.aula);
  }
  el('btnAula').addEventListener('click', function () {
    STATE.aula = !STATE.aula; save(); SFX.click();
    applyAula();
    el('btnAula').textContent = STATE.aula ? UI.map.btnAulaOn : UI.map.btnAulaOff;
  });
  applyAula();
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
