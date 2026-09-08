import * as cheerio from 'cheerio';

/**
 * Extracts sameAs-style entity links from JSON-LD and footer social links.
 */
export function extractSameAsSignals(homepageHtml) {
  const $ = cheerio.load(homepageHtml);
  const sameAs = new Set();

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).contents().text());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item.sameAs) {
          const links = Array.isArray(item.sameAs) ? item.sameAs : [item.sameAs];
          links.forEach((l) => sameAs.add(l));
        }
      }
    } catch { /* ignore parse errors here — covered by structured-data check */ }
  });

  // Fallback: common social/reference domains linked anywhere on the page.
  const REFERENCE_DOMAINS = /wikipedia\.org|wikidata\.org|linkedin\.com|crunchbase\.com/i;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (REFERENCE_DOMAINS.test(href)) sameAs.add(href);
  });

  return Array.from(sameAs);
}

export function checkDisambiguationSignals(homepageHtml) {
  const sameAs = extractSameAsSignals(homepageHtml);
  if (sameAs.length === 0) {
    return {
      sameAs,
      findings: [{
        title: 'No entity-disambiguation links (sameAs) found',
        category: 'off-site-discoverability',
        severity: 'low',
        evidence: 'No JSON-LD sameAs property or links to Wikipedia/Wikidata/LinkedIn/Crunchbase were found on the homepage.',
        suggested_action: {
          summary: 'Add sameAs links in Organization JSON-LD pointing to authoritative external profiles of this entity.',
          detail: 'This is the standard, low-effort way to help machines confirm which real-world entity this site refers to, especially when the name isn\'t unique.',
          priority: 'low',
        },
        sourceCheck: 'entity-disambiguation',
        isOpportunity: true,
      }],
    };
  }
  return { sameAs, findings: [] };
}

/**
 * Looks for obviously dated claims (years, "current", copyright) in the
 * homepage text and flags any that are stale relative to the current year.
 */
export function checkStaleClaims(homepageText, currentYear = new Date().getFullYear()) {
  const findings = [];
  const yearMatches = [...homepageText.matchAll(/\b(20[0-2]\d)\b/g)].map((m) => parseInt(m[1], 10));
  const staleThreshold = currentYear - 2;
  const staleYears = yearMatches.filter((y) => y < staleThreshold);

  if (staleYears.length > 0) {
    const oldest = Math.min(...staleYears);
    findings.push({
      title: 'Homepage references years that may indicate stale content',
      category: 'off-site-discoverability',
      severity: 'medium',
      evidence: `Homepage text contains year references as old as ${oldest} (current year: ${currentYear}). This may reflect outdated claims (e.g. "current lineup", copyright notices, or stats not refreshed).`,
      suggested_action: {
        summary: 'Review and refresh any claims tied to specific past years; ensure copyright/last-updated notices reflect the current year.',
        detail: 'AI assistants weigh recency when deciding whether to trust and repeat a claim as current.',
        priority: 'medium',
      },
      sourceCheck: 'freshness',
    });
  }
  return { findings };
}
