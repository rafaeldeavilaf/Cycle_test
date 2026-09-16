# PROJECT INSTRUCTIONS — Samu: A Link to the Math

Memoria del proyecto. Pega este archivo en las *instrucciones del proyecto* de Claude
(o súbelo al knowledge del proyecto) para que cualquier conversación futura arranque
con el contexto completo.

**Corrección del 16 de septiembre de 2026:** este documento decía que v2 (7 niveles,
movimiento como respuesta, jefe por nivel, puntuación visible) estaba "aprobada, todavía
sin construir". Eso ya no es cierto — `subjects/y6-maths-counting-sequences/data.js` y
`assets/engine.js` YA tienen v2 completa (7 niveles, 112 familias, jefes con datos
verificados). Las secciones marcadas **[v2]** de abajo describen lo que hoy YA ESTÁ
construido para Maths, no una aspiración. Si algo de lo marcado [v2] no coincide con lo
que ves al jugar, avisa — es señal de que este documento volvió a quedarse atrás.

---

## Qué es

Un juego web para estudiar para los Cycle Tests de un colegio británico IB, Year 6
(niños de 10-11 años). Nació para **Samuel** y a partir de v2 **se comparte con sus
compañeros de curso**: cada niño abre el mismo link y juega en su propio navegador.

**El progreso se mide en niveles, no en días.** Cada niño avanza a su ritmo y juega lo que
quiera de una sentada. En ningún documento ni pantalla se habla de "un nivel por día" ni
de calendarios de estudio: es un juego, no un plan de deberes.

**El idioma del contenido sigue al de la materia evaluada, no es siempre inglés.**
Maths y las demás materias del currículo británico van en inglés, porque así se evalúan.
La materia de español (`espanol-heliodoro-laberinto`) va en español, porque evalúa la
clase de español — poner sus enunciados en inglés le enseñaría algo falso. Esto se
resuelve por materia con `DATA.ui` (cada `data.js` puede pisar el texto de la interfaz que
necesite; ver "Principio arquitectónico" abajo) sin tocar `assets/ui.js`. Lo que SÍ se
mantiene igual en todas las materias, por ahora, es el texto genérico del motor (botones
como NEXT, HINT, CONFIRM): traducirlo por completo para español queda pendiente, declarado
como alcance recortado a propósito por el plazo del Cycle Test del 21 de septiembre. La
documentación y la conversación conmigo, en español, siempre.

**Consecuencia de que lo usen otros niños [v2]:** el juego ya no puede hablarle a Samuel
por su nombre ni asumir que un adulto está al lado explicando. Tiene que ser
autoexplicativo desde el primer clic, con los mensajes del compañero de pantalla
genéricos o dirigidos al alias que cada niño elija.

---

## Principio arquitectónico

**Motor compartido + un archivo de datos por materia.**

- `assets/engine.css` y `assets/engine.js` son el juego. Son idénticos para todas las
  materias y **no se editan** al añadir una materia nueva.
- Cada materia aporta un único archivo de contenido: `subjects/<slug>/data.js`.
- Consecuencia práctica: una materia nueva cuesta ~15 minutos y su aspecto no puede
  desviarse. Si alguien propone "un HTML aparte para esta materia", es un error:
  duplica el front y en tres semanas hay tres juegos distintos.

La única excepción permitida en `engine.css` es añadir una línea `[data-accent="..."]`
con dos variables de color para una materia nueva.

**Segunda excepción, distinta de la anterior: una mecánica nueva de juego SÍ puede
tocar `engine.js`/`engine.css`, pero solo si es genérica** (sirve para cualquier materia
futura, no solo la que la motivó) y **aditiva** (no cambia ni una línea de lo que ya
existe — `doors`, el `Runner`, `answer()`). Así se añadió `doors` en su momento, y así se
añadió `forge` el 16 de septiembre de 2026 (construcción por piezas: un banco de piezas
categorizadas + una regla declarativa en datos, `{need, forbid}`; el motor no sabe qué
significa cada categoría, solo cuenta cuántas hay). La prueba de que sigue siendo aditivo:
`tools/harness.js` completo, corrido contra Maths, en verde después del cambio. Cualquier
mecánica nueva se verifica así antes de darse por buena — nunca leyendo el código a ojo.

### Ningún texto visible se escribe dentro del motor

**Todo lo que el jugador lee vive en datos, nunca en `engine.js`.** Nombres de mundos,
nombres de jefes, títulos de fase, mensajes del compañero, textos de victoria y derrota:
todo va en `subjects/<slug>/data.js` (o en el generador que lo produce).

