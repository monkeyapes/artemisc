import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { api } from "../lib/api";

export default function Settings() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.users.updateProfile({ displayName });
      useAuthStore.setState({ user: { ...user!, displayName } });
    } catch {}
    setSaving(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: "480px", margin: "0 auto" }}>
      <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={() => navigate("/")} style={iconBtnStyle}><ArrowLeft size={20} /></button>
        <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Settings</h2>
      </div>

      <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 700 }}>
            {(user?.displayName || user?.username || "").charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 600 }}>{user?.displayName}</div>
            <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>@{user?.username}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>{user?.email}</div>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px" }}>Display Name</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{
                flex: 1,
                padding: "10px 14px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
            <button onClick={handleSave} disabled={saving} style={{ ...iconBtnStyle, background: "var(--accent)", color: "#fff", padding: "10px 16px", borderRadius: "var(--radius)", fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
              <Save size={16} />
            </button>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            onClick={logout}
            style={{ padding: "10px 14px", background: "rgba(255,68,68,0.1)", border: "1px solid var(--danger)", borderRadius: "var(--radius)", color: "var(--danger)", cursor: "pointer", fontWeight: 500, textAlign: "center" }}
          >
            Sign Out
          </button>
        </div>
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
