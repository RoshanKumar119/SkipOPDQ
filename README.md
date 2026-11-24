# SkipOPDQ

**Smart Hospital Doctor Availability and OPD Queue Management Platform**

> *Skip the OPD queue. Arrive when it's your turn.*

Final-year project · Version 0.6 · **MVP (Phase 1), about 65% complete**

---

## Problem statement

Patients often go to hospital OPDs without knowing:

- whether their doctor is available today,
- the doctor's OPD timing,
- whether the doctor is running late,
- how many patients are already waiting, or
- when they should actually arrive.

So patients arrive early and wait for hours, and OPD waiting areas get overcrowded. Elderly patients, pregnant women and parents with sick children are affected the most.

## Solution overview

SkipOPDQ is a web platform that connects the three groups involved:

| Who | What they do in SkipOPDQ |
|---|---|
| **Hospital (admin / reception)** | Manages departments, doctors and weekly OPD schedules, monitors all queues live and adds walk-in patients |
| **Doctor** | Sets live status (Available / Busy / Unavailable) and any delay with one tap, and runs the queue with Call Next / Mark Done / Skip |
| **Patient** | Sees real-time doctor availability, books a token for today and tracks the queue position and estimated waiting time live |

**How it works:** Search → Book Token → Track Live → Arrive on Time

Waiting time is calculated on the server every time the queue or the doctor's status changes:

```
Estimated waiting time = (patients ahead × doctor's avg. consultation minutes) + doctor's delay minutes
```

The patient in consultation counts as one of the patients ahead. If the OPD session has not started yet, the countdown starts from the session start time. When the doctor is unavailable, no estimate is shown.

---

## ✅ Features completed (Phase 1)

**Common**
- Landing page (problem, 4-step flow, who it's for)
- Patient registration, JWT login, role-based redirects and protected routes
- One-click **Demo Login** buttons for Patient, Doctor and Admin
- Public **Project Progress** page (`/progress`)

**Patient**
- Find Doctors: search by name or specialization, filter by department and specialization, live status badges, today's OPD timing, current token and number waiting
- Doctor details: weekly OPD schedule, live status, delay note and **Book Token for Today** (disabled with a reason when the doctor is unavailable or has no OPD today)
- Token booking with an auto-incrementing token per doctor per day, plus duplicate-booking prevention
- My Appointments, split into today, upcoming and past visits
- **Cancel** a waiting token (with an optional reason) or **reschedule** it to another OPD day within the next 7 days. The freed slot moves everyone behind up instantly, and the old token links to the new one.
- **Live Queue** with Your Token, Now Serving, patients ahead, estimated wait, suggested arrival time, queue progress bar, visual token strip and a pulsing "Live" indicator. It updates instantly through Socket.IO.
- In-app alerts when only 2 patients are ahead and when it is the patient's turn

**Doctor**
- One-tap status (Available / Busy / Unavailable), delay (0 / 10 / 15 / 30 min) and status note, broadcast live
- Today's queue in token order, with summary cards (total, completed, waiting, skipped)
- Call Next, Mark Done and Skip (no-show)

**Admin**
- Live dashboard: total doctors, available now, today's appointments, patients waiting, and a live doctor status table
- Manage departments (add / edit / list)
- Manage doctors (add / edit / list). Adding a doctor creates their login account with the default password `doctor123`.
- Weekly OPD schedules (create / edit / remove, with overlap validation)
- Appointments monitor for any date (today and the next few days), filtered by doctor and status
- Reception can **cancel** or **reschedule** any waiting token. If a patient's token is cancelled, their Live Queue page tells them immediately.
- **Add walk-in patient** (name + mobile). Walk-in and online patients share the same token queue.

**Real-time (Socket.IO)**
- Rooms: `queue:<doctorId>:<YYYY-MM-DD>` per doctor per day, plus a global `hospital` room
- Events: `queue:updated` (full snapshot with per-token waiting times) and `doctor:statusChanged`
- Clients re-join rooms automatically after a reconnect

## ⏳ Features pending (Phase 2, shown in the UI as "Coming Soon")

| # | Feature | Where it appears in the UI | API placeholder (HTTP 501) |
|---|---|---|---|
| 1 | SMS / WhatsApp notifications | Live Queue button, Profile → Notification Settings | `POST /api/notifications/subscribe`, `GET/PUT /api/notifications/settings` |
| 2 | Advanced analytics | Admin → Analytics (charts use **sample data**, with a "Preview" banner) | `GET /api/analytics/:report` |
| 3 | Mobile app | Landing page section with disabled store buttons | – |
| 4 | ABHA / ABDM integration | Profile → "Link ABHA ID" | `POST /api/abha/link` |
| 5 | Online payment / priority booking | Booking panel → "Priority Booking (₹)" | `POST /api/payments/priority-booking` |
| 6 | TV token display board | Admin → TV Token Display | `GET /api/display-board/:departmentId?` |
| 7 | Multi-hospital support | Disabled "Switch Hospital" dropdown in the admin navbar | `GET /api/hospitals` |

All Phase 2 items use the shared `ComingSoonBadge` / `Phase2Button` components: greyed out, with a lock icon and the tooltip "Planned for Phase 2".

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), Tailwind CSS, React Router, Axios, socket.io-client, Recharts, react-hot-toast, lucide-react icons |
| Backend | Node.js, Express, Mongoose, Socket.IO, JWT (jsonwebtoken), bcryptjs, dotenv, cors |
| Database | MongoDB. If `MONGO_URI` is empty, the server starts an **in-memory MongoDB** (`mongodb-memory-server`) and seeds demo data automatically. |
| Tooling | `concurrently` runs the client and server with one command |

