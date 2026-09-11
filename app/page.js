'use client';
import { useState, useEffect } from 'react';
import AuditForm from '../components/AuditForm';
import SeverityChart from '../components/SeverityChart';
import FindingsTable from '../components/FindingsTable';
import ReportCard from '../components/ReportCard';

export default function Home() {
  const [currentReport, setCurrentReport] = useState(null);
  const [recentReports, setRecentReports] = useState([]);

  useEffect(() => {
    fetchRecent();
  }, []);

  const fetchRecent = async () => {
    const res = await fetch('/api/reports');
    const data = await res.json();
    setRecentReports(data.slice(0, 3));
  };

  const handleAuditComplete = (report) => {
    setCurrentReport(report);
    fetchRecent();
  };

  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* ── Hero Section ── */}
      <header className="animate-shimmer relative overflow-hidden rounded-3xl border border-border/70 bg-card/40 px-8 py-14 backdrop-blur-xl md:px-14 md:py-20">
        {/* Animated glow orbs */}
        <div className="hero-glow-1 absolute -top-20 right-10 h-72 w-72 rounded-full opacity-40 blur-3xl" />
        <div className="hero-glow-2 absolute -bottom-16 -left-10 h-60 w-60 rounded-full opacity-30 blur-3xl" />

        <div className="relative z-10 flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="hero-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
              <span className="size-2 animate-pulse rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
              <span className="font-mono text-xs font-medium uppercase tracking-[.15em] text-primary">
                AI Discoverability Engine
              </span>
            </div>

            {/* Main heading */}
            <h1 className="hero-slide-up text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Make your site{' '}
              <span className="hero-gradient-text bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent">
                visible
              </span>{' '}
              to AI.
            </h1>

            {/* Sub-heading */}
            <p className="hero-slide-up-delay mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Surface the technical &amp; semantic signals that shape how AI systems
              <strong className="text-foreground"> understand</strong>,
              <strong className="text-foreground"> retrieve</strong>, and
              <strong className="text-foreground"> recommend</strong> your content.
            </p>

            {/* Skill highlights */}
            <div className="hero-fade-in-delay mt-8 flex flex-wrap gap-3">
              {[
                'Crawl & Render',
                'Structured Data',
                'Corroboration',
                'Engagement',
              ].map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-border/70 bg-secondary/50 px-3 py-1.5 font-mono text-xs text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Ready badge */}
          <div className="hero-fade-in-delay shrink-0 rounded-2xl border border-border/70 bg-secondary/45 px-5 py-4 text-right backdrop-blur-sm">
            <p className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">
              Scan engine
            </p>
            <p className="mt-1.5 text-base font-semibold text-primary">Ready to analyze</p>
          </div>
        </div>
      </header>

      {/* ── Audit Form ── */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Run a new audit</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Map your site&apos;s AI-readiness in minutes.
            </p>
          </div>
          <span className="font-mono text-xs text-muted-foreground">01 / INPUT</span>
        </div>
        <AuditForm onAuditComplete={handleAuditComplete} />
      </section>

      {/* ── Current Report ── */}
      {currentReport && (
        <section className="glass-panel rounded-3xl p-5 md:p-7">
          <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-[.16em] text-primary">
                Latest signal report
              </p>
              <h3 className="mt-2 text-2xl font-bold">{currentReport.site}</h3>
            </div>
            <a
              href={`/reports/${currentReport.id}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              View full report →
            </a>
          </div>
          <div className="grid gap-8 md:grid-cols-[220px_1fr]">
            <div>
              <SeverityChart summary={currentReport.summary} />
            </div>
            <div>
              <h4 className="mb-4 text-lg font-semibold">Key findings</h4>
              <FindingsTable
                items={currentReport.findings?.slice(0, 5) || []}
                mode="findings"
              />
              {currentReport.findings?.length > 5 && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  +{currentReport.findings.length - 5} more findings
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Recent Audits ── */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Recent audits</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Your latest intelligence snapshots.
            </p>
          </div>
          <span className="font-mono text-xs text-muted-foreground">02 / HISTORY</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {recentReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
          {recentReports.length === 0 && (
            <div className="glass-panel rounded-2xl p-6 text-sm text-muted-foreground">
              No recent audits yet. Your first scan will appear here.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
