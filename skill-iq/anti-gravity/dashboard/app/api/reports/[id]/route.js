import { NextResponse } from 'next/server';
import { getReport } from '../../../../lib/storage.js';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const report = getReport(id);
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get report' }, { status: 500 });
  }
}
