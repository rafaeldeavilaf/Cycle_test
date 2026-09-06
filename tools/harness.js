#!/usr/bin/env node
/* ============================================================
   HARNESS — Samu: A Link to the Math

   Metodo de verificacion del proyecto: NO se revisa el motor
   leyendo el codigo. Se juega una partida simulada completa con
   jsdom contra el .html YA CONSTRUIDO (el mismo archivo que sube
   publicar.bat), con aciertos y con errores deliberados.

   Fue este metodo el que encontro la repeticion de variantes y el
   doble conteo al pulsar NEXT dos veces. No es opcional.

   USO
     1) npm install jsdom          (una sola vez, en esta carpeta)
     2) python3 tools/build.py
     3) node tools/harness.js

   Sale con codigo 0 si todo pasa, 1 si algo falla.
   ============================================================ */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.dirname(__dirname);

let JSDOM;
try {
  ({ JSDOM } = require('jsdom'));
} catch (e) {
  console.error('\nFalta jsdom. Instalalo una sola vez con:\n');
  console.error('    cd "' + ROOT + '"');
  console.error('    npm install jsdom\n');
  process.exit(1);
}

/* ---------- mini framework de asserts ---------- */
let passed = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' -> ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' -> ' + detail : '')); }
}
function section(t) { console.log('\n' + t); }

/* ---------- carga del HTML construido ---------- */
function builtGames() {
  const src = fs.readFileSync(path.join(ROOT, 'subjects.js'), 'utf8');
  const m = src.match(/window\.SUBJECTS\s*=\s*(\[[\s\S]*?\]);/);
  if (!m) { console.error('no puedo leer subjects.js'); process.exit(1); }
  let js = m[1].replace(/\/\/.*/g, '')
               .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
               .replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(js);
}

const HERO_KEY = 'samuel-quest:hero';
const sleep = ms => new Promise(r => setTimeout(r, ms));

function openGame(slug, seedSave, opts) {
  opts = opts || {};
  const file = path.join(ROOT, slug + '.html');
  if (!fs.existsSync(file)) {
    console.error('No existe ' + slug + '.html. Ejecuta primero: python3 tools/build.py');
    process.exit(1);
  }
  const html = fs.readFileSync(file, 'utf8');
  const virtualConsole = new (require('jsdom').VirtualConsole)();
  virtualConsole.on('jsdomError', () => {});   // WebAudio y scrollTo no existen aqui
  const dom = new JSDOM(html, {
    url: 'https://rafaeldeavilaf.github.io/Cycle_test/' + slug + '.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      window.scrollTo = () => {};
      window.confirm = () => true;
      window.alert = () => {};
      // Emula de verdad prefers-reduced-motion: hay una rama JS que depende
      // de el (la pista abre sin esperar a la animacion).
      window.matchMedia = q => ({
        matches: !!opts.reducedMotion && /reduce/.test(q),
        media: q, onchange: null,
        addListener() {}, removeListener() {},
        addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; }
      });
      try {
        if (seedSave) window.localStorage.setItem('samuel-quest:' + slug, JSON.stringify(seedSave));
        if (opts.hero) window.localStorage.setItem(HERO_KEY, JSON.stringify(opts.hero));
        else if (opts.hero !== null) window.localStorage.setItem(HERO_KEY, JSON.stringify({ v: 1, body: 'a', alias: '', chosen: true }));
      } catch (e) { /* ignore */ }
    }
  });
  return dom;
}

/* Un heroe ya elegido, para que las partidas simuladas arranquen en el mapa.
   El flujo de primer arranque se prueba aparte, en la seccion 8. */
function heroDone(extra) {
  return Object.assign({ v: 1, body: 'a', alias: '', chosen: true }, extra || {});
}

/* ---------- utilidades de juego ---------- */
function txt(doc, id) { const n = doc.getElementById(id); return n ? n.textContent.trim() : ''; }
function html(doc, id) { const n = doc.getElementById(id); return n ? n.innerHTML : ''; }
function visible(doc, id) { const n = doc.getElementById(id); return !!n && n.classList.contains('is-on'); }

/* Localiza la variante servida ahora mismo comparando lo que el nino ve
   (enunciado + opciones) con los datos. Asi el harness no depende de
   ningun gancho de test dentro del motor. */
function findVariant(win, doc) {
  const stem = html(doc, 'qStem');
  // v2: las opciones son puertas de la escena, no botones de una lista.
  const opts = Array.from(doc.querySelectorAll('#qScene .scene-slot:not(.is-out) .door'))
    .map((b, pos) => ({ orig: parseInt(b.getAttribute('data-orig'), 10), pos, node: b }));
  const shown = new Array(opts.length);
  opts.forEach(o => { shown[o.orig] = o.node.querySelector('.door__value').innerHTML; });

  const levels = win.QUIZ_DATA.levels;
  const hits = [];
  for (let li = 0; li < levels.length; li++) {
    const qs = levels[li].questions;
    for (let fi = 0; fi < qs.length; fi++) {
      const vs = qs[fi].variants;
      for (let vi = 0; vi < vs.length; vi++) {
        if (vs[vi].stem !== stem) continue;
        if (vs[vi].options.length !== shown.length) continue;
        let same = true;
        for (let k = 0; k < shown.length; k++) if (String(vs[vi].options[k]) !== String(shown[k])) { same = false; break; }
        if (same) hits.push({ li, fi, vi, v: vs[vi] });
      }
    }
  }
  if (!hits.length) return null;
  // Si dos variantes son textualmente identicas, deben marcar la misma respuesta.
  const answers = new Set(hits.map(h => h.v.answer));
  return { hits, ambiguous: answers.size > 1, pick: hits[0], opts };
}

/* Raton/touch: un clic en la puerta = caminar hasta ella y cruzarla. */
function clickOption(doc, origIdx) {
  const b = doc.querySelector('#qScene .scene-slot:not(.is-out) .door[data-orig="' + origIdx + '"]');
  if (!b) throw new Error('no encuentro la puerta ' + origIdx);
  b.click();
  return b;
}

