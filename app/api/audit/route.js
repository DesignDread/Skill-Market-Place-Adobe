import { NextResponse } from 'next/server';
import { saveReport } from '../../../lib/storage.js';
import { executeAudit } from '../../../lib/auditRunner.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { url, maxPages } = await req.json();
    let target;
    try {
      target = new URL(String(url || '').trim());
    } catch {
      return NextResponse.json({ error: 'Enter a complete URL, such as https://chatgpt.com/' }, { status: 400 });
    }
    if (!['http:', 'https:'].includes(target.protocol)) {
      return NextResponse.json({ error: 'Only HTTP and HTTPS URLs are supported' }, { status: 400 });
    }

    const report = await executeAudit(target.toString(), maxPages);
    try {
      return NextResponse.json(saveReport(report));
    } catch (storageError) {
      console.error('Audit completed but report could not be persisted:', storageError);
      return NextResponse.json({ ...report, persisted: false });
    }
  } catch (error) {
    console.error('Audit API error:', error);
    return NextResponse.json({ error: error.message || 'Audit failed' }, { status: 500 });
  }
}
