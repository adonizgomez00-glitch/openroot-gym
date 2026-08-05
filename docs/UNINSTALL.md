# Desinstalación — Open Root Gym

La desinstalación se hace en pasos. La **carpeta del proyecto nunca se elimina automáticamente** (paso manual al final).

## 1. Ejecutar el script de desinstalación

**Linux / macOS:**
```bash
uninstall.sh      # o si no tiene permiso de ejecución:  bash uninstall.sh
```

**Windows:**
```batch
uninstall.bat
```

El script hace automáticamente:

- **Detiene el servidor** si está corriendo (busca el proceso en los puertos 3000/3001/3002 — Linux), o por puerto vía `netstat`/`taskkill` (Windows).
- **Elimina solo su propia entrada de auto-inicio**:
  - **cron (Linux):** quita la línea `@reboot` que referencia *este directorio* (filtro por proyecto con `grep -vF "$(pwd)"`), de modo que **no borra** el `@reboot` de otras apps ni tus jobs de producción.
  - **systemd (Linux):** elimina `~/.config/systemd/user/openroot-gym.service`.
  - **Windows:** elimina `OpenRootGym.vbs` de la carpeta de Inicio (y el `OpenRootGym.bat` antiguo si existiera) y la entrada `HKCU\...\Run\OpenRootGym` si la hay.
- **Limpia archivos temporales** (`.openroot-port`, `.openroot-port.bak`).
- Te indica el comando para eliminar la carpeta del proyecto (paso manual).

## 2. Detener el servidor en caliente (si hace falta)

**Linux:**
```bash
pkill -f "python3 -m http.server"
```

**Windows (PowerShell):**
```powershell
Get-NetTCPConnection -LocalPort 3000,3001,3002 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

> `taskkill /F /IM python.exe` cierra todos los procesos de Python; úsalo solo si no hay otros scripts de Python en ejecución.

## 3. Limpiar datos de IndexedDB (en el navegador)

Para borrar toda la información guardada localmente:

1. Abrir la app en el navegador.
2. Pulsar `F12` (DevTools) → pestaña **Application**.
3. Sección **Storage → IndexedDB**, clic derecho sobre `OpenRootGym` (el origen que uses) → **Clear**.
4. Recargar la página.

O bien: candado/ícono del sitio en la barra de direcciones → **Datos del sitio** → **Borrar datos**.

> Los datos viven en el navegador, **no** en `~/apps-locales`. Cada origen (`localhost:3000`, `192.168.0.150:3000`, etc.) tiene su propia base.

## 4. Eliminar la carpeta del proyecto (manual)

**Linux / macOS:**
```bash
rm -rf /ruta/a/OpenRootGym
```

**Windows (cmd):**
```batch
rd /s /q "C:\ruta\a\OpenRootGym"
```

**Windows (PowerShell):**
```powershell
Remove-Item -Recurse -Force "C:\ruta\a\OpenRootGym"
```

## 5. Eliminar el repositorio de GitHub (opcional)

```bash
gh repo delete adonizgomez00-glitch/openroot-gym --yes
```

## Notas

- El script **no** elimina la carpeta del proyecto por seguridad.
- Si reinicias el sistema después del `uninstall.sh`, el servidor **ya no** volverá a arrancar solo.
- Si reinstalas después, el puerto se detectará y guardará de nuevo automáticamente.