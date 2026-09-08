# Brand AI-Readiness Audit

A read-only Agent Skill Marketplace for auditing a website's AI discoverability and on-site engagement.

## Skills

- `audit-orchestrator`: the single entrypoint that composes all audit results into one report.
- `crawl-render-audit`: checks robots access, HTTP/redirect health, raw versus rendered content, structured data, canonical metadata, `llms.txt`, and fact extractability.
- `freshness-corroboration`: checks dated claims, independent corroboration, and entity disambiguation signals.
- `engagement-audit`: checks value proposition clarity, calls to action, click depth, broken links, mobile viewport support, and trust signals.

## Usage

Invoke the `audit-orchestrator` skill with a public website URL. It returns a JSON report containing the site, audit timestamp, severity counts, evidence-backed findings, and prioritized suggested actions.

The marketplace is recommend-only. It does not authenticate to, modify, or deploy changes to audited websites. It respects robots directives and should be run with a bounded page limit so typical audits remain within the contest runtime budget.

## Output

Every finding includes an ID, title, severity, evidence, and a suggested action. Proactive recommendations are returned separately as opportunities where supported by the detectors.

## Packaging

Submit this directory as the marketplace root. It contains `marketplace.json`, this README, and the four independently formatted Agent Skills under `skills/`.
