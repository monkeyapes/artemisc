import { create } from "zustand";
import { User } from "../types";
import { api, setToken } from "../lib/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, displayName?: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.auth.login({ email, password });
      setToken(res.token);
      set({ user: res.user, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  register: async (email, password, username, displayName) => {
    set({ loading: true, error: null });
    try {
      const res = await api.auth.register({ email, password, username, displayName });
      setToken(res.token);
      set({ user: res.user, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  logout: () => {
    setToken(null);
    set({ user: null });
  },

  loadUser: async () => {
    try {
      const res = await api.auth.me();
      set({ user: res.user });
    } catch {
      setToken(null);
      set({ user: null });
    }
  },
}));
