# SkipOPDQ – Project Guide (what it does, how it works, every file explained)

This guide explains **what SkipOPDQ is, what every module does, how to demo it, and what every file in the project is for.** It is written so that someone who has never seen the project can understand it by reading. To install and run it, read `docs/SETUP_GUIDE.md` first.

---

## Part 1 – The big picture

### 1.1 The problem

In most hospitals, patients visit the **OPD (Out-Patient Department)** without knowing:

- whether their doctor is in today,
- the OPD timing,
- whether the doctor is running late,
- how many patients are already waiting,
- when they should actually arrive.

So everyone arrives early and waits for hours, and the waiting area gets overcrowded. Elderly patients, pregnant women and parents with sick children suffer most.

### 1.2 The solution

**SkipOPDQ** is a web app that connects three kinds of users. The idea in four words: **Search → Book → Track → Arrive.**

| User | What they do |
|---|---|
| **Patient** | Finds a doctor, sees if they are available, books a **token** (queue number) for today, watches the queue live on their phone/laptop and arrives only when their turn is close |
| **Doctor** | Sets their status (Available / Busy / Unavailable) and delay with one tap, then runs the queue: **Call Next**, **Mark Done**, **Skip** |
| **Admin / Reception** | Manages departments, doctors and OPD schedules, watches every queue live, adds walk-in patients and can cancel/reschedule any token |

Everything updates **instantly with no page refresh** (using WebSockets via Socket.IO).

### 1.3 How the waiting time is calculated

```
Estimated waiting time = (patients ahead × doctor's average consultation minutes) + doctor's delay minutes
```

Example: you are token #6, tokens 4 and 5 are waiting and token 3 is inside with the doctor. That gives 3 patients ahead. The doctor averages 10 minutes per patient and is running 0 minutes late, so you wait 3 × 10 + 0 = **30 minutes**.

Details:
- The patient currently inside the doctor's room counts as one patient ahead.
- If today's OPD session hasn't started yet, the countdown starts from the session start time.
- If the doctor is **Unavailable**, no estimate is shown (the page says "Doctor currently unavailable").
- "Reach the OPD by" = expected time minus 10 minutes (never earlier than now).

This calculation is done by the **server** every time a queue or doctor status changes, and the result is pushed to everyone watching.

### 1.4 Phase 1 (built) and Phase 2 (planned)

The project is presented as an **MVP (Phase 1), about 65 % complete**.

**Phase 1 – working:** registration and login with roles, doctor search, booking, My Appointments, cancel and reschedule, Live Queue, doctor dashboard, admin dashboard, departments, doctors, schedules, appointment monitor, walk-ins, real-time updates, progress page.

**Phase 2 – shown in the UI as disabled "Coming Soon" items; the matching APIs return HTTP 501 (Not Implemented):**

1. SMS / WhatsApp notifications
2. Advanced analytics (the Analytics page shows sample data with a "Preview" banner)
3. Mobile app (landing page section)
4. ABHA / ABDM health ID linking
5. Online payment / priority booking
6. TV token display board
7. Multi-hospital support

### 1.5 Technology used (and why)

| Layer | Technology | Plain-English role |
|---|---|---|
| Website | **React 18** + **Vite** | Builds the pages; Vite is the fast dev server |
| Styling | **Tailwind CSS** | Utility classes for the teal/coral design |
| Page navigation | **React Router** | Moves between pages without reloading |
| Server calls | **Axios** | Sends requests from the browser to the server |
| Live updates (browser) | **socket.io-client** | Listens for queue changes |
| Notifications | **react-hot-toast** | Small pop-up messages |
| Icons / charts | **lucide-react**, **Recharts** | Icons; charts on the preview Analytics page |
| Server | **Node.js** + **Express** | Receives requests and runs the logic (REST API) |
| Live updates (server) | **Socket.IO** | Pushes changes to every connected browser |
| Database | **MongoDB** via **Mongoose** | Stores users, doctors, schedules, appointments |
| Demo database | **mongodb-memory-server** | A temporary MongoDB that starts by itself, so no install is needed |
| Security | **JWT** (jsonwebtoken), **bcryptjs** | Login tokens; password hashing |
| Misc | **dotenv**, **cors**, **concurrently** | Reads `.env`; allows the browser to call the API; runs client and server with one command |

### 1.6 How the pieces connect