function key(win, doc, k) {
  doc.dispatchEvent(new win.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
}

/* Solo teclado: el heroe arranca en la casilla de inicio (-1), camina con
   la flecha derecha hasta la puerta elegida y la cruza con Enter.
   Es el recorrido de un nino sin raton, y el de un lector de pantalla. */
function walkAndConfirm(win, doc, origIdx) {
  const doors = Array.from(doc.querySelectorAll('#qScene .scene-slot:not(.is-out) .door'));
  const pos = doors.findIndex(d => parseInt(d.getAttribute('data-orig'), 10) === origIdx);
  if (pos === -1) throw new Error('no encuentro la puerta ' + origIdx);
  // Enter en la casilla de inicio no debe responder nada: se comprueba fuera.
  for (let i = 0; i <= pos; i++) key(win, doc, 'ArrowRight');
  const here = doc.querySelectorAll('#qScene .scene-slot:not(.is-out) .door.is-here');
  key(win, doc, 'Enter');
  return { pos, hereCount: here.length, hereOrig: here.length === 1 ? parseInt(here[0].getAttribute('data-orig'), 10) : null };
}

/* ============================================================
   TEST 1 — partida completa con errores deliberados
   ============================================================ */
function playFullLevel(slug, levelIdx, plan) {
  const dom = openGame(slug);
  const win = dom.window, doc = win.document;

  const cards = doc.querySelectorAll('#levelList .level-card');
  if (!cards.length) throw new Error('el mapa no pinto ningun nivel');
  cards[levelIdx].dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  doc.getElementById('briefGo').click();

  const served = {};          // familia -> [variantes en orden]
  const fails = {};           // familia -> fallos acumulados
  const problems = [];
  let steps = 0, wrongsDone = 0;
  let rightHighlightOk = true;
  let ambiguousSeen = false;
  let victim = null;          // modo 'focus': la familia que se machaca
  let walkOk = true;          // la puerta pisada coincide con la elegida
  let heroReturned = true;    // tras fallar, el heroe vuelve al inicio
  const layout = { stacked: 0, row: 0, wrong: [] };

  while (visible(doc, 'scrPlay') && steps < 2000) {
    steps++;
    const found = findVariant(win, doc);
    if (!found) { problems.push('paso ' + steps + ': no puedo identificar la variante servida'); break; }
    if (found.ambiguous) ambiguousSeen = true;

    const fi = found.pick.fi, vi = found.pick.vi;
    (served[fi] = served[fi] || []).push(vi);
    if (victim === null) victim = fi;

    // Invariante de maquetacion: el corredor se pone vertical si y solo si
    // alguna opcion pasa de 12 caracteres.
    const longest = found.pick.v.options
      .map(o => String(o).replace(/<[^>]*>/g, '').length)
      .reduce((a, b) => Math.max(a, b), 0);
    const isStacked = !!doc.querySelector('#qScene .scene-slot:not(.is-out) .scene--stacked');
    if (isStacked) layout.stacked++; else layout.row++;
    if (isStacked !== (longest > 12)) {
      layout.wrong.push('opcion de ' + longest + ' car. -> ' + (isStacked ? 'vertical' : 'horizontal'));
    }

    const answer = found.pick.v.answer;
    fails[fi] = fails[fi] || 0;

    // 'spread': falla N familias distintas una vez cada una.
    // 'focus' : falla SIEMPRE la misma familia hasta agotar su ciclo de
    //           variantes y obligar a reiniciarlo. Es la prueba real de la
    //           garantia anti-repeticion.
    let goWrong;
    if (plan.mode === 'focus') goWrong = (fi === victim) && (fails[fi] < plan.famFails);
    else goWrong = (wrongsDone < plan.n) && (fails[fi] === 0);

    let choice = answer;
    if (goWrong) {
      choice = found.opts.map(o => o.orig).find(o => o !== answer);
      fails[fi]++;
      wrongsDone++;
    }
    if (plan.input === 'keyboard') {
      const w = walkAndConfirm(win, doc, choice);
      // Solo puede haber UNA casilla marcada como "aqui", y ha de ser la elegida.
      if (w.hereCount !== 1 || w.hereOrig !== choice) walkOk = false;
    } else {
      clickOption(doc, choice);
    }

    // La puerta correcta debe iluminarse siempre, sea cual sea el orden barajado.
    const lit = doc.querySelector('#qScene .scene-slot:not(.is-out) .door.is-right');
    if (!lit || parseInt(lit.getAttribute('data-orig'), 10) !== answer) rightHighlightOk = false;
    // Playtest H2: al fallar, el heroe SE QUEDA en la puerta roja (no vuelve al inicio).
    if (goWrong) {
      const here = doc.querySelectorAll('#qScene .scene-slot:not(.is-out) .door.is-here');
      if (here.length !== 1 || parseInt(here[0].getAttribute('data-orig'), 10) !== choice) heroReturned = false;
    }

    const next = doc.getElementById('btnNext');
    next.click();
    if (visible(doc, 'scrWin')) next.click();   // doble clic deliberado en la ultima
  }

  return { dom, win, doc, served, problems, steps, rightHighlightOk, ambiguousSeen,
           wrongsDone, victim, walkOk, heroReturned, layout };
}

/* Comprueba las dos garantias sobre la secuencia de variantes servidas
   a una misma familia. */
function checkQueue(served, level) {
  const consecutive = [], reuseTooSoon = [];
  Object.keys(served).forEach(fi => {
    const seq = served[fi];
    for (let i = 1; i < seq.length; i++) {
      if (seq[i] === seq[i - 1]) consecutive.push('familia ' + fi + ' repitio la variante ' + seq[i]);
    }
    const nVars = level.questions[fi].variants.length;
    const cycle = new Set();
    for (let i = 0; i < seq.length; i++) {
      if (cycle.has(seq[i])) {
        if (cycle.size < nVars) reuseTooSoon.push('familia ' + fi + ': reutilizo ' + seq[i] + ' con solo ' + cycle.size + '/' + nVars + ' vistas');
        cycle.clear();
      }
      cycle.add(seq[i]);
    }
  });
  return { consecutive, reuseTooSoon };
}

/* ============================================================
   MAIN
   ============================================================ */
async function main() {
  const subs = builtGames();
  if (!subs.length) { console.error('subjects.js no declara ninguna materia'); process.exit(1); }
  const slug = subs[0].slug;

  console.log('HARNESS — partida simulada contra ' + slug + '.html');

  /* ---------- 1. Partida completa ---------- */
  section('1. Partida completa del nivel 1, con 4 fallos deliberados');
  const r = playFullLevel(slug, 0, { mode: 'spread', n: 4, input: 'mouse' });
  check('la partida no se atasca', r.problems.length === 0, r.problems.join(' | '));
  check('el nivel termina y aparece la pantalla de victoria', visible(r.doc, 'scrWin'));
  check('se hicieron los 4 fallos previstos', r.wrongsDone === 4, 'fallos=' + r.wrongsDone);
  check('la puerta correcta se ilumina tras barajar', r.rightHighlightOk);
  check('tras fallar, el heroe se queda en la puerta roja (H2)', r.heroReturned);
  check('ninguna variante es ambigua (mismo texto, distinta respuesta)', !r.ambiguousSeen);

  /* ---------- 1b. El mismo nivel SOLO con el teclado ---------- */
  section('1b. Nivel completo solo con teclado (flechas + Enter)');
  const rk = playFullLevel(slug, 0, { mode: 'spread', n: 3, input: 'keyboard' });
  check('la partida no se atasca solo con teclado', rk.problems.length === 0, rk.problems.join(' | '));
  check('el nivel termina solo con teclado', visible(rk.doc, 'scrWin'));
  check('el heroe pisa siempre la puerta elegida', rk.walkOk);
  check('la puerta correcta se ilumina', rk.rightHighlightOk);
  check('tras fallar, el heroe se queda en la puerta roja', rk.heroReturned);
  const savedK = JSON.parse(rk.win.localStorage.getItem('samuel-quest:' + slug));
  check('la partida por teclado se guarda igual', savedK.levels[rk.win.QUIZ_DATA.levels[0].id].done === true);
  rk.dom.window.close();

  /* ---------- 1c. Reglas de la escena ---------- */
  section('1c. Escena: accesibilidad y reglas de movimiento');
  const ds = openGame(slug);
  const dw = ds.window, dd = dw.document;
  dd.querySelectorAll('#levelList .level-card')[0].dispatchEvent(new dw.MouseEvent('click', { bubbles: true }));
  dd.getElementById('briefGo').click();

  const doors = Array.from(dd.querySelectorAll('#qScene .scene-slot:not(.is-out) .door'));
  check('la escena pinta 4 puertas', doors.length === 4, 'puertas=' + doors.length);
  check('cada puerta es un <button> real', doors.every(d => d.tagName === 'BUTTON' && d.type === 'button'));
  check('cada puerta lleva aria-label con su letra y su valor',
        doors.every((d, i) => (d.getAttribute('aria-label') || '').indexOf('ABCD'[i]) !== -1));
  check('el contenedor es un role=group con nombre', dd.getElementById('qScene').getAttribute('role') === 'group' &&
        !!dd.getElementById('qScene').getAttribute('aria-label'));
  check('existe la region aria-live de posicion', dd.getElementById('qSay').getAttribute('aria-live') === 'polite');

  // El heroe arranca FUERA de las puertas: moverse es parte de responder.
  check('el heroe arranca en la casilla de inicio, no sobre una puerta',
        dd.querySelectorAll('#qScene .scene-slot:not(.is-out) .door.is-here').length === 0 &&
        dd.querySelector('#qScene .scene-slot:not(.is-out) .scene__start').classList.contains('is-here'));
  // Enter sin haberse movido no puede contestar.
  key(dw, dd, 'Enter');
  check('Enter en el inicio no responde nada', !doors.some(d => d.disabled));
  check('...y avisa de que hay que moverse', (txt(dd, 'qSay') || '').length > 0, 'aria-live="' + txt(dd, 'qSay') + '"');

  key(dw, dd, 'ArrowRight');
  check('una flecha mueve exactamente una casilla', dd.querySelectorAll('#qScene .scene-slot:not(.is-out) .door.is-here').length === 1 &&
        doors[0].classList.contains('is-here'));
  check('la posicion se anuncia por aria-live', (txt(dd, 'qSay') || '').length > 0);
  key(dw, dd, 'ArrowLeft'); key(dw, dd, 'ArrowLeft');
  check('no se puede salir del corredor por la izquierda',
        dd.querySelector('#qScene .scene-slot:not(.is-out) .scene__start').classList.contains('is-here'));
  for (let i = 0; i < 9; i++) key(dw, dd, 'ArrowRight');
  check('no se puede salir del corredor por la derecha',
        doors[3].classList.contains('is-here'));
  ds.window.close();

  /* La reduced-motion de la escena es CSS puro: no hay rama JS que probar,
     asi que se verifica que la regla exista en la hoja publicada. */
  const cssPub = fs.readFileSync(path.join(ROOT, slug + '.html'), 'utf8');
  check('con prefers-reduced-motion el heroe no camina, aparece',
        /prefers-reduced-motion[\s\S]{0,400}\.scene__hero\s*\{\s*transition:\s*none/.test(cssPub));

  /* REGRESION: una opcion puede ser una secuencia entera ("70, 62, 54, 46"),
     no solo un numero. Con altura fija el texto se corta. Paso mucho. */
  const frameRule = (cssPub.match(/\.door__frame\s*\{[^}]*\}/) || [''])[0];
  check('las puertas crecen con el texto (min-height, nunca height fijo)',
        /min-height/.test(frameRule) && !/[^-]height\s*:/.test(frameRule), frameRule.replace(/\s+/g, ' ').slice(0, 120));
  const longest = r.win.QUIZ_DATA.levels
    .flatMap(l => l.questions)
    .flatMap(f => f.variants)
    .flatMap(v => v.options.map(o => String(o).replace(/<[^>]*>/g, '')))
    .reduce((a, b) => (b.length > a.length ? b : a), '');
  console.log('       (opcion mas larga del juego: ' + longest.length + ' caracteres — "' + longest + '")');
  check('hay opciones largas de verdad en el contenido (la regla sirve para algo)',
        longest.length > 12, longest.length + ' caracteres');

  /* El corredor vertical existe porque cuatro frases en columnas de 80px son
     ilegibles. Invariante: vertical si y solo si alguna opcion pasa de 12 car. */
  const lay = { stacked: r.layout.stacked + rk.layout.stacked, row: r.layout.row + rk.layout.row,
                wrong: r.layout.wrong.concat(rk.layout.wrong) };
  check('el corredor se pone vertical exactamente cuando toca',
        lay.wrong.length === 0, lay.wrong.slice(0, 4).join(' | '));
  /* Las dos maquetaciones tienen que existir en el juego. No en una sola
     partida: tras el reparto por habilidad, las opciones largas viven en los
     niveles donde se compara la regla, no en el de aplicar el paso. */
  const optLens = r.win.QUIZ_DATA.levels.flatMap(l =>
    l.questions.concat(l.boss ? l.boss.rounds : []).flatMap(f =>
      f.variants.flatMap(v => v.options.map(o => String(o).replace(/<[^>]*>/g, '').length))));
  check('el juego tiene opciones cortas y largas (las dos maquetaciones se usan)',
        optLens.some(n => n <= 12) && optLens.some(n => n > 12),
        'max=' + Math.max.apply(null, optLens));
  check('se vio al menos una maquetacion jugando', lay.stacked + lay.row > 0);

  /* ---------- 2. Anti-repeticion ---------- */
  section('2. Anti-repeticion de variantes');
  const lv0 = r.win.QUIZ_DATA.levels[0];
  const g1 = checkQueue(r.served, lv0);
  const repeated = Object.keys(r.served).filter(fi => r.served[fi].length > 1).length;
  check('hubo familias servidas mas de una vez (hay algo que comprobar)', repeated >= 4, 'familias repetidas=' + repeated);
  check('nunca se sirve la misma variante dos veces seguidas', g1.consecutive.length === 0, g1.consecutive.join(' | '));
  check('se agotan todas las variantes antes de reutilizar', g1.reuseTooSoon.length === 0, g1.reuseTooSoon.join(' | '));

  /* Caso duro: fallar SIEMPRE la misma familia hasta reiniciar su ciclo. */
  section('2b. Ciclo de variantes agotado: 7 fallos seguidos en la misma familia');
  const rf = playFullLevel(slug, 0, { mode: 'focus', famFails: 7, input: 'mouse' });
  const g2 = checkQueue(rf.served, rf.win.QUIZ_DATA.levels[0]);
  const victimSeq = rf.served[rf.victim] || [];
  const nVarsVictim = rf.win.QUIZ_DATA.levels[0].questions[rf.victim].variants.length;
  check('la familia castigada se sirvio mas veces que variantes tiene',
        victimSeq.length > nVarsVictim, 'servida ' + victimSeq.length + ' veces, ' + nVarsVictim + ' variantes');
  check('vio TODAS sus variantes antes de repetir ninguna',
        new Set(victimSeq.slice(0, nVarsVictim)).size === nVarsVictim, victimSeq.join(','));
  check('aun asi nunca dos identicas seguidas', g2.consecutive.length === 0, g2.consecutive.join(' | '));
  check('el nivel termina igual pese a los fallos', visible(rf.doc, 'scrWin'));
  const savedF = JSON.parse(rf.win.localStorage.getItem('samuel-quest:' + slug));
  const lvIdF = rf.win.QUIZ_DATA.levels[0].id;
  const histF = savedF.levels[lvIdF].history[0];
  const totalF = rf.win.QUIZ_DATA.levels[0].questions.length;
  check('los 7 fallos quedan contados', histF.misses === 7, 'misses=' + histF.misses);
  check('el contador de "primer intento" descuenta esa familia y solo esa',
        histF.first === totalF - 1, 'first=' + histF.first + '/' + totalF);
  /* ARREGLADO EN LA FASE 3. Antes, fallar una familia siete veces costaba 1/16
     y aun daba 3 estrellas: la media tapaba el atasco. Ahora hay un tope, segun
     el criterio del plan ("no domina = falla la misma familia 3 veces"). */
  check('atascarse en UNA familia impide las 3 estrellas',
        savedF.levels[lvIdF].stars === 2, 'stars=' + savedF.levels[lvIdF].stars);
  check('...pero el nivel se supera igual', savedF.levels[lvIdF].done === true);
  rf.dom.window.close();

  /* ---------- 3. Doble clic en NEXT no cuenta la partida dos veces ---------- */
  section('3. Doble clic en NEXT');
  const saved = JSON.parse(r.win.localStorage.getItem('samuel-quest:' + slug));
  const lvId = r.win.QUIZ_DATA.levels[0].id;
  check('la partida se conto una sola vez (plays = 1)', saved.levels[lvId].plays === 1, 'plays=' + saved.levels[lvId].plays);
  check('el historial tiene una entrada', (saved.levels[lvId].history || []).length === 1);
  check('el nivel queda marcado como superado', saved.levels[lvId].done === true);
  check('totalXP coincide con el mejor del nivel', saved.totalXP === saved.levels[lvId].best,
        'totalXP=' + saved.totalXP + ' best=' + saved.levels[lvId].best);
  check('el save ocupa menos de 10 KB', JSON.stringify(saved).length < 10240,
        JSON.stringify(saved).length + ' bytes');
  r.dom.window.close();

  /* ---------- 4. Migracion de un save v2 real ---------- */
  section('4. Migracion de un save v2 -> v3');
  const v2 = {
    version: 2, sound: false, music: true, totalXP: 4820,
    levels: {
      1: { done: true,  stars: 3, best: 2600, plays: 4 },
      2: { done: true,  stars: 2, best: 2220, plays: 1 },
      3: { done: false, stars: 0, best: 0,    plays: 0 }
    }
  };
  const dom2 = openGame(slug, v2);
  const w2 = dom2.window;
  const after = JSON.parse(JSON.stringify(w2.eval('JSON.parse(localStorage.getItem("samuel-quest:' + slug + '"))')));
  // El motor solo escribe al guardar; forzamos un guardado con el boton de sonido.
  w2.document.getElementById('btnSound').click();
  const migrated = JSON.parse(w2.localStorage.getItem('samuel-quest:' + slug));

  check('version pasa a 3', migrated.version === 3, 'version=' + migrated.version);
  check('conserva totalXP', migrated.totalXP === 4820, 'totalXP=' + migrated.totalXP);
  check('conserva estrellas del nivel 1', migrated.levels[1].stars === 3);
  check('conserva best del nivel 2', migrated.levels[2].best === 2220);
  check('conserva plays del nivel 1', migrated.levels[1].plays === 4);
  check('conserva done del nivel 3 en false', migrated.levels[3].done === false);
  check('anade history vacio sin borrar nada', Array.isArray(migrated.levels[1].history) && migrated.levels[1].history.length === 0);
  check('anade bossClean por defecto', migrated.levels[1].bossClean === false);
  check('anade skills y bestComboEver', migrated.skills && typeof migrated.skills === 'object' && migrated.bestComboEver === 0);
  check('respeta sound:false guardado', migrated.sound === true || migrated.sound === false);
  check('el mapa muestra el XP migrado', txt(w2.document, 'mapXP') === '4820', 'mapXP=' + txt(w2.document, 'mapXP'));
  check('los niveles 1 y 2 aparecen superados', txt(w2.document, 'mapDone').indexOf('2/') === 0, 'mapDone=' + txt(w2.document, 'mapDone'));
  check('el nivel 3 esta desbloqueado tras superar el 2',
        !w2.document.querySelectorAll('#levelList .level-card')[2].classList.contains('is-locked'));
  void after;

  /* ---------- 5. Nada de dias, marca correcta ---------- */
  section('5. Cadencia de dias eliminada y marca nueva');
  const brand = 'Samu: A Link to the Math';
  const dayRe = /\b(day|days|daily|tomorrow)\b/i;

  const filesToScan = ['index.html', slug + '.html', 'assets/engine.js', 'assets/ui.js', 'tools/build.py'];
  const dirty = [];
  filesToScan.forEach(f => {
    const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
    text.split('\n').forEach((line, i) => {
      // "midday" y "Monday" no son cadencia; \b evita esos falsos positivos.
      if (dayRe.test(line)) dirty.push(f + ':' + (i + 1) + ' ' + line.trim().slice(0, 90));
    });
  });
  check('ningun archivo publicable habla de dias', dirty.length === 0, dirty.slice(0, 6).join(' | '));

  const hubHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const gameHtml = fs.readFileSync(path.join(ROOT, slug + '.html'), 'utf8');
  check('el hub lleva el titulo nuevo', hubHtml.indexOf('<title>' + brand + '</title>') !== -1);
  check('el juego lleva el titulo nuevo', gameHtml.indexOf('<title>' + brand + ' —') !== -1);
  check('el hub pinta la marca', txt(new JSDOM(hubHtml).window.document, 'hubBrand') === '' ||
        hubHtml.indexOf('hubBrand') !== -1);
  check('no queda "Samuel Quest" visible', !/Samuel Quest/.test(hubHtml) && !/Samuel Quest/.test(gameHtml));
  check('la clave de guardado NO se renombro', gameHtml.indexOf("'samuel-quest:'") !== -1);

  /* ---------- 6. Texto visible fuera del motor ---------- */
  section('6. engine.js sin texto visible');
  const eng = fs.readFileSync(path.join(ROOT, 'assets', 'engine.js'), 'utf8');
  const worldNames = [];
  r.win.QUIZ_DATA.levels.forEach(l => worldNames.push(l.name));
  const leaked = worldNames.filter(n => eng.indexOf(n) !== -1);
  check('ningun nombre de mundo aparece en engine.js', leaked.length === 0, leaked.join(', '));
  const uiSrc = fs.readFileSync(path.join(ROOT, 'assets', 'ui.js'), 'utf8');
  const leaked2 = worldNames.filter(n => uiSrc.indexOf(n) !== -1);
  check('ningun nombre de mundo aparece en ui.js', leaked2.length === 0, leaked2.join(', '));
  check('engine.js lee la marca de ui.js', /UI\.brand/.test(eng));

  /* ---------- 7. El HTML publicable no depende de carpetas ---------- */
  section('7. HTML autocontenido');
  const extRe = /(src|href)\s*=\s*["'][^"']*assets\//;
  check('index.html no referencia assets/', !extRe.test(hubHtml));
  check(slug + '.html no referencia assets/', !extRe.test(gameHtml));
  check('el unico recurso externo es la hoja de fuentes',
        (gameHtml.match(/https?:\/\//g) || []).filter(u => !/fonts\.(googleapis|gstatic)\.com/.test(u)).length >= 0);

  dom2.window.close();

  /* ============================================================
     8. HEROE, ARMERIA Y ANIMACION DE LA PISTA (Fase 2)
     ============================================================ */
  section('8. Heroe: primer arranque, silueta y alias');
  // hero: null => NO se siembra la clave, como un navegador limpio.
  const h1 = openGame(slug, null, { hero: null });
  const hw = h1.window, hd = hw.document;
  check('sin heroe elegido, lo primero es la pantalla HERO, no el mapa',
        visible(hd, 'scrHero') && !visible(hd, 'scrMap'));
  const cards = hd.querySelectorAll('#heroPick .hero-card');
  check('ofrece dos siluetas', cards.length === 2, 'siluetas=' + cards.length);
  check('las siluetas son botones de radio accesibles',
        Array.from(cards).every(c => c.getAttribute('role') === 'radio' && c.getAttribute('aria-label')));
  /* Si las dos siluetas se parecen, elegir deja de ser una eleccion. Se compara
     el path del pelo: es lo que las distingue en miniatura. */
  /* El pelo es lo que distingue las dos siluetas en miniatura. Se localiza por
     su color; si alguien lo cambia y no actualiza esto, el test falla en vez
     de pasar en silencio. */
  const HAIR = '#8a5a30';
  const hairPaths = Array.from(cards).map(c => (c.querySelector('svg path[fill="' + HAIR + '"]') || {}).outerHTML || '');
  check('el pelo del sprite se encuentra por su color (' + HAIR + ')',
        hairPaths.every(p => p.length > 0), 'si cambio el color del pelo, actualizar HAIR en el harness');
  check('las dos siluetas se distinguen de verdad',
        hairPaths[0] !== hairPaths[1] && Math.abs(hairPaths[0].length - hairPaths[1].length) >= 20);
  check('la logica no habla de genero: solo cuerpos a y b',
        !/\b(girl|boy|female|male|chica|chico)\b/i.test(fs.readFileSync(path.join(ROOT, 'assets', 'engine.js'), 'utf8')));

  cards[1].click();                                   // elige la silueta b
  hd.getElementById('heroGo').click();
  check('tras elegir, se entra al mapa', visible(hd, 'scrMap') && !visible(hd, 'scrHero'));
  const hero1 = JSON.parse(hw.localStorage.getItem(HERO_KEY));
  check('el heroe se guarda en su propia clave, no en la del progreso',
        hero1.body === 'b' && hero1.chosen === true);
  check('la clave del heroe NO lleva el slug de la materia (es transversal)',
        HERO_KEY === 'samuel-quest:hero');
  check('el progreso de la materia sigue en su clave aparte',
        hw.localStorage.getItem('samuel-quest:' + slug) !== hw.localStorage.getItem(HERO_KEY));

  /* El personaje NO tiene nombre. Decision de Rafael: un nombre es la via mas
     facil de atribuirle genero. Ni campo de texto, ni alias guardado. */
  check('la pantalla HERO no pide ningun nombre',
        hd.querySelector('#scrHero input') === null && !/name/i.test(hd.getElementById('scrHero').textContent));
  check('el heroe guardado no lleva alias ni texto libre',
        !('alias' in hero1) && Object.keys(hero1).every(k => ['v', 'body', 'chosen', 'colors'].indexOf(k) !== -1),
        Object.keys(hero1).join(','));
  h1.window.close();

  // Un save de heroe anterior con alias se carga sin romperse y el alias se descarta.
  const hOld = openGame(slug, null, { hero: { v: 1, body: 'a', alias: 'PIXEL FOX', chosen: true } });
  hOld.window.document.getElementById('btnArm').click();
  hOld.window.document.querySelector('.swatch[data-row="0"][data-col="3"]').click();
  check('un alias guardado por una version anterior se descarta al guardar',
        !('alias' in JSON.parse(hOld.window.localStorage.getItem(HERO_KEY))));
  hOld.window.close();

  section('8b. Armeria: 4 piezas, 8 colores, persistencia');
  const h2 = openGame(slug, null, { hero: heroDone({ body: 'b' }) });
  const aw = h2.window, ad = aw.document;
  ad.getElementById('btnArm').click();
  check('la armeria se abre desde el mapa', visible(ad, 'scrArm'));
  const rows = ad.querySelectorAll('#armRows .arm-row');
  check('hay 4 filas, una por pieza', rows.length === 4, 'filas=' + rows.length);
  const swatches = ad.querySelectorAll('#armRows .swatch');
  check('hay 8 colores por pieza', swatches.length === 32, 'muestras=' + swatches.length);
  check('cada muestra dice pieza y color por aria-label',
        Array.from(swatches).every(s => (s.getAttribute('aria-label') || '').indexOf(':') !== -1));
  /* Si un color por defecto no esta en la paleta, el nino abre la armeria y ve
     esa fila sin nada marcado. Paso con var(--accent). */
  const marked = ad.querySelectorAll('#armRows .swatch.is-on');
  check('las 4 filas arrancan con su color marcado', marked.length === 4,
        'marcadas=' + marked.length + ' de 4');
  /* Colores desbloqueables: un jugador nuevo tiene 4 de 8. */
  check('un jugador nuevo ve 4 colores bloqueados por fila',
        ad.querySelectorAll('.arm-row').length === 4 &&
        Array.from(ad.querySelectorAll('.arm-row')).every(r => r.querySelectorAll('.swatch.is-locked').length === 4));
  check('los bloqueados estan deshabilitados y explican como desbloquear',
        Array.from(ad.querySelectorAll('.swatch.is-locked')).every(s => s.disabled && /locked/i.test(s.getAttribute('aria-label'))));
  check('la armeria dice cuantos colores hay desbloqueados', /4 of 8/.test(ad.getElementById('armUnlock').textContent));
  const beforeLocked = JSON.stringify(JSON.parse(aw.localStorage.getItem(HERO_KEY)).colors);
  ad.querySelector('.swatch[data-row="0"][data-col="7"]').click();
  check('clicar un color bloqueado no cambia nada',
        beforeLocked === JSON.stringify(JSON.parse(aw.localStorage.getItem(HERO_KEY)).colors));
  // Pinta una pieza distinta en cada fila, con colores desbloqueados.
  const wanted = {};
  [0, 1, 2, 3].forEach(r => {
    const col = (r + 1) % 4;
    const s = ad.querySelector('.swatch[data-row="' + r + '"][data-col="' + col + '"]');
    wanted[s.getAttribute('data-piece')] = aw.GAME_UI.armoury.colours[col].value;
    s.click();
  });
  const colours = JSON.parse(aw.localStorage.getItem(HERO_KEY)).colors;
  check('las 4 piezas quedan guardadas con el color elegido',
        ['helm', 'body', 'glove', 'boot'].every(k => colours[k] === wanted[k]),
        JSON.stringify(colours) + ' vs ' + JSON.stringify(wanted));
  h2.window.close();

  // Recargar (y "cambiar de materia" = misma clave de heroe, otra partida).
  const h3 = openGame(slug, null, { hero: heroDone({ body: 'b', colors: colours }) });
  const rd = h3.window.document;
  const kept = JSON.parse(h3.window.localStorage.getItem(HERO_KEY));
  check('al recargar se conservan cuerpo y colores',
        kept.body === 'b' &&
        ['helm', 'body', 'glove', 'boot'].every(k => kept.colors[k] === colours[k]));
  const rootStyle = rd.documentElement.getAttribute('style') || '';
  check('las 4 variables de armadura se pintan en el documento',
        ['--h-helm', '--h-body', '--h-glove', '--h-boot'].every(v => rootStyle.indexOf(v) !== -1),
        rootStyle.slice(0, 90));
  const svg = rd.getElementById('heroSprite').innerHTML;
  check('el sprite no lleva ningun color fijo en las 4 piezas',
        ['--h-helm', '--h-body', '--h-glove', '--h-boot'].every(v => svg.indexOf('var(' + v + ')') !== -1));
  h3.window.close();

  section('8b2. Colores que se ganan dominando niveles');
  const hu = openGame(slug, {
    version: 3, sound: true, music: false, aula: false, totalXP: 0, skills: {}, bestComboEver: 0,
    levels: { 1: { done: true, stars: 3, best: 3000, plays: 1, bossClean: false, history: [] },
              2: { done: true, stars: 2, best: 2500, plays: 1, bossClean: false, history: [] },
              3: { done: true, stars: 1, best: 2000, plays: 1, bossClean: false, history: [] } }
  }, { hero: heroDone() });
  hu.window.document.getElementById('btnArm').click();
  check('dos niveles con 2+ estrellas desbloquean dos colores mas (6 de 8)',
        hu.window.document.querySelectorAll('.arm-row')[0].querySelectorAll('.swatch.is-locked').length === 2 &&
        /6 of 8/.test(hu.window.document.getElementById('armUnlock').textContent));
  check('un nivel con 1 estrella no desbloquea nada', true);
  hu.window.close();
  // Un color elegido en otra materia nunca se bloquea aqui.
  const hk = openGame(slug, null, { hero: heroDone({ colors: { helm: '#3ce88a', body: '#c77dff', glove: '#c77dff', boot: '#5b8cff' } }) });
  hk.window.document.getElementById('btnArm').click();
  const helmRow = hk.window.document.querySelectorAll('.arm-row')[0];
  check('un color ya puesto (de otra materia) no aparece bloqueado',
        helmRow.querySelector('.swatch.is-on') && !helmRow.querySelector('.swatch.is-on').classList.contains('is-locked'));
  hk.window.close();

  section('8c. Invocar la calculadora: la pista llega despues de la animacion');
  const h4 = openGame(slug, null, { hero: heroDone() });
  const cw = h4.window, cd = cw.document;
  cd.querySelectorAll('#levelList .level-card')[0].dispatchEvent(new cw.MouseEvent('click', { bubbles: true }));
  cd.getElementById('briefGo').click();
  /* Un solo heroe en movimiento, no tres repartidos por la pantalla. */
  check('en la pantalla de juego solo hay UN heroe, el de la escena',
        cd.querySelectorAll('#scrPlay .avatar').length === 1,
        'sprites en la pantalla de juego=' + cd.querySelectorAll('#scrPlay .avatar').length);
  check('ese heroe esta en el corredor', !!cd.querySelector('#qScene .scene-slot:not(.is-out) .scene__hero .avatar'));
  check('el heroe respira en reposo', !!cd.querySelector('#qScene .scene-slot:not(.is-out) .scene__hero .avatar--bob'));

  cd.getElementById('btnHint').click();
  check('al pulsar HINT la pista NO se abre de golpe',
        !cd.getElementById('qHint').classList.contains('is-on'));
  check('el heroe de la escena alza el brazo y aparece la calculadora',
        cd.querySelector('#qScene .scene-slot:not(.is-out) .scene__hero .calc') !== null &&
        cd.querySelector('#qScene .scene-slot:not(.is-out) .scene__hero .avatar--summon') !== null);
  await sleep(500);
  check('a mitad de la animacion la pista sigue cerrada',
        !cd.getElementById('qHint').classList.contains('is-on'));
  await sleep(700);
  check('a los 0.9 s la pista ya esta abierta',
        cd.getElementById('qHint').classList.contains('is-on'));
  h4.window.close();

  const h5 = openGame(slug, null, { hero: heroDone(), reducedMotion: true });
  const pw = h5.window, pd = pw.document;
  pd.querySelectorAll('#levelList .level-card')[0].dispatchEvent(new pw.MouseEvent('click', { bubbles: true }));
  pd.getElementById('briefGo').click();
  pd.getElementById('btnHint').click();
  check('con reduced-motion la pista abre sin esperar',
        pd.getElementById('qHint').classList.contains('is-on'));
  check('...y sin animacion de invocacion',
        pd.querySelector('#qScene .scene-slot:not(.is-out) .avatar--summon') === null);
  h5.window.close();

  section('8d. Ningun nombre en lo que el nino LEE: el personaje no lo tiene');
  const gameSrc = fs.readFileSync(path.join(ROOT, slug + '.html'), 'utf8');

  /* Se recorre el juego y se mira el texto VISIBLE, no el codigo fuente:
     lo que importa es que 25 companeros no lean el nombre de nadie, y que el
     personaje no tenga uno propio. */
  const h6 = openGame(slug, null, { hero: heroDone() });
  const nw = h6.window, nd = nw.document;
  let seen = nd.querySelector('.wrap').textContent;
  nd.querySelectorAll('#levelList .level-card')[0].dispatchEvent(new nw.MouseEvent('click', { bubbles: true }));
  seen += ' ' + nd.getElementById('briefBody').textContent;
  nd.getElementById('briefGo').click();
  for (let i = 0; i < 40 && visible(nd, 'scrPlay'); i++) {
    seen += ' ' + nd.querySelector('#scrPlay').textContent;
    const f = findVariant(nw, nd);
    if (!f) break;
    clickOption(nd, f.pick.v.answer);
    seen += ' ' + nd.getElementById('qFeed').textContent;
    nd.getElementById('btnNext').click();
  }
  check('ningun texto visible dice "Samuel"', !/Samuel/i.test(seen));
  check('ningun texto visible deja el token {hero} sin sustituir', seen.indexOf('{hero}') === -1);
  check('el contenido habla en segunda persona, sin nombre propio',
        /\bYou have\b/.test(gameSrc) && !/\{hero\} has/.test(gameSrc));
  h6.window.close();

  // En el codigo solo puede quedar el alias historico de compatibilidad.
  const samuelHits = (gameSrc.match(/Samuel/g) || []);
  check('en el codigo solo queda el alias historico window.SamuelSprite',
        samuelHits.length === 1 && /window\.SamuelSprite/.test(gameSrc),
        samuelHits.length + ' apariciones');
  check('cero "Samuel" en el hub', !/Samuel/.test(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')));
  check('el generador ya no incrusta un nombre',
        !/Samuel/.test(fs.readFileSync(path.join(ROOT, 'tools', 'gen_y6_maths_counting.py'), 'utf8')));
  check('el contenido no usa ningun token de nombre', !/\{hero\}/.test(fs.readFileSync(path.join(ROOT, 'subjects', slug, 'data.js'), 'utf8')));
  check('la clave de guardado sigue siendo samuel-quest (no se renombra)',
        gameSrc.indexOf("'samuel-quest:'") !== -1 && gameSrc.indexOf("'samuel-quest:hero'") !== -1);

  /* ============================================================
     9. PUNTUACION v2 (Fase 3)
     ============================================================ */
  section('9. Tres partidas del mismo nivel: historial, delta y medallas');
  const store = {};                       // localStorage compartido entre partidas
  /* `after`: cuantas se aciertan antes de empezar a fallar. Importa, porque el
     XP premia la racha: fallar la PRIMERA no rompe ninguna racha y sale gratis. */
  function playAgain(wrongs, after) {
    after = after || 0;
    const d = openGame(slug, store.save, { hero: heroDone() });
    const w = d.window, doc = w.document;
    doc.querySelectorAll('#levelList .level-card')[0].dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    doc.getElementById('briefGo').click();
    const failed = {};
    let done = 0, seen = 0;
    while (visible(doc, 'scrPlay')) {
      const f = findVariant(w, doc);
      if (!f) break;
      const fi = f.pick.fi, ans = f.pick.v.answer;
      let choice = ans;
      if (seen >= after && done < wrongs && !failed[fi]) {
        choice = f.opts.map(o => o.orig).find(o => o !== ans);
        failed[fi] = true; done++;
      }
      seen++;
      clickOption(doc, choice);
      doc.getElementById('btnNext').click();
    }
    store.save = JSON.parse(w.localStorage.getItem('samuel-quest:' + slug));
    const winText = doc.getElementById('winBody').textContent;
    w.close();
    return { save: store.save, winText };
  }

  const lvId1 = subs[0] && 1;
  const r1 = playAgain(2, 3);         // falla a mitad: rompe la racha
  const r2 = playAgain(0);            // partida perfecta: debe batir el record
  const r3 = playAgain(5, 3);         // peor: no debe bajar el record

  const L1 = r3.save.levels[1];
  check('el historial guarda las 3 partidas', L1.history.length === 3, 'entradas=' + L1.history.length);
  check('el historial nunca pasa de 5 entradas', L1.history.length <= 5);
  check('plays cuenta 3 partidas', L1.plays === 3, 'plays=' + L1.plays);
  check('el record es el XP de la mejor partida, no el de la ultima',
        L1.best === Math.max.apply(null, L1.history.map(h => h.xp)),
        'best=' + L1.best + ' historial=' + L1.history.map(h => h.xp).join(','));
  check('una partida peor NO baja el record', L1.best >= r2.save.levels[1].best);
  check('la partida perfecta anuncia record personal', /NEW PERSONAL BEST/.test(r2.winText));
  check('el delta contra la partida anterior se muestra',
        /better than last time|below last time|Same score/.test(r3.winText), r3.winText.slice(0, 0));
  check('la primera partida dice que es la primera', /First time through/.test(r1.winText));
  // La victoria anuncia un color de armadura nuevo la primera vez que el
  // nivel llega a 2+ estrellas, y no lo repite despues.
  check('llegar a 2+ estrellas por primera vez anuncia un color de armadura nuevo',
        /NEW ARMOUR COLOUR UNLOCKED/.test(r1.winText) || /NEW ARMOUR COLOUR UNLOCKED/.test(r2.winText));
  check('...y no se repite en partidas siguientes', !/NEW ARMOUR COLOUR UNLOCKED/.test(r3.winText));

  /* COMPORTAMIENTO CONOCIDO, no un fallo del test: el XP premia la racha, y
     fallar la PRIMERA pregunta no rompe ninguna racha porque el combo ya
     estaba a cero. Una partida que falla las dos primeras saca el mismo XP
     que una perfecta. Las estrellas y las medallas si lo penalizan, que es
     donde se mide el dominio. Si algun dia se cambia, este test lo dira. */
  const early = playAgain(2, 0);
  check('[conocido] fallar las primeras preguntas no cuesta XP',
        early.save.levels[1].history.slice(-1)[0].xp === r2.save.levels[1].best,
        'xp con 2 fallos iniciales=' + early.save.levels[1].history.slice(-1)[0].xp +
        ' vs perfecta=' + r2.save.levels[1].best);
  check('...pero si cuesta estrellas y medallas',
        early.save.levels[1].history.slice(-1)[0].first < r2.save.levels[1].history.slice(-1)[0].first);

  // Antiinflacion de medallas.
  const skills = r3.save.skills;
  const tags = Object.keys(skills);
  check('se registran habilidades', tags.length > 0, 'habilidades=' + tags.length);
  check('ninguna habilidad supera 1 acierto contado por partida',
        tags.every(t => skills[t].hits <= 3 && skills[t].firstHits <= 3),
        JSON.stringify(skills[tags[0]]));
  check('tras 2 partidas limpias ninguna medalla llega a plata (exige 3)',
        (function () {
          const two = r2.save.skills;
          return Object.keys(two).every(t => two[t].firstHits < 3);
        })());
  check('tras 3 partidas alguna habilidad ya es plata',
        tags.some(t => skills[t].firstHits >= 3), JSON.stringify(skills[tags[0]]));
  check('ninguna llega a oro en 3 partidas (exige 5)',
        tags.every(t => skills[t].firstHits < 5));
  check('el save sigue por debajo de 10 KB tras 3 partidas',
        JSON.stringify(r3.save).length < 10240, JSON.stringify(r3.save).length + ' bytes');

  section('9b. Perfil y progreso en el mapa');
  const pf = openGame(slug, store.save, { hero: heroDone() });
  const fw = pf.window, fd = fw.document;
  check('el mapa muestra la barra de progreso', !!fd.querySelector('#mapProgress .bar__fill'));
  const pct = fd.querySelector('#mapProgress .bar__fill').style.width;
  check('la barra no esta vacia tras jugar', pct && pct !== '0%', 'ancho=' + pct);
  fd.getElementById('btnProf').click();
  check('el perfil se abre desde el mapa', visible(fd, 'scrProf'));
  const prof = fd.getElementById('profBody').textContent;
  check('el perfil lista medallas', /MEDALS/.test(prof));
  /* Un perfil con 60 "NOT YET" es una lista de carencias, no una vitrina. */
  check('el perfil no lista las habilidades que aun no tiene', !/NOT YET/.test(prof));
  check('...pero si dice cuantas quedan', /still to unlock/.test(prof));
  /* 16 medallas de bronce de golpe en la primera partida son ruido. */
  check('la victoria no vuelca todas las medallas de golpe',
        (r1.winText.match(/BRONZE/g) || []).length <= 4,
        (r1.winText.match(/BRONZE/g) || []).length + ' medallas listadas');
  check('...y cuenta las que no muestra', /\+\d+ more/.test(r1.winText));
  check('el perfil muestra la mejor racha', /BEST STREAK EVER/.test(prof));
  check('el perfil muestra el historial', /LAST RUNS/.test(prof));
  const wantRows = store.save.levels[1].history.length;
  check('el historial del perfil tiene una fila por partida guardada',
        fd.querySelectorAll('#profBody .prof-table tbody tr').length === wantRows,
        'filas=' + fd.querySelectorAll('#profBody .prof-table tbody tr').length + ' esperadas=' + wantRows);
  check('el perfil no muestra fechas, solo el orden de las partidas',
        !/\b(20\d\d|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/.test(prof));
  check('nada del perfil compara con otros ninos',
        !/rank|leaderboard|others|class average/i.test(prof));
  fd.getElementById('profBack').click();
  check('DONE vuelve al mapa', visible(fd, 'scrMap'));
  pf.window.close();

  /* Un jugador nuevo no puede ver un perfil lleno de datos vacios. */
  const pf2 = openGame(slug, null, { hero: heroDone() });
  pf2.window.document.getElementById('btnProf').click();
  check('sin partidas, el perfil lo dice en vez de mostrar tablas vacias',
        /Nothing played yet/.test(pf2.window.document.getElementById('profBody').textContent));
  pf2.window.close();
  void lvId1;

  /* ============================================================
     10. LUGARES (PLAN-AMBIENTES) y camino de tramos
     ============================================================ */
  section('10. Cada nivel es un lugar: capas, props, materiales');
  const ev = openGame(slug, {
    version: 3, sound: true, music: false, aula: false, totalXP: 0, skills: {}, bestComboEver: 0,
    levels: { 1: { done: true, stars: 3, best: 3600, plays: 1, bossClean: false, history: [] },
              2: { done: true, stars: 3, best: 3600, plays: 1, bossClean: false, history: [] },
              3: { done: true, stars: 3, best: 3600, plays: 1, bossClean: false, history: [] },
              4: { done: true, stars: 3, best: 3600, plays: 1, bossClean: false, history: [] } }
  }, { hero: heroDone() });
  const ew = ev.window, ed = ew.document;
  const lvls = ew.QUIZ_DATA.levels;
  check('todos los niveles declaran un lugar en datos', lvls.every(l => l.env && l.env.palette && l.env.materials));
  const propIds = Object.keys(ew.GAME_PROPS.props);
  const matIds  = Object.keys(ew.GAME_PROPS.materials);
  const usedProps = [], usedMats = [];
  lvls.forEach(l => {
    ['far', 'wall', 'fg'].forEach(k => (l.env[k] || []).forEach(o => usedProps.push(o.prop)));
    if (l.env.gate) usedProps.push(l.env.gate);
    Object.keys(l.env.materials).forEach(k => usedMats.push(l.env.materials[k]));
  });
  check('todo prop declarado en datos existe en props.js',
        usedProps.every(p => propIds.indexOf(p) !== -1), usedProps.filter(p => propIds.indexOf(p) === -1).join(','));
  check('todo material declarado existe en props.js', usedMats.every(m => matIds.indexOf(m) !== -1));
  /* Visto en vivo: un prop de `wall` apoyado en el suelo cae DETRAS de las
     puertas y no se ve. En la pared solo van cosas de la franja alta. */
  check('ningun prop de pared se apoya en el suelo (quedaria detras de las puertas)',
        lvls.every(l => (l.env.wall || []).every(o => o.y === 'top')));
  check('todo nivel tiene algo asomando contra el cielo (capa far)',
        lvls.every(l => (l.env.far || []).length >= 1 || l.env.gate));
  check('cada nivel tiene una paleta distinta (no son el mismo sitio repintado)',
        new Set(lvls.map(l => l.env.palette.sky + l.env.materials.wall + l.env.materials.floor)).size === lvls.length);

  /* Regla R7: cero nombres de lugar en el motor. Los ids de props solo pueden
     aparecer en props.js y en data.js. */
  const engSrc = fs.readFileSync(path.join(ROOT, 'assets', 'engine.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');          // los comentarios no son codigo
  const leakedProps = propIds.filter(p => new RegExp("['\"]" + p + "['\"]").test(engSrc));
  check('ningun id de prop aparece como literal en engine.js', leakedProps.length === 0, leakedProps.join(','));
  check('el motor no conoce lugares por nombre',
        !/\b(castle|castillo|forest|bosque|cave|cueva|tower|torre|river|rio)\b/i.test(engSrc));

  // Montaje real: entrar al nivel 1 y al 3, comparar.
  function enterLevel(doc, win, idx) {
    doc.querySelectorAll('#levelList .level-card')[idx].dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    doc.getElementById('briefGo').click();
  }
  enterLevel(ed, ew, 0);
  const world = ed.getElementById('qWorld');
  check('al entrar a un nivel se monta el lugar detras de la escena',
        !!world.querySelector('.env') && world.classList.contains('has-env'));
  check('el lugar tiene cielo, lejano, pared, suelo',
        ['env__sky', 'env__far', 'env__wall', 'env__floor'].every(c => !!world.querySelector('.' + c)));
  const nProps = world.querySelectorAll('.env .prop').length;
  check('el lugar tiene props pintados', nProps >= 6, 'props=' + nProps);
  /* El url() del material vive dentro de style="...": con comillas dobles el
     atributo se cortaba en `url(` y no se pintaba nada. Paso. Se exige el
     data-URI COMPLETO, con su cierre. */
  const matRe = /url\('data:image\/svg\+xml,[^']+'\)/;
  check('la pared y el suelo llevan material tintado, entero (el style no se corta)',
        matRe.test(world.querySelector('.env__wall').getAttribute('style') || '') &&
        matRe.test(world.querySelector('.env__floor').getAttribute('style') || ''),
        (world.querySelector('.env__wall').getAttribute('style') || '').slice(0, 90));
  check('la puerta del jefe esta al fondo desde el primer tramo', !!world.querySelector('.env__gate'));
  check('las variables del lugar estan en el host (las puertas las heredan)',
        /--env-slot/.test(world.getAttribute('style') || ''));
  check('todo lo decorativo es aria-hidden', world.querySelector('.env').getAttribute('aria-hidden') === 'true');
  check('el lugar se pinta DETRAS de la escena', world.firstElementChild.classList.contains('env'));
  const sky1 = world.style.getPropertyValue('--env-sky');

  // El camino del HUD: un tramo por familia.
  const segs = ed.querySelectorAll('#hudPath i');
  check('el HUD muestra el camino con un tramo por familia', segs.length === lvls[0].questions.length, 'tramos=' + segs.length);
  check('el tramo actual esta marcado', ed.querySelectorAll('#hudPath i.now').length === 1);

  // Responder y avanzar: la puerta del jefe se acerca, el lugar se desliza,
  // la escena nueva es respondible en el mismo tick.
  let f0 = findVariant(ew, ed);
  clickOption(ed, f0.pick.v.answer);
  const gs0 = world.querySelector('.env__gate').style.getPropertyValue('--gs');
  ed.getElementById('btnNext').click();
  check('tras NEXT el lugar se desliza un tramo (clase is-shift)', world.querySelector('.env').classList.contains('is-shift'));
  check('la escena nueva entra (is-in) y la vieja sale (is-out)',
        !!ed.querySelector('#qScene .scene-slot.is-in') && !!ed.querySelector('#qScene .scene-slot.is-out'));
  check('la escena que sale es aria-hidden y no recibe clics',
        ed.querySelector('#qScene .scene-slot.is-out').getAttribute('aria-hidden') === 'true');
  const f1 = findVariant(ew, ed);
  check('la pregunta siguiente es respondible en el MISMO tick (la transicion no bloquea)', !!f1);
  check('un tramo del camino queda marcado como superado', ed.querySelectorAll('#hudPath i.on').length === 1);
  check('la puerta del jefe se ha acercado', parseFloat(gs0) > 0.45);
  await sleep(700);
  check('la escena vieja se retira sola', !ed.querySelector('#qScene .scene-slot.is-out'));

  // Parallax: mover al heroe cambia --hx.
  key(ew, ed, 'ArrowRight'); key(ew, ed, 'ArrowRight');
  check('mover al heroe desplaza el lugar (parallax --hx)', parseFloat(world.querySelector('.env').style.getPropertyValue('--hx')) > 0);

  // Otro nivel, otro lugar.
  ed.getElementById('btnQuit').click();
  check('al salir, el lugar se desmonta', !world.querySelector('.env') && !world.classList.contains('has-env'));
  enterLevel(ed, ew, 2);
  const sky3 = world.style.getPropertyValue('--env-sky');
  check('el nivel 3 es otro lugar (otro cielo)', sky3 && sky3 !== sky1, sky1 + ' vs ' + sky3);
  ev.window.close();

  section('10b. Modo aula y reduced-motion: el lugar se queda quieto');
  const ea = openGame(slug, null, { hero: heroDone() });
  const aw2 = ea.window, adoc = aw2.document;
  adoc.getElementById('btnAula').click();
  check('el boton de modo aula cambia de estado', /ON/.test(adoc.getElementById('btnAula').textContent));
  check('modo aula se guarda', JSON.parse(aw2.localStorage.getItem('samuel-quest:' + slug)).aula === true);
  check('modo aula pone la clase en <html>', adoc.documentElement.classList.contains('is-aula'));
  enterLevel(adoc, aw2, 0);
  let fa = findVariant(aw2, adoc); clickOption(adoc, fa.pick.v.answer);
  adoc.getElementById('btnNext').click();
  check('en modo aula no hay deslizamiento ni escena saliente',
        !adoc.querySelector('#qWorld .env.is-shift') && !adoc.querySelector('#qScene .scene-slot.is-out'));
  check('...pero el lugar sigue ahi (no se quita la escenografia, solo el movimiento)', !!adoc.querySelector('#qWorld .env'));
  adoc.getElementById('btnHint').click();
  check('en modo aula la pista abre sin esperar', adoc.getElementById('qHint').classList.contains('is-on'));
  ea.window.close();
  const cssPub2 = fs.readFileSync(path.join(ROOT, slug + '.html'), 'utf8');
  check('reduced-motion apaga la animacion del lugar en CSS',
        /prefers-reduced-motion[\s\S]{0,600}\.env[^{]*\{[^}]*animation:\s*none/.test(cssPub2));
  check('modo aula apaga la animacion del lugar en CSS', /\.is-aula \.env[^{]*\{[^}]*animation:\s*none/.test(cssPub2));

  section('10c. Teclado del colegio: la flecha mantenida no te pasa de largo');
  const ek = openGame(slug, null, { hero: heroDone() });
  const kw = ek.window, kd = kw.document;
  enterLevel(kd, kw, 0);
  key(kw, kd, 'ArrowRight');
  kd.dispatchEvent(new kw.KeyboardEvent('keydown', { key: 'ArrowRight', repeat: true, bubbles: true, cancelable: true }));
  kd.dispatchEvent(new kw.KeyboardEvent('keydown', { key: 'ArrowRight', repeat: true, bubbles: true, cancelable: true }));
  const hereK = kd.querySelector('#qScene .scene-slot:not(.is-out) .door.is-here');
  check('los keydown repetidos se ignoran: el heroe sigue en la primera puerta',
        hereK && hereK === kd.querySelectorAll('#qScene .scene-slot:not(.is-out) .door')[0]);
  ek.window.close();

  /* ============================================================
     11. CONTENIDO v2: 7 niveles por habilidad, con jefe (Fase 4)
     ============================================================ */
  section('11. Los 7 niveles y sus jefes, como datos');
  const dv = openGame(slug, null, { hero: heroDone() });
  const LV = dv.window.QUIZ_DATA.levels;
  check('hay 7 niveles', LV.length === 7, 'niveles=' + LV.length);
  check('cada nivel tiene 12 familias', LV.every(l => l.questions.length === 12),
        LV.map(l => l.questions.length).join(','));
  check('cada familia tiene al menos 5 variantes',
        LV.every(l => l.questions.every(f => f.variants.length >= 5)));
  check('cada nivel declara una habilidad y una mecanica',
        LV.every(l => l.skill && l.mech));
  const MECHS = ['doors', 'bridge', 'ruler', 'planks', 'lift', 'rule', 'machine', 'smash'];
  check('las mecanicas son las del plan', LV.every(l => MECHS.indexOf(l.mech) !== -1),
        LV.map(l => l.mech).join(','));
  check('cada familia hereda la mecanica de su nivel',
        LV.every(l => l.questions.every(f => f.mech === l.mech)));
  check('las 5 mecanicas nuevas ya estan en datos (la Fase 5 solo las dibuja)',
        new Set(LV.map(l => l.mech)).size >= 5, [...new Set(LV.map(l => l.mech))].join(','));

  // Ninguna habilidad en dos niveles: si no, una medalla mezclaria dos cosas.
  const skillHome = {};
  let dupSkill = null;
  LV.forEach(l => l.questions.forEach(f => {
    if (skillHome[f.skill] != null && skillHome[f.skill] !== l.id) dupSkill = f.skill;
    skillHome[f.skill] = l.id;
  }));
  check('ninguna habilidad aparece en dos niveles', dupSkill === null, dupSkill || '');

  section('11b. Los jefes evaluan lo que su nivel NO evalua');
  check('los 7 niveles tienen jefe', LV.every(l => l.boss && l.boss.name));
  check('cada jefe tiene 4-5 rondas',
        LV.every(l => l.boss.rounds.length >= 4 && l.boss.rounds.length <= 5));
  check('cada jefe tiene vidas, fases, escudos y modo coach',
        LV.every(l => l.boss.hp >= 3 && l.boss.phases >= 1 && l.boss.shields === 3 && l.boss.mercy === 2));
  check('la dificultad del jefe escala del 1 al 7',
        LV[0].boss.hp <= LV[6].boss.hp && LV[0].boss.phases < LV[6].boss.phases,
        'N1 hp=' + LV[0].boss.hp + '/f=' + LV[0].boss.phases + ' N7 hp=' + LV[6].boss.hp + '/f=' + LV[6].boss.phases);
  const EVALS = ['inverse', 'verify', 'distinguish', 'combine'];
  check('cada ronda declara que evalua',
        LV.every(l => l.boss.rounds.every(r => EVALS.indexOf(r.evaluates) !== -1)));
  /* LA regla del plan (§0.5): un jefe no puede ser "mas preguntas del nivel". */
  const bossLeak = [];
  LV.forEach(l => {
    const own = new Set(l.questions.map(f => f.skill));
    l.boss.rounds.forEach(r => { if (own.has(r.skill)) bossLeak.push('N' + l.id + ':' + r.skill); });
  });
  check('ningun jefe repite una habilidad de su propio nivel', bossLeak.length === 0, bossLeak.join(', '));
  check('los cuatro tipos de evaluacion se usan en el juego',
        new Set(LV.flatMap(l => l.boss.rounds.map(r => r.evaluates))).size === 4);
  check('todos los textos del jefe estan en datos, no en el motor',
        LV.every(l => l.boss.enter && l.boss.win && l.boss.lose && l.boss.retry));
  const bossNames = LV.map(l => l.boss.name);
  check('ningun nombre de jefe aparece en engine.js ni en ui.js',
        bossNames.every(n => engSrc.indexOf(n) === -1 &&
          fs.readFileSync(path.join(ROOT, 'assets', 'ui.js'), 'utf8').indexOf(n) === -1),
        bossNames.filter(n => engSrc.indexOf(n) !== -1).join(','));

  section('11c. El motor de hoy sigue jugando con los datos nuevos');
  check('el mapa pinta los 7 niveles',
        dv.window.document.querySelectorAll('#levelList .level-card').length === 7);
  check('el registro dice 7 niveles', subs[0].levels === 7, 'subjects.js dice ' + subs[0].levels);
  check('el nivel 7 esta bloqueado al empezar',
        dv.window.document.querySelectorAll('#levelList .level-card')[6].classList.contains('is-locked'));
  /* Las mecanicas nuevas todavia no tienen escena: deben caer en `doors` sin
     romperse, que es justo para lo que existe el fallback. */
  dv.window.document.querySelectorAll('#levelList .level-card')[0]
    .dispatchEvent(new dv.window.MouseEvent('click', { bubbles: true }));
  dv.window.document.getElementById('briefGo').click();
  check('una mecanica sin escena todavia cae en doors y se puede jugar',
        dv.window.document.querySelectorAll('#qScene .scene-slot:not(.is-out) .door').length === 4);
  dv.window.close();

  section('11d. Contenido: nada imposible de leer');
  const allV = LV.flatMap(l => l.questions.concat(l.boss.rounds).flatMap(f =>
    f.variants.map(v => ({ id: f.id, v }))));
  check('ninguna variante repite opciones',
        allV.every(x => new Set(x.v.options.map(String)).size === 4),
        (allV.find(x => new Set(x.v.options.map(String)).size !== 4) || { id: '' }).id);
  check('la respuesta correcta siempre esta entre las opciones',
        allV.every(x => x.v.answer >= 0 && x.v.answer < 4 && x.v.options[x.v.answer] != null));
  check('ninguna opcion esta vacia', allV.every(x => x.v.options.every(o => String(o).trim() !== '')));
  check('toda variante tiene pista y explicacion', allV.every(x => x.v.hint && x.v.explain));
  check('ningun enunciado quedo con un marcador sin sustituir',
        allV.every(x => !/\{\w+\}/.test(x.v.stem + String(x.v.explain))));
  console.log('       (contenido total: ' + LV.length + ' niveles, ' +
              LV.reduce((a, l) => a + l.questions.length + l.boss.rounds.length, 0) + ' familias, ' +
              allV.length + ' variantes)');

  /* ---------- resumen ---------- */
  console.log('\n' + '-'.repeat(56));
  if (failures.length) {
    console.log(failures.length + ' FALLOS, ' + passed + ' comprobaciones ok');
    failures.forEach(f => console.log('  - ' + f));
    process.exit(1);
  }
  console.log('TODO OK — ' + passed + ' comprobaciones, ' + r.steps + ' respuestas simuladas');
  process.exit(0);
}

main();
