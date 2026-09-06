# NIVELES Y JEFES — Samu: A Link to the Math (v2)

**Propuesta base para el plan v2.** No es una decisión cerrada: el equipo de expertos debe
validarla, corregirla o sustituirla con argumentos. Existe para que el plan discuta algo
concreto en vez de empezar de cero.

Todo aquí está mapeado contra el material real del **Cycle Test #1 — Counting and
Sequences**, que es el único contenido que existe hoy (80 familias, 400 variantes).

---

## 1. La mecánica base: moverse *es* responder

Se descarta el plataformeo de destreza. El riesgo era claro: un niño que domina la
matemática pero falla el salto se queda atascado, y el juego acaba midiendo reflejos en
vez de razonamiento.

**En su lugar: el personaje se mueve con el teclado y su desplazamiento es la respuesta.**

- No hay saltos con temporización, ni caídas, ni precisión de píxel.
- No hay reloj que penalice pensar despacio.
- Elegir mal nunca mata: devuelve al inicio del tramo y la pregunta vuelve más tarde con
  otra variante, exactamente como hoy.

La regla de diseño que ordena todo:

> **La forma de moverse debe encarnar la habilidad, no decorarla.**
> Si la mecánica se puede cambiar por otra sin que cambie lo que el niño aprende, está mal.

### Las seis formas de moverse

Cada mundo usa la que corresponde a su habilidad. No son adornos intercambiables.

| Mecánica | Cómo se juega | Qué habilidad encarna |
|---|---|---|
| **Las puertas** | Cuatro portales rotulados al fondo del pasillo. Caminas hacia el correcto y lo cruzas. | Elegir el término siguiente. Es la forma base, la más limpia. |
| **El puente de losas** | El camino son losas numeradas sobre el vacío. Solo pisas las que continúan la secuencia; las demás no sostienen. | Contar varios pasos seguidos, no uno solo. El niño ejecuta la secuencia con los pies. |
| **El ascensor de la mina** | Una recta numérica **vertical**. Subes y bajas por ella; el cero es el nivel del mar, marcado. | Cruzar el cero. Ver que bajar de 2 a −3 son cinco pasos y no uno. |
| **La losa que falta** | Un puente incompleto. Cuatro piezas flotan; arrastras la correcta al hueco. | Rellenar huecos, incluidos los no consecutivos. |
| **La cerradura de runas** | Una puerta sellada con un número. Se abre solo si ese número pertenece a la secuencia. Decides si forzarla o buscar otra ruta. | Verificar pertenencia. Obliga a razonar la posición, no a continuar contando. |
| **El teletransportador** | Una consola donde escribes una posición (*n*) y apareces en el término que le corresponde. | La regla posición→término. Encarna el salto: llegar al término 100 sin recorrer los 99 anteriores. |

Ninguna exige destreza. Todas exigen haber entendido algo.

---

## 2. Los 7 mundos

Los cinco primeros ya existen como contenido en v1. Los mundos 5 y 7 son nuevos y hay que
generar sus preguntas; el mundo 6 es el actual nivel 5.

| # | Mundo | Habilidad que entrena | Mecánica dominante |
|---|---|---|---|
| 1 | **WHOLE NUMBER WAY** | Contar hacia delante y hacia atrás en pasos enteros. Encontrar el paso. | Las puertas |
| 2 | **DECIMAL DEPTHS** | Pasos decimales. No confundir décimas con centésimas. | El puente de losas |
| 3 | **FRACTION FOREST** | Pasos fraccionarios y números mixtos. | El puente de losas + puertas |
| 4 | **NEGATIVE CAVERNS** | Cruzar el cero. Contar en negativos. | El ascensor de la mina |
| 5 | **THE BROKEN BRIDGE** *(nuevo)* | Términos que faltan, incluidos huecos separados entre sí. Deducir el paso desde datos incompletos. | La losa que falta |
| 6 | **RULE MASTER TOWER** | Regla posición→término. Encontrar cualquier término al instante. | El teletransportador |
| 7 | **THE ARCHIVE** *(nuevo)* | Nada nuevo: mezcla las seis anteriores sin avisar cuál toca. | Todas |

El mundo 7 no enseña: **evalúa**. Es el simulacro del Cycle Test, jugado. Su valor
pedagógico es que obliga a *reconocer* qué tipo de problema tiene delante, que es
justamente lo que falla en un examen real donde las preguntas no vienen ordenadas por tema.

**Contenido pendiente de generar:** mundo 5 (16 familias × 5 variantes) y mundo 7
(preguntas mezcladas, que pueden reutilizar familias existentes recombinadas).

---

## 3. El sistema de combate contra jefes

### Reglas comunes a los siete

- **La vida del jefe son preguntas.** Cada acierto es un golpe. No hay otra forma de
  hacer daño.
- **Acertar a la primera hace daño crítico** (doble). Así el combate premia dominio y no
  insistencia, igual que las estrellas del nivel.
