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

export async function getBoards(filter: "open" | "closed" | "all" = "all") {
  const client = getClient();

  // 1. Board dove l'utente è membro diretto
  const memberBoards = await client.get("/members/me/boards", {
    params: { fields: "id,name,desc,url,closed", filter },
  });

  // 2. Board delle organizzazioni/workspace a cui l'utente appartiene
  const orgsRes = await client.get("/members/me/organizations", {
    params: { fields: "id,name" },
  });
  const orgBoards = await Promise.all(
    orgsRes.data.map((org: { id: string }) =>
      client
        .get(`/organizations/${org.id}/boards`, {
          params: { fields: "id,name,desc,url,closed", filter },
        })
        .then((r) => r.data)
    )
  );

  // 3. Unione e deduplicazione per ID
  const allBoards = [
    ...memberBoards.data,
    ...orgBoards.flat(),
  ];
  const seen = new Set<string>();
  return allBoards.filter((b: { id: string }) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  });
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

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────

export interface MemberRef {
  id: string;
  username: string;
  fullName: string;
}

export interface CardOverview {
  id: string;
  name: string;
  due: string | null;
  dueComplete: boolean;
  labels: { id: string; name: string; color: string }[];
  members: MemberRef[];
  listId: string;
  listName: string;
  url: string;
}

export interface ListOverview {
  id: string;
  name: string;
  cards: CardOverview[];
}

export interface BoardOverview {
  id: string;
  name: string;
  url: string;
  lists: ListOverview[];
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Singola chiamata per board: lists + cards + members in un unico round-trip
async function fetchBoardData(
  client: AxiosInstance,
  board: { id: string; name: string; url: string },
  retries = 2
): Promise<BoardOverview> {
  try {
    const res = await client.get(`/boards/${board.id}`, {
      params: {
        cards:        "open",
        card_fields:  "id,name,due,dueComplete,labels,idMembers,idList,url",
        lists:        "open",
        list_fields:  "id,name",
        members:      "all",
        member_fields:"id,username,fullName",
        fields:       "id,name,url",
      },
    });
    const data = res.data;

    const memberMap: Record<string, MemberRef> = {};
    for (const m of data.members ?? []) {
      memberMap[m.id] = { id: m.id, username: m.username, fullName: m.fullName };
    }

    const listsRaw: { id: string; name: string }[] = data.lists ?? [];
    const cardsRaw: {
      id: string; name: string; due: string | null; dueComplete: boolean;
      labels: { id: string; name: string; color: string }[];
      idMembers: string[]; idList: string; url: string;
    }[] = data.cards ?? [];

    const lists: ListOverview[] = listsRaw.map((list) => ({
      id: list.id,
      name: list.name,
      cards: cardsRaw
        .filter((c) => c.idList === list.id)
        .map((c) => ({
          id: c.id,
          name: c.name,
          due: c.due ?? null,
          dueComplete: c.dueComplete ?? false,
          labels: c.labels ?? [],
          members: (c.idMembers ?? []).map(
            (mid) => memberMap[mid] ?? { id: mid, username: mid, fullName: mid }
          ),
          listId: list.id,
          listName: list.name,
          url: c.url,
        })),
    }));

    return { id: board.id, name: board.name, url: board.url, lists };
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 429 && retries > 0) {
      await delay(1000);
      return fetchBoardData(client, board, retries - 1);
    }
    throw err;
  }
}

export async function getBoardOverview(
  boardFilter: "open" | "closed" | "all" = "open"
): Promise<BoardOverview[]> {
  const client = getClient();
  const boards: { id: string; name: string; url: string }[] =
    await getBoards(boardFilter);

  // Tutte le board in parallelo — 1 chiamata per board (lista + card + membri)
  const results = await Promise.allSettled(
    boards.map((board) => fetchBoardData(client, board))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<BoardOverview> => r.status === "fulfilled")
    .map((r) => r.value);
}
