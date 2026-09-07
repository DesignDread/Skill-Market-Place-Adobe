'use client';
import ScheduleManager from '../../components/ScheduleManager';

export default function Schedule() {
  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-100">Audit Schedules</h2>
        <p className="text-slate-400 mt-2">Manage automated background audits.</p>
      </div>
      <ScheduleManager />
    </div>
  );
}