Cambiar el nombre de un jefe tiene que costar **editar una línea y reconstruir**, sin
abrir el motor, sin buscar strings sueltos y sin riesgo de romper nada. Lo mismo para
renombrar un mundo o reescribir un mensaje.

Motivo: los nombres se van a cambiar. Siempre pasa —suena mejor otro, un niño se queja,
cambia la materia—. Un nombre incrustado en el motor convierte un capricho de dos minutos
en una edición de código con su reconstrucción y su riesgo. Es la clase de deuda técnica
que no duele el primer día y estorba cada semana.

Regla práctica para revisar cualquier entrega: si buscas un nombre de jefe con `grep` y
aparece en `engine.js`, está mal.

---

## Estructura

```
samu-link-to-the-math/
│  ── PUBLICABLE (lo único que necesita el navegador) ──
├── index.html            hub autocontenido            GENERADO
├── <slug>.html           un juego completo por materia GENERADO
├── publicar.bat          doble clic para publicar
│
│  ── FUENTE (para mantenimiento) ──
├── subjects.js           registro de materias (añadir 1 objeto por materia)
├── assets/
│   ├── engine.css        design system                (NO EDITAR por materia)
│   └── engine.js         motor                        (NO EDITAR por materia)
├── subjects/<slug>/data.js   contenido (autogenerado)
├── tools/
│   ├── gen_<slug>.py     generador de data.js con validación
│   ├── build.py          inlina motor+datos en los .html de la raíz
│   ├── harness.js        regresión completa (jsdom) — piensa en Maths, exige jsdom
│   └── verify_<slug>.js  verificación propia de una materia (ver el de español como ejemplo)
├── PROMPT.md             prompt maestro para materias nuevas
├── PROMPT-PLAN-MEJORA.md prompt para el plan de rediseño v2
├── NIVELES-Y-JEFES.md    borrador interno de mundos y jefes — NO se manda al plan v2
├── DESIGN_SYSTEM.md      reglas visuales inviolables
└── PROJECT_INSTRUCTIONS.md
```

**Los archivos de la raíz no referencian nada externo** salvo la hoja de fuentes de Google.
Llevan el CSS, el motor y las preguntas dentro.

`publicar.bat` es el único mecanismo de despliegue: doble clic, hace `add`, `commit` y
`push`. Claude **no puede hacer `git push`** (no tiene acceso a credenciales de GitHub);
siempre soy yo quien ejecuta el script.

---

## Reglas de contenido

| Regla | v1 (hoy) | v2 (objetivo) |
|---|---|---|
| Idioma del juego | Inglés (currículo británico) o español (materias de la clase de español) | Igual — sigue a la materia evaluada, no es fijo |
| Niveles | 5 | **7** |
| Familias de preguntas por nivel | 16 mínimo | lo define el plan v2 |
| Variantes por familia | 5 mínimo | 5 mínimo |
| Formato | Opción múltiple, 4 opciones | Opción múltiple interactiva: te mueves para responder |
| Progresión | Creciente entre y dentro de niveles | Igual |
| Nivel curricular | Year 6 británico, 10-11 años | Igual |

**Anti-repetición (requisito central, no negociable):** una pregunta fallada nunca se
vuelve a mostrar idéntica. El motor la devuelve al final de la cola y sirve otra variante
de la misma familia, con números o datos distintos. El niño tiene que razonar otra vez,
no recordar qué botón pulsó.

El motor da dos garantías, verificadas con tests: (1) agota **todas** las variantes de una
familia antes de reutilizar ninguna; (2) al reiniciar el ciclo nunca sirve la última vista,
así que es imposible ver la misma pregunta dos veces seguidas. Con 5 variantes por familia
hace falta fallar 5 veces la misma para que algo se repita, y aun así no será consecutivo.

**Andamiaje:** al reintentar una familia ya fallada, la pista se muestra automáticamente.

**Distractores:** cada opción incorrecta debe ser un error real que un chico de esa edad
cometería —dirección invertida, un paso de más, olvidar cruzar el cero, confundir la
posición con el valor—. Nada de relleno absurdo.

**Cobertura:** el juego debe cubrir todo lo que aparece en el material de estudio, y los
ejemplos literales del material deben aparecer en los primeros niveles para que reconozca
el terreno. No se introducen temas que el material no menciona.

---

## [v2] Moverse *es* responder, y cada nivel tiene un propósito

