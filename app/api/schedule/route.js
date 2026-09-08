import { NextResponse } from 'next/server';
import { getSchedules } from '../../../lib/storage.js';
import { addSchedule } from '../../../lib/scheduler.js';

export async function GET() {
  try {
    const schedules = getSchedules();
    return NextResponse.json(Array.isArray(schedules) ? schedules : []);
  } catch (error) {
    console.error('[v0] Failed to get schedules:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req) {
  try {
    const { url, cron: cronExp, maxPages } = await req.json();
    if (!url || !cronExp) return NextResponse.json({ error: 'URL and cron are required' }, { status: 400 });
    
    const newSchedule = addSchedule({ url, cronExp, maxPages });
    return NextResponse.json(newSchedule);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to create schedule' }, { status: 500 });
  }
}
