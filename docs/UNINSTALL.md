# Desinstalación — Open Root Gym

## Resumen

La desinstalación de Open Root Gym se realiza en 5 pasos. La eliminación de la carpeta del proyecto es **manual y se realiza al final**, nunca de forma automática.

## Pasos

### 1. Detener el servidor

Si el servidor está corriendo, detenlo con `Ctrl+C` en la terminal donde se inició, o ejecuta:

```bash
pkill -f "http.server"
```

### 2. Ejecutar el script de desinstalación

**Linux / macOS:**
```bash
chmod +x uninstall.sh
./uninstall.sh
```

**Windows:**
```batch
uninstall.bat
```

El script realiza automáticamente:
- Detiene el servidor si está corriendo
- Elimina entradas de auto-inicio (cron, systemd, registro de Windows)
- Limpia archivos temporales (`.openroot-port`)

### 3. Eliminar auto-inicio manual (si el script no lo detectó)

**Linux/macOS — cron:**
```bash
crontab -l | grep -v "http.server" | crontab -
```

**Linux/macOS — systemd:**
```bash
systemctl --user disable openroot-gym.service
rm -f ~/.config/systemd/user/openroot-gym.service
```

**Windows — carpeta de inicio:**
```batch
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\OpenRootGym.bat"
```

**Windows — registro:**
```batch
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v OpenRootGym /f
```

### 4. Limpiar datos de IndexedDB

Si deseas borrar toda la información almacenada localmente:

1. Abrir el navegador
2. Presionar `F12` (DevTools)
3. Ir a **Application** → **Clear storage**
4. Click en **Clear site data**

### 5. Eliminar la carpeta del proyecto (manual)

La carpeta **nunca se elimina automáticamente**. Para completar la desinstalación, ejecuta manualmente:

**Linux / macOS:**
```bash
rm -rf /ruta/a/OpenRoot-ERP
```

**Windows (cmd):**
```batch
rd /s /q "C:\ruta\a\OpenRoot-ERP"
```

**Windows (PowerShell):**
```powershell
Remove-Item -Recurse -Force "C:\ruta\a\OpenRoot-ERP"
```

## Eliminar el repositorio de GitHub

Si deseas eliminar también el repo remoto:

```bash
gh repo delete adonizgomez00-glitch/openroot-gym --yes
```

## Notas

- Los datos de IndexedDB se pierden al eliminar la carpeta del proyecto
- No hay datos en servidores remotos — todo es local
- Si reinstalas, el puerto guardado en `.openroot-port` se reutilizará automáticamente
- El script de desinstalación no elimina la carpeta del proyecto por seguridad