```
 Browser (React app, port 5173)
    │  1. normal requests:  /api/...         (Axios, with login token)
    │  2. live connection:  /socket.io/...   (WebSocket)
    ▼
 Vite dev server  ── proxies /api and /socket.io ──►  Express + Socket.IO server (port 5000)
                                                          │
                                                          ▼
                                                  MongoDB (in-memory or real)
```

The **Vite proxy** (in `client/vite.config.js`) means the website can call `/api/...` with a relative address and Vite forwards it to port 5000. That's why the code has no hard-coded server URLs.

**A typical flow, "doctor taps Call Next":**
1. The doctor's browser sends `POST /api/queue/me/call-next` with their login token.
2. The server checks the token (`auth` middleware) and the role (`role` middleware: doctor only).
3. The controller finishes the current patient, calls the lowest waiting token and saves it to MongoDB.
4. The controller calls `broadcastQueue(doctorId, date)`.
5. The server builds a fresh **queue snapshot** with new waiting times and emits `queue:updated` to the Socket.IO room for that doctor and day.
6. Every patient watching that queue gets the snapshot and their screen changes. No refresh happens.

---

## Part 2 – Demo guide

### 2.1 Before you start

- Make sure `npm run dev` is running (see `SETUP_GUIDE.md`).
- **Restart `npm run dev` right before a presentation** so the demo data is fresh.
- Use **two browser windows**: one normal and one **incognito/private**. This lets two people be logged in at once.

### 2.2 Demo accounts

All use password **`demo123`**. The login page has **Demo Login** buttons for one-click access.

| Role | Email | Who they are |
|---|---|---|
| Admin | `admin@skipopdq.demo` | Hospital reception / admin |
| Doctor | `doctor@skipopdq.demo` | Dr. Rajesh Sharma, General Medicine, Room OPD-101, has a live queue |
| Patient | `patient@skipopdq.demo` | Amit Verma, holds **token #6** (waiting) in Dr. Sharma's queue |

Demo hospital: *City Care Multispeciality Hospital (Demo), Pune*. It has 6 departments, 9 doctors (one **Busy** "In emergency procedure at Cath Lab" and one **Unavailable** "On leave today"), weekly schedules for every day, 5 patients and live queues for today.

### 2.3 The 7-step demo script

1. **Open two windows.** Window 1 is normal, Window 2 is incognito. Open http://localhost:5173/login in both.
2. **Window 1 (patient):** click **Login as Patient** → **My Appointments** → **Track Live** on token #6. The page shows *Your Token 6*, *Now Serving 3*, *3 patients ahead* and about *30 min* waiting.
3. **Window 2 (doctor):** click **Login as Doctor**, then click **Call Next** (and **Mark Done** if you like).
4. **Watch Window 1.** *Now Serving*, *patients ahead* and the *waiting time* change instantly. When only 2 patients are ahead a **"Your turn is approaching"** notification appears. Keep clicking **Call Next** until the patient sees **"It's your turn!"**.
5. **Cancel / reschedule.** In Window 1 go to **My Appointments** and try **Reschedule** (pick tomorrow) or **Cancel** on a waiting token. Window 2's queue updates immediately.
6. **Doctor status.** In Window 2 set status **Busy**, type the note *In emergency surgery* and tap **+15m**. The patient screen instantly shows the busy note and the waiting time grows by 15 minutes. Tap **Unavailable** and the patient sees "Doctor currently unavailable" in place of a time.
7. **Admin.** Log out and click **Login as Admin**. Show the **live dashboard** (the doctor table changes as the doctor acts), **Appointments & Walk-ins → Add Walk-in Patient**, **Analytics (preview)**, and finally the public **Project Progress** page at `/progress`.

### 2.4 More things to try

- **Register a new patient** (Register page), find a doctor, open the doctor's page and click **Book Token for Today**. You get the next token number.
- Try to book **twice** with the same doctor on the same day. It is blocked (no duplicate active tokens).
- Try to book with the **Unavailable** doctor. The button is disabled, with a reason.
- **Admin → Doctors → Add Doctor.** A login is created automatically with the password `doctor123`. Log in as that doctor in the incognito window.
- **Admin → Schedules.** Add an overlapping session. It is rejected with an error message.
- Click any **Coming Soon / Phase 2** button. It is greyed out with the tooltip "Planned for Phase 2".

---

## Part 3 – Module by module (what each role sees)

### 3.1 Public / common pages

