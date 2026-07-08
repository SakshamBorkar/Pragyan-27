# Pragyan PI Scheduler

Send WhatsApp slot confirmations for PI-1 and PI-2 interviews.

## Stack
- **Next.js 14** (App Router) + **TypeScript**
- **Supabase** — Postgres DB for user auth
- **bcryptjs** — password hashing
- **jose** — JWT session tokens (httpOnly cookies)
- **Tailwind CSS**

---

## Setup

### 1. Install
```bash
npm install
```

### 2. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → New project
2. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY` (not the anon key)

### 3. Configure environment variables
```bash
cp .env.local.example .env.local
```
Fill in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=random-32-char-string   # openssl rand -base64 32
```

### 4. Create the users table
Option A — paste in Supabase SQL Editor:
```sql
CREATE TABLE IF NOT EXISTS users (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT        NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Option B — run the migration script:
```bash
node scripts/migrate.js
```

### 5. Start dev server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## How it works

1. **Register / Login** — credentials stored in Supabase (password bcrypt-hashed). Session kept in an httpOnly JWT cookie.
2. **Dashboard** — choose PI-1 or PI-2.
3. **PI Form** — enter phone (with country code), date, time, venue.
4. **Open in WhatsApp** — opens `wa.me/<phone>?text=<message>` with the confirmation pre-filled.

## Deploy to Vercel
1. Push to GitHub
2. Import in Vercel
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`
4. Deploy
