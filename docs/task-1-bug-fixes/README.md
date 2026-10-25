# Task 1 — Bug Fixes & Stabilisation

> **Branch:** `fix/core-bugs` (cut from `main` after the `docs/project-roadmap` PR is merged)
> **Goal:** make the existing app run correctly and safely on every OS and on Vercel *before* any UI or feature work starts.
> **Status:** ✅ Complete — Phase 1 ✅ · Phase 2 ✅ · Phase 3 ✅

---

## Workflow

1. Work happens phase by phase on `fix/core-bugs`.
2. After each phase, the phase's status and summary are updated in this file and a commit statement is provided.
3. **You** stage, commit and push. Nothing is committed automatically.
4. After the last phase you open the PR `fix/core-bugs → main` and merge it.

Legend for file changes: **A** = added, **M** = modified, **D** = deleted.

---

## Phase overview

| Phase | Scope | Bugs fixed | Files | Status |
|------:|-------|-----------:|------:|--------|
| 1 | Backend configuration, environment & startup | 8 | 8 | ✅ |
| 2 | Backend webhooks (Inngest), Stream helpers & API | 10 | 7 | ✅ |
| 3 | Frontend routing, lint & repo hygiene | 9 | 9 | ✅ |

---

## Phase 1 — Backend configuration, environment & startup

| ID | Bug | Impact | Fix |
|----|-----|--------|-----|
| B1 | npm scripts use the Windows-only `set NODE_OPTIONS=… &&` syntax | `npm run dev` / `npm start` break on macOS, Linux and CI | Cross-platform `node --import ./instrument.mjs` |
| B2 | `ENV.CLIENT_URL` is used for CORS but never defined in `env.js` | CORS falls back to `*`, which browsers reject for credentialed requests | Add `CLIENT_URL` to `ENV` |
| B3 | Required env vars are never validated | Cryptic crashes deep inside Stream, Clerk or Mongo | Fail fast at startup with a clear list of what is missing |
| B4 | `connectDB` opens a new connection on every Inngest call and calls `process.exit(1)` on failure | One transient DB error inside a webhook kills the dev server or serverless function | Cache the connection and throw instead of exiting |
| B5 | Duplicate model file `models/user. model.js` (space in the name) | Dead code, and an `OverwriteModelError` if it is ever imported | Delete it |
| B6 | Frontend stylesheet `backend/src/styles/auth.css` left in the backend | Dead file, confusing | Delete it |
| B7 | Sentry: `profilesSampleRate` without the profiling integration, 100 % tracing and `sendDefaultPii: true` in production | No-op option, high quota usage, user IPs sent to a third party | Sample rates based on environment, PII only in development |
| B8 | No `.env.example` | New contributors can't tell which variables are needed | Add a documented template |

**File changes (fixed list)**

| | File |
|-|------|
| M | `backend/package.json` |
| M | `backend/instrument.mjs` |
| M | `backend/src/config/env.js` |
| M | `backend/src/config/db.js` |
| D | `backend/src/models/user. model.js` |
| D | `backend/src/styles/auth.css` |
| A | `backend/.env.example` |
| M | `docs/task-1-bug-fixes/README.md` |

**Verification:** `node --check` on every backend file. The server must fail with a readable message when required env vars are missing.

**Phase summary:** ✅ Done
- Both npm scripts now use `node --import ./instrument.mjs` (with `nodemon --exec` for dev), so they run the same on Windows, macOS, Linux and CI. Added `engines.node >= 20.6`, which `--import` requires.
- `env.js` validates the five required variables at import time and also requires `INNGEST_SIGNING_KEY` in production. It defines `CLIENT_URL` (default `http://localhost:5173`) and defaults `NODE_ENV` to `development`.
- `connectDB` caches its connection promise, reuses an open connection, resets on failure so a retry is possible, and throws instead of calling `process.exit`.
- Sentry samples 100 % of traces in development and 10 % in production. Local variables and default PII are only sent outside production. The unused `profilesSampleRate` is removed.
- Deleted the duplicate `user. model.js` and the stray backend `auth.css`. Added a documented `backend/.env.example`.
- Verified:
  - `node --check` passes on all backend files.
  - `npm start` with no `.env` prints `Missing required environment variables: MONGO_URI, CLERK_PUBLISHABLE_KEY, …`.
  - With `NODE_ENV=production` and no Inngest key, it reports `INNGEST_SIGNING_KEY`.
  - With an unreachable database, the start script boots and exits with code 1.
