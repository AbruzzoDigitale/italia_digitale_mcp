import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { loadCredentials, saveCredentials, getCredentialsPath } from "../../config.js";
import { registry } from "../registry.js";
import {
  getBoards,
  getBoard,
  createBoard,
  getLists,
  createList,
  archiveList,
  getCards,
  getCard,
  createCard,
  updateCard,
  deleteCard,
  moveCard,
  addComment,
  getComments,
  getMembers,
  addMemberToCard,
  getLabels,
  addLabelToCard,
  createChecklist,
  addCheckItem,
  getChecklists,
  searchTrello,
  getBoardOverview,
  type MemberRef,
} from "./api.js";

export function registerTrelloTools(server: McpServer): void {

  // ─── REGISTRO DOCUMENTAZIONE ────────────────────────────────────────────────

  registry.add({ name: "trello_configure", title: "Configura Credenziali Trello", category: "🔐 Autenticazione Trello",
    description: "Salva API Key e Token Trello in `~/.config/italia-digitale-mcp/credentials.json`.\nOttieni le credenziali su https://trello.com/app-key",
    params: [
      { name: "apiKey", type: "string", required: true, description: "API Key Trello" },
      { name: "token",  type: "string", required: true, description: "Token Trello" },
    ],
  });
  registry.add({ name: "trello_auth_status", title: "Stato Autenticazione", category: "🔐 Autenticazione Trello",
    description: "Mostra se le credenziali sono configurate e da dove vengono lette.",
  });
  registry.add({ name: "get_overview", title: "Panoramica Board ⭐", category: "🗂 Panoramica",
    description: "Vista riepilogativa di tutte le board con liste e card. Icone: ⚠️ scaduta · 🔔 scade entro 7gg · 📅 futura · ✅ completata.",
    params: [
      { name: "boardFilter",    type: "enum",   required: false, values: "`open` `closed` `all`",                                    description: "Board da includere (default: open)" },
      { name: "memberUsername", type: "string", required: false,                                                                      description: "Filtra per nome/username operatore" },
      { name: "labelName",      type: "string", required: false,                                                                      description: "Filtra per nome/colore etichetta" },
      { name: "dueStatus",      type: "enum",   required: false, values: "`all` `overdue` `due_soon` `complete` `no_due`",            description: "Filtra per stato scadenza (default: all)" },
    ],
  });
  registry.add({ name: "get_boards",  title: "Ottieni Board",  category: "📋 Board",
    description: "Restituisce le board dell'utente.",
    params: [{ name: "filter", type: "enum", required: false, values: "`open` `closed` `all`", description: "Default: all" }],
  });
  registry.add({ name: "get_board",   title: "Dettaglio Board", category: "📋 Board",
    description: "Dettagli di una board specifica.",
    params: [{ name: "boardId", type: "string", required: true, description: "ID della board" }],
  });
  registry.add({ name: "create_board", title: "Crea Board", category: "📋 Board",
    description: "Crea una nuova board.",
    params: [
      { name: "name", type: "string", required: true,  description: "Nome della board" },
      { name: "desc", type: "string", required: false, description: "Descrizione (opzionale)" },
    ],
  });
  registry.add({ name: "get_lists",    title: "Ottieni Liste",   category: "📝 Liste",
    description: "Liste di una board.",
    params: [{ name: "boardId", type: "string", required: true, description: "ID della board" }],
  });
  registry.add({ name: "create_list",  title: "Crea Lista",      category: "📝 Liste",
    description: "Crea una lista in una board.",
    params: [
      { name: "boardId", type: "string", required: true, description: "ID della board" },
      { name: "name",    type: "string", required: true, description: "Nome della lista" },
    ],
  });
  registry.add({ name: "archive_list", title: "Archivia Lista",  category: "📝 Liste",
    description: "Archivia una lista.",
    params: [{ name: "listId", type: "string", required: true, description: "ID della lista" }],
  });
  registry.add({ name: "get_cards",   title: "Ottieni Card",  category: "🃏 Card",
    description: "Card di una lista.",
    params: [{ name: "listId", type: "string", required: true, description: "ID della lista" }],
  });
  registry.add({ name: "get_card",    title: "Dettaglio Card", category: "🃏 Card",
    description: "Dettaglio di una card.",
    params: [{ name: "cardId", type: "string", required: true, description: "ID della card" }],
  });
  registry.add({ name: "create_card", title: "Crea Card",     category: "🃏 Card",
    description: "Crea una nuova card in una lista.",
    params: [
      { name: "listId", type: "string", required: true,  description: "ID della lista" },
      { name: "name",   type: "string", required: true,  description: "Titolo della card" },
      { name: "desc",   type: "string", required: false, description: "Descrizione" },
      { name: "due",    type: "string", required: false, description: "Scadenza ISO 8601 (es. 2026-05-30T10:00:00.000Z)" },
    ],
  });
  registry.add({ name: "update_card", title: "Aggiorna Card", category: "🃏 Card",
    description: "Aggiorna i campi di una card esistente.",
    params: [
      { name: "cardId",      type: "string",  required: true,  description: "ID della card" },
      { name: "name",        type: "string",  required: false, description: "Nuovo nome" },
      { name: "desc",        type: "string",  required: false, description: "Nuova descrizione" },
      { name: "due",         type: "string",  required: false, description: "Nuova scadenza ISO 8601" },
      { name: "dueComplete", type: "boolean", required: false, description: "Segna scadenza come completata" },
      { name: "idList",      type: "string",  required: false, description: "ID lista destinazione (sposta card)" },
      { name: "closed",      type: "boolean", required: false, description: "Archivia se true" },
    ],
  });
  registry.add({ name: "delete_card", title: "Elimina Card",  category: "🃏 Card",
    description: "Elimina definitivamente una card.",
    params: [{ name: "cardId", type: "string", required: true, description: "ID della card" }],
  });
  registry.add({ name: "move_card",   title: "Sposta Card",   category: "🃏 Card",
    description: "Sposta una card in un'altra lista.",
    params: [
      { name: "cardId", type: "string", required: true, description: "ID della card" },
      { name: "listId", type: "string", required: true, description: "ID lista di destinazione" },
    ],
  });
  registry.add({ name: "add_comment",  title: "Aggiungi Commento", category: "💬 Commenti",
    description: "Aggiunge un commento a una card.",
    params: [
      { name: "cardId", type: "string", required: true, description: "ID della card" },
      { name: "text",   type: "string", required: true, description: "Testo del commento" },
    ],
  });
  registry.add({ name: "get_comments", title: "Ottieni Commenti",  category: "💬 Commenti",
    description: "Commenti di una card.",
    params: [{ name: "cardId", type: "string", required: true, description: "ID della card" }],
  });
  registry.add({ name: "get_members",       title: "Ottieni Membri",       category: "👥 Membri",
    description: "Membri di una board.",
    params: [{ name: "boardId", type: "string", required: true, description: "ID della board" }],
  });
  registry.add({ name: "add_member_to_card", title: "Assegna Membro a Card", category: "👥 Membri",
    description: "Assegna un membro a una card.",
    params: [
      { name: "cardId",   type: "string", required: true, description: "ID della card" },
      { name: "memberId", type: "string", required: true, description: "ID del membro" },
    ],
  });
  registry.add({ name: "get_labels",      title: "Ottieni Etichette",      category: "🏷 Etichette",
    description: "Etichette di una board.",
    params: [{ name: "boardId", type: "string", required: true, description: "ID della board" }],
  });
  registry.add({ name: "add_label_to_card", title: "Aggiungi Etichetta a Card", category: "🏷 Etichette",
    description: "Aggiunge un'etichetta a una card.",
    params: [
      { name: "cardId",  type: "string", required: true, description: "ID della card" },
      { name: "labelId", type: "string", required: true, description: "ID dell'etichetta" },
    ],
  });
  registry.add({ name: "create_checklist", title: "Crea Checklist",           category: "✅ Checklist",
    description: "Crea una checklist su una card.",
    params: [
      { name: "cardId", type: "string", required: true, description: "ID della card" },
      { name: "name",   type: "string", required: true, description: "Nome della checklist" },
    ],
  });
  registry.add({ name: "add_check_item",   title: "Aggiungi Elemento",        category: "✅ Checklist",
    description: "Aggiunge un elemento a una checklist.",
    params: [
      { name: "checklistId", type: "string", required: true, description: "ID della checklist" },
      { name: "name",        type: "string", required: true, description: "Testo dell'elemento" },
    ],
  });
  registry.add({ name: "get_checklists",   title: "Ottieni Checklist",        category: "✅ Checklist",
    description: "Checklist di una card.",
    params: [{ name: "cardId", type: "string", required: true, description: "ID della card" }],
  });
  registry.add({ name: "search_trello", title: "Cerca su Trello", category: "🔍 Ricerca",
    description: "Cerca card e board tramite testo libero.",
    params: [{ name: "query", type: "string", required: true, description: "Termine di ricerca" }],
  });
  registry.add({ name: "get_report_operatore", title: "Report Attività Operatore ⭐", category: "👥 Operatori",
    description: "Mostra le attività raggruppate per operatore: ⚠️ scadute · 🔔 in scadenza · 🔄 in corso · ✅ completate.\nInclude tutti gli ID (card, board, lista) riutilizzabili nelle altre funzioni.",
    params: [
      { name: "operatore",         type: "string", required: false,                                                 description: "Username o nome operatore (es. 'mario.rossi'). Se omesso, mostra tutti gli operatori." },
      { name: "boardFilter",       type: "enum",   required: false, values: "`open` `closed` `all`",               description: "Board da includere (default: open)" },
      { name: "includeCompleted",  type: "boolean",required: false,                                                 description: "Includi le card completate (default: true)" },
      { name: "maxCardsPerSection",type: "number", required: false,                                                 description: "Max card per sezione per operatore (default: 20). Usa 0 per tutte." },
    ],
  });

  // ─── AUTENTICAZIONE ─────────────────────────────────────────────────────────

  server.registerTool(
    "trello_configure",
    {
      title: "Configura Credenziali Trello",
      description:
        "Salva la API Key e il Token Trello sul disco locale. " +
        "Le credenziali vengono memorizzate in modo sicuro in ~/.config/italia-digitale-mcp/credentials.json. " +
        "Puoi ottenere la tua API Key su https://trello.com/app-key e generare un Token dalla stessa pagina.",
      inputSchema: {
        apiKey: z.string().describe("Trello API Key (da https://trello.com/app-key)"),
        token: z.string().describe("Trello Token (generabile dalla pagina della API Key)"),
      },
    },
    async ({ apiKey, token }) => {
      saveCredentials({ trello: { apiKey, token } });
      return {
        content: [
          {
            type: "text",
            text: `✅ Credenziali Trello salvate in ${getCredentialsPath()}`,
          },
        ],
      };
    }
  );

  server.registerTool(
    "trello_auth_status",
    {
      title: "Stato Autenticazione Trello",
      description: "Mostra se le credenziali Trello sono configurate e da dove vengono lette.",
      inputSchema: {},
    },
    async () => {
      const creds = loadCredentials();
      const hasConfigFile = !!(creds.trello?.apiKey && creds.trello?.token);
      const hasEnv = !!(process.env.TRELLO_API_KEY && process.env.TRELLO_TOKEN);

      const lines: string[] = [];
      if (hasConfigFile) {
        lines.push(`✅ Credenziali trovate nel file di configurazione: ${getCredentialsPath()}`);
        lines.push(`   API Key: ${creds.trello!.apiKey.slice(0, 8)}${'*'.repeat(24)}`);
      } else if (hasEnv) {
        lines.push("✅ Credenziali trovate nelle variabili d'ambiente (.env).");
        lines.push(`   API Key: ${process.env.TRELLO_API_KEY!.slice(0, 8)}${'*'.repeat(24)}`);
      } else {
        lines.push("❌ Nessuna credenziale configurata.");
        lines.push("   Usa il tool `trello_configure` per impostare API Key e Token.");
        lines.push("   Ottieni le tue credenziali su: https://trello.com/app-key");
      }

      return { content: [{ type: "text", text: lines.join("\n") }] };
    }
  );

  // ─── BOARD ──────────────────────────────────────────────────────────────────

  server.registerTool(
    "get_boards",
    {
      title: "Ottieni le Board",
      description: "Restituisce le board Trello dell'utente autenticato.",
      inputSchema: {
        filter: z
          .enum(["open", "closed", "all"])
          .optional()
          .describe("Quali board restituire: 'open' (solo aperte), 'closed' (solo archiviate), 'all' (tutte). Default: 'all'"),
      },
    },
    async ({ filter }) => {
      const boards = await getBoards(filter ?? "all");
      return {
        content: [{ type: "text", text: JSON.stringify(boards, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_board",
    {
      title: "Ottieni una Board",
      description: "Restituisce i dettagli di una board specifica tramite il suo ID.",
      inputSchema: {
        boardId: z.string().describe("ID della board Trello"),
      },
    },
    async ({ boardId }) => {
      const board = await getBoard(boardId);
      return {
        content: [{ type: "text", text: JSON.stringify(board, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_board",
    {
      title: "Crea una Board",
      description: "Crea una nuova board Trello.",
      inputSchema: {
        name: z.string().describe("Nome della nuova board"),
        desc: z.string().optional().describe("Descrizione della board (opzionale)"),
      },
    },
    async ({ name, desc }) => {
      const board = await createBoard(name, desc);
      return {
        content: [{ type: "text", text: JSON.stringify(board, null, 2) }],
      };
    }
  );

  // ─── LISTE ──────────────────────────────────────────────────────────────────

  server.registerTool(
    "get_lists",
    {
      title: "Ottieni le Liste",
      description: "Restituisce tutte le liste di una board.",
      inputSchema: {
        boardId: z.string().describe("ID della board Trello"),
      },
    },
    async ({ boardId }) => {
      const lists = await getLists(boardId);
      return {
        content: [{ type: "text", text: JSON.stringify(lists, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_list",
    {
      title: "Crea una Lista",
      description: "Crea una nuova lista in una board.",
      inputSchema: {
        boardId: z.string().describe("ID della board"),
        name: z.string().describe("Nome della lista"),
      },
    },
    async ({ boardId, name }) => {
      const list = await createList(boardId, name);
      return {
        content: [{ type: "text", text: JSON.stringify(list, null, 2) }],
      };
    }
  );

  server.registerTool(
    "archive_list",
    {
      title: "Archivia una Lista",
      description: "Archivia (chiude) una lista esistente.",
      inputSchema: {
        listId: z.string().describe("ID della lista da archiviare"),
      },
    },
    async ({ listId }) => {
      const result = await archiveList(listId);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── CARD ───────────────────────────────────────────────────────────────────

  server.registerTool(
    "get_cards",
    {
      title: "Ottieni le Card",
      description: "Restituisce tutte le card di una lista.",
      inputSchema: {
        listId: z.string().describe("ID della lista"),
      },
    },
    async ({ listId }) => {
      const cards = await getCards(listId);
      return {
        content: [{ type: "text", text: JSON.stringify(cards, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_card",
    {
      title: "Ottieni una Card",
      description: "Restituisce i dettagli di una card specifica.",
      inputSchema: {
        cardId: z.string().describe("ID della card"),
      },
    },
    async ({ cardId }) => {
      const card = await getCard(cardId);
      return {
        content: [{ type: "text", text: JSON.stringify(card, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_card",
    {
      title: "Crea una Card",
      description: "Crea una nuova card in una lista.",
      inputSchema: {
        listId: z.string().describe("ID della lista in cui creare la card"),
        name: z.string().describe("Nome/titolo della card"),
        desc: z.string().optional().describe("Descrizione della card (opzionale)"),
        due: z.string().optional().describe("Data di scadenza in formato ISO 8601 (opzionale)"),
      },
    },
    async ({ listId, name, desc, due }) => {
      const card = await createCard(listId, name, desc, due);
      return {
        content: [{ type: "text", text: JSON.stringify(card, null, 2) }],
      };
    }
  );

  server.registerTool(
    "update_card",
    {
      title: "Aggiorna una Card",
      description: "Aggiorna i campi di una card esistente (nome, descrizione, scadenza, ecc.).",
      inputSchema: {
        cardId: z.string().describe("ID della card da aggiornare"),
        name: z.string().optional().describe("Nuovo nome della card"),
        desc: z.string().optional().describe("Nuova descrizione"),
        due: z.string().optional().describe("Nuova data di scadenza (ISO 8601)"),
        dueComplete: z.boolean().optional().describe("Segna la scadenza come completata"),
        idList: z.string().optional().describe("ID della lista di destinazione (per spostare la card)"),
        closed: z.boolean().optional().describe("Archivia la card se true"),
      },
    },
    async ({ cardId, ...fields }) => {
      const card = await updateCard(cardId, fields);
      return {
        content: [{ type: "text", text: JSON.stringify(card, null, 2) }],
      };
    }
  );

  server.registerTool(
    "delete_card",
    {
      title: "Elimina una Card",
      description: "Elimina definitivamente una card.",
      inputSchema: {
        cardId: z.string().describe("ID della card da eliminare"),
      },
    },
    async ({ cardId }) => {
      const result = await deleteCard(cardId);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    "move_card",
    {
      title: "Sposta una Card",
      description: "Sposta una card in un'altra lista.",
      inputSchema: {
        cardId: z.string().describe("ID della card da spostare"),
        listId: z.string().describe("ID della lista di destinazione"),
      },
    },
    async ({ cardId, listId }) => {
      const card = await moveCard(cardId, listId);
      return {
        content: [{ type: "text", text: JSON.stringify(card, null, 2) }],
      };
    }
  );

  // ─── COMMENTI ───────────────────────────────────────────────────────────────

  server.registerTool(
    "add_comment",
    {
      title: "Aggiungi un Commento",
      description: "Aggiunge un commento a una card.",
      inputSchema: {
        cardId: z.string().describe("ID della card"),
        text: z.string().describe("Testo del commento"),
      },
    },
    async ({ cardId, text }) => {
      const comment = await addComment(cardId, text);
      return {
        content: [{ type: "text", text: JSON.stringify(comment, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_comments",
    {
      title: "Ottieni i Commenti",
      description: "Restituisce tutti i commenti di una card.",
      inputSchema: {
        cardId: z.string().describe("ID della card"),
      },
    },
    async ({ cardId }) => {
      const comments = await getComments(cardId);
      return {
        content: [{ type: "text", text: JSON.stringify(comments, null, 2) }],
      };
    }
  );

  // ─── MEMBRI ─────────────────────────────────────────────────────────────────

  server.registerTool(
    "get_members",
    {
      title: "Ottieni i Membri",
      description: "Restituisce i membri di una board.",
      inputSchema: {
        boardId: z.string().describe("ID della board"),
      },
    },
    async ({ boardId }) => {
      const members = await getMembers(boardId);
      return {
        content: [{ type: "text", text: JSON.stringify(members, null, 2) }],
      };
    }
  );

  server.registerTool(
    "add_member_to_card",
    {
      title: "Assegna Membro a Card",
      description: "Assegna un membro a una card.",
      inputSchema: {
        cardId: z.string().describe("ID della card"),
        memberId: z.string().describe("ID del membro da assegnare"),
      },
    },
    async ({ cardId, memberId }) => {
      const result = await addMemberToCard(cardId, memberId);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── LABEL ──────────────────────────────────────────────────────────────────

  server.registerTool(
    "get_labels",
    {
      title: "Ottieni le Label",
      description: "Restituisce tutte le label di una board.",
      inputSchema: {
        boardId: z.string().describe("ID della board"),
      },
    },
    async ({ boardId }) => {
      const labels = await getLabels(boardId);
      return {
        content: [{ type: "text", text: JSON.stringify(labels, null, 2) }],
      };
    }
  );

  server.registerTool(
    "add_label_to_card",
    {
      title: "Aggiungi Label a Card",
      description: "Aggiunge una label a una card.",
      inputSchema: {
        cardId: z.string().describe("ID della card"),
        labelId: z.string().describe("ID della label da aggiungere"),
      },
    },
    async ({ cardId, labelId }) => {
      const result = await addLabelToCard(cardId, labelId);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── CHECKLIST ──────────────────────────────────────────────────────────────

  server.registerTool(
    "get_checklists",
    {
      title: "Ottieni le Checklist",
      description: "Restituisce tutte le checklist di una card.",
      inputSchema: {
        cardId: z.string().describe("ID della card"),
      },
    },
    async ({ cardId }) => {
      const checklists = await getChecklists(cardId);
      return {
        content: [{ type: "text", text: JSON.stringify(checklists, null, 2) }],
      };
    }
  );

  server.registerTool(
    "create_checklist",
    {
      title: "Crea una Checklist",
      description: "Crea una nuova checklist su una card.",
      inputSchema: {
        cardId: z.string().describe("ID della card"),
        name: z.string().describe("Nome della checklist"),
      },
    },
    async ({ cardId, name }) => {
      const checklist = await createChecklist(cardId, name);
      return {
        content: [{ type: "text", text: JSON.stringify(checklist, null, 2) }],
      };
    }
  );

  server.registerTool(
    "add_check_item",
    {
      title: "Aggiungi Elemento a Checklist",
      description: "Aggiunge un nuovo elemento a una checklist.",
      inputSchema: {
        checklistId: z.string().describe("ID della checklist"),
        name: z.string().describe("Testo dell'elemento"),
      },
    },
    async ({ checklistId, name }) => {
      const item = await addCheckItem(checklistId, name);
      return {
        content: [{ type: "text", text: JSON.stringify(item, null, 2) }],
      };
    }
  );

  // ─── RICERCA ────────────────────────────────────────────────────────────────

  server.registerTool(
    "search_trello",
    {
      title: "Cerca su Trello",
      description: "Cerca card e board su Trello tramite una query testuale.",
      inputSchema: {
        query: z.string().describe("Termine di ricerca"),
      },
    },
    async ({ query }) => {
      const results = await searchTrello(query);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  // ─── PANORAMICA ─────────────────────────────────────────────────────────────

  server.registerTool(
    "get_overview",
    {
      title: "Panoramica Board",
      description:
        "Restituisce una vista riepilogativa di tutte le board con le relative liste e card aperte. " +
        "Mostra per ogni card: titolo, etichette, data di scadenza (con indicatori visivi per card scadute o in scadenza) e operatori assegnati. " +
        "Supporta filtri per operatore, etichetta e stato scadenza.",
      inputSchema: {
        boardFilter: z
          .enum(["open", "closed", "all"])
          .optional()
          .describe("Quali board includere: 'open' (default), 'closed', 'all'"),
        memberUsername: z
          .string()
          .optional()
          .describe("Filtra le card per nome o username dell'operatore assegnato"),
        labelName: z
          .string()
          .optional()
          .describe("Filtra le card per nome o colore dell'etichetta"),
        dueStatus: z
          .enum(["all", "overdue", "due_soon", "complete", "no_due"])
          .optional()
          .describe(
            "Filtra per stato scadenza: " +
            "'overdue' (scadute), 'due_soon' (scadono entro 7 giorni), " +
            "'complete' (completate), 'no_due' (senza scadenza), 'all' (tutte, default)"
          ),
        maxCardsPerList: z
          .number()
          .optional()
          .describe("Numero massimo di card per lista (default: 5). Usa 0 per mostrare tutte."),
      },
    },
    async ({ boardFilter, memberUsername, labelName, dueStatus, maxCardsPerList }) => {
      const overviews = await getBoardOverview(boardFilter ?? "open");
      const now = new Date();
      const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const limit = maxCardsPerList === 0 ? Infinity : (maxCardsPerList ?? 5);

      const lines: string[] = [];
      let totalBoards = 0;
      let totalCards = 0;

      for (const board of overviews) {
        const boardLines: string[] = [];

        for (const list of board.lists) {
          let cards = list.cards;

          // Filtro operatore
          if (memberUsername) {
            const q = memberUsername.toLowerCase();
            cards = cards.filter((c) =>
              c.members.some(
                (m) =>
                  m.username.toLowerCase().includes(q) ||
                  m.fullName.toLowerCase().includes(q)
              )
            );
          }

          // Filtro etichetta
          if (labelName) {
            const q = labelName.toLowerCase();
            cards = cards.filter((c) =>
              c.labels.some(
                (l) =>
                  l.name.toLowerCase().includes(q) ||
                  l.color.toLowerCase().includes(q)
              )
            );
          }

          // Filtro stato scadenza
          const status = dueStatus ?? "all";
          if (status !== "all") {
            cards = cards.filter((c) => {
              if (status === "no_due") return !c.due;
              if (status === "complete") return c.dueComplete;
              if (!c.due) return false;
              const d = new Date(c.due);
              if (status === "overdue") return !c.dueComplete && d < now;
              if (status === "due_soon") return !c.dueComplete && d >= now && d <= soon;
              return true;
            });
          }

          if (cards.length === 0) continue;

          const shown = isFinite(limit) ? cards.slice(0, limit) : cards;
          const hidden = cards.length - shown.length;
          totalCards += cards.length;

          boardLines.push(`  📋 ${list.name} (${cards.length})`);

          for (const card of shown) {
            const labelStr = card.labels
              .map((l) => `[${l.name || l.color}]`)
              .join(" ");
            const memberStr = card.members
              .map((m) => `@${m.username}`)
              .join(", ");

            let dueStr = "";
            if (card.due) {
              const d = new Date(card.due);
              const fmt = d.toLocaleDateString("it-IT");
              if (card.dueComplete) dueStr = `✅ ${fmt}`;
              else if (d < now) dueStr = `⚠️ SCADUTA ${fmt}`;
              else if (d <= soon) dueStr = `🔔 ${fmt}`;
              else dueStr = `📅 ${fmt}`;
            }

            const parts = [card.name, labelStr, dueStr, memberStr].filter(Boolean);
            boardLines.push(`    • ${parts.join("  ")}`);
          }

          if (hidden > 0) {
            boardLines.push(`    … +${hidden} altre card (usa maxCardsPerList:0 per vedere tutte)`);
          }
        }

        if (boardLines.length > 0) {
          totalBoards++;
          lines.push(`🗂 ${board.name}`);
          lines.push(...boardLines);
          lines.push("");
        }
      }

      if (lines.length === 0) {
        return {
          content: [
            { type: "text", text: "Nessuna card trovata con i filtri selezionati." },
          ],
        };
      }

      const header = `📊 Panoramica: ${totalBoards} board · ${totalCards} card${isFinite(limit) ? ` (max ${limit} per lista)` : ""}\n${"─".repeat(48)}\n`;
      return { content: [{ type: "text", text: header + lines.join("\n") }] };
    }
  );

  // ─── REPORT OPERATORE ───────────────────────────────────────────────────────

  server.registerTool(
    "get_report_operatore",
    {
      title: "Report Attività per Operatore",
      description:
        "Mostra le attività raggruppate per operatore con tutte le sezioni: scadute, in scadenza, in corso e completate. " +
        "Per ogni card vengono riportati: titolo, etichette, data di scadenza e gli ID di card/board/lista " +
        "direttamente riutilizzabili nelle altre funzioni (update_card, move_card, add_comment, ecc.).",
      inputSchema: {
        operatore: z
          .string()
          .optional()
          .describe("Username o nome dell'operatore (es. 'mario.rossi'). Se omesso mostra tutti gli operatori."),
        boardFilter: z
          .enum(["open", "closed", "all"])
          .optional()
          .describe("Board da includere: 'open' (default), 'closed', 'all'"),
        includeCompleted: z
          .boolean()
          .optional()
          .describe("Includi le card con scadenza completata (default: true)"),
        maxCardsPerSection: z
          .number()
          .optional()
          .describe("Numero massimo di card per sezione per operatore (default: 20). Usa 0 per mostrare tutte."),
      },
    },
    async ({ operatore, boardFilter, includeCompleted, maxCardsPerSection }) => {
      const overviews = await getBoardOverview(boardFilter ?? "open");
      const now = new Date();
      const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const sectionLimit = maxCardsPerSection === 0 ? Infinity : (maxCardsPerSection ?? 20);
      const showCompleted = includeCompleted !== false;

      // Arricchisce ogni card con il contesto di board
      interface CardWithCtx {
        id: string;
        name: string;
        due: string | null;
        dueComplete: boolean;
        labels: { id: string; name: string; color: string }[];
        members: MemberRef[];
        listId: string;
        listName: string;
        boardId: string;
        boardName: string;
        url: string;
      }

      // Raggruppa per membro
      const memberMap = new Map<string, { ref: MemberRef; cards: CardWithCtx[] }>();

      for (const board of overviews) {
        for (const list of board.lists) {
          for (const card of list.cards) {
            const enriched: CardWithCtx = {
              id: card.id,
              name: card.name,
              due: card.due,
              dueComplete: card.dueComplete,
              labels: card.labels,
              members: card.members,
              listId: card.listId,
              listName: card.listName,
              boardId: board.id,
              boardName: board.name,
              url: card.url,
            };
            for (const member of card.members) {
              if (!memberMap.has(member.id)) {
                memberMap.set(member.id, { ref: member, cards: [] });
              }
              memberMap.get(member.id)!.cards.push(enriched);
            }
          }
        }
      }

      // Filtra per operatore se specificato
      let members = [...memberMap.values()].sort((a, b) =>
        a.ref.fullName.localeCompare(b.ref.fullName)
      );
      if (operatore) {
        const q = operatore.toLowerCase();
        members = members.filter(
          (m) =>
            m.ref.username.toLowerCase().includes(q) ||
            m.ref.fullName.toLowerCase().includes(q)
        );
        if (members.length === 0) {
          return {
            content: [
              { type: "text", text: `Nessun operatore trovato con il filtro "${operatore}".` },
            ],
          };
        }
      }

      if (members.length === 0) {
        return {
          content: [{ type: "text", text: "Nessuna card assegnata trovata." }],
        };
      }

      // Formatta una card con ID e contesto
      const formatCard = (card: CardWithCtx): string[] => {
        const labelStr = card.labels.map((l) => `[${l.name || l.color}]`).join(" ");
        let dueStr = "";
        if (card.due) {
          const d = new Date(card.due);
          const fmt = d.toLocaleDateString("it-IT");
          if (card.dueComplete)      dueStr = `✅ ${fmt}`;
          else if (d < now)          dueStr = `⚠️ SCADUTA ${fmt}`;
          else if (d <= soon)        dueStr = `🔔 ${fmt}`;
          else                       dueStr = `📅 ${fmt}`;
        }
        const titleParts = [card.name, labelStr, dueStr].filter(Boolean);
        return [
          `     • ${titleParts.join("  ")}`,
          `       🗂 ${card.boardName}  ›  📋 ${card.listName}`,
          `       🆔 card:${card.id}  board:${card.boardId}  lista:${card.listId}`,
        ];
      };

      // Renderizza una sezione (scadute, in scadenza, ecc.)
      const renderSection = (
        emoji: string,
        title: string,
        sectionCards: CardWithCtx[],
        out: string[]
      ): void => {
        if (sectionCards.length === 0) return;
        const shown = isFinite(sectionLimit) ? sectionCards.slice(0, sectionLimit) : sectionCards;
        const hidden = sectionCards.length - shown.length;
        out.push(`\n   ${emoji} ${title} (${sectionCards.length})`);
        for (const card of shown) out.push(...formatCard(card));
        if (hidden > 0) {
          out.push(`     … +${hidden} altre (usa maxCardsPerSection:0 per vedere tutte)`);
        }
      };

      const lines: string[] = [];

      for (const { ref, cards } of members) {
        const overdue    = cards.filter((c) => c.due && !c.dueComplete && new Date(c.due) < now);
        const dueSoon    = cards.filter((c) => c.due && !c.dueComplete && new Date(c.due) >= now && new Date(c.due) <= soon);
        const inProgress = cards.filter((c) => !c.dueComplete && (!c.due || new Date(c.due) > soon));
        const completed  = cards.filter((c) => c.dueComplete);

        const summaryParts = [
          overdue.length    > 0 ? `${overdue.length} scadute`                 : null,
          dueSoon.length    > 0 ? `${dueSoon.length} in scadenza`             : null,
          inProgress.length > 0 ? `${inProgress.length} in corso`             : null,
          showCompleted && completed.length > 0 ? `${completed.length} completate` : null,
        ].filter(Boolean);

        lines.push(`👤 ${ref.fullName} (@${ref.username})`);
        lines.push(`   🆔 Member ID: ${ref.id}`);
        lines.push(`   📊 ${summaryParts.join(" · ") || "nessuna attività assegnata"}`);

        renderSection("⚠️",  "SCADUTE",                   overdue,    lines);
        renderSection("🔔",  "IN SCADENZA (entro 7 giorni)", dueSoon, lines);
        renderSection("🔄",  "IN CORSO",                  inProgress, lines);
        if (showCompleted) renderSection("✅", "COMPLETATE", completed, lines);

        lines.push("\n" + "─".repeat(48));
      }

      const total = members.length;
      const header =
        `📋 Report Attività — ${total} operator${total === 1 ? "e" : "i"}\n` +
        `${"═".repeat(48)}\n\n`;
      return { content: [{ type: "text", text: header + lines.join("\n") }] };
    }
  );
}

