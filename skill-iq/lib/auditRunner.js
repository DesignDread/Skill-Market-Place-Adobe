import { createRequire } from 'node:module';

// Use createRequire to bypass Turbopack's static import analysis entirely.
// This only runs on the server (API route) — never in the browser bundle.
const require = createRequire(import.meta.url);

export async function executeAudit(url, maxPages) {
  const apiKey = process.env.GEMINI_API_KEY || undefined;

  // Lazy-require the orchestrator at call time so Turbopack never statically
  // traces or bundles it. The orchestrator and its sub-skills use plain ESM
  // so we load them via a dynamic import of the CJS-compatible entry.
  // We fall back to a worker-style spawn if direct import keeps failing.
  try {
    // Try loading via node_modules symlink (created by `npm install`)
    const mod = await import('orchestrator/scripts/index.js');
    return await mod.runAudit({ url, maxPages, apiKey });
  } catch (err) {
    // If the symlink approach fails, spawn a child process that runs the
    // CLI audit and captures stdout as JSON.
    return spawnAudit(url, maxPages, apiKey);
  }
}

async function spawnAudit(url, maxPages, apiKey) {
  const { spawn } = await import('node:child_process');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');

  const root = path.default.resolve(
    path.default.dirname(fileURLToPath(import.meta.url)),
    '../'
  );
  const cliPath = path.default.join(root, 'run-audit.js');

  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    if (apiKey) env.GEMINI_API_KEY = apiKey;

    const args = [cliPath, url, '--maxPages', String(maxPages || 15)];
    const child = spawn(process.execPath, args, {
      cwd: root,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Audit process exited ${code}: ${stderr.slice(-500)}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error(`Failed to parse audit output: ${e.message}`));
      }
    });

    child.on('error', reject);
  });
}
