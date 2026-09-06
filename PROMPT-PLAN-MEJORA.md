# Prompt para el chat del plan de mejora — v2

> Copia todo lo que sigue en un chat nuevo con Claude (modelo Fable). Antes de enviarlo,
> adjunta: `PROJECT_INSTRUCTIONS.md`, `DESIGN_SYSTEM.md`, `README.md`, `PROMPT.md`,
> `assets/engine.js`, `assets/engine.css`, el material de estudio del Cycle Test y el
> archivo publicable `y6-maths-counting-sequences.html`.
>
> **No adjuntes `NIVELES-Y-JEFES.md` en el primer mensaje.** Ese documento es un borrador
> interno: si lo mandas de entrada, el equipo lo validará en vez de diseñar, y perderás
> justo lo que fuiste a buscar. Guárdalo y compáralo **después** de que entreguen su
> propuesta, para ver qué se les escapó.

---

Actúa como un equipo de expertos: un diseñador de videojuegos senior especializado en
juegos infantiles y mecánicas de exploración 2D, un experto en pedagogía y diseño
instruccional para niños de 10-11 años (currículo IB, Year 6), y un ingeniero front-end
senior en JavaScript/HTML/CSS sin frameworks. Los tres deben analizar el proyecto adjunto
y construir juntos un **plan de mejora sustancial**, no implementarlo todavía.

## Qué es este proyecto

**"Samu: A Link to the Math"** (antes "Samuel Quest") es un juego de estudio en HTML
autocontenido —sin backend, sin build step en producción, USD 0/mes de infraestructura—
para preparar los Cycle Tests de un colegio británico IB, Year 6. Empezó para un niño de
10 años y **a partir de v2 lo van a usar también sus compañeros de curso**: mismo link,
cada niño en su propio navegador.

Lo que existe hoy (v1, publicado): 5 niveles de opción múltiple en pantalla estática,
sin movimiento del personaje,
80 familias de preguntas con 5 variantes cada una, motor de anti-repetición (nunca repite
la variante fallada, agota todas antes de reciclar), pista automática al reintentar,
sprite reactivo, música chiptune generada por código, progreso en `localStorage`.

Restricción dura: **el diseño visual y el motor son idénticos entre materias** — solo
cambia el color de acento (`data-accent`) y el contenido (`data.js`). El fundador no es
técnico y publica con un doble clic en un `.bat`; no puede depurar código.

Lee `PROJECT_INSTRUCTIONS.md` y `DESIGN_SYSTEM.md` adjuntos para el detalle exacto de
tokens, componentes, arquitectura y reglas de motor. No los contradigas sin señalarlo
explícitamente como una decisión de rediseño, con su justificación.

## Objetivo de esta conversación

Producir un **plan de mejora** (documento, no código) para v2, con estas siete piezas.

### 1. Diseñar los 7 niveles

v2 pasa de 5 a **7 niveles**, y **vosotros decidís cuáles son**. No hay una lista previa
que respetar: partid del material de estudio adjunto y del contenido que ya existe
(5 mundos: enteros, decimales, fracciones, negativos, reglas posición-término) y decidid
cómo se reparte en siete, qué falta, qué se divide y en qué orden.

Entregad la lista definitiva. Para cada nivel: nombre, habilidad que entrena, qué debe
saber hacer el niño al terminarlo, y cuántas familias de preguntas lleva. Señalad qué
contenido **no existe todavía** y hay que generar, con su costo.

Dato para calibrar: en v1, un nivel de 16 familias dura 15-20 minutos reales.

**El progreso se mide en niveles, nunca en días.** No propongáis calendarios de estudio ni
cadencias diarias: es un juego, y cada niño avanza a su ritmo.

### 2. Cada nivel con un propósito de aprendizaje

La regla que ordena todo el rediseño:

> **Jugar, aprender y evaluarse. La forma de moverse debe encarnar la habilidad, no
> decorarla.**

Para cada uno de los 7 niveles, declarad por escrito:

