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
| 1 — Escena `doors` sobre los 5 niveles v1 | **Hecha y publicada** |
| 2 — HERO + armería + animación de la calculadora | **Hecha** |
| 3 — Puntuación v2 | **Hecha** |
| 3b — Lugares (`PLAN-AMBIENTES.md`): ENV, props, camino de tramos, modo aula, colores por dominio | **Hecha** |
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
valores por defecto; nunca borra:

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

**7b. El héroe vive en `samuel-quest:hero`, aparte del progreso.** Clave nueva
y **sin slug**: es transversal a materias, para que el niño no reconfigure su
personaje en cada una. Guarda `{v, body:'a'|'b', alias, chosen, colors}`.

- El motor **no sabe de género**: son cuerpos `a` y `b`; las etiquetas visibles
  ("SHORT HAIR" / "LONG HAIR") están en `ui.js`.
- **El personaje NO tiene nombre. Ni real ni alias.** Decisión de Rafael: un
  nombre es la vía más fácil de atribuirle género; el héroe es un avatar neutro
  que el niño viste. No hay campo de texto libre en ninguna pantalla y la clave
  del héroe guarda solo `{v, body, chosen, colors}`. El plan v2 §5 pedía un
  alias; **queda anulado** (la Fase 2 lo tuvo y se retiró).
- **Todo el contenido habla en segunda persona** ("You have £12.50 and spend…").
  Ningún `data.js` puede llevar un nombre propio ni el antiguo token `{hero}`.
  El harness recorre el juego y falla si algún texto **visible** lleva un
  nombre, y falla si el token existe en el contenido.
- El sprite se ensambla por partes (`BODIES`/`LIMBS`/`FACES`/`OVERLAYS`), nunca
  un string por mood. Las 4 piezas de armadura se pintan con
  `var(--h-helm|body|glove|boot)`; ningún `fill` fijo en esas piezas.
- **Todo color de armadura elegible debe cumplir contraste ≥ 3:1 sobre
  `--bg-1`**, y **todo color por defecto debe estar en la paleta** — si no, la
  armería muestra esa fila sin nada marcado. Ambas cosas las comprueba el
  harness. El `#1c2555` de las piernas de v1 da 1.16:1 y por eso no está.

**7d. Cada nivel es un LUGAR, declarado en datos (`PLAN-AMBIENTES.md`).**
Módulo `ENV` hermano de `SCENES`: pinta cinco capas (cielo, lejano, pared,
casillas, suelo) detrás de la escena y no sabe qué mecánica hay encima.

- Un nivel declara `env: { palette, materials:{wall,floor}, far[], wall[], fg[],
  gate, transition }`. Los props salen de `assets/props.js` por id
  (`torch`, `tree`, `gear`…), inlinado por `build.py`. Sin `env`, el nivel se ve
  como antes: cualquier `data.js` sigue valiendo.
- **`engine.js` no conoce lugares ni ids de prop.** "castle" no existe: el lugar
  es la combinación de props + materiales + paleta. El harness falla si un id de
  prop o un nombre de lugar aparece como literal en el motor (comentarios aparte).
- Materiales = patrones SVG en gris como `url('data:image/svg+xml,…')`, tintados
  con `--env-wall`/`--env-floor` por `multiply`. **Comillas simples** dentro del
  `url()`: va en un atributo `style="…"` y con dobles se corta (pasó).
- Regla R1: nada decorativo junto a las casillas. Regla R2: mientras se decide
  solo se mueve el héroe; animación ambiental ≤ 6 por escena, `steps()`, > 2 s.
- **Camino de tramos:** al pulsar NEXT la escena vieja sale (`.scene-slot.is-out`)
  y la nueva entra (`.is-in`); el lugar se desliza (`.env.is-shift`); la barra
  del HUD es el camino (`#hudPath`, un tramo por familia); la puerta del jefe
  (`.env__gate`) se acerca con `--gs`. Nada de esto bloquea la respuesta: la
  pregunta nueva es respondible en el mismo tick. jsdom no dispara
  `animationend`, así que el harness mira solo `.scene-slot:not(.is-out)`.
