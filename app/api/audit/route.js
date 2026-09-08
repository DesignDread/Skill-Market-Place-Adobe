import { NextResponse } from 'next/server';
import { saveReport } from '../../../lib/storage.js';

/**
 * Runs the audit by spawning `run-audit.js` as a Node.js child process.
 * This is intentionally outside Next.js module resolution so Turbopack
 * never tries to bundle the orchestrator or its Node.js-only dependencies.
 */
async function runAuditProcess(url, maxPages) {
  const { spawn } = await import('node:child_process');
  const path = await import('node:path');

  // Vercel runs the server bundle from the project root. Using process.cwd()
  // avoids resolving above the deployment filesystem (for example /var).
  const root = process.cwd();
  const cliPath = path.default.resolve(root, 'run-audit.js');
  const apiKey = process.env.GEMINI_API_KEY;

  const args = [cliPath, url, '--maxPages', String(maxPages || 15)];
  if (apiKey) args.push('--apiKey', apiKey);

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Audit failed (exit ${code}): ${stderr.slice(-800)}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error(`Could not parse audit output: ${e.message}\nstdout: ${stdout.slice(0, 300)}`));
      }
    });

    child.on('error', reject);
  });
}

export async function POST(req) {
  try {
    const { url, maxPages } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const report = await runAuditProcess(url, maxPages);
    const saved = saveReport(report);
    return NextResponse.json(saved);
  } catch (error) {
    console.error('Audit API error:', error);
    return NextResponse.json({ error: error.message || 'Audit failed' }, { status: 500 });
  }
}
