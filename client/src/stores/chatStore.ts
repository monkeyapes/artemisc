import { create } from "zustand";
import { Chat, Message } from "../types";
import { api } from "../lib/api";

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  loading: boolean;
  loadChats: () => Promise<void>;
  setActiveChat: (chat: Chat | null) => void;
  addMessage: (message: Message) => void;
  addMessages: (chatId: string, messages: Message[]) => void;
  setTyping: (chatId: string, userId: string, typing: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},
  typingUsers: {},
  loading: false,

  loadChats: async () => {
    set({ loading: true });
    try {
      const res = await api.chats.list();
      set({ chats: res.chats, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setActiveChat: (chat) => {
    set({ activeChat: chat });
    if (chat && !get().messages[chat.id]) {
      api.messages.list(chat.id).then((res) => {
        set((s) => ({ messages: { ...s.messages, [chat.id]: res.messages.reverse() } }));
      });
    }
  },

  addMessage: (message) => {
    set((state) => {
      const existing = state.messages[message.chatId] || [];
      const hasDuplicate = existing.some((m) => m.id === message.id);
      if (hasDuplicate) return state;

      const updated = { ...state.messages, [message.chatId]: [...existing, message] };
      const chatIndex = state.chats.findIndex((c) => c.id === message.chatId);
      const chats = [...state.chats];
      if (chatIndex >= 0) {
        chats[chatIndex] = { ...chats[chatIndex], lastMessage: message };
        chats.sort((a, b) => new Date(b.lastMessage?.createdAt || 0).getTime() - new Date(a.lastMessage?.createdAt || 0).getTime());
      }
      return { messages: updated, chats };
    });
  },

  addMessages: (chatId, messages) => {
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
    }));
  },

  setTyping: (chatId, userId, typing) => {
    set((state) => {
      const current = state.typingUsers[chatId] || [];
      const updated = typing
        ? [...new Set([...current, userId])]
        : current.filter((id) => id !== userId);
      return { typingUsers: { ...state.typingUsers, [chatId]: updated } };
    });
  },
}));
