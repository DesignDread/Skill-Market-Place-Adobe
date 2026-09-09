'use client';
import { useState, useEffect } from 'react';
import ReportCard from '../../components/ReportCard';

export default function History() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/reports')
      .then(res => {
        if (!res.ok) throw new Error('Could not load audit history');
        return res.json();
      })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Invalid audit history response');
        setReports(data);
      })
      .catch(err => {
        console.error('[v0] Failed to load audit history:', err);
        setReports([]);
        setError(err instanceof Error ? err.message : 'Could not load audit history');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <h2 className="text-3xl font-bold text-foreground mb-6">Audit History</h2>
      {loading ? (
        <div className="text-muted-foreground">Loading history...</div>
      ) : (
        <>
          {error && (
            <div role="alert" className="mb-6 rounded-lg border border-severity-critical/30 bg-severity-critical/10 px-4 py-3 text-sm text-severity-critical">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map(report => (
            <ReportCard key={report.id} report={report} />
          ))}
            {reports.length === 0 && <div className="col-span-full text-muted-foreground glass-panel p-8 rounded-xl text-center">No audits found. Run one to get started.</div>}
          </div>
        </>
      )}
    </div>
  );
}
