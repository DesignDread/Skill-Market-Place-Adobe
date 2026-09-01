import { request } from 'undici';
import * as cheerio from 'cheerio';
import { checkRobots } from './robotsCheck.js';
import { diffRawVsRendered } from './fetchRawVsRendered.js';
import { checkStructuredData } from './structuredDataCheck.js';

const PRIMARY_PATHS = ['/', '/about', '/pricing', '/contact', '/products'];

function guessExpectedType(path) {
  if (/product/i.test(path)) return 'Product';
  if (/^\/(about|company)/i.test(path)) return 'Organization';
  if (/blog|article|news/i.test(path)) return 'Article';
  if (/faq/i.test(path)) return 'FAQPage';
  return null;
}

async function checkMetaAndCanonical(url, html) {
  const $ = cheerio.load(html);
  const findings = [];
  const title = $('title').first().text().trim();
  const metaDesc = $('meta[name="description"]').attr('content')?.trim() || '';
  const canonical = $('link[rel="canonical"]').attr('href') || '';

  const GENERIC_TITLES = ['home', 'untitled', 'index', ''];
  if (GENERIC_TITLES.includes(title.toLowerCase()) || title.length < 3) {
    findings.push({
      title: 'Page title is missing or generic',
      category: 'off-site-discoverability',
      severity: 'medium',
      evidence: `${url}: <title> is "${title || '(empty)'}".`,
      suggested_action: {
        summary: 'Write a specific, descriptive <title> stating the brand and page purpose.',
        detail: 'Titles are one of the strongest, cheapest-to-fix signals both search engines and AI assistants use to understand what a page is about.',
        priority: 'medium',
      },
      sourceCheck: 'meta',
    });
  }

  if (!metaDesc) {
    findings.push({
      title: 'Missing meta description',
      category: 'off-site-discoverability',
      severity: 'low',
      evidence: `${url}: no <meta name="description"> found.`,
      suggested_action: {
        summary: 'Add a concise meta description summarizing the page.',
        detail: 'Meta descriptions are often used verbatim as a fallback snippet by search and assistant surfaces when no better summary is extractable.',
        priority: 'low',
      },
      sourceCheck: 'meta',
    });
  }

  if (!canonical) {
    findings.push({
      title: 'Missing canonical tag',
      category: 'off-site-discoverability',
      severity: 'low',
      evidence: `${url}: no <link rel="canonical"> found.`,
      suggested_action: {
        summary: 'Add a self-referential canonical tag to each page.',
        detail: 'Without a canonical, duplicate or parameterized URL variants can split ranking/citation signal across multiple URLs for the same content.',
        priority: 'low',
      },
      sourceCheck: 'canonical',
    });
  }

  return { findings, title, metaDesc, canonical };
}

async function checkLlmsTxt(origin) {
  try {
    const { statusCode } = await request(`${origin}/llms.txt`, { method: 'GET', headersTimeout: 8000 });
    if (statusCode >= 200 && statusCode < 300) {
      return { present: true, findings: [] };
    }
  } catch {
    // ignore — treated as absent below
  }
  return {
    present: false,
    findings: [
      {
        title: 'No llms.txt directive file found',
        category: 'off-site-discoverability',
        severity: 'low',
        evidence: `${origin}/llms.txt returned a non-2xx status or was unreachable.`,
        suggested_action: {
          summary: 'Consider publishing an llms.txt file describing preferred crawl/citation behavior for AI agents.',
          detail: 'This is an emerging, not-yet-universal convention — treat as a proactive opportunity rather than a confirmed defect.',
          priority: 'low',
        },
        sourceCheck: 'llms-txt',
        isOpportunity: true,
      },
    ],
  };
}

/**
 * Main entry point for the reach-and-read skill.
 * @param {{url: string, maxPages?: number}} input
 */
export async function runReachAndRead({ url, maxPages = 15 }) {
  const origin = new URL(url).origin;
  const findings = [];

  // 1. robots.txt — must run first per procedure.
  const robots = await checkRobots(url, PRIMARY_PATHS);
  findings.push(...robots.findings);

  // 2. Fetch homepage (raw + rendered) regardless of robots outcome for
  // reporting purposes — a blocked path is reported, not silently skipped.
  const homepageDiff = await diffRawVsRendered(url);
  findings.push(...homepageDiff.findings);

  // Discover a small set of internal links to sample, capped at maxPages.
  let internalLinks = [];
  try {
    const { body } = await request(url, { headersTimeout: 15000 });
    const html = await body.text();
    const $$ = cheerio.load(html);
    const hrefs = new Set();
    $$('a[href]').each((_, el) => {
      const href = $$(el).attr('href');
      try {
        const abs = new URL(href, url);
        if (abs.origin === origin) hrefs.add(abs.href);
      } catch {
        /* skip invalid hrefs */
      }
    });
    internalLinks = Array.from(hrefs).slice(0, maxPages);
  } catch {
    internalLinks = [];
  }

  const sampledPageDiffs = [homepageDiff];
  const htmlByUrl = {};
  for (const link of internalLinks) {
    try {
      const diff = await diffRawVsRendered(link);
      sampledPageDiffs.push(diff);
      findings.push(...diff.findings);
    } catch {
      /* individual page failures shouldn't abort the whole audit */
    }
  }

  // Re-fetch raw HTML for structured-data + meta checks (cheap, cached per page).
  const pagesForStructuredData = [];
  for (const diff of sampledPageDiffs) {
    try {
      const { body } = await request(diff.url, { headersTimeout: 15000 });
      const html = await body.text();
      htmlByUrl[diff.url] = html;
      const path = new URL(diff.url).pathname;
      pagesForStructuredData.push({ url: diff.url, html, expectedType: guessExpectedType(path) });
      const metaResult = await checkMetaAndCanonical(diff.url, html);
      findings.push(...metaResult.findings);
    } catch {
      /* skip on fetch failure */
    }
  }

  const structuredData = checkStructuredData(pagesForStructuredData);
  findings.push(...structuredData.findings);

  const llms = await checkLlmsTxt(origin);
  findings.push(...llms.findings);

  return {
    findings,
    context: {
      dom: {
        rawText: homepageDiff.rawText,
        renderedText: homepageDiff.renderedText,
        htmlByUrl,
      },
      pagesSampled: sampledPageDiffs.map((d) => d.url),
    },
  };
}
