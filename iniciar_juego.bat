@echo off
title Trucolite - Servidor Local
chcp 65001 >nul
cls

echo ========================================================
echo              TRUCOLITE - JUEGO LOCAL
echo ========================================================
echo.
echo Iniciando el juego de forma local y 100%% offline...
echo.

:: 1. Comprobar si Node.js está disponible
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js detectado en el sistema.
    echo [INFO] Levantando servidor local en http://localhost:8080 ...
    echo [INFO] Abriendo en tu navegador predeterminado...
    echo.
    echo Presiona CTRL + C en esta ventana para cerrar el juego.
    echo ========================================================
    start "" "http://localhost:8080"
    node tools/serve.mjs
    goto fin
)

:: 2. Si no hay Node, comprobar si Python está disponible
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Python detectado en el sistema.
    echo [INFO] Levantando servidor local en http://localhost:8080 ...
    echo [INFO] Abriendo en tu navegador predeterminado...
    echo.
    echo Presiona CTRL + C en esta ventana para cerrar el juego.
    echo ========================================================
    start "" "http://localhost:8080"
    python -m http.server 8080
    goto fin
)

:: 3. Si no hay Node ni Python, intentar con el lanzador de Python py
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Lanzador 'py' detectado en el sistema.
    echo [INFO] Levantando servidor local en http://localhost:8080 ...
    echo [INFO] Abriendo en tu navegador predeterminado...
    echo.
    echo Presiona CTRL + C en esta ventana para cerrar el juego.
    echo ========================================================
    start "" "http://localhost:8080"
    py -m http.server 8080
    goto fin
)

:: 4. Fallback directo si no hay ningún runtime
echo [AVISO] No se encontro Node.js ni Python instalados.
echo [INFO] Abriendo directamente index.html en tu navegador...
start "" "%~dp0index.html"

:fin
