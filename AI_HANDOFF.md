# SkipOPDQ – AI / Developer Handoff

This file records the state of the project, how it is built, the decisions taken and the pitfalls found, so that a new developer or AI assistant can continue without re-discovering them.
Read it together with `README.md` (features, setup, demo script) and `CLAUDE.md` (working rules).

_Last updated: 24 Nov 2026 · Version 0.6 · 9 git commits_

---

## 1. What this project is

**SkipOPDQ** is a smart hospital doctor-availability and OPD queue management web app. Tagline: *"Skip the OPD queue. Arrive when it's your turn."*

It is a **final-year college project**, presented as a product under active development:

- **Phase 1 (MVP)** is built and works end to end.
- **Phase 2** features are **visible but deliberately not built**. They appear as disabled controls with a "Coming Soon – Phase 2" badge, and their APIs return HTTP 501.
- The `/progress` page shows **65%** overall (`OVERALL` in `client/src/pages/Progress.jsx`). It was 60% before cancellation & rescheduling was added. Change this number only on purpose, because it is part of the presentation story.

## 2. Current status

### Done (Phase 1)
- Auth: patient self-registration, JWT login, role-based routes (`patient` / `doctor` / `admin`), one-click demo logins.
- Patient: find doctors (search + filters, live status), doctor details with weekly schedule, book a token for **today**, My Appointments (today / upcoming / past), **Live Queue** page (real-time), turn-approaching toasts.
- **Cancellation & rescheduling** (added last; was originally Phase 2), for patients (own bookings) and admin/reception (any booking).
- Doctor: one-tap status, delay and note; Call Next, Mark Done, Skip; today's queue with summary cards.
- Admin: live dashboard, departments, doctors (auto-creates the login with password `doctor123`), weekly schedules, appointments monitor with a date filter, walk-ins.
- Real-time updates with Socket.IO.
- `/progress` page, README and demo script.

### Still Phase 2 – show as placeholders, do NOT implement unless asked
1. SMS / WhatsApp notifications
2. Advanced analytics (the Analytics page uses hard-coded **sample data** with a "Preview" banner)
3. Mobile app (section on the Landing page)
4. ABHA / ABDM ID linking
5. Online payment / priority booking (₹)
6. TV token display board
7. Multi-hospital support (disabled "Switch Hospital" dropdown)

Backend placeholders: `server/src/routes/phase2.routes.js` and `server/src/controllers/phase2.controller.js`, each marked `// TODO: Phase 2`.
UI placeholders use `client/src/components/ComingSoonBadge.jsx` (`ComingSoonBadge`, `Phase2Button`, `Phase2Tooltip`) and the `.phase2-disabled` CSS class.
**When you build a Phase 2 feature:** remove its 501 route, swap the disabled UI for the real thing, update `Progress.jsx` (item status + `OVERALL`), and move it from "pending" to "completed" in `README.md`.

## 3. Running it

```bash
npm install     # root; postinstall also installs server/ and client/
npm run dev     # concurrently: API http://localhost:5000 + Vite http://localhost:5173
```

