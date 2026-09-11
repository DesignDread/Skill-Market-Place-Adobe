import { NextResponse } from 'next/server';
import { saveReport } from '../../../lib/storage.js';
import { executeAudit } from '../../../lib/auditRunner.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  let target = null;

  try {
    const { url, maxPages } = await req.json();
    const rawUrl = String(url || '').trim();
    const normalizedUrl = rawUrl && /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    try {
      target = new URL(normalizedUrl);
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

    if (error?.code === 'ENOTFOUND' || error?.cause?.code === 'ENOTFOUND') {
      return NextResponse.json({
        error: `We couldn’t reach ${target?.hostname || 'that domain'}. Check the website address and try again.`,
      }, { status: 502 });
    }

    if (error?.code === 'ECONNREFUSED' || error?.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json({
        error: `The server at ${target?.hostname || 'that domain'} refused the connection. Try again later.`,
      }, { status: 502 });
    }

    if (error?.code === 'ETIMEDOUT' || error?.cause?.code === 'ETIMEDOUT') {
      return NextResponse.json({
        error: `The connection to ${target?.hostname || 'that domain'} timed out. Check the address and try again.`,
      }, { status: 504 });
    }

    return NextResponse.json({ error: 'We couldn’t complete the audit. Please check the URL and try again.' }, { status: 500 });
  }
}
