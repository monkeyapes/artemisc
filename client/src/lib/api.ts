const API_BASE = "/api";

let token: string | null = localStorage.getItem("token");

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}

export function getToken() {
  return token;
}

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; username: string; displayName?: string }) =>
      request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    me: () => request("/auth/me"),
  },
  users: {
    search: (q: string) => request(`/users/search?q=${encodeURIComponent(q)}`),
    get: (id: string) => request(`/users/${id}`),
    updateProfile: (body: { displayName?: string; avatarUrl?: string }) =>
      request("/users/profile", { method: "PATCH", body: JSON.stringify(body) }),
    setFcmToken: (fcmToken: string) =>
      request("/users/fcm-token", { method: "POST", body: JSON.stringify({ fcmToken }) }),
  },
  contacts: {
    list: () => request("/contacts"),
    add: (contactId: string) =>
      request("/contacts/add", { method: "POST", body: JSON.stringify({ contactId }) }),
    remove: (id: string) => request(`/contacts/${id}`, { method: "DELETE" }),
  },
  chats: {
    list: () => request("/chats"),
    get: (id: string) => request(`/chats/${id}`),
    createDirect: (participantIds: string[]) =>
      request("/chats/direct", { method: "POST", body: JSON.stringify({ participantIds }) }),
    createGroup: (name: string, participantIds: string[]) =>
      request("/chats/group", { method: "POST", body: JSON.stringify({ name, participantIds }) }),
    addMembers: (chatId: string, userIds: string[]) =>
      request(`/chats/${chatId}/members`, { method: "POST", body: JSON.stringify({ userIds }) }),
    removeMember: (chatId: string, userId: string) =>
      request(`/chats/${chatId}/members/${userId}`, { method: "DELETE" }),
  },
  messages: {
    list: (chatId: string, cursor?: string) =>
      request(`/messages/${chatId}${cursor ? `?cursor=${cursor}` : ""}`),
    send: (body: { chatId: string; content?: string; type?: string; mediaUrl?: string }) =>
      request("/messages", { method: "POST", body: JSON.stringify(body) }),
    markRead: (messageId: string) =>
      request(`/messages/read/${messageId}`, { method: "POST" }),
  },
};
