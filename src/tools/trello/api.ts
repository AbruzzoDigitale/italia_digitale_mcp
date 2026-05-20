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

async function fetchBoardData(
  client: AxiosInstance,
  board: { id: string; name: string; url: string }
): Promise<BoardOverview> {
  const [listsRaw, cardsRaw, membersRaw] = await Promise.all([
    client
      .get(`/boards/${board.id}/lists`, {
        params: { fields: "id,name", filter: "open" },
      })
      .then((r) => r.data),
    client
      .get(`/boards/${board.id}/cards`, {
        params: {
          fields: "id,name,due,dueComplete,labels,idMembers,idList,url",
          filter: "open",
        },
      })
      .then((r) => r.data),
    client
      .get(`/boards/${board.id}/members`, {
        params: { fields: "id,username,fullName" },
      })
      .then((r) => r.data),
  ]);

  const memberMap: Record<string, MemberRef> = {};
  for (const m of membersRaw) {
    memberMap[m.id] = { id: m.id, username: m.username, fullName: m.fullName };
  }

  const lists: ListOverview[] = listsRaw.map(
    (list: { id: string; name: string }) => ({
      id: list.id,
      name: list.name,
      cards: cardsRaw
        .filter((c: { idList: string }) => c.idList === list.id)
        .map(
          (c: {
            id: string;
            name: string;
            due: string | null;
            dueComplete: boolean;
            labels: { id: string; name: string; color: string }[];
            idMembers: string[];
            url: string;
          }) => ({
            id: c.id,
            name: c.name,
            due: c.due ?? null,
            dueComplete: c.dueComplete ?? false,
            labels: c.labels ?? [],
            members: (c.idMembers ?? []).map(
              (mid) =>
                memberMap[mid] ?? { id: mid, username: mid, fullName: mid }
            ),
            listId: list.id,
            listName: list.name,
            url: c.url,
          })
        ),
    })
  );

  return { id: board.id, name: board.name, url: board.url, lists };
}

export async function getBoardOverview(
  boardFilter: "open" | "closed" | "all" = "open"
): Promise<BoardOverview[]> {
  const client = getClient();
  const boards: { id: string; name: string; url: string }[] =
    await getBoards(boardFilter);

  const overviews: BoardOverview[] = [];
  for (let i = 0; i < boards.length; i++) {
    if (i > 0) await delay(300);
    overviews.push(await fetchBoardData(client, boards[i]));
  }

  return overviews;
}
