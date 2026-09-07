import { NextResponse } from 'next/server';
import { getReport } from '../../../../../lib/storage.js';
import { Parser } from 'json2csv';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const format = req.nextUrl.searchParams.get('format') || 'json';
    const report = getReport(id);
    
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    if (format === 'csv') {
      const fields = ['id', 'title', 'category', 'severity', 'evidence', 'suggested_action.summary', 'suggested_action.detail', 'suggested_action.priority'];
      const parser = new Parser({ fields });
      const csv = parser.parse(report.findings || []);
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${id.replace('.json', '.csv')}"`
        }
      });
    }

    // Default JSON
    return new NextResponse(JSON.stringify(report, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${id}"`
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 });
  }
}