- **Sin reloj.** Nunca. Pensar despacio no puede castigarse en un juego cuyo propósito es
  que el niño razone.
- **Tres corazones.** Fallar cuesta un corazón, y el jefe responde con un ataque
  telegrafiado —una animación, no una amenaza real de destreza—.
- **Perder no devuelve al principio del mundo.** Reinicia solo el combate, con variantes
  distintas de las mismas familias. Perder cuesta tiempo, nunca progreso.
- **Anti-repetición intacta.** Una pregunta fallada en el combate no reaparece idéntica.
- **El jefe evalúa algo que las preguntas del mundo no evalúan.** Casi siempre: la
  habilidad **invertida**, o dos habilidades a la vez. Un jefe que es "más de lo mismo con
  música épica" no justifica lo que cuesta construirlo.
- **Fases.** Cada jefe tiene dos o tres, y cada fase cambia de mecánica. Eso convierte el
  combate en una síntesis del mundo en vez de un examen más largo.

### Los siete jefes

**1 · THE STEPKEEPER** — *Whole Number Way*
Guardián de piedra que sostiene el puente de entrada.
Durante el mundo te daban la secuencia y pedían el siguiente número. El Stepkeeper hace lo
contrario: te muestra dos números **separados** y te obliga a deducir el paso que los une.
- *Fase 1:* levanta losas con huecos; eliges el paso que completa el tramo.
- *Fase 2:* te da el primer y el último número y el número de saltos. Deduces el paso.

**2 · THE COMMA SENTINEL** — *Decimal Depths*
Inunda el pasillo. El nivel del agua es un decimal que sube.
Ataca el error clásico de la edad: tratar 0.1 y 0.01 como si fueran lo mismo.
- *Fase 1:* eliges la puerta que baja el agua **exactamente** un paso.
- *Fase 2:* el agua baja sola con un paso oculto; deduces cuál es antes de moverte.

**3 · THE FRACTION HYDRA** — *Fraction Forest*
Varias cabezas, cada una con una fracción de la secuencia.
No pide continuar: pide **auditar**. Una cabeza miente y hay que cortar esa.
- *Fase 1:* cortar la cabeza cuyo número rompe el patrón.
- *Fase 2:* al cortar mal, la cabeza se divide en dos y añade una pregunta. Equivocarse
  alarga el combate en vez de terminarlo — la penalización es narrativa, no punitiva.

**4 · THE ZERO WARDEN** — *Negative Caverns*
Custodia la línea del cero en el pozo vertical.
- *Fase 1:* te empuja hacia abajo un número de pasos; calculas a qué profundidad quedas.
- *Fase 2:* al revés — te dice dónde acabas y deduces cuántos pasos te empujó.
- *Fase 3:* dos empujones, uno arriba y otro abajo, cruzando el cero. Es el punto exacto
  donde falla la mayoría.

**5 · THE GAP GOLEM** — *The Broken Bridge*
Un golem hecho de las losas que faltan en el puente. Cada pieza correcta que le arrancas
lo debilita y repara el camino.
- *Fase 1:* un hueco por golpe.
- *Fase 2:* **dos huecos separados** en la misma secuencia. No sirve contar de uno en uno:
  hay que deducir el paso primero.

**6 · THE RULE ORACLE** — *Rule Master Tower*
No pregunta números: pregunta **reglas**.
- *Fase 1:* te da la secuencia, respondes con la regla.
- *Fase 2:* te da la regla, respondes con un término lejano (el 50, el 100).
- *Fase 3:* te da un número y pregunta si pertenece a la secuencia y en qué posición.
El ida y vuelta entre regla y término es el salto conceptual de todo el mundo; el Oracle
lo obliga en las dos direcciones.

**7 · THE ARCHIVIST** — *The Archive*
Jefe final. Una fase corta por cada uno de los seis jefes anteriores, sin avisar cuál toca.
Evalúa lo que ningún nivel puede evaluar: **retención a distancia** y reconocimiento del
tipo de problema. Es el simulacro del examen, y debería ser lo último que el niño juegue
antes del Cycle Test real.

---

## 4. Qué queda por decidir

Esto es propuesta; el plan v2 debe resolver, con argumentos:

- Si los mundos 5 y 7 son los correctos, o si el material del Cycle Test pide otro corte.
- Cuántas familias por mundo, ahora que la carga se reparte entre 7 y no 5. En v1 un nivel
  real duraba 15-20 minutos con 16 familias.
- Si el jefe sustituye a las últimas preguntas del mundo o se suma a ellas. Sumarlo alarga;
  sustituirlo reduce cobertura. Hay que elegir y justificarlo.
- Cómo se ve un ataque de jefe sin archivos de imagen: todo tiene que salir de SVG inline,
  CSS y WebAudio, como el resto del proyecto.
- Qué pasa con el progreso guardado de quien ya jugó la v1 de 5 niveles.
