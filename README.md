# Italia Digitale MCP

MCP Server TypeScript per integrare strumenti di produttività con Claude Desktop e altri client MCP compatibili.

Attualmente espone tool per **Trello** (board, liste, card, commenti, membri, label, checklist, ricerca) e comandi di **sistema** (aggiornamenti automatici).

---

## Indice

- [Prerequisiti](#prerequisiti)
- [Installazione](#installazione)
- [Configurazione credenziali](#configurazione-credenziali)
- [Test con MCP Inspector](#test-con-mcp-inspector)
- [Integrazione con Claude Desktop](#integrazione-con-claude-desktop)
- [Tool disponibili](#tool-disponibili)
- [Struttura del codice](#struttura-del-codice)
- [Contribuire](#contribuire)

---

## Prerequisiti

- Node.js 18+
- npm 9+
- Git
- Account Trello

---

## Installazione

```bash
git clone https://github.com/AbruzzoDigitale/italia_digitale_mcp.git
cd italia_digitale_mcp
npm install
npm run build
```

---

## Configurazione credenziali

Le credenziali Trello si ottengono su [https://trello.com/app-key](https://trello.com/app-key):
1. Copia la **API Key**
2. Clicca su **"Token"** nella stessa pagina per generare il token di accesso

Hai **due metodi** per configurarle — scegli quello che preferisci:

### Metodo 1 — Tramite chat (consigliato)

Una volta avviato il server, chiedi direttamente a Claude:

> "Configura Trello con API Key `<la tua key>` e Token `<il tuo token>`"

Claude chiamerà il tool `trello_configure` che salverà le credenziali in modo sicuro in `~/.config/italia-digitale-mcp/credentials.json` (permessi 600, solo il tuo utente può leggerlo). Non serve nessun file `.env`.

### Metodo 2 — File `.env`

Crea un file `.env` nella root del progetto:

```env
TRELLO_API_KEY=your_api_key
TRELLO_TOKEN=your_token
```

> **Non committare mai il file `.env`** — è già escluso via `.gitignore`.

---

## Test con MCP Inspector

[MCP Inspector](https://github.com/modelcontextprotocol/inspector) è lo strumento ufficiale per testare il server localmente **senza usare Claude**.

### Avvio

```bash
# Dalla root del progetto (dopo npm run build)
npm run inspect
```

### Sviluppo con auto-reload

Apri **due terminali**:

```bash
# Terminale 1 — compila in automatico ad ogni salvataggio
npm run dev

# Terminale 2 — riavvia l'inspector ad ogni modifica nel build/
npm run dev:inspect
```

Ogni volta che salvi un file `.ts`, tsc lo ricompila e nodemon rilancia automaticamente il server. Nel browser basta cliccare **Reconnect**.

Al primo avvio scarica automaticamente il pacchetto. Alla fine vedrai un output simile a:

```
⚙️ Proxy server listening on localhost:6277
🚀 MCP Inspector is up and running at:
   http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=<token>
```

Il browser si apre automaticamente. Se non si apre, copia e incolla l'URL nel browser.

### Utilizzo

1. Clicca **Connect** per collegare l'inspector al server
2. Vai nella tab **Tools** per vedere tutti i tool disponibili
3. Seleziona un tool, compila i parametri e clicca **Run**

### Primo avvio: configura le credenziali

Se non hai un file `.env`, usa il tool `trello_configure` direttamente dall'inspector:

- Tool: `trello_configure`
- Parametri:
  - `apiKey`: la tua API Key da [trello.com/app-key](https://trello.com/app-key)
  - `token`: il tuo Token dalla stessa pagina
- Clicca **Run** → le credenziali vengono salvate in `~/.config/italia-digitale-mcp/credentials.json`

Poi verifica con `trello_auth_status` che tutto sia corretto prima di testare gli altri tool.

---



Aggiungi questa voce al file di configurazione di Claude Desktop:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "italia-digitale": {
      "command": "node",
      "args": ["/percorso/assoluto/italia_digitale_mcp/build/index.js"]
    }
  }
}
```

> Sostituisci `/percorso/assoluto/` con il percorso reale della cartella clonata.  
> Se usi il Metodo 2 (`.env`), aggiungi `"env": { "TRELLO_API_KEY": "...", "TRELLO_TOKEN": "..." }` alla configurazione.

Riavvia Claude Desktop dopo aver salvato il file.

---

## Tool disponibili

### Autenticazione Trello

| Tool | Descrizione |
|------|-------------|
| `trello_configure` | Salva API Key e Token Trello (persistente, senza `.env`) |
| `trello_auth_status` | Mostra se le credenziali sono configurate e da dove vengono lette |

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

### Sistema

| Tool | Descrizione |
|------|-------------|
| `aggiorna` | Controlla aggiornamenti su Git, fa pull e ricompila il server |

---

## Struttura del codice

```
italia_digitale_mcp/
├── src/
│   ├── index.ts                  # Entry point — monta tutte le categorie di tool
│   ├── config.ts                 # Gestione credenziali su disco (~/.config/...)
│   └── tools/
│       ├── trello/
│       │   ├── api.ts            # Funzioni di accesso all'API REST Trello
│       │   └── tools.ts          # Registrazione tool Trello
│       └── system/
│           └── tools.ts          # Tool di sistema (aggiornamenti)
├── build/                        # Output compilato (generato da tsc, non committare)
├── .env.example                  # Template variabili d'ambiente
├── tsconfig.json
└── package.json
```

Per aggiungere una nuova categoria di tool, crea una cartella sotto `src/tools/`, implementa `api.ts` + `tools.ts` ed esporta una funzione `registerXxxTools(server)` da chiamare in `src/index.ts`.

---

## Contribuire

Leggi [CONTRIBUTING.md](CONTRIBUTING.md) per le regole di branching, commit e pull request.
