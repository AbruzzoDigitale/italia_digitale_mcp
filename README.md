# Trello MCP Server

MCP Server TypeScript per integrare Trello con Claude Desktop e altri client MCP compatibili.

Espone **24 tool** che coprono board, liste, card, commenti, membri, label, checklist e ricerca.

---

## Indice

- [Prerequisiti](#prerequisiti)
- [Setup locale](#setup-locale)
- [Configurazione](#configurazione)
- [Build & avvio](#build--avvio)
- [Integrazione con Claude Desktop](#integrazione-con-claude-desktop)
- [Tool disponibili](#tool-disponibili)
- [Struttura del codice](#struttura-del-codice)
- [Contribuire](#contribuire)

---

## Prerequisiti

- Node.js 18+
- npm 9+
- Account Trello con API Key e Token

### Ottenere API Key e Token Trello

1. Vai su [https://trello.com/power-ups/admin](https://trello.com/power-ups/admin)
2. Crea una nuova Power-Up (o usa una esistente) e copia la **API Key**
3. Genera il **Token** visitando:
   ```
   https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&key=YOUR_API_KEY
   ```

---

## Setup locale

```bash
git clone <repo-url>
cd trello_mcp_server
npm install
cp .env.example .env
# Compila .env con le tue credenziali
```

---

## Configurazione

Crea un file `.env` nella root del progetto:

```env
TRELLO_API_KEY=your_api_key
TRELLO_TOKEN=your_token
```

> **Non committare mai il file `.env`** — è escluso dal tracking via `.gitignore`.

---

## Build & avvio

```bash
# Compila TypeScript → build/
npm run build

# Avvia il server MCP
npm start

# Modalità watch (sviluppo)
npm run dev
```

---

## Integrazione con Claude Desktop

Aggiungi questa configurazione al file `claude_desktop_config.json`:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/absolute/path/to/trello_mcp_server/build/index.js"],
      "env": {
        "TRELLO_API_KEY": "your_api_key",
        "TRELLO_TOKEN": "your_token"
      }
    }
  }
}
```

> Sostituisci il percorso con quello assoluto reale della cartella del progetto.

---

## Tool disponibili

### Board

| Tool | Descrizione |
|------|-------------|
| `get_boards` | Elenca tutte le board dell'utente autenticato |
| `get_board` | Dettagli di una board specifica |
| `create_board` | Crea una nuova board |

### Liste

| Tool | Descrizione |
|------|-------------|
| `get_lists` | Elenca le liste di una board |
| `create_list` | Crea una nuova lista |
| `archive_list` | Archivia una lista |

### Card

| Tool | Descrizione |
|------|-------------|
| `get_cards` | Elenca le card di una lista |
| `get_card` | Dettagli di una card |
| `create_card` | Crea una nuova card |
| `update_card` | Aggiorna nome, descrizione, scadenza, ecc. |
| `delete_card` | Elimina definitivamente una card |
| `move_card` | Sposta una card in un'altra lista |

### Commenti

| Tool | Descrizione |
|------|-------------|
| `add_comment` | Aggiunge un commento a una card |
| `get_comments` | Elenca i commenti di una card |

### Membri

| Tool | Descrizione |
|------|-------------|
| `get_members` | Elenca i membri di una board |
| `add_member_to_card` | Assegna un membro a una card |

### Label

| Tool | Descrizione |
|------|-------------|
| `get_labels` | Elenca le label di una board |
| `add_label_to_card` | Aggiunge una label a una card |

### Checklist

| Tool | Descrizione |
|------|-------------|
| `get_checklists` | Elenca le checklist di una card |
| `create_checklist` | Crea una checklist su una card |
| `add_check_item` | Aggiunge un elemento a una checklist |

### Ricerca

| Tool | Descrizione |
|------|-------------|
| `search_trello` | Cerca card e board su Trello |

---

## Struttura del codice

```
trello_mcp_server/
├── src/
│   ├── index.ts        # Entry point — registrazione di tutti i tool MCP
│   └── trello.ts       # Client Trello — funzioni di accesso all'API REST
├── build/              # Output compilato (generato da tsc, non committare)
├── .env                # Credenziali locali (non committare)
├── .env.example        # Template delle variabili d'ambiente
├── tsconfig.json       # Configurazione TypeScript
└── package.json
```

Un dominio per file — ogni nuova area funzionale deve seguire questa separazione.

---

## Contribuire

Leggi [CONTRIBUTING.md](CONTRIBUTING.md) per le regole di branching, commit e pull request.
