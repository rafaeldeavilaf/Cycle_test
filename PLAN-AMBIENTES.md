# PLAN DE AMBIENTES — Samu: A Link to the Math

Panel: diseño de niveles (DN), pixel-art SVG/CSS (PA), pedagogía Year 6 (PED),
motor (FE) y un playtest simulado con cuatro perfiles de jugador de 10-11 años (JUG).
Documento de decisión. No se implementa nada aquí.

Origen: Rafael rechazó un mockup en que cada nivel solo cambiaba 8 colores del
corredor. Literal: *"no tiene ambiente de nivel de juego, no hay transiciones entre
respuestas de un lugar a otro. Si es un castillo debe haber bloques, lámparas; si es
bosque, árboles, pasto."*

---

## 0. Diagnóstico: por qué "cambiar colores" no da lugar

Los cinco coinciden y el playtest lo confirma en una frase — Mateo (11), al ver el
mockup: *"Es el mismo pasillo pintado de verde."*

Un lugar se reconoce por tres cosas y ninguna es el matiz (DN):

1. **Estructura** — qué hay entre el suelo y el techo: muros, agua, vacío.
2. **Siluetas** — objetos reconocibles a un vistazo: antorcha, árbol, engranaje.
3. **Continuidad** — lo que veo ahora se conecta con lo que vi antes.

El corredor actual falla las tres: cuatro rectángulos sobre una línea, iguales en los
cinco niveles, y **sin más allá**: al responder, el héroe vuelve al inicio y aparecen
otras cuatro puertas. Sin destino visible no hay recorrido; sin recorrido no hay nivel.
Tomás (10): *"Parece un examen pero con dibujitos."*

Los juegos de 8 bits lo resolvían con **pocas piezas repetidas con ritmo** (4-6 tiles),
una silueta de suelo y un cielo por mundo, y scroll horizontal entre salas con el mismo
tileset (Mega Man 2, Zelda II, Super Mario Bros. 3). Nuestra pantalla oscura es ventaja:
en pixel-art el lugar se lee por contraste de silueta sobre fondo, no por paleta rica.

---

## 1. La propuesta en una frase

> **El nivel es un camino de 16 tramos que el héroe recorre de izquierda a derecha;
> cada acierto deja una marca permanente en el lugar, y la puerta del jefe se ve al
> fondo desde el primer tramo.**

Todo lo demás —bloques, antorchas, árboles— es el marco de ese camino. Es la diferencia
entre decorar un formulario y construir un nivel.

### 1.1 Qué cambia respecto a hoy

| Hoy | Propuesta |
|---|---|
| Un corredor fijo que se repinta | Un camino de 16 tramos; al pulsar NEXT el escenario **se desliza** y entra el siguiente |
| Al responder, todo se reinicia | Lo respondido queda a la izquierda, en pequeño, con su marca (puerta abierta, losa pisada) |
| Sin destino | La **puerta del jefe** visible al fondo, cerrada; se abre en el tramo 16 |
| Barra de progreso en el HUD | El propio camino es la barra |
| Cuatro botones genéricos | Casillas del **material** del lugar: puerta de madera, losa de piedra, tablón |
| Fondo plano | 5 capas: cielo · lejano · pared · casillas · suelo (+ primer plano opcional) |
| Sin escenografía | Biblioteca de props pixel-art en SVG, declarados desde datos |

### 1.2 Un solo mundo coherente, no siete temas sueltos (DN)

En vez de "castillo o bosque", una fortaleza y su entorno. Cada nivel es un lugar que
**encarna su mecánica** (el plan v2 ya define las mecánicas; aquí solo se les da sitio):

