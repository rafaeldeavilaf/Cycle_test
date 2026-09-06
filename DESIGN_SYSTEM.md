# DESIGN SYSTEM — Samu: A Link to the Math

Este documento es la memoria visual del proyecto. **Todas las materias deben verse como
el mismo juego.** Lo único que cambia entre materias es el color de acento.

Si una materia futura se ve distinta, el error está aquí: alguien editó `assets/engine.css`
en vez de añadir un `data-accent`.

> **Alcance.** Lo que sigue describe la v1 publicada (5 niveles, opción múltiple). El
> rediseño v2 —Obby, 7 niveles, jefes, personaje configurable— cambiará varias de estas
> reglas; cuando se apruebe el plan, este documento se actualiza **antes** de escribir
> código, no después.

---

## 1. Concepto

Un juego de consola retro de 8 bits. Pantalla CRT oscura, bordes gruesos sin esquinas
redondeadas, tipografía de píxeles para la interfaz y una tipografía legible para el
contenido. El protagonista es un sprite pixel-art de 17x20 dibujado en SVG inline dentro
de `engine.js` (función `samuelSVG`), sin archivos de imagen. En v2 el jugador elegirá su
género y los colores de su armadura, así que el sprite deja de ser un personaje fijo y
pasa a ser una plantilla parametrizable.

La regla de oro: **la interfaz es el arcade, el contenido es legible.** Press Start 2P
en textos largos es ilegible para un chico de 10 años; se usa solo en chrome, títulos,
etiquetas y números del HUD.

---

## 2. Tokens (definidos en `:root` de `engine.css`)

| Token | Valor | Uso |
|---|---|---|
| `--bg-0` | `#0b0f2a` | fondo más profundo, interior de fichas |
| `--bg-1` | `#131a3f` | fondo de paneles |
| `--bg-2` | `#1c2555` | superficie elevada, botones, opciones |
| `--bg-3` | `#2a3573` | hover |
| `--ink` | `#eaf0ff` | texto principal |
| `--ink-dim` | `#97a3d4` | texto secundario |
| `--line` | `#4658b8` | borde pixelado |
| `--good` | `#3ce88a` | acierto |
| `--good-dark` | `#12683f` | fondo de opción correcta |
| `--bad` | `#ff4d6d` | error |
| `--bad-dark` | `#7a1930` | fondo de opción incorrecta |
| `--warn` | `#ffd93d` | estrellas, pistas, huecos |
| `--px` | `4px` | unidad de "píxel"; todos los bordes son múltiplos |

**Solo dos tokens cambian por materia:** `--accent` y `--accent-2`.

```css
[data-accent="maths"]      { --accent:#7ee8fa; --accent-2:#c77dff; }  /* cian + violeta */
[data-accent="science"]    { --accent:#3ce88a; --accent-2:#ffd93d; }  /* verde + ámbar  */
[data-accent="english"]    { --accent:#ff9e64; --accent-2:#ff4d6d; }  /* naranja + rojo */
[data-accent="humanities"] { --accent:#ffd93d; --accent-2:#ff9e64; }  /* ámbar + naranja*/
[data-accent="spanish"]    { --accent:#ff6ec7; --accent-2:#7ee8fa; }  /* rosa + cian    */
[data-accent="computing"]  { --accent:#a0ff5c; --accent-2:#7ee8fa; }  /* lima + cian    */
```

El atributo va en la etiqueta `<html>` de `subjects/<slug>/index.html`.
Para una materia nueva: añadir **una línea** a esa lista. Nada más.

---

## 3. Tipografía

| Rol | Fuente | Dónde |
|---|---|---|
| Interfaz | `Press Start 2P` | h1-h3, botones, HUD, tags, fichas, estrellas |
| Contenido | `Nunito` 400/700/900 | enunciados, opciones, explicaciones, briefings |

Tamaños: enunciado 19px, opciones 18px, explicación 16px, briefing 17px.
Ambas se cargan por `@import` desde Google Fonts, con fallback a monospace y system-ui.

---

## 4. Geometría pixelada

- **Nunca `border-radius`.** `--radius: 0px` y no se usa.
- Bordes de `4px` (`--px`) sólidos, color `--line`.
- Relieve por `box-shadow` escalonado, no por difuminado:
  `box-shadow: 0 4px 0 0 #0a0e24, inset 0 4px 0 0 rgba(255,255,255,.08)`.
- Al pulsar, el elemento baja 4px y pierde la sombra (efecto de tecla física).
- Animaciones con `steps()`, nunca `ease`. El movimiento debe verse a saltos.
- Overlay de scanlines CRT sobre todo el documento (`body::after`, `pointer-events:none`).

---

## 5. Componentes fijos

