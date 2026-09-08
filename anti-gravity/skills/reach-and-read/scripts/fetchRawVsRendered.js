import { Agent, interceptors, request } from 'undici';
import * as cheerio from 'cheerio';

const redirectDispatcher = new Agent({
  interceptors: { Client: [interceptors.redirect({ maxRedirections: 5 })] },
});

const UA = 'AntiGravityAuditBot/1.0 (+read-only audit; no auth; respects robots.txt)';

/**
 * Fetches raw HTML for a URL and extracts visible text with cheerio.
 */
async function fetchRawText(url) {
  const { statusCode, body, headers } = await request(url, {
    method: 'GET',
    dispatcher: redirectDispatcher,
    headersTimeout: 15_000,
    headers: { 'user-agent': UA },
  });
  const html = await body.text();
  const $ = cheerio.load(html);
  $('script, style, noscript').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return { statusCode, html, text, redirected: headers['x-agraph-redirects'] };
}

/**
 * Attempts a headless-browser render. Returns null if Playwright/Chromium
 * isn't available in this environment, so callers can fall back gracefully
 * rather than crashing the whole audit.
 */
async function tryRenderedText(url) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    return null; // playwright not installed in this environment
  }
  let browser;
  try {
    browser = await chromium.launch({ headless: true, timeout: 20_000 });
    const page = await browser.newPage({ userAgent: UA });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });
    const text = await page.evaluate(() => document.body.innerText || '');
    return text.replace(/\s+/g, ' ').trim();
  } catch {
    return null; // navigation/launch failure — degrade gracefully
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

/**
 * Fallback heuristic when no headless browser is available: flag pages whose
 * raw static text is suspiciously short relative to their markup size, which
 * commonly indicates content assembled client-side after load (SPA shells,
 * hydration-only content). This is a proxy signal, not a direct measurement —
 * findings from this path are labeled accordingly with lower confidence.
 */
function staticShellHeuristic(html, rawText) {
  const htmlLength = html.length;
  const textLength = rawText.length;
  const ratio = htmlLength > 0 ? textLength / htmlLength : 0;
  // Real content-heavy pages typically land well above this ratio; SPA
  // shells with content injected client-side tend to sit far below it.
  const SUSPICIOUS_RATIO = 0.02;
  const suspicious = htmlLength > 5000 && ratio < SUSPICIOUS_RATIO;
  return { suspicious, ratio };
}

/**
 * Compares raw vs rendered text for a single URL and returns findings plus
 * the extracted text for reuse by downstream skills.
 */
export async function diffRawVsRendered(url) {
  const raw = await fetchRawText(url);
  const rendered = await tryRenderedText(url);
  const findings = [];

  if (rendered !== null) {
    // Full comparison available.
    const rawWords = new Set(raw.text.toLowerCase().split(/\s+/).filter(Boolean));
    const renderedWords = rendered.toLowerCase().split(/\s+/).filter(Boolean);
    const onlyInRenderedWords = renderedWords.filter((w) => !rawWords.has(w));
    const onlyInRenderedRatio = renderedWords.length > 0
      ? onlyInRenderedWords.length / renderedWords.length
      : 0;

    if (onlyInRenderedRatio > 0.4 && rendered.length > 200) {
      findings.push({
        title: 'Substantial page content only appears after JavaScript execution',
        category: 'off-site-discoverability',
        severity: onlyInRenderedRatio > 0.7 ? 'critical' : 'high',
        evidence: `${url}: raw HTML contains ${raw.text.length} chars of visible text; rendered page contains ${rendered.length} chars. Approximately ${(onlyInRenderedRatio * 100).toFixed(0)}% of rendered words are absent from the raw response.`,
        suggested_action: {
          summary: 'Server-side render or pre-render key content so it is present in the initial HTML response.',
          detail: 'Assistants and crawlers that fetch pages without executing JavaScript will not see content that is only assembled client-side. Migrate primary content (names, prices, specs, core copy) to server-side rendering, static generation, or at minimum ensure it appears in a no-JS fallback.',
          priority: onlyInRenderedRatio > 0.7 ? 'critical' : 'high',
        },
        sourceCheck: 'render-diff',
      });
    }

    return { url, statusCode: raw.statusCode, rawText: raw.text, renderedText: rendered, findings, method: 'headless-render' };
  }

  // Degraded mode: no headless browser available.
  const { suspicious, ratio } = staticShellHeuristic(raw.html, raw.text);
  if (suspicious) {
    findings.push({
      title: 'Page shows signs of client-side-only content assembly (unconfirmed — no headless render available)',
      category: 'off-site-discoverability',
      severity: 'medium',
      evidence: `${url}: static HTML is ${raw.html.length} chars but contains only ${raw.text.length} chars of visible text (text/HTML ratio ${ratio.toFixed(3)}), consistent with a JS-rendered shell. This audit environment could not run a headless browser to confirm directly.`,
      suggested_action: {
        summary: 'Verify with a headless-browser diff whether primary content is only present after JS execution; if so, server-side render it.',
        detail: 'This is a proxy signal based on markup-to-text ratio, not a direct raw-vs-rendered comparison. Confirm manually or re-run this audit in an environment with headless browser support.',
        priority: 'medium',
      },
      sourceCheck: 'render-diff-fallback',
    });
  }

  return { url, statusCode: raw.statusCode, rawText: raw.text, renderedText: null, findings, method: 'static-heuristic' };
}
