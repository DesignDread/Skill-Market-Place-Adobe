# site-iq

An Agent Skill Marketplace that audits a website for AI-discoverability and
on-site-engagement problems, and emits a structured report of findings and
prioritized suggested fixes. Built for Adobe University Hackathon 2026,
Round 3.

## Skills in this marketplace

| Skill | Role | Covers |
|---|---|---|
| `orchestrator` (**entrypoint**) | Composes the other three skills, merges/dedupes findings, assigns IDs and priorities, emits the final report. | — |
| `reach-and-read` | Off-site discoverability, mechanism chain: reach → read → extract. | robots.txt access, raw-vs-rendered content gaps, structured data (JSON-LD) validity, HTTP status/redirects, fact extractability, meta/canonical/llms.txt. |
| `trust-and-identity` | Off-site discoverability, corroboration & disambiguation. | Cross-source agreement on key claims, entity-collision risk, `sameAs` signals, content staleness. |
| `engagement-audit` | On-site engagement. | Value-proposition clarity, CTA presence/clarity, broken internal links, mobile viewport, plain-text trust signals, click-depth analysis. |

## How the orchestrator composes them

1. Calls `reach-and-read` first — it fetches and renders the site, and its
   output (rendered DOM, sampled page HTML, a brand-name guess) is reused
   by the other two skills so they don't re-fetch.
2. Calls `trust-and-identity` with the brand name and homepage HTML/text
   from step 1.
3. Calls `engagement-audit` with the sampled page HTML from step 1.
4. Merges all findings, deduplicating near-identical ones detected by more
   than one skill (kept: whichever has more specific evidence).
5. Splits findings into confirmed `findings` vs. proactive `opportunities`
   (findings marked `isOpportunity: true` upstream — e.g. "no llms.txt" is
   a suggestion, not a confirmed defect).
6. Assigns IDs (`F-001…`, `O-001…`) sorted by severity, computes a
   `priority` per finding as a function of severity and a rough effort
   estimate (see `skills/orchestrator/scripts/scoreSummary.js`), and
   computes the severity-count summary.
7. Emits the report per `skills/orchestrator/references/report_schema.json`.

## Scope & guardrails

- **Recommend-only.** No skill writes to, authenticates against, or
  otherwise alters the target site. Everything is read-only fetch/render.
- **robots.txt is checked first**, before any other request, and primary
  paths found disallowed are reported rather than silently skipped or
  crawled anyway.
- **No destructive or rate-abusive behavior.** Page sampling is capped
  (`maxPages`, default 15) and link-liveness checks sample a bounded set
  rather than crawling exhaustively.
- **Degrades gracefully, never fabricates.** If no headless-browser
  runtime is available, `reach-and-read` falls back to a documented,
  lower-confidence static-HTML heuristic instead of skipping the check
  silently. If no web-search tool is available, `trust-and-identity`
  emits one explicit low-severity "not evaluated" finding rather than
  inventing corroboration results.

## Setup

Each skill folder has its own `package.json`. From the marketplace root:

```bash
cd skills/reach-and-read && npm install && cd ../..
cd skills/trust-and-identity && npm install && cd ../..
cd skills/engagement-audit && npm install && cd ../..
cd skills/orchestrator && npm install && cd ../..
```

`reach-and-read` depends on Playwright for headless rendering. If Chromium
isn't already available, install it once:

```bash
cd skills/reach-and-read && npx playwright install chromium
```

If this step isn't possible in your environment, `reach-and-read` will
automatically fall back to its static-HTML heuristic (see above) — no
further setup is required.

## Gemini API Integration

site-iq can use a **Google Gemini API key** for two enhanced features:

1. **AI-Powered Claim Extraction** — Instead of simple regex, Gemini analyzes
   the homepage text to extract all verifiable factual claims (founding year,
   HQ, employee count, revenue, partnerships, awards, customer count).
2. **Search Grounding for Corroboration** — Uses Gemini's Google Search
   grounding to verify claims against independent third-party sources.

Without a Gemini key, both features degrade gracefully to regex extraction
and a single "not evaluated" finding.

### Setting the API key

**Option A: Environment variable**
```bash
export GEMINI_API_KEY=your_key_here
```

