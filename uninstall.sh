#!/usr/bin/env bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Open Root Gym - Desinstalacion${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ------ 1. Detener servidor si esta corriendo ------
echo -e "${YELLOW}[1/5] Deteniendo servidor...${NC}"
PID=$(lsof -ti :3000 2>/dev/null || lsof -ti :3001 2>/dev/null || lsof -ti :3002 2>/dev/null || true)
if [ -n "$PID" ]; then
  kill $PID 2>/dev/null || true
  echo -e "${GREEN}[OK]${NC} Servidor detenido"
else
  echo -e "${YELLOW}[INFO]${NC} No se encontro servidor corriendo"
fi

# ------ 2. Remover auto-inicio cron ------
echo -e "${YELLOW}[2/5] Removiendo auto-inicio cron...${NC}"
if crontab -l 2>/dev/null | grep -qF "$(pwd)"; then
  crontab -l 2>/dev/null | grep -vF "$(pwd)" | crontab -
  echo -e "${GREEN}[OK]${NC} Entrada cron removida"
else
  echo -e "${YELLOW}[INFO]${NC} No se encontro entrada cron"
fi

# ------ 3. Remover systemd user service ------
echo -e "${YELLOW}[3/5] Removiendo systemd user service...${NC}"
SERVICE_FILE="$HOME/.config/systemd/user/openroot-gym.service"
if [ -f "$SERVICE_FILE" ]; then
  systemctl --user disable openroot-gym.service 2>/dev/null || true
  systemctl --user daemon-reload 2>/dev/null || true
  rm -f "$SERVICE_FILE"
  echo -e "${GREEN}[OK]${NC} Service removido"
else
  echo -e "${YELLOW}[INFO]${NC} No se encontro service de systemd"
fi

# ------ 4. Limpiar archivos temporales ------
echo -e "${YELLOW}[4/5] Limpiando archivos temporales...${NC}"
rm -f .openroot-port
rm -f .openroot-port.bak
echo -e "${GREEN}[OK]${NC} Archivos temporales eliminados"

# ------ 5. Eliminacion manual de la carpeta ------
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Paso final manual${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "La carpeta del proyecto NO se eliminara automaticamente."
echo -e "Para completar la desinstalacion, ejecuta manualmente:"
echo ""
echo -e "  ${RED}rm -rf $(pwd)${NC}"
echo ""
echo -e "O si prefieres moverla a la papelera:"
echo ""
echo -e "  ${RED}rm -rf $(pwd)  # Linux${NC}"
echo -e "  ${RED}rd /s /q \"$(pwd)\"  # Windows (desde cmd)${NC}"
echo ""
echo -e "Despues de eliminar la carpeta, la desinstalacion esta completa."
echo -e ""
echo -e "Para eliminar el repo de GitHub:"
echo -e "  gh repo delete adonizgomez00-glitch/openroot-gym --yes"
echo ""