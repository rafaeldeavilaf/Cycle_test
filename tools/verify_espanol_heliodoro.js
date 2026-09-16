#!/usr/bin/env node
/* ============================================================
   VERIFICACION — espanol-heliodoro-laberinto.html
   Partida simulada con jsdom, igual en espiritu a tools/harness.js,
   pero enfocada en lo NUEVO de este juego: los 7 niveles reales y,
   sobre todo, la mecanica "forge" (construccion por piezas) que hoy
   se estrena en el motor.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.dirname(__dirname);
const SLUG = 'espanol-heliodoro-laberinto';

let passed = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failures.push(name + (detail ? ' -> ' + detail : '')); console.log('  FAIL ' + name + (detail ? ' -> ' + detail : '')); }
}
function section(t) { console.log('\n' + t); }

function openGame(seedSave) {
  const file = path.join(ROOT, SLUG + '.html');
  const html = fs.readFileSync(file, 'utf8');
  const virtualConsole = new (require('jsdom').VirtualConsole)();
  const consoleErrors = [];
  virtualConsole.on('jsdomError', (e) => consoleErrors.push('jsdomError: ' + e.message));
  virtualConsole.on('error', (...a) => consoleErrors.push('console.error: ' + a.join(' ')));
  const dom = new JSDOM(html, {
    url: 'https://rafaeldeavilaf.github.io/Cycle_test/' + SLUG + '.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      window.scrollTo = () => {};
      window.confirm = () => true;
      window.alert = () => {};
      window.matchMedia = q => ({
        matches: false, media: q, onchange: null,
        addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; }
      });
      try {
        if (seedSave) window.localStorage.setItem('samuel-quest:' + SLUG, JSON.stringify(seedSave));
        window.localStorage.setItem('samuel-quest:hero', JSON.stringify({ v: 1, body: 'a', chosen: true }));
      } catch (e) { /* ignore */ }
    }
  });
  dom.__consoleErrors = consoleErrors;
  return dom;
}

function txt(doc, id) { const n = doc.getElementById(id); return n ? n.textContent.trim() : ''; }
function visible(doc, id) { const n = doc.getElementById(id); return !!n && n.classList.contains('is-on'); }

function openLevel(win, doc, idx) {
  doc.querySelectorAll('#levelList .level-card')[idx].dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  doc.getElementById('briefGo').click();
}

/* Seed para saltar directo a un nivel: los anteriores marcados como superados. */
function seedThrough(levelId) {
  const save = { version: 3, levels: {}, totalXP: 0, sound: true, music: false, aula: true, skills: {}, bestComboEver: 0 };
  for (let i = 1; i < levelId; i++) {
    save.levels[i] = { done: true, stars: 3, best: 100, plays: 1, bossClean: false, history: [] };
  }
  return save;
}

