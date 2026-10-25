# Task 3 — Five Professional Features

> **Branch:** `feat/pro-features` (cut from `main` after the Task 2 PR is merged)
> **Goal:** turn the chat workspace into a production-grade team tool with five new features, one phase per feature, and finish with project documentation.
> **Status:** ⏳ Not started

---

## The five features

| # | Feature | Why it matters | Backend | Frontend |
|---|---------|----------------|:-------:|:--------:|
| 1 | **Channels: create, browse & join** (public and private) | Teams organise conversations by topic; channels are the core of Slack | ✅ | ✅ |
| 2 | **Direct messages & online presence** | 1-to-1 conversations with live 🟢 online indicators | – | ✅ |
| 3 | **Video calls** (Stream Video) | The landing page already promises "video calls & meetings" | – | ✅ |
| 4 | **Channel management**: members list, invite people, leave channel, pinned messages | Admin-grade control over channels | ✅ | ✅ |
| 5 | **Global message search** (⌘K / Ctrl + K) | Find any message in any channel instantly | – | ✅ |

### New REST API (`/api/channels`, all routes protected by Clerk)

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/channels` | Create a channel `{ name, description, isPrivate, memberIds }` |
| `GET` | `/api/channels/public` | List discoverable public channels, each with an `isMember` flag |
| `POST` | `/api/channels/:id/join` | Join a public channel |
| `POST` | `/api/channels/:id/members` | Invite users `{ userIds }` (the requester must already be a member) |
| `POST` | `/api/channels/:id/leave` | Leave a channel |

Channels are created and changed **server-side** with the Stream secret, so the actions don't depend on the client-side permission settings of the Stream dashboard.

Legend: **A** = added, **M** = modified, **D** = deleted.

---

## Phase overview

| Phase | Feature | Files | Status |
|------:|---------|------:|--------|
| 1 | Feature 1: create, browse & join channels | 10 | ⏳ |
| 2 | Feature 2: direct messages & online presence | 5 | ⏳ |
| 3 | Feature 3: video calls | 7 | ⏳ |
| 4 | Feature 4: members, invites, leave & pinned messages | 8 | ⏳ |
| 5 | Feature 5: global message search (⌘K) | 5 | ⏳ |
| 6 | Documentation & release notes | 3 | ⏳ |

---

## Phase 1 — Create, browse & join channels

- Backend: a `channel.controller.js` with `createChannel`, `listPublicChannels` and `joinChannel`, with input validation (name 2–40 characters, slugified id, description ≤ 200 characters).
- Frontend: a reusable accessible `Modal` (focus handling, Esc to close, click-outside), `CreateChannelModal` (name, description, public/private toggle, initial members), and `BrowseChannelsModal` (search public channels, Join / Open).
- The sidebar gets "＋ Create channel" and "Browse channels" actions.

| | File |
|-|------|
| A | `backend/src/controllers/channel.controller.js` |
| A | `backend/src/routes/channel.route.js` |
| M | `backend/src/server.js` |
| M | `frontend/src/lib/api.js` |
| A | `frontend/src/components/Modal.jsx` |
| A | `frontend/src/components/CreateChannelModal.jsx` |
| A | `frontend/src/components/BrowseChannelsModal.jsx` |
| A | `frontend/src/styles/modal.css` |
| M | `frontend/src/components/Sidebar.jsx` |
| M | `docs/task-3-pro-features/README.md` |

**Phase summary:** _pending_

---

## Phase 2 — Direct messages & online presence

- `UsersList`: a "Direct messages" sidebar section listing workspace users (`client.queryUsers`), with live presence updates (`user.presence.changed`), unread counts and an "online first" sort.
- Clicking a user opens or creates a *distinct* 1-to-1 channel.
- The channels section hides DM channels; the header shows the DM partner's name, avatar and online or last-seen status.

| | File |
|-|------|
| A | `frontend/src/components/UsersList.jsx` |
| M | `frontend/src/components/Sidebar.jsx` |
| M | `frontend/src/components/CustomChannelHeader.jsx` |
| M | `frontend/src/styles/workspace.css` |
| M | `docs/task-3-pro-features/README.md` |

**Phase summary:** _pending_

---

## Phase 3 — Video calls

- `@stream-io/video-react-sdk`, authenticated with the same Stream token the backend already issues.
- `/call/:id` route: a `CallPage` with a lobby state, `SpeakerLayout`, `CallControls`, participant count and leave handling (returns to the workspace).
- The channel header gets a 📹 "Start call" button that creates the call and posts a "join the call" message with the link into the channel.

| | File |
|-|------|
| M | `frontend/package.json` |
| M | `frontend/package-lock.json` |
| A | `frontend/src/pages/CallPage.jsx` |
| A | `frontend/src/styles/call.css` |
| M | `frontend/src/App.jsx` |
| M | `frontend/src/components/CustomChannelHeader.jsx` |
| M | `docs/task-3-pro-features/README.md` |

**Phase summary:** _pending_

---

## Phase 4 — Members, invites, leave & pinned messages

- Backend: `addMembers` (the requester must be a member; a system message is posted) and `leaveChannel`.
- `MembersModal`: members with avatar, role badge and online status.
- `InviteModal`: search workspace users who aren't in the channel yet and invite several at once.
- `PinnedMessagesModal`: lists `channel.state.pinnedMessages`; messages are pinned with the built-in "Pin" message action.
- The header gets action buttons: 👥 members · ➕ invite · 📌 pinned · 🚪 leave (with confirmation).

| | File |
|-|------|
| M | `backend/src/controllers/channel.controller.js` |
| M | `backend/src/routes/channel.route.js` |
| M | `frontend/src/lib/api.js` |
| A | `frontend/src/components/MembersModal.jsx` |
| A | `frontend/src/components/InviteModal.jsx` |
| A | `frontend/src/components/PinnedMessagesModal.jsx` |
| M | `frontend/src/components/CustomChannelHeader.jsx` |
| M | `docs/task-3-pro-features/README.md` |

**Phase summary:** _pending_

---

## Phase 5 — Global message search (⌘K)

- `SearchModal`: a debounced full-text search across every channel the user belongs to (`client.search`), with highlighted matches, channel name, author and timestamp, and keyboard navigation (↑ ↓ Enter Esc).
- Opens with ⌘K / Ctrl + K or from the sidebar search bar.
- Picking a result switches to that channel and jumps to the message.

| | File |
|-|------|
| A | `frontend/src/components/SearchModal.jsx` |
| M | `frontend/src/components/Sidebar.jsx` |
| M | `frontend/src/pages/HomePage.jsx` |
| M | `frontend/src/styles/modal.css` |
| M | `docs/task-3-pro-features/README.md` |

**Phase summary:** _pending_

---

## Phase 6 — Documentation & release notes

- A root `README.md`: overview, screenshot, tech stack, features, architecture, environment variables, local setup, scripts, deployment and API reference.
- `frontend/README.md`: replaces the Vite template boilerplate with frontend-specific docs.
- Final task summary in this file.

| | File |
|-|------|
| A | `README.md` |
| M | `frontend/README.md` |
| M | `docs/task-3-pro-features/README.md` |

**Phase summary:** _pending_

---

## Task 3 — total file changes

| Phase | Added | Modified | Deleted | Total |
|------:|------:|---------:|--------:|------:|
| 1 | 6 | 4 | 0 | 10 |
| 2 | 1 | 4 | 0 | 5 |
| 3 | 2 | 5 | 0 | 7 |
| 4 | 3 | 5 | 0 | 8 |
| 5 | 1 | 4 | 0 | 5 |
| 6 | 1 | 2 | 0 | 3 |
| **Unique files (whole task)** | **14** | **11** | **0** | **25** |

> Files touched in more than one phase are counted once in the unique total. Files added in one phase and modified later (for example `channel.controller.js` and `modal.css`) count as added.

**Verification for every phase:** `node --check` on the changed backend files, and `npm run lint` and `npm run build` in `frontend/`.

### Stream dashboard prerequisites

- **Video** must be enabled for the Stream app (it is on by default for new apps). It uses the same API key and secret.
- **Search** is available on every Stream plan.
