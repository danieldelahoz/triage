# Triage — Build Spec

This is the spec written before the build. The shipped version may diverge in places, and any deviations get noted at the bottom.

## What it is

Triage is an AI-assisted ticket analysis tool for support engineers. You paste in a complex ticket, the tool analyzes it (categorization, severity, root cause hypotheses, similarity to past tickets), you investigate, you respond. Past tickets feed back into the system so future analysis is grounded in your actual history.

It's built as a portfolio piece for someone with five years of TSE experience pivoting into engineering roles. It is not a product, not multi-tenant, not for sale.

## Scope

V1 ships:

- A public landing page describing what Triage is, with a "Try it" CTA
- A protected workspace at `/app` behind Cloudflare Access (only authorized users get in)
- A five-step workflow (Inbox, Analyze, Investigate, Respond, Archive) over a single ticket at a time
- AI-powered analysis returning structured output (category, severity, root causes, info gaps)
- Similarity matching against the user's archived ticket history
- AI-drafted response generation incorporating user investigation notes
- Full ticket archive with search and filter
- Synthetic seed data covering the main categories so the tool is usable on first run
- Cost guardrails (per-request, per-user, monthly ceiling)

V1 does not ship:

- Multi-tenant accounts or team workspaces (single-user, gated by Cloudflare Access)
- Real-time collaboration
- File attachments or screenshot analysis
- Email/Slack notifications
- Public sharing of tickets
- Bulk import from CSV
- Direct integration with Zendesk, ServiceNow, or other ticket systems
- A REST API for the tool itself
- Mobile-responsive UI (desktop-first like Probe)

## The architecture: hybrid landing + auth

Triage runs as a single Next.js app deployed to Railway. The same domain serves two distinct surfaces:

