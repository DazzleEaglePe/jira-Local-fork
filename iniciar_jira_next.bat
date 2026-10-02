@echo off
title Jira-Local Next - Tablero del Equipo
cls
echo ========================================================
echo     INICIANDO JIRA-LOCAL (NUEVA INTERFAZ NEXT.JS)
echo ========================================================
echo.
echo  Tu direccion local (para ti):
echo    http://localhost:5173
echo.
echo  Direccion para tu equipo en la red local:
echo    http://172.20.16.141:5173
echo.
echo  Backend API (Go): puerto 3456
echo  Frontend UI (Next.js): puerto 5173
echo  (La interfaz Vue anterior sigue disponible con iniciar_vikunja.bat)
echo ========================================================
echo  (Para detener los servidores, cierra esta ventana)
echo ========================================================
echo.

rem Some CLIs go silent when this variable is set on this machine.
set test=
set NEXT_TELEMETRY_DISABLED=1

rem 1. Iniciar backend Go si no esta corriendo
tasklist /FI "IMAGENAME eq vikunja.exe" 2>NUL | find /I /N "vikunja.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo [1/3] Iniciando backend de base de datos y API...
    start /B "" "%~dp0vikunja.exe" > "%~dp0backend.log" 2>&1
) else (
    echo [1/3] Backend Vikunja ya esta activo en el puerto 3456.
)

cd /d "%~dp0frontend-next"

rem 2. Compilar la interfaz si aun no existe una compilacion
if not exist ".next\BUILD_ID" (
    echo [2/3] Compilando la interfaz por primera vez, espera un momento...
    node node_modules\next\dist\bin\next build
    if errorlevel 1 (
        echo No se pudo compilar la interfaz. Ejecuta "pnpm install" en frontend-next e intenta de nuevo.
        pause
        exit /b 1
    )
) else (
    echo [2/3] Interfaz ya compilada. Para recompilar ejecuta "pnpm build" en frontend-next.
)

rem 3. Abrir navegador y servir la interfaz en toda la red local
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173"
echo [3/3] Iniciando servidor de la interfaz...
echo.
node node_modules\next\dist\bin\next start -H 0.0.0.0 -p 5173
