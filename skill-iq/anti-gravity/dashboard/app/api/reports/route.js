import { NextResponse } from 'next/server';
import { listReports } from '../../../lib/storage.js';

export async function GET() {
  try {
    const reports = listReports();
    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list reports' }, { status: 500 });
  }
}
