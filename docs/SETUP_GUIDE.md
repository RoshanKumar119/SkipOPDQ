# SkipOPDQ – Setup & Run Guide (Windows, for beginners)

This guide takes you from **a fresh Windows laptop** to **SkipOPDQ running in your browser**. No programming experience is needed. Just follow the steps in order and copy the commands exactly.

Time needed: about 15–25 minutes (most of it is downloads).

---

## 1. What you will end up with

When you finish, two programs will be running on your laptop:

| Program | What it is | Address |
|---|---|---|
| **Server** (backend) | The brain: stores data, calculates waiting times | http://localhost:5000 |
| **Client** (frontend) | The website you see and click | http://localhost:5173 |

You open **http://localhost:5173** in Chrome/Edge and use the app. Everything runs on your own laptop. No internet is needed after setup.

> **You do NOT need to install a database.** The project starts its own temporary database automatically.

---

## 2. What to install first

You need three things. Skip any you already have.

### 2.1 Node.js (required)

Node.js runs the project's code. It also gives you `npm`, the tool that downloads the project's libraries.

1. Go to **https://nodejs.org**
2. Download the **LTS** version (the big green button on the left).
3. Run the installer. Click **Next** on every screen and keep the defaults. If it offers "Automatically install the necessary tools", you can leave it unticked.
4. **Restart your laptop** (or at least close and reopen any open terminal windows). This step matters, because terminals opened before the install will not find Node.

**Check it worked.** Open **PowerShell** (press the Windows key, type `PowerShell`, press Enter) and type:

```powershell
node -v
npm -v
```

You should see version numbers, for example `v22.11.0` and `10.9.0`. Node must be version **18 or higher**.

### 2.2 A code editor (recommended, not required)

Install **Visual Studio Code** from https://code.visualstudio.com. It makes opening the folder and a terminal easy.

### 2.3 Git (only if you will download from GitHub)

Needed only to download the project with `git clone`. Get it from https://git-scm.com/download/win and keep the defaults. If you received the project as a ZIP file, you can skip Git.

---

## 3. Get the project onto your laptop

Pick **one** of these.

### Option A: from a ZIP file

1. Right-click the ZIP file → **Extract All…**
2. Choose a simple location, such as `C:\Projects` or `D:\Projects`.
3. Avoid very long folder paths and avoid OneDrive/Desktop-synced folders if you can. They can make installs slow.

### Option B: from GitHub

```powershell
cd C:\Projects
git clone https://github.com/RoshanKumar119/SkipOPDQ.git
cd SkipOPDQ
```

(If you only want the documentation branch, add `-b dev` after `clone`.)

After this you should have a folder called `skipopdq` or `SkipOPDQ`. Inside it you can see `client`, `server`, `package.json` and `README.md`.

---

## 4. Open a terminal inside the project folder

**Easiest way with VS Code:**
1. Open VS Code → **File → Open Folder…** → pick the project folder.
2. Menu **Terminal → New Terminal**. A terminal opens at the bottom, already inside the project.

**Without VS Code:**
1. Open the project folder in File Explorer.
2. Click the address bar at the top, type `powershell`, press Enter.

Make sure the terminal is in the **main project folder** (the one that contains `package.json`, `client` and `server`). You can check with:

```powershell
dir
```

You should see `client`, `server`, `package.json` in the list.

---

## 5. Install the project's libraries (one time)

In the terminal, run:

```powershell
npm install
```

- This takes **2–5 minutes**. Lots of text scrolls by. That is normal.
- This single command installs the libraries for the root folder, the `server` folder and the `client` folder (a `postinstall` script does the extra two).
- Warnings in yellow (`npm warn ...`) are fine. **Red `ERR!` lines mean a real problem.** See the Troubleshooting section below.
- When it finishes you will see something like `added 25 packages` or `found 0 vulnerabilities`.

You only need to do this once per laptop (and again only if someone changes the libraries).

---

## 6. Start the project

```powershell
npm run dev
```

This starts the server and the client together. Look at the output:

```
[server] [db] MONGO_URI not set – starting in-memory MongoDB ...
[client]   ➜  Local:   http://localhost:5173/
[server] [db] Connected to MongoDB (in-memory)
[server] [seed] Seeded 6 departments, 9 doctors, 5 patients, today's queues ...
[server] SkipOPDQ API running on http://localhost:5000
```

**The first time only**, the server downloads a MongoDB program of about **100 MB**. It can sit there for a few minutes on the line `starting in-memory MongoDB`. Please wait and don't close it. Later starts take a few seconds.

When you see **`SkipOPDQ API running on http://localhost:5000`**, you are ready.

> **Windows pop-up:** Windows Defender Firewall may ask whether to allow Node.js or MongoDB on the network. Choose **Allow** (private networks is enough).

---

## 7. Open the app

Open **Google Chrome** or **Microsoft Edge** and go to:

**http://localhost:5173**

You should see the SkipOPDQ landing page (teal and coral colours).

### Log in with the demo accounts

Go to **Login**. The easiest way is the **Demo Login** buttons, which log you in with one click. You can also type the details yourself. The password for all three is `demo123`.