- File changes: 1 added, 5 modified, 2 deleted (8), exactly as planned.

---

## Phase 2 — Backend webhooks (Inngest), Stream helpers & API

| ID | Bug | Impact | Fix |
|----|-----|--------|-----|
| B9 | `deleteStreamUser` is called in `inngest.js` but never imported | `ReferenceError` on every `clerk/user.deleted`; deleted users stay in Stream | Import it |
| B10 | `syncUser` uses `User.create` | Inngest retries throw duplicate-key errors (not idempotent) | Idempotent `findOneAndUpdate(..., { upsert: true })` |
| B11 | Users without an email, or without a first or last name, produce invalid documents (`name: " "`) | Validation errors and endless retries | Safe fallbacks (primary email → first email → generated; name → username → email prefix) |
| B12 | `addUserToPublicChannels` exists but is never called | New users never see existing public channels | Call it as a step of `syncUser` |
| B13 | `addUserToPublicChannels` only reads the first page of channels (default limit 10) | Users are only added to 10 channels | Paginate through every page |
| B14 | `clerk/user.updated` isn't handled | Name and avatar changes never reach Mongo or Stream | New `update-user` Inngest function |
| B15 | Stream helpers swallow errors | Inngest reports failed syncs as successful, so they are never retried | Re-throw after logging |
| B16 | `getStreamToken` returns `200 { token: null }` when token generation fails | The frontend gets a "valid" response that can't be used | Return 500 when no token is produced |
| B17 | `protectRoute` relies on `isAuthenticated`, which isn't present on every `@clerk/express` 1.x auth object | Possible auth bypass or false 401s | Check `userId` |
| B18 | `/debug-sentry` throws on purpose in production, and there is no 404 or JSON error handler | Public crash endpoint; Express HTML error pages leak stack traces | Debug route only outside production, plus `notFound` and `errorHandler` middleware |

**File changes (fixed list)**

| | File |
|-|------|
| M | `backend/src/config/inngest.js` |
| M | `backend/src/config/stream.js` |
| M | `backend/src/controllers/chat.controller.js` |
| M | `backend/src/middleware/auth.middleware.js` |
| A | `backend/src/middleware/error.middleware.js` |
| M | `backend/src/server.js` |
| M | `docs/task-1-bug-fixes/README.md` |

**Verification:** `node --check` on every backend file, plus an import smoke test of the middleware modules.

**Phase summary:** ✅ Done
- `inngest.js` now runs every side effect as a named `step.run`, so a failed step is retried on its own. It:
  - imports `deleteStreamUser`,
  - upserts users idempotently,
  - builds profiles with safe email and name fallbacks,
  - adds new users to all public channels,
  - handles `clerk/user.updated`.
- `stream.js` re-throws errors (a 404 on delete counts as success), pages through every discoverable channel 30 at a time, and exports the shared `streamClient` for later API work.
- `chat.controller.js` returns 500 instead of `200 { token: null }`. `protectRoute` checks `userId`.
- `server.js`:
  - `/debug-sentry` only exists outside production;
  - new `GET /api/health` reports the database state;
  - `CLIENT_URL` accepts a comma-separated list of origins;
  - JSON `notFound` and `errorHandler` sit after the Sentry handler;
  - a failed DB connection no longer kills the Vercel function.
- New `error.middleware.js`: 500 responses hide internals, 4xx messages pass through, and the stack is only included outside production.
- Verified with a live HTTP smoke test of the real app:

  | Request | Result |
  |---------|--------|
  | `GET /api/health` | 200 |
  | `GET /debug-sentry` in production | 404 JSON |
  | Unknown route | 404 JSON |
  | `GET /api/chat/token` without a session | 401 |
  | Allowed origin | `Access-Control-Allow-Origin` echoed |
  | Disallowed origin | no CORS header |
  | Bad Inngest signature | 401 |
  | Thrown error | `500 {"message":"Internal server error"}` |
  | Malformed JSON body | 400 with the parse message |