**Option B: CLI flag**
```bash
node run-audit.js https://example.com --apiKey your_key_here
```

**Option C: Dashboard `.env.local`**
```
GEMINI_API_KEY=your_key_here
```

## Running an audit (CLI)

Quickest way — from the marketplace root, after installing dependencies (see Setup above):

```bash
node run-audit.js https://example.com
```

This prints the full JSON report to stdout. Options:
- `--maxPages N` — change the sampling cap (default 15)
- `--apiKey KEY` — use Gemini for enhanced claim extraction and corroboration

Or import the orchestrator directly in your own script:

```js
import { runAudit } from './skills/orchestrator/scripts/index.js';

const report = await runAudit({
  url: 'https://example.com',
  apiKey: process.env.GEMINI_API_KEY,  // optional
});
console.log(JSON.stringify(report, null, 2));
```

## Web Dashboard

A full-featured **Next.js dashboard** is included for a visual audit experience.

### Setup

```bash
cd dashboard && npm install
```

Create `dashboard/.env.local`:
```
GEMINI_API_KEY=your_key_here
```

### Running

```bash
cd dashboard && npm run dev
```

Open http://localhost:3000

### Dashboard Features

| Feature | Description |
|---------|-------------|
| **Audit Runner** | Enter a URL and run an audit with one click. Results displayed with interactive charts. |
| **Severity Chart** | Donut chart showing the breakdown of critical/high/medium/low findings. |
| **Findings Table** | Sortable, expandable table with severity badges, evidence details, and suggested actions. |
| **Report History** | Browse all past audit reports. Click any to view the full report. |
| **Export** | Download any report as JSON or CSV. |
| **Scheduled Audits** | Set up recurring audits with cron expressions (daily, weekly, monthly presets). |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/audit` | Run an audit. Body: `{ "url": "...", "maxPages": 15 }` |
| `GET` | `/api/reports` | List all saved reports. |
| `GET` | `/api/reports/:id` | Get a specific report. |
| `GET` | `/api/reports/:id/export?format=csv` | Export report as CSV. |
| `GET` | `/api/reports/:id/export?format=json` | Export report as JSON (download). |
| `POST` | `/api/schedule` | Create a scheduled audit. Body: `{ "url": "...", "cron": "0 9 * * 1" }` |
| `GET` | `/api/schedule` | List active schedules. |
| `DELETE` | `/api/schedule/:id` | Remove a scheduled audit. |

## Validating skill format compliance

```bash
npx skills-ref validate ./skills/reach-and-read
npx skills-ref validate ./skills/trust-and-identity
npx skills-ref validate ./skills/engagement-audit
npx skills-ref validate ./skills/orchestrator
```

## Architecture

```
site-iq/
├── run-audit.js              # CLI entry point
├── marketplace.json          # Skill marketplace manifest
├── .env.example              # Environment variable template
├── skills/
│   ├── orchestrator/         # Entrypoint skill — merge, dedupe, prioritize
│   │   ├── scripts/
│   │   │   ├── index.js      # runAudit() main function
│   │   │   ├── mergeFindings.js    # Deduplication & ID assignment
│   │   │   ├── scoreSummary.js     # Priority computation
│   │   │   └── geminiProvider.js   # Gemini API integration
│   │   └── references/
│   │       └── report_schema.json  # Output schema
│   ├── reach-and-read/       # Discoverability: robots, render, schema, meta
│   ├── trust-and-identity/   # Corroboration & disambiguation
│   └── engagement-audit/     # CTAs, value prop, links, viewport, click-depth
└── dashboard/                # Next.js web dashboard
    ├── app/                  # App Router pages & API routes
    ├── components/           # React UI components
    └── lib/                  # Storage, scheduler, audit runner utilities
```

## Known limitations / next steps

- Click-depth measurement operates on the already-sampled page graph rather
  than doing a full-site BFS, so depth is measured only for pages within the
  sample window.
- Structured-data expected-type inference uses OG tags, URL paths, and title
  keywords — but may still miss non-standard page types.
- Gemini search grounding may occasionally return fewer URL results than a
  dedicated search API would for some queries.