## Folder structure

```
skipopdq/
├── README.md
├── package.json              # root scripts: dev, seed, build, postinstall
├── server/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js          # Express + Socket.IO + DB connection + auto-seed
│       ├── config/           # db.js (MongoDB / in-memory), constants.js
│       ├── models/           # User, Department, Doctor, Schedule, Appointment
│       ├── routes/           # auth, departments, doctors, schedules, appointments, queue, admin, phase2
│       ├── controllers/      # request handlers (business logic)
│       ├── middleware/       # auth.js (JWT), role.js (role check)
│       ├── socket/           # rooms + queue/status broadcast helpers
│       ├── utils/            # waitTime.js (waiting-time engine), queueSnapshot.js, token.js, date.js, errors.js
│       └── seed/seed.js      # demo data (always dated today)
└── client/
    ├── package.json
    └── src/
        ├── api/              # axios instance
        ├── context/          # AuthContext, SocketContext
        ├── components/       # Navbar, StatusBadge, ComingSoonBadge, DoctorCard, LiveIndicator, ...
        ├── pages/
        │   ├── Landing.jsx, Login.jsx, Register.jsx, Progress.jsx
        │   ├── patient/      # FindDoctors, DoctorDetails, MyAppointments, LiveQueue, Profile
        │   ├── doctor/       # DoctorDashboard
        │   └── admin/        # AdminDashboard, ManageDoctors, ManageDepartments, Schedules,
        │                     # Appointments (+ walk-in), Analytics, DisplayBoard
        ├── utils/format.js
        └── App.jsx
```

## Setup and running

**Requirements:** Node.js 18 or newer (tested with Node 22). You do **not** need to install MongoDB.

```bash
cd skipopdq
npm install        # also installs server/ and client/ dependencies (postinstall)
npm run dev        # starts the API (port 5000) and the web app (port 5173)
```

Open **http://localhost:5173**.

- On the first run, `mongodb-memory-server` downloads a MongoDB binary (about 100 MB) into `server/.mongodb-binaries/`. This happens only once.
- With the in-memory database, **fresh demo data dated today is seeded on every start**, so restart `npm run dev` to reset the demo.
- Optional: copy `server/.env.example` to `server/.env` and set the values:

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | API port | `5000` |
| `MONGO_URI` | Persistent MongoDB. Leave empty to use the in-memory DB. | *(empty)* |
| `JWT_SECRET` | JWT signing secret | dev fallback |
| `CLIENT_URL` | Allowed origin for CORS / Socket.IO | `http://localhost:5173` |

Other scripts:

```bash
npm run seed       # re-seed a persistent MongoDB (only when MONGO_URI is set; wipes its data)
npm run build      # production build of the client
```