| Clase | Qué es |
|---|---|
| `.pixel-box` | caja base con borde grueso y sombra escalonada |
| `.hud` | barra superior de estado (XP, combo, progreso) |
| `.bar` / `.bar__fill` | barra de progreso rayada con el color de acento |
| `.level-card` | tarjeta de nivel en el mapa; estados `.is-locked`, `.is-done` |
| `.tile` | ficha de una secuencia; `.tile--blank` para el hueco (amarillo) |
| `.opt` | opción de respuesta; estados `.is-right`, `.is-wrong` |
| `.feedback` | panel de explicación; `--good` / `--bad` |
| `.brief` | pantalla de mini-lección; `.example` para el bloque de ejemplo |
| `.victory` | pantalla de fin de nivel con estrellas y estadísticas |
| `.avatar` | sprite del jugador; `--sm`, `--lg`, `--bob`, `--cheer`, `--down` |
| `.mate` | compañero en el HUD de juego: sprite + mensaje reactivo |

---

## 6. Estructura de pantallas (idéntica en toda materia)

```
HUB (index.html)
 └─ MAPA DE NIVELES   5 tarjetas, 4 bloqueadas al inicio
     └─ BRIEFING      mini-lección del día
         └─ JUEGO     pregunta → respuesta → explicación → siguiente
             └─ VICTORIA  estrellas, XP, primer intento, mejor combo
```

Nunca se añade una pantalla nueva sin actualizar este documento.

---

## 7. Reglas de juego (constantes del motor)

- 5 niveles, uno por día.
- 16 familias de preguntas por nivel, 5 variantes cada una.
- Un nivel se supera cuando **todas** las familias se han respondido bien una vez.
- Al fallar, la familia vuelve al final de la cola con **otra variante**. El motor agota
  todas las variantes antes de reutilizar ninguna y nunca repite la última servida.
- Al reintentar una familia ya fallada, la pista se muestra sola.
- El orden de las opciones se baraja en cada aparición.
- XP: 100 base + 20 por cada eslabón de combo (tope 8) = máximo 260 por acierto.
- Estrellas por aciertos al primer intento: ≥90% = 3, ≥70% = 2, resto = 1.
- Guardado en `localStorage`, clave `samuel-quest:<slug>`. **La clave no se renombra**
  aunque el juego cambie de nombre: hacerlo borra el progreso de quien ya venía jugando.
- Sonido 8-bit generado con WebAudio (osciladores square), sin archivos, con interruptor.
- Teclado: `A B C D` o `1 2 3 4` para responder, `Enter` para avanzar.

---

## 8. Accesibilidad

Auditado, con los ratios calculados sobre los tokens reales:

- **Contraste WCAG AA en las 12 combinaciones del juego.** La más ajustada es el error
  rojo sobre panel (5.24:1) y el texto sobre la opción correcta (5.98:1); el mínimo es 4.5:1.
- `:focus-visible` amarillo de 4px en botones, opciones y tarjetas.
- Las tarjetas de nivel son operables con `Enter` y `Espacio`.
- El panel de feedback es `role="status"` con `aria-live="polite"`: un lector de pantalla
  anuncia si acertó y la explicación.
- Las opciones van en un `role="group"` con etiqueta.
- Nada de texto por debajo de 11px.
- Sin scroll horizontal: `.options` pasa a una columna bajo 620px, `.seq` desplaza dentro
  de su propia caja, y hay un breakpoint de 380px para móviles estrechos.
- `prefers-reduced-motion` desactiva todas las animaciones.

---

## 9. Samuel reacciona

El sprite vive en el HUD de la pantalla de juego (`.mate`) y tiene tres estados.
La función `samuelSVG(mood)` de `engine.js` cambia **ojos, boca y brazos**; el CSS
añade el movimiento.

| Estado | Cuándo | Cara | Brazos | Animación |
|---|---|---|---|---|
| `idle` | esperando respuesta | ojos normales, boca recta | a los lados | `--bob` (flota) |
| `happy` | acierto | ojos `^ ^`, sonrisa, chispas | **arriba** | `--cheer` (salta) |
| `sad` | fallo | ojos bajos, cejas caídas, gota | caídos | `--down` (se hunde) |

Va acompañado de un mensaje corto en `#mateMsg` (`is-good` verde / `is-bad` rojo),
tomado al azar de `CHEERS` y `CONSOLES`. Con combo de 3 o más, el mensaje de acierto
lo reemplaza el contador de combo.

Las tres animaciones se desactivan con `prefers-reduced-motion`.

---

## 10. Música

Chiptune de 8 compases **generada por código** con WebAudio. Cero archivos, cero peso,
cero licencias.

- 126 BPM, progresión I–V–vi–IV en Do mayor.
- Tres voces: lead cuadrada, bajo triangular, batería (bombo sinusoidal + hi-hat de ruido).
- Dos frases que se alternan en cada vuelta (`LEAD_A` / `LEAD_B`) para que no canse.
- Volumen bajo. Baja aún más (`MUSIC.duck`) cuando suena un efecto o al terminar un nivel.
- Se pausa sola si Samuel cambia de pestaña.
- Interruptor propio, separado del de efectos: botón `MUSIC` en el mapa y en el juego,
  ambos sincronizados y guardados en `localStorage`.
- Arranca en el primer clic, nunca antes: los navegadores bloquean el audio automático.

**No añadas archivos de audio al proyecto.** Rompería la regla del HTML autocontenido.