| # | Mecánica (plan v2) | Lugar | Por qué encarna la mecánica |
|---|---|---|---|
| 1 | puente de losas | **Puente de piedra sobre el foso**, noche, almenas y antorchas | losa = término; la que falla se hunde |
| 2 | regla graduada | **Adarve de la muralla** con almenas cada décima; las de entero son torres | cruzar 2.7→3.0 es pasar una torre |
| 3 | vado de tablones | **Vado del río en el bosque**: árboles, juncos, muelles de madera | tablones de 1/k; muelle = entero |
| 4 | ascensor | **Torre con mazmorra**: planta 0 es el patio; abajo, sótano con luz verde | el cero es el suelo literal |
| 5 | palancas | **Sala de compuertas de la presa** | dirección = compuerta izquierda/derecha |
| 6 | máquina de función | **Taller de máquinas**: cinta, engranajes, tolva de salida | posición → plataforma numerada |
| 7 | máquina inversa | **El mismo taller apagado, luz roja, cinta al revés** | 0 h de escenografía nueva y refuerza "la misma regla al revés" |

Edad (PED, JUG): castillo, bosque y taller no se leen como "de pequeños" a los 11; el
pixel-art se lee como *retro*. Lo que sí se rechaza es lo pastel, lo redondo y la
celebración saltarina —Valentina (10): *"eso es de juego de kínder"*. Evitar princesas,
granjas, animalitos, arcoíris. Taller, sótano industrial y cueva de cristal suman puntos.

---

## 2. Reglas que salen del panel (y no se negocian al construir)

**R1 — Corredor limpio (PED).** En el radio de una altura de personaje alrededor de
cada casilla, nada que no sea la casilla, su rótulo o el héroe. Principio de coherencia
(Mayer) y efecto de *detalles seductores*: lo ajeno al objetivo perjudica, y más a quien
menos sabe —justo al niño que está aprendiendo. La escenografía **enmarca**; nunca
compite con las opciones.

**R2 — Un solo movimiento mientras se decide (PED, JUG).** Lo único que se mueve
mientras el niño elige es el héroe. Animación ambiental: máximo 6 por escena, todas
`steps()`, ciclo > 2 s, nunca junto a las casillas. Tomás (TDAH): *"Yo no miro el fondo,
miro dónde tengo que ir."* El movimiento periférico le roba memoria de trabajo.

**R3 — El escenario registra el progreso (DN, PED, JUG).** Cada acierto deja una marca
permanente en el lugar. Es a la vez ambiente y avance, y es la razón nº 1 de los cuatro
jugadores para volver mañana: *ver hasta dónde llegué*. Vale más que diez lámparas.

**R4 — Transición ≤ 1 s, integrada en el movimiento, saltable, sin texto (todos).**
~100 respuestas por partida: cada segundo son 2 minutos. El deslizamiento del tramo
ocurre *mientras* se lee la pregunta siguiente, no antes; cualquier tecla lo termina;
en la transición no hay nada que leer (Tomás la necesita para "llevar la cuenta";
Samuel la tolera solo si es como cambiar de sala en Zelda). Cambio de escenografía
visible **cada ~4 preguntas**, no en cada una.

**R5 — La geometría enseña, la decoración enmarca (PED).** Ningún elemento decorativo
puede parecer una casilla, un número o una escala. Un muro de bloques detrás de un
puente de losas destruye el andamiaje. Y el rótulo de la opción va **sobre** el sitio
donde hay que pararse, nunca en un cartel aparte (Tomás no pudo asociar tablón y
fracción en el boceto del vado).

**R6 — Todo lo decorativo se apaga con un interruptor (PED).** "Modo aula": sin
animación de fondo, sin partículas, sin parallax, sin transición; respeta
`prefers-reduced-motion`; se recuerda. Para TDAH y para proyectores de colegio, donde los
tonos oscuros desaparecen.

**R7 — Cero nombres de lugar en el motor (FE).** Un nivel no dice `"castle"`: declara
props, materiales y paleta. El lugar es la combinación. El `grep` del proyecto sigue en 0
por construcción, y una materia futura (Ciencias, Inglés) usa los mismos props sin dibujar.

---

## 3. Cómo se construye (PA, FE)

**Capas.** `.scene__corridor` contiene 5 capas absolutas: `sky` → `far` (siluetas
lejanas, nubes) → `wall` (bloques, antorchas, ventanas) → casillas → `floor`, más `fg`
opcional (hierba, niebla). Todo lo decorativo con `aria-hidden` y `pointer-events:none`.