- File changes: 1 added, 6 modified (7), exactly as planned.

---

## Phase 3 — Frontend routing, lint & repo hygiene

| ID | Bug | Impact | Fix |
|----|-----|--------|-----|
| F1 | Two `<Routes>` blocks inside `<SignedIn>`: the second sends `*` to `/auth`, the first sends `/auth` back to `/` | **Infinite redirect loop** for every signed-in user | One route table per auth state |
| F2 | Unused imports (`SignInButton`, `UserButton`) in `App.jsx` | Dead code that bloats the module (the lint rule's `^[A-Z_]` ignore pattern hides it, so lint never flagged it) | Remove them |
| F3 | Stray `{" "}` text nodes inside `<Routes>` | Invalid children, noisy markup | Remove them |
| F4 | Unused `React` import in `HomePage.jsx` | Dead code | Remove it |
| F5 | `<title>frontend</title>` and the default Vite favicon | Unprofessional browser tab | Brand title and favicon |
| F6 | `index.css` is empty | The default 8 px body margin draws a white frame around the auth page, and there's no `box-sizing` reset | Minimal base reset |
| F7 | A missing Clerk key throws an unhelpful error, and there's no frontend `.env.example` | Hard to set up | Clear error message and a template |
| F8 | The root `.gitignore` only ignores `.env` | `.env.local`, `.env.production`, `dist/` and logs could be committed | Extended ignore list |
| F9 | No SPA rewrite for Vercel | Refreshing any deep link (for example `/auth`) returns 404 in production | `frontend/vercel.json` with a rewrite to `index.html` |

**File changes (fixed list)**

| | File |
|-|------|
| M | `frontend/src/App.jsx` |
| M | `frontend/src/pages/HomePage.jsx` |
| M | `frontend/src/main.jsx` |
| M | `frontend/index.html` |
| M | `frontend/src/index.css` |
| A | `frontend/.env.example` |
| A | `frontend/vercel.json` |
| M | `.gitignore` |
| M | `docs/task-1-bug-fixes/README.md` |

**Verification:** `npm run lint` and `npm run build` in `frontend/` both pass.

**Phase summary:** ✅ Done
- `App.jsx` has one route table per auth state. Signed-in users get `/`, and everything else redirects to `/`. Signed-out users get `/auth`, and everything else redirects to `/auth`. This removes the `/` ↔ `/auth` redirect loop. The dead imports and stray `{" "}` text nodes are gone.
- `HomePage.jsx` drops the unused `React` import. `main.jsx` gives an actionable missing-key error and sets `afterSignOutUrl="/auth"`.
- `index.html` has the title "Slap — Where Work Happens" and the brand logo as favicon. `index.css` gets a minimal reset (box-sizing, zero body margin, a dark base background matching the auth page).
- Added `frontend/.env.example` (Clerk key, API URL, Stream key) and `frontend/vercel.json` (SPA rewrite, so deep links stop returning 404 on refresh).
- The root `.gitignore` now ignores `.env.*` (keeping `.env.example`), `dist`, `.vercel`, logs and OS/editor files. Checked with `git check-ignore`.
- Verified: `npm run lint` passes with 0 problems, and `npm run build` succeeds (316 kB JS, 97 kB gzip). The routing fix was checked by reading the route tables. It couldn't be exercised in a browser here because no Clerk key is configured.
- Correction to the plan: the original `App.jsx` did *not* fail lint (see F2). The fix stands; only the impact description changed.
- File changes: 2 added, 7 modified (9), exactly as planned.

---

## Task 1 — total file changes

| Phase | Added | Modified | Deleted | Total |
|------:|------:|---------:|--------:|------:|
| 1 | 1 | 5 | 2 | 8 |
| 2 | 1 | 6 | 0 | 7 |
| 3 | 2 | 7 | 0 | 9 |
| **Unique files (whole task)** | **4** | **16** | **2** | **22** |

> `docs/task-1-bug-fixes/README.md` is modified in every phase but counted once in the unique total.
> Bugs fixed in total: **27** (B1–B18 backend, F1–F9 frontend).
