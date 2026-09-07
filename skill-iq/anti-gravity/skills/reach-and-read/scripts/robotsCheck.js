import { request } from 'undici';
import robotsParser from 'robots-parser';

/**
 * Fetches and parses robots.txt for a domain, and checks whether a set of
 * likely-primary-content paths are disallowed for a generic crawler.
 *
 * @param {string} baseUrl - e.g. "https://example.com"
 * @param {string[]} candidatePaths - paths to test, e.g. ["/", "/products", "/about", "/pricing", "/contact"]
 * @returns {Promise<{
 *   robotsUrl: string,
 *   fetched: boolean,
 *   disallowedPrimaryPaths: string[],
 *   robotsTxtContent: string|null,
 *   findings: object[]
 * }>}
 */
export async function checkRobots(baseUrl, candidatePaths = ['/']) {
  const origin = new URL(baseUrl).origin;
  const robotsUrl = `${origin}/robots.txt`;
  const findings = [];
  let robotsTxtContent = null;
  let fetched = false;

  try {
    const { statusCode, body } = await request(robotsUrl, {
      method: 'GET',
      maxRedirections: 3,
      headersTimeout: 10_000,
    });
    if (statusCode >= 200 && statusCode < 300) {
      robotsTxtContent = await body.text();
      fetched = true;
    } else {
      // No robots.txt or inaccessible — not itself a defect, treat as "allow all".
      robotsTxtContent = '';
      fetched = false;
    }
  } catch (err) {
    robotsTxtContent = '';
    fetched = false;
  }

  const robots = robotsParser(robotsUrl, robotsTxtContent || '');
  const disallowedPrimaryPaths = [];

  for (const path of candidatePaths) {
    const testUrl = `${origin}${path}`;
    // isAllowed defaults to true if no directive matches — correct "allow all" fallback.
    const allowed = robots.isAllowed(testUrl, '*') !== false;
    if (!allowed) {
      disallowedPrimaryPaths.push(path);
    }
  }

  if (disallowedPrimaryPaths.length > 0) {
    findings.push({
      title: 'robots.txt disallows crawling of primary content paths',
      category: 'off-site-discoverability',
      severity: 'critical',
      evidence: `robots.txt at ${robotsUrl} disallows general crawlers from: ${disallowedPrimaryPaths.join(', ')}.`,
      suggested_action: {
        summary: 'Remove Disallow rules blocking primary content paths for general/AI crawlers.',
        detail: `The following paths are currently blocked and cannot be indexed or cited by AI assistants that respect robots.txt: ${disallowedPrimaryPaths.join(', ')}. If these are meant to be public-facing, update robots.txt to allow them for at least a general user-agent group.`,
        priority: 'critical',
      },
      sourceCheck: 'robots',
    });
  }

  return { robotsUrl, fetched, disallowedPrimaryPaths, robotsTxtContent, findings };
}