- **Modo aula** (`STATE.aula`, clase `is-aula` en `<html>`) y
  `prefers-reduced-motion`: cero animación, transición en corte seco, la pista
  abre sin esperar. `motionOff()` es la única función que lo decide.
- **Playtest aplicado:** `e.repeat` se ignora (teclados de colegio); al fallar el
  héroe **se queda** en la puerta roja (anula plan v2 §3.3); la celebración es
  contenida (sin brinco escalado).
- **Colores por dominio:** 4 de salida + 1 por nivel con 2+ estrellas, calculado
  (no guardado). Un color ya puesto nunca se bloquea.

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
completos con aciertos y errores. Hoy son 183 comprobaciones. Encontró la
repetición de variantes, el doble conteo al pulsar NEXT dos veces, un texto con
"daily" colado en `ui.js`, tres filas de la armería que arrancaban sin ningún
color marcado, que fallar la primera pregunta no costaba XP, y que el `url()` de
los materiales cortaba el atributo `style` y no se pintaba nada.

Al añadir una pieza, **añade sus comprobaciones al harness**, y no borres las
que ya están. Para una escena nueva, como mínimo: el nivel termina; solo con
teclado; la casilla confirmada coincide con `answer` tras barajar; al fallar el
héroe vuelve al inicio; ninguna variante fallada se sirve idéntica.

Requiere `npm install` una vez (jsdom, dependencia **solo de test**; el juego
publicado no usa npm ni build step).

---

**7c. Puntuación: el niño compite contra sí mismo, nunca contra otros.**
Récord personal por nivel, delta contra la partida anterior, medallas por
habilidad, historial de 5 y barra de progreso. Reglas que no se relajan:

- **Antiinflación:** `hits` y `firstHits` suben como mucho **una vez por
  partida**, al terminar el nivel — nunca por respuesta. Plata exige 3 partidas
  distintas al primer intento, oro 5. Sin esto todo es oro en dos semanas.
- **Tope de estrellas:** fallar la misma familia 3 veces impide la tercera
  estrella, aunque la media salga alta. Tres estrellas significan dominar el
  nivel entero, no 15/16 de él.
- **Nada comparativo entre niños, ni fechas en pantalla.** Un ranking exigiría
  un servidor con datos de menores (Ley 1581/2012); está fuera del plan y su
  coste real está en el anexo de `PLAN-V2.md`.
- No volcar todas las medallas de golpe: la primera partida de un nivel da
  bronce en todas sus habilidades a la vez y eso es ruido, no premio.

---

## Hallazgos abiertos

- **El XP premia la racha, así que fallar la PRIMERA pregunta sale gratis:**
  una partida que falla las dos primeras saca el mismo XP que una perfecta,
  porque el combo ya estaba a cero. Las estrellas y las medallas sí lo
  penalizan, que es donde se mide el dominio. Cambiarlo invalidaría los récords
  ya guardados, así que se dejó como está; el harness lo fija con un test
  marcado `[conocido]` para que cualquier cambio futuro sea visible.
- **`README.md`, `PRIMEROS-PASOS.md`, `PROJECT_INSTRUCTIONS.md` y
  `DESIGN_SYSTEM.md` siguen describiendo v1** (nombre viejo, 5 niveles, sin
  escenas). **Fase 7.**

---

## Cómo responder a Rafael

Perfil de negocio, no técnico. Código funcional y completo, sin placeholders.
Máximo dos opciones técnicas con su trade-off en **horas y USD/mes**. Señalar
deuda técnica sin que la pida. Al terminar: qué debe **ver en pantalla** antes
de publicar, en pasos concretos. En español; el juego, en inglés.
