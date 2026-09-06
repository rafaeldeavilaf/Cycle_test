# PROMPT MAESTRO — Samu: A Link to the Math

Copia este bloque completo en una conversación nueva de Claude, adjunta el PDF/foto/texto
del material de estudio de la semana y envía. No hace falta editar nada salvo la última línea.

> **Vigencia.** Este prompt genera materias para la **v1** del motor (5 niveles, opción
> múltiple). Cuando se construya la v2 —7 niveles tipo Obby, jefes, propósito de
> aprendizaje declarado por nivel— hay que reescribirlo. No lo uses para diseñar v2.

---

## PROMPT (copiar desde aquí)

Actúa como desarrollador del proyecto **Samu: A Link to the Math**, un repositorio de
juegos de estudio para niños de Year 6 (10-11 años, colegio británico IB, currículo en
inglés). Lo usa mi hijo Samuel y sus compañeros de curso.

Adjunto el material de estudio de su próximo Cycle Test. Tu trabajo es convertirlo en un
nivel de juego nuevo dentro del repo existente, **sin tocar el motor ni el diseño**.

### 1. Contexto del repo (ya existe, no lo reinventes)

```
samuel-quest/
├── index.html                      GENERADO por tools/build.py — no se edita a mano
├── <slug>.html                     GENERADO — el juego autocontenido de cada materia
├── subjects.js                     registro de materias  <-- añadir 1 objeto
├── assets/
│   ├── engine.css                  design system pixel gaming  <-- NO EDITAR
│   └── engine.js                   motor del juego             <-- NO EDITAR
├── subjects/<slug>/
│   └── data.js                     contenido                   <-- LO ÚNICO QUE ESCRIBES
├── tools/
│   ├── gen_<slug>.py               script generador de data.js
│   └── build.py                    inlina motor+datos en los .html de la raíz
├── DESIGN_SYSTEM.md                reglas visuales inviolables
└── PROJECT_INSTRUCTIONS.md         memoria del proyecto
```

**Regla de publicación:** lo que se sube a GitHub son **solo los `.html` de la raíz**, y
cada uno lleva el CSS, el motor y las preguntas dentro. Nada de rutas relativas a
carpetas: el arrastrar-y-soltar de GitHub las descarta en silencio y la página queda sin
estilos. Nunca entregues un `index.html` que apunte a `assets/…`.

Lee `DESIGN_SYSTEM.md` y `PROJECT_INSTRUCTIONS.md` antes de escribir nada.
Si no tienes el repo a la vista, pídeme el zip antes de empezar.

### 2. Qué debes producir

Exactamente cuatro cosas:

1. `tools/gen_<slug>.py` — script Python que genera el contenido con aritmética/lógica
   verificada, no a mano. Si la materia no es cuantitativa (Historia, Inglés, Ciencias
   descriptivas), el script igual se usa para garantizar que **no haya opciones duplicadas**
   y que cada familia tenga sus variantes.
2. `subjects/<slug>/data.js` — salida del script.
   Reglas de contenido que el script debe respetar: nada de distractores de relleno
   descartables a simple vista, y ningún enunciado con contexto imposible (un submarino
   que acaba sobre el nivel del mar, una planta que encoge). Cada opción incorrecta debe
   ser un error real que cometería un niño de 10 años.
3. Una línea nueva al inicio del array en `subjects.js`.
4. La salida de `python3 tools/build.py`, que produce `<slug>.html` e `index.html`
   autocontenidos en la raíz. **Esos dos son los archivos que subo a GitHub.**

**No generes CSS ni JS nuevos.** Si crees que hace falta una capacidad que el motor no
tiene, dímelo antes de escribirla.

### 3. Reglas de contenido (obligatorias)

- **Todo en inglés**, incluidos briefings, pistas y explicaciones. Registro: claro,
  directo, para un chico de 10-11 años. Sin infantilizar.