| Page | Address | What it does |
|---|---|---|
| Landing | `/` | Explains the problem, the 4-step flow, who it's for, and the Phase 2 mobile app teaser |
| Login | `/login` | Email + password login and the one-click Demo Login buttons. After login, each role is sent to its own home page. |
| Register | `/register` | New **patient** self-registration |
| Find Doctors | `/doctors` | Search by name or specialization; filter by department; each card shows a live status badge, today's OPD timing, current token and number waiting |
| Doctor Details | `/doctors/:id` | Weekly OPD schedule, live status and delay note, and **Book Token for Today** |
| Project Progress | `/progress` | The public status page showing Phase 1 vs Phase 2 and the overall percentage |

### 3.2 Patient module (login required, role = patient)

- **Book a token** from a doctor's page. The token number auto-increments per doctor per day. The booking is refused when the doctor is unavailable, there is no OPD today, the day's capacity is full, or the patient already has an active token with that doctor today.
- **My Appointments** (`/appointments`) is split into **Today**, **Upcoming** and **Past**. Each waiting token has **Track Live**, **Reschedule** and **Cancel**.
- **Cancel:** only `waiting` tokens, with an optional reason. People behind you move up instantly.
- **Reschedule:** move a waiting token to another OPD day within the next 7 days that the doctor works. The old token is marked cancelled and linked to the new one.
- **Live Queue** (`/queue/:appointmentId`) is the star screen. It shows Your Token, Now Serving, patients ahead, estimated wait, suggested "reach by" time, a progress bar, a token strip and a pulsing **Live** dot. It also shows toasts when 2 patients are ahead and when it's your turn, and it tells you straight away if reception cancelled your token.
- **Profile** (`/profile`) shows account details, plus the disabled Phase 2 items **Notification Settings** and **Link ABHA ID**.

### 3.3 Doctor module (role = doctor, page `/doctor`)

- **Status buttons:** Available / Busy / Unavailable, broadcast live to all patients.
- **Delay buttons:** 0 / 10 / 15 / 30 minutes. This is added to everyone's waiting time.
- **Status note:** free text, such as "In emergency surgery". The note belongs to a status, so changing the status without sending a note clears it.
- **Today's queue** in token order, with summary cards (Total, Completed, Waiting, Skipped).
- **Call Next:** finishes the person currently inside and calls the lowest waiting token.
- **Mark Done:** completes the current consultation.
- **Skip:** marks a no-show.

### 3.4 Admin / reception module (role = admin, pages under `/admin`)

