# Task 2 — UI Enhancement

> **Branch:** `feat/ui-enhancement` (cut from `main` after the Task 1 PR is merged)
> **Goal:** replace the placeholder "Home Page" with a polished, responsive Slack-style workspace, and give the whole app one consistent design system.
> **Status:** 🚧 In progress — Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅

---

## Design direction

- **Brand:** keep the existing "Slap" identity: deep purple (`#4a154b` / `#7209b7`) on a dark navy base, matching the current auth page.
- **Design tokens:** colours, spacing, radii, shadows, typography and z-index layers are CSS custom properties in `index.css`. No CSS framework is added.
- **Typography:** Inter (Google Fonts) with a system-font fallback.
- **Icons:** `lucide-react` replaces the emoji icons.
- **Feedback:** `react-hot-toast` for success and error toasts.
- **Chat UI:** `stream-chat-react` (v13), themed through its CSS variables so it matches the brand.
- **Accessibility:** visible `:focus-visible` rings, `prefers-reduced-motion` support, semantic landmarks, `aria-label`s on icon-only buttons, WCAG AA contrast.
- **Responsive:** desktop (≥ 1024 px), tablet and mobile (≤ 768 px, where the sidebar becomes a slide-in drawer).

Legend: **A** = added, **M** = modified, **D** = deleted.

---

## Phase overview

| Phase | Scope | Files | Status |
|------:|-------|------:|--------|
| 1 | Design system & app shell foundation | 8 | ✅ |
| 2 | Auth (landing) page redesign | 3 | ✅ |
| 3 | Chat workspace: sidebar, channel list, chat window, threads | 13 | ✅ |
| 4 | Responsive layout, error handling & polish | 7 | ⏳ |

---

## Phase 1 — Design system & app shell foundation

- Design tokens, modern CSS reset, typography scale, custom scrollbars, focus rings and reduced-motion rules (`index.css`).
- Inter font, `meta description` and `theme-color` (`index.html`).
- `PageLoader` component: a branded full-screen loader.
- `App.jsx` waits for Clerk's `isLoaded` and shows `PageLoader`, which removes the blank flash while auth state resolves.
- `main.jsx` adds a global `<Toaster />` and passes Clerk `appearance` variables so Clerk's modal matches the brand.
- Dependencies: `lucide-react`, `react-hot-toast`.

| | File |
|-|------|
| M | `frontend/package.json` |
| M | `frontend/package-lock.json` |
| M | `frontend/index.html` |
| M | `frontend/src/index.css` |
| M | `frontend/src/main.jsx` |
| M | `frontend/src/App.jsx` |
| A | `frontend/src/components/PageLoader.jsx` |
| M | `docs/task-2-ui-enhancement/README.md` |

**Phase summary:** ✅ Done
- `index.css` holds the full token set:
  - brand, neutral, sidebar and status colours;
  - a type scale, a 4 px spacing scale, radii and shadows;
  - focus ring, motion, z-index layers and layout sizes.
- It also has a modern reset, thin scrollbars, `:focus-visible` rings, `.sr-only`, `.spinner`, page-loader styles and a global `prefers-reduced-motion` override.
- `index.html` preconnects to and loads Inter (400–800) and adds a meta description and `theme-color`.
- `PageLoader` is a branded, screen-reader-announced (`role="status"`) loader. `App.jsx` shows it until Clerk reports `isLoaded`, which ends the blank flash.
- `main.jsx` passes Clerk `appearance` variables (brand purple, Inter, 0.75 rem radius) and mounts a global themed `<Toaster />`.
- Dependencies: `lucide-react@^1.61.0` and `react-hot-toast@^2.6.1` (both support React 19).
- Verified: lint is clean, the build succeeds, and the loader renders correctly in the dev server's browser preview.
- File changes: 1 added, 7 modified (8), exactly as planned.

---

## Phase 2 — Auth (landing) page redesign

