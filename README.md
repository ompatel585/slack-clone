<div align="center">

<img src="frontend/public/logo.png" alt="" width="72" height="72" />

# Slap — real-time team chat

A Slack-style workspace built with the MERN stack: channels, direct messages, video calls,
message search and more, on top of Clerk authentication and Stream's chat and video infrastructure.

</div>

---

## Features

| | Feature | Details |
|-|---------|---------|
| 💬 | **Channels** | Create public or private channels, browse and join public ones, unread badges, threads, reactions, pinned messages |
| ✉️ | **Direct messages** | One-click 1:1 conversations with live online presence and "last seen" |
| 📹 | **Video calls** | Start a call from any conversation; everyone gets a join link (Stream Video) |
| 👥 | **Channel management** | Members list with roles and presence, invite people, leave channels |
| 🔎 | **Message search** | ⌘K / Ctrl+K search across every channel and DM, with keyboard navigation and jump-to-message |
| 🔐 | **Authentication** | Clerk sign-up and sign-in, with users synced to MongoDB and Stream through Inngest webhooks |
| 📱 | **Responsive UI** | Mobile drawer navigation, full-screen threads, accessible dialogs, reduced-motion support |
| 🛡️ | **Production hardening** | Env validation, JSON error handling, environment-aware Sentry, idempotent webhooks |

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7, React Router 7, `stream-chat-react` 13, `@stream-io/video-react-sdk`, lucide-react, react-hot-toast |
| Backend | Node.js ≥ 20.6, Express 5, Mongoose 8, `stream-chat` (server SDK) |
| Auth | Clerk (`@clerk/clerk-react`, `@clerk/express`) |
| Background jobs | Inngest (Clerk user created / updated / deleted → MongoDB and Stream) |
| Observability | Sentry (`@sentry/node`) |
| Hosting | Vercel (frontend as a static SPA, backend as a serverless function) |

## Architecture

```
┌────────────────────┐   Clerk session JWT    ┌──────────────────────────┐
│  React SPA (Vite)  │ ─────────────────────▶ │  Express API (Vercel)    │
│                    │   /api/chat/token      │  ├─ /api/chat            │
│  Clerk UI          │   /api/channels/*      │  ├─ /api/channels        │
│  Stream Chat UI    │ ◀───────────────────── │  ├─ /api/inngest         │
│  Stream Video UI   │   Stream user token    │  └─ /api/health          │
└────────┬───────────┘                        └───────┬──────────┬───────┘
         │ websocket (chat, presence, calls)          │          │
         ▼                                            ▼          ▼
   ┌───────────┐                              ┌───────────┐  ┌─────────┐
   │  Stream   │ ◀──── server SDK (secret) ── │  MongoDB  │  │ Inngest │ ◀── Clerk webhooks
   └───────────┘                              └───────────┘  └─────────┘
```

- The browser never sees the Stream secret. The API issues a short-lived **Stream user token**, which authenticates both chat and video.
- Channel creation, joining, invites and leaving go through the API with the server SDK, so they don't depend on Stream dashboard permission settings.
- Clerk user events reach **Inngest**, which upserts the user in MongoDB and Stream (idempotently, with retries) and adds new users to every public channel.

## Getting started

### Prerequisites

