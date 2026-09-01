const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

/**
 * Very simple similarity check: two findings are considered duplicates if
 * they share the same sourceCheck and their titles overlap substantially
 * (normalized word-set Jaccard similarity above a threshold). This is a
 * cheap heuristic, not semantic dedup — good enough for the narrow case
 * of two detectors independently noticing the same surface symptom.
 */
function titleSimilarity(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

function isDuplicate(a, b) {
  if (a.sourceCheck !== b.sourceCheck) return false;
  return titleSimilarity(a.title, b.title) > 0.5;
}

/**
 * Merges finding arrays from multiple detector skills, deduplicating
 * near-identical findings and keeping the one with more specific evidence
 * (longer evidence string, as a simple proxy for specificity).
 *
 * @param {object[][]} findingArrays
 * @returns {object[]} deduplicated, unordered findings (raw, no IDs yet)
 */
export function mergeFindings(findingArrays) {
  const all = findingArrays.flat();
  const kept = [];

  for (const finding of all) {
    const dupIndex = kept.findIndex((k) => isDuplicate(k, finding));
    if (dupIndex === -1) {
      kept.push(finding);
    } else if (finding.evidence.length > kept[dupIndex].evidence.length) {
      kept[dupIndex] = finding; // keep the more specific one
    }
  }
  return kept;
}

/**
 * Splits merged findings into confirmed findings vs. opportunities, then
 * sorts each by severity rank (findings) or leaves opportunities in
 * detector-run order, and assigns sequential IDs.
 */
export function splitAndAssignIds(mergedFindings) {
  const findings = mergedFindings.filter((f) => !f.isOpportunity);
  const opportunityRaw = mergedFindings.filter((f) => f.isOpportunity);

  findings.sort((a, b) => (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9));

  const findingsWithIds = findings.map((f, i) => ({
    id: `F-${String(i + 1).padStart(3, '0')}`,
    title: f.title,
    category: f.category,
    severity: f.severity,
    evidence: f.evidence,
    suggested_action: f.suggested_action,
  }));

  const opportunitiesWithIds = opportunityRaw.map((f, i) => ({
    id: `O-${String(i + 1).padStart(3, '0')}`,
    title: f.title,
    rationale: f.evidence,
    suggested_action: f.suggested_action,
  }));

  return { findings: findingsWithIds, opportunities: opportunitiesWithIds };
}
