'use client';
import { useState } from 'react';

export default function AuditForm({ onAuditComplete }) {
  const [url, setUrl] = useState('');
  const [maxPages, setMaxPages] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, maxPages }) });
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

  return <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-5 md:p-7">
    <div className="flex flex-col gap-6">
      <div><label htmlFor="target-url" className="mb-2 block font-mono text-xs uppercase tracking-[.16em] text-muted-foreground">Target URL</label><input id="target-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} onBlur={handleBlur} placeholder="your-product.com" required className="w-full rounded-xl border border-input bg-background/60 px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
      <div><div className="mb-2 flex items-center justify-between"><label htmlFor="max-pages" className="font-mono text-xs uppercase tracking-[.16em] text-muted-foreground">Crawl depth</label><span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-xs text-primary">{maxPages} pages</span></div><input id="max-pages" type="range" min="1" max="100" value={maxPages} onChange={(e) => setMaxPages(Number(e.target.value))} className="w-full accent-primary" /></div>
      {error && <div role="alert" className="rounded-xl border border-severity-critical/30 bg-severity-critical/10 p-3 text-sm text-severity-critical">{error}</div>}
      <button type="submit" disabled={loading} className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{loading ? 'Running intelligence scan…' : 'Start audit  →'}</button>
    </div>
  </form>;
}
