import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
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
} from "./trello.js";

const server = new McpServer({
  name: "trello-mcp-server",
  version: "1.0.0",
});

// ─── BOARD ────────────────────────────────────────────────────────────────────

server.registerTool(
  "get_boards",
  {
    title: "Ottieni le Board",
    description: "Restituisce tutte le board Trello dell'utente autenticato.",
    inputSchema: {},
  },
  async () => {
    const boards = await getBoards();
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

// ─── LISTE ────────────────────────────────────────────────────────────────────

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

// ─── CARD ─────────────────────────────────────────────────────────────────────

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

// ─── COMMENTI ─────────────────────────────────────────────────────────────────

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

// ─── MEMBRI ───────────────────────────────────────────────────────────────────

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

// ─── LABEL ────────────────────────────────────────────────────────────────────

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

// ─── CHECKLIST ────────────────────────────────────────────────────────────────

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

// ─── RICERCA ──────────────────────────────────────────────────────────────────

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

// ─── AVVIO ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Trello MCP Server avviato con successo!");
}

main().catch((err) => {
  console.error("❌ Errore avvio server:", err);
  process.exit(1);
});
