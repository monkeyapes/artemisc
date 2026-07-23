import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Phone, Video, Paperclip, MoreVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "../stores/chatStore";
import { useAuthStore } from "../stores/authStore";
import { useCallStore } from "../stores/callStore";
import { getSocket } from "../lib/socket";
import { api } from "../lib/api";
import { Chat, Message } from "../types";

export default function ChatView() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { chats, activeChat, messages, typingUsers, setActiveChat, addMessage, setTyping } = useChatStore();
  const [text, setText] = useState("");
  const [chat, setChat] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (chatId) {
      const existing = chats.find((c) => c.id === chatId);
      if (existing) setChat(existing);
      api.chats.get(chatId).then((res) => setChat(res.chat));
      setActiveChat(existing || null);
    }
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages[chatId || ""]?.length]);

  useEffect(() => {
    const socket = getSocket();
    if (socket && chatId) {
      socket.emit("chat:join", chatId);
      socket.on("message:new", (msg: Message) => {
        if (msg.chatId === chatId) addMessage(msg);
      });
      socket.on("typing:update", (data: { chatId: string; userId: string; typing: boolean }) => {
        if (data.chatId === chatId && data.userId !== user?.id) setTyping(chatId, data.userId, data.typing);
      });
    }
    return () => {
      if (socket && chatId) {
        socket.emit("chat:leave", chatId);
        socket.off("message:new");
        socket.off("typing:update");
      }
    };
  }, [chatId]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !chatId) return;
    const socket = getSocket();
    if (socket) {
      socket.emit("message:send", { chatId, content: trimmed, type: "text" });
      socket.emit("typing:stop", { chatId });
    } else {
      api.messages.send({ chatId, content: trimmed }).then((res) => addMessage(res.message));
    }
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTyping = () => {
    if (!chatId) return;
    const socket = getSocket();
    if (socket) {
      socket.emit("typing:start", { chatId });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing:stop", { chatId });
      }, 2000);
    }
  };

  const getChatName = () => {
    if (!chat) return "Chat";
    if (chat.isGroup) return chat.name || "Group";
    const other = chat.members?.find((m) => m.userId !== user?.id);
    return other?.user?.displayName || other?.user?.username || "Unknown";
  };

  const chatMessages = messages[chatId || ""] || [];
  const typingList = typingUsers[chatId || ""] || [];
  const isTyping = typingList.length > 0;

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return "Today";
    if (diff < 172800000) return "Yesterday";
    return d.toLocaleDateString([], { month: "long", day: "numeric" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg-surface)", display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={() => navigate("/")} style={iconBtnStyle}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{getChatName()}</div>
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: "12px", color: "var(--accent)" }}>
              typing...
            </motion.div>
          )}
        </div>
        <button style={iconBtnStyle} title="Voice call"><Phone size={18} /></button>
        <button style={iconBtnStyle} title="Video call"><Video size={18} /></button>
        <button style={iconBtnStyle}><MoreVertical size={18} /></button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {chatMessages.map((msg, i) => {
          const isMine = msg.senderId === user?.id;
          const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(chatMessages[i - 1]?.createdAt).toDateString();

          return (
            <div key={msg.id}>
              {showDate && (
                <div style={{ textAlign: "center", margin: "12px 0", fontSize: "12px", color: "var(--text-muted)" }}>
                  {formatDate(msg.createdAt)}
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{
                  maxWidth: "70%",
                  alignSelf: isMine ? "flex-end" : "flex-start",
                  background: isMine ? "var(--accent)" : "var(--bg-elevated)",
                  color: isMine ? "#fff" : "var(--text-primary)",
                  padding: "8px 14px",
                  borderRadius: "16px",
                  borderBottomRightRadius: isMine ? "4px" : "16px",
                  borderBottomLeftRadius: isMine ? "16px" : "4px",
                  marginLeft: isMine ? "auto" : 0,
                  marginRight: isMine ? 0 : "auto",
                  marginBottom: "2px",
                  position: "relative",
                }}
              >
                {!isMine && !chat?.isGroup && (
                  <div style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 600, marginBottom: "2px" }}>
                    {msg.sender?.displayName || msg.sender?.username}
                  </div>
                )}
                {msg.type === "image" && msg.mediaUrl ? (
                  <img src={msg.mediaUrl} alt="Image" style={{ maxWidth: "100%", borderRadius: "8px", maxHeight: "200px" }} />
                ) : msg.type === "file" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Paperclip size={14} />
                    <span>{msg.content}</span>
                  </div>
                ) : (
                  <span>{msg.content}</span>
                )}
                <div style={{ fontSize: "10px", opacity: 0.7, textAlign: "right", marginTop: "2px" }}>
                  {formatTime(msg.createdAt)}
                </div>
              </motion.div>
            </div>
          );
        })}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", gap: "4px", padding: "8px 14px", background: "var(--bg-elevated)", borderRadius: "16px", borderBottomLeftRadius: "4px", alignSelf: "flex-start" }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text-muted)" }}
              />
            ))}
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--bg-surface)", display: "flex", alignItems: "flex-end", gap: "8px" }}>
        <button style={iconBtnStyle}><Paperclip size={20} /></button>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); handleTyping(); }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "var(--bg-elevated)",
            border: "none",
            borderRadius: "var(--radius-lg)",
            color: "var(--text-primary)",
            outline: "none",
            resize: "none",
            maxHeight: "120px",
            lineHeight: 1.4,
          }}
        />
        <button onClick={handleSend} style={{ ...iconBtnStyle, background: text.trim() ? "var(--accent)" : "transparent", color: text.trim() ? "#fff" : "var(--text-muted)", padding: "8px" }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

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
