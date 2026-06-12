# SyncUp

SyncUp is a group scheduling app for creating groups, collecting member availability, chatting, and finding common meeting slots.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |

## Project Structure

```text
.
├── backend/       # Express API
├── database/      # Supabase SQL setup
├── public/        # Static assets
├── src/           # React app
├── package.json   # Frontend scripts
└── README.md
```

## Environment Variables

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:5000

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
FRONTEND_URL=http://localhost:5173
```

Never commit `.env` or the Supabase service role key.

## Database Setup

Run the SQL in `database/setup.sql` in your Supabase SQL editor.

## Start the Backend

```bash
cd backend
npm install
npm start
```

## Start the Frontend

From the project root:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Useful Scripts

```bash
npm run dev
npm run build
npm run lint
```
