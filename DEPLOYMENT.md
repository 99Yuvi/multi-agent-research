# Deployment Guide — Multi-Agent Research System

Developed by **Yogesh Mahawar**

---

## Live URLs

| Service | URL |
|---------|-----|
| **App (Vercel)** | https://multi-agent-research-delta.vercel.app |
| **Database (Turso)** | https://app.turso.tech/99yuvi/databases/research-agent |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) |
| AI Model | Groq — llama-3.3-70b-versatile |
| Search | Tavily Search API |
| Web Scraping | Cheerio |
| Database | Turso (libsql) — hosted SQLite |
| Auth | JWT (jose) + bcryptjs |
| UI | shadcn/ui + Tailwind CSS |
| Hosting | Vercel (free tier) |

---

## Environment Variables

### Vercel Dashboard me daalne wale (Settings → Environment Variables)

```
OPENAI_API_KEY=sk-proj-...
TAVILY_API_KEY=tvly-dev-...
GROQ_API_KEY=gsk_...
USE_GROQ=true
DATABASE_URL=libsql://research-agent-99yuvi.aws-ap-south-1.turso.io
DATABASE_AUTH_TOKEN=eyJhbGci....(turso token)
AUTH_SECRET=research-agent-secret-key-change-in-production-2025
```

### Local `.env.local` (development ke liye)

```
DATABASE_URL=file:./dev.db       ← local SQLite
DATABASE_AUTH_TOKEN=             ← local me zaroorat nahi
AUTH_SECRET=research-agent-secret-key-change-in-production-2025
GROQ_API_KEY=gsk_...
TAVILY_API_KEY=tvly-dev-...
USE_GROQ=true
```

---

## Database — Turso Setup

**Database name:** `research-agent`
**Region:** Mumbai (aws-ap-south-1)
**URL:** `libsql://research-agent-99yuvi.aws-ap-south-1.turso.io`

### Tables (manually created via Turso SQL editor)

```sql
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'user',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ResearchSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "query" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "Report" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "content" TEXT NOT NULL,
  "format" TEXT NOT NULL DEFAULT 'markdown',
  "sessionId" TEXT NOT NULL UNIQUE,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("sessionId") REFERENCES "ResearchSession"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Source" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "snippet" TEXT,
  "sessionId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("sessionId") REFERENCES "ResearchSession"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Listing" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "price" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "rating" TEXT,
  "website" TEXT,
  "image" TEXT,
  "notes" TEXT,
  "sessionId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("sessionId") REFERENCES "ResearchSession"("id") ON DELETE CASCADE
);
```

### Admin user seed (Turso SQL editor)

Password hash `admin123` generated via:
```bash
node -e "const b = require('./node_modules/bcryptjs'); b.hash('admin123', 12).then(h => console.log(h))"
```

```sql
INSERT INTO "User" ("id", "username", "password", "role", "createdAt")
VALUES (
  'admin001',
  'admin',
  '$2b$12$4xdGswGobW33anlExWI9IO1E10J9OSju5WBQLOlYuCeDwg1r80hMi',
  'admin',
  CURRENT_TIMESTAMP
);
```

**Login credentials:**
- Username: `admin`
- Password: `admin123`

---

## Deployment Steps (fresh deploy karna ho toh)

### 1. GitHub pe push karo
```bash
git add .
git commit -m "deploy"
git push origin master
```

### 2. Turso me tables banao
Turso dashboard → Edit Data → SQL editor me upar wala SQL run karo

### 3. Admin user banao
Turso SQL editor me upar wala INSERT run karo

### 4. Vercel me env variables daalo
Vercel → Project → Settings → Environment Variables → sab variables add karo

### 5. Vercel redeploy
Vercel → Deployments → Redeploy

---

## Free Tier Limits

| Service | Limit |
|---------|-------|
| Vercel | 100GB bandwidth/month, unlimited deploys |
| Turso | 500 databases, 1GB storage, 1B row reads/month |
| Groq | ~14,400 requests/day |
| Tavily | 1,000 searches/month |

---

## Admin Panel

URL: `/admin`
- Sirf admin role wale users access kar sakte hain
- Naye users create karo (username + password + role)
- Existing users ka username/password/role change karo
- Users delete karo

---

## Agent Pipeline

```
User Query
    │
    ▼
Orchestrator (llama-3.3-70b)
    │
    ├── Search Agent     → Tavily API → URLs + snippets
    ├── Scraper Agent    → Cheerio → page content + images
    ├── Summarizer       → llama-3.1-8b → condense sources
    ├── Analyst          → llama-3.3-70b → key insights
    └── Report Writer    → llama-3.3-70b → final markdown report
```

---

## Local Development

```bash
cd e:/multi-agent-research
npm run dev
```

App chalega: http://localhost:3000
