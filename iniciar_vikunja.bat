@echo off
title Vikunja Modern Trello - Tablero del Equipo
cls
echo ========================================================
echo     INICIANDO VIKUNJA MODERN TRELLO (CON DISENO PRO)
echo ========================================================
echo.
echo  Tu direccion local (para ti):
echo    http://localhost:5173
echo.
echo  Direccion para tu equipo en la red local:
echo    http://172.20.16.141:5173
echo.
echo  Backend API (Go): puerto 3456
echo  Frontend UI (Modern Trello): puerto 5173
echo ========================================================
echo  (Para detener los servidores, cierra esta ventana)
echo ========================================================
echo.

rem 1. Iniciar backend Go si no esta corriendo
tasklist /FI "IMAGENAME eq vikunja.exe" 2>NUL | find /I /N "vikunja.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo [1/2] Iniciando backend de base de datos y API...
    start /B "" "%~dp0vikunja.exe" > "%~dp0backend.log" 2>&1
) else (
    echo [1/2] Backend Vikunja ya esta activo en el puerto 3456.
)

rem 2. Abrir navegador automaticamente despues de 2 segundos
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5173"

rem 3. Iniciar servidor de interfaz moderna
echo [2/2] Iniciando servidor de interfaz moderna...
echo.
node "%~dp0server.mjs"
