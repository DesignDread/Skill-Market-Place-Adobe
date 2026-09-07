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
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">Run New Audit</h2>
        <AuditForm onAuditComplete={handleAuditComplete} />
      </div>

      {currentReport && (
        <div className="space-y-8 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold text-slate-100 mb-6">Audit Results: {currentReport.site}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="col-span-1 border-r border-slate-700 pr-8">
                <SeverityChart summary={currentReport.summary} />
              </div>
              <div className="col-span-2">
                <div className="flex justify-between items-end mb-4">
                  <h4 className="font-medium text-slate-200 text-lg">Key Findings</h4>
                  <a href={`/reports/${currentReport.id}`} className="text-blue-400 hover:text-blue-300 text-sm">View Full Report &rarr;</a>
                </div>
                <FindingsTable items={currentReport.findings?.slice(0, 5) || []} mode="findings" />
                {currentReport.findings?.length > 5 && (
                  <div className="text-center mt-4">
                    <span className="text-slate-400 text-sm">+{currentReport.findings.length - 5} more findings</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pt-8 border-t border-slate-800">
        <h3 className="text-lg font-medium text-slate-200 mb-4">Recent Audits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentReports.map(report => (
            <ReportCard key={report.id} report={report} />
          ))}
          {recentReports.length === 0 && <div className="col-span-3 text-slate-400">No recent audits found.</div>}
        </div>
      </div>
    </div>
  );
}
