'use client';
import { useState, useEffect } from 'react';
import AuditForm from '../components/AuditForm';
import SeverityChart from '../components/SeverityChart';
import FindingsTable from '../components/FindingsTable';
import ReportCard from '../components/ReportCard';

export default function Home() {
  const [currentReport, setCurrentReport] = useState(null); const [recentReports, setRecentReports] = useState([]);
  useEffect(() => { fetchRecent(); }, []);
  const fetchRecent = async () => { const res = await fetch('/api/reports'); const data = await res.json(); setRecentReports(data.slice(0, 3)); };
  const handleAuditComplete = (report) => { setCurrentReport(report); fetchRecent(); };
  return <div className="flex flex-col gap-10 pb-12">
    <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-3 font-mono text-xs uppercase tracking-[.22em] text-primary">AI discoverability / workspace</p><h2 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">Make your site legible to the intelligence layer.</h2><p className="mt-4 max-w-2xl text-pretty leading-7 text-muted-foreground">Surface the technical and semantic signals that shape how AI systems understand, retrieve, and recommend your content.</p></div><div className="rounded-2xl border border-border/70 bg-secondary/45 px-4 py-3 text-right"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Scan engine</p><p className="mt-1 text-sm font-medium text-primary">Ready to analyze</p></div></header>
    <section><div className="mb-4 flex items-center justify-between"><div><h3 className="text-xl font-semibold">Run a new audit</h3><p className="mt-1 text-sm text-muted-foreground">Map your site&apos;s AI-readiness in minutes.</p></div><span className="font-mono text-xs text-muted-foreground">01 / INPUT</span></div><AuditForm onAuditComplete={handleAuditComplete} /></section>
    {currentReport && <section className="glass-panel rounded-3xl p-5 md:p-7"><div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="font-mono text-xs uppercase tracking-[.16em] text-primary">Latest signal report</p><h3 className="mt-2 text-2xl font-semibold">{currentReport.site}</h3></div><a href={`/reports/${currentReport.id}`} className="text-sm font-medium text-primary hover:underline">View full report →</a></div><div className="grid gap-8 md:grid-cols-[220px_1fr]"><div><SeverityChart summary={currentReport.summary} /></div><div><h4 className="mb-4 text-lg font-medium">Key findings</h4><FindingsTable items={currentReport.findings?.slice(0, 5) || []} mode="findings" />{currentReport.findings?.length > 5 && <p className="mt-4 text-center text-sm text-muted-foreground">+{currentReport.findings.length - 5} more findings</p>}</div></div></section>}
    <section><div className="mb-4 flex items-end justify-between"><div><h3 className="text-xl font-semibold">Recent audits</h3><p className="mt-1 text-sm text-muted-foreground">Your latest intelligence snapshots.</p></div><span className="font-mono text-xs text-muted-foreground">02 / HISTORY</span></div><div className="grid gap-4 md:grid-cols-3">{recentReports.map((report) => <ReportCard key={report.id} report={report} />)}{recentReports.length === 0 && <div className="glass-panel rounded-2xl p-6 text-sm text-muted-foreground">No recent audits yet. Your first scan will appear here.</div>}</div></section>
  </div>;
}
