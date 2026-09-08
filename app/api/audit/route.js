import { NextResponse } from 'next/server';
import { saveReport } from '../../../lib/storage.js';
import { executeAudit } from '../../../lib/auditRunner.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { url, maxPages } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const report = await executeAudit(url, maxPages);
    const saved = saveReport(report);
    return NextResponse.json(saved);
  } catch (error) {
    console.error('Audit API error:', error);
    return NextResponse.json({ error: error.message || 'Audit failed' }, { status: 500 });
  }
}
