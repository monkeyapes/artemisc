import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Trash2, Search } from "lucide-react";
import { api } from "../lib/api";
import { Contact } from "../types";

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => { loadContacts(); }, []);

  const loadContacts = async () => {
    const res = await api.contacts.list();
    setContacts(res.contacts);
  };

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const res = await api.users.search(q);
    setSearchResults(res.users);
  };

  const addContact = async (contactId: string) => {
    await api.contacts.add(contactId);
    setSearch("");
    setSearchResults([]);
    loadContacts();
  };

  const removeContact = async (id: string) => {
    await api.contacts.remove(id);
    loadContacts();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: "480px", margin: "0 auto" }}>
      <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
        <button onClick={() => navigate("/")} style={iconBtnStyle}><ArrowLeft size={20} /></button>
        <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Contacts</h2>
      </div>

      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search users to add..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 36px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-primary)", outline: "none" }}
          />
        </div>
        {searchResults.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            {searchResults.map((u: any) => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: "var(--radius)" }} className="hover-bg">
                <div>
                  <div style={{ fontWeight: 500 }}>{u.displayName || u.username}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>@{u.username}</div>
                </div>
                <button onClick={() => addContact(u.id)} style={{ ...iconBtnStyle, color: "var(--accent)" }}>
                  <UserPlus size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {contacts.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            No contacts yet. Search for users above.
          </div>
        )}
        {contacts.map((contact) => (
          <div key={contact.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                {(contact.displayName || contact.username).charAt(0)}
              </div>
              <div style={{ position: "absolute", bottom: 0, right: 0, width: "10px", height: "10px", borderRadius: "50%", background: contact.online ? "var(--success)" : "var(--text-muted)", border: "2px solid var(--bg-surface)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{contact.displayName || contact.username}</div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                @{contact.username} &middot; {contact.online ? "Online" : contact.lastSeen ? `Last seen ${new Date(contact.lastSeen).toLocaleDateString()}` : "Offline"}
              </div>
            </div>
            <button onClick={() => removeContact(contact.id)} style={{ ...iconBtnStyle, color: "var(--text-muted)" }}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
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
