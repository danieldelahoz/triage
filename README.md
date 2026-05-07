# Triage

AI-assisted ticket analysis tool for support engineers. Live at [triage.danield.dev](https://triage.danield.dev).

## What it does

Paste in a complex support ticket. Claude analyzes it: categorizes the issue, ranks likely root causes with confidence scores, and flags information gaps. You investigate, take notes, pick which root cause you're chasing. Claude drafts a customer-facing response based on the ticket, your notes, and the chosen root cause. You edit, copy, send. Mark resolved.

The workflow mirrors how I actually triaged tickets at Unily, Hexaware, and IQVIA — paste, analyze, investigate, respond, close. Triage is the version of that workflow I wish I'd had.

## Why I built it

Five years as a Technical Support Engineer taught me that ticket triage has two slow steps: forming the initial hypothesis and writing the customer response. Both benefit from a fresh perspective. Triage gives you that — Claude reads the ticket as a senior TSE would, and drafts the response in the voice you'd use, but with your investigation notes and chosen root cause as context.

It's also the second piece of my portfolio for the TSE-to-SWE transition. The first was [Probe](https://probe.danield.dev) — a REST client. Triage is bigger: real database, real AI, real auth.

## How it works

The workflow is five stages. Each stage maps to a status the ticket moves through.

**1. Inbox.** Paste a ticket. Title, description, optional metadata (customer, product area, priority). Triage stores it as `pending`.

**2. Analyze.** Click Analyze. Triage sends the ticket to Claude Sonnet 4.6 with a structured prompt. The response is JSON validated against a Zod schema — category, severity (with reasoning), top 3 root causes (each with confidence and reasoning), top info gaps. Status moves to `investigating`.

**3. Investigate.** Read the analysis. Take notes in the editor. Click which root cause you're chasing. The selection persists.

**4. Respond.** Click Generate response. Claude drafts a customer-facing response using the ticket, your notes, and the selected root cause. Edit it. Copy it. Send it from your real ticket system.

**5. Resolve.** Mark the ticket resolved. Status moves to `resolved` and the ticket goes to the archive. You can reopen it if needed.

## Stack

- **Next.js 16** (App Router) with Server Actions for mutations
- **Postgres** on Railway, accessed via **Drizzle ORM**
- **Anthropic SDK** for Claude calls
- **Zod** for runtime validation of AI responses
- **Tailwind 4 + shadcn/ui** (Vega preset) for UI
- **Cloudflare Access** for auth (GitHub OAuth)
- Hosted on **Railway**

JavaScript, not TypeScript. I want to fully understand and explain every line I shipped. Migrating to TS is on the v1.5 list once I've used it elsewhere.

## What's in this repo

The architecture is split across the App Router:

- `src/app/page.js` — public landing page
- `src/app/app/*` — protected workspace, gated by Cloudflare Access
- `src/app/app/tickets/[id]/` — single-ticket view with analysis, notes, response drafting
- `src/db/schema.js` — four tables: `tickets`, `root_causes`, `info_gaps`, `similarity_links`
- `src/lib/anthropic.js` — model and token-cap config in one place
- `src/lib/prompts.js` — analysis and response-drafting prompts
- `src/lib/schemas.js` — Zod schemas validating Claude's structured output

Server Actions handle every mutation. No REST API routes. Reads use Drizzle directly inside Server Components.

## What's deferred

The current spec says v1 ships with similarity matching (Haiku 4.5 against archived tickets) and re-analyze-with-notes (Sonnet pass 2 incorporating investigation notes). Both are deferred to v1.5 — they need a synthetic-data seed first to be useful, and the workflow ships value without them.

Other deferred items: TypeScript migration, time-on-ticket tracking, custom tags, export to Markdown, file attachments, multi-user mode.

See `SPEC.md` for the full design doc with what shipped, what changed during the build, and what's next.

## Running locally

```bash
git clone git@github.com:danieldelahoz/triage.git
cd triage
npm install
cp .env.example .env.local
# Fill in .env.local with your DATABASE_URL and ANTHROPIC_API_KEY
npx drizzle-kit push  # creates the four tables
npm run dev
```

Visit `http://localhost:3000`. The workspace at `/app` will be unprotected locally (Cloudflare Access only enforces in production).

## Cost

Per ticket: roughly $0.04 for analysis (Sonnet) + $0.04 for response drafting (Sonnet) = ~$0.08 per fully processed ticket. The Anthropic account-level monthly cap is set to $20 as a hard ceiling.

## Built by

[Daniel Delahoz](https://danield.dev) — five years as a Technical Support Engineer.