**Props.** `assets/props.js` (inlinado por `build.py`, como `ui.js`): cada prop son
paths pixelados con `fill` por token `--env-*`, no por hex, así la misma antorcha se
recolorea en cada lugar. Se pintan como `<symbol>` + `<use>`: diez bloques iguales son
un path y diez referencias. Peso: **~2 KB para 15 props**; toda la capa de ambientes
**≈ 12-15 KB** sobre 283 KB. Rejilla 16×16, comandos `h`/`v` relativos, como el héroe.

**Materiales.** Piedra, madera, hierba, hielo, metal como patrones SVG en
`background-image: url("data:image/svg+xml,…")`, tintados con un gradiente encima.
¿Viola "sin imágenes"? No: la regla existe para tener un solo HTML, sin peticiones
externas y editable como texto; un data-URI SVG cumple las tres. Lo que la violaría es
un PNG en base64.

**Datos.** Cada nivel declara, opcionalmente:

```json
"env": {
  "palette": { "sky":"#1a1420", "wall":"#4a3f4d", "floor":"#2f2733", "glow":"#ffb347", "line":"#6b5c70" },
  "layers":  { "far":[{"prop":"tower","x":"10%"}], "wall":[{"prop":"torch","x":"12%"},{"prop":"torch","x":"88%"}] },
  "materials": { "floor":"stone", "slot":"door" },
  "transition": "slide"
}
```

Sin `env`, el nivel se ve como hoy: cualquier `data.js` existente sigue valiendo.

**Motor.** Módulo `ENV` hermano de `SCENES`, no dentro: pinta las capas detrás de la
escena y no sabe qué mecánica hay encima; la escena no sabe qué lugar hay detrás. `ENV`
expone `mount`, `shift` (deslizar un tramo), `parallax(fraction)` y `destroy`.
`Runner`, la cola y `answer()` no se tocan.

**Transición.** CSS puro por cambio de clase: `translateX` con `steps(6)`, ~240 ms,
sin `setTimeout`, sin bloquear la respuesta; con reduced-motion o modo aula, corte seco.
En jsdom se verifica que la clase alterna y que la pregunta siguiente es respondible en
el mismo tick.

**Parallax.** Una variable `--hx` que la escena actualiza al mover al héroe; `far` se
desplaza 4 %, `wall` 10 %. Cinco líneas de CSS; la señal de profundidad más barata.

**Rendimiento.** ≤ 40 SVG y ≤ 6 animaciones por escena, todas de `opacity`/`transform`.
Prohibido: `filter`, `blur`, `drop-shadow` masivo, gradientes cuyo color se anime.

---

## 4. Cuatro hallazgos del playtest que NO son de escenografía

Salieron al probar el juego actual y son más urgentes que cualquier antorcha.

**H1 — El teclado del colegio hace que el héroe se pase de largo (Tomás).** Las flechas
mantenidas repiten (`key repeat`) y el niño cruza dos casillas. El plan dice "nada
depende de repetición de tecla", pero hoy el motor no la ignora. **Arreglo: ignorar
`keydown` con `e.repeat`. Una línea.** Va en el primer commit, con o sin ambientes.

**H2 — Volver al inicio al fallar se lee como castigo (Tomás).** Es el único motivo que
dio para no volver mañana. Como la pregunta ya está resuelta cuando el héroe retrocede,
el retroceso es puramente cosmético. **Propuesta: el héroe se queda en la puerta roja,
se hunde de hombros, y con NEXT el camino sigue.** Ahorra 0,2 s por fallo y quita el
"castigo" al jugador más frágil. Contradice el plan v2 §3.3; decisión de Rafael.

**H3 — La celebración salta demasiado (Valentina).** Sustituir el brinco con chispas por
una reacción más contenida —brazo arriba y brillo en la casilla—. Coste: 20 minutos.

**H4 — Lo que piden y ya está decidido que no.** Valentina pide nombre para el
personaje y ranking de aula. Ambos están decididos en contra (género; Ley 1581 de 2012).
Se mantiene. El sustituto que sí encaja: **una pieza de armadura desbloqueable por
nivel** —coleccionar ligado a dominar el nivel, no a compararse—. Es un dato, cabe en la
Fase 3 ya construida.

