@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo.
echo ============================================
echo   SAMU: A LINK TO THE MATH - Publicar en GitHub Pages
echo ============================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git no esta instalado en este equipo.
  echo.
  echo   Instalalo desde: https://git-scm.com/download/win
  echo   Acepta todas las opciones por defecto y vuelve a ejecutar este archivo.
  echo.
  echo   Alternativa sin terminal: GitHub Desktop
  echo   https://desktop.github.com  ^> File ^> Add local repository ^> esta carpeta
  echo.
  pause
  exit /b 1
)

if not exist ".git" (
  echo [ERROR] Esta carpeta no es un repositorio git.
  echo   Ejecuta este archivo desde la carpeta del proyecto.
  echo.
  pause
  exit /b 1
)

echo Cambios detectados:
echo --------------------------------------------
git status --short
echo --------------------------------------------
echo.

git diff --quiet && git diff --cached --quiet
if not errorlevel 1 (
  echo No hay cambios nuevos que publicar.
  echo Intentando enviar commits pendientes...
  goto push
)

set "MSG=%~1"
if "%MSG%"=="" set "MSG=Actualizar Samu: A Link to the Math"

git add -A
git commit -m "%MSG%"
if errorlevel 1 (
  echo.
  echo [ERROR] No se pudo crear el commit. Revisa el mensaje de arriba.
  pause
  exit /b 1
)

:push
echo.
echo Enviando a GitHub...
git push
if errorlevel 1 (
  echo.
  echo [ERROR] El envio fallo.
  echo.
  echo   Causa mas probable: es la primera vez y Git necesita tu cuenta.
  echo   Se deberia abrir una ventana del navegador para iniciar sesion.
  echo   Si no aparece, abre GitHub Desktop una vez, inicia sesion,
  echo   y vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   LISTO
echo ============================================
echo.
echo   El sitio tarda 1-2 minutos en actualizarse:
echo   https://rafaeldeavilaf.github.io/Cycle_test/
echo.
echo   Si lo ves igual, pulsa Ctrl + F5 en el navegador.
echo.
pause
