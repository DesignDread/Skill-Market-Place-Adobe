'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SeverityChart from '../../../components/SeverityChart';
import FindingsTable from '../../../components/FindingsTable';
import Link from 'next/link';

export default function ReportDetail() {
  const params = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('findings');

  useEffect(() => {
    if (params.id) {
      fetch(`/api/reports/${params.id}`)
        .then(res => res.json())
        .then(data => {
          setReport(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [params.id]);

  if (loading) return <div className="text-slate-400 flex items-center gap-2"><svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Loading report...</div>;
  if (!report || report.error) return <div className="text-red-400">Report not found.</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <Link href="/history" className="text-slate-400 hover:text-slate-300 text-sm mb-2 inline-block">&larr; Back to History</Link>
          <h2 className="text-3xl font-bold text-slate-100">{report.site}</h2>
          <p className="text-slate-400 mt-1">Audited at {new Date(report.audited_at).toLocaleString()}</p>
        </div>
        <div className="flex gap-3">
          <a href={`/api/reports/${params.id}/export?format=csv`} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-200 transition">Export CSV</a>
          <a href={`/api/reports/${params.id}/export?format=json`} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-200 transition">Export JSON</a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit">
          <h3 className="font-medium text-slate-200 mb-4 text-center">Severity Summary</h3>
          <SeverityChart summary={report.summary} />
        </div>
        <div className="md:col-span-3 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="flex border-b border-slate-700">
            <button 
              className={`px-6 py-4 font-medium text-sm transition ${tab === 'findings' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
              onClick={() => setTab('findings')}
            >
              Findings ({report.findings?.length || 0})
            </button>
            <button 
              className={`px-6 py-4 font-medium text-sm transition ${tab === 'opportunities' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
              onClick={() => setTab('opportunities')}
            >
              Opportunities ({report.opportunities?.length || 0})
            </button>
          </div>
          <div className="p-0">
            {tab === 'findings' ? (
              <FindingsTable items={report.findings} mode="findings" />
            ) : (
              <FindingsTable items={report.opportunities} mode="opportunities" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
