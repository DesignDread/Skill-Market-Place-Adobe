'use client';
import { useState } from 'react';

export default function AuditForm({ onAuditComplete }) {
  const [url, setUrl] = useState('');
  const [maxPages, setMaxPages] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, maxPages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');
      
      onAuditComplete(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Target URL</label>
        <input 
          type="url" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          required
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Max Pages to Audit: {maxPages}</label>
        <input 
          type="range" 
          min="1" max="100" 
          value={maxPages} 
          onChange={(e) => setMaxPages(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </div>
      {error && <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded">{error}</div>}
      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-2 rounded-lg transition flex justify-center items-center"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Running Audit...
          </span>
        ) : 'Run Audit'}
      </button>
    </form>
  );
}
