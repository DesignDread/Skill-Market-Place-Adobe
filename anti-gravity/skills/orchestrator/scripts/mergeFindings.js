/**
 * Merge and deduplicate findings from all three audit skills, then split
 * into schema-compliant findings vs. opportunities with sequential IDs.
 */

const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

/**
 * Compute Jaccard similarity on word sets of two strings.
 */
function jaccardWords(a, b) {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (setA.size === 0 && setB.size === 0) return 1;
  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Merge an array of finding arrays (one per skill) into a single
 * deduplicated list.  Near-identical findings (same sourceCheck +
 * Jaccard word overlap > 0.6 on title) are collapsed, keeping whichever
 * has the longer evidence string.
 *
 * @param {object[][]} findingsArrays - e.g. [reachFindings, trustFindings, engagementFindings]
 * @returns {object[]}
 */
export function mergeFindings(findingsArrays) {
  const flat = findingsArrays.flat();
  const kept = [];

  for (const finding of flat) {
    let isDuplicate = false;
    for (let i = 0; i < kept.length; i++) {
      const existing = kept[i];
      // Same detector check AND highly overlapping title → probable duplicate
      if (
        existing.sourceCheck &&
        finding.sourceCheck &&
        existing.sourceCheck === finding.sourceCheck &&
        jaccardWords(existing.title || '', finding.title || '') > 0.6
      ) {
        isDuplicate = true;
        // Keep the one with longer / more specific evidence
        if ((finding.evidence || '').length > (existing.evidence || '').length) {
          kept[i] = finding;
        }
        break;
      }
    }
    if (!isDuplicate) {
      kept.push(finding);
    }
  }

  return kept;
}

/**
 * Split merged findings into confirmed findings (F-001…) and
 * opportunities (O-001…), sorted by severity, and formatted to
 * match report_schema.json.
 *
 * Internal-only fields (sourceCheck, isOpportunity) are stripped.
 *
 * @param {object[]} findings
 * @returns {{ findings: object[], opportunities: object[] }}
 */
export function splitAndAssignIds(findings) {
  const confirmed = [];
  const opportunities = [];

  for (const f of findings) {
    if (f.isOpportunity) {
      opportunities.push(f);
    } else {
      confirmed.push(f);
    }
  }

  // Sort each group by severity rank (critical first)
  const bySeverity = (a, b) =>
    (SEVERITY_RANK[a.severity] ?? 3) - (SEVERITY_RANK[b.severity] ?? 3);

  confirmed.sort(bySeverity);
  opportunities.sort(bySeverity);

  const formatFinding = (f, idx) => {
    const id = `F-${String(idx + 1).padStart(3, '0')}`;
    const result = {
      id,
      title: f.title,
      category: f.category || 'off-site-discoverability',
      severity: f.severity,
      evidence: f.evidence || '',
      suggested_action: {
        summary: f.suggested_action?.summary || '',
        priority: f.suggested_action?.priority || 'medium',
      },
    };
    if (f.suggested_action?.detail) {
      result.suggested_action.detail = f.suggested_action.detail;
    }
    return result;
  };

  const formatOpportunity = (f, idx) => {
    const id = `O-${String(idx + 1).padStart(3, '0')}`;
    return {
      id,
      title: f.title,
      rationale: f.evidence || f.rationale || '',
      suggested_action: {
        summary: f.suggested_action?.summary || '',
        priority: f.suggested_action?.priority || 'low',
      },
    };
  };

  return {
    findings: confirmed.map(formatFinding),
    opportunities: opportunities.map(formatOpportunity),
  };
}
