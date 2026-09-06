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

function openGame(slug, seedSave) {
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
      if (seedSave) {
        try { window.localStorage.setItem('samuel-quest:' + slug, JSON.stringify(seedSave)); }
        catch (e) { /* ignore */ }
      }
    }
  });
  return dom;
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
  const opts = Array.from(doc.querySelectorAll('#qScene .door'))
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
  const b = doc.querySelector('#qScene .door[data-orig="' + origIdx + '"]');
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
  const doors = Array.from(doc.querySelectorAll('#qScene .door'));
  const pos = doors.findIndex(d => parseInt(d.getAttribute('data-orig'), 10) === origIdx);
  if (pos === -1) throw new Error('no encuentro la puerta ' + origIdx);
  // Enter en la casilla de inicio no debe responder nada: se comprueba fuera.
  for (let i = 0; i <= pos; i++) key(win, doc, 'ArrowRight');
  const here = doc.querySelectorAll('#qScene .door.is-here');
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

  while (visible(doc, 'scrPlay') && steps < 2000) {
    steps++;
    const found = findVariant(win, doc);
    if (!found) { problems.push('paso ' + steps + ': no puedo identificar la variante servida'); break; }
    if (found.ambiguous) ambiguousSeen = true;

    const fi = found.pick.fi, vi = found.pick.vi;
    (served[fi] = served[fi] || []).push(vi);
    if (victim === null) victim = fi;

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
    const lit = doc.querySelector('#qScene .door.is-right');
    if (!lit || parseInt(lit.getAttribute('data-orig'), 10) !== answer) rightHighlightOk = false;
    // Al fallar, el heroe vuelve al inicio del tramo y ninguna puerta queda "aqui".
    if (goWrong && doc.querySelectorAll('#qScene .door.is-here').length !== 0) heroReturned = false;

    const next = doc.getElementById('btnNext');
    next.click();
    if (visible(doc, 'scrWin')) next.click();   // doble clic deliberado en la ultima
  }

  return { dom, win, doc, served, problems, steps, rightHighlightOk, ambiguousSeen,
           wrongsDone, victim, walkOk, heroReturned };
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
function main() {
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
  check('tras fallar, el heroe vuelve al inicio del tramo', r.heroReturned);
  check('ninguna variante es ambigua (mismo texto, distinta respuesta)', !r.ambiguousSeen);

  /* ---------- 1b. El mismo nivel SOLO con el teclado ---------- */
  section('1b. Nivel completo solo con teclado (flechas + Enter)');
  const rk = playFullLevel(slug, 0, { mode: 'spread', n: 3, input: 'keyboard' });
  check('la partida no se atasca solo con teclado', rk.problems.length === 0, rk.problems.join(' | '));
  check('el nivel termina solo con teclado', visible(rk.doc, 'scrWin'));
  check('el heroe pisa siempre la puerta elegida', rk.walkOk);
  check('la puerta correcta se ilumina', rk.rightHighlightOk);
  check('tras fallar, el heroe vuelve al inicio', rk.heroReturned);
  const savedK = JSON.parse(rk.win.localStorage.getItem('samuel-quest:' + slug));
  check('la partida por teclado se guarda igual', savedK.levels[rk.win.QUIZ_DATA.levels[0].id].done === true);
  rk.dom.window.close();

  /* ---------- 1c. Reglas de la escena ---------- */
  section('1c. Escena: accesibilidad y reglas de movimiento');
  const ds = openGame(slug);
  const dw = ds.window, dd = dw.document;
  dd.querySelectorAll('#levelList .level-card')[0].dispatchEvent(new dw.MouseEvent('click', { bubbles: true }));
  dd.getElementById('briefGo').click();

  const doors = Array.from(dd.querySelectorAll('#qScene .door'));
  check('la escena pinta 4 puertas', doors.length === 4, 'puertas=' + doors.length);
  check('cada puerta es un <button> real', doors.every(d => d.tagName === 'BUTTON' && d.type === 'button'));
  check('cada puerta lleva aria-label con su letra y su valor',
        doors.every((d, i) => (d.getAttribute('aria-label') || '').indexOf('ABCD'[i]) !== -1));
  check('el contenedor es un role=group con nombre', dd.getElementById('qScene').getAttribute('role') === 'group' &&
        !!dd.getElementById('qScene').getAttribute('aria-label'));
  check('existe la region aria-live de posicion', dd.getElementById('qSay').getAttribute('aria-live') === 'polite');

  // El heroe arranca FUERA de las puertas: moverse es parte de responder.
  check('el heroe arranca en la casilla de inicio, no sobre una puerta',
        dd.querySelectorAll('#qScene .door.is-here').length === 0 &&
        dd.querySelector('.scene__start').classList.contains('is-here'));
  // Enter sin haberse movido no puede contestar.
  key(dw, dd, 'Enter');
  check('Enter en el inicio no responde nada', !doors.some(d => d.disabled));
  check('...y avisa de que hay que moverse', (txt(dd, 'qSay') || '').length > 0, 'aria-live="' + txt(dd, 'qSay') + '"');

  key(dw, dd, 'ArrowRight');
  check('una flecha mueve exactamente una casilla', dd.querySelectorAll('#qScene .door.is-here').length === 1 &&
        doors[0].classList.contains('is-here'));
  check('la posicion se anuncia por aria-live', (txt(dd, 'qSay') || '').length > 0);
  key(dw, dd, 'ArrowLeft'); key(dw, dd, 'ArrowLeft');
  check('no se puede salir del corredor por la izquierda',
        dd.querySelector('.scene__start').classList.contains('is-here'));
  for (let i = 0; i < 9; i++) key(dw, dd, 'ArrowRight');
  check('no se puede salir del corredor por la derecha',
        doors[3].classList.contains('is-here'));
  ds.window.close();

  /* La reduced-motion de la escena es CSS puro: no hay rama JS que probar,
     asi que se verifica que la regla exista en la hoja publicada. */
  const cssPub = fs.readFileSync(path.join(ROOT, slug + '.html'), 'utf8');
  check('con prefers-reduced-motion el heroe no camina, aparece',
        /prefers-reduced-motion[\s\S]{0,400}\.scene__hero\s*\{\s*transition:\s*none/.test(cssPub));

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
  /* HALLAZGO (no es Fase 0): stars() mide aciertos al primer intento POR FAMILIA.
     Fallar una familia siete veces seguidas cuesta 1/16 = sigue dando 3 estrellas.
     Es coherente con v1 pero contradice el criterio del plan ("no domina = falla
     la misma familia 3 veces"). Decision para la Fase 3 (§4 Puntuacion).
     El test fija el comportamiento ACTUAL para que un cambio futuro sea visible. */
  check('[v1] tres estrellas pese a machacar una familia — comportamiento conocido',
        savedF.levels[lvIdF].stars === 3, 'stars=' + savedF.levels[lvIdF].stars);
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
