# PROMPT — Implementar una fase de PLAN-V2.md

Pega este archivo al abrir una conversación nueva para implementar una fase del
rediseño v2, y di **qué fase** (0 a 7). Adjunta `PLAN-V2.md` si no está en el
knowledge del proyecto.

> **Di el número de fase.** "Fase N" no es una fase; N es un marcador.

---

## Estado real del código (actualizar al cerrar cada fase)

| Fase | Estado |
|---|---|
| 0 — Limpieza, `ui.js`, migración v3, harness | **Hecha y publicada** |
| 1 — Escena `doors` sobre los 5 niveles v1 | **Hecha** |
| 2 — HERO + armería + animación de la calculadora | Pendiente |
| 3 — Puntuación v2 | Pendiente (los datos ya se guardan, ver abajo) |
| 4 — Generador v2: 7 niveles, `mech`, jefes | Pendiente |
| 5 — Escenas `bridge`/`ruler`/`planks`/`lift`/`rule`/`machine`/`smash` | Pendiente |
| 6 — Sistema de jefes | Pendiente |
| 7 — Documentación | Pendiente |

---

## Contrato del motor — no romper ninguna de estas

**1. Tres capas de texto. `engine.js` no contiene NI UN texto visible.**

| Capa | Archivo | Contiene |
|---|---|---|
| Contenido | `subjects/<slug>/data.js` | mundos, jefes, fases, briefings, preguntas |
| Chrome | `assets/ui.js` → `window.GAME_UI` | botones, HUD, ayudas, mensajes genéricos |
| Lógica | `assets/engine.js` | **cero texto visible** |

Mezcla: `GAME_UI` ← `DATA.ui` ← `DATA.meta.mate` (solo compañero), profunda.
Interpolación con `fmt(tpl, {clave: valor})` sobre `{clave}`.
El harness falla si un nombre de mundo aparece en `engine.js` o en `ui.js`.

**2. La clave de `localStorage` es `samuel-quest:<slug>` y NO se renombra nunca.**
El nombre visible del juego vive en `GAME_UI.brand` y no toca la clave.
`tools/build.py` lee `brand` de `ui.js` con un regex; si no lo encuentra, aborta.

**3. `STATE.version` es 3.** La migración en `load()` **solo añade** campos con
valores por defecto; nunca borra. Ya se guarda, listo para la Fase 3:

```js
STATE = { version: 3, sound, music, totalXP, skills: {}, bestComboEver,
          levels: { [id]: { done, stars, best, plays, bossClean, history: [...máx 5] } } }
```
`history[i] = { xp, first, misses, combo, at }`. Al subir a v4, mismo criterio.

**4. La anti-repetición no se toca.** `Runner`, la cola, `seen` / `lastVar` /
`tries` y `answer()` son intocables salvo con test que lo cubra. Garantías:
se agotan todas las variantes de una familia antes de reutilizar ninguna, y al
reiniciar el ciclo nunca se sirve la última vista.

**5. Contrato de escenas (`SCENES`).** Una escena es **solo un renderer de
opciones**: recibe una variante ya elegida por el `Runner` y traduce movimiento
en una elección. Por eso no puede romper la anti-repetición.

```js
SCENES[mech] = function () {
  return {
    mount(container, ctx),              // ctx = { variant, order, keys, pick(orig), say(text) }
    move(delta),                        // ±1 casilla
    jump(i),                            // salta a la casilla i y la confirma
    confirm(),                          // cruza la casilla actual -> ctx.pick(orig)
    markResult(answerOrig, chosenOrig), // ilumina la correcta, marca la elegida
    destroy()
  };
};
```

`mech` es un campo **opcional por familia** en `data.js`. Si falta, `doors`.
Así un `data.js` de v1 y cualquier materia futura sin escena propia siguen
funcionando. `doors` es además el fallback de toda mecánica no implementada.

**6. Reglas de interacción, iguales en toda escena:**
movimiento **discreto por casillas**; nada se mantiene pulsado; **sin reloj y
sin saltos con temporización**; flechas mueven, `Enter`/`Espacio` confirma,
`A-D`/`1-4` saltan y confirman, clic camina y confirma; al fallar el héroe
vuelve al inicio del tramo y la familia vuelve más tarde con otra variante.

**7. Accesibilidad, no negociable:** cada casilla es un `<button>` real dentro
de un `role="group"` con nombre; la posición se anuncia por `aria-live`; con
`prefers-reduced-motion` el héroe **aparece** en la casilla en vez de caminar
(es CSS puro: `.scene__hero { transition: none }`).

**8. DOM + CSS, nunca canvas.** Un héroe y ≤ 12 casillas no lo justifican, y
canvas obliga a construir una capa de accesibilidad paralela.

**9. Publicación:** `tools/build.py` inlina `engine.css` + `ui.js` + `data.js` +
`engine.js` en un `.html` autocontenido por materia, más el hub. **Nunca
entregar un HTML publicable que apunte a `assets/`** — es el modo de fallo
conocido del proyecto; `build.py` aborta si ocurre. Claude **no** hace `git push`:
publica Rafael con `publicar.bat`.

---

## Método de verificación — obligatorio antes de decir que algo está hecho

No se revisa el motor leyendo el código. Se juega:

```
python tools/build.py
node tools/harness.js
```

`tools/harness.js` abre el `.html` **ya construido** en jsdom y juega niveles
completos con aciertos y errores. Hoy son 65 comprobaciones. Encontró la
repetición de variantes, el doble conteo al pulsar NEXT dos veces, y un texto
con "daily" que se había colado en `ui.js`.

Al añadir una pieza, **añade sus comprobaciones al harness**, y no borres las
que ya están. Para una escena nueva, como mínimo: el nivel termina; solo con
teclado; la casilla confirmada coincide con `answer` tras barajar; al fallar el
héroe vuelve al inicio; ninguna variante fallada se sirve idéntica.

Requiere `npm install` una vez (jsdom, dependencia **solo de test**; el juego
publicado no usa npm ni build step).

---

## Hallazgos abiertos

- **Las estrellas no castigan atascarse en una habilidad.** `stars()` mide
  aciertos al primer intento por familia: fallar la misma familia 7 veces
  seguidas cuesta 1/16 y aún da 3 estrellas. Contradice el criterio del plan
  ("no domina = falla la misma familia 3 veces"). **Decisión de la Fase 3.**
  El harness fija el comportamiento actual para que el cambio se vea.
- **Los briefings de `data.js` dicen "Welcome to the Quest, Samuel".** Otros
  niños lo leen. Se resuelve con el alias de §5 (**Fase 2**) y exige regenerar
  con `tools/gen_y6_maths_counting.py`.
- **`README.md`, `PRIMEROS-PASOS.md`, `PROJECT_INSTRUCTIONS.md` y
  `DESIGN_SYSTEM.md` siguen describiendo v1** (nombre viejo, 5 niveles, sin
  escenas). **Fase 7.**

---

## Cómo responder a Rafael

Perfil de negocio, no técnico. Código funcional y completo, sin placeholders.
Máximo dos opciones técnicas con su trade-off en **horas y USD/mes**. Señalar
deuda técnica sin que la pida. Al terminar: qué debe **ver en pantalla** antes
de publicar, en pasos concretos. En español; el juego, en inglés.
