// Root-safe audit entrypoint for the nested skill-iq app.
// Keeps repository-level audit commands working while the implementation lives
// under skill-iq/.

(async () => {
  const { runAudit } = await import('./skill-iq/anti-gravity/skills/orchestrator/scripts/index.js');
  const args = process.argv.slice(2);
  const url = args[0];

  if (!url) {
    console.error('Usage: node run-audit.js <url> [--maxPages N] [--apiKey KEY]');
    process.exitCode = 1;
    return;
  }

  const maxPagesFlagIndex = args.indexOf('--maxPages');
  const maxPages = maxPagesFlagIndex !== -1
    ? parseInt(args[maxPagesFlagIndex + 1], 10)
    : 15;
  const apiKeyFlagIndex = args.indexOf('--apiKey');
  const apiKey = apiKeyFlagIndex !== -1
    ? args[apiKeyFlagIndex + 1]
    : process.env.GEMINI_API_KEY || undefined;

  console.error(`Auditing ${url} (maxPages=${maxPages})...`);

  try {
    const report = await runAudit({ url, maxPages, apiKey });
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('Audit failed:', error);
    process.exitCode = 1;
  }
})();
