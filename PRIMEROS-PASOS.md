# Primeros pasos — publicar Samu: A Link to the Math

Guía para hacerlo una sola vez. Después, publicar será un doble clic.

Tiempo total: unos 10 minutos.

---

## PARTE 1 — Instalar Git (solo la primera vez)

Git es el programa que envía los archivos a GitHub. Sin él, el botón de publicar
no funciona.

**Paso 1.** Abre este link en el navegador:

    https://git-scm.com/download/win

**Paso 2.** La descarga empieza sola a los pocos segundos. Se descarga un archivo
llamado algo como `Git-2.47.1-64-bit.exe`. Si no empieza, haz clic en el enlace
que dice **"64-bit Git for Windows Setup"**.

**Paso 3.** Doble clic en ese archivo descargado (suele quedar en la carpeta
`Descargas`).

**Paso 4.** Si Windows pregunta *"¿Quieres permitir que esta aplicación haga
cambios en el dispositivo?"* → **Sí**.

**Paso 5.** El instalador muestra muchas pantallas seguidas. En **todas** haz clic
en **Next** sin cambiar nada. Las opciones que vienen marcadas por defecto son las
correctas.

Son unas 14 pantallas. No te preocupes por lo que dicen.

**Paso 6.** En la última pantalla, clic en **Install**. Espera un minuto.

**Paso 7.** Cuando termine, **desmarca** las casillas que digan *"View Release
Notes"* o *"Launch Git Bash"*, y clic en **Finish**.

No hace falta reiniciar el computador.

---

## PARTE 2 — Publicar

**Paso 8.** Abre esta carpeta en el Explorador de Windows:

    C:\Users\rafae\Documents\Lylolabs\01 Clientes\C999_Proyectos_innovacion\C999 Samuel's pixel gaming study platform

(Truco: copia esa ruta, abre el Explorador, haz clic en la barra de dirección de
arriba, pega y pulsa Enter.)

**Paso 9.** Dentro verás varios archivos. Busca el que se llama:

    publicar.bat

**Paso 10.** Doble clic en `publicar.bat`.

**Paso 11.** Puede aparecer una pantalla azul que dice *"Windows protegió su PC"*.
Es normal, pasa con todos los archivos `.bat`. Haz clic en:

  1. **Más información** (texto pequeño)
  2. **Ejecutar de todas formas** (botón que aparece abajo)

**Paso 12.** Se abre una ventana negra con texto blanco. Vas a ver la lista de
archivos que se van a subir, y luego `Enviando a GitHub...`.

**Paso 13.** **Se abrirá tu navegador** pidiendo iniciar sesión en GitHub.
Esto solo pasa la primera vez.

  - Clic en **Sign in with your browser**
  - Inicia sesión con tu cuenta de GitHub si te la pide
  - Clic en **Authorize** / **Autorizar**
  - Cuando diga *"Authentication Succeeded"*, cierra esa pestaña

**Paso 14.** Vuelve a la ventana negra. Debe terminar mostrando:

    ============================================
      LISTO
    ============================================

**Paso 15.** Pulsa cualquier tecla para cerrar la ventana.

---

## PARTE 3 — Comprobar que funcionó

**Paso 16.** Espera 2 minutos. GitHub necesita ese tiempo para actualizar el sitio.

**Paso 17.** Abre este link:

    https://rafaeldeavilaf.github.io/Cycle_test/

**Paso 18.** Pulsa **Ctrl + F5** (fuerza a recargar sin usar la copia guardada del
navegador). Esto es importante: sin esto verás la versión vieja y rota.

**Paso 19.** Debes ver:

  - Fondo **azul oscuro**, casi negro
  - Letras cuadradas tipo videojuego de los años 90
  - Una tarjeta que dice **COUNTING AND SEQUENCES**
  - Un muñeco de píxeles arriba a la izquierda

Haz clic en la tarjeta: debe aparecer el mapa con **LEVEL 1** disponible y los
otros cuatro niveles con un candado.

Si ves eso, terminaste. Ese es el link que le pasas a Samuel.

---

## De aquí en adelante

Cada vez que agreguemos una materia nueva, tú solo haces **el Paso 10**:
doble clic en `publicar.bat`. Nada más. Ya no pedirá iniciar sesión.

---

## Si algo sale mal

**La ventana negra dice `[ERROR] Git no esta instalado`**
No se instaló bien, o Windows aún no lo detecta. Cierra la ventana, reinicia el
computador y vuelve al Paso 10.

**La ventana negra se cierra sola de inmediato**
Haz clic derecho sobre `publicar.bat` → **Editar** para confirmar que el archivo
existe y no está vacío. Si está vacío, avísame.

**Dice `[ERROR] El envio fallo`**
Casi siempre es que no completaste el inicio de sesión del Paso 13. Vuelve a hacer
doble clic en `publicar.bat` e inténtalo otra vez.

**La página se sigue viendo blanca y sin estilos**
Es la copia guardada del navegador. Pulsa **Ctrl + F5** dos veces. Si sigue igual,
ábrela en una ventana de incógnito (**Ctrl + Shift + N**).

**Cualquier otra cosa**
Toma una foto o captura de la ventana negra y mándamela. El mensaje de error dice
exactamente qué pasó.
