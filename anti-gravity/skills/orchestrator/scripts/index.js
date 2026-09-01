import * as cheerio from 'cheerio';
import { runReachAndRead } from 'reach-and-read/scripts/index.js';
import { runTrustAndIdentity } from 'trust-and-identity/scripts/index.js';
import { runEngagementAudit } from 'engagement-audit/scripts/index.js';
import { mergeFindings, splitAndAssignIds } from './mergeFindings.js';
import { applyComputedPriority, computeSummary } from './scoreSummary.js';

function guessBrandName(homepageHtml) {
  const $ = cheerio.load(homepageHtml || '');
  let name = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    if (name) return;
    try {
      const parsed = JSON.parse($(el).contents().text());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
        if (types.includes('Organization') && item.name) {
          name = item.name;
        }
      }
    } catch { /* ignore */ }
  });

  if (!name) {
    const title = $('title').first().text().trim();
    // Heuristic: brand is often the last " | " or " - " separated segment of the title.
    const parts = title.split(/[|\-–]/).map((s) => s.trim()).filter(Boolean);
    name = parts.length > 1 ? parts[parts.length - 1] : title;
  }

  return name || null;
}

function extractCoreClaims(homepageText) {
  // Lightweight heuristic extraction of a couple of factual-sounding
  // sentences to attempt corroboration on — not exhaustive, deliberately
  // conservative to avoid noisy/irrelevant search queries.
  const claims = [];
  const foundedMatch = homepageText.match(/founded in (\d{4})/i);
  if (foundedMatch) claims.push(`founded in ${foundedMatch[1]}`);
  const hqMatch = homepageText.match(/headquartered in ([A-Z][a-zA-Z\s,]+?)[.,]/);
  if (hqMatch) claims.push(`headquartered in ${hqMatch[1].trim()}`);
  return claims;
}

/**
 * Main entrypoint for the anti-gravity marketplace.
 * @param {{ url: string, maxPages?: number, searchFn?: (q:string) => Promise<{url:string}[]> }} input
 */
export async function runAudit({ url, maxPages = 15, searchFn }) {
  const reach = await runReachAndRead({ url, maxPages });

  const homepageHtml = reach.context.dom.htmlByUrl[url] || '';
  const homepageText = reach.context.dom.rawText || '';
  const brandName = guessBrandName(homepageHtml);
  const coreClaims = extractCoreClaims(homepageText);
  const siteDomain = new URL(url).hostname.replace(/^www\./, '');

  const trust = await runTrustAndIdentity({
    brandName: brandName || siteDomain,
    coreClaims,
    homepageHtml,
    homepageText,
    searchFn,
    siteDomain,
  });

  const pagesForEngagement = Object.entries(reach.context.dom.htmlByUrl).map(([pageUrl, html]) => ({
    url: pageUrl,
    html,
  }));
  const engagement = await runEngagementAudit({ pages: pagesForEngagement });

  const merged = mergeFindings([reach.findings, trust.findings, engagement.findings]);
  const withPriority = applyComputedPriority(merged);
  const { findings, opportunities } = splitAndAssignIds(withPriority);
  const summary = computeSummary(findings, url);

  return {
    site: siteDomain,
    audited_at: new Date().toISOString(),
    summary,
    findings,
    opportunities,
  };
}
