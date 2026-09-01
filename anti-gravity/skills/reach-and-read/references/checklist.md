# Reach-and-Read Detailed Checklist

Ordered by the mechanism chain: reach → read → extract. A failure earlier in
the chain should generally be treated as more severe, since it makes later
checks moot for that page.

## 1. Reach (can the crawler get in?)
- [ ] robots.txt fetched and parsed successfully (or absent — treat as allow-all)
- [ ] Primary content paths (home, product/service, about, pricing, contact) not disallowed for a general user-agent
- [ ] HTTP status 2xx on all primary paths (no unexpected 4xx/5xx)
- [ ] Redirect chains ≤ 2 hops on primary paths

## 2. Read (can the crawler read what's there?)
- [ ] Raw HTML response contains substantially the same visible text as the JS-rendered page
- [ ] No critical content (price, name, core claims, contact info) present only post-render
- [ ] If no headless browser is available in this environment, the static-HTML-length heuristic ran instead and is labeled as lower-confidence

## 3. Extract (can the crawler pick out a specific fact?)
- [ ] JSON-LD present for the page's apparent content type (Product/Organization/Article/FAQPage)
- [ ] JSON-LD parses as valid JSON and passes minimal required-field validation
- [ ] Key answerable facts (price, founding info, contact, value prop) stated as plain text, not only in an image/PDF/video with no text fallback
- [ ] Page `<title>` is specific and non-generic
- [ ] Meta description present
- [ ] Canonical tag present and self-referential

## Proactive / opportunity signals (not defects by default)
- [ ] `llms.txt` present
- [ ] `sameAs` / entity-linking signals present (also checked by trust-and-identity)
