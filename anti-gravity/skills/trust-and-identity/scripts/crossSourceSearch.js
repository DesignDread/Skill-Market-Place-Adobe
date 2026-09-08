/**
 * This module deliberately does not hardcode a specific search API. Different
 * agent runtimes expose web search differently (a tool call, an MCP server,
 * a REST API). Callers inject a `searchFn(query) => Promise<{url, domain}[]>`
 * appropriate to their environment. If none is provided, every function here
 * degrades to a single documented low-confidence finding instead of failing
 * the whole audit or fabricating results.
 */

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * @param {string} brandName
 * @param {string[]} coreClaims - e.g. ["founded in 2015", "headquartered in Austin"]
 * @param {(query: string) => Promise<{url: string}[]>} [searchFn]
 * @param {string} [siteDomain] - the target site's own domain, excluded from "independent" counts
 */
export async function checkCorroboration(brandName, coreClaims, searchFn, siteDomain) {
  if (!searchFn) {
    return {
      findings: [{
        title: 'Cross-source corroboration not evaluated (no search tool available)',
        category: 'off-site-discoverability',
        severity: 'low',
        evidence: 'This audit environment did not provide a web-search-capable tool, so claim corroboration across independent sources could not be checked.',
        suggested_action: {
          summary: 'Re-run this audit in an environment with web search enabled for full corroboration coverage.',
          detail: 'No corroboration findings were fabricated in this run — this is a coverage gap, not a detected defect.',
          priority: 'low',
        },
        sourceCheck: 'degraded-mode',
      }],
    };
  }

  const findings = [];
  for (const claim of coreClaims || []) {
    const query = `"${brandName}" ${claim}`;
    let results = [];
    try {
      results = await searchFn(query);
    } catch {
      continue; // one failed search shouldn't abort the whole check
    }
    const independentDomains = new Set(
      results
        .map((r) => domainOf(r.url))
        .filter((d) => d && d !== siteDomain)
    );

    if (independentDomains.size === 0) {
      findings.push({
        title: `Claim not corroborated by any independent source: "${claim}"`,
        category: 'off-site-discoverability',
        severity: 'high',
        evidence: `Searched for "${brandName}" combined with the claim "${claim}"; found zero independent third-party sources stating the same fact.`,
        suggested_action: {
          summary: 'Get this fact restated on at least one independent, reputable third-party source (press mention, directory listing, partner page).',
          detail: 'AI assistants weight facts that appear on only one site as fragile and are less likely to repeat them confidently.',
          priority: 'high',
        },
        sourceCheck: 'corroboration',
      });
    } else if (independentDomains.size === 1) {
      findings.push({
        title: `Claim weakly corroborated: "${claim}"`,
        category: 'off-site-discoverability',
        severity: 'medium',
        evidence: `Only one independent domain (${[...independentDomains][0]}) corroborates "${claim}".`,
        suggested_action: {
          summary: 'Seek additional independent corroboration for this claim.',
          detail: 'A single corroborating source is better than none but still fragile compared to consistent multi-source agreement.',
          priority: 'medium',
        },
        sourceCheck: 'corroboration',
      });
    }
  }
  return { findings };
}

/**
 * @param {string} brandName
 * @param {(query: string) => Promise<{url: string, title?: string}[]>} [searchFn]
 */
export async function checkNameCollisionRisk(brandName, searchFn) {
  if (!searchFn) return { findings: [] }; // already covered by the degraded-mode note above

  let results = [];
  try {
    results = await searchFn(`"${brandName}"`);
  } catch {
    return { findings: [] };
  }

  const domains = new Set(results.map((r) => domainOf(r.url)).filter(Boolean));
  // Heuristic: if the top results span many unrelated domains with no
  // apparent connection to each other, the name is likely ambiguous.
  if (domains.size >= 6 && results.length >= 6) {
    return {
      findings: [{
        title: 'Potential entity name collision with unrelated organizations',
        category: 'off-site-discoverability',
        severity: 'medium',
        evidence: `A search for "${brandName}" returns results spanning ${domains.size} distinct, apparently unrelated domains, suggesting the exact name is shared by multiple entities.`,
        suggested_action: {
          summary: 'Add explicit disambiguation: a distinctive descriptor near the brand name, and sameAs links to the brand\'s own Wikipedia/Wikidata/social profiles.',
          detail: 'Without disambiguating signals, an AI assistant answering about this brand risks conflating it with an unrelated same-named entity.',
          priority: 'medium',
        },
        sourceCheck: 'entity-disambiguation',
      }],
    };
  }
  return { findings: [] };
}
