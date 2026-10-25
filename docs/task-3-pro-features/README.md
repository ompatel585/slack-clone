# Task 3 — Five Professional Features

> **Branch:** `feat/pro-features` (cut from `main` after the Task 2 PR is merged)
> **Goal:** turn the chat workspace into a production-grade team tool with five new features, one phase per feature, and finish with project documentation.
> **Status:** ✅ Complete — Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅ · Phase 4 ✅ · Phase 5 ✅ · Phase 6 ✅

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
| 1 | Feature 1: create, browse & join channels | 10 | ✅ |
| 2 | Feature 2: direct messages & online presence | 5 | ✅ |
| 3 | Feature 3: video calls | 7 | ✅ |
| 4 | Feature 4: members, invites, leave & pinned messages | 9 | ✅ |
| 5 | Feature 5: global message search (⌘K) | 5 | ✅ |
| 6 | Documentation & release notes | 3 | ✅ |

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

**Phase summary:** ✅ Done
- Backend `POST /api/channels`, `GET /api/channels/public` and `POST /api/channels/:id/join`, all behind `protectRoute`:
  - names are normalised (`"Product Launch!"` → `product-launch`) and must be unique (409 on a duplicate);
  - ids are a slug plus a random suffix;
  - private channels are non-discoverable and invite-only (joining one returns 403);
  - ids are validated, and errors come back as user-friendly JSON.
- Frontend:
  - a reusable `Modal` on native `<dialog>` with a focus trap, Escape, backdrop click and `data-autofocus`;
  - `CreateChannelModal`: live name preview, description counter, Public/Private cards and a searchable people picker;
  - `BrowseChannelsModal`: search, member counts, and Joined / Open / Join states;
  - Compass (browse) and + (create) triggers in the sidebar.
- Verified:
  - controller unit tests with stubbed Stream: 400 / 409 / 201 / 403 / 404 / 200 paths;
  - browser preview with mocked API and Stream: create flow (toast, channel opens), duplicate-name error, browse → join.
- Fix found during the preview: `showModal()` stole focus from React's `autoFocus`, now replaced by `data-autofocus`.
- File changes: 6 added, 4 modified (10), exactly as planned.

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

**Phase summary:** ✅ Done
- `UsersList`:
  - loads up to 30 workspace users with `presence: true`, sorted online first and then by name;
  - avatars with live status dots, updated on `user.presence.changed`;
  - screen-reader "online" / "offline" text;
  - unread badges for each DM, recomputed on message and read events;
  - skeleton, error and empty states.
- Clicking a person opens or creates the distinct 1:1 channel (`client.channel("messaging", { members: [me, them] })`), which reuses the existing conversation if there is one.
- `Sidebar` has a new "Direct messages" section. `channelRenderFilterFn` removes the `!members-…` DM channels from the Channels list.
- `CustomChannelHeader` shows the partner's avatar, name and "Active now" or a localised "Last seen 42 minutes ago" (`Intl.RelativeTimeFormat`) in DMs, and hides the member and online pills there.
- Verified in the browser preview: the DM list sorts online users first; opening Raj creates and highlights the DM; the header shows "Last seen 42 minutes ago"; the Channels section lists only real channels. Lint is clean and the build succeeds.
- File changes: 1 added, 4 modified (5), exactly as planned.

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

**Phase summary:** ✅ Done
- Dependency: `@stream-io/video-react-sdk@^1.44.1` (React 17–19). It authenticates with the existing `/api/chat/token`, since the token is signed with the same Stream secret, so no backend change was needed.
- `CallPage` at `/call/:id`:
  - the call id is validated, and an invalid link gets its own screen;
  - a StrictMode-safe join and cleanup (`join({ create: true })` → `leave()` + `disconnectUser()`);
  - a header with a pulsing "Live" dot, participant count and **Copy invite link**;
  - `SpeakerLayout` with `CallControls`;
  - leaving, being removed, or the call ending returns to the workspace;
  - an error screen for a failed join (permissions or network).
- `call.css` maps the Stream Video theme variables to the brand and adapts the layout for mobile.
- The header's 📹 **Start a video call** button:
  - creates a fresh `crypto.randomUUID()` call id;
  - opens the call in a new tab synchronously, so pop-up blockers allow it, with `opener` cleared;
  - posts "📹 I've started a video call — join here: …" into the conversation;
  - shows a toast if the pop-up was blocked.
- `App.jsx` adds the `/call/:id` route and lazy-loads `HomePage` and `CallPage` behind `Suspense`. The signed-out landing bundle is now 344 kB, and the chat (1.3 MB) and video (264 kB) SDK chunks load only on their routes. Vite still notes that the lazy chat chunk is over 500 kB; that is the `stream-chat-react` library itself, and it no longer delays the first page load.
- Verified in the browser preview:
  - the call button opens a `/call/<uuid>` URL and posts the link without errors;
  - `/call/bad!id` shows "This call link isn't valid";
  - a valid id with no real Stream credentials shows "Couldn't join the call".
- **Not covered:** a live two-person call, because it needs real Stream credentials.
- Lint is clean and the build succeeds.
- File changes: 2 added, 5 modified (7), exactly as planned.

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
| M | `frontend/src/styles/modal.css` *(added during implementation, see note)* |
| M | `docs/task-3-pro-features/README.md` |

**Phase summary:** ✅ Done
- Backend:
  - `POST /api/channels/:id/members` validates 1–50 user ids and requires the requester to be a member (checked with `channel.queryMembers`, which is accurate beyond the first 100 members). It de-duplicates, skips the requester, ignores unknown users, and posts "added Raj Mehta, Kim Lee to #design".
  - `POST /api/channels/:id/leave` requires membership and posts "left the channel".
  - DM ids are rejected by the id pattern.