## Demo accounts

All demo accounts use the password **`demo123`**. The **Demo Login** buttons on the login page log in with them in one click.

| Role | Email | Notes |
|---|---|---|
| Admin | `admin@skipopdq.demo` | Reception / hospital admin |
| Doctor | `doctor@skipopdq.demo` | Dr. Rajesh Sharma, General Medicine, Room OPD-101, with a live queue |
| Patient | `patient@skipopdq.demo` | Amit Verma, holds **token #6** (waiting) in Dr. Sharma's queue |

Seeded hospital: **City Care Multispeciality Hospital (Demo)**, with 6 departments, 9 doctors (one Busy "In emergency procedure at Cath Lab", one Unavailable "On leave today"), weekly schedules for every day, 5 patients and live queues for today.

Doctors added by the admin log in with the default password **`doctor123`**.

## Demo script

1. Open **two browser windows**: one normal and one incognito/private.
2. **Window 1:** open http://localhost:5173/login, click **Login as Patient**, go to **My Appointments** and click **Track Live** on token #6. The screen shows *Your Token 6*, *Now Serving 3*, *3 patients ahead* and about *30 min* wait.
3. **Window 2:** click **Login as Doctor**, then click **Call Next** (and **Mark Done** if you like).
4. Watch Window 1: **Now Serving**, **patients ahead** and **waiting time** update instantly with no refresh. When only 2 patients are ahead, the **"Your turn is approaching"** notification appears. Keep clicking **Call Next** until the patient sees **"It's your turn!"**.
5. Back in Window 1, open **My Appointments** and try **Reschedule** (pick tomorrow) or **Cancel** on a waiting token. The doctor's queue in Window 2 updates instantly.
6. In Window 2, set the status to **Busy**, add the note *In emergency surgery* and tap **+15m**. The patient screen immediately shows the busy note and the waiting time grows by 15 minutes. Tap **Unavailable** to show "Doctor currently unavailable" in place of a time estimate.
7. Log out and use **Login as Admin** to show the **live dashboard** (the doctor table changes as the doctor acts), **Appointments & Walk-ins → Add Walk-in Patient**, **Analytics (preview)** and finally the **Project Progress** page (`/progress`).

Tip: restart `npm run dev` to reset all demo data before presenting.

## API overview

| Method & path | Access | Purpose |
|---|---|---|
| `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` | public / user | Authentication |
| `GET /api/departments` · `POST` · `PUT /:id` | public / admin | Departments |
| `GET /api/doctors?search=&department=&specialization=` · `GET /api/doctors/:id` | public | Doctors with live status and queue summary |
| `GET /api/doctors/me` · `PATCH /api/doctors/me/status` | doctor | Own profile and live status |
| `POST /api/doctors` · `PUT /api/doctors/:id` | admin | Add or edit doctors |
| `GET /api/schedules?doctor=` · `POST` · `PUT /:id` · `DELETE /:id` | public / admin | Weekly OPD sessions |
| `POST /api/appointments` · `GET /api/appointments/my` | patient | Book token, my appointments |
| `GET /api/appointments/:id` | owner / doctor / admin | Appointment and live queue snapshot |
| `GET /api/appointments?doctor=&status=&date=` · `POST /api/appointments/walk-in` | admin | Monitor and walk-ins |
| `PATCH /api/appointments/:id/cancel` · `GET /api/appointments/:id/reschedule-options` · `PATCH /api/appointments/:id/reschedule` | patient (own) / admin | Cancel or reschedule a waiting token |
| `GET /api/queue/:doctorId` | public | Live queue snapshot (no patient names) |
| `GET /api/queue/me/today` · `POST /api/queue/me/call-next` · `/done` · `/skip` | doctor | Queue controls |
| `GET /api/admin/stats` | admin | Dashboard data |

## Known limitations (MVP)

- Supports a single hospital.
- Socket rooms are not authenticated. Broadcast snapshots contain token numbers and statuses only, with no patient names.
- New bookings are for today only. Future dates are reachable by rescheduling, within 7 days.
- Booking stays open for the whole day so the demo works at any time. Session-end cut-offs are planned.