| Role | Email | Password |
|---|---|---|
| Patient | `patient@skipopdq.demo` | `demo123` |
| Doctor | `doctor@skipopdq.demo` | `demo123` |
| Admin | `admin@skipopdq.demo` | `demo123` |

Now follow **`docs/PROJECT_GUIDE.md`** for a tour and demo script.

---

## 8. Stopping and starting again

- **Stop:** click in the terminal and press **Ctrl + C** (on the question "Terminate batch job (Y/N)?" type `Y`).
- **Start again:** open a terminal in the project folder and run `npm run dev`. You do not need to run `npm install` again.
- **Important:** the demo database lives in memory. **Every time you start the server, all data is wiped and fresh demo data is created**, dated for today. Anything you booked or registered last time is gone. This is on purpose, because it gives you a clean demo each time.

---

## 9. Optional settings (you can skip this)

The project works without any settings. If you want to change something:

1. Go to the `server` folder.
2. Copy `.env.example` and name the copy `.env` (in PowerShell: `copy server\.env.example server\.env`).
3. Open `.env` in VS Code and edit:

| Setting | What it does | Default |
|---|---|---|
| `PORT` | Port the server uses | `5000` |
| `MONGO_URI` | Connect to a real MongoDB so data is kept between restarts. Leave empty for the temporary database. | empty |
| `JWT_SECRET` | Secret used to sign logins. Change it to any long random text. | built-in dev value |
| `CLIENT_URL` | Address of the website, used for security (CORS) | `http://localhost:5173` |

Restart `npm run dev` after changing `.env`.

### Using a real MongoDB (only if you want data to persist)

1. Install MongoDB Community Server (https://www.mongodb.com/try/download/community), or create a free cluster on MongoDB Atlas.
2. Put its connection string in `server/.env`, for example `MONGO_URI=mongodb://127.0.0.1:27017/skipopdq`
3. Start with `npm run dev`. If the database is empty, it is seeded once.
4. To reset a persistent database to fresh demo data (this **deletes its data**), run `npm run seed`.

---

## 10. Useful commands

Run all of these in the main project folder.

| Command | What it does |
|---|---|
| `npm install` | Downloads all libraries (first time only) |
| `npm run dev` | Starts server + client for development (this is the one you use) |
| `npm run build` | Makes an optimised production build of the website in `client/dist` |
| `npm start` | Starts only the server (no website). Used for production-style runs. |
| `npm run seed` | Re-creates demo data in a persistent MongoDB (needs `MONGO_URI`) |

---

## 11. Troubleshooting

**`'node' is not recognized` / `'npm' is not recognized`**
Node.js isn't installed, or the terminal was opened before installing it. Install Node (section 2.1), **restart the laptop or reopen the terminal**, and try `node -v` again.

**`npm install` fails with a red `ERR!`**
- Check your internet connection and try again.
- Delete the `node_modules` folders (project root, `server`, `client`) and run `npm install` again.
- If you see `EACCES` or permission errors, close the terminal and open PowerShell with **Run as administrator**, or move the project to a shorter path such as `C:\Projects`.
- Antivirus programs can block installs. Try again after pausing it briefly.

**`running scripts is disabled on this system` (PowerShell)**
Run this once, then try again:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```
Or use **Command Prompt (cmd)** instead of PowerShell.

**It seems stuck at "starting in-memory MongoDB"**
That is the one-time ~100 MB download. Wait a few minutes. If it fails, check your internet and run `npm run dev` again. On very restricted college Wi-Fi, try a mobile hotspot for the first run.

**`Port 5000 is already in use` or `EADDRINUSE`**
Another program (or an old copy of this project) is using the port. Close old terminals running the project, or find and stop the process:
```powershell
netstat -ano | findstr :5000
taskkill /PID <number-from-the-last-column> /F
```
Or set a different `PORT` in `server/.env` (also update the proxy in `client/vite.config.js`).

**Port 5173 in use**
Vite will usually pick 5174 automatically. If so, open the address it prints. But then set `CLIENT_URL` in `server/.env` to the same address, otherwise the browser blocks requests (CORS).

**The page loads but says "Cannot reach the SkipOPDQ server"**
The server isn't running or hasn't finished starting. Look at the terminal for `SkipOPDQ API running on http://localhost:5000`, and check for red error text.

**Login says invalid credentials**
After a server restart, the data is reset. Use the demo accounts exactly as listed (`demo123`), or click the **Demo Login** buttons. Doctors added by the admin use the password `doctor123`.

**White/blank page**
Press **Ctrl + Shift + R** to hard-refresh. Press **F12 → Console** to read any error.

**Live updates don't appear in the second window**
Both windows must be on `http://localhost:5173` (same address). Make sure the server is still running. Use one normal window and one **incognito** window so the two logins don't overwrite each other.

**Changes to server code reset my data**
The server restarts when a file in `server/src` is saved, and each restart re-seeds the demo. This is normal during development.

---

## 12. Quick checklist

- [ ] Node.js LTS installed (`node -v` shows 18 or higher)
- [ ] Project folder extracted/cloned
- [ ] Terminal opened inside the project folder
- [ ] `npm install` finished (once)
- [ ] `npm run dev` shows `SkipOPDQ API running on http://localhost:5000`
- [ ] Browser open at http://localhost:5173
- [ ] Logged in with a demo account

Happy demoing!
