# Slap — frontend

React 19 + Vite single-page app for the Slap workspace. See the [root README](../README.md) for the full project setup.

## Scripts

```bash
npm run dev       # Vite dev server on http://localhost:5173
npm run build     # production build into dist/
npm run preview   # serve the production build
npm run lint      # ESLint
```

## Environment

Copy `.env.example` to `.env`:

| Variable | Description |
|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (the app throws a clear error without it) |
| `VITE_API_URL` | Backend base URL, e.g. `http://localhost:5000/api` |
| `VITE_STREAM_API_KEY` | Stream API key (public) |

## How it fits together

| Area | Where | Notes |
|------|-------|-------|
| Routing | `src/App.jsx` | One route table per auth state. `/` and `/call/:id` are lazy-loaded, so the chat and video SDKs ship only when needed |
| API calls | `src/lib/axios.js`, `src/lib/api.js` | The axios interceptor attaches the Clerk session JWT; `getErrorMessage` surfaces server messages |
| Chat connection | `src/hooks/useStreamChat.js` | StrictMode-safe connect and disconnect with loading, error and retry state |
| Workspace | `src/pages/HomePage.jsx` | Sidebar, channel window, threads, ⌘K search, jump-to-message |
| Sidebar | `src/components/Sidebar.jsx` | Channel list (DMs filtered out), Direct messages (`UsersList`), create and browse channel modals |
| Channel header | `src/components/CustomChannelHeader.jsx` | DM presence, video call, members, invite, pinned messages, leave |
| Video | `src/pages/CallPage.jsx` | Stream Video call with speaker layout and controls |
| Dialogs | `src/components/Modal.jsx` | Native `<dialog>`: focus trap, Escape, backdrop click, `data-autofocus` |
| Errors | `src/components/ErrorBoundary.jsx` | App-wide crash screen with reload |

## Styling

Plain CSS with design tokens. There is no CSS framework.

- `src/index.css`: tokens (colour, type, spacing, radius, shadow, motion, z-index), reset, focus rings, reduced motion, loader
- `src/styles/workspace.css`: layout, sidebar, channel and DM rows, header, empty and error states, responsive drawer
- `src/styles/modal.css`: dialogs, form controls, pickers, lists, search
- `src/styles/stream-chat-theme.css`: maps Stream Chat's CSS variables to the brand
- `src/styles/call.css`: video call page and Stream Video theme
- `src/styles/auth.css`: landing page

## Accessibility

- Visible `:focus-visible` rings, and `prefers-reduced-motion` is respected.
- Icon-only buttons have `aria-label`s, and unread counts and presence are announced with `.sr-only` text.
- Dialogs use native `<dialog>`, and search is a combobox/listbox with arrow-key navigation.
- On mobile, the closed sidebar drawer is removed from the tab order.