**Public surface** (`triage.danield.dev` and any path that isn't `/app`):

- Landing page describing the tool
- Screenshots and a short demo
- "Try it" CTA that links to `/app`
- About / contact info

**Authenticated surface** (`triage.danield.dev/app/*`):

- Cloudflare Access intercepts every request to this path
- Only allow-listed users can pass through to the actual app
- Inside `/app`, the user has full access to the workflow
- The Anthropic API is only called from server actions inside `/app`, so unauthenticated users can never trigger AI calls

This split protects the AI budget while still giving recruiters a marketing page to evaluate. They see the polished landing, click "Try it," and are prompted for a magic-link login. If you've added them to the allow list (or set the policy to allow any email after Turnstile verification), they get through.

## The workflow in detail

The workspace is built around a five-step pipeline. Each step is a distinct page or panel.

**1. Inbox.** A simple form with a title field, a description field, and optional metadata (customer name, product area, priority). User pastes ticket content from wherever it lives (Zendesk, Slack thread, email). Submit creates a new ticket record in `pending_analysis` state.

**2. Analyze.** Triage sends the ticket to Claude Sonnet 4.6 with a structured prompt requesting JSON output covering: category (auth/integration/data/performance/UI/config/unknown), severity (low/medium/high/critical) with reasoning, top 3 likely root causes ranked by confidence percentage, and the top 3 information gaps (what would need to be known to resolve this). Simultaneously, Triage uses Claude Haiku 4.5 to compute similarity scores against the archived ticket history and surfaces the top 3 matches. Output is rendered in a structured panel: each root cause is a card with its confidence percentage and the past tickets that informed it.

**3. Investigate.** The user reads the analysis, takes notes in a panel below it, and marks which root cause they're chasing. Status moves through `investigating`, `blocked`, and `ready_to_respond`. The user can click "re-analyze with notes" to send the original ticket plus their notes back to Sonnet for an updated root cause ranking. This closes the human-in-the-loop properly: the AI's first guess is informed by ticket text alone; the second guess is informed by what the human has actually learned.

**4. Respond.** When the ticket is ready, the user picks a final root cause and clicks "draft response." Sonnet generates a customer-facing response based on the original ticket, the investigation notes, and the chosen root cause. The user edits the draft (mandatory, no auto-send) and copies it to clipboard. Triage stores the final response.

**5. Archive.** User marks the ticket resolved. The ticket plus all its data (analysis, notes, response) goes into the archive. The archive is searchable by full text, filterable by category, severity, and time. Each archived ticket can be reopened for inspection.

## State and data model

Four tables. Schema lives in `src/db/schema.js` using Drizzle's JS API.

### `tickets`

Primary entity. One row per ticket the user has ever entered.

```js
{
  id: uuid,
  title: text,
  description: text,
  customer_name: text,
  product_area: text,
  priority: text,                  // 'low' | 'medium' | 'high' | 'critical' | null
  status: text,                    // 'pending' | 'analyzing' | 'investigating' | 'blocked' | 'ready' | 'resolved'
  category: text,
  severity: text,                  // 'low' | 'medium' | 'high' | 'critical' | null
  severity_reasoning: text,
  selected_root_cause_id: uuid,
  notes: text,
  final_response: text,
  created_at: timestamp,
  updated_at: timestamp,
  resolved_at: timestamp,
}
```

### `root_causes`

One row per AI-suggested root cause. A ticket can have many. Re-analysis creates new rows rather than overwriting old ones (we keep the history).

```js
{
  id: uuid,
  ticket_id: uuid,
  description: text,
  confidence: integer,             // 0-100
  reasoning: text,
  cited_ticket_ids: jsonb,         // array of past ticket UUIDs
  generated_at: timestamp,
  generation_pass: integer,        // 1 = first analysis, 2+ = re-analyses with notes
}
```

### `info_gaps`

Information the AI flagged as missing to resolve the ticket. Stored separately so we can render them as a checklist.

```js
{
  id: uuid,
  ticket_id: uuid,
  question: text,
  reasoning: text,
  generated_at: timestamp,
}
```

### `similarity_links`

Cached results from the Haiku similarity pass. Avoids recomputing on every page load.

```js
{
  id: uuid,
  ticket_id: uuid,                 // the new ticket
  similar_ticket_id: uuid,         // the past ticket it resembles
  similarity_score: integer,       // 0-100
  reasoning: text,
  computed_at: timestamp,
}
```

## AI integration design

Two models, each used for what they're best at.

**Sonnet 4.6 — analysis and response drafting.** Called via the Anthropic SDK with structured JSON output. The system prompt frames Sonnet as a senior support engineer triaging a ticket, with strict instructions to return only valid JSON matching a defined shape. The prompt includes the full ticket text and (on re-analysis) the user's notes. Output is parsed and validated against a Zod schema before being persisted to the DB.

**Haiku 4.5 — similarity matching.** Called once per new ticket. The prompt includes the new ticket's title and description plus a list of past tickets (title, category, top root cause, resolution summary). Haiku is asked to return the top 3 matches with similarity scores and brief reasoning. Why Haiku here: similarity is a fast, comparison-heavy task that doesn't need Sonnet's deeper reasoning, and Haiku is meaningfully cheaper.

**Token caps and cost guardrails:**

- Ticket description truncated at 6000 words (~8000 tokens) before being sent to either model
- Sonnet output capped at 1500 tokens per call
- Haiku output capped at 500 tokens per call
- Cloudflare Access in front of `/app` prevents anonymous AI calls entirely
- Anthropic account-level monthly spend ceiling set to $20 in the Anthropic dashboard
- Cloudflare Turnstile on the analyze form as a secondary defense

**Estimated cost per ticket:** about $0.04 for Sonnet analysis, $0.005 for Haiku similarity, $0.04 for response drafting. Roughly $0.085 per fully processed ticket.

**Estimated monthly spend:** under $5 for personal use; capped at $20 by the account-level limit even in worst case.

## Page structure

Triage uses Next.js App Router. The route tree:

```
/                        Public landing page (what Triage is, screenshots, "Try it" CTA)
/about                   Optional: about the project, who built it, why
/app                     Protected workspace dashboard (recent tickets, archive search)
/app/new                 Inbox: paste a new ticket
/app/tickets/[id]        Single-ticket workspace (Analyze + Investigate + Respond)
/app/archive             Full archive with search and filters
/app/settings            API key status, rate limit info, theme toggle
```

Cloudflare Access enforces auth on `/app/*`. The public routes at `/` and `/about` don't trigger auth.

The single-ticket page is the workhorse. It's a three-panel layout: analysis on the left (cards for category, severity, root causes, info gaps, similarity matches), notes and status in the middle, draft response on the right. Each panel can be its own React Server Component where possible to minimize client JavaScript.

## Stack decisions

- **Next.js 15** with the App Router. Full-stack React, server components for data fetching, server actions for mutations. Avoids API-route boilerplate.
- **JavaScript (not TypeScript).** I want to fully understand and explain everything I ship. JavaScript without type annotations keeps the code transparent for me and reduces interview risk. Adding TypeScript to Triage in v1.5 is on the table once I have more TS exposure elsewhere.
- **Drizzle ORM** for database queries. Works fine in JavaScript, no codegen step required, lightweight.
- **Postgres** managed by Railway. Single platform for app and DB, simpler operations.
- **Zod** for runtime validation, especially on AI responses where structured output can fail in subtle ways. Works in plain JavaScript.
- **Tailwind 4 + shadcn/ui** for UI. Same as Probe. Reuses patterns I already know.
- **Anthropic SDK** for AI calls. Streaming responses where useful (response drafting).
- **Cloudflare Access** in front of `/app` for authentication.
- **Cloudflare Turnstile** on form submissions as a secondary defense.
- **Railway** for hosting and Postgres. Hobby plan ($5/month minimum), auto-deploys from GitHub.

## Folder structure

```
triage/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (public)/              # Public surface
│   │   │   ├── page.jsx           # Landing
│   │   │   └── about/page.jsx     # Optional about page
│   │   ├── app/                   # Protected workspace (Cloudflare Access guards)
│   │   │   ├── layout.jsx
│   │   │   ├── page.jsx           # Dashboard
│   │   │   ├── new/page.jsx       # Inbox form
│   │   │   ├── tickets/[id]/page.jsx
│   │   │   ├── archive/page.jsx
│   │   │   └── settings/page.jsx
│   │   ├── api/
│   │   │   ├── analyze/route.js   # POST: run AI analysis on a ticket
│   │   │   ├── re-analyze/route.js
│   │   │   ├── draft-response/route.js
│   │   │   └── similarity/route.js
│   │   ├── layout.jsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # shadcn primitives
│   │   ├── analysis-panel.jsx
│   │   ├── investigation-panel.jsx
│   │   ├── response-panel.jsx
│   │   ├── ticket-card.jsx
│   │   ├── root-cause-card.jsx
│   │   ├── similarity-list.jsx
│   │   └── archive-search.jsx
│   ├── lib/
│   │   ├── anthropic.js           # Anthropic client + helpers
│   │   ├── prompts.js             # All system + user prompts in one file
│   │   ├── schemas.js             # Zod schemas for AI responses
│   │   └── utils.js
│   └── db/
│       ├── schema.js              # Drizzle table definitions
│       ├── queries.js             # Reusable query functions
│       ├── seed.js                # Synthetic ticket seed script
│       └── index.js               # DB client export
├── drizzle/                       # Migration files (generated by drizzle-kit)
├── public/
├── .env.example
├── drizzle.config.js
├── next.config.js
├── package.json
├── README.md
└── SPEC.md
```

## Key prompts

The AI prompts live in `src/lib/prompts.js` so they can be edited without diving through code. Three main prompts:

**`analyzeTicket`** — system prompt frames the model as a senior TSE; user prompt provides the ticket; instructions require JSON output matching a Zod schema with category, severity, root causes, and info gaps.

**`reAnalyzeWithNotes`** — same as `analyzeTicket` but includes the user's investigation notes and asks specifically for an updated ranking that takes the new info into account.

**`draftResponse`** — system prompt frames the model as drafting a customer-facing response in a clear, helpful, professional tone; user prompt includes ticket, notes, chosen root cause; instructions emphasize "the human will edit this before sending, so don't be overly cautious."

Each prompt has its expected schema codified in `src/lib/schemas.js` using Zod, and the AI response is parsed through that schema before being persisted.

## Synthetic seed data

The `src/db/seed.js` script generates ~20 example tickets covering each category. Each seed ticket includes the original text, a fully populated analysis (category, severity, root causes), notes, a final response, and the resolved status. This populates the archive on first run so the similarity matching has data to work with.

The seed tickets are synthetic but plausible: real TSE-shaped problems (an SSO callback URL mismatch, a database query timeout under load, a CSV import failing on Unicode characters, etc.). They're committed to the repo as a JSON file so the seed is deterministic.

## Cost and abuse mitigation

Detailed in the AI integration section above. Consolidated here:

1. Cloudflare Access in front of `/app` prevents anonymous AI calls
2. Token caps on input and output for both models
3. Cloudflare Turnstile on form submissions as a backup
4. Anthropic account-level $20/month spend ceiling
5. Honeypot field on the analyze form to catch unsophisticated bots

## Out of scope, deferred to later releases

**v1.5 candidates:**

- Time-on-ticket tracking (auto-tracks how long the user spent in each phase)
- Tags + custom filters on the archive
- Confidence calibration over time (charts showing how often high-confidence guesses turn out right)
- Search inside individual tickets
- Export ticket as Markdown or PDF
- Bulk archive of multiple tickets
- Daily email digest of API spend
- Migrate from JavaScript to TypeScript

**v2 candidates:**

- Multi-user mode with proper authentication (sign up, sessions, password resets)
- Real-time updates via Server-Sent Events
- File attachments and screenshot analysis (multimodal)
- Direct Zendesk/ServiceNow integration via API
- Public read-only sharing of resolved tickets (with redaction)
- Browser extension that detects ticket pages on common platforms

## Things that will change during the build

This section gets filled in retroactively as the build happens, the same way Probe's spec captured deviations. Common categories of change to expect:

- Schema adjustments once we hit a real edge case the model didn't predict
- Prompt iterations after seeing actual AI outputs that don't match expectations
- UI layout changes after building real screens vs. imagined screens
- Cost guardrail tweaks based on observed API spend patterns
