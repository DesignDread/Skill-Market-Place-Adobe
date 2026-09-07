'use client';
import { useState, useEffect } from 'react';
import ReportCard from '../../components/ReportCard';

export default function History() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports')
      .then(res => res.json())
      .then(data => {
        setReports(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <h2 className="text-3xl font-bold text-slate-100 mb-6">Audit History</h2>
      {loading ? (
        <div className="text-slate-400">Loading history...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map(report => (
            <ReportCard key={report.id} report={report} />
          ))}
          {reports.length === 0 && <div className="col-span-full text-slate-400 bg-slate-800/50 border border-slate-700 p-8 rounded-xl text-center">No audits found. Run one to get started.</div>}
        </div>
      )}
    </div>
  );
}
