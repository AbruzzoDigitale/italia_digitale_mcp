# Trello MCP Server

Server MCP per integrare Trello con Claude (e altri client MCP compatibili).

## Prerequisiti

- Node.js 18+
- Account Trello con API Key e Token

## Ottenere API Key e Token Trello

1. Vai su [https://trello.com/power-ups/admin](https://trello.com/power-ups/admin)
2. Crea una nuova Power-Up (o usa una esistente) e copia la **API Key**
3. Genera il **Token** visitando:
   ```
   https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&key=LA_TUA_API_KEY
   ```

## Installazione

```bash
npm install
```

## Configurazione

Copia il file `.env` e inserisci le tue credenziali:

```env
TRELLO_API_KEY=la_tua_api_key
TRELLO_TOKEN=il_tuo_token
```

## Build

```bash
npm run build
```

## Integrazione con Claude Desktop

Aggiungi questa configurazione al file `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "trello": {
      "command": "node",
      "args": ["/percorso/assoluto/al/progetto/build/index.js"],
      "env": {
        "TRELLO_API_KEY": "la_tua_api_key",
        "TRELLO_TOKEN": "il_tuo_token"
      }
    }
  }
}
```

> Sostituisci `/percorso/assoluto/al/progetto` con il percorso reale della cartella del progetto.

## Strumenti disponibili

| Tool | Descrizione |
|------|-------------|
| `get_boards` | Elenca tutte le board dell'utente |
| `get_board` | Dettagli di una board |
| `create_board` | Crea una nuova board |
| `get_lists` | Elenca le liste di una board |
| `create_list` | Crea una nuova lista |
| `archive_list` | Archivia una lista |
| `get_cards` | Elenca le card di una lista |
| `get_card` | Dettagli di una card |
| `create_card` | Crea una nuova card |
| `update_card` | Aggiorna una card |
| `delete_card` | Elimina una card |
| `move_card` | Sposta una card in un'altra lista |
| `add_comment` | Aggiunge un commento a una card |
| `get_comments` | Ottieni i commenti di una card |
| `get_members` | Elenca i membri di una board |
| `add_member_to_card` | Assegna un membro a una card |
| `get_labels` | Elenca le label di una board |
| `add_label_to_card` | Aggiunge una label a una card |
| `get_checklists` | Elenca le checklist di una card |
| `create_checklist` | Crea una checklist su una card |
| `add_check_item` | Aggiunge un elemento a una checklist |
| `search_trello` | Cerca card e board su Trello |

## Debug con VS Code

Il progetto include la configurazione `.vscode/mcp.json` per il debug diretto dall'editor.
