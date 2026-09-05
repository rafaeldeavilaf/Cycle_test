# Samuel Quest

Juegos de estudio para los Cycle Tests de Samuel (Year 6, colegio británico IB).
Cada test es un juego de 5 niveles; cada nivel es un día de estudio de ~30 minutos.

- **Juego actual:** Maths — Counting and Sequences (Cycle Test #1)
- **Stack:** HTML plano. Sin build para el navegador, sin dependencias, sin backend.
- **Costo de infraestructura:** USD 0/mes.

---

## ⚡ Lo único que hay que subir a GitHub

Dos archivos. **Solo dos.** Están en la raíz de esta carpeta:

```
index.html                            ← el menú
y6-maths-counting-sequences.html      ← el juego completo
```

Cada uno lleva dentro el CSS, el motor y las 240 preguntas. **No dependen de ninguna
carpeta.** Si alguna vez se pierde una carpeta al subir, el juego sigue funcionando.

> **Por qué esto importa:** en el primer intento, el arrastrar-y-soltar de GitHub descartó
> silenciosamente las carpetas `assets/` y `subjects/`. La página cargó sin estilos y el
> juego no existía. Con archivos autocontenidos ese fallo es imposible.

Las carpetas `assets/`, `subjects/` y `tools/` son el **código fuente**. Puedes subirlas
si quieres tenerlo todo versionado, pero el navegador no las necesita.

---

## Actualizar el repo que ya existe (`Cycle_test`)

1. Entra a <https://github.com/rafaeldeavilaf/Cycle_test>.
2. Click en **Add file → Upload files**.
3. Arrastra **estos dos archivos**: `index.html` y `y6-maths-counting-sequences.html`.
4. Abajo, **Commit changes**. El `index.html` viejo se reemplaza solo.
5. Espera 1-2 minutos y recarga <https://rafaeldeavilaf.github.io/Cycle_test/>.

Si sigue viéndose sin estilos, es la caché del navegador: `Ctrl + F5`.

### Comprobar que quedó bien

En la página debe verse fondo azul oscuro, tipografía de píxeles y una tarjeta
**COUNTING AND SEQUENCES**. Al hacer clic, el mapa con **LEVEL 1** desbloqueado y los
otros cuatro con candado.

---

## Publicar desde cero (si algún día empiezas otro repo)

1. <https://github.com/new> → nombre `samuel-quest` → **Public** → **Create repository**.
2. **uploading an existing file** → arrastra los dos `.html` → **Commit changes**.
3. **Settings → Pages** → Source: *Deploy from a branch* → Branch: **main** / **/ (root)** → **Save**.
4. En 1-2 minutos: `https://<tu-usuario>.github.io/samuel-quest/`.

Ese link no cambia nunca, aunque añadas materias.

---

## Probar en local

Doble clic en `index.html`. Funciona sin servidor: todo va dentro del archivo.

---

## Añadir la materia de la semana siguiente

1. Abre una conversación nueva de Claude.
2. Pega el contenido de [`PROMPT.md`](PROMPT.md) y adjunta el material de estudio.
3. Claude devuelve **un `.html` nuevo** más un `index.html` actualizado.
4. Sube esos dos archivos al repo igual que arriba.

**Nunca se editan** `assets/engine.css` ni `assets/engine.js` al añadir una materia.
Ahí vive el diseño compartido. Ver [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) y
[`PROJECT_INSTRUCTIONS.md`](PROJECT_INSTRUCTIONS.md).

---

## Cómo se juega

- Un nivel por día, cinco días antes del test.
- Cada nivel abre con un **briefing** que enseña el método antes de preguntar.
- Se responde con el ratón o con el teclado: `A B C D` o `1 2 3 4`; `Enter` para avanzar.
- Si falla una pregunta, esa pregunta **vuelve más tarde con números distintos**: tiene
  que razonar de nuevo, no le sirve recordar la respuesta.
- El nivel termina cuando ha resuelto bien las 16 preguntas. Ahí se desbloquea el siguiente.
- Estrellas según aciertos al primer intento: 3 si ≥90%, 2 si ≥70%, 1 en el resto.
- El progreso se guarda en el navegador de Samuel. Nada sale de su equipo.

---

## Para mantenimiento (opcional)

Estructura del código fuente:

```
assets/engine.css                    design system      (NO EDITAR por materia)
assets/engine.js                     motor del juego    (NO EDITAR por materia)
subjects/<slug>/data.js              contenido de una materia
subjects.js                          registro de materias
tools/gen_y6_maths_counting.py       genera data.js con aritmética verificada
tools/build.py                       inlina todo en los .html de la raíz
```

Regenerar el contenido de Maths y reconstruir los archivos publicables:

```bash
python3 tools/gen_y6_maths_counting.py subjects/y6-maths-counting-sequences
# OK -> ... levels=5 families=80 variants=240

python3 tools/build.py
# index.html                          16.2 KB
# y6-maths-counting-sequences.html   145.7 KB
```

El generador usa `fractions.Fraction`, así que decimales y fracciones son exactos, y falla
con `assert` si alguna pregunta queda con opciones duplicadas o mal formadas.
