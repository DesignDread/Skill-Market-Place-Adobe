---
name: crawl-render-audit
description: Check whether a website's key content can actually be reached and read by an automated crawler — robots.txt access, raw-HTML vs JS-rendered content gaps, structured data (JSON-LD/schema.org) presence and validity, HTTP status/redirect health, and whether key facts are stated in plain extractable text versus locked in images, PDFs, or video. Use as the first step of any AI-discoverability audit, since a page that fails to be reached or read makes every downstream signal moot.
license: MIT
allowed-tools: ["fetch", "headless-browser"]
---

# Reach and Read

## When to use
Run this first in any AI-discoverability audit. It answers three ordered questions from how crawlers and AI-assistant retrieval actually work: (1) is the crawler let in, (2) can it read what's on the page, (3) can it extract the specific facts a person might ask about. A failure at an earlier question makes later ones moot, so checks are evaluated in this order and severity escalates accordingly.

## Inputs
- `url` (string, required): the site or page to audit.
- `maxPages` (number, optional, default 15): cap on internal pages sampled beyond the homepage, to keep runtime under budget.

## Procedure
1. Fetch and parse `robots.txt` for the target domain. Determine whether primary content paths (home, product/service pages, about, pricing/contact) are disallowed for general crawlers. Do this before any other fetch.
2. Fetch the raw HTML of the homepage and up to `maxPages` sampled internal pages (respecting robots.txt). Separately render each with a headless browser and extract the visible text after JS execution.
3. Diff raw-extracted text against rendered text. Any content (especially names, prices, specs, contact info, core claims) present only after render is a discoverability risk, since many crawlers and fetch-based assistants do not execute JavaScript.
4. Extract all `<script type="application/ld+json">` blocks; parse and validate against expected schema.org shapes for the apparent content type (e.g. `Product`, `Organization`, `Article`, `FAQPage`). Record coverage (% of applicable pages with valid markup) and any parse/validation errors.
5. Record HTTP status codes and redirect chain length for each fetched URL.
6. For a small set of "answerable" facts (price, founding/contact info, core value proposition), check whether each is stated as plain, unambiguous text versus only implied, only in an image/infographic without alt text, or only in a PDF/video with no text transcript.
7. Check for an `llms.txt` file and canonical tags; check page `<title>`/meta description for presence and genericness.
8. Emit findings as a JSON array (see Output). Do not assign IDs or compute a severity summary here — that is the orchestrator's job.

## Output
An array of finding objects, each shaped as:
```json
{
  "title": "string",
  "category": "off-site-discoverability",
  "severity": "critical|high|medium|low",
  "evidence": "string — specific, quantified where possible",
  "suggested_action": { "summary": "string", "detail": "string", "priority": "critical|high|medium|low" },
  "sourceCheck": "robots|render-diff|structured-data|http-status|fact-extractability|llms-txt|canonical|meta"
}
```
Also returns a `context` object alongside findings: `{ brandNameGuess, dom: { rawText, renderedText, htmlByUrl } }` so downstream skills (`engagement-audit`, `trust-and-identity`) can reuse the fetched/rendered pages without re-fetching.