- `MembersModal`: searchable, online-first, with Owner / Moderator badges, "(you)", online status and an **Invite people** shortcut.
- `InviteModal`: shows only workspace users who aren't in the channel yet, with multi-select and an "Invite N people" button.
- `PinnedMessagesModal`: newest pins first with author, time and "Pinned by". Clicking one closes the modal and `jumpToMessage`s to it. Messages are pinned with Stream's built-in **Pin** action.
- Header actions:
  - the member-count pill is now a button that opens the members list;
  - 📌 shows a pin-count badge;
  - ➕ invite and 🚪 leave appear in channels only;
  - leaving needs confirmation (Cancel is focused by default, and the message changes for private channels), then returns to "Pick a conversation".
- **Deviation from the fixed file list:** `frontend/src/styles/modal.css` was also modified. The new lists, badge, danger button and header-action styles needed a home, and `modal.css` already holds the dialog UI. It was planned for Phase 5 anyway, so the task's unique file total doesn't change (still 25).
- Bug found and fixed in the preview: at 375 px the extra header actions widened the header to 416 px and pushed the chat column off-screen, cutting off the send button. Phones now hide the online pill, use compact 32 px action buttons, and let the panel shrink (`min-width: 0`).
- Verified:
  - controller unit tests with stubbed Stream: 400 / 403 / 404 / 200 paths, de-duplication, and the system message text;
  - browser preview: members list, invite → toast, pinned → jump, leave → confirm → empty state, and the 375 px header fit.
- Lint is clean and the build succeeds.
- File changes: 3 added, 6 modified (9; the plan said 8, see the deviation note).

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

**Phase summary:** ✅ Done
- `SearchModal`:
  - a 300 ms debounced `client.search` across every channel and DM the user belongs to (minimum 2 characters, 20 newest results);
  - case-insensitive `<mark>` highlighting with regex-escaped input;
  - each result shows the channel (or "Direct message"), author and time;
  - idle, searching, empty and error states;
  - a proper combobox/listbox (`aria-activedescendant`, `aria-selected`) with ↑ ↓ (wrapping), Enter, Esc and hover.
- `HomePage`:
  - a global ⌘K / Ctrl+K shortcut;
  - `SearchDialog` opens the result's channel;
  - `JumpToPendingMessage` (inside `<Channel>`, where `jumpToMessage` exists) scrolls to and highlights the message once that channel is mounted, and logs a failed jump instead of throwing.
- `Sidebar` gets a "Search messages" trigger with a platform-aware `⌘K` / `Ctrl K` hint. Styles are in `modal.css`.
- Verified in the browser preview: Ctrl+K opens the dialog with the input focused; "the" returns 3 highlighted results and ArrowDown moves the active option; searching "lunch" and pressing Enter switches to `#random`; searching "release" jumps to and highlights the matching message in `#general`. Lint is clean and the build succeeds.
- File changes: 1 added, 4 modified (5), exactly as planned.

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

**Phase summary:** ✅ Done
- New root `README.md`: features, tech stack, an architecture diagram, both env-var tables (with required flags), local setup including the Inngest dev server, a Clerk / Stream / Vercel checklist, scripts, the API reference, project structure, and links to the three task READMEs.
- `frontend/README.md` replaces the Vite template with frontend docs: scripts, env, a map of which file does what, styling layers, and accessibility notes.
- **Deviation from the plan:** no screenshot is embedded. `frontend/public/screenshot-for-readme.png` turned out to be a third-party tutorial thumbnail, not this app, so using it would misrepresent the project. Add a real screenshot once the app runs with your keys.
- File changes: 1 added, 2 modified (3), exactly as planned.

---

## Task 3 — final summary

| # | Feature | Backend | Frontend | Verified with |
|---|---------|:-------:|:--------:|---------------|
| 1 | Create, browse & join channels | ✅ 3 endpoints | ✅ | Controller unit tests and browser preview |
| 2 | Direct messages & presence | – | ✅ | Browser preview |
| 3 | Video calls | – | ✅ | Browser preview (link and error states) |
| 4 | Members, invites, leave & pins | ✅ 2 endpoints | ✅ | Controller unit tests and browser preview |
| 5 | ⌘K message search | – | ✅ | Browser preview (search, keyboard, jump) |

- **Bugs found and fixed while verifying:**
  - `showModal()` stole focus from `autoFocus`;
  - the unread badge's `aria-label` on a span was never announced;
  - at 375 px the header pushed the chat column off-screen.
- **Performance:** route-level code splitting keeps the signed-out bundle at 344 kB.
- **Not covered:** a live session against real Clerk and Stream accounts, including two-person calls. The browser checks used an offline mock client that was never committed.

---

## Task 3 — total file changes

| Phase | Added | Modified | Deleted | Total |
|------:|------:|---------:|--------:|------:|
| 1 | 6 | 4 | 0 | 10 |
| 2 | 1 | 4 | 0 | 5 |
| 3 | 2 | 5 | 0 | 7 |
| 4 | 3 | 6 | 0 | 9 |
| 5 | 1 | 4 | 0 | 5 |
| 6 | 1 | 2 | 0 | 3 |
| **Unique files (whole task)** | **14** | **11** | **0** | **25** |

> Files touched in more than one phase are counted once in the unique total. Files added in one phase and modified later (for example `channel.controller.js` and `modal.css`) count as added.

**Verification for every phase:** `node --check` on the changed backend files, and `npm run lint` and `npm run build` in `frontend/`.

### Stream dashboard prerequisites

- **Video** must be enabled for the Stream app (it is on by default for new apps). It uses the same API key and secret.
- **Search** is available on every Stream plan.