- **Qué habilidad entrena** — una sola, tomada del material del Cycle Test.
- **Por qué esa mecánica y no otra.**
- **Cómo se evalúa** — qué demuestra que lo domina, y qué pasa cuando no.

Un nivel cuya mecánica podría sustituirse por otra sin que cambie lo que el niño aprende
está mal diseñado. Aplicad ese filtro a vuestras propias propuestas antes de entregarlas.

### 3. La interacción: moverse *es* responder

**Decisión ya tomada: se descarta el plataformeo de destreza.** El riesgo era que un niño
que domina la matemática se atascara en un salto y que el juego midiera reflejos en vez de
razonamiento. No lo reabráis.

La mecánica es **opción múltiple interactiva**: el personaje se mueve con el teclado y su
desplazamiento es la respuesta. La forma canónica son cuatro puertas rotuladas al fondo de
un pasillo: caminas hacia la correcta y la cruzas. **Sin reloj, sin saltos con
temporización, sin caídas.** Elegir mal devuelve al inicio del tramo y la pregunta vuelve
luego con otra variante.

Eso es el suelo, no el techo. **Inventad las variantes**: cuantas formas de moverse hagan
falta para que cada habilidad tenga la suya, y que sean imaginativas. El único filtro es
el de arriba —la mecánica debe encarnar la habilidad, no decorarla— y que ninguna exija
destreza.

Definid cómo se implementa en 2D —canvas o DOM+CSS, sin motor de físicas pesado—
manteniendo compatible el modelo de datos actual (familias/variantes) y sin romper el
guardado de progreso ni la garantía de anti-repetición.

### 4. Esquema de puntuación

Cada niño debe ver su puntuación y su progreso de forma clara y motivadora.

**Decisión ya tomada, no la reabráis en el cuerpo del plan: puntuación personal, sin
ranking compartido y sin backend.** Un ranking entre compañeros exige un servidor con
datos de menores que no son del fundador: tratamiento de datos personales de menores bajo
la Ley 1581 de 2012 y el Decreto 1377 de 2013, con autorización de los padres de cada niño
y responsabilidad legal sobre esos datos.

Diseñad entonces un esquema donde el niño **compita contra sí mismo**: récord personal,
mejora respecto al intento anterior, rachas, medallas por dominio de una habilidad,
historial visible. Debe seguir cabiendo en `localStorage`.

Añadid, como **anexo separado al final**, qué costaría añadir un ranking real más adelante
si los padres del curso lo autorizan por escrito — horas, arquitectura y qué habría que
dejar preparado ahora en el motor para no rehacerlo.

### 5. Selección de personaje

Al entrar, el jugador elige si su personaje es femenino o masculino. Debe persistir en
`localStorage` y afectar el sprite en todo el juego.

### 6. Personalización de la armadura y animación de la pista

- El jugador elige el color de **casco, cuerpo, guantes y botas** por separado. Debe
  funcionar sobre el sprite SVG inline actual (sin imágenes externas) y persistir.
- Al activar una pista, el personaje ejecuta una animación de **invocar una calculadora
  mágica** — inspirada en el gesto de Link levantando la espada en Zelda: brazo elevado,
  destello, aparición del objeto. Especificad cómo se logra con SVG/CSS puro y cómo se
  integra con el sistema de pistas automáticas que ya existe.

### 7. Jefes de nivel

Cada uno de los 7 niveles termina con un jefe, y **vosotros los diseñáis**: nombre,
identidad, mecánica de combate, fases y cómo escala del nivel 1 al 7. No hay jefes
preasignados.

Diseñad primero el **sistema de combate** —cómo se hace daño, qué pasa al fallar, qué
pasa al perder— y después los siete jefes concretos dentro de ese sistema.

El filtro duro, aplicado a cada uno por separado:

> **¿Qué evalúa este jefe que no evalúen ya las preguntas de su nivel?**

Un jefe que es "más preguntas con música épica" no justifica lo que cuesta construirlo:
descartadlo y proponed otro.