**Se descartó el plataformeo de destreza.** El riesgo era que un niño que domina la
matemática se atascara en un salto, y que el juego acabara midiendo reflejos en vez de
razonamiento.

La mecánica es **opción múltiple interactiva**: el personaje se mueve con el teclado y su
desplazamiento *es* la respuesta. Cuatro puertas rotuladas y cruzas la correcta; un puente
de losas donde solo pisas las que continúan la secuencia; un ascensor vertical que es una
recta numérica con el cero marcado. Sin saltos con temporización, sin reloj, sin caídas.
Elegir mal devuelve al inicio del tramo y la pregunta vuelve más tarde con otra variante.

La regla que ordena todo el rediseño:

> **Jugar, aprender y evaluarse. La forma de moverse debe encarnar la habilidad, no
> decorarla.** Si la mecánica se puede cambiar por otra sin que cambie lo que el niño
> aprende, está mal diseñada.

Cada nivel debe declarar por escrito, antes de construirse: qué habilidad entrena (una
sola), por qué esa mecánica y no otra, y cómo se evalúa que el niño la domina.

**Cada nivel termina con un jefe** que evalúa algo que las preguntas del nivel no evalúan
—normalmente la habilidad invertida, o dos habilidades a la vez—.

**Cuáles son los 7 niveles y cómo es cada jefe lo decide el equipo de expertos del plan
v2**, no está decidido aquí. [`NIVELES-Y-JEFES.md`](NIVELES-Y-JEFES.md) es un borrador
interno mío para tener algo con que contrastar; no es la especificación.

---

## [v2] Puntuación

**Decisión tomada: puntuación personal visible, sin ranking compartido.**

Cada niño ve su puntaje, sus estrellas, su récord y su progreso. Nadie ve el de nadie más.

Razón: un ranking entre compañeros exige un servidor con datos de menores que no son míos.
Eso es tratamiento de datos personales de menores de edad bajo la Ley 1581 de 2012 y el
Decreto 1377 de 2013 — requiere autorización de los padres de **cada** niño y me convierte
en responsable de esos datos. No compensa para un juego de repaso semanal.

Se puede revisar más adelante si los padres del curso lo autorizan por escrito. El plan v2
puede incluir, como **anexo separado**, qué costaría añadirlo después sin rehacer el motor.

Lo que sí debe hacer el esquema de puntuación: que el niño compita **contra sí mismo**.
Récord personal, mejora respecto al intento anterior, rachas, medallas por dominio de una
habilidad. Eso motiva sin necesidad de servidor.

---

## Flujo semanal

1. Llega el material de estudio (PDF, foto o texto).
2. Abro una conversación nueva, pego `PROMPT.md` y adjunto el material.
3. Claude genera `tools/gen_<slug>.py`, `subjects/<slug>/data.js`, la línea de
   `subjects.js`, y ejecuta `tools/build.py`.
4. Reviso la salida del generador y del test.
5. **Doble clic en `publicar.bat`.** La carpeta local *es* el repositorio: el script hace
   `add`, `commit` y `push` de todo lo que cambió, fuente incluida.
6. GitHub Pages publica en 1-2 minutos. El link es siempre el mismo.
   Si se ve igual, es caché: `Ctrl + F5`.

Repo actual: <https://github.com/rafaeldeavilaf/Cycle_test>
Link del juego: <https://rafaeldeavilaf.github.io/Cycle_test/>

---

## Generación del contenido: siempre por script

El `data.js` **nunca se escribe a mano**. Se genera con un script Python en `tools/`
que usa `fractions.Fraction` para aritmética exacta y que falla con `assert` si:

- una variante no tiene exactamente 4 opciones,
- las 4 opciones no son únicas como texto,
- una familia tiene menos de 4 variantes,
- un nivel tiene menos de 15 familias.

Motivo: escribir cientos de preguntas a mano garantiza errores aritméticos, y una
respuesta mal marcada le enseña algo falso al niño. Es el riesgo más caro del proyecto,
y ahora que lo usan otros niños el error se multiplica.

**Excepción declarada para lenguaje/literatura (ej. `gen_espanol_heliodoro.py`):** un
tema de comprensión narrativa no se genera por fórmula como una secuencia numérica. Cada
familia trae UNA sola variante, escrita a mano, en vez de 4-5 variantes generadas. El
generador sigue validando con `assert` (una respuesta correcta, sin opciones duplicadas,
ningún enunciado repetido entre ítems), pero no puede exigir el mínimo de variantes por
familia que sí tiene sentido en Maths. Consecuencia aceptada: si un niño falla un ítem de
estas materias, vuelve a ver el mismo enunciado — pierde la garantía anti-repetición de
Maths. Es deuda técnica declarada, no un descuido.

