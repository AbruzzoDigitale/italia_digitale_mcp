import axios, { AxiosInstance } from "axios";
import dotenv from "dotenv";
import { loadCredentials } from "../../config.js";

dotenv.config();

const BASE_URL = "https://api.trello.com/1";

function getAuthParams(): { key: string; token: string } {
  // 1. Config file (impostato tramite tool trello_configure)
  const creds = loadCredentials();
  if (creds.trello?.apiKey && creds.trello?.token) {
    return { key: creds.trello.apiKey, token: creds.trello.token };
  }
  // 2. Fallback: variabili d'ambiente
  const key = process.env.TRELLO_API_KEY;
  const token = process.env.TRELLO_TOKEN;
  if (!key || !token) {
    throw new Error(
      "Credenziali Trello non configurate. " +
      "Usa il tool `trello_configure` oppure imposta TRELLO_API_KEY e TRELLO_TOKEN nel file .env."
    );
  }
  return { key, token };
}

function getClient(): AxiosInstance {
  return axios.create({ baseURL: BASE_URL, params: getAuthParams() });
}

// ─── BOARD ────────────────────────────────────────────────────────────────────

export async function getBoards() {
  const res = await getClient().get("/members/me/boards", {
    params: { fields: "id,name,desc,url,closed" },
  });
  return res.data;
}

export async function getBoard(boardId: string) {
  const res = await getClient().get(`/boards/${boardId}`, {
    params: { fields: "id,name,desc,url,closed" },
  });
  return res.data;
}

export async function createBoard(name: string, desc?: string) {
  const res = await getClient().post("/boards", null, {
    params: { name, desc, defaultLists: false },
  });
  return res.data;
}

// ─── LISTS ────────────────────────────────────────────────────────────────────

export async function getLists(boardId: string) {
  const res = await getClient().get(`/boards/${boardId}/lists`, {
    params: { fields: "id,name,closed" },
  });
  return res.data;
}

export async function createList(boardId: string, name: string) {
  const res = await getClient().post("/lists", null, {
    params: { idBoard: boardId, name },
  });
  return res.data;
}

export async function archiveList(listId: string) {
  const res = await getClient().put(`/lists/${listId}/closed`, null, {
    params: { value: true },
  });
  return res.data;
}

// ─── CARDS ────────────────────────────────────────────────────────────────────

export async function getCards(listId: string) {
  const res = await getClient().get(`/lists/${listId}/cards`, {
    params: { fields: "id,name,desc,due,dueComplete,labels,url,idMembers" },
  });
  return res.data;
}

export async function getCard(cardId: string) {
  const res = await getClient().get(`/cards/${cardId}`, {
    params: { fields: "id,name,desc,due,dueComplete,labels,url,idMembers,idList,idBoard" },
  });
  return res.data;
}

export async function createCard(
  listId: string,
  name: string,
  desc?: string,
  due?: string
) {
  const res = await getClient().post("/cards", null, {
    params: { idList: listId, name, desc, due },
  });
  return res.data;
}

export async function updateCard(
  cardId: string,
  fields: {
    name?: string;
    desc?: string;
    due?: string;
    dueComplete?: boolean;
    idList?: string;
    closed?: boolean;
  }
) {
  const res = await getClient().put(`/cards/${cardId}`, null, {
    params: fields,
  });
  return res.data;
}

export async function deleteCard(cardId: string) {
  const res = await getClient().delete(`/cards/${cardId}`);
  return res.data;
}

export async function moveCard(cardId: string, listId: string) {
  const res = await getClient().put(`/cards/${cardId}`, null, {
    params: { idList: listId },
  });
  return res.data;
}

// ─── COMMENTI ─────────────────────────────────────────────────────────────────

export async function addComment(cardId: string, text: string) {
  const res = await getClient().post(`/cards/${cardId}/actions/comments`, null, {
    params: { text },
  });
  return res.data;
}

export async function getComments(cardId: string) {
  const res = await getClient().get(`/cards/${cardId}/actions`, {
    params: { filter: "commentCard" },
  });
  return res.data;
}

// ─── MEMBRI ───────────────────────────────────────────────────────────────────

export async function getMembers(boardId: string) {
  const res = await getClient().get(`/boards/${boardId}/members`, {
    params: { fields: "id,username,fullName,email" },
  });
  return res.data;
}

export async function addMemberToCard(cardId: string, memberId: string) {
  const res = await getClient().post(`/cards/${cardId}/idMembers`, null, {
    params: { value: memberId },
  });
  return res.data;
}

// ─── LABEL ────────────────────────────────────────────────────────────────────

export async function getLabels(boardId: string) {
  const res = await getClient().get(`/boards/${boardId}/labels`);
  return res.data;
}

export async function addLabelToCard(cardId: string, labelId: string) {
  const res = await getClient().post(`/cards/${cardId}/idLabels`, null, {
    params: { value: labelId },
  });
  return res.data;
}

// ─── CHECKLIST ────────────────────────────────────────────────────────────────

export async function createChecklist(cardId: string, name: string) {
  const res = await getClient().post("/checklists", null, {
    params: { idCard: cardId, name },
  });
  return res.data;
}

export async function addCheckItem(checklistId: string, name: string) {
  const res = await getClient().post(`/checklists/${checklistId}/checkItems`, null, {
    params: { name },
  });
  return res.data;
}

export async function getChecklists(cardId: string) {
  const res = await getClient().get(`/cards/${cardId}/checklists`);
  return res.data;
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────

export async function searchTrello(query: string) {
  const res = await getClient().get("/search", {
    params: { query, modelTypes: "cards,boards", cards_limit: 20, boards_limit: 5 },
  });
  return res.data;
}
