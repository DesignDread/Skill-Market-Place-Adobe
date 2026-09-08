// Convenience CLI runner — not part of the graded marketplace itself, just
// a local dev/test harness so you can run an audit without writing a script
// by hand.
//
// Usage:
//   node run-audit.js https://example.com
//   node run-audit.js https://example.com --maxPages 5
//   node run-audit.js https://example.com --apiKey YOUR_GEMINI_KEY
//
// This imports the orchestrator directly. Make sure you've run `npm install`
// in all four skills/* folders first (see README.md "Setup").

import { runAudit } from './brand-ai-readiness-audit/skills/audit-orchestrator/scripts/index.js';

const args = process.argv.slice(2);
const url = args[0];

if (!url) {
  console.error('Usage: node run-audit.js <url> [--maxPages N] [--apiKey KEY]');
  process.exit(1);
}

const maxPagesFlagIndex = args.indexOf('--maxPages');
const maxPages = maxPagesFlagIndex !== -1 ? parseInt(args[maxPagesFlagIndex + 1], 10) : 15;

const apiKeyFlagIndex = args.indexOf('--apiKey');
const apiKey = apiKeyFlagIndex !== -1
  ? args[apiKeyFlagIndex + 1]
  : process.env.GEMINI_API_KEY || undefined;

console.error(`Auditing ${url} (maxPages=${maxPages})...`);
if (apiKey) {
  console.error('Gemini API key detected — using AI-powered claim extraction and search grounding.');
} else {
  console.error('No Gemini API key — using regex claim extraction and degraded corroboration mode.');
  console.error('Tip: pass --apiKey YOUR_KEY or set GEMINI_API_KEY env var for full coverage.');
}
console.error('This can take 30s-3min depending on the site and whether headless rendering is available.\n');

try {
  const report = await runAudit({ url, maxPages, apiKey });
  console.log(JSON.stringify(report, null, 2));
} catch (err) {
  console.error('Audit failed:', err);
  process.exit(1);
}
