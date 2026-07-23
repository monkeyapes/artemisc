import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { connectSocket, disconnectSocket } from "./lib/socket";
import { getToken } from "./lib/api";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chats from "./pages/Chats";
import ChatView from "./pages/ChatView";
import Contacts from "./pages/Contacts";
import Settings from "./pages/Settings";

export default function App() {
  const { user, loadUser } = useAuthStore();
  const token = getToken();

  useEffect(() => {
    if (token) loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      const socket = connectSocket();
      return () => {
        disconnectSocket();
      };
    }
  }, [user]);

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (!user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-secondary)" }}>
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Chats />} />
      <Route path="/chat/:chatId" element={<ChatView />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
