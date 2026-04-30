# 🌸 Knowledge Bud

A monthly digest of vetted mental health research — for therapists, students, and anyone who wants to stay current without reading full journals.

> **Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · Neon Postgres · Drizzle ORM · Groq · PWA · Vercel

## What it does

- **Monthly digest** — fresh papers on the 1st of every month (Vercel cron).
- **Instagram-style feed** of cards with one-sentence takeaways (BLUF), key stats, and a link to the original source.
- **Topic filters** — pick from defaults (CBT, DBT, trauma, PTSD, depression, anxiety, mindfulness, …) or add your own.
- **Save · Notes · Audio · Glossary · Ask AI** — built for working therapists.
- **Guest mode** — full functionality without signing up. Server-side anonymous account in Neon, tied to a private cookie.

## Sources (free, vetted)

PubMed (NIH/NLM) · Europe PMC · Semantic Scholar · OpenAlex · medRxiv · PLOS · DOAJ · Crossref · NIMH RSS · SAMHSA RSS · WHO Mental Health.

Each source has a daily/monthly request budget shown in **Settings**, with a manual refresh button.

## Local development

```bash
npm install
cp .env.example .env.local        # fill in DATABASE_URL etc.
npm run db:generate               # generate Drizzle migration (already done)
npm run db:migrate                # apply to your Neon DB
npm run dev                       # http://localhost:3000
```

## Deployment

1. Push to GitHub.
2. Connect the repo to Vercel.
3. Set env vars in Vercel: `DATABASE_URL`, `GROQ_API_KEY`, `PUBMED_API_KEY` (optional), `POLITE_EMAIL`, `CRON_SECRET`, `NEXT_PUBLIC_BASE_URL`.
4. Every push to `main` deploys.
5. Monthly cron (`0 0 1 * *`) runs automatically once `vercel.json` is in the repo.

## Folder layout

```
src/
  app/
    page.tsx                  # Login / Continue as Guest
    (app)/                    # Authed app (cookie gate)
      layout.tsx              # Header + bottom tabs
      feed/page.tsx           # Instagram-scroll feed
      topics/page.tsx         # Topic toggles + custom topics
      guide/page.tsx          # Walkthrough
      settings/page.tsx       # Sources + refresh + counters
      ask/page.tsx            # AI chat (Groq)
    api/
      guest/                  # POST → create guest user, set cookie
      logout/                 # GET  → clear cookie
      bookmarks/              # POST/DELETE → toggle save
      notes/                  # GET/PUT → per-paper note
      glossary/               # GET → curated definitions
      sources/[slug]/refresh/ # POST → manual source refresh
      cron/refresh-all/       # GET  → monthly Vercel cron
      ask/                    # POST → AI chat (Groq)
  components/
    Logo.tsx
    BottomTabs.tsx
    PaperCard.tsx
    SourceBadge.tsx
  lib/
    db/
      schema.ts               # Drizzle schema
      client.ts               # Neon client factory
    sources/
      pubmed.ts               # ESearch + EFetch
    sources.ts                # Source registry & limits
    sample-papers.ts          # Empty-state placeholder data
    glossary-data.ts          # Curated term dictionary
    reading.ts                # Reading-time + jargon level
    auth.ts                   # Cookie helpers
drizzle/
  0000_init.sql               # Initial schema migration
```

## Reliability rules

- Only verified publisher metadata (title, authors, journal, year, abstract, DOI) is shown.
- Anything AI-generated (BLUF rewrites, "Ask Knowledge Bud" answers) is **clearly labeled** "AI summary" with the original abstract one tap away.
- Semantic Scholar's TLDR feature is **not used**; we read only verified fields.

## License

MIT (or your preference).
