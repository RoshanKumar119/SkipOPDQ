# CLAUDE.md – SkipOPDQ

Final-year college project: smart hospital doctor-availability and OPD queue platform (React + Express + Socket.IO + MongoDB).
**Read `AI_HANDOFF.md` first.** It covers the current state, architecture, business rules and pitfalls. `README.md` covers features, setup and the demo script.

## Commands
- `npm install` – installs root, `server/` and `client/` (postinstall)
- `npm run dev` – API on :5000 + web app on :5173. Uses an in-memory MongoDB that **re-seeds demo data on every server restart** (including `--watch` restarts).
- `npm run build` – client production build; must finish with no warnings
- Demo logins (password `demo123`): `admin@skipopdq.demo`, `doctor@skipopdq.demo`, `patient@skipopdq.demo`

## Rules for this project
- The project is presented as **Phase 1 MVP, about 65% complete**. Phase 2 features (SMS/WhatsApp, real analytics, mobile app, ABHA, priority payment, TV display board, multi-hospital) must stay **visible but disabled** (`ComingSoonBadge` / `Phase2Button`, API returns 501). Don't build them unless explicitly asked.
- When a Phase 2 feature is built: remove its 501 stub, update `client/src/pages/Progress.jsx` (item + `OVERALL`) and the README.
- Any endpoint that changes a queue or a doctor's status must call `broadcastQueue()` or `broadcastDoctorStatus()` from `server/src/socket`.
- Dates are local `YYYY-MM-DD` strings (`server/src/utils/date.js`), never UTC.
- Waiting time = patients ahead × avg consultation minutes + delay minutes (`server/src/utils/waitTime.js`, a pure function).
- Throw `ApiError(status, userFriendlyMessage)` inside `asyncHandler` in controllers; validate on the server and mirror the checks in the UI.
- React StrictMode runs effects twice in development: never let an async load overwrite a user's selection, and keep the socket a singleton.
- Keep the teal (#0B7A75) and coral (#F26B5B) design, loading/empty/error states, and realistic Indian demo data (no lorem ipsum).
- Commit in logical phases with clear messages.
