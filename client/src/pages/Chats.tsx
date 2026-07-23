import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Plus, Users, Phone, Video, Settings, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import { useCallStore } from "../stores/callStore";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
import { Chat } from "../types";

export default function Chats() {
  const { user, logout } = useAuthStore();
  const { chats, loadChats, setActiveChat } = useChatStore();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    loadChats();
    const socket = getSocket();
    if (socket) {
      socket.on("message:new", (msg: any) => {
        useChatStore.getState().addMessage(msg);
      });
      socket.on("presence:update", (data: { userId: string; online: boolean }) => {
        loadChats();
      });
    }
    return () => {
      socket?.off("message:new");
      socket?.off("presence:update");
    };
  }, []);

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.users.search(q);
      setSearchResults(res.users);
    } catch {}
  };

  const startChat = async (contactId: string) => {
    try {
      const res = await api.chats.createDirect([contactId]);
      setShowAdd(false);
      setSearch("");
      setSearchResults([]);
      loadChats();
      navigate(`/chat/${res.chat.id}`);
    } catch {}
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getChatName = (chat: Chat) => {
    if (chat.isGroup) return chat.name || "Group";
    const other = chat.members?.find((m) => m.userId !== user?.id);
    return other?.user?.displayName || other?.user?.username || "Unknown";
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: "360px", minWidth: "360px", display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 600 }}>Artemisc</h2>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setShowAdd(!showAdd)} style={iconBtnStyle} title="New chat">
                <Plus size={20} />
              </button>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search chats..."
            style={searchInputStyle}
          />
        </div>

        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden", borderBottom: "1px solid var(--border)" }}
            >
              <div style={{ padding: "12px 16px" }}>
                <input
                  type="text"
                  placeholder="Search users by name..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={searchInputStyle}
                  autoFocus
                />
                <div style={{ marginTop: "8px", maxHeight: "200px", overflow: "auto" }}>
                  {searchResults.map((u: any) => (
                    <div
                      key={u.id}
                      onClick={() => startChat(u.id)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "var(--radius)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                      className="hover-bg"
                    >
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 600 }}>
                        {u.displayName?.charAt(0) || u.username.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{u.displayName || u.username}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>@{u.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ flex: 1, overflow: "auto" }}>
          {chats.map((chat) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => { setActiveChat(chat); navigate(`/chat/${chat.id}`); }}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
              className="hover-bg"
            >
              <div style={{ position: "relative" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 600 }}>
                  {chat.isGroup ? <Users size={20} /> : getChatName(chat).charAt(0)}
                </div>
                {!chat.isGroup && (
                  <div style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", borderRadius: "50%", background: chat.members?.find((m) => m.userId !== user?.id)?.user?.online ? "var(--success)" : "var(--text-muted)", border: "2px solid var(--bg-surface)" }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 500 }}>{getChatName(chat)}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{formatTime(chat.lastMessage?.createdAt)}</span>
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>
                  {chat.lastMessage?.content || (chat.lastMessage?.type === "image" ? "Photo" : "No messages yet")}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 600 }}>
              {user?.displayName?.charAt(0) || user?.username?.charAt(0)}
            </div>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{user?.displayName || user?.username}</span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button onClick={() => navigate("/contacts")} style={miniBtnStyle} title="Contacts"><Users size={16} /></button>
            <button onClick={() => navigate("/settings")} style={miniBtnStyle} title="Settings"><Settings size={16} /></button>
            <button onClick={logout} style={miniBtnStyle} title="Log out"><LogOut size={16} /></button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexDirection: "column", gap: "12px" }}>
        <MessageSquare size={48} strokeWidth={1.5} />
        <p style={{ fontSize: "16px" }}>Select a chat to start messaging</p>
      </div>
    </div>
  );
}

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "var(--bg-elevated)",
  border: "none",
  borderRadius: "var(--radius)",
  color: "var(--text-primary)",
  outline: "none",
  fontSize: "13px",
};

const iconBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--text-secondary)",
  cursor: "pointer",
  padding: "6px",
  borderRadius: "var(--radius)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const miniBtnStyle: React.CSSProperties = {
  ...iconBtnStyle,
  padding: "4px",
};
