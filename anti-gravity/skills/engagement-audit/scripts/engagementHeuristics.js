import * as cheerio from 'cheerio';
import { request } from 'undici';

const CTA_VERBS = /\b(buy|shop|get started|sign up|subscribe|contact|book|schedule|request|learn more|try|download|order|add to cart|start free|apply)\b/i;

function checkValueProp($, url) {
  // Approximate "first screen" as the first ~600 chars of visible body text —
  // a rough but workable proxy without real viewport measurement.
  $('script, style, noscript').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const firstScreenText = bodyText.slice(0, 600);
  const hasSentenceLikeText = /[a-z]{3,}.{20,}[.!?]/i.test(firstScreenText);

  if (!hasSentenceLikeText || firstScreenText.length < 40) {
    return [{
      title: 'No clear value proposition in early page content',
      category: 'on-site-engagement',
      severity: 'high',
      evidence: `${url}: the first ~600 characters of visible text do not contain a clear descriptive sentence stating what the brand/product is or does.`,
      suggested_action: {
        summary: 'Add a plain-text headline/subhead early in the page stating what this is and why it matters.',
        detail: 'Both human visitors and AI agents summarizing the page need an explicit, early statement of purpose — implied or purely visual value props are easy to miss or fail to extract.',
        priority: 'high',
      },
      sourceCheck: 'value-prop',
    }];
  }
  return [];
}

function checkCTAs($, url) {
  const findings = [];
  const candidates = $('a, button').filter((_, el) => CTA_VERBS.test($(el).text()));
  const count = candidates.length;

  if (count === 0) {
    findings.push({
      title: 'No clear call-to-action found on page',
      category: 'on-site-engagement',
      severity: 'medium',
      evidence: `${url}: no links or buttons with action-oriented text (e.g. "Get started", "Contact", "Buy") were found.`,
      suggested_action: {
        summary: 'Add a single, clearly labeled primary call-to-action.',
        detail: 'Visitors (and agents evaluating the page for a user) need an unambiguous next step.',
        priority: 'medium',
      },
      sourceCheck: 'cta',
    });
  } else if (count > 8) {
    findings.push({
      title: 'Many competing calls-to-action with no clear primary action',
      category: 'on-site-engagement',
      severity: 'low',
      evidence: `${url}: ${count} distinct action-oriented links/buttons found, with no visual/structural indication of a single primary CTA.`,
      suggested_action: {
        summary: 'Designate one primary CTA (visually distinct) and demote the rest to secondary styling.',
        detail: 'Too many equally-weighted CTAs increases decision friction and reduces conversion on any single path.',
        priority: 'low',
      },
      sourceCheck: 'cta',
    });
  }
  return findings;
}

function checkViewport($, url) {
  const hasViewport = $('meta[name="viewport"]').length > 0;
  if (!hasViewport) {
    return [{
      title: 'Missing mobile viewport meta tag',
      category: 'on-site-engagement',
      severity: 'medium',
      evidence: `${url}: no <meta name="viewport"> tag found.`,
      suggested_action: {
        summary: 'Add a responsive viewport meta tag.',
        detail: 'Without it, mobile browsers typically render a desktop layout scaled down, which increases bounce on mobile traffic — a large share of both human and in-app-browser agent traffic.',
        priority: 'medium',
      },
      sourceCheck: 'viewport',
    }];
  }
  return [];
}

function checkTrustSignals($, url) {
  const bodyText = $('body').text();
  const hasEmailOrPhone = /[\w.+-]+@[\w-]+\.[\w.-]+/.test(bodyText) || /\+?\d[\d\s().-]{7,}\d/.test(bodyText);
  const hasAboutOrPolicyLink = $('a').filter((_, el) => /about|privacy|terms|policy/i.test($(el).text() + ($(el).attr('href') || ''))).length > 0;

  const findings = [];
  if (!hasEmailOrPhone && !hasAboutOrPolicyLink) {
    findings.push({
      title: 'No plain-text trust signals found (contact info, about/policy links)',
      category: 'on-site-engagement',
      severity: 'low',
      evidence: `${url}: no email/phone pattern or about/privacy/terms links detected in page text.`,
      suggested_action: {
        summary: 'Add a visible contact method and link to an About/Privacy/Terms page.',
        detail: 'These are cheap, well-understood trust signals for both human visitors and agents assessing legitimacy on a user\'s behalf.',
        priority: 'low',
      },
      sourceCheck: 'trust-signals',
    });
  }
  return findings;
}

async function checkBrokenLinks(links, origin, sampleSize = 10) {
  const findings = [];
  const sample = links.slice(0, sampleSize);
  const broken = [];
  await Promise.all(sample.map(async (link) => {
    try {
      const { statusCode } = await request(link, { method: 'HEAD', headersTimeout: 8000, maxRedirections: 3 });
      if (statusCode >= 400) broken.push({ link, statusCode });
    } catch {
      broken.push({ link, statusCode: 'unreachable' });
    }
  }));

  if (broken.length > 0) {
    findings.push({
      title: 'Broken internal links found',
      category: 'on-site-engagement',
      severity: 'high',
      evidence: `${broken.length}/${sample.length} sampled internal links returned an error: ${broken.map((b) => `${b.link} (${b.statusCode})`).join(', ')}.`,
      suggested_action: {
        summary: 'Fix or remove broken internal links.',
        detail: 'Dead ends interrupt both human navigation and any agent attempting a multi-step task on the site.',
        priority: 'high',
      },
      sourceCheck: 'broken-links',
    });
  }
  return findings;
}

/**
 * Runs all engagement checks against a set of already-fetched pages.
 * @param {{url: string, html: string}[]} pages
 */
export async function runEngagementHeuristics(pages) {
  const findings = [];
  const allInternalLinks = new Set();

  for (const page of pages) {
    const $ = cheerio.load(page.html);
    findings.push(...checkValueProp($, page.url));
    findings.push(...checkCTAs($, page.url));
    findings.push(...checkViewport($, page.url));
    findings.push(...checkTrustSignals($, page.url));

    const origin = new URL(page.url).origin;
    $('a[href]').each((_, el) => {
      try {
        const abs = new URL($(el).attr('href'), page.url);
        if (abs.origin === origin) allInternalLinks.add(abs.href);
      } catch { /* skip invalid href */ }
    });
  }

  if (pages.length > 0) {
    const origin = new URL(pages[0].url).origin;
    findings.push(...await checkBrokenLinks(Array.from(allInternalLinks), origin));
  }

  return { findings };
}
