# Trust-and-Identity Detailed Checklist

## Corroboration (requires search tool; degrades gracefully without one)
- [ ] Each extracted core claim has ≥2 independent third-party corroborating domains
- [ ] Zero-corroboration claims flagged as high severity
- [ ] Single-corroboration claims flagged as medium severity
- [ ] If no search tool available: exactly one low-severity degraded-mode finding emitted, no fabricated corroboration counts

## Entity disambiguation
- [ ] `sameAs` links present in Organization JSON-LD or footer (Wikipedia/Wikidata/LinkedIn/Crunchbase)
- [ ] If the exact brand name returns highly diverse, unrelated top search results, flag collision risk
- [ ] A distinctive descriptor accompanies the brand name where the name alone is generic/common

## Freshness
- [ ] Dated claims (years, "current X", copyright notices) checked against present date
- [ ] Claims older than ~2 years relative to today flagged for review — the threshold is a heuristic, not a hard rule; central claims (e.g. "current lineup") warrant flagging sooner than incidental ones (e.g. a blog post date)
