# Anti Gravity — Implementation Plan
### Adobe University Hackathon 2026, Round 3: Brand AI-Readiness Audit Marketplace

---

## 1. Concept & Naming

**Anti Gravity** = the marketplace pulls a brand's content "up" into AI answers instead of letting it sink into invisibility. Two forces work against a brand:

- **Off-site gravity** — the brand never gets crawled, read, or cited by AI assistants (Round-2 discoverability failures).
- **On-site gravity** — visitors who do land bounce because the page gives them no reason/way to stay (Round-2 engagement failures).

The marketplace's job: detect both, with evidence and severity, and prescribe fixes. Name doubles as the marketplace `name` field: `anti-gravity`.

---

## 2. High-Level Architecture

```
anti-gravity/                          <- marketplace root (zip this)
├── marketplace.json                   <- manifest, 1 entrypoint
├── README.md
└── skills/
    ├── orchestrator/                  <- ENTRYPOINT
    │   ├── SKILL.md
    │   ├── package.json
    │   ├── scripts/
    │   │   ├── mergeFindings.js
    │   │   └── scoreSummary.js
    │   └── references/
    │       └── report_schema.json
    ├── reach-and-read/                 <- off-site: crawlability + rendering + extractability
    │   ├── SKILL.md
    │   ├── package.json
    │   ├── scripts/
    │   │   ├── fetchRawVsRendered.js
    │   │   ├── robotsCheck.js
    │   │   └── structuredDataCheck.js
    │   └── references/checklist.md
    ├── trust-and-identity/             <- off-site: corroboration + entity disambiguation + freshness
    │   ├── SKILL.md
    │   ├── package.json
    │   ├── scripts/
    │   │   ├── crossSourceSearch.js
    │   │   └── entityDisambiguation.js
    │   └── references/checklist.md
    └── engagement-audit/               <- on-site: orientation, context retention, conversion clarity
        ├── SKILL.md
        ├── package.json
        ├── scripts/
        │   └── engagementHeuristics.js
        └── references/checklist.md
```