- Node.js **20.6+** and npm
- Free accounts for [Clerk](https://clerk.com), [Stream](https://getstream.io) and [MongoDB Atlas](https://www.mongodb.com/atlas) (or a local MongoDB)
- Optional: [Inngest](https://www.inngest.com) for user sync, and [Sentry](https://sentry.io) for error tracking

### 1. Install

```bash
git clone https://github.com/ompatel585/slack-clone.git
cd slack-clone
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**`backend/.env`**

| Variable | Required | Description |
|----------|:--------:|-------------|
| `PORT` | – | API port (default `5000`) |
| `NODE_ENV` | – | `development` or `production` |
| `CLIENT_URL` | – | Allowed CORS origin(s), comma-separated (default `http://localhost:5173`) |
| `MONGO_URI` | ✅ | MongoDB connection string |
| `CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key |
| `STREAM_API_KEY` | ✅ | Stream API key |
| `STREAM_API_SECRET` | ✅ | Stream API secret |
| `SENTRY_DSN` | – | Enables Sentry when set |
| `INNGEST_EVENT_KEY` | – | Inngest event key |
| `INNGEST_SIGNING_KEY` | production | Required when `NODE_ENV=production` |

The server refuses to start, with a clear message, if a required variable is missing.

**`frontend/.env`**

| Variable | Description |
|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `VITE_API_URL` | API base URL, e.g. `http://localhost:5000/api` |
| `VITE_STREAM_API_KEY` | Same value as `STREAM_API_KEY` |

### 3. Run locally

Start the API, then the frontend, in two terminals:

```bash
npm run dev --prefix backend
```
```bash
npm run dev --prefix frontend
```

Open <http://localhost:5173>.

To sync Clerk users locally, also run the Inngest dev server:

```bash
npx inngest-cli@latest dev -u http://localhost:5000/api/inngest
```

### Third-party setup checklist

- **Clerk**: send the `user.created`, `user.updated` and `user.deleted` webhooks to Inngest (Inngest dashboard → *Integrations → Clerk*).
- **Stream**: video is enabled by default for new apps. Pinning messages uses the built-in *Pin* message action.
- **Vercel**: deploy `backend/` (it includes `vercel.json`, `NODE_ENV=production`) and `frontend/` (its `vercel.json` adds the SPA rewrite) as two projects. Set `CLIENT_URL` on the API to the frontend URL.

## Scripts

| Location | Command | What it does |
|----------|---------|--------------|
| `backend/` | `npm run dev` | API with auto-reload (nodemon) and Sentry instrumentation |
| `backend/` | `npm start` | API in production mode |
| `frontend/` | `npm run dev` | Vite dev server |
| `frontend/` | `npm run build` | Production build into `dist/` |
| `frontend/` | `npm run lint` | ESLint |
| `frontend/` | `npm run preview` | Serve the production build locally |

## API reference

All routes except `/api/health` and `/api/inngest` require a Clerk session (`Authorization: Bearer <session JWT>`).

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/health` | Liveness check plus database connection state |
| `GET` | `/api/chat/token` | Stream user token for the signed-in user (chat and video) |
| `POST` | `/api/channels` | Create a channel: `{ name, description?, isPrivate?, memberIds? }` |
| `GET` | `/api/channels/public` | Discoverable channels, each with an `isMember` flag |
| `POST` | `/api/channels/:id/join` | Join a public channel |
| `POST` | `/api/channels/:id/members` | Invite people: `{ userIds }` (members only) |
| `POST` | `/api/channels/:id/leave` | Leave a channel |
| `*` | `/api/inngest` | Inngest function endpoint (signed requests only) |

Errors are always JSON: `{ "message": "…" }`.

## Project structure

```
slack-clone/
├── backend/
│   ├── instrument.mjs            # Sentry init (loaded with node --import)
│   └── src/
│       ├── config/               # env validation, Mongo, Stream, Inngest functions
│       ├── controllers/          # chat token, channels
│       ├── middleware/           # auth guard, 404 + error handler
│       ├── models/               # User
│       ├── routes/
│       └── server.js
├── frontend/
│   └── src/
│       ├── components/           # Sidebar, headers, modals, lists, error boundary
│       ├── hooks/useStreamChat.js
│       ├── lib/                  # axios instance and API helpers
│       ├── pages/                # Auth, Home (workspace), Call
│       └── styles/               # design tokens, workspace, modal, call, Stream theme
└── docs/                         # phase-by-phase roadmap and change log
```

## Development history

The project was upgraded in three tracked tasks, each in its own branch and pull request, with a README covering every phase and its file changes:

1. [Bug fixes](docs/task-1-bug-fixes/README.md): 27 backend and frontend bugs
2. [UI enhancement](docs/task-2-ui-enhancement/README.md): design system, landing page, chat workspace, responsive layout
3. [Pro features](docs/task-3-pro-features/README.md): channels, DMs and presence, video calls, channel management, search
