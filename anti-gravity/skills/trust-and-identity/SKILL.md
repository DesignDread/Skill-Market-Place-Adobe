---
name: trust-and-identity
description: Check whether a brand's key claims are corroborated by independent third-party sources and whether the brand is disambiguated from other entities sharing its name — cross-source agreement, sameAs/entity-linking signals, and staleness of dated claims. Use for the trust/corroboration half of an AI-discoverability audit; requires a web-search-capable tool and degrades gracefully to a documented low-confidence mode when one isn't available.
license: MIT
allowed-tools: ["fetch", "web_search"]
---

# Trust and Identity

## When to use
Run alongside or after `reach-and-read` (needs the brand name / core claims extracted from the target site). Encodes why machines trust or distrust a fact: agreement across independent sources, and disambiguation when a brand name collides with other entities.

## Inputs
- `brandName` (string): best-guess brand/entity name, typically from the site's title/Organization schema.
- `coreClaims` (array of strings, optional): specific factual claims to attempt to corroborate (e.g. "founded in 2015", "headquartered in Austin").
- `homepageHtml` (string): homepage HTML, for extracting `sameAs` links from JSON-LD/meta.

## Procedure
1. Extract any `sameAs` links (JSON-LD `Organization.sameAs`, or social/Wikipedia links in the footer) from the homepage HTML.
2. If a search tool is available: for each core claim, search for independent third-party mentions and count how many unrelated domains state the same fact. If no search tool is available, skip corroboration checks and emit a single informational finding noting the reduced-confidence mode — do not fabricate corroboration counts.
3. If a search tool is available: search the bare brand name and assess result diversity — many unrelated top results for the exact name, with no disambiguating signal (`sameAs`, distinctive descriptor) on-site, indicates entity-collision risk.
4. Check any dated claims found on-site (e.g. "as of 2019", copyright years, "current" pricing/lineup language) against the present date for staleness.
5. Emit findings — no IDs or severity summary; composed by the orchestrator.

## Output
Array of finding objects, `category: "off-site-discoverability"`, same shape as `reach-and-read`. When running in degraded mode (no search tool), findings that depend on search are omitted and replaced with one `severity: "low"`, `sourceCheck: "degraded-mode"` finding explaining the limitation.
