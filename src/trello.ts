import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const BASE_URL = "https://api.trello.com/1";

if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
  throw new Error("TRELLO_API_KEY e TRELLO_TOKEN devono essere impostati nel file .env");
}

const authParams = {
  key: TRELLO_API_KEY,
  token: TRELLO_TOKEN,
};

export const trelloClient = axios.create({
  baseURL: BASE_URL,
  params: authParams,
});

// ─── BOARD ────────────────────────────────────────────────────────────────────

export async function getBoards() {
  const res = await trelloClient.get("/members/me/boards", {
    params: { fields: "id,name,desc,url,closed" },
  });
  return res.data;
}

export async function getBoard(boardId: string) {
  const res = await trelloClient.get(`/boards/${boardId}`, {
    params: { fields: "id,name,desc,url,closed" },
  });
  return res.data;
}

export async function createBoard(name: string, desc?: string) {
  const res = await trelloClient.post("/boards", null, {
    params: { name, desc, defaultLists: false },
  });
  return res.data;
}

// ─── LISTS ────────────────────────────────────────────────────────────────────

export async function getLists(boardId: string) {
  const res = await trelloClient.get(`/boards/${boardId}/lists`, {
    params: { fields: "id,name,closed" },
  });
  return res.data;
}

export async function createList(boardId: string, name: string) {
  const res = await trelloClient.post("/lists", null, {
    params: { idBoard: boardId, name },
  });
  return res.data;
}

export async function archiveList(listId: string) {
  const res = await trelloClient.put(`/lists/${listId}/closed`, null, {
    params: { value: true },
  });
  return res.data;
}

// ─── CARDS ────────────────────────────────────────────────────────────────────

export async function getCards(listId: string) {
  const res = await trelloClient.get(`/lists/${listId}/cards`, {
    params: { fields: "id,name,desc,due,dueComplete,labels,url,idMembers" },
  });
  return res.data;
}

export async function getCard(cardId: string) {
  const res = await trelloClient.get(`/cards/${cardId}`, {
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
  const res = await trelloClient.post("/cards", null, {
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
  const res = await trelloClient.put(`/cards/${cardId}`, null, {
    params: fields,
  });
  return res.data;
}

export async function deleteCard(cardId: string) {
  const res = await trelloClient.delete(`/cards/${cardId}`);
  return res.data;
}

export async function moveCard(cardId: string, listId: string) {
  const res = await trelloClient.put(`/cards/${cardId}`, null, {
    params: { idList: listId },
  });
  return res.data;
}

// ─── COMMENTI ─────────────────────────────────────────────────────────────────

export async function addComment(cardId: string, text: string) {
  const res = await trelloClient.post(`/cards/${cardId}/actions/comments`, null, {
    params: { text },
  });
  return res.data;
}

export async function getComments(cardId: string) {
  const res = await trelloClient.get(`/cards/${cardId}/actions`, {
    params: { filter: "commentCard" },
  });
  return res.data;
}

// ─── MEMBRI ───────────────────────────────────────────────────────────────────

export async function getMembers(boardId: string) {
  const res = await trelloClient.get(`/boards/${boardId}/members`, {
    params: { fields: "id,username,fullName,email" },
  });
  return res.data;
}

export async function addMemberToCard(cardId: string, memberId: string) {
  const res = await trelloClient.post(`/cards/${cardId}/idMembers`, null, {
    params: { value: memberId },
  });
  return res.data;
}

// ─── LABEL ────────────────────────────────────────────────────────────────────

export async function getLabels(boardId: string) {
  const res = await trelloClient.get(`/boards/${boardId}/labels`);
  return res.data;
}

export async function addLabelToCard(cardId: string, labelId: string) {
  const res = await trelloClient.post(`/cards/${cardId}/idLabels`, null, {
    params: { value: labelId },
  });
  return res.data;
}

// ─── CHECKLIST ────────────────────────────────────────────────────────────────

export async function createChecklist(cardId: string, name: string) {
  const res = await trelloClient.post("/checklists", null, {
    params: { idCard: cardId, name },
  });
  return res.data;
}

export async function addCheckItem(checklistId: string, name: string) {
  const res = await trelloClient.post(`/checklists/${checklistId}/checkItems`, null, {
    params: { name },
  });
  return res.data;
}

export async function getChecklists(cardId: string) {
  const res = await trelloClient.get(`/cards/${cardId}/checklists`);
  return res.data;
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────

export async function searchTrello(query: string) {
  const res = await trelloClient.get("/search", {
    params: { query, modelTypes: "cards,boards", cards_limit: 20, boards_limit: 5 },
  });
  return res.data;
}
