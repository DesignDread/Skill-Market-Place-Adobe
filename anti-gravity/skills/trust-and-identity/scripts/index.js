import { checkCorroboration, checkNameCollisionRisk } from './crossSourceSearch.js';
import { checkDisambiguationSignals, checkStaleClaims } from './entityDisambiguation.js';

/**
 * @param {{
 *   brandName: string,
 *   coreClaims?: string[],
 *   homepageHtml: string,
 *   homepageText: string,
 *   searchFn?: (query: string) => Promise<{url: string}[]>,
 *   siteDomain?: string
 * }} input
 */
export async function runTrustAndIdentity({ brandName, coreClaims = [], homepageHtml, homepageText, searchFn, siteDomain }) {
  const findings = [];

  const corroboration = await checkCorroboration(brandName, coreClaims, searchFn, siteDomain);
  findings.push(...corroboration.findings);

  const collisionRisk = await checkNameCollisionRisk(brandName, searchFn);
  findings.push(...collisionRisk.findings);

  const disambiguation = checkDisambiguationSignals(homepageHtml);
  findings.push(...disambiguation.findings);

  const staleness = checkStaleClaims(homepageText || '');
  findings.push(...staleness.findings);

  return { findings };
}
