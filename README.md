# SyncUp – Group Scheduling Platform

> **Plan Together, Effortlessly.** — Find the perfect meeting time for your group without the endless back-and-forth.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS 3 |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT) |

---

## Project Structure

```
SyncUp_A/
├── frontend/           # React + Vite app
├── backend/            # Express API
├── database/
│   └── setup.sql       # Supabase tables + RLS
└── README.md
```

---

## 🚀 Quick Start

### 1. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project
2. In the **SQL Editor**, run the contents of `database/setup.sql`
3. Copy your project URL, anon key, and service role key

### 2. Configure Environment Variables

**Frontend** (`frontend/.env`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:5000
```

**Backend** (`backend/.env`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 3. Start the Backend

```bash
cd backend
npm install
npm start       # or: npm run dev (with nodemon)
```

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

---

## API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/signup` | ❌ | Create account |
| POST | `/login` | ❌ | Sign in |
| GET | `/groups` | ✅ | Get user's groups |
| POST | `/create-group` | ✅ | Create new group |
| POST | `/join-group` | ✅ | Join via Group ID |
| POST | `/add-availability` | ✅ | Add availability slot |
| GET | `/availability/:id` | ✅ | All availability for group |
| GET | `/schedule/:id` | ✅ | **Find common time + place recommendations** |
| GET | `/health` | ❌ | Health check |

---

## Scheduling Algorithm

```
1. Fetch all members of the group
2. Fetch all availability rows for the group
3. Group rows by date
4. For each date where ALL members have submitted availability:
   - overlap_start = MAX(all start_times)
   - overlap_end   = MIN(all end_times)
   - If overlap_start < overlap_end → COMMON SLOT FOUND ✅
5. Return first matching date + time range
6. Extract month → map to season → return place recommendations
```

### Seasons & Place Recommendations

| Season | Months | Places |
|---|---|---|
| ☀️ Summer | March – June | Ooty, Coorg, Manali, Munnar |
| 🌧️ Monsoon | July – September | Goa, Lonavala, Alleppey |
| ❄️ Winter | October – February | Jaipur, Rann of Kutch, Kerala |

---

## Security

- ✅ Anon key used only in frontend
- ✅ Service role key used only in backend  
- ✅ JWT verified on every protected route
- ✅ Row-level security enabled on all tables
- ✅ No secrets exposed to frontend
