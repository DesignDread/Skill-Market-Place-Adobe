import { NextResponse } from 'next/server';
import { removeSchedule } from '../../../../lib/scheduler.js';

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    removeSchedule(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
