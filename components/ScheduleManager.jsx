'use client';
import { useState, useEffect } from 'react';

export default function ScheduleManager() {
  const [schedules, setSchedules] = useState([]);
  const [url, setUrl] = useState('');
  const [cron, setCron] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/schedule');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not load schedules');
      setSchedules(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error('[v0] Failed to load schedules:', err);
      setSchedules([]);
      setError(err instanceof Error ? err.message : 'Could not load schedules');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, cron })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not create schedule');
      setUrl('');
      setCron('');
      setError('');
      await fetchSchedules();
    } catch (err) {
      console.error('[v0] Failed to create schedule:', err);
      setError(err instanceof Error ? err.message : 'Could not create schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/schedule/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete schedule');
      await fetchSchedules();
    } catch (err) {
      console.error('[v0] Failed to delete schedule:', err);
      setError(err instanceof Error ? err.message : 'Could not delete schedule');
    }
  };

  const handleUrlBlur = () => {
    if (url && !/^https?:\/\//i.test(url.trim())) {
      setUrl(`https://${url.trim()}`);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Add New Schedule</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Target URL</label>
            <input type="url" required value={url} onChange={e => setUrl(e.target.value)} onBlur={handleUrlBlur} className="w-full rounded-lg border border-input bg-background/60 px-4 py-2 text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Cron Expression</label>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setCron('0 0 * * *')} className="px-2 py-1 text-xs rounded border border-border/70 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition">Daily (0 0 * * *)</button>
              <button type="button" onClick={() => setCron('0 0 * * 0')} className="px-2 py-1 text-xs rounded border border-border/70 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition">Weekly (0 0 * * 0)</button>
              <button type="button" onClick={() => setCron('0 0 1 * *')} className="px-2 py-1 text-xs rounded border border-border/70 bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition">Monthly (0 0 1 * *)</button>
            </div>
            <input type="text" required value={cron} onChange={e => setCron(e.target.value)} className="w-full rounded-lg border border-input bg-background/60 px-4 py-2 text-foreground font-mono outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="* * * * *" />
          </div>
          <button type="submit" disabled={loading} className="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50">Add Schedule</button>
        </form>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-severity-critical/30 bg-severity-critical/10 px-4 py-3 text-sm text-severity-critical">
          {error}
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Active Schedules</h2>
        <div className="grid gap-4">
          {schedules.map(sch => (
            <div key={sch.id} className="glass-panel p-4 rounded-xl flex justify-between items-center">
              <div>
                <div className="font-medium text-foreground">{sch.url}</div>
                <div className="text-sm font-mono text-primary">{sch.cron}</div>
              </div>
              <button onClick={() => handleDelete(sch.id)} className="text-severity-critical hover:bg-severity-critical/10 p-2 rounded transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          ))}
          {schedules.length === 0 && <div className="text-muted-foreground">No active schedules.</div>}
        </div>
      </div>
    </div>
  );
}
