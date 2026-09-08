'use client';
import Link from 'next/link';

export default function ReportCard({ report }) {
  const date = new Date(report.audited_at).toLocaleDateString();
  const time = new Date(report.audited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sum = report.summary || {};
  return <Link href={`/reports/${report.id}`} className="glass-panel group block rounded-2xl p-5 transition hover:-translate-y-1 hover:border-primary/50">
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><h3 className="truncate text-lg font-semibold transition group-hover:text-primary">{report.site}</h3><p className="mt-1 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">{date} · {time}</p></div><div className="text-2xl font-semibold text-primary">{sum.total_findings || 0}</div></div>
    <div className="mt-5 flex flex-wrap gap-2 text-xs">{sum.critical > 0 && <span className="rounded-full border border-severity-critical/30 bg-severity-critical/10 px-2.5 py-1 text-severity-critical">{sum.critical} critical</span>}{sum.high > 0 && <span className="rounded-full border border-severity-high/30 bg-severity-high/10 px-2.5 py-1 text-severity-high">{sum.high} high</span>}{sum.medium > 0 && <span className="rounded-full border border-severity-medium/30 bg-severity-medium/10 px-2.5 py-1 text-severity-medium">{sum.medium} medium</span>}{sum.low > 0 && <span className="rounded-full border border-severity-low/30 bg-severity-low/10 px-2.5 py-1 text-severity-low">{sum.low} low</span>}{Object.keys(sum).length === 0 && <span className="text-muted-foreground">No findings</span>}</div>
  </Link>;
}