- Requires Node 18 or newer (developed on Node 22). **No MongoDB install is needed.** If `MONGO_URI` is empty, `mongodb-memory-server` starts an in-memory DB and **re-seeds demo data dated today on every server start**. Restarting the server resets the demo.
- The first run downloads a MongoDB binary (~100 MB) into `server/.mongodb-binaries/`. This folder is configured in `server/package.json` → `config.mongodbMemoryServer` and is git-ignored.
- `node --watch-path=src` restarts the server when files in `server/src` change. **Each restart re-seeds**, so all demo data resets while you edit backend code.
- `npm run seed` is only used with a persistent `MONGO_URI`, and it wipes that DB.
- Demo logins use the password `demo123`: `admin@skipopdq.demo`, `doctor@skipopdq.demo` (Dr. Rajesh Sharma, live queue), `patient@skipopdq.demo` (Amit Verma, token #6 waiting in Dr. Sharma's queue).

## 4. Architecture

```
client (React 18 + Vite + Tailwind 3)  ──/api, /socket.io (Vite proxy)──►  server (Express 4 + Socket.IO 4 + Mongoose 8)  ──► MongoDB / in-memory
```

### Backend (`server/src`)
| Area | Files |
|---|---|
| Entry | `index.js` – Express, routes, error handler, Socket.IO init, connects the DB and auto-seeds |
| Models | `User`, `Department`, `Doctor` (live `status`, `delayMinutes`, `statusNote`), `Schedule` (weekly sessions), `Appointment` (token, status, source, cancel/reschedule links) |
| Core logic | `utils/waitTime.js` – **pure** waiting-time engine; `utils/queueSnapshot.js` – builds doctor views and queue snapshots from the DB; `utils/token.js` – next token per doctor per day |
| Real-time | `socket/index.js` – rooms + `broadcastQueue()` / `broadcastDoctorStatus()` |
| Controllers | auth, department, doctor, schedule, appointment, **appointmentChange** (cancel / reschedule), queue (doctor actions), admin, phase2 |
| Middleware | `auth.js` (`protect`, JWT), `role.js` (`authorize(...roles)`) |
| Seed | `seed/seed.js` – 6 departments, 9 doctors, 5 patients, schedules for every day, today's queues |

### Frontend (`client/src`)
- `context/AuthContext.jsx` – stores the JWT in localStorage (`skipopdq_token`); `HOME_BY_ROLE` sets where each role lands after login.
- `context/SocketContext.jsx` – **one app-lifetime socket singleton**, plus the hooks `useQueueRoom(doctorId, date, handlers)` and `useHospitalRoom(handlers)`. These re-join rooms after a reconnect.
- `pages/patient/LiveQueue.jsx` – the main demo screen.
- `components/AppointmentActions.jsx` – Cancel and Reschedule buttons with their dialogs, shared by the patient and admin pages.
- Brand colours live in `tailwind.config.js` (`primary` = teal `#0B7A75`, `coral` = `#F26B5B`); shared classes (`.card`, `.btn-primary`, `.input`, …) are in `index.css`.

## 5. Key business rules (keep them consistent)

- **Dates** are local `"YYYY-MM-DD"` strings (`utils/date.js` `todayStr()`), never UTC.
- **Token numbers** auto-increment per doctor per day. A unique index on `(doctor, date, tokenNumber)` plus a retry loop in `createWithNextToken` handles races. Cancelled tokens leave gaps and numbers are never reused.
- Online and walk-in patients share the same token sequence.
- **Waiting time** = `patientsAhead × avgConsultationMinutes + delayMinutes`.
  - The patient in consultation counts as one of the patients ahead.
  - If the OPD session hasn't started yet, the countdown starts at the session start.
  - When the doctor is `unavailable`, the estimate is `null` and the UI shows "Doctor currently unavailable".
  - "Reach the OPD by" = expected time − 10 min (`ARRIVAL_BUFFER_MINUTES`), never earlier than now.
- **Booking** (today only) requires: doctor not `unavailable`, an OPD session today, capacity left (sum of `maxPatients`), and no active duplicate token for the same patient, doctor and day. Booking deliberately stays open all day so the demo works at any time.
- **Cancel / reschedule:**
  - Only `waiting` tokens, and never past dates. Patients can change only their own bookings; admins can change any.
  - Status updates are atomic (`findOneAndUpdate` with `status: 'waiting'`), so a token the doctor has just called can't be cancelled.
  - Reschedule window: today to +7 days, on days the doctor has OPD. The old token becomes `cancelled` with `rescheduledTo` set, and the new one gets `rescheduledFrom`. If creating the new token fails, the cancellation is rolled back.
- **Status note** belongs to a status. Changing status without sending a note clears it.
- **Call Next** completes the current in-consultation token and calls the lowest waiting token.

## 6. Real-time contract (Socket.IO)

- Rooms: `queue:<doctorId>:<YYYY-MM-DD>` and `hospital`.
- Client → server: `queue:join` / `queue:leave` `{ doctorId, date }`, `hospital:join` / `hospital:leave`. The server sends a fresh snapshot right after `queue:join`.
- Server → client:
  - `queue:updated` – full snapshot: `nowServing`, `counts`, and `tokens[]` with `patientsAhead`, `estimatedWaitMinutes`, `expectedAt`, `reachBy`. It contains **no patient names**, so it is safe to broadcast.
  - `doctor:statusChanged` – the doctor view.
- **Rule:** every endpoint that changes a queue or a doctor must call `broadcastQueue(doctorId, date)` or `broadcastDoctorStatus(doctorId)`, otherwise screens won't update live.
- Socket rooms are unauthenticated (MVP); see the TODO in `socket/index.js`.

## 7. Pitfalls already hit (don't reintroduce)

1. **React StrictMode double effects.** In development every `useEffect` runs twice.
   - Creating and closing a socket per mount caused "WebSocket closed before connection established"; the socket is now a module-level singleton.
   - The Schedules page reset the selected doctor when the second fetch resolved; it now uses `setDoctorId(cur => cur || first)`.
   - Never let an async load overwrite a selection the user already made.
2. **Doctor status note input.** A status or delay tap must not wipe a note the doctor is still typing. `DoctorDashboard.updateStatus` only syncs the input when it still equals the previously saved note.
3. **Toast spam.** Several status changes in a row stacked several toasts, so the doctor-status toast uses `id: 'doctor-status'`.
4. **Recharts is large**, so `Analytics` is lazy-loaded in `App.jsx` to keep the main bundle under the Vite size warning.
5. **Express route order:** `/me/...` routes must be declared before `/:id`.
6. `pkill -f "node src/index.js"` inside a shell whose command line contains that same text kills the shell too. Use a script file or PIDs.

## 8. Testing

There are no unit tests in the repo yet. The app was verified with:

- **curl scripts** against the API: auth, booking rules, walk-ins, queue actions, 501 placeholders, cancel/reschedule permissions.
- **Socket test:** a Node script with `socket.io-client` joined a queue room while doctor actions ran, and checked that waiting times changed: 30 → 20 min after Call Next, 35 min after Busy + 15 min delay, `null` when Unavailable.
- **Playwright end-to-end tests** (headless Chromium), with three or more browser sessions running the whole demo script: 23 checks for the main flows and 8 for cancel/reschedule. All passed, with no console warnings. The only console errors were two expected 409s from the tests that check duplicate bookings and overlapping schedules are rejected.
  These scripts were kept **outside the repo** and are not in this zip. Adding them under `e2e/` (with Playwright as a dev dependency) is a good next step.
- `npm run build` must pass with no warnings.

## 9. Conventions

- Controllers wrap handlers in `asyncHandler` and throw `new ApiError(status, 'friendly message')`; `errorHandler` turns Mongoose errors into readable messages. Messages are written for end users.
- Validate on the backend (it is the source of truth) and mirror the important checks in the UI for instant feedback.
- Every page has loading, empty and error states (`Loader`, `EmptyState`).
- Demo data is realistic Indian hospital data. No lorem ipsum.
- Commits follow logical phases; keep that style (`git log --oneline` shows the story).

## 10. Suggested next steps

1. Add the Playwright tests to the repo, plus unit tests for `utils/waitTime.js`, which is a pure function and easy to test.
2. Close booking after the day's last OPD session ends (currently left open on purpose for demos).
3. Authenticate Socket.IO with the JWT.
4. Let patients book future dates directly (rescheduling already supports future dates).
5. Then the Phase 2 list in section 2, in whatever order the presentation needs.
