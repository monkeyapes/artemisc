# Artemisc

WhatsApp-style messaging app from the **Artemis** project family. 1:1 and group text chat, voice calls, video calls, media sharing, contacts, presence, and accounts — running natively on **Windows (.exe)** and **Android (.apk)** from a single shared codebase.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI** | React 18 + Astryx (React + StyleX component library) |
| **Icons** | lucide-react |
| **Animations** | framer-motion |
| **Client state** | zustand |
| **Windows packaging** | Tauri v1 |
| **Android packaging** | Capacitor v6 |
| **Backend** | Node.js + Fastify + Socket.io |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | Email/password + JWT |
| **Calls** | WebRTC + TURN (coturn) |
| **Push notifications** | Firebase Cloud Messaging |

## Project Structure

```
artemisc/
├── client/               # React app (shared across platforms)
│   ├── src/
│   │   ├── pages/        # Login, Register, Chats, ChatView, Contacts, Settings
│   │   ├── stores/       # Zustand stores (auth, chat, call)
│   │   ├── lib/          # API client, Socket.io client
│   │   └── types/        # TypeScript interfaces
│   ├── src-tauri/        # Tauri config (Windows .exe)
│   ├── capacitor.config.ts  # Capacitor config (Android .apk)
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── routes/       # Auth, users, chats, messages, contacts
│   │   ├── services/     # Business logic
│   │   ├── plugins/      # WebSocket (Socket.io)
│   │   └── index.ts      # Server entry
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── uploads/          # Local file storage (dev)
├── package.json          # Workspace root
└── tsconfig.base.json
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Rust (for Tauri builds) — https://rustup.rs
- Android Studio + SDK (for Capacitor builds)
- Tauri CLI: `cargo install tauri-cli`
- Capacitor CLI: `npm install -g @capacitor/cli`

### 1. Clone and install

```bash
git clone <repo> artemisc
cd artemisc
npm install
```

### 2. Database

```bash
# Create the database
createdb artemisc

# Set the DATABASE_URL in server/.env (copy from .env.example)
cp server/.env.example server/.env

# Run migrations
npm run db:migrate

# (Optional) Seed test data
npm run db:seed
```

### 3. Environment variables

Edit `server/.env`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random 64-char string for signing tokens |
| `PORT` | Server port (default: 3001) |
| `HOST` | Bind address (default: 0.0.0.0) |
| `TURN_URL` | coturn server URL (for calls) |
| `TURN_USERNAME` | TURN username |
| `TURN_CREDENTIAL` | TURN password |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging server key |

### 4. Run in development

```bash
# Start both server and client
npm run dev

# Or individually:
npm run dev:server   # Fastify on :3001
npm run dev:client   # Vite on :5173
```

## Build

### Windows (.exe) via Tauri

```bash
cd client
npm run tauri build
# Output: client/src-tauri/target/release/Artemisc.exe
```

### Android (.apk) via Capacitor

```bash
cd client

# Build the React app
npm run build

# Add Android platform (first time only)
npx cap add android

# Sync web build to native project
npx cap sync

# Open in Android Studio to build the APK
npx cap open android
# Then: Build → Build Bundle(s) / APK(s) → Build APK(s)
# Output: client/android/app/build/outputs/apk/debug/app-debug.apk
```

For a release APK:
```bash
npx cap build android --keystore-path /path/to/keystore --keystore-password ... --keystore-alias ...
```

## TURN Server Setup (for calls)

Install coturn on a Linux server:

```bash
sudo apt install coturn
```

Configure `/etc/turnserver.conf`:

```
listening-device=eth0
listening-port=3478
tls-listening-port=5349
fingerprint
lt-cred-mech
user=artemisc:your-password
realm=your-server.com
total-quota=100
```

Start the service:
```bash
sudo systemctl enable coturn
sudo systemctl start coturn
```

Then set `TURN_URL`, `TURN_USERNAME`, and `TURN_CREDENTIAL` in `server/.env`.

## Features by Phase

### Phase 1 (MVP) ✅
- [x] Account creation + login (email+password, JWT)
- [x] Add contacts by username
- [x] 1:1 text messaging, real-time via WebSocket
- [x] Online/offline presence + last seen
- [x] Typing indicator
- [x] Message history (persisted in Postgres)

### Phase 2
- [ ] Group chats (create, add/remove members, messaging)
- [ ] Media sharing (images, files)
- [ ] Read receipts (sent/delivered/read ticks)
- [ ] Push notifications on Android

### Phase 3
- [ ] 1:1 voice calls (WebRTC + signaling + TURN)
- [ ] 1:1 video calls
- [ ] Small group calls (P2P mesh WebRTC)

### Phase 4
- [ ] End-to-end encryption (Signal Protocol)

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current user |
| GET | `/api/users/search?q=` | Search users |
| GET | `/api/contacts` | List contacts |
| POST | `/api/contacts/add` | Add contact |
| GET | `/api/chats` | List chats |
| POST | `/api/chats/direct` | Create 1:1 chat |
| POST | `/api/chats/group` | Create group chat |
| GET | `/api/messages/:chatId` | Get messages |
| POST | `/api/messages` | Send message |
| POST | `/api/messages/read/:id` | Mark as read |

## WebSocket Events (Socket.io)

| Event | Direction | Description |
|-------|-----------|-------------|
| `message:send` | Client → Server | Send a message |
| `message:new` | Server → Client | New message received |
| `typing:start` | Client → Server | User started typing |
| `typing:stop` | Client → Server | User stopped typing |
| `typing:update` | Server → Client | Typing status update |
| `message:read` | Client → Server | Mark message read |
| `presence:update` | Server → Client | Online/offline change |
| `signal:offer` | Bidirectional | WebRTC offer |
| `signal:answer` | Bidirectional | WebRTC answer |
| `signal:ice` | Bidirectional | ICE candidate |
| `call:start` | Client → Server | Initiate call |
| `call:incoming` | Server → Client | Incoming call |
| `call:end` | Bidirectional | End call |
| `chat:join` | Client → Server | Join chat room |
| `chat:leave` | Client → Server | Leave chat room |