**Runtime:** Node.js (v20+), ESM modules (`"type": "module"` in each skill's `package.json`). Each skill folder gets its own minimal `package.json` so dependencies stay scoped and the marketplace zip doesn't require a single shared monorepo install step — the orchestrator's `package.json` lists the others as file-path dependencies if you want a single `npm install` at the root, or keep them fully independent if the grading harness invokes each skill in isolation (confirm which before deciding — see §10).

**Why 4 skills, not 1 or 8:** the rubric rewards decomposition *by genuine concern*, not by count. Three failure surfaces emerge cleanly from the Round-2 appendix (A+C = "can it be reached and read", D = "is it trusted and disambiguated", E/F-adjacent = "does it retain the visitor once there"), so three detector skills plus one composer is the natural cut. Don't split further just to pad the skill count — a `freshness` skill separate from `corroboration` would duplicate the same web-cross-check machinery for no separation-of-concerns benefit.

---

## 3. Skill-by-Skill Design

### 3.1 `orchestrator` (entrypoint)

**Responsibility:** receives `{url}`, calls the three detector skills in sequence (or parallel where independent), merges their findings into one list, assigns IDs (`F-001`, `F-002`, …), computes the severity summary, and emits the final report against the fixed schema.

**Procedure (deterministic):**
1. Validate input URL; check `robots.txt` before any fetch (guardrail compliance — reachability check itself must respect robots.txt).
2. Invoke `reach-and-read` → list of findings + raw context (rendered HTML, structured data dump) passed forward so downstream skills don't re-fetch.
3. Invoke `trust-and-identity` → list of findings (uses brand/entity name extracted in step 2).
4. Invoke `engagement-audit` → list of findings (uses rendered HTML from step 2).
5. Merge: dedupe overlapping findings (e.g. both reach-and-read and engagement-audit might separately notice "no readable page title" — collapse to one finding, keep the more specific evidence).
6. Sort findings by severity (critical → high → medium → low).
7. Generate proactive/beyond-defect suggestions (see §5) and append as findings with `severity: "opportunity"` or fold into `suggested_action` on adjacent findings — decide one convention and hold it consistently (recommend: separate `opportunities` array alongside `findings`, since the schema's `findings` implies a detected problem; document the extension in README).
8. Emit report per schema in §6.

**Composition logic lives here, not in the sub-skills** — each sub-skill returns raw, uninterpreted findings; only the orchestrator does merge/dedupe/prioritize. This keeps sub-skills independently testable and swappable.

**Node implementation note:** `mergeFindings.js` and `scoreSummary.js` are plain functions exported from each module (`export function mergeFindings(findingArrays) {...}`), invoked either by a thin CLI wrapper (`node scripts/mergeFindings.js --input ...`) if the agent runtime shells out to scripts, or imported directly if the runtime supports in-process JS execution. Decide the invocation contract once and use it consistently across all four skills — mixing "agent reads SKILL.md and calls scripts via shell" with "agent imports JS modules directly" across different skills will break composability.

---

### 3.2 `reach-and-read` — off-site discoverability, mechanism A/B/C

Encodes: *crawler admitted → page readable → fact extractable*, in that order (per Appendix A/B/C — a failure at any stage makes everything downstream moot, so check in-order and short-circuit severity escalation logic accordingly).

**Checks:**

| # | Check | Evidence captured | Severity logic |
|---|---|---|---|
| 1 | `robots.txt` blocks key paths (product/about/pricing pages) | Disallowed paths list | Critical if disallows crawl of primary content |
| 2 | Raw HTML vs. rendered (headless) HTML diff | % of visible text present only after JS execution | Critical if core facts (price, product name, key claims) only appear post-render; Medium if only decorative content differs |
| 3 | HTTP status / redirect chains on key pages | Status codes, redirect depth | High if 4xx/5xx on primary pages; Medium if >2 redirect hops |
| 4 | Structured data presence & validity (JSON-LD schema.org) | Count of pages with/without valid `Product`, `Organization`, `Article`, `FAQPage` etc.; schema validation errors | High if 0% coverage on content that maps to a schema.org type; Medium if present but invalid/incomplete |
| 5 | Key-fact extractability in plain text | For a sample of "answerable" facts (price, founding date, contact, core value prop), check if stated as a plain sentence vs. only in an image/infographic/PDF/video | High if primary facts are locked in non-text media with no text fallback/alt |
| 6 | `llms.txt` / AI-crawler-specific directives (if present) | Presence, contents | Informational/Low — proactive suggestion territory if absent |
| 7 | Canonical tags & duplicate-content signals | Canonical URL presence, self-referential correctness | Medium |
| 8 | Page title / meta description quality | Presence, length, genericness (e.g. "Home" as title) | Medium |

**Anti-fit-to-examples guardrail:** every check above is a *mechanism* test (does X exist / is X readable), not a pattern match against specific known sites. This is what generalizes to unseen sites.

**Node libraries for this skill:**

| Check | Library |
|---|---|
| Raw fetch | `undici` (built into Node 20+) or `node-fetch` |
| Headless render for JS-vs-raw diff | `playwright` (Chromium) — or `puppeteer` if the sandbox already has Chrome |
| HTML parsing / text extraction | `cheerio` |
| `robots.txt` parsing | `robots-parser` (npm) |
| JSON-LD extraction & schema.org shape validation | `cheerio` to pull `<script type="application/ld+json">`, then `ajv` against a minimal schema.org JSON Schema subset |
| Redirect chain / status codes | `undici`'s `dispatcher` with `redirect: 'manual'` to walk hops explicitly |

`fetchRawVsRendered.js` should export a diff function that returns `{ rawText, renderedText, onlyInRendered: [...] }` so the orchestrator can cite exact missing fragments as evidence.

---

### 3.3 `trust-and-identity` — off-site discoverability, mechanism D

Encodes: *cross-source agreement + disambiguation* (Appendix D).

**Checks:**

| # | Check | Evidence captured | Severity logic |
|---|---|---|---|
| 1 | Cross-source corroboration of core facts | For N key claims (e.g. "founded in X", "HQ in Y"), search count of independent third-party sources stating the same fact | High if a claimed fact appears on zero independent third-party sources; Medium if only 1 |
| 2 | Entity disambiguation signals | Presence of `sameAs` links (Wikipedia/Wikidata/social), unique-enough naming, disambiguating descriptors in meta/schema | Critical if brand name collides with a much larger unrelated entity and no disambiguation exists; Medium otherwise |
| 3 | Consistency of NAP-style facts (name/description/category) across own site vs. third-party listings | Diff count | Medium |
| 4 | Freshness of key claims | Last-modified dates, dated content vs. current date, stale claims (e.g. "our 2019 lineup") | Medium–High depending on how central the stale fact is to the brand's current identity |
| 5 | Review/mentions volume as a trust proxy | Rough count of independent mentions found | Low/Informational — feeds "opportunity" suggestions, not hard findings, since low mention count isn't itself a defect the site can directly fix |

**Note on tool access:** this skill needs web-search capability (`allowed-tools: web_search` or equivalent) declared in frontmatter — it can't self-corroborate from the target site alone.

**Node implementation:** `crossSourceSearch.js` wraps whatever search API/tool the agent runtime exposes (a plain `fetch`/`undici` POST if it's a REST search API) and normalizes results into `{ query, sourcesFound, matchingSources }`. `entityDisambiguation.js` uses `cheerio` to check the target site for `sameAs` links in JSON-LD/meta tags and cross-references the extracted brand name against search result diversity (many unrelated top results for the exact brand name = disambiguation risk).

---

### 3.4 `engagement-audit` — on-site retention

Round 2's "why visitors bounce" side. Derived from general HCI/AI-agent-context principles rather than a fixed appendix letter — reasoning: an agent (or human) landing on a page needs (a) immediate orientation — what is this, why should I care, (b) a clear next action, (c) retained context if it's a multi-step or conversational surface, (d) no dead ends.

**Checks:**

| # | Check | Evidence captured | Severity logic |
|---|---|---|---|
| 1 | Above-the-fold value proposition clarity | Is there a plain-text sentence within the first screen stating what the brand/product is and does? | High if absent |
| 2 | Primary CTA presence & clarity | Number and clarity of calls-to-action; competing/conflicting CTAs | Medium |
| 3 | Navigation depth to key info (pricing, contact, docs) | Click-depth from homepage | Medium if >2 clicks for primary intents |
| 4 | Broken internal links / dead ends | Count of 404s in internal link graph (shallow crawl) | High |
| 5 | Context retention across a short task (e.g. search → results, multi-step form) | Does state persist across steps (session/query params) or does the user get reset? | Medium |
| 6 | Mobile/responsive readability | Viewport meta tag, basic responsive check | Medium |
| 7 | Load performance as a bounce driver | Time-to-first-byte / basic timing | Medium — cite as engagement risk, not just SEO |
| 8 | Trust signals on-page (contact info, policies, about) findable in plain text | Presence/absence | Low–Medium |

**Node implementation:** `engagementHeuristics.js` reuses the rendered DOM from `reach-and-read` (pass it through the orchestrator rather than re-rendering) and uses `cheerio` for structural checks (CTA count/selectors, viewport meta tag, internal `<a href>` graph for click-depth and 404 sampling). Load timing can come from `playwright`'s built-in navigation timing API if you're already paying the render cost, avoiding a second tool dependency.

---

## 4. Report Schema (extends the required floor)

```json
{
  "site": "example.com",
  "audited_at": "2026-09-20T14:32:00Z",
  "summary": {
    "total_findings": 6,
    "critical": 1,
    "high": 2,
    "medium": 3,
    "low": 0
  },
  "findings": [
    {
      "id": "F-001",
      "title": "No JSON-LD structured data on product pages",
      "category": "off-site-discoverability",
      "severity": "high",
      "evidence": "Crawled 12 product pages; 0/12 contain schema.org markup.",
      "suggested_action": {
        "summary": "Add Product/Offer JSON-LD to every product page.",
        "detail": "...",
        "priority": "high"
      }
    }
  ],
  "opportunities": [
    {
      "id": "O-001",
      "title": "No llms.txt directive file",
      "rationale": "Proactively signals crawl preferences to AI agents even though no current defect was detected.",
      "suggested_action": { "summary": "...", "priority": "low" }
    }
  ]
}
```

`category` field added beyond the floor schema so a non-expert reader can immediately see the discoverability/engagement split called for in the brief — cheap addition, directly serves "Output design" rubric line.

---

## 5. Suggested-Action Generation Logic

Each check in §3 maps 1:1 to a template fix, but the orchestrator should make actions *specific to the evidence*, not generic boilerplate:

- Bad: "Improve structured data."
- Good: "Add `Product` and `Offer` JSON-LD to the 12 product pages listed in evidence; include `price`, `availability`, and `sku` at minimum — these are the fields ChatGPT/Perplexity shopping surfaces read first."

Priority = f(severity, estimated effort). Encode a simple effort tag per check template (low/med/high) in `references/checklist.md` for each skill, and let the orchestrator compute a priority that isn't just a copy of severity — e.g. a "critical severity + low effort" fix should be flagged as the top priority, ahead of a "critical severity + high effort" one, since that's genuinely more actionable for a non-expert reader.

---

## 6. Marketplace Manifest

```json
{
  "name": "anti-gravity",
  "version": "1.0.0",
  "skills": [
    { "id": "orchestrator", "path": "skills/orchestrator", "entrypoint": true },
    { "id": "reach-and-read", "path": "skills/reach-and-read" },
    { "id": "trust-and-identity", "path": "skills/trust-and-identity" },
    { "id": "engagement-audit", "path": "skills/engagement-audit" }
  ]
}
```

---

## 7. Engineering Hygiene / Compliance Checklist

- [ ] Every `SKILL.md` has valid YAML frontmatter (`name`, `description` minimum) per agentskills.io.
- [ ] Run `npx skills-ref validate ./skills/<name>` on each folder before packaging (the `skills-ref` CLI is itself an npm package, so no Python toolchain is needed anywhere in the build or validate steps).
- [ ] Each skill declares `allowed-tools` explicitly (e.g. `reach-and-read` needs fetch/render + robots-check; `trust-and-identity` needs web_search; `engagement-audit` needs fetch/render only — no skill needs write/auth tools).
- [ ] No skill authenticates, writes, or mutates anything — read-only sandboxed execution throughout.
- [ ] Respect `robots.txt` at the very first fetch, before any other check runs.
- [ ] Deterministic: same URL + same live content → same findings (no randomness in scoring; sort orders fixed).
- [ ] Runtime budget: target <5 min for a typical mid-size site — cap crawl depth/page count (e.g. homepage + up to 15 sampled internal pages) rather than exhaustive crawling.
- [ ] Zip size <50MB — **do not commit `node_modules/`**; each skill's `package.json` declares dependencies (`playwright`/`puppeteer`, `cheerio`, `undici`, `robots-parser`, `ajv`) and they're installed at eval time, not shipped in the zip. Add `node_modules/` to a root `.gitignore`/`.zipignore` before packaging.
- [ ] `"type": "module"` set consistently (or consistently omitted) across every skill's `package.json` — mixing ESM and CommonJS across skills is a common source of import failures at eval time.
- [ ] Pin dependency versions in each `package.json` (exact or tilde ranges) so the eval-time `npm install` is reproducible — floating `^` majors on `playwright` in particular can silently change Chromium behavior between runs.
- [ ] `marketplace.json` self-contained, exactly one `entrypoint: true`.
- [ ] Root `README.md` explains what each skill does and how orchestrator composes them (required for submission, also doubles as your own field notes).

---

## 8. Field-Research Process (how to derive the checks, not just implement them)

The brief explicitly rewards *discovering signals*, not memorizing sites. Suggested process:

1. Pick 8–10 real sites across categories (e-commerce, SaaS, local business, publisher) — half you'd guess AI assistants cite well, half poorly.
2. For each, ask 2–3 different AI assistants (with browsing/search enabled) a natural question that should surface the brand. Record: cited or not, accurate or misrepresented.
3. For every miss/misrepresentation, diff: raw HTML vs rendered HTML, structured data presence, plain-text statement of the fact that was missed, cross-source corroboration count.
4. Write down the *repeatable mechanism* behind each miss (not "site X failed" but "facts injected client-side after hydration are invisible to non-JS crawlers").
5. Turn each mechanism into a check in §3's tables — this is the traceability the rubric is checking for ("does the skill encode the right checks... with evidence and without false positives").
6. Deliberately test the checks against a site *not* in your research set at the end, to catch overfitting before submission.

---

## 9. Build Timeline (suggested)

| Phase | Work | Output |
|---|---|---|
| 1 | Field research (§8) across 8–10 sites | Signal list with mechanism notes |
| 2 | Scaffold `marketplace.json` + 4 `SKILL.md` stubs + per-skill `package.json` (`npm init -y` in each, add deps) | Structure passes `npx skills-ref validate` |
| 3 | Implement `reach-and-read` scripts in Node (`undici` fetch, `playwright` render diff, `cheerio` structured-data extraction, `robots-parser`) | Findings on a test URL |
| 4 | Implement `trust-and-identity` scripts (search-tool wrapper for corroboration, `cheerio`-based disambiguation) | Findings on same test URL |
| 5 | Implement `engagement-audit` scripts (`cheerio` DOM heuristics, reuse `playwright` timing) | Findings on same test URL |
| 6 | Implement `orchestrator` merge/dedupe/priority + schema emission (plain JS module functions, exported and unit-testable with `node --test`) | Full end-to-end report |
| 7 | Run against 2–3 unseen sites; tune false-positive rate | Cleaned checks |
| 8 | Write README, package zip, size/runtime check | Submission-ready |

---

## 10. Risks / Open Decisions to Settle Early

- **Headless rendering dependency:** Playwright/Puppeteer needs a Chromium binary at runtime (`npx playwright install chromium`, ~150–300MB, must NOT be bundled in the zip per the <50MB / no-pretrained-weights rule) — confirm the grading sandbox allows this install step, or fall back to a lighter no-browser heuristic (e.g. flag pages where static-HTML text length is suspiciously small relative to page complexity, as a proxy for "content likely injected by JS" without actually rendering). Decide this before building §3.1 check #2 and §3.4's engagement checks that reuse the rendered DOM.
- **Node version pinning:** declare an `engines.node` field (e.g. `">=20"`) in each `package.json` so `undici`'s built-in fetch and any ESM top-level-await usage behave consistently in the eval sandbox.
- **Web-search tool availability for `trust-and-identity`:** if the grading environment doesn't expose a search tool, corroboration checks need a documented degraded mode (e.g. skip with a clear "not evaluable in this environment" note) rather than failing the whole report.
- **Opportunities vs. findings split:** decide once (§4) and apply consistently — reviewers will notice if some proactive suggestions leak into `findings` with fabricated "evidence."
