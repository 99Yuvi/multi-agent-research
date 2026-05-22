# Multi-Agent Research System — Documentation

> A portfolio-grade AI research system where 7 autonomous agents collaborate to search the web, scrape content, extract structured data, and generate comprehensive reports — all streamed in real time.

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [How It Works — Agent Pipeline](#how-it-works--agent-pipeline)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Environment Setup](#environment-setup)
6. [What You Can Research](#what-you-can-research)
7. [Query Tips](#query-tips)
8. [Streaming Architecture (SSE)](#streaming-architecture-sse)
9. [Token Usage & Cost](#token-usage--cost)
10. [Known Limitations](#known-limitations)
11. [Extending the System](#extending-the-system)

---

## What It Does

You type any research question. The system automatically:

- **Searches** the web for the most relevant sources (via Tavily Search API)
- **Scrapes** full page content from top results (via Cheerio)
- **Extracts** structured listings — hotels, restaurants, shops, etc. — with name, price, phone, address, rating, and images
- **Summarizes** each source independently
- **Analyzes** patterns, insights, and key points across all sources
- **Writes** a professional structured research report in Markdown
- **Streams** everything to the UI in real time as it happens

---

## How It Works — Agent Pipeline

The system uses a **deterministic pipeline** — agents run in a fixed order, not driven by LLM tool-calling decisions. This makes it reliable across all model providers.

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Orchestrator  — Plans search strategy, runs pipeline    │
│  2. Search Agent  — Calls Tavily API, gets 5–10 URLs        │
│  3. Scraper Agent — Fetches HTML, extracts text + images    │
│  4. Extractor*    — Pulls structured listings (JSON output) │  ← only for listing queries
│  5. Summarizer    — Condenses each page into a summary      │
│  6. Analyst       — Extracts trends, insights, key points   │
│  7. Report Writer — Writes final structured Markdown report │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
Streamed to UI via Server-Sent Events (SSE)
```

*The Extractor only activates when the query is detected as a listing query (hotels, restaurants, shops, contacts, etc.)

### Agent Details

| Agent | Model Used | Role |
|---|---|---|
| Orchestrator | — | Coordinates pipeline, detects listing mode |
| Search | Tavily API | Finds top URLs for the query |
| Scraper | Cheerio | Fetches HTML, extracts text + og:image + img tags |
| Extractor | llama-3.1-8b / gpt-4o-mini | Outputs structured JSON (name, price, phone, address, rating, image) |
| Summarizer | llama-3.1-8b / gpt-4o-mini | Summarizes each scraped page |
| Analyst | llama-3.1-8b / gpt-4o-mini | Cross-source insight extraction |
| Report Writer | llama-3.3-70b / gpt-4o | Writes the final professional report |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| AI Models | Groq (free) — Llama 3.3 70B + Llama 3.1 8B |
| AI Fallback | OpenAI — GPT-4o + GPT-4o-mini |
| Search | Tavily Search API |
| Web Scraping | Cheerio (HTML parsing) |
| Streaming | Server-Sent Events (SSE) |
| State Management | Zustand |
| UI Components | shadcn/ui + Tailwind CSS |
| Database | Prisma v7 + SQLite (via libsql adapter) |
| Report Export | Browser Blob API (Markdown download) |

---

## Project Structure

```
multi-agent-research/
├── app/
│   ├── api/
│   │   ├── research/route.ts      # SSE streaming endpoint — POST /api/research
│   │   └── history/route.ts       # Research history — GET/DELETE /api/history
│   ├── history/page.tsx           # Past research sessions page
│   ├── page.tsx                   # Main research page
│   └── layout.tsx                 # Root layout + Toaster
│
├── agents/
│   ├── orchestrator.ts            # Pipeline coordinator — runs all agents in order
│   ├── search-agent.ts            # Tavily API integration
│   ├── scraper-agent.ts           # Cheerio HTML scraper + image extractor
│   ├── extractor-agent.ts         # Structured JSON listing extractor
│   ├── summarizer-agent.ts        # Per-page summarization
│   ├── analyst-agent.ts           # Cross-source analysis
│   └── report-writer-agent.ts     # Final report generation
│
├── components/
│   ├── ResearchInput.tsx           # Query textarea + submit button + example chips
│   ├── AgentActivityPanel.tsx      # Real-time agent status indicators
│   ├── ListingsPanel.tsx           # Image cards for hotel/place listings
│   ├── StreamingReport.tsx         # Live streaming markdown report renderer
│   ├── TokenUsagePanel.tsx         # Token count + cost breakdown table
│   ├── ReportExport.tsx            # Copy + download markdown buttons
│   ├── ResearchHistory.tsx         # Past sessions list with expand/delete
│   ├── HowItWorks.tsx              # Empty state — pipeline diagram + capability cards
│   └── ui/                         # shadcn/ui base components
│
├── hooks/
│   └── useResearch.ts              # SSE reader + Zustand store updater
│
├── store/
│   └── researchStore.ts            # Zustand store — all research state
│
├── lib/
│   ├── ai-client.ts                # OpenAI/Groq client factory + model config + cost calc
│   └── prisma.ts                   # Prisma client singleton (libsql adapter)
│
├── types/
│   └── index.ts                    # All TypeScript types (SSEMessage, AgentState, etc.)
│
├── prisma/
│   └── schema.prisma               # ResearchSession + Report + Source models
│
├── .env.local                      # API keys (not committed)
└── DOCUMENTATION.md                # This file
```

---

## Environment Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up `.env.local`

```env
# ── AI Provider (choose one) ──────────────────────────────────
# Option A: Groq (FREE during development)
GROQ_API_KEY=gsk_your_groq_key_here
USE_GROQ=true

# Option B: OpenAI (paid — ~$0.06 per research query)
OPENAI_API_KEY=sk-your_openai_key_here
# USE_GROQ=false  (or just remove USE_GROQ)

# ── Search ────────────────────────────────────────────────────
TAVILY_API_KEY=tvly-your_tavily_key_here

# ── Database ──────────────────────────────────────────────────
DATABASE_URL="file:./dev.db"
```

### 3. Get API Keys

| Service | URL | Free Tier |
|---|---|---|
| Groq | https://console.groq.com | Yes — generous free quota |
| Tavily | https://tavily.com | Yes — 1,000 searches/month free |
| OpenAI | https://platform.openai.com | No — pay per token |

### 4. Initialize database

```bash
pnpm prisma db push
```

### 5. Run development server

```bash
pnpm dev
# Open http://localhost:3000
```

---

## What You Can Research

### Hotel & Place Listings (Image Cards)

When the query mentions hotels, restaurants, shops, or contacts — the system activates the **Extractor Agent** and shows structured image cards with price, phone, address, and rating.

```
Budget hotels in Manali with contact details and prices
Best restaurants in Goa under ₹500
Hostels in Rishikesh with prices and phone numbers
Cafes near Connaught Place Delhi
Hospitals in Pune with contact numbers
Camping sites near Manali with prices
Resorts in Coorg with images and booking details
```

**What each card shows:**
- Hotel photo (from og:image or page images)
- Name + price (₹ formatted)
- Star rating
- Address with map pin
- Phone number (clickable `tel:` link)
- "Book Online" button if phone is not available

### Industry & Technology Research

```
Latest trends in AI agents 2025
What is happening in the EV market in India?
How is Web3 evolving in 2025?
Future of remote work globally
Top programming languages to learn in 2025
State of open source AI models in 2025
```

### Domain Deep Dives

```
How is AI transforming healthcare?
Impact of climate change on India's agriculture
How does blockchain work in supply chain?
What is quantum computing and where is it used today?
Mental health apps — do they actually work?
```

### Business & Startups

```
How to build a successful SaaS product?
What makes a good investor pitch deck?
Growth hacking strategies for early-stage startups
How do Indian unicorn startups scale?
Freelancing vs full-time — financial comparison
```

### Travel & Tourism

```
Complete guide to Spiti Valley road trip
Best time to visit Ladakh with itinerary
What to see in Rajasthan in 7 days?
Budget trip to Thailand from India — all costs
Hidden gems in Himachal Pradesh for 2025
```

### Finance & Economy

```
How does RBI repo rate affect home loans in India?
Best mutual funds to invest in 2025
Gold vs stocks — long-term performance comparison
How to file ITR as a freelancer in India
Cryptocurrency regulations in India 2025
```

### Developer / Technical

```
React vs Vue vs Svelte — which to pick in 2025?
How to scale a Next.js app to 1 million users
Microservices vs monolith — when to use which?
Best open source alternatives to popular SaaS tools
Best databases for real-time applications
```

### Comparisons

```
iPhone 15 vs Samsung S24 Ultra — full comparison
Best laptops for developers under ₹80,000
AWS vs Azure vs GCP — which cloud provider to choose?
Top 5 project management tools compared
```

---

## Query Tips

### Be specific — get better results

```
❌  "Hotels in Manali"
✅  "Budget hotels in Manali under ₹2000 with contact details and images"

❌  "AI trends"
✅  "Latest AI agent frameworks for developers in 2025 with real examples"

❌  "Food in Goa"
✅  "Best seafood restaurants in North Goa with prices and phone numbers"
```

### Trigger listing mode (image cards)

Include any of these words to activate the Extractor Agent:

`hotel` · `resort` · `hostel` · `stay` · `accommodation` · `restaurant` · `cafe` · `food` · `shop` · `hospital` · `clinic` · `contact` · `phone` · `price` · `cost` · `budget` · `list`

### Trigger contact extraction

Add `with contact details` or `with phone numbers` to maximize phone number extraction.

### Trigger image cards

Add `with images` — the scraper will prioritize og:image and page images for each source.

---

## Streaming Architecture (SSE)

The system uses **Server-Sent Events** to push real-time updates from server to client.

### Flow

```
Client (React)               Server (Next.js API Route)
    │                               │
    ├── POST /api/research ────────>│
    │   { query: "..." }            │
    │                               ├── Creates DB session
    │                               ├── Opens SSE stream
    │                               ├── Runs agent pipeline
    │<── agent_start ───────────────┤  (Orchestrator starts)
    │<── agent_start ───────────────┤  (Search starts)
    │<── agent_done ────────────────┤  (Search done)
    │<── agent_start ───────────────┤  (Scraper starts)
    │<── listings ──────────────────┤  (Extractor found hotels)
    │<── token_usage ───────────────┤  (Live token count update)
    │<── chunk ─────────────────────┤  (Report streaming, 8 words at a time)
    │<── chunk ─────────────────────┤
    │<── complete ──────────────────┤  (Done — full report + sources)
    │                               ├── Saves to DB
    │                               └── Closes stream
```

### SSE Message Types

| Type | Payload | Purpose |
|---|---|---|
| `agent_start` | `agent`, `message` | Mark agent as "working" in UI |
| `agent_done` | `agent`, `message` | Mark agent as "done" in UI |
| `listings` | `listings[]` | Send extracted listing cards |
| `chunk` | `content` | Append text to streaming report |
| `token_usage` | `tokenUsage` | Live token count + cost update |
| `complete` | `report`, `sources`, `tokenUsage` | Final report ready |
| `error` | `error` | Show error to user |

---

## Token Usage & Cost

The **Token Usage Panel** shows a live breakdown during and after each research query.

### Groq (Recommended for development)

| Model | Role | Cost |
|---|---|---|
| llama-3.3-70b-versatile | Report Writer | $0.59 / $0.79 per 1M tokens |
| llama-3.1-8b-instant | Summarizer + Analyst + Extractor | $0.05 / $0.08 per 1M tokens |
| **Typical query total** | — | **~$0.002–0.005** (or $0 on free tier) |

### OpenAI (Production quality)

| Model | Role | Cost |
|---|---|---|
| gpt-4o | Report Writer | $2.50 / $10.00 per 1M tokens |
| gpt-4o-mini | Summarizer + Analyst + Extractor | $0.15 / $0.60 per 1M tokens |
| **Typical query total** | — | **~$0.04–0.08** per query |

---

## Known Limitations

| Limitation | Reason | Workaround |
|---|---|---|
| No real-time data | Scraping has inherent delay | Use for research, not live data |
| Paywalled sites | Can't access login-gated content | — |
| JS-rendered pages | Cheerio doesn't run JavaScript | Major sites use og:image (works fine) |
| Phone numbers not always available | Hotels on OYO/aggregators don't publish direct numbers | System shows "Book Online" fallback |
| Images may not match exact listing | Images assigned from page-level og:image, not per-listing | Works well for single-hotel pages |
| Max 4 pages scraped per query | Token + time budget | Increase `urlsToScrape` in orchestrator.ts |
| No pagination | Searches return top 5–10 results only | Add more search queries in orchestrator |

---

## Extending the System

### Add a new agent

1. Create `agents/your-agent.ts` — export an async function
2. Import and call it in `agents/orchestrator.ts` at the right pipeline step
3. Add the agent name to `AgentName` union in `types/index.ts`
4. Add label + icon in `store/researchStore.ts` and `components/AgentActivityPanel.tsx`

### Switch AI provider

Edit `.env.local`:
```env
USE_GROQ=true   # Groq (free)
USE_GROQ=false  # OpenAI (paid)
```

To add a new provider (e.g. Anthropic Claude via OpenAI-compatible API):
- Edit `lib/ai-client.ts` — update `getAIClient()` to return the new client
- Update `MODELS` and `PRICING` maps

### Add more listing fields

1. Add field to `ExtractedListing` in `types/index.ts`
2. Update the JSON schema in `agents/extractor-agent.ts` system prompt
3. Render the new field in `components/ListingsPanel.tsx`

### Change scraping depth

In `agents/orchestrator.ts`:
```ts
const urlsToScrape = sources.slice(0, 4);  // change 4 to scrape more pages
```

In `agents/scraper-agent.ts`:
```ts
.slice(0, 6000)  // change 6000 to pass more text to LLMs (increases token cost)
```

---

*Built as a portfolio project demonstrating multi-agent orchestration, real-time streaming, structured data extraction, and full-stack AI system design.*
