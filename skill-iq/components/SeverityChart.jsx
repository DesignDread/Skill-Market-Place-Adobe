'use client';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SeverityChart({ summary }) {
  if (!summary) return null;

  const data = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: [summary.critical || 0, summary.high || 0, summary.medium || 0, summary.low || 0],
        backgroundColor: [
          '#ef4444',
          '#f97316',
          '#eab308',
          '#3b82f6',
        ],
        borderColor: '#1e293b',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    plugins: {
      legend: { position: 'bottom', labels: { color: '#f8fafc' } },
    },
    cutout: '70%',
    maintainAspectRatio: false,
  };

  return (
    <div className="h-64 relative">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
        <div className="text-center">
          <div className="text-3xl font-bold">{summary.total_findings || 0}</div>
          <div className="text-xs text-slate-400">Findings</div>
        </div>
      </div>
    </div>
  );
}
