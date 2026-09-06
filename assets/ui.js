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

  /* ---------- HEROE Y ARMERIA ----------
     El motor solo conoce cuerpos 'a' y 'b'. Como se llamen y como se
     describan se decide aqui. Las etiquetas describen el PELO, no un genero:
     es lo que de verdad cambia entre las dos siluetas. */
  hero: {
    title:        'CHOOSE YOUR HERO',
    intro:        'Pick a look. You can change it any time, and it follows you into every game.',
    bodyA:        'SHORT HAIR',
    bodyB:        'LONG HAIR',
    pickAria:     'Choose the {name} hero',
    aliasTitle:   'HERO NAME',
    aliasHelp:    'Optional. Up to 12 characters. Use a made-up name, not your real one &mdash; it stays in this browser and is never sent anywhere.',
    aliasLabel:   'Your hero name',
    aliasDice:    'SURPRISE ME',
    defaultAlias: 'HERO',
    btnStart:     'START &gt;',
    btnArmoury:   'ARMOURY',
    btnHero:      'HERO',
    btnBack:      '&lt; MAP',
    /* Sugerencias generadas: el nino elige de una lista, nunca escribe su
       nombre real por inercia. Se combinan adjetivo + animal. */
    aliasWordsA:  ['PIXEL', 'TURBO', 'NEON', 'IRON', 'STORM', 'LUCKY', 'SHADOW', 'COSMIC', 'RAPID', 'BRAVE'],
    aliasWordsB:  ['FOX', 'OWL', 'WOLF', 'CROW', 'LYNX', 'HAWK', 'BEAR', 'MOTH', 'RAY', 'CUB']
  },

  armoury: {
    title:      'ARMOURY',
    intro:      'Paint your armour. Four pieces, eight colours.',
    /* Es una cinta/visor sobre la frente, no un casco: en dorado se leia como
       pelo rubio y el nino no entendia que estaba pintando. */
    pieceHelm:  'HEADBAND',
    pieceBody:  'BODY',
    pieceGlove: 'GLOVES',
    pieceBoot:  'BOOTS',
    swatchAria: '{piece}: {colour}',
    preview:    'PREVIEW',
    btnDone:    'DONE &gt;',
    /* Ocho colores fijos. Todos verificados con contraste >= 5:1 sobre
       --bg-1; el navy de las piernas de v1 (#1c2555) daba 1.16:1 y por eso
       no esta aqui. Si se cambia alguno, hay que volver a medir. */
    colours: [
      { name: 'CYAN',   value: '#7ee8fa' },
      { name: 'SKY',    value: '#5b8cff' },
      { name: 'PURPLE', value: '#c77dff' },
      { name: 'ROSE',   value: '#ff4d6d' },
      { name: 'ORANGE', value: '#ff9e64' },
      { name: 'GOLD',   value: '#ffd93d' },
      { name: 'LIME',   value: '#a0ff5c' },
      { name: 'GREEN',  value: '#3ce88a' }
    ]
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
    /* Se muestra cuando la 3.a estrella se pierde por atascarse en UNA
       habilidad, no por la puntuacion general. El nino debe saber por que. */
    verdictStuck: 'One question type caught you out three times. Beat that one and the third star is yours.',
    newBest:    '&#127942; NEW PERSONAL BEST &mdash; +{n} XP over your old record',
    overBest:   '{n} XP short of your best',
    upFrom:     '&#9650; {n} XP better than last time',
    downFrom:   '&#9660; {n} XP below last time',
    sameAs:     'Same score as last time',
    firstPlay:  'First time through this level.',
    medalsNew:  'NEW MEDALS',
    medalsMore: '+{n} more',
    unlocked:   '&#128275; UNLOCKED: LEVEL {n} &mdash; {name}',
    btnReplay:  'REPLAY',
    btnMap:     'BACK TO MAP &gt;'
  },

  /* ---------- PROGRESO Y MEDALLAS ---------- */
  score: {
    btnProfile:   'PROFILE',
    title:        'YOUR RECORD',
    progressLabel:'SKILLS LEARNED',
    progressBar:  '{done} of {total} question types',
    bestCombo:    'BEST STREAK EVER',
    noPlays:      'Nothing played yet. Clear a level and your record shows up here.',
    medalsTitle:  'MEDALS',
    medalsHelp:   'Bronze: you got it right. Silver: right first try in 3 different runs. Gold: in 5.',
    medalBronze:  'BRONZE',
    medalSilver:  'SILVER',
    medalGold:    'GOLD',
    medalNone:    'NOT YET',
    medalLine:    '{skill} &mdash; {medal}',
    medalsLocked: '{n} more question types still to unlock.',
    historyTitle: 'LAST RUNS',
    historyLevel: 'LEVEL {n}',
    historyHead:  ['RUN', 'XP', 'FIRST TRY', 'MISSES', 'STREAK'],
    cardBestLine: 'best {xp} XP &middot; {first}/{total} first try',
    btnBack:      '&lt; MAP'
  }
};
