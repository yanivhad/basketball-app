# 🏀 Habonim Ball

A full-stack web app built for our basketball crew to manage game nights, rate each other, make balanced teams, and track attendance — all in one place.

---

## ✨ Features

- 🔐 **Auth** — Username & password login with JWT
- 🗓️ **Sessions** — Create game nights, set max players, confirm attendance
- ✅ **Actual Attendance** — Admin marks who really showed up vs who just confirmed
- ⭐ **Player Ratings** — Rate teammates across 7 categories after each game (anonymous or named)
- 💬 **Feedback** — Leave a short note for any player (anonymous or named)
- 🎲 **Team Generator** — Balanced teams using skill + physical score (weight & height), with bench support
- 📊 **Stats Hub** — Leaderboards, radar charts, attendance rates, session history
- 👤 **Player Profiles** — Full breakdown of ratings, feedback, showed up vs no-show stats
- 📲 **WhatsApp Alerts** — Get reminded before game night via Twilio
- 👑 **Admin Controls** — Manage players, activate/deactivate, reopen sessions

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React, Tailwind CSS v4, Zustand, Recharts |
| Backend | Node.js, Express, JWT, bcrypt |
| Database | PostgreSQL, Prisma ORM |
| Notifications | Twilio WhatsApp API, node-cron |
| Hosting | Vercel (frontend), Railway (backend), Supabase (DB) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Git

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/basketball-app.git
cd basketball-app
```

### 2. Set up the backend
```bash
cd server
npm install
```

Create a `.env` file in the `server` folder:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/basketballapp"
JWT_SECRET="your-secret-key"
PORT=3001
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

Run migrations and start the server:
```bash
npx prisma migrate dev
npm run dev
```

### 3. Set up the frontend
```bash
cd ../client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🏀

---

## 📁 Project Structure

```
basketball-app/
├── client/                  # React frontend
│   ├── src/
│   │   ├── api/             # Axios instance
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # App pages
│   │   └── store/           # Zustand auth store
│   └── index.html
│
├── server/                  # Node/Express backend
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── src/
│       ├── middleware/      # Auth middleware
│       ├── routes/          # API routes
│       └── services/        # WhatsApp & scheduler
```

---

## 🗃️ Database Models

| Model | Description |
|---|---|
| `User` | Player accounts with role, shirt number, weight, height |
| `Session` | Game nights with date, location, max players |
| `Attendance` | Who confirmed + who actually showed up |
| `Rating` | Per-session ratings across 7 categories |
| `Feedback` | Short text notes between players |
| `Team` | Generated teams per session |
| `TeamMember` | Players assigned to teams |

---

## 📡 API Routes

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new player |
| POST | `/api/auth/login` | Login |

### Sessions
| Method | Route | Description |
|---|---|---|
| GET | `/api/sessions` | Get all sessions |
| POST | `/api/sessions` | Create session (admin) |
| PATCH | `/api/sessions/:id/complete` | Mark done + actual attendance (admin) |
| PATCH | `/api/sessions/:id/reopen` | Reopen session (admin) |
| POST | `/api/sessions/:id/attend` | Confirm attendance |
| POST | `/api/sessions/:id/unattend` | Cancel attendance |

### Ratings
| Method | Route | Description |
|---|---|---|
| GET | `/api/ratings/pending` | Check for pending ratings |
| POST | `/api/ratings` | Submit rating |
| GET | `/api/ratings/session/:id` | Get session ratings |
| GET | `/api/ratings/user/:id` | Get player averages |

### Users
| Method | Route | Description |
|---|---|---|
| GET | `/api/users` | Get all active players |
| GET | `/api/users/:id` | Get player profile |
| PATCH | `/api/users/:id/settings` | Update WhatsApp settings |
| PATCH | `/api/users/:id/status` | Toggle active/inactive (admin) |

### Teams
| Method | Route | Description |
|---|---|---|
| GET | `/api/teams/session/:id` | Get teams for a session |
| POST | `/api/teams/session/:id` | Save generated teams (admin) |

### Feedback
| Method | Route | Description |
|---|---|---|
| POST | `/api/feedback` | Leave feedback |
| GET | `/api/feedback/user/:id` | Get player feedback |

---

## 🌍 Deployment

- **Frontend** → [Vercel](https://vercel.com)
- **Backend** → [Railway](https://railway.app)
- **Database** → [Supabase](https://supabase.com)

Set `VITE_API_URL` in Vercel environment variables to your Railway backend URL.

---

## 👥 Rating Categories

| Category | What it measures |
|---|---|
| 🏃 Athleticism | Speed, jumps, energy |
| 🎯 Shooting | Accuracy and range |
| 🤝 Passing | Vision and ball sharing |
| 🛡️ Defense | Effort on the defensive end |
| 🧠 Basketball IQ | Smart plays and positioning |
| 🔥 Hustle | Effort, diving for loose balls |
| 😎 Vibe | How fun they are to play with |

---

## ⚖️ Team Balancing Algorithm

Teams are balanced using a **snake draft** based on a combined score:

```
score = skill (overall rating avg) + physical score (weight + height normalized)
```

Players are sorted by score and distributed across teams in a snake pattern to ensure each team gets a mix of strong and average players. Leftover players go to the **bench 🪑**.

---

*Built with ❤️ by the Habonim crew. Let's run it. 🏀*