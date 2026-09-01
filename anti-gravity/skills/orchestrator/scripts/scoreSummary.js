// Rough, documented effort tag per detector check. Used only to break ties
// within the same severity so a quick fix outranks a slow one at equal
// severity — this does NOT override severity itself.
const EFFORT_BY_CHECK = {
  robots: 'low',
  'render-diff': 'high',
  'render-diff-fallback': 'high',
  'structured-data': 'medium',
  meta: 'low',
  canonical: 'low',
  'llms-txt': 'low',
  'corroboration': 'high',
  'entity-disambiguation': 'medium',
  freshness: 'medium',
  'degraded-mode': 'low',
  'value-prop': 'medium',
  cta: 'low',
  viewport: 'low',
  'trust-signals': 'low',
  'broken-links': 'medium',
};

const EFFORT_RANK = { low: 0, medium: 1, high: 2 };
const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

/**
 * Computes a priority for a finding as a function of severity and effort.
 * A critical+low-effort item ranks strictly ahead of a critical+high-effort
 * item, even though both keep severity: "critical" in the report — priority
 * is a distinct, secondary field that helps a reader pick what to do first.
 */
export function computePriority(finding) {
  const effort = EFFORT_BY_CHECK[finding.sourceCheck] || 'medium';
  const severityRank = SEVERITY_RANK[finding.severity] ?? 2;
  const effortRank = EFFORT_RANK[effort] ?? 1;
  // Combined score: severity dominates, effort breaks ties within it.
  const score = severityRank * 3 + effortRank;

  if (score <= 1) return 'critical';
  if (score <= 3) return 'high';
  if (score <= 6) return 'medium';
  return 'low';
}

export function applyComputedPriority(findings) {
  return findings.map((f) => ({
    ...f,
    suggested_action: {
      ...f.suggested_action,
      priority: f.suggested_action?.priority || computePriority(f),
    },
  }));
}

export function computeSummary(findings, site) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) {
    if (counts[f.severity] !== undefined) counts[f.severity] += 1;
  }
  return {
    total_findings: findings.length,
    critical: counts.critical,
    high: counts.high,
    medium: counts.medium,
    low: counts.low,
  };
}
