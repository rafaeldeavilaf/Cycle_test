#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENERADOR — Español Cycle Test · El Archivo del Laberinto

Genera subjects/espanol-heliodoro-laberinto/data.js para el Cycle Test de
español del lunes 21 de septiembre de 2026 (plan lector *Heliodoro y el
laberinto secreto* + elementos de la narración + producción escrita).

No reproduce nada del libro real: mundo, personajes y fragmentos son
originales ("El Archivo del Laberinto"). Ver claude/modulo-espanol-heliodoro.md
y claude/banco-espanol-heliodoro.md en el proyecto de Claude para el diseño
completo (misconceptions, trade-offs, horas).

DIFERENCIA DELIBERADA con tools/gen_y6_maths_counting.py: el contenido de
lenguaje no se genera por fórmula, así que cada familia trae UNA sola
variante escrita a mano, no 5. Es deuda técnica declarada, no un descuido
(ver sección 10 del plan). El validador de abajo comprueba estructura, no
aritmética: una respuesta correcta, sin distractores duplicados, ningún
enunciado repetido entre ítems.

Uso:
    python3 tools/gen_espanol_heliodoro.py
"""
import json
import os
import sys

SLUG = "espanol-heliodoro-laberinto"


# ============================================================
# Fábricas de familia (una familia = un ítem escrito a mano)
# ============================================================
def doors(fid, skill, stem, options, answer, hint, explain, sub=None):
    """Mecánica B — opción con distractores, escena 'doors' del motor."""
    return {
        "id": fid,
        "skill": skill,
        "mech": "doors",
        "variants": [{
            "stem": stem,
            "sub": sub,
            "seq": None,
            "options": options,
            "answer": answer,
            "hint": hint,
            "explain": explain,
        }],
    }


def forge(fid, skill, stem, pieces, need, forbid, hint, explain, sub=None):
    """Mecánica C — construcción por piezas, escena 'forge' del motor
    (motor.js, añadida hoy como capacidad genérica, no como parche de
    esta materia). `pieces` es [(texto, categoria), ...]. `need` es
    [(categoria, minimo), ...]. `forbid` es [categoria, ...] o None."""
    return {
        "id": fid,
        "skill": skill,
        "mech": "forge",
        "variants": [{
            "stem": stem,
            "sub": sub,
            "seq": None,
            "options": ["Todavía no cumple la regla", "Cumple la regla"],
            "answer": 1,
            "pieces": [{"text": t, "cat": c} for t, c in pieces],
            "rule": {
                "need": [{"cat": c, "min": m} for c, m in need],
                "forbid": forbid or [],
            },
            "hint": hint,
            "explain": explain,
        }],
    }


# ============================================================
# NIVEL 1 — La Voz que Cuenta (Narrador)
# ============================================================
L1_BRIEF = [
    "<p>Bienvenido al Archivo. Antes de resolver nada, necesitas distinguir <b>quién cuenta</b> la historia.</p>",
    "<div class='example'>\"Empujé la puerta con las dos manos.\" &rarr; lo cuenta un personaje, en primera persona.<br>"
    "\"Tirso empujó la puerta con las dos manos.\" &rarr; lo cuenta alguien de afuera, en tercera persona.</div>",
    "<ul><li><b>Narrador protagonista:</b> cuenta en primera persona y la historia es la suya.</li>"
    "<li><b>Narrador testigo:</b> cuenta en primera persona, pero la historia es de otro personaje.</li>"
    "<li><b>Narrador omnisciente:</b> cuenta en tercera persona y sabe cosas que ningún personaje sabe todavía.</li></ul>",
    "<p>La trampa más común: pensar que toda primera persona es protagonista. No es así — fíjate de QUIÉN es la historia, no solo quién habla.</p>",
    "<p class='text-dim'>Misión: 12 retos. Si fallas uno, vuelve más tarde.</p>",
]

L1 = [
    doors("L1F1", "narrador-omnisciente",
          "¿Quién cuenta esta historia?<br><i>\"Tirso llegó al Archivo cuando el reloj de la entrada marcaba las seis...\"</i>",
          ["Tirso, en primera persona", "Un narrador externo que observa todo (3ª persona omnisciente)",
           "El Guardián de Ecos", "La Bibliotecaria Mayor"], 1,
          "Busca si el texto dice \"yo\" o si habla de Tirso desde afuera, en tercera persona.",
          "Es un narrador externo en 3ª persona: nunca dice \"yo\", habla de Tirso desde afuera."),
    doors("L1F2", "narrador-omnisciente",
          "\"El narrador, que todo lo observa, sabía algo que Tirso todavía no imaginaba.\" ¿Por qué sabemos que es omnisciente?",
          ["Porque sabe algo que Tirso todavía no imagina", "Porque describe lo que Tirso siente",
           "Porque usa la palabra \"yo\"", "Porque el fragmento es corto"], 0,
          "Un narrador omnisciente sabe cosas que el propio personaje todavía no sabe.",
          "Sabe algo que ni el propio Tirso imagina todavía — eso es lo que distingue a un narrador omnisciente."),
    doors("L1F3", "tipo-de-narrador",
          "¿Quién es el narrador de este fragmento?<br><i>\"Yo no pedí ser el aprendiz de archivista, pero cuando la Bibliotecaria Mayor me puso en la mano el hilo de páginas rotas, no supe decir que no.\"</i>",
          ["Un narrador externo, en 3ª persona", "Tirso, contando su propia historia (narrador protagonista)",
           "La Bibliotecaria Mayor", "Ámbar"], 1,
          "Dice \"yo\" y la historia que cuenta es la suya propia.",
          "Habla en primera persona y la aventura es la suya: es un narrador protagonista."),
    doors("L1F4", "narrador-no-es-protagonista",
          "Este narrador habla en primera persona. ¿Eso lo convierte automáticamente en el protagonista?",
          ["Sí, toda primera persona es protagonista", "No siempre — aquí sí lo es porque la historia trata de lo que a él le pasa",
           "No, la primera persona nunca puede ser protagonista", "Solo si el personaje tiene nombre"], 1,
          "Primera persona no es sinónimo de protagonista: depende de si la historia es SUYA.",
          "Aquí sí es protagonista porque la historia trata de lo que le pasa a él, no porque diga \"yo\"."),
    doors("L1F5", "tipo-de-narrador",
          "¿Quién narra este fragmento?<br><i>\"Yo estaba apoyada en la puerta de la Torre de Vitrales cuando vi a Tirso entrar sin pedir permiso.\"</i>",
          ["Tirso, el protagonista", "El Guardián de Ecos",
           "Ámbar, un personaje secundario que fue testigo (narrador testigo)", "Un narrador externo en 3ª persona"], 2,
          "Habla en primera persona, pero la historia es sobre lo que hizo OTRO personaje.",
          "Ámbar cuenta en primera persona algo que le pasó a Tirso, no a ella: es un narrador testigo."),
    doors("L1F6", "narrador-no-es-protagonista",
          "Ámbar habla en primera persona (\"yo estaba apoyada...\"). ¿Por qué no es la protagonista de la historia?",
          ["Porque solo los hombres pueden ser protagonistas", "Porque la historia trata de lo que le pasa a Tirso, no a ella",
           "Porque no aparece en todo el fragmento", "Porque no tiene nombre propio"], 1,
          "Pregúntate de quién es la aventura, no quién la cuenta.",
          "La aventura es de Tirso. Ámbar solo la cuenta desde afuera: eso la hace testigo, no protagonista."),
    doors("L1F7", "tipo-de-narrador",
          "¿Qué tipo de narrador cuenta este fragmento?<br><i>\"Tres años antes de que Tirso llegara al Archivo, la Torre de Vitrales se había quedado a oscuras...\"</i>",
          ["Un narrador externo en 3ª persona que observa a Tirso", "Tirso en primera persona",
           "Un narrador que es personaje de la historia", "No tiene narrador, son solo hechos"], 0,
          "Ningún personaje dice \"yo\" en este fragmento.",
          "Cuenta desde afuera, sin ser ningún personaje de la historia: es un narrador externo en 3ª persona."),
    doors("L1F8", "tipo-de-narrador",
          "¿Qué tipo de narrador es el de este pasaje?<br><i>\"...El Archivo, que llevaba siglos observando en silencio, supo entonces que había encontrado, por fin, a quien buscaba.\"</i>",
          ["Tirso, narrando su propia aventura", "El Guardián de Ecos",
           "Un narrador testigo, personaje secundario", "Un narrador externo en 3ª persona (dice \"El Archivo... supo\")"], 3,
          "\"El Archivo... supo\" no es ningún personaje hablando en primera persona.",
          "Habla de \"El Archivo\" en tercera persona y sabe cosas que ningún personaje sabe: es omnisciente."),
    doors("L1F9", "tipo-de-narrador",
          "\"Tirso llevaba una semana en el Archivo cuando el Bibliotecario Mayor le entregó su primera tarea. Fue así como empezó todo.\" ¿Este narrador es protagonista o externo?",
          ["Protagonista, en 1ª persona", "Externo, en 3ª persona",
           "Testigo, en 1ª persona", "No se puede saber"], 1,
          "Busca la palabra \"yo\": si no aparece, no es primera persona.",
          "Habla de Tirso en tercera persona, sin decir \"yo\" en ningún momento: es un narrador externo."),
    doors("L1F10", "testigo-vs-protagonista",
          "\"Vi cómo el Bibliotecario Mayor le entregaba a Tirso la primera llave. Yo nunca había recibido una así.\" ¿Qué tipo de narrador es?",
          ["Protagonista — la historia trata de él", "Testigo — cuenta en primera persona algo que le pasó a otro personaje",
           "Omnisciente — sabe todo sobre todos", "No hay narrador"], 1,
          "Fíjate de QUIÉN es el momento importante: ¿de quien habla, o de quien narra?",
          "Cuenta en primera persona, pero lo importante le pasa a Tirso, no a quien narra: es testigo."),
    doors("L1F11", "testigo-vs-protagonista",
          "\"Sentí que el pasillo se movía bajo mis pies, aunque nadie más lo notó.\" ¿Qué tipo de narrador es, y por qué?",
          ["Protagonista — la aventura es la suya y la cuenta en primera persona", "Testigo — solo observa a otro personaje",
           "Omnisciente — porque sabe lo que \"nadie más notó\"", "No se puede determinar"], 0,
          "Aquí lo que pasa, le pasa directamente a quien narra.",
          "Lo que se cuenta le pasa a quien narra, en primera persona: es un narrador protagonista."),
    doors("L1F12", "narrador-omnisciente",
          "\"El Archivo guardaba secretos que ni Tirso ni el Guardián conocían todavía.\" ¿Qué tipo de narrador es?",
          ["Omnisciente — sabe cosas que ningún personaje sabe aún", "Protagonista — el Archivo es quien narra",
           "Testigo — alguien que vio la escena", "No tiene narrador"], 0,
          "¿Algún personaje sabe lo que dice esta frase? Si ninguno lo sabe, alguien de afuera lo sabe por ellos.",
          "Sabe secretos que ni Tirso ni el Guardián conocen todavía: solo un narrador omnisciente sabe eso."),
]

# ============================================================
# NIVEL 2 — El Elenco (Personajes)
# ============================================================
L2_BRIEF = [
    "<p>Un personaje se conoce de dos formas: porque el narrador lo dice, o porque tú lo deduces de lo que hace.</p>",
    "<div class='example'>\"Era valiente.\" &rarr; caracterización <b>directa</b> (te lo dicen).<br>"
    "\"Entró primero al túnel sin dudar.\" &rarr; caracterización <b>indirecta</b> (lo deduces de una acción).</div>",
    "<ul><li><b>Antagonista</b> = se opone a lo que el protagonista quiere. No es sinónimo de \"malo\".</li>"
    "<li><b>Secundario</b> = acompaña o presencia la historia, pero la historia no es sobre él.</li></ul>",
    "<p>Trampa frecuente: pensar que el antagonista siempre tiene que ser un villano. A veces solo defiende algo distinto.</p>",
    "<p class='text-dim'>Misión: 12 retos.</p>",
]

L2 = [
    doors("L2F1", "caracterizacion-indirecta",
          "\"Empujó la puerta... y no se detuvo a pensarlo dos veces.\" ¿Qué tipo de caracterización es esta?",
          ["Directa — el narrador lo dice explícitamente", "Indirecta — se infiere de la acción, no lo dice el narrador",
           "No es caracterización", "Es una descripción del lugar, no del personaje"], 1,
          "El narrador no dice ningún adjetivo de personalidad aquí: solo cuenta una acción.",
          "Nadie dice \"era valiente\": se deduce de que actuó sin dudar. Eso es indirecta."),
    doors("L2F2", "caracterizacion-indirecta",
          "\"No supe decir que no.\" ¿Qué rasgo de Tirso se infiere aquí, y de qué tipo de caracterización se trata?",
          ["Es valiente; caracterización directa", "Es dócil o le cuesta negarse; caracterización indirecta",
           "Es antipático; caracterización directa", "No se puede inferir ningún rasgo"], 1,
          "Nadie usa un adjetivo aquí: hay que deducirlo de lo que Tirso hace.",
          "Se deduce que le cuesta negarse, sin que nadie lo diga con un adjetivo: es indirecta."),
    doors("L2F3", "caracterizacion-indirecta",
          "\"Yo me quedé callada, como siempre.\" ¿Qué tipo de caracterización es, y de quién?",
          ["Directa, de Tirso", "Indirecta, de Ámbar — se infiere que es reservada",
           "Indirecta, del Guardián", "Directa, de Ámbar"], 1,
          "¿Quién habla en esta frase? Ese es el personaje que se está caracterizando.",
          "Es Ámbar hablando de sí misma; se infiere que es reservada, sin que lo diga con un adjetivo."),
    doors("L2F4", "caracterizacion-directa",
          "\"El Guardián de Ecos no odiaba a los aprendices. Odiaba el desorden.\" ¿Qué tipo de caracterización es esta frase?",
          ["Directa — el narrador lo afirma sin rodeos", "Indirecta — se infiere de una acción",
           "No es caracterización, es narración de hechos", "Es descripción del lugar"], 0,
          "El narrador está diciendo, con todas las letras, lo que el Guardián odia y no odia.",
          "El narrador lo afirma directamente, sin que haga falta deducir nada de una acción."),
    doors("L2F5", "antagonista-no-es-malo",
          "¿El Guardián de Ecos es el antagonista de Tirso porque...?",
          ["Es un personaje malvado que quiere hacerle daño", "Se opone a lo que Tirso quiere (entrar antes de tiempo), no porque sea malo",
           "Nunca aparece cerca de Tirso", "Es el mejor amigo de Tirso"], 1,
          "Antagonista no significa \"villano\": significa que quiere algo distinto al protagonista.",
          "Se opone al objetivo de Tirso, pero no le desea ningún mal: eso ya lo hace antagonista."),
    doors("L2F6", "antagonista-no-es-malo",
          "Si el Guardián no es malo, ¿puede seguir siendo el antagonista de la historia?",
          ["No, un antagonista siempre tiene que ser malo", "Sí — antagonista es quien se opone al objetivo del protagonista, no un sinónimo de villano",
           "No, solo puede haber un antagonista por libro", "Sí, pero solo si grita o amenaza"], 1,
          "Piensa en alguien que se opone a ti sin ser tu enemigo.",
          "Antagonista describe una función en la historia (oponerse), no una cualidad moral."),
    doors("L2F7", "personaje-secundario",
          "En este fragmento, ¿quién es el personaje secundario?<br><i>(Ámbar observa a Tirso pedirle paso al Guardián.)</i>",
          ["Tirso", "Ámbar — observa la escena pero la historia no trata de ella",
           "El Guardián de Ecos", "No hay personaje secundario"], 1,
          "El secundario está presente, pero la escena no gira en torno a él.",
          "Ámbar está ahí, pero la escena es entre Tirso y el Guardián: ella es secundaria."),
    doors("L2F8", "caracterizacion-indirecta",
          "\"La Bibliotecaria Mayor nunca alzaba la voz, pero cuando hablaba, todo el Archivo se quedaba en silencio.\" ¿Qué tipo de caracterización es?",
          ["Directa — dice explícitamente que es autoritaria", "Indirecta — se infiere su autoridad del efecto que causa",
           "No es un personaje, es un lugar", "Es antagonista de Tirso"], 1,
          "Nadie dice la palabra \"autoritaria\": se ve por el efecto que causa en los demás.",
          "Su autoridad se deduce del efecto que causa, no porque el narrador la nombre así."),
    doors("L2F9", "caracterizacion-directa",
          "\"Ámbar era curiosa: siempre quería saber qué había detrás de cada puerta.\" ¿Qué tipo de caracterización es?",
          ["Directa — el narrador lo afirma con la palabra \"curiosa\"", "Indirecta — se infiere de una acción sin nombrarlo",
           "No es caracterización", "Es una descripción del espacio"], 0,
          "Busca si hay un adjetivo de personalidad dicho de frente.",
          "El narrador usa la palabra \"curiosa\" directamente: no hace falta deducir nada."),
    doors("L2F10", "antagonista-no-es-malo",
          "\"Un aprendiz nuevo llegó pisando fuerte, exigiendo que le abrieran la Bóveda antes que a nadie.\" ¿Este personaje podría ser antagonista de Tirso?",
          ["No, porque no es malvado", "Sí, si se opone a lo que Tirso quiere lograr, aunque no sea \"malo\"",
           "No, porque no tiene nombre", "Solo si aparece en más de un capítulo"], 1,
          "Recuerda: antagonista es sobre oponerse a un objetivo, no sobre ser villano.",
          "Si compite por lo mismo que Tirso quiere, ya cumple la función de antagonista."),
    doors("L2F11", "caracterizacion-indirecta",
          "\"El Guardián guardaba, sin decírselo a nadie, la primera página que había cosido en su vida.\" ¿Qué revela esta acción sobre el Guardián?",
          ["Directamente, que es sentimental (el narrador lo dice así)", "Indirectamente, que le importan las historias más de lo que muestra",
           "Nada, es solo un detalle del lugar", "Que es el protagonista de la historia"], 1,
          "El narrador no usa ningún adjetivo aquí: solo cuenta lo que el Guardián guarda en secreto.",
          "Se infiere de una acción secreta, no de un adjetivo dicho de frente: es indirecta."),
    doors("L2F12", "caracterizacion-indirecta",
          "En el pasaje final, cuando el Guardián \"por primera vez, le abrió paso\" a Tirso, ¿qué tipo de caracterización es?",
          ["Directa — el narrador dice que el Guardián cambió de opinión", "Indirecta — se infiere un cambio en el Guardián a partir de su acción",
           "No hay caracterización en esta frase", "Es una descripción del lugar"], 1,
          "El narrador no explica el cambio con palabras: solo muestra una acción distinta a la de siempre.",
          "El cambio se deduce de la acción (abrirle paso), no porque el narrador lo explique."),
]

# ============================================================
# NIVEL 3 — Mapa y Reloj (Tiempo y espacio)
# ============================================================
L3_BRIEF = [
    "<p>Toda historia pasa en un <b>lugar</b> (espacio) y en un <b>momento</b> (tiempo). No son lo mismo.</p>",
    "<div class='example'>\"La Torre de Vitrales, con su escalera de caracol\" &rarr; espacio (un lugar concreto).<br>"
    "\"El frío de esa noche antigua\" &rarr; ambiente, no un lugar.<br>"
    "\"Tres años antes... Ahora...\" &rarr; tiempo, con un salto.</div>",
    "<ul><li>El <b>espacio</b> se puede señalar con el dedo. El <b>ambiente</b>, no.</li>"
    "<li>El <b>tiempo</b> puede dar saltos: contar algo del pasado desde el presente.</li></ul>",
    "<p class='text-dim'>Misión: 12 retos.</p>",
]

L3 = [
    doors("L3F1", "espacio",
          "¿Cuál es el espacio (lugar) de este fragmento?<br><i>\"...mientras Tirso subía la escalera de caracol de la Torre de Vitrales...\"</i>",
          ["La Torre de Vitrales y su escalera de caracol", "El frío que siente Tirso",
           "Hace tres años", "La luz azul"], 0,
          "El espacio es lo que se puede señalar con el dedo: un lugar concreto.",
          "Es el único lugar concreto y físico mencionado: los demás son tiempo o ambiente."),
    doors("L3F2", "tiempo",
          "¿Cuál es el tiempo de este fragmento?<br><i>\"Tres años antes de que Tirso llegara al Archivo... Ahora, mientras Tirso subía...\"</i>",
          ["La Torre de Vitrales", "Ahora (mientras Tirso sube) y una referencia a tres años antes",
           "Las paredes de piedra", "El techo de vidrio"], 1,
          "Busca las palabras que marcan cuándo pasa cada cosa.",
          "\"Tres años antes\" y \"ahora\" son las marcas de tiempo: hay dos momentos distintos."),
    doors("L3F3", "ambiente-vs-espacio",
          "\"El frío de esa noche antigua\" y \"una luz azul\" son palabras de...",
          ["Espacio, porque nombran algo físico", "Ambiente/atmósfera, no un lugar concreto",
           "Personajes", "Estructura"], 1,
          "¿Se puede señalar el frío con el dedo? El espacio sí se puede señalar; el ambiente, no.",
          "Describen una sensación, no un lugar que se pueda señalar: son ambiente."),
    doors("L3F4", "espacio",
          "¿Cuál es el espacio concreto de esta viñeta?<br><i>\"La Sala de las Puertas tenía cien puertas de madera oscura alineadas contra la pared curva.\"</i>",
          ["La Sala de las Puertas, con sus cien puertas de madera", "\"El aire pesaba\"",
           "\"Algo antiguo\"", "No tiene espacio definido"], 0,
          "El espacio es el lugar físico que se describe con detalle.",
          "Es el único lugar físico descrito con detalle: sala, puertas, pared."),
    doors("L3F5", "ambiente-vs-espacio",
          "\"El aire pesaba, como si algo muy antiguo respirara despacio.\" ¿Esto describe el espacio o el ambiente?",
          ["El espacio — es el lugar exacto donde ocurre todo", "El ambiente — la sensación del lugar, no el lugar en sí",
           "El tiempo de la historia", "Un personaje"], 1,
          "Esta frase no nombra ningún lugar concreto, solo una sensación.",
          "Describe una sensación en el aire, no un lugar que se pueda señalar: es ambiente."),
    doors("L3F6", "tiempo-salto",
          "\"Antes de que el reloj marcara las seis... Ahora, de pie frente a la puerta...\" ¿Qué recurso de tiempo usa este fragmento?",
          ["Un salto breve — cuenta primero lo anterior y luego el presente", "No hay ningún salto de tiempo",
           "Es solo espacio, no tiempo", "Es un ejemplo de estructura, no de tiempo"], 0,
          "Fíjate en las palabras \"antes\" y \"ahora\": marcan dos momentos distintos.",
          "Pasa de \"antes\" a \"ahora\": es un pequeño salto de tiempo, no un lugar."),
    doors("L3F7", "tiempo",
          "\"Tres inviernos atrás, el Guardián perdió la llave de la Bóveda. Hoy, Tirso la busca sin saberlo.\" ¿Cuántos momentos de tiempo distintos hay?",
          ["Solo uno, porque es la misma historia", "Dos — el pasado (tres inviernos atrás) y el presente (hoy)",
           "Ninguno, no se menciona tiempo", "Tres, uno por cada personaje"], 1,
          "Cuenta las marcas de tiempo en la frase: \"tres inviernos atrás\" y \"hoy\".",
          "Hay dos marcas claras de tiempo: el pasado y el presente."),
    doors("L3F8", "espacio",
          "\"El Pasillo de los Ecos, con sus paredes cubiertas de páginas colgantes, olía a humedad.\" ¿Qué es el espacio aquí, exactamente?",
          ["El Pasillo de los Ecos, con paredes de páginas colgantes", "El olor a humedad",
           "Lo que siente el personaje", "El tiempo del día"], 0,
          "El espacio es el lugar en sí, no lo que se siente en él.",
          "Es el lugar físico nombrado; el olor es un detalle del ambiente, no el espacio."),
    doors("L3F9", "tiempo",
          "\"De noche, el Archivo cambia de forma; de día, vuelve a ser el mismo de siempre.\" ¿Qué distingue esta frase, tiempo o espacio?",
          ["Tiempo — distingue dos momentos (de noche / de día)", "Espacio — describe dos lugares distintos",
           "Personajes", "Estructura"], 0,
          "\"De noche\" y \"de día\" son marcas de cuándo, no de dónde.",
          "Distingue dos momentos del día, no dos lugares: es tiempo."),
    doors("L3F10", "espacio",
          "¿En qué espacio ocurre \"La cuerda floja\"?",
          ["El Pasillo de los Ecos", "La Bóveda de Historias",
           "La Sala de las Puertas", "No se menciona un espacio"], 0,
          "El fragmento nombra el pasillo desde la primera línea.",
          "Todo el fragmento ocurre en el Pasillo de los Ecos, desde la primera línea."),
    doors("L3F11", "tiempo-salto",
          "Tirso \"recién entonces contó cómo había llegado hasta ahí\". ¿Qué está pasando con el tiempo en ese momento?",
          ["Es un error, no puede pasar", "Se cuenta algo del pasado (cómo llegó) desde el presente de la escena",
           "Es un cambio de espacio, no de tiempo", "Es una descripción de un personaje"], 1,
          "Contar algo que ya pasó, desde el momento presente, es un pequeño salto de tiempo.",
          "Cuenta un hecho pasado desde el presente de la escena: es un salto de tiempo, no un error."),
    doors("L3F12", "espacio",
          "\"Un ambiente pesado y silencioso llenaba la sala\" frente a \"la Bóveda de Historias, con sus estantes de piedra\". ¿Cuál de las dos frases describe el espacio?",
          ["\"Un ambiente pesado y silencioso\"", "\"La Bóveda de Historias, con sus estantes de piedra\"",
           "Las dos describen el espacio por igual", "Ninguna de las dos"], 1,
          "El espacio se puede señalar con el dedo; el ambiente, no.",
          "Nombra un lugar concreto con detalles físicos (estantes de piedra): eso es espacio."),
]

# ============================================================
# NIVEL 4 — Los Tres Pasillos (Estructura)
# ============================================================
L4_BRIEF = [
    "<p>Toda historia tiene tres partes: <b>planteamiento</b> (se presenta la situación), <b>nudo</b> (el conflicto se complica) y <b>desenlace</b> (se resuelve).</p>",
    "<div class='example'>Planteamiento: \"Tirso encontró la cuerda rota.\"<br>"
    "Nudo: \"Ató la cuerda con el primer nudo que se le ocurrió, sosteniendo el peso.\"<br>"
    "Desenlace: \"Cuando por fin la cuerda quedó firme...\"</div>",
    "<ul><li>El desenlace no es \"lo último que pasa\": tiene que <b>resolver</b> el conflicto.</li>"
    "<li>A veces el conflicto ya está presente desde el primer párrafo: eso ya es nudo, no planteamiento.</li></ul>",
    "<p class='text-dim'>Misión: 12 retos.</p>",
]

L4 = [
    doors("L4F1", "planteamiento",
          "\"Tirso llevaba una semana en el Archivo cuando el Bibliotecario Mayor le entregó su primera tarea. Fue así como empezó todo.\" ¿Qué parte de la estructura es este fragmento?",
          ["Planteamiento — presenta a Tirso y su tarea", "Nudo — ya hay un conflicto grave",
           "Desenlace — resuelve algo", "No tiene estructura"], 0,
          "Presenta la situación inicial, sin conflicto todavía.",
          "Presenta a Tirso y su tarea, sin ningún conflicto todavía: es el planteamiento."),
    doors("L4F2", "nudo-temprano",
          "El primer párrafo de \"La cuerda floja\" ya presenta la cuerda rota y el pasillo a punto de caer. ¿Esto es planteamiento o nudo?",
          ["Planteamiento — solo presenta el lugar", "Nudo — el conflicto ya está presente desde el inicio, no es solo presentación",
           "Desenlace — ya se resolvió el problema", "No es parte de la estructura"], 1,
          "Si ya hay un problema urgente desde la primera línea, ya pasamos del planteamiento.",
          "El conflicto (la cuerda rota) ya está ahí desde el inicio: eso es nudo, no planteamiento."),
    doors("L4F3", "nudo",
          "¿Qué parte de la estructura es el segundo párrafo de \"La cuerda floja\"?<br><i>(Tirso ata la cuerda sosteniendo el peso con la espalda.)</i>",
          ["Nudo/desarrollo — Tirso enfrenta el problema", "Planteamiento",
           "Desenlace", "Ninguna, es solo descripción"], 0,
          "Es el momento en que se enfrenta el conflicto, no en que se presenta ni se resuelve.",
          "Tirso está enfrentando el problema activamente: eso es el desarrollo del nudo."),
    doors("L4F4", "desenlace",
          "¿Qué parte de la estructura es el tercer párrafo de \"La cuerda floja\"?<br><i>(La cuerda queda firme y Tirso cuenta cómo llegó ahí.)</i>",
          ["Desenlace — el problema queda resuelto (la cuerda firme)", "Planteamiento",
           "Nudo", "No hay desenlace en este fragmento"], 0,
          "El conflicto (la cuerda rota) ya quedó resuelto en este párrafo.",
          "La cuerda queda firme: el conflicto se resolvió. Eso es el desenlace."),
    doors("L4F5", "desenlace-falso",
          "\"Y entonces Tirso se fue a dormir, cansado, sin haber encontrado el origen del ruido.\" ¿Esto es un desenlace bien formado?",
          ["Sí, cualquier final de un fragmento es un desenlace", "No — termina la escena pero no resuelve el conflicto",
           "Sí, porque Tirso ya se fue a dormir tranquilo", "No se puede saber sin más información"], 1,
          "Pregúntate: ¿el problema (el ruido) quedó resuelto, o solo terminó la escena?",
          "El ruido sigue sin explicarse: la escena termina, pero el conflicto no se resuelve."),
    doors("L4F6", "planteamiento",
          "\"Un día, Tirso encontró una puerta que nadie más podía ver. Esa fue la primera señal de que algo iba a cambiar.\" ¿Qué parte de la estructura es?",
          ["Planteamiento — presenta la situación inicial", "Nudo",
           "Desenlace", "No tiene estructura"], 0,
          "Es el inicio de algo, todavía sin conflicto desarrollado.",
          "Presenta una situación nueva, apenas empieza a insinuarse el conflicto: es planteamiento."),
    doors("L4F7", "desenlace",
          "\"Al final, el Guardián le entregó la llave a Tirso, y el Archivo dejó de temblar.\" ¿Qué parte de la estructura es?",
          ["Desenlace — resuelve el conflicto planteado", "Planteamiento",
           "Nudo", "Ninguna"], 0,
          "El conflicto (el Archivo temblando) se resuelve aquí.",
          "El conflicto (el temblor del Archivo) se resuelve: es el desenlace."),
    doors("L4F8", "nudo",
          "\"Justo cuando Tirso creyó que todo estaba resuelto, la Torre de Vitrales volvió a quedar a oscuras.\" ¿Qué señala esta frase sobre la estructura?",
          ["Que ya llegamos al desenlace", "Que el nudo puede reaparecer o complicarse más antes del desenlace real",
           "Que es el planteamiento de una historia nueva", "Que no hay estructura en este fragmento"], 1,
          "Si el problema vuelve a complicarse, todavía no llegamos al desenlace real.",
          "El conflicto se complica de nuevo: el desenlace todavía no llegó."),
    doors("L4F9", "desenlace-falso",
          "Un compañero dice: \"El desenlace es simplemente lo último que se cuenta.\" ¿Es correcto?",
          ["Sí, siempre es correcto", "No — el desenlace tiene que resolver el conflicto, no solo ser lo último",
           "Solo es correcto en cuentos largos", "Solo es correcto si el protagonista gana"], 1,
          "Lo último que se cuenta puede dejar el conflicto sin resolver: eso no basta.",
          "Un final que no resuelve nada no es un desenlace, aunque sea lo último del texto."),
    doors("L4F10", "planteamiento",
          "\"Tirso llegó, vio la puerta rota, y sin pensarlo, entró.\" ¿Qué parte de la estructura presenta esta frase?",
          ["Planteamiento — presenta la situación que inicia la historia", "Desenlace",
           "Nudo avanzado", "No tiene estructura"], 0,
          "Es el momento en que arranca la acción, sin conflicto desarrollado todavía.",
          "Es el arranque de la acción: todavía no hay un conflicto desarrollado, es planteamiento."),
    doors("L4F11", "desenlace",
          "En el pasaje \"El día en que el Archivo eligió a Tirso\", ¿qué parte de la estructura es el último párrafo?",
          ["Desenlace — Tirso encuentra la puerta y el Archivo \"supo que había encontrado a quien buscaba\"", "Planteamiento",
           "Nudo", "No tiene desenlace, la historia sigue abierta"], 0,
          "Busca si el conflicto (encontrar la puerta) se resuelve en este párrafo.",
          "Tirso encuentra lo que buscaba: el conflicto del pasaje se resuelve ahí."),
    doors("L4F12", "nudo",
          "¿Qué parte de la estructura son los dos primeros párrafos de ese mismo pasaje (el diálogo con el Guardián)?",
          ["Nudo — el conflicto (Tirso necesita entrar, el Guardián decide)", "Planteamiento puro, sin conflicto",
           "Desenlace", "Ninguna de las anteriores"], 0,
          "Hay un conflicto activo: Tirso quiere pasar y el Guardián decide si lo deja.",
          "Tirso quiere entrar y el Guardián debe decidir: ese tira y afloja es el nudo."),
]

# ============================================================
# NIVEL 5 — El Taller de Vitrales (Descripción) — mecánica forge
# ============================================================
L5_BRIEF = [
    "<p>Describir bien no es poner muchos adjetivos: es elegir palabras <b>precisas</b> y comparar.</p>",
    "<div class='example'>\"Era bonito y grande.\" &rarr; vago, no describe nada de verdad.<br>"
    "\"Las paredes de piedra fría subían más alto que los árboles del patio.\" &rarr; preciso, con comparación.</div>",
    "<ul><li>Arrastra o toca las piezas para armar tu descripción. Puedes quitar una pieza tocándola otra vez.</li>"
    "<li>Usa al menos un adjetivo <b>preciso</b> (no uno vago) y completa una <b>comparación</b>.</li></ul>",
    "<p class='text-dim'>Misión: 10 retos de construcción.</p>",
]

L5 = [
    forge("L5F1", "descripcion",
          "Describe la puerta del primer pasillo.",
          [("bonita", "vago"), ("grande", "vago"), ("fea", "vago"), ("buena", "vago"),
           ("pesada", "preciso"), ("astillada", "preciso"), ("tallada", "preciso"), ("antigua", "preciso"),
           ("tan", "comparador"), ("más", "comparador"),
           ("como una montaña", "sustantivo"), ("que un roble centenario", "sustantivo")],
          [("preciso", 1), ("comparador", 1), ("sustantivo", 1)], ["vago"],
          "Evita \"bonita\" o \"grande\": elige una pieza precisa y completa la comparación.",
          "Una buena descripción combina un adjetivo preciso con una comparación completa, nunca solo adjetivos vagos."),
    forge("L5F2", "descripcion",
          "Describe la mirada del Guardián de Ecos.",
          [("buena", "vago"), ("mala", "vago"), ("rara", "vago"),
           ("firme", "preciso"), ("cansada", "preciso"), ("inquebrantable", "preciso"),
           ("tan", "comparador"),
           ("como una puerta cerrada", "sustantivo"), ("como el metal", "sustantivo")],
          [("preciso", 1), ("comparador", 1), ("sustantivo", 1)], ["vago"],
          "Un adjetivo preciso más una comparación con \"tan... como\" arman la descripción.",
          "Un adjetivo preciso y una comparación completa describen mejor que un adjetivo vago."),
    forge("L5F3", "descripcion",
          "Describe la Torre de Vitrales.",
          [("linda", "vago"), ("fea", "vago"),
           ("imponente", "preciso"), ("fría", "preciso"), ("silenciosa", "preciso"),
           ("más", "comparador"),
           ("que cualquier otra torre del Archivo", "sustantivo"), ("que el cielo mismo", "sustantivo")],
          [("preciso", 1), ("comparador", 1), ("sustantivo", 1)], ["vago"],
          "Elige un adjetivo preciso y completa la comparación con \"más... que\".",
          "\"Imponente\" o \"silenciosa\" describen más que \"linda\", sobre todo con una comparación."),
    forge("L5F4", "descripcion",
          "Describe cómo olía y sonaba el pasillo de páginas colgantes.",
          [("rico", "vago"), ("feo", "vago"),
           ("húmedo", "preciso"), ("viejo", "preciso"), ("polvoriento", "preciso"),
           ("como", "comparador"),
           ("un libro olvidado", "sustantivo"), ("hojas secas al pisarlas", "sustantivo")],
          [("preciso", 1), ("comparador", 1), ("sustantivo", 1)], ["vago"],
          "Usa un adjetivo preciso de olor o textura, y un símil con \"como\".",
          "\"Húmedo\" o \"polvoriento\" describen mejor que \"feo\", y el símil da una imagen concreta."),
    forge("L5F5", "descripcion",
          "Describe los estantes de la Bóveda de Historias.",
          [("grandes", "vago"), ("bonitos", "vago"),
           ("curvos", "preciso"), ("agrietados", "preciso"), ("ancestrales", "preciso"),
           ("tan", "comparador"),
           ("como raíces de un árbol viejo", "sustantivo"), ("como huesos de piedra", "sustantivo")],
          [("preciso", 1), ("comparador", 1), ("sustantivo", 1)], ["vago"],
          "Un adjetivo preciso más una comparación describen mejor que \"grandes\" o \"bonitos\".",
          "\"Agrietados\" o \"ancestrales\" con una comparación dan una imagen mucho más clara."),
    forge("L5F6", "descripcion",
          "Describe el ruido misterioso que Tirso escuchó.",
          [("raro", "vago"), ("feo", "vago"),
           ("grave", "preciso"), ("sordo", "preciso"), ("quebrado", "preciso"),
           ("más", "comparador"),
           ("que un trueno lejano", "sustantivo"), ("que cualquier otro sonido del Archivo", "sustantivo")],
          [("preciso", 1), ("comparador", 1), ("sustantivo", 1)], ["vago"],
          "Elige un adjetivo de sonido preciso y compáralo con algo conocido.",
          "\"Grave\" o \"sordo\" describen el sonido con precisión; \"raro\" no dice casi nada."),
    forge("L5F7", "descripcion",
          "Describe el frío que Tirso sintió en la Torre.",
          [("malo", "vago"), ("incómodo", "vago"),
           ("húmedo", "preciso"), ("filoso", "preciso"), ("antiguo", "preciso"),
           ("como si", "comparador"),
           ("una noche entera viviera en esas piedras", "sustantivo"), ("el invierno nunca se hubiera ido", "sustantivo")],
          [("preciso", 1), ("comparador", 1), ("sustantivo", 1)], ["vago"],
          "\"Filoso\" o \"húmedo\" describen mejor un frío que \"malo\".",
          "Un adjetivo preciso más una cláusula comparativa con \"como si\" arman una buena descripción."),
    forge("L5F8", "descripcion",
          "Describe el polvo de las páginas en el Pasillo de los Ecos.",
          [("feo", "vago"), ("molesto", "vago"),
           ("denso", "preciso"), ("dorado", "preciso"),
           ("como", "comparador"),
           ("una niebla lenta", "sustantivo"), ("ceniza de un fuego viejo", "sustantivo")],
          [("preciso", 1), ("comparador", 1), ("sustantivo", 1)], ["vago"],
          "Un adjetivo de color o textura, más un símil con \"como\".",
          "\"Denso\" o \"dorado\" describen el polvo mejor que \"feo\" o \"molesto\"."),
    forge("L5F9", "descripcion",
          "Describe la luz azul que entraba por el techo de vidrio.",
          [("linda", "vago"), ("rara", "vago"),
           ("tenue", "preciso"), ("fría", "preciso"), ("azulada", "preciso"),
           ("tan", "comparador"),
           ("como el fondo de un lago", "sustantivo"), ("como el cielo antes de la tormenta", "sustantivo")],
          [("preciso", 1), ("comparador", 1), ("sustantivo", 1)], ["vago"],
          "Un adjetivo preciso de luz o color, más una comparación con \"tan... como\".",
          "\"Tenue\" o \"azulada\" describen la luz con precisión, mejor que \"linda\"."),
    forge("L5F10", "descripcion",
          "Describe el patio del Archivo.",
          [("bonito", "vago"), ("tranquilo", "vago"),
           ("desierto", "preciso"), ("silencioso", "preciso"), ("empedrado", "preciso"),
           ("tan", "comparador"), ("más", "comparador"),
           ("como una plaza abandonada", "sustantivo"), ("que cualquier sala del Archivo", "sustantivo")],
          [("preciso", 1), ("comparador", 1), ("sustantivo", 1)], ["vago"],
          "Elige un adjetivo preciso del patio y completa una comparación.",
          "\"Empedrado\" o \"desierto\" describen el patio con precisión, y la comparación lo hace vívido."),
]

# ============================================================
# NIVEL 6 — La Sala de Ecos (Diálogo) — mecánica forge
# ============================================================
L6_BRIEF = [
    "<p>En español, cada intervención de un diálogo empieza con <b>raya (—)</b>, nunca con comillas.</p>",
    "<div class='example'>—Necesito pasar —dijo Tirso.<br>—Todavía no —respondió el Guardián.</div>",
    "<ul><li>Usa un <b>verbo dicendi</b> variado (preguntó, exclamó, susurró) en vez de repetir siempre \"dijo\".</li>"
    "<li>Va una <b>coma</b> antes del verbo que introduce quién habló.</li></ul>",
    "<p class='text-dim'>Misión: 10 retos de construcción.</p>",
]

L6 = [
    forge("L6F1", "dialogo",
          "Arma correctamente: Tirso le pide paso al Guardián. Línea: \"Necesito pasar.\"",
          [("—", "raya"), ("“comillas”", "comillas"),
           (", dijo", "verbo-dicendi"), (", pidió", "verbo-dicendi"), (", insistió", "verbo-dicendi"),
           ("Necesito pasar", "texto")],
          [("raya", 1), ("verbo-dicendi", 1), ("texto", 1)], ["comillas"],
          "En español el diálogo se marca con raya, no con comillas.",
          "La raya (—) marca el diálogo en español; las comillas no se usan para esto."),
    forge("L6F2", "dialogo",
          "Arma correctamente: el Guardián responde, cansado. Línea: \"Todavía no.\"",
          [("—", "raya"), ("“comillas”", "comillas"),
           (", respondió", "verbo-dicendi"), (", repitió", "verbo-dicendi"), (", murmuró", "verbo-dicendi"),
           ("Todavía no", "texto")],
          [("raya", 1), ("verbo-dicendi", 1), ("texto", 1)], ["comillas"],
          "Recuerda: raya al inicio, nunca comillas.",
          "La raya marca dónde empieza el diálogo; el verbo dicendi dice quién y cómo lo dijo."),
    forge("L6F3", "dialogo",
          "Arma correctamente: Ámbar hace una pregunta. Línea: \"¿Qué buscas aquí?\"",
          [("—", "raya"), ("“comillas”", "comillas"),
           (", preguntó", "verbo-dicendi-pregunta"), (", quiso saber", "verbo-dicendi-pregunta"),
           (", exclamó", "verbo-dicendi-otro"),
           ("¿Qué buscas aquí?", "texto")],
          [("raya", 1), ("verbo-dicendi-pregunta", 1), ("texto", 1)], ["comillas"],
          "Una pregunta necesita un verbo dicendi de pregunta, no de sorpresa.",
          "\"Preguntó\" o \"quiso saber\" encajan con una pregunta; \"exclamó\" no."),
    forge("L6F4", "dialogo",
          "Arma correctamente: Tirso susurra por miedo. Línea: \"Hay algo detrás de la puerta.\"",
          [("—", "raya"), ("“comillas”", "comillas"),
           (", susurró", "verbo-voz-baja"), (", murmuró", "verbo-voz-baja"),
           (", gritó", "verbo-voz-alta"),
           ("Hay algo detrás de la puerta", "texto")],
          [("raya", 1), ("verbo-voz-baja", 1), ("texto", 1)], ["comillas", "verbo-voz-alta"],
          "Susurrar es voz baja: el verbo dicendi tiene que ir con eso.",
          "\"Susurró\" o \"murmuró\" indican voz baja; \"gritó\" contradice la escena."),
    forge("L6F5", "dialogo",
          "Arma correctamente: el Guardián exclama, sorprendido. Línea: \"¡Otra vez tú!\"",
          [("—", "raya"), ("“comillas”", "comillas"),
           (", exclamó", "verbo-sorpresa"), (", gritó", "verbo-sorpresa"),
           (", preguntó", "verbo-pregunta"),
           ("¡Otra vez tú!", "texto")],
          [("raya", 1), ("verbo-sorpresa", 1), ("texto", 1)], ["comillas", "verbo-pregunta"],
          "Los signos de exclamación ya están puestos: el verbo dicendi debe ser de sorpresa o enojo.",
          "\"Exclamó\" o \"gritó\" combinan con la exclamación; \"preguntó\" no encaja."),
    forge("L6F6", "dialogo",
          "Arma el intercambio completo: Tirso pregunta, el Guardián responde.",
          [("—", "raya-1"), ("—", "raya-2"), ("“comillas”", "comillas"),
           (", preguntó", "verbo-1"), (", respondió", "verbo-2"), (", negó", "verbo-2"),
           ("¿Me dejas pasar?", "texto-1"), ("No", "texto-2")],
          [("raya-1", 1), ("raya-2", 1), ("verbo-1", 1), ("verbo-2", 1), ("texto-1", 1), ("texto-2", 1)], ["comillas"],
          "Cada intervención necesita su propia raya y su propio verbo dicendi.",
          "Dos intervenciones, dos rayas y dos verbos dicendi distintos: así se arma un intercambio."),
    forge("L6F7", "dialogo",
          "Arma correctamente: la Bibliotecaria Mayor da una instrucción. Línea: \"Ve a la Torre antes del anochecer.\"",
          [("—", "raya"), ("“comillas”", "comillas"),
           (", ordenó", "verbo-instruccion"), (", indicó", "verbo-instruccion"),
           (", preguntó", "verbo-pregunta"),
           ("Ve a la Torre antes del anochecer", "texto")],
          [("raya", 1), ("verbo-instruccion", 1), ("texto", 1)], ["comillas", "verbo-pregunta"],
          "Una orden necesita un verbo de instrucción, no de pregunta.",
          "\"Ordenó\" o \"indicó\" encajan con una instrucción; \"preguntó\" no."),
    forge("L6F8", "dialogo",
          "Arma correctamente: Tirso insiste. Línea: \"Por favor.\"",
          [("—", "raya"), ("“comillas”", "comillas"),
           (", insistió", "verbo-1"), (", rogó", "verbo-2"), (", suplicó", "verbo-3"),
           ("Por favor", "texto")],
          [("raya", 1), ("verbo-1", 1), ("verbo-2", 1), ("verbo-3", 0), ("texto", 1)], ["comillas"],
          "Puedes usar cualquiera de los verbos de insistencia, no hace falta repetir el mismo.",
          "Varios verbos dicendi sirven para insistir; lo importante es no repetir siempre \"dijo\"."),
    forge("L6F9", "dialogo",
          "Arma correctamente: el Guardián cede al final. Línea: \"Entonces será mejor que corras.\"",
          [("—", "raya"), ("“comillas”", "comillas"),
           (", dijo", "verbo-1"), (", concedió", "verbo-2"), (", aceptó", "verbo-2"),
           ("Entonces será mejor que corras", "texto")],
          [("raya", 1), ("verbo-1", 0), ("verbo-2", 1), ("texto", 1)], ["comillas"],
          "\"Concedió\" o \"aceptó\" muestran mejor que el Guardián cambió de opinión.",
          "Un verbo dicendi como \"concedió\" transmite mejor que cedió, no solo que habló."),
    forge("L6F10", "dialogo",
          "Corrige este diálogo mal puntuado: \"Necesito la Bóveda\", dijo Tirso.",
          [("—", "raya"), ("“comillas”", "comillas-a-quitar"),
           (", dijo", "verbo-dicendi"),
           ("Necesito la Bóveda", "texto")],
          [("raya", 1), ("verbo-dicendi", 1), ("texto", 1)], ["comillas-a-quitar"],
          "El original usa comillas: hay que reemplazarlas por la raya.",
          "En español el diálogo narrativo se marca con raya, no con las comillas que trae el original."),
]

# ============================================================
# NIVEL 7 — La Última Puerta (jefe, integración)
# ============================================================
L7_BRIEF = [
    "<p>Último desafío: un pasaje nuevo, con todo lo que ya aprendiste — narrador, personajes, tiempo, espacio, estructura, descripción y diálogo.</p>",
    "<div class='example'>Lee con calma el pasaje antes de responder. Puedes volver a leerlo en cualquier momento.</div>",
    "<p class='text-dim'>Misión: 12 retos, mezclando reconocer y construir.</p>",
]

PASAJE_F7 = (
    "<p><i>«Nadie había vuelto a abrir la Bóveda de Historias desde que el Guardián de Ecos perdió la "
    "llave, tres inviernos atrás. Tirso no lo sabía cuando cruzó el Pasillo de los Ecos esa tarde, con "
    "las manos manchadas de tinta y el corazón latiéndole como un tambor de piedra.<br><br>"
    "—¿Otra vez tú? —preguntó el Guardián, sin levantar la vista de los vitrales que ordenaba por "
    "millonésima vez.<br>"
    "—Necesito la Bóveda —respondió Tirso, sin bajar la mirada—. Hay una historia que se está apagando.<br>"
    "El Guardián se quedó en silencio un momento largo. Después suspiró, como quien suelta un peso que "
    "cargó demasiado tiempo.<br>"
    "—Entonces será mejor que corras —dijo, y por primera vez, le abrió paso.<br><br>"
    "Tirso avanzó por el pasillo de paredes altas como acantilados de piedra fría, con el eco de sus "
    "propios pasos multiplicado mil veces. Al fondo, una puerta diminuta, casi olvidada, esperaba con la "
    "cerradura oxidada por el tiempo. El Archivo, que llevaba siglos observando en silencio, supo entonces "
    "que había encontrado, por fin, a quien buscaba.»</i></p>"
)

L7 = [
    doors("L7F1", "integracion-narrador",
          PASAJE_F7 + "¿Qué tipo de narrador tiene este pasaje?",
          ["Omnisciente, 3ª persona (\"El Archivo... supo\")", "Protagonista, en 1ª persona",
           "Testigo, en 1ª persona", "No tiene narrador"], 0,
          "Busca la frase sobre \"El Archivo\" cerca del final.",
          "\"El Archivo... supo\" revela un narrador externo que sabe más que cualquier personaje: es omnisciente."),
    doors("L7F2", "integracion-personajes",
          PASAJE_F7 + "¿Quién es el protagonista?",
          ["El Guardián de Ecos", "Tirso",
           "El Archivo", "La Bibliotecaria Mayor"], 1,
          "¿De quién es la aventura que se cuenta?",
          "La aventura de cruzar el pasillo y llegar a la puerta es la de Tirso."),
    doors("L7F3", "integracion-personajes",
          PASAJE_F7 + "¿El Guardián de Ecos es antagonista de Tirso en este pasaje? ¿Por qué?",
          ["No, porque nunca se opone a él", "Sí, porque al inicio se opone a dejarlo pasar — no porque sea malo",
           "Sí, porque es un villano", "No, porque no aparece en el pasaje"], 1,
          "Antagonista es quien se opone a lo que el protagonista quiere, no un sinónimo de villano.",
          "Al inicio el Guardián se opone a que Tirso pase: cumple el papel de antagonista, sin ser malvado."),
    doors("L7F4", "integracion-personajes",
          PASAJE_F7 + "¿Qué tipo de caracterización revela \"por primera vez, le abrió paso\"?",
          ["Directa — el narrador explica que el Guardián cambió", "Indirecta — se infiere un cambio en el Guardián",
           "No es caracterización", "Es descripción del espacio"], 1,
          "Nadie explica el cambio con palabras: se ve en una acción distinta a la de siempre.",
          "El cambio se deduce de una acción nueva (abrirle paso), no porque el narrador lo explique."),
    doors("L7F5", "integracion-tiempo-espacio",
          PASAJE_F7 + "¿Cuál es el espacio principal del pasaje?",
          ["El Pasillo de los Ecos y la puerta al fondo", "Tres inviernos atrás",
           "El corazón de Tirso", "El silencio del Guardián"], 0,
          "El espacio es el lugar físico donde transcurre la acción.",
          "Es el lugar donde ocurre casi toda la escena: el pasillo y la puerta al final de él."),
    doors("L7F6", "integracion-tiempo-espacio",
          PASAJE_F7 + "\"Tres inviernos atrás\" ¿a qué elemento narrativo corresponde?",
          ["Espacio", "Tiempo — marca un momento anterior al presente de la escena",
           "Personajes", "Estructura"], 1,
          "Es una marca de cuándo, no de dónde.",
          "Marca un momento del pasado, distinto al presente de la escena: es tiempo."),
    doors("L7F7", "integracion-estructura",
          PASAJE_F7 + "¿Qué parte de la estructura son los tres primeros párrafos?",
          ["Desenlace", "Planteamiento y nudo — se presenta la situación y el conflicto con el Guardián",
           "Solo planteamiento, sin conflicto", "No tienen estructura"], 1,
          "Hay una situación inicial y un conflicto activo: Tirso quiere pasar, el Guardián decide.",
          "Presentan la situación y el conflicto (Tirso quiere pasar): planteamiento y nudo."),
    doors("L7F8", "integracion-estructura",
          PASAJE_F7 + "¿Qué parte de la estructura es el último párrafo?",
          ["Planteamiento", "Nudo",
           "Desenlace — Tirso encuentra la puerta que buscaba", "No tiene desenlace"], 2,
          "Busca si el conflicto (llegar a la puerta) se resuelve en este párrafo.",
          "Tirso llega a la puerta que buscaba: el conflicto de este pasaje se resuelve ahí."),
    doors("L7F9", "descripcion",
          PASAJE_F7 + "\"paredes altas como acantilados de piedra fría\" es un ejemplo de...",
          ["Descripción con comparación (símil)", "Diálogo",
           "Estructura", "Narrador"], 0,
          "Busca la palabra \"como\": introduce una comparación.",
          "Compara las paredes con acantilados usando \"como\": es una descripción con símil."),
    doors("L7F10", "dialogo",
          PASAJE_F7 + "En el diálogo del pasaje, ¿qué signo se usa para marcar cada intervención?",
          ["Comillas", "La raya (—), no comillas",
           "Paréntesis", "Ningún signo"], 1,
          "Busca el signo al inicio de cada línea que habla un personaje.",
          "Cada intervención empieza con raya (—), como corresponde en español."),
    forge("L7F11", "descripcion",
          "Mejora esta frase del pasillo: \"El pasillo era largo y oscuro.\"",
          [("largo", "vago"), ("oscuro", "vago"),
           ("interminable", "preciso"), ("húmedo", "preciso"), ("silencioso", "preciso"),
           ("como", "comparador"),
           ("una garganta de piedra", "sustantivo"), ("la noche misma", "sustantivo")],
          [("preciso", 1), ("comparador", 1), ("sustantivo", 1)], ["vago"],
          "Cambia \"largo y oscuro\" por un adjetivo preciso y una comparación.",
          "Un adjetivo preciso y una comparación describen el pasillo mucho mejor que \"largo y oscuro\"."),
    forge("L7F12", "dialogo",
          "Puntúa correctamente esta nueva línea del Guardián: \"Vete antes de que cambie de opinión.\"",
          [("—", "raya"), ("“comillas”", "comillas"),
           (", advirtió", "verbo-dicendi"), (", dijo", "verbo-repetido"),
           ("Vete antes de que cambie de opinión", "texto")],
          [("raya", 1), ("verbo-dicendi", 1), ("texto", 1)], ["comillas", "verbo-repetido"],
          "Usa raya, un verbo distinto a \"dijo\" (que ya se usó antes en el pasaje) y el texto completo.",
          "La raya marca el diálogo, y variar el verbo dicendi (\"advirtió\") evita repetir siempre \"dijo\"."),
]


# ============================================================
# ENSAMBLADO
# ============================================================
def level(lid, name, subtitle, briefing, questions):
    return {"id": lid, "name": name, "subtitle": subtitle, "briefing": briefing, "questions": questions}


DATA = {
    "meta": {
        "slug": SLUG,
        "year": "Year 5/6",
        "subject": "Español",
        "topic": "Elementos de la narración y producción escrita",
        "test": "Cycle Test — Plan lector: Heliodoro y el laberinto secreto",
        "accent": "spanish",
    },
    "levels": [
        level(1, "LA VOZ QUE CUENTA", "Narrador", L1_BRIEF, L1),
        level(2, "EL ELENCO", "Personajes", L2_BRIEF, L2),
        level(3, "MAPA Y RELOJ", "Tiempo y espacio", L3_BRIEF, L3),
        level(4, "LOS TRES PASILLOS", "Estructura", L4_BRIEF, L4),
        level(5, "EL TALLER DE VITRALES", "Descripción", L5_BRIEF, L5),
        level(6, "LA SALA DE ECOS", "Diálogo", L6_BRIEF, L6),
        level(7, "LA ÚLTIMA PUERTA", "Integración — plan lector", L7_BRIEF, L7),
    ],
}


# ============================================================
# VALIDADOR — verifica estructura, no aritmética
# (ver claude/modulo-espanol-heliodoro.md, sección "Deuda técnica declarada")
# ============================================================
def validate(data):
    ids = set()
    stems = set()
    errors = []

    for lv in data["levels"]:
        if not lv["briefing"]:
            errors.append("nivel %d sin briefing" % lv["id"])
        if len(lv["questions"]) < 10:
            errors.append("nivel %d tiene menos de 10 items (%d)" % (lv["id"], len(lv["questions"])))

        for q in lv["questions"]:
            if q["id"] in ids:
                errors.append("id repetido: %s" % q["id"])
            ids.add(q["id"])

            if q["mech"] not in ("doors", "forge"):
                errors.append("%s: mech desconocido %r" % (q["id"], q["mech"]))

            for var in q["variants"]:
                stem_key = var["stem"]
                if stem_key in stems:
                    errors.append("%s: enunciado repetido con otro item" % q["id"])
                stems.add(stem_key)

                if not var.get("hint") or not var.get("explain"):
                    errors.append("%s: sin pista o sin explicación" % q["id"])

                if q["mech"] == "doors":
                    opts = var["options"]
                    if len(opts) != 4:
                        errors.append("%s: no tiene 4 opciones (%d)" % (q["id"], len(opts)))
                    if len(set(opts)) != len(opts):
                        errors.append("%s: opciones duplicadas" % q["id"])
                    if not (0 <= var["answer"] < len(opts)):
                        errors.append("%s: answer fuera de rango" % q["id"])
                    for o in opts:
                        if not str(o).strip():
                            errors.append("%s: opción vacía" % q["id"])

                elif q["mech"] == "forge":
                    pieces = var.get("pieces") or []
                    if len(pieces) < 3:
                        errors.append("%s (forge): menos de 3 piezas" % q["id"])
                    cats = {p["cat"] for p in pieces}
                    for need in var["rule"]["need"]:
                        if need["cat"] not in cats:
                            errors.append("%s (forge): la regla pide categoría '%s' que no está en las piezas"
                                          % (q["id"], need["cat"]))
                    # Debe existir AL MENOS una combinación de piezas que satisfaga la regla
                    # (si no, ningún niño puede ganar el reto).
                    need_cats = {n["cat"] for n in var["rule"]["need"]}
                    forbid_cats = set(var["rule"].get("forbid") or [])
                    winnable = need_cats.issubset(cats) and not (need_cats & forbid_cats)
                    if not winnable:
                        errors.append("%s (forge): el reto no es ganable con las piezas dadas" % q["id"])
                    if var["options"] != ["Todavía no cumple la regla", "Cumple la regla"] or var["answer"] != 1:
                        errors.append("%s (forge): options/answer no siguen el contrato del motor" % q["id"])

    # Ninguna habilidad puede acaparar un nivel de reconocimiento (mech "doors").
    # Los niveles de construccion (mech "forge") comparten a proposito una sola
    # etiqueta ("descripcion"/"dialogo") para todos sus retos: no aplica ahi.
    for lv in data["levels"]:
        if all(q["mech"] == "forge" for q in lv["questions"]):
            continue
        counts = {}
        for q in lv["questions"]:
            counts[q["skill"]] = counts.get(q["skill"], 0) + 1
        overused = [s for s, n in counts.items() if n > 8]
        if overused:
            errors.append("nivel %d reutiliza demasiado la(s) habilidad(es) %s" % (lv["id"], overused))

    return errors


def main():
    errors = validate(DATA)
    if errors:
        sys.stderr.write("VALIDACION FALLIDA:\n")
        for e in errors:
            sys.stderr.write("  - %s\n" % e)
        sys.exit(1)

    here = os.path.dirname(os.path.abspath(__file__))
    out_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(here), "subjects", SLUG)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "data.js")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("/* AUTO-GENERADO por tools/gen_espanol_heliodoro.py - no editar a mano */\n")
        fh.write("window.QUIZ_DATA = ")
        fh.write(json.dumps(DATA, ensure_ascii=False, indent=1))
        fh.write(";\n")

    n_fam = sum(len(l["questions"]) for l in DATA["levels"])
    n_doors = sum(1 for l in DATA["levels"] for q in l["questions"] if q["mech"] == "doors")
    n_forge = sum(1 for l in DATA["levels"] for q in l["questions"] if q["mech"] == "forge")
    print("OK -> %s" % path)
    print("levels=%d items=%d (doors=%d forge=%d)" % (len(DATA["levels"]), n_fam, n_doors, n_forge))


if __name__ == "__main__":
    main()
