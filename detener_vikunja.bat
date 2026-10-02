@echo off
echo ========================================================
echo          DETENIENDO SERVIDORES DE VIKUNJA
echo ========================================================
echo.
taskkill /F /IM vikunja.exe 2>nul
taskkill /F /FI "WINDOWTITLE eq Vikunja Modern Trello*" 2>nul
echo.
echo Todos los servicios de Vikunja han sido detenidos con exito.
echo.
pause
