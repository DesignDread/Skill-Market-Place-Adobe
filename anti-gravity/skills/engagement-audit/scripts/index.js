import { runEngagementHeuristics } from './engagementHeuristics.js';

/**
 * @param {{ pages: {url: string, html: string}[] }} input
 */
export async function runEngagementAudit({ pages }) {
  if (!pages || pages.length === 0) {
    return { findings: [] };
  }
  return runEngagementHeuristics(pages);
}