**El generador no basta: hay que auditar el contexto, no solo la aritmética.** En la
auditoría del Cycle Test #1 aparecieron preguntas con números correctos pero situaciones
imposibles —un submarino que subía hasta quedar sobre el nivel del mar, una planta que
encogía cada mes—. El `assert` no las detecta. Antes de publicar, leer una muestra de las
variantes como si fueras el niño.

---

## Progreso y datos

- Se guarda en `localStorage` del navegador de cada niño, clave `samuel-quest:<slug>`.
- **La clave no se renombra aunque el juego cambie de nombre.** Renombrarla borra el
  progreso de quien ya venía jugando. El nombre visible y la clave técnica son cosas
  distintas.
- No hay backend, ni cuentas, ni datos personales en la nube. Costo de infraestructura:
  **USD 0**. Esto sigue siendo cierto en v2.
- Cada niño juega en su propio navegador, así que los progresos no se pisan entre sí sin
  necesidad de cuentas.
- Si un niño cambia de computador o borra la caché, empieza de cero. Aceptado a cambio de
  no almacenar datos de menores en un servidor.

---

## Estado actual

| Materia | Slug | Test | Niveles | Estado |
|---|---|---|---|---|
| Español — El Archivo del Laberinto | `espanol-heliodoro-laberinto` | Cycle Test de español, lunes 21 sep. 2026 (plan lector *Heliodoro y el laberinto secreto*) | 7 | Construido y verificado el 16 de sep. — 80 ítems (58 doors + 22 forge), `tools/verify_espanol_heliodoro.js` en verde. Falta: doble clic en `publicar.bat` |
| Maths — Counting and Sequences | `y6-maths-counting-sequences` | Cycle Test #1 | 7 | Publicado — v2 completa, 112 familias, 560 variantes, `tools/harness.js` en verde |

**Duración real medida (v1):** con 70-90% de acierto, un nivel son 18-23 respuestas
≈ 15-20 minutos con briefing incluido. El plan v2 debe partir de este dato medido al
repartir la carga entre 7 niveles.

---

## Decisiones tomadas (no volver a discutir)

- **Nombre: "Samu: A Link to the Math".** El HTML publicado todavía dice "Samuel Quest";
  se cambia al construir v2, junto con el `<title>` y el hub. La clave de `localStorage`
  no cambia.
- **7 niveles en v2**, cada uno con un propósito de aprendizaje declarado y un jefe.
- **El progreso se mide en niveles, nunca en días.** Nada de calendarios de estudio.
- **Nada de plataformeo de destreza.** El movimiento es la forma de responder, no una
  prueba de reflejos. Sin reloj y sin saltos con temporización.
- **Puntuación personal, sin ranking compartido ni backend.** Motivo arriba.
- **Motor + JSON en la fuente, HTML autocontenido en la publicación.** El motor sigue
  siendo uno solo (`assets/`), pero `tools/build.py` lo inlina en cada juego antes de
  publicar. Razón: en el primer despliegue el arrastrar-y-soltar de GitHub descartó las
  carpetas `assets/` y `subjects/` sin avisar; la página cargó sin estilos y el juego no
  existía. Un archivo único no puede subirse a medias.
- **Nunca entregar un HTML publicable que apunte a `assets/…`.** Es el modo de fallo
  conocido del proyecto.
- **`data.js` en vez de `data.json`.** Razón: un `.js` funciona también abriendo el archivo
  con doble clic (`file://`); un `fetch` de JSON lo bloquearía CORS. Cero costo, más robusto.
- **Sin build step en producción, sin framework, sin dependencias.** HTML + CSS + JS plano.
  GitHub Pages lo sirve tal cual. Nada que compilar, nada que se rompa en un año.
- **Sonido y música generados con WebAudio**, sin archivos de audio. Cero peso, cero
  licencias. Interruptores separados para efectos y música, ambos guardados.
- **Sprites en SVG inline dentro de `engine.js`**, nunca imágenes. Mismo motivo: el HTML
  autocontenido no puede depender de archivos externos.
- **Cambios en el motor se verifican corriendo el juego, no leyendo el código.** El método
  del proyecto es una partida simulada completa (jsdom en Node) contra el `.html` ya
  construido, con aciertos y errores. Fue lo que encontró la repetición de variantes y el
  doble conteo al pulsar NEXT dos veces.