- Semantic layout (`<main>`, `<section>`, `<ul>`), with lucide icons in place of emoji.
- Clearer copy, a "trust" row (end-to-end encryption, real-time sync, free to start) and a secondary call to action.
- Fixes: animations respect reduced motion, the hero no longer overflows on small screens, the CTA has a keyboard focus state, and images are lazy-loaded.

| | File |
|-|------|
| M | `frontend/src/pages/AuthPage.jsx` |
| M | `frontend/src/styles/auth.css` |
| M | `docs/task-2-ui-enhancement/README.md` |

**Phase summary:** ✅ Done
- `AuthPage.jsx`:
  - semantic markup: `<main>`, two `<section>`s with the illustration side `aria-hidden`, and `<ul>` lists;
  - a "Real-time team chat" eyebrow and a gradient-accented headline;
  - features rendered from data with lucide icons and descriptions;
  - a primary **Get started** (`SignUpButton`) plus a secondary **I already have an account** (`SignInButton`);
  - a trust row;
  - two decorative "live" cards floating over the illustration.
- Wording change from the plan: the trust row says **"Encrypted in transit"**, not "end-to-end encryption". Stream Chat isn't E2E-encrypted, so the original wording would have been a false security claim.
- `auth.css`:
  - uses design tokens throughout;
  - fluid `clamp()` headline that no longer overflows on small screens;
  - visible `:focus-visible` ring on both CTAs and an entrance animation;
  - breakpoints at 1100, 900 and 480 px (stacked layout, full-width CTAs, decorative cards hidden on phones);
  - the illustration is lazy-loaded; global reduced-motion rules stop the float animations.
- Verified in the browser preview with a Clerk mock at 1280 × 860 and at 375 × 812. There is no horizontal overflow at 375 px. Lint is clean and the build succeeds.
- File changes: 0 added, 3 modified (3), exactly as planned.

---

## Phase 3 — Chat workspace

- `lib/axios.js`: an axios instance using `VITE_API_URL` that attaches the Clerk bearer token.
- `lib/api.js`: typed API helpers (`getStreamToken`, plus more in Task 3).
- `hooks/useStreamChat.js`: connects and disconnects the Stream client safely (StrictMode-safe, with cleanup, error and loading state).
- `HomePage.jsx`: two-pane workspace with the sidebar on the left and `Channel`, `Window`, `MessageList`, `MessageInput` and `Thread` on the right.
- `Sidebar.jsx`: workspace header, user menu (Clerk `UserButton`) and the channel list.
- `CustomChannelPreview.jsx`: `# channel` rows with unread badges and an active state.
- `CustomChannelHeader.jsx`: channel name, description, member count and an actions area (used by Task 3).
- `EmptyState.jsx`: shown when no channel is selected or the user has no channels yet.
- `stream-chat-theme.css`: overrides Stream's CSS variables to match the brand.
- Dependencies: `stream-chat`, `stream-chat-react`.

| | File |
|-|------|
| M | `frontend/package.json` |
| M | `frontend/package-lock.json` |
| A | `frontend/src/lib/axios.js` |
| A | `frontend/src/lib/api.js` |
| A | `frontend/src/hooks/useStreamChat.js` |
| M | `frontend/src/pages/HomePage.jsx` |
| A | `frontend/src/components/Sidebar.jsx` |
| A | `frontend/src/components/CustomChannelPreview.jsx` |
| A | `frontend/src/components/CustomChannelHeader.jsx` |
| A | `frontend/src/components/EmptyState.jsx` |
| A | `frontend/src/styles/workspace.css` |
| A | `frontend/src/styles/stream-chat-theme.css` |
| M | `docs/task-2-ui-enhancement/README.md` |