---

## 5. Qué NO se hace, y por qué

- **Mapa del castillo recorrible entre preguntas.** Otra pantalla, otra escena, otra
  capa de foco; 8-10 h para verse 1 s entre preguntas. El camino de tramos da lo mismo
  dentro de la escena.
- **Transición con la escena duplicada en el DOM** (dos corredores deslizando a la vez).
  8-10 h y a tirones en Edge de colegio. El deslizamiento de capas + entrada de la
  pregunta nueva da el 80 % por 1,5 h.
- **Siete ambientes distintos dibujados ahora.** Es lo caro de verdad: píxel que no se
  genera. Se construyen **dos completos** ahora y el resto **nace con su escena** en la
  Fase 5, porque la geometría de la escena *es* el lugar (R5): el adarve nace con la
  regla graduada, el vado con los tablones, la torre con el ascensor.
- **Animación ambiental por defecto.** Contradice R2. Se entrega apagada en móvil y
  apagable siempre.

---

## 6. Costo

| Pieza | Horas |
|---|---|
| Esquema `env` + módulo `ENV` + fallback sin `env` | 3 |
| `props.js` + `build.py` + `<symbol>/<use>` + materiales data-URI | 2,5 |
| Camino de 16 tramos: deslizamiento, marcas permanentes, puerta del jefe al fondo | 3 |
| Parallax + modo aula (interruptor, guardado) | 1,5 |
| Ambiente 1 completo: puente de piedra (bloques, antorchas, foso) | 2,5 |
| Ambiente 3 completo: vado del bosque (árboles, hierba, agua) | 2,5 |
| Paletas de material para los niveles 2, 4, 5 (sin props nuevos) | 1 |
| H1 + H2 + H3 del playtest | 1 |
| Harness: env por nivel, fallback, transición no bloquea, reduced-motion, cero nombres en motor | 2 |
| **Total** | **~19 h** (rango 16-22) |

Infra: **USD 0**. Sigue siendo un HTML autocontenido; peso +12-15 KB.

El plan v2 estimaba 119 h (rango realista 110-140); van ~45. Con esto, ~138. Parte de
estas horas *sustituyen* trabajo de la Fase 5 (el lugar de cada escena ya no se hace dos
veces), así que el total real del proyecto sube menos que 19.

**Orden:** esto va **antes** de la Fase 4 (contenido), porque es motor y se prueba sobre
los 5 niveles que ya existen. Fase 4 y 5 lo heredan.

---

## 7. Cómo se valida (método del proyecto: jugando)

- Harness: nivel con `env` monta capas y props; nivel sin `env` juega igual; dos niveles
  dan `--env-*` distintos; tras NEXT la pregunta siguiente es respondible en el mismo
  tick; reduced-motion emulado termina el nivel; ningún id de prop ni nombre de nivel en
  `engine.js`; anti-repetición intacta con `env` activo; `e.repeat` ignorado.
- Sprites y props se **renderizan a imagen** desde el sandbox antes de publicar (ya se
  hace con el héroe).
- En vivo, tras publicar: tramo 1 en móvil a 375 px con las 4 casillas como lo más
  grande de la pantalla (R1); antorchas fuera del corredor; puerta del jefe visible.
- Con Samuel: ¿la transición estorba? ¿se entiende el camino sin explicarlo? Si algo
  tarda, Samuel lo abandona: todo debe poder saltarse con una tecla desde el día uno.

---

## 8. Decisiones que necesita el panel de Rafael

1. **Enfoque**: camino de tramos con marcas permanentes y puerta del jefe al fondo, en un
   solo mundo coherente. Dos ambientes completos ahora, el resto con la Fase 5.
2. **H2**: ¿el héroe se queda en la puerta roja (jugadores) o vuelve al inicio (plan)?
   Recomendación del panel: se queda.
3. **Modo aula**: interruptor que apaga toda la decoración. Recomendación: sí.
4. **Pieza de armadura por nivel** como recompensa coleccionable. Recomendación: sí,
   ligada a superar el nivel con 2+ estrellas.
