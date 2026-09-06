# Samu: A Link to the Math

Juegos de estudio para los Cycle Tests de Year 6 (colegio británico IB).
Cada test es un juego de varios niveles. Cada niño avanza a su ritmo.

- **Juego actual:** Maths — Counting and Sequences (Cycle Test #1)
- **Link del juego:** <https://rafaeldeavilaf.github.io/Cycle_test/>
- **Repositorio:** <https://github.com/rafaeldeavilaf/Cycle_test>
- **Stack:** HTML plano. Sin dependencias, sin backend. Infraestructura: USD 0/mes.

> **Estado.** Lo publicado hoy es la v1: 5 niveles de opción múltiple, y el HTML todavía
> dice "Samuel Quest" por dentro. La v2 —7 niveles donde el personaje se mueve con el
> teclado para responder, un jefe por nivel, personaje configurable, puntuación visible y
> el nombre nuevo— está en fase de plan, sin construir.
> Ver [`PROJECT_INSTRUCTIONS.md`](PROJECT_INSTRUCTIONS.md) y
> [`PROMPT-PLAN-MEJORA.md`](PROMPT-PLAN-MEJORA.md). Los niveles y los jefes concretos los
> define el equipo del plan v2; [`NIVELES-Y-JEFES.md`](NIVELES-Y-JEFES.md) es solo un
> borrador interno para contrastar después.

---

## Publicar cambios

Esta carpeta **es** el repositorio: está clonada y enlazada con GitHub.

### Doble clic en `publicar.bat`

Sube todo lo que haya cambiado y actualiza el sitio. Eso es todo.

La primera vez Git te pedirá iniciar sesión en GitHub: se abre una ventana del
navegador, aceptas, y no vuelve a preguntar. Si no tienes Git instalado, el script
te lo dice y te da el link (<https://git-scm.com/download/win>).

### Alternativa sin terminal: GitHub Desktop

<https://desktop.github.com> → **File → Add local repository** → elige esta carpeta →
escribes un resumen → **Commit to main** → **Push origin**.

### Comprobar

El sitio tarda 1-2 minutos. Si lo ves igual, es la caché: `Ctrl + F5`.
Debe verse fondo azul oscuro, tipografía de píxeles y la tarjeta
**COUNTING AND SEQUENCES**.

---

## Qué se publica

Solo dos archivos importan para el navegador:

```
index.html                            ← el menú
y6-maths-counting-sequences.html      ← el juego completo
```

Cada uno lleva dentro el CSS, el motor y las 400 preguntas. **No dependen de ninguna
carpeta.**

> **Por qué:** en el primer despliegue, el arrastrar-y-soltar de GitHub descartó
> silenciosamente las carpetas `assets/` y `subjects/`. La página cargó sin estilos y el
> juego no existía. Un archivo autocontenido no puede subirse a medias.

Las carpetas `assets/`, `subjects/` y `tools/` son el **código fuente**: van al repo para
tenerlo versionado, pero el navegador no las necesita.

---

## Añadir la materia de la semana siguiente

1. Abre una conversación nueva de Claude.
2. Pega el contenido de [`PROMPT.md`](PROMPT.md) y adjunta el material de estudio.
3. Claude escribe los archivos en esta misma carpeta y ejecuta `tools/build.py`.
4. Doble clic en `publicar.bat`.

**Nunca se editan** `assets/engine.css` ni `assets/engine.js` al añadir una materia.
Ahí vive el diseño compartido. Ver [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) y
[`PROJECT_INSTRUCTIONS.md`](PROJECT_INSTRUCTIONS.md).

---

## Cómo se juega

- Se avanza nivel a nivel, al ritmo de cada niño.
- Cada nivel abre con un **briefing** que enseña el método antes de preguntar.
- Se responde con el ratón o con el teclado: `A B C D` o `1 2 3 4`; `Enter` para avanzar.
- Si falla una pregunta, esa pregunta **vuelve más tarde con números distintos**: tiene
  que razonar de nuevo, no le sirve recordar la respuesta.
- El nivel termina cuando ha resuelto bien las 16 preguntas. Ahí se desbloquea el siguiente.
- Al reintentar una pregunta que ya falló, **la pista aparece sola**: la segunda vez viene con andamiaje.
- Estrellas según aciertos al primer intento: 3 si ≥90%, 2 si ≥70%, 1 en el resto.
- El progreso se guarda en el navegador de cada niño. Nada sale de su equipo.

---

## Estructura

```
index.html                           PUBLICABLE — menú autocontenido      GENERADO
y6-maths-counting-sequences.html     PUBLICABLE — juego autocontenido     GENERADO
publicar.bat                         doble clic para publicar

assets/engine.css                    design system      (NO EDITAR por materia)
assets/engine.js                     motor del juego    (NO EDITAR por materia)
subjects/<slug>/data.js              contenido de una materia
subjects.js                          registro de materias
tools/gen_y6_maths_counting.py       genera data.js con aritmética verificada
tools/build.py                       inlina todo en los .html de la raíz
```

Regenerar contenido y reconstruir los publicables:

```bash
python3 tools/gen_y6_maths_counting.py subjects/y6-maths-counting-sequences
# OK -> ... levels=5 families=80 variants=400

python3 tools/build.py
# index.html                          18.1 KB
# y6-maths-counting-sequences.html   227.5 KB
```

El generador usa `fractions.Fraction`, así que decimales y fracciones son exactos, y falla
con `assert` si alguna pregunta queda con opciones duplicadas o mal formadas.

---

## Probar en local

Doble clic en `index.html`. Funciona sin servidor: todo va dentro del archivo.
