# Anti-Gravity

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
| `engagement-audit` | On-site engagement. | Value-proposition clarity, CTA presence/clarity, broken internal links, mobile viewport, plain-text trust signals. |

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

## Running an audit

Quickest way — from the marketplace root, after installing dependencies (see Setup above):

```bash
node run-audit.js https://example.com
```

This prints the full JSON report to stdout. Add `--maxPages N` to change
the sampling cap (default 15).

Or import the orchestrator directly in your own script:

```js
import { runAudit } from './skills/orchestrator/scripts/index.js';

const report = await runAudit({ url: 'https://example.com' });
console.log(JSON.stringify(report, null, 2));
```

To enable cross-source corroboration in `trust-and-identity`, pass a
`searchFn`:

```js
const report = await runAudit({
  url: 'https://example.com',
  searchFn: async (query) => {
    // Adapt to whatever search tool/API your agent runtime exposes.
    // Must resolve to an array of { url: string } objects.
    const results = await myWebSearchTool(query);
    return results.map((r) => ({ url: r.url }));
  },
});
```

Without `searchFn`, the audit still runs to completion — corroboration
checks are skipped with one explicit degraded-mode finding rather than
being silently omitted or faked.

## Validating skill format compliance

```bash
npx skills-ref validate ./skills/reach-and-read
npx skills-ref validate ./skills/trust-and-identity
npx skills-ref validate ./skills/engagement-audit
npx skills-ref validate ./skills/orchestrator
```

## Known limitations / next steps

- `extractCoreClaims` (in the orchestrator) uses simple regex heuristics to
  pull a couple of factual-sounding sentences for corroboration testing.
  This is intentionally conservative; a more thorough implementation could
  extract more claim types.
- Click-depth measurement in `engagement-audit` is approximate — it checks
  presence of key-intent pages within the already-sampled set rather than
  doing a dedicated breadth-first crawl to measure exact depth.
- Structured-data expected-type inference (`guessExpectedType` in
  `reach-and-read`) is a simple URL-path heuristic; it will miss non-obvious
  URL structures.
