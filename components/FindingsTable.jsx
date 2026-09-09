'use client';
import React, { useState } from 'react';

const severityColors = {
  critical: 'bg-severity-critical/20 text-severity-critical border-severity-critical/30',
  high: 'bg-severity-high/20 text-severity-high border-severity-high/30',
  medium: 'bg-severity-medium/20 text-severity-medium border-severity-medium/30',
  low: 'bg-severity-low/20 text-severity-low border-severity-low/30',
};

export default function FindingsTable({ items, mode = 'findings' }) {
  const [expanded, setExpanded] = useState(null);

  if (!items || items.length === 0) return <div className="text-muted-foreground p-4">No {mode} recorded.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-sm">
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
                className="border-b border-border/50 hover:bg-secondary/50 cursor-pointer transition"
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              >
                <td className="p-3 text-muted-foreground text-sm whitespace-nowrap">{item.id}</td>
                <td className="p-3 font-medium text-foreground">{item.title}</td>
                {mode === 'findings' && (
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs rounded border ${severityColors[item.severity] || 'bg-secondary'}`}>
                      {item.severity}
                    </span>
                  </td>
                )}
                {mode === 'findings' && <td className="p-3 text-sm text-muted-foreground">{item.category}</td>}
                <td className="p-3 text-sm">
                  <span className={`px-2 py-1 text-xs rounded border ${severityColors[item.suggested_action?.priority || item.severity || 'low'] || 'bg-secondary'}`}>
                    {item.suggested_action?.priority || '-'}
                  </span>
                </td>
              </tr>
              {expanded === item.id && (
                <tr className="bg-secondary/30">
                  <td colSpan={mode === 'findings' ? 5 : 3} className="p-4 border-b border-border/50">
                    <div className="space-y-4">
                      {mode === 'findings' ? (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Evidence</h4>
                          <div className="bg-background/60 p-3 rounded border border-border text-sm text-foreground">
                            {item.evidence}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Rationale</h4>
                          <div className="bg-background/60 p-3 rounded border border-border text-sm text-foreground">
                            {item.rationale}
                          </div>
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Suggested Action</h4>
                        <div className="bg-primary/5 border border-primary/20 p-3 rounded">
                          <p className="font-medium text-primary text-sm mb-1">{item.suggested_action?.summary}</p>
                          {item.suggested_action?.detail && (
                            <p className="text-sm text-muted-foreground">{item.suggested_action.detail}</p>
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
