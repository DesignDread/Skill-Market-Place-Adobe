// Convenience CLI runner — not part of the graded marketplace itself, just
// a local dev/test harness so you can run an audit without writing a script
// by hand.
//
// Usage:
//   node run-audit.js https://example.com
//   node run-audit.js https://example.com --maxPages 5
//
// This imports the orchestrator directly. Make sure you've run `npm install`
// in all four skills/* folders first (see README.md "Setup").

import { runAudit } from './skills/orchestrator/scripts/index.js';

const args = process.argv.slice(2);
const url = args[0];

if (!url) {
  console.error('Usage: node run-audit.js <url> [--maxPages N]');
  process.exit(1);
}

const maxPagesFlagIndex = args.indexOf('--maxPages');
const maxPages = maxPagesFlagIndex !== -1 ? parseInt(args[maxPagesFlagIndex + 1], 10) : 15;

console.error(`Auditing ${url} (maxPages=${maxPages})...`);
console.error('This can take 30s-3min depending on the site and whether headless rendering is available.\n');

try {
  const report = await runAudit({ url, maxPages });
  console.log(JSON.stringify(report, null, 2));
} catch (err) {
  console.error('Audit failed:', err);
  process.exit(1);
}
