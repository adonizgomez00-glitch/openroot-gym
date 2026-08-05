@echo off
title Open Root Gym - Desinstalacion
chcp 65001 >nul

REM Ejecutar siempre desde el propio directorio del proyecto
cd /d "%~dp0"

echo ========================================
echo   Open Root Gym - Desinstalacion
echo ========================================
echo.

REM ------ 1. Detener servidor si esta corriendo ------
echo [1/5] Deteniendo servidor...
for /f "tokens=5" %%a in ('netstat -a -n -o 2^>nul ^| findstr ":3000 "') do (
    taskkill /PID %%a /F >nul 2>&1
    echo [OK] Servidor detenido (PID %%a)
)
for /f "tokens=5" %%a in ('netstat -a -n -o 2^>nul ^| findstr ":3001 "') do (
    taskkill /PID %%a /F >nul 2>&1
    echo [OK] Servidor detenido (PID %%a)
)
for /f "tokens=5" %%a in ('netstat -a -n -o 2^>nul ^| findstr ":3002 "') do (
    taskkill /PID %%a /F >nul 2>&1
    echo [OK] Servidor detenido (PID %%a)
)
echo [INFO] No se encontro servidor corriendo (si no se muestra arriba)
echo.

REM ------ 2. Remover auto-inicio carpeta de inicio ------
echo [2/5] Removiendo auto-inicio de carpeta de inicio...
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
if exist "%STARTUP_DIR%\OpenRootGym.vbs" (
    del "%STARTUP_DIR%\OpenRootGym.vbs"
    echo [OK] OpenRootGym.vbs removido de inicio
)
if exist "%STARTUP_DIR%\OpenRootGym.bat" (
    del "%STARTUP_DIR%\OpenRootGym.bat"
    echo [OK] OpenRootGym.bat removido de inicio
)
if not exist "%STARTUP_DIR%\OpenRootGym.vbs" if not exist "%STARTUP_DIR%\OpenRootGym.bat" (
    echo [INFO] No se encontro archivo de inicio
)
echo.

REM ------ 3. Remover registro Run ------
echo [3/5] Removiendo entrada de registro...
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v OpenRootGym >nul 2>&1
if %ERRORLEVEL% equ 0 (
    reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v OpenRootGym /f >nul 2>&1
    echo [OK] Entrada de registro removida
) else (
    echo [INFO] No se encontro entrada de registro
)
echo.

REM ------ 4. Limpiar archivos temporales ------
echo [4/5] Limpiando archivos temporales...
if exist ".openroot-port" del ".openroot-port"
if exist ".openroot-port.bak" del ".openroot-port.bak"
echo [OK] Archivos temporales eliminados
echo.

REM ------ 5. Eliminacion manual de la carpeta ------
echo ========================================
echo   Paso final manual
echo ========================================
echo.
echo La carpeta del proyecto NO se eliminara automaticamente.
echo Para completar la desinstalacion, ejecuta manualmente:
echo.
echo   rd /s /q "%CD%"
echo.
echo O mueve la carpeta a la papelera manualmente.
echo.
echo Despues de eliminar la carpeta, la desinstalacion esta completa.
echo.
echo Para eliminar el repo de GitHub:
echo   gh repo delete adonizgomez00-glitch/openroot-gym --yes
echo.
pause