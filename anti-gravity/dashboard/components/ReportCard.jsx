'use client';
import Link from 'next/link';

export default function ReportCard({ report }) {
  const date = new Date(report.audited_at).toLocaleDateString();
  const time = new Date(report.audited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sum = report.summary || {};

  return (
    <Link href={`/reports/${report.id}`} className="block bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-xl p-5 transition group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-slate-100 group-hover:text-blue-400 transition">{report.site}</h3>
          <p className="text-xs text-slate-400">{date} at {time}</p>
        </div>
        <div className="text-2xl font-bold text-slate-300">{sum.total_findings || 0}</div>
      </div>
      <div className="flex gap-2 text-xs">
        {sum.critical > 0 && <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded">{sum.critical} Critical</span>}
        {sum.high > 0 && <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-1 rounded">{sum.high} High</span>}
        {sum.medium > 0 && <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-1 rounded">{sum.medium} Medium</span>}
        {sum.low > 0 && <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded">{sum.low} Low</span>}
        {Object.keys(sum).length === 0 && <span className="text-slate-500">No findings</span>}
      </div>
    </Link>
  );
}
