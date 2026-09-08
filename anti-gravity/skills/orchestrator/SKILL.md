---
name: orchestrator
description: Entrypoint for the skill-iq marketplace. Given a website URL, runs reach-and-read, trust-and-identity, and engagement-audit, merges and deduplicates their findings, assigns IDs and priorities, and emits a single structured audit report covering both AI-discoverability and on-site-engagement. Use this skill directly when asked to audit a website's AI readiness; it composes the other three skills internally.
license: MIT
allowed-tools: ["fetch", "headless-browser", "web_search"]
---

# skill-iq Orchestrator

## When to use
This is the single entrypoint for a full audit. Invoke it with a URL; it composes the other three skills in this marketplace and returns one report. Do not invoke the sub-skills directly unless debugging in isolation — only the orchestrator performs merge/dedupe/prioritization.

## Inputs
- `url` (string, required): the site to audit.
- `maxPages` (number, optional, default 15): passed through to `reach-and-read`.
- `searchFn` (function, optional): passed through to `trust-and-identity`; omit to run in degraded corroboration mode.

## Procedure
1. Check `robots.txt` (delegated to `reach-and-read`, which does this first internally) before any other fetch.
2. Run `reach-and-read` on the URL. Collect its findings and its `context` (rendered DOM, sampled page HTML, brand name guess).
3. Run `trust-and-identity`, passing the brand name and homepage HTML/text from step 2's context.
4. Run `engagement-audit`, passing the sampled pages (url + html) from step 2's context.
5. Merge all findings from steps 2–4 into one list. Deduplicate near-identical findings (same `sourceCheck` + overlapping `title` wording pointing at the same underlying issue) by keeping the one with the more specific `evidence` string.
6. Split findings into `findings` (confirmed problems) and `opportunities` (any finding marked `isOpportunity: true` upstream, or with no explicit defect detected) per the extended schema.
7. Assign sequential IDs (`F-001…` for findings, `O-001…` for opportunities) in a fixed order: sort by severity rank (critical > high > medium > low), then by the order the detector skills ran.
8. Compute `priority` per finding as a function of severity and a rough effort estimate (see `references/report_schema.json` for the priority lookup convention used).
9. Compute the `summary` block: `total_findings` and counts by severity.
10. Emit the final report matching the schema in `references/report_schema.json`.

## Output
A single JSON object: `{ site, audited_at, summary, findings[], opportunities[] }`. See `references/report_schema.json` for the authoritative shape.
