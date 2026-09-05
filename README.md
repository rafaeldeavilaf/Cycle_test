# Samuel Quest

Juegos de estudio para los Cycle Tests de Samuel (Year 6, colegio británico IB).
Cada test es un juego de 5 niveles; cada nivel es un día de estudio de ~30 minutos.

- **Juego actual:** Maths — Counting and Sequences (Cycle Test #1)
- **Stack:** HTML + CSS + JS plano. Sin build, sin dependencias, sin backend.
- **Costo de infraestructura:** USD 0/mes.

---

## Publicar en GitHub Pages (una sola vez, ~5 minutos)

### Opción A — desde la web de GitHub (sin instalar nada)

1. Entra a <https://github.com/new>.
   - Repository name: `samuel-quest`
   - Visibilidad: **Public** (Pages gratis requiere público en cuentas Free)
   - No marques "Add a README"
   - **Create repository**
2. En la pantalla siguiente, click en **uploading an existing file**.
3. Arrastra **el contenido** de la carpeta `samuel-quest` (no la carpeta en sí):
   `index.html`, `subjects.js`, la carpeta `assets/`, la carpeta `subjects/`,
   y los `.md`. GitHub conserva la estructura de carpetas.
4. Abajo, **Commit changes**.
5. Ve a **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: **main** / carpeta **/ (root)** → **Save**
6. Espera 1-2 minutos y recarga. Arriba aparecerá el link:

```
https://<tu-usuario>.github.io/samuel-quest/
```

Ese es el link que le pasas a Samuel. No cambia nunca, aunque añadas materias.

### Opción B — desde la terminal

```bash
cd samuel-quest
git init
git add .
git commit -m "Samuel Quest: Maths Cycle Test #1"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/samuel-quest.git
git push -u origin main
```

Luego **Settings → Pages → main / (root) → Save**.

---

## Probar en local

Abrir `index.html` con doble clic funciona: el contenido se carga como `.js`, no por
`fetch`, así que no hay bloqueo de CORS.

Si prefieres un servidor:

```bash
cd samuel-quest
python3 -m http.server 8000
# http://localhost:8000
```

---

## Añadir la materia de la semana siguiente

1. Abre una conversación nueva de Claude.
2. Pega el contenido de [`PROMPT.md`](PROMPT.md) y adjunta el material de estudio.
3. Claude devuelve 4 cosas: `tools/gen_<slug>.py`, `subjects/<slug>/data.js`,
   `subjects/<slug>/index.html` y una línea nueva para `subjects.js`.
4. Súbelas al repo (arrastrar en la web de GitHub, o `git push`).
5. Listo. El mismo link muestra el juego nuevo en el hub.

**Nunca se editan** `assets/engine.css` ni `assets/engine.js`. Ahí vive el diseño
compartido; si se tocan, cada materia empieza a verse distinta.
Ver [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) y [`PROJECT_INSTRUCTIONS.md`](PROJECT_INSTRUCTIONS.md).

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

## Regenerar el contenido de Maths

```bash
python3 tools/gen_y6_maths_counting.py subjects/y6-maths-counting-sequences
# OK -> subjects/y6-maths-counting-sequences/data.js
# levels=5 families=80 variants=240
```

El script usa `fractions.Fraction`, así que decimales y fracciones son exactos, y falla
con `assert` si alguna pregunta queda con opciones duplicadas o mal formadas.
