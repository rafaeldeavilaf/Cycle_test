/* ============================================================
   SAMU: A LINK TO THE MATH — PROPS.JS
   Biblioteca de escenografia pixel-art. SVG inline, sin imagenes.

   Cada prop es una lista de capas [color, path]. Los colores son
   variables --env-* que cada nivel define en su data.js: la misma
   antorcha es de castillo o de cueva segun la paleta. Rejilla entera,
   comandos h/v relativos, como el heroe (M4 1h9v2H4z).

   Los MATERIALES son patrones repetibles en gris neutro (claro/oscuro)
   que el motor tinta con el color del nivel (multiply). Van como
   data-URI SVG: texto, sin peticion externa, editable. No es un PNG.

   REGLA: aqui NO hay nombres de lugares. "castle" no existe. Un nivel
   es una combinacion de props + materiales + paleta, declarada en
   data.js. Asi una materia futura usa lo mismo sin dibujar nada.

   Tokens que un prop puede usar:
     --env-prop   madera, tronco, metal oscuro
     --env-prop2  piedra, follaje, cuerpo secundario
     --env-far    siluetas lejanas
     --env-glow   luz, fuego, cristal encendido
     --env-glow2  nucleo de la luz
     --env-line   bordes
   ============================================================ */
window.GAME_PROPS = {

  props: {
    /* Antorcha en la pared. La llama tiene dos cuadros (.f1/.f2) que el CSS
       alterna con steps(2); en modo aula / reduced-motion queda el primero. */
    torch: { vb: '0 0 10 28', w: 10, h: 28, layers: [
      ['var(--env-prop)',  'M4 10h2v18H4z'],
      ['var(--env-prop2)', 'M3 9h4v2H3z M2 11h6v1H2z'],
      ['var(--env-glow)',  'M3 4h4v5H3z', 'f1'],
      ['var(--env-glow2)', 'M4 6h2v3H4z M4 2h2v2H4z', 'f1'],
      ['var(--env-glow)',  'M2 5h6v4H2z', 'f2'],
      ['var(--env-glow2)', 'M4 5h2v4H4z M3 3h2v2H3z M6 1h1v3H6z', 'f2']
    ]},

    /* Ventana con luz dentro. */
    window: { vb: '0 0 14 20', w: 14, h: 20, layers: [
      ['var(--env-line)',  'M0 0h14v20H0z'],
      ['var(--env-glow2)', 'M2 2h10v16H2z'],
      ['var(--env-line)',  'M6 2h2v16H6z M2 9h10v2H2z']
    ]},

    /* Almena de muralla (se repite en la parte alta de la pared). */
    merlon: { vb: '0 0 16 8', w: 16, h: 8, layers: [
      ['var(--env-prop2)', 'M0 2h4v6H0z M6 0h4v8H6z M12 2h4v6h-4z'],
      ['var(--env-line)',  'M0 7h16v1H0z']
    ]},

    /* Torre lejana con dos ventanas encendidas. */
    tower: { vb: '0 0 18 32', w: 18, h: 32, layers: [
      ['var(--env-far)',   'M3 6h12v26H3z'],
      ['var(--env-far)',   'M2 4h2v3H2z M6 4h2v3H6z M10 4h2v3h-2z M14 4h2v3h-2z'],
      ['var(--env-glow2)', 'M8 12h2v3H8z M8 20h2v3H8z']
    ]},

    /* Puerta del jefe: se ve al fondo desde el primer tramo y se acerca. */
    gate: { vb: '0 0 40 44', w: 40, h: 44, layers: [
      ['var(--env-far)',   'M0 8h40v36H0z'],
      ['var(--env-prop2)', 'M0 4h4v4H0z M8 4h4v4H8z M16 4h4v4h-4z M24 4h4v4h-4z M32 4h4v4h-4z'],
      ['#0a0710',          'M10 16h20v28H10z'],
      ['var(--env-prop)',  'M12 18h16v26H12z'],
      ['var(--env-line)',  'M12 24h16v2H12z M12 34h16v2H12z M19 18h2v26h-2z'],
      ['var(--bad)',       'M14 12h2v2h-2z M24 12h2v2h-2z']
    ]},

    /* Arbol: tronco + tres capas de copa. */
    tree: { vb: '0 0 20 32', w: 20, h: 32, layers: [
      ['var(--env-prop)',  'M8 20h4v12H8z'],
      ['var(--env-prop2)', 'M2 14h16v8H2z M4 8h12v8H4z M7 3h6v6H7z'],
      ['var(--env-glow)',  'M6 10h2v2H6z M12 15h2v2h-2z M9 5h1v1H9z']
    ]},

    /* Arbol lejano, solo silueta. */
    treefar: { vb: '0 0 12 24', w: 12, h: 24, layers: [
      ['var(--env-far)', 'M5 16h2v8H5z M1 10h10v7H1z M2 5h8v6H2z M4 1h4v5H4z']
    ]},

    /* Arbusto de primer plano. */
    bush: { vb: '0 0 18 10', w: 18, h: 10, layers: [
      ['var(--env-prop2)', 'M0 5h18v5H0z M3 2h12v4H3z M7 0h5v3H7z'],
      ['var(--env-glow)',  'M5 4h1v1H5z M12 6h1v1h-1z']
    ]},

    /* Juncos / hierba alta. */
    reeds: { vb: '0 0 12 14', w: 12, h: 14, layers: [
      ['var(--env-prop2)', 'M1 6h1v8H1z M4 2h1v12H4z M7 4h1v10H7z M10 1h1v13h-1z'],
      ['var(--env-glow)',  'M4 2h1v2H4z M10 1h1v2h-1z']
    ]},

    /* Cristal de cueva, encendido. */
    crystal: { vb: '0 0 12 16', w: 12, h: 16, layers: [
      ['var(--env-glow)',  'M4 6h4v10H4z M2 10h2v6H2z M8 8h2v8H8z'],
      ['var(--env-glow2)', 'M5 2h2v6H5z M5 8h1v5H5z'],
      ['var(--env-line)',  'M3 15h7v1H3z']
    ]},

    /* Engranaje. */
    gear: { vb: '0 0 16 16', w: 16, h: 16, layers: [
      ['var(--env-prop)',  'M6 0h4v3H6z M6 13h4v3H6z M0 6h3v4H0z M13 6h3v4h-3z M2 2h2v2H2z M12 2h2v2h-2z M2 12h2v2H2z M12 12h2v2h-2z'],
      ['var(--env-prop2)', 'M3 3h10v10H3z'],
      ['var(--env-prop)',  'M6 6h4v4H6z']
    ]},

    /* Lampara colgante de taller. */
    lamp: { vb: '0 0 12 22', w: 12, h: 22, layers: [
      ['var(--env-line)',  'M5 0h2v8H5z'],
      ['var(--env-prop)',  'M1 8h10v3H1z M3 11h6v4H3z'],
      ['var(--env-glow2)', 'M4 15h4v3H4z'],
      ['var(--env-glow)',  'M2 18h8v1H2z M3 19h6v1H3z', 'f1'],
      ['var(--env-glow)',  'M1 18h10v1H1z M2 19h8v2H2z', 'f2']
    ]},

    /* Estalactita / roca colgante. */
    stalac: { vb: '0 0 10 14', w: 10, h: 14, layers: [
      ['var(--env-far)', 'M0 0h10v3H0z M2 3h6v4H2z M3 7h4v4H3z M4 11h2v3H4z']
    ]}
  },

  /* Patrones repetibles en gris. El motor los tinta con --env-wall / --env-floor.
     Claro = #cfcfcf, oscuro = #8a8a8a, junta = #5a5a5a. */
  materials: {
    brick: { w: 32, h: 16, svg:
      "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='16' shape-rendering='crispEdges'>" +
      "<rect width='32' height='16' fill='#b9b9b9'/>" +
      "<path fill='#6e6e6e' d='M0 7h32v1H0zM0 15h32v1H0zM15 0h1v7h-1zM31 8h1v7h-1z'/>" +
      "<path fill='#d6d6d6' d='M1 1h13v1H1zM17 9h13v1H17z'/></svg>" },
    stone: { w: 48, h: 24, svg:
      "<svg xmlns='http://www.w3.org/2000/svg' width='48' height='24' shape-rendering='crispEdges'>" +
      "<rect width='48' height='24' fill='#b0b0b0'/>" +
      "<path fill='#6a6a6a' d='M0 11h48v1H0zM0 23h48v1H0zM23 0h1v11h-1zM39 12h1v11h-1zM11 12h1v11h-1z'/>" +
      "<path fill='#cdcdcd' d='M1 1h21v1H1zM25 1h22v1H25zM1 13h9v1H1zM13 13h25v1H13z'/></svg>" },
    flag: { w: 24, h: 24, svg:
      "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' shape-rendering='crispEdges'>" +
      "<rect width='24' height='24' fill='#a8a8a8'/>" +
      "<path fill='#5e5e5e' d='M0 11h24v1H0zM0 23h24v1H0zM11 0h1v11h-1zM23 12h1v11h-1z'/>" +
      "<path fill='#c4c4c4' d='M1 1h9v1H1zM13 13h9v1h-9z'/></svg>" },
    plank: { w: 48, h: 12, svg:
      "<svg xmlns='http://www.w3.org/2000/svg' width='48' height='12' shape-rendering='crispEdges'>" +
      "<rect width='48' height='12' fill='#b8b8b8'/>" +
      "<path fill='#6b6b6b' d='M0 5h48v1H0zM0 11h48v1H0zM19 0h1v5h-1zM35 6h1v5h-1z'/>" +
      "<path fill='#d0d0d0' d='M2 2h6v1H2zM26 2h9v1h-9zM8 8h11v1H8z'/></svg>" },
    grass: { w: 24, h: 12, svg:
      "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='12' shape-rendering='crispEdges'>" +
      "<rect width='24' height='12' fill='#a6a6a6'/>" +
      "<path fill='#d2d2d2' d='M2 2h1v3H2zM7 0h1v4H7zM13 3h1v3h-1zM19 1h1v4h-1z'/>" +
      "<path fill='#707070' d='M4 8h2v1H4zM16 9h3v1h-3zM10 6h1v1h-1z'/></svg>" },
    leaves: { w: 24, h: 24, svg:
      "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' shape-rendering='crispEdges'>" +
      "<rect width='24' height='24' fill='#9a9a9a'/>" +
      "<path fill='#c8c8c8' d='M2 3h4v3H2zM14 1h5v4h-5zM7 12h5v4H7zM17 14h4v4h-4zM3 18h3v3H3z'/>" +
      "<path fill='#5f5f5f' d='M9 6h3v2H9zM20 8h2v3h-2zM1 10h3v2H1zM12 20h4v2h-4z'/></svg>" },
    rock: { w: 32, h: 32, svg:
      "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' shape-rendering='crispEdges'>" +
      "<rect width='32' height='32' fill='#8f8f8f'/>" +
      "<path fill='#5a5a5a' d='M0 9h13v1H0zM13 3h1v7h-1zM18 0h1v12h-1zM18 12h14v1H18zM0 22h20v1H0zM20 16h1v7h-1zM26 20h1v12h-1z'/>" +
      "<path fill='#b3b3b3' d='M2 2h7v1H2zM21 3h8v1h-8zM3 13h10v1H3zM23 25h6v1h-6z'/></svg>" },
    metal: { w: 32, h: 32, svg:
      "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' shape-rendering='crispEdges'>" +
      "<rect width='32' height='32' fill='#a0a0a0'/>" +
      "<path fill='#5c5c5c' d='M0 15h32v2H0zM15 0h2v32h-2z'/>" +
      "<path fill='#cfcfcf' d='M2 2h2v2H2zM11 2h2v2h-2zM2 11h2v2H2zM11 11h2v2h-2zM19 19h2v2h-2zM28 19h2v2h-2zM19 28h2v2h-2zM28 28h2v2h-2z'/></svg>" }
  }
};
