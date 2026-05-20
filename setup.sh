#!/usr/bin/env bash
set -euo pipefail

# ─── Colori ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

ok()   { echo -e "${GREEN}✅  $*${RESET}"; }
info() { echo -e "${CYAN}ℹ️   $*${RESET}"; }
warn() { echo -e "${YELLOW}⚠️   $*${RESET}"; }
err()  { echo -e "${RED}❌  $*${RESET}"; exit 1; }
sep()  { echo -e "${BOLD}─────────────────────────────────────────${RESET}"; }

# ─── Header ───────────────────────────────────────────────────────────────────
clear
echo -e "${BOLD}${CYAN}"
echo "  Italia Digitale MCP — Setup"
echo -e "${RESET}"
sep

# ─── 1. Prerequisiti ──────────────────────────────────────────────────────────
info "Controllo prerequisiti..."

command -v node >/dev/null 2>&1 || err "Node.js non trovato. Installa da https://nodejs.org"
command -v npm  >/dev/null 2>&1 || err "npm non trovato. Installa Node.js da https://nodejs.org"

NODE_VER=$(node -e "process.exit(parseInt(process.versions.node) < 18 ? 1 : 0)" 2>/dev/null && echo "ok" || echo "old")
[[ "$NODE_VER" == "old" ]] && err "Node.js 18+ richiesto. Versione attuale: $(node -v)"

ok "Node.js $(node -v) · npm $(npm -v)"

# ─── 2. Directory del progetto ────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
info "Directory: $SCRIPT_DIR"

# ─── 3. Dipendenze e build ────────────────────────────────────────────────────
sep
info "Installazione dipendenze..."
npm install --silent
ok "Dipendenze installate."

info "Compilazione TypeScript..."
npm run build
ok "Build completata → build/index.js"

# ─── 4. Credenziali Trello ────────────────────────────────────────────────────
sep
echo -e "${BOLD}Credenziali Trello${RESET}"
echo ""
echo "  Ottieni API Key e Token su: https://trello.com/app-key"
echo ""

read -rp "  API Key: " TRELLO_API_KEY
[[ -z "$TRELLO_API_KEY" ]] && err "API Key non può essere vuota."

read -rp "  Token:   " TRELLO_TOKEN
[[ -z "$TRELLO_TOKEN" ]] && err "Token non può essere vuoto."

CREDS_DIR="$HOME/.config/italia-digitale-mcp"
CREDS_FILE="$CREDS_DIR/credentials.json"
mkdir -p "$CREDS_DIR"
cat > "$CREDS_FILE" << EOF
{
  "trello": {
    "apiKey": "$TRELLO_API_KEY",
    "token": "$TRELLO_TOKEN"
  }
}
EOF
chmod 600 "$CREDS_FILE"
ok "Credenziali salvate in $CREDS_FILE"

# ─── 5. Config Claude Desktop ─────────────────────────────────────────────────
sep
info "Configurazione Claude Desktop..."

CLAUDE_CONFIG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

# Crea il file se non esiste
if [[ ! -f "$CLAUDE_CONFIG" ]]; then
  mkdir -p "$(dirname "$CLAUDE_CONFIG")"
  echo '{"mcpServers":{}}' > "$CLAUDE_CONFIG"
  info "Creato nuovo file di configurazione Claude Desktop."
fi

# Aggiunge/aggiorna la voce con python3
python3 - "$CLAUDE_CONFIG" "$SCRIPT_DIR" << 'PYEOF'
import json, sys

config_path = sys.argv[1]
server_path = sys.argv[2]

with open(config_path) as f:
    config = json.load(f)

if "mcpServers" not in config:
    config["mcpServers"] = {}

config["mcpServers"]["italia-digitale-mcp"] = {
    "command": "node",
    "args": [f"{server_path}/build/index.js"]
}

with open(config_path, "w") as f:
    json.dump(config, f, indent=2)

print("ok")
PYEOF

ok "Server registrato in Claude Desktop."

# ─── 6. Riepilogo ─────────────────────────────────────────────────────────────
sep
echo ""
echo -e "${BOLD}${GREEN}  Installazione completata!${RESET}"
echo ""
echo -e "  ${BOLD}Prossimo passo:${RESET} riavvia Claude Desktop per attivare il server."
echo ""
echo -e "  Per verificare che tutto funzioni, scrivi a Claude:"
echo -e "  ${CYAN}\"Aiuto\"${RESET}  →  mostra tutti i comandi disponibili"
echo -e "  ${CYAN}\"Aggiorna il server MCP\"${RESET}  →  controlla aggiornamenti"
echo ""
sep
