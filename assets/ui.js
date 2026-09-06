/* ============================================================
   SAMU: A LINK TO THE MATH — UI.JS
   Capa de CHROME compartido.

   Aqui vive TODO el texto de interfaz que es identico para
   cualquier materia: botones, HUD, titulos de pantalla, mensajes
   genericos del companero. `engine.js` no contiene ni un solo
   texto visible; lo lee de aqui.

   Tres capas (PLAN-V2.md §0.2):
     data.js  -> contenido de la materia (mundos, jefes, preguntas)
     ui.js    -> chrome compartido            <- ESTE ARCHIVO
     engine.js-> logica, cero texto visible

   Cualquier materia puede sobreescribir cualquier clave de aqui
   declarando `DATA.ui = { ... }` en su data.js. La mezcla es
   profunda: solo se pisa lo que se declara.

   Placeholders: {n}, {total}, {xp}... se sustituyen con UI.fmt().
   Se editan a mano, casi nunca. Un nombre de jefe NO va aqui:
   va en data.js. (Regla grep del proyecto.)
   ============================================================ */
window.GAME_UI = {

  /* ---------- MARCA ----------
     `brand` lo lee tambien tools/build.py para el <title> y el hub.
     Si se renombra, cambiarlo AQUI y en ningun otro sitio.
     La clave de localStorage NO depende de esto y no se renombra. */
  brand:   'Samu: A Link to the Math',
  tagline: 'Year 6 &middot; Counting, sequences and rules',

  /* ---------- HUB (index.html) ---------- */
  hub: {
    subtitle:   'Year 6 &middot; Pick a game and start playing.',
    statGames:  'GAMES',
    statNote:   'Play at your own pace',
    empty:      'No games yet.',
    howTitle:   'HOW TO PLAY',
    how: [
      'Play <b>as many levels as you like</b>, whenever you like. There is no timer.',
      'Read the <b>briefing</b> first &mdash; it teaches the method for that level.',
      'Answer with the mouse or the keyboard: <b>A B C D</b> or <b>1 2 3 4</b>.',
      'Get one wrong and it comes back later <b>with different numbers</b>, so you have to think it through again.',
      'Clear every challenge to finish the level and unlock the next one.',
      'Progress is saved in this browser. Replay any level to hunt for 3 stars.'
    ],
    cardMeta:   '{test} &middot; {levels} levels &middot; {done}/{levels} cleared'
  },

  /* ---------- ERRORES ---------- */
  err: {
    noData: 'Missing QUIZ_DATA.'
  },

  /* ---------- MAPA ---------- */
  map: {
    statXP:      'XP',
    statLevels:  'LEVELS',
    btnMusicOn:  'MUSIC: ON',
    btnMusicOff: 'MUSIC: OFF',
    btnSoundOn:  'SOUND: ON',
    btnSoundOff: 'SOUND: OFF',
    btnReset:    'RESET',
    intro:       'Clear a level to unlock the next one. Play as many as you want, whenever you want.',
    cardMeta:    'LEVEL {n} &middot; {count} challenges',
    cardBest:    ' &middot; best {xp} XP',
    lockIcon:    '&#128274;',
    allDone:     '&#127942; ALL LEVELS CLEARED',
    allDoneBody: 'You are ready for the {test}. Replay any level to push for 3 stars.',
    confirmReset:'Reset all progress for {topic}?'
  },

  /* ---------- BRIEFING ---------- */
  brief: {
    tag:   'LEVEL {n} &middot; BRIEFING',
    back:  '&lt; MAP',
    start: 'START LEVEL &gt;'
  },

  /* ---------- PARTIDA ---------- */
  play: {
    levelTag:    'LV {n}',
    statXP:      'XP',
    statCombo:   'COMBO',
    optionsLabel:'Answer options',
    btnHint:     'HINT',
    btnMusic:    'MUSIC: {state}',
    stateOn:     'ON',
    stateOff:    'OFF',
    btnQuit:     'QUIT',
    btnNext:     'NEXT &gt;',
    btnFinish:   'FINISH LEVEL &gt;',
    hintLabel:   '<b>Hint:</b> ',
    hintRetry:   '<b>You saw this one before &mdash; here is the method:</b> ',
    hintFallback:'Look at the size of each jump.',
    goodTitle:   '&#10003; CORRECT',
    badTitle:    '&#10007; NOT YET',
    badNote:     '<b>This challenge comes back later with different numbers</b> &mdash; so work out the method, not the answer.',
    confirmQuit: 'Leave this level? Progress in this level is not saved.'
  },

  /* ---------- ESCENAS (v2: moverse es responder) ----------
     Textos de la capa de movimiento. `doors` es la escena canonica y
     el fallback de cualquier familia sin `mech`. */
  scene: {
    groupLabel:  'Walk to your answer',
    /* Las flechas van en <kbd>, no en <b>: la fuente de pixel no tiene glifo de
       flecha y caia a una fuente de respaldo que se veia apagada y mas pequena. */
    help:        '<kbd>&larr; &rarr;</kbd> move &nbsp;·&nbsp; <b>Enter</b> go through the door &nbsp;·&nbsp; or press <b>A B C D</b>',
    helpStacked: '<kbd>&uarr; &darr;</kbd> move &nbsp;·&nbsp; <b>Enter</b> go through the door &nbsp;·&nbsp; or press <b>A B C D</b>',
    helpTouch:   'Tap a door to walk through it.',
    startLabel:  'START',
    startAria:   'Start of the corridor',
    doorAria:    'Door {key}: {value}',
    sayStart:    'Back at the start of the corridor.',
    sayOn:       'Standing at door {key}. It says {value}.',
    sayNeedMove: 'Step onto a door first: use the left and right arrows.',
    sayRight:    'Correct. The door opens.',
    sayWrong:    'Wrong door. Back to the start.'
  },

  /* ---------- COMPANERO DE PANTALLA ----------
     Genericos: nunca nombran a nadie. Una materia puede sustituirlos
     desde data.js con `meta.mate` o `ui.mate`. */
  mate: {
    start:   'LET\'S GO',
    turn:    'YOUR TURN',
    retry:   'ROUND TWO',
    combo:   'COMBO x{n}',
    comboPop:'COMBO x{n}!',
    cheers:   ['NICE ONE!', 'GOT IT!', 'YES!', 'SHARP!', 'CLEAN WORK!', 'THAT\'S IT!'],
    consoles: ['NOT YET...', 'ALMOST!', 'TRY AGAIN', 'KEEP GOING', 'SHAKE IT OFF']
  },

  /* ---------- VICTORIA ---------- */
  win: {
    title:      'LEVEL {n} CLEARED',
    statXP:     'XP',
    statFirst:  'FIRST TRY',
    statCombo:  'BEST COMBO',
    statMisses: 'MISSES',
    verdict3:   'Perfect run. You have this topic locked in.',
    verdict2:   'Strong. Replay to hunt the third star.',
    verdict1:   'Cleared it. Play it again &mdash; the questions come back with new numbers.',
    unlocked:   '&#128275; UNLOCKED: LEVEL {n} &mdash; {name}',
    btnReplay:  'REPLAY',
    btnMap:     'BACK TO MAP &gt;'
  }
};