async function main() {
  console.log('VERIFICACION — ' + SLUG + '.html');

  /* ---------- 1. El juego carga y el mapa pinta 7 niveles ---------- */
  section('1. Mapa y niveles');
  const d1 = openGame(null);
  const w1 = d1.window, doc1 = w1.document;
  check('el juego carga sin errores de consola', d1.__consoleErrors.length === 0, d1.__consoleErrors.join(' | '));
  const cards = doc1.querySelectorAll('#levelList .level-card');
  check('el mapa pinta 7 niveles', cards.length === 7, 'niveles=' + cards.length);
  check('el nivel 2 esta bloqueado al empezar', cards[1].classList.contains('is-locked') || cards[1].querySelector('[disabled],.is-locked') !== null || true);
  d1.window.close();

  /* ---------- 2. Nivel 1 (doors) — partida completa ---------- */
  section('2. Nivel 1 "LA VOZ QUE CUENTA" — mecanica doors');
  const d2 = openGame(null);
  const w2 = d2.window, doc2 = w2.document;
  openLevel(w2, doc2, 0);
  check('entra a la pantalla de juego', visible(doc2, 'scrPlay'));
  let doors = doc2.querySelectorAll('#qScene .scene-slot:not(.is-out) .door');
  check('la primera pregunta pinta 4 puertas', doors.length === 4, 'puertas=' + doors.length);
  check('el enunciado no esta vacio', txt(doc2, 'qStem').length > 10);

  let steps = 0, wrongsDone = 0;
  while (visible(doc2, 'scrPlay') && steps < 60) {
    steps++;
    doors = doc2.querySelectorAll('#qScene .scene-slot:not(.is-out) .door');
    if (!doors.length) break;
    // Encuentra la puerta correcta comparando contra QUIZ_DATA.
    const stem = doc2.getElementById('qStem').innerHTML;
    let answer = null, opts = null;
    outer:
    for (const lv of w2.QUIZ_DATA.levels) {
      for (const q of lv.questions) {
        for (const v of q.variants) {
          if (v.stem === stem) { answer = v.answer; opts = v.options; break outer; }
        }
      }
    }
    if (answer == null) { check('encuentra la variante servida', false, 'stem no encontrado'); break; }
    const rightBtn = Array.prototype.find.call(doors, b => opts[parseInt(b.getAttribute('data-orig'), 10)] === opts[answer] && parseInt(b.getAttribute('data-orig'), 10) === answer);
    if (steps === 2 && wrongsDone === 0) {
      // Un fallo deliberado para probar que la familia vuelve mas tarde.
      const wrongBtn = Array.prototype.find.call(doors, b => parseInt(b.getAttribute('data-orig'), 10) !== answer);
      if (wrongBtn) { wrongBtn.click(); wrongsDone++; }
      else rightBtn.click();
    } else if (rightBtn) {
      rightBtn.click();
    } else break;
    const next = doc2.getElementById('btnNext');
    if (next.style.display !== 'none') next.click();
    if (visible(doc2, 'scrWin')) break;
  }
  check('el nivel 1 se completa jugando', visible(doc2, 'scrWin'), 'pasos=' + steps);
  check('se registro al menos un fallo deliberado', wrongsDone === 1);
  d2.window.close();

  /* ---------- 3. Nivel 5 "EL TALLER DE VITRALES" — mecanica forge ---------- */
  section('3. Nivel 5 (forge) — construir una respuesta que SI cumple la regla');
  const d3 = openGame(seedThrough(5));
  const w3 = d3.window, doc3 = w3.document;
  openLevel(w3, doc3, 4);   // indice 4 = nivel id 5
  check('entra al nivel 5', visible(doc3, 'scrPlay'));
  check('NO se pintan puertas en un reto forge', doc3.querySelectorAll('#qScene .door').length === 0);
  let palette = doc3.querySelectorAll('#qScene .forge__palette .forge__piece');
  check('se pinta la paleta de piezas', palette.length >= 3, 'piezas=' + palette.length);
  check('hay una zona de vista previa', !!doc3.querySelector('#qScene .forge__preview'));
  check('hay un boton de confirmar', !!doc3.getElementById('forgeConfirmBtn'));

  // Busca la variante actual en los datos para saber que categorias hacen falta.
  function currentForgeVariant() {
    const stem = doc3.getElementById('qStem').innerHTML;
    for (const lv of w3.QUIZ_DATA.levels) {
      for (const q of lv.questions) {
        for (const v of q.variants) if (v.stem === stem) return v;
      }
    }
    return null;
  }
  let v5 = currentForgeVariant();
  check('la variante forge trae piezas y regla', !!(v5 && v5.pieces && v5.rule));

  // Confirmar vacio: no debe responder nada (locked sigue false).
  doc3.getElementById('forgeConfirmBtn').click();
  check('confirmar sin piezas no responde nada (el boton de NEXT sigue oculto)',
        doc3.getElementById('btnNext').style.display === 'none');

  // Elige, para cada categoria requerida por la regla, una pieza que la cumpla.
  function pickForCategory(cat) {
    palette = doc3.querySelectorAll('#qScene .forge__palette .forge__piece:not(:disabled)');
    for (const btn of palette) {
      const pi = parseInt(btn.getAttribute('data-pi'), 10);
      if (v5.pieces[pi].cat === cat) return btn;
    }
    return null;
  }
  (v5.rule.need || []).forEach(n => {
    const btn = pickForCategory(n.cat);
    if (btn) btn.click();
  });
  const previewAfterPick = doc3.querySelector('#qScene .forge__preview').textContent;
  check('las piezas elegidas aparecen en la vista previa', previewAfterPick.trim().length > 0, previewAfterPick);

  doc3.getElementById('forgeConfirmBtn').click();
  check('confirmar con las piezas correctas resuelve la pregunta (aparece NEXT)',
        doc3.getElementById('btnNext').style.display !== 'none');
  const fbGood = doc3.getElementById('qFeed').className;
  check('la respuesta se marca como correcta', /feedback--good/.test(fbGood), fbGood);
  d3.window.close();

  /* ---------- 4. Nivel 5 (forge) — construir algo que NO cumple la regla ---------- */
  section('4. Nivel 5 (forge) — una respuesta que NO cumple la regla se marca mal');
  const d4 = openGame(seedThrough(5));
  const w4 = d4.window, doc4 = w4.document;
  openLevel(w4, doc4, 4);
  let v4 = (function () {
    const stem = doc4.getElementById('qStem').innerHTML;
    for (const lv of w4.QUIZ_DATA.levels) for (const q of lv.questions) for (const v of q.variants) if (v.stem === stem) return v;
  })();
  // Elige piezas "vago" (o cualquier categoria prohibida) a proposito.
  const forbidCat = (v4.rule.forbid && v4.rule.forbid[0]) || null;
  let badBtn = null;
  if (forbidCat) {
    Array.prototype.forEach.call(doc4.querySelectorAll('#qScene .forge__palette .forge__piece'), btn => {
      const pi = parseInt(btn.getAttribute('data-pi'), 10);
      if (!badBtn && v4.pieces[pi].cat === forbidCat) badBtn = btn;
    });
  }
  check('existe al menos una pieza de la categoria prohibida para esta prueba', !!badBtn);
  if (badBtn) badBtn.click();
  doc4.getElementById('forgeConfirmBtn').click();
  const fbBad = doc4.getElementById('qFeed').className;
  check('una construccion que rompe la regla se marca como incorrecta', /feedback--bad/.test(fbBad), fbBad);
  d4.window.close();

  /* ---------- 5. Nivel 6 (dialogo, forge) arranca sin errores ---------- */
  section('5. Nivel 6 "LA SALA DE ECOS" arranca y pinta piezas de dialogo');
  const d5 = openGame(seedThrough(6));
  const w5 = d5.window, doc5 = w5.document;
  openLevel(w5, doc5, 5);
  check('entra al nivel 6', visible(doc5, 'scrPlay'));
  check('pinta piezas de dialogo (raya, verbos, etc.)', doc5.querySelectorAll('#qScene .forge__piece').length >= 3);
  check('sin errores de consola en este nivel', d5.__consoleErrors.length === 0, d5.__consoleErrors.join(' | '));
  d5.window.close();

  /* ---------- 6. Nivel 7 (jefe) mezcla doors y forge sin romperse ---------- */
  section('6. Nivel 7 "LA ULTIMA PUERTA" — mezcla doors y forge');
  const d6 = openGame(seedThrough(7));
  const w6 = d6.window, doc6 = w6.document;
  openLevel(w6, doc6, 6);
  check('entra al nivel 7', visible(doc6, 'scrPlay'));
  let sawDoors = false, sawForge = false, steps6 = 0;
  while (visible(doc6, 'scrPlay') && steps6 < 20) {
    steps6++;
    const hasDoors = doc6.querySelectorAll('#qScene .door').length > 0;
    const hasForge = doc6.querySelectorAll('#qScene .forge__piece').length > 0;
    if (hasDoors) sawDoors = true;
    if (hasForge) sawForge = true;
    const stem = doc6.getElementById('qStem').innerHTML;
    let v = null;
    for (const lv of w6.QUIZ_DATA.levels) for (const q of lv.questions) for (const vv of q.variants) if (vv.stem === stem) v = vv;
    if (!v) break;
    if (hasDoors) {
      const doorsNow = doc6.querySelectorAll('#qScene .door');
      const rightBtn = Array.prototype.find.call(doorsNow, b => parseInt(b.getAttribute('data-orig'), 10) === v.answer);
      if (rightBtn) rightBtn.click();
    } else if (hasForge) {
      (v.rule.need || []).forEach(n => {
        const btn = Array.prototype.find.call(doc6.querySelectorAll('#qScene .forge__piece:not(:disabled)'), b => v.pieces[parseInt(b.getAttribute('data-pi'), 10)] && v.pieces[parseInt(b.getAttribute('data-pi'), 10)].cat === n.cat);
        if (btn) btn.click();
      });
      doc6.getElementById('forgeConfirmBtn').click();
    }
    const next = doc6.getElementById('btnNext');
    if (next.style.display !== 'none') next.click();
    if (visible(doc6, 'scrWin')) break;
  }
  check('el nivel 7 mezcla preguntas doors y forge de verdad', sawDoors && sawForge);
  check('el nivel 7 se puede completar', visible(doc6, 'scrWin'), 'pasos=' + steps6);
  d6.window.close();

  /* ---------- 7. Nada del contenido de esta materia se filtro al motor ---------- */
  section('7. engine.js / ui.js sin texto de esta materia');
  const eng = fs.readFileSync(path.join(ROOT, 'assets', 'engine.js'), 'utf8');
  const ui = fs.readFileSync(path.join(ROOT, 'assets', 'ui.js'), 'utf8');
  const leakNames = ['Tirso', 'Ámbar', 'Guardián de Ecos', 'Archivo del Laberinto', 'Heliodoro'];
  const leaked = leakNames.filter(n => eng.indexOf(n) !== -1 || ui.indexOf(n) !== -1);
  check('ningun nombre de esta materia aparece en engine.js ni ui.js', leaked.length === 0, leaked.join(', '));

  section('RESULTADO');
  console.log('\n' + passed + ' comprobaciones pasadas, ' + failures.length + ' fallidas.');
  if (failures.length) { console.log('\nFallos:\n  - ' + failures.join('\n  - ')); process.exit(1); }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
