import { NextResponse } from 'next/server';
import { listReports } from '../../../lib/storage.js';

export async function GET() {
  try {
    const reports = listReports();
    return NextResponse.json(Array.isArray(reports) ? reports : []);
  } catch (error) {
    console.error('[v0] Failed to list reports:', error);
    return NextResponse.json([], { status: 200 });
  }
}
