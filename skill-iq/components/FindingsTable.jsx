'use client';
import React, { useState } from 'react';

const severityColors = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

export default function FindingsTable({ items, mode = 'findings' }) {
  const [expanded, setExpanded] = useState(null);

  if (!items || items.length === 0) return <div className="text-slate-400 p-4">No {mode} recorded.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-sm">
            <th className="p-3 font-medium">ID</th>
            <th className="p-3 font-medium">Title</th>
            {mode === 'findings' && <th className="p-3 font-medium">Severity</th>}
            {mode === 'findings' && <th className="p-3 font-medium">Category</th>}
            <th className="p-3 font-medium">Priority</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <React.Fragment key={item.id}>
              <tr 
                className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition"
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              >
                <td className="p-3 text-slate-300 text-sm whitespace-nowrap">{item.id}</td>
                <td className="p-3 font-medium">{item.title}</td>
                {mode === 'findings' && (
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs rounded border ${severityColors[item.severity] || 'bg-slate-700'}`}>
                      {item.severity}
                    </span>
                  </td>
                )}
                {mode === 'findings' && <td className="p-3 text-sm text-slate-400">{item.category}</td>}
                <td className="p-3 text-sm">
                  <span className={`px-2 py-1 text-xs rounded border ${severityColors[item.suggested_action?.priority || item.severity || 'low'] || 'bg-slate-700'}`}>
                    {item.suggested_action?.priority || '-'}
                  </span>
                </td>
              </tr>
              {expanded === item.id && (
                <tr className="bg-slate-800/30">
                  <td colSpan={mode === 'findings' ? 5 : 3} className="p-4 border-b border-slate-800">
                    <div className="space-y-4">
                      {mode === 'findings' ? (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Evidence</h4>
                          <div className="bg-slate-900 p-3 rounded border border-slate-700 text-sm text-slate-300">
                            {item.evidence}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Rationale</h4>
                          <div className="bg-slate-900 p-3 rounded border border-slate-700 text-sm text-slate-300">
                            {item.rationale}
                          </div>
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Suggested Action</h4>
                        <div className="bg-blue-900/10 border border-blue-900/30 p-3 rounded">
                          <p className="font-medium text-blue-300 text-sm mb-1">{item.suggested_action?.summary}</p>
                          {item.suggested_action?.detail && (
                            <p className="text-sm text-slate-400">{item.suggested_action.detail}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