Dos restricciones pedagógicas que no son negociables: **nunca un reloj** —castigar la
lentitud rompe el propósito del juego— y **perder no puede devolver al principio del
mundo**; equivocarse cuesta tiempo, nunca progreso.

Resolved además: si el jefe sustituye a las últimas preguntas del nivel o se suma a ellas
(sumarlo alarga, sustituirlo reduce cobertura), y cómo se anima un ataque de jefe sin
archivos de imagen, solo con SVG inline, CSS y WebAudio.

**Requisito técnico:** los nombres de jefes y mundos —y cualquier otro texto que el
jugador lea— viven en el archivo de datos de la materia, nunca dentro del motor.
Renombrar un jefe debe costar editar una línea y reconstruir. Decid en el plan dónde queda
cada texto.

## Restricciones que el plan debe respetar

- **USD 0 de infraestructura.** Sin backend, sin servicios de pago, sin dependencias que
  requieran servidor. Todo sigue siendo HTML autocontenido servido por GitHub Pages.
- **Sin archivos binarios de imagen ni audio.** Todo sprite, animación y sonido debe seguir
  siendo SVG inline, CSS, Canvas o WebAudio generado por código.
- **No romper materias existentes ni futuras.** El motor es compartido; cualquier cambio
  debe mantener esa compatibilidad, o el plan declara explícitamente la migración y su costo.
- **La clave de `localStorage` no se renombra** aunque el juego cambie de nombre:
  renombrarla borra el progreso de quien ya venía jugando.
- **Ningún texto visible se escribe dentro del motor.** Nombres de mundos y de jefes,
  títulos de fase, mensajes de victoria y derrota: todo en el archivo de datos de la
  materia. Si un nombre de jefe aparece en `engine.js`, está mal.
- **Debe seguir publicándose con doble clic.** Nada del flujo (`publicar.bat`, `build.py`)
  puede exigir pasos técnicos nuevos al fundador.
- **Lo van a usar otros niños.** Autoexplicativo desde el primer clic, sin un adulto al
  lado y sin mensajes dirigidos a Samuel por su nombre. Debe funcionar en el PC del
  colegio y en el de casa.
- **Accesibilidad y edad objetivo no se negocian.** Mantener o mejorar el contraste
  WCAG AA, `aria-live`, tamaños de fuente y `prefers-reduced-motion`. Un nivel con
  movimiento constante puede chocar con esto: resolvedlo, no lo ignoréis. Todo debe
  seguir siendo jugable solo con teclado.
- **Anti-repetición intacta.** Es el requisito central del proyecto: una pregunta fallada
  nunca reaparece idéntica.

## Qué debe contener el plan entregado

Para cada pieza, y para el plan en conjunto:

- Solución técnica propuesta (arquitectura, no código completo).
- Impacto sobre el motor compartido: qué archivos cambian, qué se mantiene igual.
- **Estimado de horas de desarrollo** y **costo mensual de infraestructura en USD**
  (aunque siga siendo 0, decidlo y justificad por qué).
- Riesgos, deuda técnica o costos futuros ocultos, señalados sin que se pregunte.
- Cuando haya una decisión con más de un camino razonable, **máximo dos opciones** con su
  trade-off de costo y tiempo, y una recomendación.
- Orden de implementación sugerido y por qué, considerando que el fundador necesita ver
  progreso jugable pronto y no puede probar código sin verlo corriendo en el navegador.
- Cómo se valida cada pieza: qué debe demostrarse jugando de principio a fin, con aciertos
  y errores, antes de darla por terminada.

## Formato de respuesta

Responde en español, directo, sin relleno. Entrega el plan en markdown. **No implementes
nada todavía**: este chat es solo para el plan.

Si alguno de los siete puntos choca con una restricción del proyecto, con el presupuesto o
con el objetivo pedagógico, dilo directamente antes de proceder, con una alternativa
concreta. Es preferible que discutas una premisa a que entregues un plan cortés e inviable.