- **5 niveles = 5 días**, uno por día, ~30 minutos cada uno.
- **Mínimo 16 familias de preguntas por nivel** (80 en total) y **5 variantes por familia**
  (400 preguntas). Una familia solo se supera al responderla bien; al fallar vuelve a la
  cola y el motor sirve **otra variante**, nunca la misma pregunta. Por eso las variantes
  deben cambiar los números/datos, no solo la redacción.
- **Prioriza selección múltiple**: 4 opciones, siempre. Los distractores deben ser
  **errores plausibles reales** (dirección invertida, un paso de más o de menos, olvidar
  la conversión, confundir posición con valor), nunca opciones absurdas de relleno.
- Las 4 opciones de cada variante deben ser **únicas como texto**. El script debe
  fallar con `assert` si no lo son.
- **Dificultad progresiva** entre niveles, y también dentro de cada nivel (las últimas
  familias son las más exigentes).
- Cada variante lleva: `stem`, `options`, `answer`, `hint` (una pista que apunta al método,
  no a la respuesta) y `explain` (2-3 frases con el procedimiento resuelto, usando
  `<code>` para los cálculos).
- Cada nivel lleva un `briefing`: una mini-lección de 4-6 bloques HTML que **enseña el
  método** antes de preguntar, con al menos un bloque `<div class='example'>`.
- Cubre **todo** lo que aparece en el material de estudio. Si el material trae ejemplos
  concretos, reprodúcelos literalmente en el Nivel 1 o 2 para que reconozca el terreno.
- Si el material es corto, amplía con contenido del mismo tema al nivel del currículo
  británico Year 6 — pero **no introduzcas temas que no estén en el material**.

### 4. Estructura del `data.js`

```js
window.QUIZ_DATA = {
  meta: { slug, year, subject, topic, test, accent },
  levels: [{
    id: 1,
    name: "NOMBRE DEL NIVEL EN MAYÚSCULAS",
    subtitle: "qué se practica",
    briefing: ["<p>...</p>", "<div class='example'>...</div>", "<ul>...</ul>"],
    questions: [{
      id: "L1F1",
      skill: "etiqueta corta",          // se muestra como tag
      variants: [{
        stem: "pregunta",
        sub: null,                       // subtítulo opcional
        seq: ["10","5","0","?"],         // opcional: fichas visuales; null si no aplica
        options: ["a","b","c","d"],
        answer: 0,                       // índice de la correcta
        hint: "...",
        explain: "..."
      }, /* +4 variantes */]
    }, /* +15 familias */]
  }, /* +4 niveles */]
}
```

El campo `seq` sirve para cualquier materia: una secuencia numérica, los pasos de un
proceso, una línea de tiempo, una fórmula por partes. Úsalo cuando ayude a visualizar;
`null` cuando no.

### 5. Acento visual

Añade el `data-accent` de la materia. Si ya existe en `engine.css`, úsalo. Si es una
materia nueva, dime qué dos colores propones y **espera mi aprobación** antes de tocar
`engine.css` — es el único caso en que ese archivo se modifica, y solo se le añaden dos
líneas de variables.

### 6. Verificación antes de entregar

Ejecuta y muéstrame el resultado de:
- El script generador (debe imprimir niveles/familias/variantes).
- Un test que recorra un nivel completo respondiendo al azar y confirme que:
  (a) el nivel termina, (b) ninguna pregunta fallada se vuelve a servir idéntica,
  (c) las 4 opciones son únicas en las 240 variantes.

### 7. Entrega

Dame el zip del repo actualizado y, por separado y bien señalados, **los dos `.html` de la
raíz que debo subir a GitHub** (`index.html` y `<slug>.html`). Confirma explícitamente que
ninguno de los dos referencia archivos externos salvo la hoja de fuentes de Google.

---

**Material de estudio de esta semana:** [ADJUNTA EL PDF/FOTO AQUÍ]
**Materia:** [ej. Science]
**Test:** [ej. Cycle Test #2]
