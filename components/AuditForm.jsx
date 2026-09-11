'use client';
import { useState } from 'react';

export default function AuditForm({ onAuditComplete }) {
  const [url, setUrl] = useState('');
  const [maxPages, setMaxPages] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    let finalUrl = url.trim();
    if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
      setUrl(finalUrl);
    }

    try {
      const parsed = new URL(finalUrl);
      if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
        throw new Error('Invalid domain');
      }
    } catch {
      setError("Please enter a valid website URL (e.g., example.com).");
      return;
    }

    setLoading(true); setError('');
    try {
      const res = await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: finalUrl, maxPages }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed. Please try again.');
      onAuditComplete(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audit failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleBlur = () => {
    if (url && !/^https?:\/\//i.test(url.trim())) {
      setUrl(`https://${url.trim()}`);
    }
  };

  return <form onSubmit={handleSubmit} className="audit-form glass-panel group relative overflow-hidden rounded-3xl p-5 md:p-8">
    <div className="audit-form-orb pointer-events-none absolute -right-20 -top-24 size-64 rounded-full opacity-20 blur-3xl" />
    <div className="relative flex flex-col gap-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-primary">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
            Live analysis
          </div>
          <h3 className="text-xl font-bold tracking-tight md:text-2xl">Point us at your site.</h3>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">We&apos;ll inspect the signals AI systems use to understand your brand.</p>
        </div>
        <div className="hidden rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary sm:block">
          <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.64 5.64l2.83 2.83M15.53 15.53l2.83 2.83M18.36 5.64l-2.83 2.83M8.47 15.53l-2.83 2.83"/><circle cx="12" cy="12" r="3"/></svg>
        </div>
      </div>
      <div>
        <label htmlFor="target-url" className="mb-2.5 block font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Target URL</label>
        <div className="audit-input-wrap relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-primary">https://</span>
          <input id="target-url" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" value={url.replace(/^https?:\/\//i, '')} onChange={(e) => setUrl(e.target.value)} onBlur={handleBlur} placeholder="your-product.com" required className="w-full rounded-2xl border border-input bg-background/60 py-4 pl-[4.7rem] pr-4 text-foreground outline-none transition placeholder:text-muted-foreground/50 focus:border-primary focus:bg-primary/[0.04] focus:ring-4 focus:ring-primary/10" />
        </div>
      </div>
      <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3"><div><label htmlFor="max-pages" className="block font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Crawl depth</label><p className="mt-1 text-xs text-muted-foreground">How much of your site should we map?</p></div><span className="rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 font-mono text-xs font-semibold text-primary">{maxPages} <span className="font-normal text-primary/70">pages</span></span></div>
        <input id="max-pages" type="range" min="1" max="100" value={maxPages} onChange={(e) => setMaxPages(Number(e.target.value))} className="audit-range w-full" />
        <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground"><span>Quick pulse</span><span>Deep scan</span></div>
      </div>
      {error && <div role="alert" className="rounded-2xl border border-severity-critical/30 bg-severity-critical/10 p-3.5 text-sm text-severity-critical">{error}</div>}
      <button type="submit" disabled={loading} className="audit-submit relative overflow-hidden rounded-2xl bg-primary px-5 py-4 font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_12px_32px_rgba(88,214,210,.2)] disabled:cursor-wait disabled:opacity-60">{loading ? <span className="inline-flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />Running intelligence scan…</span> : <span className="inline-flex items-center gap-3">Start audit <span className="text-lg transition-transform group-hover:translate-x-1">→</span></span>}</button>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground"><span>Private by default</span><span className="text-border">•</span><span>No code changes</span><span className="text-border">•</span><span>Safe to run</span></div>
    </div>
  </form>;
}
