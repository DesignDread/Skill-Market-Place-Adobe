import * as cheerio from 'cheerio';
import { runReachAndRead } from '../../crawl-render-audit/scripts/index.js';
import { runTrustAndIdentity } from '../../freshness-corroboration/scripts/index.js';
import { runEngagementAudit } from '../../engagement-audit/scripts/index.js';
import { mergeFindings, splitAndAssignIds } from './mergeFindings.js';
import { applyComputedPriority, computeSummary } from './scoreSummary.js';
import { extractClaimsWithGemini, createGeminiSearchFn } from './geminiProvider.js';

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

/**
 * Legacy regex fallback for claim extraction — used when no Gemini
 * API key is available.
 */
function extractCoreClaims(homepageText) {
  const claims = [];
  const foundedMatch = homepageText.match(/founded in (\d{4})/i);
  if (foundedMatch) claims.push(`founded in ${foundedMatch[1]}`);
  const hqMatch = homepageText.match(/headquartered in ([A-Z][a-zA-Z\s,]+?)[.,]/);
  if (hqMatch) claims.push(`headquartered in ${hqMatch[1].trim()}`);
  const employeeMatch = homepageText.match(/(\d[\d,]+)\+?\s*employees/i);
  if (employeeMatch) claims.push(`${employeeMatch[1]} employees`);
  const customerMatch = homepageText.match(/(\d[\d,]+)\+?\s*(customers|clients|users)/i);
  if (customerMatch) claims.push(`${customerMatch[1]} ${customerMatch[2]}`);
  const revenueMatch = homepageText.match(/\$\s*([\d.]+)\s*(million|billion)\s*(revenue|valuation|ARR)/i);
  if (revenueMatch) claims.push(`$${revenueMatch[1]} ${revenueMatch[2]} ${revenueMatch[3]}`);
  return claims;
}

/**
 * Main entrypoint for the brand-ai-readiness-audit marketplace.
 * @param {{ url: string, maxPages?: number, searchFn?: (q:string) => Promise<{url:string}[]>, apiKey?: string }} input
 */
export async function runAudit({ url, maxPages = 15, searchFn, apiKey }) {
  const reach = await runReachAndRead({ url, maxPages });

  const homepageHtml = reach.context.dom.htmlByUrl[url] || '';
  const homepageText = reach.context.dom.rawText || '';
  const brandName = guessBrandName(homepageHtml);
  const siteDomain = new URL(url).hostname.replace(/^www\./, '');

  // Use Gemini for claim extraction when API key is available, else regex fallback
  let coreClaims;
  if (apiKey) {
    coreClaims = await extractClaimsWithGemini(homepageText, apiKey);
  } else {
    coreClaims = extractCoreClaims(homepageText);
  }

  // Auto-create search function via Gemini grounding when no custom searchFn is provided
  const effectiveSearchFn = searchFn || createGeminiSearchFn(apiKey);

  const trust = await runTrustAndIdentity({
    brandName: brandName || siteDomain,
    coreClaims,
    homepageHtml,
    homepageText,
    searchFn: effectiveSearchFn,
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
