---
name: engagement-audit
description: Check whether visitors who land on a page have a clear reason to stay — above-the-fold value proposition clarity, findable calls-to-action, click-depth to key information, broken internal links, mobile viewport support, and plain-text trust signals. Use for the on-site-engagement half of an AI-discoverability-and-engagement audit, after reach-and-read has fetched the page.
license: MIT
allowed-tools: ["fetch"]
---

# Engagement Audit

## When to use
Run after `reach-and-read` for a given site. Reuses its fetched HTML rather than re-fetching, since both skills need the same pages. Covers why a visitor (human or agent) who successfully reaches and reads a page might still leave without engaging.

## Inputs
- `pages`: array of `{ url, html }` — typically the pages already fetched by `reach-and-read`.

## Procedure
1. For each page, check whether a plain-text sentence within the likely-first-screen content states what the brand/product is and does (value proposition clarity).
2. Count calls-to-action (buttons/links with action-oriented text) and flag pages with zero, or with many competing CTAs and no clear primary one.
3. Build the internal link graph from sampled pages; estimate click-depth from the homepage to typical key-intent pages (pricing, contact, docs) if present in the sample.
4. Sample internal links and check for 404s / broken links.
5. Check for a `<meta name="viewport">` tag as a proxy for mobile responsiveness.
6. Check for plain-text trust signals: a findable contact method, and a policy/about link.
7. Emit findings — no IDs or severity summary; that is composed by the orchestrator.

## Output
Array of finding objects in the same shape as `reach-and-read` (see that skill's SKILL.md), with `category: "on-site-engagement"`.
