# Brand AI-Readiness Audit

> An Agent Skill Marketplace built for **Adobe University Hackathon 2026 — Round 3**.

## Team

- **Anubhav Garg**
- **Gunn Khurana**
- **Divya**

## About

This project is an Agent Skill Marketplace that audits websites for AI discoverability and on-site engagement. It identifies problems, provides evidence and severity, and generates prioritized recommendations for improvement.

## Skills

| Skill | Description |
| --- | --- |
| **Audit Orchestrator** | Entry point that coordinates the audit and produces the final report |
| **Crawl & Render Audit** | Detects crawlability, rendering, and structured-data issues |
| **Freshness & Corroboration** | Checks factual freshness, corroboration, and entity clarity |
| **Engagement Audit** | Evaluates issues affecting on-site engagement |

## How It Works

The entrypoint skill receives a website audit request, composes the outputs of the individual skills, and produces a single structured audit report containing findings, evidence, severity, and suggested actions.

---

A Next.js application and Agent Skill Marketplace for auditing a public website's AI discoverability, content extractability, trust signals, and on-site engagement.

## What this project contains

The repository has two layers:

- **Web application** — the Next.js dashboard in `app/`, reusable UI in `components/`, and server-side services in `lib/`.
- **Marketplace submission** — the self-contained `brand-ai-readiness-audit/` directory. This is the marketplace package root and includes `marketplace.json`, the marketplace README, four skills, scripts, references, and package metadata.

## Features

- Run an audit for a public HTTP or HTTPS website.
- Inspect audit findings by severity and category.
- View report history and individual reports.
- Export report data.
- Configure scheduled audits.
- Run the same audit from the command line with a bounded page limit.
- Produce evidence-backed findings and prioritized suggested actions without modifying the audited site.

## Requirements

- Node.js 20 or newer
- pnpm 10 or newer
- A reachable public website to audit
- A Gemini API key when AI-assisted summarization is enabled by the orchestrator

## Run locally

Install dependencies from the repository root:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Build and run the production server:

```bash
pnpm build
pnpm start
```

Run the command-line audit:

```bash
pnpm audit https://example.com --maxPages 15
```

The audit API is available at `POST /api/audit` with a JSON body:

```json
{
  "url": "https://example.com/",
  "maxPages": 15
}
```

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Start a new audit and view the latest result |
| `/history` | Browse saved audit reports |
| `/reports/[id]` | View a report with findings and severity summaries |
| `/reports/[id]/export` | Export a report |
| `/schedule` | Create and manage scheduled audits |

## System design

```text
Browser
  |
  v
Next.js App Router pages
  |
  +--> /api/audit --------> lib/auditRunner.js
  |                            |
  |                            v
  |                  audit-orchestrator
  |                    /        |        \
  |                   v         v         v
  |        crawl-render-audit  freshness  engagement-audit
  |                   |         |         |
  |                   +---------+---------+
  |                             v
  |                    merged JSON report
  |                             |
  |                             v
  |                       lib/storage.js
  |
  +--> /api/reports -------> report history and export routes
  |
  +--> /api/schedule ------> lib/scheduler.js ------> audit runner
```

### Audit flow

1. The user submits a URL from `components/AuditForm.jsx`.
2. `app/api/audit/route.js` validates the URL and invokes `lib/auditRunner.js`.
3. The runner loads the marketplace orchestrator on the Node.js runtime.
4. `audit-orchestrator` invokes the three detector skills:
   - `crawl-render-audit` — robots, redirects, raw/rendered content, structured data, metadata, and extractability.
   - `freshness-corroboration` — dated claims, corroboration, and entity identity signals.
   - `engagement-audit` — value proposition, CTAs, navigation depth, links, mobile behavior, and trust signals.
5. The orchestrator deduplicates findings, assigns stable IDs, calculates severity summaries, and returns the report schema in `references/report_schema.json`.
6. The API attempts to persist the report through `lib/storage.js`. Persistence is non-fatal in serverless deployments; a completed audit can still be returned when temporary storage is unavailable.
7. The report is rendered by `ReportCard.jsx`, `FindingsTable.jsx`, and `SeverityChart.jsx`.

### Storage model

Local development stores reports and schedules under the project `data/` directory. Vercel/serverless execution uses writable temporary storage under `/tmp`; this storage is ephemeral and should not be treated as durable production data. For durable multi-user history, replace `lib/storage.js` with a database-backed adapter.

### Scheduled audits

`lib/scheduler.js` manages scheduled jobs and invokes the same audit runner as the manual flow. The schedule API is exposed through `app/api/schedule/route.js` and `app/api/schedule/[id]/route.js`.

## Marketplace package

The exact marketplace package is:

```text
brand-ai-readiness-audit/
├── marketplace.json
├── README.md
└── skills/
    ├── audit-orchestrator/
    │   ├── SKILL.md
    │   ├── package.json
    │   ├── references/report_schema.json
    │   └── scripts/
    ├── crawl-render-audit/
    │   ├── SKILL.md
    │   ├── references/checklist.md
    │   └── scripts/
    ├── freshness-corroboration/
    │   ├── SKILL.md
    │   ├── references/checklist.md
    │   └── scripts/
    └── engagement-audit/
        ├── SKILL.md
        ├── references/checklist.md
        └── scripts/
```

`audit-orchestrator` is the only entrypoint. The marketplace skills are read-only and recommend-only: they collect evidence and suggest improvements but never authenticate to, edit, deploy, or publish changes to an audited website.

## Development notes

- Keep Node-only audit code behind server routes or server-side modules.
- Keep audit page limits and request timeouts bounded.
- Preserve the report schema when adding new detectors.
- Use evidence URLs and concise suggested actions for every finding.
- Treat filesystem persistence as disposable on serverless platforms.
- Run `pnpm build` and `git diff --check` before submitting changes.

## License and safety

This tool is intended for authorized audits of public websites. It does not bypass access controls, submit forms, or change third-party content.
