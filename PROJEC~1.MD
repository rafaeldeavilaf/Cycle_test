# PROJECT INSTRUCTIONS — Samuel Quest

Memoria del proyecto. Pega este archivo en las *instrucciones del proyecto* de Claude
(o súbelo al knowledge del proyecto) para que cualquier conversación futura arranque
con el contexto completo.

---

## Qué es

Un repositorio de juegos web para que **Samuel** (10 años, cumple 11; Year 6, colegio
británico IB) estudie para sus Cycle Tests. Cada test es un juego de 5 niveles; cada
nivel es un día de estudio de ~30 minutos. Se publica en GitHub Pages y Samuel entra
por un link desde su PC.

Todo el contenido del juego está **en inglés**. La documentación y la conversación
conmigo, en español.

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

---

## Estructura

```
samuel-quest/
├── index.html            hub; lee subjects.js, no se edita
├── subjects.js           registro de materias (añadir 1 objeto por materia)
├── assets/
│   ├── engine.css        design system                (NO EDITAR)
│   └── engine.js         motor                        (NO EDITAR)
├── subjects/
│   └── y6-maths-counting-sequences/
│       ├── index.html    loader de 12 líneas
│       └── data.js       contenido (autogenerado)
├── tools/
│   └── gen_y6_maths_counting.py   generador con validación
├── PROMPT.md             prompt maestro para materias nuevas
├── DESIGN_SYSTEM.md      reglas visuales inviolables
└── PROJECT_INSTRUCTIONS.md
```

---

## Reglas de contenido

| Regla | Valor |
|---|---|
| Idioma del juego | Inglés |
| Niveles | 5 (uno por día) |
| Duración objetivo | ~30 min por nivel |
| Familias de preguntas por nivel | 16 mínimo |
| Variantes por familia | 3 mínimo |
| Formato | Selección múltiple, 4 opciones, siempre |
| Progresión | Creciente entre niveles y dentro de cada nivel |
| Nivel curricular | Year 6 británico, edad 10-11 |

**Anti-repetición (requisito central):** una pregunta fallada nunca se vuelve a mostrar
idéntica. El motor la devuelve al final de la cola y sirve otra variante de la misma
familia, con números o datos distintos. Samuel tiene que razonar otra vez, no recordar
qué botón pulsó.

**Distractores:** cada opción incorrecta debe ser un error real que un chico de esa edad
cometería —dirección invertida, un paso de más, olvidar cruzar el cero, confundir la
posición con el valor—. Nada de relleno absurdo.

**Cobertura:** el juego debe cubrir todo lo que aparece en el material de estudio, y los
ejemplos literales del material deben aparecer en los primeros niveles para que reconozca
el terreno. No se introducen temas que el material no menciona.

---

## Flujo semanal

1. Llega el material de estudio (PDF, foto o texto).
2. Abro una conversación nueva, pego `PROMPT.md` y adjunto el material.
3. Claude genera `tools/gen_<slug>.py`, `subjects/<slug>/data.js`,
   `subjects/<slug>/index.html` y la línea de `subjects.js`.
4. Reviso la salida del script y del test.
5. `git add . && git commit -m "add <materia>" && git push`.
6. GitHub Pages publica en 1-2 minutos. Samuel usa el mismo link de siempre.

---

## Generación del contenido: siempre por script

El `data.js` **nunca se escribe a mano**. Se genera con un script Python en `tools/`
que usa `fractions.Fraction` para aritmética exacta y que falla con `assert` si:

- una variante no tiene exactamente 4 opciones,
- las 4 opciones no son únicas como texto,
- una familia tiene menos de 3 variantes,
- un nivel tiene menos de 15 familias.

Motivo: escribir 240 preguntas a mano garantiza errores aritméticos, y una respuesta mal
marcada le enseña a Samuel algo falso. Es el riesgo más caro del proyecto.

---

## Progreso y datos

- Se guarda en `localStorage` del navegador, clave `samuel-quest:<slug>`.
- No hay backend, ni cuentas, ni datos personales en la nube. Costo de infraestructura: **USD 0**.
- Si cambia de computador o borra la caché, empieza de cero. Aceptado a cambio de no
  almacenar datos de un menor en un servidor (Ley 1581 de 2012 — tratamiento de datos de
  menores; al no salir nada del equipo, no hay tratamiento que declarar).
- Si algún día quiero ver su desempeño desde mi lado, eso sí requiere backend: Supabase
  free tier, ~6 h de desarrollo, USD 0/mes hasta 500 MB, y sí implicaría autorización de
  tratamiento de datos del menor. Decisión pendiente, no urgente.

---

## Estado actual

| Materia | Slug | Test | Niveles | Estado |
|---|---|---|---|---|
| Maths — Counting and Sequences | `y6-maths-counting-sequences` | Cycle Test #1 | 5 | Publicado |

---

## Decisiones tomadas (no volver a discutir)

- **Motor + JSON** frente a un HTML por materia. Razón: costo marginal por materia y
  consistencia visual.
- **localStorage** frente a backend. Razón: burn rate cero y cero datos de menor en la nube.
- **`data.js` en vez de `data.json`.** Razón: un `.js` funciona también abriendo el archivo
  con doble clic (`file://`); un `fetch` de JSON lo bloquearía CORS. Cero costo, más robusto.
- **Sin build step, sin framework, sin dependencias.** HTML + CSS + JS plano. GitHub Pages
  lo sirve tal cual. Nada que compilar, nada que actualizar, nada que se rompa en un año.
- **Sonido generado con WebAudio**, sin archivos de audio. Cero peso, cero licencias.