| Page | What it does |
|---|---|
| Dashboard `/admin` | Live cards (total doctors, available now, today's appointments, patients waiting) and a live table of every doctor's status |
| Appointments `/admin/appointments` | View appointments for any date (today and the next few days), filter by doctor and status, **cancel** or **reschedule** any waiting token, **Add Walk-in Patient** (name + mobile). Walk-ins share the same token queue. |
| Doctors `/admin/doctors` | Add / edit / list doctors. Adding one creates their login, with default password `doctor123`. |
| Departments `/admin/departments` | Add / edit / list departments |
| Schedules `/admin/schedules` | Weekly OPD sessions per doctor. Create / edit / remove, with **overlap validation**. A doctor can have several sessions in one day. |
| Analytics `/admin/analytics` | **Phase 2 preview.** Charts use sample data with a banner saying so |
| TV Display `/admin/display-board` | **Phase 2 placeholder** |

---

## Part 4 – Every file explained

Folder layout (generated files like `node_modules` are not shown):

```
skipopdq/
├── .gitignore
├── package.json
├── README.md
├── docs/                    ← these guides
├── server/                  ← backend
│   ├── package.json
│   ├── .env.example
│   └── src/ ...
└── client/                  ← frontend
    ├── package.json, index.html, vite.config.js, tailwind.config.js, postcss.config.js
    ├── public/
    └── src/ ...
```

### 4.1 Root files

| File | Purpose |
|---|---|
| `package.json` | Root scripts. `postinstall` installs `server` and `client` libraries; `dev` runs both together using `concurrently`; `start`, `seed` and `build` forward to the sub-projects |
| `package-lock.json` | Locks exact library versions so everyone gets the same install. Don't edit by hand. |
| `README.md` | Short overview of the features, setup, demo accounts and API list |
| `.gitignore` | Tells Git what not to upload (`node_modules`, `.env`, logs, the MongoDB binaries, AI docs) |
| `docs/` | These guides |

### 4.2 Server – `server/`

| File | Purpose |
|---|---|
| `package.json` | Server libraries and scripts (`dev` uses `node --watch-path=src` to restart on file save; `seed`; `start`). It also sets where the downloaded MongoDB binary goes. |
| `.env.example` | Template for optional settings (`PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`). Copy to `.env` to use. |

#### `server/src/index.js` – the entry point
Starts everything: loads `.env`, creates the Express app, enables CORS and JSON parsing, defines `/api/health` and `/api/meta`, mounts every route file, mounts the Phase 2 placeholder routes, adds the 404 and error handlers, attaches Socket.IO, connects to the database, **seeds demo data** (always for the in-memory DB, only if empty for a real DB) and listens on the port.

#### `server/src/config/`
| File | Purpose |
|---|---|
| `constants.js` | Shared fixed values: hospital name, roles, doctor statuses, appointment statuses, allowed delays (0/10/15/30), the default doctor password (`doctor123`), the 10-minute arrival buffer |
| `db.js` | Connects to MongoDB. With no `MONGO_URI` it starts the in-memory MongoDB (that's the ~100 MB first-run download). |

#### `server/src/models/` – the database tables ("collections")
| File | Stores |
|---|---|
| `User.js` | Every account: name, email, phone, hashed password, role (`patient` / `doctor` / `admin`). Passwords are hashed with bcrypt before saving and never returned in API responses. |
| `Department.js` | Department name (unique), description, location (floor/wing) |
| `Doctor.js` | Doctor profile linked to a User: department, specialization, qualification, experience, room, average consultation minutes, and the **live fields** `status`, `delayMinutes`, `statusNote`, `statusUpdatedAt` |
| `Schedule.js` | One weekly OPD session: doctor, day of week (0 = Sunday), start and end time (`HH:mm`), max patients. Validates that the end is after the start. |
| `Appointment.js` | One token: patient (or none for walk-ins), name/phone, doctor, date (`YYYY-MM-DD`), token number, status (`waiting`, `in-consultation`, `completed`, `skipped`, `cancelled`), source (`online` / `walk-in`), timestamps, and cancel/reschedule links. A unique index guarantees **one token number per doctor per day**. |

#### `server/src/routes/` – URL → controller maps
Each file only lists addresses, who may call them, and which controller function handles them.

| File | Base path | Covers |
|---|---|---|
| `auth.routes.js` | `/api/auth` | register, login, me |
| `department.routes.js` | `/api/departments` | list (public); add/edit (admin) |
| `doctor.routes.js` | `/api/doctors` | list/detail (public); own profile and status (doctor); add/edit (admin) |
| `schedule.routes.js` | `/api/schedules` | list (public); create/edit/delete (admin) |
| `appointment.routes.js` | `/api/appointments` | book, my appointments, detail, admin list, walk-in, cancel, reschedule |
| `queue.routes.js` | `/api/queue` | public queue snapshot; doctor's today queue, call-next, done, skip |
| `admin.routes.js` | `/api/admin` | dashboard statistics |
| `phase2.routes.js` | `/api/...` | Phase 2 placeholders, all answering **501** |

#### `server/src/controllers/` – the actual logic
| File | What it does |
|---|---|
| `auth.controller.js` | Registers patients, checks login (password compare), creates the JWT, returns the current user |
| `department.controller.js` | List, add and edit departments with validation |
| `doctor.controller.js` | Lists doctors with live status and queue summary; doctor detail; the doctor updates own status/delay/note (and broadcasts it); admin adds a doctor (also creates the login) or edits one |
| `schedule.controller.js` | Weekly sessions CRUD, including the **overlap check** |
| `appointment.controller.js` | Books a token (all the booking rules), lists a patient's appointments, returns one appointment with its live snapshot, admin listing, and walk-in creation |
| `appointmentChange.controller.js` | **Cancel** and **reschedule** (patient's own or admin's any). Uses atomic updates so a token already called can't be cancelled, and rolls back if a reschedule fails halfway |
| `queue.controller.js` | The doctor's actions: today's queue, **Call Next**, **Mark Done**, **Skip**. Each one then broadcasts the new queue. |
| `admin.controller.js` | Numbers for the admin dashboard |
| `phase2.controller.js` | Returns the "Planned for Phase 2" 501 response |

#### `server/src/middleware/`
| File | Purpose |
|---|---|
| `auth.js` | `protect`: reads the `Authorization: Bearer <token>` header, verifies the JWT, loads the user |
| `role.js` | `authorize('admin')` etc.: allows only listed roles |

#### `server/src/utils/` – shared helpers
| File | Purpose |
|---|---|
| `waitTime.js` | The **waiting-time engine** (a pure function, so it is easy to test). Given a doctor and the day's appointments, returns who is being served, counts, and for every token the patients ahead, estimated minutes, expected time and "reach by" time. |
| `queueSnapshot.js` | Loads data from the database and uses `waitTime.js` to build the doctor views and queue snapshots that the API and sockets send |
| `token.js` | Gives the next token number per doctor per day, retrying if two people book at the same moment |
| `date.js` | Date helpers. All dates are **local** `YYYY-MM-DD` strings, never UTC, so "today" is correct in India. |
| `errors.js` | `ApiError` (an error with a friendly message and status code), `asyncHandler` (catches errors in controllers) and `errorHandler` (turns database errors into readable messages) |

#### `server/src/socket/index.js` – real time
Sets up Socket.IO. Defines the rooms `queue:<doctorId>:<date>` and `hospital`; handles `queue:join` / `queue:leave` / `hospital:join` / `hospital:leave` (sending a fresh snapshot right after a join); and exports `broadcastQueue()` and `broadcastDoctorStatus()`. **Any controller that changes a queue or a doctor's status must call one of these**, or screens won't update live. The broadcast contains token numbers and statuses only, never patient names.

#### `server/src/seed/seed.js`
Creates the demo data: 6 departments, 9 doctors, 5 patients, the admin, weekly schedules for every day, and today's queues (including Amit Verma's token #6). Dates are always "today". Runs on every start with the in-memory DB, or via `npm run seed` for a real database (which **wipes it first**).

### 4.3 Client – `client/`

| File | Purpose |
|---|---|
| `package.json` | Website libraries and scripts (`dev`, `build`, `preview`) |
| `index.html` | The single HTML page React is loaded into |
| `vite.config.js` | Vite settings. **Proxies `/api` and `/socket.io` to the server on port 5000.** |
| `tailwind.config.js` | Design colours: `primary` teal `#0B7A75` and `coral` `#F26B5B` |
| `postcss.config.js` | Lets Tailwind work through PostCSS |
| `public/` | Static files such as the favicon |

#### `client/src/` – core
| File | Purpose |
|---|---|
| `main.jsx` | Starts React and wraps the app in the router |
| `App.jsx` | The **route table**: which page shows at which address, and which roles may open it (`ProtectedRoute`). The Analytics page is lazy-loaded because the charts library is large. |
| `index.css` | Tailwind plus shared styles (`.card`, `.btn-primary`, `.input`, the greyed-out `.phase2-disabled`) |
| `api/axios.js` | The shared Axios client. Adds the login token to every request and turns errors into friendly messages |
| `context/AuthContext.jsx` | Holds the logged-in user; saves the token in the browser (`skipopdq_token`); `HOME_BY_ROLE` sends each role to its home page |
| `context/SocketContext.jsx` | Keeps **one** live connection for the whole app, and gives pages the hooks `useQueueRoom` and `useHospitalRoom`. It re-joins rooms automatically if the connection drops. |
| `utils/format.js` | Formatting helpers for times, dates and status text |

#### `client/src/components/` – reusable pieces
| File | Purpose |
|---|---|
| `Navbar.jsx` | Top menu; changes by role; has the disabled "Switch Hospital" for admins |
| `Footer.jsx` | Page footer |
| `Logo.jsx` | The SkipOPDQ logo |
| `AdminLayout.jsx` | Side menu + content frame for all `/admin` pages |
| `ProtectedRoute.jsx` | Blocks a page unless the user is logged in with an allowed role |
| `DoctorCard.jsx` | A doctor in the search results |
| `Avatar.jsx` | Round initials picture |
| `StatusBadge.jsx` | Coloured Available / Busy / Unavailable and appointment-status labels |
| `StatCard.jsx` | A number tile for dashboards |
| `LiveIndicator.jsx` | The pulsing "Live" dot |
| `AppointmentActions.jsx` | Cancel and Reschedule buttons and dialogs, shared by the patient and admin pages |
| `ComingSoonBadge.jsx` | `ComingSoonBadge`, `Phase2Button` and `Phase2Tooltip`: the greyed-out Phase 2 look |
| `Modal.jsx` | Pop-up dialog |
| `PageHeader.jsx` | Page title block |
| `Loader.jsx` | Loading spinner |
| `EmptyState.jsx` | "Nothing here yet" message |

#### `client/src/pages/`
| File | Page |
|---|---|
| `Landing.jsx`, `Login.jsx`, `Register.jsx`, `Progress.jsx` | Public pages (`Progress.jsx` holds the Phase 1/2 item list and the overall percentage) |
| `patient/FindDoctors.jsx` | Doctor search and filters |
| `patient/DoctorDetails.jsx` | Doctor profile, schedule, booking panel (with the disabled Priority Booking) |
| `patient/MyAppointments.jsx` | Today / upcoming / past appointments |
| `patient/LiveQueue.jsx` | The real-time queue screen (the largest page) |
| `patient/Profile.jsx` | Account and Phase 2 settings |
| `doctor/DoctorDashboard.jsx` | Status, delay, note and queue controls |
| `admin/AdminDashboard.jsx` | Live dashboard |
| `admin/Appointments.jsx` | Appointment monitor and walk-ins |
| `admin/ManageDoctors.jsx`, `ManageDepartments.jsx`, `Schedules.jsx` | Management screens |
| `admin/Analytics.jsx`, `admin/DisplayBoard.jsx` | Phase 2 preview / placeholder |

---

## Part 5 – Key rules in plain language

- **Dates** are local `YYYY-MM-DD` text, never UTC.
- **Token numbers** go up per doctor per day. A cancelled token leaves a gap and its number is never reused. Walk-ins and online patients share one sequence.
- **Booking is for today only.** Future days are reachable by rescheduling (within 7 days). Booking stays open all day on purpose so the demo works at any hour.
- Only **waiting** tokens can be cancelled or rescheduled.
- **Call Next** completes the person inside and calls the lowest waiting token.
- Every change to a queue or doctor status is **broadcast**, which is why the screens update live.
- Server-side checks are the source of truth. The UI repeats the important ones for instant feedback.

## Part 6 – Live-update events (for the curious)

| Direction | Event | Meaning |
|---|---|---|
| browser → server | `queue:join` / `queue:leave` `{doctorId, date}` | Start/stop watching one doctor's queue for a day |
| browser → server | `hospital:join` / `hospital:leave` | Watch all doctors (admin dashboard) |
| server → browser | `queue:updated` | Full queue snapshot with per-token waiting times (no patient names) |
| server → browser | `doctor:statusChanged` | A doctor changed status, delay or note |

## Part 7 – API cheat sheet

| Method & path | Who | Purpose |
|---|---|---|
| `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | public / user | Sign up, log in, who am I |
| `GET /api/departments`; `POST`, `PUT /:id` | public / admin | Departments |
| `GET /api/doctors`, `GET /api/doctors/:id` | public | Doctors with live status and queue summary |
| `GET /api/doctors/me`, `PATCH /api/doctors/me/status` | doctor | Own profile and live status |
| `POST /api/doctors`, `PUT /api/doctors/:id` | admin | Add / edit doctors |
| `GET /api/schedules?doctor=`; `POST`, `PUT /:id`, `DELETE /:id` | public / admin | Weekly sessions |
| `POST /api/appointments`, `GET /api/appointments/my` | patient | Book a token; my appointments |
| `GET /api/appointments/:id` | owner / doctor / admin | One appointment with its live queue |
| `GET /api/appointments`, `POST /api/appointments/walk-in` | admin | Monitor; add walk-in |
| `PATCH /api/appointments/:id/cancel`, `GET .../reschedule-options`, `PATCH .../reschedule` | patient (own) / admin | Cancel or reschedule |
| `GET /api/queue/:doctorId` | public | Queue snapshot |
| `GET /api/queue/me/today`, `POST /api/queue/me/call-next`, `/done`, `/skip` | doctor | Run the queue |
| `GET /api/admin/stats` | admin | Dashboard data |
| `GET /api/health`, `GET /api/meta` | public | Server check; hospital info |

You can check the server is alive by opening http://localhost:5000/api/health in the browser.

---

## Part 8 – Known limitations (MVP)

- Single hospital only.
- Socket rooms are not authenticated. This is acceptable because broadcasts hold no patient names.
- New bookings are for today only.
- Booking doesn't close when the last session of the day ends.
- No automated tests in the repo yet. The waiting-time function is pure and would be the easiest first test.

## Part 9 – Ideas for future work

1. Add unit tests for `waitTime.js` and end-to-end tests with Playwright.
2. Close booking after the day's last session.
3. Protect Socket.IO connections with the login token.
4. Allow booking future dates directly.
5. Build the Phase 2 features, in the order your presentation needs.

When you build a Phase 2 feature: remove its 501 placeholder, replace the disabled UI with the real one, and update `client/src/pages/Progress.jsx` and `README.md`.