**Phase summary:** ✅ Done
- Dependencies: `stream-chat@^9.54.0` and `stream-chat-react@^13.14.6`. v13 is pinned on purpose, because v14 changed its component APIs. npm warns that the nested `react-image-gallery` peer range stops at React 18; `stream-chat-react` 13 itself supports React 19.
- `lib/axios.js`: an axios instance on `VITE_API_URL` with a 15 s timeout. An interceptor attaches Clerk's session JWT as a `Bearer` token, because the cross-origin API never receives Clerk's cookie.
- `lib/api.js`: the `getStreamToken()` helper.
- `useStreamChat`:
  - each effect run owns its own `StreamChat` instance with a `cancelled` guard, so StrictMode's double mount can't disconnect the live client;
  - name and avatar are read through a ref, so profile edits don't force a reconnect;
  - returns `{ chatClient, isLoading, error, retry }`.
- `HomePage`: a `Chat` → `Sidebar` + `Channel` (`Window` with the custom header, `MessageList`, auto-focused `MessageInput`, plus `Thread`). A "Pick a conversation" `EmptyState` shows when no channel is selected.
- `Sidebar`: brand header with Clerk `UserButton`, a "Channels" section with a `ChannelList` (the user's `messaging` channels sorted by latest message, presence on, first channel auto-selected), an empty-list hint, and a footer card for the current user.
- `CustomChannelPreview`: `#` or 🔒 icon, ellipsized name, active and unread styles, a red badge capped at 99+, and `aria-current`. The unread count is announced through `.sr-only` text.
- `CustomChannelHeader`: name, description, member count, an "N online" watcher pill, and an empty actions slot for Task 3.
- `stream-chat-theme.css` re-maps Stream's v2 variables to the brand tokens (purple own-message bubbles, Inter, rounder radii), plus a card-style composer with a focus ring and a bordered thread panel. `workspace.css` holds the layout, sidebar, preview rows, header, empty state and shared `.btn` / `.icon-btn` styles.
- Verified with an offline mock Stream client seeded with 5 channels (preview only, never committed) at 1366 × 800:
  - the sidebar, active and unread states and the private-channel icon render;
  - the header stats render, and own and other messages are styled correctly;
  - switching channels updates the active row, header and messages.
- One fix came out of the preview: the unread badge's `aria-label` on a `<span>` isn't announced, so the count moved to visually hidden text.
- Lint is clean and the build succeeds. Vite warns that the chunk is over 500 kB (the Stream SDK); route-level code splitting is planned in Task 3 Phase 3, which already touches `App.jsx`.
- File changes: 9 added, 4 modified (13), exactly as planned.

---

## Phase 4 — Responsive layout, error handling & polish

- Mobile: the sidebar becomes an off-canvas drawer with a backdrop, closes after a channel is picked, and the header gets a menu button.
- `ErrorBoundary.jsx`: an app-wide fallback screen with a "Reload" action instead of a white screen.
- A friendly error state with retry when the Stream connection or token fetch fails.
- Micro-interactions: hover and active transitions, skeleton loading rows in the channel list.

| | File |
|-|------|
| M | `frontend/src/pages/HomePage.jsx` |
| M | `frontend/src/components/Sidebar.jsx` |
| M | `frontend/src/components/CustomChannelHeader.jsx` |
| A | `frontend/src/components/ErrorBoundary.jsx` |
| M | `frontend/src/main.jsx` |
| M | `frontend/src/styles/workspace.css` |
| M | `docs/task-2-ui-enhancement/README.md` |

**Phase summary:** _pending_

---

## Task 2 — total file changes

| Phase | Added | Modified | Deleted | Total |
|------:|------:|---------:|--------:|------:|
| 1 | 1 | 7 | 0 | 8 |
| 2 | 0 | 3 | 0 | 3 |
| 3 | 9 | 4 | 0 | 13 |
| 4 | 1 | 6 | 0 | 7 |
| **Unique files (whole task)** | **11** | **10** | **0** | **21** |

> Files touched in more than one phase (`package.json`, `package-lock.json`, `main.jsx`, `HomePage.jsx`, `Sidebar.jsx`, `CustomChannelHeader.jsx`, `workspace.css`, this README) are counted once in the unique total.

**Verification for every phase:** `npm run lint` and `npm run build` in `frontend/` both pass.
